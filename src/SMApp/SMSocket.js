const {
    assertBindEvent,
    assertRemoveEvent,
    assertCallEvent,

    assertChangeTopic
} = require('./../shared/safe');

const { pack } = require('./../shared/messagePacker');

//--------------------------------------------------

function SMSocket(socket) {
    const send = (type, ack, data) => {
        const isBinary = true;
        const d = pack(ack === null ? type : '', ack, data);

        if(d instanceof Error) {
            throw d;
        }

        socket.send(d, isBinary);

        return d;
    };

    let actions = Object.create(null);

    //---]>

    return {
        get __actions() { return actions; },
        get __send() { return send; },

        //---]>

        get remoteAddress() { return Buffer.from(socket.getRemoteAddressAsText()).toString(); },

        //---]>

        subscribe(topic) {
            assertChangeTopic(topic);
            socket.subscribe(topic);
        },
        unsubscribe(topic) {
            assertChangeTopic(topic);
            socket.unsubscribe(topic);
        },

        terminate() { socket.close(); },
        disconnect(code, reason) { socket.end(code, reason); },

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
