/// <reference path="../../External/qunit.d.ts" />

import dynamicProto from "@microsoft/dynamicproto-js";
import { SinonSandbox, SinonSpy, SinonStub, SinonMock, SinonFakeXMLHttpRequest } from "sinon";
import * as sinon from "sinon";
import { Assert } from "./Assert";
import { ITestContext, StepResult, TestCase, TestCaseAsync } from "./TestCase";

const stepRetryCnt = "retryCnt";

export interface FakeXMLHttpRequest extends XMLHttpRequest {
    url?: string;
    method?: string;
    requestHeaders?: any;
    respond: (status: number, headers: any, body: string) => void;
}

export interface IFetchArgs {
    input: RequestInfo,
    init: RequestInit
}

function _getObjName(target:any, unknownValue?:string) {
    if (target.hasOwnProperty("prototype")) {
        // Look like a prototype
        return target.name || unknownValue || ""
    }

    return (((target || {})["constructor"]) || {}).name || unknownValue || "";
}

function _getAllAiDataKeys<T = any>(target: T, callbackfn: (name: string, value: T[keyof T]) => void) {
    if (target) {
        let keys = Object.getOwnPropertyNames(target);
        for (let lp = 0; lp < keys.length; lp++) {
            if (keys[lp].startsWith("_aiData")) {
                callbackfn.call(target, keys[lp], target[keys[lp]]);
            }
        }
    }
}

function _objForEachKey<T = any>(target: T, callbackfn: (name: string, value: T[keyof T]) => void) {
    if (target) {
        for (let prop in target) {
            if (Object.prototype.hasOwnProperty.call(target, prop)) {
                callbackfn.call(target, prop, target[prop]);
            }
        }
    }
}

function _formatNamespace(namespaces: string | string[]) {
    if (namespaces) {
        if (Array.isArray(namespaces)) {
            return namespaces.sort().join(".");
        }
    }

    return namespaces || "";
}

export class AITestClass {
    public static isPollingStepFlag = "isPollingStep";

    /** The instance of the currently running suite. */
    public static currentTestClass: AITestClass;
    public static currentTestInfo: TestCase | TestCaseAsync;

    /** Turns on/off sinon's fake implementation of XMLHttpRequest. On by default. */
    public sandboxConfig: any = {};

    public static orgSetTimeout: (callback: (...args: any[]) => void, ms: number, ...args: any[]) => NodeJS.Timeout;
    public static orgClearTimeout: (timeoutId: NodeJS.Timeout) => void;
    public static orgObjectDefineProperty = Object.defineProperty;
    
    /**** Sinon methods and properties ***/

    // These methods and properties are injected by Sinon and will override the implementation here.
    // These are here purely to make typescript happy.
    protected clock: any;
    public sandbox: SinonSandbox;
    public fakeServerAutoRespond: boolean = false;
    public fakeFetchAutoRespond: boolean = false;
    public isEmulatingEs3: boolean;

    /**
     * Automatically assert that all registered events have been removed
     */
    public assertNoEvents: boolean = true;

    /**
      * Automatically assert that all hooks have been removed
      */
    public assertNoHooks: boolean = true;

    protected _orgCrypto: Crypto | null;
    protected _orgLocation: Location | null;

    /** Turns on/off sinon's fake implementation of XMLHttpRequest. On by default. */
    private _useFakeServer: boolean = true;
    private _useFakeFetch: boolean = false;
    private _moduleName: string;
    private _xhr: any;
    private _xhrOrgSend: any;
    private _xhrRequests: FakeXMLHttpRequest[] = [];
    private _fetchRequests: IFetchArgs[] = [];
    private _orgNavigator: any;
    private _orgPerformance: any;
    private _beaconHooks: any[] = [];
    private _dynProtoOpts: any = null;

    // Simulate an Es3 environment
    private _orgObjectFuncs: any = null;
    private _orgFetch: any = null;

    private _onDoneFuncs: VoidFunction[] = [];

    constructor(name?: string, emulateEs3?: boolean) {
        this._moduleName = (emulateEs3 ? "(ES3) " : "") + (name || _getObjName(this, ""));
        this.isEmulatingEs3 = emulateEs3
        QUnit.module(this._moduleName);
        this.sandboxConfig.injectIntoThis = true;
        this.sandboxConfig.injectInto = null;
        this.sandboxConfig.properties = ["spy", "stub", "mock", "sandbox"];
    }

    get useFakeServer(): boolean {
        return this._useFakeServer;
    }

    set useFakeServer(value: boolean) {
        this._useFakeServer = value;
        if (!value) {
            this._unhookXhr();
        } else if (value && AITestClass.currentTestInfo) {
            this._hookXhr();
        }
    }

    get useFakeFetch(): boolean {
        return this._useFakeFetch;
    }

    set useFakeFetch(value: boolean) {
        this._useFakeFetch = value;
        if (!value) {
            this._unhookFetch();
        } else if (value && AITestClass.currentTestInfo) {
            this._hookFetch();
        }
    }

    /** Method called before the start of each test method */
    public testInitialize() {
    }

    /**
     * Method called immediately after the test case has finished, but before the automatic test case assertions.
     * Use this method to call unload / teardown so the SDK can remove it's own events before being validated
     */
    public testFinishedCleanup() {
    }

    /** Method called after each test method has completed and after the test sandbox has been cleanup up.
     * This is the final step before the next test is executed
     */
    public testCleanup() {
        let storage: Storage = sessionStorage;
        if (storage) {
            storage.clear();
        }
    }

    /** Method in which test class instances should call this.testCase(...) to register each of this suite's tests. */
    public registerTests() {
    }

    /** Register an async Javascript unit testcase. */
    public testCaseAsync(testInfo: TestCaseAsync) {
        if (!testInfo.name) {
            throw new Error("Must specify name in testInfo context in registerTestcase call");
        }

        if (isNaN(testInfo.stepDelay)) {
            throw new Error("Must specify 'stepDelay' period between pre and post");
        }

        if (!testInfo.steps) {
            throw new Error("Must specify 'steps' to take asynchronously");
        }

        if (testInfo.autoComplete === undefined) {
            testInfo.autoComplete = true;
        }

        if (!testInfo.orgClearTimeout) {
            // Set as the real clearTimeout (as _testStarting and enable sinon fake timers)
            testInfo.orgClearTimeout = clearTimeout;
        }

        if (!testInfo.orgSetTimeout) {
            // Set as the real setTimeout (as _testStarting and enable sinon fake timers)
            testInfo.orgSetTimeout = setTimeout;
        }
                
        // Create a wrapper around the test method so we can do test initilization and cleanup.
        const testMethod = (assert: any) => {
            const done = assert.async();
            const self = this;

            // Save off the instance of the currently running suite.
            AITestClass.currentTestClass = this;
            AITestClass.currentTestInfo = testInfo;

            // Save the real clearTimeout (as _testStarting and enable sinon fake timers)
            const orgClearTimeout = clearTimeout;
            const orgSetTimeout = setTimeout;

            AITestClass.orgSetTimeout = (handler: (...args: any[]) => void, timeout: number, ...args: any[]) => {
                if (AITestClass.currentTestInfo && AITestClass.currentTestInfo.orgSetTimeout) {
                    return AITestClass.currentTestInfo.orgSetTimeout.call(null, handler, timeout, args);
                }

                orgSetTimeout(handler, timeout, args);
            };

            AITestClass.orgClearTimeout = (timeoutId: NodeJS.Timeout) => {
                if (AITestClass.currentTestInfo && AITestClass.currentTestInfo.orgClearTimeout) {
                    AITestClass.currentTestInfo.orgClearTimeout.call(null, timeoutId);
                } else {
                    orgClearTimeout(timeoutId);
                }
            };

            let useFakeServer = testInfo.useFakeServer;
            if (useFakeServer === undefined) {
                useFakeServer = self.useFakeServer;
            }

            if (useFakeServer) {
                self._hookXhr();
            }

            let useFakeFetch = testInfo.useFakeFetch;
            if (useFakeFetch === undefined) {
                useFakeFetch = self.useFakeFetch;
            }

            if (useFakeFetch && !self.isEmulatingEs3) {
                self._hookFetch();
            }

            if (testInfo.useFakeTimers) {
                self.clock = sinon.useFakeTimers();
            }

            if (self.isEmulatingEs3) {
                self._emulateEs3();
            }

            if (testInfo.assertNoEvents === undefined) {
                testInfo.assertNoEvents = self.assertNoEvents;
            }

            if (testInfo.assertNoHooks === undefined) {
                testInfo.assertNoHooks = self.assertNoHooks;
            }

            // Run the test.
            try {
                let testComplete = false;
                let timeOutTimer: any = null;
                let stepIndex = 0;

                const testDone = () => {
                    self._testFinishedCleanup();

                    if (testInfo.assertNoEvents) {
                        self._assertEventsRemoved();
                    }

                    if (testInfo.assertNoHooks) {
                        self._assertHooksRemoved();
                    }

                    if (timeOutTimer) {
                        orgClearTimeout(timeOutTimer);
                    }
    
                    testComplete = true;
                    // done is QUnit callback indicating the end of the test
                    self._testCompleted();
                    done();
                };
    
                let testContext: ITestContext = {
                    context: {},
                    retryCnt: 0,
                    testDone: testDone,
                    clock: testInfo.useFakeTimers ? self.clock : null
                };

                if (testInfo.timeOut !== undefined) {
                    timeOutTimer = AITestClass.orgSetTimeout(() => {
                        QUnit.assert.ok(false, "Test case timed out!");
                        testComplete = true;
                        done();
                    }, testInfo.timeOut);
                }

                self._testStarting();

                const steps = testInfo.steps;
                const trigger = () => {
                    // The callback which activates the next test step.
                    let nextTestStepTrigger = () => {
                        AITestClass.orgSetTimeout(() => {
                            trigger();
                        }, testInfo.stepDelay);
                    };

                    if (steps.length && !testComplete) {
                        const step = steps.shift();
                        stepIndex++;

                        // There 2 types of test steps - simple and polling.
                        // Upon completion of the simple test step the next test step will be called.
                        // In case of polling test step the next test step is passed to the polling test step, and
                        // it is responsibility of the polling test step to call the next test step.
                        try {
                            if (step) {
                                if (step[AITestClass.isPollingStepFlag]) {
                                    step.call(this, testContext, nextTestStepTrigger);
                                } else {
                                    testContext.retryCnt = step[stepRetryCnt] || 0;
    
                                    let result = step.call(this, testContext);
                                    if (result === StepResult.Retry || result === false) {
                                        // The step requested itself to be retried
                                        Assert.ok(false, "Retrying Step - " + stepIndex + " - Attempt #" + testContext.retryCnt);
                                        step[stepRetryCnt] = testContext.retryCnt + 1;
                                        steps.unshift(step);
                                        stepIndex--;
                                    } else if (result === StepResult.Repeat) {
                                        // The step requested itself to be repeated
                                        steps.unshift(step);
                                        stepIndex--;
                                    } else if (result === StepResult.Abort) {
                                        Assert.ok(false, "Step aborted!");
                                        testDone();
                                        return;
                                    }
    
                                    nextTestStepTrigger.call(this);
                                }
                            }
                        } catch (e) {
                            console.error("Failed: Unexpected Exception: " + e);
                            Assert.ok(false, e.toString());

                            // done is QUnit callback indicating the end of the test
                            testDone();
                            return;
                        }
                    } else if (!testComplete) {
                        if (testInfo.autoComplete) {
                            // done is QUnit callback indicating the end of the test
                            testDone();
                        } else {
                            nextTestStepTrigger();
                        }
                    }
                };

                trigger();
            } catch (ex) {
                console.error("Failed: Unexpected Exception: " + ex);
                Assert.ok(false, "Unexpected Exception: " + ex);
                self._testCompleted(true);

                // done is QUnit callback indicating the end of the test
                done();
            }
        };

        // Register the test with QUnit
        QUnit.test((this.isEmulatingEs3 ? "(ES3) " : "") + testInfo.name + " - (Async)", testMethod);
    }

    /** Register a Javascript unit testcase. */
    public testCase(testInfo: TestCase) {
        if (!testInfo.name) {
            throw new Error("Must specify name in testInfo context in registerTestcase call");
        }

        if (!testInfo.test) {
            throw new Error("Must specify 'test' method in testInfo context in registerTestcase call");
        }

        if (!testInfo.orgClearTimeout) {
            // Set as the real clearTimeout (as _testStarting and enable sinon fake timers)
            testInfo.orgClearTimeout = clearTimeout;
        }

        if (!testInfo.orgSetTimeout) {
            // Set as the real setTimeout (as _testStarting and enable sinon fake timers)
            testInfo.orgSetTimeout = setTimeout;
        }

        // Create a wrapper around the test method so we can do test initilization and cleanup.
        const testMethod = (assert: any) => {
            // Treating all tests as async, so there is no issues with mixing them
            let done = assert.async();
            let self = this;

            // Save off the instance of the currently running suite.
            AITestClass.currentTestClass = this;
            AITestClass.currentTestInfo = testInfo;

            function _testFinished(failed?: boolean) {
                self._testFinishedCleanup();

                if (testInfo.assertNoEvents) {
                    self._assertEventsRemoved();
                }

                if (testInfo.assertNoHooks) {
                    self._assertHooksRemoved();
                }

                AITestClass.currentTestClass && AITestClass.currentTestClass._testCompleted(failed);
                done();
            }

            // Save the real clearTimeout (as _testStarting and enable sinon fake timers)
            const orgClearTimeout = clearTimeout;
            const orgSetTimeout = setTimeout;

            AITestClass.orgSetTimeout = (handler: (...args: any[]) => void, timeout: number, ...args: any[]) => {
                if (AITestClass.currentTestInfo && AITestClass.currentTestInfo.orgSetTimeout) {
                    return AITestClass.currentTestInfo.orgSetTimeout.call(null, handler, timeout, args);
                }

                orgSetTimeout(handler, timeout, args);
            };

            AITestClass.orgClearTimeout = (timeoutId: NodeJS.Timeout) => {
                if (AITestClass.currentTestInfo && AITestClass.currentTestInfo.orgClearTimeout) {
                    AITestClass.currentTestInfo.orgClearTimeout.call(null, timeoutId);
                } else {
                    orgClearTimeout(timeoutId);
                }
            };

            let useFakeServer = testInfo.useFakeServer;
            if (useFakeServer === undefined) {
                useFakeServer = this.useFakeServer;
            }

            if (useFakeServer) {
                this._hookXhr();
            }

            if (testInfo.useFakeTimers) {
                this.clock = sinon.useFakeTimers();
            }

            if (this.isEmulatingEs3) {
                this._emulateEs3();
            }

            if (testInfo.assertNoEvents === undefined) {
                testInfo.assertNoEvents = this.assertNoEvents;
            }

            if (testInfo.assertNoHooks === undefined) {
                testInfo.assertNoHooks = this.assertNoHooks;
            }

            // Run the test.
            try {
                this._testStarting();

                let result = testInfo.test.call(this);
                // Check if the result is present and looks like a Promise
                if (result && result.then) {
                    let promiseTimeout: any = null;
                    if (testInfo.skipTimeout !== true) {
                        let timeout = testInfo.timeout || 5000;
                        promiseTimeout = AITestClass.orgSetTimeout(() => {
                            QUnit.assert.ok(false, "Timeout: Aborting as the Promise returned from the test method did not resolve within " + timeout + " ms");
                            _testFinished(true);
                        }, timeout);
                    }
                    result.then(() => {
                        promiseTimeout && orgClearTimeout(promiseTimeout);
                        _testFinished();
                    });
                    result.catch && result.catch((reason: any) => {
                        promiseTimeout && orgClearTimeout(promiseTimeout);
                        QUnit.assert.ok(false, "Returned Promise rejected: " + reason);
                        _testFinished(true);
                    });
                } else {
                    _testFinished();
                }
            } catch (ex) {
                console.error("Failed: Unexpected Exception: " + ex);
                Assert.ok(false, "Unexpected Exception: " + ex);
                _testFinished(true);
            }
        };

        // Register the test with QUnit
        QUnit.test((this.isEmulatingEs3 ? "(ES3) " : "") + testInfo.name, testMethod);
    }

    /** Creates an anonymous function that records arguments, this value, exceptions and return values for all calls. */
    public spy(): SinonSpy;
    /** Spies on the provided function */
    public spy(funcToWrap: Function): SinonSpy;
    /** Creates a spy for object.methodName and replaces the original method with the spy. The spy acts exactly like the original method in all cases. The original method can be restored by calling object.methodName.restore(). The returned spy is the function object which replaced the original method. spy === object.method. */
    public spy(object: any, methodName: string, func?: Function): SinonSpy;
    public spy(..._args: any[]): SinonSpy {
        return null;
    }

    /** Creates an anonymous stub function. */
    public stub(): SinonStub;
    /** Stubs all the object's methods. */
    public stub(object: any): SinonStub;
    /** Replaces object.methodName with a func, wrapped in a spy. As usual, object.methodName.restore(); can be used to restore the original method. */
    public stub(object: any, methodName: string, func?: Function): SinonStub;
    public stub(..._args: any[]): SinonStub {
        return null;
    }

    /** Creates a mock for the provided object.Does not change the object, but returns a mock object to set expectations on the object's methods. */
    public mock(_object: any): SinonMock {
        return null;
    }

    /**** end: Sinon methods and properties ***/

    /**
     * Sends a JSON response to the provided request.
     * @param request The request to respond to.
     * @param data Data to respond with.
     * @param errorCode Optional error code to send with the request, default is 200
     */
    public sendJsonResponse(request: SinonFakeXMLHttpRequest, data: any, errorCode?: number) {
        if (errorCode === undefined) {
            errorCode = 200;
        }

        request.respond(
            errorCode,
            { "Content-Type": "application/json" },
            JSON.stringify(data));
    }


    public getPayloadMessages(spy: SinonSpy, includeInit:boolean = false) {
        let resultPayload: any[] = [];
        if (spy.called && spy.args && spy.args.length > 0) {
            spy.args.forEach(call => {
                call[0].forEach((message: string) => {
                    if (message) {
                        // Ignore the internal SendBrowserInfoOnUserInit message (Only occurs when running tests in a browser)
                        if (includeInit || message.indexOf("AI (Internal): 72 ") === -1) {
                            resultPayload.push(message);
                        }
                    }
                })
            });
        }

        return resultPayload;
    }

    public dumpPayloadMessages(spy: SinonSpy) {
        let msg = "Sent Messages";
        if (spy.called && spy.args && spy.args.length > 0) {
            spy.args[0][0].forEach((value: any, idx: number) => {
                msg += "\n" + idx + ":" + value;
            });
        }
        Assert.ok(false, msg);
    }
        
    protected onDone(cleanupFn: VoidFunction) {
        if (cleanupFn && this._onDoneFuncs) {
            this._onDoneFuncs.push(cleanupFn);
        }
    }

    protected setUserAgent(userAgent: string) {
        // Hook Send beacon which also mocks navigator
        this.hookSendBeacon(null);

        try {
            AITestClass.orgObjectDefineProperty(window.navigator, "userAgent",
                {
                    configurable: true,
                    get () {
                        return userAgent;
                    }
                });
        } catch (e) {
            QUnit.assert.ok(false, "Failed to set the userAgent - " + e);
            throw e;
        }
    }

    protected hookSendBeacon(cb: (url: string, data?: BodyInit | null) => undefined|boolean) {
        if (!this._orgNavigator) {
            let newNavigator = <any>{};
            this._orgNavigator = window.navigator;

            newNavigator.sendBeacon = (url: string, body: any) => {
                let handled: any;
                this._beaconHooks.forEach(element => {
                    let result = element(url, body);
                    if (result !== undefined) {
                        handled |= result;
                    }
                });

                if (handled !== undefined) {
                    return handled;
                }

                return this._orgNavigator.sendBeacon(url, body);
            };

            try {
                // Just Blindly copy the properties over
                // tslint:disable-next-line: forin
                for (let name in navigator) {
                    if (!newNavigator.hasOwnProperty(name)) {
                        newNavigator[name] = navigator[name];
                        if (!newNavigator.hasOwnProperty(name)) {
                            // if it couldn't be set directly try and pretend
                            AITestClass.orgObjectDefineProperty(newNavigator, name,
                                {
                                    configurable: true,
                                    get: function () {
                                        return navigator[name];
                                    }
                                });
                        }
                    }
                }
            } catch (e) {
                QUnit.assert.ok(false, "Creating navigator copy failed - " + e);
                throw e;
            }

            this.setNavigator(newNavigator);
        }

        this._beaconHooks.push(cb);
    }

    protected setNavigator(newNavigator: any) {
        try {
            AITestClass.orgObjectDefineProperty(window, "navigator",
                {
                    configurable: true,
                    get: function () {
                        return newNavigator;
                    }
                });
        } catch (e) {
            QUnit.assert.ok(true, "Set Navigator failed - " + e);
            sinon.stub(window, "navigator").returns(newNavigator);
        }
    }

    protected setCrypto(crypto: Crypto | null) {
        AITestClass.orgObjectDefineProperty(window, "crypto",
            {
                configurable: true,
                get () {
                    return crypto;
                }
            });
    }
    
    protected mockPerformance(newPerformance: any) {
        
        try {
            if (!this._orgPerformance) {
                this._hookPerformance();
            }

            // Copy over the mocked values
            for (let name in newPerformance) {
                if (newPerformance.hasOwnProperty(name)) {
                    window.performance[name] = newPerformance[name];
                }
            }
        } catch (e) {
            console.log("Set performance failed - " + e);
            QUnit.assert.ok(true, "Set performance failed - " + e);
            try {
                sinon.stub(window, "performance").returns(newPerformance);
            } catch (ex) {
                console.log("Unable to fallback to stub performance failed - " + e);
                QUnit.assert.ok(true, "Unable to fallback to stub performance failed - " + e);
            }
        }
    }

    private _hookPerformance() {
        if (!this._orgPerformance) {
            this._orgPerformance = {};

            try {
                // Just Blindly copy the properties over
                // tslint:disable-next-line: forin
                for (let name in window.performance) {
                    if (window.performance.hasOwnProperty(name)) {
                        this._orgPerformance[name] = window.performance[name];
                    }
                }
            } catch (e) {
                console.log("Saving performance values - " + e);
                QUnit.assert.ok(false, "Saving performance values failed - " + e);
                // throw e;
            }
        }
    }

    private _restorePerformance() {
        if (this._orgPerformance) {

            try {
                // Just Blindly copy the properties over
                // tslint:disable-next-line: forin
                for (let name in this._orgPerformance) {
                    if (!this._orgPerformance.hasOwnProperty(name)) {
                        window.performance[name] = this._orgPerformance[name];
                    }
                }
            } catch (e) {
                console.log("Restoring performance values - " + e);
                QUnit.assert.ok(false, "Restoring performance values failed - " + e);
                // throw e;
            }

            this._orgNavigator = null;
        }
    }


    private _mockLocation() {
        if (!this._orgLocation) {
            this._orgLocation = window.location;
            let newLocation = <any>{
                // The fields that we want to be able to mock
                href: this._orgLocation.href
            };

            try {
                // Just Blindly copy the properties over
                // tslint:disable-next-line: forin
                for (let name in this._orgLocation) {
                    if (!newLocation.hasOwnProperty(name)) {
                        newLocation[name] = this._orgLocation[name];
                        if (!newLocation.hasOwnProperty(name)) {
                            // if it couldn't be set directly try and pretend
                            AITestClass.orgObjectDefineProperty(newLocation, name,
                                {
                                    configurable: true,
                                    get: function () {
                                        return this._orgLocation[name];
                                    }
                                });
                        }
                    }
                }
            } catch (e) {
                QUnit.assert.ok(false, "Creating navigator copy failed - " + e);
                throw e;
            }

            this.setLocation(newLocation);
        }
    }

    protected setLocationHref(href: string) {
        this._mockLocation();
        (window as any).__mockLocation.href = href;
    }

    protected setLocation(newLocation: Location | null) {
        try {
            if (newLocation) {
                AITestClass.orgObjectDefineProperty(window, "__mockLocation",
                    {
                        configurable: true,
                        enumerable: true,
                        value: newLocation
                    });
            } else {
                delete (window as any).__mockLocation;
            }
        } catch (e) {
            QUnit.assert.ok(true, "Set Location failed - " + e);
            sinon.stub(window, "location").returns(newLocation);
        }
    }

    protected _getXhrRequests(url?: string): FakeXMLHttpRequest[] {
        let requests: FakeXMLHttpRequest[] = [];

        for (let lp = 0; lp < this._xhrRequests.length; lp++) {
            let value = this._xhrRequests[lp];
            if (value && value.url && (!url || value.url.indexOf(url) !== -1)) {
                requests.push(value);
            }
        }

        return requests;
    }

    protected _deleteAllCookies() {
        var cookies = document.cookie.split(";");

        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i];
            if (cookie) {
                var eqPos = cookie.indexOf("=");
                var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
            }
        }
    }

    protected _disableDynProtoBaseFuncs() {
        let defOpts = dynamicProto["_dfOpts"];
        if (defOpts) {
            if (!this._dynProtoOpts) {
                // Save the current settings so we can restore them
                this._dynProtoOpts = {};
                Object.keys(defOpts).forEach((key) => {
                    this._dynProtoOpts[key] = defOpts[key];
                });
            }

            defOpts.useBaseInst = false;
        }
    }

    protected _assertEventsRemoved() {
        this._assertNoEvents(window, "window");
        this._assertNoEvents(document, "document");
        if (document["body"]) {
            this._assertNoEvents(document["body"], "body");
        }

        if (navigator) {
            this._assertNoEvents(navigator, "navigator");
        }

        if (history) {
            this._assertNoEvents(history, "history");
        }
    }

    protected _assertHooksRemoved() {
        this._assertRemoveHooks(history, "history");
        this._assertRemoveHooks(XMLHttpRequest.prototype, "XHR Prototype");
        this._assertRemoveHooks(XMLHttpRequest, "XHR");
        this._assertRemoveHooks(window, "window");
        this._assertRemoveFuncHooks(window.fetch, "fetch");
        this._assertRemoveFuncHooks(window.onerror, "window.onerror");
        this._assertRemoveFuncHooks(window.onunhandledrejection, "window.onunhandledrejection");
    }

    /** Called when the test is starting. */
    private _testStarting() {
        let _self = this;
        // Initialize the sandbox similar to what is done in sinon.js "test()" override. See note on class.
        _self.sandbox = sinon.createSandbox(this.sandboxConfig);

        if (_self.isEmulatingEs3) {
            // As we removed Object.define we need to temporarily restore this for each sandbox call
            for (var field in _self.sandbox) {
                var value = _self.sandbox[field];
                if (typeof value === "function") {
                    _self.sandbox[field] = (function(theValue) {
                        return function() {
                            var orgArguments = arguments;
                            let saveObjectProps = {};
                            // Save and restore the Object properties/functions
                            if (_self._orgObjectFuncs) {
                                for (var name in _self._orgObjectFuncs) {
                                    if (_self._orgObjectFuncs.hasOwnProperty(name) && _self._orgObjectFuncs[name] !== undefined) {
                                        saveObjectProps[name] = Object[name];
                                        Object[name] = _self._orgObjectFuncs[name];
                                    }
                                }
                            }

                            // Call the original sandbox function
                            let result = theValue.apply(this, orgArguments);

                            // Restore the Object properties/functions
                            _self._restoreObject(saveObjectProps);

                            return result;
                        }
                    })(value);
                }
            }
        }

        this._orgCrypto = window.crypto;

        // Allow the derived class to perform test initialization.
        this.testInitialize();
    }

    private _testFinishedCleanup() {
        let doneFuncs = this._onDoneFuncs;
        this._onDoneFuncs = [];
        if (doneFuncs) {
            doneFuncs.forEach((fn) => {
                try {
                    fn();
                } catch (e) {
                    // Do nothing during cleanup
                }
            });
        }

        this.testFinishedCleanup();
    }

    /** Called when the test is completed. */
    private _testCompleted(failed?: boolean) {
        this._unhookXhr();
        this._unhookFetch();

        if (this.clock) {
            this.clock.restore();
            this.clock = null;
        }

        if (this._orgCrypto && window.crypto !== this._orgCrypto) {
            this.setCrypto(this._orgCrypto);
        }

        if (this._orgLocation && window.location !== this._orgLocation) {
            this.setLocation(null);
            this._orgLocation = null;
        }

        if (this._orgNavigator) {
            this.setNavigator(this._orgNavigator);
            this._orgNavigator = null;
        }

        this._restorePerformance();

        this._beaconHooks = [];
        this._cleanupAllHooks();
        this._cleanupEvents();
        this._restoreEs3();

        if (failed) {
            // Just cleanup the sandbox since the test has already failed.
            this.sandbox.restore();
        } else {
            // Verify the sandbox and restore.
            (this.sandbox as any).verifyAndRestore();
        }

        this.sandbox = null;

        this.testCleanup();

        // Clear the instance of the currently running suite.
        AITestClass.currentTestClass = null;
        AITestClass.currentTestInfo = null;

        AITestClass.orgSetTimeout = null;
        AITestClass.orgClearTimeout = null;
    }

    private _assertRemoveFuncHooks(fn:any, targetName: string) {
        let failed = false;

        if (typeof fn === "function") {
            let aiHook:any = fn["_aiHooks"];

            if (aiHook && aiHook.h) {
                aiHook.h.forEach((hook: any) => {
                    Assert.ok(false, targetName + " Hook: " + aiHook.n + "." + _formatNamespace(hook.cbks.ns || "") + " exists");
                    failed = true;
                });

                if (!failed) {
                    QUnit.assert.ok(true, "Validated [" + targetName + "] has no registered hooks");
                } else {
                    QUnit.assert.ok(false, "Hooks: " + JSON.stringify(aiHook.h));
                }
            }
        }
    }

    private _assertRemoveHooks(target:any, targetName: string) {
        if (target) {
            Object.keys(target).forEach(name => {
                try {
                    this._assertRemoveFuncHooks(target[name], targetName + "." + name);
                } catch (e) {
                    // eslint-disable-next-line no-empty
                }
            });
        }
    }

    private _removeFuncHooks(fn:any) {
        if (typeof fn === "function") {
            let aiHook:any = fn["_aiHooks"];

            if (aiHook && aiHook.h) {
                aiHook.h = [];
            }
        }
    }

    private _removeHooks(target:any) {
        if (target) {
            Object.keys(target).forEach(name => {
                try {
                    this._removeFuncHooks(target[name]);
                } catch (e) {
                    // eslint-disable-next-line no-empty
                }
            });
        }
    }

    private _cleanupAllHooks() {
        this._removeHooks(history);
        this._removeHooks(XMLHttpRequest.prototype);
        this._removeHooks(XMLHttpRequest);
        this._removeHooks(window);
        this._removeFuncHooks(window.fetch);
        this._removeFuncHooks(window.onerror);
        this._removeFuncHooks(window.onunhandledrejection);
    }

    private _restoreObject(objectProps: any) {
        if (objectProps) {
            // Restore the Object properties/functions
            for (var name in objectProps) {
                if (objectProps.hasOwnProperty(name) && objectProps[name] !== undefined) {
                    Object[name] = objectProps[name];
                }
            }
        }
    }

    private _restoreEs3() {
        this._restoreObject(this._orgObjectFuncs);
        this._orgObjectFuncs = null;

        this._unhookFetch();
    }

    private _emulateEs3() {
        const objectNames = [ "defineProperty", "defineProperties"];
        if (!this._orgObjectFuncs) {
            this._orgObjectFuncs = {};
            for (var lp = 0; lp < objectNames.length; lp++) {
                let name = objectNames[lp];
                this._orgObjectFuncs[name] = Object[name];
                Object[name] = null;
            }
        }

        if (!this._orgFetch) {
            let global = window as any;
            this._orgFetch = global.fetch;
            global.fetch = null;
        }

        // Lets pretend to also be IE8
        this.setUserAgent("Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 5.1; Trident/4.0)");
    }

    private _unhookXhr() {
        if (this._xhr) {
            if (this._xhrOrgSend) {
                this._xhr.prototype.send = this._xhrOrgSend;
                this._xhrOrgSend = null;
            }

            this._xhr.restore();
            this._xhr = null;
        }
    }

    private _hookXhr() {
        let _self = this;
        if (!_self._xhr) {
            // useFake Server is being re-enabled while we are running a test so we need to re-fake it
            _self._xhr = sinon.useFakeXMLHttpRequest();
            _self._xhrRequests = [];
            _self._xhr.onCreate = (xhr: FakeXMLHttpRequest) => {
                _self._xhrRequests.push(xhr);
            }

            _self._xhrOrgSend = _self._xhr.prototype.send;
            _self._xhr.prototype.send = function() {
                let xhr = this;
                let theArguments = arguments;
                let autoRespond = _self.fakeServerAutoRespond;
                if (AITestClass.currentTestInfo && AITestClass.currentTestInfo.fakeServerAutoRespond !== undefined) {
                    autoRespond = AITestClass.currentTestInfo.fakeServerAutoRespond;
                }

                if (autoRespond && xhr && xhr.url && xhr.method) {
                    AITestClass.orgSetTimeout && AITestClass.orgSetTimeout(() => {
                        if (AITestClass.currentTestInfo && xhr && _self._xhrRequests && _self._xhrRequests.indexOf(xhr) !== -1) {
                            var theResponse: any;
                            if (xhr.url.endsWith("/v2/track")) {
                                theResponse = {
                                    itemsReceived: 1,
                                    itemsAccepted: 1,
                                    errors: [],
                                    appId: "00000000-0000-0000-0000-000000000000"
                                };
                            }
                            xhr.respond(200, {}, (theResponse && JSON.stringify(theResponse)) || "");
                        }
                    }, 5);
                }

                if (_self._xhrOrgSend) {
                    _self._xhrOrgSend.apply(xhr, theArguments);
                }
            }
        }
    }

    private _hookFetch() {
        let _self = this;
        if (!this._orgFetch) {
            let global = window as any;
            this._orgFetch = global.fetch;
            _self._fetchRequests = [];
            global.fetch = function(input: RequestInfo, init?: RequestInit) {
                let theFetch = this;
                _self._fetchRequests.push({
                    input,
                    init
                });

                let theArguments = arguments;
                let autoRespond = _self.fakeFetchAutoRespond;
                if (AITestClass.currentTestInfo && AITestClass.currentTestInfo.fakeFetchAutoRespond !== undefined) {
                    autoRespond = AITestClass.currentTestInfo.fakeFetchAutoRespond;
                }

                if (autoRespond) {
                    return new Promise((resolve, reject) => {
                        AITestClass.orgSetTimeout && AITestClass.orgSetTimeout(() => {
                            if (AITestClass.currentTestInfo) {
                                let theResponse = {
                                    itemsReceived: 1,
                                    itemsAccepted: 1,
                                    errors: [] as any[],
                                    appId: "00000000-0000-0000-0000-000000000000"
                                };
                                resolve(new Response(JSON.stringify(theResponse), {
                                    headers: [],
                                    status: 200,
                                    statusText: "Ok"
                                }));
                            }
                        }, 5);
                    });
                }
                
                return _self._orgFetch.apply(theFetch, theArguments);
            };
        }
    }

    private _unhookFetch() {
        if (this._orgFetch) {
            let global = window as any;
            global.fetch = this._orgFetch;
            this._orgFetch = null;
        }
    }
    
    private _assertNoEvents(target: any, targetName: string): void {
        let failed = false;
        _getAllAiDataKeys(target, (name, value) => {
            if (value && name.startsWith("_aiDataEvents")) {
                let events = value.events;
                if (events) {
                    _objForEachKey(events, (evtName, evts) => {
                        if (evts) {
                            for (let lp = 0; lp < evts.length; lp++) {
                                let theEvent = evts[lp];
                                if (theEvent) {
                                    Assert.ok(false, "[" + targetName + "] has registered event handler [" + evtName + "." + (theEvent.evtName.ns || "") + "]");
                                    failed = true;
                                }
                            }
                        }
                    });
                }
            }
        });

        if (!failed) {
            QUnit.assert.ok(true, "Validated [" + targetName + "] has no registered event handlers");
        }
    }

    private _removeAllEvents(target: any, targetName: string): any {
        let dataName: string[] = [];
        _getAllAiDataKeys(target, (name, value) => {
            if (value && name.startsWith("_aiDataEvents")) {
                dataName.push(name);
                let events = value.events;
                if (events) {
                    _objForEachKey(events, (evtName, evts) => {
                        if (evts) {
                            for (let lp = 0; lp < evts.length; lp++) {
                                let theEvent = evts[lp];
                                if (theEvent) {
                                    console && console.log("Removing [" + targetName + "] event handler " + evtName + "." + (theEvent.evtName.ns || ""));
                                    if (target.removeEventListener) {
                                        target.removeEventListener(evtName, theEvent.handler, theEvent.capture);
                                    }
                                }
                            }
                        }
                    });
                }

                delete value.events;
            }
        });

        for (let lp = 0; lp < dataName.length; lp++) {
            delete target[dataName[lp]];
        }

        return null;
    }

    private _cleanupEvents() {
        this._removeAllEvents(window, "window");
        this._removeAllEvents(document, "document");
        if (document["body"]) {
            this._removeAllEvents(document["body"], "body");
        }

        if (navigator) {
            this._removeAllEvents(navigator, "navigator");
        }

        if (history) {
            this._removeAllEvents(history, "history");
        }
    }
}

// Configure Sinon
sinon.assert.fail = (msg?) => {
    QUnit.assert.ok(false, msg);
};

sinon.assert.pass = (assertion) => {
    QUnit.assert.ok(assertion, "sinon assert");
};

// sinon.config = {
//     injectIntoThis: true,
//     injectInto: null,
//     properties: ["spy", "stub", "mock", "clock", "sandbox"],
//     useFakeTimers: true,
//     useFakeServer: true
// };
