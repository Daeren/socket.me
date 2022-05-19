
            const global = {};global.tools = {};((module) => { ﻿/**
 *
 * @param {object} table
 * @param {string} key
 * @param {any} payload
 */
function silentCallByKey(table, key, payload) {
    const action = table[key];

    if(action) {
        action(payload);
    }
}

//--------------------------------------------------

module.exports = {
    silentCallByKey
};
 })(global.tools);global.safe = {};((module) => { ﻿/**
 *
 * @param {Function} callback
 * @param {string} errorMessage
 * @returns {Function}
 */
function onceCall(callback, errorMessage = 'Double call') {
    let replyDone = false;

    return (...args) => {
        if(replyDone) {
            throw new Error(errorMessage);
        }

        replyDone = true;
        return callback(...args);
    };
}

//---]>

/**
 *
 * @param {object} table
 * @param {string} key
 * @param {Function} callback
 */
function setCallbackByKey(table, key, callback) {
    if(typeof callback !== 'function') {
        throw new Error('setCallbackByKey | invalid `callback` (non function): ' + key);
    }

    table[key] = callback;
}

//---]>

/**
 *
 * @param {string} type
 * @param {Function} callback
 */
function assertBindEvent(type, callback) {
    if(typeof type !== 'string') {
        throw new Error('assertBindEvent | invalid `type` (non string): ' + type);
    }

    if(typeof callback !== 'function') {
        throw new Error('assertBindEvent | invalid `callback` (non function): ' + type);
    }
}

/**
 *
 * @param {string} type
 */
function assertRemoveEvent(type) {
    if(typeof type !== 'string' && typeof type !== 'undefined') {
        throw new Error('assertRemoveEvent | invalid `type` (non string): ' + type);
    }
}

/**
 *
 * @param {string} type
 */
function assertCallEvent(type) {
    if(typeof type !== 'string') {
        throw new Error('assertCallEvent | invalid `type` (non string): ' + type);
    }
}

//--------------------------------------------------

module.exports = {
    onceCall,

    setCallbackByKey,

    assertBindEvent,
    assertRemoveEvent,
    assertCallEvent
};
 })(global.safe);global.messagePacker = {};((module) => { ﻿/**
 *
 * @param {string} type
 * @param {(null|number)} ack
 * @param {object} data
 * @returns {(Error|ArrayBuffer)}
 */
function pack(type, ack, data) {
    return str2ab(JSON.stringify([type, ack, data]));
}

/**
 *
 * @param {ArrayBuffer} data
 * @returns {(null|Error|Array)}
 */
function unpack(data) {
    if(data instanceof ArrayBuffer) {
        try {
            const d = JSON.parse(ab2str(data));

            // type, ack, data
            if(Array.isArray(d) && d.length === 3) {
                const ack = d[1];

                if(typeof ack === 'number' || ack === null) {
                    return d;
                }
            }
        }
        catch(e) {
            return e;
        }
    }

    return null;
}

//--------------------------------------------------
// todo: rework (bin packer)

function ab2str(buf) {
    return new Uint8Array(buf).reduce((data, byte) => (data + String.fromCharCode(byte)), '');
}

function str2ab(str) {
    const len = str.length;

    const buf = new ArrayBuffer(len);
    const bufView = new Uint8Array(buf);

    for(let i = 0; i < len; i++) {
        bufView[i] = str.charCodeAt(i);
    }

    return buf;
}

//--------------------------------------------------

module.exports = {
    pack,
    unpack
};
 })(global.messagePacker);global.mio = {};((module) => { ﻿const {
    silentCallByKey
} = global.tools.exports;

const {
    setCallbackByKey,

    assertBindEvent,
    assertRemoveEvent,
    assertCallEvent
} = global.safe.exports;

const {
    pack,
    unpack
} = global.messagePacker.exports;

//--------------------------------------------------

function mio(host = 'localhost:3500', ssl = false) {
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

//--------------------------------------------------

module.exports = mio;
 })(global.mio);
            export default global.mio.exports;
        