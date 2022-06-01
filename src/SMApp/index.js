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

        const smSocket = getSMSocket(ws);

        const action = smSocket.__actions[type];
        const schema = smSocket.__schemas[type];

        if(action) {
            //---]>
            // validate

            if(schema) {
                if(typeof schema === 'string') {
                    if(!validate(schema, data)) {
                        return;
                    }
                }
                else if(Array.isArray(schema)) {
                    if(!Array.isArray(data) || data.length !== schema.length || !data.every((e, i) => validate(schema[i], e))) {
                        return;
                    }
                }
                else {
                    if(!data) {
                        return;
                    }

                    let schemaKeysCount = 0;

                    for(let k in schema) {
                        if(!validate(schema[k], data[k])) {
                            return;
                        }

                        schemaKeysCount++;
                    }

                    if(Object.keys(data).length !== schemaKeysCount) {
                        return;
                    }
                }
            }

            //---]>

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

            return app.publish(topic, d, isBinary);
        },

        //---]>

        onConnection(callback) {
            setCallbackByKey(events, 'connection', (ws) => {
                callback(bindSMSocket(ws));
            });
        },
        onDisconnect(callback) {
            setCallbackByKey(events, 'disconnect', (ws) => {
                callback(unbindSMSocket(bindSMSocket(ws)));
            });
        },
        onDrain(callback) {
            setCallbackByKey(events, 'drain', (ws, bufferedAmount) => {
                callback(bindSMSocket(ws), bufferedAmount);
            });
        }
    };
}

//--------------------------------------------------

function getSMSocket(ws) { return ws.__refWS; }

function bindSMSocket(ws) { return ws.__refWS || (ws.__refWS = SMSocket(ws)); }
function unbindSMSocket(ws) {
    const s = ws.__refWS;
    delete ws.__refWS;
    return s;
}

//---]>

function validate(type, value) {
    if(type === 'any') {
        return true;
    }
    else if(type === 'array') {
        if(!Array.isArray(value)) {
            return false;
        }
    }
    else if(type === 'object') {
        if(Array.isArray(value) || !value) {
            return false;
        }
    }
    else if(typeof value !== type) {
        return false;
    }

    return true;
}

//--------------------------------------------------

module.exports = SMApp;
