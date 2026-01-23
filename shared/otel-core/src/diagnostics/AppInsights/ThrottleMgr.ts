import { arrForEach, arrIndexOf, isNullOrUndefined, mathFloor, mathMin, objForEachKey, strTrim } from "@nevware21/ts-utils";
import { onConfigChange } from "../../config/AppInsights/DynamicConfig";
import { _eInternalMessageId, eLoggingSeverity } from "../../enums/AppInsights/LoggingEnums";
import { IAppInsightsCore } from "../../interfaces/AppInsights/IAppInsightsCore";
import { IConfig } from "../../interfaces/AppInsights/IConfig";
import { IConfiguration } from "../../interfaces/AppInsights/IConfiguration";
import { IDiagnosticLogger } from "../../interfaces/AppInsights/IDiagnosticLogger";
import {
    IThrottleInterval, IThrottleLocalStorageObj, IThrottleMgrConfig, IThrottleResult
} from "../../interfaces/AppInsights/IThrottleMgr";
import { isNotNullOrUndefined } from "../../utils/AppInsights/HelperFuncsCore";
import { randomValue } from "../../utils/AppInsights/RandomHelper";
import { utlCanUseLocalStorage, utlGetLocalStorage, utlSetLocalStorage } from "../../utils/AppInsights/StorageHelperFuncs";
import { safeGetLogger } from "./DiagnosticLogger";

const THROTTLE_STORAGE_PREFIX = "appInsightsThrottle";

interface SendMsgParameter {
    msgID: _eInternalMessageId,
    message: string,
    severity?: eLoggingSeverity
}

export class ThrottleMgr {
    public canThrottle: (msgId: _eInternalMessageId | number) => boolean;
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
        let _localStorageObj: {[msgKey: number]: IThrottleLocalStorageObj | null | undefined};
        let _isTriggered: {[msgKey: number]: boolean}; //_isTriggered is to make sure that we only trigger throttle once a day
        let _namePrefix: string;
        let _queue: {[msgKey: number]: Array<SendMsgParameter>};
        let _isReady: boolean = false;
        let _isSpecificDaysGiven: boolean = false;

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
            try {
                let queue = _getQueueByKey(msgId);
                if (queue && queue.length > 0) {
                    let items = queue.slice(0);
                    _queue[msgId] = []
                    arrForEach(items, (item: SendMsgParameter) => {
                        _flushMessage(item.msgID, item.message, item.severity, false);
                    });
                    return true;
                }
            } catch(err) {
                // eslint-disable-next-line no-empty
            }
            return false;
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
                        let isFlushed = _self.flush(parseInt(key));
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
            return _flushMessage(msgID, message, severity, true);

        }

        function _flushMessage(msgID: _eInternalMessageId | number, message: string, severity?: eLoggingSeverity, saveUnsentMsg?: boolean) {
            if (_isReady) {
                let isSampledIn = _canSampledIn(msgID);
                if (!isSampledIn) {
                    return;
                }
                let cfg = _getCfgByKey(msgID);
                let localStorageObj = _getLocalStorageObjByKey(msgID);
                let canThrottle = _canThrottle(cfg, _canUseLocalStorage, localStorageObj);
                let throttled = false;
                let number = 0;
                let isTriggered = _isTrigger(msgID);
                try {
                    if (canThrottle && !isTriggered) {
                        number = mathMin(cfg.limit.maxSendNumber, localStorageObj.count + 1);
                        localStorageObj.count = 0;
                        throttled = true;
                        _isTriggered[msgID] = true;
                        localStorageObj.preTriggerDate = new Date();
                    } else {
                        _isTriggered[msgID] = canThrottle;
                        localStorageObj.count += 1;
                    }
                    let localStorageName = _getLocalStorageName(msgID);
                    _resetLocalStorage(_logger, localStorageName, localStorageObj);
                    for (let i = 0; i < number; i++) {
                        _sendMessage(msgID, _logger, message, severity);
                    }
                } catch(e) {
                    // eslint-disable-next-line no-empty
                }
                return {
                    isThrottled: throttled,
                    throttleNum: number
                } as IThrottleResult;
            } else {
                if (!!saveUnsentMsg) {
                    let queue = _getQueueByKey(msgID);
                    queue.push({
                        msgID: msgID,
                        message: message,
                        severity: severity
                    } as SendMsgParameter);
                }
            }
            return null;
        }
        
        function _initConfig() {
            _logger = safeGetLogger(core);
            _isTriggered = {};
            _localStorageObj = {};
            _queue = {};
            _config = {};
            _setCfgByKey(_eInternalMessageId.DefaultThrottleMsgKey);
            _namePrefix = isNotNullOrUndefined(namePrefix)? namePrefix : "";

            core.addUnloadHook(onConfigChange<IConfig & IConfiguration>(core.config, (details) => {
                let coreConfig = details.cfg;
                _canUseLocalStorage = utlCanUseLocalStorage();
                
                let configMgr = coreConfig.throttleMgrCfg || {};
                objForEachKey(configMgr, (key, cfg) => {
                    _setCfgByKey(parseInt(key), cfg)
                });
        
            }));
        }

        function _getCfgByKey(msgID: _eInternalMessageId | number) {
            return _config[msgID] || _config[_eInternalMessageId.DefaultThrottleMsgKey];
        }

        function _setCfgByKey(msgID: _eInternalMessageId | number, config?: IThrottleMgrConfig) {
            try {
                let cfg = config || {};
                let curCfg = {} as IThrottleMgrConfig;
                curCfg.disabled = !!cfg.disabled;
                let configInterval = cfg.interval || {};
                _isSpecificDaysGiven = configInterval?.daysOfMonth && configInterval?.daysOfMonth.length > 0;
                curCfg.interval = _getIntervalConfig(configInterval);
                let limit = {
                    samplingRate: cfg.limit?.samplingRate || 100,
                    // dafault: every time sent only 1 event
                    maxSendNumber: cfg.limit?.maxSendNumber || 1
                };
                curCfg.limit = limit;
                _config[msgID] = curCfg;

            } catch (e) {
                // eslint-disable-next-line no-empty
            }
        }

        function _getIntervalConfig(interval: IThrottleInterval) {
            interval = interval || {};
            let monthInterval = interval?.monthInterval;
            let dayInterval = interval?.dayInterval;

            // default: send data every 3 month each year
            if (isNullOrUndefined(monthInterval) && isNullOrUndefined(dayInterval)) {
                interval.monthInterval = 3;
                if (!_isSpecificDaysGiven) {
                    // default: send data on 28th
                    interval.daysOfMonth = [28];
                    _isSpecificDaysGiven = true;
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
            if (config && !config.disabled && canUseLocalStorage && isNotNullOrUndefined(localStorageObj)) {
                let curDate = _getThrottleDate();
                let date = localStorageObj.date;
                let interval = config.interval;
                let monthCheck = 1;
                if (interval?.monthInterval) {
                    let monthExpand = (curDate.getUTCFullYear() - date.getUTCFullYear()) * 12 + curDate.getUTCMonth() - date.getUTCMonth();
                    monthCheck = _checkInterval(interval.monthInterval, 0, monthExpand);
                }

                let dayCheck = 1;
                if (_isSpecificDaysGiven) {
                    dayCheck = arrIndexOf(interval.daysOfMonth, curDate.getUTCDate());
                } else if (interval?.dayInterval) {
                    let daySpan =  mathFloor((curDate.getTime() - date.getTime()) / 86400000);
                    dayCheck = _checkInterval(interval.dayInterval, 0, daySpan);
                }

                return monthCheck >= 0 && dayCheck >= 0;
            }
            return false;
        }

        function _getLocalStorageName(msgKey: _eInternalMessageId | number, prefix?: string) {
            let fix = isNotNullOrUndefined(prefix)? prefix : "";
            if (msgKey) {
                return THROTTLE_STORAGE_PREFIX + fix + "-" + msgKey;
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
            logger.throwInternal(
                severity || eLoggingSeverity.CRITICAL,
                msgID,
                message);
        }

        // NOTE: config.limit.samplingRate is set to 4 decimal places,
        // so config.limit.samplingRate = 1 means 0.0001%
        function _canSampledIn(msgID: _eInternalMessageId) {
            try {
                let cfg = _getCfgByKey(msgID)
                return randomValue(1000000) <= cfg.limit.samplingRate;
            } catch (e) {
                // eslint-disable-next-line no-empty
            }
            return false;
        }

        function _getLocalStorageObjByKey(key: _eInternalMessageId | number) {
            try {
                let curObj = _localStorageObj[key];
                if (!curObj) {
                    let localStorageName = _getLocalStorageName(key, _namePrefix);
                    curObj = _getLocalStorageObj(utlGetLocalStorage(_logger, localStorageName), _logger, localStorageName);
                    _localStorageObj[key] = curObj;
                }
                return _localStorageObj[key];

            } catch (e) {
                // eslint-disable-next-line no-empty
            }
            return null;
        }

        function _isTrigger(key: _eInternalMessageId | number) {
            let isTrigger = _isTriggered[key];
            if (isNullOrUndefined(isTrigger)) {
                isTrigger = false;
                let localStorageObj = _getLocalStorageObjByKey(key);
                if (localStorageObj) {
                    isTrigger = _isTriggeredOnCurDate(localStorageObj.preTriggerDate);
                }
                _isTriggered[key] = isTrigger;
            }
            return _isTriggered[key];
        }

        function _getQueueByKey(key: _eInternalMessageId | number) {
            _queue = _queue || {};
            if (isNullOrUndefined(_queue[key])) {
                _queue[key] = [];
            }
            return _queue[key];
        }
    }
}
