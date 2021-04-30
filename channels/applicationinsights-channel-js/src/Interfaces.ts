export interface ISenderConfig {
    /**
     * The url to which payloads will be sent
     */
    endpointUrl: () => string;

   /**
    * The JSON format (normal vs line delimited). True means line delimited JSON.
    */
    emitLineDelimitedJson: () => boolean;

    /**
     * The maximum size of a batch in bytes
     */
    maxBatchSizeInBytes: () => number;

    /**
     * The maximum interval allowed between calls to batchInvoke
     */
    maxBatchInterval: () => number;

    /**
     * The master off switch.  Do not send any data if set to TRUE
     */
    disableTelemetry: () => boolean;

    /**
     * Store a copy of a send buffer in the session storage
     */
    enableSessionStorageBuffer: () => boolean;

    /**
     * Is retry handler disabled.
     * If enabled, retry on 206 (partial success), 408 (timeout), 429 (too many requests), 500 (internal server error) and 503 (service unavailable).
     */
    isRetryDisabled: () => boolean;

    isBeaconApiDisabled: () => boolean;

    /**
     * Is beacon disabled on page unload.
     * If enabled, flush events through beaconSender.
     */
    onunloadDisableBeacon: () => boolean;

    /**
     * (Optional) Override the instrumentation key that this channel instance sends to
     */
    instrumentationKey: () => string;

    namePrefix: () => string;

    samplingPercentage: () => number;

    /**
     * (Opetional) The ability for the user to provide extra headers
     */
    customHeaders: () => [{header: string, value: string}]
}

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

export interface XDomainRequest extends XMLHttpRequestEventTarget {
    readonly responseText: string;
    send(payload: string): void;
    open(method: string, url: string): void;
}

export interface IResponseError {
    readonly index: number;
    readonly statusCode: number;
    readonly message: string;
}
