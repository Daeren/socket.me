const { setCallbackByKey } = require('./../safe');

//---]>

const SMSocket = require('./SMSocket');

//--------------------------------------------------

function SMApp({ app, events }) {
    let listenSocket = null;

    //---]>

    return {
        get listening() { return !!listenSocket },

        //---]>

        listen(port, host) {
            return new Promise((resolve) => {
                const done = (v) => {
                    listenSocket = v;
                    resolve(!!v);
                };

                //---]>

                if(listenSocket) {
                    resolve(false);
                }
                else if(host) {
                    app.listen(host, port, done);
                }
                else {
                    app.listen(port, done);
                }
            });
        },
        shutdown() {
            if(listenSocket) {
                app.us_listen_socket_close(listenSocket);
            }

            listenSocket = null;
        },

        //---]>

        onConnection(callback) {
            setCallbackByKey(events, 'connection', (ws) => {
                ws = ws.__refSMSocket = SMSocket(ws);
                callback(ws);
            });
        },
        onDisconnect(callback) {
            setCallbackByKey(events, 'disconnect', (ws) => {
                callback(ws.__refSMSocket);
            });
        },
        onError(callback) {
            setCallbackByKey(events, 'error', (e, ws) => {
                callback(e.message, e, ws.__refSMSocket);
            });
        }
    };
}

//--------------------------------------------------

module.exports = SMApp;
