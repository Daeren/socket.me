* Binary
* Relative and absolute zero-copy operations wherever possible


#### Goals:
1. Low memory usage;
2. Maximum performance;
3. Flexibility;
4. Security (politic-free).


Server:
```javascript
const mio = SocketMe({
    idleTimeout: 8,
    maxPayloadLength: 128
});

//---]>

mio.onConnection((socket) => {
    socket.subscribe('all');
    
    socket.on('message', (text, response) => {
        response(`${text} world`);
        socket.emit('someEvent', text);
        mio.publish('all', 'someEvent', text);
    });
});

//---]>

mio.listen(3500);
```

Client (WebApp):
```javascript
const ws = mio('localhost:3500');

//---]>

ws.onConnect(() => {
    const sent = ws.emit('message', 'hello', (r) => console.log(r), 2000/*[timeout]*/);
});

ws.on('someEvent', (data) => {});
```


Browser:
```javascript
<script src="http://localhost:3500/socket.me"></script>
```


Nuxt.js:
```javascript
import { Mio } from 'socket.me/types/client.d';
import client from 'socket.me/client';

//---]>

const ws = client as Mio;
```


Typed (Server):
```javascript
mio.onConnection((socket) => {
    socket
        .typed({
            id: 'number',
            name: 'string',
            tags: 'array'
        })
        .on('object', ({ id, name, tags }) => {
            console.log('object:', id, name, tags);
        });

    socket
        .typed(['number', 'string', 'array'])
        .on('array', ([id, name, tags]) => {
            console.log('array:', id, name, tags);
        });

    socket
        .typed('number')
        .on('primitive', (id) => {
            console.log('primitive:', id);
        });
});
```


Protocol:
```
[mode (u8), typeLen (u8), type (str), ack (u8), data (bin|str)]
[0-255, 0-255, ..., 0-255, ...]

C_MODE_BIN   = 1
C_MODE_JSON  = 2
C_MODE_ACK   = 4
C_MODE_EMPTY = 8
```


## License

MIT
