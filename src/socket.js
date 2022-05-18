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

        if(typeof callback !== 'function') {
            throw new Error('Socket.on | invalid `callback` (non function): ' + callback);
        }

        //---]>

        this.__events.on(type, (data, response) => {
            callback(data, response);
        });
    }

    emit(type, data) {
        const isBinary = true;
        this.__socket.send(JSON.stringify([type, data]), isBinary);
    }
}

//--------------------------------------------------

module.exports = Socket;
