const ws = require('./../../.');

//--------------------------------------------------

const mio = ws({
    idleTimeout: 8,
    maxBackpressure: 1024,
    maxPayloadLength: 512,
});

//--------------------------------------------------

mio.onConnection((socket) => {
    console.log('onConnection');

    //---]>

    socket.on('createRoom', (code) => {
        console.log('createRoom', code);

        socket.emit('createRoom', code);
    });
});

mio.onDisconnect((socket) => {
    console.log('onDisconnect');
});

//--------------------------------------------------

mio.listen(3500).then((listenSocket) => {
    console.log('[status] listening to port 3500:', listenSocket);
})
