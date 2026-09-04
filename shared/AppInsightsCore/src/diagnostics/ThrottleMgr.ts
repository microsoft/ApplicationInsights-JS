// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { arrForEach, arrIndexOf, isNullOrUndefined, mathFloor, mathMin, objCreate, objForEachKey, strTrim } from "@nevware21/ts-utils";
import { onConfigChange } from "../config/DynamicConfig";
import { _throwInternal, safeGetLogger } from "../diagnostics/DiagnosticLogger";
import { _eInternalMessageId, eLoggingSeverity } from "../enums/ai/LoggingEnums";
import { IAppInsightsCore } from "../interfaces/ai/IAppInsightsCore";
import { IConfig } from "../interfaces/ai/IConfig";
import { IConfiguration } from "../interfaces/ai/IConfiguration";
import { IDiagnosticLogger } from "../interfaces/ai/IDiagnosticLogger";
import { IThrottleInterval, IThrottleLocalStorageObj, IThrottleMgrConfig, IThrottleResult } from "../interfaces/ai/IThrottleMgr";
import { isFeatureEnabled } from "../utils/HelperFuncs";
import { randomValue } from "../utils/RandomHelper";
import { utlCanUseLocalStorage, utlGetLocalStorage, utlSetLocalStorage } from "../utils/StorageHelperFuncs";

const THROTTLE_STORAGE_PREFIX = "appInsightsThrottle";
const FEATURE_STORAGE_PREFIX = "feature-";

interface ThrottleQueueItem {
    key: _eInternalMessageId | number | string;
    callback: () => void;
    isFeature: boolean;
    sdkDefaultState?: boolean;
}

export class ThrottleMgr {
    public canThrottle: (msgId: _eInternalMessageId | number) => boolean;
    public useFeature: (feature: string, callback: () => void, sdkDefaultState?: boolean) => IThrottleResult | null;
    public sendMessage: (msgId: _eInternalMessageId, message: string, severity?: eLoggingSeverity) => IThrottleResult | null;
    public getConfig: () => IThrottleMgrConfig;
    public isTriggered: (msgId: _eInternalMessageId | number) => boolean; // this function is to get previous triggered status
    public isReady: () => boolean
    public onReadyState: (isReady?: boolean, flushAll?: boolean) => boolean;
    public flush: (msgId: _eInternalMessageId | number) => boolean;
    public flushAll: () => boolean;
    public config: IThrottleMgrConfig;

    constructor(core: IAppInsightsCore, namePrefix?: string) {
        let _self = this;
        let _canUseLocalStorage: boolean;
        let _logger: IDiagnosticLogger | null | undefined;
        let _config: {[msgKey: number]: IThrottleMgrConfig};
        let _featureConfig: {[feature: string]: IThrottleMgrConfig};
        let _localStorageObj: {[key: string]: IThrottleLocalStorageObj | null | undefined};
        let _isTriggered: {[key: string]: boolean}; //_isTriggered is to make sure that we only trigger throttle once a day
        let _namePrefix: string;
        let _queue: {[key: string]: Array<ThrottleQueueItem>};
        let _isReady: boolean = false;

        _initConfig();

        // Special internal method to allow the unit tests and DebugPlugin to hook embedded objects
        _self["_getDbgPlgTargets"] = () => {
            return [_queue];
        };

        _self.getConfig = (): IThrottleMgrConfig => {
            return _config;
        }

        /**
         * Check if it is the correct day to send message.
         * If _isTriggered is true, even if canThrottle returns true, message will not be sent,
         * because we only allow triggering sendMessage() once a day.
         * @returns if the current date is the valid date to send message
         */
        _self.canThrottle = (msgId: _eInternalMessageId | number ): boolean => {
            let localObj = _getLocalStorageObjByKey(msgId);
            let cfg = _getCfgByKey(msgId);
            return _canThrottle(cfg, _canUseLocalStorage, localObj);
        }

        /**
         * Run a feature operation when enabled by featureOptIn and allowed by its named throttle configuration.
         * @param feature - The featureOptIn and throttleMgrCfg key.
         * @param callback - The feature operation to run when allowed.
         * @param sdkDefaultState - The default state when featureOptIn does not define the feature.
         * @returns The result of applying the throttle, or null when queued or disabled by featureOptIn.
         */
        _self.useFeature = (feature: string, callback: () => void, sdkDefaultState?: boolean): IThrottleResult | null => {
            if (!feature || !callback || isFeatureEnabled(feature, core.config, sdkDefaultState) !== true) {
                return null;
            }

            return _flushCallback(feature, callback, true, true, sdkDefaultState);
        }

        /**
         * Check if throttle is triggered on current day(UTC)
         * if canThrottle returns false, isTriggered will return false
         * @returns if throttle is triggered on current day(UTC)
         */
        _self.isTriggered = (msgId: _eInternalMessageId | number): boolean => {
            return _isTrigger(msgId);
        }

        /**
         * Before isReady set to true, all message will be stored in queue.
         * Message will only be sent out after isReady set to true.
         * Initial and default value: false
         * @returns isReady state
         */
        _self.isReady = (): boolean => {
            return _isReady;
        }

        /**
         * Flush all message with given message key in queue with isReady state set to true.
         * @returns if message queue is flushed
         */
        _self.flush = (msgId: _eInternalMessageId | number): boolean => {
            return _flushQueue(_getMapKey(msgId, false));
        }

        /**
         * Flush all message in queue with isReady state set to true.
         * @returns if message queue is flushed
         */
        _self.flushAll = (): boolean => {
            try {
                if (_queue) {
                    let result = true;
                    objForEachKey(_queue, (key) => {
                        let isFlushed = _flushQueue(key);
                        result = result && isFlushed;
                    });
                    return result;
                }
               
            } catch(err) {
                // eslint-disable-next-line no-empty
            }
            return false;
        }

        /**
         * Set isReady State
         * if isReady set to true, message queue will be flushed automatically.
         * @param isReady - isReady State
         * @pa
         * @returns if message queue is flushed
         */
        _self.onReadyState = (isReady?: boolean, flushAll: boolean = true): boolean => {
            _isReady  = isNullOrUndefined(isReady)? true : isReady;
            if (_isReady && flushAll) {
                return _self.flushAll();
            }
            return null;
        }
       
        _self.sendMessage = (msgID: _eInternalMessageId | number, message: string, severity?: eLoggingSeverity): IThrottleResult | null => {
            return _flushCallback(msgID, () => {
                _sendMessage(msgID, _logger, message, severity);
            }, true, false);
        }

        function _flushCallback(
            key: _eInternalMessageId | number | string, callback: () => void, saveUnsent?: boolean, isFeature?: boolean, sdkDefaultState?: boolean
        ): IThrottleResult | null {
            if (isFeature && isFeatureEnabled(key + "", core.config, sdkDefaultState) !== true) {
                return null;
            }

            if (_isReady) {
                let cfg = _getCfgByKey(key, isFeature);
                if (isFeature && !cfg) {
                    callback();
                    return {
                        isThrottled: true,
                        throttleNum: 1
                    };
                }

                let isSampledIn = _canSampledIn(cfg);
                if (!isSampledIn) {
                    return null;
                }
                let localStorageObj = _getLocalStorageObjByKey(key, isFeature);
                let canThrottle = _canThrottle(cfg, _canUseLocalStorage, localStorageObj);
                let throttled = false;
                let number = 0;
                let isTriggered = _isTrigger(key, isFeature);
                let mapKey = _getMapKey(key, isFeature);
                try {
                    if (canThrottle && !isTriggered) {
                        number = mathMin(cfg.limit.maxSendNumber, localStorageObj.count + 1);
                        localStorageObj.count = 0;
                        throttled = true;
                        _isTriggered[mapKey] = true;
                        localStorageObj.preTriggerDate = new Date();
                    } else {
                        _isTriggered[mapKey] = canThrottle;
                        localStorageObj.count += 1;
                    }
                    let localStorageName = _getLocalStorageName(key, _namePrefix, isFeature);
                    _resetLocalStorage(_logger, localStorageName, localStorageObj);
                    for (let i = 0; i < number; i++) {
                        callback();
                    }
                } catch(e) {
                    // eslint-disable-next-line no-empty
                }
                return {
                    isThrottled: throttled,
                    throttleNum: number
                } as IThrottleResult;
            } else {
                if (!!saveUnsent) {
                    let queue = _getQueueByKey(key, isFeature);
                    queue.push({
                        key: key,
                        callback: callback,
                        isFeature: !!isFeature,
                        sdkDefaultState: sdkDefaultState
                    });
                }
            }
            return null;
        }

        function _flushQueue(mapKey: string): boolean {
            try {
                let queue = _queue[mapKey];
                if (queue && queue.length > 0) {
                    let items = queue.slice(0);
                    _queue[mapKey] = [];
                    arrForEach(items, (item: ThrottleQueueItem) => {
                        _flushCallback(item.key, item.callback, false, item.isFeature, item.sdkDefaultState);
                    });
                    return true;
                }
            } catch(err) {
                // eslint-disable-next-line no-empty
            }
            return false;
        }
        
        function _initConfig() {
            _logger = safeGetLogger(core);
            _isTriggered = objCreate(null);
            _localStorageObj = objCreate(null);
            _queue = objCreate(null);
            _config = objCreate(null);
            _featureConfig = objCreate(null);
            _setCfgByKey(_eInternalMessageId.DefaultThrottleMsgKey);
            _namePrefix = !isNullOrUndefined(namePrefix)? namePrefix : "";

            core.addUnloadHook(onConfigChange<IConfig & IConfiguration>(core.config, (details) => {
                let coreConfig = details.cfg;
                _canUseLocalStorage = utlCanUseLocalStorage();
                
                let configMgr = coreConfig.throttleMgrCfg || {};
                objForEachKey(configMgr, (key, cfg) => {
                    _setCfgByKey(key, cfg, true);
                    let msgId = parseInt(key);
                    if (msgId + "" === key) {
                        _setCfgByKey(msgId, cfg, false);
                    }
                });
        
            }));
        }

        function _getCfgByKey(key: _eInternalMessageId | number | string, isFeature?: boolean) {
            if (isFeature) {
                let feature = key + "";
                let coreConfig = core.config as IConfiguration & IConfig;
                let featureCfg = coreConfig.throttleMgrCfg && coreConfig.throttleMgrCfg[feature];
                if (featureCfg) {
                    _setCfgByKey(feature, featureCfg, true);
                } else {
                    delete _featureConfig[feature];
                }
                return _featureConfig[feature];
            }
            return _config[+key] || _config[_eInternalMessageId.DefaultThrottleMsgKey];
        }

        function _setCfgByKey(key: _eInternalMessageId | number | string, config?: IThrottleMgrConfig, isFeature?: boolean) {
            try {
                let cfg = config || {};
                let curCfg = {} as IThrottleMgrConfig;
                curCfg.disabled = !!cfg.disabled;
                let configInterval = cfg.interval || {};
                curCfg.interval = _getIntervalConfig(configInterval);
                let limit = {
                    samplingRate: !isNullOrUndefined(cfg.limit?.samplingRate) ? cfg.limit.samplingRate : 100,
                    // dafault: every time sent only 1 event
                    maxSendNumber: cfg.limit?.maxSendNumber || 1
                };
                curCfg.limit = limit;
                if (isFeature) {
                    _featureConfig[key + ""] = curCfg;
                } else {
                    _config[+key] = curCfg;
                }

            } catch (e) {
                // eslint-disable-next-line no-empty
            }
        }

        function _getIntervalConfig(interval: IThrottleInterval) {
            interval = interval || {};
            let monthInterval = interval?.monthInterval;
            let dayInterval = interval?.dayInterval;
            let isSpecificDaysGiven = interval?.daysOfMonth && interval?.daysOfMonth.length > 0;

            // default: send data every 3 month each year
            if (isNullOrUndefined(monthInterval) && isNullOrUndefined(dayInterval)) {
                interval.monthInterval = 3;
                if (!isSpecificDaysGiven) {
                    // default: send data on 28th
                    interval.daysOfMonth = [28];
                }
            }
            interval = {
                // dafault: sent every three months
                monthInterval: interval?.monthInterval,
                dayInterval: interval?.dayInterval,
                daysOfMonth: interval?.daysOfMonth
            } as IThrottleInterval;
            return interval;
        }

        function _canThrottle(config: IThrottleMgrConfig, canUseLocalStorage: boolean, localStorageObj: IThrottleLocalStorageObj) {
            if (config && !config.disabled && canUseLocalStorage && !isNullOrUndefined(localStorageObj)) {
                let curDate = _getThrottleDate();
                let date = localStorageObj.date;
                let interval = config.interval;
                let monthCheck = 1;
                if (interval?.monthInterval) {
                    let monthExpand = (curDate.getUTCFullYear() - date.getUTCFullYear()) * 12 + curDate.getUTCMonth() - date.getUTCMonth();
                    monthCheck = _checkInterval(interval.monthInterval, 0, monthExpand);
                }

                let dayCheck = 1;
                if (interval?.daysOfMonth && interval.daysOfMonth.length > 0) {
                    dayCheck = arrIndexOf(interval.daysOfMonth, curDate.getUTCDate());
                } else if (interval?.dayInterval) {
                    let daySpan =  mathFloor((curDate.getTime() - date.getTime()) / 86400000);
                    dayCheck = _checkInterval(interval.dayInterval, 0, daySpan);
                }

                return monthCheck >= 0 && dayCheck >= 0;
            }
            return false;
        }

        function _getLocalStorageName(key: _eInternalMessageId | number | string, prefix?: string, isFeature?: boolean) {
            let fix = !isNullOrUndefined(prefix)? prefix : "";
            if (key) {
                return THROTTLE_STORAGE_PREFIX + fix + "-" + (isFeature ? FEATURE_STORAGE_PREFIX : "") + key;
            }
            return null;
        }

        // returns if throttle is triggered on current Date
        function _isTriggeredOnCurDate(preTriggerDate?: Date) {
            try {
                if(preTriggerDate) {
                    let curDate = new Date();
                    return preTriggerDate.getUTCFullYear() === curDate.getUTCFullYear() &&
                    preTriggerDate.getUTCMonth() === curDate.getUTCMonth() &&
                    preTriggerDate.getUTCDate() === curDate.getUTCDate();
                }
            } catch (e) {
                // eslint-disable-next-line no-empty
            }
            return false;
        }

        // transfer local storage string value to object that identifies start date, current count and preTriggerDate
        function _getLocalStorageObj(value: string, logger: IDiagnosticLogger, storageName: string) {
            try {
                let storageObj = {
                    date: _getThrottleDate(),
                    count: 0
                } as IThrottleLocalStorageObj;
                if (value) {
                    let obj = JSON.parse(value);
                    let curObj = {
                        date: _getThrottleDate(obj.date) || storageObj.date,
                        count: obj.count || storageObj.count,
                        preTriggerDate: obj.preTriggerDate? _getThrottleDate(obj.preTriggerDate) : undefined
                    } as IThrottleLocalStorageObj;
                    return curObj;
                } else {
                    _resetLocalStorage(logger, storageName, storageObj);
                    return storageObj;
                }
            } catch(e) {
                // eslint-disable-next-line no-empty
            }
            return null;
        }

        // if datestr is not defined, current date will be returned
        function _getThrottleDate(dateStr?: string) {
            // if new Date() can't be created through the provided dateStr, null will be returned.
            try {
                if (dateStr) {
                    let date = new Date(dateStr);
                    //make sure it is a valid Date Object
                    if (!isNaN(date.getDate())) {
                        return date;
                    }
                } else {
                    return new Date();
                }
                
            } catch (e) {
                // eslint-disable-next-line no-empty
            }
            return null;
        }

        function _resetLocalStorage(logger: IDiagnosticLogger, storageName: string, obj: IThrottleLocalStorageObj) {
            try {
                return utlSetLocalStorage(logger, storageName, strTrim(JSON.stringify(obj)));
            } catch (e) {
                // eslint-disable-next-line no-empty
            }
            return false;
        }

        function _checkInterval(interval: number, start: number, current: number) {
            if (interval <= 0) {
                return 1;
            }
            // count from start year
            return  (current >= start) && (current - start) % interval == 0 ? mathFloor((current - start) / interval) + 1 : -1;
        }
        
        function _sendMessage(msgID: _eInternalMessageId, logger: IDiagnosticLogger, message: string, severity?: eLoggingSeverity) {
            _throwInternal(logger,
                severity || eLoggingSeverity.CRITICAL,
                msgID,
                message);
        }

        // NOTE: config.limit.samplingRate is set to 4 decimal places,
        // so config.limit.samplingRate = 1 means 0.0001%
        function _canSampledIn(cfg: IThrottleMgrConfig) {
            try {
                return cfg.limit.samplingRate > 0 && randomValue(1000000) <= cfg.limit.samplingRate;
            } catch (e) {
                // eslint-disable-next-line no-empty
            }
            return false;
        }

        function _getMapKey(key: _eInternalMessageId | number | string, isFeature?: boolean) {
            return (isFeature ? FEATURE_STORAGE_PREFIX : "") + key;
        }

        function _getLocalStorageObjByKey(key: _eInternalMessageId | number | string, isFeature?: boolean) {
            try {
                let mapKey = _getMapKey(key, isFeature);
                let curObj = _localStorageObj[mapKey];
                if (!curObj) {
                    let localStorageName = _getLocalStorageName(key, _namePrefix, isFeature);
                    curObj = _getLocalStorageObj(utlGetLocalStorage(_logger, localStorageName), _logger, localStorageName);
                    _localStorageObj[mapKey] = curObj;
                }
                return _localStorageObj[mapKey];

            } catch (e) {
                // eslint-disable-next-line no-empty
            }
            return null;
        }

        function _isTrigger(key: _eInternalMessageId | number | string, isFeature?: boolean) {
            let mapKey = _getMapKey(key, isFeature);
            let isTrigger = false;
            let localStorageObj = _getLocalStorageObjByKey(key, isFeature);
            if (localStorageObj) {
                isTrigger = _isTriggeredOnCurDate(localStorageObj.preTriggerDate);
            }
            _isTriggered[mapKey] = isTrigger;
            return isTrigger;
        }

        function _getQueueByKey(key: _eInternalMessageId | number | string, isFeature?: boolean) {
            _queue = _queue || objCreate(null);
            let mapKey = _getMapKey(key, isFeature);
            if (isNullOrUndefined(_queue[mapKey])) {
                _queue[mapKey] = [];
            }
            return _queue[mapKey];
        }
    }
}
