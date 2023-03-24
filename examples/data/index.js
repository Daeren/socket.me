const SocketMe = require('./../../.');

//--------------------------------------------------

const mio = SocketMe({
    useClientLib: true
});

//--------------------------------------------------

mio.onConnection((socket) => {
    console.log('onConnection');

    //---]>

    socket
        .typed('number')
        .on('myId', (id) => {
            console.log('socket.on | myId:', id);
            console.log('----------------');
        });

    socket.on('hi', (data) => {
        console.log('socket.on | hi:', data);
        console.log('----------------');
    });
});

//---]>

mio.onRawData((socket, data, isBinary, next) => {
    console.log('onRawData', data, isBinary);
    next();
});

mio.onResolvedData((socket, type, data, response, next) => {
    console.log('onResolvedData', type, data);
    next();
});

mio.onRejectedData((socket, type, data) => {
    if(type === undefined && data === undefined) {
        // ... bad data - packer.error ...
    }

    console.log('onRejectedData', type, data);
    console.log('[!]----------------');
});

//--------------------------------------------------

mio.listen(3500).then((status) => {
    console.log('[status] listening to port 3500:', status);
});
