"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThrottleMgr = void 0;
var applicationinsights_core_js_1 = require("@microsoft/applicationinsights-core-js");
var ts_utils_1 = require("@nevware21/ts-utils");
var StorageHelperFuncs_1 = require("./StorageHelperFuncs");
var THROTTLE_STORAGE_PREFIX = "appInsightsThrottle";
var ThrottleMgr = /** @class */ (function () {
    function ThrottleMgr(core, namePrefix) {
        var _self = this;
        var _canUseLocalStorage;
        var _logger;
        var _config;
        var _localStorageObj;
        var _isTriggered; //_isTriggered is to make sure that we only trigger throttle once a day
        var _namePrefix;
        var _queue;
        var _isReady = false;
        var _isSpecificDaysGiven = false;
        _initConfig();
        // Special internal method to allow the unit tests and DebugPlugin to hook embedded objects
        _self["_getDbgPlgTargets"] = function () {
            return [_queue];
        };
        _self.getConfig = function () {
            return _config;
        };
        /**
         * Check if it is the correct day to send message.
         * If _isTriggered is true, even if canThrottle returns true, message will not be sent,
         * because we only allow triggering sendMessage() once a day.
         * @returns if the current date is the valid date to send message
         */
        _self.canThrottle = function (msgId) {
            var localObj = _getLocalStorageObjByKey(msgId);
            var cfg = _getCfgByKey(msgId);
            return _canThrottle(cfg, _canUseLocalStorage, localObj);
        };
        /**
         * Check if throttle is triggered on current day(UTC)
         * if canThrottle returns false, isTriggered will return false
         * @returns if throttle is triggered on current day(UTC)
         */
        _self.isTriggered = function (msgId) {
            return _isTrigger(msgId);
        };
        /**
         * Before isReady set to true, all message will be stored in queue.
         * Message will only be sent out after isReady set to true.
         * Initial and default value: false
         * @returns isReady state
         */
        _self.isReady = function () {
            return _isReady;
        };
        /**
         * Flush all message with given message key in queue with isReady state set to true.
         * @returns if message queue is flushed
         */
        _self.flush = function (msgId) {
            try {
                var queue = _getQueueByKey(msgId);
                if (queue && queue.length > 0) {
                    var items = queue.slice(0);
                    _queue[msgId] = [];
                    (0, ts_utils_1.arrForEach)(items, function (item) {
                        _flushMessage(item.msgID, item.message, item.severity, false);
                    });
                    return true;
                }
            }
            catch (err) {
                // eslint-disable-next-line no-empty
            }
            return false;
        };
        /**
         * Flush all message in queue with isReady state set to true.
         * @returns if message queue is flushed
         */
        _self.flushAll = function () {
            try {
                if (_queue) {
                    var result_1 = true;
                    (0, ts_utils_1.objForEachKey)(_queue, function (key) {
                        var isFlushed = _self.flush(parseInt(key));
                        result_1 = result_1 && isFlushed;
                    });
                    return result_1;
                }
            }
            catch (err) {
                // eslint-disable-next-line no-empty
            }
            return false;
        };
        /**
         * Set isReady State
         * if isReady set to true, message queue will be flushed automatically.
         * @param isReady - isReady State
         * @pa
         * @returns if message queue is flushed
         */
        _self.onReadyState = function (isReady, flushAll) {
            if (flushAll === void 0) { flushAll = true; }
            _isReady = (0, applicationinsights_core_js_1.isNullOrUndefined)(isReady) ? true : isReady;
            if (_isReady && flushAll) {
                return _self.flushAll();
            }
            return null;
        };
        _self.sendMessage = function (msgID, message, severity) {
            return _flushMessage(msgID, message, severity, true);
        };
        function _flushMessage(msgID, message, severity, saveUnsentMsg) {
            if (_isReady) {
                var isSampledIn = _canSampledIn(msgID);
                if (!isSampledIn) {
                    return;
                }
                var cfg = _getCfgByKey(msgID);
                var localStorageObj = _getLocalStorageObjByKey(msgID);
                var canThrottle = _canThrottle(cfg, _canUseLocalStorage, localStorageObj);
                var throttled = false;
                var number = 0;
                var isTriggered = _isTrigger(msgID);
                try {
                    if (canThrottle && !isTriggered) {
                        number = (0, ts_utils_1.mathMin)(cfg.limit.maxSendNumber, localStorageObj.count + 1);
                        localStorageObj.count = 0;
                        throttled = true;
                        _isTriggered[msgID] = true;
                        localStorageObj.preTriggerDate = new Date();
                    }
                    else {
                        _isTriggered[msgID] = canThrottle;
                        localStorageObj.count += 1;
                    }
                    var localStorageName = _getLocalStorageName(msgID);
                    _resetLocalStorage(_logger, localStorageName, localStorageObj);
                    for (var i = 0; i < number; i++) {
                        _sendMessage(msgID, _logger, message, severity);
                    }
                }
                catch (e) {
                    // eslint-disable-next-line no-empty
                }
                return {
                    isThrottled: throttled,
                    throttleNum: number
                };
            }
            else {
                if (!!saveUnsentMsg) {
                    var queue = _getQueueByKey(msgID);
                    queue.push({
                        msgID: msgID,
                        message: message,
                        severity: severity
                    });
                }
            }
            return null;
        }
        function _initConfig() {
            _logger = (0, applicationinsights_core_js_1.safeGetLogger)(core);
            _isTriggered = {};
            _localStorageObj = {};
            _queue = {};
            _config = {};
            _setCfgByKey(applicationinsights_core_js_1._eInternalMessageId.DefaultThrottleMsgKey);
            _namePrefix = (0, applicationinsights_core_js_1.isNotNullOrUndefined)(namePrefix) ? namePrefix : "";
            core.addUnloadHook((0, applicationinsights_core_js_1.onConfigChange)(core.config, function (details) {
                var coreConfig = details.cfg;
                _canUseLocalStorage = (0, StorageHelperFuncs_1.utlCanUseLocalStorage)();
                var configMgr = coreConfig.throttleMgrCfg || {};
                (0, ts_utils_1.objForEachKey)(configMgr, function (key, cfg) {
                    _setCfgByKey(parseInt(key), cfg);
                });
            }));
        }
        function _getCfgByKey(msgID) {
            return _config[msgID] || _config[applicationinsights_core_js_1._eInternalMessageId.DefaultThrottleMsgKey];
        }
        function _setCfgByKey(msgID, config) {
            var _a, _b;
            try {
                var cfg = config || {};
                var curCfg = {};
                curCfg.disabled = !!cfg.disabled;
                var configInterval = cfg.interval || {};
                _isSpecificDaysGiven = (configInterval === null || configInterval === void 0 ? void 0 : configInterval.daysOfMonth) && (configInterval === null || configInterval === void 0 ? void 0 : configInterval.daysOfMonth.length) > 0;
                curCfg.interval = _getIntervalConfig(configInterval);
                var limit = {
                    samplingRate: ((_a = cfg.limit) === null || _a === void 0 ? void 0 : _a.samplingRate) || 100,
                    // dafault: every time sent only 1 event
                    maxSendNumber: ((_b = cfg.limit) === null || _b === void 0 ? void 0 : _b.maxSendNumber) || 1
                };
                curCfg.limit = limit;
                _config[msgID] = curCfg;
            }
            catch (e) {
                // eslint-disable-next-line no-empty
            }
        }
        function _getIntervalConfig(interval) {
            interval = interval || {};
            var monthInterval = interval === null || interval === void 0 ? void 0 : interval.monthInterval;
            var dayInterval = interval === null || interval === void 0 ? void 0 : interval.dayInterval;
            // default: send data every 3 month each year
            if ((0, applicationinsights_core_js_1.isNullOrUndefined)(monthInterval) && (0, applicationinsights_core_js_1.isNullOrUndefined)(dayInterval)) {
                interval.monthInterval = 3;
                if (!_isSpecificDaysGiven) {
                    // default: send data on 28th
                    interval.daysOfMonth = [28];
                    _isSpecificDaysGiven = true;
                }
            }
            interval = {
                // dafault: sent every three months
                monthInterval: interval === null || interval === void 0 ? void 0 : interval.monthInterval,
                dayInterval: interval === null || interval === void 0 ? void 0 : interval.dayInterval,
                daysOfMonth: interval === null || interval === void 0 ? void 0 : interval.daysOfMonth
            };
            return interval;
        }
        function _canThrottle(config, canUseLocalStorage, localStorageObj) {
            if (config && !config.disabled && canUseLocalStorage && (0, applicationinsights_core_js_1.isNotNullOrUndefined)(localStorageObj)) {
                var curDate = _getThrottleDate();
                var date = localStorageObj.date;
                var interval = config.interval;
                var monthCheck = 1;
                if (interval === null || interval === void 0 ? void 0 : interval.monthInterval) {
                    var monthExpand = (curDate.getUTCFullYear() - date.getUTCFullYear()) * 12 + curDate.getUTCMonth() - date.getUTCMonth();
                    monthCheck = _checkInterval(interval.monthInterval, 0, monthExpand);
                }
                var dayCheck = 1;
                if (_isSpecificDaysGiven) {
                    dayCheck = (0, applicationinsights_core_js_1.arrIndexOf)(interval.daysOfMonth, curDate.getUTCDate());
                }
                else if (interval === null || interval === void 0 ? void 0 : interval.dayInterval) {
                    var daySpan = (0, ts_utils_1.mathFloor)((curDate.getTime() - date.getTime()) / 86400000);
                    dayCheck = _checkInterval(interval.dayInterval, 0, daySpan);
                }
                return monthCheck >= 0 && dayCheck >= 0;
            }
            return false;
        }
        function _getLocalStorageName(msgKey, prefix) {
            var fix = (0, applicationinsights_core_js_1.isNotNullOrUndefined)(prefix) ? prefix : "";
            if (msgKey) {
                return THROTTLE_STORAGE_PREFIX + fix + "-" + msgKey;
            }
            return null;
        }
        // returns if throttle is triggered on current Date
        function _isTriggeredOnCurDate(preTriggerDate) {
            try {
                if (preTriggerDate) {
                    var curDate = new Date();
                    return preTriggerDate.getUTCFullYear() === curDate.getUTCFullYear() &&
                        preTriggerDate.getUTCMonth() === curDate.getUTCMonth() &&
                        preTriggerDate.getUTCDate() === curDate.getUTCDate();
                }
            }
            catch (e) {
                // eslint-disable-next-line no-empty
            }
            return false;
        }
        // transfer local storage string value to object that identifies start date, current count and preTriggerDate
        function _getLocalStorageObj(value, logger, storageName) {
            try {
                var storageObj = {
                    date: _getThrottleDate(),
                    count: 0
                };
                if (value) {
                    var obj = JSON.parse(value);
                    var curObj = {
                        date: _getThrottleDate(obj.date) || storageObj.date,
                        count: obj.count || storageObj.count,
                        preTriggerDate: obj.preTriggerDate ? _getThrottleDate(obj.preTriggerDate) : undefined
                    };
                    return curObj;
                }
                else {
                    _resetLocalStorage(logger, storageName, storageObj);
                    return storageObj;
                }
            }
            catch (e) {
                // eslint-disable-next-line no-empty
            }
            return null;
        }
        // if datestr is not defined, current date will be returned
        function _getThrottleDate(dateStr) {
            // if new Date() can't be created through the provided dateStr, null will be returned.
            try {
                if (dateStr) {
                    var date = new Date(dateStr);
                    //make sure it is a valid Date Object
                    if (!isNaN(date.getDate())) {
                        return date;
                    }
                }
                else {
                    return new Date();
                }
            }
            catch (e) {
                // eslint-disable-next-line no-empty
            }
            return null;
        }
        function _resetLocalStorage(logger, storageName, obj) {
            try {
                return (0, StorageHelperFuncs_1.utlSetLocalStorage)(logger, storageName, (0, applicationinsights_core_js_1.strTrim)(JSON.stringify(obj)));
            }
            catch (e) {
                // eslint-disable-next-line no-empty
            }
            return false;
        }
        function _checkInterval(interval, start, current) {
            if (interval <= 0) {
                return 1;
            }
            // count from start year
            return (current >= start) && (current - start) % interval == 0 ? (0, ts_utils_1.mathFloor)((current - start) / interval) + 1 : -1;
        }
        function _sendMessage(msgID, logger, message, severity) {
            (0, applicationinsights_core_js_1._throwInternal)(logger, severity || applicationinsights_core_js_1.eLoggingSeverity.CRITICAL, msgID, message);
        }
        // NOTE: config.limit.samplingRate is set to 4 decimal places,
        // so config.limit.samplingRate = 1 means 0.0001%
        function _canSampledIn(msgID) {
            try {
                var cfg = _getCfgByKey(msgID);
                return (0, applicationinsights_core_js_1.randomValue)(1000000) <= cfg.limit.samplingRate;
            }
            catch (e) {
                // eslint-disable-next-line no-empty
            }
            return false;
        }
        function _getLocalStorageObjByKey(key) {
            try {
                var curObj = _localStorageObj[key];
                if (!curObj) {
                    var localStorageName = _getLocalStorageName(key, _namePrefix);
                    curObj = _getLocalStorageObj((0, StorageHelperFuncs_1.utlGetLocalStorage)(_logger, localStorageName), _logger, localStorageName);
                    _localStorageObj[key] = curObj;
                }
                return _localStorageObj[key];
            }
            catch (e) {
                // eslint-disable-next-line no-empty
            }
            return null;
        }
        function _isTrigger(key) {
            var isTrigger = _isTriggered[key];
            if ((0, applicationinsights_core_js_1.isNullOrUndefined)(isTrigger)) {
                isTrigger = false;
                var localStorageObj = _getLocalStorageObjByKey(key);
                if (localStorageObj) {
                    isTrigger = _isTriggeredOnCurDate(localStorageObj.preTriggerDate);
                }
                _isTriggered[key] = isTrigger;
            }
            return _isTriggered[key];
        }
        function _getQueueByKey(key) {
            _queue = _queue || {};
            if ((0, applicationinsights_core_js_1.isNullOrUndefined)(_queue[key])) {
                _queue[key] = [];
            }
            return _queue[key];
        }
    }
    return ThrottleMgr;
}());
exports.ThrottleMgr = ThrottleMgr;
