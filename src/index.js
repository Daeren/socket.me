const UWSApp = require('./UWSApp');
const SMApp = require('./SMApp');

//--------------------------------------------------

module.exports = function SocketMe(options) {
    return SMApp(UWSApp({
        clientLibPath: 'socket.me',
        ...options
    }));
};
