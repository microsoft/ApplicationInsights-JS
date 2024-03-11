import { IStorageBuffer } from "@microsoft/applicationinsights-common";

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
     * Specify the storage buffer type implementation.
     * @since 2.8.12
     */
    bufferOverride: () => IStorageBuffer | false;

    /**
     * Is retry handler disabled.
     * If enabled, retry on 206 (partial success), 408 (timeout), 429 (too many requests), 500 (internal server error) and 503 (service unavailable).
     */
    isRetryDisabled: () => boolean;

    isBeaconApiDisabled: () => boolean;

    /**
     * Don't use XMLHttpRequest or XDomainRequest (for IE < 9) by default instead attempt to use fetch() or sendBeacon.
     * If no other transport is available it will still use XMLHttpRequest
     */
    disableXhr: () => boolean;

    /**
     * If fetch keepalive is supported do not use it for sending events during unload, it may still fallback to fetch() without keepalive
     */
    onunloadDisableFetch: () => boolean;

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
     * (Optional) The ability for the user to provide extra headers
     */
    customHeaders: () => [{header: string, value: string}]

    /**
     * (Optional) Provide user an option to convert undefined field to user defined value.
     */
     convertUndefined: () => any

    /**
     * (Optional) The number of events that can be kept in memory before the SDK starts to drop events. By default, this is 10,000.
     */
    eventsLimitInMem: () => number;

    /**
     * (Optional) The specific error codes that will cause a retry of sending data to the backend.
     */
    retryCodes: () => number[];
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
