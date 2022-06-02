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
    if(type === undefined && data === undefined) {
        // ... bad data - packer.error ...
    }

    console.log('onRejectedData', type, data);
    console.log('[!]----------------');
});

mio.onResolvedData((socket, type, data) => {
    console.log('onResolvedData', type, data);
});

//--------------------------------------------------

mio.listen(3500).then((status) => {
    console.log('[status] listening to port 3500:', status);
});
