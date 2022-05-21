const uws = require('@daeren/uws');

//---]>

const {
    onceCall,
    setCallbackByKey,
    assertPublishTopic
} = require('./../shared/safe');

const { pack, unpack } = require('./../shared/messagePacker');

//---]>

const SMSocket = require('./SMSocket');

//--------------------------------------------------

function SMApp({ app, events }) {
    let smSocket = null;
    let listenSocket = null;

    //---]>

    setCallbackByKey(events, 'data', (ws, buffer) => {
        const d = unpack(buffer);

        //---]>

        if(!d || d instanceof Error) {
            return;
        }

        //---]>

        const [type, ack, data] = d;
        const action = smSocket.__actions[type];

        if(action) {
            const response = onceCall((result) => {
                return smSocket.__send(type, ack, result);
            }, 'Socket.on | double call `response`: ' + type);

            action(data, response);
        }
    });

    //---]>

    return {
        get bufferedAmount() { return listenSocket?.getBufferedAmount() || 0; },
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
                uws.us_listen_socket_close(listenSocket);
            }

            listenSocket = null;
        },

        //---]>

        publish(topic, type, data) {
            assertPublishTopic(topic, type);

            //---]>

            const isBinary = true;
            const d = pack(type, null, data);

            if(d instanceof Error) {
                throw d;
            }

            app.publish(topic, d, isBinary);

            return d;
        },

        //---]>

        onConnection(callback) {
            setCallbackByKey(events, 'connection', (ws) => {
                smSocket = SMSocket(ws);
                callback(smSocket);
            });
        },
        onDisconnect(callback) {
            setCallbackByKey(events, 'disconnect', (_ws) => {
                callback(smSocket);
            });
        },
        onDrain(callback) {
            setCallbackByKey(events, 'drain', (ws, bufferedAmount) => {
                callback(smSocket, bufferedAmount);
            });
        },
        onError(callback) {
            setCallbackByKey(events, 'error', (e, _ws) => {
                callback(e.message, e, smSocket);
            });
        }
    };
}

//--------------------------------------------------

module.exports = SMApp;
