/*!
 * Application Insights JavaScript SDK - Web, 2.3.1
 * Copyright (c) Microsoft and contributors. All rights reserved.
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.Microsoft = global.Microsoft || {}, global.Microsoft.ApplicationInsights = {})));
}(this, (function (exports) { 'use strict';

    /**
     * Type of storage to differentiate between local storage and session storage
     */
    var StorageType;
    (function (StorageType) {
        StorageType[StorageType["LocalStorage"] = 0] = "LocalStorage";
        StorageType[StorageType["SessionStorage"] = 1] = "SessionStorage";
    })(StorageType || (StorageType = {}));
    /**
     * Enum is used in aiDataContract to describe how fields are serialized.
     * For instance: (Fieldtype.Required | FieldType.Array) will mark the field as required and indicate it's an array
     */
    var FieldType;
    (function (FieldType) {
        FieldType[FieldType["Default"] = 0] = "Default";
        FieldType[FieldType["Required"] = 1] = "Required";
        FieldType[FieldType["Array"] = 2] = "Array";
        FieldType[FieldType["Hidden"] = 4] = "Hidden";
    })(FieldType || (FieldType = {}));
    var DistributedTracingModes;
    (function (DistributedTracingModes) {
        /**
         * (Default) Send Application Insights correlation headers
         */
        DistributedTracingModes[DistributedTracingModes["AI"] = 0] = "AI";
        /**
         * Send both W3C Trace Context headers and back-compatibility Application Insights headers
         */
        DistributedTracingModes[DistributedTracingModes["AI_AND_W3C"] = 1] = "AI_AND_W3C";
        /**
         * Send W3C Trace Context headers
         */
        DistributedTracingModes[DistributedTracingModes["W3C"] = 2] = "W3C";
    })(DistributedTracingModes || (DistributedTracingModes = {}));

    /**
     * The EventsDiscardedReason enumeration contains a set of values that specify the reason for discarding an event.
     */
    var EventsDiscardedReason = {
        /**
         * Unknown.
         */
        Unknown: 0,
        /**
         * Status set to non-retryable.
         */
        NonRetryableStatus: 1,
        /**
         * The event is invalid.
         */
        InvalidEvent: 2,
        /**
         * The size of the event is too large.
         */
        SizeLimitExceeded: 3,
        /**
         * The server is not accepting events from this instrumentation key.
         */
        KillSwitch: 4,
        /**
         * The event queue is full.
         */
        QueueFull: 5
    };

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    // Added to help with minfication
    var prototype = "prototype";
    var CoreUtils = /** @class */ (function () {
        function CoreUtils() {
        }
        CoreUtils.isNullOrUndefined = function (input) {
            return input === null || input === undefined;
        };
        /**
         * Check if an object is of type Date
         */
        CoreUtils.isDate = function (obj) {
            return Object[prototype].toString.call(obj) === "[object Date]";
        };
        /**
         * Creates a new GUID.
         * @return {string} A GUID.
         */
        CoreUtils.disableCookies = function () {
            CoreUtils._canUseCookies = false;
        };
        CoreUtils.newGuid = function () {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(GuidRegex, function (c) {
                var r = (Math.random() * 16 | 0), v = (c === 'x' ? r : r & 0x3 | 0x8);
                return v.toString(16);
            });
        };
        /**
         * Convert a date to I.S.O. format in IE8
         */
        CoreUtils.toISOString = function (date) {
            if (CoreUtils.isDate(date)) {
                var pad = function (num) {
                    var r = String(num);
                    if (r.length === 1) {
                        r = "0" + r;
                    }
                    return r;
                };
                return date.getUTCFullYear()
                    + "-" + pad(date.getUTCMonth() + 1)
                    + "-" + pad(date.getUTCDate())
                    + "T" + pad(date.getUTCHours())
                    + ":" + pad(date.getUTCMinutes())
                    + ":" + pad(date.getUTCSeconds())
                    + "." + String((date.getUTCMilliseconds() / 1000).toFixed(3)).slice(2, 5)
                    + "Z";
            }
        };
        /**
         * Performs the specified action for each element in an array. This helper exists to avoid adding a polyfil for older browsers
         * that do not define Array.prototype.xxxx (eg. ES3 only, IE8) just in case any page checks for presence/absence of the prototype
         * implementation. Note: For consistency this will not use the Array.prototype.xxxx implementation if it exists as this would
         * cause a testing requirement to test with and without the implementations
         * @param callbackfn  A function that accepts up to three arguments. forEach calls the callbackfn function one time for each element in the array.
         * @param thisArg  [Optional] An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
         */
        CoreUtils.arrForEach = function (arr, callbackfn, thisArg) {
            var len = arr.length;
            for (var idx = 0; idx < len; ++idx) {
                if (idx in arr) {
                    callbackfn.call(thisArg || arr, arr[idx], idx, arr);
                }
            }
        };
        /**
         * Returns the index of the first occurrence of a value in an array. This helper exists to avoid adding a polyfil for older browsers
         * that do not define Array.prototype.xxxx (eg. ES3 only, IE8) just in case any page checks for presence/absence of the prototype
         * implementation. Note: For consistency this will not use the Array.prototype.xxxx implementation if it exists as this would
         * cause a testing requirement to test with and without the implementations
         * @param searchElement The value to locate in the array.
         * @param fromIndex The array index at which to begin the search. If fromIndex is omitted, the search starts at index 0.
         */
        CoreUtils.arrIndexOf = function (arr, searchElement, fromIndex) {
            var len = arr.length;
            var from = fromIndex || 0;
            for (var lp = Math.max(from >= 0 ? from : len - Math.abs(from), 0); lp < len; lp++) {
                if (lp in arr && arr[lp] === searchElement) {
                    return lp;
                }
            }
            return -1;
        };
        /**
         * Calls a defined callback function on each element of an array, and returns an array that contains the results. This helper exists
         * to avoid adding a polyfil for older browsers that do not define Array.prototype.xxxx (eg. ES3 only, IE8) just in case any page
         * checks for presence/absence of the prototype implementation. Note: For consistency this will not use the Array.prototype.xxxx
         * implementation if it exists as this would cause a testing requirement to test with and without the implementations
         * @param callbackfn A function that accepts up to three arguments. The map method calls the callbackfn function one time for each element in the array.
         * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
         */
        CoreUtils.arrMap = function (arr, callbackfn, thisArg) {
            var len = arr.length;
            var _this = thisArg || arr;
            var results = new Array(len);
            for (var lp = 0; lp < len; lp++) {
                if (lp in arr) {
                    results[lp] = callbackfn.call(_this, arr[lp], arr);
                }
            }
            return results;
        };
        /**
         * Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is
         * provided as an argument in the next call to the callback function. This helper exists to avoid adding a polyfil for older browsers that do not define
         * Array.prototype.xxxx (eg. ES3 only, IE8) just in case any page checks for presence/absence of the prototype implementation. Note: For consistency
         * this will not use the Array.prototype.xxxx implementation if it exists as this would cause a testing requirement to test with and without the implementations
         * @param callbackfn A function that accepts up to four arguments. The reduce method calls the callbackfn function one time for each element in the array.
         * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
         */
        CoreUtils.arrReduce = function (arr, callbackfn, initialValue) {
            var len = arr.length;
            var lp = 0;
            var value;
            // Specifically checking the number of passed arguments as the value could be anything
            if (arguments.length >= 3) {
                value = arguments[2];
            }
            else {
                while (lp < len && !(lp in arr)) {
                    lp++;
                }
                value = arr[lp++];
            }
            while (lp < len) {
                if (lp in arr) {
                    value = callbackfn(value, arr[lp], lp, arr);
                }
                lp++;
            }
            return value;
        };
        /**
         * Creates an object that has the specified prototype, and that optionally contains specified properties. This helper exists to avoid adding a polyfil
         * for older browsers that do not define Object.create (eg. ES3 only, IE8) just in case any page checks for presence/absence of the prototype implementation.
         * Note: For consistency this will not use the Object.create implementation if it exists as this would cause a testing requirement to test with and without the implementations
         * @param obj Object to use as a prototype. May be null
         */
        CoreUtils.objCreate = function (obj) {
            if (obj == null) {
                return {};
            }
            var type = typeof obj;
            if (type !== 'object' && type !== 'function') {
                throw new TypeError('Object prototype may only be an Object: ' + obj);
            }
            function tmpFunc() { }
            tmpFunc[prototype] = obj;
            return new tmpFunc();
        };
        /**
         * Returns the names of the enumerable string properties and methods of an object. This helper exists to avoid adding a polyfil for older browsers
         * that do not define Object.create (eg. ES3 only, IE8) just in case any page checks for presence/absence of the prototype implementation.
         * Note: For consistency this will not use the Object.create implementation if it exists as this would cause a testing requirement to test with and without the implementations
         * @param obj Object that contains the properties and methods. This can be an object that you created or an existing Document Object Model (DOM) object.
         */
        CoreUtils.objKeys = function (obj) {
            var hasOwnProperty = Object[prototype].hasOwnProperty;
            var hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString');
            var type = typeof obj;
            if (type !== 'function' && (type !== 'object' || obj === null)) {
                throw new TypeError('objKeys called on non-object');
            }
            var result = [];
            for (var prop in obj) {
                if (hasOwnProperty.call(obj, prop)) {
                    result.push(prop);
                }
            }
            if (hasDontEnumBug) {
                var dontEnums = [
                    'toString',
                    'toLocaleString',
                    'valueOf',
                    'hasOwnProperty',
                    'isPrototypeOf',
                    'propertyIsEnumerable',
                    'constructor'
                ];
                var dontEnumsLength = dontEnums.length;
                for (var lp = 0; lp < dontEnumsLength; lp++) {
                    if (hasOwnProperty.call(obj, dontEnums[lp])) {
                        result.push(dontEnums[lp]);
                    }
                }
            }
            return result;
        };
        /**
         * Try to define get/set object property accessors for the target object/prototype, this will provide compatibility with
         * existing API definition when run within an ES5+ container that supports accessors but still enable the code to be loaded
         * and executed in an ES3 container, providing basic IE8 compatibility.
         * @param target The object on which to define the property.
         * @param prop The name of the property to be defined or modified.
         * @param getProp The getter function to wire against the getter.
         * @param setProp The setter function to wire against the setter.
         * @returns True if it was able to create the accessors otherwise false
         */
        CoreUtils.objDefineAccessors = function (target, prop, getProp, setProp) {
            var defineProp = Object["defineProperty"];
            if (defineProp) {
                try {
                    var descriptor = {
                        enumerable: true,
                        configurable: true
                    };
                    if (getProp) {
                        descriptor.get = getProp;
                    }
                    if (setProp) {
                        descriptor.set = setProp;
                    }
                    defineProp(target, prop, descriptor);
                    return true;
                }
                catch (e) {
                    // IE8 Defines a defineProperty on Object but it's only supported for DOM elements so it will throw
                    // We will just ignore this here.
                }
            }
            return false;
        };
        return CoreUtils;
    }());
    var GuidRegex = /[xy]/g;

    var ChannelControllerPriority = 500;
    var ChannelValidationMessage = "Channel has invalid priority";
    var ChannelController = /** @class */ (function () {
        function ChannelController() {
            this.identifier = "ChannelControllerPlugin";
            this.priority = ChannelControllerPriority; // in reserved range 100 to 200
        }
        ChannelController.prototype.processTelemetry = function (item) {
            CoreUtils.arrForEach(this.channelQueue, function (queues) {
                // pass on to first item in queue
                if (queues.length > 0) {
                    queues[0].processTelemetry(item);
                }
            });
        };
        ChannelController.prototype.getChannelControls = function () {
            return this.channelQueue;
        };
        ChannelController.prototype.initialize = function (config, core, extensions) {
            var _this = this;
            if (config.isCookieUseDisabled) {
                CoreUtils.disableCookies();
            }
            this.channelQueue = new Array();
            if (config.channels) {
                var invalidChannelIdentifier_1;
                CoreUtils.arrForEach(config.channels, function (queue) {
                    if (queue && queue.length > 0) {
                        queue = queue.sort(function (a, b) {
                            return a.priority - b.priority;
                        });
                        for (var i = 1; i < queue.length; i++) {
                            queue[i - 1].setNextPlugin(queue[i]); // setup processing chain
                        }
                        // Initialize each plugin
                        CoreUtils.arrForEach(queue, function (queueItem) {
                            if (queueItem.priority < ChannelControllerPriority) {
                                invalidChannelIdentifier_1 = queueItem.identifier;
                            }
                            queueItem.initialize(config, core, extensions);
                        });
                        if (invalidChannelIdentifier_1) {
                            throw Error(ChannelValidationMessage + invalidChannelIdentifier_1);
                        }
                        _this.channelQueue.push(queue);
                    }
                });
            }
            var arr = new Array();
            for (var i = 0; i < extensions.length; i++) {
                var plugin = extensions[i];
                if (plugin.priority > ChannelControllerPriority) {
                    arr.push(plugin);
                }
            }
            if (arr.length > 0) {
                // sort if not sorted
                arr = arr.sort(function (a, b) {
                    return a.priority - b.priority;
                });
                // setup next plugin
                for (var i = 1; i < arr.length; i++) {
                    arr[i - 1].setNextPlugin(arr[i]);
                }
                // Initialize each plugin
                CoreUtils.arrForEach(arr, function (queueItem) { return queueItem.initialize(config, core, extensions); });
                this.channelQueue.push(arr);
            }
        };
        /**
         * Static constructor, attempt to create accessors
         */
        // tslint:disable-next-line
        ChannelController._staticInit = (function () {
            // Dynamically create get/set property accessors
            CoreUtils.objDefineAccessors(ChannelController.prototype, "ChannelControls", ChannelController.prototype.getChannelControls);
        })();
        return ChannelController;
    }());

    var validationError = "Extensions must provide callback to initialize";
    var BaseCore = /** @class */ (function () {
        function BaseCore() {
            this._isInitialized = false;
            this._extensions = new Array();
            this._channelController = new ChannelController();
        }
        BaseCore.prototype.initialize = function (config, extensions, logger, notificationManager) {
            var _this = this;
            // Make sure core is only initialized once
            if (this._isInitialized) {
                throw Error("Core should not be initialized more than once");
            }
            if (!config || CoreUtils.isNullOrUndefined(config.instrumentationKey)) {
                throw Error("Please provide instrumentation key");
            }
            this.config = config;
            this._notificationManager = notificationManager;
            if (!this._notificationManager) {
                this._notificationManager = CoreUtils.objCreate({
                    addNotificationListener: function (listener) { },
                    removeNotificationListener: function (listener) { },
                    eventsSent: function (events) { },
                    eventsDiscarded: function (events, reason) { }
                });
            }
            this.config.extensions = CoreUtils.isNullOrUndefined(this.config.extensions) ? [] : this.config.extensions;
            // add notification to the extensions in the config so other plugins can access it
            this.config.extensionConfig = CoreUtils.isNullOrUndefined(this.config.extensionConfig) ? {} : this.config.extensionConfig;
            if (this._notificationManager) {
                this.config.extensionConfig.NotificationManager = this._notificationManager;
            }
            this.logger = logger;
            if (!this.logger) {
                this.logger = CoreUtils.objCreate({
                    throwInternal: function (severity, msgId, msg, properties, isUserAct) {
                        if (isUserAct === void 0) { isUserAct = false; }
                    },
                    warnToConsole: function (message) { },
                    resetInternalMessageCount: function () { }
                });
            }
            // Concat all available extensions 
            (_a = this._extensions).push.apply(_a, extensions.concat(this.config.extensions));
            // Initial validation 
            CoreUtils.arrForEach(this._extensions, function (extension) {
                var isValid = true;
                if (CoreUtils.isNullOrUndefined(extension) || CoreUtils.isNullOrUndefined(extension.initialize)) {
                    isValid = false;
                }
                if (!isValid) {
                    throw Error(validationError);
                }
            });
            // Initial validation complete
            this._extensions.push(this._channelController);
            // Sort by priority
            this._extensions = this._extensions.sort(function (a, b) {
                var extA = a;
                var extB = b;
                var typeExtA = typeof extA.processTelemetry;
                var typeExtB = typeof extB.processTelemetry;
                if (typeExtA === 'function' && typeExtB === 'function') {
                    return extA.priority - extB.priority;
                }
                if (typeExtA === 'function' && typeExtB !== 'function') {
                    // keep non telemetryplugin specific extensions at start
                    return 1;
                }
                if (typeExtA !== 'function' && typeExtB === 'function') {
                    return -1;
                }
            });
            // sort complete
            // Check if any two extensions have the same priority, then warn to console
            var priority = {};
            CoreUtils.arrForEach(this._extensions, function (ext) {
                var t = ext;
                if (t && t.priority) {
                    if (!CoreUtils.isNullOrUndefined(priority[t.priority])) {
                        if (_this.logger) {
                            _this.logger.warnToConsole("Two extensions have same priority" + priority[t.priority] + ", " + t.identifier);
                        }
                    }
                    else {
                        priority[t.priority] = t.identifier; // set a value
                    }
                }
            });
            var c = -1;
            // Set next plugin for all until channel controller
            for (var idx = 0; idx < this._extensions.length - 1; idx++) {
                var curr = (this._extensions[idx]);
                if (curr && typeof curr.processTelemetry !== 'function') {
                    // these are initialized only, allowing an entry point for extensions to be initialized when SDK initializes
                    continue;
                }
                if (curr.priority === this._channelController.priority) {
                    c = idx + 1;
                    break; // channel controller will set remaining pipeline
                }
                this._extensions[idx].setNextPlugin(this._extensions[idx + 1]); // set next plugin
            }
            // initialize channel controller first, this will initialize all channel plugins
            this._channelController.initialize(this.config, this, this._extensions);
            // initialize remaining regular plugins
            CoreUtils.arrForEach(this._extensions, function (ext) {
                var e = ext;
                if (e && e.priority < _this._channelController.priority) {
                    ext.initialize(_this.config, _this, _this._extensions); // initialize
                }
            });
            // Remove sender channels from main list
            if (c < this._extensions.length) {
                this._extensions.splice(c);
            }
            if (this.getTransmissionControls().length === 0) {
                throw new Error("No channels available");
            }
            this._isInitialized = true;
            var _a;
        };
        BaseCore.prototype.getTransmissionControls = function () {
            return this._channelController.getChannelControls();
        };
        BaseCore.prototype.track = function (telemetryItem) {
            if (!telemetryItem.iKey) {
                // setup default iKey if not passed in
                telemetryItem.iKey = this.config.instrumentationKey;
            }
            if (!telemetryItem.time) {
                // add default timestamp if not passed in
                telemetryItem.time = CoreUtils.toISOString(new Date());
            }
            if (CoreUtils.isNullOrUndefined(telemetryItem.ver)) {
                // CommonSchema 4.0
                telemetryItem.ver = "4.0";
            }
            // invoke any common telemetry processors before sending through pipeline
            if (this._extensions.length === 0) {
                this._channelController.processTelemetry(telemetryItem); // Pass to Channel controller so data is sent to correct channel queues
            }
            var i = 0;
            while (i < this._extensions.length) {
                if (this._extensions[i].processTelemetry) {
                    this._extensions[i].processTelemetry(telemetryItem); // pass on to first extension that can support processing
                    break;
                }
                i++;
            }
        };
        return BaseCore;
    }());

    /**
     * Class to manage sending notifications to all the listeners.
     */
    var NotificationManager = /** @class */ (function () {
        function NotificationManager() {
            this.listeners = [];
        }
        /**
         * Adds a notification listener.
         * @param {INotificationListener} listener - The notification listener to be added.
         */
        NotificationManager.prototype.addNotificationListener = function (listener) {
            this.listeners.push(listener);
        };
        /**
         * Removes all instances of the listener.
         * @param {INotificationListener} listener - AWTNotificationListener to remove.
         */
        NotificationManager.prototype.removeNotificationListener = function (listener) {
            var index = CoreUtils.arrIndexOf(this.listeners, listener);
            while (index > -1) {
                this.listeners.splice(index, 1);
                index = CoreUtils.arrIndexOf(this.listeners, listener);
            }
        };
        /**
         * Notification for events sent.
         * @param {ITelemetryItem[]} events - The array of events that have been sent.
         */
        NotificationManager.prototype.eventsSent = function (events) {
            var _this = this;
            var _loop_1 = function (i) {
                if (this_1.listeners[i].eventsSent) {
                    setTimeout(function () { return _this.listeners[i].eventsSent(events); }, 0);
                }
            };
            var this_1 = this;
            for (var i = 0; i < this.listeners.length; ++i) {
                _loop_1(i);
            }
        };
        /**
         * Notification for events being discarded.
         * @param {ITelemetryItem[]} events - The array of events that have been discarded by the SDK.
         * @param {number} reason           - The reason for which the SDK discarded the events. The EventsDiscardedReason
         * constant should be used to check the different values.
         */
        NotificationManager.prototype.eventsDiscarded = function (events, reason) {
            var _this = this;
            var _loop_2 = function (i) {
                if (this_2.listeners[i].eventsDiscarded) {
                    setTimeout(function () { return _this.listeners[i].eventsDiscarded(events, reason); }, 0);
                }
            };
            var this_2 = this;
            for (var i = 0; i < this.listeners.length; ++i) {
                _loop_2(i);
            }
        };
        return NotificationManager;
    }());

    var LoggingSeverity;
    (function (LoggingSeverity) {
        /**
         * Error will be sent as internal telemetry
         */
        LoggingSeverity[LoggingSeverity["CRITICAL"] = 1] = "CRITICAL";
        /**
         * Error will NOT be sent as internal telemetry, and will only be shown in browser console
         */
        LoggingSeverity[LoggingSeverity["WARNING"] = 2] = "WARNING";
    })(LoggingSeverity || (LoggingSeverity = {}));
    /**
     * Internal message ID. Please create a new one for every conceptually different message. Please keep alphabetically ordered
     */
    var _InternalMessageId = {
        // Non user actionable
        BrowserDoesNotSupportLocalStorage: 0,
        BrowserCannotReadLocalStorage: 1,
        BrowserCannotReadSessionStorage: 2,
        BrowserCannotWriteLocalStorage: 3,
        BrowserCannotWriteSessionStorage: 4,
        BrowserFailedRemovalFromLocalStorage: 5,
        BrowserFailedRemovalFromSessionStorage: 6,
        CannotSendEmptyTelemetry: 7,
        ClientPerformanceMathError: 8,
        ErrorParsingAISessionCookie: 9,
        ErrorPVCalc: 10,
        ExceptionWhileLoggingError: 11,
        FailedAddingTelemetryToBuffer: 12,
        FailedMonitorAjaxAbort: 13,
        FailedMonitorAjaxDur: 14,
        FailedMonitorAjaxOpen: 15,
        FailedMonitorAjaxRSC: 16,
        FailedMonitorAjaxSend: 17,
        FailedMonitorAjaxGetCorrelationHeader: 18,
        FailedToAddHandlerForOnBeforeUnload: 19,
        FailedToSendQueuedTelemetry: 20,
        FailedToReportDataLoss: 21,
        FlushFailed: 22,
        MessageLimitPerPVExceeded: 23,
        MissingRequiredFieldSpecification: 24,
        NavigationTimingNotSupported: 25,
        OnError: 26,
        SessionRenewalDateIsZero: 27,
        SenderNotInitialized: 28,
        StartTrackEventFailed: 29,
        StopTrackEventFailed: 30,
        StartTrackFailed: 31,
        StopTrackFailed: 32,
        TelemetrySampledAndNotSent: 33,
        TrackEventFailed: 34,
        TrackExceptionFailed: 35,
        TrackMetricFailed: 36,
        TrackPVFailed: 37,
        TrackPVFailedCalc: 38,
        TrackTraceFailed: 39,
        TransmissionFailed: 40,
        FailedToSetStorageBuffer: 41,
        FailedToRestoreStorageBuffer: 42,
        InvalidBackendResponse: 43,
        FailedToFixDepricatedValues: 44,
        InvalidDurationValue: 45,
        TelemetryEnvelopeInvalid: 46,
        CreateEnvelopeError: 47,
        // User actionable
        CannotSerializeObject: 48,
        CannotSerializeObjectNonSerializable: 49,
        CircularReferenceDetected: 50,
        ClearAuthContextFailed: 51,
        ExceptionTruncated: 52,
        IllegalCharsInName: 53,
        ItemNotInArray: 54,
        MaxAjaxPerPVExceeded: 55,
        MessageTruncated: 56,
        NameTooLong: 57,
        SampleRateOutOfRange: 58,
        SetAuthContextFailed: 59,
        SetAuthContextFailedAccountName: 60,
        StringValueTooLong: 61,
        StartCalledMoreThanOnce: 62,
        StopCalledWithoutStart: 63,
        TelemetryInitializerFailed: 64,
        TrackArgumentsNotSpecified: 65,
        UrlTooLong: 66,
        SessionStorageBufferFull: 67,
        CannotAccessCookie: 68,
        IdTooLong: 69,
        InvalidEvent: 70,
        FailedMonitorAjaxSetRequestHeader: 71,
        SendBrowserInfoOnUserInit: 72
    };

    var _InternalLogMessage = /** @class */ (function () {
        function _InternalLogMessage(msgId, msg, isUserAct, properties) {
            if (isUserAct === void 0) { isUserAct = false; }
            this.messageId = msgId;
            this.message =
                (isUserAct ? _InternalLogMessage.AiUserActionablePrefix : _InternalLogMessage.AiNonUserActionablePrefix) +
                    msgId;
            var diagnosticText = (msg ? " message:" + _InternalLogMessage.sanitizeDiagnosticText(msg) : "") +
                (properties ? " props:" + _InternalLogMessage.sanitizeDiagnosticText(JSON.stringify(properties)) : "");
            this.message += diagnosticText;
        }
        _InternalLogMessage.sanitizeDiagnosticText = function (text) {
            return "\"" + text.replace(/\"/g, "") + "\"";
        };
        _InternalLogMessage.dataType = "MessageData";
        /**
         * For user non actionable traces use AI Internal prefix.
         */
        _InternalLogMessage.AiNonUserActionablePrefix = "AI (Internal): ";
        /**
         * Prefix of the traces in portal.
         */
        _InternalLogMessage.AiUserActionablePrefix = "AI: ";
        return _InternalLogMessage;
    }());
    var DiagnosticLogger = /** @class */ (function () {
        function DiagnosticLogger(config) {
            /**
             * The internal logging queue
             */
            this.queue = [];
            /**
             *  Session storage key for the prefix for the key indicating message type already logged
             */
            this.AIInternalMessagePrefix = "AITR_";
            /**
             * Count of internal messages sent
             */
            this._messageCount = 0;
            /**
             * Holds information about what message types were already logged to console or sent to server.
             */
            this._messageLogged = {};
            /**
             * When this is true the SDK will throw exceptions to aid in debugging.
             */
            this.enableDebugExceptions = function () { return false; };
            /**
             * 0: OFF (default)
             * 1: CRITICAL
             * 2: >= WARNING
             */
            this.consoleLoggingLevel = function () { return 0; };
            /**
             * 0: OFF
             * 1: CRITICAL (default)
             * 2: >= WARNING
             */
            this.telemetryLoggingLevel = function () { return 1; };
            /**
             * The maximum number of internal messages allowed to be sent per page view
             */
            this.maxInternalMessageLimit = function () { return 25; };
            if (CoreUtils.isNullOrUndefined(config)) {
                // TODO: Use default config
                // config = AppInsightsCore.defaultConfig;
                // For now, use defaults specified in DiagnosticLogger members;
                return;
            }
            if (!CoreUtils.isNullOrUndefined(config.loggingLevelConsole)) {
                this.consoleLoggingLevel = function () { return config.loggingLevelConsole; };
            }
            if (!CoreUtils.isNullOrUndefined(config.loggingLevelTelemetry)) {
                this.telemetryLoggingLevel = function () { return config.loggingLevelTelemetry; };
            }
            if (!CoreUtils.isNullOrUndefined(config.maxMessageLimit)) {
                this.maxInternalMessageLimit = function () { return config.maxMessageLimit; };
            }
            if (!CoreUtils.isNullOrUndefined(config.enableDebugExceptions)) {
                this.enableDebugExceptions = function () { return config.enableDebugExceptions; };
            }
        }
        /**
         * This method will throw exceptions in debug mode or attempt to log the error as a console warning.
         * @param severity {LoggingSeverity} - The severity of the log message
         * @param message {_InternalLogMessage} - The log message.
         */
        DiagnosticLogger.prototype.throwInternal = function (severity, msgId, msg, properties, isUserAct) {
            if (isUserAct === void 0) { isUserAct = false; }
            var message = new _InternalLogMessage(msgId, msg, isUserAct, properties);
            if (this.enableDebugExceptions()) {
                throw message;
            }
            else {
                if (typeof (message) !== "undefined" && !!message) {
                    if (typeof (message.message) !== "undefined") {
                        if (isUserAct) {
                            // check if this message type was already logged to console for this page view and if so, don't log it again
                            var messageKey = +message.messageId;
                            if (!this._messageLogged[messageKey] || this.consoleLoggingLevel() >= LoggingSeverity.WARNING) {
                                this.warnToConsole(message.message);
                                this._messageLogged[messageKey] = true;
                            }
                        }
                        else {
                            // don't log internal AI traces in the console, unless the verbose logging is enabled
                            if (this.consoleLoggingLevel() >= LoggingSeverity.WARNING) {
                                this.warnToConsole(message.message);
                            }
                        }
                        this.logInternalMessage(severity, message);
                    }
                }
            }
        };
        /**
         * This will write a warning to the console if possible
         * @param message {string} - The warning message
         */
        DiagnosticLogger.prototype.warnToConsole = function (message) {
            if (typeof console !== "undefined" && !!console) {
                if (typeof console.warn === "function") {
                    console.warn(message);
                }
                else if (typeof console.log === "function") {
                    console.log(message);
                }
            }
        };
        /**
         * Resets the internal message count
         */
        DiagnosticLogger.prototype.resetInternalMessageCount = function () {
            this._messageCount = 0;
            this._messageLogged = {};
        };
        /**
         * Logs a message to the internal queue.
         * @param severity {LoggingSeverity} - The severity of the log message
         * @param message {_InternalLogMessage} - The message to log.
         */
        DiagnosticLogger.prototype.logInternalMessage = function (severity, message) {
            if (this._areInternalMessagesThrottled()) {
                return;
            }
            // check if this message type was already logged for this session and if so, don't log it again
            var logMessage = true;
            var messageKey = this.AIInternalMessagePrefix + message.messageId;
            // if the session storage is not available, limit to only one message type per page view
            if (this._messageLogged[messageKey]) {
                logMessage = false;
            }
            else {
                this._messageLogged[messageKey] = true;
            }
            if (logMessage) {
                // Push the event in the internal queue
                if (severity <= this.telemetryLoggingLevel()) {
                    this.queue.push(message);
                    this._messageCount++;
                }
                // When throttle limit reached, send a special event
                if (this._messageCount === this.maxInternalMessageLimit()) {
                    var throttleLimitMessage = "Internal events throttle limit per PageView reached for this app.";
                    var throttleMessage = new _InternalLogMessage(_InternalMessageId.MessageLimitPerPVExceeded, throttleLimitMessage, false);
                    this.queue.push(throttleMessage);
                    this.warnToConsole(throttleLimitMessage);
                }
            }
        };
        /**
         * Indicates whether the internal events are throttled
         */
        DiagnosticLogger.prototype._areInternalMessagesThrottled = function () {
            return this._messageCount >= this.maxInternalMessageLimit();
        };
        return DiagnosticLogger;
    }());

    var AppInsightsCore = /** @class */ (function (_super) {
        __extends(AppInsightsCore, _super);
        function AppInsightsCore() {
            return _super.call(this) || this;
        }
        AppInsightsCore.prototype.initialize = function (config, extensions) {
            this._notificationManager = new NotificationManager();
            this.logger = new DiagnosticLogger(config);
            this.config = config;
            _super.prototype.initialize.call(this, config, extensions, this.logger, this._notificationManager);
        };
        AppInsightsCore.prototype.getTransmissionControls = function () {
            return _super.prototype.getTransmissionControls.call(this);
        };
        AppInsightsCore.prototype.track = function (telemetryItem) {
            if (telemetryItem === null) {
                this._notifyInvalidEvent(telemetryItem);
                // throw error
                throw Error("Invalid telemetry item");
            }
            // do basic validation before sending it through the pipeline
            this._validateTelemetryItem(telemetryItem);
            _super.prototype.track.call(this, telemetryItem);
        };
        /**
         * Adds a notification listener. The SDK calls methods on the listener when an appropriate notification is raised.
         * The added plugins must raise notifications. If the plugins do not implement the notifications, then no methods will be
         * called.
         * @param {INotificationListener} listener - An INotificationListener object.
         */
        AppInsightsCore.prototype.addNotificationListener = function (listener) {
            if (this._notificationManager) {
                this._notificationManager.addNotificationListener(listener);
            }
        };
        /**
         * Removes all instances of the listener.
         * @param {INotificationListener} listener - INotificationListener to remove.
         */
        AppInsightsCore.prototype.removeNotificationListener = function (listener) {
            if (this._notificationManager) {
                this._notificationManager.removeNotificationListener(listener);
            }
        };
        /**
         * Periodically check logger.queue for
         */
        AppInsightsCore.prototype.pollInternalLogs = function (eventName) {
            var _this = this;
            var interval = this.config.diagnosticLogInterval;
            if (!(interval > 0)) {
                interval = 10000;
            }
            return setInterval(function () {
                var queue = _this.logger ? _this.logger.queue : [];
                CoreUtils.arrForEach(queue, function (logMessage) {
                    var item = {
                        name: eventName ? eventName : "InternalMessageId: " + logMessage.messageId,
                        iKey: _this.config.instrumentationKey,
                        time: CoreUtils.toISOString(new Date()),
                        baseType: _InternalLogMessage.dataType,
                        baseData: { message: logMessage.message }
                    };
                    _this.track(item);
                });
                queue.length = 0;
            }, interval);
        };
        AppInsightsCore.prototype._validateTelemetryItem = function (telemetryItem) {
            if (CoreUtils.isNullOrUndefined(telemetryItem.name)) {
                this._notifyInvalidEvent(telemetryItem);
                throw Error("telemetry name required");
            }
        };
        AppInsightsCore.prototype._notifyInvalidEvent = function (telemetryItem) {
            if (this._notificationManager) {
                this._notificationManager.eventsDiscarded([telemetryItem], EventsDiscardedReason.InvalidEvent);
            }
        };
        return AppInsightsCore;
    }(BaseCore));

    var RequestHeaders = /** @class */ (function () {
        function RequestHeaders() {
        }
        /**
         * Request-Context header
         */
        RequestHeaders.requestContextHeader = "Request-Context";
        /**
         * Target instrumentation header that is added to the response and retrieved by the
         * calling application when processing incoming responses.
         */
        RequestHeaders.requestContextTargetKey = "appId";
        /**
         * Request-Context appId format
         */
        RequestHeaders.requestContextAppIdFormat = "appId=cid-v1:";
        /**
         * Request-Id header
         */
        RequestHeaders.requestIdHeader = "Request-Id";
        /**
         * W3C distributed tracing protocol header
         */
        RequestHeaders.traceParentHeader = "traceparent";
        /**
         * Sdk-Context header
         * If this header passed with appId in content then appId will be returned back by the backend.
         */
        RequestHeaders.sdkContextHeader = "Sdk-Context";
        /**
         * String to pass in header for requesting appId back from the backend.
         */
        RequestHeaders.sdkContextHeaderAppIdRequest = "appId";
        RequestHeaders.requestContextHeaderLowerCase = "request-context";
        return RequestHeaders;
    }());

    var DataSanitizer = /** @class */ (function () {
        function DataSanitizer() {
        }
        DataSanitizer.sanitizeKeyAndAddUniqueness = function (logger, key, map) {
            var origLength = key.length;
            var field = DataSanitizer.sanitizeKey(logger, key);
            // validation truncated the length.  We need to add uniqueness
            if (field.length !== origLength) {
                var i = 0;
                var uniqueField = field;
                while (map[uniqueField] !== undefined) {
                    i++;
                    uniqueField = field.substring(0, DataSanitizer.MAX_NAME_LENGTH - 3) + DataSanitizer.padNumber(i);
                }
                field = uniqueField;
            }
            return field;
        };
        DataSanitizer.sanitizeKey = function (logger, name) {
            var nameTrunc;
            if (name) {
                // Remove any leading or trailing whitepace
                name = DataSanitizer.trim(name.toString());
                // truncate the string to 150 chars
                if (name.length > DataSanitizer.MAX_NAME_LENGTH) {
                    nameTrunc = name.substring(0, DataSanitizer.MAX_NAME_LENGTH);
                    logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.NameTooLong, "name is too long.  It has been truncated to " + DataSanitizer.MAX_NAME_LENGTH + " characters.", { name: name }, true);
                }
            }
            return nameTrunc || name;
        };
        DataSanitizer.sanitizeString = function (logger, value, maxLength) {
            if (maxLength === void 0) { maxLength = DataSanitizer.MAX_STRING_LENGTH; }
            var valueTrunc;
            if (value) {
                maxLength = maxLength ? maxLength : DataSanitizer.MAX_STRING_LENGTH; // in case default parameters dont work
                value = DataSanitizer.trim(value);
                if (value.toString().length > maxLength) {
                    valueTrunc = value.toString().substring(0, maxLength);
                    logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.StringValueTooLong, "string value is too long. It has been truncated to " + maxLength + " characters.", { value: value }, true);
                }
            }
            return valueTrunc || value;
        };
        DataSanitizer.sanitizeUrl = function (logger, url) {
            return DataSanitizer.sanitizeInput(logger, url, DataSanitizer.MAX_URL_LENGTH, _InternalMessageId.UrlTooLong);
        };
        DataSanitizer.sanitizeMessage = function (logger, message) {
            var messageTrunc;
            if (message) {
                if (message.length > DataSanitizer.MAX_MESSAGE_LENGTH) {
                    messageTrunc = message.substring(0, DataSanitizer.MAX_MESSAGE_LENGTH);
                    logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.MessageTruncated, "message is too long, it has been truncated to " + DataSanitizer.MAX_MESSAGE_LENGTH + " characters.", { message: message }, true);
                }
            }
            return messageTrunc || message;
        };
        DataSanitizer.sanitizeException = function (logger, exception) {
            var exceptionTrunc;
            if (exception) {
                if (exception.length > DataSanitizer.MAX_EXCEPTION_LENGTH) {
                    exceptionTrunc = exception.substring(0, DataSanitizer.MAX_EXCEPTION_LENGTH);
                    logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.ExceptionTruncated, "exception is too long, it has been truncated to " + DataSanitizer.MAX_EXCEPTION_LENGTH + " characters.", { exception: exception }, true);
                }
            }
            return exceptionTrunc || exception;
        };
        DataSanitizer.sanitizeProperties = function (logger, properties) {
            if (properties) {
                var tempProps = {};
                for (var prop in properties) {
                    var value = properties[prop];
                    if (typeof value === "object" && typeof JSON !== "undefined") {
                        // Stringify any part C properties
                        try {
                            value = JSON.stringify(value);
                        }
                        catch (e) {
                            logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.CannotSerializeObjectNonSerializable, "custom property is not valid", { exception: e }, true);
                        }
                    }
                    value = DataSanitizer.sanitizeString(logger, value, DataSanitizer.MAX_PROPERTY_LENGTH);
                    prop = DataSanitizer.sanitizeKeyAndAddUniqueness(logger, prop, tempProps);
                    tempProps[prop] = value;
                }
                properties = tempProps;
            }
            return properties;
        };
        DataSanitizer.sanitizeMeasurements = function (logger, measurements) {
            if (measurements) {
                var tempMeasurements = {};
                for (var measure in measurements) {
                    var value = measurements[measure];
                    measure = DataSanitizer.sanitizeKeyAndAddUniqueness(logger, measure, tempMeasurements);
                    tempMeasurements[measure] = value;
                }
                measurements = tempMeasurements;
            }
            return measurements;
        };
        DataSanitizer.sanitizeId = function (logger, id) {
            return id ? DataSanitizer.sanitizeInput(logger, id, DataSanitizer.MAX_ID_LENGTH, _InternalMessageId.IdTooLong).toString() : id;
        };
        DataSanitizer.sanitizeInput = function (logger, input, maxLength, _msgId) {
            var inputTrunc;
            if (input) {
                input = DataSanitizer.trim(input);
                if (input.length > maxLength) {
                    inputTrunc = input.substring(0, maxLength);
                    logger.throwInternal(LoggingSeverity.WARNING, _msgId, "input is too long, it has been truncated to " + maxLength + " characters.", { data: input }, true);
                }
            }
            return inputTrunc || input;
        };
        DataSanitizer.padNumber = function (num) {
            var s = "00" + num;
            return s.substr(s.length - 3);
        };
        /**
         * helper method to trim strings (IE8 does not implement String.prototype.trim)
         */
        DataSanitizer.trim = function (str) {
            if (typeof str !== "string") {
                return str;
            }
            return str.replace(/^\s+|\s+$/g, "");
        };
        /**
         * Max length allowed for custom names.
         */
        DataSanitizer.MAX_NAME_LENGTH = 150;
        /**
         * Max length allowed for Id field in page views.
         */
        DataSanitizer.MAX_ID_LENGTH = 128;
        /**
         * Max length allowed for custom values.
         */
        DataSanitizer.MAX_PROPERTY_LENGTH = 8192;
        /**
         * Max length allowed for names
         */
        DataSanitizer.MAX_STRING_LENGTH = 1024;
        /**
         * Max length allowed for url.
         */
        DataSanitizer.MAX_URL_LENGTH = 2048;
        /**
         * Max length allowed for messages.
         */
        DataSanitizer.MAX_MESSAGE_LENGTH = 32768;
        /**
         * Max length allowed for exceptions.
         */
        DataSanitizer.MAX_EXCEPTION_LENGTH = 32768;
        return DataSanitizer;
    }());

    // Adding common usage of prototype as a string to enable indexed lookup to assist with minification
    var prototype$1 = "prototype";
    var Util = /** @class */ (function () {
        function Util() {
        }
        Util.createDomEvent = function (eventName) {
            var event = null;
            if (typeof Event === "function") {
                event = new Event(eventName);
            }
            else {
                event = document.createEvent("Event");
                event.initEvent(eventName, true, true);
            }
            return event;
        };
        /*
         * Force the SDK not to use local and session storage
        */
        Util.disableStorage = function () {
            Util._canUseLocalStorage = false;
            Util._canUseSessionStorage = false;
        };
        /**
         * Gets the localStorage object if available
         * @return {Storage} - Returns the storage object if available else returns null
         */
        Util._getLocalStorageObject = function () {
            if (Util.canUseLocalStorage()) {
                return Util._getVerifiedStorageObject(StorageType.LocalStorage);
            }
            return null;
        };
        /**
         * Tests storage object (localStorage or sessionStorage) to verify that it is usable
         * More details here: https://mathiasbynens.be/notes/localstorage-pattern
         * @param storageType Type of storage
         * @return {Storage} Returns storage object verified that it is usable
         */
        Util._getVerifiedStorageObject = function (storageType) {
            var storage = null;
            var fail;
            var uid;
            try {
                if (typeof window === 'undefined') {
                    return null;
                }
                uid = new Date;
                storage = storageType === StorageType.LocalStorage ? window.localStorage : window.sessionStorage;
                storage.setItem(uid.toString(), uid.toString());
                fail = storage.getItem(uid.toString()) !== uid.toString();
                storage.removeItem(uid.toString());
                if (fail) {
                    storage = null;
                }
            }
            catch (exception) {
                storage = null;
            }
            return storage;
        };
        /**
         *  Checks if endpoint URL is application insights internal injestion service URL.
         *
         *  @param endpointUrl Endpoint URL to check.
         *  @returns {boolean} True if if endpoint URL is application insights internal injestion service URL.
         */
        Util.isInternalApplicationInsightsEndpoint = function (endpointUrl) {
            return Util._internalEndpoints.indexOf(endpointUrl.toLowerCase()) !== -1;
        };
        /**
         *  Check if the browser supports local storage.
         *
         *  @returns {boolean} True if local storage is supported.
         */
        Util.canUseLocalStorage = function () {
            if (Util._canUseLocalStorage === undefined) {
                Util._canUseLocalStorage = !!Util._getVerifiedStorageObject(StorageType.LocalStorage);
            }
            return Util._canUseLocalStorage;
        };
        /**
         *  Get an object from the browser's local storage
         *
         *  @param {string} name - the name of the object to get from storage
         *  @returns {string} The contents of the storage object with the given name. Null if storage is not supported.
         */
        Util.getStorage = function (logger, name) {
            var storage = Util._getLocalStorageObject();
            if (storage !== null) {
                try {
                    return storage.getItem(name);
                }
                catch (e) {
                    Util._canUseLocalStorage = false;
                    logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.BrowserCannotReadLocalStorage, "Browser failed read of local storage. " + Util.getExceptionName(e), { exception: Util.dump(e) });
                }
            }
            return null;
        };
        /**
         *  Set the contents of an object in the browser's local storage
         *
         *  @param {string} name - the name of the object to set in storage
         *  @param {string} data - the contents of the object to set in storage
         *  @returns {boolean} True if the storage object could be written.
         */
        Util.setStorage = function (logger, name, data) {
            var storage = Util._getLocalStorageObject();
            if (storage !== null) {
                try {
                    storage.setItem(name, data);
                    return true;
                }
                catch (e) {
                    Util._canUseLocalStorage = false;
                    logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.BrowserCannotWriteLocalStorage, "Browser failed write to local storage. " + Util.getExceptionName(e), { exception: Util.dump(e) });
                }
            }
            return false;
        };
        /**
         *  Remove an object from the browser's local storage
         *
         *  @param {string} name - the name of the object to remove from storage
         *  @returns {boolean} True if the storage object could be removed.
         */
        Util.removeStorage = function (logger, name) {
            var storage = Util._getLocalStorageObject();
            if (storage !== null) {
                try {
                    storage.removeItem(name);
                    return true;
                }
                catch (e) {
                    Util._canUseLocalStorage = false;
                    logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.BrowserFailedRemovalFromLocalStorage, "Browser failed removal of local storage item. " + Util.getExceptionName(e), { exception: Util.dump(e) });
                }
            }
            return false;
        };
        /**
         * Gets the sessionStorage object if available
         * @return {Storage} - Returns the storage object if available else returns null
         */
        Util._getSessionStorageObject = function () {
            if (Util.canUseSessionStorage()) {
                return Util._getVerifiedStorageObject(StorageType.SessionStorage);
            }
            return null;
        };
        /**
         *  Check if the browser supports session storage.
         *
         *  @returns {boolean} True if session storage is supported.
         */
        Util.canUseSessionStorage = function () {
            if (Util._canUseSessionStorage === undefined) {
                Util._canUseSessionStorage = !!Util._getVerifiedStorageObject(StorageType.SessionStorage);
            }
            return Util._canUseSessionStorage;
        };
        /**
         *  Gets the list of session storage keys
         *
         *  @returns {string[]} List of session storage keys
         */
        Util.getSessionStorageKeys = function () {
            var keys = [];
            if (Util.canUseSessionStorage()) {
                for (var key in window.sessionStorage) {
                    keys.push(key);
                }
            }
            return keys;
        };
        /**
         *  Get an object from the browser's session storage
         *
         *  @param {string} name - the name of the object to get from storage
         *  @returns {string} The contents of the storage object with the given name. Null if storage is not supported.
         */
        Util.getSessionStorage = function (logger, name) {
            var storage = Util._getSessionStorageObject();
            if (storage !== null) {
                try {
                    return storage.getItem(name);
                }
                catch (e) {
                    Util._canUseSessionStorage = false;
                    logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.BrowserCannotReadSessionStorage, "Browser failed read of session storage. " + Util.getExceptionName(e), { exception: Util.dump(e) });
                }
            }
            return null;
        };
        /**
         *  Set the contents of an object in the browser's session storage
         *
         *  @param {string} name - the name of the object to set in storage
         *  @param {string} data - the contents of the object to set in storage
         *  @returns {boolean} True if the storage object could be written.
         */
        Util.setSessionStorage = function (logger, name, data) {
            var storage = Util._getSessionStorageObject();
            if (storage !== null) {
                try {
                    storage.setItem(name, data);
                    return true;
                }
                catch (e) {
                    Util._canUseSessionStorage = false;
                    logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.BrowserCannotWriteSessionStorage, "Browser failed write to session storage. " + Util.getExceptionName(e), { exception: Util.dump(e) });
                }
            }
            return false;
        };
        /**
         *  Remove an object from the browser's session storage
         *
         *  @param {string} name - the name of the object to remove from storage
         *  @returns {boolean} True if the storage object could be removed.
         */
        Util.removeSessionStorage = function (logger, name) {
            var storage = Util._getSessionStorageObject();
            if (storage !== null) {
                try {
                    storage.removeItem(name);
                    return true;
                }
                catch (e) {
                    Util._canUseSessionStorage = false;
                    logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.BrowserFailedRemovalFromSessionStorage, "Browser failed removal of session storage item. " + Util.getExceptionName(e), { exception: Util.dump(e) });
                }
            }
            return false;
        };
        /*
         * Force the SDK not to store and read any data from cookies
         */
        Util.disableCookies = function () {
            CoreUtils.disableCookies();
        };
        /*
         * helper method to tell if document.cookie object is available
         */
        Util.canUseCookies = function (logger) {
            if (CoreUtils._canUseCookies === undefined) {
                CoreUtils._canUseCookies = false;
                try {
                    CoreUtils._canUseCookies = Util.document.cookie !== undefined;
                }
                catch (e) {
                    logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.CannotAccessCookie, "Cannot access document.cookie - " + Util.getExceptionName(e), { exception: Util.dump(e) });
                }
            }
            return CoreUtils._canUseCookies;
        };
        /**
         * helper method to set userId and sessionId cookie
         */
        Util.setCookie = function (logger, name, value, domain) {
            value = value + ";SameSite=None";
            var domainAttrib = "";
            var secureAttrib = "";
            if (domain) {
                domainAttrib = ";domain=" + domain;
            }
            if (Util.document.location && Util.document.location.protocol === "https:") {
                secureAttrib = ";secure";
            }
            if (Util.canUseCookies(logger)) {
                Util.document.cookie = name + "=" + value + domainAttrib + ";path=/" + secureAttrib;
            }
        };
        Util.stringToBoolOrDefault = function (str, defaultValue) {
            if (defaultValue === void 0) { defaultValue = false; }
            if (str === undefined || str === null) {
                return defaultValue;
            }
            return str.toString().toLowerCase() === "true";
        };
        /**
         * helper method to access userId and sessionId cookie
         */
        Util.getCookie = function (logger, name) {
            if (!Util.canUseCookies(logger)) {
                return;
            }
            var value = "";
            if (name && name.length) {
                var cookieName = name + "=";
                var cookies = Util.document.cookie.split(";");
                for (var i = 0; i < cookies.length; i++) {
                    var cookie = cookies[i];
                    cookie = Util.trim(cookie);
                    if (cookie && cookie.indexOf(cookieName) === 0) {
                        value = cookie.substring(cookieName.length, cookies[i].length);
                        break;
                    }
                }
            }
            return value;
        };
        /**
         * Deletes a cookie by setting it's expiration time in the past.
         * @param name - The name of the cookie to delete.
         */
        Util.deleteCookie = function (logger, name) {
            if (Util.canUseCookies(logger)) {
                // Setting the expiration date in the past immediately removes the cookie
                Util.document.cookie = name + "=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT;";
            }
        };
        /**
         * helper method to trim strings (IE8 does not implement String.prototype.trim)
         */
        Util.trim = function (str) {
            if (typeof str !== "string") {
                return str;
            }
            return str.replace(/^\s+|\s+$/g, "");
        };
        /**
         * generate random id string
         */
        Util.newId = function () {
            var base64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
            var result = "";
            // tslint:disable-next-line:insecure-random
            var random = Math.random() * 1073741824; // 5 symbols in base64, almost maxint
            while (random > 0) {
                var char = base64chars.charAt(random % 64);
                result += char;
                random = Math.floor(random / 64);
            }
            return result;
        };
        /**
         * generate a random 32bit number (-0x80000000..0x7FFFFFFF).
         */
        Util.random32 = function () {
            return (0x100000000 * Math.random()) | 0;
        };
        /**
         * generate W3C trace id
         */
        Util.generateW3CId = function () {
            var hexValues = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];
            // rfc4122 version 4 UUID without dashes and with lowercase letters
            var oct = "", tmp;
            for (var a = 0; a < 4; a++) {
                tmp = Util.random32();
                oct +=
                    hexValues[tmp & 0xF] +
                        hexValues[tmp >> 4 & 0xF] +
                        hexValues[tmp >> 8 & 0xF] +
                        hexValues[tmp >> 12 & 0xF] +
                        hexValues[tmp >> 16 & 0xF] +
                        hexValues[tmp >> 20 & 0xF] +
                        hexValues[tmp >> 24 & 0xF] +
                        hexValues[tmp >> 28 & 0xF];
            }
            // "Set the two most significant bits (bits 6 and 7) of the clock_seq_hi_and_reserved to zero and one, respectively"
            var clockSequenceHi = hexValues[8 + (Math.random() * 4) | 0];
            return oct.substr(0, 8) + oct.substr(9, 4) + "4" + oct.substr(13, 3) + clockSequenceHi + oct.substr(16, 3) + oct.substr(19, 12);
        };
        /**
         * Check if an object is of type Array
         */
        Util.isArray = function (obj) {
            return Object[prototype$1].toString.call(obj) === "[object Array]";
        };
        /**
         * Check if an object is of type Error
         */
        Util.isError = function (obj) {
            return Object[prototype$1].toString.call(obj) === "[object Error]";
        };
        /**
         * Gets IE version if we are running on IE, or null otherwise
         */
        Util.getIEVersion = function (userAgentStr) {
            if (userAgentStr === void 0) { userAgentStr = null; }
            var myNav = userAgentStr ? userAgentStr.toLowerCase() : navigator.userAgent.toLowerCase();
            return (myNav.indexOf('msie') !== -1) ? parseInt(myNav.split('msie')[1]) : null;
        };
        /**
         * Convert ms to c# time span format
         */
        Util.msToTimeSpan = function (totalms) {
            if (isNaN(totalms) || totalms < 0) {
                totalms = 0;
            }
            totalms = Math.round(totalms);
            var ms = "" + totalms % 1000;
            var sec = "" + Math.floor(totalms / 1000) % 60;
            var min = "" + Math.floor(totalms / (1000 * 60)) % 60;
            var hour = "" + Math.floor(totalms / (1000 * 60 * 60)) % 24;
            var days = Math.floor(totalms / (1000 * 60 * 60 * 24));
            ms = ms.length === 1 ? "00" + ms : ms.length === 2 ? "0" + ms : ms;
            sec = sec.length < 2 ? "0" + sec : sec;
            min = min.length < 2 ? "0" + min : min;
            hour = hour.length < 2 ? "0" + hour : hour;
            return (days > 0 ? days + "." : "") + hour + ":" + min + ":" + sec + "." + ms;
        };
        /**
         * Checks if error has no meaningful data inside. Ususally such errors are received by window.onerror when error
         * happens in a script from other domain (cross origin, CORS).
         */
        Util.isCrossOriginError = function (message, url, lineNumber, columnNumber, error) {
            return (message === "Script error." || message === "Script error") && !error;
        };
        /**
         * Returns string representation of an object suitable for diagnostics logging.
         */
        Util.dump = function (object) {
            var objectTypeDump = Object[prototype$1].toString.call(object);
            var propertyValueDump = JSON.stringify(object);
            if (objectTypeDump === "[object Error]") {
                propertyValueDump = "{ stack: '" + object.stack + "', message: '" + object.message + "', name: '" + object.name + "'";
            }
            return objectTypeDump + propertyValueDump;
        };
        /**
         * Returns the name of object if it's an Error. Otherwise, returns empty string.
         */
        Util.getExceptionName = function (object) {
            var objectTypeDump = Object[prototype$1].toString.call(object);
            if (objectTypeDump === "[object Error]") {
                return object.name;
            }
            return "";
        };
        /**
         * Adds an event handler for the specified event
         * @param eventName {string} - The name of the event
         * @param callback {any} - The callback function that needs to be executed for the given event
         * @return {boolean} - true if the handler was successfully added
         */
        Util.addEventHandler = function (eventName, callback) {
            if (typeof window === 'undefined' || !window || typeof eventName !== 'string' || typeof callback !== 'function') {
                return false;
            }
            // Create verb for the event
            var verbEventName = 'on' + eventName;
            // check if addEventListener is available
            if (window.addEventListener) {
                window.addEventListener(eventName, callback, false);
            }
            else if (window["attachEvent"]) {
                window["attachEvent"](verbEventName, callback);
            }
            else {
                return false;
            }
            return true;
        };
        /**
         * Tells if a browser supports a Beacon API
         */
        Util.IsBeaconApiSupported = function () {
            return ('sendBeacon' in navigator && navigator.sendBeacon);
        };
        Util.getExtension = function (extensions, identifier) {
            var extension = null;
            var extIx = 0;
            while (!extension && extIx < extensions.length) {
                if (extensions[extIx] && extensions[extIx].identifier === identifier) {
                    extension = extensions[extIx];
                }
                extIx++;
            }
            return extension;
        };
        Util.document = typeof document !== "undefined" ? document : {};
        Util._canUseLocalStorage = undefined;
        Util._canUseSessionStorage = undefined;
        // listing only non-geo specific locations
        Util._internalEndpoints = [
            "https://dc.services.visualstudio.com/v2/track",
            "https://breeze.aimon.applicationinsights.io/v2/track",
            "https://dc-int.services.visualstudio.com/v2/track"
        ];
        Util.NotSpecified = "not_specified";
        /**
         * Check if an object is of type Date
         */
        Util.isDate = CoreUtils.isDate;
        // Keeping this name for backward compatibility (for now)
        Util.toISOStringForIE8 = CoreUtils.toISOString;
        return Util;
    }());
    var UrlHelper = /** @class */ (function () {
        function UrlHelper() {
        }
        UrlHelper.parseUrl = function (url) {
            if (!UrlHelper.htmlAnchorElement) {
                UrlHelper.htmlAnchorElement = !!UrlHelper.document.createElement ? UrlHelper.document.createElement('a') : { host: UrlHelper.parseHost(url) }; // fill host field in the fallback case as that is the only externally required field from this fn
            }
            UrlHelper.htmlAnchorElement.href = url;
            return UrlHelper.htmlAnchorElement;
        };
        UrlHelper.getAbsoluteUrl = function (url) {
            var result;
            var a = UrlHelper.parseUrl(url);
            if (a) {
                result = a.href;
            }
            return result;
        };
        UrlHelper.getPathName = function (url) {
            var result;
            var a = UrlHelper.parseUrl(url);
            if (a) {
                result = a.pathname;
            }
            return result;
        };
        UrlHelper.getCompleteUrl = function (method, absoluteUrl) {
            if (method) {
                return method.toUpperCase() + " " + absoluteUrl;
            }
            else {
                return absoluteUrl;
            }
        };
        // Fallback method to grab host from url if document.createElement method is not available
        UrlHelper.parseHost = function (url) {
            var match = url.match(/:\/\/(www[0-9]?\.)?(.[^/:]+)/i);
            if (match != null && match.length > 2 && typeof match[2] === 'string' && match[2].length > 0) {
                return match[2];
            }
            else {
                return null;
            }
        };
        UrlHelper.document = typeof document !== "undefined" ? document : {};
        return UrlHelper;
    }());
    var CorrelationIdHelper = /** @class */ (function () {
        function CorrelationIdHelper() {
        }
        /**
         * Checks if a request url is not on a excluded domain list and if it is safe to add correlation headers
         */
        CorrelationIdHelper.canIncludeCorrelationHeader = function (config, requestUrl, currentHost) {
            if (config && config.disableCorrelationHeaders) {
                return false;
            }
            if (!requestUrl) {
                return false;
            }
            var requestHost = UrlHelper.parseUrl(requestUrl).host.toLowerCase();
            if ((!config || !config.enableCorsCorrelation) && requestHost !== currentHost) {
                return false;
            }
            var includedDomains = config && config.correlationHeaderDomains;
            if (includedDomains) {
                var matchExists_1;
                CoreUtils.arrForEach(includedDomains, function (domain) {
                    var regex = new RegExp(domain.toLowerCase().replace(/\./g, "\.").replace(/\*/g, ".*"));
                    matchExists_1 = matchExists_1 || regex.test(requestHost);
                });
                if (!matchExists_1) {
                    return false;
                }
            }
            var excludedDomains = config && config.correlationHeaderExcludedDomains;
            if (!excludedDomains || excludedDomains.length === 0) {
                return true;
            }
            for (var i = 0; i < excludedDomains.length; i++) {
                var regex = new RegExp(excludedDomains[i].toLowerCase().replace(/\./g, "\.").replace(/\*/g, ".*"));
                if (regex.test(requestHost)) {
                    return false;
                }
            }
            return true;
        };
        /**
         * Combines target appId and target role name from response header.
         */
        CorrelationIdHelper.getCorrelationContext = function (responseHeader) {
            if (responseHeader) {
                var correlationId = CorrelationIdHelper.getCorrelationContextValue(responseHeader, RequestHeaders.requestContextTargetKey);
                if (correlationId && correlationId !== CorrelationIdHelper.correlationIdPrefix) {
                    return correlationId;
                }
            }
        };
        /**
         * Gets key from correlation response header
         */
        CorrelationIdHelper.getCorrelationContextValue = function (responseHeader, key) {
            if (responseHeader) {
                var keyValues = responseHeader.split(",");
                for (var i = 0; i < keyValues.length; ++i) {
                    var keyValue = keyValues[i].split("=");
                    if (keyValue.length === 2 && keyValue[0] === key) {
                        return keyValue[1];
                    }
                }
            }
        };
        CorrelationIdHelper.correlationIdPrefix = "cid-v1:";
        return CorrelationIdHelper;
    }());
    var AjaxHelper = /** @class */ (function () {
        function AjaxHelper() {
        }
        AjaxHelper.ParseDependencyPath = function (logger, absoluteUrl, method, commandName) {
            var target, name = commandName, data = commandName;
            if (absoluteUrl && absoluteUrl.length > 0) {
                var parsedUrl = UrlHelper.parseUrl(absoluteUrl);
                target = parsedUrl.host;
                if (!name) {
                    if (parsedUrl.pathname != null) {
                        var pathName = (parsedUrl.pathname.length === 0) ? "/" : parsedUrl.pathname;
                        if (pathName.charAt(0) !== '/') {
                            pathName = "/" + pathName;
                        }
                        data = parsedUrl.pathname;
                        name = DataSanitizer.sanitizeString(logger, method ? method + " " + pathName : pathName);
                    }
                    else {
                        name = DataSanitizer.sanitizeString(logger, absoluteUrl);
                    }
                }
            }
            else {
                target = commandName;
                name = commandName;
            }
            return {
                target: target,
                name: name,
                data: data
            };
        };
        return AjaxHelper;
    }());
    /**
     * A utility class that helps getting time related parameters
     */
    var DateTimeUtils = /** @class */ (function () {
        function DateTimeUtils() {
        }
        /**
         * Get the number of milliseconds since 1970/01/01 in local timezone
         */
        DateTimeUtils.Now = (typeof window === 'undefined') ? function () { return new Date().getTime(); } :
            (window.performance && window.performance.now && window.performance.timing) ?
                function () {
                    return window.performance.now() + window.performance.timing.navigationStart;
                }
                :
                    function () {
                        return new Date().getTime();
                    };
        /**
         * Gets duration between two timestamps
         */
        DateTimeUtils.GetDuration = function (start, end) {
            var result = null;
            if (start !== 0 && end !== 0 && !CoreUtils.isNullOrUndefined(start) && !CoreUtils.isNullOrUndefined(end)) {
                result = end - start;
            }
            return result;
        };
        return DateTimeUtils;
    }());

    var DisabledPropertyName = "Microsoft_ApplicationInsights_BypassAjaxInstrumentation";
    var SampleRate = "sampleRate";
    var ProcessLegacy = "ProcessLegacy";
    var HttpMethod = "http.method";
    var DEFAULT_BREEZE_ENDPOINT = "https://dc.services.visualstudio.com";

    var ConnectionStringParser = /** @class */ (function () {
        function ConnectionStringParser() {
        }
        ConnectionStringParser.parse = function (connectionString) {
            if (!connectionString) {
                return {};
            }
            var kvPairs = connectionString.split(ConnectionStringParser._FIELDS_SEPARATOR);
            var result = CoreUtils.arrReduce(kvPairs, function (fields, kv) {
                var kvParts = kv.split(ConnectionStringParser._FIELD_KEY_VALUE_SEPARATOR);
                if (kvParts.length === 2) {
                    var key = kvParts[0].toLowerCase();
                    var value = kvParts[1];
                    fields[key] = value;
                }
                return fields;
            }, {});
            if (CoreUtils.objKeys(result).length > 0) {
                // this is a valid connection string, so parse the results
                if (result.endpointsuffix) {
                    // use endpoint suffix where overrides are not provided
                    var locationPrefix = result.location ? result.location + "." : "";
                    result.ingestionendpoint = result.ingestionendpoint || ("https://" + locationPrefix + "dc." + result.endpointsuffix);
                }
                // apply the default endpoints
                result.ingestionendpoint = result.ingestionendpoint || DEFAULT_BREEZE_ENDPOINT;
            }
            return result;
        };
        ConnectionStringParser._FIELDS_SEPARATOR = ";";
        ConnectionStringParser._FIELD_KEY_VALUE_SEPARATOR = "=";
        return ConnectionStringParser;
    }());

    // THIS FILE WAS AUTOGENERATED
    /**
     * Data struct to contain only C section with custom fields.
     */
    var Base = /** @class */ (function () {
        function Base() {
        }
        return Base;
    }());

    /**
     * Data struct to contain both B and C sections.
     */
    var Data = /** @class */ (function (_super) {
        __extends(Data, _super);
        function Data() {
            return _super.call(this) || this;
        }
        return Data;
    }(Base));

    /**
     * System variables for a telemetry item.
     */
    var Envelope = /** @class */ (function () {
        function Envelope() {
            this.ver = 1;
            this.sampleRate = 100.0;
            this.tags = {};
        }
        return Envelope;
    }());

    var Envelope$1 = /** @class */ (function (_super) {
        __extends(Envelope$$1, _super);
        /**
         * Constructs a new instance of telemetry data.
         */
        function Envelope$$1(logger, data, name) {
            var _this = _super.call(this) || this;
            _this.name = DataSanitizer.sanitizeString(logger, name) || Util.NotSpecified;
            _this.data = data;
            _this.time = CoreUtils.toISOString(new Date());
            _this.aiDataContract = {
                time: FieldType.Required,
                iKey: FieldType.Required,
                name: FieldType.Required,
                sampleRate: function () {
                    return (_this.sampleRate === 100) ? FieldType.Hidden : FieldType.Required;
                },
                tags: FieldType.Required,
                data: FieldType.Required
            };
            return _this;
        }
        return Envelope$$1;
    }(Envelope));

    // THIS FILE WAS AUTOGENERATED
    /**
     * The abstract common base of all domains.
     */
    var Domain = /** @class */ (function () {
        function Domain() {
        }
        return Domain;
    }());

    /**
     * Instances of Event represent structured event records that can be grouped and searched by their properties. Event data item also creates a metric of event count by name.
     */
    var EventData = /** @class */ (function (_super) {
        __extends(EventData, _super);
        function EventData() {
            var _this = _super.call(this) || this;
            _this.ver = 2;
            _this.properties = {};
            _this.measurements = {};
            return _this;
        }
        return EventData;
    }(Domain));

    var Event$1 = /** @class */ (function (_super) {
        __extends(Event, _super);
        /**
         * Constructs a new instance of the EventTelemetry object
         */
        function Event(logger, name, properties, measurements) {
            var _this = _super.call(this) || this;
            _this.aiDataContract = {
                ver: FieldType.Required,
                name: FieldType.Required,
                properties: FieldType.Default,
                measurements: FieldType.Default
            };
            _this.name = DataSanitizer.sanitizeString(logger, name) || Util.NotSpecified;
            _this.properties = DataSanitizer.sanitizeProperties(logger, properties);
            _this.measurements = DataSanitizer.sanitizeMeasurements(logger, measurements);
            return _this;
        }
        Event.envelopeType = "Microsoft.ApplicationInsights.{0}.Event";
        Event.dataType = "EventData";
        return Event;
    }(EventData));

    // THIS FILE WAS AUTOGENERATED
    /**
     * Stack frame information.
     */
    var StackFrame = /** @class */ (function () {
        function StackFrame() {
        }
        return StackFrame;
    }());

    /**
     * An instance of Exception represents a handled or unhandled exception that occurred during execution of the monitored application.
     */
    var ExceptionData = /** @class */ (function (_super) {
        __extends(ExceptionData, _super);
        function ExceptionData() {
            var _this = _super.call(this) || this;
            _this.ver = 2;
            _this.exceptions = [];
            _this.properties = {};
            _this.measurements = {};
            return _this;
        }
        return ExceptionData;
    }(Domain));

    /**
     * Exception details of the exception in a chain.
     */
    var ExceptionDetails = /** @class */ (function () {
        function ExceptionDetails() {
            this.hasFullStack = true;
            this.parsedStack = [];
        }
        return ExceptionDetails;
    }());

    var Exception = /** @class */ (function (_super) {
        __extends(Exception, _super);
        /**
         * Constructs a new instance of the ExceptionTelemetry object
         */
        function Exception(logger, exception, properties, measurements, severityLevel, id) {
            var _this = _super.call(this) || this;
            _this.aiDataContract = {
                ver: FieldType.Required,
                exceptions: FieldType.Required,
                severityLevel: FieldType.Default,
                properties: FieldType.Default,
                measurements: FieldType.Default
            };
            if (exception instanceof Error) {
                _this.exceptions = [new _ExceptionDetails(logger, exception)];
                _this.properties = DataSanitizer.sanitizeProperties(logger, properties);
                _this.measurements = DataSanitizer.sanitizeMeasurements(logger, measurements);
                if (severityLevel) {
                    _this.severityLevel = severityLevel;
                }
                if (id) {
                    _this.id = id;
                }
            }
            else {
                _this.exceptions = exception.exceptions;
                _this.properties = exception.properties;
                _this.measurements = exception.measurements;
                if (exception.severityLevel) {
                    _this.severityLevel = exception.severityLevel;
                }
                if (exception.id) {
                    _this.id = exception.id;
                }
                if (exception.problemGroup) {
                    _this.problemGroup = exception.problemGroup;
                }
                // bool/int types, use isNullOrUndefined
                _this.ver = 2; // TODO: handle the CS"4.0" ==> breeze 2 conversion in a better way
                if (!CoreUtils.isNullOrUndefined(exception.isManual)) {
                    _this.isManual = exception.isManual;
                }
            }
            return _this;
        }
        Exception.CreateFromInterface = function (logger, exception) {
            var exceptions = exception.exceptions
                && CoreUtils.arrMap(exception.exceptions, function (ex) { return _ExceptionDetails.CreateFromInterface(logger, ex); });
            var exceptionData = new Exception(logger, __assign({}, exception, { exceptions: exceptions }));
            return exceptionData;
        };
        Exception.prototype.toInterface = function () {
            var _a = this, exceptions = _a.exceptions, properties = _a.properties, measurements = _a.measurements, severityLevel = _a.severityLevel, ver = _a.ver, problemGroup = _a.problemGroup, id = _a.id, isManual = _a.isManual;
            var exceptionDetailsInterface = exceptions instanceof Array
                && CoreUtils.arrMap(exceptions, function (exception) { return exception.toInterface(); })
                || undefined;
            return {
                ver: "4.0",
                exceptions: exceptionDetailsInterface,
                severityLevel: severityLevel,
                properties: properties,
                measurements: measurements,
                problemGroup: problemGroup,
                id: id,
                isManual: isManual
            };
        };
        /**
         * Creates a simple exception with 1 stack frame. Useful for manual constracting of exception.
         */
        Exception.CreateSimpleException = function (message, typeName, assembly, fileName, details, line) {
            return {
                exceptions: [
                    {
                        hasFullStack: true,
                        message: message,
                        stack: details,
                        typeName: typeName
                    }
                ]
            };
        };
        Exception.envelopeType = "Microsoft.ApplicationInsights.{0}.Exception";
        Exception.dataType = "ExceptionData";
        return Exception;
    }(ExceptionData));
    var _ExceptionDetails = /** @class */ (function (_super) {
        __extends(_ExceptionDetails, _super);
        function _ExceptionDetails(logger, exception) {
            var _this = _super.call(this) || this;
            _this.aiDataContract = {
                id: FieldType.Default,
                outerId: FieldType.Default,
                typeName: FieldType.Required,
                message: FieldType.Required,
                hasFullStack: FieldType.Default,
                stack: FieldType.Default,
                parsedStack: FieldType.Array
            };
            if (exception instanceof Error) {
                _this.typeName = DataSanitizer.sanitizeString(logger, exception.name) || Util.NotSpecified;
                _this.message = DataSanitizer.sanitizeMessage(logger, exception.message) || Util.NotSpecified;
                var stack = exception.stack;
                _this.parsedStack = _ExceptionDetails.parseStack(stack);
                _this.stack = DataSanitizer.sanitizeException(logger, stack);
                _this.hasFullStack = Util.isArray(_this.parsedStack) && _this.parsedStack.length > 0;
            }
            else {
                _this.typeName = exception.typeName;
                _this.message = exception.message;
                _this.stack = exception.stack;
                _this.parsedStack = exception.parsedStack;
                _this.hasFullStack = exception.hasFullStack;
            }
            return _this;
        }
        _ExceptionDetails.prototype.toInterface = function () {
            var parsedStack = this.parsedStack instanceof Array
                && CoreUtils.arrMap(this.parsedStack, function (frame) { return frame.toInterface(); });
            var exceptionDetailsInterface = {
                id: this.id,
                outerId: this.outerId,
                typeName: this.typeName,
                message: this.message,
                hasFullStack: this.hasFullStack,
                stack: this.stack,
                parsedStack: parsedStack || undefined
            };
            return exceptionDetailsInterface;
        };
        _ExceptionDetails.CreateFromInterface = function (logger, exception) {
            var parsedStack = (exception.parsedStack instanceof Array
                && CoreUtils.arrMap(exception.parsedStack, function (frame) { return _StackFrame.CreateFromInterface(frame); }))
                || exception.parsedStack;
            var exceptionDetails = new _ExceptionDetails(logger, __assign({}, exception, { parsedStack: parsedStack }));
            return exceptionDetails;
        };
        _ExceptionDetails.parseStack = function (stack) {
            var parsedStack;
            if (typeof stack === "string") {
                var frames_1 = stack.split('\n');
                parsedStack = [];
                var level = 0;
                var totalSizeInBytes = 0;
                for (var i = 0; i <= frames_1.length; i++) {
                    var frame = frames_1[i];
                    if (_StackFrame.regex.test(frame)) {
                        var parsedFrame = new _StackFrame(frames_1[i], level++);
                        totalSizeInBytes += parsedFrame.sizeInBytes;
                        parsedStack.push(parsedFrame);
                    }
                }
                // DP Constraint - exception parsed stack must be < 32KB
                // remove frames from the middle to meet the threshold
                var exceptionParsedStackThreshold = 32 * 1024;
                if (totalSizeInBytes > exceptionParsedStackThreshold) {
                    var left = 0;
                    var right = parsedStack.length - 1;
                    var size = 0;
                    var acceptedLeft = left;
                    var acceptedRight = right;
                    while (left < right) {
                        // check size
                        var lSize = parsedStack[left].sizeInBytes;
                        var rSize = parsedStack[right].sizeInBytes;
                        size += lSize + rSize;
                        if (size > exceptionParsedStackThreshold) {
                            // remove extra frames from the middle
                            var howMany = acceptedRight - acceptedLeft + 1;
                            parsedStack.splice(acceptedLeft, howMany);
                            break;
                        }
                        // update pointers
                        acceptedLeft = left;
                        acceptedRight = right;
                        left++;
                        right--;
                    }
                }
            }
            return parsedStack;
        };
        return _ExceptionDetails;
    }(ExceptionDetails));
    var _StackFrame = /** @class */ (function (_super) {
        __extends(_StackFrame, _super);
        function _StackFrame(sourceFrame, level) {
            var _this = _super.call(this) || this;
            _this.sizeInBytes = 0;
            _this.aiDataContract = {
                level: FieldType.Required,
                method: FieldType.Required,
                assembly: FieldType.Default,
                fileName: FieldType.Default,
                line: FieldType.Default
            };
            if (typeof sourceFrame === "string") {
                var frame = sourceFrame;
                _this.level = level;
                _this.method = "<no_method>";
                _this.assembly = Util.trim(frame);
                _this.fileName = "";
                _this.line = 0;
                var matches = frame.match(_StackFrame.regex);
                if (matches && matches.length >= 5) {
                    _this.method = Util.trim(matches[2]) || _this.method;
                    _this.fileName = Util.trim(matches[4]);
                    _this.line = parseInt(matches[5]) || 0;
                }
            }
            else {
                _this.level = sourceFrame.level;
                _this.method = sourceFrame.method;
                _this.assembly = sourceFrame.assembly;
                _this.fileName = sourceFrame.fileName;
                _this.line = sourceFrame.line;
                _this.sizeInBytes = 0;
            }
            _this.sizeInBytes += _this.method.length;
            _this.sizeInBytes += _this.fileName.length;
            _this.sizeInBytes += _this.assembly.length;
            // todo: these might need to be removed depending on how the back-end settles on their size calculation
            _this.sizeInBytes += _StackFrame.baseSize;
            _this.sizeInBytes += _this.level.toString().length;
            _this.sizeInBytes += _this.line.toString().length;
            return _this;
        }
        _StackFrame.CreateFromInterface = function (frame) {
            return new _StackFrame(frame, null /* level is available in frame interface */);
        };
        _StackFrame.prototype.toInterface = function () {
            return {
                level: this.level,
                method: this.method,
                assembly: this.assembly,
                fileName: this.fileName,
                line: this.line
            };
        };
        // regex to match stack frames from ie/chrome/ff
        // methodName=$2, fileName=$4, lineNo=$5, column=$6
        _StackFrame.regex = /^([\s]+at)?(.*?)(\@|\s\(|\s)([^\(\@\n]+):([0-9]+):([0-9]+)(\)?)$/;
        _StackFrame.baseSize = 58; // '{"method":"","level":,"assembly":"","fileName":"","line":}'.length
        return _StackFrame;
    }(StackFrame));

    /**
     * An instance of the Metric item is a list of measurements (single data points) and/or aggregations.
     */
    var MetricData = /** @class */ (function (_super) {
        __extends(MetricData, _super);
        function MetricData() {
            var _this = _super.call(this) || this;
            _this.ver = 2;
            _this.metrics = [];
            _this.properties = {};
            _this.measurements = {};
            return _this;
        }
        return MetricData;
    }(Domain));

    // THIS FILE WAS AUTOGENERATED
    /**
     * Type of the metric data measurement.
     */
    var DataPointType;
    (function (DataPointType) {
        DataPointType[DataPointType["Measurement"] = 0] = "Measurement";
        DataPointType[DataPointType["Aggregation"] = 1] = "Aggregation";
    })(DataPointType || (DataPointType = {}));

    /**
     * Metric data single measurement.
     */
    var DataPoint = /** @class */ (function () {
        function DataPoint() {
            this.kind = DataPointType.Measurement;
        }
        return DataPoint;
    }());

    var DataPoint$1 = /** @class */ (function (_super) {
        __extends(DataPoint$$1, _super);
        function DataPoint$$1() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            /**
             * The data contract for serializing this object.
             */
            _this.aiDataContract = {
                name: FieldType.Required,
                kind: FieldType.Default,
                value: FieldType.Required,
                count: FieldType.Default,
                min: FieldType.Default,
                max: FieldType.Default,
                stdDev: FieldType.Default
            };
            return _this;
        }
        return DataPoint$$1;
    }(DataPoint));

    var Metric = /** @class */ (function (_super) {
        __extends(Metric, _super);
        /**
         * Constructs a new instance of the MetricTelemetry object
         */
        function Metric(logger, name, value, count, min, max, properties, measurements) {
            var _this = _super.call(this) || this;
            _this.aiDataContract = {
                ver: FieldType.Required,
                metrics: FieldType.Required,
                properties: FieldType.Default
            };
            var dataPoint = new DataPoint$1();
            dataPoint.count = count > 0 ? count : undefined;
            dataPoint.max = isNaN(max) || max === null ? undefined : max;
            dataPoint.min = isNaN(min) || min === null ? undefined : min;
            dataPoint.name = DataSanitizer.sanitizeString(logger, name) || Util.NotSpecified;
            dataPoint.value = value;
            _this.metrics = [dataPoint];
            _this.properties = DataSanitizer.sanitizeProperties(logger, properties);
            _this.measurements = DataSanitizer.sanitizeMeasurements(logger, measurements);
            return _this;
        }
        Metric.envelopeType = "Microsoft.ApplicationInsights.{0}.Metric";
        Metric.dataType = "MetricData";
        return Metric;
    }(MetricData));

    /**
     * An instance of PageView represents a generic action on a page like a button click. It is also the base type for PageView.
     */
    var PageViewData = /** @class */ (function (_super) {
        __extends(PageViewData, _super);
        function PageViewData() {
            var _this = _super.call(this) || this;
            _this.ver = 2;
            _this.properties = {};
            _this.measurements = {};
            return _this;
        }
        return PageViewData;
    }(EventData));

    var PageView = /** @class */ (function (_super) {
        __extends(PageView, _super);
        /**
         * Constructs a new instance of the PageEventTelemetry object
         */
        function PageView(logger, name, url, durationMs, properties, measurements, id) {
            var _this = _super.call(this) || this;
            _this.aiDataContract = {
                ver: FieldType.Required,
                name: FieldType.Default,
                url: FieldType.Default,
                duration: FieldType.Default,
                properties: FieldType.Default,
                measurements: FieldType.Default,
                id: FieldType.Default
            };
            _this.id = DataSanitizer.sanitizeId(logger, id);
            _this.url = DataSanitizer.sanitizeUrl(logger, url);
            _this.name = DataSanitizer.sanitizeString(logger, name) || Util.NotSpecified;
            if (!isNaN(durationMs)) {
                _this.duration = Util.msToTimeSpan(durationMs);
            }
            _this.properties = DataSanitizer.sanitizeProperties(logger, properties);
            _this.measurements = DataSanitizer.sanitizeMeasurements(logger, measurements);
            return _this;
        }
        PageView.envelopeType = "Microsoft.ApplicationInsights.{0}.Pageview";
        PageView.dataType = "PageviewData";
        return PageView;
    }(PageViewData));

    /**
     * An instance of Remote Dependency represents an interaction of the monitored component with a remote component/service like SQL or an HTTP endpoint.
     */
    var RemoteDependencyData = /** @class */ (function (_super) {
        __extends(RemoteDependencyData, _super);
        function RemoteDependencyData() {
            var _this = _super.call(this) || this;
            _this.ver = 2;
            _this.success = true;
            _this.properties = {};
            _this.measurements = {};
            return _this;
        }
        return RemoteDependencyData;
    }(Domain));

    var RemoteDependencyData$1 = /** @class */ (function (_super) {
        __extends(RemoteDependencyData$$1, _super);
        /**
         * Constructs a new instance of the RemoteDependencyData object
         */
        function RemoteDependencyData$$1(logger, id, absoluteUrl, commandName, value, success, resultCode, method, requestAPI, correlationContext, properties, measurements) {
            if (requestAPI === void 0) { requestAPI = "Ajax"; }
            var _this = _super.call(this) || this;
            _this.aiDataContract = {
                id: FieldType.Required,
                ver: FieldType.Required,
                name: FieldType.Default,
                resultCode: FieldType.Default,
                duration: FieldType.Default,
                success: FieldType.Default,
                data: FieldType.Default,
                target: FieldType.Default,
                type: FieldType.Default,
                properties: FieldType.Default,
                measurements: FieldType.Default,
                kind: FieldType.Default,
                value: FieldType.Default,
                count: FieldType.Default,
                min: FieldType.Default,
                max: FieldType.Default,
                stdDev: FieldType.Default,
                dependencyKind: FieldType.Default,
                dependencySource: FieldType.Default,
                commandName: FieldType.Default,
                dependencyTypeName: FieldType.Default
            };
            _this.id = id;
            _this.duration = Util.msToTimeSpan(value);
            _this.success = success;
            _this.resultCode = resultCode + "";
            _this.type = DataSanitizer.sanitizeString(logger, requestAPI);
            var dependencyFields = AjaxHelper.ParseDependencyPath(logger, absoluteUrl, method, commandName);
            _this.data = DataSanitizer.sanitizeUrl(logger, commandName) || dependencyFields.data; // get a value from hosturl if commandName not available
            _this.target = DataSanitizer.sanitizeString(logger, dependencyFields.target);
            if (correlationContext) {
                _this.target = _this.target + " | " + correlationContext;
            }
            _this.name = DataSanitizer.sanitizeString(logger, dependencyFields.name);
            _this.properties = DataSanitizer.sanitizeProperties(logger, properties);
            _this.measurements = DataSanitizer.sanitizeMeasurements(logger, measurements);
            return _this;
        }
        RemoteDependencyData$$1.envelopeType = "Microsoft.ApplicationInsights.{0}.RemoteDependency";
        RemoteDependencyData$$1.dataType = "RemoteDependencyData";
        return RemoteDependencyData$$1;
    }(RemoteDependencyData));

    /**
     * Instances of Message represent printf-like trace statements that are text-searched. Log4Net, NLog and other text-based log file entries are translated into intances of this type. The message does not have measurements.
     */
    var MessageData = /** @class */ (function (_super) {
        __extends(MessageData, _super);
        function MessageData() {
            var _this = _super.call(this) || this;
            _this.ver = 2;
            _this.properties = {};
            _this.measurements = {};
            return _this;
        }
        return MessageData;
    }(Domain));

    var Trace = /** @class */ (function (_super) {
        __extends(Trace, _super);
        /**
         * Constructs a new instance of the TraceTelemetry object
         */
        function Trace(logger, message, severityLevel, properties, measurements) {
            var _this = _super.call(this) || this;
            _this.aiDataContract = {
                ver: FieldType.Required,
                message: FieldType.Required,
                severityLevel: FieldType.Default,
                properties: FieldType.Default
            };
            message = message || Util.NotSpecified;
            _this.message = DataSanitizer.sanitizeMessage(logger, message);
            _this.properties = DataSanitizer.sanitizeProperties(logger, properties);
            _this.measurements = DataSanitizer.sanitizeMeasurements(logger, measurements);
            if (severityLevel) {
                _this.severityLevel = severityLevel;
            }
            return _this;
        }
        Trace.envelopeType = "Microsoft.ApplicationInsights.{0}.Message";
        Trace.dataType = "MessageData";
        return Trace;
    }(MessageData));

    /**
     * An instance of PageViewPerf represents: a page view with no performance data, a page view with performance data, or just the performance data of an earlier page request.
     */
    var PageViewPerfData = /** @class */ (function (_super) {
        __extends(PageViewPerfData, _super);
        function PageViewPerfData() {
            var _this = _super.call(this) || this;
            _this.ver = 2;
            _this.properties = {};
            _this.measurements = {};
            return _this;
        }
        return PageViewPerfData;
    }(PageViewData));

    var PageViewPerformance = /** @class */ (function (_super) {
        __extends(PageViewPerformance, _super);
        /**
         * Constructs a new instance of the PageEventTelemetry object
         */
        function PageViewPerformance(logger, name, url, unused, properties, measurements, cs4BaseData) {
            var _this = _super.call(this) || this;
            _this.aiDataContract = {
                ver: FieldType.Required,
                name: FieldType.Default,
                url: FieldType.Default,
                duration: FieldType.Default,
                perfTotal: FieldType.Default,
                networkConnect: FieldType.Default,
                sentRequest: FieldType.Default,
                receivedResponse: FieldType.Default,
                domProcessing: FieldType.Default,
                properties: FieldType.Default,
                measurements: FieldType.Default
            };
            _this.url = DataSanitizer.sanitizeUrl(logger, url);
            _this.name = DataSanitizer.sanitizeString(logger, name) || Util.NotSpecified;
            _this.properties = DataSanitizer.sanitizeProperties(logger, properties);
            _this.measurements = DataSanitizer.sanitizeMeasurements(logger, measurements);
            if (cs4BaseData) {
                _this.domProcessing = cs4BaseData.domProcessing;
                _this.duration = cs4BaseData.duration;
                _this.networkConnect = cs4BaseData.networkConnect;
                _this.perfTotal = cs4BaseData.perfTotal;
                _this.receivedResponse = cs4BaseData.receivedResponse;
                _this.sentRequest = cs4BaseData.sentRequest;
            }
            return _this;
        }
        PageViewPerformance.envelopeType = "Microsoft.ApplicationInsights.{0}.PageviewPerformance";
        PageViewPerformance.dataType = "PageviewPerformanceData";
        return PageViewPerformance;
    }(PageViewPerfData));

    var Data$1 = /** @class */ (function (_super) {
        __extends(Data$$1, _super);
        /**
         * Constructs a new instance of telemetry data.
         */
        function Data$$1(baseType, data) {
            var _this = _super.call(this) || this;
            /**
             * The data contract for serializing this object.
             */
            _this.aiDataContract = {
                baseType: FieldType.Required,
                baseData: FieldType.Required
            };
            _this.baseType = baseType;
            _this.baseData = data;
            return _this;
        }
        return Data$$1;
    }(Data));

    // THIS FILE WAS AUTOGENERATED
    /**
     * Defines the level of severity for the event.
     */
    var SeverityLevel;
    (function (SeverityLevel) {
        SeverityLevel[SeverityLevel["Verbose"] = 0] = "Verbose";
        SeverityLevel[SeverityLevel["Information"] = 1] = "Information";
        SeverityLevel[SeverityLevel["Warning"] = 2] = "Warning";
        SeverityLevel[SeverityLevel["Error"] = 3] = "Error";
        SeverityLevel[SeverityLevel["Critical"] = 4] = "Critical";
    })(SeverityLevel || (SeverityLevel = {}));

    var ConfigurationManager = /** @class */ (function () {
        function ConfigurationManager() {
        }
        ConfigurationManager.getConfig = function (config, field, identifier, defaultValue) {
            if (defaultValue === void 0) { defaultValue = false; }
            var configValue;
            if (identifier && config.extensionConfig && config.extensionConfig[identifier] && !CoreUtils.isNullOrUndefined(config.extensionConfig[identifier][field])) {
                configValue = config.extensionConfig[identifier][field];
            }
            else {
                configValue = config[field];
            }
            return !CoreUtils.isNullOrUndefined(configValue) ? configValue : defaultValue;
        };
        return ConfigurationManager;
    }());

    // THIS FILE WAS AUTOGENERATED
    var ContextTagKeys = /** @class */ (function () {
        function ContextTagKeys() {
            this.applicationVersion = "ai.application.ver";
            this.applicationBuild = "ai.application.build";
            this.applicationTypeId = "ai.application.typeId";
            this.applicationId = "ai.application.applicationId";
            this.applicationLayer = "ai.application.layer";
            this.deviceId = "ai.device.id";
            this.deviceIp = "ai.device.ip";
            this.deviceLanguage = "ai.device.language";
            this.deviceLocale = "ai.device.locale";
            this.deviceModel = "ai.device.model";
            this.deviceFriendlyName = "ai.device.friendlyName";
            this.deviceNetwork = "ai.device.network";
            this.deviceNetworkName = "ai.device.networkName";
            this.deviceOEMName = "ai.device.oemName";
            this.deviceOS = "ai.device.os";
            this.deviceOSVersion = "ai.device.osVersion";
            this.deviceRoleInstance = "ai.device.roleInstance";
            this.deviceRoleName = "ai.device.roleName";
            this.deviceScreenResolution = "ai.device.screenResolution";
            this.deviceType = "ai.device.type";
            this.deviceMachineName = "ai.device.machineName";
            this.deviceVMName = "ai.device.vmName";
            this.deviceBrowser = "ai.device.browser";
            this.deviceBrowserVersion = "ai.device.browserVersion";
            this.locationIp = "ai.location.ip";
            this.locationCountry = "ai.location.country";
            this.locationProvince = "ai.location.province";
            this.locationCity = "ai.location.city";
            this.operationId = "ai.operation.id";
            this.operationName = "ai.operation.name";
            this.operationParentId = "ai.operation.parentId";
            this.operationRootId = "ai.operation.rootId";
            this.operationSyntheticSource = "ai.operation.syntheticSource";
            this.operationCorrelationVector = "ai.operation.correlationVector";
            this.sessionId = "ai.session.id";
            this.sessionIsFirst = "ai.session.isFirst";
            this.sessionIsNew = "ai.session.isNew";
            this.userAccountAcquisitionDate = "ai.user.accountAcquisitionDate";
            this.userAccountId = "ai.user.accountId";
            this.userAgent = "ai.user.userAgent";
            this.userId = "ai.user.id";
            this.userStoreRegion = "ai.user.storeRegion";
            this.userAuthUserId = "ai.user.authUserId";
            this.userAnonymousUserAcquisitionDate = "ai.user.anonUserAcquisitionDate";
            this.userAuthenticatedUserAcquisitionDate = "ai.user.authUserAcquisitionDate";
            this.cloudName = "ai.cloud.name";
            this.cloudRole = "ai.cloud.role";
            this.cloudRoleVer = "ai.cloud.roleVer";
            this.cloudRoleInstance = "ai.cloud.roleInstance";
            this.cloudEnvironment = "ai.cloud.environment";
            this.cloudLocation = "ai.cloud.location";
            this.cloudDeploymentUnit = "ai.cloud.deploymentUnit";
            this.internalNodeName = "ai.internal.nodeName";
            this.internalSdkVersion = "ai.internal.sdkVersion";
            this.internalAgentVersion = "ai.internal.agentVersion";
        }
        return ContextTagKeys;
    }());

    var TelemetryItemCreator = /** @class */ (function () {
        function TelemetryItemCreator() {
        }
        /**
         * Create a telemetry item that the 1DS channel understands
         * @param item domain specific properties; part B
         * @param baseType telemetry item type. ie PageViewData
         * @param envelopeName name of the envelope. ie Microsoft.ApplicationInsights.<instrumentation key>.PageView
         * @param customProperties user defined custom properties; part C
         * @param systemProperties system properties that are added to the context; part A
         * @returns ITelemetryItem that is sent to channel
         */
        TelemetryItemCreator.create = function (item, baseType, envelopeName, logger, customProperties, systemProperties) {
            envelopeName = DataSanitizer.sanitizeString(logger, envelopeName) || Util.NotSpecified;
            if (CoreUtils.isNullOrUndefined(item) ||
                CoreUtils.isNullOrUndefined(baseType) ||
                CoreUtils.isNullOrUndefined(envelopeName)) {
                throw Error("Input doesn't contain all required fields");
            }
            var telemetryItem = {
                name: envelopeName,
                time: CoreUtils.toISOString(new Date()),
                iKey: "",
                ext: systemProperties ? systemProperties : {},
                tags: [],
                data: {},
                baseType: baseType,
                baseData: item // Part B
            };
            // Part C
            if (!CoreUtils.isNullOrUndefined(customProperties)) {
                for (var prop in customProperties) {
                    if (customProperties.hasOwnProperty(prop)) {
                        telemetryItem.data[prop] = customProperties[prop];
                    }
                }
            }
            return telemetryItem;
        };
        return TelemetryItemCreator;
    }());

    var Extensions = /** @class */ (function () {
        function Extensions() {
        }
        Extensions.UserExt = "user";
        Extensions.DeviceExt = "device";
        Extensions.TraceExt = "trace";
        Extensions.WebExt = "web";
        Extensions.AppExt = "app";
        Extensions.OSExt = "os";
        Extensions.SessionExt = "ses";
        Extensions.SDKExt = "sdk";
        return Extensions;
    }());
    var CtxTagKeys = new ContextTagKeys();

    var PropertiesPluginIdentifier = "AppInsightsPropertiesPlugin";
    var BreezeChannelIdentifier = "AppInsightsChannelPlugin";

    // ToDo: fix properties and measurements once updates are done to common
    var AppInsightsDeprecated = /** @class */ (function () {
        function AppInsightsDeprecated(snippet, appInsightsNew) {
            this._hasLegacyInitializers = false;
            this._queue = [];
            this.config = AppInsightsDeprecated.getDefaultConfig(snippet.config);
            this.appInsightsNew = appInsightsNew;
            this.context = { addTelemetryInitializer: this.addTelemetryInitializers.bind(this) };
        }
        AppInsightsDeprecated.getDefaultConfig = function (config) {
            if (!config) {
                config = {};
            }
            // set default values
            config.endpointUrl = config.endpointUrl || "https://dc.services.visualstudio.com/v2/track";
            config.sessionRenewalMs = 30 * 60 * 1000;
            config.sessionExpirationMs = 24 * 60 * 60 * 1000;
            config.maxBatchSizeInBytes = config.maxBatchSizeInBytes > 0 ? config.maxBatchSizeInBytes : 102400; // 100kb
            config.maxBatchInterval = !isNaN(config.maxBatchInterval) ? config.maxBatchInterval : 15000;
            config.enableDebug = Util.stringToBoolOrDefault(config.enableDebug);
            config.disableExceptionTracking = Util.stringToBoolOrDefault(config.disableExceptionTracking);
            config.disableTelemetry = Util.stringToBoolOrDefault(config.disableTelemetry);
            config.verboseLogging = Util.stringToBoolOrDefault(config.verboseLogging);
            config.emitLineDelimitedJson = Util.stringToBoolOrDefault(config.emitLineDelimitedJson);
            config.diagnosticLogInterval = config.diagnosticLogInterval || 10000;
            config.autoTrackPageVisitTime = Util.stringToBoolOrDefault(config.autoTrackPageVisitTime);
            if (isNaN(config.samplingPercentage) || config.samplingPercentage <= 0 || config.samplingPercentage >= 100) {
                config.samplingPercentage = 100;
            }
            config.disableAjaxTracking = Util.stringToBoolOrDefault(config.disableAjaxTracking);
            config.maxAjaxCallsPerView = !isNaN(config.maxAjaxCallsPerView) ? config.maxAjaxCallsPerView : 500;
            config.isBeaconApiDisabled = Util.stringToBoolOrDefault(config.isBeaconApiDisabled, true);
            config.disableCorrelationHeaders = Util.stringToBoolOrDefault(config.disableCorrelationHeaders);
            config.correlationHeaderExcludedDomains = config.correlationHeaderExcludedDomains || [
                "*.blob.core.windows.net",
                "*.blob.core.chinacloudapi.cn",
                "*.blob.core.cloudapi.de",
                "*.blob.core.usgovcloudapi.net"
            ];
            config.disableFlushOnBeforeUnload = Util.stringToBoolOrDefault(config.disableFlushOnBeforeUnload);
            config.enableSessionStorageBuffer = Util.stringToBoolOrDefault(config.enableSessionStorageBuffer, true);
            config.isRetryDisabled = Util.stringToBoolOrDefault(config.isRetryDisabled);
            config.isCookieUseDisabled = Util.stringToBoolOrDefault(config.isCookieUseDisabled);
            config.isStorageUseDisabled = Util.stringToBoolOrDefault(config.isStorageUseDisabled);
            config.isBrowserLinkTrackingEnabled = Util.stringToBoolOrDefault(config.isBrowserLinkTrackingEnabled);
            config.enableCorsCorrelation = Util.stringToBoolOrDefault(config.enableCorsCorrelation);
            return config;
        };
        /**
         * The array of telemetry initializers to call before sending each telemetry item.
         */
        AppInsightsDeprecated.prototype.addTelemetryInitializers = function (callBack) {
            var _this = this;
            // Add initializer to current processing only if there is any old telemetry initializer
            if (!this._hasLegacyInitializers) {
                this.appInsightsNew.addTelemetryInitializer(function (item) {
                    _this._processLegacyInitializers(item); // setup call back for each legacy processor
                });
                this._hasLegacyInitializers = true;
            }
            this._queue.push(callBack);
        };
        AppInsightsDeprecated.prototype.startTrackPage = function (name) {
            this.appInsightsNew.startTrackPage(name);
        };
        AppInsightsDeprecated.prototype.stopTrackPage = function (name, url, properties, measurements) {
            this.appInsightsNew.stopTrackPage(name, url, properties); // update
        };
        AppInsightsDeprecated.prototype.trackPageView = function (name, url, properties, measurements, duration) {
            var telemetry = {
                name: name,
                uri: url,
                properties: properties,
                measurements: measurements
            };
            // fix for props, measurements, duration
            this.appInsightsNew.trackPageView(telemetry);
        };
        AppInsightsDeprecated.prototype.trackEvent = function (name, properties, measurements) {
            this.appInsightsNew.trackEvent({ name: name });
        };
        AppInsightsDeprecated.prototype.trackDependency = function (id, method, absoluteUrl, pathName, totalTime, success, resultCode) {
            this.appInsightsNew.trackDependencyData({
                id: id,
                target: absoluteUrl,
                type: pathName,
                duration: totalTime,
                properties: { HttpMethod: method },
                success: success,
                responseCode: resultCode
            });
        };
        AppInsightsDeprecated.prototype.trackException = function (exception, handledAt, properties, measurements, severityLevel) {
            this.appInsightsNew.trackException({
                exception: exception
            });
        };
        AppInsightsDeprecated.prototype.trackMetric = function (name, average, sampleCount, min, max, properties) {
            this.appInsightsNew.trackMetric({ name: name, average: average, sampleCount: sampleCount, min: min, max: max });
        };
        AppInsightsDeprecated.prototype.trackTrace = function (message, properties, severityLevel) {
            this.appInsightsNew.trackTrace({ message: message, severityLevel: severityLevel });
        };
        AppInsightsDeprecated.prototype.flush = function (async) {
            this.appInsightsNew.flush(async);
        };
        AppInsightsDeprecated.prototype.setAuthenticatedUserContext = function (authenticatedUserId, accountId, storeInCookie) {
            this.appInsightsNew.context.user.setAuthenticatedUserContext(authenticatedUserId, accountId, storeInCookie);
        };
        AppInsightsDeprecated.prototype.clearAuthenticatedUserContext = function () {
            this.appInsightsNew.context.user.clearAuthenticatedUserContext();
        };
        AppInsightsDeprecated.prototype._onerror = function (message, url, lineNumber, columnNumber, error) {
            this.appInsightsNew._onerror({ message: message, url: url, lineNumber: lineNumber, columnNumber: columnNumber, error: error });
        };
        AppInsightsDeprecated.prototype.startTrackEvent = function (name) {
            this.appInsightsNew.startTrackEvent(name);
        };
        AppInsightsDeprecated.prototype.stopTrackEvent = function (name, properties, measurements) {
            this.appInsightsNew.stopTrackEvent(name, properties, measurements);
        };
        AppInsightsDeprecated.prototype.downloadAndSetup = function (config) {
            throw new Error("downloadAndSetup not implemented in web SKU");
        };
        AppInsightsDeprecated.prototype.updateSnippetDefinitions = function (snippet) {
            // apply full appInsights to the global instance
            // Note: This must be called before loadAppInsights is called
            for (var field in this) {
                if (typeof field === 'string') {
                    snippet[field] = this[field];
                }
            }
        };
        // note: these are split into methods to enable unit tests
        AppInsightsDeprecated.prototype.loadAppInsights = function () {
            // initialize global instance of appInsights
            // var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.config);
            var _this = this;
            // implement legacy version of trackPageView for 0.10<
            if (this.config["iKey"]) {
                var originalTrackPageView_1 = this.trackPageView;
                this.trackPageView = function (pagePath, properties, measurements) {
                    originalTrackPageView_1.apply(_this, [null, pagePath, properties, measurements]);
                };
            }
            // implement legacy pageView interface if it is present in the snippet
            var legacyPageView = "logPageView";
            if (typeof this.snippet[legacyPageView] === "function") {
                this[legacyPageView] = function (pagePath, properties, measurements) {
                    _this.trackPageView(null, pagePath, properties, measurements);
                };
            }
            // implement legacy event interface if it is present in the snippet
            var legacyEvent = "logEvent";
            if (typeof this.snippet[legacyEvent] === "function") {
                this[legacyEvent] = function (name, props, measurements) {
                    _this.trackEvent(name, props, measurements);
                };
            }
            return this;
        };
        AppInsightsDeprecated.prototype._processLegacyInitializers = function (item) {
            // instead of mapping new to legacy and then back again and repeating in channel, attach callback for channel to call
            item.tags[ProcessLegacy] = this._queue;
            return item;
        };
        return AppInsightsDeprecated;
    }());

    /**
     * Class encapsulates sending page views and page view performance telemetry.
     */
    var PageViewManager = /** @class */ (function () {
        function PageViewManager(appInsights, overridePageViewDuration, core, pageViewPerformanceManager) {
            this.pageViewPerformanceSent = false;
            this.overridePageViewDuration = false;
            this.overridePageViewDuration = overridePageViewDuration;
            this.appInsights = appInsights;
            this._pageViewPerformanceManager = pageViewPerformanceManager;
            if (core) {
                this._channel = function () { return (core.getTransmissionControls()); };
                this._logger = core.logger;
            }
        }
        /**
         * Currently supported cases:
         * 1) (default case) track page view called with default parameters, overridePageViewDuration = false. Page view is sent with page view performance when navigation timing data is available.
         *    a. If navigation timing is not supported then page view is sent right away with undefined duration. Page view performance is not sent.
         * 2) overridePageViewDuration = true, custom duration provided. Custom duration is used, page view sends right away.
         * 3) overridePageViewDuration = true, custom duration NOT provided. Page view is sent right away, duration is time spent from page load till now (or undefined if navigation timing is not supported).
         * 4) overridePageViewDuration = false, custom duration is provided. Page view is sent right away with custom duration.
         *
         * In all cases page view performance is sent once (only for the 1st call of trackPageView), or not sent if navigation timing is not supported.
         */
        PageViewManager.prototype.trackPageView = function (pageView, customProperties) {
            var _this = this;
            var name = pageView.name;
            if (CoreUtils.isNullOrUndefined(name) || typeof name !== "string") {
                name = pageView.name = typeof window === "object" && window.document && window.document.title || "";
            }
            var uri = pageView.uri;
            if (CoreUtils.isNullOrUndefined(uri) || typeof uri !== "string") {
                uri = pageView.uri = typeof window === "object" && window.location && window.location.href || "";
            }
            // case 1a. if performance timing is not supported by the browser, send the page view telemetry with the duration provided by the user. If the user
            // do not provide the duration, set duration to undefined
            // Also this is case 4
            if (!this._pageViewPerformanceManager.isPerformanceTimingSupported()) {
                this.appInsights.sendPageViewInternal(pageView, customProperties);
                CoreUtils.arrForEach(this._channel(), function (queues) { CoreUtils.arrForEach(queues, function (q) { return q.flush(true); }); });
                // no navigation timing (IE 8, iOS Safari 8.4, Opera Mini 8 - see http://caniuse.com/#feat=nav-timing)
                this._logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.NavigationTimingNotSupported, "trackPageView: navigation timing API used for calculation of page duration is not supported in this browser. This page view will be collected without duration and timing info.");
                return;
            }
            var pageViewSent = false;
            var customDuration;
            // if the performance timing is supported by the browser, calculate the custom duration
            var start = this._pageViewPerformanceManager.getPerformanceTiming().navigationStart;
            customDuration = DateTimeUtils.GetDuration(start, +new Date);
            if (!this._pageViewPerformanceManager.shouldCollectDuration(customDuration)) {
                customDuration = undefined;
            }
            // if the user has provided duration, send a page view telemetry with the provided duration. Otherwise, if
            // overridePageViewDuration is set to true, send a page view telemetry with the custom duration calculated earlier
            var duration;
            if (!CoreUtils.isNullOrUndefined(customProperties) &&
                !CoreUtils.isNullOrUndefined(customProperties.duration)) {
                duration = customProperties.duration;
            }
            if (this.overridePageViewDuration || !isNaN(duration)) {
                if (isNaN(duration)) {
                    // case 3
                    if (!customProperties) {
                        customProperties = {};
                    }
                    customProperties["duration"] = customDuration;
                }
                // case 2
                this.appInsights.sendPageViewInternal(pageView, customProperties);
                CoreUtils.arrForEach(this._channel(), function (queues) { CoreUtils.arrForEach(queues, function (q) { return q.flush(true); }); });
                pageViewSent = true;
            }
            // now try to send the page view performance telemetry
            var maxDurationLimit = 60000;
            if (!customProperties) {
                customProperties = {};
            }
            var handle = setInterval((function () {
                try {
                    if (_this._pageViewPerformanceManager.isPerformanceTimingDataReady()) {
                        clearInterval(handle);
                        var pageViewPerformance = {
                            name: name,
                            uri: uri
                        };
                        _this._pageViewPerformanceManager.populatePageViewPerformanceEvent(pageViewPerformance);
                        if (!pageViewPerformance.isValid && !pageViewSent) {
                            // If navigation timing gives invalid numbers, then go back to "override page view duration" mode.
                            // That's the best value we can get that makes sense.
                            customProperties["duration"] = customDuration;
                            _this.appInsights.sendPageViewInternal(pageView, customProperties);
                            CoreUtils.arrForEach(_this._channel(), function (queues) { CoreUtils.arrForEach(queues, function (q) { return q.flush(true); }); });
                        }
                        else {
                            if (!pageViewSent) {
                                customProperties["duration"] = pageViewPerformance.durationMs;
                                _this.appInsights.sendPageViewInternal(pageView, customProperties);
                            }
                            if (!_this.pageViewPerformanceSent) {
                                _this.appInsights.sendPageViewPerformanceInternal(pageViewPerformance, customProperties);
                                _this.pageViewPerformanceSent = true;
                            }
                            CoreUtils.arrForEach(_this._channel(), function (queues) { CoreUtils.arrForEach(queues, function (q) { return q.flush(true); }); });
                        }
                    }
                    else if (DateTimeUtils.GetDuration(start, +new Date) > maxDurationLimit) {
                        // if performance timings are not ready but we exceeded the maximum duration limit, just log a page view telemetry
                        // with the maximum duration limit. Otherwise, keep waiting until performance timings are ready
                        clearInterval(handle);
                        if (!pageViewSent) {
                            customProperties["duration"] = maxDurationLimit;
                            _this.appInsights.sendPageViewInternal(pageView, customProperties);
                            CoreUtils.arrForEach(_this._channel(), function (queues) { CoreUtils.arrForEach(queues, function (q) { return q.flush(true); }); });
                        }
                    }
                }
                catch (e) {
                    _this._logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.TrackPVFailedCalc, "trackPageView failed on page load calculation: " + Util.getExceptionName(e), { exception: Util.dump(e) });
                }
            }), 100);
        };
        return PageViewManager;
    }());

    /**
     * Used to track page visit durations
     */
    var PageVisitTimeManager = /** @class */ (function () {
        /**
         * Creates a new instance of PageVisitTimeManager
         * @param pageVisitTimeTrackingHandler Delegate that will be called to send telemetry data to AI (when trackPreviousPageVisit is called)
         * @returns {}
         */
        function PageVisitTimeManager(logger, pageVisitTimeTrackingHandler) {
            this.prevPageVisitDataKeyName = "prevPageVisitData";
            this.pageVisitTimeTrackingHandler = pageVisitTimeTrackingHandler;
            this._logger = logger;
        }
        /**
         * Tracks the previous page visit time telemetry (if exists) and starts timing of new page visit time
         * @param currentPageName Name of page to begin timing for visit duration
         * @param currentPageUrl Url of page to begin timing for visit duration
         */
        PageVisitTimeManager.prototype.trackPreviousPageVisit = function (currentPageName, currentPageUrl) {
            try {
                // Restart timer for new page view
                var prevPageVisitTimeData = this.restartPageVisitTimer(currentPageName, currentPageUrl);
                // If there was a page already being timed, track the visit time for it now.
                if (prevPageVisitTimeData) {
                    this.pageVisitTimeTrackingHandler(prevPageVisitTimeData.pageName, prevPageVisitTimeData.pageUrl, prevPageVisitTimeData.pageVisitTime);
                }
            }
            catch (e) {
                this._logger.warnToConsole("Auto track page visit time failed, metric will not be collected: " + Util.dump(e));
            }
        };
        /**
         * Stops timing of current page (if exists) and starts timing for duration of visit to pageName
         * @param pageName Name of page to begin timing visit duration
         * @returns {PageVisitData} Page visit data (including duration) of pageName from last call to start or restart, if exists. Null if not.
         */
        PageVisitTimeManager.prototype.restartPageVisitTimer = function (pageName, pageUrl) {
            try {
                var prevPageVisitData = this.stopPageVisitTimer();
                this.startPageVisitTimer(pageName, pageUrl);
                return prevPageVisitData;
            }
            catch (e) {
                this._logger.warnToConsole("Call to restart failed: " + Util.dump(e));
                return null;
            }
        };
        /**
         * Starts timing visit duration of pageName
         * @param pageName
         * @returns {}
         */
        PageVisitTimeManager.prototype.startPageVisitTimer = function (pageName, pageUrl) {
            try {
                if (Util.canUseSessionStorage()) {
                    if (Util.getSessionStorage(this._logger, this.prevPageVisitDataKeyName) != null) {
                        throw new Error("Cannot call startPageVisit consecutively without first calling stopPageVisit");
                    }
                    var currPageVisitData = new PageVisitData(pageName, pageUrl);
                    var currPageVisitDataStr = JSON.stringify(currPageVisitData);
                    Util.setSessionStorage(this._logger, this.prevPageVisitDataKeyName, currPageVisitDataStr);
                }
            }
            catch (e) {
                // TODO: Remove this catch in next phase, since if start is called twice in a row the exception needs to be propagated out
                this._logger.warnToConsole("Call to start failed: " + Util.dump(e));
            }
        };
        /**
         * Stops timing of current page, if exists.
         * @returns {PageVisitData} Page visit data (including duration) of pageName from call to start, if exists. Null if not.
         */
        PageVisitTimeManager.prototype.stopPageVisitTimer = function () {
            try {
                if (Util.canUseSessionStorage()) {
                    // Define end time of page's visit
                    var pageVisitEndTime = Date.now();
                    // Try to retrieve  page name and start time from session storage
                    var pageVisitDataJsonStr = Util.getSessionStorage(this._logger, this.prevPageVisitDataKeyName);
                    if (pageVisitDataJsonStr) {
                        // if previous page data exists, set end time of visit
                        var prevPageVisitData = JSON.parse(pageVisitDataJsonStr);
                        prevPageVisitData.pageVisitTime = pageVisitEndTime - prevPageVisitData.pageVisitStartTime;
                        // Remove data from storage since we already used it
                        Util.removeSessionStorage(this._logger, this.prevPageVisitDataKeyName);
                        // Return page visit data
                        return prevPageVisitData;
                    }
                    else {
                        return null;
                    }
                }
                return null;
            }
            catch (e) {
                this._logger.warnToConsole("Stop page visit timer failed: " + Util.dump(e));
                return null;
            }
        };
        return PageVisitTimeManager;
    }());
    var PageVisitData = /** @class */ (function () {
        function PageVisitData(pageName, pageUrl) {
            this.pageVisitStartTime = Date.now();
            this.pageName = pageName;
            this.pageUrl = pageUrl;
        }
        return PageVisitData;
    }());

    /**
     * Class encapsulates sending page view performance telemetry.
     */
    var PageViewPerformanceManager = /** @class */ (function () {
        function PageViewPerformanceManager(core) {
            this.MAX_DURATION_ALLOWED = 3600000; // 1h
            if (core) {
                this._logger = core.logger;
            }
        }
        PageViewPerformanceManager.prototype.populatePageViewPerformanceEvent = function (pageViewPerformance) {
            pageViewPerformance.isValid = false;
            /*
             * http://www.w3.org/TR/navigation-timing/#processing-model
             *  |-navigationStart
             *  |             |-connectEnd
             *  |             ||-requestStart
             *  |             ||             |-responseStart
             *  |             ||             |              |-responseEnd
             *  |             ||             |              |
             *  |             ||             |              |         |-loadEventEnd
             *  |---network---||---request---|---response---|---dom---|
             *  |--------------------------total----------------------|
             */
            var navigationTiming = this.getPerformanceNavigationTiming();
            var timing = this.getPerformanceTiming();
            if (navigationTiming || timing) {
                if (navigationTiming) {
                    var total = navigationTiming.duration;
                    var network = DateTimeUtils.GetDuration(navigationTiming.startTime, navigationTiming.connectEnd);
                    var request = DateTimeUtils.GetDuration(navigationTiming.requestStart, navigationTiming.responseStart);
                    var response = DateTimeUtils.GetDuration(navigationTiming.responseStart, navigationTiming.responseEnd);
                    var dom = DateTimeUtils.GetDuration(navigationTiming.responseEnd, navigationTiming.loadEventEnd);
                }
                else {
                    var total = DateTimeUtils.GetDuration(timing.navigationStart, timing.loadEventEnd);
                    var network = DateTimeUtils.GetDuration(timing.navigationStart, timing.connectEnd);
                    var request = DateTimeUtils.GetDuration(timing.requestStart, timing.responseStart);
                    var response = DateTimeUtils.GetDuration(timing.responseStart, timing.responseEnd);
                    var dom = DateTimeUtils.GetDuration(timing.responseEnd, timing.loadEventEnd);
                }
                if (total === 0) {
                    this._logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.ErrorPVCalc, "error calculating page view performance.", { total: total, network: network, request: request, response: response, dom: dom });
                }
                else if (!this.shouldCollectDuration(total, network, request, response, dom)) {
                    this._logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.InvalidDurationValue, "Invalid page load duration value. Browser perf data won't be sent.", { total: total, network: network, request: request, response: response, dom: dom });
                }
                else if (total < Math.floor(network) + Math.floor(request) + Math.floor(response) + Math.floor(dom)) {
                    // some browsers may report individual components incorrectly so that the sum of the parts will be bigger than total PLT
                    // in this case, don't report client performance from this page
                    this._logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.ClientPerformanceMathError, "client performance math error.", { total: total, network: network, request: request, response: response, dom: dom });
                }
                else {
                    pageViewPerformance.durationMs = total;
                    // // convert to timespans
                    pageViewPerformance.perfTotal = pageViewPerformance.duration = Util.msToTimeSpan(total);
                    pageViewPerformance.networkConnect = Util.msToTimeSpan(network);
                    pageViewPerformance.sentRequest = Util.msToTimeSpan(request);
                    pageViewPerformance.receivedResponse = Util.msToTimeSpan(response);
                    pageViewPerformance.domProcessing = Util.msToTimeSpan(dom);
                    pageViewPerformance.isValid = true;
                }
            }
        };
        PageViewPerformanceManager.prototype.getPerformanceTiming = function () {
            if (this.isPerformanceTimingSupported()) {
                return window.performance.timing;
            }
            return null;
        };
        PageViewPerformanceManager.prototype.getPerformanceNavigationTiming = function () {
            if (this.isPerformanceNavigationTimingSupported()) {
                return window.performance.getEntriesByType("navigation")[0];
            }
            return null;
        };
        /**
         * Returns true is window PerformanceNavigationTiming API is supported, false otherwise.
         */
        PageViewPerformanceManager.prototype.isPerformanceNavigationTimingSupported = function () {
            return typeof window !== "undefined" && window.performance && window.performance.getEntriesByType && window.performance.getEntriesByType("navigation").length > 0;
        };
        /**
         * Returns true is window performance timing API is supported, false otherwise.
         */
        PageViewPerformanceManager.prototype.isPerformanceTimingSupported = function () {
            return typeof window !== "undefined" && window.performance && window.performance.timing;
        };
        /**
         * As page loads different parts of performance timing numbers get set. When all of them are set we can report it.
         * Returns true if ready, false otherwise.
         */
        PageViewPerformanceManager.prototype.isPerformanceTimingDataReady = function () {
            var timing = typeof window === "object" && window.performance.timing;
            return typeof window === "object"
                && timing.domainLookupStart > 0
                && timing.navigationStart > 0
                && timing.responseStart > 0
                && timing.requestStart > 0
                && timing.loadEventEnd > 0
                && timing.responseEnd > 0
                && timing.connectEnd > 0
                && timing.domLoading > 0;
        };
        /**
         * This method tells if given durations should be excluded from collection.
         */
        PageViewPerformanceManager.prototype.shouldCollectDuration = function () {
            var durations = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                durations[_i] = arguments[_i];
            }
            // a full list of Google crawlers user agent strings - https://support.google.com/webmasters/answer/1061943?hl=en
            var botAgentNames = ['googlebot', 'adsbot-google', 'apis-google', 'mediapartners-google'];
            var userAgent = navigator.userAgent;
            var isGoogleBot = false;
            if (userAgent) {
                for (var i = 0; i < botAgentNames.length; i++) {
                    isGoogleBot = isGoogleBot || userAgent.toLowerCase().indexOf(botAgentNames[i]) !== -1;
                }
            }
            if (isGoogleBot) {
                // Don't report durations for GoogleBot, it is returning invalid values in performance.timing API.
                return false;
            }
            else {
                // for other page views, don't report if it's outside of a reasonable range
                for (var i = 0; i < durations.length; i++) {
                    if (durations[i] >= this.MAX_DURATION_ALLOWED) {
                        return false;
                    }
                }
            }
            return true;
        };
        return PageViewPerformanceManager;
    }());

    /**
     * ApplicationInsights.ts
     * @copyright Microsoft 2018
     */
    var durationProperty = "duration";
    var ApplicationInsights = /** @class */ (function () {
        function ApplicationInsights() {
            this.identifier = "ApplicationInsightsAnalytics"; // do not change name or priority
            this.priority = 180; // take from reserved priority range 100- 200
            this.autoRoutePVDelay = 500; // ms; Time to wait after a route change before triggering a pageview to allow DOM changes to take place
            this._isInitialized = false;
            // Counts number of trackAjax invokations.
            // By default we only monitor X ajax call per view to avoid too much load.
            // Default value is set in config.
            // This counter keeps increasing even after the limit is reached.
            this._trackAjaxAttempts = 0;
            // array with max length of 2 that store current url and previous url for SPA page route change trackPageview use.
            this._prevUri = typeof window === "object" && window.location && window.location.href || "";
            this.initialize = this._initialize.bind(this);
        }
        ApplicationInsights.getDefaultConfig = function (config) {
            if (!config) {
                config = {};
            }
            // set default values
            config.sessionRenewalMs = 30 * 60 * 1000;
            config.sessionExpirationMs = 24 * 60 * 60 * 1000;
            config.disableExceptionTracking = Util.stringToBoolOrDefault(config.disableExceptionTracking);
            config.autoTrackPageVisitTime = Util.stringToBoolOrDefault(config.autoTrackPageVisitTime);
            config.overridePageViewDuration = Util.stringToBoolOrDefault(config.overridePageViewDuration);
            if (isNaN(config.samplingPercentage) || config.samplingPercentage <= 0 || config.samplingPercentage >= 100) {
                config.samplingPercentage = 100;
            }
            config.isCookieUseDisabled = Util.stringToBoolOrDefault(config.isCookieUseDisabled);
            config.isStorageUseDisabled = Util.stringToBoolOrDefault(config.isStorageUseDisabled);
            config.isBrowserLinkTrackingEnabled = Util.stringToBoolOrDefault(config.isBrowserLinkTrackingEnabled);
            config.enableAutoRouteTracking = Util.stringToBoolOrDefault(config.enableAutoRouteTracking);
            config.namePrefix = config.namePrefix || "";
            return config;
        };
        ApplicationInsights.prototype.processTelemetry = function (env) {
            var doNotSendItem = false;
            var telemetryInitializersCount = this._telemetryInitializers.length;
            for (var i = 0; i < telemetryInitializersCount; ++i) {
                var telemetryInitializer = this._telemetryInitializers[i];
                if (telemetryInitializer) {
                    try {
                        if (telemetryInitializer.apply(null, [env]) === false) {
                            doNotSendItem = true;
                            break;
                        }
                    }
                    catch (e) {
                        // log error but dont stop executing rest of the telemetry initializers
                        // doNotSendItem = true;
                        this._logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.TelemetryInitializerFailed, "One of telemetry initializers failed, telemetry item will not be sent: " + Util.getExceptionName(e), { exception: Util.dump(e) }, true);
                    }
                }
            }
            if (!doNotSendItem && !CoreUtils.isNullOrUndefined(this._nextPlugin)) {
                this._nextPlugin.processTelemetry(env);
            }
        };
        ApplicationInsights.prototype.setNextPlugin = function (next) {
            this._nextPlugin = next;
        };
        ApplicationInsights.prototype.trackEvent = function (event, customProperties) {
            try {
                var telemetryItem = TelemetryItemCreator.create(event, Event$1.dataType, Event$1.envelopeType, this._logger, customProperties);
                this.core.track(telemetryItem);
            }
            catch (e) {
                this._logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.TrackTraceFailed, "trackTrace failed, trace will not be collected: " + Util.getExceptionName(e), { exception: Util.dump(e) });
            }
        };
        /**
         * Start timing an extended event. Call `stopTrackEvent` to log the event when it ends.
         * @param   name    A string that identifies this event uniquely within the document.
         */
        ApplicationInsights.prototype.startTrackEvent = function (name) {
            try {
                this._eventTracking.start(name);
            }
            catch (e) {
                this._logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.StartTrackEventFailed, "startTrackEvent failed, event will not be collected: " + Util.getExceptionName(e), { exception: Util.dump(e) });
            }
        };
        /**
         * Log an extended event that you started timing with `startTrackEvent`.
         * @param   name    The string you used to identify this event in `startTrackEvent`.
         * @param   properties  map[string, string] - additional data used to filter events and metrics in the portal. Defaults to empty.
         * @param   measurements    map[string, number] - metrics associated with this event, displayed in Metrics Explorer on the portal. Defaults to empty.
         */
        ApplicationInsights.prototype.stopTrackEvent = function (name, properties, measurements) {
            try {
                this._eventTracking.stop(name, undefined, properties); // Todo: Fix to pass measurements once type is updated
            }
            catch (e) {
                this._logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.StopTrackEventFailed, "stopTrackEvent failed, event will not be collected: " + Util.getExceptionName(e), { exception: Util.dump(e) });
            }
        };
        /**
         * @description Log a diagnostic message
         * @param {ITraceTelemetry} trace
         * @param ICustomProperties.
         * @memberof ApplicationInsights
         */
        ApplicationInsights.prototype.trackTrace = function (trace, customProperties) {
            try {
                var telemetryItem = TelemetryItemCreator.create(trace, Trace.dataType, Trace.envelopeType, this._logger, customProperties);
                this.core.track(telemetryItem);
            }
            catch (e) {
                this._logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.TrackTraceFailed, "trackTrace failed, trace will not be collected: " + Util.getExceptionName(e), { exception: Util.dump(e) });
            }
        };
        /**
         * @description Log a numeric value that is not associated with a specific event. Typically
         * used to send regular reports of performance indicators. To send single measurement, just
         * use the name and average fields of {@link IMetricTelemetry}. If you take measurements
         * frequently, you can reduce the telemetry bandwidth by aggregating multiple measurements
         * and sending the resulting average at intervals
         * @param {IMetricTelemetry} metric input object argument. Only name and average are mandatory.
         * @param {{[key: string]: any}} customProperties additional data used to filter metrics in the
         * portal. Defaults to empty.
         * @memberof ApplicationInsights
         */
        ApplicationInsights.prototype.trackMetric = function (metric, customProperties) {
            try {
                var telemetryItem = TelemetryItemCreator.create(metric, Metric.dataType, Metric.envelopeType, this._logger, customProperties);
                this.core.track(telemetryItem);
            }
            catch (e) {
                this._logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.TrackMetricFailed, "trackMetric failed, metric will not be collected: " + Util.getExceptionName(e), { exception: Util.dump(e) });
            }
        };
        /**
         * Logs that a page or other item was viewed.
         * @param IPageViewTelemetry The string you used as the name in startTrackPage. Defaults to the document title.
         * @param customProperties Additional data used to filter events and metrics. Defaults to empty.
         * If a user wants to provide duration for pageLoad, it'll have to be in pageView.properties.duration
         */
        ApplicationInsights.prototype.trackPageView = function (pageView, customProperties) {
            try {
                var inPv = pageView || {};
                this._pageViewManager.trackPageView(inPv, __assign({}, inPv.properties, inPv.measurements, customProperties));
                if (this.config.autoTrackPageVisitTime) {
                    this._pageVisitTimeManager.trackPreviousPageVisit(inPv.name, inPv.uri);
                }
            }
            catch (e) {
                this._logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.TrackPVFailed, "trackPageView failed, page view will not be collected: " + Util.getExceptionName(e), { exception: Util.dump(e) });
            }
        };
        /**
         * Create a page view telemetry item and send it to the SDK pipeline through the core.track API
         * @param pageView Page view item to be sent
         * @param properties Custom properties (Part C) that a user can add to the telemetry item
         * @param systemProperties System level properties (Part A) that a user can add to the telemetry item
         */
        ApplicationInsights.prototype.sendPageViewInternal = function (pageView, properties, systemProperties) {
            if (typeof document !== "undefined") {
                pageView.refUri = pageView.refUri === undefined ? document.referrer : pageView.refUri;
            }
            var telemetryItem = TelemetryItemCreator.create(pageView, PageView.dataType, PageView.envelopeType, this._logger, properties, systemProperties);
            this.core.track(telemetryItem);
            // reset ajaxes counter
            this._trackAjaxAttempts = 0;
        };
        /**
         * @ignore INTERNAL ONLY
         * @param pageViewPerformance
         * @param properties
         */
        ApplicationInsights.prototype.sendPageViewPerformanceInternal = function (pageViewPerformance, properties, systemProperties) {
            var telemetryItem = TelemetryItemCreator.create(pageViewPerformance, PageViewPerformance.dataType, PageViewPerformance.envelopeType, this._logger, properties, systemProperties);
            this.core.track(telemetryItem);
        };
        /**
         * Send browser performance metrics.
         * @param pageViewPerformance
         * @param customProperties
         */
        ApplicationInsights.prototype.trackPageViewPerformance = function (pageViewPerformance, customProperties) {
            try {
                this._pageViewPerformanceManager.populatePageViewPerformanceEvent(pageViewPerformance);
                this.sendPageViewPerformanceInternal(pageViewPerformance, customProperties);
            }
            catch (e) {
                this._logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.TrackPVFailed, "trackPageViewPerformance failed, page view will not be collected: " + Util.getExceptionName(e), { exception: Util.dump(e) });
            }
        };
        /**
         * Starts the timer for tracking a page load time. Use this instead of `trackPageView` if you want to control when the page view timer starts and stops,
         * but don't want to calculate the duration yourself. This method doesn't send any telemetry. Call `stopTrackPage` to log the end of the page view
         * and send the event.
         * @param name A string that idenfities this item, unique within this HTML document. Defaults to the document title.
         */
        ApplicationInsights.prototype.startTrackPage = function (name) {
            try {
                if (typeof name !== "string") {
                    name = typeof window === "object" && window.document && window.document.title || "";
                }
                this._pageTracking.start(name);
            }
            catch (e) {
                this._logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.StartTrackFailed, "startTrackPage failed, page view may not be collected: " + Util.getExceptionName(e), { exception: Util.dump(e) });
            }
        };
        /**
         * Stops the timer that was started by calling `startTrackPage` and sends the pageview load time telemetry with the specified properties and measurements.
         * The duration of the page view will be the time between calling `startTrackPage` and `stopTrackPage`.
         * @param   name  The string you used as the name in startTrackPage. Defaults to the document title.
         * @param   url   String - a relative or absolute URL that identifies the page or other item. Defaults to the window location.
         * @param   properties  map[string, string] - additional data used to filter pages and metrics in the portal. Defaults to empty.
         * @param   measurements    map[string, number] - metrics associated with this page, displayed in Metrics Explorer on the portal. Defaults to empty.
         */
        ApplicationInsights.prototype.stopTrackPage = function (name, url, properties, measurement) {
            try {
                if (typeof name !== "string") {
                    name = typeof window === "object" && window.document && window.document.title || "";
                }
                if (typeof url !== "string") {
                    url = typeof window === "object" && window.location && window.location.href || "";
                }
                this._pageTracking.stop(name, url, properties, measurement);
                if (this.config.autoTrackPageVisitTime) {
                    this._pageVisitTimeManager.trackPreviousPageVisit(name, url);
                }
            }
            catch (e) {
                this._logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.StopTrackFailed, "stopTrackPage failed, page view will not be collected: " + Util.getExceptionName(e), { exception: Util.dump(e) });
            }
        };
        /**
         * @ignore INTERNAL ONLY
         * @param exception
         * @param properties
         * @param systemProperties
         */
        ApplicationInsights.prototype.sendExceptionInternal = function (exception, customProperties, systemProperties) {
            var exceptionPartB = new Exception(this._logger, exception.exception || new Error(Util.NotSpecified), exception.properties, exception.measurements, exception.severityLevel, exception.id).toInterface();
            var telemetryItem = TelemetryItemCreator.create(exceptionPartB, Exception.dataType, Exception.envelopeType, this._logger, customProperties, systemProperties);
            this.core.track(telemetryItem);
        };
        /**
         * Log an exception you have caught.
         *
         * @param {IExceptionTelemetry} exception   Object which contains exception to be sent
         * @param {{[key: string]: any}} customProperties   Additional data used to filter pages and metrics in the portal. Defaults to empty.
         *
         * Any property of type double will be considered a measurement, and will be treated by Application Insights as a metric.
         * @memberof ApplicationInsights
         */
        ApplicationInsights.prototype.trackException = function (exception, customProperties) {
            try {
                this.sendExceptionInternal(exception, customProperties);
            }
            catch (e) {
                this._logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.TrackExceptionFailed, "trackException failed, exception will not be collected: " + Util.getExceptionName(e), { exception: Util.dump(e) });
            }
        };
        /**
         * @description Custom error handler for Application Insights Analytics
         * @param {IAutoExceptionTelemetry} exception
         * @memberof ApplicationInsights
         */
        ApplicationInsights.prototype._onerror = function (exception) {
            try {
                var properties_1 = {
                    url: (exception && exception.url) || document.URL,
                    lineNumber: exception.lineNumber,
                    columnNumber: exception.columnNumber,
                    message: exception.message
                };
                if (Util.isCrossOriginError(exception.message, exception.url, exception.lineNumber, exception.columnNumber, exception.error)) {
                    this._sendCORSException(properties_1.url);
                }
                else {
                    if (!Util.isError(exception.error)) {
                        var stack = "window.onerror@" + properties_1.url + ":" + exception.lineNumber + ":" + (exception.columnNumber || 0);
                        exception.error = new Error(exception.message);
                        exception.error.stack = stack;
                    }
                    this.trackException({ exception: exception.error, severityLevel: SeverityLevel.Error }, properties_1);
                }
            }
            catch (e) {
                var errorString = exception.error ?
                    (exception.error.name + ", " + exception.error.message)
                    : "null";
                this._logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.ExceptionWhileLoggingError, "_onError threw exception while logging error, error will not be collected: "
                    + Util.getExceptionName(e), { exception: Util.dump(e), errorString: errorString });
            }
        };
        ApplicationInsights.prototype.addTelemetryInitializer = function (telemetryInitializer) {
            this._telemetryInitializers.push(telemetryInitializer);
        };
        ApplicationInsights.prototype._initialize = function (config, core, extensions) {
            var _this = this;
            if (this._isInitialized) {
                return;
            }
            if (CoreUtils.isNullOrUndefined(core)) {
                throw Error("Error initializing");
            }
            this.core = core;
            this._logger = core.logger;
            this._globalconfig = {
                instrumentationKey: config.instrumentationKey,
                endpointUrl: config.endpointUrl || "https://dc.services.visualstudio.com/v2/track"
            };
            this.config = config.extensionConfig && config.extensionConfig[this.identifier] ? config.extensionConfig[this.identifier] : {};
            // load default values if specified
            var defaults = ApplicationInsights.getDefaultConfig();
            if (defaults !== undefined) {
                for (var field in defaults) {
                    // for each unspecified field, set the default value
                    this.config[field] = ConfigurationManager.getConfig(config, field, this.identifier, defaults[field]);
                }
                if (this._globalconfig) {
                    for (var field in defaults) {
                        if (this._globalconfig[field] === undefined) {
                            this._globalconfig[field] = defaults[field];
                        }
                    }
                }
            }
            // Todo: move this out of static state
            if (this.config.isCookieUseDisabled) {
                Util.disableCookies();
            }
            // Todo: move this out of static state
            if (this.config.isStorageUseDisabled) {
                Util.disableStorage();
            }
            var configGetters = {
                instrumentationKey: function () { return config.instrumentationKey; },
                accountId: function () { return _this.config.accountId || config.accountId; },
                sessionRenewalMs: function () { return _this.config.sessionRenewalMs || config.sessionRenewalMs; },
                sessionExpirationMs: function () { return _this.config.sessionExpirationMs || config.sessionExpirationMs; },
                sampleRate: function () { return _this.config.samplingPercentage || config.samplingPercentage; },
                cookieDomain: function () { return _this.config.cookieDomain || config.cookieDomain; },
                sdkExtension: function () { return _this.config.sdkExtension || config.sdkExtension; },
                isBrowserLinkTrackingEnabled: function () { return _this.config.isBrowserLinkTrackingEnabled || config.isBrowserLinkTrackingEnabled; },
                appId: function () { return _this.config.appId || config.appId; }
            };
            this._pageViewPerformanceManager = new PageViewPerformanceManager(this.core);
            this._pageViewManager = new PageViewManager(this, this.config.overridePageViewDuration, this.core, this._pageViewPerformanceManager);
            this._pageVisitTimeManager = new PageVisitTimeManager(this._logger, function (pageName, pageUrl, pageVisitTime) { return _this.trackPageVisitTime(pageName, pageUrl, pageVisitTime); });
            this._telemetryInitializers = [];
            this._addDefaultTelemetryInitializers(configGetters);
            this._eventTracking = new Timing(this._logger, "trackEvent");
            this._eventTracking.action =
                function (name, url, duration, properties) {
                    if (!properties) {
                        properties = {};
                    }
                    properties[durationProperty] = duration.toString();
                    _this.trackEvent({ name: name, properties: properties });
                };
            // initialize page view timing
            this._pageTracking = new Timing(this._logger, "trackPageView");
            this._pageTracking.action = function (name, url, duration, properties, measurements) {
                // duration must be a custom property in order for the collector to extract it
                if (CoreUtils.isNullOrUndefined(properties)) {
                    properties = {};
                }
                properties[durationProperty] = duration.toString();
                var pageViewItem = {
                    name: name,
                    uri: url,
                    properties: properties,
                    measurements: measurements
                };
                _this.sendPageViewInternal(pageViewItem);
            };
            var instance = this;
            if (this.config.disableExceptionTracking === false &&
                !this.config.autoExceptionInstrumented && typeof window === "object") {
                // We want to enable exception auto collection and it has not been done so yet
                var onerror_1 = "onerror";
                var originalOnError_1 = window[onerror_1];
                window.onerror = function (message, url, lineNumber, columnNumber, error) {
                    var handled = originalOnError_1 && originalOnError_1(message, url, lineNumber, columnNumber, error);
                    if (handled !== true) {
                        instance._onerror({
                            message: message,
                            url: url,
                            lineNumber: lineNumber,
                            columnNumber: columnNumber,
                            error: error
                        });
                    }
                    return handled;
                };
                this.config.autoExceptionInstrumented = true;
            }
            /**
             * Create a custom "locationchange" event which is triggered each time the history object is changed
             */
            if (this.config.enableAutoRouteTracking === true
                && typeof history === "object" && typeof history.pushState === "function" && typeof history.replaceState === "function"
                && typeof window === "object"
                && typeof Event !== "undefined") {
                var _self_1 = this;
                // Find the properties plugin
                CoreUtils.arrForEach(extensions, function (extension) {
                    if (extension.identifier === PropertiesPluginIdentifier) {
                        _this._properties = extension;
                    }
                });
                history.pushState = (function (f) { return function pushState() {
                    var ret = f.apply(this, arguments);
                    window.dispatchEvent(Util.createDomEvent(_self_1.config.namePrefix + "pushState"));
                    window.dispatchEvent(Util.createDomEvent(_self_1.config.namePrefix + "locationchange"));
                    return ret;
                }; })(history.pushState);
                history.replaceState = (function (f) { return function replaceState() {
                    var ret = f.apply(this, arguments);
                    window.dispatchEvent(Util.createDomEvent(_self_1.config.namePrefix + "replaceState"));
                    window.dispatchEvent(Util.createDomEvent(_self_1.config.namePrefix + "locationchange"));
                    return ret;
                }; })(history.replaceState);
                window.addEventListener(_self_1.config.namePrefix + "popstate", function () {
                    window.dispatchEvent(Util.createDomEvent(_self_1.config.namePrefix + "locationchange"));
                });
                window.addEventListener(_self_1.config.namePrefix + "locationchange", function () {
                    if (_self_1._properties && _self_1._properties.context && _self_1._properties.context.telemetryTrace) {
                        _self_1._properties.context.telemetryTrace.traceID = Util.generateW3CId();
                        _self_1._properties.context.telemetryTrace.name = window.location && window.location.pathname || "_unknown_";
                    }
                    if (_this._currUri) {
                        _this._prevUri = _this._currUri;
                        _this._currUri = window.location && window.location.href || "";
                    }
                    else {
                        _this._currUri = window.location && window.location.href || "";
                    }
                    setTimeout((function (uri) {
                        // todo: override start time so that it is not affected by autoRoutePVDelay
                        _self_1.trackPageView({ refUri: uri, properties: { duration: 0 } }); // SPA route change loading durations are undefined, so send 0
                    }).bind(_this, _this._prevUri), _self_1.autoRoutePVDelay);
                });
            }
            this._isInitialized = true;
        };
        /**
         * Log a page visit time
         * @param    pageName    Name of page
         * @param    pageVisitDuration Duration of visit to the page in milleseconds
         */
        ApplicationInsights.prototype.trackPageVisitTime = function (pageName, pageUrl, pageVisitTime) {
            var properties = { PageName: pageName, PageUrl: pageUrl };
            this.trackMetric({
                name: "PageVisitTime",
                average: pageVisitTime,
                max: pageVisitTime,
                min: pageVisitTime,
                sampleCount: 1
            }, properties);
        };
        ApplicationInsights.prototype._addDefaultTelemetryInitializers = function (configGetters) {
            if (!configGetters.isBrowserLinkTrackingEnabled()) {
                var browserLinkPaths_1 = ['/browserLinkSignalR/', '/__browserLink/'];
                var dropBrowserLinkRequests = function (envelope) {
                    if (envelope.baseType === RemoteDependencyData$1.dataType) {
                        var remoteData = envelope.baseData;
                        if (remoteData) {
                            for (var i = 0; i < browserLinkPaths_1.length; i++) {
                                if (remoteData.target && remoteData.target.indexOf(browserLinkPaths_1[i]) >= 0) {
                                    return false;
                                }
                            }
                        }
                    }
                    return true;
                };
                this._addTelemetryInitializer(dropBrowserLinkRequests);
            }
        };
        ApplicationInsights.prototype._addTelemetryInitializer = function (telemetryInitializer) {
            this._telemetryInitializers.push(telemetryInitializer);
        };
        ApplicationInsights.prototype._sendCORSException = function (url) {
            var exception = {
                message: "Script error: The browser's same-origin policy prevents us from getting the details of this exception. Consider using the 'crossorigin' attribute.",
                url: url,
                lineNumber: 0,
                columnNumber: 0,
                error: undefined
            };
            var telemetryItem = TelemetryItemCreator.create(exception, Exception.dataType, Exception.envelopeType, this._logger, { url: url });
            this.core.track(telemetryItem);
        };
        ApplicationInsights.Version = "2.3.1"; // Not currently used anywhere
        return ApplicationInsights;
    }());
    /**
     * Used to record timed events and page views.
     */
    var Timing = /** @class */ (function () {
        function Timing(logger, name) {
            this._name = name;
            this._events = {};
            this._logger = logger;
        }
        Timing.prototype.start = function (name) {
            if (typeof this._events[name] !== "undefined") {
                this._logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.StartCalledMoreThanOnce, "start was called more than once for this event without calling stop.", { name: this._name, key: name }, true);
            }
            this._events[name] = +new Date;
        };
        Timing.prototype.stop = function (name, url, properties, measurements) {
            var start = this._events[name];
            if (isNaN(start)) {
                this._logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.StopCalledWithoutStart, "stop was called without a corresponding start.", { name: this._name, key: name }, true);
            }
            else {
                var end = +new Date;
                var duration = DateTimeUtils.GetDuration(start, end);
                this.action(name, url, duration, properties, measurements);
            }
            delete this._events[name];
            this._events[name] = undefined;
        };
        return Timing;
    }());

    /*
     * An array based send buffer.
     */
    var ArraySendBuffer = /** @class */ (function () {
        function ArraySendBuffer(config) {
            this._config = config;
            this._buffer = [];
        }
        ArraySendBuffer.prototype.enqueue = function (payload) {
            this._buffer.push(payload);
        };
        ArraySendBuffer.prototype.count = function () {
            return this._buffer.length;
        };
        ArraySendBuffer.prototype.clear = function () {
            this._buffer.length = 0;
        };
        ArraySendBuffer.prototype.getItems = function () {
            return this._buffer.slice(0);
        };
        ArraySendBuffer.prototype.batchPayloads = function (payload) {
            if (payload && payload.length > 0) {
                var batch = this._config.emitLineDelimitedJson() ?
                    payload.join("\n") :
                    "[" + payload.join(",") + "]";
                return batch;
            }
            return null;
        };
        ArraySendBuffer.prototype.markAsSent = function (payload) {
            this.clear();
        };
        ArraySendBuffer.prototype.clearSent = function (payload) {
            // not supported
        };
        return ArraySendBuffer;
    }());
    /*
     * Session storege buffer holds a copy of all unsent items in the browser session storage.
     */
    var SessionStorageSendBuffer = /** @class */ (function () {
        function SessionStorageSendBuffer(logger, config) {
            this._bufferFullMessageSent = false;
            this._logger = logger;
            this._config = config;
            var bufferItems = this.getBuffer(SessionStorageSendBuffer.BUFFER_KEY);
            var notDeliveredItems = this.getBuffer(SessionStorageSendBuffer.SENT_BUFFER_KEY);
            this._buffer = bufferItems.concat(notDeliveredItems);
            // If the buffer has too many items, drop items from the end.
            if (this._buffer.length > SessionStorageSendBuffer.MAX_BUFFER_SIZE) {
                this._buffer.length = SessionStorageSendBuffer.MAX_BUFFER_SIZE;
            }
            // update DataLossAnalyzer with the number of recovered items
            // Uncomment if you want to use DataLossanalyzer
            // DataLossAnalyzer.itemsRestoredFromSessionBuffer = this._buffer.length;
            this.setBuffer(SessionStorageSendBuffer.SENT_BUFFER_KEY, []);
            this.setBuffer(SessionStorageSendBuffer.BUFFER_KEY, this._buffer);
        }
        SessionStorageSendBuffer.prototype.enqueue = function (payload) {
            if (this._buffer.length >= SessionStorageSendBuffer.MAX_BUFFER_SIZE) {
                // sent internal log only once per page view
                if (!this._bufferFullMessageSent) {
                    this._logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.SessionStorageBufferFull, "Maximum buffer size reached: " + this._buffer.length, true);
                    this._bufferFullMessageSent = true;
                }
                return;
            }
            this._buffer.push(payload);
            this.setBuffer(SessionStorageSendBuffer.BUFFER_KEY, this._buffer);
        };
        SessionStorageSendBuffer.prototype.count = function () {
            return this._buffer.length;
        };
        SessionStorageSendBuffer.prototype.clear = function () {
            this._buffer.length = 0;
            this.setBuffer(SessionStorageSendBuffer.BUFFER_KEY, []);
            this.setBuffer(SessionStorageSendBuffer.SENT_BUFFER_KEY, []);
            this._bufferFullMessageSent = false;
        };
        SessionStorageSendBuffer.prototype.getItems = function () {
            return this._buffer.slice(0);
        };
        SessionStorageSendBuffer.prototype.batchPayloads = function (payload) {
            if (payload && payload.length > 0) {
                var batch = this._config.emitLineDelimitedJson() ?
                    payload.join("\n") :
                    "[" + payload.join(",") + "]";
                return batch;
            }
            return null;
        };
        SessionStorageSendBuffer.prototype.markAsSent = function (payload) {
            this._buffer = this.removePayloadsFromBuffer(payload, this._buffer);
            this.setBuffer(SessionStorageSendBuffer.BUFFER_KEY, this._buffer);
            var sentElements = this.getBuffer(SessionStorageSendBuffer.SENT_BUFFER_KEY);
            if (sentElements instanceof Array && payload instanceof Array) {
                sentElements = sentElements.concat(payload);
                if (sentElements.length > SessionStorageSendBuffer.MAX_BUFFER_SIZE) {
                    // We send telemetry normally. If the SENT_BUFFER is too big we don't add new elements
                    // until we receive a response from the backend and the buffer has free space again (see clearSent method)
                    this._logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.SessionStorageBufferFull, "Sent buffer reached its maximum size: " + sentElements.length, true);
                    sentElements.length = SessionStorageSendBuffer.MAX_BUFFER_SIZE;
                }
                this.setBuffer(SessionStorageSendBuffer.SENT_BUFFER_KEY, sentElements);
            }
        };
        SessionStorageSendBuffer.prototype.clearSent = function (payload) {
            var sentElements = this.getBuffer(SessionStorageSendBuffer.SENT_BUFFER_KEY);
            sentElements = this.removePayloadsFromBuffer(payload, sentElements);
            this.setBuffer(SessionStorageSendBuffer.SENT_BUFFER_KEY, sentElements);
        };
        SessionStorageSendBuffer.prototype.removePayloadsFromBuffer = function (payloads, buffer) {
            var remaining = [];
            for (var i in buffer) {
                var contains = false;
                for (var j in payloads) {
                    if (payloads[j] === buffer[i]) {
                        contains = true;
                        break;
                    }
                }
                if (!contains) {
                    remaining.push(buffer[i]);
                }
            }
            return remaining;
        };
        SessionStorageSendBuffer.prototype.getBuffer = function (key) {
            var prefixedKey = key;
            try {
                prefixedKey = this._config.namePrefix && this._config.namePrefix() ? this._config.namePrefix() + "_" + prefixedKey : prefixedKey;
                var bufferJson = Util.getSessionStorage(this._logger, prefixedKey);
                if (bufferJson) {
                    var buffer = JSON.parse(bufferJson);
                    if (buffer) {
                        return buffer;
                    }
                }
            }
            catch (e) {
                this._logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.FailedToRestoreStorageBuffer, " storage key: " + prefixedKey + ", " + Util.getExceptionName(e), { exception: Util.dump(e) });
            }
            return [];
        };
        SessionStorageSendBuffer.prototype.setBuffer = function (key, buffer) {
            var prefixedKey = key;
            try {
                prefixedKey = this._config.namePrefix && this._config.namePrefix() ? this._config.namePrefix() + "_" + prefixedKey : prefixedKey;
                var bufferJson = JSON.stringify(buffer);
                Util.setSessionStorage(this._logger, prefixedKey, bufferJson);
            }
            catch (e) {
                // if there was an error, clear the buffer
                // telemetry is stored in the _buffer array so we won't loose any items
                Util.setSessionStorage(this._logger, prefixedKey, JSON.stringify([]));
                this._logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.FailedToSetStorageBuffer, " storage key: " + prefixedKey + ", " + Util.getExceptionName(e) + ". Buffer cleared", { exception: Util.dump(e) });
            }
        };
        SessionStorageSendBuffer.BUFFER_KEY = "AI_buffer";
        SessionStorageSendBuffer.SENT_BUFFER_KEY = "AI_sentBuffer";
        // Maximum number of payloads stored in the buffer. If the buffer is full, new elements will be dropped.
        SessionStorageSendBuffer.MAX_BUFFER_SIZE = 2000;
        return SessionStorageSendBuffer;
    }());

    var EnvelopeCreator = /** @class */ (function () {
        function EnvelopeCreator() {
        }
        EnvelopeCreator.extractPropsAndMeasurements = function (data, properties, measurements) {
            if (!CoreUtils.isNullOrUndefined(data)) {
                for (var key in data) {
                    if (data.hasOwnProperty(key)) {
                        var value = data[key];
                        if (typeof value === "number") {
                            measurements[key] = value;
                        }
                        else if (typeof value === "string") {
                            properties[key] = value;
                        }
                        else {
                            properties[key] = JSON.stringify(value);
                        }
                    }
                }
            }
        };
        // TODO: Do we want this to take logger as arg or use this._logger as nonstatic?
        EnvelopeCreator.createEnvelope = function (logger, envelopeType, telemetryItem, data) {
            var envelope = new Envelope$1(logger, data, envelopeType);
            if (telemetryItem[SampleRate]) {
                envelope.sampleRate = telemetryItem[SampleRate];
            }
            envelope.iKey = telemetryItem.iKey;
            var iKeyNoDashes = telemetryItem.iKey.replace(/-/g, "");
            envelope.name = envelope.name.replace("{0}", iKeyNoDashes);
            // extract all extensions from ctx
            EnvelopeCreator.extractPartAExtensions(telemetryItem, envelope);
            // loop through the envelope tags (extension of Part A) and pick out the ones that should go in outgoing envelope tags
            if (!telemetryItem.tags) {
                telemetryItem.tags = [];
            }
            return envelope;
        };
        /*
         * Maps Part A data from CS 4.0
         */
        EnvelopeCreator.extractPartAExtensions = function (item, env) {
            // todo: switch to keys from common in this method
            if (!env.tags) {
                env.tags = {};
            }
            if (!item.ext) {
                item.ext = {};
            }
            if (!item.tags) {
                item.tags = [];
            }
            if (item.ext.user) {
                if (item.ext.user.authId) {
                    env.tags[CtxTagKeys.userAuthUserId] = item.ext.user.authId;
                }
                var userId = item.ext.user.id || item.ext.user.localId;
                if (userId) {
                    env.tags[CtxTagKeys.userId] = userId;
                }
            }
            if (item.ext.app) {
                if (item.ext.app.sesId) {
                    env.tags[CtxTagKeys.sessionId] = item.ext.app.sesId;
                }
            }
            if (item.ext.device) {
                if (item.ext.device.id || item.ext.device.localId) {
                    env.tags[CtxTagKeys.deviceId] = item.ext.device.id || item.ext.device.localId;
                }
                if (item.ext.device.deviceClass) {
                    env.tags[CtxTagKeys.deviceType] = item.ext.device.deviceClass;
                }
                if (item.ext.device.ip) {
                    env.tags[CtxTagKeys.deviceIp] = item.ext.device.ip;
                }
            }
            if (item.ext.web) {
                var web = item.ext.web;
                if (web.browserLang) {
                    env.tags[CtxTagKeys.deviceLanguage] = web.browserLang;
                }
                if (web.browserVer) {
                    env.tags[CtxTagKeys.deviceBrowserVersion] = web.browserVer;
                }
                if (web.browser) {
                    env.tags[CtxTagKeys.deviceBrowser] = web.browser;
                }
                env.data = env.data || {};
                env.data.baseData = env.data.baseData || {};
                env.data.baseData.properties = env.data.baseData.properties || {};
                if (web.domain) {
                    env.data.baseData.properties['domain'] = web.domain;
                }
                if (web.isManual) {
                    env.data.baseData.properties['isManual'] = web.isManual.toString();
                }
                if (web.screenRes) {
                    env.data.baseData.properties['screenRes'] = web.screenRes;
                }
                if (web.userConsent) {
                    env.data.baseData.properties['userConsent'] = web.userConsent.toString();
                }
            }
            if (item.ext.device) {
                if (item.ext.device.model) {
                    env.tags[CtxTagKeys.deviceModel] = item.ext.device.model;
                }
            }
            if (item.ext.os && item.ext.os.name) {
                env.tags[CtxTagKeys.deviceOS] = item.ext.os.name;
            }
            if (item.ext.device) {
                if (item.ext.device.deviceType) {
                    env.tags[CtxTagKeys.deviceType] = item.ext.device.deviceType;
                }
            }
            // No support for mapping Trace.traceState to 2.0 as it is currently empty
            if (item.ext.trace) {
                if (item.ext.trace.parentID) {
                    env.tags[CtxTagKeys.operationParentId] = item.ext.trace.parentID;
                }
                if (item.ext.trace.name) {
                    env.tags[CtxTagKeys.operationName] = item.ext.trace.name;
                }
                if (item.ext.trace.traceID) {
                    env.tags[CtxTagKeys.operationId] = item.ext.trace.traceID;
                }
            }
            // Sample 4.0 schema
            //  {
            //     "time" : "2018-09-05T22:51:22.4936Z",
            //     "name" : "MetricWithNamespace",
            //     "iKey" : "ABC-5a4cbd20-e601-4ef5-a3c6-5d6577e4398e",
            //     "ext": {  "cloud": {
            //          "role": "WATSON3",
            //          "roleInstance": "CO4AEAP00000260"
            //      },
            //      "device": {}, "correlation": {} },
            //      "tags": [
            //        { "amazon.region" : "east2" },
            //        { "os.expid" : "wp:02df239" }
            //     ]
            //   }
            var tgs = {};
            var _loop_1 = function (i) {
                var tg = item.tags[i];
                // CoreUtils.objKeys returns an array of keys
                CoreUtils.arrForEach(CoreUtils.objKeys(tg), function (key) {
                    tgs[key] = tg[key];
                });
                item.tags.splice(i, 1);
            };
            // deals with tags.push({object})
            for (var i = item.tags.length - 1; i >= 0; i--) {
                _loop_1(i);
            }
            // deals with tags[key]=value
            for (var tg in item.tags) {
                tgs[tg] = item.tags[tg];
            }
            env.tags = __assign({}, env.tags, tgs);
            if (!env.tags[CtxTagKeys.internalSdkVersion]) {
                // Append a version in case it is not already set
                env.tags[CtxTagKeys.internalSdkVersion] = "javascript:" + EnvelopeCreator.Version;
            }
        };
        EnvelopeCreator.Version = "2.3.1";
        return EnvelopeCreator;
    }());
    var DependencyEnvelopeCreator = /** @class */ (function (_super) {
        __extends(DependencyEnvelopeCreator, _super);
        function DependencyEnvelopeCreator() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        DependencyEnvelopeCreator.prototype.Create = function (logger, telemetryItem) {
            this._logger = logger;
            if (CoreUtils.isNullOrUndefined(telemetryItem.baseData)) {
                this._logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.TelemetryEnvelopeInvalid, "telemetryItem.baseData cannot be null.");
            }
            var customMeasurements = telemetryItem.baseData.measurements || {};
            var customProperties = telemetryItem.baseData.properties || {};
            EnvelopeCreator.extractPropsAndMeasurements(telemetryItem.data, customProperties, customMeasurements);
            var bd = telemetryItem.baseData;
            if (CoreUtils.isNullOrUndefined(bd)) {
                logger.warnToConsole("Invalid input for dependency data");
                return null;
            }
            var id = bd.id;
            var absoluteUrl = bd.target;
            var command = bd.name;
            var duration = bd.duration;
            var success = bd.success;
            var resultCode = bd.responseCode;
            var requestAPI = bd.type;
            var correlationContext = bd.correlationContext;
            var method = bd.properties && bd.properties[HttpMethod] ? bd.properties[HttpMethod] : "GET";
            var baseData = new RemoteDependencyData$1(logger, id, absoluteUrl, command, duration, success, resultCode, method, requestAPI, correlationContext, customProperties, customMeasurements);
            var data = new Data$1(RemoteDependencyData$1.dataType, baseData);
            return EnvelopeCreator.createEnvelope(logger, RemoteDependencyData$1.envelopeType, telemetryItem, data);
        };
        DependencyEnvelopeCreator.DependencyEnvelopeCreator = new DependencyEnvelopeCreator();
        return DependencyEnvelopeCreator;
    }(EnvelopeCreator));
    var EventEnvelopeCreator = /** @class */ (function (_super) {
        __extends(EventEnvelopeCreator, _super);
        function EventEnvelopeCreator() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        EventEnvelopeCreator.prototype.Create = function (logger, telemetryItem) {
            this._logger = logger;
            if (CoreUtils.isNullOrUndefined(telemetryItem.baseData)) {
                this._logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.TelemetryEnvelopeInvalid, "telemetryItem.baseData cannot be null.");
            }
            var customProperties = {};
            var customMeasurements = {};
            if (telemetryItem.baseType !== Event$1.dataType) {
                customProperties['baseTypeSource'] = telemetryItem.baseType; // save the passed in base type as a property
            }
            if (telemetryItem.baseType === Event$1.dataType) {
                customProperties = telemetryItem.baseData.properties || {};
                customMeasurements = telemetryItem.baseData.measurements || {};
            }
            else {
                if (telemetryItem.baseData) {
                    EnvelopeCreator.extractPropsAndMeasurements(telemetryItem.baseData, customProperties, customMeasurements);
                }
            }
            // Exract root level properties from part C telemetryItem.data
            EnvelopeCreator.extractPropsAndMeasurements(telemetryItem.data, customProperties, customMeasurements);
            var eventName = telemetryItem.baseData.name;
            var baseData = new Event$1(logger, eventName, customProperties, customMeasurements);
            var data = new Data$1(Event$1.dataType, baseData);
            return EnvelopeCreator.createEnvelope(logger, Event$1.envelopeType, telemetryItem, data);
        };
        EventEnvelopeCreator.EventEnvelopeCreator = new EventEnvelopeCreator();
        return EventEnvelopeCreator;
    }(EnvelopeCreator));
    var ExceptionEnvelopeCreator = /** @class */ (function (_super) {
        __extends(ExceptionEnvelopeCreator, _super);
        function ExceptionEnvelopeCreator() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ExceptionEnvelopeCreator.prototype.Create = function (logger, telemetryItem) {
            this._logger = logger;
            if (CoreUtils.isNullOrUndefined(telemetryItem.baseData)) {
                this._logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.TelemetryEnvelopeInvalid, "telemetryItem.baseData cannot be null.");
            }
            var bd = telemetryItem.baseData;
            var baseData = Exception.CreateFromInterface(logger, bd);
            var data = new Data$1(Exception.dataType, baseData);
            return EnvelopeCreator.createEnvelope(logger, Exception.envelopeType, telemetryItem, data);
        };
        ExceptionEnvelopeCreator.ExceptionEnvelopeCreator = new ExceptionEnvelopeCreator();
        return ExceptionEnvelopeCreator;
    }(EnvelopeCreator));
    var MetricEnvelopeCreator = /** @class */ (function (_super) {
        __extends(MetricEnvelopeCreator, _super);
        function MetricEnvelopeCreator() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MetricEnvelopeCreator.prototype.Create = function (logger, telemetryItem) {
            this._logger = logger;
            if (CoreUtils.isNullOrUndefined(telemetryItem.baseData)) {
                this._logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.TelemetryEnvelopeInvalid, "telemetryItem.baseData cannot be null.");
            }
            var props = telemetryItem.baseData.properties || {};
            var measurements = telemetryItem.baseData.measurements || {};
            EnvelopeCreator.extractPropsAndMeasurements(telemetryItem.data, props, measurements);
            var name = telemetryItem.baseData.name;
            var average = telemetryItem.baseData.average;
            var sampleCount = telemetryItem.baseData.sampleCount;
            var min = telemetryItem.baseData.min;
            var max = telemetryItem.baseData.max;
            var baseData = new Metric(logger, name, average, sampleCount, min, max, props, measurements);
            var data = new Data$1(Metric.dataType, baseData);
            return EnvelopeCreator.createEnvelope(logger, Metric.envelopeType, telemetryItem, data);
        };
        MetricEnvelopeCreator.MetricEnvelopeCreator = new MetricEnvelopeCreator();
        return MetricEnvelopeCreator;
    }(EnvelopeCreator));
    var PageViewEnvelopeCreator = /** @class */ (function (_super) {
        __extends(PageViewEnvelopeCreator, _super);
        function PageViewEnvelopeCreator() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        PageViewEnvelopeCreator.prototype.Create = function (logger, telemetryItem) {
            this._logger = logger;
            if (CoreUtils.isNullOrUndefined(telemetryItem.baseData)) {
                this._logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.TelemetryEnvelopeInvalid, "telemetryItem.baseData cannot be null.");
            }
            // Since duration is not part of the domain properties in Common Schema, extract it from part C
            var duration;
            if (!CoreUtils.isNullOrUndefined(telemetryItem.baseData) &&
                !CoreUtils.isNullOrUndefined(telemetryItem.baseData.properties) &&
                !CoreUtils.isNullOrUndefined(telemetryItem.baseData.properties.duration)) {
                duration = telemetryItem.baseData.properties.duration;
                delete telemetryItem.baseData.properties.duration;
            }
            else if (!CoreUtils.isNullOrUndefined(telemetryItem.data) &&
                !CoreUtils.isNullOrUndefined(telemetryItem.data["duration"])) {
                duration = telemetryItem.data["duration"];
                delete telemetryItem.data["duration"];
            }
            var bd = telemetryItem.baseData;
            // special case: pageview.id is grabbed from current operation id. Analytics plugin is decoupled from properties plugin, so this is done here instead. This can be made a default telemetry intializer instead if needed to be decoupled from channel
            var currentContextId;
            if (telemetryItem.ext && telemetryItem.ext.trace && telemetryItem.ext.trace.traceID) {
                currentContextId = telemetryItem.ext.trace.traceID;
            }
            var id = bd.id || currentContextId;
            var name = bd.name;
            var url = bd.uri;
            var properties = bd.properties || {};
            var measurements = bd.measurements || {};
            // refUri is a field that Breeze still does not recognize as part of Part B. For now, put it in Part C until it supports it as a domain property
            if (!CoreUtils.isNullOrUndefined(bd.refUri)) {
                properties["refUri"] = bd.refUri;
            }
            // pageType is a field that Breeze still does not recognize as part of Part B. For now, put it in Part C until it supports it as a domain property
            if (!CoreUtils.isNullOrUndefined(bd.pageType)) {
                properties["pageType"] = bd.pageType;
            }
            // isLoggedIn is a field that Breeze still does not recognize as part of Part B. For now, put it in Part C until it supports it as a domain property
            if (!CoreUtils.isNullOrUndefined(bd.isLoggedIn)) {
                properties["isLoggedIn"] = bd.isLoggedIn.toString();
            }
            // pageTags is a field that Breeze still does not recognize as part of Part B. For now, put it in Part C until it supports it as a domain property
            if (!CoreUtils.isNullOrUndefined(bd.properties)) {
                var pageTags = bd.properties;
                for (var key in pageTags) {
                    if (pageTags.hasOwnProperty(key)) {
                        properties[key] = pageTags[key];
                    }
                }
            }
            EnvelopeCreator.extractPropsAndMeasurements(telemetryItem.data, properties, measurements);
            var baseData = new PageView(logger, name, url, duration, properties, measurements, id);
            var data = new Data$1(PageView.dataType, baseData);
            return EnvelopeCreator.createEnvelope(logger, PageView.envelopeType, telemetryItem, data);
        };
        PageViewEnvelopeCreator.PageViewEnvelopeCreator = new PageViewEnvelopeCreator();
        return PageViewEnvelopeCreator;
    }(EnvelopeCreator));
    var PageViewPerformanceEnvelopeCreator = /** @class */ (function (_super) {
        __extends(PageViewPerformanceEnvelopeCreator, _super);
        function PageViewPerformanceEnvelopeCreator() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        PageViewPerformanceEnvelopeCreator.prototype.Create = function (logger, telemetryItem) {
            this._logger = logger;
            if (CoreUtils.isNullOrUndefined(telemetryItem.baseData)) {
                this._logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.TelemetryEnvelopeInvalid, "telemetryItem.baseData cannot be null.");
            }
            var bd = telemetryItem.baseData;
            var name = bd.name;
            var url = bd.uri || bd.url;
            var properties = bd.properties || {};
            var measurements = bd.measurements || {};
            EnvelopeCreator.extractPropsAndMeasurements(telemetryItem.data, properties, measurements);
            var baseData = new PageViewPerformance(logger, name, url, undefined, properties, measurements, bd);
            var data = new Data$1(PageViewPerformance.dataType, baseData);
            return EnvelopeCreator.createEnvelope(logger, PageViewPerformance.envelopeType, telemetryItem, data);
        };
        PageViewPerformanceEnvelopeCreator.PageViewPerformanceEnvelopeCreator = new PageViewPerformanceEnvelopeCreator();
        return PageViewPerformanceEnvelopeCreator;
    }(EnvelopeCreator));
    var TraceEnvelopeCreator = /** @class */ (function (_super) {
        __extends(TraceEnvelopeCreator, _super);
        function TraceEnvelopeCreator() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        TraceEnvelopeCreator.prototype.Create = function (logger, telemetryItem) {
            this._logger = logger;
            if (CoreUtils.isNullOrUndefined(telemetryItem.baseData)) {
                this._logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.TelemetryEnvelopeInvalid, "telemetryItem.baseData cannot be null.");
            }
            var message = telemetryItem.baseData.message;
            var severityLevel = telemetryItem.baseData.severityLevel;
            var props = telemetryItem.baseData.properties || {};
            var measurements = telemetryItem.baseData.measurements || {};
            EnvelopeCreator.extractPropsAndMeasurements(telemetryItem.data, props, measurements);
            var baseData = new Trace(logger, message, severityLevel, props, measurements);
            var data = new Data$1(Trace.dataType, baseData);
            return EnvelopeCreator.createEnvelope(logger, Trace.envelopeType, telemetryItem, data);
        };
        TraceEnvelopeCreator.TraceEnvelopeCreator = new TraceEnvelopeCreator();
        return TraceEnvelopeCreator;
    }(EnvelopeCreator));

    var Serializer = /** @class */ (function () {
        function Serializer(logger) {
            this._logger = logger;
        }
        /**
         * Serializes the current object to a JSON string.
         */
        Serializer.prototype.serialize = function (input) {
            var output = this._serializeObject(input, "root");
            return JSON.stringify(output);
        };
        Serializer.prototype._serializeObject = function (source, name) {
            var circularReferenceCheck = "__aiCircularRefCheck";
            var output = {};
            if (!source) {
                this._logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.CannotSerializeObject, "cannot serialize object because it is null or undefined", { name: name }, true);
                return output;
            }
            if (source[circularReferenceCheck]) {
                this._logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.CircularReferenceDetected, "Circular reference detected while serializing object", { name: name }, true);
                return output;
            }
            if (!source.aiDataContract) {
                // special case for measurements/properties/tags
                if (name === "measurements") {
                    output = this._serializeStringMap(source, "number", name);
                }
                else if (name === "properties") {
                    output = this._serializeStringMap(source, "string", name);
                }
                else if (name === "tags") {
                    output = this._serializeStringMap(source, "string", name);
                }
                else if (Util.isArray(source)) {
                    output = this._serializeArray(source, name);
                }
                else {
                    this._logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.CannotSerializeObjectNonSerializable, "Attempting to serialize an object which does not implement ISerializable", { name: name }, true);
                    try {
                        // verify that the object can be stringified
                        JSON.stringify(source);
                        output = source;
                    }
                    catch (e) {
                        // if serialization fails return an empty string
                        this._logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.CannotSerializeObject, (e && typeof e.toString === 'function') ? e.toString() : "Error serializing object", null, true);
                    }
                }
                return output;
            }
            source[circularReferenceCheck] = true;
            for (var field in source.aiDataContract) {
                var contract = source.aiDataContract[field];
                var isRequired = (typeof contract === "function") ? (contract() & FieldType.Required) : (contract & FieldType.Required);
                var isHidden = (typeof contract === "function") ? (contract() & FieldType.Hidden) : (contract & FieldType.Hidden);
                var isArray = contract & FieldType.Array;
                var isPresent = source[field] !== undefined;
                var isObject = typeof source[field] === "object" && source[field] !== null;
                if (isRequired && !isPresent && !isArray) {
                    this._logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.MissingRequiredFieldSpecification, "Missing required field specification. The field is required but not present on source", { field: field, name: name });
                    // If not in debug mode, continue and hope the error is permissible
                    continue;
                }
                if (isHidden) {
                    // Don't serialize hidden fields
                    continue;
                }
                var value = void 0;
                if (isObject) {
                    if (isArray) {
                        // special case; resurse on each object in the source array
                        value = this._serializeArray(source[field], field);
                    }
                    else {
                        // recurse on the source object in this field
                        value = this._serializeObject(source[field], field);
                    }
                }
                else {
                    // assign the source field to the output even if undefined or required
                    value = source[field];
                }
                // only emit this field if the value is defined
                if (value !== undefined) {
                    output[field] = value;
                }
            }
            delete source[circularReferenceCheck];
            return output;
        };
        Serializer.prototype._serializeArray = function (sources, name) {
            var output;
            if (!!sources) {
                if (!Util.isArray(sources)) {
                    this._logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.ItemNotInArray, "This field was specified as an array in the contract but the item is not an array.\r\n", { name: name }, true);
                }
                else {
                    output = [];
                    for (var i = 0; i < sources.length; i++) {
                        var source = sources[i];
                        var item = this._serializeObject(source, name + "[" + i + "]");
                        output.push(item);
                    }
                }
            }
            return output;
        };
        Serializer.prototype._serializeStringMap = function (map, expectedType, name) {
            var output;
            if (map) {
                output = {};
                for (var field in map) {
                    var value = map[field];
                    if (expectedType === "string") {
                        if (value === undefined) {
                            output[field] = "undefined";
                        }
                        else if (value === null) {
                            output[field] = "null";
                        }
                        else if (!value.toString) {
                            output[field] = "invalid field: toString() is not defined.";
                        }
                        else {
                            output[field] = value.toString();
                        }
                    }
                    else if (expectedType === "number") {
                        if (value === undefined) {
                            output[field] = "undefined";
                        }
                        else if (value === null) {
                            output[field] = "null";
                        }
                        else {
                            var num = parseFloat(value);
                            if (isNaN(num)) {
                                output[field] = "NaN";
                            }
                            else {
                                output[field] = num;
                            }
                        }
                    }
                    else {
                        output[field] = "invalid field: " + name + " is of unknown type.";
                        this._logger.throwInternal(LoggingSeverity.CRITICAL, output[field], null, true);
                    }
                }
            }
            return output;
        };
        return Serializer;
    }());

    /**
     * @description Monitors browser for offline events
     * @export default - Offline: Static instance of OfflineListener
     * @class OfflineListener
     */
    var OfflineListener = /** @class */ (function () {
        function OfflineListener() {
            this._onlineStatus = true;
            try {
                if (typeof window === 'undefined') {
                    this.isListening = false;
                }
                else if (window && window.addEventListener) {
                    window.addEventListener('online', this._setOnline.bind(this), false);
                    window.addEventListener('offline', this._setOffline.bind(this), false);
                    this.isListening = true;
                }
                else if (document && document.body) {
                    document.body.ononline = this._setOnline.bind(this);
                    document.body.onoffline = this._setOffline.bind(this);
                    this.isListening = true;
                }
                else if (document) {
                    document.ononline = this._setOnline.bind(this);
                    document.onoffline = this._setOffline.bind(this);
                    this.isListening = true;
                }
                else {
                    // Could not find a place to add event listener
                    this.isListening = false;
                }
            }
            catch (e) {
                // this makes react-native less angry
                this.isListening = false;
            }
        }
        OfflineListener.prototype.isOnline = function () {
            if (this.isListening) {
                return this._onlineStatus;
            }
            else if (navigator && !CoreUtils.isNullOrUndefined(navigator.onLine)) {
                return navigator.onLine;
            }
            else {
                // Cannot determine online status - report as online
                return true;
            }
        };
        OfflineListener.prototype.isOffline = function () {
            return !this.isOnline();
        };
        OfflineListener.prototype._setOnline = function () {
            this._onlineStatus = true;
        };
        OfflineListener.prototype._setOffline = function () {
            this._onlineStatus = false;
        };
        OfflineListener.Offline = new OfflineListener;
        return OfflineListener;
    }());
    var Offline = OfflineListener.Offline;

    var HashCodeScoreGenerator = /** @class */ (function () {
        function HashCodeScoreGenerator() {
        }
        HashCodeScoreGenerator.prototype.getHashCodeScore = function (key) {
            var score = this.getHashCode(key) / HashCodeScoreGenerator.INT_MAX_VALUE;
            return score * 100;
        };
        HashCodeScoreGenerator.prototype.getHashCode = function (input) {
            if (input === "") {
                return 0;
            }
            while (input.length < HashCodeScoreGenerator.MIN_INPUT_LENGTH) {
                input = input.concat(input);
            }
            // 5381 is a magic number: http://stackoverflow.com/questions/10696223/reason-for-5381-number-in-djb-hash-function
            var hash = 5381;
            for (var i = 0; i < input.length; ++i) {
                hash = ((hash << 5) + hash) + input.charCodeAt(i);
                // 'hash' is of number type which means 53 bit integer (http://www.ecma-international.org/ecma-262/6.0/#sec-ecmascript-language-types-number-type)
                // 'hash & hash' will keep it 32 bit integer - just to make it clearer what the result is.
                hash = hash & hash;
            }
            return Math.abs(hash);
        };
        // We're using 32 bit math, hence max value is (2^31 - 1)
        HashCodeScoreGenerator.INT_MAX_VALUE = 2147483647;
        // (Magic number) DJB algorithm can't work on shorter strings (results in poor distribution
        HashCodeScoreGenerator.MIN_INPUT_LENGTH = 8;
        return HashCodeScoreGenerator;
    }());

    var SamplingScoreGenerator = /** @class */ (function () {
        function SamplingScoreGenerator() {
            this.hashCodeGeneragor = new HashCodeScoreGenerator();
            this.keys = new ContextTagKeys();
        }
        SamplingScoreGenerator.prototype.getSamplingScore = function (item) {
            var score = 0;
            if (item.tags && item.tags[this.keys.userId]) {
                score = this.hashCodeGeneragor.getHashCodeScore(item.tags[this.keys.userId]);
            }
            else if (item.ext && item.ext.user && item.ext.user.id) {
                score = this.hashCodeGeneragor.getHashCodeScore(item.ext.user.id);
            }
            else if (item.tags && item.tags[this.keys.operationId]) {
                score = this.hashCodeGeneragor.getHashCodeScore(item.tags[this.keys.operationId]);
            }
            else if (item.ext && item.ext.telemetryTrace && item.ext.telemetryTrace.traceID) {
                score = this.hashCodeGeneragor.getHashCodeScore(item.ext.telemetryTrace.traceID);
            }
            else {
                // tslint:disable-next-line:insecure-random
                score = (Math.random() * 100);
            }
            return score;
        };
        return SamplingScoreGenerator;
    }());

    var Sample = /** @class */ (function () {
        function Sample(sampleRate, logger) {
            // We're using 32 bit math, hence max value is (2^31 - 1)
            this.INT_MAX_VALUE = 2147483647;
            this._logger = CoreUtils.isNullOrUndefined(logger) ? new DiagnosticLogger() : logger;
            if (sampleRate > 100 || sampleRate < 0) {
                this._logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.SampleRateOutOfRange, "Sampling rate is out of range (0..100). Sampling will be disabled, you may be sending too much data which may affect your AI service level.", { samplingRate: sampleRate }, true);
                this.sampleRate = 100;
            }
            this.sampleRate = sampleRate;
            this.samplingScoreGenerator = new SamplingScoreGenerator();
        }
        /**
         * Determines if an envelope is sampled in (i.e. will be sent) or not (i.e. will be dropped).
         */
        Sample.prototype.isSampledIn = function (envelope) {
            var samplingPercentage = this.sampleRate; // 0 - 100
            var isSampledIn = false;
            if (samplingPercentage === null || samplingPercentage === undefined || samplingPercentage >= 100) {
                return true;
            }
            else if (envelope.baseType === Metric.dataType) {
                // exclude MetricData telemetry from sampling
                return true;
            }
            isSampledIn = this.samplingScoreGenerator.getSamplingScore(envelope) < samplingPercentage;
            return isSampledIn;
        };
        return Sample;
    }());

    var Sender = /** @class */ (function () {
        function Sender() {
            this.priority = 1001;
            this.identifier = BreezeChannelIdentifier;
            /**
             * Whether XMLHttpRequest object is supported. Older version of IE (8,9) do not support it.
             */
            this._XMLHttpRequestSupported = false;
        }
        Sender.constructEnvelope = function (orig, iKey, logger) {
            var envelope;
            if (iKey !== orig.iKey && !CoreUtils.isNullOrUndefined(iKey)) {
                envelope = __assign({}, orig, { iKey: iKey });
            }
            else {
                envelope = orig;
            }
            switch (envelope.baseType) {
                case Event$1.dataType:
                    return EventEnvelopeCreator.EventEnvelopeCreator.Create(logger, envelope);
                case Trace.dataType:
                    return TraceEnvelopeCreator.TraceEnvelopeCreator.Create(logger, envelope);
                case PageView.dataType:
                    return PageViewEnvelopeCreator.PageViewEnvelopeCreator.Create(logger, envelope);
                case PageViewPerformance.dataType:
                    return PageViewPerformanceEnvelopeCreator.PageViewPerformanceEnvelopeCreator.Create(logger, envelope);
                case Exception.dataType:
                    return ExceptionEnvelopeCreator.ExceptionEnvelopeCreator.Create(logger, envelope);
                case Metric.dataType:
                    return MetricEnvelopeCreator.MetricEnvelopeCreator.Create(logger, envelope);
                case RemoteDependencyData$1.dataType:
                    return DependencyEnvelopeCreator.DependencyEnvelopeCreator.Create(logger, envelope);
                default:
                    return EventEnvelopeCreator.EventEnvelopeCreator.Create(logger, envelope);
            }
        };
        Sender._getDefaultAppInsightsChannelConfig = function () {
            // set default values
            return {
                endpointUrl: function () { return "https://dc.services.visualstudio.com/v2/track"; },
                emitLineDelimitedJson: function () { return false; },
                maxBatchInterval: function () { return 15000; },
                maxBatchSizeInBytes: function () { return 102400; },
                disableTelemetry: function () { return false; },
                enableSessionStorageBuffer: function () { return true; },
                isRetryDisabled: function () { return false; },
                isBeaconApiDisabled: function () { return true; },
                onunloadDisableBeacon: function () { return false; },
                instrumentationKey: function () { return undefined; },
                namePrefix: function () { return undefined; },
                samplingPercentage: function () { return 100; }
            };
        };
        Sender._getEmptyAppInsightsChannelConfig = function () {
            return {
                endpointUrl: undefined,
                emitLineDelimitedJson: undefined,
                maxBatchInterval: undefined,
                maxBatchSizeInBytes: undefined,
                disableTelemetry: undefined,
                enableSessionStorageBuffer: undefined,
                isRetryDisabled: undefined,
                isBeaconApiDisabled: undefined,
                onunloadDisableBeacon: undefined,
                instrumentationKey: undefined,
                namePrefix: undefined,
                samplingPercentage: undefined
            };
        };
        Sender.prototype.pause = function () {
            throw new Error("Method not implemented.");
        };
        Sender.prototype.resume = function () {
            throw new Error("Method not implemented.");
        };
        Sender.prototype.flush = function () {
            try {
                this.triggerSend();
            }
            catch (e) {
                this._logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.FlushFailed, "flush failed, telemetry will not be collected: " + Util.getExceptionName(e), { exception: Util.dump(e) });
            }
        };
        Sender.prototype.onunloadFlush = function () {
            if ((this._config.onunloadDisableBeacon() === false || this._config.isBeaconApiDisabled() === false) && Util.IsBeaconApiSupported()) {
                try {
                    this.triggerSend(true, this._beaconSender);
                }
                catch (e) {
                    this._logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.FailedToSendQueuedTelemetry, "failed to flush with beacon sender on page unload, telemetry will not be collected: " + Util.getExceptionName(e), { exception: Util.dump(e) });
                }
            }
            else {
                this.flush();
            }
        };
        Sender.prototype.teardown = function () {
            throw new Error("Method not implemented.");
        };
        Sender.prototype.initialize = function (config, core, extensions) {
            var _this = this;
            this._logger = core.logger;
            this._serializer = new Serializer(core.logger);
            this._consecutiveErrors = 0;
            this._retryAt = null;
            this._lastSend = 0;
            this._sender = null;
            var defaultConfig = Sender._getDefaultAppInsightsChannelConfig();
            this._config = Sender._getEmptyAppInsightsChannelConfig();
            var _loop_1 = function (field) {
                this_1._config[field] = function () { return ConfigurationManager.getConfig(config, field, _this.identifier, defaultConfig[field]()); };
            };
            var this_1 = this;
            for (var field in defaultConfig) {
                _loop_1(field);
            }
            this._buffer = (this._config.enableSessionStorageBuffer && Util.canUseSessionStorage())
                ? new SessionStorageSendBuffer(this._logger, this._config) : new ArraySendBuffer(this._config);
            this._sample = new Sample(this._config.samplingPercentage(), this._logger);
            if (!this._config.isBeaconApiDisabled() && Util.IsBeaconApiSupported()) {
                this._sender = this._beaconSender;
            }
            else {
                if (typeof XMLHttpRequest !== "undefined") {
                    var testXhr = new XMLHttpRequest();
                    if ("withCredentials" in testXhr) {
                        this._sender = this._xhrSender;
                        this._XMLHttpRequestSupported = true;
                    }
                    else if (typeof XDomainRequest !== "undefined") {
                        this._sender = this._xdrSender; // IE 8 and 9
                    }
                }
            }
        };
        Sender.prototype.processTelemetry = function (telemetryItem) {
            var _this = this;
            try {
                // if master off switch is set, don't send any data
                if (this._config.disableTelemetry()) {
                    // Do not send/save data
                    return;
                }
                // validate input
                if (!telemetryItem) {
                    this._logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.CannotSendEmptyTelemetry, "Cannot send empty telemetry");
                    return;
                }
                // validate event
                if (telemetryItem.baseData && !telemetryItem.baseType) {
                    this._logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.InvalidEvent, "Cannot send telemetry without baseData and baseType");
                    return;
                }
                if (!telemetryItem.baseType) {
                    // Default
                    telemetryItem.baseType = "EventData";
                }
                // ensure a sender was constructed
                if (!this._sender) {
                    this._logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.SenderNotInitialized, "Sender was not initialized");
                    return;
                }
                // check if this item should be sampled in, else add sampleRate tag
                if (!this._isSampledIn(telemetryItem)) {
                    // Item is sampled out, do not send it
                    this._logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.TelemetrySampledAndNotSent, "Telemetry item was sampled out and not sent", { SampleRate: this._sample.sampleRate });
                    return;
                }
                else {
                    telemetryItem[SampleRate] = this._sample.sampleRate;
                }
                // construct an envelope that Application Insights endpoint can understand
                var aiEnvelope_1 = Sender.constructEnvelope(telemetryItem, this._config.instrumentationKey(), this._logger);
                if (!aiEnvelope_1) {
                    this._logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.CreateEnvelopeError, "Unable to create an AppInsights envelope");
                    return;
                }
                var doNotSendItem_1 = false;
                // this is for running in legacy mode, where customer may already have a custom initializer present
                if (telemetryItem.tags && telemetryItem.tags[ProcessLegacy]) {
                    CoreUtils.arrForEach(telemetryItem.tags[ProcessLegacy], function (callBack) {
                        try {
                            if (callBack && callBack(aiEnvelope_1) === false) {
                                doNotSendItem_1 = true;
                                _this._logger.warnToConsole("Telemetry processor check returns false");
                            }
                        }
                        catch (e) {
                            // log error but dont stop executing rest of the telemetry initializers
                            // doNotSendItem = true;
                            _this._logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.TelemetryInitializerFailed, "One of telemetry initializers failed, telemetry item will not be sent: " + Util.getExceptionName(e), { exception: Util.dump(e) }, true);
                        }
                    });
                    delete telemetryItem.tags[ProcessLegacy];
                }
                if (doNotSendItem_1) {
                    return; // do not send, no need to execute next plugin
                }
                // check if the incoming payload is too large, truncate if necessary
                var payload = this._serializer.serialize(aiEnvelope_1);
                // flush if we would exceed the max-size limit by adding this item
                var bufferPayload = this._buffer.getItems();
                var batch = this._buffer.batchPayloads(bufferPayload);
                if (batch && (batch.length + payload.length > this._config.maxBatchSizeInBytes())) {
                    this.triggerSend();
                }
                // enqueue the payload
                this._buffer.enqueue(payload);
                // ensure an invocation timeout is set
                this._setupTimer();
            }
            catch (e) {
                this._logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.FailedAddingTelemetryToBuffer, "Failed adding telemetry to the sender's buffer, some telemetry will be lost: " + Util.getExceptionName(e), { exception: Util.dump(e) });
            }
            // hand off the telemetry item to the next plugin
            if (!CoreUtils.isNullOrUndefined(this._nextPlugin)) {
                this._nextPlugin.processTelemetry(telemetryItem);
            }
        };
        Sender.prototype.setNextPlugin = function (next) {
            this._nextPlugin = next;
        };
        /**
         * xhr state changes
         */
        Sender.prototype._xhrReadyStateChange = function (xhr, payload, countOfItemsInPayload) {
            if (xhr.readyState === 4) {
                var response = null;
                if (!this._appId) {
                    response = this._parseResponse(xhr.responseText || xhr.response);
                    if (response && response.appId) {
                        this._appId = response.appId;
                    }
                }
                if ((xhr.status < 200 || xhr.status >= 300) && xhr.status !== 0) {
                    if (!this._config.isRetryDisabled() && this._isRetriable(xhr.status)) {
                        this._resendPayload(payload);
                        this._logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.TransmissionFailed, ". " +
                            "Response code " + xhr.status + ". Will retry to send " + payload.length + " items.");
                    }
                    else {
                        this._onError(payload, this._formatErrorMessageXhr(xhr));
                    }
                }
                else if (Offline.isOffline()) {
                    // Note: Don't check for staus == 0, since adblock gives this code
                    if (!this._config.isRetryDisabled()) {
                        var offlineBackOffMultiplier = 10; // arbritrary number
                        this._resendPayload(payload, offlineBackOffMultiplier);
                        this._logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.TransmissionFailed, ". Offline - Response Code: " + xhr.status + ". Offline status: " + Offline.isOffline() + ". Will retry to send " + payload.length + " items.");
                    }
                }
                else {
                    if (xhr.status === 206) {
                        if (!response) {
                            response = this._parseResponse(xhr.responseText || xhr.response);
                        }
                        if (response && !this._config.isRetryDisabled()) {
                            this._onPartialSuccess(payload, response);
                        }
                        else {
                            this._onError(payload, this._formatErrorMessageXhr(xhr));
                        }
                    }
                    else {
                        this._consecutiveErrors = 0;
                        this._onSuccess(payload, countOfItemsInPayload);
                    }
                }
            }
        };
        /**
         * Immediately send buffered data
         * @param async {boolean} - Indicates if the events should be sent asynchronously
         * @param forcedSender {SenderFunction} - Indicates the forcedSender, undefined if not passed
         */
        Sender.prototype.triggerSend = function (async, forcedSender) {
            if (async === void 0) { async = true; }
            try {
                // Send data only if disableTelemetry is false
                if (!this._config.disableTelemetry()) {
                    if (this._buffer.count() > 0) {
                        var payload = this._buffer.getItems();
                        // invoke send
                        if (forcedSender) {
                            forcedSender.call(this, payload, async);
                        }
                        else {
                            this._sender(payload, async);
                        }
                    }
                    // update lastSend time to enable throttling
                    this._lastSend = +new Date;
                }
                else {
                    this._buffer.clear();
                }
                clearTimeout(this._timeoutHandle);
                this._timeoutHandle = null;
                this._retryAt = null;
            }
            catch (e) {
                /* Ignore this error for IE under v10 */
                if (!Util.getIEVersion() || Util.getIEVersion() > 9) {
                    this._logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.TransmissionFailed, "Telemetry transmission failed, some telemetry will be lost: " + Util.getExceptionName(e), { exception: Util.dump(e) });
                }
            }
        };
        /**
         * error handler
         */
        Sender.prototype._onError = function (payload, message, event) {
            this._logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.OnError, "Failed to send telemetry.", { message: message });
            this._buffer.clearSent(payload);
        };
        /**
         * partial success handler
         */
        Sender.prototype._onPartialSuccess = function (payload, results) {
            var failed = [];
            var retry = [];
            // Iterate through the reversed array of errors so that splicing doesn't have invalid indexes after the first item.
            var errors = results.errors.reverse();
            for (var _i = 0, errors_1 = errors; _i < errors_1.length; _i++) {
                var error = errors_1[_i];
                var extracted = payload.splice(error.index, 1)[0];
                if (this._isRetriable(error.statusCode)) {
                    retry.push(extracted);
                }
                else {
                    // All other errors, including: 402 (Monthly quota exceeded) and 439 (Too many requests and refresh cache).
                    failed.push(extracted);
                }
            }
            if (payload.length > 0) {
                this._onSuccess(payload, results.itemsAccepted);
            }
            if (failed.length > 0) {
                this._onError(failed, this._formatErrorMessageXhr(null, ['partial success', results.itemsAccepted, 'of', results.itemsReceived].join(' ')));
            }
            if (retry.length > 0) {
                this._resendPayload(retry);
                this._logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.TransmissionFailed, "Partial success. " +
                    "Delivered: " + payload.length + ", Failed: " + failed.length +
                    ". Will retry to send " + retry.length + " our of " + results.itemsReceived + " items");
            }
        };
        /**
         * success handler
         */
        Sender.prototype._onSuccess = function (payload, countOfItemsInPayload) {
            this._buffer.clearSent(payload);
        };
        /**
         * xdr state changes
         */
        Sender.prototype._xdrOnLoad = function (xdr, payload) {
            if (xdr && (xdr.responseText + "" === "200" || xdr.responseText === "")) {
                this._consecutiveErrors = 0;
                this._onSuccess(payload, 0);
            }
            else {
                var results = this._parseResponse(xdr.responseText);
                if (results && results.itemsReceived && results.itemsReceived > results.itemsAccepted
                    && !this._config.isRetryDisabled()) {
                    this._onPartialSuccess(payload, results);
                }
                else {
                    this._onError(payload, this._formatErrorMessageXdr(xdr));
                }
            }
        };
        Sender.prototype._isSampledIn = function (envelope) {
            return this._sample.isSampledIn(envelope);
        };
        /**
         * Send Beacon API request
         * @param payload {string} - The data payload to be sent.
         * @param isAsync {boolean} - not used
         * Note: Beacon API does not support custom headers and we are not able to get
         * appId from the backend for the correct correlation.
         */
        Sender.prototype._beaconSender = function (payload, isAsync) {
            var url = this._config.endpointUrl();
            var batch = this._buffer.batchPayloads(payload);
            // Chrome only allows CORS-safelisted values for the sendBeacon data argument
            // see: https://bugs.chromium.org/p/chromium/issues/detail?id=720283
            var plainTextBatch = new Blob([batch], { type: 'text/plain;charset=UTF-8' });
            // The sendBeacon method returns true if the user agent is able to successfully queue the data for transfer. Otherwise it returns false.
            var queued = navigator.sendBeacon(url, plainTextBatch);
            if (queued) {
                this._buffer.markAsSent(payload);
                // no response from beaconSender, clear buffer
                this._onSuccess(payload, payload.length);
            }
            else {
                this._xhrSender(payload, true);
                this._logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.TransmissionFailed, ". " + "Failed to send telemetry with Beacon API, retried with xhrSender.");
            }
        };
        /**
         * Send XMLHttpRequest
         * @param payload {string} - The data payload to be sent.
         * @param isAsync {boolean} - Indicates if the request should be sent asynchronously
         */
        Sender.prototype._xhrSender = function (payload, isAsync) {
            var _this = this;
            var xhr = new XMLHttpRequest();
            xhr[DisabledPropertyName] = true;
            xhr.open("POST", this._config.endpointUrl(), isAsync);
            xhr.setRequestHeader("Content-type", "application/json");
            // append Sdk-Context request header only in case of breeze endpoint
            if (Util.isInternalApplicationInsightsEndpoint(this._config.endpointUrl())) {
                xhr.setRequestHeader(RequestHeaders.sdkContextHeader, RequestHeaders.sdkContextHeaderAppIdRequest);
            }
            xhr.onreadystatechange = function () { return _this._xhrReadyStateChange(xhr, payload, payload.length); };
            xhr.onerror = function (event) { return _this._onError(payload, _this._formatErrorMessageXhr(xhr), event); };
            // compose an array of payloads
            var batch = this._buffer.batchPayloads(payload);
            xhr.send(batch);
            this._buffer.markAsSent(payload);
        };
        /**
         * Parses the response from the backend.
         * @param response - XMLHttpRequest or XDomainRequest response
         */
        Sender.prototype._parseResponse = function (response) {
            try {
                if (response && response !== "") {
                    var result = JSON.parse(response);
                    if (result && result.itemsReceived && result.itemsReceived >= result.itemsAccepted &&
                        result.itemsReceived - result.itemsAccepted === result.errors.length) {
                        return result;
                    }
                }
            }
            catch (e) {
                this._logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.InvalidBackendResponse, "Cannot parse the response. " + Util.getExceptionName(e), {
                    response: response
                });
            }
            return null;
        };
        /**
         * Resend payload. Adds payload back to the send buffer and setup a send timer (with exponential backoff).
         * @param payload
         */
        Sender.prototype._resendPayload = function (payload, linearFactor) {
            if (linearFactor === void 0) { linearFactor = 1; }
            if (!payload || payload.length === 0) {
                return;
            }
            this._buffer.clearSent(payload);
            this._consecutiveErrors++;
            for (var _i = 0, payload_1 = payload; _i < payload_1.length; _i++) {
                var item = payload_1[_i];
                this._buffer.enqueue(item);
            }
            // setup timer
            this._setRetryTime(linearFactor);
            this._setupTimer();
        };
        /**
         * Calculates the time to wait before retrying in case of an error based on
         * http://en.wikipedia.org/wiki/Exponential_backoff
         */
        Sender.prototype._setRetryTime = function (linearFactor) {
            var SlotDelayInSeconds = 10;
            var delayInSeconds;
            if (this._consecutiveErrors <= 1) {
                delayInSeconds = SlotDelayInSeconds;
            }
            else {
                var backOffSlot = (Math.pow(2, this._consecutiveErrors) - 1) / 2;
                // tslint:disable-next-line:insecure-random
                var backOffDelay = Math.floor(Math.random() * backOffSlot * SlotDelayInSeconds) + 1;
                backOffDelay = linearFactor * backOffDelay;
                delayInSeconds = Math.max(Math.min(backOffDelay, 3600), SlotDelayInSeconds);
            }
            // TODO: Log the backoff time like the C# version does.
            var retryAfterTimeSpan = Date.now() + (delayInSeconds * 1000);
            // TODO: Log the retry at time like the C# version does.
            this._retryAt = retryAfterTimeSpan;
        };
        /**
         * Sets up the timer which triggers actually sending the data.
         */
        Sender.prototype._setupTimer = function () {
            var _this = this;
            if (!this._timeoutHandle) {
                var retryInterval = this._retryAt ? Math.max(0, this._retryAt - Date.now()) : 0;
                var timerValue = Math.max(this._config.maxBatchInterval(), retryInterval);
                this._timeoutHandle = setTimeout(function () {
                    _this.triggerSend();
                }, timerValue);
            }
        };
        /**
         * Checks if the SDK should resend the payload after receiving this status code from the backend.
         * @param statusCode
         */
        Sender.prototype._isRetriable = function (statusCode) {
            return statusCode === 408 // Timeout
                || statusCode === 429 // Too many requests.
                || statusCode === 500 // Internal server error.
                || statusCode === 503; // Service unavailable.
        };
        Sender.prototype._formatErrorMessageXhr = function (xhr, message) {
            if (xhr) {
                return "XMLHttpRequest,Status:" + xhr.status + ",Response:" + xhr.responseText || xhr.response || "";
            }
            return message;
        };
        /**
         * Send XDomainRequest
         * @param payload {string} - The data payload to be sent.
         * @param isAsync {boolean} - Indicates if the request should be sent asynchronously
         *
         * Note: XDomainRequest does not support sync requests. This 'isAsync' parameter is added
         * to maintain consistency with the xhrSender's contract
         * Note: XDomainRequest does not support custom headers and we are not able to get
         * appId from the backend for the correct correlation.
         */
        Sender.prototype._xdrSender = function (payload, isAsync) {
            var _this = this;
            var xdr = new XDomainRequest();
            xdr.onload = function () { return _this._xdrOnLoad(xdr, payload); };
            xdr.onerror = function (event) { return _this._onError(payload, _this._formatErrorMessageXdr(xdr), event); };
            // XDomainRequest requires the same protocol as the hosting page.
            // If the protocol doesn't match, we can't send the telemetry :(.
            var hostingProtocol = typeof window === "object" && window.location && window.location.protocol || "";
            if (this._config.endpointUrl().lastIndexOf(hostingProtocol, 0) !== 0) {
                this._logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.TransmissionFailed, ". " +
                    "Cannot send XDomain request. The endpoint URL protocol doesn't match the hosting page protocol.");
                this._buffer.clear();
                return;
            }
            var endpointUrl = this._config.endpointUrl().replace(/^(https?:)/, "");
            xdr.open('POST', endpointUrl);
            // compose an array of payloads
            var batch = this._buffer.batchPayloads(payload);
            xdr.send(batch);
            this._buffer.markAsSent(payload);
        };
        Sender.prototype._formatErrorMessageXdr = function (xdr, message) {
            if (xdr) {
                return "XDomainRequest,Response:" + xdr.responseText || "";
            }
            return message;
        };
        return Sender;
    }());

    var Session = /** @class */ (function () {
        function Session() {
        }
        return Session;
    }());
    var _SessionManager = /** @class */ (function () {
        function _SessionManager(config, logger) {
            var _this = this;
            if (CoreUtils.isNullOrUndefined(logger)) {
                this._logger = new DiagnosticLogger();
            }
            else {
                this._logger = logger;
            }
            if (!config) {
                config = {};
            }
            if (!(typeof config.sessionExpirationMs === "function")) {
                config.sessionExpirationMs = function () { return _SessionManager.acquisitionSpan; };
            }
            if (!(typeof config.sessionRenewalMs === "function")) {
                config.sessionRenewalMs = function () { return _SessionManager.renewalSpan; };
            }
            this.config = config;
            this._storageNamePrefix = function () { return _this.config.namePrefix && _this.config.namePrefix() ? _SessionManager.cookieNameConst + _this.config.namePrefix() : _SessionManager.cookieNameConst; };
            this.automaticSession = new Session();
        }
        _SessionManager.prototype.update = function () {
            if (!this.automaticSession.id) {
                this.initializeAutomaticSession();
            }
            var now = DateTimeUtils.Now();
            var acquisitionExpired = this.config.sessionExpirationMs() === 0 ? false : now - this.automaticSession.acquisitionDate > this.config.sessionExpirationMs();
            var renewalExpired = this.config.sessionExpirationMs() === 0 ? false : now - this.automaticSession.renewalDate > this.config.sessionRenewalMs();
            // renew if acquisitionSpan or renewalSpan has ellapsed
            if (acquisitionExpired || renewalExpired) {
                // update automaticSession so session state has correct id
                this.renew();
            }
            else {
                // do not update the cookie more often than cookieUpdateInterval
                if (!this.cookieUpdatedTimestamp || now - this.cookieUpdatedTimestamp > _SessionManager.cookieUpdateInterval) {
                    this.automaticSession.renewalDate = now;
                    this.setCookie(this.automaticSession.id, this.automaticSession.acquisitionDate, this.automaticSession.renewalDate);
                }
            }
        };
        /**
         *  Record the current state of the automatic session and store it in our cookie string format
         *  into the browser's local storage. This is used to restore the session data when the cookie
         *  expires.
         */
        _SessionManager.prototype.backup = function () {
            this.setStorage(this.automaticSession.id, this.automaticSession.acquisitionDate, this.automaticSession.renewalDate);
        };
        /**
         *  Use config.namePrefix + ai_session cookie data or local storage data (when the cookie is unavailable) to
         *  initialize the automatic session.
         */
        _SessionManager.prototype.initializeAutomaticSession = function () {
            var cookie = Util.getCookie(this._logger, this._storageNamePrefix());
            if (cookie && typeof cookie.split === "function") {
                this.initializeAutomaticSessionWithData(cookie);
            }
            else {
                // There's no cookie, but we might have session data in local storage
                // This can happen if the session expired or the user actively deleted the cookie
                // We only want to recover data if the cookie is missing from expiry. We should respect the user's wishes if the cookie was deleted actively.
                // The User class handles this for us and deletes our local storage object if the persistent user cookie was removed.
                var storage = Util.getStorage(this._logger, this._storageNamePrefix());
                if (storage) {
                    this.initializeAutomaticSessionWithData(storage);
                }
            }
            if (!this.automaticSession.id) {
                this.renew();
            }
        };
        /**
         *  Extract id, aquisitionDate, and renewalDate from an ai_session payload string and
         *  use this data to initialize automaticSession.
         *
         *  @param {string} sessionData - The string stored in an ai_session cookie or local storage backup
         */
        _SessionManager.prototype.initializeAutomaticSessionWithData = function (sessionData) {
            var params = sessionData.split("|");
            if (params.length > 0) {
                this.automaticSession.id = params[0];
            }
            try {
                if (params.length > 1) {
                    var acq = +params[1];
                    this.automaticSession.acquisitionDate = +new Date(acq);
                    this.automaticSession.acquisitionDate = this.automaticSession.acquisitionDate > 0 ? this.automaticSession.acquisitionDate : 0;
                }
                if (params.length > 2) {
                    var renewal = +params[2];
                    this.automaticSession.renewalDate = +new Date(renewal);
                    this.automaticSession.renewalDate = this.automaticSession.renewalDate > 0 ? this.automaticSession.renewalDate : 0;
                }
            }
            catch (e) {
                this._logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.ErrorParsingAISessionCookie, "Error parsing ai_session cookie, session will be reset: " + Util.getExceptionName(e), { exception: Util.dump(e) });
            }
            if (this.automaticSession.renewalDate === 0) {
                this._logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.SessionRenewalDateIsZero, "AI session renewal date is 0, session will be reset.");
            }
        };
        _SessionManager.prototype.renew = function () {
            var now = DateTimeUtils.Now();
            this.automaticSession.id = Util.newId();
            this.automaticSession.acquisitionDate = now;
            this.automaticSession.renewalDate = now;
            this.setCookie(this.automaticSession.id, this.automaticSession.acquisitionDate, this.automaticSession.renewalDate);
            // If this browser does not support local storage, fire an internal log to keep track of it at this point
            if (!Util.canUseLocalStorage()) {
                this._logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.BrowserDoesNotSupportLocalStorage, "Browser does not support local storage. Session durations will be inaccurate.");
            }
        };
        _SessionManager.prototype.setCookie = function (guid, acq, renewal) {
            // Set cookie to expire after the session expiry time passes or the session renewal deadline, whichever is sooner
            // Expiring the cookie will cause the session to expire even if the user isn't on the page
            var acquisitionExpiry = acq + this.config.sessionExpirationMs();
            var renewalExpiry = renewal + this.config.sessionRenewalMs();
            var cookieExpiry = new Date();
            var cookie = [guid, acq, renewal];
            if (acquisitionExpiry < renewalExpiry) {
                cookieExpiry.setTime(acquisitionExpiry);
            }
            else {
                cookieExpiry.setTime(renewalExpiry);
            }
            var cookieDomnain = this.config.cookieDomain ? this.config.cookieDomain() : null;
            // if sessionExpirationMs is set to 0, it means the expiry is set to 0 for this session cookie
            // A cookie with 0 expiry in the session cookie will never expire for that browser session.  If the browser is closed the cookie expires.  
            // Another browser instance does not inherit this cookie.
            var UTCString = this.config.sessionExpirationMs() === 0 ? '0' : cookieExpiry.toUTCString();
            Util.setCookie(this._logger, this._storageNamePrefix(), cookie.join('|') + ';expires=' + UTCString, cookieDomnain);
            this.cookieUpdatedTimestamp = DateTimeUtils.Now();
        };
        _SessionManager.prototype.setStorage = function (guid, acq, renewal) {
            // Keep data in local storage to retain the last session id, allowing us to cleanly end the session when it expires
            // Browsers that don't support local storage won't be able to end sessions cleanly from the client
            // The server will notice this and end the sessions itself, with loss of accurate session duration
            Util.setStorage(this._logger, this._storageNamePrefix(), [guid, acq, renewal].join('|'));
        };
        _SessionManager.acquisitionSpan = 86400000; // 24 hours in ms
        _SessionManager.renewalSpan = 1800000; // 30 minutes in ms
        _SessionManager.cookieUpdateInterval = 60000; // 1 minute in ms
        _SessionManager.cookieNameConst = 'ai_session';
        return _SessionManager;
    }());

    var Application = /** @class */ (function () {
        function Application() {
        }
        return Application;
    }());

    var Device = /** @class */ (function () {
        /**
         * Constructs a new instance of the Device class
         */
        function Device() {
            // don't attempt to fingerprint browsers
            this.id = "browser";
            // Device type is a dimension in our data platform
            // Setting it to 'Browser' allows to separate client and server dependencies/exceptions
            this.deviceClass = "Browser";
        }
        return Device;
    }());

    var Version = "2.3.1";
    var Internal = /** @class */ (function () {
        /**
         * Constructs a new instance of the internal telemetry data class.
         */
        function Internal(config) {
            this.sdkVersion = (config.sdkExtension && config.sdkExtension() ? config.sdkExtension() + "_" : "") + "javascript:" + Version;
        }
        return Internal;
    }());

    var User = /** @class */ (function () {
        function User(config, logger) {
            this.isNewUser = false;
            this._logger = logger;
            // get userId or create new one if none exists
            var cookie = Util.getCookie(this._logger, User.userCookieName);
            if (cookie) {
                this.isNewUser = false;
                var params = cookie.split(User.cookieSeparator);
                if (params.length > 0) {
                    this.id = params[0];
                }
            }
            this.config = config;
            if (!this.id) {
                this.id = Util.newId();
                var date = new Date();
                var acqStr = CoreUtils.toISOString(date);
                this.accountAcquisitionDate = acqStr;
                this.isNewUser = true;
                // without expiration, cookies expire at the end of the session
                // set it to 365 days from now
                // 365 * 24 * 60 * 60 * 1000 = 31536000000 
                date.setTime(date.getTime() + 31536000000);
                var newCookie = [this.id, acqStr];
                var cookieDomain = this.config.cookieDomain ? this.config.cookieDomain() : undefined;
                Util.setCookie(this._logger, User.userCookieName, newCookie.join(User.cookieSeparator) + ';expires=' + date.toUTCString(), cookieDomain);
                // If we have an config.namePrefix() + ai_session in local storage this means the user actively removed our cookies.
                // We should respect their wishes and clear ourselves from local storage
                var name_1 = config.namePrefix && config.namePrefix() ? config.namePrefix() + 'ai_session' : 'ai_session';
                Util.removeStorage(this._logger, name_1);
            }
            // We still take the account id from the ctor param for backward compatibility. 
            // But if the the customer set the accountId through the newer setAuthenticatedUserContext API, we will override it.
            this.accountId = config.accountId ? config.accountId() : undefined;
            // Get the auth user id and account id from the cookie if exists
            // Cookie is in the pattern: <authenticatedId>|<accountId>
            var authCookie = Util.getCookie(this._logger, User.authUserCookieName);
            if (authCookie) {
                authCookie = decodeURI(authCookie);
                var authCookieString = authCookie.split(User.cookieSeparator);
                if (authCookieString[0]) {
                    this.authenticatedId = authCookieString[0];
                }
                if (authCookieString.length > 1 && authCookieString[1]) {
                    this.accountId = authCookieString[1];
                }
            }
        }
        /**
         * Sets the authenticated user id and the account id in this session.
         *
         * @param authenticatedUserId {string} - The authenticated user id. A unique and persistent string that represents each authenticated user in the service.
         * @param accountId {string} - An optional string to represent the account associated with the authenticated user.
         */
        User.prototype.setAuthenticatedUserContext = function (authenticatedUserId, accountId, storeInCookie) {
            if (storeInCookie === void 0) { storeInCookie = false; }
            // Validate inputs to ensure no cookie control characters.
            var isInvalidInput = !this.validateUserInput(authenticatedUserId) || (accountId && !this.validateUserInput(accountId));
            if (isInvalidInput) {
                this._logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.SetAuthContextFailedAccountName, "Setting auth user context failed. " +
                    "User auth/account id should be of type string, and not contain commas, semi-colons, equal signs, spaces, or vertical-bars.", true);
                return;
            }
            // Create cookie string.
            this.authenticatedId = authenticatedUserId;
            var authCookie = this.authenticatedId;
            if (accountId) {
                this.accountId = accountId;
                authCookie = [this.authenticatedId, this.accountId].join(User.cookieSeparator);
            }
            if (storeInCookie) {
                // Set the cookie. No expiration date because this is a session cookie (expires when browser closed).
                // Encoding the cookie to handle unexpected unicode characters.
                Util.setCookie(this._logger, User.authUserCookieName, encodeURI(authCookie), this.config.cookieDomain());
            }
        };
        /**
         * Clears the authenticated user id and the account id from the user context.
         * @returns {}
         */
        User.prototype.clearAuthenticatedUserContext = function () {
            this.authenticatedId = null;
            this.accountId = null;
            Util.deleteCookie(this._logger, User.authUserCookieName);
        };
        User.prototype.validateUserInput = function (id) {
            // Validate:
            // 1. Id is a non-empty string.
            // 2. It does not contain special characters for cookies.
            if (typeof id !== 'string' ||
                !id ||
                id.match(/,|;|=| |\|/)) {
                return false;
            }
            return true;
        };
        User.cookieSeparator = '|';
        User.userCookieName = 'ai_user';
        User.authUserCookieName = 'ai_authUser';
        return User;
    }());

    var Location = /** @class */ (function () {
        function Location() {
        }
        return Location;
    }());

    var TelemetryTrace = /** @class */ (function () {
        function TelemetryTrace(id, parentId, name) {
            this.traceID = id || Util.generateW3CId();
            this.parentID = parentId;
            this.name = name;
            if (!name && window && window.location && window.location.pathname) {
                this.name = window.location.pathname;
            }
        }
        return TelemetryTrace;
    }());

    /**
     * PropertiesPlugin.ts
     * @copyright Microsoft 2018
     */
    var TelemetryContext = /** @class */ (function () {
        function TelemetryContext(logger, defaultConfig) {
            if (typeof window !== 'undefined') {
                this.sessionManager = new _SessionManager(defaultConfig, logger);
                this.application = new Application();
                this.device = new Device();
                this.internal = new Internal(defaultConfig);
                this.location = new Location();
                this.user = new User(defaultConfig, logger);
                this.telemetryTrace = new TelemetryTrace();
                this.session = new Session();
            }
            this.appId = function () { return null; };
        }
        TelemetryContext.prototype.applySessionContext = function (event) {
            var sessionContext = this.session || this.sessionManager.automaticSession;
            if (sessionContext) {
                if (typeof sessionContext.id === "string") {
                    event.ext.app.sesId = sessionContext.id;
                }
            }
            if (this.session) {
                // If customer set session info, apply his context; otherwise apply context automatically generated
                if (typeof this.session.id === "string") {
                    event.ext.app.sesId = this.session.id;
                }
                else {
                    event.ext.app.sesId = this.sessionManager.automaticSession.id;
                }
            }
        };
        TelemetryContext.prototype.applyOperatingSystemContxt = function (event) {
            if (this.os && this.os.name) {
                event.ext.os = this.os;
            }
        };
        TelemetryContext.prototype.applyApplicationContext = function (event) {
            if (this.application) {
                if (typeof this.application.ver === "string") {
                    event.tags[CtxTagKeys.applicationVersion] = this.application.ver;
                }
                if (typeof this.application.build === "string") {
                    event.tags[CtxTagKeys.applicationBuild] = this.application.build;
                }
            }
        };
        TelemetryContext.prototype.applyDeviceContext = function (event) {
            if (this.device) {
                if (typeof this.device.id === "string") {
                    event.ext.device.localId = this.device.id;
                }
                if (typeof this.device.ip === "string") {
                    event.ext.device.ip = this.device.ip;
                }
                if (typeof this.device.model === "string") {
                    event.ext.device.model = this.device.model;
                }
                if (typeof this.device.deviceClass === "string") {
                    event.ext.device.deviceClass = this.device.deviceClass;
                }
            }
        };
        TelemetryContext.prototype.applyInternalContext = function (event) {
            if (this.internal) {
                if (typeof this.internal.agentVersion === "string") {
                    event.tags[CtxTagKeys.internalAgentVersion] = this.internal.agentVersion; // not mapped in CS 4.0
                }
                if (typeof this.internal.sdkVersion === "string") {
                    event.tags[CtxTagKeys.internalSdkVersion] = this.internal.sdkVersion;
                }
            }
        };
        TelemetryContext.prototype.applyLocationContext = function (event) {
            if (this.location) {
                if (typeof this.location.ip === "string") {
                    event.tags[CtxTagKeys.locationIp] = this.location.ip;
                }
            }
        };
        TelemetryContext.prototype.applyOperationContext = function (event) {
            if (this.telemetryTrace) {
                var trace = event.ext.trace || { traceID: undefined, parentID: undefined };
                if (typeof this.telemetryTrace.traceID === "string") {
                    trace.traceID = this.telemetryTrace.traceID;
                }
                if (typeof this.telemetryTrace.name === "string") {
                    trace.name = this.telemetryTrace.name;
                }
                if (typeof this.telemetryTrace.parentID === "string") {
                    trace.parentID = this.telemetryTrace.parentID;
                }
                event.ext.trace = trace;
            }
        };
        TelemetryContext.prototype.applyWebContext = function (event) {
            if (this.web) {
                event.ext.web = event.ext.web || {};
                event.ext.web = this.web;
            }
        };
        TelemetryContext.prototype.applyUserContext = function (event) {
            if (this.user) {
                if (!event.tags) {
                    event.tags = [];
                }
                // stays in tags
                if (typeof this.user.accountId === "string") {
                    event.tags[CtxTagKeys.userAccountId] = this.user.accountId;
                }
                // CS 4.0
                if (typeof this.user.id === "string") {
                    event.ext.user.id = this.user.id;
                }
                if (typeof this.user.authenticatedId === "string") {
                    event.ext.user.authId = this.user.authenticatedId;
                }
            }
        };
        TelemetryContext.prototype.cleanUp = function (event) {
            if (event.ext[Extensions.DeviceExt] && CoreUtils.objKeys(event.ext[Extensions.DeviceExt]).length === 0) {
                delete event.ext[Extensions.DeviceExt];
            }
            if (event.ext[Extensions.UserExt] && CoreUtils.objKeys(event.ext[Extensions.UserExt]).length === 0) {
                delete event.ext[Extensions.UserExt];
            }
            if (event.ext[Extensions.WebExt] && CoreUtils.objKeys(event.ext[Extensions.WebExt]).length === 0) {
                delete event.ext[Extensions.WebExt];
            }
            if (event.ext[Extensions.OSExt] && CoreUtils.objKeys(event.ext[Extensions.OSExt]).length === 0) {
                delete event.ext[Extensions.OSExt];
            }
            if (event.ext[Extensions.AppExt] && CoreUtils.objKeys(event.ext[Extensions.AppExt]).length === 0) {
                delete event.ext[Extensions.AppExt];
            }
            if (event.ext[Extensions.TraceExt] && CoreUtils.objKeys(event.ext[Extensions.TraceExt]).length === 0) {
                delete event.ext[Extensions.TraceExt];
            }
        };
        return TelemetryContext;
    }());

    /**
     * PropertiesPlugin.ts
     * @copyright Microsoft 2018
     */
    var PropertiesPlugin = /** @class */ (function () {
        function PropertiesPlugin() {
            this.priority = 110;
            this.identifier = PropertiesPluginIdentifier;
        }
        PropertiesPlugin.getDefaultConfig = function () {
            var defaultConfig = {
                instrumentationKey: function () { return undefined; },
                accountId: function () { return null; },
                sessionRenewalMs: function () { return 30 * 60 * 1000; },
                samplingPercentage: function () { return 100; },
                sessionExpirationMs: function () { return 24 * 60 * 60 * 1000; },
                cookieDomain: function () { return null; },
                sdkExtension: function () { return null; },
                isBrowserLinkTrackingEnabled: function () { return false; },
                appId: function () { return null; },
                namePrefix: function () { return undefined; }
            };
            return defaultConfig;
        };
        PropertiesPlugin.prototype.initialize = function (config, core, extensions) {
            var _this = this;
            var defaultConfig = PropertiesPlugin.getDefaultConfig();
            this._extensionConfig = this._extensionConfig || PropertiesPlugin.getDefaultConfig();
            var _loop_1 = function (field) {
                this_1._extensionConfig[field] = function () { return ConfigurationManager.getConfig(config, field, _this.identifier, defaultConfig[field]()); };
            };
            var this_1 = this;
            for (var field in defaultConfig) {
                _loop_1(field);
            }
            this._logger = core.logger;
            this.context = new TelemetryContext(core.logger, this._extensionConfig);
            this._breezeChannel = Util.getExtension(extensions, BreezeChannelIdentifier);
            this.context.appId = function () { return _this._breezeChannel ? _this._breezeChannel["_appId"] : null; };
        };
        /**
         * Add Part A fields to the event
         * @param event The event that needs to be processed
         */
        PropertiesPlugin.prototype.processTelemetry = function (event) {
            if (CoreUtils.isNullOrUndefined(event)) ;
            else {
                // If the envelope is PageView, reset the internal message count so that we can send internal telemetry for the new page.
                if (event.name === PageView.envelopeType) {
                    this._logger.resetInternalMessageCount();
                }
                if (this.context.session) {
                    // If customer did not provide custom session id update the session manager
                    if (typeof this.context.session.id !== "string") {
                        this.context.sessionManager.update();
                    }
                }
                this._processTelemetryInternal(event);
                if (this.context && this.context.user && this.context.user.isNewUser) {
                    this.context.user.isNewUser = false;
                    var message = new _InternalLogMessage(_InternalMessageId.SendBrowserInfoOnUserInit, navigator.userAgent);
                    this._logger.logInternalMessage(LoggingSeverity.CRITICAL, message);
                }
                if (!CoreUtils.isNullOrUndefined(this._nextPlugin)) {
                    this._nextPlugin.processTelemetry(event);
                }
            }
        };
        /**
         * Sets the next plugin that comes after this plugin
         * @param nextPlugin The next plugin
         */
        PropertiesPlugin.prototype.setNextPlugin = function (nextPlugin) {
            this._nextPlugin = nextPlugin;
        };
        PropertiesPlugin.prototype._processTelemetryInternal = function (event) {
            // set part A  fields
            if (!event.tags) {
                event.tags = [];
            }
            if (!event.ext) {
                event.ext = {};
            }
            event.ext[Extensions.DeviceExt] = event.ext[Extensions.DeviceExt] || {};
            event.ext[Extensions.WebExt] = event.ext[Extensions.WebExt] || {};
            event.ext[Extensions.UserExt] = event.ext[Extensions.UserExt] || {};
            event.ext[Extensions.OSExt] = event.ext[Extensions.OSExt] || {};
            event.ext[Extensions.AppExt] = event.ext[Extensions.AppExt] || {};
            event.ext[Extensions.TraceExt] = event.ext[Extensions.TraceExt] || {};
            this.context.applySessionContext(event);
            this.context.applyApplicationContext(event);
            this.context.applyDeviceContext(event);
            this.context.applyOperationContext(event);
            this.context.applyUserContext(event);
            this.context.applyOperatingSystemContxt(event);
            this.context.applyWebContext(event);
            this.context.applyLocationContext(event); // legacy tags
            this.context.applyInternalContext(event); // legacy tags
            this.context.cleanUp(event);
        };
        return PropertiesPlugin;
    }());

    var XHRMonitoringState = /** @class */ (function () {
        function XHRMonitoringState() {
            this.openDone = false;
            this.setRequestHeaderDone = false;
            this.sendDone = false;
            this.abortDone = false;
            // <summary>True, if onreadyStateChangeCallback function attached to xhr, otherwise false</summary>
            this.onreadystatechangeCallbackAttached = false;
        }
        return XHRMonitoringState;
    }());
    var ajaxRecord = /** @class */ (function () {
        function ajaxRecord(traceID, spanID, logger) {
            this.completed = false;
            this.requestHeadersSize = null;
            this.requestHeaders = null;
            this.ttfb = null;
            this.responseReceivingDuration = null;
            this.callbackDuration = null;
            this.ajaxTotalDuration = null;
            this.aborted = null;
            this.pageUrl = null;
            this.requestUrl = null;
            this.requestSize = 0;
            this.method = null;
            /// <summary>Returns the HTTP status code.</summary>
            this.status = null;
            // <summary>The timestamp when open method was invoked</summary>
            this.requestSentTime = null;
            // <summary>The timestamps when first byte was received</summary>
            this.responseStartedTime = null;
            // <summary>The timestamp when last byte was received</summary>
            this.responseFinishedTime = null;
            // <summary>The timestamp when onreadystatechange callback in readyState 4 finished</summary>
            this.callbackFinishedTime = null;
            // <summary>The timestamp at which ajax was ended</summary>
            this.endTime = null;
            // <summary>The original xhr onreadystatechange event</summary>
            this.originalOnreadystatechage = null;
            this.xhrMonitoringState = new XHRMonitoringState();
            // <summary>Determines whether or not JavaScript exception occured in xhr.onreadystatechange code. 1 if occured, otherwise 0.</summary>
            this.clientFailure = 0;
            this.CalculateMetrics = function () {
                var self = this;
                // round to 3 decimal points
                self.ajaxTotalDuration = Math.round(DateTimeUtils.GetDuration(self.requestSentTime, self.responseFinishedTime) * 1000) / 1000;
            };
            this.traceID = traceID;
            this.spanID = spanID;
            this._logger = logger;
        }
        ajaxRecord.prototype.getAbsoluteUrl = function () {
            return this.requestUrl ? UrlHelper.getAbsoluteUrl(this.requestUrl) : null;
        };
        ajaxRecord.prototype.getPathName = function () {
            return this.requestUrl ? DataSanitizer.sanitizeUrl(this._logger, UrlHelper.getCompleteUrl(this.method, this.requestUrl)) : null;
        };
        return ajaxRecord;
    }());

    var EventHelper = /** @class */ (function () {
        function EventHelper() {
        }
        /// <summary>Binds the specified function to an event, so that the function gets called whenever the event fires on the object</summary>
        /// <param name="obj">Object to which </param>
        /// <param name="eventNameWithoutOn">String that specifies any of the standard DHTML Events without "on" prefix</param>
        /// <param name="handlerRef">Pointer that specifies the function to call when event fires</param>
        /// <returns>True if the function was bound successfully to the event, otherwise false</returns>
        EventHelper.AttachEvent = function (obj, eventNameWithoutOn, handlerRef) {
            var result = false;
            if (!CoreUtils.isNullOrUndefined(obj)) {
                if (!CoreUtils.isNullOrUndefined(obj.attachEvent)) {
                    // IE before version 9                    
                    obj.attachEvent("on" + eventNameWithoutOn, handlerRef);
                    result = true;
                }
                else {
                    if (!CoreUtils.isNullOrUndefined(obj.addEventListener)) {
                        // all browsers except IE before version 9
                        obj.addEventListener(eventNameWithoutOn, handlerRef, false);
                        result = true;
                    }
                }
            }
            return result;
        };
        EventHelper.DetachEvent = function (obj, eventNameWithoutOn, handlerRef) {
            if (!CoreUtils.isNullOrUndefined(obj)) {
                if (!CoreUtils.isNullOrUndefined(obj.detachEvent)) {
                    obj.detachEvent("on" + eventNameWithoutOn, handlerRef);
                }
                else {
                    if (!CoreUtils.isNullOrUndefined(obj.removeEventListener)) {
                        obj.removeEventListener(eventNameWithoutOn, handlerRef, false);
                    }
                }
            }
        };
        return EventHelper;
    }());

    var Traceparent = /** @class */ (function () {
        function Traceparent(traceId, spanId) {
            this.traceFlag = Traceparent.DEFAULT_TRACE_FLAG;
            this.version = Traceparent.DEFAULT_VERSION;
            if (traceId && Traceparent.isValidTraceId(traceId)) {
                this.traceId = traceId;
            }
            else {
                this.traceId = Util.generateW3CId();
            }
            if (spanId && Traceparent.isValidSpanId(spanId)) {
                this.spanId = spanId;
            }
            else {
                this.spanId = Util.generateW3CId().substr(0, 16);
            }
        }
        Traceparent.isValidTraceId = function (id) {
            return id.match(/^[0-9a-f]{32}$/) && id !== "00000000000000000000000000000000";
        };
        Traceparent.isValidSpanId = function (id) {
            return id.match(/^[0-9a-f]{16}$/) && id !== "0000000000000000";
        };
        Traceparent.prototype.toString = function () {
            return this.version + "-" + this.traceId + "-" + this.spanId + "-" + this.traceFlag;
        };
        Traceparent.DEFAULT_TRACE_FLAG = "01";
        Traceparent.DEFAULT_VERSION = "00";
        return Traceparent;
    }());

    var AjaxMonitor = /** @class */ (function () {
        function AjaxMonitor() {
            this.identifier = AjaxMonitor.identifier;
            this.priority = 120;
            this._trackAjaxAttempts = 0;
            this.currentWindowHost = typeof window === 'object' && window.location && window.location.host && window.location.host.toLowerCase();
            this.initialized = false;
            this._fetchInitialized = false;
        }
        AjaxMonitor.getDefaultConfig = function () {
            var config = {
                maxAjaxCallsPerView: 500,
                disableAjaxTracking: false,
                disableFetchTracking: true,
                disableCorrelationHeaders: false,
                distributedTracingMode: DistributedTracingModes.AI,
                correlationHeaderExcludedDomains: [
                    "*.blob.core.windows.net",
                    "*.blob.core.chinacloudapi.cn",
                    "*.blob.core.cloudapi.de",
                    "*.blob.core.usgovcloudapi.net"
                ],
                correlationHeaderDomains: undefined,
                appId: undefined,
                enableCorsCorrelation: false,
                enableRequestHeaderTracking: false,
                enableResponseHeaderTracking: false
            };
            return config;
        };
        AjaxMonitor.getEmptyConfig = function () {
            return {
                maxAjaxCallsPerView: undefined,
                disableAjaxTracking: undefined,
                disableFetchTracking: undefined,
                disableCorrelationHeaders: undefined,
                distributedTracingMode: undefined,
                correlationHeaderExcludedDomains: undefined,
                appId: undefined,
                enableCorsCorrelation: undefined,
                correlationHeaderDomains: undefined,
                enableRequestHeaderTracking: undefined,
                enableResponseHeaderTracking: undefined
            };
        };
        AjaxMonitor.getFailedAjaxDiagnosticsMessage = function (xhr) {
            var result = "";
            try {
                if (!CoreUtils.isNullOrUndefined(xhr) &&
                    !CoreUtils.isNullOrUndefined(xhr.ajaxData) &&
                    !CoreUtils.isNullOrUndefined(xhr.ajaxData.requestUrl)) {
                    result += "(url: '" + xhr.ajaxData.requestUrl + "')";
                }
            }
            catch (e) { }
            return result;
        };
        AjaxMonitor.prototype.trackDependencyData = function (dependency, properties) {
            this.trackDependencyDataInternal(dependency, properties);
        };
        AjaxMonitor.prototype.processTelemetry = function (item) {
            if (this._nextPlugin && this._nextPlugin.processTelemetry) {
                this._nextPlugin.processTelemetry(item);
            }
        };
        AjaxMonitor.prototype.setNextPlugin = function (next) {
            if (next) {
                this._nextPlugin = next;
            }
        };
        AjaxMonitor.prototype.includeCorrelationHeaders = function (ajaxData, input, init, xhr) {
            if (input) {
                if (CorrelationIdHelper.canIncludeCorrelationHeader(this._config, ajaxData.getAbsoluteUrl(), this.currentWindowHost)) {
                    if (!init) {
                        init = {};
                    }
                    // init headers override original request headers
                    // so, if they exist use only them, otherwise use request's because they should have been applied in the first place
                    // not using original request headers will result in them being lost
                    init.headers = new Headers(init.headers || (input instanceof Request ? (input.headers || {}) : {}));
                    if (this._isUsingAIHeaders) {
                        var id = "|" + ajaxData.traceID + "." + ajaxData.spanID;
                        init.headers.set(RequestHeaders.requestIdHeader, id);
                        if (this._config.enableRequestHeaderTracking) {
                            ajaxData.requestHeaders[RequestHeaders.requestIdHeader] = id;
                        }
                    }
                    var appId = this._config.appId || this._context.appId();
                    if (appId) {
                        init.headers.set(RequestHeaders.requestContextHeader, RequestHeaders.requestContextAppIdFormat + appId);
                        if (this._config.enableRequestHeaderTracking) {
                            ajaxData.requestHeaders[RequestHeaders.requestContextHeader] = RequestHeaders.requestContextAppIdFormat + appId;
                        }
                    }
                    if (this._isUsingW3CHeaders) {
                        var traceparent = new Traceparent(ajaxData.traceID, ajaxData.spanID);
                        init.headers.set(RequestHeaders.traceParentHeader, traceparent.toString());
                        if (this._config.enableRequestHeaderTracking) {
                            ajaxData.requestHeaders[RequestHeaders.traceParentHeader] = traceparent.toString();
                        }
                    }
                    return init;
                }
                return init;
            }
            else if (xhr) {
                if (this.currentWindowHost && CorrelationIdHelper.canIncludeCorrelationHeader(this._config, xhr.ajaxData.getAbsoluteUrl(), this.currentWindowHost)) {
                    if (this._isUsingAIHeaders) {
                        var id = "|" + xhr.ajaxData.traceID + "." + xhr.ajaxData.spanID;
                        xhr.setRequestHeader(RequestHeaders.requestIdHeader, id);
                        if (this._config.enableRequestHeaderTracking) {
                            xhr.ajaxData.requestHeaders[RequestHeaders.requestIdHeader] = id;
                        }
                    }
                    var appId = this._config.appId || this._context.appId();
                    if (appId) {
                        xhr.setRequestHeader(RequestHeaders.requestContextHeader, RequestHeaders.requestContextAppIdFormat + appId);
                        if (this._config.enableRequestHeaderTracking) {
                            xhr.ajaxData.requestHeaders[RequestHeaders.requestContextHeader] = RequestHeaders.requestContextAppIdFormat + appId;
                        }
                    }
                    if (this._isUsingW3CHeaders) {
                        var traceparent = new Traceparent(xhr.ajaxData.traceID, xhr.ajaxData.spanID);
                        xhr.setRequestHeader(RequestHeaders.traceParentHeader, traceparent.toString());
                        if (this._config.enableRequestHeaderTracking) {
                            xhr.ajaxData.requestHeaders[RequestHeaders.traceParentHeader] = traceparent.toString();
                        }
                    }
                }
                return xhr;
            }
            return undefined;
        };
        AjaxMonitor.prototype.initialize = function (config, core, extensions) {
            if (!this.initialized && !this._fetchInitialized) {
                this._core = core;
                var defaultConfig = AjaxMonitor.getDefaultConfig();
                this._config = AjaxMonitor.getEmptyConfig();
                for (var field in defaultConfig) {
                    this._config[field] = ConfigurationManager.getConfig(config, field, AjaxMonitor.identifier, defaultConfig[field]);
                }
                this._isUsingAIHeaders = this._config.distributedTracingMode === DistributedTracingModes.AI || this._config.distributedTracingMode === DistributedTracingModes.AI_AND_W3C;
                this._isUsingW3CHeaders = this._config.distributedTracingMode === DistributedTracingModes.AI_AND_W3C || this._config.distributedTracingMode === DistributedTracingModes.W3C;
                if (this._config.disableAjaxTracking === false) {
                    this.instrumentXhr();
                }
                if (this._config.disableFetchTracking === false) {
                    this.instrumentFetch();
                }
                if (extensions.length > 0 && extensions) {
                    var propExt = void 0, extIx = 0;
                    while (!propExt && extIx < extensions.length) {
                        if (extensions[extIx] && extensions[extIx].identifier === PropertiesPluginIdentifier) {
                            propExt = extensions[extIx];
                        }
                        extIx++;
                    }
                    if (propExt) {
                        this._context = propExt.context; // we could move IPropertiesPlugin to common as well
                    }
                }
            }
        };
        /**
         * Logs dependency call
         * @param dependencyData dependency data object
         */
        AjaxMonitor.prototype.trackDependencyDataInternal = function (dependency, properties, systemProperties) {
            if (this._config.maxAjaxCallsPerView === -1 || this._trackAjaxAttempts < this._config.maxAjaxCallsPerView) {
                var item = TelemetryItemCreator.create(dependency, RemoteDependencyData$1.dataType, RemoteDependencyData$1.envelopeType, this._core.logger, properties, systemProperties);
                this._core.track(item);
            }
            else if (this._trackAjaxAttempts === this._config.maxAjaxCallsPerView) {
                this._core.logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.MaxAjaxPerPVExceeded, "Maximum ajax per page view limit reached, ajax monitoring is paused until the next trackPageView(). In order to increase the limit set the maxAjaxCallsPerView configuration parameter.", true);
            }
            ++this._trackAjaxAttempts;
        };
        // Fetch Stuff
        AjaxMonitor.prototype.instrumentFetch = function () {
            if (!this.supportsFetch() || this._fetchInitialized) {
                return;
            }
            var originalFetch = window.fetch;
            var fetchMonitorInstance = this;
            window.fetch = function fetch(input, init) {
                var fetchData;
                if (fetchMonitorInstance.isFetchInstrumented(input) && fetchMonitorInstance.isMonitoredInstance(undefined, undefined, input, init)) {
                    try {
                        fetchData = fetchMonitorInstance.createFetchRecord(input, init);
                        init = fetchMonitorInstance.includeCorrelationHeaders(fetchData, input, init);
                    }
                    catch (e) {
                        fetchMonitorInstance._core.logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.FailedMonitorAjaxOpen, "Failed to monitor Window.fetch, monitoring data for this fetch call may be incorrect.", {
                            ajaxDiagnosticsMessage: this.getFailedFetchDiagnosticsMessage(input),
                            exception: Util.dump(e)
                        });
                    }
                }
                return originalFetch(input, init)
                    .then(function (response) {
                    fetchMonitorInstance.onFetchComplete(response, fetchData);
                    return response;
                })["catch"](function (reason) {
                    fetchMonitorInstance.onFetchFailed(input, fetchData, reason);
                    throw reason;
                });
            };
            this._fetchInitialized = true;
        };
        AjaxMonitor.prototype.instrumentXhr = function () {
            if (this.supportsAjaxMonitoring() && !this.initialized) {
                this.instrumentOpen();
                this.instrumentSend();
                this.instrumentAbort();
                this.instrumentSetRequestHeader();
                this.initialized = true;
            }
        };
        /// <summary>Verifies that particalar instance of XMLHttpRequest needs to be monitored</summary>
        /// <param name="excludeAjaxDataValidation">Optional parameter. True if ajaxData must be excluded from verification</param>
        /// <returns type="bool">True if instance needs to be monitored, otherwise false</returns>
        AjaxMonitor.prototype.isMonitoredInstance = function (xhr, excludeAjaxDataValidation, request, init) {
            var disabledProperty = false;
            var ajaxValidation = true;
            var initialized = false;
            if (typeof request !== 'undefined') {
                initialized = this._fetchInitialized;
                // Look for DisabledPropertyName in either Request or RequestInit
                disabledProperty = (typeof request === 'object' ? request[DisabledPropertyName] === true : false) ||
                    (init ? init[DisabledPropertyName] === true : false);
            }
            else if (typeof xhr !== 'undefined') {
                initialized = this.initialized;
                disabledProperty = xhr[DisabledPropertyName] === true;
                ajaxValidation = excludeAjaxDataValidation === true || !CoreUtils.isNullOrUndefined(xhr.ajaxData);
            }
            // checking to see that all interested functions on xhr were instrumented
            return initialized
                // checking on ajaxData to see that it was not removed in user code
                && ajaxValidation
                // check that this instance is not not used by ajax call performed inside client side monitoring to send data to collector
                && !disabledProperty;
        };
        /// <summary>Determines whether ajax monitoring can be enabled on this document</summary>
        /// <returns>True if Ajax monitoring is supported on this page, otherwise false</returns>
        AjaxMonitor.prototype.supportsAjaxMonitoring = function () {
            var result = true;
            if (typeof XMLHttpRequest === 'undefined' ||
                CoreUtils.isNullOrUndefined(XMLHttpRequest) ||
                CoreUtils.isNullOrUndefined(XMLHttpRequest.prototype) ||
                CoreUtils.isNullOrUndefined(XMLHttpRequest.prototype.open) ||
                CoreUtils.isNullOrUndefined(XMLHttpRequest.prototype.send) ||
                CoreUtils.isNullOrUndefined(XMLHttpRequest.prototype.abort)) {
                result = false;
            }
            // disable in IE8 or older (https://www.w3schools.com/jsref/jsref_trim_string.asp)
            try {
            }
            catch (ex) {
                result = false;
            }
            return result;
        };
        AjaxMonitor.prototype.instrumentOpen = function () {
            var originalOpen = XMLHttpRequest.prototype.open;
            var ajaxMonitorInstance = this;
            XMLHttpRequest.prototype.open = function (method, url, async) {
                try {
                    if (ajaxMonitorInstance.isMonitoredInstance(this, true) &&
                        (!this.ajaxData ||
                            !this.ajaxData.xhrMonitoringState.openDone)) {
                        ajaxMonitorInstance.openHandler(this, method, url, async);
                    }
                }
                catch (e) {
                    ajaxMonitorInstance._core.logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.FailedMonitorAjaxOpen, "Failed to monitor XMLHttpRequest.open, monitoring data for this ajax call may be incorrect.", {
                        ajaxDiagnosticsMessage: AjaxMonitor.getFailedAjaxDiagnosticsMessage(this),
                        exception: Util.dump(e)
                    });
                }
                return originalOpen.apply(this, arguments);
            };
        };
        AjaxMonitor.prototype.openHandler = function (xhr, method, url, async) {
            var traceID = (this._context && this._context.telemetryTrace && this._context.telemetryTrace.traceID) || Util.generateW3CId();
            var spanID = Util.generateW3CId().substr(0, 16);
            var ajaxData = new ajaxRecord(traceID, spanID, this._core.logger);
            ajaxData.method = method;
            ajaxData.requestUrl = url;
            ajaxData.xhrMonitoringState.openDone = true;
            ajaxData.requestHeaders = {};
            xhr.ajaxData = ajaxData;
            this.attachToOnReadyStateChange(xhr);
        };
        AjaxMonitor.prototype.instrumentSend = function () {
            var originalSend = XMLHttpRequest.prototype.send;
            var ajaxMonitorInstance = this;
            XMLHttpRequest.prototype.send = function (content) {
                try {
                    if (ajaxMonitorInstance.isMonitoredInstance(this) && !this.ajaxData.xhrMonitoringState.sendDone) {
                        ajaxMonitorInstance.sendHandler(this, content);
                    }
                }
                catch (e) {
                    ajaxMonitorInstance._core.logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.FailedMonitorAjaxSend, "Failed to monitor XMLHttpRequest, monitoring data for this ajax call may be incorrect.", {
                        ajaxDiagnosticsMessage: AjaxMonitor.getFailedAjaxDiagnosticsMessage(this),
                        exception: Util.dump(e)
                    });
                }
                return originalSend.apply(this, arguments);
            };
        };
        AjaxMonitor.prototype.sendHandler = function (xhr, content) {
            xhr.ajaxData.requestSentTime = DateTimeUtils.Now();
            xhr = this.includeCorrelationHeaders(xhr.ajaxData, undefined, undefined, xhr);
            xhr.ajaxData.xhrMonitoringState.sendDone = true;
        };
        AjaxMonitor.prototype.instrumentAbort = function () {
            var originalAbort = XMLHttpRequest.prototype.abort;
            var ajaxMonitorInstance = this;
            XMLHttpRequest.prototype.abort = function () {
                try {
                    if (ajaxMonitorInstance.isMonitoredInstance(this) && !this.ajaxData.xhrMonitoringState.abortDone) {
                        this.ajaxData.aborted = 1;
                        this.ajaxData.xhrMonitoringState.abortDone = true;
                    }
                }
                catch (e) {
                    ajaxMonitorInstance._core.logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.FailedMonitorAjaxAbort, "Failed to monitor XMLHttpRequest.abort, monitoring data for this ajax call may be incorrect.", {
                        ajaxDiagnosticsMessage: AjaxMonitor.getFailedAjaxDiagnosticsMessage(this),
                        exception: Util.dump(e)
                    });
                }
                return originalAbort.apply(this, arguments);
            };
        };
        AjaxMonitor.prototype.instrumentSetRequestHeader = function () {
            if (!this._config.enableRequestHeaderTracking) {
                return;
            }
            var originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
            var ajaxMonitorInstance = this;
            XMLHttpRequest.prototype.setRequestHeader = function (header, value) {
                try {
                    if (ajaxMonitorInstance.isMonitoredInstance(this)) {
                        this.ajaxData.requestHeaders[header] = value;
                    }
                }
                catch (e) {
                    ajaxMonitorInstance._core.logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.FailedMonitorAjaxSetRequestHeader, "Failed to monitor XMLHttpRequest.setRequestHeader, monitoring data for this ajax call may be incorrect.", {
                        ajaxDiagnosticsMessage: AjaxMonitor.getFailedAjaxDiagnosticsMessage(this),
                        exception: Util.dump(e)
                    });
                }
                return originalSetRequestHeader.apply(this, arguments);
            };
        };
        AjaxMonitor.prototype.attachToOnReadyStateChange = function (xhr) {
            var ajaxMonitorInstance = this;
            xhr.ajaxData.xhrMonitoringState.onreadystatechangeCallbackAttached = EventHelper.AttachEvent(xhr, "readystatechange", function () {
                try {
                    if (ajaxMonitorInstance.isMonitoredInstance(xhr)) {
                        if (xhr.readyState === 4) {
                            ajaxMonitorInstance.onAjaxComplete(xhr);
                        }
                    }
                }
                catch (e) {
                    var exceptionText = Util.dump(e);
                    // ignore messages with c00c023f, as this a known IE9 XHR abort issue
                    if (!exceptionText || exceptionText.toLowerCase().indexOf("c00c023f") === -1) {
                        ajaxMonitorInstance._core.logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.FailedMonitorAjaxRSC, "Failed to monitor XMLHttpRequest 'readystatechange' event handler, monitoring data for this ajax call may be incorrect.", {
                            ajaxDiagnosticsMessage: AjaxMonitor.getFailedAjaxDiagnosticsMessage(xhr),
                            exception: Util.dump(e)
                        });
                    }
                }
            });
        };
        AjaxMonitor.prototype.onAjaxComplete = function (xhr) {
            xhr.ajaxData.responseFinishedTime = DateTimeUtils.Now();
            xhr.ajaxData.status = xhr.status;
            xhr.ajaxData.CalculateMetrics();
            if (xhr.ajaxData.ajaxTotalDuration < 0) {
                this._core.logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.FailedMonitorAjaxDur, "Failed to calculate the duration of the ajax call, monitoring data for this ajax call won't be sent.", {
                    ajaxDiagnosticsMessage: AjaxMonitor.getFailedAjaxDiagnosticsMessage(xhr),
                    requestSentTime: xhr.ajaxData.requestSentTime,
                    responseFinishedTime: xhr.ajaxData.responseFinishedTime
                });
            }
            else {
                var dependency = {
                    id: "|" + xhr.ajaxData.traceID + "." + xhr.ajaxData.spanID,
                    target: xhr.ajaxData.getAbsoluteUrl(),
                    name: xhr.ajaxData.getPathName(),
                    type: "Ajax",
                    duration: xhr.ajaxData.ajaxTotalDuration,
                    success: (+(xhr.ajaxData.status)) >= 200 && (+(xhr.ajaxData.status)) < 400,
                    responseCode: +xhr.ajaxData.status,
                    method: xhr.ajaxData.method
                };
                // enrich dependency target with correlation context from the server
                var correlationContext = this.getAjaxCorrelationContext(xhr);
                if (correlationContext) {
                    dependency.correlationContext = /* dependency.target + " | " + */ correlationContext;
                }
                if (this._config.enableRequestHeaderTracking) {
                    if (CoreUtils.objKeys(xhr.ajaxData.requestHeaders).length > 0) {
                        dependency.properties = dependency.properties || {};
                        dependency.properties.requestHeaders = {};
                        dependency.properties.requestHeaders = xhr.ajaxData.requestHeaders;
                    }
                }
                if (this._config.enableResponseHeaderTracking) {
                    var headers = xhr.getAllResponseHeaders();
                    if (headers) {
                        // xhr.getAllResponseHeaders() method returns all the response headers, separated by CRLF, as a string or null
                        // the regex converts the header string into an array of individual headers
                        var arr = headers.trim().split(/[\r\n]+/);
                        var responseHeaderMap_1 = {};
                        CoreUtils.arrForEach(arr, function (line) {
                            var parts = line.split(': ');
                            var header = parts.shift();
                            var value = parts.join(': ');
                            responseHeaderMap_1[header] = value;
                        });
                        if (CoreUtils.objKeys(responseHeaderMap_1).length > 0) {
                            dependency.properties = dependency.properties || {};
                            dependency.properties.responseHeaders = {};
                            dependency.properties.responseHeaders = responseHeaderMap_1;
                        }
                    }
                }
                this.trackDependencyDataInternal(dependency);
                xhr.ajaxData = null;
            }
        };
        AjaxMonitor.prototype.getAjaxCorrelationContext = function (xhr) {
            try {
                var responseHeadersString = xhr.getAllResponseHeaders();
                if (responseHeadersString !== null) {
                    var index = responseHeadersString.toLowerCase().indexOf(RequestHeaders.requestContextHeaderLowerCase);
                    if (index !== -1) {
                        var responseHeader = xhr.getResponseHeader(RequestHeaders.requestContextHeader);
                        return CorrelationIdHelper.getCorrelationContext(responseHeader);
                    }
                }
            }
            catch (e) {
                this._core.logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.FailedMonitorAjaxGetCorrelationHeader, "Failed to get Request-Context correlation header as it may be not included in the response or not accessible.", {
                    ajaxDiagnosticsMessage: AjaxMonitor.getFailedAjaxDiagnosticsMessage(xhr),
                    exception: Util.dump(e)
                });
            }
        };
        AjaxMonitor.prototype.isFetchInstrumented = function (input) {
            return this._fetchInitialized && input[DisabledPropertyName] !== true;
        };
        AjaxMonitor.prototype.supportsFetch = function () {
            var result = true;
            if (typeof window !== 'object' || CoreUtils.isNullOrUndefined(window.Request) ||
                CoreUtils.isNullOrUndefined(window.Request.prototype) ||
                CoreUtils.isNullOrUndefined(window.fetch)) {
                result = false;
            }
            return result;
        };
        AjaxMonitor.prototype.createFetchRecord = function (input, init) {
            var traceID = (this._context && this._context.telemetryTrace && this._context.telemetryTrace.traceID) || Util.generateW3CId();
            var spanID = Util.generateW3CId().substr(0, 16);
            var ajaxData = new ajaxRecord(traceID, spanID, this._core.logger);
            ajaxData.requestSentTime = DateTimeUtils.Now();
            if (input instanceof Request) {
                ajaxData.requestUrl = input ? input.url : "";
            }
            else {
                ajaxData.requestUrl = input;
            }
            if (init && init.method) {
                ajaxData.method = init.method;
            }
            else if (input && input instanceof Request) {
                ajaxData.method = input.method;
            }
            else {
                ajaxData.method = "GET";
            }
            if (init && init.headers && this._config.enableRequestHeaderTracking) {
                ajaxData.requestHeaders = init.headers;
            }
            else {
                ajaxData.requestHeaders = {};
            }
            return ajaxData;
        };
        AjaxMonitor.prototype.getFailedFetchDiagnosticsMessage = function (input) {
            var result = "";
            try {
                if (!CoreUtils.isNullOrUndefined(input)) {
                    if (typeof (input) === "string") {
                        result += "(url: '" + input + "')";
                    }
                    else {
                        result += "(url: '" + input.url + "')";
                    }
                }
            }
            catch (e) {
                this._core.logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.FailedMonitorAjaxOpen, "Failed to grab failed fetch diagnostics message", { exception: Util.dump(e) });
            }
            return result;
        };
        AjaxMonitor.prototype.onFetchComplete = function (response, ajaxData) {
            if (!ajaxData) {
                return;
            }
            try {
                ajaxData.responseFinishedTime = DateTimeUtils.Now();
                ajaxData.CalculateMetrics();
                if (ajaxData.ajaxTotalDuration < 0) {
                    this._core.logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.FailedMonitorAjaxDur, "Failed to calculate the duration of the fetch call, monitoring data for this fetch call won't be sent.", {
                        fetchDiagnosticsMessage: this.getFailedFetchDiagnosticsMessage(response),
                        requestSentTime: ajaxData.requestSentTime,
                        responseFinishedTime: ajaxData.responseFinishedTime
                    });
                }
                else {
                    var dependency = {
                        id: "|" + ajaxData.traceID + "." + ajaxData.spanID,
                        target: ajaxData.getAbsoluteUrl(),
                        name: ajaxData.getPathName(),
                        type: "Fetch",
                        duration: ajaxData.ajaxTotalDuration,
                        success: response.status >= 200 && response.status < 400,
                        responseCode: response.status,
                        properties: { HttpMethod: ajaxData.method }
                    };
                    // enrich dependency target with correlation context from the server
                    var correlationContext = this.getFetchCorrelationContext(response);
                    if (correlationContext) {
                        dependency.correlationContext = correlationContext;
                    }
                    if (this._config.enableRequestHeaderTracking) {
                        if (CoreUtils.objKeys(ajaxData.requestHeaders).length > 0) {
                            dependency.properties = dependency.properties || {};
                            dependency.properties.requestHeaders = ajaxData.requestHeaders;
                        }
                    }
                    if (this._config.enableResponseHeaderTracking) {
                        var responseHeaderMap_2 = {};
                        response.headers.forEach(function (value, name) {
                            responseHeaderMap_2[name] = value;
                        });
                        if (CoreUtils.objKeys(responseHeaderMap_2).length > 0) {
                            dependency.properties = dependency.properties || {};
                            dependency.properties.responseHeaders = responseHeaderMap_2;
                        }
                    }
                    this.trackDependencyDataInternal(dependency);
                }
            }
            catch (e) {
                this._core.logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.FailedMonitorAjaxGetCorrelationHeader, "Failed to calculate the duration of the fetch call, monitoring data for this fetch call won't be sent.", {
                    fetchDiagnosticsMessage: this.getFailedFetchDiagnosticsMessage(response),
                    exception: Util.dump(e)
                });
            }
        };
        AjaxMonitor.prototype.onFetchFailed = function (input, ajaxData, reason) {
            if (!ajaxData) {
                return;
            }
            try {
                ajaxData.responseFinishedTime = DateTimeUtils.Now();
                ajaxData.CalculateMetrics();
                if (ajaxData.ajaxTotalDuration < 0) {
                    this._core.logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.FailedMonitorAjaxDur, "Failed to calculate the duration of the failed fetch call, monitoring data for this fetch call won't be sent.", {
                        fetchDiagnosticsMessage: this.getFailedFetchDiagnosticsMessage(input),
                        requestSentTime: ajaxData.requestSentTime,
                        responseFinishedTime: ajaxData.responseFinishedTime
                    });
                }
                else {
                    var dependency = {
                        id: "|" + ajaxData.traceID + "." + ajaxData.spanID,
                        target: ajaxData.getAbsoluteUrl(),
                        name: ajaxData.getPathName(),
                        type: "Fetch",
                        duration: ajaxData.ajaxTotalDuration,
                        success: false,
                        responseCode: 0,
                        properties: { HttpMethod: ajaxData.method }
                    };
                    this.trackDependencyDataInternal(dependency, { error: reason.message });
                }
            }
            catch (e) {
                this._core.logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.FailedMonitorAjaxGetCorrelationHeader, "Failed to calculate the duration of the failed fetch call, monitoring data for this fetch call won't be sent.", {
                    fetchDiagnosticsMessage: this.getFailedFetchDiagnosticsMessage(input),
                    exception: Util.dump(e)
                });
            }
        };
        AjaxMonitor.prototype.getFetchCorrelationContext = function (response) {
            try {
                var responseHeader = response.headers.get(RequestHeaders.requestContextHeader);
                return CorrelationIdHelper.getCorrelationContext(responseHeader);
            }
            catch (e) {
                this._core.logger.throwInternal(LoggingSeverity.WARNING, _InternalMessageId.FailedMonitorAjaxGetCorrelationHeader, "Failed to get Request-Context correlation header as it may be not included in the response or not accessible.", {
                    fetchDiagnosticsMessage: this.getFailedFetchDiagnosticsMessage(response),
                    exception: Util.dump(e)
                });
            }
        };
        AjaxMonitor.identifier = "AjaxDependencyPlugin";
        return AjaxMonitor;
    }());

    /**
     * Application Insights API
     * @class Initialization
     * @implements {IApplicationInsights}
     */
    var Initialization = /** @class */ (function () {
        function Initialization(snippet) {
            // initialize the queue and config in case they are undefined
            snippet.queue = snippet.queue || [];
            snippet.version = snippet.version || 2.0; // Default to new version
            var config = snippet.config || {};
            if (config.connectionString) {
                var cs = ConnectionStringParser.parse(config.connectionString);
                var ingest = cs.ingestionendpoint;
                config.endpointUrl = ingest ? ingest + "/v2/track" : config.endpointUrl; // only add /v2/track when from connectionstring
                config.instrumentationKey = cs.instrumentationkey || config.instrumentationKey;
            }
            this.appInsights = new ApplicationInsights();
            this.properties = new PropertiesPlugin();
            this.dependencies = new AjaxMonitor();
            this.core = new AppInsightsCore();
            this.snippet = snippet;
            this.config = config;
            this.getSKUDefaults();
        }
        // Analytics Plugin
        /**
         * Log a user action or other occurrence.
         * @param {IEventTelemetry} event
         * @param {ICustomProperties} [customProperties]
         * @memberof Initialization
         */
        Initialization.prototype.trackEvent = function (event, customProperties) {
            this.appInsights.trackEvent(event, customProperties);
        };
        /**
         * Logs that a page, or similar container was displayed to the user.
         * @param {IPageViewTelemetry} pageView
         * @memberof Initialization
         */
        Initialization.prototype.trackPageView = function (pageView) {
            var inPv = pageView || {};
            this.appInsights.trackPageView(inPv);
        };
        /**
         * Log a bag of performance information via the customProperties field.
         * @param {IPageViewPerformanceTelemetry} pageViewPerformance
         * @memberof Initialization
         */
        Initialization.prototype.trackPageViewPerformance = function (pageViewPerformance) {
            var inPvp = pageViewPerformance || {};
            this.appInsights.trackPageViewPerformance(inPvp);
        };
        /**
         * Log an exception that you have caught.
         * @param {IExceptionTelemetry} exception
         * @memberof Initialization
         */
        Initialization.prototype.trackException = function (exception) {
            if (!exception.exception && exception.error) {
                exception.exception = exception.error;
            }
            this.appInsights.trackException(exception);
        };
        /**
         * Manually send uncaught exception telemetry. This method is automatically triggered
         * on a window.onerror event.
         * @param {IAutoExceptionTelemetry} exception
         * @memberof Initialization
         */
        Initialization.prototype._onerror = function (exception) {
            this.appInsights._onerror(exception);
        };
        /**
         * Log a diagnostic scenario such entering or leaving a function.
         * @param {ITraceTelemetry} trace
         * @param {ICustomProperties} [customProperties]
         * @memberof Initialization
         */
        Initialization.prototype.trackTrace = function (trace, customProperties) {
            this.appInsights.trackTrace(trace, customProperties);
        };
        /**
         * Log a numeric value that is not associated with a specific event. Typically used
         * to send regular reports of performance indicators.
         *
         * To send a single measurement, just use the `name` and `average` fields
         * of {@link IMetricTelemetry}.
         *
         * If you take measurements frequently, you can reduce the telemetry bandwidth by
         * aggregating multiple measurements and sending the resulting average and modifying
         * the `sampleCount` field of {@link IMetricTelemetry}.
         * @param {IMetricTelemetry} metric input object argument. Only `name` and `average` are mandatory.
         * @param {ICustomProperties} [customProperties]
         * @memberof Initialization
         */
        Initialization.prototype.trackMetric = function (metric, customProperties) {
            this.appInsights.trackMetric(metric, customProperties);
        };
        /**
         * Starts the timer for tracking a page load time. Use this instead of `trackPageView` if you want to control when the page view timer starts and stops,
         * but don't want to calculate the duration yourself. This method doesn't send any telemetry. Call `stopTrackPage` to log the end of the page view
         * and send the event.
         * @param name A string that idenfities this item, unique within this HTML document. Defaults to the document title.
         */
        Initialization.prototype.startTrackPage = function (name) {
            this.appInsights.startTrackPage(name);
        };
        /**
         * Stops the timer that was started by calling `startTrackPage` and sends the pageview load time telemetry with the specified properties and measurements.
         * The duration of the page view will be the time between calling `startTrackPage` and `stopTrackPage`.
         * @param   name  The string you used as the name in startTrackPage. Defaults to the document title.
         * @param   url   String - a relative or absolute URL that identifies the page or other item. Defaults to the window location.
         * @param   properties  map[string, string] - additional data used to filter pages and metrics in the portal. Defaults to empty.
         * @param   measurements    map[string, number] - metrics associated with this page, displayed in Metrics Explorer on the portal. Defaults to empty.
         */
        Initialization.prototype.stopTrackPage = function (name, url, customProperties, measurements) {
            this.appInsights.stopTrackPage(name, url, customProperties, measurements);
        };
        Initialization.prototype.startTrackEvent = function (name) {
            this.appInsights.startTrackEvent(name);
        };
        /**
         * Log an extended event that you started timing with `startTrackEvent`.
         * @param   name    The string you used to identify this event in `startTrackEvent`.
         * @param   properties  map[string, string] - additional data used to filter events and metrics in the portal. Defaults to empty.
         * @param   measurements    map[string, number] - metrics associated with this event, displayed in Metrics Explorer on the portal. Defaults to empty.
         */
        Initialization.prototype.stopTrackEvent = function (name, properties, measurements) {
            this.appInsights.stopTrackEvent(name, properties, measurements); // Todo: Fix to pass measurements once type is updated
        };
        Initialization.prototype.addTelemetryInitializer = function (telemetryInitializer) {
            return this.appInsights.addTelemetryInitializer(telemetryInitializer);
        };
        // Properties Plugin
        /**
         * Set the authenticated user id and the account id. Used for identifying a specific signed-in user. Parameters must not contain whitespace or ,;=|
         *
         * The method will only set the `authenicatedUserId` and `accountId` in the curent page view. To set them for the whole sesion, you should set `storeInCookie = true`
         * @param {string} authenticatedUserId
         * @param {string} [accountId]
         * @param {boolean} [storeInCookie=false]
         * @memberof Initialization
         */
        Initialization.prototype.setAuthenticatedUserContext = function (authenticatedUserId, accountId, storeInCookie) {
            if (storeInCookie === void 0) { storeInCookie = false; }
            this.properties.context.user.setAuthenticatedUserContext(authenticatedUserId, accountId, storeInCookie);
        };
        /**
         * Clears the authenticated user id and account id. The associated cookie is cleared, if present.
         * @memberof Initialization
         */
        Initialization.prototype.clearAuthenticatedUserContext = function () {
            this.properties.context.user.clearAuthenticatedUserContext();
        };
        // Dependencies Plugin
        /**
         * Log a dependency call (e.g. ajax)
         * @param {IDependencyTelemetry} dependency
         * @memberof Initialization
         */
        Initialization.prototype.trackDependencyData = function (dependency) {
            this.dependencies.trackDependencyData(dependency);
        };
        // Misc
        /**
         * Manually trigger an immediate send of all telemetry still in the buffer.
         * @param {boolean} [async=true]
         * @memberof Initialization
         */
        Initialization.prototype.flush = function (async) {
            if (async === void 0) { async = true; }
            CoreUtils.arrForEach(this.core.getTransmissionControls(), function (channels) {
                CoreUtils.arrForEach(channels, function (channel) {
                    channel.flush(async);
                });
            });
        };
        /**
         * Manually trigger an immediate send of all telemetry still in the buffer using beacon Sender.
         * Fall back to xhr sender if beacon is not supported.
         * @param {boolean} [async=true]
         * @memberof Initialization
         */
        Initialization.prototype.onunloadFlush = function (async) {
            if (async === void 0) { async = true; }
            CoreUtils.arrForEach(this.core.getTransmissionControls(), function (channels) {
                CoreUtils.arrForEach(channels, function (channel) {
                    if (channel.onunloadFlush) {
                        channel.onunloadFlush();
                    }
                    else {
                        channel.flush(async);
                    }
                });
            });
        };
        /**
         * Initialize this instance of ApplicationInsights
         * @returns {IApplicationInsights}
         * @memberof Initialization
         */
        Initialization.prototype.loadAppInsights = function (legacyMode) {
            if (legacyMode === void 0) { legacyMode = false; }
            // dont allow additional channels/other extensions for legacy mode; legacy mode is only to allow users to switch with no code changes!
            if (legacyMode && this.config.extensions && this.config.extensions.length > 0) {
                throw new Error("Extensions not allowed in legacy mode");
            }
            var extensions = [];
            var appInsightsChannel = new Sender();
            extensions.push(appInsightsChannel);
            extensions.push(this.properties);
            extensions.push(this.dependencies);
            extensions.push(this.appInsights);
            // initialize core
            this.core.initialize(this.config, extensions);
            // Empty queue of all api calls logged prior to sdk download
            this.emptyQueue();
            this.pollInternalLogs();
            this.addHousekeepingBeforeUnload(this);
            this.context = this.properties.context;
            return this;
        };
        /**
         * Overwrite the lazy loaded fields of global window snippet to contain the
         * actual initialized API methods
         * @param {Snippet} snippet
         * @memberof Initialization
         */
        Initialization.prototype.updateSnippetDefinitions = function (snippet) {
            // apply full appInsights to the global instance
            // Note: This must be called before loadAppInsights is called
            for (var field in this) {
                if (typeof field === 'string') {
                    snippet[field] = this[field];
                }
            }
        };
        /**
         * Call any functions that were queued before the main script was loaded
         * @memberof Initialization
         */
        Initialization.prototype.emptyQueue = function () {
            // call functions that were queued before the main script was loaded
            try {
                if (Util.isArray(this.snippet.queue)) {
                    // note: do not check length in the for-loop conditional in case something goes wrong and the stub methods are not overridden.
                    var length_1 = this.snippet.queue.length;
                    for (var i = 0; i < length_1; i++) {
                        var call = this.snippet.queue[i];
                        call();
                    }
                    this.snippet.queue = undefined;
                    delete this.snippet.queue;
                }
            }
            catch (exception) {
                var properties = {};
                if (exception && typeof exception.toString === "function") {
                    properties.exception = exception.toString();
                }
                // need from core
                // Microsoft.ApplicationInsights._InternalLogging.throwInternal(
                //     LoggingSeverity.WARNING,
                //     _InternalMessageId.FailedToSendQueuedTelemetry,
                //     "Failed to send queued telemetry",
                //     properties);
            }
        };
        Initialization.prototype.pollInternalLogs = function () {
            this.core.pollInternalLogs();
        };
        Initialization.prototype.addHousekeepingBeforeUnload = function (appInsightsInstance) {
            // Add callback to push events when the user navigates away
            if (!appInsightsInstance.appInsights.config.disableFlushOnBeforeUnload && typeof window === "object" && ('onbeforeunload' in window)) {
                var performHousekeeping = function () {
                    // Adds the ability to flush all data before the page unloads.
                    // Note: This approach tries to push an async request with all the pending events onbeforeunload.
                    // Firefox does not respect this.Other browsers DO push out the call with < 100% hit rate.
                    // Telemetry here will help us analyze how effective this approach is.
                    // Another approach would be to make this call sync with a acceptable timeout to reduce the
                    // impact on user experience.
                    // appInsightsInstance.context._sender.triggerSend();
                    appInsightsInstance.onunloadFlush(false);
                    // Back up the current session to local storage
                    // This lets us close expired sessions after the cookies themselves expire
                    var ext = appInsightsInstance.appInsights.core['_extensions'][PropertiesPluginIdentifier];
                    if (ext && ext.context && ext.context._sessionManager) {
                        ext.context._sessionManager.backup();
                    }
                };
                if (!Util.addEventHandler('beforeunload', performHousekeeping)) {
                    appInsightsInstance.appInsights.core.logger.throwInternal(LoggingSeverity.CRITICAL, _InternalMessageId.FailedToAddHandlerForOnBeforeUnload, 'Could not add handler for beforeunload');
                }
            }
        };
        Initialization.prototype.getSKUDefaults = function () {
            this.config.diagnosticLogInterval =
                this.config.diagnosticLogInterval && this.config.diagnosticLogInterval > 0 ? this.config.diagnosticLogInterval : 10000;
        };
        return Initialization;
    }());

    var ApplicationInsightsContainer = /** @class */ (function () {
        function ApplicationInsightsContainer() {
        }
        ApplicationInsightsContainer.getAppInsights = function (snippet, version) {
            var initialization = new Initialization(snippet);
            var legacyMode = version !== 2.0 ? true : false;
            // Two target scenarios:
            // 1. Customer runs v1 snippet + runtime. If customer updates just cdn location to new SDK, it will run in compat mode so old apis work
            // 2. Customer updates to new snippet (that uses cdn location to new SDK. This is same as a new customer onboarding
            // and all api signatures are expected to map to new SDK. Note new snippet specifies version
            if (version === 2.0) {
                initialization.updateSnippetDefinitions(snippet);
                initialization.loadAppInsights(legacyMode);
                return initialization; // default behavior with new snippet
            }
            else {
                var legacy = new AppInsightsDeprecated(snippet, initialization); // target scenario old snippet + updated endpoint
                legacy.updateSnippetDefinitions(snippet);
                initialization.loadAppInsights(legacyMode);
                return legacy;
            }
        };
        return ApplicationInsightsContainer;
    }());

    // should be global function that should load as soon as SDK loads
    try {
        // E2E sku on load initializes core and pipeline using snippet as input for configuration
        // tslint:disable-next-line: no-var-keyword
        var aiName;
        if (typeof window !== "undefined" && typeof JSON !== "undefined") {
            // get snippet or initialize to an empty object
            aiName = window["appInsightsSDK"] || "appInsights";
            if (window[aiName] !== undefined) {
                // this is the typical case for browser+snippet
                var snippet = window[aiName] || { version: 2.0 };
                // overwrite snippet with full appInsights
                // for 2.0 initialize only if required
                if ((snippet.version === 2.0 && window[aiName].initialize) || snippet.version === undefined) {
                    ApplicationInsightsContainer.getAppInsights(snippet, snippet.version);
                }
            }
        }
    }
    catch (e) {
        // TODO: Find better place to warn to console when SDK initialization fails
        if (console) {
            console.warn('Failed to initialize AppInsights JS SDK for instance ' + aiName + e.message);
        }
    }

    exports.ApplicationInsights = Initialization;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=ai.2.js.map
