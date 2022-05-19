const EventEmitter = require('events');

//---]>

const uws = require('@daeren/uws');

//---]>

const safeOnceCall = require('./safeOnceCall');
const { unpack } = require('./messagePacker');

const Socket = require('./socket');

//--------------------------------------------------

module.exports = function SocketMe(options) {
    options = {
        clientLibPath: 'socket.me',

        ...options
    };

    //---]>

    const { app: uwsApp, events } = createUWS(options);

    //---]>

    class SMApp {
        listenSocket = null;

        //---]>

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
            events.on('connection', (socket) => {
                socket = socket.__refSMSocket = new Socket(socket);
                callback(socket);
            });
        }
        onDisconnect(callback) {
            events.on('disconnect', (socket) => {
                callback(socket.__refSMSocket);
            });
        }
        onError(callback) {
            events.on('error', (e, socket) => {
                callback(e.message, e, socket.__refSMSocket);
            });
        }
    }

    //---]>

    return new SMApp();
};

//--------------------------------------------------

function createUWS(options) {
    const sendClientLib = require('./sendClientLib')(options.packets);

    //---]>

    const app = uws.App({});
    const events = new EventEmitter();

    //---]>

    app
        .get('/*', (res) => res.end(''))
        .ws('/*', {
            ...options,

            //---]>

            open(ws) { events.emit('connection', ws); },
            close(ws) { events.emit('disconnect', ws); },

            message(ws, data, isBinary) {
                if(!isBinary || !data) {
                    return;
                }

                //---]>

                const s = ws.__refSMSocket;
                const d = unpack(data);

                //---]>

                if(!d) {
                    return;
                }
                else if(d instanceof Error) {
                    events.emit('error', d, s);
                }

                //---]>

                let type, ack, payload;

                if(d.length === 2) {
                    [type, payload] = d;
                }
                else {
                    [type, ack, payload] = d;
                }

                //---]>

                const replyCallback = safeOnceCall((result) => {
                    s.__send(type, ack, result);
                }, 'Socket.on | double call `response`: ' + type);

                //---]>

                s.__events.emit(type, payload, replyCallback);
            }
        });

    //---]>

    if(options.clientLibPath) {
        app.get('/' + options.clientLibPath, (response, request) => sendClientLib(request.getHeader('accept-encoding'), response));
    }

    //---]>

    return { app, events };
}
