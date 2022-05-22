
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

    const typeBuf = encodeString(type);
    const dataBuf = isAB ? (isUB ? data : new Uint8Array(data)) : (isEmpty ? null : encodeString(JSON.stringify(data)));

    //---]>

    const dataSize = isEmpty ? 0 : dataBuf.byteLength;
    const typeLen = typeBuf.byteLength;

    const bufSize = (1) + (1 + typeLen) + (1) + (dataSize);
    const buffer = new ArrayBuffer(bufSize);
    const bufView = new Uint8Array(buffer)

    //---]>

    let offset = 0;

    //---]>

    // protocol: u8 - 256
    if(typeLen >= 256) {
        throw new Error('`type` is too long');
    }

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

        type = decodeString(bufView, offset, offset + typeLen);
        offset += typeLen;

        ack = (mode & C_MODE_ACK) === C_MODE_ACK ? bufView[offset] : undefined;
        offset += 1;

        if((mode & C_MODE_EMPTY) !== C_MODE_EMPTY) {
            if((mode & C_MODE_BIN) === C_MODE_BIN) {
                data = bufView.slice(offset, buffer.byteLength).buffer;
            }
            else if((mode & C_MODE_JSON) === C_MODE_JSON) {
                data = JSON.parse(decodeString(bufView, offset, buffer.byteLength));
            }
            else {
                return null;
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

//--------------------------------------------------

function encodeString(str) {
    return (new TextEncoder()).encode(str);
}

function decodeString(bytes, start, end) {
    const len = end - start;

    if(len < 256) {
        return utf8Decode(bytes, start, len);
    }

    if(typeof Buffer !== 'undefined') {
        return Buffer.from(bytes).toString('utf8', start, end);
    }

    return (new TextDecoder()).decode(bytes.slice(start, end).buffer);
}

//--------------------------------------------------

// Faster for short strings (API requires calls across JS <-> Native bridge)
function utf8Decode(bytes, inputOffset, byteLength) {
    let offset = inputOffset;

    const end = offset + byteLength;
    const out = [];

    while(offset < end) {
        const byte1 = bytes[offset++];

        if((byte1 & 0x80) === 0) {
            // 1 byte
            out.push(byte1);
        }
        else if((byte1 & 0xe0) === 0xc0) {
            // 2 bytes
            const byte2 = bytes[offset++] & 0x3f;
            out.push(((byte1 & 0x1f) << 6) | byte2);
        }
        else if((byte1 & 0xf0) === 0xe0) {
            // 3 bytes
            const byte2 = bytes[offset++] & 0x3f;
            const byte3 = bytes[offset++] & 0x3f;

            out.push(((byte1 & 0x1f) << 12) | (byte2 << 6) | byte3);
        }
        else if((byte1 & 0xf8) === 0xf0) {
            // 4 bytes
            const byte2 = bytes[offset++] & 0x3f;
            const byte3 = bytes[offset++] & 0x3f;
            const byte4 = bytes[offset++] & 0x3f;

            let unit = ((byte1 & 0x07) << 0x12) | (byte2 << 0x0c) | (byte3 << 0x06) | byte4;

            if(unit > 0xffff) {
                unit -= 0x10000;
                out.push(((unit >>> 10) & 0x3ff) | 0xd800);
                unit = 0xdc00 | (unit & 0x3ff);
            }

            out.push(unit);
        }
        else {
            out.push(byte1);
        }
    }

    return String.fromCharCode.apply(String, out);
}
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
 })(global.mio);
            module.export = global.mio.exports;
        