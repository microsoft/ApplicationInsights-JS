///<reference types="applicationinsights-common" />
///<reference types="applicationinsights-core-js" />
import { ISenderConfig, XDomainRequest as IXDomainRequest, IBackendResponse } from './Interfaces';
import { ISendBuffer, SessionStorageSendBuffer, ArraySendBuffer } from './SendBuffer';
import {
    EnvelopeCreator, DependencyEnvelopeCreator, EventEnvelopeCreator,
    ExceptionEnvelopeCreator, MetricEnvelopeCreator, PageViewEnvelopeCreator,
    PageViewPerformanceEnvelopeCreator, TraceEnvelopeCreator
} from './EnvelopeCreator';
import { EventValidator } from './TelemetryValidation/EventValidator';
import { TraceValidator } from './TelemetryValidation/TraceValidator';
import { ExceptionValidator } from './TelemetryValidation/ExceptionValidator';
import { MetricValidator } from './TelemetryValidation/MetricValidator';
import { PageViewPerformanceValidator } from './TelemetryValidation/PageViewPerformanceValidator';
import { PageViewValidator } from './TelemetryValidation/PageViewValidator';
import { RemoteDepdencyValidator } from './TelemetryValidation/RemoteDepdencyValidator';
import { Serializer } from './Serializer'; // todo move to channel
import {
    DisabledPropertyName, RequestHeaders, Util,
    _InternalMessageId, LoggingSeverity, _InternalLogging,
    IEnvelope, PageView, Event,
    Trace, Exception, Metric,
    PageViewPerformance, RemoteDependencyData,
    IChannelControlsAI
} from 'applicationinsights-common';
import {
    ITelemetryPlugin, ITelemetryItem, IConfiguration
} from 'applicationinsights-core-js';

declare var XDomainRequest: {
    prototype: IXDomainRequest;
    new(): IXDomainRequest;
};

export class Sender implements IChannelControlsAI {
    public priority: number = 200;

    public identifier: string;

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
            _InternalLogging.throwInternal(LoggingSeverity.CRITICAL,
                _InternalMessageId.FlushFailed,
                "flush failed, telemetry will not be collected: " + Util.getExceptionName(e),
                { exception: Util.dump(e) });
        }
    }

    public teardown(): void {
        throw new Error("Method not implemented.");
    }

    public setNextPlugin: (next: ITelemetryPlugin) => void;

    /**
     * The configuration for this sender instance
     */
    public _config: ISenderConfig;

    /**
     * A method which will cause data to be send to the url
     */
    public _sender: (payload: string[], isAsync: boolean) => void;

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

    public initialize(config: IConfiguration) {
        this.identifier = "AppInsightsChannelPlugin";
        this._consecutiveErrors = 0;
        this._retryAt = null;
        this._lastSend = 0;
        this._config = Sender._getDefaultAppInsightsChannelConfig(config, this.identifier);
        this._sender = null;
        this._buffer = (Util.canUseSessionStorage() && this._config.enableSessionStorageBuffer)
            ? new SessionStorageSendBuffer(this._config) : new ArraySendBuffer(this._config);

        if (!this._config.isBeaconApiDisabled() && Util.IsBeaconApiSupported()) {
            this._sender = this._beaconSender;
        } else {
            if (typeof XMLHttpRequest != "undefined") {
                var testXhr = new XMLHttpRequest();
                if ("withCredentials" in testXhr) {
                    this._sender = this._xhrSender;
                    this._XMLHttpRequestSupported = true;
                } else if (typeof XDomainRequest !== "undefined") {
                    this._sender = this._xdrSender; //IE 8 and 9
                }
            }
        }
    }

    public processTelemetry(envelope: ITelemetryItem) {
        try {
            // if master off switch is set, don't send any data
            if (this._config.disableTelemetry()) {
                // Do not send/save data
                return;
            }

            // validate input
            if (!envelope) {
                _InternalLogging.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.CannotSendEmptyTelemetry, "Cannot send empty telemetry");
                return;
            }

            // ensure a sender was constructed
            if (!this._sender) {
                _InternalLogging.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.SenderNotInitialized, "Sender was not initialized");
                return;
            }

            // first we need to validate that the envelope passed down is valid
            let isValid: boolean = Sender._validate(envelope);
            if (!isValid) {
                _InternalLogging.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.TelemetryEnvelopeInvalid, "Invalid telemetry envelope");
                return;
            }

            // construct an envelope that Application Insights endpoint can understand
            let aiEnvelope = Sender._constructEnvelope(envelope);
            if (!aiEnvelope) {
                _InternalLogging.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.CreateEnvelopeError, "Unable to create an AppInsights envelope");
                return;
            }

            // check if the incoming payload is too large, truncate if necessary
            let payload: string = Serializer.serialize(aiEnvelope);

            // flush if we would exceed the max-size limit by adding this item
            var bufferPayload = this._buffer.getItems();
            var batch = this._buffer.batchPayloads(bufferPayload);

            if (batch && (batch.length + payload.length > this._config.maxBatchSizeInBytes())) {
                this.triggerSend();
            }

            // enqueue the payload
            this._buffer.enqueue(payload);

            // ensure an invocation timeout is set
            this._setupTimer();

            // Uncomment if you want to use DataLossanalyzer
            // DataLossAnalyzer.incrementItemsQueued();
        } catch (e) {
            _InternalLogging.throwInternal(
                LoggingSeverity.WARNING,
                _InternalMessageId.FailedAddingTelemetryToBuffer,
                "Failed adding telemetry to the sender's buffer, some telemetry will be lost: " + Util.getExceptionName(e),
                { exception: Util.dump(e) });
        }
    }

    /**
     * xhr state changes
     */
    public _xhrReadyStateChange(xhr: XMLHttpRequest, payload: string[], countOfItemsInPayload: number) {
        if (xhr.readyState === 4) {
            var response: IBackendResponse = null;
            if (!this._appId) {
                response = this._parseResponse(xhr.responseText || xhr.response);
                if (response && response.appId) {
                    this._appId = response.appId;
                }
            }

            if ((xhr.status < 200 || xhr.status >= 300) && xhr.status !== 0) {
                if (!this._config.isRetryDisabled() && this._isRetriable(xhr.status)) {
                    this._resendPayload(payload);

                    _InternalLogging.throwInternal(
                        LoggingSeverity.WARNING,
                        _InternalMessageId.TransmissionFailed, ". " +
                        "Response code " + xhr.status + ". Will retry to send " + payload.length + " items.");
                } else {
                    this._onError(payload, this._formatErrorMessageXhr(xhr));
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
     */
    public triggerSend(async = true) {
        try {
            // Send data only if disableTelemetry is false
            if (!this._config.disableTelemetry()) {

                if (this._buffer.count() > 0) {
                    var payload = this._buffer.getItems();

                    // invoke send
                    this._sender(payload, async);
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
                _InternalLogging.throwInternal(
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
        _InternalLogging.throwInternal(
            LoggingSeverity.WARNING,
            _InternalMessageId.OnError,
            "Failed to send telemetry.",
            { message: message });

        this._buffer.clearSent(payload);
    }

    /**
     * partial success handler
     */
    public _onPartialSuccess(payload: string[], results: IBackendResponse) {
        var failed = [];
        var retry = [];

        // Iterate through the reversed array of errors so that splicing doesn't have invalid indexes after the first item.
        var errors = results.errors.reverse();
        for (var error of errors) {
            var extracted = payload.splice(error.index, 1)[0];
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

            _InternalLogging.throwInternal(
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
        // Uncomment if you want to use DataLossanalyzer
        // DataLossAnalyzer.decrementItemsQueued(countOfItemsInPayload);

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
            var results = this._parseResponse(xdr.responseText);

            if (results && results.itemsReceived && results.itemsReceived > results.itemsAccepted
                && !this._config.isRetryDisabled()) {
                this._onPartialSuccess(payload, results);
            } else {
                this._onError(payload, this._formatErrorMessageXdr(xdr));
            }
        }
    }

    public static _constructEnvelope(envelope: ITelemetryItem): IEnvelope {
        switch (envelope.baseType) {
            case Event.dataType:
                return EventEnvelopeCreator.EventEnvelopeCreator.Create(envelope);
            case Trace.dataType:
                return TraceEnvelopeCreator.TraceEnvelopeCreator.Create(envelope);
            case PageView.dataType:
                return PageViewEnvelopeCreator.PageViewEnvelopeCreator.Create(envelope);
            case PageViewPerformance.dataType:
                return PageViewPerformanceEnvelopeCreator.PageViewPerformanceEnvelopeCreator.Create(envelope);
            case Exception.dataType:
                return ExceptionEnvelopeCreator.ExceptionEnvelopeCreator.Create(envelope);
            case Metric.dataType:
                return MetricEnvelopeCreator.MetricEnvelopeCreator.Create(envelope);
            case RemoteDependencyData.dataType:
                return DependencyEnvelopeCreator.DependencyEnvelopeCreator.Create(envelope);
            default:
                return null;
        }
    }

    private static _getDefaultAppInsightsChannelConfig(config: IConfiguration, identifier: string): ISenderConfig {
        let resultConfig = <ISenderConfig>{};
        let pluginConfig = config.extensions ? config.extensions[identifier] : {};

        // set default values
        resultConfig.endpointUrl = () => config.endpointUrl || "https://dc.services.visualstudio.com/v2/track";
        resultConfig.emitLineDelimitedJson = () => Util.stringToBoolOrDefault(pluginConfig.emitLineDelimitedJson);
        resultConfig.maxBatchInterval = () => !isNaN(pluginConfig.maxBatchInterval) ? pluginConfig.maxBatchInterval : 15000;
        resultConfig.maxBatchSizeInBytes = () => pluginConfig.maxBatchSizeInBytes > 0 ? pluginConfig.maxBatchSizeInBytes : 102400; // 100kb
        resultConfig.disableTelemetry = () => Util.stringToBoolOrDefault(pluginConfig.disableTelemetry);
        resultConfig.enableSessionStorageBuffer = () => Util.stringToBoolOrDefault(pluginConfig.enableSessionStorageBuffer, true);
        resultConfig.isRetryDisabled = () => Util.stringToBoolOrDefault(pluginConfig.isRetryDisabled);
        resultConfig.isBeaconApiDisabled = () => Util.stringToBoolOrDefault(pluginConfig.isBeaconApiDisabled, true);

        return resultConfig;
    }

    private static _validate(envelope: ITelemetryItem): boolean {
        // call the appropriate Validate depending on the baseType
        switch (envelope.baseType) {
            case Event.dataType:
                return EventValidator.EventValidator.Validate(envelope);
            case Trace.dataType:
                return TraceValidator.TraceValidator.Validate(envelope);
            case Exception.dataType:
                return ExceptionValidator.ExceptionValidator.Validate(envelope);
            case Metric.dataType:
                return MetricValidator.MetricValidator.Validate(envelope);
            case PageView.dataType:
                return PageViewValidator.PageViewValidator.Validate(envelope);
            case PageViewPerformance.dataType:
                return PageViewPerformanceValidator.PageViewPerformanceValidator.Validate(envelope);
            case RemoteDependencyData.dataType:
                return RemoteDepdencyValidator.RemoteDepdencyValidator.Validate(envelope);
        }
        return false;
    }

    /**
     * Send Beacon API request
     * @param payload {string} - The data payload to be sent.
     * @param isAsync {boolean} - not used
     * Note: Beacon API does not support custom headers and we are not able to get
     * appId from the backend for the correct correlation.
     */
    private _beaconSender(payload: string[], isAsync: boolean) {
        var url = this._config.endpointUrl();
        var batch = this._buffer.batchPayloads(payload);

        // Chrome only allows CORS-safelisted values for the sendBeacon data argument
        // see: https://bugs.chromium.org/p/chromium/issues/detail?id=720283
        let plainTextBatch = new Blob([batch], { type: 'text/plain;charset=UTF-8' });

        // The sendBeacon method returns true if the user agent is able to successfully queue the data for transfer. Otherwise it returns false.
        var queued = navigator.sendBeacon(url, plainTextBatch);

        if (queued) {
            this._buffer.markAsSent(payload);
        } else {
            _InternalLogging.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.TransmissionFailed, ". " + "Failed to send telemetry with Beacon API.");
        }
    }

    /**
     * Send XMLHttpRequest
     * @param payload {string} - The data payload to be sent.
     * @param isAsync {boolean} - Indicates if the request should be sent asynchronously
     */
    private _xhrSender(payload: string[], isAsync: boolean) {
        var xhr = new XMLHttpRequest();
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
        var batch = this._buffer.batchPayloads(payload);
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
                var result = JSON.parse(response);

                if (result && result.itemsReceived && result.itemsReceived >= result.itemsAccepted &&
                    result.itemsReceived - result.itemsAccepted == result.errors.length) {
                    return result;
                }
            }
        } catch (e) {
            _InternalLogging.throwInternal(
                LoggingSeverity.CRITICAL,
                _InternalMessageId.InvalidBackendResponse,
                "Cannot parse the response. " + Util.getExceptionName(e),
                {
                    response: response
                });
        }

        return null;
    }

    /**
     * Resend payload. Adds payload back to the send buffer and setup a send timer (with exponential backoff).
     * @param payload
     */
    private _resendPayload(payload: string[]) {
        if (!payload || payload.length === 0) {
            return;
        }

        this._buffer.clearSent(payload);
        this._consecutiveErrors++;

        for (var item of payload) {
            this._buffer.enqueue(item);
        }

        // setup timer
        this._setRetryTime();
        this._setupTimer();
    }

    /** Calculates the time to wait before retrying in case of an error based on
     * http://en.wikipedia.org/wiki/Exponential_backoff
     */
    private _setRetryTime() {
        const SlotDelayInSeconds = 10;
        var delayInSeconds: number;

        if (this._consecutiveErrors <= 1) {
            delayInSeconds = SlotDelayInSeconds;
        } else {
            var backOffSlot = (Math.pow(2, this._consecutiveErrors) - 1) / 2;
            var backOffDelay = Math.floor(Math.random() * backOffSlot * SlotDelayInSeconds) + 1;
            delayInSeconds = Math.max(Math.min(backOffDelay, 3600), SlotDelayInSeconds);
        }

        // TODO: Log the backoff time like the C# version does.
        var retryAfterTimeSpan = Date.now() + (delayInSeconds * 1000);

        // TODO: Log the retry at time like the C# version does.
        this._retryAt = retryAfterTimeSpan;
    }

    /**
     * Sets up the timer which triggers actually sending the data.
     */
    private _setupTimer() {
        if (!this._timeoutHandle) {
            var retryInterval = this._retryAt ? Math.max(0, this._retryAt - Date.now()) : 0;
            var timerValue = Math.max(this._config.maxBatchInterval(), retryInterval);

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
        return statusCode == 408 // Timeout
            || statusCode == 429 // Too many requests.
            || statusCode == 500 // Internal server error.
            || statusCode == 503; // Service unavailable.
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
        var xdr = new XDomainRequest();
        xdr.onload = () => this._xdrOnLoad(xdr, payload);
        xdr.onerror = (event: ErrorEvent) => this._onError(payload, this._formatErrorMessageXdr(xdr), event);

        // XDomainRequest requires the same protocol as the hosting page. 
        // If the protocol doesn't match, we can't send the telemetry :(. 
        var hostingProtocol = window.location.protocol
        if (this._config.endpointUrl().lastIndexOf(hostingProtocol, 0) !== 0) {
            _InternalLogging.throwInternal(
                LoggingSeverity.WARNING,
                _InternalMessageId.TransmissionFailed, ". " +
                "Cannot send XDomain request. The endpoint URL protocol doesn't match the hosting page protocol.");

            this._buffer.clear();
            return;
        }

        var endpointUrl = this._config.endpointUrl().replace(/^(https?:)/, "");
        xdr.open('POST', endpointUrl);

        // compose an array of payloads
        var batch = this._buffer.batchPayloads(payload);
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