"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
/// <reference path="../External/qunit.d.ts" />
/** Wrapper around QUnit asserts. This class has two purposes:
 * - Make Assertion methods easy to discover.
 * - Make them consistent with XUnit assertions in the order of the actual and expected parameter values.
 */
var Assert = /** @class */ (function () {
    function Assert() {
    }
    /**
    * A deep recursive comparison assertion, working on primitive types, arrays, objects,
    * regular expressions, dates and functions.
    *
    * The deepEqual() assertion can be used just like equal() when comparing the value of
    * objects, such that { key: value } is equal to { key: value }. For non-scalar values,
    * identity will be disregarded by deepEqual.
    *
    * @param expected Known comparison value
    * @param actual Object or Expression being tested
    * @param message A short description of the assertion
    */
    Assert.deepEqual = function (expected, actual, message) {
        return deepEqual(actual, expected, message);
    };
    /**
    * A non-strict comparison assertion, roughly equivalent to JUnit assertEquals.
    *
    * The equal assertion uses the simple comparison operator (==) to compare the actual
    * and expected arguments. When they are equal, the assertion passes: any; otherwise, it fails.
    * When it fails, both actual and expected values are displayed in the test result,
    * in addition to a given message.
    *
    * @param expected Known comparison value
    * @param actual Expression being tested
    * @param message A short description of the assertion
    */
    Assert.equal = function (expected, actual, message) {
        return equal(actual, expected, message);
    };
    /**
    * An inverted deep recursive comparison assertion, working on primitive types,
    * arrays, objects, regular expressions, dates and functions.
    *
    * The notDeepEqual() assertion can be used just like equal() when comparing the
    * value of objects, such that { key: value } is equal to { key: value }. For non-scalar
    * values, identity will be disregarded by notDeepEqual.
    *
    * @param expected Known comparison value
    * @param actual Object or Expression being tested
    * @param message A short description of the assertion
    */
    Assert.notDeepEqual = function (expected, actual, message) {
        return notDeepEqual(actual, expected, message);
    };
    /**
    * A non-strict comparison assertion, checking for inequality.
    *
    * The notEqual assertion uses the simple inverted comparison operator (!=) to compare
    * the actual and expected arguments. When they aren't equal, the assertion passes: any;
    * otherwise, it fails. When it fails, both actual and expected values are displayed
    * in the test result, in addition to a given message.
    *
    * @param expected Known comparison value
    * @param actual Expression being tested
    * @param message A short description of the assertion
    */
    Assert.notEqual = function (expected, actual, message) {
        return notEqual(actual, expected, message);
    };
    Assert.notPropEqual = function (expected, actual, message) {
        return notPropEqual(actual, expected, message);
    };
    Assert.propEqual = function (expected, actual, message) {
        return propEqual(actual, expected, message);
    };
    /**
    * A non-strict comparison assertion, checking for inequality.
    *
    * The notStrictEqual assertion uses the strict inverted comparison operator (!==)
    * to compare the actual and expected arguments. When they aren't equal, the assertion
    * passes: any; otherwise, it fails. When it fails, both actual and expected values are
    * displayed in the test result, in addition to a given message.
    *
    * @param expected Known comparison value
    * @param actual Expression being tested
    * @param message A short description of the assertion
    */
    Assert.notStrictEqual = function (expected, actual, message) {
        return notStrictEqual(actual, expected, message);
    };
    /**
    * A boolean assertion, equivalent to CommonJS's assert.ok() and JUnit's assertTrue().
    * Passes if the first argument is truthy.
    *
    * The most basic assertion in QUnit, ok() requires just one argument. If the argument
    * evaluates to true, the assertion passes; otherwise, it fails. If a second message
    * argument is provided, it will be displayed in place of the result.
    *
    * @param state Expression being tested
    * @param message A short description of the assertion
    */
    Assert.ok = function (state, message) {
        return ok(state, message);
    };
    /**
    * A strict type and value comparison assertion.
    *
    * The strictEqual() assertion provides the most rigid comparison of type and value with
    * the strict equality operator (===)
    *
    * @param expected Known comparison value
    * @param actual Expression being tested
    * @param message A short description of the assertion
    */
    Assert.strictEqual = function (expected, actual, message) {
        return strictEqual(actual, expected, message);
    };
    Assert.throws = function (block, expected, message) {
        return throws(block, expected, message);
    };
    return Assert;
}());
/** Defines a test case */
var TestCase = /** @class */ (function () {
    function TestCase() {
    }
    return TestCase;
}());
/// <reference path="../External/sinon.d.ts" />
/// <reference path="../External/qunit.d.ts" />
/// <reference path="Assert.ts" />
/// <reference path="./TestCase.ts"/>
var TestClass = /** @class */ (function () {
    function TestClass(name) {
        /** Turns on/off sinon's syncronous implementation of setTimeout. On by default. */
        this.useFakeTimers = true;
        /** Turns on/off sinon's fake implementation of XMLHttpRequest. On by default. */
        this.useFakeServer = true;
        QUnit.module(name);
    }
    /** Method called before the start of each test method */
    TestClass.prototype.testInitialize = function () {
    };
    /** Method called after each test method has completed */
    TestClass.prototype.testCleanup = function () {
    };
    /** Method in which test class intances should call this.testCase(...) to register each of this suite's tests. */
    TestClass.prototype.registerTests = function () {
    };
    /** Register an async Javascript unit testcase. */
    TestClass.prototype.testCaseAsync = function (testInfo) {
        var _this = this;
        if (!testInfo.name) {
            throw new Error("Must specify name in testInfo context in registerTestcase call");
        }
        if (isNaN(testInfo.stepDelay)) {
            throw new Error("Must specify 'stepDelay' period between pre and post");
        }
        if (!testInfo.steps) {
            throw new Error("Must specify 'steps' to take asynchronously");
        }
        // Create a wrapper around the test method so we can do test initilization and cleanup.
        var testMethod = function (assert) {
            var done = assert.async();
            // Save off the instance of the currently running suite.
            TestClass.currentTestClass = _this;
            // Run the test.
            try {
                _this._testStarting();
                var steps = testInfo.steps;
                var trigger = function () {
                    if (steps.length) {
                        var step = steps.shift();
                        // The callback which activates the next test step. 
                        var nextTestStepTrigger = function () {
                            setTimeout(function () {
                                trigger();
                            }, testInfo.stepDelay);
                        };
                        // There 2 types of test steps - simple and polling.
                        // Upon completion of the simple test step the next test step will be called.
                        // In case of polling test step the next test step is passed to the polling test step, and
                        // it is responsibility of the polling test step to call the next test step.
                        try {
                            if (step[TestClass.isPollingStepFlag]) {
                                step.call(_this, nextTestStepTrigger);
                            }
                            else {
                                step.call(_this);
                                nextTestStepTrigger.call(_this);
                            }
                        }
                        catch (e) {
                            _this._testCompleted();
                            Assert.ok(false, e.toString());
                            // done is QUnit callback indicating the end of the test
                            done();
                            return;
                        }
                    }
                    else {
                        _this._testCompleted();
                        // done is QUnit callback indicating the end of the test
                        done();
                    }
                };
                trigger();
            }
            catch (ex) {
                Assert.ok(false, "Unexpected Exception: " + ex);
                _this._testCompleted(true);
                // done is QUnit callback indicating the end of the test
                done();
            }
        };
        // Register the test with QUnit
        QUnit.test(testInfo.name, testMethod);
    };
    /** Register a Javascript unit testcase. */
    TestClass.prototype.testCase = function (testInfo) {
        var _this = this;
        if (!testInfo.name) {
            throw new Error("Must specify name in testInfo context in registerTestcase call");
        }
        if (!testInfo.test) {
            throw new Error("Must specify 'test' method in testInfo context in registerTestcase call");
        }
        // Create a wrapper around the test method so we can do test initilization and cleanup.
        var testMethod = function () {
            // Save off the instance of the currently running suite.
            TestClass.currentTestClass = _this;
            // Run the test.
            try {
                _this._testStarting();
                testInfo.test.call(_this);
                _this._testCompleted();
            }
            catch (ex) {
                Assert.ok(false, "Unexpected Exception: " + ex);
                _this._testCompleted(true);
            }
        };
        // Register the test with QUnit
        test(testInfo.name, testMethod);
    };
    /** Called when the test is starting. */
    TestClass.prototype._testStarting = function () {
        // Initialize the sandbox similar to what is done in sinon.js "test()" override. See note on class.
        var config = sinon.getConfig(sinon.config);
        config.useFakeTimers = this.useFakeTimers;
        config.useFakeServer = this.useFakeServer;
        config.injectInto = config.injectIntoThis && this || config.injectInto;
        this.sandbox = sinon.sandbox.create(config);
        this.server = this.sandbox.server;
        // Allow the derived class to perform test initialization.
        this.testInitialize();
    };
    /** Called when the test is completed. */
    TestClass.prototype._testCompleted = function (failed) {
        if (failed) {
            // Just cleanup the sandbox since the test has already failed.
            this.sandbox.restore();
        }
        else {
            // Verify the sandbox and restore.
            this.sandbox.verifyAndRestore();
        }
        this.testCleanup();
        // Clear the instance of the currently running suite.
        TestClass.currentTestClass = null;
    };
    TestClass.prototype.spy = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return null;
    };
    TestClass.prototype.stub = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return null;
    };
    /** Creates a mock for the provided object.Does not change the object, but returns a mock object to set expectations on the object's methods. */
    TestClass.prototype.mock = function (object) { return null; };
    /**** end: Sinon methods and properties ***/
    /** Sends a JSON response to the provided request.
     * @param request The request to respond to.
     * @param data Data to respond with.
     * @param errorCode Optional error code to send with the request, default is 200
    */
    TestClass.prototype.sendJsonResponse = function (request, data, errorCode) {
        if (errorCode === undefined) {
            errorCode = 200;
        }
        request.respond(errorCode, { "Content-Type": "application/json" }, JSON.stringify(data));
    };
    TestClass.prototype.setUserAgent = function (userAgent) {
        Object.defineProperty(window.navigator, 'userAgent', {
            configurable: true,
            get: function () {
                return userAgent;
            }
        });
    };
    TestClass.isPollingStepFlag = "isPollingStep";
    return TestClass;
}());
// Configure Sinon
sinon.assert.fail = function (msg) {
    Assert.ok(false, msg);
};
sinon.assert.pass = function (assertion) {
    Assert.ok(assertion, "sinon assert");
};
sinon.config = {
    injectIntoThis: true,
    injectInto: null,
    properties: ["spy", "stub", "mock", "clock", "sandbox"],
    useFakeTimers: true,
    useFakeServer: true
};
define("ajaxRecord", ["require", "exports", "applicationinsights-common"], function (require, exports, applicationinsights_common_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var XHRMonitoringState = /** @class */ (function () {
        function XHRMonitoringState() {
            this.openDone = false;
            this.setRequestHeaderDone = false;
            this.sendDone = false;
            this.abortDone = false;
            //<summary>True, if onreadyStateChangeCallback function attached to xhr, otherwise false</summary>
            this.onreadystatechangeCallbackAttached = false;
        }
        return XHRMonitoringState;
    }());
    exports.XHRMonitoringState = XHRMonitoringState;
    var ajaxRecord = /** @class */ (function () {
        function ajaxRecord(id, logger) {
            this.completed = false;
            this.requestHeadersSize = null;
            this.ttfb = null;
            this.responseReceivingDuration = null;
            this.callbackDuration = null;
            this.ajaxTotalDuration = null;
            this.aborted = null;
            this.pageUrl = null;
            this.requestUrl = null;
            this.requestSize = 0;
            this.method = null;
            ///<summary>Returns the HTTP status code.</summary>
            this.status = null;
            //<summary>The timestamp when open method was invoked</summary>
            this.requestSentTime = null;
            //<summary>The timestamps when first byte was received</summary>
            this.responseStartedTime = null;
            //<summary>The timestamp when last byte was received</summary>
            this.responseFinishedTime = null;
            //<summary>The timestamp when onreadystatechange callback in readyState 4 finished</summary>
            this.callbackFinishedTime = null;
            //<summary>The timestamp at which ajax was ended</summary>
            this.endTime = null;
            //<summary>The original xhr onreadystatechange event</summary>
            this.originalOnreadystatechage = null;
            this.xhrMonitoringState = new XHRMonitoringState();
            //<summary>Determines whether or not JavaScript exception occured in xhr.onreadystatechange code. 1 if occured, otherwise 0.</summary>
            this.clientFailure = 0;
            this.CalculateMetrics = function () {
                var self = this;
                // round to 3 decimal points
                self.ajaxTotalDuration = Math.round(applicationinsights_common_1.DateTimeUtils.GetDuration(self.requestSentTime, self.responseFinishedTime) * 1000) / 1000;
            };
            this.id = id;
            this._logger = logger;
        }
        ajaxRecord.prototype.getAbsoluteUrl = function () {
            return this.requestUrl ? applicationinsights_common_1.UrlHelper.getAbsoluteUrl(this.requestUrl) : null;
        };
        ajaxRecord.prototype.getPathName = function () {
            return this.requestUrl ? applicationinsights_common_1.DataSanitizer.sanitizeUrl(this._logger, applicationinsights_common_1.UrlHelper.getCompleteUrl(this.method, this.requestUrl)) : null;
        };
        return ajaxRecord;
    }());
    exports.ajaxRecord = ajaxRecord;
    ;
});
define("ajaxUtils", ["require", "exports", "applicationinsights-core-js"], function (require, exports, applicationinsights_core_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var stringUtils = /** @class */ (function () {
        function stringUtils() {
        }
        stringUtils.GetLength = function (strObject) {
            var res = 0;
            if (!applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(strObject)) {
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
            if (!applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(obj)) {
                if (!applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(obj.attachEvent)) {
                    // IE before version 9                    
                    obj.attachEvent("on" + eventNameWithoutOn, handlerRef);
                    result = true;
                }
                else {
                    if (!applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(obj.addEventListener)) {
                        // all browsers except IE before version 9
                        obj.addEventListener(eventNameWithoutOn, handlerRef, false);
                        result = true;
                    }
                }
            }
            return result;
        };
        EventHelper.DetachEvent = function (obj, eventNameWithoutOn, handlerRef) {
            if (!applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(obj)) {
                if (!applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(obj.detachEvent)) {
                    obj.detachEvent("on" + eventNameWithoutOn, handlerRef);
                }
                else {
                    if (!applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(obj.removeEventListener)) {
                        obj.removeEventListener(eventNameWithoutOn, handlerRef, false);
                    }
                }
            }
        };
        return EventHelper;
    }());
    exports.EventHelper = EventHelper;
});
define("ajax", ["require", "exports", "applicationinsights-common", "applicationinsights-core-js", "ajaxRecord", "ajaxUtils"], function (require, exports, applicationinsights_common_2, applicationinsights_core_js_2, ajaxRecord_1, ajaxUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var AjaxMonitor = /** @class */ (function () {
        function AjaxMonitor() {
            this._trackAjaxAttempts = 0;
            this.identifier = "AjaxDependencyPlugin";
            this.priority = 110;
            this.currentWindowHost = window && window.location.host && window.location.host.toLowerCase();
            this.initialized = false;
        }
        ///<summary>Verifies that particalar instance of XMLHttpRequest needs to be monitored</summary>
        ///<param name="excludeAjaxDataValidation">Optional parameter. True if ajaxData must be excluded from verification</param>
        ///<returns type="bool">True if instance needs to be monitored, otherwise false</returns>
        AjaxMonitor.prototype.isMonitoredInstance = function (xhr, excludeAjaxDataValidation) {
            // checking to see that all interested functions on xhr were instrumented
            return this.initialized
                // checking on ajaxData to see that it was not removed in user code
                && (excludeAjaxDataValidation === true || !applicationinsights_core_js_2.CoreUtils.isNullOrUndefined(xhr.ajaxData))
                // check that this instance is not not used by ajax call performed inside client side monitoring to send data to collector
                && xhr[applicationinsights_common_2.DisabledPropertyName] !== true;
        };
        ///<summary>Determines whether ajax monitoring can be enabled on this document</summary>
        ///<returns>True if Ajax monitoring is supported on this page, otherwise false</returns>
        AjaxMonitor.prototype.supportsMonitoring = function () {
            var result = true;
            if (applicationinsights_core_js_2.CoreUtils.isNullOrUndefined(XMLHttpRequest) ||
                applicationinsights_core_js_2.CoreUtils.isNullOrUndefined(XMLHttpRequest.prototype) ||
                applicationinsights_core_js_2.CoreUtils.isNullOrUndefined(XMLHttpRequest.prototype.open) ||
                applicationinsights_core_js_2.CoreUtils.isNullOrUndefined(XMLHttpRequest.prototype.send) ||
                applicationinsights_core_js_2.CoreUtils.isNullOrUndefined(XMLHttpRequest.prototype.abort)) {
                result = false;
            }
            // disable in IE8 or older (https://www.w3schools.com/jsref/jsref_trim_string.asp)
            try {
                " a ".trim();
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
                    this._core.logger.throwInternal(applicationinsights_core_js_2.LoggingSeverity.CRITICAL, applicationinsights_core_js_2._InternalMessageId.FailedMonitorAjaxOpen, "Failed to monitor XMLHttpRequest.open, monitoring data for this ajax call may be incorrect.", {
                        ajaxDiagnosticsMessage: AjaxMonitor.getFailedAjaxDiagnosticsMessage(this),
                        exception: applicationinsights_common_2.Util.dump(e)
                    });
                }
                return originalOpen.apply(this, arguments);
            };
        };
        AjaxMonitor.prototype.openHandler = function (xhr, method, url, async) {
            /* todo:
            Disabling the following block of code as CV is not yet supported in 1DS for 3rd Part.
            // this format corresponds with activity logic on server-side and is required for the correct correlation
            var id = "|" + this.appInsights.context.operation.id + "." + Util.newId();
            */
            var id = applicationinsights_common_2.Util.newId();
            var ajaxData = new ajaxRecord_1.ajaxRecord(id, this._core._logger);
            ajaxData.method = method;
            ajaxData.requestUrl = url;
            ajaxData.xhrMonitoringState.openDone = true;
            xhr.ajaxData = ajaxData;
            this.attachToOnReadyStateChange(xhr);
        };
        AjaxMonitor.getFailedAjaxDiagnosticsMessage = function (xhr) {
            var result = "";
            try {
                if (!applicationinsights_core_js_2.CoreUtils.isNullOrUndefined(xhr) &&
                    !applicationinsights_core_js_2.CoreUtils.isNullOrUndefined(xhr.ajaxData) &&
                    !applicationinsights_core_js_2.CoreUtils.isNullOrUndefined(xhr.ajaxData.requestUrl)) {
                    result += "(url: '" + xhr.ajaxData.requestUrl + "')";
                }
            }
            catch (e) { }
            return result;
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
                    this._core.logger.throwInternal(applicationinsights_core_js_2.LoggingSeverity.CRITICAL, applicationinsights_core_js_2._InternalMessageId.FailedMonitorAjaxSend, "Failed to monitor XMLHttpRequest, monitoring data for this ajax call may be incorrect.", {
                        ajaxDiagnosticsMessage: AjaxMonitor.getFailedAjaxDiagnosticsMessage(this),
                        exception: applicationinsights_common_2.Util.dump(e)
                    });
                }
                return originalSend.apply(this, arguments);
            };
        };
        AjaxMonitor.prototype.sendHandler = function (xhr, content) {
            xhr.ajaxData.requestSentTime = applicationinsights_common_2.DateTimeUtils.Now();
            if (this.currentWindowHost && applicationinsights_common_2.CorrelationIdHelper.canIncludeCorrelationHeader(this._config, xhr.ajaxData.getAbsoluteUrl(), this.currentWindowHost)) {
                xhr.setRequestHeader(applicationinsights_common_2.RequestHeaders.requestIdHeader, xhr.ajaxData.id);
                var appId = this._config.appId; // Todo: also, get appId from channel as breeze returns it
                if (appId) {
                    xhr.setRequestHeader(applicationinsights_common_2.RequestHeaders.requestContextHeader, applicationinsights_common_2.RequestHeaders.requestContextAppIdFormat + appId);
                }
            }
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
                    this._core.logger.throwInternal(applicationinsights_core_js_2.LoggingSeverity.CRITICAL, applicationinsights_core_js_2._InternalMessageId.FailedMonitorAjaxAbort, "Failed to monitor XMLHttpRequest.abort, monitoring data for this ajax call may be incorrect.", {
                        ajaxDiagnosticsMessage: AjaxMonitor.getFailedAjaxDiagnosticsMessage(this),
                        exception: applicationinsights_common_2.Util.dump(e)
                    });
                }
                return originalAbort.apply(this, arguments);
            };
        };
        AjaxMonitor.prototype.attachToOnReadyStateChange = function (xhr) {
            var _this = this;
            var ajaxMonitorInstance = this;
            xhr.ajaxData.xhrMonitoringState.onreadystatechangeCallbackAttached = ajaxUtils_1.EventHelper.AttachEvent(xhr, "readystatechange", function () {
                try {
                    if (ajaxMonitorInstance.isMonitoredInstance(xhr)) {
                        if (xhr.readyState === 4) {
                            ajaxMonitorInstance.onAjaxComplete(xhr);
                        }
                    }
                }
                catch (e) {
                    var exceptionText = applicationinsights_common_2.Util.dump(e);
                    // ignore messages with c00c023f, as this a known IE9 XHR abort issue
                    if (!exceptionText || exceptionText.toLowerCase().indexOf("c00c023f") == -1) {
                        _this._core.logger.throwInternal(applicationinsights_core_js_2.LoggingSeverity.CRITICAL, applicationinsights_core_js_2._InternalMessageId.FailedMonitorAjaxRSC, "Failed to monitor XMLHttpRequest 'readystatechange' event handler, monitoring data for this ajax call may be incorrect.", {
                            ajaxDiagnosticsMessage: AjaxMonitor.getFailedAjaxDiagnosticsMessage(xhr),
                            exception: applicationinsights_common_2.Util.dump(e)
                        });
                    }
                }
            });
        };
        AjaxMonitor.prototype.onAjaxComplete = function (xhr) {
            xhr.ajaxData.responseFinishedTime = applicationinsights_common_2.DateTimeUtils.Now();
            xhr.ajaxData.status = xhr.status;
            xhr.ajaxData.CalculateMetrics();
            if (xhr.ajaxData.ajaxTotalDuration < 0) {
                this._core.logger.throwInternal(applicationinsights_core_js_2.LoggingSeverity.WARNING, applicationinsights_core_js_2._InternalMessageId.FailedMonitorAjaxDur, "Failed to calculate the duration of the ajax call, monitoring data for this ajax call won't be sent.", {
                    ajaxDiagnosticsMessage: AjaxMonitor.getFailedAjaxDiagnosticsMessage(xhr),
                    requestSentTime: xhr.ajaxData.requestSentTime,
                    responseFinishedTime: xhr.ajaxData.responseFinishedTime
                });
            }
            else {
                var dependency = new applicationinsights_common_2.RemoteDependencyData(this._core._logger, xhr.ajaxData.id, xhr.ajaxData.getAbsoluteUrl(), xhr.ajaxData.getPathName(), xhr.ajaxData.ajaxTotalDuration, (+(xhr.ajaxData.status)) >= 200 && (+(xhr.ajaxData.status)) < 400, +xhr.ajaxData.status, xhr.ajaxData.method);
                // enrich dependency target with correlation context from the server
                var correlationContext = this.getCorrelationContext(xhr);
                if (correlationContext) {
                    dependency.target = dependency.target + " | " + correlationContext;
                }
                this.trackDependencyData(dependency);
                xhr.ajaxData = null;
            }
        };
        AjaxMonitor.prototype.getCorrelationContext = function (xhr) {
            try {
                var responseHeadersString = xhr.getAllResponseHeaders();
                if (responseHeadersString !== null) {
                    var index = responseHeadersString.toLowerCase().indexOf(applicationinsights_common_2.RequestHeaders.requestContextHeaderLowerCase);
                    if (index !== -1) {
                        var responseHeader = xhr.getResponseHeader(applicationinsights_common_2.RequestHeaders.requestContextHeader);
                        return applicationinsights_common_2.CorrelationIdHelper.getCorrelationContext(responseHeader);
                    }
                }
            }
            catch (e) {
                this._core.logger.throwInternal(applicationinsights_core_js_2.LoggingSeverity.WARNING, applicationinsights_core_js_2._InternalMessageId.FailedMonitorAjaxGetCorrelationHeader, "Failed to get Request-Context correlation header as it may be not included in the response or not accessible.", {
                    ajaxDiagnosticsMessage: AjaxMonitor.getFailedAjaxDiagnosticsMessage(xhr),
                    exception: applicationinsights_common_2.Util.dump(e)
                });
            }
        };
        /**
            * Logs dependency call
            * @param dependencyData dependency data object
            */
        AjaxMonitor.prototype.trackDependencyData = function (dependency, properties, systemProperties) {
            if (this._config.maxAjaxCallsPerView === -1 || this._trackAjaxAttempts < this._config.maxAjaxCallsPerView) {
                var item = applicationinsights_common_2.TelemetryItemCreator.create(dependency, applicationinsights_common_2.RemoteDependencyData.dataType, applicationinsights_common_2.RemoteDependencyData.envelopeType, this._core._logger, properties, systemProperties);
                this._core.track(item);
            }
            else if (this._trackAjaxAttempts === this._config.maxAjaxCallsPerView) {
                this._core.logger.throwInternal(applicationinsights_core_js_2.LoggingSeverity.CRITICAL, applicationinsights_core_js_2._InternalMessageId.MaxAjaxPerPVExceeded, "Maximum ajax per page view limit reached, ajax monitoring is paused until the next trackPageView(). In order to increase the limit set the maxAjaxCallsPerView configuration parameter.", true);
            }
            ++this._trackAjaxAttempts;
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
        AjaxMonitor.prototype.initialize = function (config, core, extensions) {
            if (!this.initialized) {
                this._core = core;
                config.extensionConfig = config.extensionConfig ? config.extensionConfig : {};
                var c = config.extensionConfig[this.identifier] ? config.extensionConfig[this.identifier] : {};
                this._config = {
                    maxAjaxCallsPerView: !isNaN(c.maxAjaxCallsPerView) ? c.maxAjaxCallsPerView : 500,
                    disableAjaxTracking: applicationinsights_common_2.Util.stringToBoolOrDefault(c.disableAjaxTracking),
                    disableCorrelationHeaders: applicationinsights_common_2.Util.stringToBoolOrDefault(c.disableCorrelationHeaders),
                    correlationHeaderExcludedDomains: c.correlationHeaderExcludedDomains || [
                        "*.blob.core.windows.net",
                        "*.blob.core.chinacloudapi.cn",
                        "*.blob.core.cloudapi.de",
                        "*.blob.core.usgovcloudapi.net"
                    ],
                    appId: c.appId,
                    enableCorsCorrelation: applicationinsights_common_2.Util.stringToBoolOrDefault(c.enableCorsCorrelation)
                };
                if (this.supportsMonitoring() && !this._config.disableAjaxTracking) {
                    this.instrumentOpen();
                    this.instrumentSend();
                    this.instrumentAbort();
                    this.initialized = true;
                }
            }
        };
        return AjaxMonitor;
    }());
    exports.AjaxMonitor = AjaxMonitor;
});
define("Tests/Selenium/ajax.tests", ["require", "exports", "ajax", "applicationinsights-core-js"], function (require, exports, ajax_1, applicationinsights_core_js_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var AjaxTests = /** @class */ (function (_super) {
        __extends(AjaxTests, _super);
        function AjaxTests() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.appInsightsMock = {
                trackDependency: function (id, method, absoluteUrl, isAsync, totalTime, success) { },
                trackDependencyData: function (dependency) { },
                context: {
                    operation: {
                        id: "asdf"
                    },
                    appId: function () { return "someid"; }
                },
                config: {
                    disableCorrelationHeaders: false,
                    enableCorsCorrelation: false
                }
            };
            return _this;
        }
        AjaxTests.prototype.testInitialize = function () {
            this.trackDependencySpy = this.sandbox.spy(this.appInsightsMock, "trackDependencyData");
            this.trackDependencySpy.reset();
            var xhr = sinon.useFakeXMLHttpRequest();
        };
        AjaxTests.prototype.testCleanup = function () {
        };
        AjaxTests.prototype.registerTests = function () {
            var _this = this;
            this.testCase({
                name: "Ajax: xhr.open gets instrumented",
                test: function () {
                    var ajaxMonitor = new ajax_1.AjaxMonitor();
                    var appInsightsCore = new applicationinsights_core_js_3.AppInsightsCore();
                    var coreConfig = { instrumentationKey: "instrumentationKey", extensionConfig: { "AjaxPlugin": {} } };
                    appInsightsCore.initialize(coreConfig, [ajaxMonitor, new TestChannelPlugin()]);
                    // act
                    var xhr = new XMLHttpRequest();
                    xhr.open("GET", "http://microsoft.com");
                    // assert
                    var ajaxData = xhr.ajaxData;
                    Assert.equal("http://microsoft.com", ajaxData.requestUrl, "RequestUrl is collected correctly");
                }
            });
            this.testCase({
                name: "Ajax: successful request, ajax monitor doesn't change payload",
                test: function () {
                    var callback = _this.sandbox.spy();
                    var ajaxMonitor = new ajax_1.AjaxMonitor();
                    var appInsightsCore = new applicationinsights_core_js_3.AppInsightsCore();
                    var coreConfig = { instrumentationKey: "instrumentationKey", extensionConfig: { "AjaxPlugin": {} } };
                    appInsightsCore.initialize(coreConfig, [ajaxMonitor, new TestChannelPlugin()]);
                    // Act
                    var xhr = new XMLHttpRequest();
                    xhr.onload = callback;
                    xhr.open("GET", "/bla");
                    xhr.send();
                    // Emulate response
                    xhr.respond(200, { "Content-Type": "application/json" }, "bla");
                    Assert.ok(ajaxMonitor._trackAjaxAttempts === 1, "TrackAjax is called");
                    // Assert
                    var result = callback.args[0][0].target;
                    Assert.ok(callback.called, "Ajax callback is called");
                    Assert.equal("bla", result.responseText, "Expected result match");
                    Assert.equal(200, result.status, "Expected 200 response code");
                    Assert.equal(4, xhr.readyState, "Expected readyState is 4 after request is finished");
                }
            });
            // Todo: uncomment tests
            // this.testCase({
            //     name: "Ajax: custom onreadystatechange gets called",
            //     test: () => {
            //         var onreadystatechangeSpy = this.sandbox.spy();
            //         var ajax = new AjaxMonitor();
            //         // Act
            //         var xhr = new XMLHttpRequest();
            //         xhr.onreadystatechange = onreadystatechangeSpy;
            //         xhr.open("GET", "/bla");
            //         xhr.send();
            //         Assert.ok(!this.trackDependencySpy.called, "TrackAjax should not be called yet");
            //         // Emulate response                
            //         (<any>xhr).respond();
            //         // Assert
            //         Assert.ok(this.trackDependencySpy.called, "TrackAjax is called");
            //         Assert.ok(onreadystatechangeSpy.called, "custom onreadystatechange should be called");
            //     }
            // });
            // this.testCase({
            //     name: "Ajax: 200 means success",
            //     test: () => {
            //         var ajax = new AjaxMonitor();
            //         // Act
            //         var xhr = new XMLHttpRequest();
            //         xhr.open("GET", "/bla");
            //         xhr.send();
            //         // Emulate response                
            //         (<any>xhr).respond(200, {}, "");
            //         // Assert
            //         Assert.equal(true, this.trackDependencySpy.args[0][0].success, "TrackAjax should receive true as a 'success' argument");
            //     }
            // });
            // this.testCase({
            //     name: "Ajax: non 200 means failure",
            //     test: () => {
            //         var ajax = new AjaxMonitor();
            //         // Act
            //         var xhr = new XMLHttpRequest();
            //         xhr.open("GET", "/bla");
            //         xhr.send();
            //         // Emulate response                
            //         (<any>xhr).respond(404, {}, "");
            //         // Assert
            //         Assert.equal(false, this.trackDependencySpy.args[0][0].success, "TrackAjax should receive false as a 'success' argument");
            //     }
            // });
            // [200, 201, 202, 203, 204, 301, 302, 303, 304].forEach((responseCode) => {
            //     this.testCase({
            //         name: "Ajax: test success http response code: " + responseCode,
            //         test: () => {
            //             this.testAjaxSuccess(responseCode, true);
            //         }
            //     })
            // });
            // [400, 401, 402, 403, 404, 500, 501].forEach((responseCode) => {
            //     this.testCase({
            //         name: "Ajax: test failure http response code: " + responseCode,
            //         test: () => {
            //             this.testAjaxSuccess(responseCode, false);
            //         }
            //     })
            // });
            // this.testCase({
            //     name: "Ajax: overriding ready state change handlers in all possible ways",
            //     test: () => {
            //         var ajax = new AjaxMonitor();
            //         var cb1 = this.sandbox.spy();
            //         var cb2 = this.sandbox.spy();
            //         var cb3 = this.sandbox.spy();
            //         var cb4 = this.sandbox.spy();
            //         var cb5 = this.sandbox.spy();
            //         var cb6 = this.sandbox.spy();
            //         var cb7 = this.sandbox.spy();
            //         // Act
            //         var xhr = new XMLHttpRequest();
            //         xhr.addEventListener("readystatechange", cb1);
            //         xhr.addEventListener("readystatechange", cb2);
            //         xhr.open("GET", "/bla");
            //         xhr.onreadystatechange = cb3;
            //         xhr.addEventListener("readystatechange", cb4);
            //         xhr.addEventListener("readystatechange", cb5);
            //         xhr.send();
            //         xhr.addEventListener("readystatechange", cb6);
            //         xhr.addEventListener("readystatechange", cb7);
            //         Assert.ok(!this.trackDependencySpy.called, "TrackAjax should not be called yet");
            //         // Emulate response                
            //         (<any>xhr).respond(404, {}, "");
            //         // Assert
            //         Assert.ok(this.trackDependencySpy.calledOnce, "TrackAjax should be called");
            //         Assert.ok(cb1.called, "callback 1 should be called");
            //         Assert.ok(cb2.called, "callback 2 should be called");
            //         Assert.ok(cb3.called, "callback 3 should be called");
            //         Assert.ok(cb4.called, "callback 4 should be called");
            //         Assert.ok(cb5.called, "callback 5 should be called");
            //         Assert.ok(cb6.called, "callback 6 should be called");
            //         Assert.ok(cb7.called, "callback 7 should be called");
            //     }
            // });
            // this.testCase({
            //     name: "Ajax: test ajax duration is calculated correctly",
            //     test: () => {
            //         var initialPerformance = window.performance;
            //         try {
            //             // Mocking window performance (sinon doesn't have it).
            //             // tick() is similar to sinon's clock.tick()
            //             (<any>window).performance = <any>{
            //                 current: 0,
            //                 now: function () {
            //                     return this.current;
            //                 },
            //                 tick: function (ms: number) {
            //                     this.current += ms;
            //                 },
            //                 timing: initialPerformance.timing
            //             };
            //             var ajax = new AjaxMonitor();
            //             // tick to set the initial time be non zero
            //             (<any>window.performance).tick(23);
            //             // Act
            //             var xhr = new XMLHttpRequest();
            //             var clock = this.clock;
            //             var expectedResponseDuration = 50;
            //             xhr.onreadystatechange = () => {
            //                 if (xhr.readyState == 3) {
            //                     (<any>window.performance).tick(expectedResponseDuration);
            //                 }
            //             }
            //             xhr.open("GET", "/bla");
            //             xhr.send();
            //             // Emulate response                
            //             (<any>xhr).respond(404, {}, "");
            //             // Assert
            //             Assert.ok(this.trackDependencySpy.calledOnce, "TrackAjax should be called");
            //             Assert.equal("00:00:00.050", this.trackDependencySpy.args[0][0].duration, "Ajax duration should match expected duration");
            //         } finally {
            //             (<any>window.performance).performance = initialPerformance;
            //         }
            //     }
            // });
            // this.testCase({
            //     name: "Ajax: 2nd invokation of xhr.send doesn't cause send wrapper to execute 2nd time",
            //     test: () => {
            //         var ajax = new AjaxMonitor();
            //         var spy = this.sandbox.spy(ajax, "sendHandler");
            //         // Act
            //         var xhr = new XMLHttpRequest();
            //         xhr.open("GET", "/bla");
            //         xhr.send();
            //         try {
            //             xhr.send();
            //         } catch (e) { }
            //         // Assert
            //         Assert.ok(spy.calledOnce, "sendPrefixInstrumentor should be called only once");
            //     }
            // });
            // this.testCase({
            //     name: "Ajax: 2 invokation of xhr.open() doesn't cause send wrapper to execute 2nd time",
            //     test: () => {
            //         var ajax = new AjaxMonitor();
            //         var spy = this.sandbox.spy(ajax, "openHandler");
            //         // Act
            //         var xhr = new XMLHttpRequest();
            //         xhr.open("GET", "/bla");
            //         try {
            //             xhr.open("GET", "/bla");
            //         } catch (e) { }
            //         // Assert
            //         Assert.ok(spy.calledOnce, "sendPrefixInstrumentor should be called only once");
            //     }
            // });
        };
        AjaxTests.prototype.testAjaxSuccess = function (responseCode, success) {
            var ajax = new ajax_1.AjaxMonitor();
            // Act
            var xhr = new XMLHttpRequest();
            xhr.open("GET", "/bla");
            xhr.send();
            // Emulate response                
            xhr.respond(responseCode, {}, "");
            // Assert
            Assert.equal(success, this.trackDependencySpy.args[0][0].success, "TrackAjax should receive " + success + " as a 'success' argument");
        };
        return AjaxTests;
    }(TestClass));
    exports.AjaxTests = AjaxTests;
    var TestChannelPlugin = /** @class */ (function () {
        function TestChannelPlugin() {
            this.isFlushInvoked = false;
            this.isTearDownInvoked = false;
            this.isResumeInvoked = false;
            this.isPauseInvoked = false;
            this.identifier = "Sender";
            this.priority = 201;
            this.initialize = function (config) {
            };
            this.processTelemetry = this._processTelemetry.bind(this);
        }
        TestChannelPlugin.prototype.pause = function () {
            this.isPauseInvoked = true;
        };
        TestChannelPlugin.prototype.resume = function () {
            this.isResumeInvoked = true;
        };
        TestChannelPlugin.prototype.teardown = function () {
            this.isTearDownInvoked = true;
        };
        TestChannelPlugin.prototype.flush = function (async, callBack) {
            this.isFlushInvoked = true;
            if (callBack) {
                callBack();
            }
        };
        TestChannelPlugin.prototype.setNextPlugin = function (next) {
            // no next setup
        };
        TestChannelPlugin.prototype._processTelemetry = function (env) {
        };
        return TestChannelPlugin;
    }());
    var TestAjaxMonitor = /** @class */ (function (_super) {
        __extends(TestAjaxMonitor, _super);
        function TestAjaxMonitor() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return TestAjaxMonitor;
    }(ajax_1.AjaxMonitor));
});
define("Tests/Selenium/dependencies.tests", ["require", "exports", "Tests/Selenium/ajax.tests"], function (require, exports, ajax_tests_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function runTests() {
        new ajax_tests_1.AjaxTests().registerTests();
    }
    exports.runTests = runTests;
});
//# sourceMappingURL=dependencies.tests.js.map