const { setCallbackByKey } = require('./../safe');

//---]>

const SMSocket = require('./SMSocket');

//--------------------------------------------------

function SMApp({ app, events }) {
    return {
        listenSocket: null,

        //---]>

        get isListen() { return !!this.listenSocket },

        //---]>

        listen(port, host) {
            return new Promise((resolve) => {
                const done = (v) => {
                    this.listenSocket = v;
                    resolve(!!v);
                };

                //---]>

                if(this.listenSocket) {
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
            const { listenSocket } = this;

            if(listenSocket) {
                app.us_listen_socket_close(listenSocket);
            }

            this.listenSocket = null;
        },

        //---]>

        onConnection(callback) {
            setCallbackByKey(events, 'connection', (ws) => {
                ws = ws.__refSMSocket = new SMSocket(ws);
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
