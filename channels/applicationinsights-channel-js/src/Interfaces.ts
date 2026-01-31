import { IStorageBuffer, IXHROverride } from "@microsoft/applicationinsights-core-js";

/**
 * Internal interface for sendBuffer, do not export it
 * @internal
 * @since 3.1.3
 */
export interface IInternalStorageItem {
    /**
     * serialized telemetry to be stored.
     */
    item: string;
    /**
     * total retry count
     */
    cnt?: number;
}

export interface ISenderConfig {
    /**
     * The url to which payloads will be sent
     */
    endpointUrl: string;

   /**
    * The JSON format (normal vs line delimited). True means line delimited JSON.
    */
    emitLineDelimitedJson: boolean;

    /**
     * The maximum size of a batch in bytes
     */
    maxBatchSizeInBytes: number;

    /**
     * The maximum interval allowed between calls to batchInvoke
     */
    maxBatchInterval: number;

    /**
     * The master off switch.  Do not send any data if set to TRUE
     */
    disableTelemetry: boolean;

    /**
     * Store a copy of a send buffer in the session storage
     */
    enableSessionStorageBuffer: boolean;

    /**
     * Specify the storage buffer type implementation.
     * @since 2.8.12
     */
    bufferOverride: IStorageBuffer | false;

    /**
     * Is retry handler disabled.
     * If enabled, retry on 206 (partial success), 408 (timeout), 429 (too many requests), 500 (internal server error) and 503 (service unavailable).
     */
    isRetryDisabled: boolean;

    isBeaconApiDisabled: boolean;

    /**
     * Don't use XMLHttpRequest or XDomainRequest (for IE \< 9) by default instead attempt to use fetch() or sendBeacon.
     * If no other transport is available it will still use XMLHttpRequest
     */
    disableXhr: boolean;

    /**
     * If fetch keepalive is supported do not use it for sending events during unload, it may still fallback to fetch() without keepalive
     */
    onunloadDisableFetch: boolean;

    /**
     * Is beacon disabled on page unload.
     * If enabled, flush events through beaconSender.
     */
    onunloadDisableBeacon: boolean;

    /**
     * (Optional) Override the instrumentation key that this channel instance sends to
     */
    instrumentationKey: string;

    namePrefix: string;

    samplingPercentage: number;

    /**
     * (Optional) The ability for the user to provide extra headers
     */
    customHeaders: [{header: string, value: string}];

    /**
     * (Optional) Provide user an option to convert undefined field to user defined value.
     */
    convertUndefined: any

    /**
     * (Optional) The number of events that can be kept in memory before the SDK starts to drop events. By default, this is 10,000.
     */
    eventsLimitInMem: number;

    /**
     * (Optional) Enable the sender to return a promise so that manually flushing (and general sending) can wait for the request to finish.
     * Note: Enabling this may cause unhandled promise rejection errors to occur if you do not listen and handle any rejection response,
     * this *should* only be for manual flush attempts.
     * Defaults to false
     * @since 3.0.1
     */
    enableSendPromise?: boolean;

    /**
     * [Optional] The HTTP override that should be used to send requests, as an IXHROverride object.
     * By default during the unload of a page or if the event specifies that it wants to use sendBeacon() or sync fetch (with keep-alive),
     * this override will NOT be called.
     * If alwaysUseXhrOverride configuration value is set to true, the override will always be used.
     * The payload data (first argument) now also includes any configured 'timeout' (defaults to undefined) and whether you should avoid
     * creating any synchronous XHR requests 'disableXhr' (defaults to false/undefined)
     * @since 3.0.4
     */
    httpXHROverride?: IXHROverride;

    /**
     * [Optional] By default during unload (or when you specify to use sendBeacon() or sync fetch (with keep-alive) for an event) the SDK
     * ignores any provided httpXhrOverride and attempts to use sendBeacon() or fetch(with keep-alive) when they are available.
     * When this configuration option is true any provided httpXhrOverride will always be used, so any provided httpXhrOverride will
     * also need to "handle" the synchronous unload scenario.
     * @since 3.0.4
     */
    alwaysUseXhrOverride?: boolean;

    /**
     * [Optional] Disable events splitting during sendbeacon.
     * Default: false
     * @since 3.0.6
     */
    disableSendBeaconSplit?: boolean;

      /**
     * [Optional] Either an array or single value identifying the requested TransportType type that should be used.
     * This is used during initialization to identify the requested send transport, it will be ignored if a httpXHROverride is provided.
     */
    transports?: number | number[];

       /**
     * [Optional] Either an array or single value identifying the requested TransportType type(s) that should be used during unload or events
     * marked as sendBeacon. This is used during initialization to identify the requested send transport, it will be ignored if a httpXHROverride
     * is provided and alwaysUseXhrOverride is true.
     */
    unloadTransports?: number | number[];

    /**
     * (Optional) The specific error codes that will cause a retry of sending data to the backend.
     * @since 3.1.1
     */
    retryCodes?: number[];

    /**
     * (Optional) The specific max retry count for each telemetry item.
     * Default: 10
     * if it is set to 0, means no retry allowed
     * if it is set to undefined, means no limit for retry times
     * @since 3.2.0
     */
    maxRetryCnt?: number;

    /**
     * [Optional] Specifies the Cross-Origin Resource Policy (CORP) for the endpoint.
     * This value is included in the response header as `Cross-Origin-Resource-Policy`,
     * which helps control how resources can be shared across different origins.
     *
     * Possible values:
     * - `same-site`: Allows access only from the same site.
     * - `same-origin`: Allows access only from the same origin (protocol, host, and port).
     * - `cross-origin`: Allows access from any origin.
     *
     * @since 3.3.7
     */
    corsPolicy?: string;
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
