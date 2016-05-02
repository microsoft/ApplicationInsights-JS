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

        /**
         * Build a batch of all queued elements
         */
        batchPayloads: () => string;
    }

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

        public batchPayloads(): string {
            if (this.count() > 0) {
                var batch = this._config.emitLineDelimitedJson() ?
                    this._buffer.join("\n") :
                    "[" + this._buffer.join(",") + "]";

                return batch;
            }

            return null;
        }
    }

    export class SessionStorageSendBuffer implements ISendBuffer {
        static SEND_BUFFER_KEY = "AI_sendBuffer";

        // An in-memory copy of the buffer. A copy is saved to the session store on enqueue and clear. 
        // The buffer is restored in constructor and will contain un-sent events from previous page.
        private _buffer: string[];
        private _config: ISenderConfig;

        constructor(config: ISenderConfig) {
            this._config = config;
            this._buffer = this.getBuffer();
        }

        public enqueue(payload: string) {
            this._buffer.push(payload);
            this.setBuffer(this._buffer);
        }

        public count(): number {
            return this._buffer.length;
        }

        public clear() {
            this._buffer.length = 0;
            this.setBuffer([]);
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

        private getBuffer(): string[] {
            var bufferJson = Util.getSessionStorage(SessionStorageSendBuffer.SEND_BUFFER_KEY);

            if (bufferJson) {
                return JSON.parse(bufferJson);
            }

            return [];
        }

        private setBuffer(buffer: string[]) {
            var bufferJson = JSON.stringify(buffer);
            Util.setSessionStorage(SessionStorageSendBuffer.SEND_BUFFER_KEY, bufferJson);
        }
    }
}