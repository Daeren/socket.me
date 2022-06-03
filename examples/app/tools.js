function onceCall(callback) {
    let done = false;

    return (...args) => {
        if(!done) {
            done = true;
            return callback(...args);
        }
    };
}

//--------------------------------------------------

module.exports = {
    onceCall
};
