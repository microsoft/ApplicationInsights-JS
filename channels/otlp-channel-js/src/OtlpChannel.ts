// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import dynamicProto from "@microsoft/dynamicproto-js";
import {
    BaseTelemetryPlugin, IAppInsightsCore, IChannelControls, IConfigDefaults, IConfiguration, IInternalOfflineSupport, INotificationManager,
    IOfflineListener, IPlugin, IProcessTelemetryContext, IProcessTelemetryUnloadContext, ISample, ITelemetryItem, ITelemetryUnloadState,
    SampleRate, SendRequestReason, _eInternalMessageId, _throwInternal, addPageHideEventListener, addPageShowEventListener,
    addPageUnloadEventListener, arrForEach, createOfflineListener, createProcessTelemetryContext, createUniqueNamespace,
    eEventsDiscardedReason, eLoggingSeverity, hrTime, isFeatureEnabled, isGreaterThanZero, isNullOrUndefined, mergeEvtNamespace, newId,
    onConfigChange, removePageHideEventListener, removePageShowEventListener, removePageUnloadEventListener
} from "@microsoft/applicationinsights-core-js";
import { IPromise, createPromise } from "@nevware21/ts-async";
import { ITimerHandler, isNumber, objDeepFreeze, scheduleTimeout } from "@nevware21/ts-utils";
import { IOtlpChannelConfig } from "./Interfaces/IOtlpChannelConfig";
import { STR_OTLP_CHANNEL } from "./InternalConstants";
import { IOtlpBatch, IOtlpStoredRecord, OtlpBatcher, buildPayload } from "./OtlpBatcher";
import { IOtlpSendResult, OtlpHttpSender } from "./OtlpHttpSender";
import { createOtlpSampler } from "./OtlpSampler";
import { OtlpSessionStorageBuffer } from "./OtlpSessionStorageBuffer";
import { IAttrOptions } from "./convert/AttributeBuilder";
import { IConvertCtx, IKeyMap, IOtlpRecord, convertItem } from "./convert/ItemConverter";
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
    metricsAsLogs: true,
    samplingPercentage: { isVal: _isValidSamplingPercentage, v: 100 },
    piiMode: "drop",
    maxBatchSizeInBytes: { isVal: isGreaterThanZero, v: DEFAULT_MAX_BATCH_BYTES },
    maxRecordsPerBatch: { isVal: isGreaterThanZero, v: DEFAULT_MAX_RECORDS },
    maxBatchInterval: { isVal: isGreaterThanZero, v: DEFAULT_BATCH_INTERVAL },
    eventsLimitInMem: { isVal: isGreaterThanZero, v: DEFAULT_EVENTS_LIMIT },
    enableSessionStorageBuffer: true,
    namePrefix: undefValue,
    bufferOverride: false,
    transports: undefValue,
    unloadTransports: undefValue,
    httpXHROverride: undefValue,
    fetchCredentials: undefValue,
    disableXhrSync: false,
    disableFetchKeepAlive: false,
    disableSendBeaconSplit: true,
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
        let _persistentBuffer: OtlpSessionStorageBuffer;
        let _pendingPersistentBuffer: OtlpSessionStorageBuffer;
        let _offlineListener: IOfflineListener;
        let _storageEnabled: boolean;
        let _storagePrefix: string;
        let _storageOverride: any;
        let _storageConfigPending: boolean;
        let _pendingStorageEnabled: boolean;
        let _pendingStoragePrefix: string;
        let _pendingStorageOverride: any;
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
                _offlineListener = createOfflineListener(_evtNamespace);
                _self._addHook(_offlineListener.addListener((state) => {
                    if (state.isOnline && !_paused) {
                        _checkLimits();
                    }
                }));

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
                    _configurePersistentBuffer();
                    if (!_config.disableTelemetry && !_paused && (!_offlineListener || _offlineListener.isOnline())) {
                        _checkLimits();
                    }
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
                // OfflineChannel's generic contract supports one endpoint per payload and therefore
                // cannot safely replay OTLP's separate trace and log signals. This channel provides
                // integrated persistent storage instead.
                return null;
            };

            _self.isCompletelyIdle = (): boolean => {
                return _inFlight === 0 && _batcher.count() === 0 && !_retryTimer;
            };

            _self.getOfflineListener = (): IOfflineListener => {
                return _offlineListener;
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
                _offlineListener && _offlineListener.unload();
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

            function _configurePersistentBuffer(): void {
                let enabled = !!_config.enableSessionStorageBuffer;
                let prefix = _config.namePrefix || "";
                let override = _config.bufferOverride;
                if (_persistentBuffer && _storageEnabled === enabled && _storagePrefix === prefix && _storageOverride === override) {
                    _storageConfigPending = false;
                    return;
                }
                if (_inFlight > 0) {
                    let pending = _pendingPersistentBuffer;
                    if (!pending || _pendingStorageEnabled !== enabled || _pendingStoragePrefix !== prefix ||
                            _pendingStorageOverride !== override) {
                        pending = new OtlpSessionStorageBuffer(_self.diagLog(), _config);
                    }
                    let records = _batcher.getRecords();
                    if (_persistentBuffer) {
                        records = _dedupeRecords(_persistentBuffer.getAllItems().concat(records));
                    }
                    records = _dedupeRecords(pending.getAllItems().concat(records));
                    if (pending.replace(records)) {
                        _pendingPersistentBuffer = pending;
                        _pendingStorageEnabled = enabled;
                        _pendingStoragePrefix = prefix;
                        _pendingStorageOverride = override;
                    }
                    _storageConfigPending = true;
                    return;
                }

                let previous = _persistentBuffer;
                let current = _batcher.getRecords();
                if (previous) {
                    current = _dedupeRecords(previous.getAllItems().concat(current));
                }

                let next = _pendingPersistentBuffer;
                if (!next || _pendingStorageEnabled !== enabled || _pendingStoragePrefix !== prefix ||
                        _pendingStorageOverride !== override) {
                    next = new OtlpSessionStorageBuffer(_self.diagLog(), _config);
                }
                let merged = _dedupeRecords(next.getAllItems().concat(current));
                if (!next.replace(merged)) {
                    _storageConfigPending = true;
                    return;
                }

                _persistentBuffer = next;
                _storageEnabled = enabled;
                _storagePrefix = prefix;
                _storageOverride = override;
                _storageConfigPending = false;
                _pendingPersistentBuffer = null;
                _pendingStorageEnabled = false;
                _pendingStoragePrefix = null;
                _pendingStorageOverride = null;

                _batcher = new OtlpBatcher();
                arrForEach(merged, (record) => {
                    _batcher.addStored(record);
                });
                if (previous && previous !== _persistentBuffer) {
                    previous.clear();
                }
                _checkLimits();
            }

            function _dedupeRecords(records: IOtlpStoredRecord[]): IOtlpStoredRecord[] {
                let seen: { [id: string]: boolean } = {};
                return records.filter((record) => {
                    if (!record || !record.id || seen[record.id]) {
                        return false;
                    }
                    seen[record.id] = true;
                    return true;
                });
            }

            function _addItem(item: ITelemetryItem): void {
                let record: IOtlpRecord = convertItem(item, _convertCtx, _observedNow());
                if (!record) {
                    return;
                }

                let notificationItem = {
                    name: item.name,
                    baseType: item.baseType
                } as ITelemetryItem;
                if ((_persistentBuffer && !_persistentBuffer.canAdd()) ||
                        (_pendingPersistentBuffer && !_pendingPersistentBuffer.canAdd())) {
                    _notifyDiscarded([notificationItem], eEventsDiscardedReason.QueueFull);
                    return;
                }

                let stored = _batcher.add(_getResourceInfo(item), record, notificationItem, newId(22));
                _persistentBuffer && _persistentBuffer.add(stored);
                _pendingPersistentBuffer && _pendingPersistentBuffer.add(stored);
                _checkLimits();
            }

            function _checkLimits(): void {
                let limit = _persistentBuffer && _persistentBuffer.isEnabled()
                    ? Math.min(_config.eventsLimitInMem, OtlpSessionStorageBuffer.MAX_BUFFER_SIZE)
                    : _config.eventsLimitInMem;
                if (_batcher.count() > limit) {
                    let dropped = _batcher.dropOldest(DROP_BLOCK);
                    if (dropped.items.length) {
                        _removePersistent(dropped.ids);
                        _notifyDiscarded(dropped.items, eEventsDiscardedReason.QueueFull);
                    }
                }

                if (_paused || (_offlineListener && !_offlineListener.isOnline())) {
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
                if (_offlineListener && !_offlineListener.isOnline()) {
                    return;
                }

                let maxRecords = !isAsync && !_config.disableSendBeaconSplit ? 1 : _config.maxRecordsPerBatch;
                let batches = _batcher.takeBatches(maxRecords, _config.maxBatchSizeInBytes);
                if (batches.length) {
                    _notifySendRequest(sendReason, isAsync);
                }
                arrForEach(batches, (batch) => {
                    _markPersistentAsSent(batch);
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
                    _onSendComplete(batch, result, sendReason);
                    if (_inFlight === 0 && _storageConfigPending) {
                        _configurePersistentBuffer();
                    }
                    _checkFlushComplete();
                }, sendReason);

                if (!started) {
                    _inFlight--;
                    // Without a usable transport or endpoint the records cannot be exported, drop them
                    // rather than letting the buffer grow without bound.
                    _clearPersistentSent(batch);
                    _notifyDiscarded(batch.items, eEventsDiscardedReason.NonRetryableStatus);
                    _checkFlushComplete();
                }
            }

            function _onSendComplete(batch: IOtlpBatch, result: IOtlpSendResult, sendReason: SendRequestReason): void {
                if (result.success) {
                    let isUnload = _isPageUnloading || sendReason === SendRequestReason.Unload ||
                        sendReason === SendRequestReason.SdkUnload;
                    if (isUnload && _hasPersistentStorage()) {
                        // Fetch keepalive reports success once queued, before the collector responds.
                        // Keep a durable copy for at-least-once replay rather than risk silent loss.
                        _requeuePersistent(batch);
                        return;
                    }

                    _clearPersistentSent(batch);
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
                    if (result.retry && _isPageUnloading && _hasPersistentStorage()) {
                        _requeuePersistent(batch);
                        _batcher.requeue(batch);
                        return;
                    }

                    _clearPersistentSent(batch);
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

                _requeuePersistent(batch);
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

            function _hasPersistentStorage(): boolean {
                return !!((_persistentBuffer && _persistentBuffer.isEnabled()) ||
                    (_pendingPersistentBuffer && _pendingPersistentBuffer.isEnabled()));
            }

            function _markPersistentAsSent(batch: IOtlpBatch): void {
                _persistentBuffer && _persistentBuffer.markAsSent(batch);
                _pendingPersistentBuffer && _pendingPersistentBuffer.markAsSent(batch);
            }

            function _clearPersistentSent(batch: IOtlpBatch): void {
                _persistentBuffer && _persistentBuffer.clearSent(batch);
                _pendingPersistentBuffer && _pendingPersistentBuffer.clearSent(batch);
            }

            function _requeuePersistent(batch: IOtlpBatch): void {
                _persistentBuffer && _persistentBuffer.requeue(batch);
                _pendingPersistentBuffer && _pendingPersistentBuffer.requeue(batch);
            }

            function _removePersistent(ids: string[]): void {
                _persistentBuffer && _persistentBuffer.remove(ids);
                _pendingPersistentBuffer && _pendingPersistentBuffer.remove(ids);
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
                if (_persistentBuffer) {
                    let merged = _dedupeRecords(_persistentBuffer.getItems().concat(_batcher.getRecords()));
                    _batcher = new OtlpBatcher();
                    arrForEach(merged, (record) => {
                        _batcher.addStored(record);
                    });
                    _checkLimits();
                }
            }

            function _initDefaults(): void {
                _generation++;
                _config = null;
                _batcher = new OtlpBatcher();
                _sender = null;
                _convertCtx = null;
                _sample = null;
                _persistentBuffer = null;
                _pendingPersistentBuffer = null;
                _offlineListener = null;
                _storageEnabled = false;
                _storagePrefix = null;
                _storageOverride = null;
                _storageConfigPending = false;
                _pendingStorageEnabled = false;
                _pendingStoragePrefix = null;
                _pendingStorageOverride = null;
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

    /**
     * Returns the browser online/offline listener used by the channel.
     */
    public getOfflineListener(): IOfflineListener {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    public initialize(config: IConfiguration, core: IAppInsightsCore, extensions: IPlugin[]): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public processTelemetry(item: ITelemetryItem, itemCtx?: IProcessTelemetryContext): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
}

export { buildPayload };
