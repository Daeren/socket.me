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

    socket.subscribe('all');

    //---]>

    socket.on('broadcast#1', (text) => {
        mio.publish('all', 'someEvent', text);
    });

    socket.on('broadcast#2', (text) => {
        socket.publish('all', 'someEvent', text);
    });
});

mio.onDisconnect((socket) => {
    console.log('onDisconnect', socket);
});

//--------------------------------------------------

mio.listen(3500).then((status) => {
    console.log('[status] listening to port 3500:', status);
});
