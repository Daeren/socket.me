const {
    assertBindSchema,

    assertBindEvent,
    assertRemoveEvent,
    assertCallEvent,

    assertChangeTopic,
    assertPublishTopic
} = require('./../shared/safe');

const { pack } = require('./../shared/messagePacker');

//--------------------------------------------------

function SMSocket(socket) {
    const send = (type, ack, data) => {
        if(socket.isClosed) {
            return -1;
        }

        //---]>

        const isBinary = true;
        const d = pack(ack === null ? type : '', ack, data);

        return socket.send(d, isBinary)
    };

    let actions = Object.create(null);
    let schemas = Object.create(null); // key: value (object or array)

    //---]>

    return {
        get __actions() { return actions; },
        get __schemas() { return schemas; },
        get __send() { return send; },

        //---]>

        get remoteAddress() { return Buffer.from(socket.getRemoteAddressAsText()).toString(); },
        get connected() { return !socket.isClosed; },

        //---]>

        terminate() {
            if(!socket.isClosed) {
                socket.close();
            }
        },
        disconnect(code, reason) { socket.end(code, reason); },

        //---]>

        subscribe(topic) {
            assertChangeTopic(topic);
            socket.subscribe(topic);
        },
        unsubscribe(topic) {
            assertChangeTopic(topic);

            //---]>

            if(!socket.isClosed) {
                socket.unsubscribe(topic);
            }
        },

        publish(topic, type, data) {
            assertPublishTopic(topic, type);

            //---]>

            if(socket.isClosed) {
                return false;
            }

            //---]>

            const isBinary = true;
            const d = pack(type, null, data);

            return socket.publish(topic, d, isBinary);
        },

        //---]>

        typed(schema) {
            assertBindSchema(schema);

            //---]>

            const wrapper = Object.create(this);

            wrapper.on = (type, callback) => {
                this.on(type, callback);
                schemas[type] = schema;
            };

            //---]>

            return wrapper;
        },

        //---]>

        on(type, callback) {
            assertBindEvent(type, callback);

            if(actions[type]) {
                throw new Error('This event already exists: ' + type);
            }

            actions[type] = callback;
        },
        off(type) {
            if(arguments.length) {
                assertRemoveEvent(type);

                delete actions[type];
                delete schemas[type];
            }
            else {
                actions = Object.create(null);
                schemas = Object.create(null);
            }
        },

        emit(type, data) {
            assertCallEvent(type);
            return send(type, null, data);
        }
    };
}

//--------------------------------------------------

module.exports = SMSocket;
