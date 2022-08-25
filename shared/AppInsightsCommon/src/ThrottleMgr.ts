import {
    IAppInsightsCore, IDiagnosticLogger, _eInternalMessageId, _throwInternal, eLoggingSeverity, isNotNullOrUndefined, safeGetLogger, strTrim
} from "@microsoft/applicationinsights-core-js";
import { IThrottleMsgKey } from "./Enums";
import { IthrottleLocalStorageObj, IthrottleMgrConfig, IthrottleResult } from "./Interfaces/IThrottleMgr";
import { utlCanUseLocalStorage, utlGetLocalStorage, utlSetLocalStorage } from "./StorageHelperFuncs";

const THROTTLE_STORAGE_PREFIX = "appInsightsThrottle";


export class ThrottleMgr {
    public canThrottle: () => boolean;
    public sendMessage: (msgID: _eInternalMessageId, message: string, severity?: eLoggingSeverity) => IthrottleResult;
    public getConfig: () => IthrottleMgrConfig;
    public isTriggered: () => boolean;

    //namePrefix: the namePrefix from IConfig to identify localStorage
    constructor(throttleMgr: IthrottleMgrConfig, core?: IAppInsightsCore, namePrefix?: string) {
        let _self = this;
        let _canUseLocalStorage: boolean;
        let _logger: IDiagnosticLogger | null | undefined;
        let _config: IthrottleMgrConfig;
        let _localStorageName: string | null;
        let _localStorageObj: IthrottleLocalStorageObj | null | undefined;
        let _isTriggered: boolean;
        let _namePrefix: string;
        // local storage value should follow pattern: year(4 digit)-month(1-2 digit)-day(1-2 digit).count, for example: 2022-8-10.10
        const regex = /^\d{4}\-\d{1,2}\-\d{1,2}\.\d{1,}$/;

        _initConfig();

        _self.getConfig = (): IthrottleMgrConfig => {
            return _config;
        }

        _self.canThrottle = (): boolean => {
            return _canThrottle(_config, _canUseLocalStorage, _localStorageObj, _isTriggered);
        }

        _self.isTriggered = (): boolean => {
            return _isTriggered;
        }
        // sned msg
        // add function to not send msg
        _self.sendMessage = (msgID: _eInternalMessageId, message: string, severity?: eLoggingSeverity): IthrottleResult => {
            let canThrottle = _canThrottle(_config, _canUseLocalStorage, _localStorageObj, _isTriggered);
            let throttled = false;
            let number = 0;
            try {
                if (canThrottle && !_isTriggered) {
                    // take the min number between maxSentNumber and sentPercentage
                    number = Math.min(Math.floor(_config.limit.sendPercentage * (_localStorageObj.count + 1) / 100), _config.limit.maxSendNumber);
                    _localStorageObj.count = 0;
                    throttled = true;
                    _isTriggered = true;
                } else {
                    // this is to make sure that we do not trigger sendMessage mutiple times within a day.
                    _isTriggered = canThrottle;
                    _localStorageObj.count += 1;
                }
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
        }
        
        function _initConfig() {
            _canUseLocalStorage = utlCanUseLocalStorage();
            _logger = safeGetLogger(core);
            _isTriggered = false;
            _namePrefix = isNotNullOrUndefined(namePrefix)? namePrefix : ""
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
                sendPercentage: configMgr.limit?.sendPercentage || 100,
                // dafault: every time sent only 1 event
                maxSendNumber: configMgr.limit?.maxSendNumber || 1
            };
            _config.limit = limit;
            _localStorageName = _getLocalStorageName(_config.msgKey, _namePrefix);
            if (_canUseLocalStorage && _localStorageName) {
                _localStorageObj = _getLocalStorageObj(utlGetLocalStorage(_logger, _localStorageName), _logger, _localStorageName);
            }
        }

        function _canThrottle(config: IthrottleMgrConfig, canUseLocalStorage: boolean, localStorageObj: IthrottleLocalStorageObj, isTriggered?: boolean) {
            if (!isTriggered && !config.disabled && canUseLocalStorage && isNotNullOrUndefined(localStorageObj)) {
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
                        count: parseInt(valArr[1])
                    } as IthrottleLocalStorageObj

                } else {
                    let storageObj = {
                        date: _getThrottleDate(),
                        count: 0
                    } as IthrottleLocalStorageObj
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
                let date = obj.date
                let val = date.getUTCFullYear() + "-" + (date.getUTCMonth() + 1) +"-" + date.getUTCDate() + "." + obj.count;
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
        
        // function to send internal message
        // TODO: should use throwInternal function?
        function _sendMessage(msgID: _eInternalMessageId, logger: IDiagnosticLogger, message: string, severity?: eLoggingSeverity) {
            _throwInternal(logger,
                severity || eLoggingSeverity.CRITICAL,
                msgID,
                message);
        }
    }
}
