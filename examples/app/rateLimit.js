function RateLimit(limit, interval) {
    const last = Symbol();
    const count = Symbol();

    let now = 0;
    let done = false;

    const tm = setInterval(() => ++now, interval);

    //---]>

    tm.unref();

    //---]>

    return (ws) => {
        if(!arguments.length) {
            done = true;
        }

        //---]>

        if(done) {
            clearInterval(tm);
            return true;
        }

        //---]>

        if(ws[last] !== now) {
            ws[last] = now;
            ws[count] = 1;

            return false;
        }

        return ++ws[count] > limit;
    };
}

//--------------------------------------------------

module.exports = RateLimit;
