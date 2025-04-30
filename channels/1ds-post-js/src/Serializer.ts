/**
* Serializer.ts
* @author Abhilash Panwar (abpanwar); Hector Hernandez (hectorh); Nev Wylie (newylie)
* @copyright Microsoft 2018-2020
*/
// @skip-file-minify

import dynamicProto from "@microsoft/dynamicproto-js";
import {
    EventSendType, FieldValueSanitizerFunc, FieldValueSanitizerType, IEventProperty, IPerfManagerProvider, IValueSanitizer,
    SendRequestReason, arrIndexOf, doPerf, getCommonSchemaMetaData, getTenantId, isArray, isValueAssigned, objForEachKey, sanitizeProperty,
    strStartsWith
} from "@microsoft/1ds-core-js";
import { IChannelConfiguration, IPostTransmissionTelemetryItem, IRequestSizeLimit } from "./DataModels";
import { EventBatch } from "./EventBatch";
import { STR_EMPTY } from "./InternalConstants";
import { mathMin, strSubstr } from "@nevware21/ts-utils";

/**
 * Note: This is an optimization for V8-based browsers. When V8 concatenates a string,
 * the strings are only joined logically using a "cons string" or "constructed/concatenated
 * string". These containers keep references to one another and can result in very large
 * memory usage. For example, if a 2MB string is constructed by concatenating 4 bytes
 * together at a time, the memory usage will be ~44MB; so ~22x increase. The strings are
 * only joined together when an operation requiring their joining takes place, such as
 * substr(). This function is called when adding data to this buffer to ensure these
 * types of strings are periodically joined to reduce the memory footprint.
 * Setting to every 20 events as the JSON.stringify() may have joined many strings
 * and calling this too much causes a minor delay while processing.
 */
const _MAX_STRING_JOINS = 20;

// Max Size set by One Collector: https://msazure.visualstudio.com/OneDsCollector/_git/Collector?path=/Services/Azure/CollectorWorkerRoleAzure/ServiceConfiguration.Cloud.cscfg
const RequestSizeLimitBytes = 3145728; // approx 3.15 Mb
const BeaconRequestSizeLimitBytes = 65000; // approx 64kb (the current Edge, Firefox and Chrome max limit)
const MaxRecordSize = 2000000; // approx 2 Mb
const MaxBeaconRecordSize = mathMin(MaxRecordSize, BeaconRequestSizeLimitBytes);
const metadata = "metadata";
const f = "f";
const rCheckDot = /\./;

/**
 * @ignore
 * Identifies the callback to add metadata for a property.
 * @since 4.1.0
 * @group Private
 * @param pathKeys - The path keys for the property
 * @param key - The property key
 * @param value - The property value
 */
type EventMetaDataCallback = (pathKeys: string[], key: string, value: IEventProperty) => void;

/**
 * @ignore
 * Identifies the callback to get the encoded type for a property.
 * This is added as a future hook for the serializer to allow for custom encoding of properties.
 * @since 4.1.0
 * @group Private
 * @param value - The property value
 * @param kind - The property value kind
 * @param type - The property type
 * @returns The encoded type for the property
 */
export type SerializerGetEncodedType = (value: string | boolean | number | string[] | number[] | boolean[] | undefined, kind: number | undefined, type?: number | undefined) => number;

export interface ISerializedPayload {
    /**
     * The collection of iKeys included in this payload
     */
    apiKeys: string[];

    /**
     * Serialized payload blob that needs to be sent.
     */
    payloadBlob: string;

    /**
     * Extra events that would not fit into the serialized blob limit
     */
    overflow: EventBatch;

    /**
     * Events that where dropped because they exceeded the individual limit
     */
    sizeExceed: EventBatch[];

    /**
     * Events that where dropped because they could not be serialized
     */
    failedEvts: EventBatch[];

     /**
     * The batches included in this payload
     */
    batches: EventBatch[];

    /**
     * The events that have been sent if not the full payload
     */
    sentEvts?: EventBatch[];

    /**
     * The number of events in the payload
     */
    numEvents: number;

    /**
     * The retry count for this payload
     */
    retryCnt: number;

    /**
     * Was this payload created during a teardown
     */
    isTeardown: boolean;

    /**
     * Is this payload a synchronous payload
     */
    isSync: boolean;

    /**
     * The payload has been constructed using a reduced payload size for usage with sendBeacon or fetch(with keepAlive) API's
     */
    isBeacon: boolean;

    /**
     * The request event sync type
     */
    sendType: EventSendType;

    /**
     * The reason the payload has is being sent
     */
    sendReason?: SendRequestReason;
}

/**
* Class to handle serialization of event and request.
* Currently uses Bond for serialization. Please note that this may be subject to change.
*/
export class Serializer {

    /**
     * Constructs a new instance of the Serializer class
     * @param perfManager - The performance manager to use for tracking performance
     * @param valueSanitizer - The value sanitizer to use for sanitizing field values
     * @param stringifyObjects - Should objects be stringified before being sent
     * @param enableCompoundKey - Should compound keys be enabled (defaults to false)
     * @param getEncodedTypeOverride - The callback to get the encoded type for a property defaults to ({@link getCommonSchemaMetaData }(...))
     * @param excludeCsMetaData - (!DANGER!) Should metadata be populated when encoding the event blob (defaults to false) - PII data will NOT be tagged as PII for backend processing
     * @param cfg channel cfg for setting request and record size limit
     */
    constructor(perfManager?: IPerfManagerProvider, valueSanitizer?: IValueSanitizer, stringifyObjects?: boolean, enableCompoundKey?: boolean, getEncodedTypeOverride?: SerializerGetEncodedType, excludeCsMetaData?: boolean, cfg?: IChannelConfiguration) {
        const strData = "data";
        const strBaseData = "baseData";
        const strExt = "ext";

        let _checkForCompoundkey = !!enableCompoundKey;
        let _processSubKeys = true;
        let _theSanitizer: IValueSanitizer = valueSanitizer;
        let _isReservedCache = {};
        let _excludeCsMetaData: boolean = !!excludeCsMetaData;
        let _getEncodedType: SerializerGetEncodedType = getEncodedTypeOverride || getCommonSchemaMetaData;
        let _sizeCfg = _getSizeLimtCfg(cfg);
        let _requestSizeLimitBytes = _validateSizeLimit(_sizeCfg.requestLimit, RequestSizeLimitBytes, false);
        let _beaconRequestSizeLimitBytes = _validateSizeLimit(_sizeCfg.requestLimit, BeaconRequestSizeLimitBytes, true);
        let _maxRecordSize =  _validateSizeLimit(_sizeCfg.recordLimit, MaxRecordSize, false);
        let _maxBeaconRecordSize =  Math.min(_validateSizeLimit(_sizeCfg.recordLimit, MaxBeaconRecordSize, true), _beaconRequestSizeLimitBytes);

        dynamicProto(Serializer, this, (_self) => {

            _self.createPayload = (retryCnt: number, isTeardown: boolean, isSync: boolean, isReducedPayload: boolean, sendReason: SendRequestReason, sendType: EventSendType): ISerializedPayload => {
                return {
                    apiKeys: [],
                    payloadBlob: STR_EMPTY,
                    overflow: null,
                    sizeExceed: [],
                    failedEvts: [],
                    batches: [],
                    numEvents: 0,
                    retryCnt: retryCnt,
                    isTeardown: isTeardown,
                    isSync: isSync,
                    isBeacon: isReducedPayload,
                    sendType: sendType,
                    sendReason: sendReason
                };
            };

            _self.appendPayload = (payload: ISerializedPayload, theBatch: EventBatch, maxEventsPerBatch: number): boolean => {
                let canAddEvents = payload && theBatch && !payload.overflow;
                if (canAddEvents) {
                    doPerf(perfManager, () => "Serializer:appendPayload", () => {
                        let theEvents = theBatch.events();
                        let payloadBlob = payload.payloadBlob;
                        let payloadEvents = payload.numEvents;
                        let eventsAdded = false;
                        let sizeExceeded: IPostTransmissionTelemetryItem[] = [];
                        let failedEvts: IPostTransmissionTelemetryItem[] = [];
                        let isBeaconPayload = payload.isBeacon;
                        let requestMaxSize = isBeaconPayload ? _beaconRequestSizeLimitBytes : _requestSizeLimitBytes;
                        let recordMaxSize = isBeaconPayload ? _maxBeaconRecordSize : _maxRecordSize;

                        let lp = 0;
                        let joinCount = 0;
                        while (lp < theEvents.length) {
                            let theEvent = theEvents[lp];
                            if (theEvent) {
                                if (payloadEvents >= maxEventsPerBatch) {
                                    // Maximum events per payload reached, so don't add any more
                                    payload.overflow = theBatch.split(lp);
                                    break;
                                }

                                let eventBlob = _self.getEventBlob(theEvent);
                                if (eventBlob && eventBlob.length <= recordMaxSize) {
                                    // This event will fit into the payload
                                    let blobLength = eventBlob.length;
                                    let currentSize = payloadBlob.length;
                                    if (currentSize + blobLength > requestMaxSize) {
                                        // Request or batch size exceeded, so don't add any more to the payload
                                        payload.overflow = theBatch.split(lp);
                                        break;
                                    }

                                    if (payloadBlob) {
                                        payloadBlob += "\n";
                                    }

                                    payloadBlob += eventBlob;

                                    joinCount ++;
                                    // v8 memory optimization only
                                    if (joinCount > _MAX_STRING_JOINS) {
                                        // this substr() should cause the constructed string to join
                                        strSubstr(payloadBlob, 0, 1);
                                        joinCount = 0;
                                    }

                                    eventsAdded = true;
                                    payloadEvents++;
                                } else {
                                    if (eventBlob) {
                                        // Single event size exceeded so remove from the batch
                                        sizeExceeded.push(theEvent);
                                    } else {
                                        failedEvts.push(theEvent);
                                    }

                                    // We also need to remove this event from the existing array, otherwise a notification will be sent
                                    // indicating that it was successfully sent
                                    theEvents.splice(lp, 1);
                                    lp--;
                                }
                            }

                            lp++;
                        }

                        if (sizeExceeded.length > 0) {
                            payload.sizeExceed.push(EventBatch.create(theBatch.iKey(), sizeExceeded));
                            // Remove the exceeded events from the batch
                        }

                        if (failedEvts.length > 0) {
                            payload.failedEvts.push(EventBatch.create(theBatch.iKey(), failedEvts));
                            // Remove the failed events from the batch
                        }

                        if (eventsAdded) {
                            payload.batches.push(theBatch);
                            payload.payloadBlob = payloadBlob;
                            payload.numEvents = payloadEvents;

                            let apiKey = theBatch.iKey();
                            if (arrIndexOf(payload.apiKeys, apiKey) === -1) {
                                payload.apiKeys.push(apiKey);
                            }
                        }
                    }, () => ({ payload: payload, theBatch: { iKey: theBatch.iKey(), evts: theBatch.events() }, max: maxEventsPerBatch }));
                }

                return canAddEvents;
            };

            _self.getEventBlob = (eventData: IPostTransmissionTelemetryItem): string => {
                try {
                    return doPerf(perfManager, () => "Serializer.getEventBlob", () => {
                        let serializedEvent = { } as any;
                        // Adding as dynamic keys for v8 performance
                        serializedEvent.name = eventData.name;
                        serializedEvent.time = eventData.time;
                        serializedEvent.ver = eventData.ver;
                        serializedEvent.iKey = "o:" + getTenantId(eventData.iKey);

                        // Assigning local var so usage in part b/c don't throw if there is no ext
                        let serializedExt = {};

                        let _addMetadataCallback: EventMetaDataCallback;
                        if (!_excludeCsMetaData) {
                            _addMetadataCallback = (pathKeys: string[], key: string, value: IEventProperty) => {
                                _addJSONPropertyMetaData(_getEncodedType, serializedExt, pathKeys, key, value);
                            };
                        }

                        // Part A
                        let eventExt = eventData[strExt];
                        if (eventExt) {
                            // Only assign ext if the event had one (There are tests covering this use case)
                            serializedEvent[strExt] = serializedExt;
                            objForEachKey(eventExt, (key, value) => {
                                let data = serializedExt[key] = {};

                                // Don't include a metadata callback as we don't currently set metadata Part A fields
                                _processPathKeys(value, data, "ext." + key, true, null, null, true);
                            });
                        }

                        let serializedData: any = serializedEvent[strData] = {};
                        serializedData.baseType = eventData.baseType;

                        let serializedBaseData = serializedData[strBaseData] = {};

                        // Part B
                        _processPathKeys(eventData.baseData, serializedBaseData, strBaseData, false, [strBaseData], _addMetadataCallback, _processSubKeys);

                        // Part C
                        _processPathKeys(eventData.data, serializedData, strData, false, [], _addMetadataCallback, _processSubKeys);

                        return JSON.stringify(serializedEvent);
                    }, () => ({ item: eventData }));
                } catch (e) {
                    return null;
                }
            };

            function _isReservedField(path: string, name: string): boolean {
                let result = _isReservedCache[path];

                if (result === undefined)  {
                    if (path.length >= 7) {
                        // Do not allow the changing of fields located in the ext.metadata or ext.web extension
                        result = strStartsWith(path, "ext.metadata") || strStartsWith(path, "ext.web");
                    }

                    _isReservedCache[path] = result;
                }

                return result;
            }

            function _processPathKeys(
                srcObj: any,
                target: { [key: string]: {}},
                thePath: string,
                checkReserved: boolean,
                metadataPathKeys: string[],
                metadataCallback: EventMetaDataCallback,
                processSubKeys: boolean) {

                objForEachKey(srcObj, (key, srcValue) => {
                    let prop: IEventProperty = null;
                    if (srcValue || isValueAssigned(srcValue)) {
                        let path = thePath;
                        let name = key;

                        let theMetaPathKeys = metadataPathKeys;
                        let destObj = target;

                        // Handle keys with embedded '.', like "TestObject.testProperty"
                        if (_checkForCompoundkey && !checkReserved && rCheckDot.test(key)) {
                            let subKeys = key.split(".");
                            let keyLen = subKeys.length;
                            if (keyLen > 1) {
                                if (theMetaPathKeys) {
                                    // Create a copy of the meta path keys so we can add the extra ones
                                    theMetaPathKeys = theMetaPathKeys.slice();
                                }

                                for (let lp = 0; lp < keyLen - 1; lp++) {
                                    let subKey = subKeys[lp];
                                    // Add/reuse the sub key object
                                    destObj = destObj[subKey] = destObj[subKey] || {};
                                    path += "." + subKey;
                                    if (theMetaPathKeys) {
                                        theMetaPathKeys.push(subKey);
                                    }
                                }

                                name = subKeys[keyLen - 1];
                            }
                        }

                        let isReserved = checkReserved && _isReservedField(path, name);
                        if (!isReserved && _theSanitizer && _theSanitizer.handleField(path, name)) {
                            prop = _theSanitizer.value(path, name, srcValue, stringifyObjects);
                        } else {
                            prop = sanitizeProperty(name, srcValue, stringifyObjects);
                        }

                        if (prop) {
                            // Set the value
                            let newValue: any = prop.value;
                            destObj[name] = newValue;

                            if (metadataCallback) {
                                metadataCallback(theMetaPathKeys, name, prop);
                            }

                            if (processSubKeys && typeof newValue === "object" && !isArray(newValue)) {
                                let newPath = theMetaPathKeys;
                                if (newPath) {
                                    newPath = newPath.slice();
                                    newPath.push(name);
                                }

                                // Make sure we process sub objects as well (for value sanitization and metadata)
                                _processPathKeys(srcValue, newValue, path + "." + name, checkReserved, newPath, metadataCallback, processSubKeys);
                            }
                        }
                    }
                });
            }
        });
    }

    /**
     * Create a serializer payload package
     * @param retryCnt - The retry count for the events in this payload
     * @param isTeardown - Is this payload being created as part of a teardown request
     * @param isSync - Should this payload be sent as a synchronous request
     * @param isReducedPayload - Is this payload going to be sent via sendBeacon() API
     * @param sendReason - The reason the payload is being sent
     * @param sendType - Identifies how this payload will be sent
     */
    public createPayload(retryCnt: number, isTeardown: boolean, isSync: boolean, isReducedPayload: boolean, sendReason: SendRequestReason, sendType: EventSendType): ISerializedPayload {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Append the batched events into the payload
     * @param payload - The serialized payload detail object
     * @param theBatch - The batched events to append to the payload
     * @param maxEventsPerBatch - The maximum number of events to allow in the payload
     * @returns True if the events from the new batch where attempted to be added to the payload otherwise false
     */
    public appendPayload(payload: ISerializedPayload, theBatch: EventBatch, maxEventsPerBatch: number): boolean {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return false;
    }

    /**
     * Bond serialize the event.
     * @param eventData - The event that needs to be serialized.
     * @returns The serialized json event.
     */
    public getEventBlob(eventData: IPostTransmissionTelemetryItem): string {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Does this field value sanitizer handle this path / field combination
     * @param path - The field path
     * @param name - The name of the field
     */
    public handleField(path: string, name: string): boolean {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return false;
    }

    /**
     * Get the field sanitizer for this type of field based on the field type, value kind and/or event property type
     * @param path - The field path
     * @param name - The name of the field
     * @param theType - The type of field
     * @param theKind - The value kind of the field
     * @param propType - The property type of the field
     */
    public getSanitizer(path: string, name: string, theType: FieldValueSanitizerType, theKind?: number, propType?: number): FieldValueSanitizerFunc | null | undefined {
        // @DynamicProtoStub - DO NOT add any code as this will be removed during packaging
        return null;
    }

}

function _validateSizeLimit(cfgVal: number[], defaultVal: number, sync?: boolean): number {
    if (!isArray(cfgVal)){
        return defaultVal;
    }
    let idx = !!sync ? 1 : 0;
    let val = cfgVal[idx];
    if (val && val > 0 && val <= defaultVal) {
        return val;
    }
    return defaultVal;
}

function _getSizeLimtCfg(cfg?: IChannelConfiguration) {
    let defaultCfg = {} as IRequestSizeLimit;
    if (cfg && cfg.requestLimit) {
        return cfg.requestLimit;
    }
    return defaultCfg;
}


/**
 * @ignore
 * @param getEncodedType - The function to get the encoded type for the property
 * @param json - The json object to add the metadata to
 * @param propKeys - The property keys to add to the metadata
 * @param name - The name of the property
 * @param propertyValue - The property value
 */
function _addJSONPropertyMetaData(
    getEncodedType: (value: string | boolean | number | string[] | number[] | boolean[] | undefined, kind: number | undefined, type?: number | undefined) => number,
    json: { [name: string]: {} },
    propKeys: string[],
    name: string,
    propertyValue: IEventProperty | null) {

    if (propertyValue && json) {
        let encodedTypeValue = getEncodedType(propertyValue.value, propertyValue.kind, propertyValue.propertyType);
        if (encodedTypeValue > -1) {
            // Add the root metadata
            let metaData = json[metadata];
            if (!metaData) {
                // Sets the root 'f'
                metaData = json[metadata] = { f: {} };
            }

            let metaTarget = metaData[f];
            if (!metaTarget) {
                // This can occur if someone has manually added an ext.metadata object
                // Such as ext.metadata.privLevel and ext.metadata.privTags
                metaTarget = metaData[f] = {};
            }

            // Traverse the metadata path and build each object (contains an 'f' key) -- if required
            if (propKeys) {
                for (let lp = 0; lp < propKeys.length; lp++) {
                    let key = propKeys[lp];
                    if (!metaTarget[key]) {
                        metaTarget[key] = { f: {} };
                    }

                    let newTarget = metaTarget[key][f];
                    if (!newTarget) {
                        // Not expected, but can occur if the metadata context was pre-created as part of the event
                        newTarget = metaTarget[key][f] = {};
                    }

                    metaTarget = newTarget;
                }
            }

            metaTarget = metaTarget[name] = { };
            if (isArray(propertyValue.value)) {
                metaTarget["a"] = {
                    t: encodedTypeValue
                };
            } else {
                metaTarget["t"] = encodedTypeValue;
            }
        }
    }
}
