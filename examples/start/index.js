const mio = require('./../../.');

//--------------------------------------------------

const ws = mio({
    idleTimeout: 8,
    maxBackpressure: 1024,
    maxPayloadLength: 512
});

//--------------------------------------------------

ws.onConnection((socket) => {
    console.log('onConnection');

    //---]>

    socket.on('createRoom', (code, response) => {
        console.log('createRoom', code);

        socket.emit('createRoom', code); // ответ в общее событие

        response('+'); // ответ лично в запрос или в общее событие (если изначально был общий запрос)
    });
});

ws.onDisconnect((socket) => {
    console.log('onDisconnect', socket);
});

ws.onError((message) => {
    console.log('onError', message);
});

//--------------------------------------------------

ws.listen(3500).then((listenSocket) => {
    console.log('[status] listening to port 3500:', listenSocket);
});
