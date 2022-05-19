/**
 *
 * @param {Function} callback
 * @param {string} errorMessage
 * @returns {Function}
 */
function onceCall(callback, errorMessage) {
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
        throw new Error('assertBindEvent | invalid `type` (non function): ' + type);
    }

    if(typeof callback !== 'function') {
        throw new Error('assertBindEvent | invalid `callback` (non function): ' + type);
    }
}

/**
 *
 * @param {string} type
 */
function assertCallEvent(type) {
    if(typeof type !== 'string') {
        throw new Error('assertCallEvent | invalid `type` (non function): ' + type);
    }
}

//--------------------------------------------------

module.exports = {
    onceCall,

    setCallbackByKey,

    assertBindEvent,
    assertCallEvent
};
