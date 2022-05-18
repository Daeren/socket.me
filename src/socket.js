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
        this.__events.on(type, (data) => {
            callback(data);
        });
    }

    emit(type, data) {
        const isBinary = true;

        //data = [type, data];

        this.__socket.send(data, isBinary);
    }
}

//--------------------------------------------------

module.exports = Socket;
