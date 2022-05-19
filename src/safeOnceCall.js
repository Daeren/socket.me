/**
 *
 * @param {Function} callback
 * @param {string} errorMessage
 * @returns {Function}
 */
function safeOnceCall(callback, errorMessage) {
    let replyDone = false;

    return (...args) => {
        if(replyDone) {
            throw new Error(errorMessage);
        }

        replyDone = true;
        return callback(...args);
    };
}

//--------------------------------------------------

module.exports = safeOnceCall;
