export type SMSocketClData = ArrayBuffer | any;
export type SMSocketSendData = ArrayBuffer | Uint8Array | any;
// -1 for closed, 1 for success, 2 for dropped due to backpressure limit, and 0 for built-up backpressure that will drain over time
export type SMSocketSendResult = number;

//--------------------------------------------------

export type SMSocketEvent = (data: SMSocketClData, response: (data?: SMSocketSendData) => SMSocketSendResult) => void;
export type SMSocketTypedValidator = (v: any) => boolean;

export interface SMSocket {
    get remoteAddress(): string;
    get connected(): boolean;

    //---]>

    terminate(): void;
    disconnect(code?: number, reason?: string): void;

    //---]>

    subscribe(topic: string): void;
    unsubscribe(topic: string): void;

    publish(topic: string, type: string, data?: SMSocketSendData): boolean;

    //---]>

    typed(schema: { [k: string]: string | SMSocketTypedValidator } | Array<string | SMSocketTypedValidator> | string | SMSocketTypedValidator): SMSocket;

    //---]>

    on(type: string, callback: SMSocketEvent): void;
    off(type?: string): void;

    emit(type: string, data?: SMSocketSendData): SMSocketSendResult;
}

//--------------------------------------------------

/** An HttpRequest is stack allocated and only accessible during the callback invocation. */
export interface HttpRequest {
    /** Returns the lowercased header value or empty string. */
    getHeader(lowerCaseKey: string) : string;
    /** Returns the parsed parameter at index. Corresponds to route. */
    getParameter(index: number) : string;
    /** Returns the URL including initial /slash */
    getUrl() : string;
    /** Returns the raw querystring (the part of URL after ? sign) or empty string. */
    getQuery() : string;
    /** Returns a decoded query parameter value or empty string. */
    getQuery(key: string) : string;
    /** Loops over all headers. */
    forEach(cb: (key: string, value: string) => void) : void;
}

/** An HttpResponse is valid until either onAborted callback or any of the .end/.tryEnd calls succeed. You may attach user data to this object. */
export interface HttpResponse {
    aborted: boolean;

    /** Writes the HTTP status message such as "200 OK".
     * This has to be called first in any response, otherwise
     * it will be called automatically with "200 OK".
     *
     * If you want to send custom headers in a WebSocket
     * upgrade response, you have to call writeStatus with
     * "101 Switching Protocols" before you call writeHeader,
     * otherwise your first call to writeHeader will call
     * writeStatus with "200 OK" and the upgrade will fail.
     */
    writeStatus(status: string) : HttpResponse;
    writeHeader(key: string, value: string) : HttpResponse;

    /** Immediately force closes the connection. Any onAborted callback will run. */
    close() : HttpResponse;

    /** Returns the remote IP address in binary format (4 or 16 bytes). */
    getRemoteAddress() : ArrayBuffer;

    /** Returns the remote IP address as text. */
    getRemoteAddressAsText() : ArrayBuffer;

    /** Returns the remote IP address in binary format (4 or 16 bytes), as reported by the PROXY Protocol v2 compatible proxy. */
    getProxiedRemoteAddress() : ArrayBuffer;

    /** Returns the remote IP address as text, as reported by the PROXY Protocol v2 compatible proxy. */
    getProxiedRemoteAddressAsText() : ArrayBuffer;
}

//---]>

export type SMAppEventUpgrade = (req: HttpRequest, res: HttpResponse, next: (() => void)) => void;
export type SMAppEventConnection = (socket: SMSocket) => void;
export type SMAppEventDisconnection = (socket: SMSocket) => void;
export type SMAppEventDrain = (socket: SMSocket, bufferedAmount: number) => void;

//---]>

export interface SMApp {
    get bufferedAmount(): number;
    get listening(): boolean;

    //---]>

    listen(port: string, host?: string): Promise<boolean>;
    shutdown(): void;

    //---]>

    publish(topic: string, type: string, data?: SMSocketSendData): boolean;

    //---]>

    onUpgrade(callback: SMAppEventUpgrade): void;
    onConnection(callback: SMAppEventConnection): void;
    onDisconnect(callback: SMAppEventDisconnection): void;
    onDrain(callback: SMAppEventDrain): void;
}

//--------------------------------------------------

export interface ServerOptions {
    key_file_name?: string;
    cert_file_name?: string;
    ca_file_name?: string;

    passphrase?: string;
    dh_params_file_name?: string;

    /** This translates to SSL_MODE_RELEASE_BUFFERS */
    ssl_prefer_low_memory_usage?: boolean;
}

/** WebSocket compression options. Combine any compressor with any decompressor using bitwise OR. */
export type CompressOptions = number;

//---]>

export type SMAppOptions = {
    // '' - off, <script src="http://localhost:3500/[socket.me]"></script>
    clientLibPath?: 'socket.me';
    // mio('localhost:3500[/...]')
    path?: '/';

    ssl?: boolean,
    server?: ServerOptions;

    /** Maximum length of received message. If a client tries to send you a message larger than this, the connection is immediately closed. Defaults to 16 * 1024. */
    maxPayloadLength?: number;
    /** Maximum amount of seconds that may pass without sending or getting a message. Connection is closed if this timeout passes. Resolution (granularity) for timeouts are typically 4 seconds, rounded to closest.
     * Disable by using 0. Defaults to 120.
     */
    idleTimeout?: number;
    /** What permessage-deflate compression to use. uWS.DISABLED, uWS.SHARED_COMPRESSOR or any of the uWS.DEDICATED_COMPRESSOR_xxxKB. Defaults to uWS.DISABLED. */
    compression?: CompressOptions;
    /** Maximum length of allowed backpressure per socket when publishing or sending messages. Slow receivers with too high backpressure will be skipped until they catch up or timeout. Defaults to 1024 * 1024. */
    maxBackpressure?: number;
    /** Whether or not we should automatically send pings to uphold a stable connection given whatever idleTimeout. */
    sendPingsAutomatically?: boolean;
}

export interface SocketMe {
    (options?: SMAppOptions): SMApp;
}
