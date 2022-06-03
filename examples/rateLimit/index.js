const SocketMe = require('./../../.');

//--------------------------------------------------

const RateLimit = (limit, interval) => {
    const last = Symbol();
    const count = Symbol();

    let now = 0;
    let done = false;

    const tm = setInterval(() => ++now, interval);

    //---]>

    tm.unref();

    //---]>

    return (ws, type) => {
        if(!arguments.length) {
            done = true;
        }

        //---]>

        if(done) {
            clearInterval(tm);
            return true;
        }

        //---]>

        if(typeof type === 'string') {
            const objLast = ws[last] = ws[last] || Object.create(null);
            const objCount = ws[count] = ws[count] || Object.create(null);

            if(objLast[type] !== now) {
                objLast[type] = now;
                objCount[type] = 1;

                return false;
            }

            return ++objCount[type] > limit;
        }

        //---]>

        if(ws[last] !== now) {
            ws[last] = now;
            ws[count] = 1;

            return false;
        }

        return ++ws[count] > limit;
    };
};

//--------------------------------------------------

const mio = SocketMe();

//---]>

const rl_1_1000 = RateLimit(1, 1000);
const rl_3_1000 = RateLimit(3, 1000);
const rl_5_1000 = RateLimit(5, 1000);

//--------------------------------------------------

mio.onConnection((socket) => {
    socket.on('hi', (data) => {
        console.log('socket.on | hi:', data);
    });
});

//---]>

mio.onRawData((socket, data, isBinary, next) => {
    console.log('onRawData', data);

    // in total, you can send 5 different messages per second
    if(rl_5_1000(socket)) {
        socket.terminate();
        return;
    }

    next();
});

mio.onResolvedData((socket, type, data, next) => {
    console.log('onResolvedData', type, data);

    // of these, only 3 messages per event per second are possible
    if(rl_3_1000(socket, type)) {
        socket.terminate();
        return;
    }

    next();
});

mio.onRejectedData((socket, type, data) => {
    console.log('onRejectedData', type, data);

    // of these, only 1 incorrect messages per second are possible
    if(rl_1_1000(socket)) {
        socket.terminate();
    }
});

//--------------------------------------------------

mio.listen(3500).then((status) => {
    console.log('[status] listening to port 3500:', status);
});
