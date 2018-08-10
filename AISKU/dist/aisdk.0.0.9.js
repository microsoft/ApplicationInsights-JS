(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else {
		var a = factory();
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(window, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ({

/***/ "./amd/bundle/Init.js":
/*!****************************!*\
  !*** ./amd/bundle/Init.js ***!
  \****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/// <reference types="applicationinsights-common" />
/// <reference types="applicationinsights-core-js" />
/// <reference types="applicationinsights-analytics-js" />
/// <reference types="applicationinsights-channel-js" />
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! applicationinsights-common */ "./node_modules/applicationinsights-common/bundle/applicationinsights-common.js"), __webpack_require__(/*! applicationinsights-analytics-js */ "./node_modules/applicationinsights-analytics-js/bundle/applicationinsights-analytics-js.js"), __webpack_require__(/*! ./Initialization */ "./amd/bundle/Initialization.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, applicationinsights_common_1, applicationinsights_analytics_js_1, Initialization_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    "use strict";
    //should be global function that should load as soon as SDK loads
    try {
        // E2E sku on load initializes core and pipeline using snippet as input for configuration
        if (typeof window !== "undefined" && typeof JSON !== "undefined") {
            // get snippet or initialize to an empty object
            // appinsightsvnext should not conflict if page uses existing sdk for a layer of instrumentation
            var aiName = "appInsightsvNext";
            if (window[aiName] === undefined) {
                // if no snippet is present, initialize default values
                applicationinsights_analytics_js_1.ApplicationInsights.appInsightsDefaultConfig = Initialization_1.Initialization.getDefaultConfig();
            }
            else {
                // this is the typical case for browser+snippet
                var snippet = window[aiName] || {};
                // overwrite snippet with full appInsights
                var initialization = new Initialization_1.Initialization(snippet);
                var appInsightsLocal = initialization.loadAppInsights();
                // apply full appInsights to the global instance that was initialized in the snippet
                for (var field in appInsightsLocal) {
                    snippet[field] = appInsightsLocal[field];
                }
                // Empty queue of all api calls logged prior to sdk download
                initialization.emptyQueue();
                initialization.addHousekeepingBeforeUnload(appInsightsLocal);
            }
        }
        // // only initialize if we are running in a browser that supports JSON serialization (ie7<, node.js, cordova)
        // if (typeof window !== "undefined" && typeof JSON !== "undefined") {
        //     // temporary for testing
        //     let config: IConfiguration = {
        //         instrumentationKey: "8e68dc94-34d1-4894-8697-be2ba6282b5b"
        //     };
        //     var core = new AppInsightsCore();
        //     let extensions = [];
        //     let appInsightsChannel : Sender = new Sender();
        //     let appInsights = new ApplicationInsights();
        //     extensions.push(appInsightsChannel);
        //     extensions.push(appInsights);
        //     // initialize core
        //     core.initialize(config, extensions);
        //     // initialize extensions
        //     // appInsights.initialize(config, core, extensions);
        //     // appInsightsChannel.initialize(config);
        //     let pageView: IPageViewTelemetry = {
        //         name: document.title ? document.title : "test page",
        //         uri: document.URL ? document.URL : ""
        //     };
        //     appInsights.trackPageView(pageView); // track a page view
        //     // let telemetryItem: ITelemetryItem = {
        //     //     name: "TestPageView",
        //     //     instrumentationKey: "8e68dc94-34d1-4894-8697-be2ba6282b5b",
        //     //     timestamp: new Date(),
        //     //     baseType: PageView.dataType,
        //     // }
        //     // telemetryItem.sytemProperties = {};
        //     // telemetryItem.domainProperties = {};
        //     // telemetryItem.sytemProperties["ver"] = "2";
        //     // telemetryItem.domainProperties["url"] = document.title ? document.title : "";
        //     // telemetryItem.domainProperties["id"] = "";
        //     // telemetryItem.domainProperties["name"] = "2";
        //     // telemetryItem.domainProperties["duration"] = 10;
        //     // core.track(telemetryItem);
        // }
    }
    catch (e) {
        applicationinsights_common_1._InternalLogging.warnToConsole('Failed to initialize AppInsights JS SDK: ' + e.message);
    }
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),

/***/ "./amd/bundle/Initialization.js":
/*!**************************************!*\
  !*** ./amd/bundle/Initialization.js ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/// <reference types="applicationinsights-core-js" />
/// <reference types="applicationinsights-common" />
/// <reference types="applicationinsights-analytics-js" />
/// <reference types="applicationinsights-channel-js" />
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! applicationinsights-core-js */ "./node_modules/applicationinsights-core-js/bundle/applicationinsights-core-js.js"), __webpack_require__(/*! applicationinsights-analytics-js */ "./node_modules/applicationinsights-analytics-js/bundle/applicationinsights-analytics-js.js"), __webpack_require__(/*! applicationinsights-common */ "./node_modules/applicationinsights-common/bundle/applicationinsights-common.js"), __webpack_require__(/*! applicationinsights-channel-js */ "./node_modules/applicationinsights-channel-js/bundle/applicationinsights-channel-js.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, applicationinsights_core_js_1, applicationinsights_analytics_js_1, applicationinsights_common_1, applicationinsights_channel_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    "use strict";
    var Initialization = /** @class */ (function () {
        function Initialization(snippet) {
            // initialize the queue and config in case they are undefined
            snippet.queue = snippet.queue || [];
            var config = snippet.config || {};
            // ensure instrumentationKey is specified
            if (config && !config.instrumentationKey) {
                config = snippet;
                applicationinsights_analytics_js_1.ApplicationInsights.Version = "2.0.0";
            }
            this.appInsights = new applicationinsights_analytics_js_1.ApplicationInsights();
            // set default values using config passed through snippet
            config = Initialization.getDefaultConfig(config, this.appInsights.identifier);
            this.snippet = snippet;
            this.config = config;
        }
        Initialization.prototype.loadAppInsights = function () {
            this.core = new applicationinsights_core_js_1.AppInsightsCore();
            var extensions = [];
            var appInsightsChannel = new applicationinsights_channel_js_1.Sender();
            extensions.push(appInsightsChannel);
            extensions.push(this.appInsights);
            // initialize core
            this.core.initialize(this.config, extensions);
            // initialize extensions
            this.appInsights.initialize(this.config, this.core, extensions);
            appInsightsChannel.initialize(this.config);
            return this.appInsights;
        };
        Initialization.prototype.emptyQueue = function () {
            // call functions that were queued before the main script was loaded
            try {
                if (applicationinsights_common_1.Util.isArray(this.snippet.queue)) {
                    // note: do not check length in the for-loop conditional in case something goes wrong and the stub methods are not overridden.
                    var length = this.snippet.queue.length;
                    for (var i = 0; i < length; i++) {
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
        Initialization.prototype.pollInteralLogs = function (appInsightsInstance) {
            // return setInterval(() => {
            //     var queue: Array<_InternalLogMessage> = ApplicationInsights._InternalLogging.queue;
            //     var length = queue.length;
            //     for (var i = 0; i < length; i++) {
            //         appInsightsInstance.trackTrace(queue[i].message);
            //     }
            //     queue.length = 0;
            // }, this.config.diagnosticLogInterval);
        };
        Initialization.prototype.addHousekeepingBeforeUnload = function (appInsightsInstance) {
            // Add callback to push events when the user navigates away
            if (!appInsightsInstance.config.disableFlushOnBeforeUnload && ('onbeforeunload' in window)) {
                var performHousekeeping = function () {
                    // Adds the ability to flush all data before the page unloads.
                    // Note: This approach tries to push an async request with all the pending events onbeforeunload.
                    // Firefox does not respect this.Other browsers DO push out the call with < 100% hit rate.
                    // Telemetry here will help us analyze how effective this approach is.
                    // Another approach would be to make this call sync with a acceptable timeout to reduce the 
                    // impact on user experience.
                    //appInsightsInstance.context._sender.triggerSend();
                    this.core.getTransmissionControl().flush(true);
                    // Back up the current session to local storage
                    // This lets us close expired sessions after the cookies themselves expire
                    appInsightsInstance.context._sessionManager.backup();
                };
                if (!applicationinsights_common_1.Util.addEventHandler('beforeunload', performHousekeeping)) {
                    applicationinsights_common_1._InternalLogging.throwInternal(applicationinsights_common_1.LoggingSeverity.CRITICAL, applicationinsights_common_1._InternalMessageId.FailedToAddHandlerForOnBeforeUnload, 'Could not add handler for beforeunload');
                }
            }
        };
        Initialization.getDefaultConfig = function (configuration, identifier) {
            if (!configuration) {
                configuration = {};
            }
            if (configuration) {
                identifier = identifier ? identifier : "AppAnalytics"; // To do: define constant        
            }
            var config = configuration.extensions ? configuration.extensions[identifier] : {};
            // set default values
            configuration.endpointUrl = configuration.endpointUrl || "https://dc.services.visualstudio.com/v2/track";
            config.sessionRenewalMs = 30 * 60 * 1000;
            config.sessionExpirationMs = 24 * 60 * 60 * 1000;
            config.enableDebug = applicationinsights_common_1.Util.stringToBoolOrDefault(config.enableDebug);
            config.disableExceptionTracking = applicationinsights_common_1.Util.stringToBoolOrDefault(config.disableExceptionTracking);
            config.verboseLogging = applicationinsights_common_1.Util.stringToBoolOrDefault(config.verboseLogging);
            config.diagnosticLogInterval = config.diagnosticLogInterval || 10000;
            config.autoTrackPageVisitTime = applicationinsights_common_1.Util.stringToBoolOrDefault(config.autoTrackPageVisitTime);
            if (isNaN(config.samplingPercentage) || config.samplingPercentage <= 0 || config.samplingPercentage >= 100) {
                config.samplingPercentage = 100;
            }
            config.disableAjaxTracking = applicationinsights_common_1.Util.stringToBoolOrDefault(config.disableAjaxTracking);
            config.maxAjaxCallsPerView = !isNaN(config.maxAjaxCallsPerView) ? config.maxAjaxCallsPerView : 500;
            config.disableCorrelationHeaders = applicationinsights_common_1.Util.stringToBoolOrDefault(config.disableCorrelationHeaders);
            config.correlationHeaderExcludedDomains = config.correlationHeaderExcludedDomains || [
                "*.blob.core.windows.net",
                "*.blob.core.chinacloudapi.cn",
                "*.blob.core.cloudapi.de",
                "*.blob.core.usgovcloudapi.net"
            ];
            config.disableFlushOnBeforeUnload = applicationinsights_common_1.Util.stringToBoolOrDefault(config.disableFlushOnBeforeUnload);
            config.isCookieUseDisabled = applicationinsights_common_1.Util.stringToBoolOrDefault(config.isCookieUseDisabled);
            config.isStorageUseDisabled = applicationinsights_common_1.Util.stringToBoolOrDefault(config.isStorageUseDisabled);
            config.isBrowserLinkTrackingEnabled = applicationinsights_common_1.Util.stringToBoolOrDefault(config.isBrowserLinkTrackingEnabled);
            config.enableCorsCorrelation = applicationinsights_common_1.Util.stringToBoolOrDefault(config.enableCorsCorrelation);
            return configuration;
        };
        return Initialization;
    }());
    exports.Initialization = Initialization;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/ApplicationInsights.js":
/*!***************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/ApplicationInsights.js ***!
  \***************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/// <reference types="applicationinsights-common" />
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! applicationinsights-common */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/applicationinsights-common.js"), __webpack_require__(/*! ./Telemetry/PageViewManager */ "./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/Telemetry/PageViewManager.js"), __webpack_require__(/*! applicationinsights-core-js */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-core-js/bundle/applicationinsights-core-js.js"), __webpack_require__(/*! ./TelemetryContext */ "./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/TelemetryContext.js"), __webpack_require__(/*! ./TelemetryItemCreator */ "./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/TelemetryItemCreator.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, applicationinsights_common_1, PageViewManager_1, applicationinsights_core_js_1, TelemetryContext_1, TelemetryItemCreator_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    "use strict";
    var ApplicationInsights = /** @class */ (function () {
        function ApplicationInsights() {
            // Counts number of trackAjax invokations.
            // By default we only monitor X ajax call per view to avoid too much load.
            // Default value is set in config.
            // This counter keeps increasing even after the limit is reached.
            this._trackAjaxAttempts = 0;
            this.identifier = ApplicationInsights.defaultIdentifier;
            this.initialize = this._initialize.bind(this);
        }
        ApplicationInsights.prototype.processTelemetry = function (env) {
            if (!applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(this._nextPlugin)) {
                this._nextPlugin.processTelemetry(env);
            }
        };
        ApplicationInsights.prototype.setNextPlugin = function (next) {
            this._nextPlugin = next;
        };
        /**
         * Logs that a page or other item was viewed.
         * @param IPageViewTelemetry The string you used as the name in startTrackPage. Defaults to the document title.
         * @param customProperties Additional data used to filter events and metrics. Defaults to empty.
         */
        ApplicationInsights.prototype.trackPageView = function (pageView, customProperties) {
            try {
                this._pageViewManager.trackPageView(pageView, customProperties);
                if (this.config.autoTrackPageVisitTime) {
                    this._pageVisitTimeManager.trackPreviousPageVisit(pageView.name, pageView.uri);
                }
            }
            catch (e) {
                applicationinsights_common_1._InternalLogging.throwInternal(applicationinsights_common_1.LoggingSeverity.CRITICAL, applicationinsights_common_1._InternalMessageId.TrackPVFailed, "trackPageView failed, page view will not be collected: " + applicationinsights_common_1.Util.getExceptionName(e), { exception: applicationinsights_common_1.Util.dump(e) });
            }
        };
        ApplicationInsights.prototype.sendPageViewInternal = function (pageView, properties, systemProperties) {
            var telemetryItem = TelemetryItemCreator_1.TelemetryItemCreator.createItem(pageView, applicationinsights_common_1.PageView.dataType, applicationinsights_common_1.PageView.envelopeType, properties, systemProperties);
            this.context.track(telemetryItem);
            // reset ajaxes counter
            this._trackAjaxAttempts = 0;
        };
        ApplicationInsights.prototype.sendPageViewPerformanceInternal = function (pageViewPerformance) {
            // TODO: Commenting out for now as we this package only supports pageViewTelemetry. Added task 
            // https://mseng.visualstudio.com/AppInsights/_workitems/edit/1310811
            /*
            var pageViewPerformanceData = new Data<PageViewPerformance>(
                PageViewPerformance.dataType, pageViewPerformance);
            var pageViewPerformanceEnvelope = new Envelope(pageViewPerformanceData, PageViewPerformance.envelopeType);
            this.context.track(pageViewPerformanceEnvelope);
            */
        };
        ApplicationInsights.prototype._initialize = function (config, core, extensions) {
            var _this = this;
            if (applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(core)) {
                throw Error("Error initializing");
            }
            this.core = core;
            this._globalconfig = {
                instrumentationKey: config.instrumentationKey,
                endpointUrl: config.endpointUrl
            };
            this.config = config.extensions && config.extensions[this.identifier] ? config.extensions[this.identifier] : {};
            // load default values if specified
            var defaults = ApplicationInsights.appInsightsDefaultConfig;
            if (defaults !== undefined) {
                if (defaults.extensions && defaults.extensions[this.identifier]) {
                    for (var field in defaults.extensions[this.identifier]) {
                        // for each unspecified field, set the default value
                        if (this.config[field] === undefined) {
                            this.config[field] = defaults[field];
                        }
                    }
                }
                if (this._globalconfig) {
                    for (var field in defaults) {
                        if (this._globalconfig[field] === undefined) {
                            this._globalconfig[field] = defaults[field];
                        }
                    }
                }
            }
            applicationinsights_common_1._InternalLogging.verboseLogging = function () { return _this.config.verboseLogging; };
            applicationinsights_common_1._InternalLogging.enableDebugExceptions = function () { return _this.config.enableDebug; };
            // Todo: move this out of static state
            if (this.config.isCookieUseDisabled) {
                applicationinsights_common_1.Util.disableCookies();
            }
            // Todo: move this out of static state
            if (this.config.isStorageUseDisabled) {
                applicationinsights_common_1.Util.disableStorage();
            }
            var configGetters = {
                instrumentationKey: function () { return config.instrumentationKey; },
                accountId: function () { return _this.config.accountId; },
                sessionRenewalMs: function () { return _this.config.sessionRenewalMs; },
                sessionExpirationMs: function () { return _this.config.sessionExpirationMs; },
                sampleRate: function () { return _this.config.samplingPercentage; },
                cookieDomain: function () { return _this.config.cookieDomain; },
                sdkExtension: function () { return _this.config.sdkExtension; },
                isBrowserLinkTrackingEnabled: function () { return _this.config.isBrowserLinkTrackingEnabled; },
                appId: function () { return _this.config.appId; }
            };
            this.context = new TelemetryContext_1.TelemetryContext(configGetters, this.core);
            this._pageViewManager = new PageViewManager_1.PageViewManager(this, this.config.overridePageViewDuration, this.core);
            /*
            TODO: renable this trackEvent once we support trackEvent in this package. Created task to track this:
            https://mseng.visualstudio.com/AppInsights/_workitems/edit/1310833
    
            // initialize event timing
            this._eventTracking = new Timing("trackEvent");
            this._eventTracking.action = (name?: string, url?: string, duration?: number, properties?: Object, measurements?: Object) => {
                if (!measurements) {
                    measurements = { duration: duration };
                }
                else {
                    // do not override existing duration value
                    if (isNaN(measurements["duration"])) {
                        measurements["duration"] = duration;
                    }
                }
    
    
                var event = new Event(name, properties, measurements);
                var data = new Data<Event>(Event.dataType, event);
                var envelope = new Envelope(data, Event.envelopeType);
    
                this.context.track(envelope);
            }
            */
            /* TODO re-enable once we add support for startTrackPage. Task to track this:
            https://mseng.visualstudio.com/AppInsights/1DS-Web/_workitems/edit/1305304
            // initialize page view timing
            this._pageTracking = new Timing("trackPageView");
            this._pageTracking.action = (name, url, duration, properties, measurements) => {
                let pageViewItem: IPageViewTelemetry = {
                    name: name,
                    uri: url,
                    duration: duration,
                };
                this.sendPageViewInternal(pageViewItem, properties);
            }
            */
        };
        ApplicationInsights.defaultIdentifier = "ApplicationInsightsAnalytics";
        ApplicationInsights.Version = "0.0.1";
        return ApplicationInsights;
    }());
    exports.ApplicationInsights = ApplicationInsights;
    /**
     * Used to record timed events and page views.
     */
    var Timing = /** @class */ (function () {
        function Timing(name) {
            this._name = name;
            this._events = {};
        }
        Timing.prototype.start = function (name) {
            if (typeof this._events[name] !== "undefined") {
                applicationinsights_common_1._InternalLogging.throwInternal(applicationinsights_common_1.LoggingSeverity.WARNING, applicationinsights_common_1._InternalMessageId.StartCalledMoreThanOnce, "start was called more than once for this event without calling stop.", { name: this._name, key: name }, true);
            }
            this._events[name] = +new Date;
        };
        Timing.prototype.stop = function (name, url, properties, measurements) {
            var start = this._events[name];
            if (isNaN(start)) {
                applicationinsights_common_1._InternalLogging.throwInternal(applicationinsights_common_1.LoggingSeverity.WARNING, applicationinsights_common_1._InternalMessageId.StopCalledWithoutStart, "stop was called without a corresponding start.", { name: this._name, key: name }, true);
            }
            else {
                var end = +new Date;
                var duration = applicationinsights_common_1.PageViewPerformance.getDuration(start, end);
                this.action(name, url, duration, properties, measurements);
            }
            delete this._events[name];
            this._events[name] = undefined;
        };
        return Timing;
    }());
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=ApplicationInsights.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/Context/Application.js":
/*!***************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/Context/Application.js ***!
  \***************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Application = /** @class */ (function () {
        function Application() {
        }
        return Application;
    }());
    exports.Application = Application;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=Application.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/Context/Device.js":
/*!**********************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/Context/Device.js ***!
  \**********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Device = /** @class */ (function () {
        /**
         * Constructs a new instance of the Device class
         */
        function Device() {
            // don't attempt to fingerprint browsers
            this.id = "browser";
            // Device type is a dimension in our data platform
            // Setting it to 'Browser' allows to separate client and server dependencies/exceptions
            this.type = "Browser";
        }
        return Device;
    }());
    exports.Device = Device;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=Device.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/Context/Internal.js":
/*!************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/Context/Internal.js ***!
  \************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ../ApplicationInsights */ "./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/ApplicationInsights.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, ApplicationInsights_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Internal = /** @class */ (function () {
        /**
        * Constructs a new instance of the internal telemetry data class.
        */
        function Internal(config) {
            this.sdkVersion = (config.sdkExtension() ? config.sdkExtension() + "_" : "") + "javascript:" + ApplicationInsights_1.ApplicationInsights.Version;
        }
        return Internal;
    }());
    exports.Internal = Internal;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=Internal.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/Context/Location.js":
/*!************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/Context/Location.js ***!
  \************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Location = /** @class */ (function () {
        function Location() {
        }
        return Location;
    }());
    exports.Location = Location;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=Location.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/Context/Operation.js":
/*!*************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/Context/Operation.js ***!
  \*************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! applicationinsights-common */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/applicationinsights-common.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, applicationinsights_common_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Operation = /** @class */ (function () {
        function Operation() {
            this.id = applicationinsights_common_1.Util.newId();
            if (window && window.location && window.location.pathname) {
                this.name = window.location.pathname;
            }
        }
        return Operation;
    }());
    exports.Operation = Operation;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=Operation.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/Context/Sample.js":
/*!**********************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/Context/Sample.js ***!
  \**********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ../SamplingScoreGenerator */ "./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/SamplingScoreGenerator.js"), __webpack_require__(/*! applicationinsights-common */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/applicationinsights-common.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, SamplingScoreGenerator_1, applicationinsights_common_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Sample = /** @class */ (function () {
        function Sample(sampleRate) {
            // We're using 32 bit math, hence max value is (2^31 - 1)
            this.INT_MAX_VALUE = 2147483647;
            if (sampleRate > 100 || sampleRate < 0) {
                applicationinsights_common_1._InternalLogging.throwInternal(applicationinsights_common_1.LoggingSeverity.WARNING, applicationinsights_common_1._InternalMessageId.SampleRateOutOfRange, "Sampling rate is out of range (0..100). Sampling will be disabled, you may be sending too much data which may affect your AI service level.", { samplingRate: sampleRate }, true);
                this.sampleRate = 100;
            }
            this.sampleRate = sampleRate;
            this.samplingScoreGenerator = new SamplingScoreGenerator_1.SamplingScoreGenerator();
        }
        /**
        * Determines if an envelope is sampled in (i.e. will be sent) or not (i.e. will be dropped).
        */
        Sample.prototype.isSampledIn = function (envelope) {
            // return true as sampling will move to different extension
            return true;
        };
        return Sample;
    }());
    exports.Sample = Sample;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=Sample.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/Context/Session.js":
/*!***********************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/Context/Session.js ***!
  \***********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! applicationinsights-common */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/applicationinsights-common.js"), __webpack_require__(/*! ../../JavaScriptSDK/Extensions/ajax/ajaxUtils */ "./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/Extensions/ajax/ajaxUtils.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, applicationinsights_common_1, ajaxUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Session = /** @class */ (function () {
        function Session() {
        }
        return Session;
    }());
    exports.Session = Session;
    var _SessionManager = /** @class */ (function () {
        function _SessionManager(config) {
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
            this.automaticSession = new Session();
        }
        _SessionManager.prototype.update = function () {
            if (!this.automaticSession.id) {
                this.initializeAutomaticSession();
            }
            var now = ajaxUtils_1.dateTime.Now();
            var acquisitionExpired = now - this.automaticSession.acquisitionDate > this.config.sessionExpirationMs();
            var renewalExpired = now - this.automaticSession.renewalDate > this.config.sessionRenewalMs();
            // renew if acquisitionSpan or renewalSpan has ellapsed
            if (acquisitionExpired || renewalExpired) {
                // update automaticSession so session state has correct id                
                this.automaticSession.isFirst = undefined;
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
         *  Use ai_session cookie data or local storage data (when the cookie is unavailable) to
         *  initialize the automatic session.
         */
        _SessionManager.prototype.initializeAutomaticSession = function () {
            var cookie = applicationinsights_common_1.Util.getCookie('ai_session');
            if (cookie && typeof cookie.split === "function") {
                this.initializeAutomaticSessionWithData(cookie);
            }
            else {
                // There's no cookie, but we might have session data in local storage
                // This can happen if the session expired or the user actively deleted the cookie
                // We only want to recover data if the cookie is missing from expiry. We should respect the user's wishes if the cookie was deleted actively.
                // The User class handles this for us and deletes our local storage object if the persistent user cookie was removed.
                var storage = applicationinsights_common_1.Util.getStorage('ai_session');
                if (storage) {
                    this.initializeAutomaticSessionWithData(storage);
                }
            }
            if (!this.automaticSession.id) {
                this.automaticSession.isFirst = true;
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
                applicationinsights_common_1._InternalLogging.throwInternal(applicationinsights_common_1.LoggingSeverity.CRITICAL, applicationinsights_common_1._InternalMessageId.ErrorParsingAISessionCookie, "Error parsing ai_session cookie, session will be reset: " + applicationinsights_common_1.Util.getExceptionName(e), { exception: applicationinsights_common_1.Util.dump(e) });
            }
            if (this.automaticSession.renewalDate == 0) {
                applicationinsights_common_1._InternalLogging.throwInternal(applicationinsights_common_1.LoggingSeverity.WARNING, applicationinsights_common_1._InternalMessageId.SessionRenewalDateIsZero, "AI session renewal date is 0, session will be reset.");
            }
        };
        _SessionManager.prototype.renew = function () {
            var now = ajaxUtils_1.dateTime.Now();
            this.automaticSession.id = applicationinsights_common_1.Util.newId();
            this.automaticSession.acquisitionDate = now;
            this.automaticSession.renewalDate = now;
            this.setCookie(this.automaticSession.id, this.automaticSession.acquisitionDate, this.automaticSession.renewalDate);
            // If this browser does not support local storage, fire an internal log to keep track of it at this point
            if (!applicationinsights_common_1.Util.canUseLocalStorage()) {
                applicationinsights_common_1._InternalLogging.throwInternal(applicationinsights_common_1.LoggingSeverity.WARNING, applicationinsights_common_1._InternalMessageId.BrowserDoesNotSupportLocalStorage, "Browser does not support local storage. Session durations will be inaccurate.");
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
            applicationinsights_common_1.Util.setCookie('ai_session', cookie.join('|') + ';expires=' + cookieExpiry.toUTCString(), cookieDomnain);
            this.cookieUpdatedTimestamp = ajaxUtils_1.dateTime.Now();
        };
        _SessionManager.prototype.setStorage = function (guid, acq, renewal) {
            // Keep data in local storage to retain the last session id, allowing us to cleanly end the session when it expires
            // Browsers that don't support local storage won't be able to end sessions cleanly from the client
            // The server will notice this and end the sessions itself, with loss of accurate session duration
            applicationinsights_common_1.Util.setStorage('ai_session', [guid, acq, renewal].join('|'));
        };
        _SessionManager.acquisitionSpan = 86400000; // 24 hours in ms
        _SessionManager.renewalSpan = 1800000; // 30 minutes in ms
        _SessionManager.cookieUpdateInterval = 60000; // 1 minute in ms
        return _SessionManager;
    }());
    exports._SessionManager = _SessionManager;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=Session.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/Context/User.js":
/*!********************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/Context/User.js ***!
  \********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! applicationinsights-common */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/applicationinsights-common.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, applicationinsights_common_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var User = /** @class */ (function () {
        function User(config) {
            //get userId or create new one if none exists
            var cookie = applicationinsights_common_1.Util.getCookie(User.userCookieName);
            if (cookie) {
                var params = cookie.split(User.cookieSeparator);
                if (params.length > 0) {
                    this.id = params[0];
                }
            }
            this.config = config;
            if (!this.id) {
                this.id = applicationinsights_common_1.Util.newId();
                var date = new Date();
                var acqStr = applicationinsights_common_1.Util.toISOStringForIE8(date);
                this.accountAcquisitionDate = acqStr;
                // without expiration, cookies expire at the end of the session
                // set it to 365 days from now
                // 365 * 24 * 60 * 60 * 1000 = 31536000000 
                date.setTime(date.getTime() + 31536000000);
                var newCookie = [this.id, acqStr];
                var cookieDomain = this.config.cookieDomain ? this.config.cookieDomain() : undefined;
                applicationinsights_common_1.Util.setCookie(User.userCookieName, newCookie.join(User.cookieSeparator) + ';expires=' + date.toUTCString(), cookieDomain);
                // If we have an ai_session in local storage this means the user actively removed our cookies.
                // We should respect their wishes and clear ourselves from local storage
                applicationinsights_common_1.Util.removeStorage('ai_session');
            }
            // We still take the account id from the ctor param for backward compatibility. 
            // But if the the customer set the accountId through the newer setAuthenticatedUserContext API, we will override it.
            this.accountId = config.accountId ? config.accountId() : undefined;
            // Get the auth user id and account id from the cookie if exists
            // Cookie is in the pattern: <authenticatedId>|<accountId>
            var authCookie = applicationinsights_common_1.Util.getCookie(User.authUserCookieName);
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
                applicationinsights_common_1._InternalLogging.throwInternal(applicationinsights_common_1.LoggingSeverity.WARNING, applicationinsights_common_1._InternalMessageId.SetAuthContextFailedAccountName, "Setting auth user context failed. " +
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
                applicationinsights_common_1.Util.setCookie(User.authUserCookieName, encodeURI(authCookie), this.config.cookieDomain());
            }
        };
        /**
         * Clears the authenticated user id and the account id from the user context.
         * @returns {}
         */
        User.prototype.clearAuthenticatedUserContext = function () {
            this.authenticatedId = null;
            this.accountId = null;
            applicationinsights_common_1.Util.deleteCookie(User.authUserCookieName);
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
    exports.User = User;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=User.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/Extensions/ajax/ajaxUtils.js":
/*!*********************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/Extensions/ajax/ajaxUtils.js ***!
  \*********************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var extensions = /** @class */ (function () {
        function extensions() {
        }
        extensions.IsNullOrUndefined = function (obj) {
            return typeof (obj) === "undefined" || obj === null;
        };
        return extensions;
    }());
    exports.extensions = extensions;
    var stringUtils = /** @class */ (function () {
        function stringUtils() {
        }
        stringUtils.GetLength = function (strObject) {
            var res = 0;
            if (!extensions.IsNullOrUndefined(strObject)) {
                var stringified = "";
                try {
                    stringified = strObject.toString();
                }
                catch (ex) {
                    // some troubles with complex object
                }
                res = stringified.length;
                res = isNaN(res) ? 0 : res;
            }
            return res;
        };
        return stringUtils;
    }());
    exports.stringUtils = stringUtils;
    var dateTime = /** @class */ (function () {
        function dateTime() {
        }
        ///<summary>Return the number of milliseconds since 1970/01/01 in local timezon</summary>
        dateTime.Now = (window.performance && window.performance.now && window.performance.timing) ?
            function () {
                return window.performance.now() + window.performance.timing.navigationStart;
            }
            :
                function () {
                    return new Date().getTime();
                };
        ///<summary>Gets duration between two timestamps</summary>
        dateTime.GetDuration = function (start, end) {
            var result = null;
            if (start !== 0 && end !== 0 && !extensions.IsNullOrUndefined(start) && !extensions.IsNullOrUndefined(end)) {
                result = end - start;
            }
            return result;
        };
        return dateTime;
    }());
    exports.dateTime = dateTime;
    var EventHelper = /** @class */ (function () {
        function EventHelper() {
        }
        ///<summary>Binds the specified function to an event, so that the function gets called whenever the event fires on the object</summary>
        ///<param name="obj">Object to which </param>
        ///<param name="eventNameWithoutOn">String that specifies any of the standard DHTML Events without "on" prefix</param>
        ///<param name="handlerRef">Pointer that specifies the function to call when event fires</param>
        ///<returns>True if the function was bound successfully to the event, otherwise false</returns>
        EventHelper.AttachEvent = function (obj, eventNameWithoutOn, handlerRef) {
            var result = false;
            if (!extensions.IsNullOrUndefined(obj)) {
                if (!extensions.IsNullOrUndefined(obj.attachEvent)) {
                    // IE before version 9                    
                    obj.attachEvent("on" + eventNameWithoutOn, handlerRef);
                    result = true;
                }
                else {
                    if (!extensions.IsNullOrUndefined(obj.addEventListener)) {
                        // all browsers except IE before version 9
                        obj.addEventListener(eventNameWithoutOn, handlerRef, false);
                        result = true;
                    }
                }
            }
            return result;
        };
        EventHelper.DetachEvent = function (obj, eventNameWithoutOn, handlerRef) {
            if (!extensions.IsNullOrUndefined(obj)) {
                if (!extensions.IsNullOrUndefined(obj.detachEvent)) {
                    obj.detachEvent("on" + eventNameWithoutOn, handlerRef);
                }
                else {
                    if (!extensions.IsNullOrUndefined(obj.removeEventListener)) {
                        obj.removeEventListener(eventNameWithoutOn, handlerRef, false);
                    }
                }
            }
        };
        return EventHelper;
    }());
    exports.EventHelper = EventHelper;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=ajaxUtils.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/HashCodeScoreGenerator.js":
/*!******************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/HashCodeScoreGenerator.js ***!
  \******************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var HashCodeScoreGenerator = /** @class */ (function () {
        function HashCodeScoreGenerator() {
        }
        HashCodeScoreGenerator.prototype.getHashCodeScore = function (key) {
            var score = this.getHashCode(key) / HashCodeScoreGenerator.INT_MAX_VALUE;
            return score * 100;
        };
        HashCodeScoreGenerator.prototype.getHashCode = function (input) {
            if (input == "") {
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
    exports.HashCodeScoreGenerator = HashCodeScoreGenerator;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=HashCodeScoreGenerator.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/SamplingScoreGenerator.js":
/*!******************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/SamplingScoreGenerator.js ***!
  \******************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ./HashCodeScoreGenerator */ "./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/HashCodeScoreGenerator.js"), __webpack_require__(/*! applicationinsights-common */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/applicationinsights-common.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, HashCodeScoreGenerator_1, applicationinsights_common_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var SamplingScoreGenerator = /** @class */ (function () {
        function SamplingScoreGenerator() {
            this.hashCodeGeneragor = new HashCodeScoreGenerator_1.HashCodeScoreGenerator();
        }
        SamplingScoreGenerator.prototype.getSamplingScore = function (envelope) {
            var tagKeys = new applicationinsights_common_1.ContextTagKeys();
            var score = 0;
            if (envelope.tags[tagKeys.userId]) {
                score = this.hashCodeGeneragor.getHashCodeScore(envelope.tags[tagKeys.userId]);
            }
            else if (envelope.tags[tagKeys.operationId]) {
                score = this.hashCodeGeneragor.getHashCodeScore(envelope.tags[tagKeys.operationId]);
            }
            else {
                score = Math.random();
            }
            return score;
        };
        return SamplingScoreGenerator;
    }());
    exports.SamplingScoreGenerator = SamplingScoreGenerator;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=SamplingScoreGenerator.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/Telemetry/PageViewManager.js":
/*!*********************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/Telemetry/PageViewManager.js ***!
  \*********************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! applicationinsights-common */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/applicationinsights-common.js"), __webpack_require__(/*! applicationinsights-core-js */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-core-js/bundle/applicationinsights-core-js.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, applicationinsights_common_1, applicationinsights_core_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
    * Class encapsulates sending page views and page view performance telemetry.
    */
    var PageViewManager = /** @class */ (function () {
        function PageViewManager(appInsights, overridePageViewDuration, core) {
            this.pageViewPerformanceSent = false;
            this.overridePageViewDuration = false;
            this.overridePageViewDuration = overridePageViewDuration;
            this.appInsights = appInsights;
            if (core) {
                this._channel = (core.getTransmissionControl());
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
            if (applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(name) || typeof name !== "string") {
                pageView.name = window.document && window.document.title || "";
            }
            var uri = pageView.uri;
            if (applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(uri) || typeof uri !== "string") {
                pageView.uri = window.location && window.location.href || "";
            }
            // case 1a. if performance timing is not supported by the browser, send the page view telemetry with the duration provided by the user. If the user
            // do not provide the duration, set duration to undefined
            // Also this is case 4
            if (!applicationinsights_common_1.PageViewPerformance.isPerformanceTimingSupported()) {
                this.appInsights.sendPageViewInternal(pageView, customProperties);
                this._channel.flush();
                // no navigation timing (IE 8, iOS Safari 8.4, Opera Mini 8 - see http://caniuse.com/#feat=nav-timing)
                applicationinsights_common_1._InternalLogging.throwInternal(applicationinsights_common_1.LoggingSeverity.WARNING, applicationinsights_common_1._InternalMessageId.NavigationTimingNotSupported, "trackPageView: navigation timing API used for calculation of page duration is not supported in this browser. This page view will be collected without duration and timing info.");
                return;
            }
            var pageViewSent = false;
            var customDuration = undefined;
            // if the performance timing is supported by the browser, calculate the custom duration
            var start = applicationinsights_common_1.PageViewPerformance.getPerformanceTiming().navigationStart;
            customDuration = applicationinsights_common_1.PageViewPerformance.getDuration(start, +new Date);
            if (!applicationinsights_common_1.PageViewPerformance.shouldCollectDuration(customDuration)) {
                customDuration = undefined;
            }
            // if the user has provided duration, send a page view telemetry with the provided duration. Otherwise, if
            // overridePageViewDuration is set to true, send a page view telemetry with the custom duration calculated earlier
            var duration = pageView.duration;
            if (this.overridePageViewDuration || !isNaN(duration)) {
                if (isNaN(duration)) {
                    // case 3
                    pageView.duration = customDuration;
                }
                // case 2
                this.appInsights.sendPageViewInternal(pageView, customProperties);
                this._channel.flush();
                pageViewSent = true;
            }
            // now try to send the page view performance telemetry
            var maxDurationLimit = 60000;
            var handle = setInterval(function () {
                try {
                    if (applicationinsights_common_1.PageViewPerformance.isPerformanceTimingDataReady()) {
                        clearInterval(handle);
                        // TODO: For now, sent undefined for measurements in the below code this package only supports pageViewTelemetry. Added task 
                        // https://mseng.visualstudio.com/AppInsights/_workitems/edit/1310811
                        var pageViewPerformance = new applicationinsights_common_1.PageViewPerformance(name, uri, null, customProperties, undefined);
                        if (!pageViewPerformance.getIsValid() && !pageViewSent) {
                            // If navigation timing gives invalid numbers, then go back to "override page view duration" mode.
                            // That's the best value we can get that makes sense.
                            pageView.duration = customDuration;
                            _this.appInsights.sendPageViewInternal(pageView, customProperties);
                            _this._channel.flush();
                        }
                        else {
                            if (!pageViewSent) {
                                pageView.duration = pageViewPerformance.getDurationMs();
                                _this.appInsights.sendPageViewInternal(pageView, customProperties);
                            }
                            if (!_this.pageViewPerformanceSent) {
                                _this.appInsights.sendPageViewPerformanceInternal(pageViewPerformance);
                                _this.pageViewPerformanceSent = true;
                            }
                            _this._channel.flush();
                        }
                    }
                    else if (applicationinsights_common_1.PageViewPerformance.getDuration(start, +new Date) > maxDurationLimit) {
                        // if performance timings are not ready but we exceeded the maximum duration limit, just log a page view telemetry
                        // with the maximum duration limit. Otherwise, keep waiting until performance timings are ready
                        clearInterval(handle);
                        if (!pageViewSent) {
                            pageView.duration = maxDurationLimit;
                            _this.appInsights.sendPageViewInternal(pageView, customProperties);
                            _this._channel.flush();
                        }
                    }
                }
                catch (e) {
                    applicationinsights_common_1._InternalLogging.throwInternal(applicationinsights_common_1.LoggingSeverity.CRITICAL, applicationinsights_common_1._InternalMessageId.TrackPVFailedCalc, "trackPageView failed on page load calculation: " + applicationinsights_common_1.Util.getExceptionName(e), { exception: applicationinsights_common_1.Util.dump(e) });
                }
            }, 100);
        };
        return PageViewManager;
    }());
    exports.PageViewManager = PageViewManager;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=PageViewManager.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/TelemetryContext.js":
/*!************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/TelemetryContext.js ***!
  \************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! applicationinsights-common */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/applicationinsights-common.js"), __webpack_require__(/*! ./Context/Application */ "./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/Context/Application.js"), __webpack_require__(/*! ./Context/Device */ "./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/Context/Device.js"), __webpack_require__(/*! ./Context/Internal */ "./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/Context/Internal.js"), __webpack_require__(/*! ./Context/Location */ "./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/Context/Location.js"), __webpack_require__(/*! ./Context/Operation */ "./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/Context/Operation.js"), __webpack_require__(/*! ./Context/Sample */ "./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/Context/Sample.js"), __webpack_require__(/*! ./Context/User */ "./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/Context/User.js"), __webpack_require__(/*! ./Context/Session */ "./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/Context/Session.js"), __webpack_require__(/*! applicationinsights-core-js */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-core-js/bundle/applicationinsights-core-js.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, applicationinsights_common_1, Application_1, Device_1, Internal_1, Location_1, Operation_1, Sample_1, User_1, Session_1, applicationinsights_core_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var TelemetryContext = /** @class */ (function () {
        function TelemetryContext(config, core) {
            this._config = config;
            this._core = core;
            this._telemetryInitializers = [];
            // window will be undefined in node.js where we do not want to initialize contexts
            if (typeof window !== 'undefined') {
                this._sessionManager = new Session_1._SessionManager(config);
                this.application = new Application_1.Application();
                this.device = new Device_1.Device();
                this.internal = new Internal_1.Internal(config);
                this.location = new Location_1.Location();
                this.user = new User_1.User(config);
                this.operation = new Operation_1.Operation();
                this.session = new Session_1.Session();
                this.sample = new Sample_1.Sample(config.sampleRate());
            }
            this._addDefaultTelemetryInitializers();
        }
        /**
        * Adds internal telemetry initializer to the collection.
        */
        TelemetryContext.prototype.addTelemetryInitializer = function (telemetryInitializer) {
            this._telemetryInitializers.push(telemetryInitializer);
        };
        /**
         * Uses channel to send telemetry object to the endpoint
         */
        TelemetryContext.prototype.track = function (telemetryItem) {
            if (applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(telemetryItem)) {
                applicationinsights_common_1._InternalLogging.throwInternal(applicationinsights_common_1.LoggingSeverity.CRITICAL, applicationinsights_common_1._InternalMessageId.TrackArgumentsNotSpecified, "cannot call .track() with a null or undefined argument", null, true);
            }
            else {
                // If the envelope is PageView, reset the internal message count so that we can send internal telemetry for the new page.
                if (telemetryItem.name === applicationinsights_common_1.PageView.envelopeType) {
                    applicationinsights_common_1._InternalLogging.resetInternalMessageCount();
                }
                if (this.session) {
                    // If customer did not provide custom session id update sessionmanager
                    if (typeof this.session.id !== "string") {
                        this._sessionManager.update();
                    }
                }
                this._track(telemetryItem);
            }
            return telemetryItem;
        };
        // Todo: move to separate extension
        TelemetryContext.prototype._addDefaultTelemetryInitializers = function () {
            if (!this._config.isBrowserLinkTrackingEnabled()) {
                var browserLinkPaths_1 = ['/browserLinkSignalR/', '/__browserLink/'];
                var dropBrowserLinkRequests = function (envelope) {
                    if (envelope.name === applicationinsights_common_1.RemoteDependencyData.envelopeType) {
                        var remoteData = envelope.data;
                        if (remoteData && remoteData.baseData) {
                            for (var i = 0; i < browserLinkPaths_1.length; i++) {
                                if (remoteData.baseData.name.indexOf(browserLinkPaths_1[i]) >= 0) {
                                    return false;
                                }
                            }
                        }
                    }
                    return true;
                };
                this.addTelemetryInitializer(dropBrowserLinkRequests);
            }
        };
        TelemetryContext.prototype._track = function (telemetryItem) {
            var tagsItem = {};
            if (this.session) {
                // If customer set id, apply his context; otherwise apply context generated from cookies 
                if (typeof this.session.id === "string") {
                    this._applySessionContext(tagsItem, this.session);
                }
                else {
                    this._applySessionContext(tagsItem, this._sessionManager.automaticSession);
                }
            }
            // set Part A fields
            this._applyApplicationContext(tagsItem, this.application);
            this._applyDeviceContext(tagsItem, this.device);
            this._applyInternalContext(tagsItem, this.internal);
            this._applyLocationContext(tagsItem, this.location);
            this._applySampleContext(tagsItem, this.sample);
            this._applyUserContext(tagsItem, this.user);
            this._applyOperationContext(tagsItem, this.operation);
            telemetryItem.tags.push(tagsItem);
            // set instrumentation key
            telemetryItem.instrumentationKey = this._config.instrumentationKey();
            var doNotSendItem = false;
            try {
                var telemetryInitializersCount = this._telemetryInitializers.length;
                for (var i = 0; i < telemetryInitializersCount; ++i) {
                    var telemetryInitializer = this._telemetryInitializers[i];
                    if (telemetryInitializer) {
                        if (telemetryInitializer.apply(null, [telemetryItem]) === false) {
                            doNotSendItem = true;
                            break;
                        }
                    }
                }
            }
            catch (e) {
                doNotSendItem = true;
                applicationinsights_common_1._InternalLogging.throwInternal(applicationinsights_common_1.LoggingSeverity.CRITICAL, applicationinsights_common_1._InternalMessageId.TelemetryInitializerFailed, "One of telemetry initializers failed, telemetry item will not be sent: " + applicationinsights_common_1.Util.getExceptionName(e), { exception: applicationinsights_common_1.Util.dump(e) }, true);
            }
            if (!doNotSendItem) {
                if (telemetryItem.name === applicationinsights_common_1.Metric.envelopeType || this.sample.isSampledIn(telemetryItem)) {
                    var iKeyNoDashes = this._config.instrumentationKey().replace(/-/g, "");
                    telemetryItem.name = telemetryItem.name.replace("{0}", iKeyNoDashes);
                    // map and send data
                    this._core.track(telemetryItem);
                }
                else {
                    applicationinsights_common_1._InternalLogging.throwInternal(applicationinsights_common_1.LoggingSeverity.WARNING, applicationinsights_common_1._InternalMessageId.TelemetrySampledAndNotSent, "Telemetry is sampled and not sent to the AI service.", { SampleRate: this.sample.sampleRate }, true);
                }
            }
            return telemetryItem;
        };
        TelemetryContext.prototype._applyApplicationContext = function (tagsItem, appContext) {
            if (appContext) {
                var tagKeys = new applicationinsights_common_1.ContextTagKeys();
                if (typeof appContext.ver === "string") {
                    tagsItem[tagKeys.applicationVersion] = appContext.ver;
                }
                if (typeof appContext.build === "string") {
                    tagsItem[tagKeys.applicationBuild] = appContext.build;
                }
            }
        };
        TelemetryContext.prototype._applyDeviceContext = function (tagsItem, deviceContext) {
            var tagKeys = new applicationinsights_common_1.ContextTagKeys();
            if (deviceContext) {
                if (typeof deviceContext.id === "string") {
                    tagsItem[tagKeys.deviceId] = deviceContext.id;
                }
                if (typeof deviceContext.ip === "string") {
                    tagsItem[tagKeys.deviceIp] = deviceContext.ip;
                }
                if (typeof deviceContext.language === "string") {
                    tagsItem[tagKeys.deviceLanguage] = deviceContext.language;
                }
                if (typeof deviceContext.locale === "string") {
                    tagsItem[tagKeys.deviceLocale] = deviceContext.locale;
                }
                if (typeof deviceContext.model === "string") {
                    tagsItem[tagKeys.deviceModel] = deviceContext.model;
                }
                if (typeof deviceContext.network !== "undefined") {
                    tagsItem[tagKeys.deviceNetwork] = deviceContext.network;
                }
                if (typeof deviceContext.oemName === "string") {
                    tagsItem[tagKeys.deviceOEMName] = deviceContext.oemName;
                }
                if (typeof deviceContext.os === "string") {
                    tagsItem[tagKeys.deviceOS] = deviceContext.os;
                }
                if (typeof deviceContext.osversion === "string") {
                    tagsItem[tagKeys.deviceOSVersion] = deviceContext.osversion;
                }
                if (typeof deviceContext.resolution === "string") {
                    tagsItem[tagKeys.deviceScreenResolution] = deviceContext.resolution;
                }
                if (typeof deviceContext.type === "string") {
                    tagsItem[tagKeys.deviceType] = deviceContext.type;
                }
            }
        };
        TelemetryContext.prototype._applyInternalContext = function (tagsItem, internalContext) {
            if (internalContext) {
                var tagKeys = new applicationinsights_common_1.ContextTagKeys();
                if (typeof internalContext.agentVersion === "string") {
                    tagsItem[tagKeys.internalAgentVersion] = internalContext.agentVersion;
                }
                if (typeof internalContext.sdkVersion === "string") {
                    tagsItem[tagKeys.internalSdkVersion] = internalContext.sdkVersion;
                }
            }
        };
        TelemetryContext.prototype._applyLocationContext = function (tagsItem, locationContext) {
            if (locationContext) {
                var tagKeys = new applicationinsights_common_1.ContextTagKeys();
                if (typeof locationContext.ip === "string") {
                    tagsItem[tagKeys.locationIp] = locationContext.ip;
                }
            }
        };
        TelemetryContext.prototype._applyOperationContext = function (tagsItem, operationContext) {
            if (operationContext) {
                var tagKeys = new applicationinsights_common_1.ContextTagKeys();
                if (typeof operationContext.id === "string") {
                    tagsItem[tagKeys.operationId] = operationContext.id;
                }
                if (typeof operationContext.name === "string") {
                    tagsItem[tagKeys.operationName] = operationContext.name;
                }
                if (typeof operationContext.parentId === "string") {
                    tagsItem[tagKeys.operationParentId] = operationContext.parentId;
                }
                if (typeof operationContext.rootId === "string") {
                    tagsItem[tagKeys.operationRootId] = operationContext.rootId;
                }
                if (typeof operationContext.syntheticSource === "string") {
                    tagsItem[tagKeys.operationSyntheticSource] = operationContext.syntheticSource;
                }
            }
        };
        TelemetryContext.prototype._applySampleContext = function (tagsItem, sampleContext) {
            if (sampleContext) {
                tagsItem.sampleRate = sampleContext.sampleRate;
            }
        };
        TelemetryContext.prototype._applySessionContext = function (tags, sessionContext) {
            if (sessionContext) {
                var tagKeys = new applicationinsights_common_1.ContextTagKeys();
                if (typeof sessionContext.id === "string") {
                    tags[tagKeys.sessionId] = sessionContext.id;
                }
                if (typeof sessionContext.isFirst !== "undefined") {
                    tags[tagKeys.sessionIsFirst] = sessionContext.isFirst;
                }
            }
        };
        TelemetryContext.prototype._applyUserContext = function (tagsItem, userContext) {
            if (userContext) {
                var tagKeys = new applicationinsights_common_1.ContextTagKeys();
                if (typeof userContext.accountId === "string") {
                    tagsItem[tagKeys.userAccountId] = userContext.accountId;
                }
                if (typeof userContext.agent === "string") {
                    tagsItem[tagKeys.userAgent] = userContext.agent;
                }
                if (typeof userContext.id === "string") {
                    tagsItem[tagKeys.userId] = userContext.id;
                }
                if (typeof userContext.authenticatedId === "string") {
                    tagsItem[tagKeys.userAuthUserId] = userContext.authenticatedId;
                }
                if (typeof userContext.storeRegion === "string") {
                    tagsItem[tagKeys.userStoreRegion] = userContext.storeRegion;
                }
            }
        };
        return TelemetryContext;
    }());
    exports.TelemetryContext = TelemetryContext;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=TelemetryContext.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/TelemetryItemCreator.js":
/*!****************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/TelemetryItemCreator.js ***!
  \****************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! applicationinsights-common */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/applicationinsights-common.js"), __webpack_require__(/*! applicationinsights-core-js */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-core-js/bundle/applicationinsights-core-js.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, applicationinsights_common_1, applicationinsights_core_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var TelemetryItemCreator = /** @class */ (function () {
        function TelemetryItemCreator() {
        }
        TelemetryItemCreator.createItem = function (pageView, baseType, envelopeName, customProperties, systemProperties) {
            if (applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(pageView) ||
                applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(baseType) ||
                applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(envelopeName)) {
                throw Error("pageView doesn't contain all required fields");
            }
            ;
            return TelemetryItemCreator.creator.create(pageView, baseType, envelopeName, customProperties, systemProperties);
        };
        TelemetryItemCreator.prototype.create = function (pageView, baseType, envelopeName, customProperties, systemProperties) {
            envelopeName = applicationinsights_common_1.DataSanitizer.sanitizeString(envelopeName) || applicationinsights_common_1.Util.NotSpecified;
            if (baseType === applicationinsights_common_1.PageView.dataType) {
                var item = {
                    name: envelopeName,
                    timestamp: new Date(),
                    instrumentationKey: "",
                    ctx: systemProperties ? systemProperties : {},
                    tags: [],
                    data: {},
                    baseType: baseType,
                    baseData: pageView
                };
                // Part C
                if (!applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(customProperties)) {
                    for (var prop in customProperties) {
                        if (customProperties.hasOwnProperty(prop)) {
                            item.data[prop] = customProperties[prop];
                        }
                    }
                }
                return item;
            }
            throw Error("Not implemented");
        };
        TelemetryItemCreator.creator = new TelemetryItemCreator();
        return TelemetryItemCreator;
    }());
    exports.TelemetryItemCreator = TelemetryItemCreator;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=TelemetryItemCreator.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/bundle/applicationinsights-analytics-js.js":
/*!**************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/bundle/applicationinsights-analytics-js.js ***!
  \**************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ./JavaScriptSDK/ApplicationInsights */ "./node_modules/applicationinsights-analytics-js/bundle/JavaScriptSDK/ApplicationInsights.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, ApplicationInsights_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ApplicationInsights = ApplicationInsights_1.ApplicationInsights;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=applicationinsights-analytics-js.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Constants.js":
/*!*******************************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Constants.js ***!
  \*******************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DisabledPropertyName = "Microsoft_ApplicationInsights_BypassAjaxInstrumentation";
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=Constants.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Enums.js":
/*!***************************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Enums.js ***!
  \***************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var LoggingSeverity;
    (function (LoggingSeverity) {
        /**
         * Error will be sent as internal telemetry
         */
        LoggingSeverity[LoggingSeverity["CRITICAL"] = 0] = "CRITICAL";
        /**
         * Error will NOT be sent as internal telemetry, and will only be shown in browser console
         */
        LoggingSeverity[LoggingSeverity["WARNING"] = 1] = "WARNING";
    })(LoggingSeverity = exports.LoggingSeverity || (exports.LoggingSeverity = {}));
    /**
     * Internal message ID. Please create a new one for every conceptually different message. Please keep alphabetically ordered
     */
    var _InternalMessageId;
    (function (_InternalMessageId) {
        // Non user actionable
        _InternalMessageId[_InternalMessageId["BrowserDoesNotSupportLocalStorage"] = 0] = "BrowserDoesNotSupportLocalStorage";
        _InternalMessageId[_InternalMessageId["BrowserCannotReadLocalStorage"] = 1] = "BrowserCannotReadLocalStorage";
        _InternalMessageId[_InternalMessageId["BrowserCannotReadSessionStorage"] = 2] = "BrowserCannotReadSessionStorage";
        _InternalMessageId[_InternalMessageId["BrowserCannotWriteLocalStorage"] = 3] = "BrowserCannotWriteLocalStorage";
        _InternalMessageId[_InternalMessageId["BrowserCannotWriteSessionStorage"] = 4] = "BrowserCannotWriteSessionStorage";
        _InternalMessageId[_InternalMessageId["BrowserFailedRemovalFromLocalStorage"] = 5] = "BrowserFailedRemovalFromLocalStorage";
        _InternalMessageId[_InternalMessageId["BrowserFailedRemovalFromSessionStorage"] = 6] = "BrowserFailedRemovalFromSessionStorage";
        _InternalMessageId[_InternalMessageId["CannotSendEmptyTelemetry"] = 7] = "CannotSendEmptyTelemetry";
        _InternalMessageId[_InternalMessageId["ClientPerformanceMathError"] = 8] = "ClientPerformanceMathError";
        _InternalMessageId[_InternalMessageId["ErrorParsingAISessionCookie"] = 9] = "ErrorParsingAISessionCookie";
        _InternalMessageId[_InternalMessageId["ErrorPVCalc"] = 10] = "ErrorPVCalc";
        _InternalMessageId[_InternalMessageId["ExceptionWhileLoggingError"] = 11] = "ExceptionWhileLoggingError";
        _InternalMessageId[_InternalMessageId["FailedAddingTelemetryToBuffer"] = 12] = "FailedAddingTelemetryToBuffer";
        _InternalMessageId[_InternalMessageId["FailedMonitorAjaxAbort"] = 13] = "FailedMonitorAjaxAbort";
        _InternalMessageId[_InternalMessageId["FailedMonitorAjaxDur"] = 14] = "FailedMonitorAjaxDur";
        _InternalMessageId[_InternalMessageId["FailedMonitorAjaxOpen"] = 15] = "FailedMonitorAjaxOpen";
        _InternalMessageId[_InternalMessageId["FailedMonitorAjaxRSC"] = 16] = "FailedMonitorAjaxRSC";
        _InternalMessageId[_InternalMessageId["FailedMonitorAjaxSend"] = 17] = "FailedMonitorAjaxSend";
        _InternalMessageId[_InternalMessageId["FailedMonitorAjaxGetCorrelationHeader"] = 18] = "FailedMonitorAjaxGetCorrelationHeader";
        _InternalMessageId[_InternalMessageId["FailedToAddHandlerForOnBeforeUnload"] = 19] = "FailedToAddHandlerForOnBeforeUnload";
        _InternalMessageId[_InternalMessageId["FailedToSendQueuedTelemetry"] = 20] = "FailedToSendQueuedTelemetry";
        _InternalMessageId[_InternalMessageId["FailedToReportDataLoss"] = 21] = "FailedToReportDataLoss";
        _InternalMessageId[_InternalMessageId["FlushFailed"] = 22] = "FlushFailed";
        _InternalMessageId[_InternalMessageId["MessageLimitPerPVExceeded"] = 23] = "MessageLimitPerPVExceeded";
        _InternalMessageId[_InternalMessageId["MissingRequiredFieldSpecification"] = 24] = "MissingRequiredFieldSpecification";
        _InternalMessageId[_InternalMessageId["NavigationTimingNotSupported"] = 25] = "NavigationTimingNotSupported";
        _InternalMessageId[_InternalMessageId["OnError"] = 26] = "OnError";
        _InternalMessageId[_InternalMessageId["SessionRenewalDateIsZero"] = 27] = "SessionRenewalDateIsZero";
        _InternalMessageId[_InternalMessageId["SenderNotInitialized"] = 28] = "SenderNotInitialized";
        _InternalMessageId[_InternalMessageId["StartTrackEventFailed"] = 29] = "StartTrackEventFailed";
        _InternalMessageId[_InternalMessageId["StopTrackEventFailed"] = 30] = "StopTrackEventFailed";
        _InternalMessageId[_InternalMessageId["StartTrackFailed"] = 31] = "StartTrackFailed";
        _InternalMessageId[_InternalMessageId["StopTrackFailed"] = 32] = "StopTrackFailed";
        _InternalMessageId[_InternalMessageId["TelemetrySampledAndNotSent"] = 33] = "TelemetrySampledAndNotSent";
        _InternalMessageId[_InternalMessageId["TrackEventFailed"] = 34] = "TrackEventFailed";
        _InternalMessageId[_InternalMessageId["TrackExceptionFailed"] = 35] = "TrackExceptionFailed";
        _InternalMessageId[_InternalMessageId["TrackMetricFailed"] = 36] = "TrackMetricFailed";
        _InternalMessageId[_InternalMessageId["TrackPVFailed"] = 37] = "TrackPVFailed";
        _InternalMessageId[_InternalMessageId["TrackPVFailedCalc"] = 38] = "TrackPVFailedCalc";
        _InternalMessageId[_InternalMessageId["TrackTraceFailed"] = 39] = "TrackTraceFailed";
        _InternalMessageId[_InternalMessageId["TransmissionFailed"] = 40] = "TransmissionFailed";
        _InternalMessageId[_InternalMessageId["FailedToSetStorageBuffer"] = 41] = "FailedToSetStorageBuffer";
        _InternalMessageId[_InternalMessageId["FailedToRestoreStorageBuffer"] = 42] = "FailedToRestoreStorageBuffer";
        _InternalMessageId[_InternalMessageId["InvalidBackendResponse"] = 43] = "InvalidBackendResponse";
        _InternalMessageId[_InternalMessageId["FailedToFixDepricatedValues"] = 44] = "FailedToFixDepricatedValues";
        _InternalMessageId[_InternalMessageId["InvalidDurationValue"] = 45] = "InvalidDurationValue";
        _InternalMessageId[_InternalMessageId["TelemetryEnvelopeInvalid"] = 46] = "TelemetryEnvelopeInvalid";
        _InternalMessageId[_InternalMessageId["CreateEnvelopeError"] = 47] = "CreateEnvelopeError";
        // User actionable
        _InternalMessageId[_InternalMessageId["CannotSerializeObject"] = 48] = "CannotSerializeObject";
        _InternalMessageId[_InternalMessageId["CannotSerializeObjectNonSerializable"] = 49] = "CannotSerializeObjectNonSerializable";
        _InternalMessageId[_InternalMessageId["CircularReferenceDetected"] = 50] = "CircularReferenceDetected";
        _InternalMessageId[_InternalMessageId["ClearAuthContextFailed"] = 51] = "ClearAuthContextFailed";
        _InternalMessageId[_InternalMessageId["ExceptionTruncated"] = 52] = "ExceptionTruncated";
        _InternalMessageId[_InternalMessageId["IllegalCharsInName"] = 53] = "IllegalCharsInName";
        _InternalMessageId[_InternalMessageId["ItemNotInArray"] = 54] = "ItemNotInArray";
        _InternalMessageId[_InternalMessageId["MaxAjaxPerPVExceeded"] = 55] = "MaxAjaxPerPVExceeded";
        _InternalMessageId[_InternalMessageId["MessageTruncated"] = 56] = "MessageTruncated";
        _InternalMessageId[_InternalMessageId["NameTooLong"] = 57] = "NameTooLong";
        _InternalMessageId[_InternalMessageId["SampleRateOutOfRange"] = 58] = "SampleRateOutOfRange";
        _InternalMessageId[_InternalMessageId["SetAuthContextFailed"] = 59] = "SetAuthContextFailed";
        _InternalMessageId[_InternalMessageId["SetAuthContextFailedAccountName"] = 60] = "SetAuthContextFailedAccountName";
        _InternalMessageId[_InternalMessageId["StringValueTooLong"] = 61] = "StringValueTooLong";
        _InternalMessageId[_InternalMessageId["StartCalledMoreThanOnce"] = 62] = "StartCalledMoreThanOnce";
        _InternalMessageId[_InternalMessageId["StopCalledWithoutStart"] = 63] = "StopCalledWithoutStart";
        _InternalMessageId[_InternalMessageId["TelemetryInitializerFailed"] = 64] = "TelemetryInitializerFailed";
        _InternalMessageId[_InternalMessageId["TrackArgumentsNotSpecified"] = 65] = "TrackArgumentsNotSpecified";
        _InternalMessageId[_InternalMessageId["UrlTooLong"] = 66] = "UrlTooLong";
        _InternalMessageId[_InternalMessageId["SessionStorageBufferFull"] = 67] = "SessionStorageBufferFull";
        _InternalMessageId[_InternalMessageId["CannotAccessCookie"] = 68] = "CannotAccessCookie";
        _InternalMessageId[_InternalMessageId["IdTooLong"] = 69] = "IdTooLong";
    })(_InternalMessageId = exports._InternalMessageId || (exports._InternalMessageId = {}));
    /**
    * Type of storage to differentiate between local storage and session storage
    */
    var StorageType;
    (function (StorageType) {
        StorageType[StorageType["LocalStorage"] = 0] = "LocalStorage";
        StorageType[StorageType["SessionStorage"] = 1] = "SessionStorage";
    })(StorageType = exports.StorageType || (exports.StorageType = {}));
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
    })(FieldType = exports.FieldType || (exports.FieldType = {}));
    ;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=Enums.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/Base.js":
/*!*********************************************************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/Base.js ***!
  \*********************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// THIS FILE WAS AUTOGENERATED
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
         * Data struct to contain only C section with custom fields.
         */
    var Base = /** @class */ (function () {
        function Base() {
        }
        return Base;
    }());
    exports.Base = Base;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=Base.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/ContextTagKeys.js":
/*!*******************************************************************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/ContextTagKeys.js ***!
  \*******************************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
            this.internalSdkVersion = "ai.internal.sdkVersion";
            this.internalAgentVersion = "ai.internal.agentVersion";
            this.internalNodeName = "ai.internal.nodeName";
        }
        return ContextTagKeys;
    }());
    exports.ContextTagKeys = ContextTagKeys;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=ContextTagKeys.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/Data.js":
/*!*********************************************************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/Data.js ***!
  \*********************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ./Base */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/Base.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, Base_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Data struct to contain both B and C sections.
     */
    var Data = /** @class */ (function (_super) {
        __extends(Data, _super);
        function Data() {
            return _super.call(this) || this;
        }
        return Data;
    }(Base_1.Base));
    exports.Data = Data;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=Data.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/DataPoint.js":
/*!**************************************************************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/DataPoint.js ***!
  \**************************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ./DataPointType */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/DataPointType.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, DataPointType_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Metric data single measurement.
     */
    var DataPoint = /** @class */ (function () {
        function DataPoint() {
            this.kind = DataPointType_1.DataPointType.Measurement;
        }
        return DataPoint;
    }());
    exports.DataPoint = DataPoint;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=DataPoint.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/DataPointType.js":
/*!******************************************************************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/DataPointType.js ***!
  \******************************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // THIS FILE WAS AUTOGENERATED
    /**
     * Type of the metric data measurement.
     */
    var DataPointType;
    (function (DataPointType) {
        DataPointType[DataPointType["Measurement"] = 0] = "Measurement";
        DataPointType[DataPointType["Aggregation"] = 1] = "Aggregation";
    })(DataPointType = exports.DataPointType || (exports.DataPointType = {}));
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=DataPointType.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/Domain.js":
/*!***********************************************************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/Domain.js ***!
  \***********************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// THIS FILE WAS AUTOGENERATED
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * The abstract common base of all domains.
     */
    var Domain = /** @class */ (function () {
        function Domain() {
        }
        return Domain;
    }());
    exports.Domain = Domain;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=Domain.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/Envelope.js":
/*!*************************************************************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/Envelope.js ***!
  \*************************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
    exports.Envelope = Envelope;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=Envelope.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/EventData.js":
/*!**************************************************************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/EventData.js ***!
  \**************************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ./Domain */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/Domain.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, Domain_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
    }(Domain_1.Domain));
    exports.EventData = EventData;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=EventData.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/ExceptionData.js":
/*!******************************************************************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/ExceptionData.js ***!
  \******************************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ./Domain */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/Domain.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, Domain_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
    }(Domain_1.Domain));
    exports.ExceptionData = ExceptionData;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=ExceptionData.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/ExceptionDetails.js":
/*!*********************************************************************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/ExceptionDetails.js ***!
  \*********************************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
    exports.ExceptionDetails = ExceptionDetails;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=ExceptionDetails.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/MessageData.js":
/*!****************************************************************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/MessageData.js ***!
  \****************************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ./Domain */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/Domain.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, Domain_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Instances of Message represent printf-like trace statements that are text-searched. Log4Net, NLog and other text-based log file entries are translated into intances of this type. The message does not have measurements.
     */
    var MessageData = /** @class */ (function (_super) {
        __extends(MessageData, _super);
        function MessageData() {
            var _this = _super.call(this) || this;
            _this.ver = 2;
            _this.properties = {};
            return _this;
        }
        return MessageData;
    }(Domain_1.Domain));
    exports.MessageData = MessageData;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=MessageData.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/MetricData.js":
/*!***************************************************************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/MetricData.js ***!
  \***************************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ./Domain */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/Domain.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, Domain_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
            return _this;
        }
        return MetricData;
    }(Domain_1.Domain));
    exports.MetricData = MetricData;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=MetricData.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/PageViewData.js":
/*!*****************************************************************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/PageViewData.js ***!
  \*****************************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ./EventData */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/EventData.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, EventData_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
    }(EventData_1.EventData));
    exports.PageViewData = PageViewData;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=PageViewData.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/PageViewPerfData.js":
/*!*********************************************************************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/PageViewPerfData.js ***!
  \*********************************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ./PageViewData */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/PageViewData.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, PageViewData_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
    }(PageViewData_1.PageViewData));
    exports.PageViewPerfData = PageViewPerfData;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=PageViewPerfData.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/RemoteDependencyData.js":
/*!*************************************************************************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/RemoteDependencyData.js ***!
  \*************************************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ./Domain */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/Domain.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, Domain_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
    }(Domain_1.Domain));
    exports.RemoteDependencyData = RemoteDependencyData;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=RemoteDependencyData.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/SeverityLevel.js":
/*!******************************************************************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/SeverityLevel.js ***!
  \******************************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// THIS FILE WAS AUTOGENERATED
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
    })(SeverityLevel = exports.SeverityLevel || (exports.SeverityLevel = {}));
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=SeverityLevel.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/StackFrame.js":
/*!***************************************************************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/StackFrame.js ***!
  \***************************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // THIS FILE WAS AUTOGENERATED
    /**
     * Stack frame information.
     */
    var StackFrame = /** @class */ (function () {
        function StackFrame() {
        }
        return StackFrame;
    }());
    exports.StackFrame = StackFrame;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=StackFrame.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Logging.js":
/*!*****************************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Logging.js ***!
  \*****************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ./Enums */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Enums.js"), __webpack_require__(/*! ./Util */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Util.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, Enums_1, Util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var _InternalLogMessage = /** @class */ (function () {
        function _InternalLogMessage(msgId, msg, isUserAct, properties) {
            if (isUserAct === void 0) { isUserAct = false; }
            this.messageId = msgId;
            this.message =
                (isUserAct ? _InternalLogMessage.AiUserActionablePrefix : _InternalLogMessage.AiNonUserActionablePrefix) +
                    Enums_1._InternalMessageId[msgId].toString();
            var diagnosticText = (msg ? " message:" + _InternalLogMessage.sanitizeDiagnosticText(msg) : "") +
                (properties ? " props:" + _InternalLogMessage.sanitizeDiagnosticText(JSON.stringify(properties)) : "");
            this.message += diagnosticText;
        }
        _InternalLogMessage.sanitizeDiagnosticText = function (text) {
            return "\"" + text.replace(/\"/g, "") + "\"";
        };
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
    exports._InternalLogMessage = _InternalLogMessage;
    var _InternalLogging = /** @class */ (function () {
        function _InternalLogging() {
        }
        /**
         * This method will throw exceptions in debug mode or attempt to log the error as a console warning.
         * @param severity {LoggingSeverity} - The severity of the log message
         * @param message {_InternalLogMessage} - The log message.
         */
        _InternalLogging.throwInternal = function (severity, msgId, msg, properties, isUserAct) {
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
                            var messageKey = Enums_1._InternalMessageId[message.messageId];
                            if (!this._messageLogged[messageKey] || this.verboseLogging()) {
                                this.warnToConsole(message.message);
                                this._messageLogged[messageKey] = true;
                            }
                        }
                        else {
                            // don't log internal AI traces in the console, unless the verbose logging is enabled
                            if (this.verboseLogging()) {
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
        _InternalLogging.warnToConsole = function (message) {
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
        _InternalLogging.resetInternalMessageCount = function () {
            this._messageCount = 0;
            this._messageLogged = {};
        };
        /**
         * Clears the list of records indicating that internal message type was already logged
         */
        _InternalLogging.clearInternalMessageLoggedTypes = function () {
            if (Util_1.Util.canUseSessionStorage()) {
                var sessionStorageKeys = Util_1.Util.getSessionStorageKeys();
                for (var i = 0; i < sessionStorageKeys.length; i++) {
                    if (sessionStorageKeys[i].indexOf(_InternalLogging.AIInternalMessagePrefix) === 0) {
                        Util_1.Util.removeSessionStorage(sessionStorageKeys[i]);
                    }
                }
            }
        };
        /**
         * Sets the limit for the number of internal events before they are throttled
         * @param limit {number} - The throttle limit to set for internal events
         */
        _InternalLogging.setMaxInternalMessageLimit = function (limit) {
            if (!limit) {
                throw new Error('limit cannot be undefined.');
            }
            this.MAX_INTERNAL_MESSAGE_LIMIT = limit;
        };
        /**
         * Logs a message to the internal queue.
         * @param severity {LoggingSeverity} - The severity of the log message
         * @param message {_InternalLogMessage} - The message to log.
         */
        _InternalLogging.logInternalMessage = function (severity, message) {
            if (this._areInternalMessagesThrottled()) {
                return;
            }
            // check if this message type was already logged for this session and if so, don't log it again
            var logMessage = true;
            var messageKey = _InternalLogging.AIInternalMessagePrefix + Enums_1._InternalMessageId[message.messageId];
            if (Util_1.Util.canUseSessionStorage()) {
                var internalMessageTypeLogRecord = Util_1.Util.getSessionStorage(messageKey);
                if (internalMessageTypeLogRecord) {
                    logMessage = false;
                }
                else {
                    Util_1.Util.setSessionStorage(messageKey, "1");
                }
            }
            else {
                // if the session storage is not available, limit to only one message type per page view
                if (this._messageLogged[messageKey]) {
                    logMessage = false;
                }
                else {
                    this._messageLogged[messageKey] = true;
                }
            }
            if (logMessage) {
                // Push the event in the internal queue
                if (this.verboseLogging() || severity === Enums_1.LoggingSeverity.CRITICAL) {
                    this.queue.push(message);
                    this._messageCount++;
                }
                // When throttle limit reached, send a special event
                if (this._messageCount == this.MAX_INTERNAL_MESSAGE_LIMIT) {
                    var throttleLimitMessage = "Internal events throttle limit per PageView reached for this app.";
                    var throttleMessage = new _InternalLogMessage(Enums_1._InternalMessageId.MessageLimitPerPVExceeded, throttleLimitMessage, false);
                    this.queue.push(throttleMessage);
                    this.warnToConsole(throttleLimitMessage);
                }
            }
        };
        /**
         * Indicates whether the internal events are throttled
         */
        _InternalLogging._areInternalMessagesThrottled = function () {
            return this._messageCount >= this.MAX_INTERNAL_MESSAGE_LIMIT;
        };
        /**
        *  Session storage key for the prefix for the key indicating message type already logged
        */
        _InternalLogging.AIInternalMessagePrefix = "AITR_";
        /**
         * When this is true the SDK will throw exceptions to aid in debugging.
         */
        _InternalLogging.enableDebugExceptions = function () { return false; };
        /**
         * When this is true the SDK will log more messages to aid in debugging.
         */
        _InternalLogging.verboseLogging = function () { return false; };
        /**
         * The internal logging queue
         */
        _InternalLogging.queue = [];
        /**
         * The maximum number of internal messages allowed to be sent per page view
         */
        _InternalLogging.MAX_INTERNAL_MESSAGE_LIMIT = 25;
        /**
         * Count of internal messages sent
         */
        _InternalLogging._messageCount = 0;
        /**
         * Holds information about what message types were already logged to console or sent to server.
         */
        _InternalLogging._messageLogged = {};
        return _InternalLogging;
    }());
    exports._InternalLogging = _InternalLogging;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=Logging.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/RequestResponseHeaders.js":
/*!********************************************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/RequestResponseHeaders.js ***!
  \********************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
    exports.RequestHeaders = RequestHeaders;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=RequestResponseHeaders.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Telemetry/Common/Data.js":
/*!*******************************************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Telemetry/Common/Data.js ***!
  \*******************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ../../Interfaces/Contracts/Generated/Data */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/Data.js"), __webpack_require__(/*! ../../Enums */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Enums.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, Data_1, Enums_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Data = /** @class */ (function (_super) {
        __extends(Data, _super);
        /**
         * Constructs a new instance of telemetry data.
         */
        function Data(type, data) {
            var _this = _super.call(this) || this;
            /**
             * The data contract for serializing this object.
             */
            _this.aiDataContract = {
                baseType: Enums_1.FieldType.Required,
                baseData: Enums_1.FieldType.Required
            };
            _this.baseType = type;
            _this.baseData = data;
            return _this;
        }
        return Data;
    }(Data_1.Data));
    exports.Data = Data;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=Data.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Telemetry/Common/DataPoint.js":
/*!************************************************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Telemetry/Common/DataPoint.js ***!
  \************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ../../Interfaces/Contracts/Generated/DataPoint */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/DataPoint.js"), __webpack_require__(/*! ../../Enums */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Enums.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, DataPoint_1, Enums_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var DataPoint = /** @class */ (function (_super) {
        __extends(DataPoint, _super);
        function DataPoint() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            /**
             * The data contract for serializing this object.
             */
            _this.aiDataContract = {
                name: Enums_1.FieldType.Required,
                kind: Enums_1.FieldType.Default,
                value: Enums_1.FieldType.Required,
                count: Enums_1.FieldType.Default,
                min: Enums_1.FieldType.Default,
                max: Enums_1.FieldType.Default,
                stdDev: Enums_1.FieldType.Default
            };
            return _this;
        }
        return DataPoint;
    }(DataPoint_1.DataPoint));
    exports.DataPoint = DataPoint;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=DataPoint.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Telemetry/Common/DataSanitizer.js":
/*!****************************************************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Telemetry/Common/DataSanitizer.js ***!
  \****************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ../../Logging */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Logging.js"), __webpack_require__(/*! ../../Util */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Util.js"), __webpack_require__(/*! ../../Enums */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Enums.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, Logging_1, Util_1, Enums_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var DataSanitizer = /** @class */ (function () {
        function DataSanitizer() {
        }
        DataSanitizer.sanitizeKeyAndAddUniqueness = function (key, map) {
            var origLength = key.length;
            var field = DataSanitizer.sanitizeKey(key);
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
        DataSanitizer.sanitizeKey = function (name) {
            if (name) {
                // Remove any leading or trailing whitepace
                name = Util_1.Util.trim(name.toString());
                // truncate the string to 150 chars
                if (name.length > DataSanitizer.MAX_NAME_LENGTH) {
                    name = name.substring(0, DataSanitizer.MAX_NAME_LENGTH);
                    Logging_1._InternalLogging.throwInternal(Enums_1.LoggingSeverity.WARNING, Enums_1._InternalMessageId.NameTooLong, "name is too long.  It has been truncated to " + DataSanitizer.MAX_NAME_LENGTH + " characters.", { name: name }, true);
                }
            }
            return name;
        };
        DataSanitizer.sanitizeString = function (value, maxLength) {
            if (maxLength === void 0) { maxLength = DataSanitizer.MAX_STRING_LENGTH; }
            if (value) {
                maxLength = maxLength ? maxLength : DataSanitizer.MAX_STRING_LENGTH; // in case default parameters dont work
                value = Util_1.Util.trim(value);
                if (value.toString().length > maxLength) {
                    value = value.toString().substring(0, maxLength);
                    Logging_1._InternalLogging.throwInternal(Enums_1.LoggingSeverity.WARNING, Enums_1._InternalMessageId.StringValueTooLong, "string value is too long. It has been truncated to " + maxLength + " characters.", { value: value }, true);
                }
            }
            return value;
        };
        DataSanitizer.sanitizeUrl = function (url) {
            return DataSanitizer.sanitizeInput(url, DataSanitizer.MAX_URL_LENGTH, Enums_1._InternalMessageId.UrlTooLong);
        };
        DataSanitizer.sanitizeMessage = function (message) {
            if (message) {
                if (message.length > DataSanitizer.MAX_MESSAGE_LENGTH) {
                    message = message.substring(0, DataSanitizer.MAX_MESSAGE_LENGTH);
                    Logging_1._InternalLogging.throwInternal(Enums_1.LoggingSeverity.WARNING, Enums_1._InternalMessageId.MessageTruncated, "message is too long, it has been truncated to " + DataSanitizer.MAX_MESSAGE_LENGTH + " characters.", { message: message }, true);
                }
            }
            return message;
        };
        DataSanitizer.sanitizeException = function (exception) {
            if (exception) {
                if (exception.length > DataSanitizer.MAX_EXCEPTION_LENGTH) {
                    exception = exception.substring(0, DataSanitizer.MAX_EXCEPTION_LENGTH);
                    Logging_1._InternalLogging.throwInternal(Enums_1.LoggingSeverity.WARNING, Enums_1._InternalMessageId.ExceptionTruncated, "exception is too long, it has been truncated to " + DataSanitizer.MAX_EXCEPTION_LENGTH + " characters.", { exception: exception }, true);
                }
            }
            return exception;
        };
        DataSanitizer.sanitizeProperties = function (properties) {
            if (properties) {
                var tempProps = {};
                for (var prop in properties) {
                    var value = DataSanitizer.sanitizeString(properties[prop], DataSanitizer.MAX_PROPERTY_LENGTH);
                    prop = DataSanitizer.sanitizeKeyAndAddUniqueness(prop, tempProps);
                    tempProps[prop] = value;
                }
                properties = tempProps;
            }
            return properties;
        };
        DataSanitizer.sanitizeMeasurements = function (measurements) {
            if (measurements) {
                var tempMeasurements = {};
                for (var measure in measurements) {
                    var value = measurements[measure];
                    measure = DataSanitizer.sanitizeKeyAndAddUniqueness(measure, tempMeasurements);
                    tempMeasurements[measure] = value;
                }
                measurements = tempMeasurements;
            }
            return measurements;
        };
        DataSanitizer.sanitizeId = function (id) {
            return id ? DataSanitizer.sanitizeInput(id, DataSanitizer.MAX_ID_LENGTH, Enums_1._InternalMessageId.IdTooLong).toString() : id;
        };
        DataSanitizer.sanitizeInput = function (input, maxLength, _msgId) {
            if (input) {
                input = Util_1.Util.trim(input);
                if (input.length > maxLength) {
                    input = input.substring(0, maxLength);
                    Logging_1._InternalLogging.throwInternal(Enums_1.LoggingSeverity.WARNING, _msgId, "input is too long, it has been truncated to " + maxLength + " characters.", { data: input }, true);
                }
            }
            return input;
        };
        DataSanitizer.padNumber = function (num) {
            var s = "00" + num;
            return s.substr(s.length - 3);
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
    exports.DataSanitizer = DataSanitizer;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=DataSanitizer.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Telemetry/Common/Envelope.js":
/*!***********************************************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Telemetry/Common/Envelope.js ***!
  \***********************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ../../Interfaces/Contracts/Generated/Envelope */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/Envelope.js"), __webpack_require__(/*! ./DataSanitizer */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Telemetry/Common/DataSanitizer.js"), __webpack_require__(/*! ../../Enums */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Enums.js"), __webpack_require__(/*! ../../Util */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Util.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, Envelope_1, DataSanitizer_1, Enums_1, Util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Envelope = /** @class */ (function (_super) {
        __extends(Envelope, _super);
        /**
         * Constructs a new instance of telemetry data.
         */
        function Envelope(data, name) {
            var _this = _super.call(this) || this;
            _this.name = DataSanitizer_1.DataSanitizer.sanitizeString(name) || Util_1.Util.NotSpecified;
            _this.data = data;
            _this.time = Util_1.Util.toISOStringForIE8(new Date());
            _this.aiDataContract = {
                time: Enums_1.FieldType.Required,
                iKey: Enums_1.FieldType.Required,
                name: Enums_1.FieldType.Required,
                sampleRate: function () {
                    return (_this.sampleRate == 100) ? Enums_1.FieldType.Hidden : Enums_1.FieldType.Required;
                },
                tags: Enums_1.FieldType.Required,
                data: Enums_1.FieldType.Required
            };
            return _this;
        }
        return Envelope;
    }(Envelope_1.Envelope));
    exports.Envelope = Envelope;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=Envelope.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Telemetry/Event.js":
/*!*************************************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Telemetry/Event.js ***!
  \*************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ../Interfaces/Contracts/Generated/EventData */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/EventData.js"), __webpack_require__(/*! ./Common/DataSanitizer */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Telemetry/Common/DataSanitizer.js"), __webpack_require__(/*! ../Enums */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Enums.js"), __webpack_require__(/*! ../Util */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Util.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, EventData_1, DataSanitizer_1, Enums_1, Util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Event = /** @class */ (function (_super) {
        __extends(Event, _super);
        /**
         * Constructs a new instance of the EventTelemetry object
         */
        function Event(name, properties, measurements) {
            var _this = _super.call(this) || this;
            _this.aiDataContract = {
                ver: Enums_1.FieldType.Required,
                name: Enums_1.FieldType.Required,
                properties: Enums_1.FieldType.Default,
                measurements: Enums_1.FieldType.Default
            };
            _this.name = DataSanitizer_1.DataSanitizer.sanitizeString(name) || Util_1.Util.NotSpecified;
            _this.properties = DataSanitizer_1.DataSanitizer.sanitizeProperties(properties);
            _this.measurements = DataSanitizer_1.DataSanitizer.sanitizeMeasurements(measurements);
            return _this;
        }
        Event.envelopeType = "Microsoft.ApplicationInsights.{0}.Event";
        Event.dataType = "EventData";
        return Event;
    }(EventData_1.EventData));
    exports.Event = Event;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=Event.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Telemetry/Exception.js":
/*!*****************************************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Telemetry/Exception.js ***!
  \*****************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ../Interfaces/Contracts/Generated/StackFrame */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/StackFrame.js"), __webpack_require__(/*! ../Interfaces/Contracts/Generated/ExceptionData */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/ExceptionData.js"), __webpack_require__(/*! ../Interfaces/Contracts/Generated/ExceptionDetails */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/ExceptionDetails.js"), __webpack_require__(/*! ./Common/DataSanitizer */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Telemetry/Common/DataSanitizer.js"), __webpack_require__(/*! ../Enums */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Enums.js"), __webpack_require__(/*! ../Util */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Util.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, StackFrame_1, ExceptionData_1, ExceptionDetails_1, DataSanitizer_1, Enums_1, Util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Exception = /** @class */ (function (_super) {
        __extends(Exception, _super);
        /**
        * Constructs a new isntance of the ExceptionTelemetry object
        */
        function Exception(exception, properties, measurements, severityLevel) {
            var _this = _super.call(this) || this;
            _this.aiDataContract = {
                ver: Enums_1.FieldType.Required,
                exceptions: Enums_1.FieldType.Required,
                severityLevel: Enums_1.FieldType.Default,
                properties: Enums_1.FieldType.Default,
                measurements: Enums_1.FieldType.Default
            };
            _this.properties = DataSanitizer_1.DataSanitizer.sanitizeProperties(properties);
            _this.measurements = DataSanitizer_1.DataSanitizer.sanitizeMeasurements(measurements);
            _this.exceptions = [new _ExceptionDetails(exception)];
            if (severityLevel) {
                _this.severityLevel = severityLevel;
            }
            return _this;
        }
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
    }(ExceptionData_1.ExceptionData));
    exports.Exception = Exception;
    var _ExceptionDetails = /** @class */ (function (_super) {
        __extends(_ExceptionDetails, _super);
        function _ExceptionDetails(exception) {
            var _this = _super.call(this) || this;
            _this.aiDataContract = {
                id: Enums_1.FieldType.Default,
                outerId: Enums_1.FieldType.Default,
                typeName: Enums_1.FieldType.Required,
                message: Enums_1.FieldType.Required,
                hasFullStack: Enums_1.FieldType.Default,
                stack: Enums_1.FieldType.Default,
                parsedStack: Enums_1.FieldType.Array
            };
            _this.typeName = DataSanitizer_1.DataSanitizer.sanitizeString(exception.name) || Util_1.Util.NotSpecified;
            _this.message = DataSanitizer_1.DataSanitizer.sanitizeMessage(exception.message) || Util_1.Util.NotSpecified;
            var stack = exception["stack"];
            _this.parsedStack = _this.parseStack(stack);
            _this.stack = DataSanitizer_1.DataSanitizer.sanitizeException(stack);
            _this.hasFullStack = Util_1.Util.isArray(_this.parsedStack) && _this.parsedStack.length > 0;
            return _this;
        }
        _ExceptionDetails.prototype.parseStack = function (stack) {
            var parsedStack = undefined;
            if (typeof stack === "string") {
                var frames = stack.split('\n');
                parsedStack = [];
                var level = 0;
                var totalSizeInBytes = 0;
                for (var i = 0; i <= frames.length; i++) {
                    var frame = frames[i];
                    if (_StackFrame.regex.test(frame)) {
                        var parsedFrame = new _StackFrame(frames[i], level++);
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
    }(ExceptionDetails_1.ExceptionDetails));
    var _StackFrame = /** @class */ (function (_super) {
        __extends(_StackFrame, _super);
        function _StackFrame(frame, level) {
            var _this = _super.call(this) || this;
            _this.sizeInBytes = 0;
            _this.aiDataContract = {
                level: Enums_1.FieldType.Required,
                method: Enums_1.FieldType.Required,
                assembly: Enums_1.FieldType.Default,
                fileName: Enums_1.FieldType.Default,
                line: Enums_1.FieldType.Default
            };
            _this.level = level;
            _this.method = "<no_method>";
            _this.assembly = Util_1.Util.trim(frame);
            var matches = frame.match(_StackFrame.regex);
            if (matches && matches.length >= 5) {
                _this.method = Util_1.Util.trim(matches[2]) || _this.method;
                _this.fileName = Util_1.Util.trim(matches[4]);
                _this.line = parseInt(matches[5]) || 0;
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
        // regex to match stack frames from ie/chrome/ff
        // methodName=$2, fileName=$4, lineNo=$5, column=$6
        _StackFrame.regex = /^([\s]+at)?(.*?)(\@|\s\(|\s)([^\(\@\n]+):([0-9]+):([0-9]+)(\)?)$/;
        _StackFrame.baseSize = 58; //'{"method":"","level":,"assembly":"","fileName":"","line":}'.length
        return _StackFrame;
    }(StackFrame_1.StackFrame));
    exports._StackFrame = _StackFrame;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=Exception.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Telemetry/Metric.js":
/*!**************************************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Telemetry/Metric.js ***!
  \**************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ../Interfaces/Contracts/Generated/MetricData */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/MetricData.js"), __webpack_require__(/*! ./Common/DataSanitizer */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Telemetry/Common/DataSanitizer.js"), __webpack_require__(/*! ../Enums */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Enums.js"), __webpack_require__(/*! ./Common/DataPoint */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Telemetry/Common/DataPoint.js"), __webpack_require__(/*! ../Util */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Util.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, MetricData_1, DataSanitizer_1, Enums_1, DataPoint_1, Util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Metric = /** @class */ (function (_super) {
        __extends(Metric, _super);
        /**
         * Constructs a new instance of the MetricTelemetry object
         */
        function Metric(name, value, count, min, max, properties) {
            var _this = _super.call(this) || this;
            _this.aiDataContract = {
                ver: Enums_1.FieldType.Required,
                metrics: Enums_1.FieldType.Required,
                properties: Enums_1.FieldType.Default
            };
            var dataPoint = new DataPoint_1.DataPoint();
            dataPoint.count = count > 0 ? count : undefined;
            dataPoint.max = isNaN(max) || max === null ? undefined : max;
            dataPoint.min = isNaN(min) || min === null ? undefined : min;
            dataPoint.name = DataSanitizer_1.DataSanitizer.sanitizeString(name) || Util_1.Util.NotSpecified;
            dataPoint.value = value;
            _this.metrics = [dataPoint];
            _this.properties = DataSanitizer_1.DataSanitizer.sanitizeProperties(properties);
            return _this;
        }
        Metric.envelopeType = "Microsoft.ApplicationInsights.{0}.Metric";
        Metric.dataType = "MetricData";
        return Metric;
    }(MetricData_1.MetricData));
    exports.Metric = Metric;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=Metric.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Telemetry/PageView.js":
/*!****************************************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Telemetry/PageView.js ***!
  \****************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ../Interfaces/Contracts/Generated/PageViewData */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/PageViewData.js"), __webpack_require__(/*! ./Common/DataSanitizer */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Telemetry/Common/DataSanitizer.js"), __webpack_require__(/*! ../Enums */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Enums.js"), __webpack_require__(/*! ../Util */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Util.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, PageViewData_1, DataSanitizer_1, Enums_1, Util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var PageView = /** @class */ (function (_super) {
        __extends(PageView, _super);
        /**
         * Constructs a new instance of the PageEventTelemetry object
         */
        function PageView(name, url, durationMs, properties, measurements, id) {
            var _this = _super.call(this) || this;
            _this.aiDataContract = {
                ver: Enums_1.FieldType.Required,
                name: Enums_1.FieldType.Default,
                url: Enums_1.FieldType.Default,
                duration: Enums_1.FieldType.Default,
                properties: Enums_1.FieldType.Default,
                measurements: Enums_1.FieldType.Default,
                id: Enums_1.FieldType.Default,
            };
            _this.id = DataSanitizer_1.DataSanitizer.sanitizeId(id);
            _this.url = DataSanitizer_1.DataSanitizer.sanitizeUrl(url);
            _this.name = DataSanitizer_1.DataSanitizer.sanitizeString(name) || Util_1.Util.NotSpecified;
            if (!isNaN(durationMs)) {
                _this.duration = Util_1.Util.msToTimeSpan(durationMs);
            }
            _this.properties = DataSanitizer_1.DataSanitizer.sanitizeProperties(properties);
            _this.measurements = DataSanitizer_1.DataSanitizer.sanitizeMeasurements(measurements);
            return _this;
        }
        PageView.envelopeType = "Microsoft.ApplicationInsights.{0}.Pageview";
        PageView.dataType = "PageviewData";
        return PageView;
    }(PageViewData_1.PageViewData));
    exports.PageView = PageView;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=PageView.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Telemetry/PageViewPerformance.js":
/*!***************************************************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Telemetry/PageViewPerformance.js ***!
  \***************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ../Interfaces/Contracts/Generated/PageViewPerfData */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/PageViewPerfData.js"), __webpack_require__(/*! ../Enums */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Enums.js"), __webpack_require__(/*! ./Common/DataSanitizer */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Telemetry/Common/DataSanitizer.js"), __webpack_require__(/*! ../Util */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Util.js"), __webpack_require__(/*! ../Logging */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Logging.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, PageViewPerfData_1, Enums_1, DataSanitizer_1, Util_1, Logging_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var PageViewPerformance = /** @class */ (function (_super) {
        __extends(PageViewPerformance, _super);
        /**
         * Constructs a new instance of the PageEventTelemetry object
         */
        function PageViewPerformance(name, url, unused, properties, measurements) {
            var _this = _super.call(this) || this;
            _this.aiDataContract = {
                ver: Enums_1.FieldType.Required,
                name: Enums_1.FieldType.Default,
                url: Enums_1.FieldType.Default,
                duration: Enums_1.FieldType.Default,
                perfTotal: Enums_1.FieldType.Default,
                networkConnect: Enums_1.FieldType.Default,
                sentRequest: Enums_1.FieldType.Default,
                receivedResponse: Enums_1.FieldType.Default,
                domProcessing: Enums_1.FieldType.Default,
                properties: Enums_1.FieldType.Default,
                measurements: Enums_1.FieldType.Default
            };
            _this.isValid = false;
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
            var timing = PageViewPerformance.getPerformanceTiming();
            if (timing) {
                var total = PageViewPerformance.getDuration(timing.navigationStart, timing.loadEventEnd);
                var network = PageViewPerformance.getDuration(timing.navigationStart, timing.connectEnd);
                var request = PageViewPerformance.getDuration(timing.requestStart, timing.responseStart);
                var response = PageViewPerformance.getDuration(timing.responseStart, timing.responseEnd);
                var dom = PageViewPerformance.getDuration(timing.responseEnd, timing.loadEventEnd);
                if (total == 0) {
                    Logging_1._InternalLogging.throwInternal(Enums_1.LoggingSeverity.WARNING, Enums_1._InternalMessageId.ErrorPVCalc, "error calculating page view performance.", { total: total, network: network, request: request, response: response, dom: dom });
                }
                else if (!PageViewPerformance.shouldCollectDuration(total, network, request, response, dom)) {
                    Logging_1._InternalLogging.throwInternal(Enums_1.LoggingSeverity.WARNING, Enums_1._InternalMessageId.InvalidDurationValue, "Invalid page load duration value. Browser perf data won't be sent.", { total: total, network: network, request: request, response: response, dom: dom });
                }
                else if (total < Math.floor(network) + Math.floor(request) + Math.floor(response) + Math.floor(dom)) {
                    // some browsers may report individual components incorrectly so that the sum of the parts will be bigger than total PLT
                    // in this case, don't report client performance from this page
                    Logging_1._InternalLogging.throwInternal(Enums_1.LoggingSeverity.WARNING, Enums_1._InternalMessageId.ClientPerformanceMathError, "client performance math error.", { total: total, network: network, request: request, response: response, dom: dom });
                }
                else {
                    _this.durationMs = total;
                    // convert to timespans
                    _this.perfTotal = _this.duration = Util_1.Util.msToTimeSpan(total);
                    _this.networkConnect = Util_1.Util.msToTimeSpan(network);
                    _this.sentRequest = Util_1.Util.msToTimeSpan(request);
                    _this.receivedResponse = Util_1.Util.msToTimeSpan(response);
                    _this.domProcessing = Util_1.Util.msToTimeSpan(dom);
                    _this.isValid = true;
                }
            }
            _this.url = DataSanitizer_1.DataSanitizer.sanitizeUrl(url);
            _this.name = DataSanitizer_1.DataSanitizer.sanitizeString(name) || Util_1.Util.NotSpecified;
            _this.properties = DataSanitizer_1.DataSanitizer.sanitizeProperties(properties);
            _this.measurements = DataSanitizer_1.DataSanitizer.sanitizeMeasurements(measurements);
            return _this;
        }
        /**
         * Indicates whether this instance of PageViewPerformance is valid and should be sent
         */
        PageViewPerformance.prototype.getIsValid = function () {
            return this.isValid;
        };
        /**
        * Gets the total duration (PLT) in milliseconds. Check getIsValid() before using this method.
        */
        PageViewPerformance.prototype.getDurationMs = function () {
            return this.durationMs;
        };
        PageViewPerformance.getPerformanceTiming = function () {
            if (PageViewPerformance.isPerformanceTimingSupported()) {
                return window.performance.timing;
            }
            return null;
        };
        /**
        * Returns true is window performance timing API is supported, false otherwise.
        */
        PageViewPerformance.isPerformanceTimingSupported = function () {
            // To do: add functionality when adding api support for trackpageview
            //return typeof window != "undefined" && window.performance && window.performance.timing;
            return false;
        };
        /**
         * As page loads different parts of performance timing numbers get set. When all of them are set we can report it.
         * Returns true if ready, false otherwise.
         */
        PageViewPerformance.isPerformanceTimingDataReady = function () {
            var timing = window.performance.timing;
            return timing.domainLookupStart > 0
                && timing.navigationStart > 0
                && timing.responseStart > 0
                && timing.requestStart > 0
                && timing.loadEventEnd > 0
                && timing.responseEnd > 0
                && timing.connectEnd > 0
                && timing.domLoading > 0;
        };
        PageViewPerformance.getDuration = function (start, end) {
            var duration = undefined;
            if (!(isNaN(start) || isNaN(end))) {
                duration = Math.max(end - start, 0);
            }
            return duration;
        };
        /**
         * This method tells if given durations should be excluded from collection.
         */
        PageViewPerformance.shouldCollectDuration = function () {
            var durations = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                durations[_i] = arguments[_i];
            }
            // a full list of Google crawlers user agent strings - https://support.google.com/webmasters/answer/1061943?hl=en
            var botAgentNames = ['googlebot', 'adsbot-google', 'apis-google', 'mediapartners-google'];
            var userAgent = navigator.userAgent;
            var isGoogleBot = false;
            if (userAgent) {
                for (var i_1 = 0; i_1 < botAgentNames.length; i_1++) {
                    isGoogleBot = isGoogleBot || userAgent.toLowerCase().indexOf(botAgentNames[i_1]) !== -1;
                }
            }
            if (isGoogleBot) {
                // Don't report durations for GoogleBot, it is returning invalid values in performance.timing API. 
                return false;
            }
            else {
                // for other page views, don't report if it's outside of a reasonable range
                for (var i = 0; i < durations.length; i++) {
                    if (durations[i] >= PageViewPerformance.MAX_DURATION_ALLOWED) {
                        return false;
                    }
                }
            }
            return true;
        };
        PageViewPerformance.envelopeType = "Microsoft.ApplicationInsights.{0}.PageviewPerformance";
        PageViewPerformance.dataType = "PageviewPerformanceData";
        PageViewPerformance.MAX_DURATION_ALLOWED = 3600000; // 1h
        return PageViewPerformance;
    }(PageViewPerfData_1.PageViewPerfData));
    exports.PageViewPerformance = PageViewPerformance;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=PageViewPerformance.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Telemetry/RemoteDependencyData.js":
/*!****************************************************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Telemetry/RemoteDependencyData.js ***!
  \****************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ./Common/DataSanitizer */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Telemetry/Common/DataSanitizer.js"), __webpack_require__(/*! ../Enums */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Enums.js"), __webpack_require__(/*! ../Util */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Util.js"), __webpack_require__(/*! ../Util */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Util.js"), __webpack_require__(/*! ../Interfaces/Contracts/Generated/RemoteDependencyData */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/RemoteDependencyData.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, DataSanitizer_1, Enums_1, Util_1, Util_2, RemoteDependencyData_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var RemoteDependencyData = /** @class */ (function (_super) {
        __extends(RemoteDependencyData, _super);
        /**
         * Constructs a new instance of the RemoteDependencyData object
         */
        function RemoteDependencyData(id, absoluteUrl, commandName, value, success, resultCode, method, properties, measurements) {
            var _this = _super.call(this) || this;
            _this.aiDataContract = {
                id: Enums_1.FieldType.Required,
                ver: Enums_1.FieldType.Required,
                name: Enums_1.FieldType.Default,
                resultCode: Enums_1.FieldType.Default,
                duration: Enums_1.FieldType.Default,
                success: Enums_1.FieldType.Default,
                data: Enums_1.FieldType.Default,
                target: Enums_1.FieldType.Default,
                type: Enums_1.FieldType.Default,
                properties: Enums_1.FieldType.Default,
                measurements: Enums_1.FieldType.Default,
                kind: Enums_1.FieldType.Default,
                value: Enums_1.FieldType.Default,
                count: Enums_1.FieldType.Default,
                min: Enums_1.FieldType.Default,
                max: Enums_1.FieldType.Default,
                stdDev: Enums_1.FieldType.Default,
                dependencyKind: Enums_1.FieldType.Default,
                dependencySource: Enums_1.FieldType.Default,
                commandName: Enums_1.FieldType.Default,
                dependencyTypeName: Enums_1.FieldType.Default,
            };
            _this.id = id;
            _this.duration = Util_1.Util.msToTimeSpan(value);
            _this.success = success;
            _this.resultCode = resultCode + "";
            _this.type = "Ajax";
            _this.data = DataSanitizer_1.DataSanitizer.sanitizeUrl(commandName);
            var dependencyFields = Util_2.AjaxHelper.ParseDependencyPath(absoluteUrl, method, commandName);
            _this.target = dependencyFields.target;
            _this.name = dependencyFields.name;
            _this.properties = DataSanitizer_1.DataSanitizer.sanitizeProperties(properties);
            _this.measurements = DataSanitizer_1.DataSanitizer.sanitizeMeasurements(measurements);
            return _this;
        }
        RemoteDependencyData.envelopeType = "Microsoft.ApplicationInsights.{0}.RemoteDependency";
        RemoteDependencyData.dataType = "RemoteDependencyData";
        return RemoteDependencyData;
    }(RemoteDependencyData_1.RemoteDependencyData));
    exports.RemoteDependencyData = RemoteDependencyData;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=RemoteDependencyData.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Telemetry/Trace.js":
/*!*************************************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Telemetry/Trace.js ***!
  \*************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ../Interfaces/Contracts/Generated/MessageData */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/MessageData.js"), __webpack_require__(/*! ./Common/DataSanitizer */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Telemetry/Common/DataSanitizer.js"), __webpack_require__(/*! ../Enums */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Enums.js"), __webpack_require__(/*! ../Util */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Util.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, MessageData_1, DataSanitizer_1, Enums_1, Util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Trace = /** @class */ (function (_super) {
        __extends(Trace, _super);
        /**
         * Constructs a new instance of the TraceTelemetry object
         */
        function Trace(message, properties, severityLevel) {
            var _this = _super.call(this) || this;
            _this.aiDataContract = {
                ver: Enums_1.FieldType.Required,
                message: Enums_1.FieldType.Required,
                severityLevel: Enums_1.FieldType.Default,
                properties: Enums_1.FieldType.Default
            };
            message = message || Util_1.Util.NotSpecified;
            _this.message = DataSanitizer_1.DataSanitizer.sanitizeMessage(message);
            _this.properties = DataSanitizer_1.DataSanitizer.sanitizeProperties(properties);
            if (severityLevel) {
                _this.severityLevel = severityLevel;
            }
            return _this;
        }
        Trace.envelopeType = "Microsoft.ApplicationInsights.{0}.Message";
        Trace.dataType = "MessageData";
        return Trace;
    }(MessageData_1.MessageData));
    exports.Trace = Trace;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=Trace.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Util.js":
/*!**************************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Util.js ***!
  \**************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ./Enums */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Enums.js"), __webpack_require__(/*! ./Logging */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Logging.js"), __webpack_require__(/*! ./RequestResponseHeaders */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/RequestResponseHeaders.js"), __webpack_require__(/*! ./Telemetry/Common/DataSanitizer */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Telemetry/Common/DataSanitizer.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, Enums_1, Logging_1, RequestResponseHeaders_1, DataSanitizer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Util = /** @class */ (function () {
        function Util() {
        }
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
                return Util._getVerifiedStorageObject(Enums_1.StorageType.LocalStorage);
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
                uid = new Date;
                storage = storageType === Enums_1.StorageType.LocalStorage ? window.localStorage : window.sessionStorage;
                storage.setItem(uid, uid);
                fail = storage.getItem(uid) != uid;
                storage.removeItem(uid);
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
                Util._canUseLocalStorage = !!Util._getVerifiedStorageObject(Enums_1.StorageType.LocalStorage);
            }
            return Util._canUseLocalStorage;
        };
        /**
         *  Get an object from the browser's local storage
         *
         *  @param {string} name - the name of the object to get from storage
         *  @returns {string} The contents of the storage object with the given name. Null if storage is not supported.
         */
        Util.getStorage = function (name) {
            var storage = Util._getLocalStorageObject();
            if (storage !== null) {
                try {
                    return storage.getItem(name);
                }
                catch (e) {
                    Util._canUseLocalStorage = false;
                    Logging_1._InternalLogging.throwInternal(Enums_1.LoggingSeverity.WARNING, Enums_1._InternalMessageId.BrowserCannotReadLocalStorage, "Browser failed read of local storage. " + Util.getExceptionName(e), { exception: Util.dump(e) });
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
        Util.setStorage = function (name, data) {
            var storage = Util._getLocalStorageObject();
            if (storage !== null) {
                try {
                    storage.setItem(name, data);
                    return true;
                }
                catch (e) {
                    Util._canUseLocalStorage = false;
                    Logging_1._InternalLogging.throwInternal(Enums_1.LoggingSeverity.WARNING, Enums_1._InternalMessageId.BrowserCannotWriteLocalStorage, "Browser failed write to local storage. " + Util.getExceptionName(e), { exception: Util.dump(e) });
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
        Util.removeStorage = function (name) {
            var storage = Util._getLocalStorageObject();
            if (storage !== null) {
                try {
                    storage.removeItem(name);
                    return true;
                }
                catch (e) {
                    Util._canUseLocalStorage = false;
                    Logging_1._InternalLogging.throwInternal(Enums_1.LoggingSeverity.WARNING, Enums_1._InternalMessageId.BrowserFailedRemovalFromLocalStorage, "Browser failed removal of local storage item. " + Util.getExceptionName(e), { exception: Util.dump(e) });
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
                return Util._getVerifiedStorageObject(Enums_1.StorageType.SessionStorage);
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
                Util._canUseSessionStorage = !!Util._getVerifiedStorageObject(Enums_1.StorageType.SessionStorage);
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
        Util.getSessionStorage = function (name) {
            var storage = Util._getSessionStorageObject();
            if (storage !== null) {
                try {
                    return storage.getItem(name);
                }
                catch (e) {
                    Util._canUseSessionStorage = false;
                    Logging_1._InternalLogging.throwInternal(Enums_1.LoggingSeverity.WARNING, Enums_1._InternalMessageId.BrowserCannotReadSessionStorage, "Browser failed read of session storage. " + Util.getExceptionName(e), { exception: Util.dump(e) });
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
        Util.setSessionStorage = function (name, data) {
            var storage = Util._getSessionStorageObject();
            if (storage !== null) {
                try {
                    storage.setItem(name, data);
                    return true;
                }
                catch (e) {
                    Util._canUseSessionStorage = false;
                    Logging_1._InternalLogging.throwInternal(Enums_1.LoggingSeverity.WARNING, Enums_1._InternalMessageId.BrowserCannotWriteSessionStorage, "Browser failed write to session storage. " + Util.getExceptionName(e), { exception: Util.dump(e) });
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
        Util.removeSessionStorage = function (name) {
            var storage = Util._getSessionStorageObject();
            if (storage !== null) {
                try {
                    storage.removeItem(name);
                    return true;
                }
                catch (e) {
                    Util._canUseSessionStorage = false;
                    Logging_1._InternalLogging.throwInternal(Enums_1.LoggingSeverity.WARNING, Enums_1._InternalMessageId.BrowserFailedRemovalFromSessionStorage, "Browser failed removal of session storage item. " + Util.getExceptionName(e), { exception: Util.dump(e) });
                }
            }
            return false;
        };
        /*
         * Force the SDK not to store and read any data from cookies
         */
        Util.disableCookies = function () {
            Util._canUseCookies = false;
        };
        /*
         * helper method to tell if document.cookie object is available
         */
        Util.canUseCookies = function () {
            if (Util._canUseCookies === undefined) {
                Util._canUseCookies = false;
                try {
                    Util._canUseCookies = Util.document.cookie !== undefined;
                }
                catch (e) {
                    Logging_1._InternalLogging.throwInternal(Enums_1.LoggingSeverity.WARNING, Enums_1._InternalMessageId.CannotAccessCookie, "Cannot access document.cookie - " + Util.getExceptionName(e), { exception: Util.dump(e) });
                }
                ;
            }
            return Util._canUseCookies;
        };
        /**
         * helper method to set userId and sessionId cookie
         */
        Util.setCookie = function (name, value, domain) {
            var domainAttrib = "";
            var secureAttrib = "";
            if (domain) {
                domainAttrib = ";domain=" + domain;
            }
            if (Util.document.location && Util.document.location.protocol === "https:") {
                secureAttrib = ";secure";
            }
            if (Util.canUseCookies()) {
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
        Util.getCookie = function (name) {
            if (!Util.canUseCookies()) {
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
        Util.deleteCookie = function (name) {
            if (Util.canUseCookies()) {
                // Setting the expiration date in the past immediately removes the cookie
                Util.document.cookie = name + "=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT;";
            }
        };
        /**
         * helper method to trim strings (IE8 does not implement String.prototype.trim)
         */
        Util.trim = function (str) {
            if (typeof str !== "string")
                return str;
            return str.replace(/^\s+|\s+$/g, "");
        };
        /**
         * generate random id string
         */
        Util.newId = function () {
            var base64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
            var result = "";
            var random = Math.random() * 1073741824; //5 symbols in base64, almost maxint
            while (random > 0) {
                var char = base64chars.charAt(random % 64);
                result += char;
                random = Math.floor(random / 64);
            }
            return result;
        };
        /**
         * Check if an object is of type Array
         */
        Util.isArray = function (obj) {
            return Object.prototype.toString.call(obj) === "[object Array]";
        };
        /**
         * Check if an object is of type Error
         */
        Util.isError = function (obj) {
            return Object.prototype.toString.call(obj) === "[object Error]";
        };
        /**
         * Check if an object is of type Date
         */
        Util.isDate = function (obj) {
            return Object.prototype.toString.call(obj) === "[object Date]";
        };
        /**
         * Convert a date to I.S.O. format in IE8
         */
        Util.toISOStringForIE8 = function (date) {
            if (Util.isDate(date)) {
                if (Date.prototype.toISOString) {
                    return date.toISOString();
                }
                else {
                    var pad = function (number) {
                        var r = String(number);
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
            }
        };
        /**
         * Gets IE version if we are running on IE, or null otherwise
         */
        Util.getIEVersion = function (userAgentStr) {
            if (userAgentStr === void 0) { userAgentStr = null; }
            var myNav = userAgentStr ? userAgentStr.toLowerCase() : navigator.userAgent.toLowerCase();
            return (myNav.indexOf('msie') != -1) ? parseInt(myNav.split('msie')[1]) : null;
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
            var objectTypeDump = Object.prototype.toString.call(object);
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
            var objectTypeDump = Object.prototype.toString.call(object);
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
            if (!window || typeof eventName !== 'string' || typeof callback !== 'function') {
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
        Util.document = typeof document !== "undefined" ? document : {};
        Util._canUseCookies = undefined;
        Util._canUseLocalStorage = undefined;
        Util._canUseSessionStorage = undefined;
        // listing only non-geo specific locations 
        Util._internalEndpoints = [
            "https://dc.services.visualstudio.com/v2/track",
            "https://breeze.aimon.applicationinsights.io/v2/track",
            "https://dc-int.services.visualstudio.com/v2/track"
        ];
        Util.NotSpecified = "not_specified";
        return Util;
    }());
    exports.Util = Util;
    var UrlHelper = /** @class */ (function () {
        function UrlHelper() {
        }
        UrlHelper.parseUrl = function (url) {
            if (!UrlHelper.htmlAnchorElement) {
                UrlHelper.htmlAnchorElement = !!UrlHelper.document.createElement ? UrlHelper.document.createElement('a') : {};
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
        UrlHelper.document = typeof document !== "undefined" ? document : {};
        return UrlHelper;
    }());
    exports.UrlHelper = UrlHelper;
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
            var excludedDomains = config && config.correlationHeaderExcludedDomains;
            if (!excludedDomains || excludedDomains.length == 0) {
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
                var correlationId = CorrelationIdHelper.getCorrelationContextValue(responseHeader, RequestResponseHeaders_1.RequestHeaders.requestContextTargetKey);
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
                    if (keyValue.length == 2 && keyValue[0] == key) {
                        return keyValue[1];
                    }
                }
            }
        };
        CorrelationIdHelper.correlationIdPrefix = "cid-v1:";
        return CorrelationIdHelper;
    }());
    exports.CorrelationIdHelper = CorrelationIdHelper;
    var AjaxHelper = /** @class */ (function () {
        function AjaxHelper() {
        }
        AjaxHelper.ParseDependencyPath = function (absoluteUrl, method, pathName) {
            var target, name;
            if (absoluteUrl && absoluteUrl.length > 0) {
                var parsedUrl = UrlHelper.parseUrl(absoluteUrl);
                target = parsedUrl.host;
                if (parsedUrl.pathname != null) {
                    var pathName = (parsedUrl.pathname.length === 0) ? "/" : parsedUrl.pathname;
                    if (pathName.charAt(0) !== '/') {
                        pathName = "/" + pathName;
                    }
                    name = DataSanitizer_1.DataSanitizer.sanitizeString(method ? method + " " + pathName : pathName);
                }
                else {
                    name = DataSanitizer_1.DataSanitizer.sanitizeString(absoluteUrl);
                }
            }
            else {
                target = pathName;
                name = pathName;
            }
            return {
                target: target,
                name: name
            };
        };
        return AjaxHelper;
    }());
    exports.AjaxHelper = AjaxHelper;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=Util.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/applicationinsights-common.js":
/*!************************************************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/applicationinsights-common.js ***!
  \************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ./Util */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Util.js"), __webpack_require__(/*! ./Enums */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Enums.js"), __webpack_require__(/*! ./Logging */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Logging.js"), __webpack_require__(/*! ./RequestResponseHeaders */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/RequestResponseHeaders.js"), __webpack_require__(/*! ./Constants */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Constants.js"), __webpack_require__(/*! ./Interfaces/Contracts/Generated/Data */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/Data.js"), __webpack_require__(/*! ./Interfaces/Contracts/Generated/Base */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/Base.js"), __webpack_require__(/*! ./Telemetry/Common/Envelope */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Telemetry/Common/Envelope.js"), __webpack_require__(/*! ./Telemetry/Event */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Telemetry/Event.js"), __webpack_require__(/*! ./Telemetry/Exception */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Telemetry/Exception.js"), __webpack_require__(/*! ./Telemetry/Metric */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Telemetry/Metric.js"), __webpack_require__(/*! ./Telemetry/PageView */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Telemetry/PageView.js"), __webpack_require__(/*! ./Interfaces/Contracts/Generated/PageViewData */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/PageViewData.js"), __webpack_require__(/*! ./Telemetry/RemoteDependencyData */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Telemetry/RemoteDependencyData.js"), __webpack_require__(/*! ./Telemetry/Trace */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Telemetry/Trace.js"), __webpack_require__(/*! ./Telemetry/PageViewPerformance */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Telemetry/PageViewPerformance.js"), __webpack_require__(/*! ./Telemetry/Common/Data */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Telemetry/Common/Data.js"), __webpack_require__(/*! ./Interfaces/Contracts/Generated/SeverityLevel */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/SeverityLevel.js"), __webpack_require__(/*! ./Interfaces/Contracts/Generated/ContextTagKeys */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/ContextTagKeys.js"), __webpack_require__(/*! ./Telemetry/Common/DataSanitizer */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-common/bundle/Telemetry/Common/DataSanitizer.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, Util_1, Enums_1, Logging_1, RequestResponseHeaders_1, Constants_1, Data_1, Base_1, Envelope_1, Event_1, Exception_1, Metric_1, PageView_1, PageViewData_1, RemoteDependencyData_1, Trace_1, PageViewPerformance_1, Data_2, SeverityLevel_1, ContextTagKeys_1, DataSanitizer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Util = Util_1.Util;
    exports.CorrelationIdHelper = Util_1.CorrelationIdHelper;
    exports.UrlHelper = Util_1.UrlHelper;
    exports._InternalMessageId = Enums_1._InternalMessageId;
    exports.LoggingSeverity = Enums_1.LoggingSeverity;
    exports.FieldType = Enums_1.FieldType;
    exports._InternalLogging = Logging_1._InternalLogging;
    exports._InternalLogMessage = Logging_1._InternalLogMessage;
    exports.RequestHeaders = RequestResponseHeaders_1.RequestHeaders;
    exports.DisabledPropertyName = Constants_1.DisabledPropertyName;
    exports.AIData = Data_1.Data;
    exports.AIBase = Base_1.Base;
    exports.Envelope = Envelope_1.Envelope;
    exports.Event = Event_1.Event;
    exports.Exception = Exception_1.Exception;
    exports.Metric = Metric_1.Metric;
    exports.PageView = PageView_1.PageView;
    exports.PageViewData = PageViewData_1.PageViewData;
    exports.RemoteDependencyData = RemoteDependencyData_1.RemoteDependencyData;
    exports.Trace = Trace_1.Trace;
    exports.PageViewPerformance = PageViewPerformance_1.PageViewPerformance;
    exports.Data = Data_2.Data;
    exports.SeverityLevel = SeverityLevel_1.SeverityLevel;
    exports.ContextTagKeys = ContextTagKeys_1.ContextTagKeys;
    exports.DataSanitizer = DataSanitizer_1.DataSanitizer;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=applicationinsights-common.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-core-js/bundle/JavaScriptSDK.Enums/EventsDiscardedReason.js":
/*!****************************************************************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-core-js/bundle/JavaScriptSDK.Enums/EventsDiscardedReason.js ***!
  \****************************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * The EventsDiscardedReason enumeration contains a set of values that specify the reason for discarding an event.
     */
    exports.EventsDiscardedReason = {
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
        QueueFull: 5,
    };
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=EventsDiscardedReason.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-core-js/bundle/JavaScriptSDK.Interfaces/IChannelControls.js":
/*!****************************************************************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-core-js/bundle/JavaScriptSDK.Interfaces/IChannelControls.js ***!
  \****************************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MinChannelPriorty = 100;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=IChannelControls.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-core-js/bundle/JavaScriptSDK/AppInsightsCore.js":
/*!****************************************************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-core-js/bundle/JavaScriptSDK/AppInsightsCore.js ***!
  \****************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ../JavaScriptSDK.Interfaces/IChannelControls */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-core-js/bundle/JavaScriptSDK.Interfaces/IChannelControls.js"), __webpack_require__(/*! ../JavaScriptSDK.Enums/EventsDiscardedReason */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-core-js/bundle/JavaScriptSDK.Enums/EventsDiscardedReason.js"), __webpack_require__(/*! ./CoreUtils */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-core-js/bundle/JavaScriptSDK/CoreUtils.js"), __webpack_require__(/*! ./NotificationManager */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-core-js/bundle/JavaScriptSDK/NotificationManager.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, IChannelControls_1, EventsDiscardedReason_1, CoreUtils_1, NotificationManager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    "use strict";
    var AppInsightsCore = /** @class */ (function () {
        function AppInsightsCore() {
            this._extensions = new Array();
        }
        AppInsightsCore.prototype.initialize = function (config, extensions) {
            var _this = this;
            if (!extensions || extensions.length === 0) {
                // throw error
                throw Error("At least one extension channel is required");
            }
            if (!config || CoreUtils_1.CoreUtils.isNullOrUndefined(config.instrumentationKey)) {
                throw Error("Please provide instrumentation key");
            }
            this.config = config;
            // add notification to the extensions in the config so other plugins can access it
            this._notificationManager = new NotificationManager_1.NotificationManager();
            this.config.extensions = this.config.extensions ? this.config.extensions : {};
            this.config.extensions.NotificationManager = this._notificationManager;
            // Initial validation
            extensions.forEach(function (extension) {
                if (CoreUtils_1.CoreUtils.isNullOrUndefined(extension.initialize)) {
                    throw Error("Extensions must provide callback to initialize");
                }
            });
            this._extensions = extensions.sort(function (a, b) {
                var extA = a;
                var extB = b;
                var typeExtA = typeof extA.processTelemetry;
                var typeExtB = typeof extB.processTelemetry;
                if (typeExtA === 'function' && typeExtB === 'function') {
                    return extA.priority > extB.priority ? 1 : -1;
                }
                if (typeExtA === 'function' && typeExtB !== 'function') {
                    // keep non telemetryplugin specific extensions at start
                    return 1;
                }
                if (typeExtA !== 'function' && typeExtB === 'function') {
                    return -1;
                }
            });
            // Set next plugin for all but last extension
            for (var idx = 0; idx < this._extensions.length - 1; idx++) {
                if (this._extensions[idx] && typeof this._extensions[idx].processTelemetry !== 'function') {
                    // these are initialized only
                    continue;
                }
                this._extensions[idx].setNextPlugin(this._extensions[idx + 1]); // set next plugin
            }
            this._extensions.forEach(function (ext) { return ext.initialize(_this.config, _this, _this._extensions); }); // initialize
        };
        AppInsightsCore.prototype.getTransmissionControl = function () {
            for (var i = 0; i < this._extensions.length; i++) {
                var priority = this._extensions[i].priority;
                if (!CoreUtils_1.CoreUtils.isNullOrUndefined(priority) && priority >= IChannelControls_1.MinChannelPriorty) {
                    var firstChannel = this._extensions[i];
                    return firstChannel; // return first channel in list
                }
            }
            throw new Error("No channel extension found");
        };
        AppInsightsCore.prototype.track = function (telemetryItem) {
            if (telemetryItem === null) {
                this._notifiyInvalidEvent(telemetryItem);
                // throw error
                throw Error("Invalid telemetry item");
            }
            if (telemetryItem.baseData && !telemetryItem.baseType) {
                this._notifiyInvalidEvent(telemetryItem);
                throw Error("Provide data.baseType for data.baseData");
            }
            // do base validation before sending it through the pipeline        
            this._validateTelmetryItem(telemetryItem);
            if (!telemetryItem.instrumentationKey) {
                // setup default ikey if not passed in
                telemetryItem.instrumentationKey = this.config.instrumentationKey;
            }
            // invoke any common telemetry processors before sending through pipeline
            var i = 0;
            while (i < this._extensions.length) {
                if (this._extensions[i].processTelemetry) {
                    this._extensions[i].processTelemetry(telemetryItem); // pass on to first extension that can support processing
                    break;
                }
                i++;
            }
        };
        /**
         * Adds a notification listener. The SDK calls methods on the listener when an appropriate notification is raised.
         * @param {INotificationListener} listener - An INotificationListener object.
         */
        AppInsightsCore.prototype.addNotificationListener = function (listener) {
            this._notificationManager.addNotificationListener(listener);
        };
        /**
         * Removes all instances of the listener.
         * @param {INotificationListener} listener - INotificationListener to remove.
         */
        AppInsightsCore.prototype.removeNotificationListener = function (listener) {
            this._notificationManager.removeNotificationListener(listener);
        };
        AppInsightsCore.prototype._validateTelmetryItem = function (telemetryItem) {
            if (CoreUtils_1.CoreUtils.isNullOrUndefined(telemetryItem.name)) {
                this._notifiyInvalidEvent(telemetryItem);
                throw Error("telemetry name required");
            }
            if (CoreUtils_1.CoreUtils.isNullOrUndefined(telemetryItem.timestamp)) {
                this._notifiyInvalidEvent(telemetryItem);
                throw Error("telemetry timestamp required");
            }
            if (CoreUtils_1.CoreUtils.isNullOrUndefined(telemetryItem.instrumentationKey)) {
                this._notifiyInvalidEvent(telemetryItem);
                throw Error("telemetry instrumentationKey required");
            }
        };
        AppInsightsCore.prototype._notifiyInvalidEvent = function (telemetryItem) {
            this._notificationManager.eventsDiscarded([telemetryItem], EventsDiscardedReason_1.EventsDiscardedReason.InvalidEvent);
        };
        return AppInsightsCore;
    }());
    exports.AppInsightsCore = AppInsightsCore;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=AppInsightsCore.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-core-js/bundle/JavaScriptSDK/CoreUtils.js":
/*!**********************************************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-core-js/bundle/JavaScriptSDK/CoreUtils.js ***!
  \**********************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var CoreUtils = /** @class */ (function () {
        function CoreUtils() {
        }
        CoreUtils.isNullOrUndefined = function (input) {
            return input === null || input === undefined;
        };
        return CoreUtils;
    }());
    exports.CoreUtils = CoreUtils;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=CoreUtils.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-core-js/bundle/JavaScriptSDK/NotificationManager.js":
/*!********************************************************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-core-js/bundle/JavaScriptSDK/NotificationManager.js ***!
  \********************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
            var index = this.listeners.indexOf(listener);
            while (index > -1) {
                this.listeners.splice(index, 1);
                index = this.listeners.indexOf(listener);
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
    exports.NotificationManager = NotificationManager;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=NotificationManager.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-core-js/bundle/applicationinsights-core-js.js":
/*!**************************************************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-core-js/bundle/applicationinsights-core-js.js ***!
  \**************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ./JavaScriptSDK.Interfaces/IChannelControls */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-core-js/bundle/JavaScriptSDK.Interfaces/IChannelControls.js"), __webpack_require__(/*! ./JavaScriptSDK.Enums/EventsDiscardedReason */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-core-js/bundle/JavaScriptSDK.Enums/EventsDiscardedReason.js"), __webpack_require__(/*! ./JavaScriptSDK/AppInsightsCore */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-core-js/bundle/JavaScriptSDK/AppInsightsCore.js"), __webpack_require__(/*! ./JavaScriptSDK/CoreUtils */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-core-js/bundle/JavaScriptSDK/CoreUtils.js"), __webpack_require__(/*! ./JavaScriptSDK/NotificationManager */ "./node_modules/applicationinsights-analytics-js/node_modules/applicationinsights-core-js/bundle/JavaScriptSDK/NotificationManager.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, IChannelControls_1, EventsDiscardedReason_1, AppInsightsCore_1, CoreUtils_1, NotificationManager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MinChannelPriorty = IChannelControls_1.MinChannelPriorty;
    exports.EventsDiscardedReason = EventsDiscardedReason_1.EventsDiscardedReason;
    exports.AppInsightsCore = AppInsightsCore_1.AppInsightsCore;
    exports.CoreUtils = CoreUtils_1.CoreUtils;
    exports.NotificationManager = NotificationManager_1.NotificationManager;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=applicationinsights-core-js.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-channel-js/bundle/EnvelopeCreator.js":
/*!*******************************************************************************!*\
  !*** ./node_modules/applicationinsights-channel-js/bundle/EnvelopeCreator.js ***!
  \*******************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! applicationinsights-common */ "./node_modules/applicationinsights-common/bundle/applicationinsights-common.js"), __webpack_require__(/*! applicationinsights-core-js */ "./node_modules/applicationinsights-core-js/bundle/applicationinsights-core-js.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, applicationinsights_common_1, applicationinsights_core_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContextTagKeys = [
        "ai.application.ver",
        "ai.application.build",
        "ai.application.typeId",
        "ai.application.applicationId",
        "ai.application.layer",
        "ai.device.id",
        "ai.device.ip",
        "ai.device.language",
        "ai.device.locale",
        "ai.device.model",
        "ai.device.friendlyName",
        "ai.device.network",
        "ai.device.networkName",
        "ai.device.oemName",
        "ai.device.os",
        "ai.device.osVersion",
        "ai.device.roleInstance",
        "ai.device.roleName",
        "ai.device.screenResolution",
        "ai.device.type",
        "ai.device.machineName",
        "ai.device.vmName",
        "ai.device.browser",
        "ai.device.browserVersion",
        "ai.location.ip",
        "ai.location.country",
        "ai.location.province",
        "ai.location.city",
        "ai.operation.id",
        "ai.operation.name",
        "ai.operation.parentId",
        "ai.operation.rootId",
        "ai.operation.syntheticSource",
        "ai.operation.correlationVector",
        "ai.session.id",
        "ai.session.isFirst",
        "ai.session.isNew",
        "ai.user.accountAcquisitionDate",
        "ai.user.accountId",
        "ai.user.userAgent",
        "ai.user.id",
        "ai.user.storeRegion",
        "ai.user.authUserId",
        "ai.user.anonUserAcquisitionDate",
        "ai.user.authUserAcquisitionDate",
        "ai.cloud.name",
        "ai.cloud.role",
        "ai.cloud.roleVer",
        "ai.cloud.roleInstance",
        "ai.cloud.environment",
        "ai.cloud.location",
        "ai.cloud.deploymentUnit",
        "ai.internal.sdkVersion",
        "ai.internal.agentVersion",
        "ai.internal.nodeName",
    ];
    // these two constants are used to filter out properties not needed when trying to extract custom properties and measurements from the incoming payload
    var baseType = "baseType";
    var baseData = "baseData";
    var EnvelopeCreator = /** @class */ (function () {
        function EnvelopeCreator() {
        }
        EnvelopeCreator.extractProperties = function (data) {
            var customProperties = null;
            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    var value = data[key];
                    if (typeof value !== "number") {
                        if (!customProperties) {
                            customProperties = {};
                        }
                        customProperties[key] = value;
                    }
                }
            }
            return customProperties;
        };
        EnvelopeCreator.extractPropsAndMeasurements = function (data, properties, measurements) {
            if (!applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(data)) {
                for (var key in data) {
                    if (data.hasOwnProperty(key)) {
                        var value = data[key];
                        if (typeof value === "number") {
                            measurements[key] = value;
                        }
                        else {
                            properties[key] = value;
                        }
                    }
                }
            }
        };
        EnvelopeCreator.createEnvelope = function (envelopeType, telemetryItem, data) {
            var envelope = new applicationinsights_common_1.Envelope(data, envelopeType);
            envelope.iKey = telemetryItem.instrumentationKey;
            var iKeyNoDashes = telemetryItem.instrumentationKey.replace(/-/g, "");
            envelope.name = envelope.name.replace("{0}", iKeyNoDashes);
            // loop through the envelope ctx (Part A) and pick out the ones that should go in outgoing envelope tags
            for (var key in telemetryItem.ctx) {
                if (telemetryItem.ctx.hasOwnProperty(key)) {
                    if (exports.ContextTagKeys.indexOf(key) >= 0) {
                        envelope.tags[key] = telemetryItem.ctx[key];
                    }
                }
            }
            // loop through the envelope tags (extension of Part A) and pick out the ones that should go in outgoing envelope tags
            telemetryItem.tags.forEach(function (tag) {
                for (var key in tag) {
                    if (tag.hasOwnProperty(key)) {
                        if (exports.ContextTagKeys.indexOf(key) >= 0) {
                            envelope.tags[key] = tag[key];
                        }
                    }
                }
            });
            return envelope;
        };
        return EnvelopeCreator;
    }());
    exports.EnvelopeCreator = EnvelopeCreator;
    var DependencyEnvelopeCreator = /** @class */ (function (_super) {
        __extends(DependencyEnvelopeCreator, _super);
        function DependencyEnvelopeCreator() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        DependencyEnvelopeCreator.prototype.Create = function (telemetryItem) {
            if (applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(telemetryItem.baseData)) {
                applicationinsights_common_1._InternalLogging.throwInternal(applicationinsights_common_1.LoggingSeverity.CRITICAL, applicationinsights_common_1._InternalMessageId.TelemetryEnvelopeInvalid, "telemetryItem.baseData cannot be null.");
            }
            var customMeasurements = {};
            var customProperties = {};
            EnvelopeCreator.extractPropsAndMeasurements(telemetryItem.data, customProperties, customMeasurements);
            var id = telemetryItem.baseData.id;
            var absoluteUrl = telemetryItem.baseData.absoluteUrl;
            var command = telemetryItem.baseData.command;
            var totalTime = telemetryItem.baseData.totalTime;
            var success = telemetryItem.baseData.success;
            var resultCode = telemetryItem.baseData.resultCode;
            var method = telemetryItem.baseData.method;
            var baseData = new applicationinsights_common_1.RemoteDependencyData(id, absoluteUrl, command, totalTime, success, resultCode, method, customProperties, customMeasurements);
            var data = new applicationinsights_common_1.Data(applicationinsights_common_1.RemoteDependencyData.dataType, baseData);
            return EnvelopeCreator.createEnvelope(applicationinsights_common_1.RemoteDependencyData.envelopeType, telemetryItem, data);
        };
        DependencyEnvelopeCreator.DependencyEnvelopeCreator = new DependencyEnvelopeCreator();
        return DependencyEnvelopeCreator;
    }(EnvelopeCreator));
    exports.DependencyEnvelopeCreator = DependencyEnvelopeCreator;
    var EventEnvelopeCreator = /** @class */ (function (_super) {
        __extends(EventEnvelopeCreator, _super);
        function EventEnvelopeCreator() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        EventEnvelopeCreator.prototype.Create = function (telemetryItem) {
            if (applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(telemetryItem.baseData)) {
                applicationinsights_common_1._InternalLogging.throwInternal(applicationinsights_common_1.LoggingSeverity.CRITICAL, applicationinsights_common_1._InternalMessageId.TelemetryEnvelopeInvalid, "telemetryItem.baseData cannot be null.");
            }
            var customProperties = {};
            var customMeasurements = {};
            EnvelopeCreator.extractPropsAndMeasurements(telemetryItem.data, customProperties, customMeasurements);
            var eventName = telemetryItem.baseData.name;
            var baseData = new applicationinsights_common_1.Event(eventName, customProperties, customMeasurements);
            var data = new applicationinsights_common_1.Data(applicationinsights_common_1.Event.dataType, baseData);
            return EnvelopeCreator.createEnvelope(applicationinsights_common_1.Event.envelopeType, telemetryItem, data);
        };
        EventEnvelopeCreator.EventEnvelopeCreator = new EventEnvelopeCreator();
        return EventEnvelopeCreator;
    }(EnvelopeCreator));
    exports.EventEnvelopeCreator = EventEnvelopeCreator;
    var ExceptionEnvelopeCreator = /** @class */ (function (_super) {
        __extends(ExceptionEnvelopeCreator, _super);
        function ExceptionEnvelopeCreator() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ExceptionEnvelopeCreator.prototype.Create = function (telemetryItem) {
            if (applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(telemetryItem.baseData)) {
                applicationinsights_common_1._InternalLogging.throwInternal(applicationinsights_common_1.LoggingSeverity.CRITICAL, applicationinsights_common_1._InternalMessageId.TelemetryEnvelopeInvalid, "telemetryItem.baseData cannot be null.");
            }
            var customProperties = {};
            var customMeasurements = {};
            EnvelopeCreator.extractPropsAndMeasurements(telemetryItem.data, customProperties, customMeasurements);
            var exception = telemetryItem.baseData.exception;
            var severityLevel = telemetryItem.baseData.severityLevel;
            var baseData = new applicationinsights_common_1.Exception(exception, customProperties, customMeasurements, severityLevel);
            var data = new applicationinsights_common_1.Data(applicationinsights_common_1.Exception.dataType, baseData);
            return EnvelopeCreator.createEnvelope(applicationinsights_common_1.Exception.envelopeType, telemetryItem, data);
        };
        ExceptionEnvelopeCreator.ExceptionEnvelopeCreator = new ExceptionEnvelopeCreator();
        return ExceptionEnvelopeCreator;
    }(EnvelopeCreator));
    exports.ExceptionEnvelopeCreator = ExceptionEnvelopeCreator;
    var MetricEnvelopeCreator = /** @class */ (function (_super) {
        __extends(MetricEnvelopeCreator, _super);
        function MetricEnvelopeCreator() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MetricEnvelopeCreator.prototype.Create = function (telemetryItem) {
            if (applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(telemetryItem.baseData)) {
                applicationinsights_common_1._InternalLogging.throwInternal(applicationinsights_common_1.LoggingSeverity.CRITICAL, applicationinsights_common_1._InternalMessageId.TelemetryEnvelopeInvalid, "telemetryItem.baseData cannot be null.");
            }
            var customProperties = EnvelopeCreator.extractProperties(telemetryItem.data);
            var name = telemetryItem.baseData.name;
            var average = telemetryItem.baseData.average;
            var sampleCount = telemetryItem.baseData.sampleCount;
            var min = telemetryItem.baseData.min;
            var max = telemetryItem.baseData.max;
            var baseData = new applicationinsights_common_1.Metric(name, average, sampleCount, min, max, customProperties);
            var data = new applicationinsights_common_1.Data(applicationinsights_common_1.Metric.dataType, baseData);
            return EnvelopeCreator.createEnvelope(applicationinsights_common_1.Metric.envelopeType, telemetryItem, data);
        };
        MetricEnvelopeCreator.MetricEnvelopeCreator = new MetricEnvelopeCreator();
        return MetricEnvelopeCreator;
    }(EnvelopeCreator));
    exports.MetricEnvelopeCreator = MetricEnvelopeCreator;
    var PageViewEnvelopeCreator = /** @class */ (function (_super) {
        __extends(PageViewEnvelopeCreator, _super);
        function PageViewEnvelopeCreator() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        PageViewEnvelopeCreator.prototype.Create = function (telemetryItem) {
            if (applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(telemetryItem.baseData)) {
                applicationinsights_common_1._InternalLogging.throwInternal(applicationinsights_common_1.LoggingSeverity.CRITICAL, applicationinsights_common_1._InternalMessageId.TelemetryEnvelopeInvalid, "telemetryItem.baseData cannot be null.");
            }
            var customProperties = {};
            var customMeasurements = {};
            EnvelopeCreator.extractPropsAndMeasurements(telemetryItem.data, customProperties, customMeasurements);
            var name = telemetryItem.baseData.name;
            var url = telemetryItem.baseData.uri;
            var duration = telemetryItem.baseData.duration;
            // refUri is a field that Breeze still does not recognize as part of Part B. For now, put it in Part C until it supports it as a domain property
            if (!applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(telemetryItem.baseData.refUri)) {
                customProperties["refUri"] = telemetryItem.baseData.refUri;
            }
            // pageType is a field that Breeze still does not recognize as part of Part B. For now, put it in Part C until it supports it as a domain property
            if (!applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(telemetryItem.baseData.pageType)) {
                customProperties["pageType"] = telemetryItem.baseData.pageType;
            }
            // isLoggedIn is a field that Breeze still does not recognize as part of Part B. For now, put it in Part C until it supports it as a domain property
            if (!applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(telemetryItem.baseData.isLoggedIn)) {
                customProperties["isLoggedIn"] = telemetryItem.baseData.isLoggedIn;
            }
            // pageTags is a field that Breeze still does not recognize as part of Part B. For now, put it in Part C until it supports it as a domain property
            if (!applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(telemetryItem.baseData.pageTags)) {
                var pageTags = telemetryItem.baseData.pageTags;
                for (var key in pageTags) {
                    if (pageTags.hasOwnProperty(key)) {
                        customProperties[key] = pageTags[key];
                    }
                }
            }
            var baseData = new applicationinsights_common_1.PageView(name, url, duration, customProperties, customMeasurements);
            var data = new applicationinsights_common_1.Data(applicationinsights_common_1.PageView.dataType, baseData);
            return EnvelopeCreator.createEnvelope(applicationinsights_common_1.PageView.envelopeType, telemetryItem, data);
        };
        PageViewEnvelopeCreator.PageViewEnvelopeCreator = new PageViewEnvelopeCreator();
        return PageViewEnvelopeCreator;
    }(EnvelopeCreator));
    exports.PageViewEnvelopeCreator = PageViewEnvelopeCreator;
    var PageViewPerformanceEnvelopeCreator = /** @class */ (function (_super) {
        __extends(PageViewPerformanceEnvelopeCreator, _super);
        function PageViewPerformanceEnvelopeCreator() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        PageViewPerformanceEnvelopeCreator.prototype.Create = function (telemetryItem) {
            if (applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(telemetryItem.baseData)) {
                applicationinsights_common_1._InternalLogging.throwInternal(applicationinsights_common_1.LoggingSeverity.CRITICAL, applicationinsights_common_1._InternalMessageId.TelemetryEnvelopeInvalid, "telemetryItem.baseData cannot be null.");
            }
            var customProperties = {};
            var customMeasurements = {};
            EnvelopeCreator.extractPropsAndMeasurements(telemetryItem.data, customProperties, customMeasurements);
            var name = telemetryItem.baseData.name;
            var url = telemetryItem.baseData.uri;
            var duration = telemetryItem.baseData.duration;
            var baseData = new applicationinsights_common_1.PageViewPerformance(name, url, duration, customProperties, customMeasurements);
            var data = new applicationinsights_common_1.Data(applicationinsights_common_1.PageViewPerformance.dataType, baseData);
            return EnvelopeCreator.createEnvelope(applicationinsights_common_1.PageViewPerformance.envelopeType, telemetryItem, data);
        };
        PageViewPerformanceEnvelopeCreator.PageViewPerformanceEnvelopeCreator = new PageViewPerformanceEnvelopeCreator();
        return PageViewPerformanceEnvelopeCreator;
    }(EnvelopeCreator));
    exports.PageViewPerformanceEnvelopeCreator = PageViewPerformanceEnvelopeCreator;
    var TraceEnvelopeCreator = /** @class */ (function (_super) {
        __extends(TraceEnvelopeCreator, _super);
        function TraceEnvelopeCreator() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        TraceEnvelopeCreator.prototype.Create = function (telemetryItem) {
            if (applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(telemetryItem.baseData)) {
                applicationinsights_common_1._InternalLogging.throwInternal(applicationinsights_common_1.LoggingSeverity.CRITICAL, applicationinsights_common_1._InternalMessageId.TelemetryEnvelopeInvalid, "telemetryItem.baseData cannot be null.");
            }
            var message = telemetryItem.baseData.message;
            var severityLevel = telemetryItem.baseData.severityLevel;
            var customProperties = EnvelopeCreator.extractProperties(telemetryItem.data);
            var baseData = new applicationinsights_common_1.Trace(message, customProperties, severityLevel);
            var data = new applicationinsights_common_1.Data(applicationinsights_common_1.Trace.dataType, baseData);
            return EnvelopeCreator.createEnvelope(applicationinsights_common_1.Trace.envelopeType, telemetryItem, data);
        };
        TraceEnvelopeCreator.TraceEnvelopeCreator = new TraceEnvelopeCreator();
        return TraceEnvelopeCreator;
    }(EnvelopeCreator));
    exports.TraceEnvelopeCreator = TraceEnvelopeCreator;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=EnvelopeCreator.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-channel-js/bundle/SendBuffer.js":
/*!**************************************************************************!*\
  !*** ./node_modules/applicationinsights-channel-js/bundle/SendBuffer.js ***!
  \**************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! applicationinsights-common */ "./node_modules/applicationinsights-common/bundle/applicationinsights-common.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, applicationinsights_common_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
    exports.ArraySendBuffer = ArraySendBuffer;
    /*
     * Session storege buffer holds a copy of all unsent items in the browser session storage.
     */
    var SessionStorageSendBuffer = /** @class */ (function () {
        function SessionStorageSendBuffer(config) {
            this._bufferFullMessageSent = false;
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
                    applicationinsights_common_1._InternalLogging.throwInternal(applicationinsights_common_1.LoggingSeverity.WARNING, applicationinsights_common_1._InternalMessageId.SessionStorageBufferFull, "Maximum buffer size reached: " + this._buffer.length, true);
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
                    applicationinsights_common_1._InternalLogging.throwInternal(applicationinsights_common_1.LoggingSeverity.CRITICAL, applicationinsights_common_1._InternalMessageId.SessionStorageBufferFull, "Sent buffer reached its maximum size: " + sentElements.length, true);
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
            ;
            return remaining;
        };
        SessionStorageSendBuffer.prototype.getBuffer = function (key) {
            try {
                var bufferJson = applicationinsights_common_1.Util.getSessionStorage(key);
                if (bufferJson) {
                    var buffer = JSON.parse(bufferJson);
                    if (buffer) {
                        return buffer;
                    }
                }
            }
            catch (e) {
                applicationinsights_common_1._InternalLogging.throwInternal(applicationinsights_common_1.LoggingSeverity.CRITICAL, applicationinsights_common_1._InternalMessageId.FailedToRestoreStorageBuffer, " storage key: " + key + ", " + applicationinsights_common_1.Util.getExceptionName(e), { exception: applicationinsights_common_1.Util.dump(e) });
            }
            return [];
        };
        SessionStorageSendBuffer.prototype.setBuffer = function (key, buffer) {
            try {
                var bufferJson = JSON.stringify(buffer);
                applicationinsights_common_1.Util.setSessionStorage(key, bufferJson);
            }
            catch (e) {
                // if there was an error, clear the buffer
                // telemetry is stored in the _buffer array so we won't loose any items
                applicationinsights_common_1.Util.setSessionStorage(key, JSON.stringify([]));
                applicationinsights_common_1._InternalLogging.throwInternal(applicationinsights_common_1.LoggingSeverity.WARNING, applicationinsights_common_1._InternalMessageId.FailedToSetStorageBuffer, " storage key: " + key + ", " + applicationinsights_common_1.Util.getExceptionName(e) + ". Buffer cleared", { exception: applicationinsights_common_1.Util.dump(e) });
            }
        };
        SessionStorageSendBuffer.BUFFER_KEY = "AI_buffer";
        SessionStorageSendBuffer.SENT_BUFFER_KEY = "AI_sentBuffer";
        // Maximum number of payloads stored in the buffer. If the buffer is full, new elements will be dropped. 
        SessionStorageSendBuffer.MAX_BUFFER_SIZE = 2000;
        return SessionStorageSendBuffer;
    }());
    exports.SessionStorageSendBuffer = SessionStorageSendBuffer;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=SendBuffer.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-channel-js/bundle/Sender.js":
/*!**********************************************************************!*\
  !*** ./node_modules/applicationinsights-channel-js/bundle/Sender.js ***!
  \**********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ./SendBuffer */ "./node_modules/applicationinsights-channel-js/bundle/SendBuffer.js"), __webpack_require__(/*! ./EnvelopeCreator */ "./node_modules/applicationinsights-channel-js/bundle/EnvelopeCreator.js"), __webpack_require__(/*! ./TelemetryValidation/EventValidator */ "./node_modules/applicationinsights-channel-js/bundle/TelemetryValidation/EventValidator.js"), __webpack_require__(/*! ./TelemetryValidation/TraceValidator */ "./node_modules/applicationinsights-channel-js/bundle/TelemetryValidation/TraceValidator.js"), __webpack_require__(/*! ./TelemetryValidation/ExceptionValidator */ "./node_modules/applicationinsights-channel-js/bundle/TelemetryValidation/ExceptionValidator.js"), __webpack_require__(/*! ./TelemetryValidation/MetricValidator */ "./node_modules/applicationinsights-channel-js/bundle/TelemetryValidation/MetricValidator.js"), __webpack_require__(/*! ./TelemetryValidation/PageViewPerformanceValidator */ "./node_modules/applicationinsights-channel-js/bundle/TelemetryValidation/PageViewPerformanceValidator.js"), __webpack_require__(/*! ./TelemetryValidation/PageViewValidator */ "./node_modules/applicationinsights-channel-js/bundle/TelemetryValidation/PageViewValidator.js"), __webpack_require__(/*! ./TelemetryValidation/RemoteDepdencyValidator */ "./node_modules/applicationinsights-channel-js/bundle/TelemetryValidation/RemoteDepdencyValidator.js"), __webpack_require__(/*! ./Serializer */ "./node_modules/applicationinsights-channel-js/bundle/Serializer.js"), __webpack_require__(/*! applicationinsights-common */ "./node_modules/applicationinsights-common/bundle/applicationinsights-common.js"), __webpack_require__(/*! applicationinsights-core-js */ "./node_modules/applicationinsights-core-js/bundle/applicationinsights-core-js.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, SendBuffer_1, EnvelopeCreator_1, EventValidator_1, TraceValidator_1, ExceptionValidator_1, MetricValidator_1, PageViewPerformanceValidator_1, PageViewValidator_1, RemoteDepdencyValidator_1, Serializer_1, applicationinsights_common_1, applicationinsights_core_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Sender = /** @class */ (function () {
        function Sender() {
            this.priority = 200;
            /**
             * Whether XMLHttpRequest object is supported. Older version of IE (8,9) do not support it.
             */
            this._XMLHttpRequestSupported = false;
        }
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
                applicationinsights_common_1._InternalLogging.throwInternal(applicationinsights_common_1.LoggingSeverity.CRITICAL, applicationinsights_common_1._InternalMessageId.FlushFailed, "flush failed, telemetry will not be collected: " + applicationinsights_common_1.Util.getExceptionName(e), { exception: applicationinsights_common_1.Util.dump(e) });
            }
        };
        Sender.prototype.teardown = function () {
            throw new Error("Method not implemented.");
        };
        Sender.prototype.initialize = function (config) {
            this.identifier = "AppInsightsChannelPlugin";
            this._consecutiveErrors = 0;
            this._retryAt = null;
            this._lastSend = 0;
            this._config = Sender._getDefaultAppInsightsChannelConfig(config, this.identifier);
            this._sender = null;
            this._buffer = (applicationinsights_common_1.Util.canUseSessionStorage() && this._config.enableSessionStorageBuffer)
                ? new SendBuffer_1.SessionStorageSendBuffer(this._config) : new SendBuffer_1.ArraySendBuffer(this._config);
            if (!this._config.isBeaconApiDisabled() && applicationinsights_common_1.Util.IsBeaconApiSupported()) {
                this._sender = this._beaconSender;
            }
            else {
                if (typeof XMLHttpRequest != "undefined") {
                    var testXhr = new XMLHttpRequest();
                    if ("withCredentials" in testXhr) {
                        this._sender = this._xhrSender;
                        this._XMLHttpRequestSupported = true;
                    }
                    else if (typeof XDomainRequest !== "undefined") {
                        this._sender = this._xdrSender; //IE 8 and 9
                    }
                }
            }
        };
        Sender.prototype.processTelemetry = function (telemetryItem) {
            try {
                // if master off switch is set, don't send any data
                if (this._config.disableTelemetry()) {
                    // Do not send/save data
                    return;
                }
                // validate input
                if (!telemetryItem) {
                    applicationinsights_common_1._InternalLogging.throwInternal(applicationinsights_common_1.LoggingSeverity.CRITICAL, applicationinsights_common_1._InternalMessageId.CannotSendEmptyTelemetry, "Cannot send empty telemetry");
                    return;
                }
                // ensure a sender was constructed
                if (!this._sender) {
                    applicationinsights_common_1._InternalLogging.throwInternal(applicationinsights_common_1.LoggingSeverity.CRITICAL, applicationinsights_common_1._InternalMessageId.SenderNotInitialized, "Sender was not initialized");
                    return;
                }
                // first we need to validate that the envelope passed down is valid
                var isValid = Sender._validate(telemetryItem);
                if (!isValid) {
                    applicationinsights_common_1._InternalLogging.throwInternal(applicationinsights_common_1.LoggingSeverity.CRITICAL, applicationinsights_common_1._InternalMessageId.TelemetryEnvelopeInvalid, "Invalid telemetry envelope");
                    return;
                }
                // construct an envelope that Application Insights endpoint can understand
                var aiEnvelope = Sender._constructEnvelope(telemetryItem);
                if (!aiEnvelope) {
                    applicationinsights_common_1._InternalLogging.throwInternal(applicationinsights_common_1.LoggingSeverity.CRITICAL, applicationinsights_common_1._InternalMessageId.CreateEnvelopeError, "Unable to create an AppInsights envelope");
                    return;
                }
                // check if the incoming payload is too large, truncate if necessary
                var payload = Serializer_1.Serializer.serialize(aiEnvelope);
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
                // Uncomment if you want to use DataLossanalyzer
                // DataLossAnalyzer.incrementItemsQueued();
            }
            catch (e) {
                applicationinsights_common_1._InternalLogging.throwInternal(applicationinsights_common_1.LoggingSeverity.WARNING, applicationinsights_common_1._InternalMessageId.FailedAddingTelemetryToBuffer, "Failed adding telemetry to the sender's buffer, some telemetry will be lost: " + applicationinsights_common_1.Util.getExceptionName(e), { exception: applicationinsights_common_1.Util.dump(e) });
            }
            // hand off the telemetry item to the next plugin
            if (!applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(this._nextPlugin)) {
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
                        applicationinsights_common_1._InternalLogging.throwInternal(applicationinsights_common_1.LoggingSeverity.WARNING, applicationinsights_common_1._InternalMessageId.TransmissionFailed, ". " +
                            "Response code " + xhr.status + ". Will retry to send " + payload.length + " items.");
                    }
                    else {
                        this._onError(payload, this._formatErrorMessageXhr(xhr));
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
         */
        Sender.prototype.triggerSend = function (async) {
            if (async === void 0) { async = true; }
            try {
                // Send data only if disableTelemetry is false
                if (!this._config.disableTelemetry()) {
                    if (this._buffer.count() > 0) {
                        var payload = this._buffer.getItems();
                        // invoke send
                        this._sender(payload, async);
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
                if (!applicationinsights_common_1.Util.getIEVersion() || applicationinsights_common_1.Util.getIEVersion() > 9) {
                    applicationinsights_common_1._InternalLogging.throwInternal(applicationinsights_common_1.LoggingSeverity.CRITICAL, applicationinsights_common_1._InternalMessageId.TransmissionFailed, "Telemetry transmission failed, some telemetry will be lost: " + applicationinsights_common_1.Util.getExceptionName(e), { exception: applicationinsights_common_1.Util.dump(e) });
                }
            }
        };
        /**
         * error handler
         */
        Sender.prototype._onError = function (payload, message, event) {
            applicationinsights_common_1._InternalLogging.throwInternal(applicationinsights_common_1.LoggingSeverity.WARNING, applicationinsights_common_1._InternalMessageId.OnError, "Failed to send telemetry.", { message: message });
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
                applicationinsights_common_1._InternalLogging.throwInternal(applicationinsights_common_1.LoggingSeverity.WARNING, applicationinsights_common_1._InternalMessageId.TransmissionFailed, "Partial success. " +
                    "Delivered: " + payload.length + ", Failed: " + failed.length +
                    ". Will retry to send " + retry.length + " our of " + results.itemsReceived + " items");
            }
        };
        /**
         * success handler
         */
        Sender.prototype._onSuccess = function (payload, countOfItemsInPayload) {
            // Uncomment if you want to use DataLossanalyzer
            // DataLossAnalyzer.decrementItemsQueued(countOfItemsInPayload);
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
        Sender._constructEnvelope = function (envelope) {
            switch (envelope.baseType) {
                case applicationinsights_common_1.Event.dataType:
                    return EnvelopeCreator_1.EventEnvelopeCreator.EventEnvelopeCreator.Create(envelope);
                case applicationinsights_common_1.Trace.dataType:
                    return EnvelopeCreator_1.TraceEnvelopeCreator.TraceEnvelopeCreator.Create(envelope);
                case applicationinsights_common_1.PageView.dataType:
                    return EnvelopeCreator_1.PageViewEnvelopeCreator.PageViewEnvelopeCreator.Create(envelope);
                case applicationinsights_common_1.PageViewPerformance.dataType:
                    return EnvelopeCreator_1.PageViewPerformanceEnvelopeCreator.PageViewPerformanceEnvelopeCreator.Create(envelope);
                case applicationinsights_common_1.Exception.dataType:
                    return EnvelopeCreator_1.ExceptionEnvelopeCreator.ExceptionEnvelopeCreator.Create(envelope);
                case applicationinsights_common_1.Metric.dataType:
                    return EnvelopeCreator_1.MetricEnvelopeCreator.MetricEnvelopeCreator.Create(envelope);
                case applicationinsights_common_1.RemoteDependencyData.dataType:
                    return EnvelopeCreator_1.DependencyEnvelopeCreator.DependencyEnvelopeCreator.Create(envelope);
                default:
                    return null;
            }
        };
        Sender._getDefaultAppInsightsChannelConfig = function (config, identifier) {
            var resultConfig = {};
            var pluginConfig = config.extensions && config.extensions[identifier] ? config.extensions[identifier] : {};
            // set default values
            resultConfig.endpointUrl = function () { return config.endpointUrl || "https://dc.services.visualstudio.com/v2/track"; };
            resultConfig.emitLineDelimitedJson = function () { return applicationinsights_common_1.Util.stringToBoolOrDefault(pluginConfig.emitLineDelimitedJson); };
            resultConfig.maxBatchInterval = function () { return !isNaN(pluginConfig.maxBatchInterval) ? pluginConfig.maxBatchInterval : 15000; };
            resultConfig.maxBatchSizeInBytes = function () { return pluginConfig.maxBatchSizeInBytes > 0 ? pluginConfig.maxBatchSizeInBytes : 102400; }; // 100kb
            resultConfig.disableTelemetry = function () { return applicationinsights_common_1.Util.stringToBoolOrDefault(pluginConfig.disableTelemetry); };
            resultConfig.enableSessionStorageBuffer = function () { return applicationinsights_common_1.Util.stringToBoolOrDefault(pluginConfig.enableSessionStorageBuffer, true); };
            resultConfig.isRetryDisabled = function () { return applicationinsights_common_1.Util.stringToBoolOrDefault(pluginConfig.isRetryDisabled); };
            resultConfig.isBeaconApiDisabled = function () { return applicationinsights_common_1.Util.stringToBoolOrDefault(pluginConfig.isBeaconApiDisabled, true); };
            return resultConfig;
        };
        Sender._validate = function (envelope) {
            // call the appropriate Validate depending on the baseType
            switch (envelope.baseType) {
                case applicationinsights_common_1.Event.dataType:
                    return EventValidator_1.EventValidator.EventValidator.Validate(envelope);
                case applicationinsights_common_1.Trace.dataType:
                    return TraceValidator_1.TraceValidator.TraceValidator.Validate(envelope);
                case applicationinsights_common_1.Exception.dataType:
                    return ExceptionValidator_1.ExceptionValidator.ExceptionValidator.Validate(envelope);
                case applicationinsights_common_1.Metric.dataType:
                    return MetricValidator_1.MetricValidator.MetricValidator.Validate(envelope);
                case applicationinsights_common_1.PageView.dataType:
                    return PageViewValidator_1.PageViewValidator.PageViewValidator.Validate(envelope);
                case applicationinsights_common_1.PageViewPerformance.dataType:
                    return PageViewPerformanceValidator_1.PageViewPerformanceValidator.PageViewPerformanceValidator.Validate(envelope);
                case applicationinsights_common_1.RemoteDependencyData.dataType:
                    return RemoteDepdencyValidator_1.RemoteDepdencyValidator.RemoteDepdencyValidator.Validate(envelope);
            }
            return false;
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
            }
            else {
                applicationinsights_common_1._InternalLogging.throwInternal(applicationinsights_common_1.LoggingSeverity.CRITICAL, applicationinsights_common_1._InternalMessageId.TransmissionFailed, ". " + "Failed to send telemetry with Beacon API.");
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
            xhr[applicationinsights_common_1.DisabledPropertyName] = true;
            xhr.open("POST", this._config.endpointUrl(), isAsync);
            xhr.setRequestHeader("Content-type", "application/json");
            // append Sdk-Context request header only in case of breeze endpoint 
            if (applicationinsights_common_1.Util.isInternalApplicationInsightsEndpoint(this._config.endpointUrl())) {
                xhr.setRequestHeader(applicationinsights_common_1.RequestHeaders.sdkContextHeader, applicationinsights_common_1.RequestHeaders.sdkContextHeaderAppIdRequest);
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
                        result.itemsReceived - result.itemsAccepted == result.errors.length) {
                        return result;
                    }
                }
            }
            catch (e) {
                applicationinsights_common_1._InternalLogging.throwInternal(applicationinsights_common_1.LoggingSeverity.CRITICAL, applicationinsights_common_1._InternalMessageId.InvalidBackendResponse, "Cannot parse the response. " + applicationinsights_common_1.Util.getExceptionName(e), {
                    response: response
                });
            }
            return null;
        };
        /**
         * Resend payload. Adds payload back to the send buffer and setup a send timer (with exponential backoff).
         * @param payload
         */
        Sender.prototype._resendPayload = function (payload) {
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
            this._setRetryTime();
            this._setupTimer();
        };
        /** Calculates the time to wait before retrying in case of an error based on
         * http://en.wikipedia.org/wiki/Exponential_backoff
         */
        Sender.prototype._setRetryTime = function () {
            var SlotDelayInSeconds = 10;
            var delayInSeconds;
            if (this._consecutiveErrors <= 1) {
                delayInSeconds = SlotDelayInSeconds;
            }
            else {
                var backOffSlot = (Math.pow(2, this._consecutiveErrors) - 1) / 2;
                var backOffDelay = Math.floor(Math.random() * backOffSlot * SlotDelayInSeconds) + 1;
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
            return statusCode == 408 // Timeout
                || statusCode == 429 // Too many requests.
                || statusCode == 500 // Internal server error.
                || statusCode == 503; // Service unavailable.
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
            var hostingProtocol = window.location.protocol;
            if (this._config.endpointUrl().lastIndexOf(hostingProtocol, 0) !== 0) {
                applicationinsights_common_1._InternalLogging.throwInternal(applicationinsights_common_1.LoggingSeverity.WARNING, applicationinsights_common_1._InternalMessageId.TransmissionFailed, ". " +
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
    exports.Sender = Sender;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=Sender.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-channel-js/bundle/Serializer.js":
/*!**************************************************************************!*\
  !*** ./node_modules/applicationinsights-channel-js/bundle/Serializer.js ***!
  \**************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! applicationinsights-common */ "./node_modules/applicationinsights-common/bundle/applicationinsights-common.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, applicationinsights_common_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Serializer = /** @class */ (function () {
        function Serializer() {
        }
        /**
         * Serializes the current object to a JSON string.
         */
        Serializer.serialize = function (input) {
            var output = Serializer._serializeObject(input, "root");
            return JSON.stringify(output);
        };
        Serializer._serializeObject = function (source, name) {
            var circularReferenceCheck = "__aiCircularRefCheck";
            var output = {};
            if (!source) {
                applicationinsights_common_1._InternalLogging.throwInternal(applicationinsights_common_1.LoggingSeverity.CRITICAL, applicationinsights_common_1._InternalMessageId.CannotSerializeObject, "cannot serialize object because it is null or undefined", { name: name }, true);
                return output;
            }
            if (source[circularReferenceCheck]) {
                applicationinsights_common_1._InternalLogging.throwInternal(applicationinsights_common_1.LoggingSeverity.WARNING, applicationinsights_common_1._InternalMessageId.CircularReferenceDetected, "Circular reference detected while serializing object", { name: name }, true);
                return output;
            }
            if (!source.aiDataContract) {
                // special case for measurements/properties/tags
                if (name === "measurements") {
                    output = Serializer._serializeStringMap(source, "number", name);
                }
                else if (name === "properties") {
                    output = Serializer._serializeStringMap(source, "string", name);
                }
                else if (name === "tags") {
                    output = Serializer._serializeStringMap(source, "string", name);
                }
                else if (applicationinsights_common_1.Util.isArray(source)) {
                    output = Serializer._serializeArray(source, name);
                }
                else {
                    applicationinsights_common_1._InternalLogging.throwInternal(applicationinsights_common_1.LoggingSeverity.WARNING, applicationinsights_common_1._InternalMessageId.CannotSerializeObjectNonSerializable, "Attempting to serialize an object which does not implement ISerializable", { name: name }, true);
                    try {
                        // verify that the object can be stringified
                        JSON.stringify(source);
                        output = source;
                    }
                    catch (e) {
                        // if serialization fails return an empty string
                        applicationinsights_common_1._InternalLogging.throwInternal(applicationinsights_common_1.LoggingSeverity.CRITICAL, applicationinsights_common_1._InternalMessageId.CannotSerializeObject, (e && typeof e.toString === 'function') ? e.toString() : "Error serializing object", null, true);
                    }
                }
                return output;
            }
            source[circularReferenceCheck] = true;
            for (var field in source.aiDataContract) {
                var contract = source.aiDataContract[field];
                var isRequired = (typeof contract === "function") ? (contract() & applicationinsights_common_1.FieldType.Required) : (contract & applicationinsights_common_1.FieldType.Required);
                var isHidden = (typeof contract === "function") ? (contract() & applicationinsights_common_1.FieldType.Hidden) : (contract & applicationinsights_common_1.FieldType.Hidden);
                var isArray = contract & applicationinsights_common_1.FieldType.Array;
                var isPresent = source[field] !== undefined;
                var isObject = typeof source[field] === "object" && source[field] !== null;
                if (isRequired && !isPresent && !isArray) {
                    applicationinsights_common_1._InternalLogging.throwInternal(applicationinsights_common_1.LoggingSeverity.CRITICAL, applicationinsights_common_1._InternalMessageId.MissingRequiredFieldSpecification, "Missing required field specification. The field is required but not present on source", { field: field, name: name });
                    // If not in debug mode, continue and hope the error is permissible
                    continue;
                }
                if (isHidden) {
                    // Don't serialize hidden fields
                    continue;
                }
                var value;
                if (isObject) {
                    if (isArray) {
                        // special case; resurse on each object in the source array
                        value = Serializer._serializeArray(source[field], field);
                    }
                    else {
                        // recurse on the source object in this field
                        value = Serializer._serializeObject(source[field], field);
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
        Serializer._serializeArray = function (sources, name) {
            var output = undefined;
            if (!!sources) {
                if (!applicationinsights_common_1.Util.isArray(sources)) {
                    applicationinsights_common_1._InternalLogging.throwInternal(applicationinsights_common_1.LoggingSeverity.CRITICAL, applicationinsights_common_1._InternalMessageId.ItemNotInArray, "This field was specified as an array in the contract but the item is not an array.\r\n", { name: name }, true);
                }
                else {
                    output = [];
                    for (var i = 0; i < sources.length; i++) {
                        var source = sources[i];
                        var item = Serializer._serializeObject(source, name + "[" + i + "]");
                        output.push(item);
                    }
                }
            }
            return output;
        };
        Serializer._serializeStringMap = function (map, expectedType, name) {
            var output = undefined;
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
                        applicationinsights_common_1._InternalLogging.throwInternal(applicationinsights_common_1.LoggingSeverity.CRITICAL, output[field], null, true);
                    }
                }
            }
            return output;
        };
        return Serializer;
    }());
    exports.Serializer = Serializer;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=Serializer.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-channel-js/bundle/TelemetryValidation/EventValidator.js":
/*!**************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-channel-js/bundle/TelemetryValidation/EventValidator.js ***!
  \**************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var EventValidator = /** @class */ (function () {
        function EventValidator() {
        }
        EventValidator.prototype.Validate = function (item) {
            /* TODO re-enable once design of iTelemetryItem is finalized. Task used to track this:
            https://mseng.visualstudio.com/AppInsights/_workitems/edit/1310871
    
            // verify system properties has a ver field
            if (!item.sytemProperties || !item.sytemProperties["ver"]) {
                return false;
            }
            
            if (!item.domainProperties || !item.domainProperties["name"]) {
                return false;
            }
            */
            return true;
        };
        EventValidator.EventValidator = new EventValidator();
        return EventValidator;
    }());
    exports.EventValidator = EventValidator;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=EventValidator.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-channel-js/bundle/TelemetryValidation/ExceptionValidator.js":
/*!******************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-channel-js/bundle/TelemetryValidation/ExceptionValidator.js ***!
  \******************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ExceptionValidator = /** @class */ (function () {
        function ExceptionValidator() {
        }
        ExceptionValidator.prototype.Validate = function (item) {
            /* TODO re-enable once design of iTelemetryItem is finalized. Task used to track this:
             https://mseng.visualstudio.com/AppInsights/_workitems/edit/1310871
    
            // verify system properties has a ver field
            if (!item.sytemProperties ||
                !item.sytemProperties["ver"]) {
                return false;
            }
    
            if (!item.domainProperties ||
                !item.domainProperties["exceptions"] ||
                !ExceptionValidator._validateExceptions(item.domainProperties["exceptions"])) {
                return false;
            }
            */
            return true;
        };
        // TODO implement validation of exceptions
        ExceptionValidator._validateExceptions = function (exceptions) {
            // typeName
            // message
            // parsedStack
            // stack
            // hasFullStack
            return true;
        };
        ExceptionValidator.ExceptionValidator = new ExceptionValidator();
        return ExceptionValidator;
    }());
    exports.ExceptionValidator = ExceptionValidator;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=ExceptionValidator.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-channel-js/bundle/TelemetryValidation/MetricValidator.js":
/*!***************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-channel-js/bundle/TelemetryValidation/MetricValidator.js ***!
  \***************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var MetricValidator = /** @class */ (function () {
        function MetricValidator() {
        }
        MetricValidator.prototype.Validate = function (event) {
            return false;
        };
        MetricValidator.MetricValidator = new MetricValidator();
        return MetricValidator;
    }());
    exports.MetricValidator = MetricValidator;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=MetricValidator.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-channel-js/bundle/TelemetryValidation/PageViewPerformanceValidator.js":
/*!****************************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-channel-js/bundle/TelemetryValidation/PageViewPerformanceValidator.js ***!
  \****************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var PageViewPerformanceValidator = /** @class */ (function () {
        function PageViewPerformanceValidator() {
        }
        PageViewPerformanceValidator.prototype.Validate = function (item) {
            /* TODO re-enable once design of iTelemetryItem is finalized. Task used to track this:
             https://mseng.visualstudio.com/AppInsights/_workitems/edit/1310871
            
            // verify system properties has a ver field
            if (!item.sytemProperties ||
                !item.sytemProperties["ver"]) {
                return false;
            }
    
            if (!item.domainProperties ||
                !item.domainProperties["domProcessing"] ||
                !item.domainProperties["duration"] ||
                !item.domainProperties["name"] ||
                !item.domainProperties["networkConnect"] ||
                !item.domainProperties["perfTotal"] ||
                !item.domainProperties["receivedResponse"] ||
                !item.domainProperties["sentRequest"] ||
                !item.domainProperties["url"]) {
                return false;
            }
            */
            return true;
        };
        PageViewPerformanceValidator.PageViewPerformanceValidator = new PageViewPerformanceValidator();
        return PageViewPerformanceValidator;
    }());
    exports.PageViewPerformanceValidator = PageViewPerformanceValidator;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=PageViewPerformanceValidator.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-channel-js/bundle/TelemetryValidation/PageViewValidator.js":
/*!*****************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-channel-js/bundle/TelemetryValidation/PageViewValidator.js ***!
  \*****************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var PageViewValidator = /** @class */ (function () {
        function PageViewValidator() {
        }
        PageViewValidator.prototype.Validate = function (item) {
            /* TODO re-enable once design of iTelemetryItem is finalized. Task used to track this:
             https://mseng.visualstudio.com/AppInsights/_workitems/edit/1310871
    
            // verify system properties has a ver field
            if (!item.sytemProperties ||
                !item.sytemProperties["ver"]) {
                return false;
            }
    
            if (!item.domainProperties ||
                !item.domainProperties["id"] ||
                !item.domainProperties["name"] ||
                !item.domainProperties["duration"] ||
                !item.domainProperties["url"]) {
                return false;
            }
            */
            return true;
        };
        PageViewValidator.PageViewValidator = new PageViewValidator();
        return PageViewValidator;
    }());
    exports.PageViewValidator = PageViewValidator;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=PageViewValidator.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-channel-js/bundle/TelemetryValidation/RemoteDepdencyValidator.js":
/*!***********************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-channel-js/bundle/TelemetryValidation/RemoteDepdencyValidator.js ***!
  \***********************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var RemoteDepdencyValidator = /** @class */ (function () {
        function RemoteDepdencyValidator() {
        }
        RemoteDepdencyValidator.prototype.Validate = function (item) {
            /* TODO re-enable once design of iTelemetryItem is finalized. Task used to track this:
             https://mseng.visualstudio.com/AppInsights/_workitems/edit/1310871
    
            // verify system properties has a ver field
            if (!item.sytemProperties ||
                !item.sytemProperties["ver"]) {
                return false;
            }
    
            if (!item.domainProperties ||
                !item.domainProperties["id"] ||
                !item.domainProperties["name"] ||
                !item.domainProperties["resultCode"] ||
                !item.domainProperties["duration"] ||
                !item.domainProperties["success"] ||
                !item.domainProperties["data"] ||
                !item.domainProperties["target"] ||
                !item.domainProperties["type"]) {
                return false;
            }
            */
            return true;
        };
        RemoteDepdencyValidator.RemoteDepdencyValidator = new RemoteDepdencyValidator();
        return RemoteDepdencyValidator;
    }());
    exports.RemoteDepdencyValidator = RemoteDepdencyValidator;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=RemoteDepdencyValidator.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-channel-js/bundle/TelemetryValidation/TraceValidator.js":
/*!**************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-channel-js/bundle/TelemetryValidation/TraceValidator.js ***!
  \**************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var TraceValidator = /** @class */ (function () {
        function TraceValidator() {
        }
        TraceValidator.prototype.Validate = function (item) {
            /* TODO re-enable once design of iTelemetryItem is finalized. Task used to track this:
             https://mseng.visualstudio.com/AppInsights/_workitems/edit/1310871
    
            // verify system properties has a ver field
            if (!item.sytemProperties ||
                !item.sytemProperties["ver"]) {
                return false;
            }
            
            if (!item.domainProperties ||
                !item.domainProperties["message"] ||
                !item.domainProperties["severityLevel"]) {
                return false;
            }
            */
            return true;
        };
        TraceValidator.TraceValidator = new TraceValidator();
        return TraceValidator;
    }());
    exports.TraceValidator = TraceValidator;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=TraceValidator.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-channel-js/bundle/applicationinsights-channel-js.js":
/*!**********************************************************************************************!*\
  !*** ./node_modules/applicationinsights-channel-js/bundle/applicationinsights-channel-js.js ***!
  \**********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ./Sender */ "./node_modules/applicationinsights-channel-js/bundle/Sender.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, Sender_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Sender = Sender_1.Sender;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=applicationinsights-channel-js.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-common/bundle/Constants.js":
/*!*********************************************************************!*\
  !*** ./node_modules/applicationinsights-common/bundle/Constants.js ***!
  \*********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DisabledPropertyName = "Microsoft_ApplicationInsights_BypassAjaxInstrumentation";
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=Constants.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-common/bundle/Enums.js":
/*!*****************************************************************!*\
  !*** ./node_modules/applicationinsights-common/bundle/Enums.js ***!
  \*****************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var LoggingSeverity;
    (function (LoggingSeverity) {
        /**
         * Error will be sent as internal telemetry
         */
        LoggingSeverity[LoggingSeverity["CRITICAL"] = 0] = "CRITICAL";
        /**
         * Error will NOT be sent as internal telemetry, and will only be shown in browser console
         */
        LoggingSeverity[LoggingSeverity["WARNING"] = 1] = "WARNING";
    })(LoggingSeverity = exports.LoggingSeverity || (exports.LoggingSeverity = {}));
    /**
     * Internal message ID. Please create a new one for every conceptually different message. Please keep alphabetically ordered
     */
    var _InternalMessageId;
    (function (_InternalMessageId) {
        // Non user actionable
        _InternalMessageId[_InternalMessageId["BrowserDoesNotSupportLocalStorage"] = 0] = "BrowserDoesNotSupportLocalStorage";
        _InternalMessageId[_InternalMessageId["BrowserCannotReadLocalStorage"] = 1] = "BrowserCannotReadLocalStorage";
        _InternalMessageId[_InternalMessageId["BrowserCannotReadSessionStorage"] = 2] = "BrowserCannotReadSessionStorage";
        _InternalMessageId[_InternalMessageId["BrowserCannotWriteLocalStorage"] = 3] = "BrowserCannotWriteLocalStorage";
        _InternalMessageId[_InternalMessageId["BrowserCannotWriteSessionStorage"] = 4] = "BrowserCannotWriteSessionStorage";
        _InternalMessageId[_InternalMessageId["BrowserFailedRemovalFromLocalStorage"] = 5] = "BrowserFailedRemovalFromLocalStorage";
        _InternalMessageId[_InternalMessageId["BrowserFailedRemovalFromSessionStorage"] = 6] = "BrowserFailedRemovalFromSessionStorage";
        _InternalMessageId[_InternalMessageId["CannotSendEmptyTelemetry"] = 7] = "CannotSendEmptyTelemetry";
        _InternalMessageId[_InternalMessageId["ClientPerformanceMathError"] = 8] = "ClientPerformanceMathError";
        _InternalMessageId[_InternalMessageId["ErrorParsingAISessionCookie"] = 9] = "ErrorParsingAISessionCookie";
        _InternalMessageId[_InternalMessageId["ErrorPVCalc"] = 10] = "ErrorPVCalc";
        _InternalMessageId[_InternalMessageId["ExceptionWhileLoggingError"] = 11] = "ExceptionWhileLoggingError";
        _InternalMessageId[_InternalMessageId["FailedAddingTelemetryToBuffer"] = 12] = "FailedAddingTelemetryToBuffer";
        _InternalMessageId[_InternalMessageId["FailedMonitorAjaxAbort"] = 13] = "FailedMonitorAjaxAbort";
        _InternalMessageId[_InternalMessageId["FailedMonitorAjaxDur"] = 14] = "FailedMonitorAjaxDur";
        _InternalMessageId[_InternalMessageId["FailedMonitorAjaxOpen"] = 15] = "FailedMonitorAjaxOpen";
        _InternalMessageId[_InternalMessageId["FailedMonitorAjaxRSC"] = 16] = "FailedMonitorAjaxRSC";
        _InternalMessageId[_InternalMessageId["FailedMonitorAjaxSend"] = 17] = "FailedMonitorAjaxSend";
        _InternalMessageId[_InternalMessageId["FailedMonitorAjaxGetCorrelationHeader"] = 18] = "FailedMonitorAjaxGetCorrelationHeader";
        _InternalMessageId[_InternalMessageId["FailedToAddHandlerForOnBeforeUnload"] = 19] = "FailedToAddHandlerForOnBeforeUnload";
        _InternalMessageId[_InternalMessageId["FailedToSendQueuedTelemetry"] = 20] = "FailedToSendQueuedTelemetry";
        _InternalMessageId[_InternalMessageId["FailedToReportDataLoss"] = 21] = "FailedToReportDataLoss";
        _InternalMessageId[_InternalMessageId["FlushFailed"] = 22] = "FlushFailed";
        _InternalMessageId[_InternalMessageId["MessageLimitPerPVExceeded"] = 23] = "MessageLimitPerPVExceeded";
        _InternalMessageId[_InternalMessageId["MissingRequiredFieldSpecification"] = 24] = "MissingRequiredFieldSpecification";
        _InternalMessageId[_InternalMessageId["NavigationTimingNotSupported"] = 25] = "NavigationTimingNotSupported";
        _InternalMessageId[_InternalMessageId["OnError"] = 26] = "OnError";
        _InternalMessageId[_InternalMessageId["SessionRenewalDateIsZero"] = 27] = "SessionRenewalDateIsZero";
        _InternalMessageId[_InternalMessageId["SenderNotInitialized"] = 28] = "SenderNotInitialized";
        _InternalMessageId[_InternalMessageId["StartTrackEventFailed"] = 29] = "StartTrackEventFailed";
        _InternalMessageId[_InternalMessageId["StopTrackEventFailed"] = 30] = "StopTrackEventFailed";
        _InternalMessageId[_InternalMessageId["StartTrackFailed"] = 31] = "StartTrackFailed";
        _InternalMessageId[_InternalMessageId["StopTrackFailed"] = 32] = "StopTrackFailed";
        _InternalMessageId[_InternalMessageId["TelemetrySampledAndNotSent"] = 33] = "TelemetrySampledAndNotSent";
        _InternalMessageId[_InternalMessageId["TrackEventFailed"] = 34] = "TrackEventFailed";
        _InternalMessageId[_InternalMessageId["TrackExceptionFailed"] = 35] = "TrackExceptionFailed";
        _InternalMessageId[_InternalMessageId["TrackMetricFailed"] = 36] = "TrackMetricFailed";
        _InternalMessageId[_InternalMessageId["TrackPVFailed"] = 37] = "TrackPVFailed";
        _InternalMessageId[_InternalMessageId["TrackPVFailedCalc"] = 38] = "TrackPVFailedCalc";
        _InternalMessageId[_InternalMessageId["TrackTraceFailed"] = 39] = "TrackTraceFailed";
        _InternalMessageId[_InternalMessageId["TransmissionFailed"] = 40] = "TransmissionFailed";
        _InternalMessageId[_InternalMessageId["FailedToSetStorageBuffer"] = 41] = "FailedToSetStorageBuffer";
        _InternalMessageId[_InternalMessageId["FailedToRestoreStorageBuffer"] = 42] = "FailedToRestoreStorageBuffer";
        _InternalMessageId[_InternalMessageId["InvalidBackendResponse"] = 43] = "InvalidBackendResponse";
        _InternalMessageId[_InternalMessageId["FailedToFixDepricatedValues"] = 44] = "FailedToFixDepricatedValues";
        _InternalMessageId[_InternalMessageId["InvalidDurationValue"] = 45] = "InvalidDurationValue";
        _InternalMessageId[_InternalMessageId["TelemetryEnvelopeInvalid"] = 46] = "TelemetryEnvelopeInvalid";
        _InternalMessageId[_InternalMessageId["CreateEnvelopeError"] = 47] = "CreateEnvelopeError";
        // User actionable
        _InternalMessageId[_InternalMessageId["CannotSerializeObject"] = 48] = "CannotSerializeObject";
        _InternalMessageId[_InternalMessageId["CannotSerializeObjectNonSerializable"] = 49] = "CannotSerializeObjectNonSerializable";
        _InternalMessageId[_InternalMessageId["CircularReferenceDetected"] = 50] = "CircularReferenceDetected";
        _InternalMessageId[_InternalMessageId["ClearAuthContextFailed"] = 51] = "ClearAuthContextFailed";
        _InternalMessageId[_InternalMessageId["ExceptionTruncated"] = 52] = "ExceptionTruncated";
        _InternalMessageId[_InternalMessageId["IllegalCharsInName"] = 53] = "IllegalCharsInName";
        _InternalMessageId[_InternalMessageId["ItemNotInArray"] = 54] = "ItemNotInArray";
        _InternalMessageId[_InternalMessageId["MaxAjaxPerPVExceeded"] = 55] = "MaxAjaxPerPVExceeded";
        _InternalMessageId[_InternalMessageId["MessageTruncated"] = 56] = "MessageTruncated";
        _InternalMessageId[_InternalMessageId["NameTooLong"] = 57] = "NameTooLong";
        _InternalMessageId[_InternalMessageId["SampleRateOutOfRange"] = 58] = "SampleRateOutOfRange";
        _InternalMessageId[_InternalMessageId["SetAuthContextFailed"] = 59] = "SetAuthContextFailed";
        _InternalMessageId[_InternalMessageId["SetAuthContextFailedAccountName"] = 60] = "SetAuthContextFailedAccountName";
        _InternalMessageId[_InternalMessageId["StringValueTooLong"] = 61] = "StringValueTooLong";
        _InternalMessageId[_InternalMessageId["StartCalledMoreThanOnce"] = 62] = "StartCalledMoreThanOnce";
        _InternalMessageId[_InternalMessageId["StopCalledWithoutStart"] = 63] = "StopCalledWithoutStart";
        _InternalMessageId[_InternalMessageId["TelemetryInitializerFailed"] = 64] = "TelemetryInitializerFailed";
        _InternalMessageId[_InternalMessageId["TrackArgumentsNotSpecified"] = 65] = "TrackArgumentsNotSpecified";
        _InternalMessageId[_InternalMessageId["UrlTooLong"] = 66] = "UrlTooLong";
        _InternalMessageId[_InternalMessageId["SessionStorageBufferFull"] = 67] = "SessionStorageBufferFull";
        _InternalMessageId[_InternalMessageId["CannotAccessCookie"] = 68] = "CannotAccessCookie";
        _InternalMessageId[_InternalMessageId["IdTooLong"] = 69] = "IdTooLong";
    })(_InternalMessageId = exports._InternalMessageId || (exports._InternalMessageId = {}));
    /**
    * Type of storage to differentiate between local storage and session storage
    */
    var StorageType;
    (function (StorageType) {
        StorageType[StorageType["LocalStorage"] = 0] = "LocalStorage";
        StorageType[StorageType["SessionStorage"] = 1] = "SessionStorage";
    })(StorageType = exports.StorageType || (exports.StorageType = {}));
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
    })(FieldType = exports.FieldType || (exports.FieldType = {}));
    ;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=Enums.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/Base.js":
/*!***********************************************************************************************!*\
  !*** ./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/Base.js ***!
  \***********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// THIS FILE WAS AUTOGENERATED
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
         * Data struct to contain only C section with custom fields.
         */
    var Base = /** @class */ (function () {
        function Base() {
        }
        return Base;
    }());
    exports.Base = Base;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=Base.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/ContextTagKeys.js":
/*!*********************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/ContextTagKeys.js ***!
  \*********************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
            this.internalSdkVersion = "ai.internal.sdkVersion";
            this.internalAgentVersion = "ai.internal.agentVersion";
            this.internalNodeName = "ai.internal.nodeName";
        }
        return ContextTagKeys;
    }());
    exports.ContextTagKeys = ContextTagKeys;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=ContextTagKeys.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/Data.js":
/*!***********************************************************************************************!*\
  !*** ./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/Data.js ***!
  \***********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ./Base */ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/Base.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, Base_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Data struct to contain both B and C sections.
     */
    var Data = /** @class */ (function (_super) {
        __extends(Data, _super);
        function Data() {
            return _super.call(this) || this;
        }
        return Data;
    }(Base_1.Base));
    exports.Data = Data;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=Data.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/DataPoint.js":
/*!****************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/DataPoint.js ***!
  \****************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ./DataPointType */ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/DataPointType.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, DataPointType_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Metric data single measurement.
     */
    var DataPoint = /** @class */ (function () {
        function DataPoint() {
            this.kind = DataPointType_1.DataPointType.Measurement;
        }
        return DataPoint;
    }());
    exports.DataPoint = DataPoint;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=DataPoint.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/DataPointType.js":
/*!********************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/DataPointType.js ***!
  \********************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // THIS FILE WAS AUTOGENERATED
    /**
     * Type of the metric data measurement.
     */
    var DataPointType;
    (function (DataPointType) {
        DataPointType[DataPointType["Measurement"] = 0] = "Measurement";
        DataPointType[DataPointType["Aggregation"] = 1] = "Aggregation";
    })(DataPointType = exports.DataPointType || (exports.DataPointType = {}));
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=DataPointType.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/Domain.js":
/*!*************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/Domain.js ***!
  \*************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// THIS FILE WAS AUTOGENERATED
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * The abstract common base of all domains.
     */
    var Domain = /** @class */ (function () {
        function Domain() {
        }
        return Domain;
    }());
    exports.Domain = Domain;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=Domain.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/Envelope.js":
/*!***************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/Envelope.js ***!
  \***************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
    exports.Envelope = Envelope;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=Envelope.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/EventData.js":
/*!****************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/EventData.js ***!
  \****************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ./Domain */ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/Domain.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, Domain_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
    }(Domain_1.Domain));
    exports.EventData = EventData;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=EventData.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/ExceptionData.js":
/*!********************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/ExceptionData.js ***!
  \********************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ./Domain */ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/Domain.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, Domain_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
    }(Domain_1.Domain));
    exports.ExceptionData = ExceptionData;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=ExceptionData.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/ExceptionDetails.js":
/*!***********************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/ExceptionDetails.js ***!
  \***********************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
    exports.ExceptionDetails = ExceptionDetails;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=ExceptionDetails.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/MessageData.js":
/*!******************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/MessageData.js ***!
  \******************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ./Domain */ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/Domain.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, Domain_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Instances of Message represent printf-like trace statements that are text-searched. Log4Net, NLog and other text-based log file entries are translated into intances of this type. The message does not have measurements.
     */
    var MessageData = /** @class */ (function (_super) {
        __extends(MessageData, _super);
        function MessageData() {
            var _this = _super.call(this) || this;
            _this.ver = 2;
            _this.properties = {};
            return _this;
        }
        return MessageData;
    }(Domain_1.Domain));
    exports.MessageData = MessageData;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=MessageData.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/MetricData.js":
/*!*****************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/MetricData.js ***!
  \*****************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ./Domain */ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/Domain.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, Domain_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
            return _this;
        }
        return MetricData;
    }(Domain_1.Domain));
    exports.MetricData = MetricData;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=MetricData.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/PageViewData.js":
/*!*******************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/PageViewData.js ***!
  \*******************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ./EventData */ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/EventData.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, EventData_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
    }(EventData_1.EventData));
    exports.PageViewData = PageViewData;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=PageViewData.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/PageViewPerfData.js":
/*!***********************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/PageViewPerfData.js ***!
  \***********************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ./PageViewData */ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/PageViewData.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, PageViewData_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
    }(PageViewData_1.PageViewData));
    exports.PageViewPerfData = PageViewPerfData;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=PageViewPerfData.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/RemoteDependencyData.js":
/*!***************************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/RemoteDependencyData.js ***!
  \***************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ./Domain */ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/Domain.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, Domain_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
    }(Domain_1.Domain));
    exports.RemoteDependencyData = RemoteDependencyData;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=RemoteDependencyData.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/SeverityLevel.js":
/*!********************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/SeverityLevel.js ***!
  \********************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// THIS FILE WAS AUTOGENERATED
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
    })(SeverityLevel = exports.SeverityLevel || (exports.SeverityLevel = {}));
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=SeverityLevel.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/StackFrame.js":
/*!*****************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/StackFrame.js ***!
  \*****************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // THIS FILE WAS AUTOGENERATED
    /**
     * Stack frame information.
     */
    var StackFrame = /** @class */ (function () {
        function StackFrame() {
        }
        return StackFrame;
    }());
    exports.StackFrame = StackFrame;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=StackFrame.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-common/bundle/Logging.js":
/*!*******************************************************************!*\
  !*** ./node_modules/applicationinsights-common/bundle/Logging.js ***!
  \*******************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ./Enums */ "./node_modules/applicationinsights-common/bundle/Enums.js"), __webpack_require__(/*! ./Util */ "./node_modules/applicationinsights-common/bundle/Util.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, Enums_1, Util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var _InternalLogMessage = /** @class */ (function () {
        function _InternalLogMessage(msgId, msg, isUserAct, properties) {
            if (isUserAct === void 0) { isUserAct = false; }
            this.messageId = msgId;
            this.message =
                (isUserAct ? _InternalLogMessage.AiUserActionablePrefix : _InternalLogMessage.AiNonUserActionablePrefix) +
                    Enums_1._InternalMessageId[msgId].toString();
            var diagnosticText = (msg ? " message:" + _InternalLogMessage.sanitizeDiagnosticText(msg) : "") +
                (properties ? " props:" + _InternalLogMessage.sanitizeDiagnosticText(JSON.stringify(properties)) : "");
            this.message += diagnosticText;
        }
        _InternalLogMessage.sanitizeDiagnosticText = function (text) {
            return "\"" + text.replace(/\"/g, "") + "\"";
        };
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
    exports._InternalLogMessage = _InternalLogMessage;
    var _InternalLogging = /** @class */ (function () {
        function _InternalLogging() {
        }
        /**
         * This method will throw exceptions in debug mode or attempt to log the error as a console warning.
         * @param severity {LoggingSeverity} - The severity of the log message
         * @param message {_InternalLogMessage} - The log message.
         */
        _InternalLogging.throwInternal = function (severity, msgId, msg, properties, isUserAct) {
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
                            var messageKey = Enums_1._InternalMessageId[message.messageId];
                            if (!this._messageLogged[messageKey] || this.verboseLogging()) {
                                this.warnToConsole(message.message);
                                this._messageLogged[messageKey] = true;
                            }
                        }
                        else {
                            // don't log internal AI traces in the console, unless the verbose logging is enabled
                            if (this.verboseLogging()) {
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
        _InternalLogging.warnToConsole = function (message) {
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
        _InternalLogging.resetInternalMessageCount = function () {
            this._messageCount = 0;
            this._messageLogged = {};
        };
        /**
         * Clears the list of records indicating that internal message type was already logged
         */
        _InternalLogging.clearInternalMessageLoggedTypes = function () {
            if (Util_1.Util.canUseSessionStorage()) {
                var sessionStorageKeys = Util_1.Util.getSessionStorageKeys();
                for (var i = 0; i < sessionStorageKeys.length; i++) {
                    if (sessionStorageKeys[i].indexOf(_InternalLogging.AIInternalMessagePrefix) === 0) {
                        Util_1.Util.removeSessionStorage(sessionStorageKeys[i]);
                    }
                }
            }
        };
        /**
         * Sets the limit for the number of internal events before they are throttled
         * @param limit {number} - The throttle limit to set for internal events
         */
        _InternalLogging.setMaxInternalMessageLimit = function (limit) {
            if (!limit) {
                throw new Error('limit cannot be undefined.');
            }
            this.MAX_INTERNAL_MESSAGE_LIMIT = limit;
        };
        /**
         * Logs a message to the internal queue.
         * @param severity {LoggingSeverity} - The severity of the log message
         * @param message {_InternalLogMessage} - The message to log.
         */
        _InternalLogging.logInternalMessage = function (severity, message) {
            if (this._areInternalMessagesThrottled()) {
                return;
            }
            // check if this message type was already logged for this session and if so, don't log it again
            var logMessage = true;
            var messageKey = _InternalLogging.AIInternalMessagePrefix + Enums_1._InternalMessageId[message.messageId];
            if (Util_1.Util.canUseSessionStorage()) {
                var internalMessageTypeLogRecord = Util_1.Util.getSessionStorage(messageKey);
                if (internalMessageTypeLogRecord) {
                    logMessage = false;
                }
                else {
                    Util_1.Util.setSessionStorage(messageKey, "1");
                }
            }
            else {
                // if the session storage is not available, limit to only one message type per page view
                if (this._messageLogged[messageKey]) {
                    logMessage = false;
                }
                else {
                    this._messageLogged[messageKey] = true;
                }
            }
            if (logMessage) {
                // Push the event in the internal queue
                if (this.verboseLogging() || severity === Enums_1.LoggingSeverity.CRITICAL) {
                    this.queue.push(message);
                    this._messageCount++;
                }
                // When throttle limit reached, send a special event
                if (this._messageCount == this.MAX_INTERNAL_MESSAGE_LIMIT) {
                    var throttleLimitMessage = "Internal events throttle limit per PageView reached for this app.";
                    var throttleMessage = new _InternalLogMessage(Enums_1._InternalMessageId.MessageLimitPerPVExceeded, throttleLimitMessage, false);
                    this.queue.push(throttleMessage);
                    this.warnToConsole(throttleLimitMessage);
                }
            }
        };
        /**
         * Indicates whether the internal events are throttled
         */
        _InternalLogging._areInternalMessagesThrottled = function () {
            return this._messageCount >= this.MAX_INTERNAL_MESSAGE_LIMIT;
        };
        /**
        *  Session storage key for the prefix for the key indicating message type already logged
        */
        _InternalLogging.AIInternalMessagePrefix = "AITR_";
        /**
         * When this is true the SDK will throw exceptions to aid in debugging.
         */
        _InternalLogging.enableDebugExceptions = function () { return false; };
        /**
         * When this is true the SDK will log more messages to aid in debugging.
         */
        _InternalLogging.verboseLogging = function () { return false; };
        /**
         * The internal logging queue
         */
        _InternalLogging.queue = [];
        /**
         * The maximum number of internal messages allowed to be sent per page view
         */
        _InternalLogging.MAX_INTERNAL_MESSAGE_LIMIT = 25;
        /**
         * Count of internal messages sent
         */
        _InternalLogging._messageCount = 0;
        /**
         * Holds information about what message types were already logged to console or sent to server.
         */
        _InternalLogging._messageLogged = {};
        return _InternalLogging;
    }());
    exports._InternalLogging = _InternalLogging;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=Logging.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-common/bundle/RequestResponseHeaders.js":
/*!**********************************************************************************!*\
  !*** ./node_modules/applicationinsights-common/bundle/RequestResponseHeaders.js ***!
  \**********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
    exports.RequestHeaders = RequestHeaders;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=RequestResponseHeaders.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-common/bundle/Telemetry/Common/Data.js":
/*!*********************************************************************************!*\
  !*** ./node_modules/applicationinsights-common/bundle/Telemetry/Common/Data.js ***!
  \*********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ../../Interfaces/Contracts/Generated/Data */ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/Data.js"), __webpack_require__(/*! ../../Enums */ "./node_modules/applicationinsights-common/bundle/Enums.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, Data_1, Enums_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Data = /** @class */ (function (_super) {
        __extends(Data, _super);
        /**
         * Constructs a new instance of telemetry data.
         */
        function Data(type, data) {
            var _this = _super.call(this) || this;
            /**
             * The data contract for serializing this object.
             */
            _this.aiDataContract = {
                baseType: Enums_1.FieldType.Required,
                baseData: Enums_1.FieldType.Required
            };
            _this.baseType = type;
            _this.baseData = data;
            return _this;
        }
        return Data;
    }(Data_1.Data));
    exports.Data = Data;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=Data.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-common/bundle/Telemetry/Common/DataPoint.js":
/*!**************************************************************************************!*\
  !*** ./node_modules/applicationinsights-common/bundle/Telemetry/Common/DataPoint.js ***!
  \**************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ../../Interfaces/Contracts/Generated/DataPoint */ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/DataPoint.js"), __webpack_require__(/*! ../../Enums */ "./node_modules/applicationinsights-common/bundle/Enums.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, DataPoint_1, Enums_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var DataPoint = /** @class */ (function (_super) {
        __extends(DataPoint, _super);
        function DataPoint() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            /**
             * The data contract for serializing this object.
             */
            _this.aiDataContract = {
                name: Enums_1.FieldType.Required,
                kind: Enums_1.FieldType.Default,
                value: Enums_1.FieldType.Required,
                count: Enums_1.FieldType.Default,
                min: Enums_1.FieldType.Default,
                max: Enums_1.FieldType.Default,
                stdDev: Enums_1.FieldType.Default
            };
            return _this;
        }
        return DataPoint;
    }(DataPoint_1.DataPoint));
    exports.DataPoint = DataPoint;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=DataPoint.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-common/bundle/Telemetry/Common/DataSanitizer.js":
/*!******************************************************************************************!*\
  !*** ./node_modules/applicationinsights-common/bundle/Telemetry/Common/DataSanitizer.js ***!
  \******************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ../../Logging */ "./node_modules/applicationinsights-common/bundle/Logging.js"), __webpack_require__(/*! ../../Util */ "./node_modules/applicationinsights-common/bundle/Util.js"), __webpack_require__(/*! ../../Enums */ "./node_modules/applicationinsights-common/bundle/Enums.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, Logging_1, Util_1, Enums_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var DataSanitizer = /** @class */ (function () {
        function DataSanitizer() {
        }
        DataSanitizer.sanitizeKeyAndAddUniqueness = function (key, map) {
            var origLength = key.length;
            var field = DataSanitizer.sanitizeKey(key);
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
        DataSanitizer.sanitizeKey = function (name) {
            if (name) {
                // Remove any leading or trailing whitepace
                name = Util_1.Util.trim(name.toString());
                // truncate the string to 150 chars
                if (name.length > DataSanitizer.MAX_NAME_LENGTH) {
                    name = name.substring(0, DataSanitizer.MAX_NAME_LENGTH);
                    Logging_1._InternalLogging.throwInternal(Enums_1.LoggingSeverity.WARNING, Enums_1._InternalMessageId.NameTooLong, "name is too long.  It has been truncated to " + DataSanitizer.MAX_NAME_LENGTH + " characters.", { name: name }, true);
                }
            }
            return name;
        };
        DataSanitizer.sanitizeString = function (value, maxLength) {
            if (maxLength === void 0) { maxLength = DataSanitizer.MAX_STRING_LENGTH; }
            if (value) {
                maxLength = maxLength ? maxLength : DataSanitizer.MAX_STRING_LENGTH; // in case default parameters dont work
                value = Util_1.Util.trim(value);
                if (value.toString().length > maxLength) {
                    value = value.toString().substring(0, maxLength);
                    Logging_1._InternalLogging.throwInternal(Enums_1.LoggingSeverity.WARNING, Enums_1._InternalMessageId.StringValueTooLong, "string value is too long. It has been truncated to " + maxLength + " characters.", { value: value }, true);
                }
            }
            return value;
        };
        DataSanitizer.sanitizeUrl = function (url) {
            return DataSanitizer.sanitizeInput(url, DataSanitizer.MAX_URL_LENGTH, Enums_1._InternalMessageId.UrlTooLong);
        };
        DataSanitizer.sanitizeMessage = function (message) {
            if (message) {
                if (message.length > DataSanitizer.MAX_MESSAGE_LENGTH) {
                    message = message.substring(0, DataSanitizer.MAX_MESSAGE_LENGTH);
                    Logging_1._InternalLogging.throwInternal(Enums_1.LoggingSeverity.WARNING, Enums_1._InternalMessageId.MessageTruncated, "message is too long, it has been truncated to " + DataSanitizer.MAX_MESSAGE_LENGTH + " characters.", { message: message }, true);
                }
            }
            return message;
        };
        DataSanitizer.sanitizeException = function (exception) {
            if (exception) {
                if (exception.length > DataSanitizer.MAX_EXCEPTION_LENGTH) {
                    exception = exception.substring(0, DataSanitizer.MAX_EXCEPTION_LENGTH);
                    Logging_1._InternalLogging.throwInternal(Enums_1.LoggingSeverity.WARNING, Enums_1._InternalMessageId.ExceptionTruncated, "exception is too long, it has been truncated to " + DataSanitizer.MAX_EXCEPTION_LENGTH + " characters.", { exception: exception }, true);
                }
            }
            return exception;
        };
        DataSanitizer.sanitizeProperties = function (properties) {
            if (properties) {
                var tempProps = {};
                for (var prop in properties) {
                    var value = DataSanitizer.sanitizeString(properties[prop], DataSanitizer.MAX_PROPERTY_LENGTH);
                    prop = DataSanitizer.sanitizeKeyAndAddUniqueness(prop, tempProps);
                    tempProps[prop] = value;
                }
                properties = tempProps;
            }
            return properties;
        };
        DataSanitizer.sanitizeMeasurements = function (measurements) {
            if (measurements) {
                var tempMeasurements = {};
                for (var measure in measurements) {
                    var value = measurements[measure];
                    measure = DataSanitizer.sanitizeKeyAndAddUniqueness(measure, tempMeasurements);
                    tempMeasurements[measure] = value;
                }
                measurements = tempMeasurements;
            }
            return measurements;
        };
        DataSanitizer.sanitizeId = function (id) {
            return id ? DataSanitizer.sanitizeInput(id, DataSanitizer.MAX_ID_LENGTH, Enums_1._InternalMessageId.IdTooLong).toString() : id;
        };
        DataSanitizer.sanitizeInput = function (input, maxLength, _msgId) {
            if (input) {
                input = Util_1.Util.trim(input);
                if (input.length > maxLength) {
                    input = input.substring(0, maxLength);
                    Logging_1._InternalLogging.throwInternal(Enums_1.LoggingSeverity.WARNING, _msgId, "input is too long, it has been truncated to " + maxLength + " characters.", { data: input }, true);
                }
            }
            return input;
        };
        DataSanitizer.padNumber = function (num) {
            var s = "00" + num;
            return s.substr(s.length - 3);
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
    exports.DataSanitizer = DataSanitizer;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=DataSanitizer.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-common/bundle/Telemetry/Common/Envelope.js":
/*!*************************************************************************************!*\
  !*** ./node_modules/applicationinsights-common/bundle/Telemetry/Common/Envelope.js ***!
  \*************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ../../Interfaces/Contracts/Generated/Envelope */ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/Envelope.js"), __webpack_require__(/*! ./DataSanitizer */ "./node_modules/applicationinsights-common/bundle/Telemetry/Common/DataSanitizer.js"), __webpack_require__(/*! ../../Enums */ "./node_modules/applicationinsights-common/bundle/Enums.js"), __webpack_require__(/*! ../../Util */ "./node_modules/applicationinsights-common/bundle/Util.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, Envelope_1, DataSanitizer_1, Enums_1, Util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Envelope = /** @class */ (function (_super) {
        __extends(Envelope, _super);
        /**
         * Constructs a new instance of telemetry data.
         */
        function Envelope(data, name) {
            var _this = _super.call(this) || this;
            _this.name = DataSanitizer_1.DataSanitizer.sanitizeString(name) || Util_1.Util.NotSpecified;
            _this.data = data;
            _this.time = Util_1.Util.toISOStringForIE8(new Date());
            _this.aiDataContract = {
                time: Enums_1.FieldType.Required,
                iKey: Enums_1.FieldType.Required,
                name: Enums_1.FieldType.Required,
                sampleRate: function () {
                    return (_this.sampleRate == 100) ? Enums_1.FieldType.Hidden : Enums_1.FieldType.Required;
                },
                tags: Enums_1.FieldType.Required,
                data: Enums_1.FieldType.Required
            };
            return _this;
        }
        return Envelope;
    }(Envelope_1.Envelope));
    exports.Envelope = Envelope;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=Envelope.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-common/bundle/Telemetry/Event.js":
/*!***************************************************************************!*\
  !*** ./node_modules/applicationinsights-common/bundle/Telemetry/Event.js ***!
  \***************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ../Interfaces/Contracts/Generated/EventData */ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/EventData.js"), __webpack_require__(/*! ./Common/DataSanitizer */ "./node_modules/applicationinsights-common/bundle/Telemetry/Common/DataSanitizer.js"), __webpack_require__(/*! ../Enums */ "./node_modules/applicationinsights-common/bundle/Enums.js"), __webpack_require__(/*! ../Util */ "./node_modules/applicationinsights-common/bundle/Util.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, EventData_1, DataSanitizer_1, Enums_1, Util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Event = /** @class */ (function (_super) {
        __extends(Event, _super);
        /**
         * Constructs a new instance of the EventTelemetry object
         */
        function Event(name, properties, measurements) {
            var _this = _super.call(this) || this;
            _this.aiDataContract = {
                ver: Enums_1.FieldType.Required,
                name: Enums_1.FieldType.Required,
                properties: Enums_1.FieldType.Default,
                measurements: Enums_1.FieldType.Default
            };
            _this.name = DataSanitizer_1.DataSanitizer.sanitizeString(name) || Util_1.Util.NotSpecified;
            _this.properties = DataSanitizer_1.DataSanitizer.sanitizeProperties(properties);
            _this.measurements = DataSanitizer_1.DataSanitizer.sanitizeMeasurements(measurements);
            return _this;
        }
        Event.envelopeType = "Microsoft.ApplicationInsights.{0}.Event";
        Event.dataType = "EventData";
        return Event;
    }(EventData_1.EventData));
    exports.Event = Event;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=Event.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-common/bundle/Telemetry/Exception.js":
/*!*******************************************************************************!*\
  !*** ./node_modules/applicationinsights-common/bundle/Telemetry/Exception.js ***!
  \*******************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ../Interfaces/Contracts/Generated/StackFrame */ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/StackFrame.js"), __webpack_require__(/*! ../Interfaces/Contracts/Generated/ExceptionData */ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/ExceptionData.js"), __webpack_require__(/*! ../Interfaces/Contracts/Generated/ExceptionDetails */ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/ExceptionDetails.js"), __webpack_require__(/*! ./Common/DataSanitizer */ "./node_modules/applicationinsights-common/bundle/Telemetry/Common/DataSanitizer.js"), __webpack_require__(/*! ../Enums */ "./node_modules/applicationinsights-common/bundle/Enums.js"), __webpack_require__(/*! ../Util */ "./node_modules/applicationinsights-common/bundle/Util.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, StackFrame_1, ExceptionData_1, ExceptionDetails_1, DataSanitizer_1, Enums_1, Util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Exception = /** @class */ (function (_super) {
        __extends(Exception, _super);
        /**
        * Constructs a new isntance of the ExceptionTelemetry object
        */
        function Exception(exception, properties, measurements, severityLevel) {
            var _this = _super.call(this) || this;
            _this.aiDataContract = {
                ver: Enums_1.FieldType.Required,
                exceptions: Enums_1.FieldType.Required,
                severityLevel: Enums_1.FieldType.Default,
                properties: Enums_1.FieldType.Default,
                measurements: Enums_1.FieldType.Default
            };
            _this.properties = DataSanitizer_1.DataSanitizer.sanitizeProperties(properties);
            _this.measurements = DataSanitizer_1.DataSanitizer.sanitizeMeasurements(measurements);
            _this.exceptions = [new _ExceptionDetails(exception)];
            if (severityLevel) {
                _this.severityLevel = severityLevel;
            }
            return _this;
        }
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
    }(ExceptionData_1.ExceptionData));
    exports.Exception = Exception;
    var _ExceptionDetails = /** @class */ (function (_super) {
        __extends(_ExceptionDetails, _super);
        function _ExceptionDetails(exception) {
            var _this = _super.call(this) || this;
            _this.aiDataContract = {
                id: Enums_1.FieldType.Default,
                outerId: Enums_1.FieldType.Default,
                typeName: Enums_1.FieldType.Required,
                message: Enums_1.FieldType.Required,
                hasFullStack: Enums_1.FieldType.Default,
                stack: Enums_1.FieldType.Default,
                parsedStack: Enums_1.FieldType.Array
            };
            _this.typeName = DataSanitizer_1.DataSanitizer.sanitizeString(exception.name) || Util_1.Util.NotSpecified;
            _this.message = DataSanitizer_1.DataSanitizer.sanitizeMessage(exception.message) || Util_1.Util.NotSpecified;
            var stack = exception["stack"];
            _this.parsedStack = _this.parseStack(stack);
            _this.stack = DataSanitizer_1.DataSanitizer.sanitizeException(stack);
            _this.hasFullStack = Util_1.Util.isArray(_this.parsedStack) && _this.parsedStack.length > 0;
            return _this;
        }
        _ExceptionDetails.prototype.parseStack = function (stack) {
            var parsedStack = undefined;
            if (typeof stack === "string") {
                var frames = stack.split('\n');
                parsedStack = [];
                var level = 0;
                var totalSizeInBytes = 0;
                for (var i = 0; i <= frames.length; i++) {
                    var frame = frames[i];
                    if (_StackFrame.regex.test(frame)) {
                        var parsedFrame = new _StackFrame(frames[i], level++);
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
    }(ExceptionDetails_1.ExceptionDetails));
    var _StackFrame = /** @class */ (function (_super) {
        __extends(_StackFrame, _super);
        function _StackFrame(frame, level) {
            var _this = _super.call(this) || this;
            _this.sizeInBytes = 0;
            _this.aiDataContract = {
                level: Enums_1.FieldType.Required,
                method: Enums_1.FieldType.Required,
                assembly: Enums_1.FieldType.Default,
                fileName: Enums_1.FieldType.Default,
                line: Enums_1.FieldType.Default
            };
            _this.level = level;
            _this.method = "<no_method>";
            _this.assembly = Util_1.Util.trim(frame);
            var matches = frame.match(_StackFrame.regex);
            if (matches && matches.length >= 5) {
                _this.method = Util_1.Util.trim(matches[2]) || _this.method;
                _this.fileName = Util_1.Util.trim(matches[4]);
                _this.line = parseInt(matches[5]) || 0;
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
        // regex to match stack frames from ie/chrome/ff
        // methodName=$2, fileName=$4, lineNo=$5, column=$6
        _StackFrame.regex = /^([\s]+at)?(.*?)(\@|\s\(|\s)([^\(\@\n]+):([0-9]+):([0-9]+)(\)?)$/;
        _StackFrame.baseSize = 58; //'{"method":"","level":,"assembly":"","fileName":"","line":}'.length
        return _StackFrame;
    }(StackFrame_1.StackFrame));
    exports._StackFrame = _StackFrame;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=Exception.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-common/bundle/Telemetry/Metric.js":
/*!****************************************************************************!*\
  !*** ./node_modules/applicationinsights-common/bundle/Telemetry/Metric.js ***!
  \****************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ../Interfaces/Contracts/Generated/MetricData */ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/MetricData.js"), __webpack_require__(/*! ./Common/DataSanitizer */ "./node_modules/applicationinsights-common/bundle/Telemetry/Common/DataSanitizer.js"), __webpack_require__(/*! ../Enums */ "./node_modules/applicationinsights-common/bundle/Enums.js"), __webpack_require__(/*! ./Common/DataPoint */ "./node_modules/applicationinsights-common/bundle/Telemetry/Common/DataPoint.js"), __webpack_require__(/*! ../Util */ "./node_modules/applicationinsights-common/bundle/Util.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, MetricData_1, DataSanitizer_1, Enums_1, DataPoint_1, Util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Metric = /** @class */ (function (_super) {
        __extends(Metric, _super);
        /**
         * Constructs a new instance of the MetricTelemetry object
         */
        function Metric(name, value, count, min, max, properties) {
            var _this = _super.call(this) || this;
            _this.aiDataContract = {
                ver: Enums_1.FieldType.Required,
                metrics: Enums_1.FieldType.Required,
                properties: Enums_1.FieldType.Default
            };
            var dataPoint = new DataPoint_1.DataPoint();
            dataPoint.count = count > 0 ? count : undefined;
            dataPoint.max = isNaN(max) || max === null ? undefined : max;
            dataPoint.min = isNaN(min) || min === null ? undefined : min;
            dataPoint.name = DataSanitizer_1.DataSanitizer.sanitizeString(name) || Util_1.Util.NotSpecified;
            dataPoint.value = value;
            _this.metrics = [dataPoint];
            _this.properties = DataSanitizer_1.DataSanitizer.sanitizeProperties(properties);
            return _this;
        }
        Metric.envelopeType = "Microsoft.ApplicationInsights.{0}.Metric";
        Metric.dataType = "MetricData";
        return Metric;
    }(MetricData_1.MetricData));
    exports.Metric = Metric;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=Metric.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-common/bundle/Telemetry/PageView.js":
/*!******************************************************************************!*\
  !*** ./node_modules/applicationinsights-common/bundle/Telemetry/PageView.js ***!
  \******************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ../Interfaces/Contracts/Generated/PageViewData */ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/PageViewData.js"), __webpack_require__(/*! ./Common/DataSanitizer */ "./node_modules/applicationinsights-common/bundle/Telemetry/Common/DataSanitizer.js"), __webpack_require__(/*! ../Enums */ "./node_modules/applicationinsights-common/bundle/Enums.js"), __webpack_require__(/*! ../Util */ "./node_modules/applicationinsights-common/bundle/Util.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, PageViewData_1, DataSanitizer_1, Enums_1, Util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var PageView = /** @class */ (function (_super) {
        __extends(PageView, _super);
        /**
         * Constructs a new instance of the PageEventTelemetry object
         */
        function PageView(name, url, durationMs, properties, measurements, id) {
            var _this = _super.call(this) || this;
            _this.aiDataContract = {
                ver: Enums_1.FieldType.Required,
                name: Enums_1.FieldType.Default,
                url: Enums_1.FieldType.Default,
                duration: Enums_1.FieldType.Default,
                properties: Enums_1.FieldType.Default,
                measurements: Enums_1.FieldType.Default,
                id: Enums_1.FieldType.Default,
            };
            _this.id = DataSanitizer_1.DataSanitizer.sanitizeId(id);
            _this.url = DataSanitizer_1.DataSanitizer.sanitizeUrl(url);
            _this.name = DataSanitizer_1.DataSanitizer.sanitizeString(name) || Util_1.Util.NotSpecified;
            if (!isNaN(durationMs)) {
                _this.duration = Util_1.Util.msToTimeSpan(durationMs);
            }
            _this.properties = DataSanitizer_1.DataSanitizer.sanitizeProperties(properties);
            _this.measurements = DataSanitizer_1.DataSanitizer.sanitizeMeasurements(measurements);
            return _this;
        }
        PageView.envelopeType = "Microsoft.ApplicationInsights.{0}.Pageview";
        PageView.dataType = "PageviewData";
        return PageView;
    }(PageViewData_1.PageViewData));
    exports.PageView = PageView;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=PageView.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-common/bundle/Telemetry/PageViewPerformance.js":
/*!*****************************************************************************************!*\
  !*** ./node_modules/applicationinsights-common/bundle/Telemetry/PageViewPerformance.js ***!
  \*****************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ../Interfaces/Contracts/Generated/PageViewPerfData */ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/PageViewPerfData.js"), __webpack_require__(/*! ../Enums */ "./node_modules/applicationinsights-common/bundle/Enums.js"), __webpack_require__(/*! ./Common/DataSanitizer */ "./node_modules/applicationinsights-common/bundle/Telemetry/Common/DataSanitizer.js"), __webpack_require__(/*! ../Util */ "./node_modules/applicationinsights-common/bundle/Util.js"), __webpack_require__(/*! ../Logging */ "./node_modules/applicationinsights-common/bundle/Logging.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, PageViewPerfData_1, Enums_1, DataSanitizer_1, Util_1, Logging_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var PageViewPerformance = /** @class */ (function (_super) {
        __extends(PageViewPerformance, _super);
        /**
         * Constructs a new instance of the PageEventTelemetry object
         */
        function PageViewPerformance(name, url, unused, properties, measurements) {
            var _this = _super.call(this) || this;
            _this.aiDataContract = {
                ver: Enums_1.FieldType.Required,
                name: Enums_1.FieldType.Default,
                url: Enums_1.FieldType.Default,
                duration: Enums_1.FieldType.Default,
                perfTotal: Enums_1.FieldType.Default,
                networkConnect: Enums_1.FieldType.Default,
                sentRequest: Enums_1.FieldType.Default,
                receivedResponse: Enums_1.FieldType.Default,
                domProcessing: Enums_1.FieldType.Default,
                properties: Enums_1.FieldType.Default,
                measurements: Enums_1.FieldType.Default
            };
            _this.isValid = false;
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
            var timing = PageViewPerformance.getPerformanceTiming();
            if (timing) {
                var total = PageViewPerformance.getDuration(timing.navigationStart, timing.loadEventEnd);
                var network = PageViewPerformance.getDuration(timing.navigationStart, timing.connectEnd);
                var request = PageViewPerformance.getDuration(timing.requestStart, timing.responseStart);
                var response = PageViewPerformance.getDuration(timing.responseStart, timing.responseEnd);
                var dom = PageViewPerformance.getDuration(timing.responseEnd, timing.loadEventEnd);
                if (total == 0) {
                    Logging_1._InternalLogging.throwInternal(Enums_1.LoggingSeverity.WARNING, Enums_1._InternalMessageId.ErrorPVCalc, "error calculating page view performance.", { total: total, network: network, request: request, response: response, dom: dom });
                }
                else if (!PageViewPerformance.shouldCollectDuration(total, network, request, response, dom)) {
                    Logging_1._InternalLogging.throwInternal(Enums_1.LoggingSeverity.WARNING, Enums_1._InternalMessageId.InvalidDurationValue, "Invalid page load duration value. Browser perf data won't be sent.", { total: total, network: network, request: request, response: response, dom: dom });
                }
                else if (total < Math.floor(network) + Math.floor(request) + Math.floor(response) + Math.floor(dom)) {
                    // some browsers may report individual components incorrectly so that the sum of the parts will be bigger than total PLT
                    // in this case, don't report client performance from this page
                    Logging_1._InternalLogging.throwInternal(Enums_1.LoggingSeverity.WARNING, Enums_1._InternalMessageId.ClientPerformanceMathError, "client performance math error.", { total: total, network: network, request: request, response: response, dom: dom });
                }
                else {
                    _this.durationMs = total;
                    // convert to timespans
                    _this.perfTotal = _this.duration = Util_1.Util.msToTimeSpan(total);
                    _this.networkConnect = Util_1.Util.msToTimeSpan(network);
                    _this.sentRequest = Util_1.Util.msToTimeSpan(request);
                    _this.receivedResponse = Util_1.Util.msToTimeSpan(response);
                    _this.domProcessing = Util_1.Util.msToTimeSpan(dom);
                    _this.isValid = true;
                }
            }
            _this.url = DataSanitizer_1.DataSanitizer.sanitizeUrl(url);
            _this.name = DataSanitizer_1.DataSanitizer.sanitizeString(name) || Util_1.Util.NotSpecified;
            _this.properties = DataSanitizer_1.DataSanitizer.sanitizeProperties(properties);
            _this.measurements = DataSanitizer_1.DataSanitizer.sanitizeMeasurements(measurements);
            return _this;
        }
        /**
         * Indicates whether this instance of PageViewPerformance is valid and should be sent
         */
        PageViewPerformance.prototype.getIsValid = function () {
            return this.isValid;
        };
        /**
        * Gets the total duration (PLT) in milliseconds. Check getIsValid() before using this method.
        */
        PageViewPerformance.prototype.getDurationMs = function () {
            return this.durationMs;
        };
        PageViewPerformance.getPerformanceTiming = function () {
            if (PageViewPerformance.isPerformanceTimingSupported()) {
                return window.performance.timing;
            }
            return null;
        };
        /**
        * Returns true is window performance timing API is supported, false otherwise.
        */
        PageViewPerformance.isPerformanceTimingSupported = function () {
            // To do: add functionality when adding api support for trackpageview
            //return typeof window != "undefined" && window.performance && window.performance.timing;
            return false;
        };
        /**
         * As page loads different parts of performance timing numbers get set. When all of them are set we can report it.
         * Returns true if ready, false otherwise.
         */
        PageViewPerformance.isPerformanceTimingDataReady = function () {
            var timing = window.performance.timing;
            return timing.domainLookupStart > 0
                && timing.navigationStart > 0
                && timing.responseStart > 0
                && timing.requestStart > 0
                && timing.loadEventEnd > 0
                && timing.responseEnd > 0
                && timing.connectEnd > 0
                && timing.domLoading > 0;
        };
        PageViewPerformance.getDuration = function (start, end) {
            var duration = undefined;
            if (!(isNaN(start) || isNaN(end))) {
                duration = Math.max(end - start, 0);
            }
            return duration;
        };
        /**
         * This method tells if given durations should be excluded from collection.
         */
        PageViewPerformance.shouldCollectDuration = function () {
            var durations = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                durations[_i] = arguments[_i];
            }
            // a full list of Google crawlers user agent strings - https://support.google.com/webmasters/answer/1061943?hl=en
            var botAgentNames = ['googlebot', 'adsbot-google', 'apis-google', 'mediapartners-google'];
            var userAgent = navigator.userAgent;
            var isGoogleBot = false;
            if (userAgent) {
                for (var i_1 = 0; i_1 < botAgentNames.length; i_1++) {
                    isGoogleBot = isGoogleBot || userAgent.toLowerCase().indexOf(botAgentNames[i_1]) !== -1;
                }
            }
            if (isGoogleBot) {
                // Don't report durations for GoogleBot, it is returning invalid values in performance.timing API. 
                return false;
            }
            else {
                // for other page views, don't report if it's outside of a reasonable range
                for (var i = 0; i < durations.length; i++) {
                    if (durations[i] >= PageViewPerformance.MAX_DURATION_ALLOWED) {
                        return false;
                    }
                }
            }
            return true;
        };
        PageViewPerformance.envelopeType = "Microsoft.ApplicationInsights.{0}.PageviewPerformance";
        PageViewPerformance.dataType = "PageviewPerformanceData";
        PageViewPerformance.MAX_DURATION_ALLOWED = 3600000; // 1h
        return PageViewPerformance;
    }(PageViewPerfData_1.PageViewPerfData));
    exports.PageViewPerformance = PageViewPerformance;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=PageViewPerformance.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-common/bundle/Telemetry/RemoteDependencyData.js":
/*!******************************************************************************************!*\
  !*** ./node_modules/applicationinsights-common/bundle/Telemetry/RemoteDependencyData.js ***!
  \******************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ./Common/DataSanitizer */ "./node_modules/applicationinsights-common/bundle/Telemetry/Common/DataSanitizer.js"), __webpack_require__(/*! ../Enums */ "./node_modules/applicationinsights-common/bundle/Enums.js"), __webpack_require__(/*! ../Util */ "./node_modules/applicationinsights-common/bundle/Util.js"), __webpack_require__(/*! ../Util */ "./node_modules/applicationinsights-common/bundle/Util.js"), __webpack_require__(/*! ../Interfaces/Contracts/Generated/RemoteDependencyData */ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/RemoteDependencyData.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, DataSanitizer_1, Enums_1, Util_1, Util_2, RemoteDependencyData_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var RemoteDependencyData = /** @class */ (function (_super) {
        __extends(RemoteDependencyData, _super);
        /**
         * Constructs a new instance of the RemoteDependencyData object
         */
        function RemoteDependencyData(id, absoluteUrl, commandName, value, success, resultCode, method, properties, measurements) {
            var _this = _super.call(this) || this;
            _this.aiDataContract = {
                id: Enums_1.FieldType.Required,
                ver: Enums_1.FieldType.Required,
                name: Enums_1.FieldType.Default,
                resultCode: Enums_1.FieldType.Default,
                duration: Enums_1.FieldType.Default,
                success: Enums_1.FieldType.Default,
                data: Enums_1.FieldType.Default,
                target: Enums_1.FieldType.Default,
                type: Enums_1.FieldType.Default,
                properties: Enums_1.FieldType.Default,
                measurements: Enums_1.FieldType.Default,
                kind: Enums_1.FieldType.Default,
                value: Enums_1.FieldType.Default,
                count: Enums_1.FieldType.Default,
                min: Enums_1.FieldType.Default,
                max: Enums_1.FieldType.Default,
                stdDev: Enums_1.FieldType.Default,
                dependencyKind: Enums_1.FieldType.Default,
                dependencySource: Enums_1.FieldType.Default,
                commandName: Enums_1.FieldType.Default,
                dependencyTypeName: Enums_1.FieldType.Default,
            };
            _this.id = id;
            _this.duration = Util_1.Util.msToTimeSpan(value);
            _this.success = success;
            _this.resultCode = resultCode + "";
            _this.type = "Ajax";
            _this.data = DataSanitizer_1.DataSanitizer.sanitizeUrl(commandName);
            var dependencyFields = Util_2.AjaxHelper.ParseDependencyPath(absoluteUrl, method, commandName);
            _this.target = dependencyFields.target;
            _this.name = dependencyFields.name;
            _this.properties = DataSanitizer_1.DataSanitizer.sanitizeProperties(properties);
            _this.measurements = DataSanitizer_1.DataSanitizer.sanitizeMeasurements(measurements);
            return _this;
        }
        RemoteDependencyData.envelopeType = "Microsoft.ApplicationInsights.{0}.RemoteDependency";
        RemoteDependencyData.dataType = "RemoteDependencyData";
        return RemoteDependencyData;
    }(RemoteDependencyData_1.RemoteDependencyData));
    exports.RemoteDependencyData = RemoteDependencyData;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=RemoteDependencyData.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-common/bundle/Telemetry/Trace.js":
/*!***************************************************************************!*\
  !*** ./node_modules/applicationinsights-common/bundle/Telemetry/Trace.js ***!
  \***************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ../Interfaces/Contracts/Generated/MessageData */ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/MessageData.js"), __webpack_require__(/*! ./Common/DataSanitizer */ "./node_modules/applicationinsights-common/bundle/Telemetry/Common/DataSanitizer.js"), __webpack_require__(/*! ../Enums */ "./node_modules/applicationinsights-common/bundle/Enums.js"), __webpack_require__(/*! ../Util */ "./node_modules/applicationinsights-common/bundle/Util.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, MessageData_1, DataSanitizer_1, Enums_1, Util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Trace = /** @class */ (function (_super) {
        __extends(Trace, _super);
        /**
         * Constructs a new instance of the TraceTelemetry object
         */
        function Trace(message, properties, severityLevel) {
            var _this = _super.call(this) || this;
            _this.aiDataContract = {
                ver: Enums_1.FieldType.Required,
                message: Enums_1.FieldType.Required,
                severityLevel: Enums_1.FieldType.Default,
                properties: Enums_1.FieldType.Default
            };
            message = message || Util_1.Util.NotSpecified;
            _this.message = DataSanitizer_1.DataSanitizer.sanitizeMessage(message);
            _this.properties = DataSanitizer_1.DataSanitizer.sanitizeProperties(properties);
            if (severityLevel) {
                _this.severityLevel = severityLevel;
            }
            return _this;
        }
        Trace.envelopeType = "Microsoft.ApplicationInsights.{0}.Message";
        Trace.dataType = "MessageData";
        return Trace;
    }(MessageData_1.MessageData));
    exports.Trace = Trace;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=Trace.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-common/bundle/Util.js":
/*!****************************************************************!*\
  !*** ./node_modules/applicationinsights-common/bundle/Util.js ***!
  \****************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ./Enums */ "./node_modules/applicationinsights-common/bundle/Enums.js"), __webpack_require__(/*! ./Logging */ "./node_modules/applicationinsights-common/bundle/Logging.js"), __webpack_require__(/*! ./RequestResponseHeaders */ "./node_modules/applicationinsights-common/bundle/RequestResponseHeaders.js"), __webpack_require__(/*! ./Telemetry/Common/DataSanitizer */ "./node_modules/applicationinsights-common/bundle/Telemetry/Common/DataSanitizer.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, Enums_1, Logging_1, RequestResponseHeaders_1, DataSanitizer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Util = /** @class */ (function () {
        function Util() {
        }
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
                return Util._getVerifiedStorageObject(Enums_1.StorageType.LocalStorage);
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
                uid = new Date;
                storage = storageType === Enums_1.StorageType.LocalStorage ? window.localStorage : window.sessionStorage;
                storage.setItem(uid, uid);
                fail = storage.getItem(uid) != uid;
                storage.removeItem(uid);
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
                Util._canUseLocalStorage = !!Util._getVerifiedStorageObject(Enums_1.StorageType.LocalStorage);
            }
            return Util._canUseLocalStorage;
        };
        /**
         *  Get an object from the browser's local storage
         *
         *  @param {string} name - the name of the object to get from storage
         *  @returns {string} The contents of the storage object with the given name. Null if storage is not supported.
         */
        Util.getStorage = function (name) {
            var storage = Util._getLocalStorageObject();
            if (storage !== null) {
                try {
                    return storage.getItem(name);
                }
                catch (e) {
                    Util._canUseLocalStorage = false;
                    Logging_1._InternalLogging.throwInternal(Enums_1.LoggingSeverity.WARNING, Enums_1._InternalMessageId.BrowserCannotReadLocalStorage, "Browser failed read of local storage. " + Util.getExceptionName(e), { exception: Util.dump(e) });
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
        Util.setStorage = function (name, data) {
            var storage = Util._getLocalStorageObject();
            if (storage !== null) {
                try {
                    storage.setItem(name, data);
                    return true;
                }
                catch (e) {
                    Util._canUseLocalStorage = false;
                    Logging_1._InternalLogging.throwInternal(Enums_1.LoggingSeverity.WARNING, Enums_1._InternalMessageId.BrowserCannotWriteLocalStorage, "Browser failed write to local storage. " + Util.getExceptionName(e), { exception: Util.dump(e) });
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
        Util.removeStorage = function (name) {
            var storage = Util._getLocalStorageObject();
            if (storage !== null) {
                try {
                    storage.removeItem(name);
                    return true;
                }
                catch (e) {
                    Util._canUseLocalStorage = false;
                    Logging_1._InternalLogging.throwInternal(Enums_1.LoggingSeverity.WARNING, Enums_1._InternalMessageId.BrowserFailedRemovalFromLocalStorage, "Browser failed removal of local storage item. " + Util.getExceptionName(e), { exception: Util.dump(e) });
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
                return Util._getVerifiedStorageObject(Enums_1.StorageType.SessionStorage);
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
                Util._canUseSessionStorage = !!Util._getVerifiedStorageObject(Enums_1.StorageType.SessionStorage);
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
        Util.getSessionStorage = function (name) {
            var storage = Util._getSessionStorageObject();
            if (storage !== null) {
                try {
                    return storage.getItem(name);
                }
                catch (e) {
                    Util._canUseSessionStorage = false;
                    Logging_1._InternalLogging.throwInternal(Enums_1.LoggingSeverity.WARNING, Enums_1._InternalMessageId.BrowserCannotReadSessionStorage, "Browser failed read of session storage. " + Util.getExceptionName(e), { exception: Util.dump(e) });
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
        Util.setSessionStorage = function (name, data) {
            var storage = Util._getSessionStorageObject();
            if (storage !== null) {
                try {
                    storage.setItem(name, data);
                    return true;
                }
                catch (e) {
                    Util._canUseSessionStorage = false;
                    Logging_1._InternalLogging.throwInternal(Enums_1.LoggingSeverity.WARNING, Enums_1._InternalMessageId.BrowserCannotWriteSessionStorage, "Browser failed write to session storage. " + Util.getExceptionName(e), { exception: Util.dump(e) });
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
        Util.removeSessionStorage = function (name) {
            var storage = Util._getSessionStorageObject();
            if (storage !== null) {
                try {
                    storage.removeItem(name);
                    return true;
                }
                catch (e) {
                    Util._canUseSessionStorage = false;
                    Logging_1._InternalLogging.throwInternal(Enums_1.LoggingSeverity.WARNING, Enums_1._InternalMessageId.BrowserFailedRemovalFromSessionStorage, "Browser failed removal of session storage item. " + Util.getExceptionName(e), { exception: Util.dump(e) });
                }
            }
            return false;
        };
        /*
         * Force the SDK not to store and read any data from cookies
         */
        Util.disableCookies = function () {
            Util._canUseCookies = false;
        };
        /*
         * helper method to tell if document.cookie object is available
         */
        Util.canUseCookies = function () {
            if (Util._canUseCookies === undefined) {
                Util._canUseCookies = false;
                try {
                    Util._canUseCookies = Util.document.cookie !== undefined;
                }
                catch (e) {
                    Logging_1._InternalLogging.throwInternal(Enums_1.LoggingSeverity.WARNING, Enums_1._InternalMessageId.CannotAccessCookie, "Cannot access document.cookie - " + Util.getExceptionName(e), { exception: Util.dump(e) });
                }
                ;
            }
            return Util._canUseCookies;
        };
        /**
         * helper method to set userId and sessionId cookie
         */
        Util.setCookie = function (name, value, domain) {
            var domainAttrib = "";
            var secureAttrib = "";
            if (domain) {
                domainAttrib = ";domain=" + domain;
            }
            if (Util.document.location && Util.document.location.protocol === "https:") {
                secureAttrib = ";secure";
            }
            if (Util.canUseCookies()) {
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
        Util.getCookie = function (name) {
            if (!Util.canUseCookies()) {
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
        Util.deleteCookie = function (name) {
            if (Util.canUseCookies()) {
                // Setting the expiration date in the past immediately removes the cookie
                Util.document.cookie = name + "=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT;";
            }
        };
        /**
         * helper method to trim strings (IE8 does not implement String.prototype.trim)
         */
        Util.trim = function (str) {
            if (typeof str !== "string")
                return str;
            return str.replace(/^\s+|\s+$/g, "");
        };
        /**
         * generate random id string
         */
        Util.newId = function () {
            var base64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
            var result = "";
            var random = Math.random() * 1073741824; //5 symbols in base64, almost maxint
            while (random > 0) {
                var char = base64chars.charAt(random % 64);
                result += char;
                random = Math.floor(random / 64);
            }
            return result;
        };
        /**
         * Check if an object is of type Array
         */
        Util.isArray = function (obj) {
            return Object.prototype.toString.call(obj) === "[object Array]";
        };
        /**
         * Check if an object is of type Error
         */
        Util.isError = function (obj) {
            return Object.prototype.toString.call(obj) === "[object Error]";
        };
        /**
         * Check if an object is of type Date
         */
        Util.isDate = function (obj) {
            return Object.prototype.toString.call(obj) === "[object Date]";
        };
        /**
         * Convert a date to I.S.O. format in IE8
         */
        Util.toISOStringForIE8 = function (date) {
            if (Util.isDate(date)) {
                if (Date.prototype.toISOString) {
                    return date.toISOString();
                }
                else {
                    var pad = function (number) {
                        var r = String(number);
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
            }
        };
        /**
         * Gets IE version if we are running on IE, or null otherwise
         */
        Util.getIEVersion = function (userAgentStr) {
            if (userAgentStr === void 0) { userAgentStr = null; }
            var myNav = userAgentStr ? userAgentStr.toLowerCase() : navigator.userAgent.toLowerCase();
            return (myNav.indexOf('msie') != -1) ? parseInt(myNav.split('msie')[1]) : null;
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
            var objectTypeDump = Object.prototype.toString.call(object);
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
            var objectTypeDump = Object.prototype.toString.call(object);
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
            if (!window || typeof eventName !== 'string' || typeof callback !== 'function') {
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
        Util.document = typeof document !== "undefined" ? document : {};
        Util._canUseCookies = undefined;
        Util._canUseLocalStorage = undefined;
        Util._canUseSessionStorage = undefined;
        // listing only non-geo specific locations 
        Util._internalEndpoints = [
            "https://dc.services.visualstudio.com/v2/track",
            "https://breeze.aimon.applicationinsights.io/v2/track",
            "https://dc-int.services.visualstudio.com/v2/track"
        ];
        Util.NotSpecified = "not_specified";
        return Util;
    }());
    exports.Util = Util;
    var UrlHelper = /** @class */ (function () {
        function UrlHelper() {
        }
        UrlHelper.parseUrl = function (url) {
            if (!UrlHelper.htmlAnchorElement) {
                UrlHelper.htmlAnchorElement = !!UrlHelper.document.createElement ? UrlHelper.document.createElement('a') : {};
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
        UrlHelper.document = typeof document !== "undefined" ? document : {};
        return UrlHelper;
    }());
    exports.UrlHelper = UrlHelper;
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
            var excludedDomains = config && config.correlationHeaderExcludedDomains;
            if (!excludedDomains || excludedDomains.length == 0) {
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
                var correlationId = CorrelationIdHelper.getCorrelationContextValue(responseHeader, RequestResponseHeaders_1.RequestHeaders.requestContextTargetKey);
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
                    if (keyValue.length == 2 && keyValue[0] == key) {
                        return keyValue[1];
                    }
                }
            }
        };
        CorrelationIdHelper.correlationIdPrefix = "cid-v1:";
        return CorrelationIdHelper;
    }());
    exports.CorrelationIdHelper = CorrelationIdHelper;
    var AjaxHelper = /** @class */ (function () {
        function AjaxHelper() {
        }
        AjaxHelper.ParseDependencyPath = function (absoluteUrl, method, pathName) {
            var target, name;
            if (absoluteUrl && absoluteUrl.length > 0) {
                var parsedUrl = UrlHelper.parseUrl(absoluteUrl);
                target = parsedUrl.host;
                if (parsedUrl.pathname != null) {
                    var pathName = (parsedUrl.pathname.length === 0) ? "/" : parsedUrl.pathname;
                    if (pathName.charAt(0) !== '/') {
                        pathName = "/" + pathName;
                    }
                    name = DataSanitizer_1.DataSanitizer.sanitizeString(method ? method + " " + pathName : pathName);
                }
                else {
                    name = DataSanitizer_1.DataSanitizer.sanitizeString(absoluteUrl);
                }
            }
            else {
                target = pathName;
                name = pathName;
            }
            return {
                target: target,
                name: name
            };
        };
        return AjaxHelper;
    }());
    exports.AjaxHelper = AjaxHelper;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=Util.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-common/bundle/applicationinsights-common.js":
/*!**************************************************************************************!*\
  !*** ./node_modules/applicationinsights-common/bundle/applicationinsights-common.js ***!
  \**************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ./Util */ "./node_modules/applicationinsights-common/bundle/Util.js"), __webpack_require__(/*! ./Enums */ "./node_modules/applicationinsights-common/bundle/Enums.js"), __webpack_require__(/*! ./Logging */ "./node_modules/applicationinsights-common/bundle/Logging.js"), __webpack_require__(/*! ./RequestResponseHeaders */ "./node_modules/applicationinsights-common/bundle/RequestResponseHeaders.js"), __webpack_require__(/*! ./Constants */ "./node_modules/applicationinsights-common/bundle/Constants.js"), __webpack_require__(/*! ./Interfaces/Contracts/Generated/Data */ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/Data.js"), __webpack_require__(/*! ./Interfaces/Contracts/Generated/Base */ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/Base.js"), __webpack_require__(/*! ./Telemetry/Common/Envelope */ "./node_modules/applicationinsights-common/bundle/Telemetry/Common/Envelope.js"), __webpack_require__(/*! ./Telemetry/Event */ "./node_modules/applicationinsights-common/bundle/Telemetry/Event.js"), __webpack_require__(/*! ./Telemetry/Exception */ "./node_modules/applicationinsights-common/bundle/Telemetry/Exception.js"), __webpack_require__(/*! ./Telemetry/Metric */ "./node_modules/applicationinsights-common/bundle/Telemetry/Metric.js"), __webpack_require__(/*! ./Telemetry/PageView */ "./node_modules/applicationinsights-common/bundle/Telemetry/PageView.js"), __webpack_require__(/*! ./Interfaces/Contracts/Generated/PageViewData */ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/PageViewData.js"), __webpack_require__(/*! ./Telemetry/RemoteDependencyData */ "./node_modules/applicationinsights-common/bundle/Telemetry/RemoteDependencyData.js"), __webpack_require__(/*! ./Telemetry/Trace */ "./node_modules/applicationinsights-common/bundle/Telemetry/Trace.js"), __webpack_require__(/*! ./Telemetry/PageViewPerformance */ "./node_modules/applicationinsights-common/bundle/Telemetry/PageViewPerformance.js"), __webpack_require__(/*! ./Telemetry/Common/Data */ "./node_modules/applicationinsights-common/bundle/Telemetry/Common/Data.js"), __webpack_require__(/*! ./Interfaces/Contracts/Generated/SeverityLevel */ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/SeverityLevel.js"), __webpack_require__(/*! ./Interfaces/Contracts/Generated/ContextTagKeys */ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/ContextTagKeys.js"), __webpack_require__(/*! ./Telemetry/Common/DataSanitizer */ "./node_modules/applicationinsights-common/bundle/Telemetry/Common/DataSanitizer.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, Util_1, Enums_1, Logging_1, RequestResponseHeaders_1, Constants_1, Data_1, Base_1, Envelope_1, Event_1, Exception_1, Metric_1, PageView_1, PageViewData_1, RemoteDependencyData_1, Trace_1, PageViewPerformance_1, Data_2, SeverityLevel_1, ContextTagKeys_1, DataSanitizer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Util = Util_1.Util;
    exports.CorrelationIdHelper = Util_1.CorrelationIdHelper;
    exports.UrlHelper = Util_1.UrlHelper;
    exports._InternalMessageId = Enums_1._InternalMessageId;
    exports.LoggingSeverity = Enums_1.LoggingSeverity;
    exports.FieldType = Enums_1.FieldType;
    exports._InternalLogging = Logging_1._InternalLogging;
    exports._InternalLogMessage = Logging_1._InternalLogMessage;
    exports.RequestHeaders = RequestResponseHeaders_1.RequestHeaders;
    exports.DisabledPropertyName = Constants_1.DisabledPropertyName;
    exports.AIData = Data_1.Data;
    exports.AIBase = Base_1.Base;
    exports.Envelope = Envelope_1.Envelope;
    exports.Event = Event_1.Event;
    exports.Exception = Exception_1.Exception;
    exports.Metric = Metric_1.Metric;
    exports.PageView = PageView_1.PageView;
    exports.PageViewData = PageViewData_1.PageViewData;
    exports.RemoteDependencyData = RemoteDependencyData_1.RemoteDependencyData;
    exports.Trace = Trace_1.Trace;
    exports.PageViewPerformance = PageViewPerformance_1.PageViewPerformance;
    exports.Data = Data_2.Data;
    exports.SeverityLevel = SeverityLevel_1.SeverityLevel;
    exports.ContextTagKeys = ContextTagKeys_1.ContextTagKeys;
    exports.DataSanitizer = DataSanitizer_1.DataSanitizer;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=applicationinsights-common.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-core-js/bundle/JavaScriptSDK.Enums/EventsDiscardedReason.js":
/*!******************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-core-js/bundle/JavaScriptSDK.Enums/EventsDiscardedReason.js ***!
  \******************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * The EventsDiscardedReason enumeration contains a set of values that specify the reason for discarding an event.
     */
    exports.EventsDiscardedReason = {
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
        QueueFull: 5,
    };
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=EventsDiscardedReason.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-core-js/bundle/JavaScriptSDK.Interfaces/IChannelControls.js":
/*!******************************************************************************************************!*\
  !*** ./node_modules/applicationinsights-core-js/bundle/JavaScriptSDK.Interfaces/IChannelControls.js ***!
  \******************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MinChannelPriorty = 100;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=IChannelControls.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-core-js/bundle/JavaScriptSDK/AppInsightsCore.js":
/*!******************************************************************************************!*\
  !*** ./node_modules/applicationinsights-core-js/bundle/JavaScriptSDK/AppInsightsCore.js ***!
  \******************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ../JavaScriptSDK.Interfaces/IChannelControls */ "./node_modules/applicationinsights-core-js/bundle/JavaScriptSDK.Interfaces/IChannelControls.js"), __webpack_require__(/*! ../JavaScriptSDK.Enums/EventsDiscardedReason */ "./node_modules/applicationinsights-core-js/bundle/JavaScriptSDK.Enums/EventsDiscardedReason.js"), __webpack_require__(/*! ./CoreUtils */ "./node_modules/applicationinsights-core-js/bundle/JavaScriptSDK/CoreUtils.js"), __webpack_require__(/*! ./NotificationManager */ "./node_modules/applicationinsights-core-js/bundle/JavaScriptSDK/NotificationManager.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, IChannelControls_1, EventsDiscardedReason_1, CoreUtils_1, NotificationManager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    "use strict";
    var AppInsightsCore = /** @class */ (function () {
        function AppInsightsCore() {
            this._extensions = new Array();
        }
        AppInsightsCore.prototype.initialize = function (config, extensions) {
            var _this = this;
            if (!extensions || extensions.length === 0) {
                // throw error
                throw Error("At least one extension channel is required");
            }
            if (!config || CoreUtils_1.CoreUtils.isNullOrUndefined(config.instrumentationKey)) {
                throw Error("Please provide instrumentation key");
            }
            this.config = config;
            // add notification to the extensions in the config so other plugins can access it
            this._notificationManager = new NotificationManager_1.NotificationManager();
            this.config.extensions = this.config.extensions ? this.config.extensions : {};
            this.config.extensions.NotificationManager = this._notificationManager;
            // Initial validation
            extensions.forEach(function (extension) {
                if (CoreUtils_1.CoreUtils.isNullOrUndefined(extension.initialize)) {
                    throw Error("Extensions must provide callback to initialize");
                }
            });
            this._extensions = extensions.sort(function (a, b) {
                var extA = a;
                var extB = b;
                var typeExtA = typeof extA.processTelemetry;
                var typeExtB = typeof extB.processTelemetry;
                if (typeExtA === 'function' && typeExtB === 'function') {
                    return extA.priority > extB.priority ? 1 : -1;
                }
                if (typeExtA === 'function' && typeExtB !== 'function') {
                    // keep non telemetryplugin specific extensions at start
                    return 1;
                }
                if (typeExtA !== 'function' && typeExtB === 'function') {
                    return -1;
                }
            });
            // Set next plugin for all but last extension
            for (var idx = 0; idx < this._extensions.length - 1; idx++) {
                if (this._extensions[idx] && typeof this._extensions[idx].processTelemetry !== 'function') {
                    // these are initialized only
                    continue;
                }
                this._extensions[idx].setNextPlugin(this._extensions[idx + 1]); // set next plugin
            }
            this._extensions.forEach(function (ext) { return ext.initialize(_this.config, _this, _this._extensions); }); // initialize
        };
        AppInsightsCore.prototype.getTransmissionControl = function () {
            for (var i = 0; i < this._extensions.length; i++) {
                var priority = this._extensions[i].priority;
                if (!CoreUtils_1.CoreUtils.isNullOrUndefined(priority) && priority >= IChannelControls_1.MinChannelPriorty) {
                    var firstChannel = this._extensions[i];
                    return firstChannel; // return first channel in list
                }
            }
            throw new Error("No channel extension found");
        };
        AppInsightsCore.prototype.track = function (telemetryItem) {
            if (telemetryItem === null) {
                this._notifiyInvalidEvent(telemetryItem);
                // throw error
                throw Error("Invalid telemetry item");
            }
            if (telemetryItem.baseData && !telemetryItem.baseType) {
                this._notifiyInvalidEvent(telemetryItem);
                throw Error("Provide data.baseType for data.baseData");
            }
            // do base validation before sending it through the pipeline        
            this._validateTelmetryItem(telemetryItem);
            if (!telemetryItem.instrumentationKey) {
                // setup default ikey if not passed in
                telemetryItem.instrumentationKey = this.config.instrumentationKey;
            }
            // invoke any common telemetry processors before sending through pipeline
            var i = 0;
            while (i < this._extensions.length) {
                if (this._extensions[i].processTelemetry) {
                    this._extensions[i].processTelemetry(telemetryItem); // pass on to first extension that can support processing
                    break;
                }
                i++;
            }
        };
        /**
         * Adds a notification listener. The SDK calls methods on the listener when an appropriate notification is raised.
         * @param {INotificationListener} listener - An INotificationListener object.
         */
        AppInsightsCore.prototype.addNotificationListener = function (listener) {
            this._notificationManager.addNotificationListener(listener);
        };
        /**
         * Removes all instances of the listener.
         * @param {INotificationListener} listener - INotificationListener to remove.
         */
        AppInsightsCore.prototype.removeNotificationListener = function (listener) {
            this._notificationManager.removeNotificationListener(listener);
        };
        AppInsightsCore.prototype._validateTelmetryItem = function (telemetryItem) {
            if (CoreUtils_1.CoreUtils.isNullOrUndefined(telemetryItem.name)) {
                this._notifiyInvalidEvent(telemetryItem);
                throw Error("telemetry name required");
            }
            if (CoreUtils_1.CoreUtils.isNullOrUndefined(telemetryItem.timestamp)) {
                this._notifiyInvalidEvent(telemetryItem);
                throw Error("telemetry timestamp required");
            }
            if (CoreUtils_1.CoreUtils.isNullOrUndefined(telemetryItem.instrumentationKey)) {
                this._notifiyInvalidEvent(telemetryItem);
                throw Error("telemetry instrumentationKey required");
            }
        };
        AppInsightsCore.prototype._notifiyInvalidEvent = function (telemetryItem) {
            this._notificationManager.eventsDiscarded([telemetryItem], EventsDiscardedReason_1.EventsDiscardedReason.InvalidEvent);
        };
        return AppInsightsCore;
    }());
    exports.AppInsightsCore = AppInsightsCore;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=AppInsightsCore.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-core-js/bundle/JavaScriptSDK/CoreUtils.js":
/*!************************************************************************************!*\
  !*** ./node_modules/applicationinsights-core-js/bundle/JavaScriptSDK/CoreUtils.js ***!
  \************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var CoreUtils = /** @class */ (function () {
        function CoreUtils() {
        }
        CoreUtils.isNullOrUndefined = function (input) {
            return input === null || input === undefined;
        };
        return CoreUtils;
    }());
    exports.CoreUtils = CoreUtils;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=CoreUtils.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-core-js/bundle/JavaScriptSDK/NotificationManager.js":
/*!**********************************************************************************************!*\
  !*** ./node_modules/applicationinsights-core-js/bundle/JavaScriptSDK/NotificationManager.js ***!
  \**********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
            var index = this.listeners.indexOf(listener);
            while (index > -1) {
                this.listeners.splice(index, 1);
                index = this.listeners.indexOf(listener);
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
    exports.NotificationManager = NotificationManager;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=NotificationManager.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-core-js/bundle/applicationinsights-core-js.js":
/*!****************************************************************************************!*\
  !*** ./node_modules/applicationinsights-core-js/bundle/applicationinsights-core-js.js ***!
  \****************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ./JavaScriptSDK.Interfaces/IChannelControls */ "./node_modules/applicationinsights-core-js/bundle/JavaScriptSDK.Interfaces/IChannelControls.js"), __webpack_require__(/*! ./JavaScriptSDK.Enums/EventsDiscardedReason */ "./node_modules/applicationinsights-core-js/bundle/JavaScriptSDK.Enums/EventsDiscardedReason.js"), __webpack_require__(/*! ./JavaScriptSDK/AppInsightsCore */ "./node_modules/applicationinsights-core-js/bundle/JavaScriptSDK/AppInsightsCore.js"), __webpack_require__(/*! ./JavaScriptSDK/CoreUtils */ "./node_modules/applicationinsights-core-js/bundle/JavaScriptSDK/CoreUtils.js"), __webpack_require__(/*! ./JavaScriptSDK/NotificationManager */ "./node_modules/applicationinsights-core-js/bundle/JavaScriptSDK/NotificationManager.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, IChannelControls_1, EventsDiscardedReason_1, AppInsightsCore_1, CoreUtils_1, NotificationManager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MinChannelPriorty = IChannelControls_1.MinChannelPriorty;
    exports.EventsDiscardedReason = EventsDiscardedReason_1.EventsDiscardedReason;
    exports.AppInsightsCore = AppInsightsCore_1.AppInsightsCore;
    exports.CoreUtils = CoreUtils_1.CoreUtils;
    exports.NotificationManager = NotificationManager_1.NotificationManager;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=applicationinsights-core-js.js.map

/***/ }),

/***/ 0:
/*!**********************************!*\
  !*** multi ./amd/bundle/Init.js ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! ./amd/bundle/Init.js */"./amd/bundle/Init.js");


/***/ })

/******/ });
});
//# sourceMappingURL=aisdk.0.0.9.js.map