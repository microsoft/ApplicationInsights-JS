/// <reference path="serializer.ts" />
/// <reference path="Telemetry/Common/Envelope.ts"/>
/// <reference path="Telemetry/Common/Base.ts" />
/// <reference path="../JavaScriptSDK.Interfaces/Contracts/Generated/ContextTagKeys.ts"/>
/// <reference path="../JavaScriptSDK.Interfaces/Contracts/Generated/Envelope.ts" />
/// <reference path="Context/Application.ts"/>
/// <reference path="Context/Device.ts"/>
/// <reference path="Context/Internal.ts"/>
/// <reference path="Context/Location.ts"/>
/// <reference path="Context/Operation.ts"/>
/// <reference path="Context/Sample.ts"/>
/// <reference path="Context/Session.ts"/>
/// <reference path="Context/User.ts"/>
/// <reference path="ajax/ajax.ts"/>
/// <reference path="DataLossAnalyzer.ts"/>
/// <reference path="SendBuffer.ts"/>

interface XDomainRequest extends XMLHttpRequestEventTarget {
    responseText: string;
    send(payload: string);
    open(method: string, url: string);
};

declare var XDomainRequest: {
    prototype: XDomainRequest;
    new (): XDomainRequest;
};

module Microsoft.ApplicationInsights {
    "use strict";

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
    }

    export class Sender {
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

        /**
         * A send buffer object
         */
        public _buffer: ISendBuffer;

        /**
         * The configuration for this sender instance
         */
        public _config: ISenderConfig;

        /**
         * A method which will cause data to be send to the url
         */

        public _sender: (payload: string[], isAsync: boolean) => void;

        /**
         * Whether XMLHttpRequest object is supported. Older version of IE (8,9) do not support it.
         */
        public _XMLHttpRequestSupported: boolean = false;

        /**
         * Constructs a new instance of the Sender class
         */
        constructor(config: ISenderConfig) {
            this._consecutiveErrors = 0;
            this._retryAt = null;
            this._lastSend = 0;
            this._config = config;
            this._sender = null;
            this._buffer = (Util.canUseSessionStorage() && this._config.enableSessionStorageBuffer())
                ? new SessionStorageSendBuffer(config) : new ArraySendBuffer(config);

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

        /**
         * Add a telemetry item to the send buffer
         */
        public send(envelope: Microsoft.ApplicationInsights.IEnvelope) {
            try {
                // if master off switch is set, don't send any data
                if (this._config.disableTelemetry()) {
                    // Do not send/save data
                    return;
                }

                // validate input
                if (!envelope) {
                    _InternalLogging.throwInternalNonUserActionable(LoggingSeverity.CRITICAL, new _InternalLogMessage(_InternalMessageId.NONUSRACT_CannotSendEmptyTelemetry, "Cannot send empty telemetry"));
                    return;
                }

                // ensure a sender was constructed
                if (!this._sender) {
                    _InternalLogging.throwInternalNonUserActionable(LoggingSeverity.CRITICAL, new _InternalLogMessage(_InternalMessageId.NONUSRACT_SenderNotInitialized, "Sender was not initialized"));
                    return;
                }

                // check if the incoming payload is too large, truncate if necessary
                var payload: string = Serializer.serialize(envelope);

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

                DataLossAnalyzer.incrementItemsQueued();
            } catch (e) {
                _InternalLogging.throwInternalNonUserActionable(LoggingSeverity.CRITICAL,
                    new _InternalLogMessage(_InternalMessageId.NONUSRACT_FailedAddingTelemetryToBuffer, "Failed adding telemetry to the sender's buffer, some telemetry will be lost: " + Util.getExceptionName(e),
                        { exception: Util.dump(e) }));
            }
        }

        /**
         * Sets up the timer which triggers actually sending the data.
         */
        private _setupTimer() {
            if (!this._timeoutHandle) {
                var timerValue = this._retryAt ? Math.max(this._config.maxBatchInterval(), Date.now() - this._retryAt) : this._config.maxBatchInterval();
                this._timeoutHandle = setTimeout(() => {
                    this._timeoutHandle = null;
                    this._retryAt = null;
                    this.triggerSend();
                }, timerValue);
            }
        }

        /**
         * Gets the size of the list in bytes.
         * @param list {string[]} - The list to get the size in bytes of.
         */
        private _getSizeInBytes(list: string[]) {
            var size = 0;
            if (list && list.length) {
                for (var i = 0; i < list.length; i++) {
                    var item = list[i];
                    if (item && item.length) {
                        size += item.length;
                    }
                }
            }

            return size;
        }

        /**
         * Immediately send buffered data
         * @param async {boolean} - Indicates if the events should be sent asynchronously (Optional, Defaults to true)
         */
        public triggerSend(async?: boolean) {
            // We are async by default
            var isAsync = true;

            // Respect the parameter passed to the func
            if (typeof async === 'boolean') {
                isAsync = async;
            }

            try {
                // Send data only if disableTelemetry is false
                if (!this._config.disableTelemetry()) {

                    if (this._buffer.count() > 0) {
                        var payload = this._buffer.getItems();

                        // invoke send
                        this._sender(payload, isAsync);
                    }

                    // update lastSend time to enable throttling
                    this._lastSend = +new Date; // TODO: Does anything use _lastSend?
                } else {
                    this._buffer.clear();
                }

                clearTimeout(this._timeoutHandle);
                this._timeoutHandle = null;
            } catch (e) {
                /* Ignore this error for IE under v10 */
                if (!Util.getIEVersion() || Util.getIEVersion() > 9) {
                    _InternalLogging.throwInternalNonUserActionable(LoggingSeverity.CRITICAL, new _InternalLogMessage(_InternalMessageId.NONUSRACT_TransmissionFailed, "Telemetry transmission failed, some telemetry will be lost: " + Util.getExceptionName(e),
                        { exception: Util.dump(e) }));
                }
            }
        }

        /** Calculates the time to wait before retrying in case of an error based on
         * http://en.wikipedia.org/wiki/Exponential_backoff
         * @param headerValue {string} - Optional header "Retry-After" response header value.
         */
        private _setRetryTime(headerValue?: string) {
            var retryAfterTimeSpan = Date.parse(headerValue);
            if (!(headerValue && retryAfterTimeSpan > 0)) {
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
                retryAfterTimeSpan = Date.now() + (delayInSeconds * 1000);
            }

            // TODO: Log the retry at time like the C# version does.
            this._retryAt = retryAfterTimeSpan - Date.now();
        }

        /**
         * Send XMLHttpRequest
         * @param payload {string} - The data payload to be sent.
         * @param isAsync {boolean} - Indicates if the request should be sent asynchronously
         */
        private _xhrSender(payload: string[], isAsync: boolean) {
            var xhr = new XMLHttpRequest();
            xhr[AjaxMonitor.DisabledPropertyName] = true;
            xhr.open("POST", this._config.endpointUrl(), isAsync);
            xhr.setRequestHeader("Content-type", "application/json");
            xhr.onreadystatechange = () => this._xhrReadyStateChange(xhr, payload, payload.length);
            xhr.onerror = (event: ErrorEvent) => this._onError(payload, xhr.responseText || xhr.response || "", event);

            // compose an array of payloads
            var batch = this._buffer.batchPayloads(payload);
            xhr.send(batch);

            this._buffer.markAsSent(payload);
        }

        /**
         * Send XDomainRequest
         * @param payload {string} - The data payload to be sent.
         * @param isAsync {boolean} - Indicates if the request should be sent asynchronously
         * 
         * Note: XDomainRequest does not support sync requests. This 'isAsync' parameter is added
         * to maintain consistency with the xhrSender's contract
         */
        private _xdrSender(payload: string[], isAsync: boolean) {
            var xdr = new XDomainRequest();
            xdr.onload = () => this._xdrOnLoad(xdr, payload);
            xdr.onerror = (event: ErrorEvent) => this._onError(payload, xdr.responseText || "", event);
            xdr.open('POST', this._config.endpointUrl());

            // compose an array of payloads
            var batch = this._buffer.batchPayloads(payload);
            xdr.send(batch);

            this._buffer.markAsSent(payload);
        }

        /**
         * xhr state changes
         */
        public _xhrReadyStateChange(xhr: XMLHttpRequest, payload: string[], countOfItemsInPayload: number) {
            if (xhr.readyState === 4) {
                if ((xhr.status < 200 || xhr.status >= 300) && xhr.status !== 0) {
                    this._onError(payload, xhr.responseText || xhr.response || "");
                } else {
                    if (xhr.status === 206) {
                        // TODO: check the results of the JSON.parse call and if there was an expected data object in the response.
                        this._onPartialSuccess(payload, JSON.parse(xhr.responseText || xhr.response));
                    } else {
                        this._consecutiveErrors = 0;
                        this._onSuccess(payload, countOfItemsInPayload);
                    }
                }
            }
        }

        /**
         * xdr state changes
         */
        public _xdrOnLoad(xdr: XDomainRequest, payload: string[]) {
            if (xdr && (xdr.responseText + "" === "200" || xdr.responseText === "")) {
                this._consecutiveErrors = 0;
                this._onSuccess(payload, 0);
            } else {
                var results = undefined;
                try {
                    results = JSON.parse(xdr.responseText);
                } catch (e) {
                    // TODO: Log something here?
                }

                if (results && results.itemsReceived && results.itemsReceived > results.itemsAccepted) {
                    this._onPartialSuccess(payload, results);
                } else {
                    this._onError(payload, xdr && xdr.responseText || "");
                }
            }
        }

        /**
         * partial success handler
         */
        public _onPartialSuccess(payload: string[], results: any, retryAfterHeader?: string) {
            var failed = [];
            var retryableError = false;

            // Iterate through the reversed array of errors so that splicing doesn't have invalid indexes after the first item.
            var errors = results.errors.reverse();
            for (var error of errors) {
                var extracted = payload.splice(error.index, 1)[0];
                if (error.statusCode == 408 // Timeout
                    || error.statusCode == 429 // Too many requests.
                    || error.statusCode == 439 // Too many requests over extended time.
                    || error.statusCode == 500 // Internal server error.
                    || error.statusCode == 503 // Service unavailable.
                ) {
                    retryableError = true;
                    this._buffer.enqueue(extracted);
                } else {
                    failed.push(extracted);
                }
            }

            this._onSuccess(payload, results.itemsAccepted);
            this._onError(failed, ['partial success', results.itemsReceived, 'of', results.itemsAccepted].join(' '));
            if (retryableError) {
                this._consecutiveErrors++;
            }

            this._setRetryTime(retryAfterHeader); // TODO: Should I embed this in a _retry() method which internally sets up the timer?
            this._setupTimer();
        }

        /**
         * error handler
         */
        public _onError(payload: string[], message: string, event?: ErrorEvent) {
            _InternalLogging.throwInternalNonUserActionable(LoggingSeverity.WARNING,
                new _InternalLogMessage(_InternalMessageId.NONUSRACT_OnError, "Failed to send telemetry.", { message: message }));

            // TODO: add error handling
            this._buffer.clearSent(payload);
        }

        /**
         * success handler
         */
        public _onSuccess(payload: string[], countOfItemsInPayload: number) {
            DataLossAnalyzer.decrementItemsQueued(countOfItemsInPayload);
            this._buffer.clearSent(payload);
        }
    }

    interface linkedListNode {
        next: linkedListNode;
        payload: string;
    }
}
