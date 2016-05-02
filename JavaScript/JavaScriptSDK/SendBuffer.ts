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

        private _config: ISenderConfig;

        constructor(config: ISenderConfig) {
            this._config = config;
        }

        public enqueue(payload: string) {
            var buffer = this.getBuffer();

            if (buffer) {
                buffer.push(payload);
                this.setBuffer(buffer);
            }
        }

        public count(): number {
            var buffer = this.getBuffer();

            return buffer ? buffer.length : 0;
        }

        public clear() {
            this.setBuffer([]);
        }

        public batchPayloads(): string {
            var buffer = this.getBuffer();

            if (buffer && buffer.length > 0) {
                var batch = this._config.emitLineDelimitedJson() ?
                    buffer.join("\n") :
                    "[" + buffer.join(",") + "]";

                return batch;
            }

            return null;
        }

        private getBuffer(): string[] {
            var bufferJson = Util.getSessionStorage(SessionStorageSendBuffer.SEND_BUFFER_KEY);
            return JSON.parse(bufferJson);
        }

        private setBuffer(buffer: string[]) {
            var bufferJson = JSON.stringify(buffer);
            Util.setSessionStorage(SessionStorageSendBuffer.SEND_BUFFER_KEY, bufferJson);
        }
    }
}