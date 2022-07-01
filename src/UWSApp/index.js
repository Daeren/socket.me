const uws = require('@daeren/uws');

//---]>

const {
    onceCall
} = require('./../shared/safe');

const SendClientLib = require('./sendClientLib');

//--------------------------------------------------

function UWSApp(options) {
    const optUseSSL = !!options.ssl;
    const optSrv = options.server || {};

    //---]>

    const app = optUseSSL ? uws.SSLApp(optSrv) : uws.App(optSrv);

    const events = {
        // upgrade(_req, _next) { /* NOP */ },
        // connection(_ws) { /* NOP */ },
        // disconnect(_ws) { /* NOP */ },
        // drain(_ws, _bufferedAmount) { /* NOP */ },

        data(_ws, _data) { /* NOP */ } // system
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
    app.ws(options.path, {
        ...options,

        //---]>

        upgrade(res, req, context) {
            const { upgrade } = events;

            /* You MUST copy data out of req here, as req is only valid within this immediate callback */
            const url = req.getUrl();
            const secWebSocketKey = req.getHeader('sec-websocket-key');
            const secWebSocketProtocol = req.getHeader('sec-websocket-protocol');
            const secWebSocketExtensions = req.getHeader('sec-websocket-extensions');

            let aborted = false;

            //---]>

            const next = () => {
                if(aborted) {
                    return;
                }

                /* This immediately calls open handler, you must not use res after this call */
                res.upgrade({ url },
                    secWebSocketKey,
                    secWebSocketProtocol,
                    secWebSocketExtensions,
                    context);
            };

            //---]>

            if(!upgrade) {
                next();
                return;
            }

            //---]>

            /* You MUST register an abort handler to know if the upgrade was aborted by peer */
            res.onAborted(() => {
                res.aborted = aborted = true;
            });

            res.aborted = false;

            //---]>

            upgrade(req, res, onceCall(next, 'onUpgrade | double call: next'));
        },

        open(ws) {
            const { connection } = events;

            if(connection) {
                connection(ws);
            }
        },

        close(ws) {
            const { disconnect } = events;

            ws.isClosed = true;

            if(disconnect) {
                disconnect(ws);
            }
        },

        drain(ws) {
            const { drain } = events;

            if(drain) {
                drain(ws, ws.getBufferedAmount());
            }
        },

        message(ws, data, isBinary) {
            const { rawData } = events;

            if(rawData) {
                const next = onceCall(() => {
                    return events.data(ws, data, isBinary);
                }, 'onRawData | double call `event.next`');

                rawData(ws, data, isBinary, next);
            }
            else {
                events.data(ws, data, isBinary);
            }
        }
    });
}

function bindClientLibGetReq(app, options) {
    if(!options.clientLibPath || !options.useClientLib) {
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
