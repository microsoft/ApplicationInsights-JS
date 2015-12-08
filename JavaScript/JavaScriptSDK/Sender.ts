/// <reference path="serializer.ts" />
/// <reference path="Telemetry/Common/Envelope.ts"/>
/// <reference path="Telemetry/Common/Base.ts" />
/// <reference path="Contracts/Generated/ContextTagKeys.ts"/>
/// <reference path="Context/Application.ts"/>
/// <reference path="Context/Device.ts"/>
/// <reference path="Context/Internal.ts"/>
/// <reference path="Context/Location.ts"/>
/// <reference path="Context/Operation.ts"/>
/// <reference path="Context/Sample.ts"/>
/// <reference path="Context/Session.ts"/>
/// <reference path="Context/User.ts"/>
/// <reference path="ajax/ajax.ts"/>

interface XDomainRequest extends XMLHttpRequestEventTarget {
    responseText: string;
    send(payload: string);
    open(method: string, url: string);
};

declare var XDomainRequest: {
    prototype: XDomainRequest;
    new (): XDomainRequest;
    create(): XDomainRequest;
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
    }

    export class Sender {
        private _buffer: string[];
        private _lastSend: number;
        private _timeoutHandle: any;

        /**
         * The configuration for this sender instance
         */
        public _config: ISenderConfig;

        /**
         * A method which will cause data to be send to the url
         */
        public _sender: (payload: string, isAsync: boolean) => void;

        /**
         * Constructs a new instance of the Sender class
         */
        constructor(config: ISenderConfig) {
            this._buffer = [];
            this._lastSend = 0;
            this._config = config;
            this._sender = null;
            if (typeof XMLHttpRequest != "undefined") {
                var testXhr = new XMLHttpRequest();
                if ("withCredentials" in testXhr) {
                    this._sender = this._xhrSender;
                } else if (typeof XDomainRequest !== "undefined") {
                    this._sender = this._xdrSender; //IE 8 and 9
                }
            }
        }

        /**
         * Add a telemetry item to the send buffer
         */
        public send(envelope: Telemetry.Common.Envelope) {
            try {
                // if master off switch is set, don't send any data
                if (this._config.disableTelemetry()) {
                    // Do not send/save data
                    return;
                }
        
                // validate input
                if (!envelope) {
                    _InternalLogging.throwInternalNonUserActionable(LoggingSeverity.CRITICAL, "Cannot send empty telemetry");
                    return;
                }

                // ensure a sender was constructed
                if (!this._sender) {
                    _InternalLogging.throwInternalNonUserActionable(LoggingSeverity.CRITICAL, "Sender was not initialized");
                    return;
                }
            
                // check if the incoming payload is too large, truncate if necessary
                var payload: string = Serializer.serialize(envelope);
            
                // flush if we would exceet the max-size limit by adding this item
                if (this._getSizeInBytes(this._buffer) + payload.length > this._config.maxBatchSizeInBytes()) {
                    this.triggerSend();
                }

                // enqueue the payload
                this._buffer.push(payload);

                // ensure an invocation timeout is set
                if (!this._timeoutHandle) {
                    this._timeoutHandle = setTimeout(() => {
                        this._timeoutHandle = null;
                        this.triggerSend();
                    }, this._config.maxBatchInterval());
                }
            } catch (e) {
                _InternalLogging.throwInternalNonUserActionable(LoggingSeverity.CRITICAL, "Failed adding telemetry to the sender's buffer, some telemetry will be lost: " + Util.dump(e));
            }
        }

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

                    if (this._buffer.length) {
                        // compose an array of payloads
                        var batch = this._config.emitLineDelimitedJson() ?
                            this._buffer.join("\n") :
                            "[" + this._buffer.join(",") + "]";

                        // invoke send
                        this._sender(batch, isAsync);
                    }

                    // update lastSend time to enable throttling
                    this._lastSend = +new Date;
                }

                // clear buffer
                this._buffer.length = 0;
                clearTimeout(this._timeoutHandle);
                this._timeoutHandle = null;
            } catch (e) {
                _InternalLogging.throwInternalNonUserActionable(LoggingSeverity.CRITICAL, "Telemetry transmission failed, some telemetry will be lost: " + Util.dump(e));
            }
        }

        /**
         * Send XMLHttpRequest
         * @param payload {string} - The data payload to be sent.
         * @param isAsync {boolean} - Indicates if the request should be sent asynchronously
         */
        private _xhrSender(payload: string, isAsync: boolean) {
            var xhr = new XMLHttpRequest();
            xhr[AjaxMonitor.DisabledPropertyName] = true;
            xhr.open("POST", this._config.endpointUrl(), isAsync);
            xhr.setRequestHeader("Content-type", "application/json");
            xhr.onreadystatechange = () => Sender._xhrReadyStateChange(xhr, payload);
            xhr.onerror = (event: ErrorEvent) => Sender._onError(payload, xhr.responseText || xhr.response || "", event);
            xhr.send(payload);
        }

        /**
         * Send XDomainRequest
         * @param payload {string} - The data payload to be sent.
         * @param isAsync {boolean} - Indicates if the request should be sent asynchronously
         * 
         * Note: XDomainRequest does not support sync requests. This 'isAsync' parameter is added
         * to maintain consistency with the xhrSender's contract
         */
        private _xdrSender(payload: string, isAsync: boolean) {
            var xdr = new XDomainRequest();
            xdr.onload = () => Sender._xdrOnLoad(xdr, payload);
            xdr.onerror = (event: ErrorEvent) => Sender._onError(payload, xdr.responseText || "", event);
            xdr.open('POST', this._config.endpointUrl());
            xdr.send(payload);
        }

        /**
         * xhr state changes
         */
        public static _xhrReadyStateChange(xhr: XMLHttpRequest, payload: string) {
            if (xhr.readyState === 4) {
                if ((xhr.status < 200 || xhr.status >= 300) && xhr.status !== 0) {
                    Sender._onError(payload, xhr.responseText || xhr.response || "");
                } else {
                    Sender._onSuccess(payload);
                }
            }
        }

        /**
         * xdr state changes
         */
        public static _xdrOnLoad(xdr: XDomainRequest, payload: string) {
            if (xdr && (xdr.responseText + "" === "200" || xdr.responseText === "")) {
                Sender._onSuccess(payload);
            } else {
                Sender._onError(payload, xdr && xdr.responseText || "");
            }
        }

        /**
         * error handler
         */
        public static _onError(payload: string, message: string, event?: ErrorEvent) {
            _InternalLogging.throwInternalNonUserActionable(LoggingSeverity.WARNING, "Failed to send telemetry:\n" + message);
        }

        /**
         * success handler
         */
        public static _onSuccess(payload: string) {
            // no-op, used in tests
        }
    }

    interface linkedListNode {
        next: linkedListNode;
        payload: string;
    }
}
