const EventEmitter = require('events');

//---]>

const { pack } = require('./messagePacker');

//--------------------------------------------------

class Socket {
    __socket = null;
    __events = new EventEmitter();

    //---]>

    constructor(socket) {
        this.__socket = socket;
    }

    //---]>

    __send(type, ack, data) {
        const isBinary = true;
        const d = pack(typeof ack !== 'undefined' ? undefined : type, ack, data);

        if(d instanceof Error) {
            throw d;
        }

        this.__socket.send(d, isBinary);
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
        if(typeof type !== 'string') {
            throw new Error('Socket.emit | invalid `type` (non string): ' + type);
        }

        this.__send(type, undefined, data);
    }
}

//--------------------------------------------------

module.exports = Socket;
