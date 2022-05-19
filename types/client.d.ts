export type CSocketEvent = (data: any) => void;

export type CSocketEventConnect = () => void;
export type CSocketEventClose = (wasClean: boolean, code: number, reason: string) => void;
export type CSocketEventData = (data: any) => void;
export type CSocketEventError = (message: string, event: Error) => void;

export interface CSocket {
    get readyState(): number;
    get bufferedAmount(): number;

    get connected(): boolean;

    //---]>

    send(data: any): void;
    close(code?: number, reason?: string): void;

    //---]>

    on(type: string, callback: CSocketEvent): void;
    off(type?: string): void;

    emit(type: string, data: any, response: (result: any) => void): void;

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
