// This interface was removed from newer versions of typescript. Restore it for legacy support
export interface XDomainRequest {
    timeout: number;
    onerror: (ev: Event) => any;
    onload: (ev: Event) => any;
    onprogress: (ev: any) => any;
    ontimeout: (ev: Event) => any;
    responseText: string;
    contentType: string;
    open(method: string, url: string): void;
    create(): XDomainRequest;
    abort(): void;
    send(data?: any): void;
    addEventListener(type: "error", listener: (ev: ErrorEvent) => any, useCapture?: boolean): void;
    addEventListener(type: "load" | "timeout", listener: (ev: Event) => any, useCapture?: boolean): void;
    addEventListener(type: "progress", listener: (ev: ProgressEvent) => any, useCapture?: boolean): void;
    addEventListener(type: string, listener: EventListener, useCapture?: boolean): void;
}

// export declare var XDomainRequest: {
//     prototype: IXDomainRequest;
//     new (): IXDomainRequest;
// };
