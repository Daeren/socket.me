const uws = require('@daeren/uws');

//---]>

const { onceCall } = require('./../shared/safe');
const { unpack } = require('./../shared/messagePacker');

//---]>

const SendClientLib = require('./sendClientLib');

//--------------------------------------------------

function UWSApp(options) {
    const optUseSSL = !!options.ssl;
    const optSrv = options.server || {};

    //---]>

    const app = optUseSSL ? uws.SSLApp(optSrv) : uws.App(optSrv);

    const events = {
        connection(_ws) { /* NOP */ },
        disconnect(_ws) { /* NOP */ },
        error(_error, _ws) { /* NOP */ }
    };

    //---]>

    bindWsReq(app, options, events);
    bindClientLibGetReq(app, options);
    bindDefaultGetReq(app);

    //---]>

    return { app, events };
}

//---]>

function bindWsReq(app, options, events) {
    app.ws('/*', {
        ...options,

        //---]>

        open(ws) { events.connection(ws); },
        close(ws) { events.disconnect(ws); },

        message(ws, data) {
            const d = unpack(data);

            //---]>

            if(!d) {
                return;
            }

            if(d instanceof Error) {
                events.error(d, ws);
                return;
            }

            //---]>

            const s = ws.__refSMSocket;
            const [type, ack, payload] = d;

            const action = s.__actions[type];

            if(action) {
                const response = onceCall((result) => {
                    s.__send(type, ack, result);
                }, 'Socket.on | double call `response`: ' + type);

                action(payload, response);
            }
        }
    });
}

function bindClientLibGetReq(app, options) {
    if(!options.clientLibPath) {
        return;
    }

    //---]>

    const sendClientLib = SendClientLib();

    app.get('/' + options.clientLibPath, (response, request) => sendClientLib(request.getHeader('accept-encoding'), response));
}

function bindDefaultGetReq(app) {
    app.get('/*', (res) => res.end(''));
}

//--------------------------------------------------

module.exports = UWSApp;
