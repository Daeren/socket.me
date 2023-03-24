const SocketMe = require('./../../.');

//--------------------------------------------------

const mio = SocketMe({
    useClientLib: true,

    idleTimeout: 8,
    maxBackpressure: 1024,
    maxPayloadLength: 512
});

//--------------------------------------------------

mio.onConnection((socket) => {
    console.log('onConnection', socket.remoteAddress);

    //---]>

    socket.on('message', (text, response) => {
        response(`${text} world`);
        socket.emit('someEvent', text);
    });
});

mio.onDisconnect((socket) => {
    console.log('onDisconnect', socket);
});

//--------------------------------------------------

mio.listen(3500).then((status) => {
    console.log('[status] listening to port 3500:', status);
});
