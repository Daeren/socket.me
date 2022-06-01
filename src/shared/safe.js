/**
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
