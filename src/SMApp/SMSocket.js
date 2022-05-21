const {
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
            return false;
        }

        //---]>

        const isBinary = true;
        const d = pack(ack === null ? type : '', ack, data);

        socket.send(d, isBinary);

        return true;
    };

    let actions = Object.create(null);

    //---]>

    return {
        get __actions() { return actions; },
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

            socket.publish(topic, d, isBinary);

            return true;
        },

        //---]>

        on(type, callback) {
            assertBindEvent(type, callback);
            actions[type] = callback;
        },
        off(type) {
            if(arguments.length) {
                assertRemoveEvent(type);
                delete actions[type];
            }
            else {
                actions = Object.create(null);
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
