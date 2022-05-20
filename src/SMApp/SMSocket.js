const {
    assertBindEvent,
    assertRemoveEvent,
    assertCallEvent
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

        return d.byteLength;
    };

    let actions = Object.create(null);

    //---]>

    return {
        get __actions() { return actions; },
        get __send() { return send; },

        //---]>

        get remoteAddress() { return Buffer.from(socket.getRemoteAddressAsText()).toString(); },

        //---]>

        terminate() {
            socket.close();
        },
        disconnect(code, reason) {
            socket.end(code, reason);
        },

        //---]>

        on(type, callback) {
            assertBindEvent(type, callback);

            actions[type] = callback;
        },
        off(type) {
            assertRemoveEvent(type);

            if(type) {
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
