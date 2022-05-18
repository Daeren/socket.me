function mio(host = 'localhost:3500', ssl = false) {
    return createSocket();

    //---]>

    function ab2str(buf) {
        return new Uint8Array(buf).reduce((data, byte) => (data + String.fromCharCode(byte)), '');
    }

    function str2ab(str) {
        const len = str.length;

        const buf = new ArrayBuffer(len);
        const bufView = new Uint8Array(buf);

        for(let i = 0; i < len; i++) {
            bufView[i] = str.charCodeAt(i);
        }

        return buf;
    }

    //---]>

    function createSocket() {
        const socket = new WebSocket(`ws${ssl ? 's' : ''}://${host}`);

        const events = {};
        const actions = {};

        const callbacksAck = {};
        let lastAck = 0;

        //---]>

        socket.binaryType = 'arraybuffer';

        //---]>

        socket.onopen = function(e) {
            if(events.connected) {
                events.connected();
            }
        };

        socket.onmessage = function({ data }) {
            if(events.data) {
                events.data(data);
            }

            //---]>

            let d;

            try {
                d = JSON.parse(ab2str(data));
            }
            catch(e) {
                if(events.error) {
                    events.error(e.message, e);
                }
            }

            //---]>

            if(Array.isArray(d) && d.length === 2) {
                const [type, payload] = d;

                //---]>

                if(typeof type === 'number') {
                    callbacksAck[type](payload);
                }
                else {
                    const action = actions[type];

                    if(action) {
                        action(payload);
                    }
                }
            }
        };

        socket.onclose = function(event) {
            if(events.close) {
                events.close(event.wasClean, event.code, event.reason);
            }
        };

        socket.onerror = function(error) {
            if(events.error) {
                events.error(error.message, error);
            }
        };

        //---]>

        return {
            get readyState() { return socket.readyState; },
            get bufferedAmount() { return socket.bufferedAmount; },

            //---]>

            send(data) {
                try {
                    socket.send(data);
                }
                catch(e) {
                    if(events.error) {
                        events.error(e.message, e);
                    }

                    return false;
                }

                return true;
            },
            close(code = 1000, reason = '') {
                socket.close(code, reason);
            },

            //---]>

            on(type, callback) {
                actions[type] = callback;
            },
            emit(type, data, callback) {
                if(callback) {
                    lastAck++;

                    data = [type, lastAck, data];
                    callbacksAck[lastAck] = (r) => {
                        delete callbacksAck[lastAck];
                        callback(r);
                    };
                }
                else {
                    data = [type, data];
                }

                this.send(str2ab(JSON.stringify(data)))
            },

            //---]>

            onConnected(callback) { events.connected = callback; },
            onClose(callback) { events.close = callback; },
            onData(callback) { events.data = callback; },
            onError(callback) { events.error = callback; }
        };
    }
}
