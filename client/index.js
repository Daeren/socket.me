function mio(host = 'localhost:3500', ssl = false, binary = false) {
    return createSocket();

    //---]>

    function createSocket() {
        const socket = new WebSocket(`ws${ssl ? 's' : ''}://${host}`);

        const events = {};
        const actions = {};

        //---]>

        if(binary) {
            socket.binaryType = 'arraybuffer';
        }

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

            if(binary) {
                // ... bin
            }
            else {
                let d;

                try {
                    d = JSON.parse(data);
                }
                catch(e) {
                    if(events.error) {
                        events.error(e.message, e);
                    }
                }

                if(Array.isArray(d)) {
                    const [type, payload] = d;
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
            emit(type, data) {
                if(binary) {
                    // ...bin
                }
                else {
                    data = JSON.stringify([type, data]);
                }

                this.send(data)
            },

            //---]>

            onConnected(callback) { events.connected = callback; },
            onClose(callback) { events.close = callback; },
            onData(callback) { events.data = callback; },
            onError(callback) { events.error = callback; }
        };
    }
}
