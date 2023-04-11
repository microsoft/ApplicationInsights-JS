import dynamicProto from "@microsoft/dynamicproto-js";
import { utlGetSessionStorage, utlSetSessionStorage } from "@microsoft/applicationinsights-common";
import {
    IDiagnosticLogger, _eInternalMessageId, _throwInternal, arrForEach, arrIndexOf, dumpObj, eLoggingSeverity, getExceptionName, getJSON,
    isArray, isFunction, isString
} from "@microsoft/applicationinsights-core-js";
import { ISenderConfig } from "./Interfaces";

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
     * Returns the current size of the serialized buffer
     */
    size: () => number;

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

abstract class BaseSendBuffer {

    protected _get: () => string[];
    protected _set: (buffer: string[]) => string[];

    constructor(logger: IDiagnosticLogger, config: ISenderConfig) {
        let _buffer: string[] = [];
        let _bufferFullMessageSent = false;

        this._get = () => {
            return _buffer;
        };

        this._set = (buffer: string[]) => {
            _buffer = buffer;
            return _buffer;
        };

        dynamicProto(BaseSendBuffer, this, (_self) => {

            _self.enqueue = (payload: string) => {
                if (_self.count() >= config.eventsLimitInMem()) {
                    // sent internal log only once per page view
                    if (!_bufferFullMessageSent) {
                        _throwInternal(logger,
                            eLoggingSeverity.WARNING,
                            _eInternalMessageId.InMemoryStorageBufferFull,
                            "Maximum in-memory buffer size reached: " + _self.count(),
                            true);
                        _bufferFullMessageSent = true;
                    }

                    return;
                }

                _buffer.push(payload);
            };

            _self.count = (): number => {
                return _buffer.length;
            };

            _self.size = (): number => {
                let size = _buffer.length;
                for (let lp = 0; lp < _buffer.length; lp++) {
                    size += _buffer[lp].length;
                }

                if (!config.emitLineDelimitedJson()) {
                    size += 2;
                }

                return size;
            };

            _self.clear = () => {
                _buffer = [];
                _bufferFullMessageSent = false;
            };

            _self.getItems = (): string[] => {
                return _buffer.slice(0)
            };

            _self.batchPayloads = (payload: string[]): string => {
                if (payload && payload.length > 0) {
                    const batch = config.emitLineDelimitedJson() ?
                        payload.join("\n") :
                        "[" + payload.join(",") + "]";
        
                    return batch;
                }
        
                return null;
            };
        });
    }

    public enqueue(payload: string) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public count(): number {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return 0;
    }

    public size(): number {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return 0;
    }

    public clear() {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public getItems(): string[] {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    public batchPayloads(payload: string[]): string {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }
}

/*
 * An array based send buffer.
 */
export class ArraySendBuffer extends BaseSendBuffer implements ISendBuffer {

    constructor(logger: IDiagnosticLogger, config: ISenderConfig) {
        super(logger, config);

        dynamicProto(ArraySendBuffer, this, (_self, _base) => {
        
            _self.markAsSent = (payload: string[]) => {
                _base.clear();
            };
        
            _self.clearSent = (payload: string[]) => {
                // not supported
            };
        });
    }

    public markAsSent(payload: string[]) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public clearSent(payload: string[]) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
}

/*
 * Session storage buffer holds a copy of all unsent items in the browser session storage.
 */
export class SessionStorageSendBuffer extends BaseSendBuffer implements ISendBuffer {
    static BUFFER_KEY = "AI_buffer";
    static SENT_BUFFER_KEY = "AI_sentBuffer";

    // Maximum number of payloads stored in the buffer. If the buffer is full, new elements will be dropped.
    static MAX_BUFFER_SIZE = 2000;

    constructor(logger: IDiagnosticLogger, config: ISenderConfig) {
        super(logger, config);
        let _bufferFullMessageSent = false;
        const { getItem, setItem } = config.bufferOverride() || { getItem: utlGetSessionStorage, setItem: utlSetSessionStorage };

        dynamicProto(SessionStorageSendBuffer, this, (_self, _base) => {
            const bufferItems = _getBuffer(SessionStorageSendBuffer.BUFFER_KEY);
            const notDeliveredItems = _getBuffer(SessionStorageSendBuffer.SENT_BUFFER_KEY);
    
            let buffer = _self._set(bufferItems.concat(notDeliveredItems));
    
            // If the buffer has too many items, drop items from the end.
            if (buffer.length > SessionStorageSendBuffer.MAX_BUFFER_SIZE) {
                buffer.length = SessionStorageSendBuffer.MAX_BUFFER_SIZE;
            }
    
            _setBuffer(SessionStorageSendBuffer.SENT_BUFFER_KEY, []);
            _setBuffer(SessionStorageSendBuffer.BUFFER_KEY, buffer);
    
            _self.enqueue = (payload: string) => {
                if (_self.count() >= SessionStorageSendBuffer.MAX_BUFFER_SIZE) {
                    // sent internal log only once per page view
                    if (!_bufferFullMessageSent) {
                        _throwInternal(logger,
                            eLoggingSeverity.WARNING,
                            _eInternalMessageId.SessionStorageBufferFull,
                            "Maximum buffer size reached: " + _self.count(),
                            true);
                        _bufferFullMessageSent = true;
                    }

                    return;
                }
        
                _base.enqueue(payload);
                _setBuffer(SessionStorageSendBuffer.BUFFER_KEY, _self._get());
            };
       
            _self.clear = () => {
                _base.clear();
                _setBuffer(SessionStorageSendBuffer.BUFFER_KEY, _self._get());
                _setBuffer(SessionStorageSendBuffer.SENT_BUFFER_KEY, []);
        
                _bufferFullMessageSent = false;
            };
        
            _self.markAsSent = (payload: string[]) => {
                _setBuffer(SessionStorageSendBuffer.BUFFER_KEY,
                    _self._set(_removePayloadsFromBuffer(payload, _self._get())));
        
                let sentElements = _getBuffer(SessionStorageSendBuffer.SENT_BUFFER_KEY);
                if (sentElements instanceof Array && payload instanceof Array) {
                    sentElements = sentElements.concat(payload);
        
                    if (sentElements.length > SessionStorageSendBuffer.MAX_BUFFER_SIZE) {
                        // We send telemetry normally. If the SENT_BUFFER is too big we don't add new elements
                        // until we receive a response from the backend and the buffer has free space again (see clearSent method)
                        _throwInternal(logger,
                            eLoggingSeverity.CRITICAL,
                            _eInternalMessageId.SessionStorageBufferFull,
                            "Sent buffer reached its maximum size: " + sentElements.length,
                            true);
        
                        sentElements.length = SessionStorageSendBuffer.MAX_BUFFER_SIZE;
                    }
        
                    _setBuffer(SessionStorageSendBuffer.SENT_BUFFER_KEY, sentElements);
                }
            };
        
            _self.clearSent = (payload: string[]) => {
                let sentElements = _getBuffer(SessionStorageSendBuffer.SENT_BUFFER_KEY);
                sentElements = _removePayloadsFromBuffer(payload, sentElements);
        
                _setBuffer(SessionStorageSendBuffer.SENT_BUFFER_KEY, sentElements);
            };
        
            function _removePayloadsFromBuffer(payloads: string[], buffer: string[]): string[] {
                const remaining: string[] = [];
        
                arrForEach(buffer, (value) => {
                    if (!isFunction(value) && arrIndexOf(payloads, value) === -1) {
                        remaining.push(value);
                    }
                });
        
                return remaining;
            }
        
            function _getBuffer(key: string): string[] {
                let prefixedKey = key;
                try {
                    prefixedKey = config.namePrefix && config.namePrefix() ? config.namePrefix() + "_" + prefixedKey : prefixedKey;
                    const bufferJson = getItem(logger, prefixedKey);
                    if (bufferJson) {
                        let buffer: string[] = getJSON().parse(bufferJson);
                        if (isString(buffer)) {
                            // When using some version prototype.js the stringify / parse cycle does not decode array's correctly
                            buffer = getJSON().parse(buffer as any);
                        }
        
                        if (buffer && isArray(buffer)) {
                            return buffer;
                        }
                    }
                } catch (e) {
                    _throwInternal(logger, eLoggingSeverity.CRITICAL,
                        _eInternalMessageId.FailedToRestoreStorageBuffer,
                        " storage key: " + prefixedKey + ", " + getExceptionName(e),
                        { exception: dumpObj(e) });
                }
        
                return [];
            }
        
            function _setBuffer(key: string, buffer: string[]) {
                let prefixedKey = key;
                try {
                    prefixedKey = config.namePrefix && config.namePrefix() ? config.namePrefix() + "_" + prefixedKey : prefixedKey;
                    const bufferJson = JSON.stringify(buffer);
                    setItem(logger, prefixedKey, bufferJson);
                } catch (e) {
                    // if there was an error, clear the buffer
                    // telemetry is stored in the _buffer array so we won't loose any items
                    setItem(logger, prefixedKey, JSON.stringify([]));
        
                    _throwInternal(logger, eLoggingSeverity.WARNING,
                        _eInternalMessageId.FailedToSetStorageBuffer,
                        " storage key: " + prefixedKey + ", " + getExceptionName(e) + ". Buffer cleared",
                        { exception: dumpObj(e) });
                }
            }
        });
    }

    public enqueue(payload: string) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public clear() {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public markAsSent(payload: string[]) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public clearSent(payload: string[]) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
}
