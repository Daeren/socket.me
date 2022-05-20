const C_MODE_BIN = 1;
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
    for(let i = 0; i < typeLen; i++) {
        bufView[offset] = typeBuf[i];
        offset += 1;
    }

    // ack
    bufView[offset] = ack;
    offset += 1;

    // data
    for(let i = 0; i < dataSize; i++) {
        bufView[offset] = dataBuf[i];
        offset += 1;
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
