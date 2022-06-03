const SocketMe = require('./../../.');

//--------------------------------------------------

const mio = SocketMe({
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

    socket.on('createRoom', (code) => {
        socket.emit('createRoom', code); // ответ в общее событие
    });

    //---]>

    socket.on('broadcast', (text) => {
        mio.publish('all', 'createRoom', text);
    });

    socket.on('message', (text, callback) => {
        if(callback) {
            callback(`${text} world`);  // ответ лично в запрос
        }
        else {
            socket.emit('message', `${text} world`);
        }
    });

    socket.on('destroyMe', (silent, callback) => {
        if(callback) {
            callback('ok');
        }

        if(silent) {
            socket.terminate();
        }
        else {
            socket.disconnect(1200, 'done');
        }
    });

    socket.on('error', (data, callback) => {
        if(callback) {
            callback(data);
        }
    });
});

mio.onDisconnect((socket) => {
    console.log('onDisconnect', socket);
});

//--------------------------------------------------

mio.listen(3500).then((listenSocket) => {
    console.log('[status] listening to port 3500:', listenSocket);
});
