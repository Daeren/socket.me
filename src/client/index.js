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

function mio(host = 'localhost:3500', ssl = false) {
    const socket = new WebSocket(`ws${ssl ? 's' : ''}://${host}`);

    let actions = Object.create(null);
    const events = {
        connect() { /* NOP */ },
        close(_wasClean, _code, _reason) { /* NOP */ },
        error() { /* NOP */ },
        data(_data) { /* NOP */ }
    };

    const callbacksAck = Object.create(null);
    let lastAck = 0;

    let responseTimeout = 0;

    //---]>

    socket.binaryType = 'arraybuffer';

    //---]>

    socket.onopen = function() { events.connect(); };
    socket.onclose = function(event) { events.close(event.wasClean, event.code, event.reason); };

    // If the user agent was required to fail the WebSocket connection,
    // or if the WebSocket connection was closed after being flagged as full,
    // fire an event named error at the WebSocket object.
    socket.onerror = function() { events.error(); };

    socket.onmessage = function({ data }) {
        events.data(data);

        //---]>

        const d = unpack(data);

        //---]>

        if(!d) {
            return;
        }

        if(d instanceof Error) {
            throw d;
        }

        //---]>

        const [type, ack, payload] = d;

        //---]>

        if(typeof ack === 'number') {
            silentCallByKey(callbacksAck, ack, payload);
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

        setResponseTimeout(n) { responseTimeout = n; },

        //---]>

        close(code = 1000, reason = '') {
            socket.close(code, reason);
        },

        //---]>

        on(type, callback) {
            assertBindEvent(type, callback);

            if(actions[type]) {
                throw new Error('This event already exists');
            }

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

        emit(type, data, callback, timeout) {
            assertCallEvent(type);

            //---]>

            if(socket.readyState !== 1) {
                return false;
            }

            //---]>

            let ack = null;

            if(callback) {
                let tm;

                //---]>
                // looking for a free slot

                for(let i = 1; i < 256; ++i) {
                    lastAck = (lastAck + 1) % 256; // protocol: u8 - 256

                    if(!callbacksAck[lastAck]) {
                        ack = lastAck;
                        break;
                    }
                }

                if(ack === null) {
                    throw new Error('Failed to allocate space for the request: ' + type);
                }

                //---]>

                callbacksAck[ack] = (r) => {
                    clearTimeout(tm);
                    delete callbacksAck[ack];

                    callback(r);
                };

                //---]>

                timeout = typeof timeout === 'undefined' ? responseTimeout : timeout;

                if(timeout > 0 && isFinite(timeout)) {
                    tm = setTimeout(callbacksAck[ack], timeout, new Error('Timeout'));
                }
            }

            //---]>

            const d = pack(type, ack, data);

            //---]>

            socket.send(d);

            //---]>

            return true;
        },

        //---]>

        onConnect(callback) { setCallbackByKey(events, 'connect', callback); },
        onClose(callback) { setCallbackByKey(events, 'close', callback); },
        onData(callback) { setCallbackByKey(events, 'data', callback); },
        onError(callback) { setCallbackByKey(events, 'error', callback); },
    };
}

//--------------------------------------------------

module.exports = mio;
