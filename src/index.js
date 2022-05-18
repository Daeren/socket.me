const EventEmitter = require('events');

const uws = require('@daeren/uws');

const Socket = require('./socket');

//--------------------------------------------------

module.exports = function SocketMe(options) {
    options = {
        clientLibPath: 'socket.me',

        ...options
    };

    //---]>

    const sendClientLib = require('./sendClientLib')(options.packets);

    const eventBus = new EventEmitter();
    const uwsApp = uws.App({});

    //---]>

    uwsApp.ws('/*', {
        ...options,

        //---]>

        open(ws) {
            eventBus.emit('connection', ws);
        },
        close(ws) {
            eventBus.emit('disconnect', ws);
        },

        message(ws, data, isBinary) {
            if(!isBinary || !data) {
                return;
            }

            //---]>

            const s = ws.__refSMSocket;
            let d;

            try {
                d = JSON.parse(Buffer.from(data));
            }
            catch(e) {
                eventBus.emit('error', e.message, e, s);
            }

            if(Array.isArray(d) && d.length === 2) {
                const [type, payload] = d;
                s.__events.emit(type, payload);
            }
        }
    });

    uwsApp
        .get('/' + options.clientLibPath, (response, request) => sendClientLib(request.getHeader('accept-encoding'), response))
        .get('/*', (res) => res.end(''));

    //---]>

    class SMApp {
        get isListen() { return !!this.listenSocket }

        //---]>

        listen(port, host) {
            return new Promise((r) => {
                const done = (v) => {
                    this.listenSocket = v;
                    r(!!v);
                };

                if(this.isListen) {
                    done(this.listenSocket);
                    return;
                }

                if(host) {
                    uwsApp.listen(host, port, done);
                }
                else {
                    uwsApp.listen(port, done);
                }
            });
        }
        shutdown() {
            const { listenSocket } = this;

            if(listenSocket) {
                uws.us_listen_socket_close(listenSocket);
                this.listenSocket = null;
            }
        }

        //---]>

        onConnection(callback) {
            eventBus.on('connection', (socket) => {
                socket = socket.__refSMSocket = new Socket(socket);
                callback(socket);
            });
        }
        onDisconnect(callback) {
            eventBus.on('disconnect', (socket) => {
                callback(socket.__refSMSocket);
            });
        }
        onError(callback) {
            eventBus.on('error', (message, e, socket) => {
                callback(message, e, socket.__refSMSocket);
            });
        }
    }

    //---]>

    return new SMApp();
};
