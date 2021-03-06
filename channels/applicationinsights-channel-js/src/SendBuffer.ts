import { utlGetSessionStorage, utlSetSessionStorage } from '@microsoft/applicationinsights-common';
import { IDiagnosticLogger, LoggingSeverity, _InternalMessageId, getJSON, arrForEach, isFunction, arrIndexOf, isString, dumpObj, isArray, getExceptionName } from '@microsoft/applicationinsights-core-js';
import { ISenderConfig } from './Interfaces';
import dynamicProto from '@microsoft/dynamicproto-js';

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

    constructor(config: ISenderConfig) {
        let _buffer: string[] = [];

        dynamicProto(ArraySendBuffer, this, (_self) => {
            _self.enqueue = (payload: string) => {
                _buffer.push(payload);
            };
        
            _self.count = (): number => {
                return _buffer.length;
            };
        
            _self.clear = () => {
                _buffer.length = 0;
            };
        
            _self.getItems = (): string[] => {
                return _buffer.slice(0);
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
        
            _self.markAsSent = (payload: string[]) => {
                _self.clear();
            };
        
            _self.clearSent = (payload: string[]) => {
                // not supported
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
export class SessionStorageSendBuffer implements ISendBuffer {
    static BUFFER_KEY = "AI_buffer";
    static SENT_BUFFER_KEY = "AI_sentBuffer";

    // Maximum number of payloads stored in the buffer. If the buffer is full, new elements will be dropped.
    static MAX_BUFFER_SIZE = 2000;

    constructor(logger: IDiagnosticLogger, config: ISenderConfig) {
        let _bufferFullMessageSent = false;

        // An in-memory copy of the buffer. A copy is saved to the session storage on enqueue() and clear().
        // The buffer is restored in a constructor and contains unsent events from a previous page.
        let _buffer: string[];

        dynamicProto(SessionStorageSendBuffer, this, (_self) => {
            const bufferItems = _getBuffer(SessionStorageSendBuffer.BUFFER_KEY);
            const notDeliveredItems = _getBuffer(SessionStorageSendBuffer.SENT_BUFFER_KEY);
    
            _buffer = bufferItems.concat(notDeliveredItems);
    
            // If the buffer has too many items, drop items from the end.
            if (_buffer.length > SessionStorageSendBuffer.MAX_BUFFER_SIZE) {
                _buffer.length = SessionStorageSendBuffer.MAX_BUFFER_SIZE;
            }
    
            _setBuffer(SessionStorageSendBuffer.SENT_BUFFER_KEY, []);
            _setBuffer(SessionStorageSendBuffer.BUFFER_KEY, _buffer);
    
            _self.enqueue = (payload: string) => {
                if (_buffer.length >= SessionStorageSendBuffer.MAX_BUFFER_SIZE) {
                    // sent internal log only once per page view
                    if (!_bufferFullMessageSent) {
                        logger.throwInternal(
                            LoggingSeverity.WARNING,
                            _InternalMessageId.SessionStorageBufferFull,
                            "Maximum buffer size reached: " + _buffer.length,
                            true);
                        _bufferFullMessageSent = true;
                    }

                    return;
                }
        
                _buffer.push(payload);
                _setBuffer(SessionStorageSendBuffer.BUFFER_KEY, _buffer);
            };
        
            _self.count = (): number => {
                return _buffer.length;
            };
        
            _self.clear = () => {
                _buffer = [];
                _setBuffer(SessionStorageSendBuffer.BUFFER_KEY, []);
                _setBuffer(SessionStorageSendBuffer.SENT_BUFFER_KEY, []);
        
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
        
            _self.markAsSent = (payload: string[]) => {
                _buffer = _removePayloadsFromBuffer(payload, _buffer);
                _setBuffer(SessionStorageSendBuffer.BUFFER_KEY, _buffer);
        
                let sentElements = _getBuffer(SessionStorageSendBuffer.SENT_BUFFER_KEY);
                if (sentElements instanceof Array && payload instanceof Array) {
                    sentElements = sentElements.concat(payload);
        
                    if (sentElements.length > SessionStorageSendBuffer.MAX_BUFFER_SIZE) {
                        // We send telemetry normally. If the SENT_BUFFER is too big we don't add new elements
                        // until we receive a response from the backend and the buffer has free space again (see clearSent method)
                        logger.throwInternal(
                            LoggingSeverity.CRITICAL,
                            _InternalMessageId.SessionStorageBufferFull,
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
            }
        
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
                    const bufferJson = utlGetSessionStorage(logger, prefixedKey);
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
                    logger.throwInternal(LoggingSeverity.CRITICAL,
                        _InternalMessageId.FailedToRestoreStorageBuffer,
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
                    utlSetSessionStorage(logger, prefixedKey, bufferJson);
                } catch (e) {
                    // if there was an error, clear the buffer
                    // telemetry is stored in the _buffer array so we won't loose any items
                    utlSetSessionStorage(logger, prefixedKey, JSON.stringify([]));
        
                    logger.throwInternal(LoggingSeverity.WARNING,
                        _InternalMessageId.FailedToSetStorageBuffer,
                        " storage key: " + prefixedKey + ", " + getExceptionName(e) + ". Buffer cleared",
                        { exception: dumpObj(e) });
                }
            }
        });
    }

    public enqueue(payload: string) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public count(): number {
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

    public markAsSent(payload: string[]) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public clearSent(payload: string[]) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
}