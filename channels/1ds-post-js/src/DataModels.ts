/**
* DataModels.ts
* @author Abhilash Panwar (abpanwar) and Hector Hernandez (hectorh)
* @copyright Microsoft 2018
* File containing the interfaces for Post channel module.
*/
import {
    IDiagnosticLogger, IExtendedTelemetryItem, IPayloadData, IProcessTelemetryContext, ITelemetryPlugin, IUnloadHook, IValueSanitizer,
    IXHROverride
} from "@microsoft/1ds-core-js";

/**
 * Defines the function signature for the Payload Preprocessor.
 * @param payload - The Initial constructed payload that if not modified should be passed onto the callback function.
 * @param callback - The preprocessor MUST call the callback function to ensure that the events are sent to the server, failing to call WILL result in dropped events.
 * The modifiedBuffer argument can be either the original payload or may be modified by performing GZipping of the payload and adding the content header.
 * @param isSync - A boolean flag indicating whether this request was initiated as part of a sync response (unload / flush request), this is for informative only.
 * e.g the preprocessor may wish to not perform any GZip operations if the request was a sync request which is normally called as part of an unload request.
 */
export type PayloadPreprocessorFunction = (payload: IPayloadData, callback: (modifiedBuffer: IPayloadData) => void, isSync?: boolean) => void;

/**
 * Defines the function signature of a payload listener, which is called after the payload has been sent to the server. The listener is passed
 * both the initial payload object and any altered (modified) payload from a preprocessor so it can determine what payload it may want to log or send.
 * Used by the Remove DDV extension to listen to server send events.
 * @param orgPayload - The initially constructed payload object
 * @param sendPayload - The alternative (possibly modified by a preprocessor) payload
 * @param isSync - A boolean flag indicating whether this request was initiated as part of a sync response (unload / flush request), this is for informative only.
 * @param isBeaconSend - A boolean flag indicating whether the payload was sent using the navigator.sendBeacon() API.
 */
export type PayloadListenerFunction = (orgPayload: IPayloadData, sendPayload?: IPayloadData, isSync?: boolean, isBeaconSend?: boolean) => void;

/**
 * The IChannelConfiguration interface holds the configuration details passed to Post module.
 */
export interface IChannelConfiguration {
    /**
     * [Optional] The number of events that can be kept in memory before the SDK starts to drop events. By default, this is 10,000.
     */
    eventsLimitInMem?: number;

    /**
     * [Optional] Sets the maximum number of immediate latency events that will be cached in memory before the SDK starts to drop other
     * immediate events only, does not drop normal and real time latency events as immediate events have their own internal queue. Under
     * normal situations immediate events are scheduled to be sent in the next Javascript execution cycle, so the typically number of
     * immediate events is small (~1), the only time more than one event may be present is when the channel is paused or immediate send
     * is disabled (via manual transmit profile). By default max number of events is 500 and the default transmit time is 0ms.
     */
    immediateEventLimit?: number;

    /**
     * [Optional] If defined, when the number of queued events reaches or exceeded this limit this will cause the queue to be immediately
     * flushed rather than waiting for the normal timers. Defaults to undefined.
     */
    autoFlushEventsLimit?: number;

    /**
     * [Optional] If defined allows you to disable the auto batch (iKey set of requests) flushing logic. This is in addition to the
     * default transmission profile timers, autoFlushEventsLimit and eventsLimitInMem config values.
     */
    disableAutoBatchFlushLimit?: boolean;

    /**
     * [Optional] Sets the record and request size limit in bytes for serializer.
     * Default for record size (sync) is 65000, record size (async) is 2000000.
     * Default for request size (sync) is 65000, request size (async) is 3145728.
     * @since 3.3.7
     */
    requestLimit?: IRequestSizeLimit;

    /**
     * [Optional] Sets the limit number of events per batch.
     * Default is 500
     */
    maxNumberEvtPerBatch?: number

    /**
     * [Optional] The HTTP override that should be used to send requests, as an IXHROverride object.
     * By default during the unload of a page or if the event specifies that it wants to use sendBeacon() or sync fetch (with keep-alive),
     * this override will NOT be called. You can now change this behavior by enabling the 'alwaysUseXhrOverride' configuration value.
     * The payload data (first argument) now also includes any configured 'timeout' (defaults to undefined) and whether you should avoid
     * creating any synchronous XHR requests 'disableXhrSync' (defaults to false/undefined)
     */
    httpXHROverride?: IXHROverride;

    /**
    * Override for Instrumentation key
    */
    overrideInstrumentationKey?: string;

    /**
    * Override for Endpoint where telemetry data is sent
    */
    overrideEndpointUrl?: string;

    /**
     * The master off switch.  Do not send any data if set to TRUE
     */
    disableTelemetry?: boolean;

    /**
     * MC1 and MS0 cookies will not be returned from Collector endpoint.
     */
    ignoreMc1Ms0CookieProcessing?: boolean;

    /**
    * Override for setTimeout
    */
    setTimeoutOverride?: typeof setTimeout;

    /**
    * Override for clearTimeout
    */
    clearTimeoutOverride?: typeof clearTimeout;

    /**
     * [Optional] POST channel preprocessing function. Can be used to gzip the payload before transmission and to set the appropriate
     * Content-Encoding header. The preprocessor is explicitly not called during teardown when using the sendBeacon() API.
     */
    payloadPreprocessor?: PayloadPreprocessorFunction;

    /**
     * [Optional] POST channel listener function, used for enabling logging or reporting (RemoteDDVChannel) of the payload that is being sent.
     */
    payloadListener?: PayloadListenerFunction;

    /**
     * [Optional] By default additional timing metrics details are added to each event after they are sent to allow you to review how long it took
     * to create serialized request. As not all implementations require this level of detail and it's now possible to get the same metrics via
     * the IPerfManager and IPerfEvent we are enabling these details to be disabled. Default value is false to retain the previous behavior,
     * if you are not using these metrics and performance is a concern then it is recommended to set this value to true.
     */
    disableEventTimings?: boolean;

    /**
     * [Optional] The value sanitizer to use while constructing the envelope.
     */
    valueSanitizer?: IValueSanitizer;

    /**
     * [Optional] During serialization, when an object is identified, should the object be serialized by JSON.stringify(theObject); (when true) otherwise by theObject.toString().
     * Defaults to false
     */
    stringifyObjects?: boolean;

    /**
     * [Optional] Enables support for objects with compound keys which indirectly represent an object where the "key" of the object contains a "." as part of it's name.
     * @example
     * ```typescript
     * event: { "somedata.embeddedvalue": 123 }
     * ```
     */
    enableCompoundKey?: boolean;

    /**
     * [Optional] Switch to disable the v8 optimizeObject() calls used to provide better serialization performance. Defaults to false.
     */
    disableOptimizeObj?: boolean;

    /**
     * [Optional] By default a "Cache-Control" header will be added to the outbound payloads with the value "no-cache, no-store", this is to
     * avoid instances where Chrome can "Stall" requests which use the same outbound URL.
     */
    // See Task #7178858 - Collector requires a change to support this
    // disableCacheHeader?: boolean;

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
     * [Optional] A flag to enable or disable the usage of the sendBeacon() API (if available). If running on ReactNative this defaults
     * to `false` for all other cases it defaults to `true`.
     */
    useSendBeacon?: boolean;

    /**
     * [Optional] A flag to disable the usage of the [fetch with keep-alive](https://javascript.info/fetch-api#keepalive) support.
     */
    disableFetchKeepAlive?: boolean;

     /**
     * [Optional] Avoid adding request headers to the outgoing request that would cause a pre-flight (OPTIONS) request to be sent for each request.
     * This currently defaults to false. This is changed as the collector enables Access-Control-Max-Age to allow the browser to better cache any
     * previous OPTIONS response. Hence, we moved some of the current dynamic values sent on the query string to a header.
     */
    avoidOptions?: boolean;

    /**
     * [Optional] Specify a timeout (in ms) to apply to requests when sending requests using XHR, XDR or fetch requests. Defaults to undefined
     * and therefore the runtime defaults (normally zero for browser environments)
     */
    xhrTimeout?: number;

    /**
     * [Optional] When using Xhr for sending requests disable sending as synchronous during unload or synchronous flush.
     * You should enable this feature for IE (when there is no sendBeacon() or fetch (with keep-alive)) and you have clients
     * that end up blocking the UI during page unloading. This will cause ALL XHR requests to be sent asynchronously which
     * during page unload may result in the lose of telemetry.
     */
    disableXhrSync?: boolean;

    /**
     * [Optional] By default during unload (or when you specify to use sendBeacon() or sync fetch (with keep-alive) for an event) the SDK
     * ignores any provided httpXhrOverride and attempts to use sendBeacon() or fetch(with keep-alive) when they are available.
     * When this configuration option is true any provided httpXhrOverride will always be used, so any provided httpXhrOverride will
     * also need to "handle" the synchronous unload scenario.
     */
    alwaysUseXhrOverride?: boolean;

    /**
     * [Optional] Identifies the number of times any single event will be retried if it receives a failed (retirable) response, this
     * causes the event to be internally "requeued" and resent in the next batch. As each normal batched send request is retried at
     * least once before starting to increase the internal backoff send interval, normally batched events will generally be attempted
     * the next nearest even number of times. This means that the total number of actual send attempts will almost always be even
     * (setting to 5 will cause 6 requests), unless using manual synchronous flushing (calling flush(false)) which is not subject to
     * request level retry attempts.
     * Defaults to 6 times.
     */
    maxEventRetryAttempts?: number;

    /**
     * [Optional] Identifies the number of times any single event will be retried if it receives a failed (retriable) response as part
     * of processing / flushing events once a page unload state has been detected, this causes the event to be internally "requeued"
     * and resent in the next batch, which during page unload. Unlike the normal batching process, send requests are never retried,
     * so the value listed here is always the maximum number of attempts for any single event.
     * Defaults to 2 times.
     * Notes:
     * The SDK by default will use the sendBeacon() API if it exists which is treated as a fire and forget successful response, so for
     * environments that support or supply this API the events won't be retried (because they will be deeded to be successfully sent).
     * When an environment (IE) doesn't support sendBeacon(), this will cause multiple synchronous (by default) XMLHttpRequests to be sent,
     * which will block the UI until a response is received. You can disable ALL synchronous XHR requests by setting the 'disableXhrSync'
     * configuration setting and/or changing this value to 0 or 1.
     */
    maxUnloadEventRetryAttempts?: number;

    /**
     * [Optional] flag to indicate whether the sendBeacon and fetch (with keep-alive flag) should add the "NoResponseBody" query string
     * value to indicate that the server should return a 204 for successful requests. Defaults to true
     */
    addNoResponse?: boolean;

    /**
     * :warning: DO NOT USE THIS FLAG UNLESS YOU KNOW THAT PII DATA WILL NEVER BE INCLUDED IN THE EVENT!
     *
     * [Optional] Flag to indicate whether the SDK should include the common schema metadata in the payload. Defaults to true.
     * This flag is only applicable to the POST channel and will cause the SDK to exclude the common schema metadata from the payload,
     * while this will reduce the size of the payload, also means that the data marked as PII will not be processed as PII by the backend
     * and will not be included in the PII data purge process.
     * @since 4.1.0
     */
    excludeCsMetaData?: boolean;

    /**
     * [Optional] Specify whether cross-site Access-Control fetch requests should include credentials such as cookies,
     * authentication headers, or TLS client certificates.
     *
     * Possible values:
     * - "omit": never send credentials in the request or include credentials in the response.
     * - "include": always include credentials, even cross-origin.
     * - "same-origin": only send and include credentials for same-origin requests.
     *
     * If not set, the default value will be "include".
     *
     * For more information, refer to:
     * - [Fetch API - Using Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#including_credentials)
     * @since 3.3.1
     */
    fetchCredentials?: RequestCredentials;
}

/**
 * An interface which extends the telemetry event to track send attempts.
 */
export interface IPostTransmissionTelemetryItem extends IExtendedTelemetryItem {
    /**
     * The number of times the telemtry item has been attempted to be sent.
     */
    sendAttempt?: number;
}

/**
 * Real Time profile (default profile). RealTime Latency events are sent every 1 sec and
 * Normal Latency events are sent every 2 sec.
 */
export const RT_PROFILE = "REAL_TIME";
/**
 * Near Real Time profile. RealTime Latency events are sent every 3 sec and
 * Normal Latency events are sent every 6 sec.
 */
export const NRT_PROFILE = "NEAR_REAL_TIME";
/**
 * Best Effort. RealTime Latency events are sent every 9 sec and
 * Normal Latency events are sent every 18 sec.
 */
export const BE_PROFILE = "BEST_EFFORT";

/**
 * An interface representing Collector Web responses.
 */
export interface ICollectorResult {
    /**
    * Number of events accepted.
    */
    acc?: number;
    /**
   * Number of events rejected.
   */
    rej?: number;
    /**
     * Web Result.
     */
    webResult?: ICollectorWebResult;
}

/**
 * An interface representing Collector Web responses.
 */
export interface ICollectorWebResult {
    /**
     * MSFPC cookie.
     */
    msfpc?: string;
    /**
     * Authentication error.
     */
    authError?: string;
    /**
     * Auth Login URL.
     */
    authLoginUrl?: string;
}

export interface IRequestSizeLimit {
    /**
     * Request size limit in bytes for serializer.
     * The value should be two numbers array, with format [async request size limit, sync request size limit]
     */
    requestLimit?: number[];
     /**
     * Record size limit in bytes for serializer.
     * The value should be two numbers array, with format [async record size limit, sync record size limit]
     */
    recordLimit?: number[];
}

/**
 * Post channel interface
 */
export interface IPostChannel extends ITelemetryPlugin {
    /**
     * Diagnostic logger
     */
    diagLog: (itemCtx?: IProcessTelemetryContext) => IDiagnosticLogger;

    /**
    * Override for setTimeout
    */
    _setTimeoutOverride?: (callback: (...args: any[]) => void, ms: number, ...args: any[]) => any;

    /**
     * Backs off transmission. This exponentially increases all the timers.
     */
    _backOffTransmission(): void;

    /**
    * Clears back off for transmission.
    */
    _clearBackOff(): void;

    /**
    * Add handler to be executed with request response text.
    */
    addResponseHandler(responseHandler: (responseText: string) => void): IUnloadHook;
}

/**
 * This is an internal notification reason used by the HttpManager to report the reason for notification events
 * it contains general events as well as specific sections which encompass other enum values such as
 * SendRequestReason, EventsDiscardedReason and general HttpStatus values.
 */
export declare const enum EventBatchNotificationReason {
    /**
     * Unable to send the batch as the outbound connection channel is paused
     */
    Paused = 1,

    /**
     * The events failed to send or retry, so requeue them
     */
    RequeueEvents = 100,

    /**
     * The Batch was successfully sent and a response received, equivalent to the HttpStatusCode of 200
     */
    Complete = 200,

    // Event Send Notifications (Mostly matched with SendRequestReason)
    /**
     * No specific reason was specified or normal event schedule / timer
     */
    SendingUndefined = 1000,

    /**
     * Events are being sent based on the normal event schedule / timer.
     */
    SendingNormalSchedule = 1001,
    /**
     * A manual flush request was received
     */
    SendingManualFlush = 1001,

    /**
     * Unload event is being processed
     */
    SendingUnload = 1002,
    /**
     * The event(s) being sent are sync events
     */
    SendingSyncEvent = 1003,
    /**
     * The Channel was resumed
     */
    SendingResumed = 1004,
    /**
     * The event(s) being sent as a retry
     */
    SendingRetry = 1005,
    /**
     * Maximum batch size would be exceeded
     */
    SendingMaxBatchSize = 1010,
    /**
     * The Maximum number of events have already been queued
     */
    SendingMaxQueuedEvents = 1020,

    /**
     * The final value for a Sending notification
     */
    SendingEventMax = 1999,

    // Events Dropped - Failures
    EventsDropped = 8000,               // EventsDiscardedReason.Unknown
    NonRetryableStatus = 8001,          // EventsDiscardedReason.NonRetryableStatus
    InvalidEvent = 8002,                // EventsDiscardedReason.InvalidEvent
    SizeLimitExceeded = 8003,           // EventsDiscardedReason.SizeLimitExceeded
    KillSwitch = 8004,                  // EventsDiscardedReason.KillSwitch,
    QueueFull = 8005,                   // EventsDiscardedReason.QueueFull
    EventsDroppedMax = 8999,

    /**
     * Represents the range Http Status codes 000-999 as 9000-9999
     */
    ResponseFailure = 9000,

    /**
     * Represents the range Http Status codes 200-299
     */
    PartialSuccess = 9200,

    /**
     * Represents the range Http Status codes 300-399
     */
    ClientConfigFailure = 9300,

    /**
     * Represents the range Http Status codes 400-499
     */
    ClientFailure = 9400,

    /**
     * Represents the range Http Status codes 500-599
     */
    ServerFailure = 9500,

    ResponseFailureMax = 9999
}
