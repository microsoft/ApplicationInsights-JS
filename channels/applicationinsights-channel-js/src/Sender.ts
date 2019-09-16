import { ISenderConfig, XDomainRequest as IXDomainRequest, IBackendResponse } from './Interfaces';
import { ISendBuffer, SessionStorageSendBuffer, ArraySendBuffer } from './SendBuffer';
import {
    EnvelopeCreator, DependencyEnvelopeCreator, EventEnvelopeCreator,
    ExceptionEnvelopeCreator, MetricEnvelopeCreator, PageViewEnvelopeCreator,
    PageViewPerformanceEnvelopeCreator, TraceEnvelopeCreator
} from './EnvelopeCreator';
import { Serializer } from './Serializer'; // todo move to channel
import {
    DisabledPropertyName, RequestHeaders, Util,
    IEnvelope, PageView, Event,
    Trace, Exception, Metric,
    PageViewPerformance, RemoteDependencyData,
    IChannelControlsAI,
    ConfigurationManager, IConfig,
    ProcessLegacy,
    BreezeChannelIdentifier,
    SampleRate
} from '@microsoft/applicationinsights-common';
import {
    ITelemetryPlugin, ITelemetryItem, IConfiguration, CoreUtils,
    _InternalMessageId, LoggingSeverity, IDiagnosticLogger, IAppInsightsCore, IPlugin,
} from '@microsoft/applicationinsights-core-js';
import { Offline } from './Offline';
import { Sample } from './TelemetryProcessors/Sample'

declare var XDomainRequest: {
    prototype: IXDomainRequest;
    new(): IXDomainRequest;
};

export type SenderFunction = (payload: string[], isAsync: boolean) => void;

export class Sender implements IChannelControlsAI {

    public static constructEnvelope(orig: ITelemetryItem, iKey: string, logger: IDiagnosticLogger): IEnvelope {
        let envelope: ITelemetryItem;
        if (iKey !== orig.iKey && !CoreUtils.isNullOrUndefined(iKey)) {
            envelope = {
                ...orig,
                iKey
            };
        } else {
            envelope = orig;
        }

        switch (envelope.baseType) {
            case Event.dataType:
                return EventEnvelopeCreator.EventEnvelopeCreator.Create(logger, envelope);
            case Trace.dataType:
                return TraceEnvelopeCreator.TraceEnvelopeCreator.Create(logger, envelope);
            case PageView.dataType:
                return PageViewEnvelopeCreator.PageViewEnvelopeCreator.Create(logger, envelope);
            case PageViewPerformance.dataType:
                return PageViewPerformanceEnvelopeCreator.PageViewPerformanceEnvelopeCreator.Create(logger, envelope);
            case Exception.dataType:
                return ExceptionEnvelopeCreator.ExceptionEnvelopeCreator.Create(logger, envelope);
            case Metric.dataType:
                return MetricEnvelopeCreator.MetricEnvelopeCreator.Create(logger, envelope);
            case RemoteDependencyData.dataType:
                return DependencyEnvelopeCreator.DependencyEnvelopeCreator.Create(logger, envelope);
            default:

                return EventEnvelopeCreator.EventEnvelopeCreator.Create(logger, envelope);
        }
    }

    private static _getDefaultAppInsightsChannelConfig(): ISenderConfig {
        // set default values
        return {
            endpointUrl: () => "https://dc.services.visualstudio.com/v2/track",
            emitLineDelimitedJson: () => false,
            maxBatchInterval: () => 15000,
            maxBatchSizeInBytes: () => 102400,  // 100kb
            disableTelemetry: () => false,
            enableSessionStorageBuffer: () => true,
            isRetryDisabled: () => false,
            isBeaconApiDisabled: () => true,
            onunloadDisableBeacon: () => false,
            instrumentationKey: () => undefined,  // Channel doesn't need iKey, it should be set already
            namePrefix: () => undefined,
            samplingPercentage: () => 100
        }
    }

    private static _getEmptyAppInsightsChannelConfig(): ISenderConfig {
        return {
            endpointUrl: undefined,
            emitLineDelimitedJson: undefined,
            maxBatchInterval: undefined,
            maxBatchSizeInBytes: undefined,
            disableTelemetry: undefined,
            enableSessionStorageBuffer: undefined,
            isRetryDisabled: undefined,
            isBeaconApiDisabled: undefined,
            onunloadDisableBeacon: undefined,
            instrumentationKey: undefined,
            namePrefix: undefined,
            samplingPercentage: undefined
        };
    }
    
    public priority: number = 1001;

    public identifier: string = BreezeChannelIdentifier;

    /**
     * The configuration for this sender instance
     */
    public _config: ISenderConfig;

    /**
     * A method which will cause data to be send to the url
     */
    public _sender: SenderFunction;
    /**
     * A send buffer object
     */
    public _buffer: ISendBuffer;

    /**
     * AppId of this component parsed from some backend response.
     */
    public _appId: string;

    /**
     * Whether XMLHttpRequest object is supported. Older version of IE (8,9) do not support it.
     */
    public _XMLHttpRequestSupported: boolean = false;

    protected _sample: Sample;
    /**
     * How many times in a row a retryable error condition has occurred.
     */
    private _consecutiveErrors: number;

    /**
     * The time to retry at in milliseconds from 1970/01/01 (this makes the timer calculation easy).
     */
    private _retryAt: number;

    /**
     * The time of the last send operation.
     */
    private _lastSend: number;

    /**
     * Handle to the timer for delayed sending of batches of data.
     */
    private _timeoutHandle: any;

    private _nextPlugin: ITelemetryPlugin;

    private _logger: IDiagnosticLogger;
    private _serializer: Serializer;


    public pause(): void {
        throw new Error("Method not implemented.");
    }

    public resume(): void {
        throw new Error("Method not implemented.");
    }

    public flush() {
        try {
            this.triggerSend();
        } catch (e) {
            this._logger.throwInternal(LoggingSeverity.CRITICAL,
                _InternalMessageId.FlushFailed,
                "flush failed, telemetry will not be collected: " + Util.getExceptionName(e),
                { exception: Util.dump(e) });
        }
    }

    public onunloadFlush() {
        if ((this._config.onunloadDisableBeacon() === false || this._config.isBeaconApiDisabled() === false) && Util.IsBeaconApiSupported()) {
            try {
                this.triggerSend(true, this._beaconSender);
            } catch (e) {
                this._logger.throwInternal(LoggingSeverity.CRITICAL,
                    _InternalMessageId.FailedToSendQueuedTelemetry,
                    "failed to flush with beacon sender on page unload, telemetry will not be collected: " + Util.getExceptionName(e),
                    { exception: Util.dump(e) });
            }
        } else {
            this.flush();
        }
    }

    public teardown(): void {
        throw new Error("Method not implemented.");
    }

    public initialize(config: IConfiguration & IConfig, core: IAppInsightsCore, extensions: IPlugin[]): void {
        this._logger = core.logger;
        this._serializer = new Serializer(core.logger);

        this._consecutiveErrors = 0;
        this._retryAt = null;
        this._lastSend = 0;
        this._sender = null;
        const defaultConfig = Sender._getDefaultAppInsightsChannelConfig();
        this._config = Sender._getEmptyAppInsightsChannelConfig();
        for (const field in defaultConfig) {
            this._config[field] = () => ConfigurationManager.getConfig(config, field, this.identifier, defaultConfig[field]());
        }

        this._buffer = (this._config.enableSessionStorageBuffer && Util.canUseSessionStorage())
            ? new SessionStorageSendBuffer(this._logger, this._config) : new ArraySendBuffer(this._config);
        this._sample = new Sample(this._config.samplingPercentage(), this._logger);

        if (!this._config.isBeaconApiDisabled() && Util.IsBeaconApiSupported()) {
            this._sender = this._beaconSender;
        } else {
            if (typeof XMLHttpRequest !== "undefined") {
                const testXhr = new XMLHttpRequest();
                if ("withCredentials" in testXhr) {
                    this._sender = this._xhrSender;
                    this._XMLHttpRequestSupported = true;
                } else if (typeof XDomainRequest !== "undefined") {
                    this._sender = this._xdrSender; // IE 8 and 9
                }
            }
        }
    }

    public processTelemetry(telemetryItem: ITelemetryItem) {
        try {
            // if master off switch is set, don't send any data
            if (this._config.disableTelemetry()) {
                // Do not send/save data
                return;
            }

            // validate input
            if (!telemetryItem) {
                this._logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.CannotSendEmptyTelemetry, "Cannot send empty telemetry");
                return;
            }

            // validate event
            if (telemetryItem.baseData && !telemetryItem.baseType) {
                this._logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.InvalidEvent, "Cannot send telemetry without baseData and baseType");
                return;
            }

            if (!telemetryItem.baseType) {
                // Default
                telemetryItem.baseType = "EventData";
            }

            // ensure a sender was constructed
            if (!this._sender) {
                this._logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.SenderNotInitialized, "Sender was not initialized");
                return;
            }
          
            // check if this item should be sampled in, else add sampleRate tag
            if (!this._isSampledIn(telemetryItem)) {
                // Item is sampled out, do not send it
                this._logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.TelemetrySampledAndNotSent,
                    "Telemetry item was sampled out and not sent", { SampleRate: this._sample.sampleRate });
                return;
            } else {
                telemetryItem.tags = telemetryItem.tags || ({} as any);
                telemetryItem.tags[SampleRate] = this._sample.sampleRate;
            }

            // construct an envelope that Application Insights endpoint can understand
            const aiEnvelope = Sender.constructEnvelope(telemetryItem, this._config.instrumentationKey(), this._logger);
            if (!aiEnvelope) {
                this._logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.CreateEnvelopeError, "Unable to create an AppInsights envelope");
                return;
            }

            let doNotSendItem = false;
            // this is for running in legacy mode, where customer may already have a custom initializer present
            if (telemetryItem.tags && telemetryItem.tags[ProcessLegacy]) {
                telemetryItem.tags[ProcessLegacy].forEach((callBack: (env: IEnvelope) => boolean | void) => {
                    try {
                        if (callBack && callBack(aiEnvelope) === false) {
                            doNotSendItem = true;
                            this._logger.warnToConsole("Telemetry processor check returns false");
                        }
                    } catch (e) {
                        // log error but dont stop executing rest of the telemetry initializers
                        // doNotSendItem = true;
                        this._logger.throwInternal(
                            LoggingSeverity.CRITICAL, _InternalMessageId.TelemetryInitializerFailed, "One of telemetry initializers failed, telemetry item will not be sent: " + Util.getExceptionName(e),
                            { exception: Util.dump(e) }, true);
                    }
                });

                delete telemetryItem.tags[ProcessLegacy];
            }
            if (doNotSendItem) {
                return; // do not send, no need to execute next plugin
            }

            // check if the incoming payload is too large, truncate if necessary
            const payload: string = this._serializer.serialize(aiEnvelope);

            // flush if we would exceed the max-size limit by adding this item
            const bufferPayload = this._buffer.getItems();
            const batch = this._buffer.batchPayloads(bufferPayload);

            if (batch && (batch.length + payload.length > this._config.maxBatchSizeInBytes())) {
                this.triggerSend();
            }

            // enqueue the payload
            this._buffer.enqueue(payload);

            // ensure an invocation timeout is set
            this._setupTimer();

        } catch (e) {
            this._logger.throwInternal(
                LoggingSeverity.WARNING,
                _InternalMessageId.FailedAddingTelemetryToBuffer,
                "Failed adding telemetry to the sender's buffer, some telemetry will be lost: " + Util.getExceptionName(e),
                { exception: Util.dump(e) });
        }

        // hand off the telemetry item to the next plugin
        if (!CoreUtils.isNullOrUndefined(this._nextPlugin)) {
            this._nextPlugin.processTelemetry(telemetryItem);
        }
    }

    public setNextPlugin(next: ITelemetryPlugin) {
        this._nextPlugin = next;
    }

    /**
     * xhr state changes
     */
    public _xhrReadyStateChange(xhr: XMLHttpRequest, payload: string[], countOfItemsInPayload: number) {
        if (xhr.readyState === 4) {
            let response: IBackendResponse = null;
            if (!this._appId) {
                response = this._parseResponse(xhr.responseText || xhr.response);
                if (response && response.appId) {
                    this._appId = response.appId;
                }
            }

            if ((xhr.status < 200 || xhr.status >= 300) && xhr.status !== 0) {
                if (!this._config.isRetryDisabled() && this._isRetriable(xhr.status)) {
                    this._resendPayload(payload);

                    this._logger.throwInternal(
                        LoggingSeverity.WARNING,
                        _InternalMessageId.TransmissionFailed, ". " +
                        "Response code " + xhr.status + ". Will retry to send " + payload.length + " items.");
                } else {
                    this._onError(payload, this._formatErrorMessageXhr(xhr));
                }
            } else if (Offline.isOffline()) { // offline
                // Note: Don't check for staus == 0, since adblock gives this code
                if (!this._config.isRetryDisabled()) {
                    const offlineBackOffMultiplier = 10; // arbritrary number
                    this._resendPayload(payload, offlineBackOffMultiplier);

                    this._logger.throwInternal(
                        LoggingSeverity.WARNING,
                        _InternalMessageId.TransmissionFailed, `. Offline - Response Code: ${xhr.status}. Offline status: ${Offline.isOffline()}. Will retry to send ${payload.length} items.`);
                }
            } else {
                if (xhr.status === 206) {
                    if (!response) {
                        response = this._parseResponse(xhr.responseText || xhr.response);
                    }

                    if (response && !this._config.isRetryDisabled()) {
                        this._onPartialSuccess(payload, response);
                    } else {
                        this._onError(payload, this._formatErrorMessageXhr(xhr));
                    }
                } else {
                    this._consecutiveErrors = 0;
                    this._onSuccess(payload, countOfItemsInPayload);
                }
            }
        }
    }

    /**
     * Immediately send buffered data
     * @param async {boolean} - Indicates if the events should be sent asynchronously
     * @param forcedSender {SenderFunction} - Indicates the forcedSender, undefined if not passed
     */
    public triggerSend(async = true, forcedSender?: SenderFunction) {
        try {
            // Send data only if disableTelemetry is false
            if (!this._config.disableTelemetry()) {

                if (this._buffer.count() > 0) {
                    const payload = this._buffer.getItems();

                    // invoke send
                    if (forcedSender) {
                        forcedSender.call(this, payload, async);
                    } else {
                        this._sender(payload, async);
                    }
                }

                // update lastSend time to enable throttling
                this._lastSend = +new Date;
            } else {
                this._buffer.clear();
            }

            clearTimeout(this._timeoutHandle);
            this._timeoutHandle = null;
            this._retryAt = null;
        } catch (e) {
            /* Ignore this error for IE under v10 */
            if (!Util.getIEVersion() || Util.getIEVersion() > 9) {
                this._logger.throwInternal(
                    LoggingSeverity.CRITICAL,
                    _InternalMessageId.TransmissionFailed,
                    "Telemetry transmission failed, some telemetry will be lost: " + Util.getExceptionName(e),
                    { exception: Util.dump(e) });
            }
        }
    }

    /**
     * error handler
     */
    public _onError(payload: string[], message: string, event?: ErrorEvent) {
        this._logger.throwInternal(
            LoggingSeverity.WARNING,
            _InternalMessageId.OnError,
            "Failed to send telemetry.",
            { message });

        this._buffer.clearSent(payload);
    }

    /**
     * partial success handler
     */
    public _onPartialSuccess(payload: string[], results: IBackendResponse) {
        const failed = [];
        const retry = [];

        // Iterate through the reversed array of errors so that splicing doesn't have invalid indexes after the first item.
        const errors = results.errors.reverse();
        for (const error of errors) {
            const extracted = payload.splice(error.index, 1)[0];
            if (this._isRetriable(error.statusCode)) {
                retry.push(extracted);
            } else {
                // All other errors, including: 402 (Monthly quota exceeded) and 439 (Too many requests and refresh cache).
                failed.push(extracted);
            }
        }

        if (payload.length > 0) {
            this._onSuccess(payload, results.itemsAccepted);
        }

        if (failed.length > 0) {
            this._onError(failed, this._formatErrorMessageXhr(null, ['partial success', results.itemsAccepted, 'of', results.itemsReceived].join(' ')));
        }

        if (retry.length > 0) {
            this._resendPayload(retry);

            this._logger.throwInternal(
                LoggingSeverity.WARNING,
                _InternalMessageId.TransmissionFailed, "Partial success. " +
                "Delivered: " + payload.length + ", Failed: " + failed.length +
                ". Will retry to send " + retry.length + " our of " + results.itemsReceived + " items");
        }
    }

    /**
     * success handler
     */
    public _onSuccess(payload: string[], countOfItemsInPayload: number) {
        this._buffer.clearSent(payload);
    }

    /**
     * xdr state changes
     */
    public _xdrOnLoad(xdr: IXDomainRequest, payload: string[]) {
        if (xdr && (xdr.responseText + "" === "200" || xdr.responseText === "")) {
            this._consecutiveErrors = 0;
            this._onSuccess(payload, 0);
        } else {
            const results = this._parseResponse(xdr.responseText);

            if (results && results.itemsReceived && results.itemsReceived > results.itemsAccepted
                && !this._config.isRetryDisabled()) {
                this._onPartialSuccess(payload, results);
            } else {
                this._onError(payload, this._formatErrorMessageXdr(xdr));
            }
        }
    }

    private _isSampledIn(envelope: ITelemetryItem): boolean {
        return this._sample.isSampledIn(envelope);
    }

    /**
     * Send Beacon API request
     * @param payload {string} - The data payload to be sent.
     * @param isAsync {boolean} - not used
     * Note: Beacon API does not support custom headers and we are not able to get
     * appId from the backend for the correct correlation.
     */
    private _beaconSender(payload: string[], isAsync: boolean) {
        const url = this._config.endpointUrl();
        const batch = this._buffer.batchPayloads(payload);

        // Chrome only allows CORS-safelisted values for the sendBeacon data argument
        // see: https://bugs.chromium.org/p/chromium/issues/detail?id=720283
        const plainTextBatch = new Blob([batch], { type: 'text/plain;charset=UTF-8' });

        // The sendBeacon method returns true if the user agent is able to successfully queue the data for transfer. Otherwise it returns false.
        const queued = navigator.sendBeacon(url, plainTextBatch);

        if (queued) {
            this._buffer.markAsSent(payload);
            // no response from beaconSender, clear buffer
            this._onSuccess(payload, payload.length);
        } else {
            this._xhrSender(payload, true);
            this._logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.TransmissionFailed, ". " + "Failed to send telemetry with Beacon API, retried with xhrSender.");
        }
    }

    /**
     * Send XMLHttpRequest
     * @param payload {string} - The data payload to be sent.
     * @param isAsync {boolean} - Indicates if the request should be sent asynchronously
     */
    private _xhrSender(payload: string[], isAsync: boolean) {
        const xhr = new XMLHttpRequest();
        xhr[DisabledPropertyName] = true;
        xhr.open("POST", this._config.endpointUrl(), isAsync);
        xhr.setRequestHeader("Content-type", "application/json");

        // append Sdk-Context request header only in case of breeze endpoint
        if (Util.isInternalApplicationInsightsEndpoint(this._config.endpointUrl())) {
            xhr.setRequestHeader(RequestHeaders.sdkContextHeader, RequestHeaders.sdkContextHeaderAppIdRequest);
        }

        xhr.onreadystatechange = () => this._xhrReadyStateChange(xhr, payload, payload.length);
        xhr.onerror = (event: ErrorEvent) => this._onError(payload, this._formatErrorMessageXhr(xhr), event);

        // compose an array of payloads
        const batch = this._buffer.batchPayloads(payload);
        xhr.send(batch);

        this._buffer.markAsSent(payload);
    }

    /**
     * Parses the response from the backend.
     * @param response - XMLHttpRequest or XDomainRequest response
     */
    private _parseResponse(response: any): IBackendResponse {
        try {
            if (response && response !== "") {
                const result = JSON.parse(response);

                if (result && result.itemsReceived && result.itemsReceived >= result.itemsAccepted &&
                    result.itemsReceived - result.itemsAccepted === result.errors.length) {
                    return result;
                }
            }
        } catch (e) {
            this._logger.throwInternal(
                LoggingSeverity.CRITICAL,
                _InternalMessageId.InvalidBackendResponse,
                "Cannot parse the response. " + Util.getExceptionName(e),
                {
                    response
                });
        }

        return null;
    }

    /**
     * Resend payload. Adds payload back to the send buffer and setup a send timer (with exponential backoff).
     * @param payload
     */
    private _resendPayload(payload: string[], linearFactor: number = 1) {
        if (!payload || payload.length === 0) {
            return;
        }

        this._buffer.clearSent(payload);
        this._consecutiveErrors++;

        for (const item of payload) {
            this._buffer.enqueue(item);
        }

        // setup timer
        this._setRetryTime(linearFactor);
        this._setupTimer();
    }

    /** 
     * Calculates the time to wait before retrying in case of an error based on
     * http://en.wikipedia.org/wiki/Exponential_backoff
     */
    private _setRetryTime(linearFactor: number) {
        const SlotDelayInSeconds = 10;
        let delayInSeconds: number;

        if (this._consecutiveErrors <= 1) {
            delayInSeconds = SlotDelayInSeconds;
        } else {
            const backOffSlot = (Math.pow(2, this._consecutiveErrors) - 1) / 2;
            // tslint:disable-next-line:insecure-random
            let backOffDelay = Math.floor(Math.random() * backOffSlot * SlotDelayInSeconds) + 1;
            backOffDelay = linearFactor * backOffDelay;
            delayInSeconds = Math.max(Math.min(backOffDelay, 3600), SlotDelayInSeconds);
        }

        // TODO: Log the backoff time like the C# version does.
        const retryAfterTimeSpan = Date.now() + (delayInSeconds * 1000);

        // TODO: Log the retry at time like the C# version does.
        this._retryAt = retryAfterTimeSpan;
    }

    /**
     * Sets up the timer which triggers actually sending the data.
     */
    private _setupTimer() {
        if (!this._timeoutHandle) {
            const retryInterval = this._retryAt ? Math.max(0, this._retryAt - Date.now()) : 0;
            const timerValue = Math.max(this._config.maxBatchInterval(), retryInterval);

            this._timeoutHandle = setTimeout(() => {
                this.triggerSend();
            }, timerValue);
        }
    }

    /**
     * Checks if the SDK should resend the payload after receiving this status code from the backend.
     * @param statusCode
     */
    private _isRetriable(statusCode: number): boolean {
        return statusCode === 408 // Timeout
            || statusCode === 429 // Too many requests.
            || statusCode === 500 // Internal server error.
            || statusCode === 503; // Service unavailable.
    }

    private _formatErrorMessageXhr(xhr: XMLHttpRequest, message?: string): string {
        if (xhr) {
            return "XMLHttpRequest,Status:" + xhr.status + ",Response:" + xhr.responseText || xhr.response || "";
        }

        return message;
    }

    /**
     * Send XDomainRequest
     * @param payload {string} - The data payload to be sent.
     * @param isAsync {boolean} - Indicates if the request should be sent asynchronously
     *
     * Note: XDomainRequest does not support sync requests. This 'isAsync' parameter is added
     * to maintain consistency with the xhrSender's contract
     * Note: XDomainRequest does not support custom headers and we are not able to get
     * appId from the backend for the correct correlation.
     */
    private _xdrSender(payload: string[], isAsync: boolean) {
        const xdr = new XDomainRequest();
        xdr.onload = () => this._xdrOnLoad(xdr, payload);
        xdr.onerror = (event: ErrorEvent) => this._onError(payload, this._formatErrorMessageXdr(xdr), event);

        // XDomainRequest requires the same protocol as the hosting page.
        // If the protocol doesn't match, we can't send the telemetry :(.
        const hostingProtocol = window.location && window.location.protocol
        if (this._config.endpointUrl().lastIndexOf(hostingProtocol, 0) !== 0) {
            this._logger.throwInternal(
                LoggingSeverity.WARNING,
                _InternalMessageId.TransmissionFailed, ". " +
                "Cannot send XDomain request. The endpoint URL protocol doesn't match the hosting page protocol.");

            this._buffer.clear();
            return;
        }

        const endpointUrl = this._config.endpointUrl().replace(/^(https?:)/, "");
        xdr.open('POST', endpointUrl);

        // compose an array of payloads
        const batch = this._buffer.batchPayloads(payload);
        xdr.send(batch);

        this._buffer.markAsSent(payload);
    }

    private _formatErrorMessageXdr(xdr: IXDomainRequest, message?: string): string {
        if (xdr) {
            return "XDomainRequest,Response:" + xdr.responseText || "";
        }

        return message;
    }
}
