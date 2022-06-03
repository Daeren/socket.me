const SocketMe = require('./../../.');

//---]>

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
    console.log('[status] listening to port 3500:', status);
});
