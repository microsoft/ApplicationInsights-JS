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
define("Interfaces", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("SendBuffer", ["require", "exports", "applicationinsights-common"], function (require, exports, applicationinsights_common_1) {
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
});
define("EnvelopeCreator", ["require", "exports", "applicationinsights-common"], function (require, exports, applicationinsights_common_2) {
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
    var EnvelopeCreator = /** @class */ (function () {
        function EnvelopeCreator() {
        }
        EnvelopeCreator.extractMeasurements = function (properties) {
            var customMeasurements = null;
            for (var key in properties) {
                if (properties.hasOwnProperty(key)) {
                    var value = properties[key];
                    if (value instanceof Number) {
                        if (!customMeasurements) {
                            customMeasurements = {};
                        }
                        customMeasurements[key] = value;
                    }
                }
            }
            return customMeasurements;
        };
        EnvelopeCreator.createEnvelope = function (envelopeType, telemetryItem, data) {
            var envelope = new applicationinsights_common_2.Envelope(data, envelopeType);
            envelope.iKey = telemetryItem.instrumentationKey;
            var iKeyNoDashes = telemetryItem.instrumentationKey.replace(/-/g, "");
            envelope.name = envelope.name.replace("{0}", iKeyNoDashes);
            // loop through the envelope systemProperties and pick out the ones that should go in tags
            for (var key in telemetryItem.sytemProperties) {
                if (telemetryItem.sytemProperties.hasOwnProperty(key)) {
                    if (exports.ContextTagKeys.indexOf(key) >= 0) {
                        envelope.tags[key] = telemetryItem.sytemProperties[key];
                    }
                }
            }
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
            var customMeasurements = EnvelopeCreator.extractMeasurements(telemetryItem.customProperties);
            var id = telemetryItem.domainProperties["id"];
            var absoluteUrl = telemetryItem.domainProperties["absoluteUrl"];
            var command = telemetryItem.domainProperties["command"];
            var totalTime = telemetryItem.domainProperties["totalTime"];
            var success = telemetryItem.domainProperties["success"];
            var resultCode = telemetryItem.domainProperties["resultCode"];
            var method = telemetryItem.domainProperties["method"];
            var baseData = new applicationinsights_common_2.RemoteDependencyData(id, absoluteUrl, command, totalTime, success, resultCode, method, telemetryItem.customProperties, customMeasurements);
            var data = new applicationinsights_common_2.Data(applicationinsights_common_2.RemoteDependencyData.dataType, baseData);
            return EnvelopeCreator.createEnvelope(applicationinsights_common_2.RemoteDependencyData.envelopeType, telemetryItem, data);
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
            var customMeasurements = EnvelopeCreator.extractMeasurements(telemetryItem.customProperties);
            var eventName = telemetryItem.domainProperties["name"];
            var baseData = new applicationinsights_common_2.Event(eventName, telemetryItem.customProperties, customMeasurements);
            var data = new applicationinsights_common_2.Data(applicationinsights_common_2.Event.dataType, baseData);
            return EnvelopeCreator.createEnvelope(applicationinsights_common_2.Event.envelopeType, telemetryItem, data);
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
            var customMeasurements = EnvelopeCreator.extractMeasurements(telemetryItem.customProperties);
            var exception = telemetryItem.domainProperties["exception"];
            var severityLevel = telemetryItem.domainProperties["severityLevel"];
            var baseData = new applicationinsights_common_2.Exception(exception, telemetryItem.customProperties, customMeasurements, severityLevel);
            var data = new applicationinsights_common_2.Data(applicationinsights_common_2.Exception.dataType, baseData);
            return EnvelopeCreator.createEnvelope(applicationinsights_common_2.Exception.envelopeType, telemetryItem, data);
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
            var name = telemetryItem.domainProperties["name"];
            var average = telemetryItem.domainProperties["average"];
            var sampleCount = telemetryItem.domainProperties["sampleCount"];
            var min = telemetryItem.domainProperties["min"];
            var max = telemetryItem.domainProperties["max"];
            var baseData = new applicationinsights_common_2.Metric(name, average, sampleCount, min, max, telemetryItem.customProperties);
            var data = new applicationinsights_common_2.Data(applicationinsights_common_2.Metric.dataType, baseData);
            return EnvelopeCreator.createEnvelope(applicationinsights_common_2.Metric.envelopeType, telemetryItem, data);
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
            var customMeasurements = EnvelopeCreator.extractMeasurements(telemetryItem.customProperties);
            var name = telemetryItem.domainProperties["name"];
            var url = telemetryItem.domainProperties["url"];
            var duration = telemetryItem.domainProperties["duration"];
            var baseData = new applicationinsights_common_2.PageView(name, url, duration, telemetryItem.customProperties, customMeasurements);
            var data = new applicationinsights_common_2.Data(applicationinsights_common_2.PageView.dataType, baseData);
            return EnvelopeCreator.createEnvelope(applicationinsights_common_2.PageView.envelopeType, telemetryItem, data);
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
            var customMeasurements = EnvelopeCreator.extractMeasurements(telemetryItem.customProperties);
            var name = telemetryItem.domainProperties["name"];
            var url = telemetryItem.domainProperties["url"];
            var duration = telemetryItem.domainProperties["duration"];
            var baseData = new applicationinsights_common_2.PageViewPerformance(name, url, duration, telemetryItem.customProperties, customMeasurements);
            var data = new applicationinsights_common_2.Data(applicationinsights_common_2.PageViewPerformance.dataType, baseData);
            return EnvelopeCreator.createEnvelope(applicationinsights_common_2.PageViewPerformance.envelopeType, telemetryItem, data);
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
            var message = telemetryItem.domainProperties["message"];
            var severityLevel = telemetryItem.domainProperties["severityLevel"];
            var baseData = new applicationinsights_common_2.Trace(message, telemetryItem.customProperties, severityLevel);
            var data = new applicationinsights_common_2.Data(applicationinsights_common_2.Trace.dataType, baseData);
            return EnvelopeCreator.createEnvelope(applicationinsights_common_2.Trace.envelopeType, telemetryItem, data);
        };
        TraceEnvelopeCreator.TraceEnvelopeCreator = new TraceEnvelopeCreator();
        return TraceEnvelopeCreator;
    }(EnvelopeCreator));
    exports.TraceEnvelopeCreator = TraceEnvelopeCreator;
});
define("TelemetryValidation/ITypeValidator", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("TelemetryValidation/EventValidator", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var EventValidator = /** @class */ (function () {
        function EventValidator() {
        }
        EventValidator.prototype.Validate = function (item) {
            // verify system properties has a ver field
            if (!item.sytemProperties || !item.sytemProperties["ver"]) {
                return false;
            }
            if (!item.domainProperties || !item.domainProperties["name"]) {
                return false;
            }
            return true;
        };
        EventValidator.EventValidator = new EventValidator();
        return EventValidator;
    }());
    exports.EventValidator = EventValidator;
});
define("TelemetryValidation/TraceValidator", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var TraceValidator = /** @class */ (function () {
        function TraceValidator() {
        }
        TraceValidator.prototype.Validate = function (item) {
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
            return true;
        };
        TraceValidator.TraceValidator = new TraceValidator();
        return TraceValidator;
    }());
    exports.TraceValidator = TraceValidator;
});
define("TelemetryValidation/ExceptionValidator", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ExceptionValidator = /** @class */ (function () {
        function ExceptionValidator() {
        }
        ExceptionValidator.prototype.Validate = function (item) {
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
});
define("TelemetryValidation/MetricValidator", ["require", "exports"], function (require, exports) {
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
});
define("TelemetryValidation/PageViewPerformanceValidator", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var PageViewPerformanceValidator = /** @class */ (function () {
        function PageViewPerformanceValidator() {
        }
        PageViewPerformanceValidator.prototype.Validate = function (item) {
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
            return true;
        };
        PageViewPerformanceValidator.PageViewPerformanceValidator = new PageViewPerformanceValidator();
        return PageViewPerformanceValidator;
    }());
    exports.PageViewPerformanceValidator = PageViewPerformanceValidator;
});
define("TelemetryValidation/PageViewValidator", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var PageViewValidator = /** @class */ (function () {
        function PageViewValidator() {
        }
        PageViewValidator.prototype.Validate = function (item) {
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
            return true;
        };
        PageViewValidator.PageViewValidator = new PageViewValidator();
        return PageViewValidator;
    }());
    exports.PageViewValidator = PageViewValidator;
});
define("TelemetryValidation/RemoteDepdencyValidator", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var RemoteDepdencyValidator = /** @class */ (function () {
        function RemoteDepdencyValidator() {
        }
        RemoteDepdencyValidator.prototype.Validate = function (item) {
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
            return true;
        };
        RemoteDepdencyValidator.RemoteDepdencyValidator = new RemoteDepdencyValidator();
        return RemoteDepdencyValidator;
    }());
    exports.RemoteDepdencyValidator = RemoteDepdencyValidator;
});
define("Serializer", ["require", "exports", "applicationinsights-common"], function (require, exports, applicationinsights_common_3) {
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
                applicationinsights_common_3._InternalLogging.throwInternal(applicationinsights_common_3.LoggingSeverity.CRITICAL, applicationinsights_common_3._InternalMessageId.CannotSerializeObject, "cannot serialize object because it is null or undefined", { name: name }, true);
                return output;
            }
            if (source[circularReferenceCheck]) {
                applicationinsights_common_3._InternalLogging.throwInternal(applicationinsights_common_3.LoggingSeverity.WARNING, applicationinsights_common_3._InternalMessageId.CircularReferenceDetected, "Circular reference detected while serializing object", { name: name }, true);
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
                else if (applicationinsights_common_3.Util.isArray(source)) {
                    output = Serializer._serializeArray(source, name);
                }
                else {
                    applicationinsights_common_3._InternalLogging.throwInternal(applicationinsights_common_3.LoggingSeverity.WARNING, applicationinsights_common_3._InternalMessageId.CannotSerializeObjectNonSerializable, "Attempting to serialize an object which does not implement ISerializable", { name: name }, true);
                    try {
                        // verify that the object can be stringified
                        JSON.stringify(source);
                        output = source;
                    }
                    catch (e) {
                        // if serialization fails return an empty string
                        applicationinsights_common_3._InternalLogging.throwInternal(applicationinsights_common_3.LoggingSeverity.CRITICAL, applicationinsights_common_3._InternalMessageId.CannotSerializeObject, (e && typeof e.toString === 'function') ? e.toString() : "Error serializing object", null, true);
                    }
                }
                return output;
            }
            source[circularReferenceCheck] = true;
            for (var field in source.aiDataContract) {
                var contract = source.aiDataContract[field];
                var isRequired = (typeof contract === "function") ? (contract() & applicationinsights_common_3.FieldType.Required) : (contract & applicationinsights_common_3.FieldType.Required);
                var isHidden = (typeof contract === "function") ? (contract() & applicationinsights_common_3.FieldType.Hidden) : (contract & applicationinsights_common_3.FieldType.Hidden);
                var isArray = contract & applicationinsights_common_3.FieldType.Array;
                var isPresent = source[field] !== undefined;
                var isObject = typeof source[field] === "object" && source[field] !== null;
                if (isRequired && !isPresent && !isArray) {
                    applicationinsights_common_3._InternalLogging.throwInternal(applicationinsights_common_3.LoggingSeverity.CRITICAL, applicationinsights_common_3._InternalMessageId.MissingRequiredFieldSpecification, "Missing required field specification. The field is required but not present on source", { field: field, name: name });
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
                if (!applicationinsights_common_3.Util.isArray(sources)) {
                    applicationinsights_common_3._InternalLogging.throwInternal(applicationinsights_common_3.LoggingSeverity.CRITICAL, applicationinsights_common_3._InternalMessageId.ItemNotInArray, "This field was specified as an array in the contract but the item is not an array.\r\n", { name: name }, true);
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
                        applicationinsights_common_3._InternalLogging.throwInternal(applicationinsights_common_3.LoggingSeverity.CRITICAL, output[field], null, true);
                    }
                }
            }
            return output;
        };
        return Serializer;
    }());
    exports.Serializer = Serializer;
});
define("Sender", ["require", "exports", "SendBuffer", "EnvelopeCreator", "TelemetryValidation/EventValidator", "TelemetryValidation/TraceValidator", "TelemetryValidation/ExceptionValidator", "TelemetryValidation/MetricValidator", "TelemetryValidation/PageViewPerformanceValidator", "TelemetryValidation/PageViewValidator", "TelemetryValidation/RemoteDepdencyValidator", "Serializer", "applicationinsights-common"], function (require, exports, SendBuffer_1, EnvelopeCreator_1, EventValidator_1, TraceValidator_1, ExceptionValidator_1, MetricValidator_1, PageViewPerformanceValidator_1, PageViewValidator_1, RemoteDepdencyValidator_1, Serializer_1, applicationinsights_common_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Sender = /** @class */ (function () {
        function Sender() {
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
            throw new Error("Method not implemented.");
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
            this._buffer = (applicationinsights_common_4.Util.canUseSessionStorage() && this._config.enableSessionStorageBuffer)
                ? new SendBuffer_1.SessionStorageSendBuffer(this._config) : new SendBuffer_1.ArraySendBuffer(this._config);
            if (!this._config.isBeaconApiDisabled() && applicationinsights_common_4.Util.IsBeaconApiSupported()) {
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
        Sender.prototype.processTelemetry = function (envelope) {
            try {
                // if master off switch is set, don't send any data
                if (this._config.disableTelemetry()) {
                    // Do not send/save data
                    return;
                }
                // validate input
                if (!envelope) {
                    applicationinsights_common_4._InternalLogging.throwInternal(applicationinsights_common_4.LoggingSeverity.CRITICAL, applicationinsights_common_4._InternalMessageId.CannotSendEmptyTelemetry, "Cannot send empty telemetry");
                    return;
                }
                // ensure a sender was constructed
                if (!this._sender) {
                    applicationinsights_common_4._InternalLogging.throwInternal(applicationinsights_common_4.LoggingSeverity.CRITICAL, applicationinsights_common_4._InternalMessageId.SenderNotInitialized, "Sender was not initialized");
                    return;
                }
                // first we need to validate that the envelope passed down is valid
                var isValid = Sender._validate(envelope);
                if (!isValid) {
                    applicationinsights_common_4._InternalLogging.throwInternal(applicationinsights_common_4.LoggingSeverity.CRITICAL, applicationinsights_common_4._InternalMessageId.TelemetryEnvelopeInvalid, "Invalid telemetry envelope");
                    return;
                }
                // construct an envelope that Application Insights endpoint can understand
                var aiEnvelope = Sender._constructEnvelope(envelope);
                if (!aiEnvelope) {
                    applicationinsights_common_4._InternalLogging.throwInternal(applicationinsights_common_4.LoggingSeverity.CRITICAL, applicationinsights_common_4._InternalMessageId.CreateEnvelopeError, "Unable to create an AppInsights envelope");
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
                applicationinsights_common_4._InternalLogging.throwInternal(applicationinsights_common_4.LoggingSeverity.WARNING, applicationinsights_common_4._InternalMessageId.FailedAddingTelemetryToBuffer, "Failed adding telemetry to the sender's buffer, some telemetry will be lost: " + applicationinsights_common_4.Util.getExceptionName(e), { exception: applicationinsights_common_4.Util.dump(e) });
            }
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
                        applicationinsights_common_4._InternalLogging.throwInternal(applicationinsights_common_4.LoggingSeverity.WARNING, applicationinsights_common_4._InternalMessageId.TransmissionFailed, ". " +
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
                if (!applicationinsights_common_4.Util.getIEVersion() || applicationinsights_common_4.Util.getIEVersion() > 9) {
                    applicationinsights_common_4._InternalLogging.throwInternal(applicationinsights_common_4.LoggingSeverity.CRITICAL, applicationinsights_common_4._InternalMessageId.TransmissionFailed, "Telemetry transmission failed, some telemetry will be lost: " + applicationinsights_common_4.Util.getExceptionName(e), { exception: applicationinsights_common_4.Util.dump(e) });
                }
            }
        };
        /**
         * error handler
         */
        Sender.prototype._onError = function (payload, message, event) {
            applicationinsights_common_4._InternalLogging.throwInternal(applicationinsights_common_4.LoggingSeverity.WARNING, applicationinsights_common_4._InternalMessageId.OnError, "Failed to send telemetry.", { message: message });
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
                applicationinsights_common_4._InternalLogging.throwInternal(applicationinsights_common_4.LoggingSeverity.WARNING, applicationinsights_common_4._InternalMessageId.TransmissionFailed, "Partial success. " +
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
        Sender._getDefaultAppInsightsChannelConfig = function (config, identifier) {
            var resultConfig = {};
            var pluginConfig = config.extensions[identifier];
            // set default values
            resultConfig.endpointUrl = function () { return config.endpointUrl || "https://dc.services.visualstudio.com/v2/track"; };
            resultConfig.emitLineDelimitedJson = function () { return applicationinsights_common_4.Util.stringToBoolOrDefault(pluginConfig.emitLineDelimitedJson); };
            resultConfig.maxBatchInterval = function () { return !isNaN(pluginConfig.maxBatchInterval) ? pluginConfig.maxBatchInterval : 15000; };
            resultConfig.maxBatchSizeInBytes = function () { return pluginConfig.maxBatchSizeInBytes > 0 ? pluginConfig.maxBatchSizeInBytes : 102400; }; // 100kb
            resultConfig.disableTelemetry = function () { return applicationinsights_common_4.Util.stringToBoolOrDefault(pluginConfig.disableTelemetry); };
            resultConfig.enableSessionStorageBuffer = function () { return applicationinsights_common_4.Util.stringToBoolOrDefault(pluginConfig.enableSessionStorageBuffer, true); };
            resultConfig.isRetryDisabled = function () { return applicationinsights_common_4.Util.stringToBoolOrDefault(pluginConfig.isRetryDisabled); };
            resultConfig.isBeaconApiDisabled = function () { return applicationinsights_common_4.Util.stringToBoolOrDefault(pluginConfig.isBeaconApiDisabled, true); };
            return resultConfig;
        };
        Sender._validate = function (envelope) {
            // call the appropriate Validate depending on the baseType
            switch (envelope.baseType) {
                case applicationinsights_common_4.Event.dataType:
                    return EventValidator_1.EventValidator.EventValidator.Validate(envelope);
                case applicationinsights_common_4.Trace.dataType:
                    return TraceValidator_1.TraceValidator.TraceValidator.Validate(envelope);
                case applicationinsights_common_4.Exception.dataType:
                    return ExceptionValidator_1.ExceptionValidator.ExceptionValidator.Validate(envelope);
                case applicationinsights_common_4.Metric.dataType:
                    return MetricValidator_1.MetricValidator.MetricValidator.Validate(envelope);
                case applicationinsights_common_4.PageView.dataType:
                    return PageViewValidator_1.PageViewValidator.PageViewValidator.Validate(envelope);
                case applicationinsights_common_4.PageViewPerformance.dataType:
                    return PageViewPerformanceValidator_1.PageViewPerformanceValidator.PageViewPerformanceValidator.Validate(envelope);
                case applicationinsights_common_4.RemoteDependencyData.dataType:
                    return RemoteDepdencyValidator_1.RemoteDepdencyValidator.RemoteDepdencyValidator.Validate(envelope);
            }
            return false;
        };
        Sender._constructEnvelope = function (envelope) {
            switch (envelope.baseType) {
                case applicationinsights_common_4.Event.dataType:
                    return EnvelopeCreator_1.EventEnvelopeCreator.EventEnvelopeCreator.Create(envelope);
                case applicationinsights_common_4.Trace.dataType:
                    return EnvelopeCreator_1.TraceEnvelopeCreator.TraceEnvelopeCreator.Create(envelope);
                case applicationinsights_common_4.PageView.dataType:
                    return EnvelopeCreator_1.PageViewEnvelopeCreator.PageViewEnvelopeCreator.Create(envelope);
                case applicationinsights_common_4.PageViewPerformance.dataType:
                    return EnvelopeCreator_1.PageViewPerformanceEnvelopeCreator.PageViewPerformanceEnvelopeCreator.Create(envelope);
                case applicationinsights_common_4.Exception.dataType:
                    return EnvelopeCreator_1.ExceptionEnvelopeCreator.ExceptionEnvelopeCreator.Create(envelope);
                case applicationinsights_common_4.Metric.dataType:
                    return EnvelopeCreator_1.MetricEnvelopeCreator.MetricEnvelopeCreator.Create(envelope);
                case applicationinsights_common_4.RemoteDependencyData.dataType:
                    return EnvelopeCreator_1.DependencyEnvelopeCreator.DependencyEnvelopeCreator.Create(envelope);
                default:
                    return null;
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
                applicationinsights_common_4._InternalLogging.throwInternal(applicationinsights_common_4.LoggingSeverity.CRITICAL, applicationinsights_common_4._InternalMessageId.TransmissionFailed, ". " + "Failed to send telemetry with Beacon API.");
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
            xhr[applicationinsights_common_4.DisabledPropertyName] = true;
            xhr.open("POST", this._config.endpointUrl(), isAsync);
            xhr.setRequestHeader("Content-type", "application/json");
            // append Sdk-Context request header only in case of breeze endpoint 
            if (applicationinsights_common_4.Util.isInternalApplicationInsightsEndpoint(this._config.endpointUrl())) {
                xhr.setRequestHeader(applicationinsights_common_4.RequestHeaders.sdkContextHeader, applicationinsights_common_4.RequestHeaders.sdkContextHeaderAppIdRequest);
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
                applicationinsights_common_4._InternalLogging.throwInternal(applicationinsights_common_4.LoggingSeverity.CRITICAL, applicationinsights_common_4._InternalMessageId.InvalidBackendResponse, "Cannot parse the response. " + applicationinsights_common_4.Util.getExceptionName(e), {
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
                applicationinsights_common_4._InternalLogging.throwInternal(applicationinsights_common_4.LoggingSeverity.WARNING, applicationinsights_common_4._InternalMessageId.TransmissionFailed, ". " +
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
});
/// <reference path="../TestFramework/Common.ts" />
/// <reference path="../../Sender.ts" />
var AppInsightsChannelTests = /** @class */ (function (_super) {
    __extends(AppInsightsChannelTests, _super);
    function AppInsightsChannelTests() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AppInsightsChannelTests.prototype.testInitialize = function () {
        this.clock.reset();
    };
    AppInsightsChannelTests.prototype.testCleanup = function () {
    };
    AppInsightsChannelTests.prototype.registerTests = function () {
        this.testCase({
            name: "AppInsightsTests: public members are correct",
            test: function () {
                Assert.ok(true);
            }
        });
    };
    return AppInsightsChannelTests;
}(TestClass));
new AppInsightsChannelTests().registerTests();
/// <reference path="../CheckinTests/aichannel.tests.ts" />
//# sourceMappingURL=aichannel.tests.js.map