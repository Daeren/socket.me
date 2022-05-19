/**
 *
 * @param {(undefined|string)} type
 * @param {(undefined|number)} ack
 * @param {object} data
 * @returns {(Error|string)}
 */
function pack(type, ack, data) {
    let d;

    if(typeof type === 'string' && typeof ack === 'number') {
        return new Error('`type` and `ack` are both defined at once');
    }

    if(typeof type === 'string') {
        d = [type, data];
    }
    else if(typeof ack === 'number') {
        d = [ack, data];
    }
    else {
        return new Error('Invalid parameter type');
    }

    return JSON.stringify(d);
}

/**
 *
 * @param {ArrayBuffer} data
 * @returns {(null|Error|Array)}
 */
function unpack(data) {
    if(data instanceof ArrayBuffer) {
        try {
            const d = JSON.parse(Buffer.from(data));

            // type, ack, data
            if(Array.isArray(d) && (d.length === 2 || d.length === 3)) {
                return d;
            }
        }
        catch(e) {
            return e;
        }
    }

    return null;
}

//--------------------------------------------------

module.exports = {
    pack,
    unpack
};
