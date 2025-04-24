import dynamicProto from "@microsoft/dynamicproto-js";
import { utlGetSessionStorage, utlRemoveSessionStorage, utlSetSessionStorage } from "@microsoft/applicationinsights-common";
import {
    IDiagnosticLogger, _eInternalMessageId, _throwInternal, arrForEach, arrIndexOf, dumpObj, eLoggingSeverity, getExceptionName, getJSON,
    isArray, isFunction, isNullOrUndefined, isString
} from "@microsoft/applicationinsights-core-js";
import { IInternalStorageItem, ISenderConfig } from "./Interfaces";

/**
 * Before 3.1.2, payload only allow string
 * After 3.2.0,  IInternalStorageItem is accepted
 */
export interface ISendBuffer {

    /**
     * Enqueue the payload
     */
    enqueue: (payload: IInternalStorageItem) => void;

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
    getItems: () => IInternalStorageItem[];

    /**
     * Build a batch of all elements in the payload array
     */
    batchPayloads: (payload: IInternalStorageItem[]) => string;

    /**
     * Moves items to the SENT_BUFFER.
     * The buffer holds items which were sent, but we haven't received any response from the backend yet.
     */
    markAsSent: (payload: IInternalStorageItem[]) => void;

    /**
     * Removes items from the SENT_BUFFER. Should be called on successful response from the backend.
     */
    clearSent: (payload: IInternalStorageItem[]) => void;

     /**
     * Copy current buffer items to a new buffer.
     * if canUseSessionStorage is undefined, it will set to false.
     * if newLogger and newConfig are undefined, current logger and empty config will be used.
     * if canUseSessionStorage is set to true, new SessionStorageSendBuffer will be returned otherwise ArraySendBuffer will be returned.
     */
     createNew: (newLogger?: IDiagnosticLogger, newConfig?: ISenderConfig, canUseSessionStorage?: boolean) => ArraySendBuffer | SessionStorageSendBuffer;
}

abstract class BaseSendBuffer {

    protected _get: () => IInternalStorageItem[];
    protected _set: (buffer: IInternalStorageItem[]) => IInternalStorageItem[];

    constructor(logger: IDiagnosticLogger, config: ISenderConfig) {
        let _buffer: IInternalStorageItem[] = [];
        let _bufferFullMessageSent = false;
        let _maxRetryCnt = config.maxRetryCnt;

        this._get = () => {
            return _buffer;
        };

        this._set = (buffer: IInternalStorageItem[]) => {
            _buffer = buffer;
            return _buffer;
        };

        dynamicProto(BaseSendBuffer, this, (_self) => {

            _self.enqueue = (payload: IInternalStorageItem) => {
                if (_self.count() >= config.eventsLimitInMem) {
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
         
                payload.cnt = payload.cnt || 0;
                // max retry is defined, and max retry is reached, do not add the payload to buffer
                if (!isNullOrUndefined(_maxRetryCnt)) {
                    if (payload.cnt > _maxRetryCnt) {
                        // TODO: add log here on dropping payloads
                        // will log statsbeat exception later here
                        
                        return;
                    }
                }
                _buffer.push(payload);

                return;

                
            };

            _self.count = (): number => {
                return _buffer.length;
            };

            _self.size = (): number => {
                let size = _buffer.length;
                for (let lp = 0; lp < _buffer.length; lp++) {
                    size += (_buffer[lp].item).length;
                }

                if (!config.emitLineDelimitedJson) {
                    size += 2;
                }

                return size;
            };

            _self.clear = () => {
                _buffer = [];
                _bufferFullMessageSent = false;
            };

            _self.getItems = (): IInternalStorageItem[] => {
                return _buffer.slice(0)
            };

            _self.batchPayloads = (payloads: IInternalStorageItem[]): string => {
                if (payloads && payloads.length > 0) {
                    let payloadStr: string[] = [];
                    arrForEach(payloads, (payload) => {
                        payloadStr.push(payload.item);
                    })
                    const batch = config.emitLineDelimitedJson ?
                        payloadStr.join("\n") :
                        "[" + payloadStr.join(",") + "]";
        
                    return batch;
                }
        
                return null;
            };

            _self.createNew = (newLogger?: IDiagnosticLogger, newConfig?: ISenderConfig, canUseSessionStorage?: boolean): ArraySendBuffer | SessionStorageSendBuffer => {
                let items = _buffer.slice(0);
                newLogger = newLogger || logger;
                newConfig = newConfig || {} as ISenderConfig;
                let newBuffer = !!canUseSessionStorage? new SessionStorageSendBuffer(newLogger, newConfig) : new ArraySendBuffer(newLogger, newConfig);
                arrForEach(items, (payload) => {
                    newBuffer.enqueue(payload);
                });
                return newBuffer;
            }
        });
    }

    public enqueue(payload: IInternalStorageItem) {
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

    public getItems(): IInternalStorageItem[] {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    public batchPayloads(payload: IInternalStorageItem[]): string {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    public createNew(newLogger?: IDiagnosticLogger, newConfig?: ISenderConfig, canUseSessionStorage?: boolean): ArraySendBuffer | SessionStorageSendBuffer {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null
    }
}

/*
 * An array based send buffer.
 */
export class ArraySendBuffer extends BaseSendBuffer implements ISendBuffer {

    constructor(logger: IDiagnosticLogger, config: ISenderConfig) {
        super(logger, config);

        dynamicProto(ArraySendBuffer, this, (_self, _base) => {
        
            _self.markAsSent = (payload: IInternalStorageItem[]) => {
                _base.clear();
            };
        
            _self.clearSent = (payload: IInternalStorageItem[]) => {
                // not supported
            };
        });
    }

    public markAsSent(payload: IInternalStorageItem[]) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public clearSent(payload: IInternalStorageItem[]) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
}

const PREVIOUS_KEYS: string[] = ["AI_buffer", "AI_sentBuffer"];

/*
 * Session storage buffer holds a copy of all unsent items in the browser session storage.
 */
export class SessionStorageSendBuffer extends BaseSendBuffer implements ISendBuffer {
    static VERSION = "_1";
    static BUFFER_KEY = "AI_buffer"+ this.VERSION;
    static SENT_BUFFER_KEY = "AI_sentBuffer" + this.VERSION;

    // Maximum number of payloads stored in the buffer. If the buffer is full, new elements will be dropped.
    static MAX_BUFFER_SIZE = 2000;

    constructor(logger: IDiagnosticLogger, config: ISenderConfig) {
        super(logger, config);
        let _bufferFullMessageSent = false;
        //Note: should not use config.namePrefix directly, because it will always refers to the latest namePrefix
        let _namePrefix = config?.namePrefix;
        // TODO: add remove buffer override as well
        const { getItem, setItem } = config.bufferOverride || { getItem: utlGetSessionStorage, setItem: utlSetSessionStorage };
        let _maxRetryCnt = config.maxRetryCnt;

        dynamicProto(SessionStorageSendBuffer, this, (_self, _base) => {
            const bufferItems = _getBuffer(SessionStorageSendBuffer.BUFFER_KEY);
            const itemsInSentBuffer = _getBuffer(SessionStorageSendBuffer.SENT_BUFFER_KEY);
            let previousItems = _getPreviousEvents();
            const notDeliveredItems = itemsInSentBuffer.concat(previousItems);
    
            let buffer = _self._set(bufferItems.concat(notDeliveredItems));
            
            // If the buffer has too many items, drop items from the end.
            if (buffer.length > SessionStorageSendBuffer.MAX_BUFFER_SIZE) {
                buffer.length = SessionStorageSendBuffer.MAX_BUFFER_SIZE;
            }
            _setBuffer(SessionStorageSendBuffer.SENT_BUFFER_KEY, []);
            _setBuffer(SessionStorageSendBuffer.BUFFER_KEY, buffer);

    
            _self.enqueue = (payload: IInternalStorageItem) => {
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
                payload.cnt = payload.cnt || 0;
                // max retry is defined, and max retry is reached, do not add the payload to buffer
                if (!isNullOrUndefined(_maxRetryCnt)) {
                    if (payload.cnt > _maxRetryCnt) {
                        // TODO: add log here on dropping payloads
                        return;
                    }
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
        
            _self.markAsSent = (payload: IInternalStorageItem[]) => {
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
        
            _self.clearSent = (payload: IInternalStorageItem[]) => {
                let sentElements = _getBuffer(SessionStorageSendBuffer.SENT_BUFFER_KEY);
                sentElements = _removePayloadsFromBuffer(payload, sentElements);
        
                _setBuffer(SessionStorageSendBuffer.SENT_BUFFER_KEY, sentElements);
            };

            _self.createNew = (newLogger?: IDiagnosticLogger, newConfig?: ISenderConfig, canUseSessionStorage?: boolean) => {
                canUseSessionStorage = !!canUseSessionStorage;
                let unsentItems = _self._get().slice(0);
                let sentItems = _getBuffer(SessionStorageSendBuffer.SENT_BUFFER_KEY).slice(0);
                newLogger = newLogger || logger;
                newConfig = newConfig || {} as ISenderConfig;
                
                // to make sure that we do not send duplicated payloads when it is switched back to previous one
                _self.clear();
                let newBuffer = canUseSessionStorage? new SessionStorageSendBuffer(newLogger, newConfig) : new ArraySendBuffer(newLogger, newConfig);
                arrForEach(unsentItems, (payload) => {
                    newBuffer.enqueue(payload);
                });
                if (canUseSessionStorage) {
                    // arr buffer will clear all payloads if markAsSent() is called
                    newBuffer.markAsSent(sentItems);
                }
                return newBuffer;
            };
        
            function _removePayloadsFromBuffer(payloads: IInternalStorageItem[], buffer: IInternalStorageItem[]): IInternalStorageItem[] {
                const remaining: IInternalStorageItem[] = [];
                let payloadStr: string[] = [];
                arrForEach(payloads, (payload) => {
                    payloadStr.push(payload.item);
                });
                arrForEach(buffer, (value) => {
                    if (!isFunction(value) && arrIndexOf(payloadStr, value.item) === -1) {
                        remaining.push(value);
                    }
                });
        
                return remaining;
            }
        
            function _getBuffer(key: string): IInternalStorageItem[] {
                let prefixedKey = key;
                prefixedKey = _namePrefix ? _namePrefix + "_" + prefixedKey : prefixedKey;
                return _getBufferBase<IInternalStorageItem>(prefixedKey);
            }
            
            function _getBufferBase<T>(key: string): T[] {
                try {
                    const bufferJson = getItem(logger, key);
                    if (bufferJson) {
                        let buffer: T[] = getJSON().parse(bufferJson);
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
                        " storage key: " + key + ", " + getExceptionName(e),
                        { exception: dumpObj(e) });
                }
        
                return [];
            }
        
            function _setBuffer(key: string, buffer: IInternalStorageItem[]) {
                let prefixedKey = key;
                try {
                    prefixedKey = _namePrefix ? _namePrefix + "_" + prefixedKey : prefixedKey;
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

            // this removes buffer with prefix+key
            function _getPreviousEvents() {
                let items: IInternalStorageItem[] = [];
                try {
                    arrForEach(PREVIOUS_KEYS, (key) => {
                        let events = _getItemsFromPreviousKey(key);
                        items = items.concat(events);
                        
                        // to make sure that we also transfer items from old prefixed + key buffer
                        if (_namePrefix) {
                            let prefixedKey = _namePrefix + "_" + key;
                            let prefixEvents = _getItemsFromPreviousKey(prefixedKey);
                            items = items.concat( prefixEvents);
                        }
                    });
                    return items;
                    

                } catch(e) {
                    _throwInternal(logger, eLoggingSeverity.WARNING,
                        _eInternalMessageId.FailedToSetStorageBuffer,
                        "Transfer events from previous buffers: " + getExceptionName(e) + ". previous Buffer items can not be removed",
                        { exception: dumpObj(e) });

                }
                return [];
            }

            // transform string[] to IInternalStorageItem[]
            function _getItemsFromPreviousKey(key: string) {
                try {
                    let items = _getBufferBase<string>(key);
                    let transFormedItems: IInternalStorageItem[] = [];
                    arrForEach(items, (item) => {
                        let internalItem = {
                            item: item,
                            cnt: 0 // previous events will be default to 0 count
                        } as IInternalStorageItem;
                        transFormedItems.push(internalItem);
                    });
                    // remove the session storage if we can add events back
                    utlRemoveSessionStorage(logger, key);
                    return transFormedItems;

                } catch (e) {
                    // eslint-disable-next-line no-empty
                }
                return [];
            }

        });
    }

    public enqueue(payload: IInternalStorageItem) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public clear() {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public markAsSent(payload: IInternalStorageItem[]) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public clearSent(payload: IInternalStorageItem[]) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public createNew(newLogger?: IDiagnosticLogger, newConfig?: ISenderConfig, canUseSessionStorage?: boolean): ArraySendBuffer | SessionStorageSendBuffer {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null
    }
}
