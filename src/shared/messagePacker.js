/**
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
