// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import dynamicProto from "@microsoft/dynamicproto-js";
import {
    BaseTelemetryPlugin, IAppInsightsCore, IChannelControls, IConfigDefaults, IConfiguration, IInternalOfflineSupport, INotificationManager,
    IPayloadData, IPlugin, IProcessTelemetryContext, IProcessTelemetryUnloadContext, ISample, ITelemetryItem, ITelemetryUnloadState,
    SampleRate, SendRequestReason, _eInternalMessageId, _throwInternal, addPageHideEventListener, addPageShowEventListener,
    addPageUnloadEventListener, arrForEach, createProcessTelemetryContext, createUniqueNamespace, eEventsDiscardedReason, eLoggingSeverity,
    hrTime, isFeatureEnabled, isGreaterThanZero, isNullOrUndefined, mergeEvtNamespace, onConfigChange, removePageHideEventListener,
    removePageShowEventListener, removePageUnloadEventListener
} from "@microsoft/applicationinsights-core-js";
import { IPromise, createPromise } from "@nevware21/ts-async";
import { ITimerHandler, isNumber, objDeepFreeze, scheduleTimeout } from "@nevware21/ts-utils";
import { eOtlpSignal } from "./Enums";
import { IOtlpChannelConfig } from "./Interfaces/IOtlpChannelConfig";
import { STR_OTLP_CHANNEL } from "./InternalConstants";
import { IOtlpBatch, OtlpBatcher, buildPayload } from "./OtlpBatcher";
import { IOtlpSendResult, OtlpHttpSender, getEndpointUrl } from "./OtlpHttpSender";
import { createOtlpSampler } from "./OtlpSampler";
import { IAttrOptions } from "./convert/AttributeBuilder";
import { IConvertCtx, IKeyMap, IOtlpRecord, convertItem, getSignal } from "./convert/ItemConverter";
import { IOtlpResourceInfo, buildResourceInfo, getResourceKey, getResourceTagKeys } from "./convert/ResourceBuilder";
import { hrTimeToUnixNanoStr } from "./convert/TimeUtils";

const DEFAULT_MAX_BATCH_BYTES = 65536;
const DEFAULT_MAX_RECORDS = 512;
const DEFAULT_BATCH_INTERVAL = 15000;
const DEFAULT_EVENTS_LIMIT = 10000;
const DEFAULT_MAX_RETRIES = 6;
const DEFAULT_MAX_UNLOAD_RETRIES = 2;
const EVENTS_SENT = "eventsSent";
const EVENTS_DISCARDED = "eventsDiscarded";
const EVENTS_SEND_REQUEST = "eventsSendRequest";
const EVENTS_RETRY = "eventsRetry";

/**
 * The number of records that are dropped at a time once the in memory limit is reached, dropping a
 * block rather than a single record avoids repeating the drop on every subsequent item.
 */
const DROP_BLOCK = 20;

let undefValue: undefined = undefined;

function _isValidSamplingPercentage(value: number): boolean {
    return isNumber(value) && value >= 0 && value <= 100;
}

function _isValidRetryCount(value: number): boolean {
    return isNumber(value) && isFinite(value) && value >= 0 && value <= 100;
}

function _isValidUnloadRetryCount(value: number): boolean {
    return _isValidRetryCount(value) && value <= 10;
}

/**
 * The default configuration. Every value must be present so that the dynamic configuration system
 * makes all of them individually watchable.
 */
const defaultOtlpChannelConfig: IConfigDefaults<IOtlpChannelConfig> = objDeepFreeze({
    endpointUrl: undefValue,
    tracesEndpointUrl: undefValue,
    logsEndpointUrl: undefValue,
    headers: undefValue,
    resourceAttributes: undefValue,
    scopeName: undefValue,
    scopeVersion: undefValue,
    preSerialize: true,
    pageViewAs: "span",
    metricsAsLogs: false,
    samplingPercentage: { isVal: _isValidSamplingPercentage, v: 100 },
    piiMode: "drop",
    maxBatchSizeInBytes: { isVal: isGreaterThanZero, v: DEFAULT_MAX_BATCH_BYTES },
    maxRecordsPerBatch: { isVal: isGreaterThanZero, v: DEFAULT_MAX_RECORDS },
    maxBatchInterval: { isVal: isGreaterThanZero, v: DEFAULT_BATCH_INTERVAL },
    eventsLimitInMem: { isVal: isGreaterThanZero, v: DEFAULT_EVENTS_LIMIT },
    transports: undefValue,
    unloadTransports: undefValue,
    httpXHROverride: undefValue,
    fetchCredentials: undefValue,
    disableXhrSync: false,
    disableFetchKeepAlive: false,
    xhrTimeout: undefValue,
    maxRetryAttempts: { isVal: _isValidRetryCount, v: DEFAULT_MAX_RETRIES },
    isRetryDisabled: false,
    retryCodes: undefValue,
    enablePayloadCompression: false,
    maxUnloadRetryAttempts: { isVal: _isValidUnloadRetryCount, v: DEFAULT_MAX_UNLOAD_RETRIES },
    disableTelemetry: false,
    consumeEvents: false,
    includeIKeyInResource: false
});

/**
 * A channel that converts telemetry into OTLP/JSON and exports it to an OTLP/HTTP endpoint.
 *
 * @remarks
 * The channel sits at the end of the plugin chain and converts each telemetry item into its final
 * OTLP representation as the item is received, rather than when a batch is sent. Batches are
 * accumulated as already serialized records grouped by resource and signal, so sending a batch is
 * only a string join and an HTTP POST. This keeps the cost of exporting off the (time critical) send
 * path, which matters most during page unload.
 *
 * Being a channel it must be supplied using the `channels` configuration rather than `extensions`.
 *
 * @example
 * ```typescript
 * const otlpChannel = new OtlpChannel();
 * const appInsights = new ApplicationInsights({
 *     config: {
 *         instrumentationKey: "YOUR_KEY",
 *         channels: [[ otlpChannel ]],
 *         extensionConfig: {
 *             ["OtlpChannel"]: { endpointUrl: "https://collector.example.com" }
 *         }
 *     }
 * });
 * ```
 * @group Classes
 * @group Entrypoint
 */
export class OtlpChannel extends BaseTelemetryPlugin implements IChannelControls {

    public identifier = STR_OTLP_CHANNEL;

    /**
     * The priority of this channel, this is above the priority of the other channels so that when it
     * shares a queue it is always the last plugin to receive an item.
     */
    public priority = 1021;

    public version = "#version#";

    constructor() {
        super();

        let _config: IOtlpChannelConfig;
        let _batcher: OtlpBatcher;
        let _sender: OtlpHttpSender;
        let _convertCtx: IConvertCtx;
        let _sample: ISample;
        let _resourceTagKeys: IKeyMap;
        let _resourceCache: { [key: string]: IOtlpResourceInfo };
        let _paused: boolean;
        let _sendTimer: ITimerHandler;
        let _retryTimer: ITimerHandler;
        let _evtNamespace: string | string[];
        let _isPageUnloading: boolean;
        let _inFlight: number;
        let _generation = 0;
        let _pendingFlushCallbacks: Array<(flushComplete?: boolean) => void>;

        dynamicProto(OtlpChannel, this, (_self, _base) => {

            _initDefaults();

            _self.initialize = (coreConfig: IConfiguration, core: IAppInsightsCore, extensions: IPlugin[]) => {
                _base.initialize(coreConfig, core, extensions);

                _evtNamespace = mergeEvtNamespace(createUniqueNamespace("OtlpChannel"), core.evtNamespace && core.evtNamespace());
                _sender = new OtlpHttpSender(_self.diagLog());

                _self._addHook(onConfigChange(coreConfig, () => {
                    let ctx = createProcessTelemetryContext(null, coreConfig, core);
                    _config = ctx.getExtCfg<IOtlpChannelConfig>(_self.identifier, defaultOtlpChannelConfig);

                    // The resource, scope and conversion context are all memoized for performance, so
                    // they must be rebuilt whenever the configuration that feeds them changes.
                    _resourceCache = {};
                    _resourceTagKeys = getResourceTagKeys();
                    _convertCtx = {
                        config: _config,
                        resourceTagKeys: _resourceTagKeys,
                        attrOptions: { piiMode: _config.piiMode } as IAttrOptions
                    };

                    _sample = createOtlpSampler(_config.samplingPercentage);
                    _sender.setConfig(_config, _config.enablePayloadCompression ||
                        isFeatureEnabled("zipPayload", coreConfig, false));
                }));

                _addUnloadListeners();
            };

            _self.processTelemetry = (item: ITelemetryItem, itemCtx?: IProcessTelemetryContext) => {
                itemCtx = _self._getTelCtx(itemCtx);

                try {
                    if (!_config.disableTelemetry && item && _isSampledIn(item)) {
                        _addItem(item);
                    }
                } catch (e) {
                    _throwInternal(itemCtx.diagLog(), eLoggingSeverity.WARNING, _eInternalMessageId.TelemetryEnvelopeInvalid,
                        "Failed to convert the telemetry item to OTLP", { exception: e + "" });
                }

                if (!_config.consumeEvents) {
                    _self.processNext(item, itemCtx);
                }
            };

            _self.pause = () => {
                _clearSendTimer();
                _paused = true;
            };

            _self.resume = () => {
                if (_paused) {
                    _paused = false;
                    _checkLimits();
                }
            };

            _self.flush = (isAsync: boolean = true, callBack?: (flushComplete?: boolean) => void,
                sendReason?: SendRequestReason): boolean | void | IPromise<boolean> => {

                if (_paused) {
                    callBack && callBack(false);
                    return false;
                }

                _clearSendTimer();

                if (!isAsync) {
                    _sendBatches(false, sendReason || SendRequestReason.ManualFlush);
                    callBack && callBack(true);
                    return true;
                }

                if (callBack) {
                    _pendingFlushCallbacks.push(callBack);
                    _sendBatches(true, sendReason || SendRequestReason.ManualFlush);
                    _checkFlushComplete();
                    return true;
                }

                return createPromise<boolean>((resolve) => {
                    _pendingFlushCallbacks.push(() => {
                        resolve(true);
                    });

                    _sendBatches(true, sendReason || SendRequestReason.ManualFlush);
                    _checkFlushComplete();
                });
            };

            _self.onunloadFlush = () => {
                _isPageUnloading = true;
                _clearSendTimer();
                _sendBatches(false, SendRequestReason.Unload);
            };

            _self.getOfflineSupport = (): IInternalOfflineSupport => {
                return {
                    getUrl: () => {
                        return getEndpointUrl(_config, eOtlpSignal.Span);
                    },
                    createPayload: (data: string | Uint8Array): IPayloadData => {
                        return {
                            urlString: getEndpointUrl(_config, eOtlpSignal.Span),
                            data: data,
                            headers: { "Content-Type": "application/json" }
                        };
                    },
                    serialize: (input: ITelemetryItem): string => {
                        // The records are already serialized during conversion, so this is only a
                        // conversion of a single item rather than a second serialization layer.
                        let record = convertItem(input, _convertCtx, _observedNow());
                        return record ? (record.json || JSON.stringify(record.record)) : null;
                    },
                    batch: (arr: string[]): string => {
                        return "[" + (arr || []).join(",") + "]";
                    },
                    shouldProcess: (evt: ITelemetryItem): boolean => {
                        return !_config.disableTelemetry && !!evt && getSignal(evt.baseType, _config) !== null;
                    }
                };
            };

            _self.isCompletelyIdle = (): boolean => {
                return _inFlight === 0 && _batcher.count() === 0 && !_retryTimer;
            };

            _self._doTeardown = (unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState) => {
                // Make a best effort attempt to export anything still buffered before we go away
                _sendBatches(false, SendRequestReason.SdkUnload);

                _removeUnloadListeners();
                _clearSendTimer();

                if (_retryTimer) {
                    _retryTimer.cancel();
                    _retryTimer = null;
                }

                _sender && _sender.teardown();
                _initDefaults();
            };

            function _observedNow(): string {
                return hrTimeToUnixNanoStr(hrTime());
            }

            function _isSampledIn(item: ITelemetryItem): boolean {
                let sampleRate = (item as any)[SampleRate];
                if (!isNullOrUndefined(sampleRate) && isNumber(sampleRate) && sampleRate >= 0 && sampleRate <= 100) {
                    return true;
                }

                if (!_sample.isSampledIn(item)) {
                    _throwInternal(_self.diagLog(), eLoggingSeverity.WARNING, _eInternalMessageId.TelemetrySampledAndNotSent,
                        "Telemetry item was sampled out and not sent", { SampleRate: _sample.sampleRate });
                    return false;
                }

                (item as any)[SampleRate] = _sample.sampleRate;
                return true;
            }

            function _getResourceInfo(item: ITelemetryItem): IOtlpResourceInfo {
                let key = getResourceKey(item);
                let info = _resourceCache[key];
                if (!info) {
                    // Building a resource walks the context tags and serializes the result, in a
                    // browser this normally happens exactly once for the lifetime of the page.
                    info = _resourceCache[key] = buildResourceInfo(item, _config, key, _self.version);
                }

                return info;
            }

            function _addItem(item: ITelemetryItem): void {
                let record: IOtlpRecord = convertItem(item, _convertCtx, _observedNow());
                if (!record) {
                    return;
                }

                _batcher.add(_getResourceInfo(item), record, {
                    name: item.name,
                    baseType: item.baseType
                } as ITelemetryItem);
                _checkLimits();
            }

            function _checkLimits(): void {
                let limit = _config.eventsLimitInMem;
                if (_batcher.count() > limit) {
                    let dropped = _batcher.dropOldest(DROP_BLOCK);
                    if (dropped.length) {
                        _notifyDiscarded(dropped, eEventsDiscardedReason.QueueFull);
                    }
                }

                if (_paused) {
                    return;
                }

                if (_batcher.count() >= _config.maxRecordsPerBatch || _batcher.size() >= _config.maxBatchSizeInBytes) {
                    _sendBatches(true, SendRequestReason.MaxQueuedEvents);
                } else if (_batcher.count() > 0) {
                    _scheduleSend();
                }
            }

            function _scheduleSend(): void {
                if (_sendTimer || _paused) {
                    return;
                }

                _sendTimer = scheduleTimeout(() => {
                    _sendTimer = null;
                    _sendBatches(true, SendRequestReason.NormalSchedule);
                }, _config.maxBatchInterval);
            }

            function _clearSendTimer(): void {
                if (_sendTimer) {
                    _sendTimer.cancel();
                    _sendTimer = null;
                }
            }

            function _sendBatches(isAsync: boolean, sendReason: SendRequestReason): void {
                if (_config.disableTelemetry || !_batcher.count()) {
                    _checkFlushComplete();
                    return;
                }

                let batches = _batcher.takeBatches(_config.maxRecordsPerBatch, _config.maxBatchSizeInBytes);
                if (batches.length) {
                    _notifySendRequest(sendReason, isAsync);
                }
                arrForEach(batches, (batch) => {
                    _sendBatch(batch, isAsync, sendReason);
                });
            }

            function _sendBatch(batch: IOtlpBatch, isAsync: boolean, sendReason: SendRequestReason): void {
                let generation = _generation;
                _inFlight++;

                let started = _sender.send(batch, isAsync, (result: IOtlpSendResult) => {
                    if (generation !== _generation) {
                        return;
                    }

                    _inFlight--;
                    _onSendComplete(batch, result);
                    _checkFlushComplete();
                }, sendReason);

                if (!started) {
                    _inFlight--;
                    // Without a usable transport or endpoint the records cannot be exported, drop them
                    // rather than letting the buffer grow without bound.
                    _notifyDiscarded(batch.items, eEventsDiscardedReason.NonRetryableStatus);
                    _checkFlushComplete();
                }
            }

            function _onSendComplete(batch: IOtlpBatch, result: IOtlpSendResult): void {
                if (result.success) {
                    let rejected = result.rejected || 0;
                    if (rejected) {
                        _notifyDiscarded(_createUnknownItems(rejected), eEventsDiscardedReason.NonRetryableStatus, result.status);
                        _notifySent(_createUnknownItems(batch.items.length - rejected));
                    } else {
                        _notifySent(batch.items);
                    }
                    return;
                }

                let maxAttempts = _isPageUnloading ? _config.maxUnloadRetryAttempts : _config.maxRetryAttempts;
                if (!result.retry || batch.attempts >= maxAttempts) {
                    _notifyDiscarded(batch.items, eEventsDiscardedReason.NonRetryableStatus, result.status);
                    _throwInternal(_self.diagLog(), eLoggingSeverity.WARNING, _eInternalMessageId.TransmissionFailed,
                        "Failed to export " + batch.fragments.length + " OTLP record(s), status: " + result.status);
                    return;
                }

                _notifyRetry(batch.items, result.status);
                if (_isPageUnloading) {
                    _sendBatch(batch, false, SendRequestReason.Retry);
                    return;
                }

                _batcher.requeue(batch);
                _scheduleRetry(result.retryAfterMs);
            }

            function _scheduleRetry(delayMs: number): void {
                if (_retryTimer || _paused) {
                    return;
                }

                _retryTimer = scheduleTimeout(() => {
                    _retryTimer = null;
                    _sendBatches(true, SendRequestReason.Retry);
                }, delayMs || _config.maxBatchInterval);
            }

            function _checkFlushComplete(): void {
                if (_inFlight > 0 || _batcher.count() > 0 || _retryTimer || !_pendingFlushCallbacks.length) {
                    return;
                }

                let callbacks = _pendingFlushCallbacks;
                _pendingFlushCallbacks = [];
                arrForEach(callbacks, (callback) => {
                    try {
                        callback(true);
                    } catch (e) {
                        // A failing callback must not stop the remaining callbacks from running
                    }
                });
            }

            function _getNotifyMgr(): INotificationManager {
                let core = _self.core;
                return core && core.getNotifyMgr && core.getNotifyMgr();
            }

            function _notifySent(items: ITelemetryItem[]): void {
                let manager = _getNotifyMgr();
                if (items.length && manager && manager[EVENTS_SENT]) {
                    manager[EVENTS_SENT](items);
                }
            }

            function _createUnknownItems(count: number): ITelemetryItem[] {
                let items: ITelemetryItem[] = [];
                for (let lp = 0; lp < count; lp++) {
                    items.push({ name: STR_OTLP_CHANNEL, baseType: "Unknown" } as ITelemetryItem);
                }
                return items;
            }

            function _notifyDiscarded(items: ITelemetryItem[], reason: eEventsDiscardedReason, status?: number): void {
                let manager = _getNotifyMgr();
                if (items.length && manager && manager[EVENTS_DISCARDED]) {
                    manager[EVENTS_DISCARDED](items, reason, status);
                }
            }

            function _notifyRetry(items: ITelemetryItem[], status: number): void {
                let manager = _getNotifyMgr();
                if (items.length && manager && manager[EVENTS_RETRY]) {
                    manager[EVENTS_RETRY](items, status);
                }
            }

            function _notifySendRequest(sendReason: SendRequestReason, isAsync: boolean): void {
                let manager = _getNotifyMgr();
                if (manager && manager[EVENTS_SEND_REQUEST]) {
                    try {
                        manager[EVENTS_SEND_REQUEST](sendReason, isAsync);
                    } catch (e) {
                        _throwInternal(_self.diagLog(), eLoggingSeverity.CRITICAL, _eInternalMessageId.NotificationException,
                            "Send request notification failed");
                    }
                }
            }

            function _addUnloadListeners(): void {
                addPageUnloadEventListener(_onPageUnload, null, _evtNamespace);
                addPageHideEventListener(_onPageUnload, null, _evtNamespace);
                addPageShowEventListener(_onPageShow, null, _evtNamespace);
            }

            function _removeUnloadListeners(): void {
                removePageUnloadEventListener(null, _evtNamespace);
                removePageHideEventListener(null, _evtNamespace);
                removePageShowEventListener(null, _evtNamespace);
            }

            function _onPageUnload(): void {
                if (!_config || _config.disableTelemetry) {
                    return;
                }

                _isPageUnloading = true;
                _self.onunloadFlush();
            }

            function _onPageShow(): void {
                // The page has been restored from the back / forward cache so it is alive again
                _isPageUnloading = false;
            }

            function _initDefaults(): void {
                _generation++;
                _config = null;
                _batcher = new OtlpBatcher();
                _sender = null;
                _convertCtx = null;
                _sample = null;
                _resourceTagKeys = {};
                _resourceCache = {};
                _paused = false;
                _sendTimer = null;
                _retryTimer = null;
                _evtNamespace = null;
                _isPageUnloading = false;
                _inFlight = 0;
                _pendingFlushCallbacks = [];
            }
        });
    }

    /**
     * Pause the exporting of telemetry, items continue to be converted and buffered until the
     * configured in memory limit is reached at which point the oldest records are dropped.
     */
    public pause(): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Resume the exporting of telemetry.
     */
    public resume(): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Export any buffered telemetry immediately.
     * @param isAsync - Send the data asynchronously when `true` (the default).
     * @param callBack - Notified once the export has completed.
     * @param sendReason - The reason the flush was requested.
     * @returns `true` when a supplied callback will be called, otherwise an
     * [IPromise](https://nevware21.github.io/ts-async/typedoc/interfaces/IPromise.html) that resolves
     * once the export is complete.
     */
    public flush(isAsync: boolean = true, callBack?: (flushComplete?: boolean) => void,
        sendReason?: SendRequestReason): boolean | void | IPromise<boolean> {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Export any buffered telemetry synchronously, called while the page is unloading.
     */
    public onunloadFlush(): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Returns the support required by the offline channel to persist and later replay OTLP payloads.
     * @returns The offline support implementation.
     */
    public getOfflineSupport(): IInternalOfflineSupport {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Returns whether the channel has no buffered, in-flight, or pending retry work.
     */
    public isCompletelyIdle(): boolean {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return false;
    }

    public initialize(config: IConfiguration, core: IAppInsightsCore, extensions: IPlugin[]): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public processTelemetry(item: ITelemetryItem, itemCtx?: IProcessTelemetryContext): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
}

export { buildPayload };
