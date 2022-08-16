import { IthrottleDate, IthrottleLocalStorageObj, IthrottleMgrConfig, IThrottleMsgKey, IthrottleResult } from "../JavaScriptSDK.Interfaces/IThrottleMgr";
import { utlGetLocalStorage, utlSetLocalStorage, utlCanUseLocalStorage } from "../../../AppInsightsCommon/src";
import { IDiagnosticLogger } from "../JavaScriptSDK.Interfaces/IDiagnosticLogger";
import { safeGetLogger, _throwInternal } from "./DiagnosticLogger";
import { IAppInsightsCore } from "../JavaScriptSDK.Interfaces/IAppInsightsCore";
import { isNullOrUndefined } from "./HelperFuncs";
import { THROTTLE_STORAGE_PREFIX } from "./InternalConstants";
import { eLoggingSeverity, _eInternalMessageId } from "../JavaScriptSDK.Enums/LoggingEnums";



export class ThrottleMgr {
    public canThrottle: () => boolean;
    public throttle: (msgID: _eInternalMessageId, num: number, message: string, severity?: eLoggingSeverity) => IthrottleResult;
    public getConfig: () => IthrottleMgrConfig;

    constructor(throttleMgr: IthrottleMgrConfig, core?: IAppInsightsCore) {
        let _self = this;
        let _canUseLocalStorage: boolean;
        let _logger: IDiagnosticLogger | null | undefined;
        let _config: IthrottleMgrConfig;
        let _localStorageName: string | null;
        let _localStorageObj: IthrottleLocalStorageObj | null | undefined;
        // local storage value should follow pattern: year(4 digit)-month(1-2 digit)-day(1-2 digit).count, for example: 2022-8-10.10
        const regex = /^\d{4}\-\d{1,2}\-\d{1,2}\.\d{1,}$/;

        _initConfig();

        _self.getConfig = (): IthrottleMgrConfig => {
            return _config;
        }

        _self.canThrottle = (): boolean => {
            return _canThrottle(_config, _canUseLocalStorage, _localStorageObj);
        }

        _self.throttle = (num: number, msgID: _eInternalMessageId, message: string, severity?: eLoggingSeverity): IthrottleResult => {
            let canThrottle = _canThrottle(_config, _canUseLocalStorage, _localStorageObj);
            let throttled = false;
            let number = 0;
            try {
                if (canThrottle) {
                    // take the min number between maxSentNumber and sentPercentage
                    number = Math.min(Math.floor(_config.limit.sentPercentage * (_localStorageObj.count + num) / 100), _config.limit.maxSentNumber + num);
                    _localStorageObj.count = 0;
                } else {
                    _localStorageObj.count += num;
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
            } as IthrottleResult
        }
        
        function _initConfig() {
            _canUseLocalStorage = utlCanUseLocalStorage();
            _logger = safeGetLogger(core);
            let configMgr = throttleMgr;
            _config = {} as any;
            _config.enabled = !!configMgr.enabled;
            _config.msgKey = configMgr.msgKey;
            // default: send data on 28th every 3 month each year
            let interval = {
                yearInterval: configMgr.interval?.yearInterval || 1,
                // dafault: sent every three months
                monthInterval: configMgr.interval?.monthInterval || 3,
                dayInterval : configMgr.interval?.dayInterval || 28,
                maxTimesPerMonth: configMgr.interval?.maxTimesPerMonth || 1
            }
            _config.interval = interval;
            let limit = {
                sentPercentage: configMgr.limit?.sentPercentage || 100,
                // dafault: every time sent only 1 event
                maxSentNumber: configMgr.limit?.maxSentNumber || 1
            }
            _config.limit = limit;
            _localStorageName = _getLocalStorageName(_config.msgKey);
            if (_canUseLocalStorage && _localStorageName) {
                _localStorageObj = _getLocalStorageObj(utlGetLocalStorage(_logger, _localStorageName));
            }
        }

        function _canThrottle(config: IthrottleMgrConfig, canUseLocalStorage: boolean, localStorageObj: IthrottleLocalStorageObj) {
            if ( config.enabled && canUseLocalStorage) {
                let curDate = _getThrottleDate();
                let date = localStorageObj.date;
                let interval = config.interval;
                let yearCheck = _checkInterval(interval.yearInterval, date.year,curDate.year);
                let monthCheck = _checkInterval(interval.monthInterval, date.month,curDate.month);
                let dayCheck = _checkInterval(interval.dayInterval, date.day,curDate.day);
                return yearCheck >= 0 && monthCheck >= 0 && dayCheck >= 0 && dayCheck <= config.interval.maxTimesPerMonth;
            }
            return false
        }

        function _getLocalStorageName(msgKey: IThrottleMsgKey) {
            if (msgKey) {
                return THROTTLE_STORAGE_PREFIX + "-" + msgKey;
            }
            return null;
        }

        // transfer local storage string value to object that identifies start date and current count
        function _getLocalStorageObj(value: string) {
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
                    return {
                        date: _getThrottleDate(),
                        count: 0
                    } as IthrottleLocalStorageObj
                }
            } catch(e) {
                // eslint-disable-next-line no-empty
            }
            return null;
        }

        // if datestr is not defined, current date will be returned
        function _getThrottleDate(dateStr?: string) {
            try {
                if (isNullOrUndefined(dateStr)) {
                    let date = new Date();
                    return {
                        year: date.getFullYear(),
                        month: date.getMonth(),
                        day: date.getDay()
                    } as IthrottleDate;
                }
                if (dateStr) {
                    let dateArr = dateStr.split("-");
                    if (dateArr.length == 3) {
                        return {
                            year: parseInt(dateArr[0]),
                            month: parseInt(dateArr[1]),
                            day: parseInt(dateArr[2])
                        } as IthrottleDate;
                    }
                }
            } catch (e) {
                // eslint-disable-next-line no-empty
            }
            return null;
        }

        function _resetLocalStorage(logger: IDiagnosticLogger, storageName: string, obj: IthrottleLocalStorageObj) {
            try {
                let date = obj.date
                let val = date.year + "-" + date.month +"-" + date.day + "." + obj.count;
                utlSetLocalStorage(logger, storageName, val.trim());
                return true;
            } catch (e) {
                // eslint-disable-next-line no-empty
            }
            return false;
        }

        function _checkInterval(interval: number, start: number, current: number) {
            // count from start year
            return (current + 1 - start) % interval == 0 ? Math.floor((current + 1 -start) / interval) : -1;
        }
        
        // function to send internal message
        // TODO: should we add config to pass throwInternal function?
        function _sendMessage(msgID: _eInternalMessageId, logger: IDiagnosticLogger, message: string, severity?: eLoggingSeverity) {
            _throwInternal(logger,
                severity || eLoggingSeverity.CRITICAL,
                msgID,
                message);
        }
    }
}