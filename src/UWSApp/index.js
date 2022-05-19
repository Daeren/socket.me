const uws = require('@daeren/uws');

//---]>

const { onceCall } = require('./../safe');
const { unpack } = require('./../messagePacker');

//---]>

const SendClientLib = require('./sendClientLib');

//--------------------------------------------------

function UWSApp(options) {
    const app = uws.App({});
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

            let type, ack, payload;

            if(d.length === 2) {
                [type, payload] = d;
            }
            else {
                [type, ack, payload] = d;
            }

            //---]>

            const s = ws.__refSMSocket;
            const replyCallback = onceCall((result) => {
                s.__send(type, ack, result);
            }, 'Socket.on | double call `response`: ' + type);

            //---]>

            s.__events.emit(type, payload, replyCallback);
        }
    });
}

function bindClientLibGetReq(app, options) {
    const sendClientLib = SendClientLib(options.packets);

    //---]>

    if(options.clientLibPath) {
        app.get('/' + options.clientLibPath, (response, request) => sendClientLib(request.getHeader('accept-encoding'), response));
    }
}

function bindDefaultGetReq(app) {
    app.get('/*', (res) => res.end(''));
}

//--------------------------------------------------

module.exports = UWSApp;
