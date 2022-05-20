const mio = require('./../../.');

//--------------------------------------------------

const ws = mio({
    idleTimeout: 8,
    maxBackpressure: 1024,
    maxPayloadLength: 512
});

//--------------------------------------------------

ws.onConnection((socket) => {
    console.log('onConnection', socket.remoteAddress);

    //---]>

    socket.on('createRoom', (code) => {
        socket.emit('createRoom', code); // ответ в общее событие
    });

    socket.on('message', (text, response) => {
        response(`${text} world`);  // ответ лично в запрос или в общее событие (если изначально был общий запрос)
    });

    socket.on('destroyMe', (silent, response) => {
        response('ok');

        if(silent) {
            socket.terminate();
        }
        else {
            socket.disconnect(1200, 'done');
        }
    });

    socket.on('error', (data, response) => {
        response(data);
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
