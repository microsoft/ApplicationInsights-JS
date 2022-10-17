import {
    IAppInsightsCore, IDiagnosticLogger, _eInternalMessageId, _throwInternal, arrForEach, eLoggingSeverity, isNotNullOrUndefined,
    isNullOrUndefined, safeGetLogger, strTrim
} from "@microsoft/applicationinsights-core-js";
import { IThrottleMsgKey } from "./Enums";
import { IthrottleLocalStorageObj, IthrottleMgrConfig, IthrottleResult } from "./Interfaces/IThrottleMgr";
import { utlCanUseLocalStorage, utlGetLocalStorage, utlSetLocalStorage } from "./StorageHelperFuncs";

const THROTTLE_STORAGE_PREFIX = "appInsightsThrottle";

interface SendMsgParameter {
    msgID: _eInternalMessageId,
    message: string,
    severity?: eLoggingSeverity
}

export class ThrottleMgr {
    public canThrottle: () => boolean;
    public sendMessage: (msgID: _eInternalMessageId, message: string, severity?: eLoggingSeverity) => IthrottleResult | null;
    public getConfig: () => IthrottleMgrConfig;
    // this function is to get previous triggered status
    public isTriggered: () => boolean;
    public isReady: () => boolean
    public onReadyState: (isReady?: boolean) => boolean;
    public flush: () => boolean;

    constructor(throttleMgr?: IthrottleMgrConfig, core?: IAppInsightsCore, namePrefix?: string) {
        let _self = this;
        let _canUseLocalStorage: boolean;
        let _logger: IDiagnosticLogger | null | undefined;
        let _config: IthrottleMgrConfig;
        let _localStorageName: string | null;
        let _localStorageObj: IthrottleLocalStorageObj | null | undefined;
        //_isTriggered is to make sure that we only trigger throttle once a day
        let _isTriggered: boolean;
        let _namePrefix: string;
        let _queue: Array<SendMsgParameter>;
        let _isReady: boolean = false;

        // local storage value should follow pattern: year(4 digit)-month(1-2 digit)-day(1-2 digit).count.0|1, for example: 2022-8-10.10.1
        // const regex = /^\d{4}\-\d{1,2}\-\d{1,2}\.\d{1,}\.0|1$/;
        const regex = /^\d{4}\-\d{1,2}\-\d{1,2}\.\d+\.(0|1)$/;

        _initConfig();

        _self.getConfig = (): IthrottleMgrConfig => {
            return _config;
        }

        // NOTE: this function can only check if it is the correct day to send message.
        // If _isTriggered is true, even if canThrottle returns true, message will not be sent.
        // because we only allow trigger sending message once day.
        _self.canThrottle = (): boolean => {
            return _canThrottle(_config, _canUseLocalStorage, _localStorageObj);
        }

        // get if throttle is triggered in current day(UTC)
        _self.isTriggered = (): boolean => {
            return _isTriggered;
        }

        _self.isReady = (): boolean => {
            return _isReady;
        }
        _self.flush = (): boolean => {
            try {
                if (_isReady && _queue.length > 0) {
                    arrForEach(_queue, (item: SendMsgParameter) => {
                        _self.sendMessage(item.msgID, item.message, item.severity);
                    });
                    return true;
                }
            } catch(err) {
                // eslint-disable-next-line no-empty
            }
            return false;
        }

        _self.onReadyState = (isReady?: boolean): boolean => {
            _isReady  = isNullOrUndefined(isReady)? true : isReady;
            return _self.flush();
        }
       
        _self.sendMessage = (msgID: _eInternalMessageId, message: string, severity?: eLoggingSeverity): IthrottleResult | null => {
            if (_isReady) {
                let isSampledIn = _canSampledIn();
                if (!isSampledIn) {
                    return;
                }
                let canThrottle = _canThrottle(_config, _canUseLocalStorage, _localStorageObj);
                let throttled = false;
                let number = 0;
                try {
                    if (canThrottle && !_isTriggered) {
                        number =  _config.limit.maxSendNumber;
                        _localStorageObj.count = 0;
                        throttled = true;
                        _isTriggered = true;
                    } else {
                        // this is to make sure that we do not trigger sendMessage mutiple times within a day.
                        _isTriggered = canThrottle;
                        _localStorageObj.count += 1;
                    }
                    _localStorageObj.isTriggered = _isTriggered;
                    _resetLocalStorage(_logger, _localStorageName, _localStorageObj);
                    for (let i = 0; i < number; i++) {
                        _sendMessage(msgID, _logger, message, severity);
                    }
                } catch(e) {
                    // eslint-disable-next-line no-empty
                }
                return {
                    isThrottled: throttled,
                    throttleNum: number
                } as IthrottleResult;
            } else {
                _queue.push({
                    msgID: msgID,
                    message: message,
                    severity: severity
                } as SendMsgParameter);
            }
            return null;
        }
        
        function _initConfig() {
            _canUseLocalStorage = utlCanUseLocalStorage();
            _logger = safeGetLogger(core);
            _isTriggered = false;
            _namePrefix = isNotNullOrUndefined(namePrefix)? namePrefix : "";
            _queue = [];
            let configMgr = throttleMgr;
            _config = {} as any;
            _config.disabled = !!configMgr.disabled;
            _config.msgKey = configMgr.msgKey;
            // default: send data on 28th every 3 month each year
            let interval = {
                // dafault: sent every three months
                monthInterval: configMgr.interval?.monthInterval || 3,
                dayInterval : configMgr.interval?.dayInterval || 28,
                maxTimesPerMonth: configMgr.interval?.maxTimesPerMonth || 1
            };
            _config.interval = interval;
            let limit = {
                samplingPercentage: configMgr.limit?.samplingPercentage || 100,
                // dafault: every time sent only 1 event
                maxSendNumber: configMgr.limit?.maxSendNumber || 1
            };
            _config.limit = limit;
            _localStorageName = _getLocalStorageName(_config.msgKey, _namePrefix);
            
            if (_canUseLocalStorage && _localStorageName) {
                _localStorageObj = _getLocalStorageObj(utlGetLocalStorage(_logger, _localStorageName), _logger, _localStorageName);
            }
            if (_localStorageObj) {
                // will reset _isTriggered status when sendMessage is called.
                _isTriggered = _localStorageObj.isTriggered;
            }
        }

        function _canThrottle(config: IthrottleMgrConfig, canUseLocalStorage: boolean, localStorageObj: IthrottleLocalStorageObj) {
            if (!config.disabled && canUseLocalStorage && isNotNullOrUndefined(localStorageObj)) {
                let curDate = _getThrottleDate();
                let date = localStorageObj.date;
                let interval = config.interval;
                let monthExpand = (curDate.getUTCFullYear() - date.getUTCFullYear()) * 12 + curDate.getUTCMonth() - date.getUTCMonth();
                let monthCheck = _checkInterval(interval.monthInterval, 0, monthExpand);
                let dayCheck = _checkInterval(interval.dayInterval, 0, curDate.getUTCDate()) - 1;
                return monthCheck >= 0 && dayCheck >= 0 && dayCheck <= config.interval.maxTimesPerMonth;
            }
            return false;
        }

        function _getLocalStorageName(msgKey: IThrottleMsgKey, prefix?: string) {
            let fix = isNotNullOrUndefined(prefix)? prefix : "";
            if (msgKey) {
                return THROTTLE_STORAGE_PREFIX + fix + "-" + msgKey;
            }
            return null;
        }

        // transfer local storage string value to object that identifies start date and current count
        function _getLocalStorageObj(value: string, logger: IDiagnosticLogger, storageName: string) {
            try {
                let isMatch = regex.test(value);
                if (isMatch) {
                    let valArr = value.split(".");
                    let dateVal = _getThrottleDate(valArr[0]);
                    return {
                        date: dateVal,
                        count: parseInt(valArr[1]),
                        isTriggered: parseInt(valArr[2]) === 1? true : false
                    } as IthrottleLocalStorageObj;

                } else {
                    let storageObj = {
                        date: _getThrottleDate(),
                        count: 0,
                        isTriggered: false
                    } as IthrottleLocalStorageObj;
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
            try {
                return isNotNullOrUndefined(dateStr)? new Date(dateStr) : new Date();
            } catch (e) {
                // eslint-disable-next-line no-empty
            }
            return null;
        }

        function _resetLocalStorage(logger: IDiagnosticLogger, storageName: string, obj: IthrottleLocalStorageObj) {
            try {
                let date = obj.date;
                let isTriggered = obj.isTriggered? 1 : 0;
                let val = date.getUTCFullYear() + "-" + (date.getUTCMonth() + 1) + "-" + date.getUTCDate() + "." + obj.count + "." + isTriggered;
                utlSetLocalStorage(logger, storageName, strTrim(val));
                return true;
            } catch (e) {
                // eslint-disable-next-line no-empty
            }
            return false;
        }

        function _checkInterval(interval: number, start: number, current: number) {
            // count from start year
            return  (current >= start) && (current - start) % interval == 0 ? Math.floor((current - start) / interval) + 1 : -1;
        }
        
        function _sendMessage(msgID: _eInternalMessageId, logger: IDiagnosticLogger, message: string, severity?: eLoggingSeverity) {
            _throwInternal(logger,
                severity || eLoggingSeverity.CRITICAL,
                msgID,
                message);
        }

        // NOTE: config.limit.samplingPercentage unit is 1000.
        // So if config.limit.samplingPercentage = 20, it means 20/1000 = 0.02;
        function _canSampledIn() {
            return Math.random() * 100 <= _config.limit.samplingPercentage;
        }
    }
}
