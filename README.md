* Binary
* Relative and absolute zero-copy operations wherever possible


#### Goals:
1. Low memory usage;
2. Maximum performance;
3. Flexibility;
4. Security (politic-free).


Server:
```javascript
const ws = mio({
    idleTimeout: 8,
    maxBackpressure: 1024,
    maxPayloadLength: 512
});

//---]>

ws.onConnection((socket) => {
    socket.on('message', (text, response) => {
        response(`${text} world`);
        socket.emit('someEvent', text);
    });
});

//---]>

ws.listen(3500);
```

Client:
```javascript
<script src="http://localhost:3500/socket.me"></script>

// ...

const ws = mio('localhost:3500');

//---]>

ws.onConnect(() => {
    ws.emit('message', 'hello', (r) => console.log(r));
});

ws.on('someEvent', (data) => { });
```


## License

MIT
