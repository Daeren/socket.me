
            (function() {
                const __g_ctx__ = {};__g_ctx__.tools = {};((module) => { ﻿/**
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
 })(__g_ctx__.tools);__g_ctx__.safe = {};((module) => { ﻿/**
 *
 * @param {Function} callback
 * @param {string} errorMessage
 * @returns {Function}
 */
function onceCall(callback, errorMessage = 'Double call') {
    let done = false;

    return (...args) => {
        if(done) {
            throw new Error(errorMessage);
        }

        done = true;
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
 * @param {({ [k: string]: string }|Array<string>|string)} schema
 */
function assertBindSchema(schema) {
    if(
        !schema ||
        (
            typeof schema !== 'object' &&
            typeof schema !== 'string' &&
            typeof schema !== 'function' &&

            !Array.isArray(schema)
        )
    ) {
        throw new Error('assertBindSchema | invalid `schema`');
    }
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

    assertBindSchema,

    assertBindEvent,
    assertRemoveEvent,
    assertCallEvent,

    assertChangeTopic,
    assertPublishTopic
};
 })(__g_ctx__.safe);__g_ctx__.messagePacker = {};((module) => { ﻿const C_MODE_BIN = 1;
const C_MODE_JSON = 2;
const C_MODE_ACK = 4;
const C_MODE_EMPTY = 8;

//--------------------------------------------------

const packBufferCacheSize = 1024 * 128;
const packBufferCache = new ArrayBuffer(packBufferCacheSize);

const unpackCache = [undefined, undefined, undefined];

//--------------------------------------------------

/**
 *
 * @param {string} type
 * @param {(null|number)} ack
 * @param {(ArrayBuffer|Uint8Array|object)} data
 * @returns {Uint8Array}
 */
function pack(type, ack, data) {
    const isAB = data instanceof ArrayBuffer;
    const isUB = data instanceof Uint8Array;

    const isBin = isAB || isUB;
    const isEmpty = typeof data === 'undefined';

    const useAck = typeof ack === 'number';

    //---]>

    const typeBuf = encodeString(type);
    const dataBuf = isBin
        ? (isUB ? data : new Uint8Array(data))
        : (isEmpty ? null : encodeString(JSON.stringify(data)));

    //---]>

    const typeLen = typeBuf.byteLength;
    const dataSize = isEmpty ? 0 : dataBuf.byteLength;

    const bufSize = (1) + (1 + typeLen) + (useAck ? 1 : 0) + (dataSize); // mode + typeLen + type + ack + data
    const bufView = bufSize > packBufferCacheSize
        ? new Uint8Array(bufSize)
        : new Uint8Array(packBufferCache, 0, bufSize);

    //---]>

    let offset = 0;

    //---]>

    // protocol: u8 - 256
    if(typeLen >= 256) {
        throw new Error('`type` is too long');
    }

    //---]>

    // mode
    bufView[offset] = (isBin ? C_MODE_BIN : C_MODE_JSON) | (useAck ? C_MODE_ACK : 0) | (isEmpty ? C_MODE_EMPTY : 0);
    offset += 1;

    // type length
    bufView[offset] = typeLen;
    offset += 1;

    // type
    bufView.set(typeBuf, offset);
    offset += typeLen;

    // ack
    if(useAck) {
        bufView[offset] = ack;
        offset += 1;
    }

    // data
    if(dataBuf) {
        bufView.set(dataBuf, offset);
    }

    //---]>

    return bufView;
}

/**
 *
 * @param {(ArrayBuffer|Uint8Array)} buffer
 * @returns {(null|Error|Array)}
 */
function unpack(buffer) {
    const isAB = buffer instanceof ArrayBuffer;
    const isUB = buffer instanceof Uint8Array;

    const bufSize = (isAB || isUB) ? buffer.byteLength : 0;

    //---]>

    if(!bufSize) {
        return null;
    }

    //---]>

    let offset = 0;

    let mode;
    let type, typeLen;
    let ack;
    let data;

    //---]>

    const bufView = isAB ? new Uint8Array(buffer) : buffer;

    //---]>

    try {
        mode = bufView[offset];
        offset += 1;

        typeLen = bufView[offset];
        offset += 1;

        type = decodeString(bufView, offset, offset + typeLen);
        offset += typeLen;

        if((mode & C_MODE_ACK) === C_MODE_ACK) {
            ack = bufView[offset];
            offset += 1;
        }

        if((mode & C_MODE_EMPTY) !== C_MODE_EMPTY) {
            if((mode & C_MODE_BIN) === C_MODE_BIN) {
                data = bufView.slice(offset, bufSize).buffer;
            }
            else if((mode & C_MODE_JSON) === C_MODE_JSON) {
                data = JSON.parse(decodeString(bufView, offset, bufSize));
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

const enc = new TextEncoder();
const dec = new TextDecoder();

//---]>

const encStrBufferSymSize = 256;
const encStrBufferBytes = encStrBufferSymSize * 4; // ~ utf32

const encStrBuffersSize = encStrBufferBytes * 2;  // buf_1 + buf_2 = x2
const encStrBuffersCache = new ArrayBuffer(encStrBuffersSize);

let encStrBufferOffset = 0;

//---]>

/**
 *
 * @param {string} str
 * @returns {ArrayBufferLike}
 */
function encodeString(str) {
    const len = str.length;

    if(len <= encStrBufferSymSize) {
        const byteLength = utf8ByteLength(str, len);
        const bufView = new Uint8Array(encStrBuffersCache, encStrBufferOffset, byteLength);

        encStrBufferOffset = (encStrBufferOffset + encStrBufferBytes) % encStrBuffersSize;

        utf8Encode(bufView, 0, str, len);

        return bufView;
    }
    else if(len <= 500 && typeof Buffer !== 'undefined') {
        return Buffer.from(str);
    }

    return enc.encode(str);
}

/**
 *
 * @param {ArrayBufferLike} bytes
 * @param {number} start
 * @param {number} end
 * @returns {string}
 */
function decodeString(bytes, start, end) {
    const len = end - start;

    if(typeof Buffer !== 'undefined') {
        return Buffer.from(bytes).toString('utf8', start, end);
    }

    if(len <= 200) {
        return utf8Decode(bytes, start, len);
    }

    return dec.decode(bytes.slice(start, end).buffer);
}

//--------------------------------------------------
// Faster for short strings (API requires calls across JS <-> Native bridge)

function utf8ByteLength(str, length) {
    let c = 0;
    let byteLength = 0;

    for(let i = 0; i < length; ++i) {
        c = str.charCodeAt(i);

        if(c < 0x80) {
            byteLength += 1;
        }
        else if(c < 0x800) {
            byteLength += 2;
        }
        else if(c < 0xd800 || c >= 0xe000) {
            byteLength += 3;
        }
        else {
            ++i;
            byteLength += 4;
        }
    }

    return byteLength;
}

function utf8Encode(arr, offset, str, length) {
    let c = 0;

    for(let i = 0; i < length; ++i) {
        c = str.charCodeAt(i);

        if(c < 0x80) {
            arr[offset++] = c;
        }
        else if(c < 0x800) {
            arr[offset++] = 0xc0 | (c >> 6);
            arr[offset++] = 0x80 | (c & 0x3f);
        }
        else if(c < 0xd800 || c >= 0xe000) {
            arr[offset++] = 0xe0 | (c >> 12);
            arr[offset++] = 0x80 | (c >> 6) & 0x3f;
            arr[offset++] = 0x80 | (c & 0x3f);
        }
        else {
            ++i;

            c = 0x10000 + (((c & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));

            arr[offset++] = 0xf0 | (c >> 18);
            arr[offset++] = 0x80 | (c >> 12) & 0x3f;
            arr[offset++] = 0x80 | (c >> 6) & 0x3f;
            arr[offset++] = 0x80 | (c & 0x3f);
        }
    }
}

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
 })(__g_ctx__.messagePacker);__g_ctx__.mio = {};((module) => { ﻿const {
    silentCallByKey
} = __g_ctx__.tools.exports;

const {
    setCallbackByKey,

    assertBindEvent,
    assertRemoveEvent,
    assertCallEvent
} = __g_ctx__.safe.exports;

const {
    pack,
    unpack
} = __g_ctx__.messagePacker.exports;

//--------------------------------------------------

function mio(host = 'localhost:3500', ssl = false) {
    const socket = new WebSocket(`ws${ ssl ? 's' : '' }://${ host }`);

    let actionAny = null;

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
            if(actionAny) {
                actionAny(type, payload);
            }

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

        onAny(callback) {
            if(actionAny) {
                throw new Error('This event already exists');
            }

            actionAny = callback;
        },
        offAny() {
            actionAny = null;
        },

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
 })(__g_ctx__.mio);
                window.mio = __g_ctx__.mio.exports;
            })();
        