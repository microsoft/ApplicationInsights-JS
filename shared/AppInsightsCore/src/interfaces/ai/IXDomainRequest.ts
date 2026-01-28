export interface IBackendResponse {
    /**
     * Number of items received by the backend
     */
    readonly itemsReceived: number;

    /**
     * Number of items succesfuly accepted by the backend
     */
    readonly itemsAccepted: number;

    /**
     * List of errors for items which were not accepted
     */
    readonly errors: IResponseError[];

    /**
     * App id returned by the backend - not necessary returned, but we don't need it with each response.
     */
    readonly appId?: string;
}

export interface IXDomainRequest extends XMLHttpRequestEventTarget {
    readonly responseText: string;
    send(payload: string): void;
    open(method: string, url: string): void;
    timeout: number;
    contentType: string;
    addEventListener(type: "error", listener: (ev: ErrorEvent) => any, useCapture?: boolean): void;
    addEventListener(type: "load" | "timeout", listener: (ev: Event) => any, useCapture?: boolean): void;
    addEventListener(type: "progress", listener: (ev: ProgressEvent) => any, useCapture?: boolean): void;
}


export interface IResponseError {
    readonly index: number;
    readonly statusCode: number;
    readonly message: string;
}

