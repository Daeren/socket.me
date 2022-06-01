const SocketMe = require('./../../.');

//--------------------------------------------------

const mio = SocketMe({
    idleTimeout: 8,
    maxPayloadLength: 512
});

//--------------------------------------------------

mio.onConnection((socket) => {
    console.log('onConnection', socket.remoteAddress);

    //---]>

    socket
        .typed({
            id: 'number',
            name: 'string'
        })
        .on('object', ({ id, name }) => {
            console.log('object:', id, name);
        });

    socket
        .typed(['number', 'string'])
        .on('array', ([id, name]) => {
            console.log('array:', id, name);
        });

    socket
        .typed('number')
        .on('primitive', (id) => {
            console.log('primitive:', id);
        });
});

//--------------------------------------------------

mio.listen(3500).then((status) => {
    console.log('[status] listening to port 3500:', status);
});
