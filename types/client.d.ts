export type CSocketSrvData = ArrayBuffer | any;
export type CSocketSendData = ArrayBuffer | Uint8Array | any;

//--------------------------------------------------

export type CSocketEvent = (data: CSocketSrvData) => void;
export type CSocketEventResponse = (result: (Error | CSocketSrvData)) => void;

export type CSocketEventConnect = () => void;
export type CSocketEventClose = (wasClean: boolean, code: number, reason: string) => void;
export type CSocketEventData = (data: any) => void;
export type CSocketEventError = (error: Error) => void;

export interface CSocket {
    get readyState(): number;
    get bufferedAmount(): number;

    get connected(): boolean;

    //---]>

    setResponseTimeout(n: number): void;

    //---]>

    close(code?: number, reason?: string): void;

    //---]>

    on(type: string, callback: CSocketEvent): void;
    off(type?: string): void;

    emit(type: string, data?: CSocketSendData, response?: CSocketEventResponse, timeout?: number): ArrayBuffer;

    //---]>

    onConnect(callback: CSocketEventConnect): void;
    onClose(callback: CSocketEventClose): void;
    onData(callback: CSocketEventData): void;
    onError(callback: CSocketEventError): void;
}

//--------------------------------------------------

export interface Mio {
    (host?: string, ssl?:boolean): CSocket;
}
