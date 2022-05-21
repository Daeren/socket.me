
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

//---]>

/**
 *
 * @param {string} topic
 */
function assertChangeTopic(topic) {
    if(typeof topic !== 'string') {
        throw new Error('assertChangeTopic | invalid `topic` (non string): ' + topic);
    }
}

/**
 *
 * @param {string} topic
 * @param {string} type
 */
function assertPublishTopic(topic, type) {
    if(typeof topic !== 'string') {
        throw new Error('assertPublishTopic | invalid `topic` (non string): ' + topic);
    }

    if(typeof type !== 'string') {
        throw new Error('assertPublishTopic | invalid `type` (non string): ' + type);
    }
}

//--------------------------------------------------

module.exports = {
    onceCall,

    setCallbackByKey,

    assertBindEvent,
    assertRemoveEvent,
    assertCallEvent,

    assertChangeTopic,
    assertPublishTopic
};
 })(global.safe);global.messagePacker = {};((module) => { ﻿const C_MODE_BIN = 1;
const C_MODE_JSON = 2;
const C_MODE_ACK = 4;
const C_MODE_EMPTY = 8;

//--------------------------------------------------

const enc = new TextEncoder();
const dec = new TextDecoder();

const unpackCache = [undefined, undefined, undefined];

//--------------------------------------------------

/**
 *
 * @param {string} type
 * @param {(null|number)} ack
 * @param {(ArrayBuffer|Uint8Array|object)} data
 * @returns {ArrayBuffer}
 */
function pack(type, ack, data) {
    const isUB = data instanceof Uint8Array;
    const isAB = isUB || data instanceof ArrayBuffer;
    const isEmpty = typeof data === 'undefined';

    //---]>

    const typeBuf = enc.encode(type);
    const dataBuf = isAB ? (isUB ? data : new Uint8Array(data)) : (isEmpty ? null : enc.encode(JSON.stringify(data)));

    //---]>

    const dataSize = isEmpty ? 0 : dataBuf.byteLength;
    const typeLen = typeBuf.byteLength;

    const bufSize = (1) + (1 + typeLen) + (1) + (dataSize);
    const buffer = new ArrayBuffer(bufSize);
    const bufView = new Uint8Array(buffer)

    //---]>

    let offset = 0;

    //---]>

    // mode
    bufView[offset] = (isAB ? C_MODE_BIN : C_MODE_JSON) | (typeof ack === 'number' ? C_MODE_ACK : 0) | (isEmpty ? C_MODE_EMPTY : 0);
    offset += 1;

    // type length
    bufView[offset] = typeLen;
    offset += 1;

    // type
    bufView.set(typeBuf, offset);
    offset += typeLen;

    // ack
    bufView[offset] = ack;
    offset += 1;

    // data
    if(dataBuf) {
        bufView.set(dataBuf, offset);
    }

    //---]>

    return buffer;
}

/**
 *
 * @param {ArrayBuffer} buffer
 * @returns {(null|Error|Array)}
 */
function unpack(buffer) {
    if(buffer instanceof ArrayBuffer === false || !buffer.byteLength) {
        return null;
    }

    //---]>

    let offset = 0;

    let mode;
    let type, typeLen;
    let ack;
    let data;

    //---]>

    const bufView = new Uint8Array(buffer)

    //---]>

    try {
        mode = bufView[offset];
        offset += 1;

        typeLen = bufView[offset];
        offset += 1;

        type = dec.decode(bufView.slice(offset, offset + typeLen));
        offset += typeLen;

        ack = (mode & C_MODE_ACK) === C_MODE_ACK ? bufView[offset] : undefined;
        offset += 1;

        if((mode & C_MODE_EMPTY) !== C_MODE_EMPTY) {
            data = bufView.slice(offset, buffer.byteLength);

            if((mode & C_MODE_BIN) === C_MODE_BIN) {
                data = data.buffer;
            }
            else if((mode & C_MODE_JSON) === C_MODE_JSON) {
                data = JSON.parse(dec.decode(data));
            }
        }
    }
    catch(e) {
        return e;
    }

    //---]>

    unpackCache[0] = type;
    unpackCache[1] = ack;
    unpackCache[2] = data;

    //---]>

    return unpackCache;
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
        error(_message, event) { throw event; },
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
                    ++lastAck;
                    lastAck %= 256; // protocol: u8 - 256

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
 })(global.mio);
            export default global.mio.exports;
        