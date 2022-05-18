const EventEmitter = require('events');

//--------------------------------------------------

class Socket {
    __socket = null;
    __events = new EventEmitter();

    //---]>

    constructor(socket) {
        this.__socket = socket;
    }

    //---]>

    on(type, callback) {
        if(typeof type !== 'string') {
            throw new Error('Socket.on | invalid `type` (non string): ' + type);
        }

        this.__events.on(type, (data, cbResponse) => {
            callback(data, cbResponse);
        });
    }

    emit(type, data) {
        const isBinary = true;
        this.__socket.send(JSON.stringify([type, data]), isBinary);
    }
}

//--------------------------------------------------

module.exports = Socket;
