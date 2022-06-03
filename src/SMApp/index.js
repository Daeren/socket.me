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

    setCallbackByKey(events, 'data', (ws, buffer, isBinary) => {
        const { resolvedData, rejectedData } = events;

        const d = isBinary ? unpack(buffer) : null;

        //---]>

        if(!d || d instanceof Error) {
            rejectedData(ws, undefined, undefined);
            return;
        }

        //---]>

        const [type, ack, data] = d;

        const smSocket = getSMSocket(ws);

        const action = smSocket.__actions[type];
        const schema = smSocket.__schemas[type];

        const rejected = rejectedData ? () => rejectedData(ws, type, data) : () => {};

        //---]>

        if(!action) {
            rejected();
            return;
        }

        //---]>
        // validate

        if(schema) {
            if(typeof schema === 'function' || typeof schema === 'string') {
                if(!validate(schema, data)) {
                    rejected();
                    return;
                }
            }
            else if(Array.isArray(schema)) {
                if(!Array.isArray(data) || data.length !== schema.length || !data.every((e, i) => validate(schema[i], e))) {
                    rejected();
                    return;
                }
            }
            else {
                if(!data) {
                    rejected();
                    return;
                }

                let schemaKeysCount = 0;

                for(let k in schema) {
                    if(!validate(schema[k], data[k])) {
                        rejected();
                        return;
                    }

                    schemaKeysCount++;
                }

                if(Object.keys(data).length !== schemaKeysCount) {
                    rejected();
                    return;
                }
            }
        }

        //---]>

        const response = onceCall((result) => {
            return smSocket.__send(type, ack, result);
        }, 'Socket.on | double call `response`: ' + type);

        //---]>

        if(resolvedData) {
            const next = onceCall(() => {
                action(data, response);
            }, 'onResolvedData | double call `event.next`: ' + type);

            resolvedData(ws, type, data, next);
        }
        else {
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

        onUpgrade(callback) {
            setCallbackByKey(events, 'upgrade', (req, res, next) => {
                callback(req, res, next);
            });
        },
        onConnection(callback) {
            setCallbackByKey(events, 'connection', (ws) => {
                callback(bindSMSocket(ws));
            });
        },
        onDisconnect(callback) {
            setCallbackByKey(events, 'disconnect', (ws) => {
                bindSMSocket(ws);
                callback(unbindSMSocket(ws));
            });
        },
        onDrain(callback) {
            setCallbackByKey(events, 'drain', (ws, bufferedAmount) => {
                callback(bindSMSocket(ws), bufferedAmount);
            });
        },

        onRawData(callback) {
            setCallbackByKey(events, 'rawData', (ws, data, isBinary, next) => {
                callback(bindSMSocket(ws), data, isBinary, next);
            });
        },
        onResolvedData(callback) {
            setCallbackByKey(events, 'resolvedData', (ws, type, data, next) => {
                callback(bindSMSocket(ws), type, data, next);
            });
        },
        onRejectedData(callback) {
            setCallbackByKey(events, 'rejectedData', (ws, type, data) => {
                callback(bindSMSocket(ws), type, data);
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
    if(type instanceof Function) {
        return type(value);
    }
    else if(type === 'object') {
        if(Array.isArray(value) || !value) {
            return false;
        }
    }
    else if(type === 'array') {
        if(!Array.isArray(value)) {
            return false;
        }
    }
    else if(type === 'any') {
        return true;
    }
    else if(typeof value !== type) {
        return false;
    }

    return true;
}

//--------------------------------------------------

module.exports = SMApp;
