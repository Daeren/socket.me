* Binary
* Relative and absolute zero-copy operations wherever possible


#### Goals:
1. Low memory usage;
2. Maximum performance;
3. Flexibility.


Server:
```javascript
const ws = mio({
    idleTimeout: 8,
    maxBackpressure: 1024,
    maxPayloadLength: 512,
});

//---]>

ws.onConnection((socket) => {
    socket.on('message', (text, response) => {
        socket.emit('someEvent', text);
        response(text + ' world');
    });
});

//---]>

ws.listen(3500)
```

Client:
```javascript
const ws = mio('localhost:3500');

//---]>

ws.on('someEvent', (data) => { });

ws.onConnected(() => {
    ws.emit('message', 'hello', (r) => console.log(r));
});
```


## License

MIT
