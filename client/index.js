function getSocket(host = 'localhost:3500', ssl = false) {
    const socket = new WebSocket(`ws${ssl ? 's' : ''}://${host}`);
    const tableOk = {};

    //---]>

    socket.onopen = function(e) {
        if(tableOk.connected) {
            tableOk.connected();
        }
    };

    socket.onmessage = function(event) {
        if(tableOk.data) {
            tableOk.data(event.data);
        }

        if(tableOk.json) {
            let d;

            try {
                d = JSON.parse(event.data);
            }
            catch(e) {
            }

            if(typeof d !== 'undefined') {
                tableOk.json(d);
            }
        }
    };

    socket.onclose = function(event) {
        if(tableOk.close) {
            tableOk.close(event.wasClean, event.code, event.reason);
        }
    };

    socket.onerror = function(error) {
        if(tableOk.error) {
            tableOk.error(error.message);
        }
    };

    //---]>

    return {
        is(type, callback) {
            tableOk[type] = callback;
        },

        send(data) {
            socket.send(data);
        },

        close(code = 1000, reason = '') {
            socket.close(code, reason);
        }
    };
}

//-------------------------------------------

function wrapSocket(ws) {
    const tableEvent = {};

    ws.is('json', (data) => {
        const [type, body] = data;
        const func = tableEvent[type];

        if(func) {
            func(body);
        }
    });

    return {
        ...ws,

        on(type, callback) {
            tableEvent[type] = callback;
        },
        emit(type, data) {
            ws.send(JSON.stringify([type, data]))
        }
    };
}

//-------------------------------------------


