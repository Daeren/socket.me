﻿const C_MODE_BIN = 1;
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

    //---]>

    const typeBuf = encodeString(type);
    const dataBuf = isBin
        ? (isUB ? data : new Uint8Array(data))
        : (isEmpty ? null : encodeString(JSON.stringify(data)));

    //---]>

    const typeLen = typeBuf.byteLength;
    const dataSize = isEmpty ? 0 : dataBuf.byteLength;

    const bufSize = (1) + (1 + typeLen) + (1) + (dataSize);
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
    bufView[offset] = (isBin ? C_MODE_BIN : C_MODE_JSON) | (typeof ack === 'number' ? C_MODE_ACK : 0) | (isEmpty ? C_MODE_EMPTY : 0);
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

    //---]>

    if((isAB || isUB) === false  || !buffer.byteLength) {
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

const enc = new TextEncoder();
const dec = new TextEncoder();

//---]>

function encodeString(str) {
    return enc.encode(str);
}

function decodeString(bytes, start, end) {
    const len = end - start;

    if(typeof Buffer !== 'undefined') {
        return Buffer.from(bytes).toString('utf8', start, end);
    }

    if(len <= 220) {
        return utf8Decode(bytes, start, len);
    }

    return dec.decode(bytes.slice(start, end).buffer);
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
