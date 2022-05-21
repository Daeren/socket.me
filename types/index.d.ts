export type SMSocketClData = ArrayBuffer | any;
export type SMSocketSendData = ArrayBuffer | Uint8Array | any;

//--------------------------------------------------

export type SMSocketEvent = (data: SMSocketClData, response: (data?: SMSocketSendData) => number) => void;

export interface SMSocket {
    get remoteAddress(): string;

    //---]>

    terminate(): void;
    disconnect(code?: number, reason?: string): void;

    //---]>

    subscribe(topic: string): void;
    unsubscribe(topic: string): void;

    publish(topic: string, type: string, data?: SMSocketSendData): ArrayBuffer;

    //---]>

    on(type: string, callback: SMSocketEvent): void;
    off(type?: string): void;

    emit(type: string, data?: SMSocketSendData): ArrayBuffer;
}

//--------------------------------------------------

export type SMAppEventConnection = (socket: SMSocket) => void;
export type SMAppEventDisconnection = (socket: SMSocket) => void;
export type SMAppEventDrain = (socket: SMSocket, bufferedAmount: number) => void;

export interface SMApp {
    get bufferedAmount(): number;
    get listening(): boolean;

    //---]>

    listen(port: string, host?: string): Promise<boolean>;
    shutdown(): void;

    //---]>

    publish(topic: string, type: string, data?: SMSocketSendData): ArrayBuffer;

    //---]>

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
    clientLibPath?: 'socket.me';

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
