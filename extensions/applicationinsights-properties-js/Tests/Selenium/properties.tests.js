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
define("Interfaces/Context/ISession", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("Context/Session", ["require", "exports", "applicationinsights-common", "applicationinsights-core-js"], function (require, exports, applicationinsights_common_1, applicationinsights_core_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Session = /** @class */ (function () {
        function Session() {
        }
        return Session;
    }());
    exports.Session = Session;
    var _SessionManager = /** @class */ (function () {
        function _SessionManager(config, logger) {
            if (applicationinsights_core_js_1.CoreUtils.isNullOrUndefined(logger)) {
                this._logger = new applicationinsights_core_js_1.DiagnosticLogger();
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
            this.automaticSession = new Session();
        }
        _SessionManager.prototype.update = function () {
            if (!this.automaticSession.id) {
                this.initializeAutomaticSession();
            }
            var now = applicationinsights_common_1.DateTimeUtils.Now();
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
            var cookie = applicationinsights_common_1.Util.getCookie(this._logger, 'ai_session');
            if (cookie && typeof cookie.split === "function") {
                this.initializeAutomaticSessionWithData(cookie);
            }
            else {
                // There's no cookie, but we might have session data in local storage
                // This can happen if the session expired or the user actively deleted the cookie
                // We only want to recover data if the cookie is missing from expiry. We should respect the user's wishes if the cookie was deleted actively.
                // The User class handles this for us and deletes our local storage object if the persistent user cookie was removed.
                var storage = applicationinsights_common_1.Util.getStorage(this._logger, 'ai_session');
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
                this._logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.CRITICAL, applicationinsights_core_js_1._InternalMessageId.ErrorParsingAISessionCookie, "Error parsing ai_session cookie, session will be reset: " + applicationinsights_common_1.Util.getExceptionName(e), { exception: applicationinsights_common_1.Util.dump(e) });
            }
            if (this.automaticSession.renewalDate == 0) {
                this._logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.WARNING, applicationinsights_core_js_1._InternalMessageId.SessionRenewalDateIsZero, "AI session renewal date is 0, session will be reset.");
            }
        };
        _SessionManager.prototype.renew = function () {
            var now = applicationinsights_common_1.DateTimeUtils.Now();
            this.automaticSession.id = applicationinsights_common_1.Util.newId();
            this.automaticSession.acquisitionDate = now;
            this.automaticSession.renewalDate = now;
            this.setCookie(this.automaticSession.id, this.automaticSession.acquisitionDate, this.automaticSession.renewalDate);
            // If this browser does not support local storage, fire an internal log to keep track of it at this point
            if (!applicationinsights_common_1.Util.canUseLocalStorage()) {
                this._logger.throwInternal(applicationinsights_core_js_1.LoggingSeverity.WARNING, applicationinsights_core_js_1._InternalMessageId.BrowserDoesNotSupportLocalStorage, "Browser does not support local storage. Session durations will be inaccurate.");
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
            applicationinsights_common_1.Util.setCookie(this._logger, 'ai_session', cookie.join('|') + ';expires=' + cookieExpiry.toUTCString(), cookieDomnain);
            this.cookieUpdatedTimestamp = applicationinsights_common_1.DateTimeUtils.Now();
        };
        _SessionManager.prototype.setStorage = function (guid, acq, renewal) {
            // Keep data in local storage to retain the last session id, allowing us to cleanly end the session when it expires
            // Browsers that don't support local storage won't be able to end sessions cleanly from the client
            // The server will notice this and end the sessions itself, with loss of accurate session duration
            applicationinsights_common_1.Util.setStorage(this._logger, 'ai_session', [guid, acq, renewal].join('|'));
        };
        _SessionManager.acquisitionSpan = 86400000; // 24 hours in ms
        _SessionManager.renewalSpan = 1800000; // 30 minutes in ms
        _SessionManager.cookieUpdateInterval = 60000; // 1 minute in ms
        return _SessionManager;
    }());
    exports._SessionManager = _SessionManager;
});
define("Interfaces/Context/IApplication", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("Context/Application", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Application = /** @class */ (function () {
        function Application() {
        }
        return Application;
    }());
    exports.Application = Application;
});
define("Interfaces/Context/IDevice", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("Context/Device", ["require", "exports"], function (require, exports) {
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
});
define("Interfaces/Context/IInternal", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("Interfaces/ITelemetryConfig", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("Context/Internal", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Version = "2.0.1-beta";
    var Internal = /** @class */ (function () {
        /**
        * Constructs a new instance of the internal telemetry data class.
        */
        function Internal(config) {
            this.sdkVersion = (config.sdkExtension && config.sdkExtension() ? config.sdkExtension() + "_" : "") + "javascript:" + Version;
        }
        return Internal;
    }());
    exports.Internal = Internal;
});
define("Interfaces/Context/ILocation", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("Context/Location", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Location = /** @class */ (function () {
        function Location() {
        }
        return Location;
    }());
    exports.Location = Location;
});
define("Interfaces/Context/IOperation", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("Context/Operation", ["require", "exports", "applicationinsights-common"], function (require, exports, applicationinsights_common_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Operation = /** @class */ (function () {
        function Operation() {
            this.id = applicationinsights_common_2.Util.newId();
            if (window && window.location && window.location.pathname) {
                this.name = window.location.pathname;
            }
        }
        return Operation;
    }());
    exports.Operation = Operation;
});
define("Interfaces/Context/IUser", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("Context/User", ["require", "exports", "applicationinsights-common", "applicationinsights-core-js"], function (require, exports, applicationinsights_common_3, applicationinsights_core_js_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var User = /** @class */ (function () {
        function User(config, logger) {
            this._logger = logger;
            //get userId or create new one if none exists
            var cookie = applicationinsights_common_3.Util.getCookie(this._logger, User.userCookieName);
            if (cookie) {
                var params = cookie.split(User.cookieSeparator);
                if (params.length > 0) {
                    this.id = params[0];
                }
            }
            this.config = config;
            if (!this.id) {
                this.id = applicationinsights_common_3.Util.newId();
                var date = new Date();
                var acqStr = applicationinsights_common_3.Util.toISOStringForIE8(date);
                this.accountAcquisitionDate = acqStr;
                // without expiration, cookies expire at the end of the session
                // set it to 365 days from now
                // 365 * 24 * 60 * 60 * 1000 = 31536000000 
                date.setTime(date.getTime() + 31536000000);
                var newCookie = [this.id, acqStr];
                var cookieDomain = this.config.cookieDomain ? this.config.cookieDomain() : undefined;
                applicationinsights_common_3.Util.setCookie(this._logger, User.userCookieName, newCookie.join(User.cookieSeparator) + ';expires=' + date.toUTCString(), cookieDomain);
                // If we have an ai_session in local storage this means the user actively removed our cookies.
                // We should respect their wishes and clear ourselves from local storage
                applicationinsights_common_3.Util.removeStorage(this._logger, 'ai_session');
            }
            // We still take the account id from the ctor param for backward compatibility. 
            // But if the the customer set the accountId through the newer setAuthenticatedUserContext API, we will override it.
            this.accountId = config.accountId ? config.accountId() : undefined;
            // Get the auth user id and account id from the cookie if exists
            // Cookie is in the pattern: <authenticatedId>|<accountId>
            var authCookie = applicationinsights_common_3.Util.getCookie(this._logger, User.authUserCookieName);
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
                this._logger.throwInternal(applicationinsights_core_js_2.LoggingSeverity.WARNING, applicationinsights_core_js_2._InternalMessageId.SetAuthContextFailedAccountName, "Setting auth user context failed. " +
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
                applicationinsights_common_3.Util.setCookie(this._logger, User.authUserCookieName, encodeURI(authCookie), this.config.cookieDomain());
            }
        };
        /**
         * Clears the authenticated user id and the account id from the user context.
         * @returns {}
         */
        User.prototype.clearAuthenticatedUserContext = function () {
            this.authenticatedId = null;
            this.accountId = null;
            applicationinsights_common_3.Util.deleteCookie(this._logger, User.authUserCookieName);
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
});
define("HashCodeScoreGenerator", ["require", "exports"], function (require, exports) {
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
});
define("SamplingScoreGenerator", ["require", "exports", "HashCodeScoreGenerator", "applicationinsights-common"], function (require, exports, HashCodeScoreGenerator_1, applicationinsights_common_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var SamplingScoreGenerator = /** @class */ (function () {
        function SamplingScoreGenerator() {
            this.hashCodeGeneragor = new HashCodeScoreGenerator_1.HashCodeScoreGenerator();
        }
        SamplingScoreGenerator.prototype.getSamplingScore = function (envelope) {
            var tagKeys = new applicationinsights_common_4.ContextTagKeys();
            var score = 0;
            if (envelope.tags[tagKeys.userId]) {
                score = this.hashCodeGeneragor.getHashCodeScore(envelope.tags[tagKeys.userId]);
            }
            else if (envelope.tags[tagKeys.operationId]) {
                score = this.hashCodeGeneragor.getHashCodeScore(envelope.tags[tagKeys.operationId]);
            }
            else {
                // tslint:disable-next-line:insecure-random
                score = Math.random();
            }
            return score;
        };
        return SamplingScoreGenerator;
    }());
    exports.SamplingScoreGenerator = SamplingScoreGenerator;
});
define("Interfaces/Context/ISample", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("Context/Sample", ["require", "exports", "SamplingScoreGenerator", "applicationinsights-core-js"], function (require, exports, SamplingScoreGenerator_1, applicationinsights_core_js_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Sample = /** @class */ (function () {
        function Sample(sampleRate, logger) {
            // We're using 32 bit math, hence max value is (2^31 - 1)
            this.INT_MAX_VALUE = 2147483647;
            if (applicationinsights_core_js_3.CoreUtils.isNullOrUndefined(logger)) {
                this._logger = new applicationinsights_core_js_3.DiagnosticLogger();
            }
            else {
                this._logger = logger;
            }
            if (sampleRate > 100 || sampleRate < 0) {
                this._logger.throwInternal(applicationinsights_core_js_3.LoggingSeverity.WARNING, applicationinsights_core_js_3._InternalMessageId.SampleRateOutOfRange, "Sampling rate is out of range (0..100). Sampling will be disabled, you may be sending too much data which may affect your AI service level.", { samplingRate: sampleRate }, true);
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
});
define("Interfaces/ITelemetryContext", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("Interfaces/IPropertiesPlugin", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
/**
 * PropertiesPlugin.ts
 * @copyright Microsoft 2018
 */
define("PropertiesPlugin", ["require", "exports", "applicationinsights-core-js", "applicationinsights-common", "Context/Session", "Context/Application", "Context/Device", "Context/Internal", "Context/Location", "Context/Operation", "Context/User", "Context/Sample"], function (require, exports, applicationinsights_core_js_4, applicationinsights_common_5, Session_1, Application_1, Device_1, Internal_1, Location_1, Operation_1, User_1, Sample_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var PropertiesPlugin = /** @class */ (function () {
        function PropertiesPlugin() {
            this.priority = 170;
            this.identifier = "AppInsightsPropertiesPlugin";
        }
        PropertiesPlugin.prototype.initialize = function (config, core, extensions) {
            var extensionConfig = config.extensionConfig &&
                config.extensionConfig[this.identifier] ?
                config.extensionConfig[this.identifier] : {};
            this._extensionConfig = {
                instrumentationKey: function () { return extensionConfig.instrumentationKey; },
                accountId: function () { return extensionConfig.accountId; },
                sessionRenewalMs: function () { return extensionConfig.sessionRenewalMs; },
                sampleRate: function () { return extensionConfig.sampleRate; },
                sessionExpirationMs: function () { return extensionConfig.sessionExpirationMs; },
                cookieDomain: function () { return extensionConfig.cookieDomain; },
                sdkExtension: function () { return extensionConfig.sdkExtension; },
                isBrowserLinkTrackingEnabled: function () { return extensionConfig.isBrowserLinkTrackingEnabled; },
                appId: function () { return extensionConfig.appId; }
            };
            if (typeof window !== 'undefined') {
                this._sessionManager = new Session_1._SessionManager(this._extensionConfig, core.logger);
                this.application = new Application_1.Application();
                this.device = new Device_1.Device();
                this.internal = new Internal_1.Internal(this._extensionConfig);
                this.location = new Location_1.Location();
                this.user = new User_1.User(this._extensionConfig, core.logger);
                this.operation = new Operation_1.Operation();
                this.session = new Session_1.Session();
                this.sample = new Sample_1.Sample(this._extensionConfig.sampleRate(), core.logger);
            }
        };
        /**
         * Add Part A fields to the event
         * @param event The event that needs to be processed
         */
        PropertiesPlugin.prototype.processTelemetry = function (event) {
            if (applicationinsights_core_js_4.CoreUtils.isNullOrUndefined(event)) {
                // TODO(barustum): throw an internal event once we have support for internal logging
            }
            else {
                // if the event is not sampled in, do not bother going through the pipeline
                if (this.sample.isSampledIn(event)) {
                    // If the envelope is PageView, reset the internal message count so that we can send internal telemetry for the new page.
                    if (event.name === applicationinsights_common_5.PageView.envelopeType) {
                        // TODO(barustum): resetInternalMessageCount once we have support for internal logging
                        //_InternalLogging.resetInternalMessageCount();
                    }
                    if (this.session) {
                        // If customer did not provide custom session id update the session manager
                        if (typeof this.session.id !== "string") {
                            this._sessionManager.update();
                        }
                    }
                    this._processTelemetryInternal(event);
                }
                if (!applicationinsights_core_js_4.CoreUtils.isNullOrUndefined(this._nextPlugin)) {
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
            var tagsItem = {};
            if (this.session) {
                // If customer set id, apply his context; otherwise apply context generated from cookies 
                if (typeof this.session.id === "string") {
                    PropertiesPlugin._applySessionContext(tagsItem, this.session);
                }
                else {
                    PropertiesPlugin._applySessionContext(tagsItem, this._sessionManager.automaticSession);
                }
            }
            // set part A  fields
            PropertiesPlugin._applyApplicationContext(tagsItem, this.application);
            PropertiesPlugin._applyDeviceContext(tagsItem, this.device);
            PropertiesPlugin._applyInternalContext(tagsItem, this.internal);
            PropertiesPlugin._applyLocationContext(tagsItem, this.location);
            PropertiesPlugin._applySampleContext(tagsItem, this.sample);
            PropertiesPlugin._applyUserContext(tagsItem, this.user);
            PropertiesPlugin._applyOperationContext(tagsItem, this.operation);
            event.tags.push(tagsItem);
        };
        PropertiesPlugin._applySessionContext = function (tags, sessionContext) {
            if (sessionContext) {
                var tagKeys = new applicationinsights_common_5.ContextTagKeys();
                if (typeof sessionContext.id === "string") {
                    tags[tagKeys.sessionId] = sessionContext.id;
                }
                if (typeof sessionContext.isFirst !== "undefined") {
                    tags[tagKeys.sessionIsFirst] = sessionContext.isFirst;
                }
            }
        };
        PropertiesPlugin._applyApplicationContext = function (tagsItem, appContext) {
            if (appContext) {
                var tagKeys = new applicationinsights_common_5.ContextTagKeys();
                if (typeof appContext.ver === "string") {
                    tagsItem[tagKeys.applicationVersion] = appContext.ver;
                }
                if (typeof appContext.build === "string") {
                    tagsItem[tagKeys.applicationBuild] = appContext.build;
                }
            }
        };
        PropertiesPlugin._applyDeviceContext = function (tagsItem, deviceContext) {
            var tagKeys = new applicationinsights_common_5.ContextTagKeys();
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
        PropertiesPlugin._applyInternalContext = function (tagsItem, internalContext) {
            if (internalContext) {
                var tagKeys = new applicationinsights_common_5.ContextTagKeys();
                if (typeof internalContext.agentVersion === "string") {
                    tagsItem[tagKeys.internalAgentVersion] = internalContext.agentVersion;
                }
                if (typeof internalContext.sdkVersion === "string") {
                    tagsItem[tagKeys.internalSdkVersion] = internalContext.sdkVersion;
                }
            }
        };
        PropertiesPlugin._applyLocationContext = function (tagsItem, locationContext) {
            if (locationContext) {
                var tagKeys = new applicationinsights_common_5.ContextTagKeys();
                if (typeof locationContext.ip === "string") {
                    tagsItem[tagKeys.locationIp] = locationContext.ip;
                }
            }
        };
        PropertiesPlugin._applySampleContext = function (tagsItem, sampleContext) {
            if (sampleContext) {
                tagsItem.sampleRate = sampleContext.sampleRate;
            }
        };
        PropertiesPlugin._applyOperationContext = function (tagsItem, operationContext) {
            if (operationContext) {
                var tagKeys = new applicationinsights_common_5.ContextTagKeys();
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
        PropertiesPlugin._applyUserContext = function (tagsItem, userContext) {
            if (userContext) {
                var tagKeys = new applicationinsights_common_5.ContextTagKeys();
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
        return PropertiesPlugin;
    }());
    exports.default = PropertiesPlugin;
});
/// <reference path="../TestFramework/TestClass.ts" />
define("Tests/Selenium/properties.tests", ["require", "exports", "applicationinsights-core-js", "PropertiesPlugin", "applicationinsights-common"], function (require, exports, applicationinsights_core_js_5, PropertiesPlugin_1, applicationinsights_common_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var PropertiesTests = /** @class */ (function (_super) {
        __extends(PropertiesTests, _super);
        function PropertiesTests() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        PropertiesTests.prototype.testInitialize = function () {
            this.core = new applicationinsights_core_js_5.AppInsightsCore();
            this.core.logger = new applicationinsights_core_js_5.DiagnosticLogger();
            this.properties = new PropertiesPlugin_1.default();
        };
        PropertiesTests.prototype.testCleanup = function () {
            this.core = null;
            this.properties = null;
        };
        PropertiesTests.prototype.registerTests = function () {
            this.addUserTests();
        };
        PropertiesTests.prototype.addUserTests = function () {
            var _this = this;
            this.testCase({
                name: 'User: user context initializes from cookie when possible',
                test: function () {
                    // setup
                    var id = "someUserId";
                    var cookieStub = _this.sandbox.stub(applicationinsights_common_6.Util, "getCookie", function () { return id + "||||"; });
                    // Act
                    Assert.ok(cookieStub.notCalled, 'Cookie not yet grabbed');
                    _this.properties.initialize(_this.getEmptyConfig(), _this.core, []);
                    Assert.ok(cookieStub.called, 'Cookie grabbed');
                    // Assert
                    Assert.equal(id, _this.properties.user.id, 'user id was set from cookie');
                }
            });
            this.testCase({
                name: "ai_user cookie is set with acq date and year expiration",
                test: function () {
                    // setup
                    var actualCookieName;
                    var actualCookieValue;
                    var newIdStub = _this.sandbox.stub(applicationinsights_common_6.Util, "newId", function () { return "newId"; });
                    var getCookieStub = _this.sandbox.stub(applicationinsights_common_6.Util, "getCookie", function () { return ""; });
                    var setCookieStub = _this.sandbox.stub(applicationinsights_common_6.Util, "setCookie", function (logger, cookieName, cookieValue) {
                        actualCookieName = cookieName;
                        actualCookieValue = cookieValue;
                    });
                    // act
                    _this.properties.initialize(_this.getEmptyConfig(), _this.core, []);
                    // verify
                    Assert.equal("ai_user", actualCookieName, "ai_user cookie is set");
                    var cookieValueParts = actualCookieValue.split(';');
                    Assert.equal(2, cookieValueParts.length, "ai_user cookie value should have actual value and expiration");
                    Assert.equal(2, cookieValueParts[0].split('|').length, "ai_user cookie value before expiration should include user id and acq date");
                    Assert.equal("newId", cookieValueParts[0].split('|')[0], "First part of ai_user cookie value should be new user id guid");
                    Assert.equal(new Date().toString(), (new Date(cookieValueParts[0].split('|')[1])).toString(), "Second part of ai_user cookie should be parsable as date");
                    var expiration = cookieValueParts[1];
                    Assert.equal(true, expiration.substr(0, "expires=".length) === "expires=", "ai_user cookie expiration part should start with expires=");
                    var expirationDate = new Date(expiration.substr("expires=".length));
                    Assert.equal(true, expirationDate > (new Date), "ai_user cookie expiration should be in the future");
                }
            });
            this.testCase({
                name: "ai_user cookie is set with acq date and year expiration",
                test: function () {
                    // setup
                    var id = "userId";
                    var actualCookieName;
                    var actualCookieValue;
                    var newIdStub = _this.sandbox.stub(applicationinsights_common_6.Util, "newId", function () { return "newId"; });
                    var getCookieStub = _this.sandbox.stub(applicationinsights_common_6.Util, "getCookie", function () { return ""; });
                    var setCookieStub = _this.sandbox.stub(applicationinsights_common_6.Util, "setCookie", function (logger, cookieName, cookieValue) {
                        actualCookieName = cookieName;
                        actualCookieValue = cookieValue;
                    });
                    // act
                    _this.properties.initialize(_this.getEmptyConfig(), _this.core, []);
                    // verify
                    Assert.equal("ai_user", actualCookieName, "ai_user cookie is set");
                    var cookieValueParts = actualCookieValue.split(';');
                    Assert.equal(2, cookieValueParts.length, "ai_user cookie value should have actual value and expiration");
                    Assert.equal(2, cookieValueParts[0].split('|').length, "ai_user cookie value before expiration should include user id and acq date");
                    Assert.equal("newId", cookieValueParts[0].split('|')[0], "First part of ai_user cookie value should be new user id guid");
                    Assert.equal(new Date().toString(), (new Date(cookieValueParts[0].split('|')[1])).toString(), "Second part of ai_user cookie should be parsable as date");
                    var expiration = cookieValueParts[1];
                    Assert.equal(true, expiration.substr(0, "expires=".length) === "expires=", "ai_user cookie expiration part should start with expires=");
                    var expirationDate = new Date(expiration.substr("expires=".length));
                    Assert.equal(true, expirationDate > (new Date), "ai_user cookie expiration should be in the future");
                }
            });
            this.testCase({
                name: "Ctor: auth and account id initialize from cookie",
                test: function () {
                    // setup
                    var authId = "bla@bla.com";
                    var accountId = "Contoso";
                    var cookieStub = _this.sandbox.stub(applicationinsights_common_6.Util, "getCookie", function () { return authId + "|" + accountId; });
                    // act
                    _this.properties.initialize(_this.getEmptyConfig(), _this.core, []);
                    // verify
                    Assert.equal(authId, _this.properties.user.authenticatedId, "user auth id was set from cookie");
                    Assert.equal(accountId, _this.properties.user.accountId, "user account id was not set from cookie");
                }
            });
            this.testCase({
                name: "Ctor: auth id initializes from cookie (without account id)",
                test: function () {
                    // setup
                    var authId = "bla@bla.com";
                    var cookieStub = _this.sandbox.stub(applicationinsights_common_6.Util, "getCookie", function () { return authId; });
                    // act
                    _this.properties.initialize(_this.getEmptyConfig(), _this.core, []);
                    // verify
                    Assert.equal(authId, _this.properties.user.authenticatedId, "user auth id was set from cookie");
                }
            });
            this.testCase({
                name: "Ctor: auth user context handles empty cookie",
                test: function () {
                    // setup
                    var cookieStub = _this.sandbox.stub(applicationinsights_common_6.Util, "getCookie", function () { return ""; });
                    // act
                    _this.properties.initialize(_this.getEmptyConfig(), _this.core, []);
                    // verify
                    Assert.equal(undefined, _this.properties.user.authenticatedId, "user auth id was not set");
                    Assert.equal(undefined, _this.properties.user.accountId, "user account id was not set");
                }
            });
            this.testCase({
                name: "Ctor: auth user context handles empty cookie with accountId backward compatibility",
                test: function () {
                    // setup
                    var config = _this.getEmptyConfig();
                    config.extensionConfig.AppInsightsPropertiesPlugin.accountId = "account17";
                    var cookieStub = _this.sandbox.stub(applicationinsights_common_6.Util, "getCookie", function () { return null; });
                    // act
                    _this.properties.initialize(config, _this.core, []);
                    // verify
                    Assert.equal(config.extensionConfig.AppInsightsPropertiesPlugin.accountId, _this.properties.user.accountId, "user account id was set from back compat");
                }
            });
            this.testCase({
                name: "setAuthenticatedUserContext: auth id and account id is set (not in the cookie)",
                test: function () {
                    // setup
                    var authAndAccountId = ['bla@bla.com', 'contoso'];
                    _this.properties.initialize(_this.getEmptyConfig(), _this.core, []);
                    var cookieStub = _this.sandbox.stub(applicationinsights_common_6.Util, "setCookie");
                    // act
                    _this.properties.user.setAuthenticatedUserContext(authAndAccountId[0], authAndAccountId[1]);
                    // verify
                    Assert.equal('bla@bla.com', _this.properties.user.authenticatedId, "user auth id was not set");
                    Assert.equal('contoso', _this.properties.user.accountId, "user account id was not set");
                    Assert.equal(cookieStub.notCalled, true, "cookie was not set");
                }
            });
            this.testCase({
                name: "setAuthenticatedUserContext: auth user set in cookie without account id",
                test: function () {
                    // setup
                    var authAndAccountId = ["bla@bla.com"];
                    var cookieStub = _this.sandbox.stub(applicationinsights_common_6.Util, "setCookie");
                    _this.properties.initialize(_this.getEmptyConfig(), _this.core, []);
                    // act
                    _this.properties.user.setAuthenticatedUserContext(authAndAccountId[0], null, true);
                    // verify
                    Assert.equal(authAndAccountId[0], _this.properties.user.authenticatedId, "user auth id was set");
                    Assert.equal(cookieStub.calledWithExactly(_this.core.logger, 'ai_authUser', encodeURI(authAndAccountId.join('|')), null), true, "user auth id and account id cookie was set");
                }
            });
            this.testCase({
                name: "setAuthenticatedUserContext: auth user and account id set in cookie ",
                test: function () {
                    // setup
                    var authAndAccountId = ['bla@bla.com', 'contoso'];
                    var cookieStub = _this.sandbox.stub(applicationinsights_common_6.Util, "setCookie");
                    _this.properties.initialize(_this.getEmptyConfig(), _this.core, []);
                    // act
                    _this.properties.user.setAuthenticatedUserContext(authAndAccountId[0], authAndAccountId[1], true);
                    // verify
                    Assert.equal(authAndAccountId[0], _this.properties.user.authenticatedId, "user auth id was set");
                    Assert.equal(cookieStub.calledWithExactly(_this.core.logger, 'ai_authUser', encodeURI(authAndAccountId.join('|')), null), true, "user auth id cookie was set");
                }
            });
            this.testCase({
                name: "setAuthenticatedUserContext: handles only auth user id correctly",
                test: function () {
                    // setup
                    var authAndAccountId = ['bla@bla.com'];
                    var cookieStub = _this.sandbox.stub(applicationinsights_common_6.Util, "setCookie");
                    _this.properties.initialize(_this.getEmptyConfig(), _this.core, []);
                    // act
                    _this.properties.user.setAuthenticatedUserContext(authAndAccountId[0], null, true);
                    // verify
                    Assert.equal(authAndAccountId[0], _this.properties.user.authenticatedId, "user auth id was set");
                    Assert.equal(null, _this.properties.user.accountId, "user account id was not set");
                    Assert.equal(cookieStub.calledWithExactly(_this.core.logger, 'ai_authUser', encodeURI(authAndAccountId[0]), null), true, "user auth id cookie was set");
                }
            });
            this.testCase({
                name: "setAuthenticatedUserContext: handles null correctly",
                test: function () {
                    // setup
                    var cookieStub = _this.sandbox.stub(applicationinsights_common_6.Util, "setCookie");
                    _this.properties.initialize(_this.getEmptyConfig(), _this.core, []);
                    var loggingStub = _this.sandbox.stub(_this.core.logger, "throwInternal");
                    cookieStub.reset();
                    loggingStub.reset();
                    // act
                    _this.properties.user.setAuthenticatedUserContext(null);
                    // verify
                    Assert.equal(undefined, _this.properties.user.authenticatedId, "user auth id was not set");
                    Assert.equal(undefined, _this.properties.user.accountId, "user account id was not set");
                    Assert.equal(cookieStub.notCalled, true, "cookie was not set");
                    Assert.equal(loggingStub.calledOnce, true, "Warning was logged");
                }
            });
            this.testCase({
                name: "setAuthenticatedUserContext: handles undefined correctly",
                test: function () {
                    // setup
                    var cookieStub = _this.sandbox.stub(applicationinsights_common_6.Util, "setCookie");
                    _this.properties.initialize(_this.getEmptyConfig(), _this.core, []);
                    var loggingStub = _this.sandbox.stub(_this.core.logger, "throwInternal");
                    cookieStub.reset();
                    loggingStub.reset();
                    // act
                    _this.properties.user.setAuthenticatedUserContext(undefined, undefined);
                    // verify
                    Assert.equal(undefined, _this.properties.user.authenticatedId, "user auth id was not set");
                    Assert.equal(undefined, _this.properties.user.accountId, "user account id was not set");
                    Assert.equal(cookieStub.notCalled, true, "cookie was not set");
                    Assert.equal(loggingStub.calledOnce, true, "Warning was logged");
                }
            });
            this.testCase({
                name: "setAuthenticatedUserContext: handles only accountID correctly",
                test: function () {
                    // setup
                    var cookieStub = _this.sandbox.stub(applicationinsights_common_6.Util, "setCookie");
                    _this.properties.initialize(_this.getEmptyConfig(), _this.core, []);
                    var loggingStub = _this.sandbox.stub(_this.core.logger, "throwInternal");
                    cookieStub.reset();
                    loggingStub.reset();
                    // act
                    _this.properties.user.setAuthenticatedUserContext(undefined, '1234');
                    // verify
                    Assert.equal(undefined, _this.properties.user.authenticatedId, "user auth id was not set");
                    Assert.equal(undefined, _this.properties.user.accountId, "user account id was not set");
                    Assert.equal(cookieStub.notCalled, true, "cookie was not set");
                    Assert.equal(loggingStub.calledOnce, true, "Warning was logged");
                }
            });
            this.testCase({
                name: "setAuthenticatedUserContext: handles authId special characters correctly",
                test: function () {
                    // setup
                    var authAndAccountId = ['my|||special;id', '1234'];
                    _this.properties.initialize(_this.getEmptyConfig(), _this.core, []);
                    var cookieStub = _this.sandbox.stub(applicationinsights_common_6.Util, "setCookie");
                    var loggingStub = _this.sandbox.stub(_this.core.logger, "throwInternal");
                    // act
                    _this.properties.user.setAuthenticatedUserContext(authAndAccountId[0], authAndAccountId[1], true);
                    // verify
                    Assert.equal(undefined, _this.properties.user.authenticatedId, "user auth id was not set");
                    Assert.equal(undefined, _this.properties.user.accountId, "user account id was not set");
                    Assert.equal(cookieStub.notCalled, true, "cookie was not set");
                    Assert.equal(loggingStub.calledOnce, true, "Warning was logged");
                }
            });
            this.testCase({
                name: "setAuthenticatedUserContext: handles accountId special characters correctly",
                test: function () {
                    // setup
                    var authAndAccountId = ['myid', '1234 5678'];
                    _this.properties.initialize(_this.getEmptyConfig(), _this.core, []);
                    _this.properties.user.clearAuthenticatedUserContext();
                    var cookieStub = _this.sandbox.stub(applicationinsights_common_6.Util, "setCookie");
                    var loggingStub = _this.sandbox.stub(_this.core.logger, "throwInternal");
                    // act
                    _this.properties.user.setAuthenticatedUserContext(authAndAccountId[0], authAndAccountId[1]);
                    // verify
                    Assert.equal(undefined, _this.properties.user.authenticatedId, "user auth id was not set");
                    Assert.equal(undefined, _this.properties.user.accountId, "user account id was not set");
                    Assert.equal(cookieStub.notCalled, true, "cookie was not set");
                    Assert.equal(loggingStub.calledOnce, true, "Warning was logged");
                }
            });
            this.testCase({
                name: "setAuthenticatedUserContext: handles non-ascii unicode characters correctly",
                test: function () {
                    // setup
                    var authAndAccountId = ["\u05D0", "\u05D1"]; // Hebrew characters
                    _this.properties.initialize(_this.getEmptyConfig(), _this.core, []);
                    var cookieStub = _this.sandbox.stub(applicationinsights_common_6.Util, "setCookie");
                    var loggingStub = _this.sandbox.stub(_this.core.logger, "throwInternal");
                    // act
                    _this.properties.user.setAuthenticatedUserContext(authAndAccountId[0], authAndAccountId[1], true);
                    // verify
                    Assert.equal(authAndAccountId[0], _this.properties.user.authenticatedId, "user auth id was set");
                    Assert.equal(authAndAccountId[1], _this.properties.user.accountId, "user account id was set");
                    Assert.equal(cookieStub.calledWithExactly(_this.core.logger, 'ai_authUser', encodeURI(authAndAccountId.join('|')), null), true, "user auth id cookie was set");
                    Assert.equal(loggingStub.notCalled, true, "No warnings");
                }
            });
            this.testCase({
                name: "clearAuthenticatedUserContext: auth user and account cleared in context and cookie ",
                test: function () {
                    // setup
                    _this.properties.initialize(_this.getEmptyConfig(), _this.core, []);
                    _this.properties.user.setAuthenticatedUserContext("bla", "123");
                    var cookieStub = _this.sandbox.stub(applicationinsights_common_6.Util, "deleteCookie");
                    // act
                    _this.properties.user.clearAuthenticatedUserContext();
                    // verify
                    Assert.equal(undefined, _this.properties.user.authenticatedId, "user auth id was cleared");
                    Assert.equal(undefined, _this.properties.user.accountId, "user account id was cleared");
                    Assert.equal(cookieStub.calledWithExactly(_this.core.logger, 'ai_authUser'), true, "cookie was deleted");
                }
            });
            this.testCase({
                name: "clearAuthenticatedUserContext: works correctly when auth id and account id were never set",
                test: function () {
                    // setup
                    _this.properties.initialize(_this.getEmptyConfig(), _this.core, []);
                    var cookieStub = _this.sandbox.stub(applicationinsights_common_6.Util, "deleteCookie");
                    // act
                    _this.properties.user.clearAuthenticatedUserContext();
                    // verify
                    Assert.equal(undefined, _this.properties.user.authenticatedId, "user auth id was cleared");
                    Assert.equal(undefined, _this.properties.user.accountId, "user account id was cleared");
                    Assert.equal(cookieStub.calledWithExactly(_this.core.logger, 'ai_authUser'), true, "cookie was deleted");
                }
            });
        };
        PropertiesTests.prototype.getEmptyConfig = function () {
            return {
                instrumentationKey: 'key',
                extensionConfig: {
                    AppInsightsPropertiesPlugin: {
                        accountId: null,
                        sessionRenewalMs: null,
                        sessionExpirationMs: null,
                        sampleRate: null,
                        endpointUrl: null,
                        cookieDomain: null,
                        emitLineDelimitedJson: null,
                        maxBatchSizeInBytes: null,
                        maxBatchInterval: null,
                        disableTelemetry: null,
                        enableSessionStorageBuffer: null,
                        isRetryDisabled: null,
                        isBeaconApiDisabled: null,
                        sdkExtension: null,
                        isBrowserLinkTrackingEnabled: null,
                        appId: null
                    }
                },
            };
        };
        return PropertiesTests;
    }(TestClass));
    exports.PropertiesTests = PropertiesTests;
    function runTests() {
        new PropertiesTests().registerTests();
    }
    exports.runTests = runTests;
});
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
//# sourceMappingURL=properties.tests.js.map