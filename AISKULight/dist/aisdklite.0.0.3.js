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

/***/ "./bundle sync recursive":
/*!*********************!*\
  !*** ./bundle sync ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports) {

function webpackEmptyContext(req) {
	var e = new Error("Cannot find module '" + req + "'");
	e.code = 'MODULE_NOT_FOUND';
	throw e;
}
webpackEmptyContext.keys = function() { return []; };
webpackEmptyContext.resolve = webpackEmptyContext;
module.exports = webpackEmptyContext;
webpackEmptyContext.id = "./bundle sync recursive";

/***/ }),

/***/ "./bundle/index.js":
/*!*************************!*\
  !*** ./bundle/index.js ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(__webpack_require__("./bundle sync recursive"), exports);
        if (v !== undefined) module.exports = v;
    }
    else if (true) {
        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! applicationinsights-core-js */ "./node_modules/applicationinsights-core-js/bundle/applicationinsights-core-js.js"), __webpack_require__(/*! applicationinsights-channel-js */ "./node_modules/applicationinsights-channel-js/bundle/applicationinsights-channel-js.js")], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
				__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
				(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var applicationinsights_core_js_1 = require("applicationinsights-core-js");
    var applicationinsights_channel_js_1 = require("applicationinsights-channel-js");
    "use strict";
    var ApplicationInsights = /** @class */ (function () {
        function ApplicationInsights(config) {
            // initialize the queue and config in case they are undefined
            if (applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(config) || applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(config.instrumentationKey)) {
                throw new Error("Invalid input configuration");
            }
            this.initialize();
        }
        ApplicationInsights.prototype.initialize = function () {
            this.core = new applicationinsights_core_js_1.AppInsightsCore();
            var extensions = [];
            var appInsightsChannel = new applicationinsights_channel_js_1.Sender();
            extensions.push(appInsightsChannel);
            // initialize core
            this.core.initialize(this.config, extensions);
            // initialize extensions
            appInsightsChannel.initialize(this.config, this.core, extensions);
        };
        ApplicationInsights.prototype.track = function (item) {
            this.core.track(item);
        };
        return ApplicationInsights;
    }());
    exports.ApplicationInsights = ApplicationInsights;
});


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
        // TODO: Do we want this to take logger as arg or use this._logger as nonstatic?
        EnvelopeCreator.createEnvelope = function (logger, envelopeType, telemetryItem, data) {
            var envelope = new applicationinsights_common_1.Envelope(logger, data, envelopeType);
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
        DependencyEnvelopeCreator.prototype.Create = function (logger, telemetryItem) {
            this._logger = logger;
            if (applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(telemetryItem.baseData)) {
                this._logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.CRITICAL, applicationinsights_core_js_1._InternalMessageId.TelemetryEnvelopeInvalid, "telemetryItem.baseData cannot be null.");
            }
            var customMeasurements = {};
            var customProperties = {};
            EnvelopeCreator.extractPropsAndMeasurements(telemetryItem.data, customProperties, customMeasurements);
            var bd = telemetryItem.baseData;
            if (applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(bd)) {
                logger.warnToConsole("Invalid input for dependency data");
                return null;
            }
            var id = bd.id;
            var absoluteUrl = bd.absoluteUrl;
            var command = bd.commandName;
            var duration = bd.duration;
            var success = bd.success;
            var resultCode = bd.resultCode;
            var method = bd.method;
            var baseData = new applicationinsights_common_1.RemoteDependencyData(logger, id, absoluteUrl, command, duration, success, resultCode, method, customProperties, customMeasurements);
            var data = new applicationinsights_common_1.Data(applicationinsights_common_1.RemoteDependencyData.dataType, baseData);
            return EnvelopeCreator.createEnvelope(logger, applicationinsights_common_1.RemoteDependencyData.envelopeType, telemetryItem, data);
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
        EventEnvelopeCreator.prototype.Create = function (logger, telemetryItem) {
            this._logger = logger;
            if (applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(telemetryItem.baseData)) {
                this._logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.CRITICAL, applicationinsights_core_js_1._InternalMessageId.TelemetryEnvelopeInvalid, "telemetryItem.baseData cannot be null.");
            }
            var customProperties = {};
            var customMeasurements = {};
            if (telemetryItem.baseType !== applicationinsights_common_1.Event.dataType) {
                EnvelopeCreator.extractPropsAndMeasurements(telemetryItem.baseData, customProperties, customMeasurements);
            }
            EnvelopeCreator.extractPropsAndMeasurements(telemetryItem.data, customProperties, customMeasurements);
            var eventName = telemetryItem.baseData.name;
            var baseData = new applicationinsights_common_1.Event(logger, eventName, customProperties, customMeasurements);
            var data = new applicationinsights_common_1.Data(applicationinsights_common_1.Event.dataType, baseData);
            return EnvelopeCreator.createEnvelope(logger, applicationinsights_common_1.Event.envelopeType, telemetryItem, data);
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
        ExceptionEnvelopeCreator.prototype.Create = function (logger, telemetryItem) {
            this._logger = logger;
            if (applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(telemetryItem.baseData)) {
                this._logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.CRITICAL, applicationinsights_core_js_1._InternalMessageId.TelemetryEnvelopeInvalid, "telemetryItem.baseData cannot be null.");
            }
            var customProperties = {};
            var customMeasurements = {};
            EnvelopeCreator.extractPropsAndMeasurements(telemetryItem.data, customProperties, customMeasurements);
            var exception = telemetryItem.baseData.error;
            var severityLevel = telemetryItem.baseData.severityLevel;
            var baseData = new applicationinsights_common_1.Exception(logger, exception, customProperties, customMeasurements, severityLevel);
            var data = new applicationinsights_common_1.Data(applicationinsights_common_1.Exception.dataType, baseData);
            return EnvelopeCreator.createEnvelope(logger, applicationinsights_common_1.Exception.envelopeType, telemetryItem, data);
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
        MetricEnvelopeCreator.prototype.Create = function (logger, telemetryItem) {
            this._logger = logger;
            if (applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(telemetryItem.baseData)) {
                this._logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.CRITICAL, applicationinsights_core_js_1._InternalMessageId.TelemetryEnvelopeInvalid, "telemetryItem.baseData cannot be null.");
            }
            var customProperties = EnvelopeCreator.extractProperties(telemetryItem.data);
            var name = telemetryItem.baseData.name;
            var average = telemetryItem.baseData.average;
            var sampleCount = telemetryItem.baseData.sampleCount;
            var min = telemetryItem.baseData.min;
            var max = telemetryItem.baseData.max;
            var baseData = new applicationinsights_common_1.Metric(logger, name, average, sampleCount, min, max, customProperties);
            var data = new applicationinsights_common_1.Data(applicationinsights_common_1.Metric.dataType, baseData);
            return EnvelopeCreator.createEnvelope(logger, applicationinsights_common_1.Metric.envelopeType, telemetryItem, data);
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
        PageViewEnvelopeCreator.prototype.Create = function (logger, telemetryItem) {
            this._logger = logger;
            if (applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(telemetryItem.baseData)) {
                this._logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.CRITICAL, applicationinsights_core_js_1._InternalMessageId.TelemetryEnvelopeInvalid, "telemetryItem.baseData cannot be null.");
            }
            // Since duration is not part of the domain properties in Common Schema, extract it from part C 
            var duration = undefined;
            if (!applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(telemetryItem.data) &&
                !applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(telemetryItem.data.duration)) {
                duration = telemetryItem.data.duration;
                delete telemetryItem.data.duration;
            }
            var customProperties = {};
            var customMeasurements = {};
            EnvelopeCreator.extractPropsAndMeasurements(telemetryItem.data, customProperties, customMeasurements);
            var name = telemetryItem.baseData.name;
            var url = telemetryItem.baseData.uri;
            // Todo: move IPageViewTelemetry to common as we are missing type checks on baseData here
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
            var baseData = new applicationinsights_common_1.PageView(logger, name, url, duration, customProperties, customMeasurements);
            var data = new applicationinsights_common_1.Data(applicationinsights_common_1.PageView.dataType, baseData);
            return EnvelopeCreator.createEnvelope(logger, applicationinsights_common_1.PageView.envelopeType, telemetryItem, data);
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
        PageViewPerformanceEnvelopeCreator.prototype.Create = function (logger, telemetryItem) {
            this._logger = logger;
            if (applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(telemetryItem.baseData)) {
                this._logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.CRITICAL, applicationinsights_core_js_1._InternalMessageId.TelemetryEnvelopeInvalid, "telemetryItem.baseData cannot be null.");
            }
            var customProperties = {};
            var customMeasurements = {};
            EnvelopeCreator.extractPropsAndMeasurements(telemetryItem.data, customProperties, customMeasurements);
            var name = telemetryItem.baseData.name;
            var url = telemetryItem.baseData.uri;
            var duration = telemetryItem.baseData.duration;
            var baseData = new applicationinsights_common_1.PageViewPerformance(logger, name, url, duration, customProperties, customMeasurements);
            var data = new applicationinsights_common_1.Data(applicationinsights_common_1.PageViewPerformance.dataType, baseData);
            return EnvelopeCreator.createEnvelope(logger, applicationinsights_common_1.PageViewPerformance.envelopeType, telemetryItem, data);
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
        TraceEnvelopeCreator.prototype.Create = function (logger, telemetryItem) {
            this._logger = logger;
            if (applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(telemetryItem.baseData)) {
                this._logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.CRITICAL, applicationinsights_core_js_1._InternalMessageId.TelemetryEnvelopeInvalid, "telemetryItem.baseData cannot be null.");
            }
            var message = telemetryItem.baseData.message;
            var severityLevel = telemetryItem.baseData.severityLevel;
            var customProperties = EnvelopeCreator.extractProperties(telemetryItem.data);
            var baseData = new applicationinsights_common_1.Trace(logger, message, customProperties, severityLevel);
            var data = new applicationinsights_common_1.Data(applicationinsights_common_1.Trace.dataType, baseData);
            return EnvelopeCreator.createEnvelope(logger, applicationinsights_common_1.Trace.envelopeType, telemetryItem, data);
        };
        TraceEnvelopeCreator.TraceEnvelopeCreator = new TraceEnvelopeCreator();
        return TraceEnvelopeCreator;
    }(EnvelopeCreator));
    exports.TraceEnvelopeCreator = TraceEnvelopeCreator;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=EnvelopeCreator.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-channel-js/bundle/Offline.js":
/*!***********************************************************************!*\
  !*** ./node_modules/applicationinsights-channel-js/bundle/Offline.js ***!
  \***********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * @description Monitors browser for offline events
     * @export default - Offline: Static instance of OfflineListener
     * @class OfflineListener
     */
    var OfflineListener = /** @class */ (function () {
        function OfflineListener() {
            this._onlineStatus = true;
            if (window && window.addEventListener) {
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
        OfflineListener.prototype._setOnline = function () {
            this._onlineStatus = true;
        };
        OfflineListener.prototype._setOffline = function () {
            this._onlineStatus = false;
        };
        OfflineListener.prototype.isOnline = function () {
            if (this.isListening) {
                return this._onlineStatus;
            }
            else if (navigator) {
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
        OfflineListener.Offline = new OfflineListener;
        return OfflineListener;
    }());
    exports.OfflineListener = OfflineListener;
    exports.Offline = OfflineListener.Offline;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=Offline.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-channel-js/bundle/SendBuffer.js":
/*!**************************************************************************!*\
  !*** ./node_modules/applicationinsights-channel-js/bundle/SendBuffer.js ***!
  \**************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! applicationinsights-common */ "./node_modules/applicationinsights-common/bundle/applicationinsights-common.js"), __webpack_require__(/*! applicationinsights-core-js */ "./node_modules/applicationinsights-core-js/bundle/applicationinsights-core-js.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, applicationinsights_common_1, applicationinsights_core_js_1) {
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
                    this._logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.WARNING, applicationinsights_core_js_1._InternalMessageId.SessionStorageBufferFull, "Maximum buffer size reached: " + this._buffer.length, true);
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
                    this._logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.CRITICAL, applicationinsights_core_js_1._InternalMessageId.SessionStorageBufferFull, "Sent buffer reached its maximum size: " + sentElements.length, true);
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
                var bufferJson = applicationinsights_common_1.Util.getSessionStorage(this._logger, key);
                if (bufferJson) {
                    var buffer = JSON.parse(bufferJson);
                    if (buffer) {
                        return buffer;
                    }
                }
            }
            catch (e) {
                this._logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.CRITICAL, applicationinsights_core_js_1._InternalMessageId.FailedToRestoreStorageBuffer, " storage key: " + key + ", " + applicationinsights_common_1.Util.getExceptionName(e), { exception: applicationinsights_common_1.Util.dump(e) });
            }
            return [];
        };
        SessionStorageSendBuffer.prototype.setBuffer = function (key, buffer) {
            try {
                var bufferJson = JSON.stringify(buffer);
                applicationinsights_common_1.Util.setSessionStorage(this._logger, key, bufferJson);
            }
            catch (e) {
                // if there was an error, clear the buffer
                // telemetry is stored in the _buffer array so we won't loose any items
                applicationinsights_common_1.Util.setSessionStorage(this._logger, key, JSON.stringify([]));
                this._logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.WARNING, applicationinsights_core_js_1._InternalMessageId.FailedToSetStorageBuffer, " storage key: " + key + ", " + applicationinsights_common_1.Util.getExceptionName(e) + ". Buffer cleared", { exception: applicationinsights_common_1.Util.dump(e) });
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

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ./SendBuffer */ "./node_modules/applicationinsights-channel-js/bundle/SendBuffer.js"), __webpack_require__(/*! ./EnvelopeCreator */ "./node_modules/applicationinsights-channel-js/bundle/EnvelopeCreator.js"), __webpack_require__(/*! ./TelemetryValidation/EventValidator */ "./node_modules/applicationinsights-channel-js/bundle/TelemetryValidation/EventValidator.js"), __webpack_require__(/*! ./TelemetryValidation/TraceValidator */ "./node_modules/applicationinsights-channel-js/bundle/TelemetryValidation/TraceValidator.js"), __webpack_require__(/*! ./TelemetryValidation/ExceptionValidator */ "./node_modules/applicationinsights-channel-js/bundle/TelemetryValidation/ExceptionValidator.js"), __webpack_require__(/*! ./TelemetryValidation/MetricValidator */ "./node_modules/applicationinsights-channel-js/bundle/TelemetryValidation/MetricValidator.js"), __webpack_require__(/*! ./TelemetryValidation/PageViewPerformanceValidator */ "./node_modules/applicationinsights-channel-js/bundle/TelemetryValidation/PageViewPerformanceValidator.js"), __webpack_require__(/*! ./TelemetryValidation/PageViewValidator */ "./node_modules/applicationinsights-channel-js/bundle/TelemetryValidation/PageViewValidator.js"), __webpack_require__(/*! ./TelemetryValidation/RemoteDepdencyValidator */ "./node_modules/applicationinsights-channel-js/bundle/TelemetryValidation/RemoteDepdencyValidator.js"), __webpack_require__(/*! ./Serializer */ "./node_modules/applicationinsights-channel-js/bundle/Serializer.js"), __webpack_require__(/*! applicationinsights-common */ "./node_modules/applicationinsights-common/bundle/applicationinsights-common.js"), __webpack_require__(/*! applicationinsights-core-js */ "./node_modules/applicationinsights-core-js/bundle/applicationinsights-core-js.js"), __webpack_require__(/*! applicationinsights-core-js */ "./node_modules/applicationinsights-core-js/bundle/applicationinsights-core-js.js"), __webpack_require__(/*! ./Offline */ "./node_modules/applicationinsights-channel-js/bundle/Offline.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, SendBuffer_1, EnvelopeCreator_1, EventValidator_1, TraceValidator_1, ExceptionValidator_1, MetricValidator_1, PageViewPerformanceValidator_1, PageViewValidator_1, RemoteDepdencyValidator_1, Serializer_1, applicationinsights_common_1, applicationinsights_core_js_1, applicationinsights_core_js_2, Offline_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Sender = /** @class */ (function () {
        function Sender() {
            this.priority = 201;
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
                this._logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.CRITICAL, applicationinsights_core_js_1._InternalMessageId.FlushFailed, "flush failed, telemetry will not be collected: " + applicationinsights_common_1.Util.getExceptionName(e), { exception: applicationinsights_common_1.Util.dump(e) });
            }
        };
        Sender.prototype.teardown = function () {
            throw new Error("Method not implemented.");
        };
        Sender.prototype.initialize = function (config, core, extensions) {
            this.identifier = "AppInsightsChannelPlugin";
            this._logger = core.logger;
            this._serializer = new Serializer_1.Serializer(core.logger);
            this._consecutiveErrors = 0;
            this._retryAt = null;
            this._lastSend = 0;
            this._config = Sender._getDefaultAppInsightsChannelConfig(config, this.identifier);
            this._sender = null;
            this._buffer = (applicationinsights_common_1.Util.canUseSessionStorage() && this._config.enableSessionStorageBuffer)
                ? new SendBuffer_1.SessionStorageSendBuffer(this._logger, this._config) : new SendBuffer_1.ArraySendBuffer(this._config);
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
                    this._logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.CRITICAL, applicationinsights_core_js_1._InternalMessageId.CannotSendEmptyTelemetry, "Cannot send empty telemetry");
                    return;
                }
                // ensure a sender was constructed
                if (!this._sender) {
                    this._logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.CRITICAL, applicationinsights_core_js_1._InternalMessageId.SenderNotInitialized, "Sender was not initialized");
                    return;
                }
                // first we need to validate that the envelope passed down is valid
                var isValid = Sender._validate(telemetryItem);
                if (!isValid) {
                    this._logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.CRITICAL, applicationinsights_core_js_1._InternalMessageId.TelemetryEnvelopeInvalid, "Invalid telemetry envelope");
                    return;
                }
                // construct an envelope that Application Insights endpoint can understand
                var aiEnvelope = this._constructEnvelope(telemetryItem);
                if (!aiEnvelope) {
                    this._logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.CRITICAL, applicationinsights_core_js_1._InternalMessageId.CreateEnvelopeError, "Unable to create an AppInsights envelope");
                    return;
                }
                // check if the incoming payload is too large, truncate if necessary
                var payload = this._serializer.serialize(aiEnvelope);
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
                this._logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.WARNING, applicationinsights_core_js_1._InternalMessageId.FailedAddingTelemetryToBuffer, "Failed adding telemetry to the sender's buffer, some telemetry will be lost: " + applicationinsights_common_1.Util.getExceptionName(e), { exception: applicationinsights_common_1.Util.dump(e) });
            }
            // hand off the telemetry item to the next plugin
            if (!applicationinsights_core_js_2.CoreUtils.isNullOrUndefined(this._nextPlugin)) {
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
                        this._logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.WARNING, applicationinsights_core_js_1._InternalMessageId.TransmissionFailed, ". " +
                            "Response code " + xhr.status + ". Will retry to send " + payload.length + " items.");
                    }
                    else {
                        this._onError(payload, this._formatErrorMessageXhr(xhr));
                    }
                }
                else if (xhr.status === 0 || Offline_1.Offline.isOffline()) {
                    if (!this._config.isRetryDisabled()) {
                        var offlineBackOffMultiplier = 10; // arbritrary number
                        this._resendPayload(payload, offlineBackOffMultiplier);
                        this._logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.WARNING, applicationinsights_core_js_1._InternalMessageId.TransmissionFailed, ". Offline - Response Code: " + xhr.status + ". Offline status: " + Offline_1.Offline.isOffline() + ". Will retry to send " + payload.length + " items.");
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
                    this._logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.CRITICAL, applicationinsights_core_js_1._InternalMessageId.TransmissionFailed, "Telemetry transmission failed, some telemetry will be lost: " + applicationinsights_common_1.Util.getExceptionName(e), { exception: applicationinsights_common_1.Util.dump(e) });
                }
            }
        };
        /**
         * error handler
         */
        Sender.prototype._onError = function (payload, message, event) {
            this._logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.WARNING, applicationinsights_core_js_1._InternalMessageId.OnError, "Failed to send telemetry.", { message: message });
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
                this._logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.WARNING, applicationinsights_core_js_1._InternalMessageId.TransmissionFailed, "Partial success. " +
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
        Sender.prototype._constructEnvelope = function (envelope) {
            switch (envelope.baseType) {
                case applicationinsights_common_1.Event.dataType:
                    return EnvelopeCreator_1.EventEnvelopeCreator.EventEnvelopeCreator.Create(this._logger, envelope);
                case applicationinsights_common_1.Trace.dataType:
                    return EnvelopeCreator_1.TraceEnvelopeCreator.TraceEnvelopeCreator.Create(this._logger, envelope);
                case applicationinsights_common_1.PageView.dataType:
                    return EnvelopeCreator_1.PageViewEnvelopeCreator.PageViewEnvelopeCreator.Create(this._logger, envelope);
                case applicationinsights_common_1.PageViewPerformance.dataType:
                    return EnvelopeCreator_1.PageViewPerformanceEnvelopeCreator.PageViewPerformanceEnvelopeCreator.Create(this._logger, envelope);
                case applicationinsights_common_1.Exception.dataType:
                    return EnvelopeCreator_1.ExceptionEnvelopeCreator.ExceptionEnvelopeCreator.Create(this._logger, envelope);
                case applicationinsights_common_1.Metric.dataType:
                    return EnvelopeCreator_1.MetricEnvelopeCreator.MetricEnvelopeCreator.Create(this._logger, envelope);
                case applicationinsights_common_1.RemoteDependencyData.dataType:
                    return EnvelopeCreator_1.DependencyEnvelopeCreator.DependencyEnvelopeCreator.Create(this._logger, envelope);
                default:
                    // default create custom event type
                    return EnvelopeCreator_1.EventEnvelopeCreator.EventEnvelopeCreator.Create(this._logger, envelope);
            }
        };
        Sender._getDefaultAppInsightsChannelConfig = function (config, identifier) {
            var resultConfig = {};
            var pluginConfig = config.extensionConfig && config.extensionConfig[identifier] ? config.extensionConfig[identifier] : {};
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
                default:
                    return EventValidator_1.EventValidator.EventValidator.Validate(envelope);
            }
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
                this._logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.CRITICAL, applicationinsights_core_js_1._InternalMessageId.TransmissionFailed, ". " + "Failed to send telemetry with Beacon API.");
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
                this._logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.CRITICAL, applicationinsights_core_js_1._InternalMessageId.InvalidBackendResponse, "Cannot parse the response. " + applicationinsights_common_1.Util.getExceptionName(e), {
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
        /** Calculates the time to wait before retrying in case of an error based on
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
                this._logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.WARNING, applicationinsights_core_js_1._InternalMessageId.TransmissionFailed, ". " +
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

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! applicationinsights-common */ "./node_modules/applicationinsights-common/bundle/applicationinsights-common.js"), __webpack_require__(/*! applicationinsights-core-js */ "./node_modules/applicationinsights-core-js/bundle/applicationinsights-core-js.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, applicationinsights_common_1, applicationinsights_core_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
                this._logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.CRITICAL, applicationinsights_core_js_1._InternalMessageId.CannotSerializeObject, "cannot serialize object because it is null or undefined", { name: name }, true);
                return output;
            }
            if (source[circularReferenceCheck]) {
                this._logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.WARNING, applicationinsights_core_js_1._InternalMessageId.CircularReferenceDetected, "Circular reference detected while serializing object", { name: name }, true);
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
                else if (applicationinsights_common_1.Util.isArray(source)) {
                    output = this._serializeArray(source, name);
                }
                else {
                    this._logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.WARNING, applicationinsights_core_js_1._InternalMessageId.CannotSerializeObjectNonSerializable, "Attempting to serialize an object which does not implement ISerializable", { name: name }, true);
                    try {
                        // verify that the object can be stringified
                        JSON.stringify(source);
                        output = source;
                    }
                    catch (e) {
                        // if serialization fails return an empty string
                        this._logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.CRITICAL, applicationinsights_core_js_1._InternalMessageId.CannotSerializeObject, (e && typeof e.toString === 'function') ? e.toString() : "Error serializing object", null, true);
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
                    this._logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.CRITICAL, applicationinsights_core_js_1._InternalMessageId.MissingRequiredFieldSpecification, "Missing required field specification. The field is required but not present on source", { field: field, name: name });
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
            var output = undefined;
            if (!!sources) {
                if (!applicationinsights_common_1.Util.isArray(sources)) {
                    this._logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.CRITICAL, applicationinsights_core_js_1._InternalMessageId.ItemNotInArray, "This field was specified as an array in the contract but the item is not an array.\r\n", { name: name }, true);
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
                        this._logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.CRITICAL, output[field], null, true);
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
            return true;
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
        function Data(baseType, data) {
            var _this = _super.call(this) || this;
            /**
             * The data contract for serializing this object.
             */
            _this.aiDataContract = {
                baseType: Enums_1.FieldType.Required,
                baseData: Enums_1.FieldType.Required
            };
            _this.baseType = baseType;
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

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! applicationinsights-core-js */ "./node_modules/applicationinsights-core-js/bundle/applicationinsights-core-js.js"), __webpack_require__(/*! ../../Util */ "./node_modules/applicationinsights-common/bundle/Util.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, applicationinsights_core_js_1, Util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
            if (name) {
                // Remove any leading or trailing whitepace
                name = Util_1.Util.trim(name.toString());
                // truncate the string to 150 chars
                if (name.length > DataSanitizer.MAX_NAME_LENGTH) {
                    name = name.substring(0, DataSanitizer.MAX_NAME_LENGTH);
                    logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.WARNING, applicationinsights_core_js_1._InternalMessageId.NameTooLong, "name is too long.  It has been truncated to " + DataSanitizer.MAX_NAME_LENGTH + " characters.", { name: name }, true);
                }
            }
            return name;
        };
        DataSanitizer.sanitizeString = function (logger, value, maxLength) {
            if (maxLength === void 0) { maxLength = DataSanitizer.MAX_STRING_LENGTH; }
            if (value) {
                maxLength = maxLength ? maxLength : DataSanitizer.MAX_STRING_LENGTH; // in case default parameters dont work
                value = Util_1.Util.trim(value);
                if (value.toString().length > maxLength) {
                    value = value.toString().substring(0, maxLength);
                    logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.WARNING, applicationinsights_core_js_1._InternalMessageId.StringValueTooLong, "string value is too long. It has been truncated to " + maxLength + " characters.", { value: value }, true);
                }
            }
            return value;
        };
        DataSanitizer.sanitizeUrl = function (logger, url) {
            return DataSanitizer.sanitizeInput(logger, url, DataSanitizer.MAX_URL_LENGTH, applicationinsights_core_js_1._InternalMessageId.UrlTooLong);
        };
        DataSanitizer.sanitizeMessage = function (logger, message) {
            if (message) {
                if (message.length > DataSanitizer.MAX_MESSAGE_LENGTH) {
                    message = message.substring(0, DataSanitizer.MAX_MESSAGE_LENGTH);
                    logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.WARNING, applicationinsights_core_js_1._InternalMessageId.MessageTruncated, "message is too long, it has been truncated to " + DataSanitizer.MAX_MESSAGE_LENGTH + " characters.", { message: message }, true);
                }
            }
            return message;
        };
        DataSanitizer.sanitizeException = function (logger, exception) {
            if (exception) {
                if (exception.length > DataSanitizer.MAX_EXCEPTION_LENGTH) {
                    exception = exception.substring(0, DataSanitizer.MAX_EXCEPTION_LENGTH);
                    logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.WARNING, applicationinsights_core_js_1._InternalMessageId.ExceptionTruncated, "exception is too long, it has been truncated to " + DataSanitizer.MAX_EXCEPTION_LENGTH + " characters.", { exception: exception }, true);
                }
            }
            return exception;
        };
        DataSanitizer.sanitizeProperties = function (logger, properties) {
            if (properties) {
                var tempProps = {};
                for (var prop in properties) {
                    var value = DataSanitizer.sanitizeString(logger, properties[prop], DataSanitizer.MAX_PROPERTY_LENGTH);
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
            return id ? DataSanitizer.sanitizeInput(logger, id, DataSanitizer.MAX_ID_LENGTH, applicationinsights_core_js_1._InternalMessageId.IdTooLong).toString() : id;
        };
        DataSanitizer.sanitizeInput = function (logger, input, maxLength, _msgId) {
            if (input) {
                input = Util_1.Util.trim(input);
                if (input.length > maxLength) {
                    input = input.substring(0, maxLength);
                    logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.WARNING, _msgId, "input is too long, it has been truncated to " + maxLength + " characters.", { data: input }, true);
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
        function Envelope(logger, data, name) {
            var _this = _super.call(this) || this;
            _this.name = DataSanitizer_1.DataSanitizer.sanitizeString(logger, name) || Util_1.Util.NotSpecified;
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
        function Event(logger, name, properties, measurements) {
            var _this = _super.call(this) || this;
            _this.aiDataContract = {
                ver: Enums_1.FieldType.Required,
                name: Enums_1.FieldType.Required,
                properties: Enums_1.FieldType.Default,
                measurements: Enums_1.FieldType.Default
            };
            _this.name = DataSanitizer_1.DataSanitizer.sanitizeString(logger, name) || Util_1.Util.NotSpecified;
            _this.properties = DataSanitizer_1.DataSanitizer.sanitizeProperties(logger, properties);
            _this.measurements = DataSanitizer_1.DataSanitizer.sanitizeMeasurements(logger, measurements);
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
        function Exception(logger, exception, properties, measurements, severityLevel) {
            var _this = _super.call(this) || this;
            _this.aiDataContract = {
                ver: Enums_1.FieldType.Required,
                exceptions: Enums_1.FieldType.Required,
                severityLevel: Enums_1.FieldType.Default,
                properties: Enums_1.FieldType.Default,
                measurements: Enums_1.FieldType.Default
            };
            _this.properties = DataSanitizer_1.DataSanitizer.sanitizeProperties(logger, properties);
            _this.measurements = DataSanitizer_1.DataSanitizer.sanitizeMeasurements(logger, measurements);
            _this.exceptions = [new _ExceptionDetails(logger, exception)];
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
        function _ExceptionDetails(logger, exception) {
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
            _this.typeName = DataSanitizer_1.DataSanitizer.sanitizeString(logger, exception.name) || Util_1.Util.NotSpecified;
            _this.message = DataSanitizer_1.DataSanitizer.sanitizeMessage(logger, exception.message) || Util_1.Util.NotSpecified;
            var stack = exception["stack"];
            _this.parsedStack = _this.parseStack(stack);
            _this.stack = DataSanitizer_1.DataSanitizer.sanitizeException(logger, stack);
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
        function Metric(logger, name, value, count, min, max, properties) {
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
            dataPoint.name = DataSanitizer_1.DataSanitizer.sanitizeString(logger, name) || Util_1.Util.NotSpecified;
            dataPoint.value = value;
            _this.metrics = [dataPoint];
            _this.properties = DataSanitizer_1.DataSanitizer.sanitizeProperties(logger, properties);
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
        function PageView(logger, name, url, durationMs, properties, measurements, id) {
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
            _this.id = DataSanitizer_1.DataSanitizer.sanitizeId(logger, id);
            _this.url = DataSanitizer_1.DataSanitizer.sanitizeUrl(logger, url);
            _this.name = DataSanitizer_1.DataSanitizer.sanitizeString(logger, name) || Util_1.Util.NotSpecified;
            if (!isNaN(durationMs)) {
                _this.duration = Util_1.Util.msToTimeSpan(durationMs);
            }
            _this.properties = DataSanitizer_1.DataSanitizer.sanitizeProperties(logger, properties);
            _this.measurements = DataSanitizer_1.DataSanitizer.sanitizeMeasurements(logger, measurements);
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
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ../Interfaces/Contracts/Generated/PageViewPerfData */ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/PageViewPerfData.js"), __webpack_require__(/*! ../Enums */ "./node_modules/applicationinsights-common/bundle/Enums.js"), __webpack_require__(/*! ./Common/DataSanitizer */ "./node_modules/applicationinsights-common/bundle/Telemetry/Common/DataSanitizer.js"), __webpack_require__(/*! ../Util */ "./node_modules/applicationinsights-common/bundle/Util.js"), __webpack_require__(/*! applicationinsights-core-js */ "./node_modules/applicationinsights-core-js/bundle/applicationinsights-core-js.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, PageViewPerfData_1, Enums_1, DataSanitizer_1, Util_1, applicationinsights_core_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var PageViewPerformance = /** @class */ (function (_super) {
        __extends(PageViewPerformance, _super);
        /**
         * Constructs a new instance of the PageEventTelemetry object
         */
        function PageViewPerformance(logger, name, url, unused, properties, measurements) {
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
                    logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.WARNING, applicationinsights_core_js_1._InternalMessageId.ErrorPVCalc, "error calculating page view performance.", { total: total, network: network, request: request, response: response, dom: dom });
                }
                else if (!PageViewPerformance.shouldCollectDuration(total, network, request, response, dom)) {
                    logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.WARNING, applicationinsights_core_js_1._InternalMessageId.InvalidDurationValue, "Invalid page load duration value. Browser perf data won't be sent.", { total: total, network: network, request: request, response: response, dom: dom });
                }
                else if (total < Math.floor(network) + Math.floor(request) + Math.floor(response) + Math.floor(dom)) {
                    // some browsers may report individual components incorrectly so that the sum of the parts will be bigger than total PLT
                    // in this case, don't report client performance from this page
                    logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.WARNING, applicationinsights_core_js_1._InternalMessageId.ClientPerformanceMathError, "client performance math error.", { total: total, network: network, request: request, response: response, dom: dom });
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
            _this.url = DataSanitizer_1.DataSanitizer.sanitizeUrl(logger, url);
            _this.name = DataSanitizer_1.DataSanitizer.sanitizeString(logger, name) || Util_1.Util.NotSpecified;
            _this.properties = DataSanitizer_1.DataSanitizer.sanitizeProperties(logger, properties);
            _this.measurements = DataSanitizer_1.DataSanitizer.sanitizeMeasurements(logger, measurements);
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
            return typeof window != "undefined" && window.performance && window.performance.timing;
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
        function RemoteDependencyData(logger, id, absoluteUrl, commandName, value, success, resultCode, method, properties, measurements) {
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
            _this.data = DataSanitizer_1.DataSanitizer.sanitizeUrl(logger, commandName);
            var dependencyFields = Util_2.AjaxHelper.ParseDependencyPath(logger, absoluteUrl, method, commandName);
            _this.target = dependencyFields.target;
            _this.name = dependencyFields.name;
            _this.properties = DataSanitizer_1.DataSanitizer.sanitizeProperties(logger, properties);
            _this.measurements = DataSanitizer_1.DataSanitizer.sanitizeMeasurements(logger, measurements);
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
        function Trace(logger, message, properties, severityLevel) {
            var _this = _super.call(this) || this;
            _this.aiDataContract = {
                ver: Enums_1.FieldType.Required,
                message: Enums_1.FieldType.Required,
                severityLevel: Enums_1.FieldType.Default,
                properties: Enums_1.FieldType.Default
            };
            message = message || Util_1.Util.NotSpecified;
            _this.message = DataSanitizer_1.DataSanitizer.sanitizeMessage(logger, message);
            _this.properties = DataSanitizer_1.DataSanitizer.sanitizeProperties(logger, properties);
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

/***/ "./node_modules/applicationinsights-common/bundle/TelemetryItemCreator.js":
/*!********************************************************************************!*\
  !*** ./node_modules/applicationinsights-common/bundle/TelemetryItemCreator.js ***!
  \********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ./Util */ "./node_modules/applicationinsights-common/bundle/Util.js"), __webpack_require__(/*! ./Telemetry/Common/DataSanitizer */ "./node_modules/applicationinsights-common/bundle/Telemetry/Common/DataSanitizer.js"), __webpack_require__(/*! applicationinsights-core-js */ "./node_modules/applicationinsights-core-js/bundle/applicationinsights-core-js.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, Util_1, DataSanitizer_1, applicationinsights_core_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
            envelopeName = DataSanitizer_1.DataSanitizer.sanitizeString(logger, envelopeName) || Util_1.Util.NotSpecified;
            if (applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(item) ||
                applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(baseType) ||
                applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(envelopeName)) {
                throw Error("Input doesn't contain all required fields");
            }
            var telemetryItem = {
                name: envelopeName,
                timestamp: new Date(),
                instrumentationKey: "",
                ctx: systemProperties ? systemProperties : {},
                tags: [],
                data: {},
                baseType: baseType,
                baseData: item
            };
            // Part C
            if (!applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(customProperties)) {
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
    exports.TelemetryItemCreator = TelemetryItemCreator;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=TelemetryItemCreator.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-common/bundle/Util.js":
/*!****************************************************************!*\
  !*** ./node_modules/applicationinsights-common/bundle/Util.js ***!
  \****************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ./Enums */ "./node_modules/applicationinsights-common/bundle/Enums.js"), __webpack_require__(/*! applicationinsights-core-js */ "./node_modules/applicationinsights-core-js/bundle/applicationinsights-core-js.js"), __webpack_require__(/*! ./RequestResponseHeaders */ "./node_modules/applicationinsights-common/bundle/RequestResponseHeaders.js"), __webpack_require__(/*! ./Telemetry/Common/DataSanitizer */ "./node_modules/applicationinsights-common/bundle/Telemetry/Common/DataSanitizer.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, Enums_1, applicationinsights_core_js_1, RequestResponseHeaders_1, DataSanitizer_1) {
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
        Util.getStorage = function (logger, name) {
            var storage = Util._getLocalStorageObject();
            if (storage !== null) {
                try {
                    return storage.getItem(name);
                }
                catch (e) {
                    Util._canUseLocalStorage = false;
                    logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.WARNING, applicationinsights_core_js_1._InternalMessageId.BrowserCannotReadLocalStorage, "Browser failed read of local storage. " + Util.getExceptionName(e), { exception: Util.dump(e) });
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
                    logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.WARNING, applicationinsights_core_js_1._InternalMessageId.BrowserCannotWriteLocalStorage, "Browser failed write to local storage. " + Util.getExceptionName(e), { exception: Util.dump(e) });
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
                    logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.WARNING, applicationinsights_core_js_1._InternalMessageId.BrowserFailedRemovalFromLocalStorage, "Browser failed removal of local storage item. " + Util.getExceptionName(e), { exception: Util.dump(e) });
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
        Util.getSessionStorage = function (logger, name) {
            var storage = Util._getSessionStorageObject();
            if (storage !== null) {
                try {
                    return storage.getItem(name);
                }
                catch (e) {
                    Util._canUseSessionStorage = false;
                    logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.WARNING, applicationinsights_core_js_1._InternalMessageId.BrowserCannotReadSessionStorage, "Browser failed read of session storage. " + Util.getExceptionName(e), { exception: Util.dump(e) });
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
                    logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.WARNING, applicationinsights_core_js_1._InternalMessageId.BrowserCannotWriteSessionStorage, "Browser failed write to session storage. " + Util.getExceptionName(e), { exception: Util.dump(e) });
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
                    logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.WARNING, applicationinsights_core_js_1._InternalMessageId.BrowserFailedRemovalFromSessionStorage, "Browser failed removal of session storage item. " + Util.getExceptionName(e), { exception: Util.dump(e) });
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
        Util.canUseCookies = function (logger) {
            if (Util._canUseCookies === undefined) {
                Util._canUseCookies = false;
                try {
                    Util._canUseCookies = Util.document.cookie !== undefined;
                }
                catch (e) {
                    logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.WARNING, applicationinsights_core_js_1._InternalMessageId.CannotAccessCookie, "Cannot access document.cookie - " + Util.getExceptionName(e), { exception: Util.dump(e) });
                }
                ;
            }
            return Util._canUseCookies;
        };
        /**
         * helper method to set userId and sessionId cookie
         */
        Util.setCookie = function (logger, name, value, domain) {
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
            // tslint:disable-next-line:insecure-random
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
        AjaxHelper.ParseDependencyPath = function (logger, absoluteUrl, method, pathName) {
            var target, name;
            if (absoluteUrl && absoluteUrl.length > 0) {
                var parsedUrl = UrlHelper.parseUrl(absoluteUrl);
                target = parsedUrl.host;
                if (parsedUrl.pathname != null) {
                    var pathName = (parsedUrl.pathname.length === 0) ? "/" : parsedUrl.pathname;
                    if (pathName.charAt(0) !== '/') {
                        pathName = "/" + pathName;
                    }
                    name = DataSanitizer_1.DataSanitizer.sanitizeString(logger, method ? method + " " + pathName : pathName);
                }
                else {
                    name = DataSanitizer_1.DataSanitizer.sanitizeString(logger, absoluteUrl);
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
    /**
     * A utility class that helps getting time related parameters
     */
    var DateTimeUtils = /** @class */ (function () {
        function DateTimeUtils() {
        }
        /**
         * Get the number of milliseconds since 1970/01/01 in local timezone
         */
        DateTimeUtils.Now = (window.performance && window.performance.now && window.performance.timing) ?
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
            if (start !== 0 && end !== 0 && !applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(start) && !applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(end)) {
                result = end - start;
            }
            return result;
        };
        return DateTimeUtils;
    }());
    exports.DateTimeUtils = DateTimeUtils;
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

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ./Util */ "./node_modules/applicationinsights-common/bundle/Util.js"), __webpack_require__(/*! ./Enums */ "./node_modules/applicationinsights-common/bundle/Enums.js"), __webpack_require__(/*! ./RequestResponseHeaders */ "./node_modules/applicationinsights-common/bundle/RequestResponseHeaders.js"), __webpack_require__(/*! ./Constants */ "./node_modules/applicationinsights-common/bundle/Constants.js"), __webpack_require__(/*! ./Interfaces/Contracts/Generated/Data */ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/Data.js"), __webpack_require__(/*! ./Interfaces/Contracts/Generated/Base */ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/Base.js"), __webpack_require__(/*! ./Telemetry/Common/Envelope */ "./node_modules/applicationinsights-common/bundle/Telemetry/Common/Envelope.js"), __webpack_require__(/*! ./Telemetry/Event */ "./node_modules/applicationinsights-common/bundle/Telemetry/Event.js"), __webpack_require__(/*! ./Telemetry/Exception */ "./node_modules/applicationinsights-common/bundle/Telemetry/Exception.js"), __webpack_require__(/*! ./Telemetry/Metric */ "./node_modules/applicationinsights-common/bundle/Telemetry/Metric.js"), __webpack_require__(/*! ./Telemetry/PageView */ "./node_modules/applicationinsights-common/bundle/Telemetry/PageView.js"), __webpack_require__(/*! ./Interfaces/Contracts/Generated/PageViewData */ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/PageViewData.js"), __webpack_require__(/*! ./Telemetry/RemoteDependencyData */ "./node_modules/applicationinsights-common/bundle/Telemetry/RemoteDependencyData.js"), __webpack_require__(/*! ./Telemetry/Trace */ "./node_modules/applicationinsights-common/bundle/Telemetry/Trace.js"), __webpack_require__(/*! ./Telemetry/PageViewPerformance */ "./node_modules/applicationinsights-common/bundle/Telemetry/PageViewPerformance.js"), __webpack_require__(/*! ./Telemetry/Common/Data */ "./node_modules/applicationinsights-common/bundle/Telemetry/Common/Data.js"), __webpack_require__(/*! ./Interfaces/Contracts/Generated/SeverityLevel */ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/SeverityLevel.js"), __webpack_require__(/*! ./Interfaces/Contracts/Generated/ContextTagKeys */ "./node_modules/applicationinsights-common/bundle/Interfaces/Contracts/Generated/ContextTagKeys.js"), __webpack_require__(/*! ./Telemetry/Common/DataSanitizer */ "./node_modules/applicationinsights-common/bundle/Telemetry/Common/DataSanitizer.js"), __webpack_require__(/*! ./TelemetryItemCreator */ "./node_modules/applicationinsights-common/bundle/TelemetryItemCreator.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, Util_1, Enums_1, RequestResponseHeaders_1, Constants_1, Data_1, Base_1, Envelope_1, Event_1, Exception_1, Metric_1, PageView_1, PageViewData_1, RemoteDependencyData_1, Trace_1, PageViewPerformance_1, Data_2, SeverityLevel_1, ContextTagKeys_1, DataSanitizer_1, TelemetryItemCreator_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Util = Util_1.Util;
    exports.CorrelationIdHelper = Util_1.CorrelationIdHelper;
    exports.UrlHelper = Util_1.UrlHelper;
    exports.DateTimeUtils = Util_1.DateTimeUtils;
    exports.FieldType = Enums_1.FieldType;
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
    exports.TelemetryItemCreator = TelemetryItemCreator_1.TelemetryItemCreator;
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

/***/ "./node_modules/applicationinsights-core-js/bundle/JavaScriptSDK.Enums/LoggingEnums.js":
/*!*********************************************************************************************!*\
  !*** ./node_modules/applicationinsights-core-js/bundle/JavaScriptSDK.Enums/LoggingEnums.js ***!
  \*********************************************************************************************/
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
        LoggingSeverity[LoggingSeverity["CRITICAL"] = 1] = "CRITICAL";
        /**
         * Error will NOT be sent as internal telemetry, and will only be shown in browser console
         */
        LoggingSeverity[LoggingSeverity["WARNING"] = 2] = "WARNING";
    })(LoggingSeverity = exports.LoggingSeverity || (exports.LoggingSeverity = {}));
    /**
     * Internal message ID. Please create a new one for every conceptually different message. Please keep alphabetically ordered
     */ ;
    exports._InternalMessageId = {
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
    };
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=LoggingEnums.js.map

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

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ../JavaScriptSDK.Enums/EventsDiscardedReason */ "./node_modules/applicationinsights-core-js/bundle/JavaScriptSDK.Enums/EventsDiscardedReason.js"), __webpack_require__(/*! ./CoreUtils */ "./node_modules/applicationinsights-core-js/bundle/JavaScriptSDK/CoreUtils.js"), __webpack_require__(/*! ./NotificationManager */ "./node_modules/applicationinsights-core-js/bundle/JavaScriptSDK/NotificationManager.js"), __webpack_require__(/*! ./DiagnosticLogger */ "./node_modules/applicationinsights-core-js/bundle/JavaScriptSDK/DiagnosticLogger.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, EventsDiscardedReason_1, CoreUtils_1, NotificationManager_1, DiagnosticLogger_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    "use strict";
    var AppInsightsCore = /** @class */ (function () {
        function AppInsightsCore() {
            this._isInitialized = false;
            this._extensions = new Array();
            this._channelController = new ChannelController();
        }
        AppInsightsCore.prototype.initialize = function (config, extensions) {
            var _this = this;
            // Make sure core is only initialized once
            if (this._isInitialized) {
                throw Error("Core should not be initialized more than once");
            }
            if (!config || CoreUtils_1.CoreUtils.isNullOrUndefined(config.instrumentationKey)) {
                throw Error("Please provide instrumentation key");
            }
            this.config = config;
            this._notificationManager = new NotificationManager_1.NotificationManager();
            this.config.extensions = CoreUtils_1.CoreUtils.isNullOrUndefined(this.config.extensions) ? [] : this.config.extensions;
            // add notification to the extensions in the config so other plugins can access it
            this.config.extensionConfig = CoreUtils_1.CoreUtils.isNullOrUndefined(this.config.extensionConfig) ? {} : this.config.extensionConfig;
            this.config.extensionConfig.NotificationManager = this._notificationManager;
            this.logger = new DiagnosticLogger_1.DiagnosticLogger(config);
            // Initial validation
            extensions.forEach(function (extension) {
                if (CoreUtils_1.CoreUtils.isNullOrUndefined(extension.initialize)) {
                    throw Error(validationError);
                }
            });
            if (this.config.extensions.length > 0) {
                var isValid_1 = true;
                this.config.extensions.forEach(function (item) {
                    if (CoreUtils_1.CoreUtils.isNullOrUndefined(item)) {
                        isValid_1 = false;
                    }
                });
                if (!isValid_1) {
                    throw Error(validationError);
                }
            }
            // Initial validation complete
            // Concat all available extensions before sorting by priority
            (_a = this._extensions).push.apply(_a, [this._channelController].concat(extensions, this.config.extensions));
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
            this._extensions.forEach(function (ext) {
                var t = ext;
                if (t && t.priority) {
                    if (!CoreUtils_1.CoreUtils.isNullOrUndefined(priority[t.priority])) {
                        _this.logger.warnToConsole("Two extensions have same priority" + priority[t.priority] + ", " + t.identifier);
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
                if (curr.priority === ChannelControllerPriority) {
                    c = idx + 1;
                    break; // channel controller will set remaining pipeline
                }
                this._extensions[idx].setNextPlugin(this._extensions[idx + 1]); // set next plugin
            }
            // initialize channel controller first, this will initialize all channel plugins
            this._channelController.initialize(this.config, this, this._extensions);
            // initialize remaining regular plugins
            this._extensions.forEach(function (ext) {
                var e = ext;
                if (e && e.priority < ChannelControllerPriority) {
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
        AppInsightsCore.prototype.getTransmissionControls = function () {
            return this._channelController.ChannelControls;
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
            if (!telemetryItem.baseType) {
                // Hard coded from Common::Event.ts::Event.dataType
                telemetryItem.baseType = "EventData";
            }
            if (!telemetryItem.instrumentationKey) {
                // setup default ikey if not passed in
                telemetryItem.instrumentationKey = this.config.instrumentationKey;
            }
            if (!telemetryItem.timestamp) {
                // add default timestamp if not passed in
                telemetryItem.timestamp = new Date();
            }
            // do basic validation before sending it through the pipeline
            this._validateTelmetryItem(telemetryItem);
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
         * The added plugins must raise notifications. If the plugins do not implement the notifications, then no methods will be
         * called.
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
        /**
         * Periodically check logger.queue for
         */
        AppInsightsCore.prototype.pollInternalLogs = function () {
            var _this = this;
            if (!(this.config.diagnosticLoggingInterval > 0)) {
                throw Error("config.diagnosticLoggingInterval must be a positive integer");
            }
            return setInterval(function () {
                var queue = _this.logger.queue;
                queue.forEach(function (logMessage) {
                    var item = {
                        name: "InternalMessageId: " + logMessage.messageId,
                        instrumentationKey: _this.config.instrumentationKey,
                        timestamp: new Date(),
                        baseType: DiagnosticLogger_1._InternalLogMessage.dataType,
                        baseData: { message: logMessage.message }
                    };
                    _this.track(item);
                });
                queue.length = 0;
            }, this.config.diagnosticLoggingInterval);
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
    var ChannelController = /** @class */ (function () {
        function ChannelController() {
            this.identifier = "ChannelControllerPlugin";
            this.priority = ChannelControllerPriority; // in reserved range 100 to 200
        }
        ChannelController.prototype.processTelemetry = function (item) {
            this.channelQueue.forEach(function (queues) {
                // pass on to first item in queue
                if (queues.length > 0) {
                    queues[0].processTelemetry(item);
                }
            });
        };
        Object.defineProperty(ChannelController.prototype, "ChannelControls", {
            get: function () {
                return this.channelQueue;
            },
            enumerable: true,
            configurable: true
        });
        ChannelController.prototype.initialize = function (config, core, extensions) {
            var _this = this;
            this.channelQueue = new Array();
            if (config.channels) {
                config.channels.forEach(function (queue) {
                    if (queue && queue.length > 0) {
                        queue = queue.sort(function (a, b) {
                            return a.priority - b.priority;
                        });
                        // Initialize each plugin
                        queue.forEach(function (queueItem) { return queueItem.initialize(config, core, extensions); });
                        for (var i = 1; i < queue.length; i++) {
                            queue[i - 1].setNextPlugin(queue[i]); // setup processing chain
                        }
                        _this.channelQueue.push(queue);
                    }
                });
            }
            else {
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
                    // Initialize each plugin
                    arr.forEach(function (queueItem) { return queueItem.initialize(config, core, extensions); });
                    // setup next plugin
                    for (var i = 1; i < arr.length; i++) {
                        arr[i - 1].setNextPlugin(arr[i]);
                    }
                    this.channelQueue.push(arr);
                }
            }
        };
        return ChannelController;
    }());
    var validationError = "Extensions must provide callback to initialize";
    var ChannelControllerPriority = 200;
    var duplicatePriority = "One or more extensions are set at same priority";
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
        /**
    * Creates a new GUID.
    * @return {string} A GUID.
    */
        CoreUtils.newGuid = function () {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(GuidRegex, function (c) {
                var r = (Math.random() * 16 | 0), v = (c === 'x' ? r : r & 0x3 | 0x8);
                return v.toString(16);
            });
        };
        return CoreUtils;
    }());
    exports.CoreUtils = CoreUtils;
    var GuidRegex = /[xy]/g;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=CoreUtils.js.map

/***/ }),

/***/ "./node_modules/applicationinsights-core-js/bundle/JavaScriptSDK/DiagnosticLogger.js":
/*!*******************************************************************************************!*\
  !*** ./node_modules/applicationinsights-core-js/bundle/JavaScriptSDK/DiagnosticLogger.js ***!
  \*******************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ../JavaScriptSDK.Enums/LoggingEnums */ "./node_modules/applicationinsights-core-js/bundle/JavaScriptSDK.Enums/LoggingEnums.js"), __webpack_require__(/*! ./CoreUtils */ "./node_modules/applicationinsights-core-js/bundle/JavaScriptSDK/CoreUtils.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, LoggingEnums_1, CoreUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
    exports._InternalLogMessage = _InternalLogMessage;
    var DiagnosticLogger = /** @class */ (function () {
        function DiagnosticLogger(config) {
            /**
            *  Session storage key for the prefix for the key indicating message type already logged
            */
            this.AIInternalMessagePrefix = "AITR_";
            /**
             * When this is true the SDK will throw exceptions to aid in debugging.
             */
            this.enableDebugExceptions = function () { return false; };
            /**
             * 0: OFF
             * 1: CRITICAL (default)
             * 2: >= WARNING
             */
            this.consoleLoggingLevel = function () { return 1; };
            /**
             * 0: OFF (default)
             * 1: CRITICAL
             * 2: >= WARNING
             */
            this.telemetryLoggingLevel = function () { return 0; };
            /**
             * The maximum number of internal messages allowed to be sent per page view
             */
            this.maxInternalMessageLimit = function () { return 25; };
            /**
             * The internal logging queue
             */
            this.queue = [];
            /**
             * Count of internal messages sent
             */
            this._messageCount = 0;
            /**
             * Holds information about what message types were already logged to console or sent to server.
             */
            this._messageLogged = {};
            if (CoreUtils_1.CoreUtils.isNullOrUndefined(config)) {
                // TODO: Use default config
                // config = AppInsightsCore.defaultConfig;
                // For now, use defaults specified in DiagnosticLogger members;
                return;
            }
            if (!CoreUtils_1.CoreUtils.isNullOrUndefined(config.loggingLevelConsole)) {
                this.consoleLoggingLevel = function () { return config.loggingLevelConsole; };
            }
            if (!CoreUtils_1.CoreUtils.isNullOrUndefined(config.loggingLevelTelemetry)) {
                this.telemetryLoggingLevel = function () { return config.loggingLevelTelemetry; };
            }
            if (!CoreUtils_1.CoreUtils.isNullOrUndefined(config.maxMessageLimit)) {
                this.maxInternalMessageLimit = function () { return config.maxMessageLimit; };
            }
            if (!CoreUtils_1.CoreUtils.isNullOrUndefined(config.enableDebugExceptions)) {
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
                            if (!this._messageLogged[messageKey] || this.consoleLoggingLevel() >= LoggingEnums_1.LoggingSeverity.WARNING) {
                                this.warnToConsole(message.message);
                                this._messageLogged[messageKey] = true;
                            }
                        }
                        else {
                            // don't log internal AI traces in the console, unless the verbose logging is enabled
                            if (this.consoleLoggingLevel() >= LoggingEnums_1.LoggingSeverity.WARNING) {
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
                if (this._messageCount == this.maxInternalMessageLimit()) {
                    var throttleLimitMessage = "Internal events throttle limit per PageView reached for this app.";
                    var throttleMessage = new _InternalLogMessage(LoggingEnums_1._InternalMessageId.MessageLimitPerPVExceeded, throttleLimitMessage, false);
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
    exports.DiagnosticLogger = DiagnosticLogger;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=DiagnosticLogger.js.map

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

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(/*! ./JavaScriptSDK.Interfaces/IChannelControls */ "./node_modules/applicationinsights-core-js/bundle/JavaScriptSDK.Interfaces/IChannelControls.js"), __webpack_require__(/*! ./JavaScriptSDK.Enums/EventsDiscardedReason */ "./node_modules/applicationinsights-core-js/bundle/JavaScriptSDK.Enums/EventsDiscardedReason.js"), __webpack_require__(/*! ./JavaScriptSDK/AppInsightsCore */ "./node_modules/applicationinsights-core-js/bundle/JavaScriptSDK/AppInsightsCore.js"), __webpack_require__(/*! ./JavaScriptSDK/CoreUtils */ "./node_modules/applicationinsights-core-js/bundle/JavaScriptSDK/CoreUtils.js"), __webpack_require__(/*! ./JavaScriptSDK/NotificationManager */ "./node_modules/applicationinsights-core-js/bundle/JavaScriptSDK/NotificationManager.js"), __webpack_require__(/*! ./JavaScriptSDK/DiagnosticLogger */ "./node_modules/applicationinsights-core-js/bundle/JavaScriptSDK/DiagnosticLogger.js"), __webpack_require__(/*! ./JavaScriptSDK.Enums/LoggingEnums */ "./node_modules/applicationinsights-core-js/bundle/JavaScriptSDK.Enums/LoggingEnums.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, IChannelControls_1, EventsDiscardedReason_1, AppInsightsCore_1, CoreUtils_1, NotificationManager_1, DiagnosticLogger_1, LoggingEnums_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MinChannelPriorty = IChannelControls_1.MinChannelPriorty;
    exports.EventsDiscardedReason = EventsDiscardedReason_1.EventsDiscardedReason;
    exports.AppInsightsCore = AppInsightsCore_1.AppInsightsCore;
    exports.CoreUtils = CoreUtils_1.CoreUtils;
    exports.NotificationManager = NotificationManager_1.NotificationManager;
    exports.DiagnosticLogger = DiagnosticLogger_1.DiagnosticLogger;
    exports._InternalLogMessage = DiagnosticLogger_1._InternalLogMessage;
    exports._InternalMessageId = LoggingEnums_1._InternalMessageId;
    exports.LoggingSeverity = LoggingEnums_1.LoggingSeverity;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
//# sourceMappingURL=applicationinsights-core-js.js.map

/***/ }),

/***/ 0:
/*!*******************************!*\
  !*** multi ./bundle/index.js ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! ./bundle/index.js */"./bundle/index.js");


/***/ })

/******/ });
});
//# sourceMappingURL=aisdklite.0.0.3.js.map