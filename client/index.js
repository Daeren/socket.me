function mio(host = 'localhost:3500', ssl = false) {
    return createSocket();

    //---]>

    function createSocket() {
        const socket = new WebSocket(`ws${ssl ? 's' : ''}://${host}`);

        const actions = Object.create(null);
        const events = {
            connected() { /* NOP */ },
            close(_wasClean, _code, _reason) { /* NOP */ },
            data(_data) { /* NOP */ },
            error(_message, _error) { /* NOP */ }
        };

        const callbacksAck = Object.create(null);
        let lastAck = 0;

        //---]>

        socket.binaryType = 'arraybuffer';

        //---]>

        socket.onopen = function() {
            events.connected();
        };

        socket.onclose = function(event) {
            events.close(event.wasClean, event.code, event.reason);
        };

        socket.onmessage = function({ data }) {
            events.data(data);

            //---]>

            const d = unpackMessage(data);

            //---]>

            if(!d) {
                return;
            }

            if(d instanceof Error) {
                events.error(d.message, d);
                return;
            }

            //---]>

            const [type, payload] = d;

            //---]>

            if(typeof type === 'number') {
                callbacksAck[type](payload);
            }
            else {
                silentCallByKey(actions, type, payload);
            }
        };

        socket.onerror = function(event) {
            events.error(event.message, event);
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
                    events.error(e.message, e);
                    return false;
                }

                return true;
            },
            close(code = 1000, reason = '') {
                socket.close(code, reason);
            },

            //---]>

            on(type, callback) {
                if(typeof type !== 'string') {
                    throw new Error('Socket.on | invalid `type` (non string): ' + type);
                }

                if(typeof callback !== 'function') {
                    throw new Error('Socket.on | invalid `callback` (non function): ' + callback);
                }

                //---]>

                actions[type] = callback;
            },
            emit(type, data, callback) {
                if(typeof type !== 'string') {
                    throw new Error('Socket.emit | invalid `type` (non string): ' + type);
                }

                //---]>

                let ack;

                if(callback) {
                    ack = lastAck++
                    callbacksAck[ack] = (r) => {
                        delete callbacksAck[ack];
                        callback(r);
                    };
                }

                //---]>

                const d = packMessage(type, ack, data);

                if(d instanceof Error) {
                    throw d;
                }

                //---]>

                this.send(d)
            },

            //---]>

            onConnected(callback) { safeSetCallbackByKey(events, 'connected', callback); },
            onClose(callback) { safeSetCallbackByKey(events, 'close', callback); },
            onData(callback) { safeSetCallbackByKey(events, 'data', callback); },
            onError(callback) { safeSetCallbackByKey(events, 'error', callback); },
        };
    }

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

    /**
     *
     * @param {(undefined|string)} type
     * @param {(undefined|number)} ack
     * @param {object} data
     * @returns {(Error|ArrayBuffer)}
     */
    function packMessage(type, ack, data) {
        let d;

        if(typeof type === 'string' && typeof ack === 'number') {
            d = [type, ack, data];
        }
        else if(typeof type === 'string') {
            d = [type, data];
        }
        else {
            return new Error('Invalid parameter type');
        }

        return str2ab(JSON.stringify(d));
    }

    /**
     *
     * @param {ArrayBuffer} data
     * @returns {(null|Error|Array)}
     */
    function unpackMessage(data) {
        if(data instanceof ArrayBuffer) {
            try {
                const d = JSON.parse(ab2str(data));

                // type or ack
                if(Array.isArray(d) && d.length === 2) {
                    return d;
                }
            }
            catch(e) {
                return e;
            }
        }

        return null;
    }

    //---]>

    /**
     *
     * @param {object} table
     * @param {string} key
     * @param {Function} callback
     */
    function safeSetCallbackByKey(table, key, callback) {
        if(typeof callback !== 'function') {
            throw new Error('setCallbackByKey | invalid `callback` (non function): ' + key);
        }

        table[key] = callback;
    }

    /**
     *
     * @param {object} table
     * @param {string} key
     * @param {any} payload
     */
    function silentCallByKey(table, key, payload) {
        const action = table[key];

        if(action) {
            action(payload);
        }
    }
}
