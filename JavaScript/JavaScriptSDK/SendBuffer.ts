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
/// <reference path="DataLossAnalyzer.ts"/>

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

        getItems: () => string[];

        /**
         * Build a batch of all queued elements
         */
        batchPayloads: () => string;

        /**
         * Moves items to the SENT_BUFFER.
         * The buffer holds items which were sent, but we haven't received any response from the backend for them yet. 
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
            return this._buffer;
        }

        public batchPayloads(): string {
            if (this.count() > 0) {
                var batch = this._config.emitLineDelimitedJson() ?
                    this._buffer.join("\n") :
                    "[" + this._buffer.join(",") + "]";

                return batch;
            }

            return null;
        }

        public markAsSent(payload: string[]) {
            this.clear();
        }

        public clearSent(payload: string[]) {
            // already cleared
        }
    }

    /*
     * Session storege buffer holds a copy of all unsent items in the browser session storage.
     */
    export class SessionStorageSendBuffer implements ISendBuffer {
        static BUFFER_KEY = "AI_buffer";
        static SENT_BUFFER_KEY = "AI_sentBuffer";

        // An in-memory copy of the buffer. A copy is saved to the session storage on enqueue() and clear(). 
        // The buffer is restored in a constructor and contains unsent events from a previous page.
        private _buffer: string[];
        private _config: ISenderConfig;

        constructor(config: ISenderConfig) {
            this._config = config;

            var bufferItems = this.getBuffer(SessionStorageSendBuffer.BUFFER_KEY);
            var notDeliveredItems = this.getBuffer(SessionStorageSendBuffer.SENT_BUFFER_KEY);

            this._buffer = bufferItems.concat(notDeliveredItems);

            this.setBuffer(SessionStorageSendBuffer.BUFFER_KEY, this._buffer);
            this.setBuffer(SessionStorageSendBuffer.SENT_BUFFER_KEY, []);
        }

        public enqueue(payload: string) {
            this._buffer.push(payload);
            this.setBuffer(SessionStorageSendBuffer.BUFFER_KEY, this._buffer);
        }

        public count(): number {
            return this._buffer.length;
        }

        public clear() {
            this._buffer.length = 0;
            this.setBuffer(SessionStorageSendBuffer.BUFFER_KEY, []);
        }

        public getItems(): string[] {
            return this._buffer;
        }

        public batchPayloads(): string {
            if (this._buffer && this._buffer.length > 0) {
                var batch = this._config.emitLineDelimitedJson() ?
                    this._buffer.join("\n") :
                    "[" + this._buffer.join(",") + "]";

                return batch;
            }

            return null;
        }

        public markAsSent(payload: string[]) {
            var sentElements = this.getBuffer(SessionStorageSendBuffer.SENT_BUFFER_KEY);
            sentElements = sentElements.concat(payload);

            this._buffer = this.removePayloadsFromBuffer(payload, this._buffer);

            this.setBuffer(SessionStorageSendBuffer.BUFFER_KEY, this._buffer);
            this.setBuffer(SessionStorageSendBuffer.SENT_BUFFER_KEY, sentElements);
        }

        public clearSent(payload: string[]) {
            var sentElements = this.getBuffer(SessionStorageSendBuffer.SENT_BUFFER_KEY); 
            sentElements = this.removePayloadsFromBuffer(payload, sentElements);

            this.setBuffer(SessionStorageSendBuffer.SENT_BUFFER_KEY, sentElements);
        }

        private removePayloadsFromBuffer(payloads: string[], buffer: string[]): string[] {
            var cleared: string[] = [];

            buffer.forEach((item) => {
                if (!payloads.some(p => p == item)) {
                    cleared.push(item);
                }
            });

            return cleared;
        }

        private getBuffer(key: string): string[] {
            var bufferJson = Util.getSessionStorage(key);

            if (bufferJson) {
                var buffer: string[] = JSON.parse(bufferJson);
                if (buffer) {
                    return buffer;
                }
            }

            return [];
        }

        private setBuffer(key: string, buffer: string[]) {
            var bufferJson = JSON.stringify(buffer);
            Util.setSessionStorage(key, bufferJson);
        }
    }
}