const {
    silentCallByKey
} = require('./../client/tools');

const {
    setCallbackByKey,

    assertBindEvent,
    assertRemoveEvent,
    assertCallEvent
} = require('./../shared/safe');

const {
    pack,
    unpack
} = require('./../shared/messagePacker');

//--------------------------------------------------

function main(host = 'localhost:3500', ssl = false) {
    const socket = new WebSocket(`ws${ssl ? 's' : ''}://${host}`);

    let actions = Object.create(null);
    const events = {
        connect() { /* NOP */ },
        close(_wasClean, _code, _reason) { /* NOP */ },
        error(_message, _error) { /* NOP */ },
        data(_data) { /* NOP */ }
    };

    const callbacksAck = Object.create(null);

    let lastAck = 0;

    //---]>

    socket.binaryType = 'arraybuffer';

    //---]>

    socket.onopen = function() { events.connect(); };
    socket.onclose = function(event) { events.close(event.wasClean, event.code, event.reason); };
    socket.onerror = function(event) { events.error(event.message, event); };

    socket.onmessage = function({ data }) {
        events.data(data);

        //---]>

        const d = unpack(data);

        //---]>

        if(!d) {
            return;
        }

        if(d instanceof Error) {
            events.error(d.message, d);
            return;
        }

        //---]>

        const [type, ack, payload] = d;

        //---]>

        if(typeof ack === 'number') {
            callbacksAck[ack](payload);
        }
        else {
            silentCallByKey(actions, type, payload);
        }
    };

    //---]>

    return {
        get readyState() { return socket.readyState; },
        get bufferedAmount() { return socket.bufferedAmount; },

        get connected() { return socket.readyState === 1; },

        //---]>

        send(data) {
            try {
                socket.send(data);
            }
            catch(e) {
                events.error(e.message, e);
                return false;
            }

            return true;
        },
        close(code = 1000, reason = '') {
            socket.close(code, reason);
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

        emit(type, data, callback) {
            assertCallEvent(type);

            //---]>

            let ack = null;

            if(callback) {
                ack = lastAck++
                callbacksAck[ack] = (r) => {
                    delete callbacksAck[ack];
                    callback(r);
                };
            }

            //---]>

            const d = pack(type, ack, data);

            if(d instanceof Error) {
                throw d;
            }

            //---]>

            this.send(d)
        },

        //---]>

        onConnect(callback) { setCallbackByKey(events, 'connect', callback); },
        onClose(callback) { setCallbackByKey(events, 'close', callback); },
        onData(callback) { setCallbackByKey(events, 'data', callback); },
        onError(callback) { setCallbackByKey(events, 'error', callback); },
    };
}
