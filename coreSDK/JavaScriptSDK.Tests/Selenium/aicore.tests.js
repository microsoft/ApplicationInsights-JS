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
/// <reference path="../External/qunit.d.ts" />
/// <reference path="TestClass.ts" />
var PollingAssert = /** @class */ (function () {
    function PollingAssert() {
    }
    /**
    * Starts polling assertion function for a period of time after which it's considered failed.
    * @param {() => boolean} assertionFunctionReturnsBoolean - funciton returning true if condition passes and false if condition fails. Assertion will be done on this function's result.
    * @param {string} assertDescription - message shown with the assertion
    * @param {number} timeoutSeconds - timeout in seconds after which assertion fails
    * @param {number} pollIntervalMs - polling interval in milliseconds
    * @returns {(nextTestStep) => void} callback which will be invoked by the TestClass
    */
    PollingAssert.createPollingAssert = function (assertionFunctionReturnsBoolean, assertDescription, timeoutSeconds, pollIntervalMs) {
        var _this = this;
        if (timeoutSeconds === void 0) { timeoutSeconds = 30; }
        if (pollIntervalMs === void 0) { pollIntervalMs = 500; }
        var pollingAssert = function (nextTestStep) {
            var timeout = new Date(new Date().getTime() + timeoutSeconds * 1000);
            var polling = function () {
                if (assertionFunctionReturnsBoolean.apply(_this)) {
                    Assert.ok(true, assertDescription);
                    nextTestStep();
                }
                else if (timeout < new Date()) {
                    Assert.ok(false, "assert didn't succeed for " + timeout + " seconds: " + assertDescription);
                    nextTestStep();
                }
                else {
                    setTimeout(polling, pollIntervalMs);
                }
            };
            setTimeout(polling, pollIntervalMs);
        };
        pollingAssert[TestClass.isPollingStepFlag] = true;
        return pollingAssert;
    };
    return PollingAssert;
}());
/// <reference path="../External/sinon.d.ts" />
/// <reference path="../External/qunit.d.ts" />
/// <reference path="Assert.ts" />
/// <reference path="PollingAssert.ts" />
/// <reference path="TestClass.ts" />
/// <reference path="TestCase.ts" /> 
define("JavaScriptSDK.Interfaces/ITelemetryItem", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("JavaScriptSDK.Interfaces/IConfiguration", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
/// <reference path="./ITelemetryItem.ts" />
/// <reference path="./IConfiguration.ts" />
define("JavaScriptSDK.Interfaces/ITelemetryPlugin", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("JavaScriptSDK.Interfaces/IChannelControls", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MinChannelPriorty = 100;
});
define("JavaScriptSDK.Interfaces/IAppInsightsCore", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("JavaScriptSDK/CoreUtils", ["require", "exports"], function (require, exports) {
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
});
define("JavaScriptSDK/AppInsightsCore", ["require", "exports", "JavaScriptSDK.Interfaces/IChannelControls", "JavaScriptSDK/CoreUtils"], function (require, exports, IChannelControls_1, CoreUtils_1) {
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
                throw Error("At least one sender channel is required");
            }
            if (!config || config.endpointUrl === null || config.instrumentationKey === null) {
                // throw error
            }
            this.config = config;
            // Initial validation
            extensions.forEach(function (extension) {
                if (extension.setNextPlugin === null || extension.processTelemetry === null || extension.identifier === null) {
                    // Todo: throw detailed error
                    throw Error("Invalid state");
                }
            });
            this._extensions = extensions.sort(function (extA, extB) {
                var typeExtA = typeof extA.processTelemetry;
                var typeExtB = typeof extB.processTelemetry;
                if (extA && typeExtA === 'function' && typeExtB === 'function') {
                    return extA.priority > extB.priority ? 1 : -1;
                }
                if (extA &&
                    typeof typeExtA === 'function' &&
                    typeof typeExtB !== 'function') {
                    // keep non telemetryplugin specific extensions at start
                    return 1;
                }
                if (extA &&
                    typeof typeExtA !== 'function' &&
                    typeof typeExtB === 'function') {
                    return -1;
                }
            });
            for (var idx = 0; idx < this._extensions.length - 1; idx++) {
                if (this._extensions[idx] && typeof this._extensions[idx].processTelemetry !== 'function') {
                    // these are initialized only
                    continue;
                }
                this._extensions[idx].setNextPlugin(this._extensions[idx + 1]); // set next plugin
            }
            this._extensions.forEach(function (ext) { return ext.initialize(_this.config, _this, _this._extensions); }); // initialize
            // get defaults for configuration values as applicable
        };
        AppInsightsCore.prototype.getTransmissionControl = function () {
            for (var i = 0; i < this._extensions.length; i++) {
                var priority = this._extensions[i].priority;
                if (CoreUtils_1.CoreUtils.isNullOrUndefined(priority) && priority >= IChannelControls_1.MinChannelPriorty) {
                    var firstChannel = this._extensions[i];
                    return firstChannel; // return first channel in list
                }
            }
            return null;
        };
        AppInsightsCore.prototype.track = function (telemetryItem) {
            if (telemetryItem === null) {
                // throw error
                throw Error("Invalid telemetry item");
            }
            // do base validation before sending it through the pipeline        
            this._validateTelmetryItem(telemetryItem);
            // invoke any common telemetry processors before sending through pipeline
            var i = 0;
            while (true) {
                if (this._extensions[i].processTelemetry) {
                    this._extensions[i].processTelemetry(telemetryItem); // pass on to first extension
                    break;
                }
            }
        };
        AppInsightsCore.prototype._validateTelmetryItem = function (telemetryItem) {
            if (CoreUtils_1.CoreUtils.isNullOrUndefined(telemetryItem.name)) {
                throw Error("telemetry name required");
            }
            if (CoreUtils_1.CoreUtils.isNullOrUndefined(telemetryItem.timestamp)) {
                throw Error("telemetry timestamp required");
            }
            if (CoreUtils_1.CoreUtils.isNullOrUndefined(telemetryItem.baseType)) {
                throw Error("telemetry baseType required");
            }
            if (CoreUtils_1.CoreUtils.isNullOrUndefined(telemetryItem.instrumentationKey)) {
                throw Error("telemetry instrumentationKey required");
            }
        };
        return AppInsightsCore;
    }());
    exports.AppInsightsCore = AppInsightsCore;
});
define("applicationinsights-core-js", ["require", "exports", "JavaScriptSDK.Interfaces/IChannelControls", "JavaScriptSDK/AppInsightsCore"], function (require, exports, IChannelControls_2, AppInsightsCore_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MinChannelPriorty = IChannelControls_2.MinChannelPriorty;
    exports.AppInsightsCore = AppInsightsCore_1.AppInsightsCore;
});
/// <reference path="../TestFramework/Common.ts" />
/// <reference path="../../JavaScriptSDK/AppInsightsCore.ts" />
/// <reference path="../../applicationinsights-core-js.ts" />
define("JavaScriptSDK.Tests/Selenium/ApplicationInsightsCore.Tests", ["require", "exports", "JavaScriptSDK/AppInsightsCore"], function (require, exports, AppInsightsCore_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ApplicationInsightsCoreTests = /** @class */ (function (_super) {
        __extends(ApplicationInsightsCoreTests, _super);
        function ApplicationInsightsCoreTests() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ApplicationInsightsCoreTests.prototype.testInitialize = function () {
            _super.prototype.testInitialize.call(this);
        };
        ApplicationInsightsCoreTests.prototype.testCleanup = function () {
            _super.prototype.testCleanup.call(this);
        };
        ApplicationInsightsCoreTests.prototype.registerTests = function () {
            this.testCase({
                name: "ApplicationInsightsCore: Initialization validates input",
                test: function () {
                    var samplingPlugin = new TestSamplingPlugin();
                    var appInsightsCore = new AppInsightsCore_2.AppInsightsCore();
                    try {
                        appInsightsCore.initialize(null, [samplingPlugin]);
                    }
                    catch (error) {
                        Assert.ok(true, "Validates configuration");
                    }
                    var config2 = {
                        endpointUrl: "https://dc.services.visualstudio.com/v2/track",
                        instrumentationKey: "40ed4f60-2a2f-4f94-a617-22b20a520864",
                        extensions: {}
                    };
                    try {
                        appInsightsCore.initialize(config2, null);
                    }
                    catch (error) {
                        Assert.ok(true, "Validates extensions are provided");
                    }
                }
            });
            this.testCase({
                name: "ApplicationInsightsCore: Initialization initializes setNextPlugin",
                test: function () {
                    var samplingPlugin = new TestSamplingPlugin();
                    samplingPlugin.priority = 20;
                    var channelPlugin = new TestSamplingPlugin();
                    channelPlugin.priority = 120;
                    // Assert prior to initialize
                    Assert.ok(!samplingPlugin.nexttPlugin, "Not setup prior to pipeline initialization");
                    var appInsightsCore = new AppInsightsCore_2.AppInsightsCore();
                    appInsightsCore.initialize({ instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41" }, [samplingPlugin, channelPlugin]);
                    Assert.ok(!!samplingPlugin.nexttPlugin, "Not setup prior to pipeline initialization");
                }
            });
        };
        return ApplicationInsightsCoreTests;
    }(TestClass));
    exports.ApplicationInsightsCoreTests = ApplicationInsightsCoreTests;
    var TestSamplingPlugin = /** @class */ (function () {
        function TestSamplingPlugin() {
            this.identifier = "AzureSamplingPlugin";
            this.priority = 5;
            this.processTelemetry = this._processTelemetry.bind(this);
            this.initialize = this._start.bind(this);
            this.setNextPlugin = this._setNextPlugin.bind(this);
        }
        TestSamplingPlugin.prototype._processTelemetry = function (env) {
            if (!env) {
                throw Error("Invalid telemetry object");
            }
            if (!env.domainProperties) {
                throw Error("Need domain properties specified");
            }
        };
        TestSamplingPlugin.prototype._start = function (config) {
            if (!config) {
                throw Error("required configuration missing");
            }
            var pluginConfig = config.extensions ? config.extensions[this.identifier] : null;
            this.samplingPercentage = pluginConfig ? pluginConfig.samplingPercentage : 100;
        };
        TestSamplingPlugin.prototype._setNextPlugin = function (next) {
            this.nexttPlugin = next;
        };
        return TestSamplingPlugin;
    }());
});
define("JavaScriptSDK.Tests/Selenium/aitests", ["require", "exports", "JavaScriptSDK.Tests/Selenium/ApplicationInsightsCore.Tests"], function (require, exports, ApplicationInsightsCore_Tests_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function runTests() {
        new ApplicationInsightsCore_Tests_1.ApplicationInsightsCoreTests().registerTests();
    }
    exports.runTests = runTests;
});
//# sourceMappingURL=aicore.tests.js.map