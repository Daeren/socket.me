const EventEmitter = require('events');

//---]>

const { assertBindEvent, assertCallEvent } = require('./../safe');
const { pack } = require('./../messagePacker');

//--------------------------------------------------

class SMSocket {
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
        assertBindEvent(type, callback);

        this.__events.on(type, (data, response) => {
            callback(data, response);
        });
    }

    emit(type, data) {
        assertCallEvent(type);

        this.__send(type, undefined, data);
    }
}

//--------------------------------------------------

module.exports = SMSocket;
