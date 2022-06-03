const SocketMe = require('./../../.');

//---]>

const tools = require('./tools');
const RateLimit = require('./RateLimit');

const wsOptions = require('./ws/options');
const onUpgrade = require('./ws/onUpgrade');
const onConnection = require('./ws/onConnection');
const onDisconnect = require('./ws/onDisconnect');

//--------------------------------------------------

const mio = SocketMe(wsOptions.instance);

//---]>

const rlRawData = RateLimit(...wsOptions.rateLimit.rawData);
const rlRejectedData = RateLimit(...wsOptions.rateLimit.rejectedData);

//--------------------------------------------------

mio.onUpgrade(onUpgrade);
mio.onConnection(onConnection);
mio.onDisconnect(onDisconnect);

//---]>

mio.onRawData((socket, _data, _isBinary, next) => {
    if(rlRawData(socket)) {
        socket.terminate();
        return;
    }

    next();
});

mio.onRejectedData((socket) => {
    if(rlRejectedData(socket)) {
        socket.terminate();
    }
});

//--------------------------------------------------

mio.listen(wsOptions.port).then((status) => {
    console.log(`[status] listening to port ${wsOptions.port}:`, status);
});

//--------------------------------------------------

const onShutdown = tools.onceCall(() => {
    mio.shutdown();

    // shutdown anyway after some time
    setTimeout(() => {
        process.exit();
    }, 10000).unref(); // 10 sec
});

const onExit = () => {
    // ... "sync" work ...
};

//---]>

process.on('uncaughtException', (error, origin) => {
    // ... log ..
    throw error;
});

process.on('unhandledRejection', (reason, promise) => {
    // ... log ..
    console.log(reason);
});

//---]>

process
    .on('SIGTERM', () => {
        onShutdown();
    })
    .on('SIGINT', () => {
        onShutdown();
    })
    .on('exit', () => {
        try {
            onExit();
        }
        catch(e) {
            console.log(e);
        }
    });
