const SocketMe = require('./../../.');

//--------------------------------------------------

const mio = SocketMe();

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

mio.onRawData((socket, data, isBinary) => {
    console.log('onRawData', data, isBinary);
});

mio.onRejectedData((socket, type, data) => {
    console.log('onRejectedData', type, data);
    console.log('[!]----------------');
});

mio.onUnverifiedData((socket, type, data) => {
    console.log('onUnverifiedData', type, data);
});

mio.onVerifiedData((socket, type, data) => {
    console.log('onVerifiedData', type, data);
});

//--------------------------------------------------

mio.listen(3500).then((status) => {
    console.log('[status] listening to port 3500:', status);
});
