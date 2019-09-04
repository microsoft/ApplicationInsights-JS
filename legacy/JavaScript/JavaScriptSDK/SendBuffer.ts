// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/// <reference path="Serializer.ts" />
/// <reference path="Telemetry/Common/Envelope.ts"/>
/// <reference path="Telemetry/Common/Base.ts" />
/// <reference path="../JavaScriptSDK.Interfaces/Contracts/Generated/ContextTagKeys.ts"/>
/// <reference path="Context/Application.ts"/>
/// <reference path="Context/Device.ts"/>
/// <reference path="Context/Internal.ts"/>
/// <reference path="Context/Location.ts"/>
/// <reference path="Context/Operation.ts"/>
/// <reference path="Context/Sample.ts"/>
/// <reference path="Context/Session.ts"/>
/// <reference path="Context/User.ts"/>
/// <reference path="ajax/ajax.ts"/>

module Microsoft.ApplicationInsights {
    "use strict";

    export interface ISendBuffer {
        /**
         * Enqueue the payload
         */
        enqueue: (payload: string) => void;

        /**
         * Returns the number of elements in the buffer
         */
        count: () => number;

        /**
         * Clears the buffer
         */
        clear: () => void;

        /**
         * Returns items stored in the buffer
         */
        getItems: () => string[];

        /**
         * Build a batch of all elements in the payload array
         */
        batchPayloads: (payload: string[]) => string;

        /**
         * Moves items to the SENT_BUFFER.
         * The buffer holds items which were sent, but we haven't received any response from the backend yet. 
         */
        markAsSent: (payload: string[]) => void;

        /**
         * Removes items from the SENT_BUFFER. Should be called on successful response from the backend. 
         */
        clearSent: (payload: string[]) => void;
    }

    /*
     * An array based send buffer. 
     */
    export class ArraySendBuffer implements ISendBuffer {
        private _config: ISenderConfig;
        private _buffer: string[];

        constructor(config: ISenderConfig) {
            this._config = config;

            this._buffer = [];
        }

        public enqueue(payload: string) {
            this._buffer.push(payload);
        }

        public count(): number {
            return this._buffer.length;
        }

        public clear() {
            this._buffer.length = 0;
        }

        public getItems(): string[] {
            return this._buffer.slice(0);
        }

        public batchPayloads(payload: string[]): string {
            if (payload && payload.length > 0) {
                var batch = this._config.emitLineDelimitedJson() ?
                    payload.join("\n") :
                    "[" + payload.join(",") + "]";

                return batch;
            }

            return null;
        }

        public markAsSent(payload: string[]) {
            this.clear();
        }

        public clearSent(payload: string[]) {
            // not supported
        }
    }

    /*
     * Session storege buffer holds a copy of all unsent items in the browser session storage.
     */
    export class SessionStorageSendBuffer implements ISendBuffer {
        static BUFFER_KEY = "AI_buffer";
        static SENT_BUFFER_KEY = "AI_sentBuffer";

        // Maximum number of payloads stored in the buffer. If the buffer is full, new elements will be dropped. 
        static MAX_BUFFER_SIZE = 2000;
        private _bufferFullMessageSent = false;

        // An in-memory copy of the buffer. A copy is saved to the session storage on enqueue() and clear(). 
        // The buffer is restored in a constructor and contains unsent events from a previous page.
        private _buffer: string[];
        private _config: ISenderConfig;

        constructor(config: ISenderConfig) {
            this._config = config;

            var bufferItems = this.getBuffer(SessionStorageSendBuffer.BUFFER_KEY);
            var notDeliveredItems = this.getBuffer(SessionStorageSendBuffer.SENT_BUFFER_KEY);

            this._buffer = bufferItems.concat(notDeliveredItems);

            // If the buffer has too many items, drop items from the end.
            if (this._buffer.length > SessionStorageSendBuffer.MAX_BUFFER_SIZE) {
                this._buffer.length = SessionStorageSendBuffer.MAX_BUFFER_SIZE;
            }

            // update DataLossAnalyzer with the number of recovered items
            // Uncomment if you want to use DataLossanalyzer
            // DataLossAnalyzer.itemsRestoredFromSessionBuffer = this._buffer.length;

            this.setBuffer(SessionStorageSendBuffer.SENT_BUFFER_KEY, []);
            this.setBuffer(SessionStorageSendBuffer.BUFFER_KEY, this._buffer);
        }

        public enqueue(payload: string) {
            if (this._buffer.length >= SessionStorageSendBuffer.MAX_BUFFER_SIZE) {
                // sent internal log only once per page view
                if (!this._bufferFullMessageSent) {
                    _InternalLogging.throwInternal(
                        LoggingSeverity.WARNING,
                        _InternalMessageId.SessionStorageBufferFull,
                        "Maximum buffer size reached: " + this._buffer.length,
                        true);
                    this._bufferFullMessageSent = true;
                }
                return;
            }

            this._buffer.push(payload);
            this.setBuffer(SessionStorageSendBuffer.BUFFER_KEY, this._buffer);
        }

        public count(): number {
            return this._buffer.length;
        }

        public clear() {
            this._buffer.length = 0;
            this.setBuffer(SessionStorageSendBuffer.BUFFER_KEY, []);
            this.setBuffer(SessionStorageSendBuffer.SENT_BUFFER_KEY, []);

            this._bufferFullMessageSent = false;
        }

        public getItems(): string[] {
            return this._buffer.slice(0)
        }

        public batchPayloads(payload: string[]): string {
            if (payload && payload.length > 0) {
                var batch = this._config.emitLineDelimitedJson() ?
                    payload.join("\n") :
                    "[" + payload.join(",") + "]";

                return batch;
            }

            return null;
        }

        public markAsSent(payload: string[]) {
            this._buffer = this.removePayloadsFromBuffer(payload, this._buffer);
            this.setBuffer(SessionStorageSendBuffer.BUFFER_KEY, this._buffer);

            var sentElements = this.getBuffer(SessionStorageSendBuffer.SENT_BUFFER_KEY);
            if (sentElements instanceof Array && payload instanceof Array) {
                sentElements = sentElements.concat(payload);

                if (sentElements.length > SessionStorageSendBuffer.MAX_BUFFER_SIZE) {
                    // We send telemetry normally. If the SENT_BUFFER is too big we don't add new elements
                    // until we receive a response from the backend and the buffer has free space again (see clearSent method)
                    _InternalLogging.throwInternal(
                        LoggingSeverity.CRITICAL,
                        _InternalMessageId.SessionStorageBufferFull,
                        "Sent buffer reached its maximum size: " + sentElements.length,
                        true);

                    sentElements.length = SessionStorageSendBuffer.MAX_BUFFER_SIZE;
                }

                this.setBuffer(SessionStorageSendBuffer.SENT_BUFFER_KEY, sentElements);
            }
        }

        public clearSent(payload: string[]) {
            var sentElements = this.getBuffer(SessionStorageSendBuffer.SENT_BUFFER_KEY);
            sentElements = this.removePayloadsFromBuffer(payload, sentElements);

            this.setBuffer(SessionStorageSendBuffer.SENT_BUFFER_KEY, sentElements);
        }

        private removePayloadsFromBuffer(payloads: string[], buffer: string[]): string[] {
            var remaining: string[] = [];

            for (var i in buffer) {
                var contains = false;
                for (var j in payloads) {
                    if (payloads[j] === buffer[i]) {
                        contains = true;
                        break;
                    }
                }

                if (!contains) {
                    remaining.push(buffer[i]);
                }
            };

            return remaining;
        }

        private getBuffer(key: string): string[] {
            try {
                var bufferJson = Util.getSessionStorage(key);
                if (bufferJson) {
                    var buffer: string[] = JSON.parse(bufferJson);
                    if (buffer) {
                        return buffer;
                    }
                }
            } catch (e) {
                _InternalLogging.throwInternal(LoggingSeverity.CRITICAL,
                    _InternalMessageId.FailedToRestoreStorageBuffer,
                        " storage key: " + key + ", " + Util.getExceptionName(e),
                        { exception: Util.dump(e) });
            }

            return [];
        }

        private setBuffer(key: string, buffer: string[]) {
            try {
                var bufferJson = JSON.stringify(buffer);
                Util.setSessionStorage(key, bufferJson);
            } catch (e) {
                // if there was an error, clear the buffer
                // telemetry is stored in the _buffer array so we won't loose any items
                Util.setSessionStorage(key, JSON.stringify([]));

                _InternalLogging.throwInternal(LoggingSeverity.WARNING,
                    _InternalMessageId.FailedToSetStorageBuffer,
                        " storage key: " + key + ", " + Util.getExceptionName(e) + ". Buffer cleared",
                        { exception: Util.dump(e) });
            }
        }
    }
}