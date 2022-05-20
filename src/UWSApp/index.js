const uws = require('@daeren/uws');

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
        drain(_ws, _bufferedAmount) { /* NOP */ },
        error(_error, _ws) { /* NOP */ },

        data(_ws, _data) { /* NOP */ }
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
        drain(ws) { events.drain(ws, ws.getBufferedAmount()); },

        message(ws, data, isBinary) {
            if(isBinary) {
                events.data(ws, data);
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
