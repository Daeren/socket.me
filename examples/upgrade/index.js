const SocketMe = require('./../../.');

//--------------------------------------------------

const mio = SocketMe({
    path: '/my-path'
});

//---]>

let count = 0;

//--------------------------------------------------

mio.onUpgrade((req, res, next) => {
    const url = req.getUrl();
    const ip = Buffer.from(res.getRemoteAddressAsText()).toString();

    //---]>

    console.log('onUpgrade', url, ip);

    //---]>

    count++;

    if(count % 2 === 0) {
        res.close();
    }
    else {
        res.writeStatus('101');
        res.writeHeader('x-custom-track-id', `${count}`);

        next();
    }
});

mio.onConnection((socket) => {
    console.log('onConnection', socket.remoteAddress);

    //---]>

    socket.on('hi', (data) => {
        console.log('hi', data);
    });
});

//--------------------------------------------------

mio.listen(3500).then((status) => {
    console.log('[status] listening to port 3500:', status);
});
