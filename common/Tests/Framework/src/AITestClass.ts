/// <reference path="../../External/qunit.d.ts" />
import dynamicProto from "@microsoft/dynamicproto-js";
import { arrForEach, dumpObj, getGlobal, isArray, objDefineProp, objForEachKey, objGetPrototypeOf, setBypassLazyCache, strStartsWith, throwError, getNavigator, getPerformance, strSubstr, strContains, getDocument, ITimerHandler, isFunction, isPromiseLike } from "@nevware21/ts-utils";
import { SinonSandbox, SinonSpy, SinonStub, SinonMock, useFakeTimers, stub, createSandbox, useFakeXMLHttpRequest, assert as sinonAssert } from "sinon";
import { Assert } from "./Assert";
import { ITestCaseAsync } from "./interfaces/ITestCaseAsync";
import { ITestCase } from "./interfaces/ITestCase";
import { ITestContext } from "./interfaces/ITestContext";
import { StepResult } from "./StepResult";
import { IFakeXMLHttpRequest } from "./interfaces/FakeXMLHttpRequest";
import { IFetchRequest } from "./interfaces/IFetchRequest";
import { IBeaconRequest } from "./interfaces/IBeaconRequest";
import { createPromise, createSyncPromise, createTaskScheduler, createTimeoutPromise, doAwait, FinallyPromiseHandler, IPromise, RejectedPromiseHandler, ResolvedPromiseHandler } from "@nevware21/ts-async";
import { AITestQueueTask, IAsyncQueue } from "./interfaces/IASyncQueue";

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
        arrForEach(keys, (key) => {
            if (strStartsWith(key, "_aiData")) {
                callbackfn.call(target, key, target[key]);
            }
        });
    }
}

function _formatNamespace(namespaces: string | string[]) {
    if (namespaces) {
        if (isArray(namespaces)) {
            return namespaces.sort().join(".");
        }
    }

    return namespaces || "";
}

/**
 * @internal
 * This is HIGHLY specific to the QUnit test framework (and possibly the version) and should be updated for other frameworks
 * @param name - The new test name to set
 * @param message - The message to log to the console
 */
function _updateQUnitTestName(name: string, message: string) {
    // Mark the test as asynchronous by updating the QUnit test name
    // This is specific to the QUnit test framework and may need to be updated for other frameworks
    const currentTest: any = QUnit.config && QUnit.config.current;
    if (currentTest) {
        if ("testName" in currentTest) {
            currentTest.testName = name;
        }

        if ("testReport" in currentTest) {
            if ("name" in currentTest.testReport) {
                currentTest.testReport.name = name;
            }

            if ("fullName" in currentTest.testReport && isArray(currentTest.testReport.fullName) && currentTest.testReport.fullName.length == 2) {
                currentTest.testReport.fullName[1] = name;
            }
        }

        // Update the HTML report to include the updated test name
        let doc = getDocument();
        let parentElm = doc.getElementById("qunit-test-output-" + currentTest.testId);
        if (parentElm) {
            let testName: HTMLElement = parentElm.querySelector(".test-name");
            if (testName) {
                testName.innerText = name;
            }
        }
    }

    QUnit.assert.ok(true, message || ("Updating test name to: " + name));
}

export class AITestClass {
    public static orgSetTimeout: (callback: (...args: any[]) => void, ms: number, ...args: any[]) => NodeJS.Timeout;
    public static orgClearTimeout: (timeoutId: NodeJS.Timeout) => void;
    public static orgLocalStorage: Storage;
    public static orgObjectDefineProperty = Object.defineProperty;
    public static isPollingStepFlag = "isPollingStep";

    /** The instance of the currently running suite. */
    public static currentTestClass: AITestClass;
    public static currentTestInfo: ITestCase | ITestCaseAsync;
    private static _currentTestContext: ITestContext | null = null;

    /**
     * Find a named base class for the provided class instance, using an instance so that any dynamicProto() implementations have been resolved.
     * @param rootInstance An instance of the Class that you want to find the named base class.
     * @param baseClassName The name of the base class
     * @returns The named base class constructor or null if not found
     */
    public static GetNamedBaseClass<T>(rootInstance: T, baseClassName: string) {
        let rootPrototype = objGetPrototypeOf(rootInstance);
        let parent = rootPrototype;
        while (parent != null) {
            if (parent != rootPrototype) {
                let parentName = parent.constructor.name;
                if (parentName == baseClassName) {
                    return parent.constructor;
                }
        
                if (!parentName || parentName == "Object") {
                    break;
                }
            }
    
            parent = objGetPrototypeOf(parent);
        }
    
        return null;
    }
    
    /** Turns on/off sinon's fake implementation of XMLHttpRequest. On by default. */
    public sandboxConfig: any = {};

    
    /**** Sinon methods and properties ***/

    // These methods and properties are injected by Sinon and will override the implementation here.
    // These are here purely to make typescript happy.
    protected clock: any;
    public sandbox: SinonSandbox;
    public fakeServerAutoRespond: boolean = false;
    public fakeFetchAutoRespond: boolean = false;
    public isEmulatingIe: boolean;

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
    private _beaconHooked: boolean = false;
    private _beaconHooks: any[] = [];
    private _dynProtoOpts: any = null;
    private _orgLocalStorage: any;
    private _navOrgProduct:string;

    // Simulate an IE environment
    private _orgObjectFuncs: any = null;
    private _orgFetch: any = null;
    private _orgSymbol: Symbol = null;

    private _onDoneFuncs: VoidFunction[] = [];

    constructor(name?: string, emulateIE?: boolean) {
        this._moduleName = (emulateIE ? "(IE) " : "") + (name || _getObjName(this, ""));
        this.isEmulatingIe = emulateIE;
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

    get activeXhrRequests(): IFakeXMLHttpRequest[] {
        let activeRequests: IFakeXMLHttpRequest[] = [];

        this._xhrRequests.forEach((xhr) => {
            if (xhr && xhr.url && xhr.method) {
                activeRequests.push(xhr);
            }
        });

        return activeRequests;
    }

    protected get _testContext(): ITestContext {
        if (AITestClass._currentTestContext) {
            return AITestClass._currentTestContext;
        }

        return {
            name: AITestClass.currentTestInfo ? AITestClass.currentTestInfo.name : "<undefined>",
            context: {},
            pollDelay: 100,
            testDone: () => { },
            clock: AITestClass.currentTestClass ? AITestClass.currentTestClass.clock : null,
            finished: true
        };
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

    /**
     * Register an async Javascript unit testcase.
     * @deprecated Use the normal {@link AITestClass.testCase} method instead and return a Promise from the test method,
     * this will be automatically detected and handled as an asynchronous test case. For Polling test cases instead of
     * using {@link PollingAssert.createPollingAssert} use {@link AITestClass._asyncQueue} {@link PollingAssert.asyncTaskPollingAssert}
     * which will use Promise(s) that will resolve immediately once the polling has completed.
     */
    public testCaseAsync(testInfo: ITestCaseAsync) {
        if (!testInfo.name) {
            throwError("Must specify name in testInfo context in registerTestcase call");
        }

        if (isNaN(testInfo.stepDelay)) {
            throwError("Must specify 'stepDelay' period between pre and post");
        }

        if (!testInfo.steps) {
            throwError("Must specify 'steps' to take asynchronously");
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
            AITestClass.orgLocalStorage = window.localStorage;

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

            if (useFakeFetch && !self.isEmulatingIe) {
                self._hookFetch();
            }

            if (testInfo.useFakeTimers) {
                self.clock = useFakeTimers();
            }

            if (self.isEmulatingIe) {
                self._emulateIE();
            }

            if (testInfo.assertNoEvents === undefined) {
                testInfo.assertNoEvents = self.assertNoEvents;
            }

            if (testInfo.assertNoHooks === undefined) {
                testInfo.assertNoHooks = self.assertNoHooks;
            }

            // Run the test.
            try {
                let self = this;
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
                    name: testInfo.name,
                    context: {},
                    pollDelay: testInfo.stepDelay || 100,
                    testDone: testDone,
                    clock: testInfo.useFakeTimers ? self.clock : null,
                    finished: false
                };

                AITestClass._currentTestContext = testContext;

                if (testInfo.skipTimeout !== true && testInfo.timeOut !== undefined) {
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
                    const nextTestStepTrigger = () => {
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
                                testContext.clock = this.clock || null;
                                if (step[AITestClass.isPollingStepFlag]) {
                                    step.call(this, testContext, nextTestStepTrigger);
                                } else {
                                    step[stepRetryCnt] = step[stepRetryCnt] || 0;
    
                                    let result = step.call(this, testContext);
                                    if (result === StepResult.Retry || result === false) {
                                        // The step requested itself to be retried
                                        Assert.ok(false, "Retrying Step - " + stepIndex + " - Attempt #" + step[stepRetryCnt]);
                                        step[stepRetryCnt] = step[stepRetryCnt] + 1;
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
                            // tslint:disable-next-line:no-console
                            console && console.error("Failed: Unexpected Exception: " + dumpObj(e));
                            Assert.ok(false, dumpObj(e));

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
                // tslint:disable-next-line:no-console
                console && console.error("Failed: Unexpected Exception: " + dumpObj(ex));
                Assert.ok(false, "Unexpected Exception: " + dumpObj(ex));
                self._testCompleted(true);

                // done is QUnit callback indicating the end of the test
                done();
            }
        };

        // Register the test with QUnit
        QUnit.test((this.isEmulatingIe ? "(IE) " : "") + testInfo.name + " - (Async)", testMethod);
    }

    /** Register a Javascript unit testcase. */
    public testCase(testInfo: ITestCase) {
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
            AITestClass.orgLocalStorage = window.localStorage;

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
                this.clock = useFakeTimers();
            }

            if (this.isEmulatingIe) {
                this._emulateIE();
            }

            if (testInfo.assertNoEvents === undefined) {
                testInfo.assertNoEvents = this.assertNoEvents;
            }

            if (testInfo.assertNoHooks === undefined) {
                testInfo.assertNoHooks = this.assertNoHooks;
            }

            let testContext = {
                name: testInfo.name,
                context: {},
                pollDelay: testInfo.pollDelay,
                testDone: () => {
                    _testFinished(true);
                },
                clock: testInfo.useFakeTimers ? self.clock : null,
                finished: false
            };

            let testTimeout: any

            // Run the test.
            try {
                this._testStarting();

                if (testInfo.skipTimeout !== true) {
                    // Default timeout for tests has been set to 30 seconds
                    let timeout = testInfo.timeout || 30000;
                    testTimeout = AITestClass.orgSetTimeout(() => {
                        if (!testContext.finished) {
                            QUnit.assert.ok(false, "Timeout: Aborting as the Promise returned from the test method did not resolve within " + timeout + " ms");
                            testTimeout = null;
                        }

                        _testFinished(true);
                    }, timeout);
                }

                AITestClass._currentTestContext = testContext;

                // Call the test method directly
                let result = testInfo.test.call(this);

                if (result && result.waitComplete) {
                    // looks like an IAsyncQueue object
                    result = result.waitComplete();
                }

                // Check if the result is present and looks like a Promise
                if (result && result.then) {
                    // Append "(Async)" to the test name to indicate that this is an async test"
                    _updateQUnitTestName((this.isEmulatingIe ? "(IE) " : "") + testInfo.name + " - (Async)", " -=( Async test detected -- updating test name )=-");
                    result.then(() => {
                        if (!testContext.finished) {
                            testTimeout && AITestClass.orgClearTimeout(testTimeout);
                            testTimeout = null;
                            QUnit.assert.ok(true, "Returned Promise resolved");
                        }

                        _testFinished();
                    });
                    result.catch && result.catch((reason: any) => {
                        if (!testContext.finished) {
                            testTimeout && AITestClass.orgClearTimeout(testTimeout);
                            testTimeout = null;
                            QUnit.assert.ok(false, "Returned Promise rejected: " + reason);
                        }

                        _testFinished(true);
                    });
                } else {
                    testTimeout && AITestClass.orgClearTimeout(testTimeout);
                    testTimeout = null;
                    _testFinished();
                }
            } catch (ex) {
                if (!testContext.finished) {
                    // tslint:disable-next-line:no-console
                    console && console.error("Failed: Unexpected Exception: " + dumpObj(ex));
                    Assert.ok(false, "Unexpected Exception: " + dumpObj(ex));
                    testTimeout && AITestClass.orgClearTimeout(testTimeout);
                    testTimeout = null;
                }

                _testFinished(true);
            }
        };

        // Register the test with QUnit
        QUnit.test((this.isEmulatingIe ? "(IE) " : "") + testInfo.name, testMethod);
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
     * @param request - The request to respond to.
     * @param data - Data to respond with.
     * @param errorCode - Optional error code to send with the request, default is 200
     */
    public sendJsonResponse(request: IFakeXMLHttpRequest, data: any, errorCode?: number) {
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
                call[0].forEach((item: any) => {
                    let message = item;
                    if (typeof item !== "string") {
                        message = item.item;
                    }
                    if (message) {
                        // Ignore the internal SendBrowserInfoOnUserInit message (Only occurs when running tests in a browser)
                        if (includeInit || message.indexOf("AI (Internal): 72 ") === -1) {
                            resultPayload.push(message);
                        }
                    }
                });
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
        
    protected _asyncQueue(): IAsyncQueue {
        let testContext = this._testContext;
        // This is an async task, so we need to wait for it to complete
        let scheduler = createTaskScheduler(createPromise, testContext.name);

        function _addTask(theTask: AITestQueueTask, taskName?: string, timeout?: number): IAsyncQueue {
            if (theTask) {
                scheduler.queue((taskName: string) => {
                    if (!testContext.finished) {
                        QUnit.assert.ok(true, "Task: " + taskName);
                        return theTask.call(this, testContext);
                    }
                }, taskName || theTask.name || "", timeout);
            }

            return theAsyncTasks;
        }

        function _doAwait<T, TResult1 = T, TResult2 = never>(value: T | PromiseLike<T>,  resolveFn: ResolvedPromiseHandler<T, TResult1>, rejectFn?: RejectedPromiseHandler<TResult2>, finallyFn?: FinallyPromiseHandler): IAsyncQueue {
            scheduler.queue((taskName: string) => {
                if (!testContext.finished) {
                    QUnit.assert.ok(true, "Await: " + taskName);
                    let result = doAwait(value, resolveFn, rejectFn, finallyFn);
                    if (isPromiseLike(result)) {
                        return result as IPromise<any>;
                    }
                }
            });
            
            return theAsyncTasks;
        }

        let theAsyncTasks: IAsyncQueue = {
            add: _addTask,
            concat: _addTask,
            doAwait: _doAwait,
            waitComplete: () => {
                // Wait for the scheduler to complete
                return scheduler.queue(() => {
                    if (!testContext.finished) {
                        QUnit.assert.ok(true, "Async Tasks complete");
                    }
                }, "Async Tasks complete");
            }
        };

        return theAsyncTasks;
    }

    protected _delay(ms: number, nextTask: AITestQueueTask): IPromise<void> {
        let testContext = this._testContext;
        return createTimeoutPromise(ms, true).then(() => {
            if (testContext && testContext.finished) {
                return;
            }

            if (testContext && testContext.clock) {
                testContext.clock.tick(ms);
            }

            return nextTask(testContext);
        });
    }

    protected onDone(cleanupFn: VoidFunction) {
        if (cleanupFn && this._onDoneFuncs) {
            this._onDoneFuncs.push(cleanupFn);
        }
    }

    protected setUserAgent(userAgent: string) {
        // Hook Send beacon which also mocks navigator
        if (!this._orgNavigator) {
            // Hook the navigator
            this.hookSendBeacon(null);
        }
	
        this.setNavigator({
            userAgent: userAgent
        }, true);
    }

    protected setUserAgentData(userAgentData: any) {
        // Hook Send beacon which also mocks navigator
        if (!this._orgNavigator) {
            this.hookSendBeacon(null);
        }

        try {
            AITestClass.orgObjectDefineProperty(getNavigator(), "userAgentData",
                {
                    configurable: true,
                    get: function () {
                        return userAgentData;
                    }
                });

            setBypassLazyCache(true);
        } catch (e) {
            Assert.ok(false, "Failed to set the userAgent - " + e);
            throw e;
        }
    }

    protected setReactNative() {
        this._setNavProduct("ReactNative");
    }

    protected hookSendBeacon(cb: (url: string, data?: BodyInit | null) => void): IBeaconRequest[] {
        let _self = this;
        let calls:IBeaconRequest[] = [];

        if (cb) {
            _self._beaconHooks.push((url: string, data: any) => {
                calls.push({
                    url,
                    data
                });
    
                return cb(url, data);
            });
        }

        if (!_self._beaconHooked) {
            let newNavigator = <any>{};

            newNavigator.sendBeacon = (url: string, data: any) => {
                let returnValue = false;
                let handled = false;
    
                // Note: Using the _self and not the current this
                _self._beaconHooks.forEach(element => {
                    let result = element(url, data);
                    if (result !== undefined) {
                        returnValue = returnValue || result;
                        handled = true;
                    }
                });
                if (!handled) {
                    return _self._orgNavigator.sendBeacon(url, data);
                }
    
                return returnValue;
            };
    
            _self.setNavigator(newNavigator, true);
            setBypassLazyCache(true);
            _self._beaconHooked = true;
        }

        return calls;
    }

    protected hookFetch<T>(executor: (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void): IFetchRequest[] {
        let calls: IFetchRequest[] = [];
        let global = getGlobal() as any;

        if (!this._orgFetch) {
            // Save Previous fetch so we can restore it
            this._orgFetch = global.fetch;
        }

        global.fetch = function(input: RequestInfo, init?: RequestInit) {
            calls.push({
                input,
                init
            });

            return createSyncPromise(executor);
        }
    
        return calls;
    }

    protected setNavigator(newNavigator: any, mergeWithExisting: boolean) {
        let navigator = getNavigator();

        if (!this._orgNavigator) {
            this._orgNavigator = navigator;
        }

        if (newNavigator != this._orgNavigator || newNavigator !== navigator) {
            if (mergeWithExisting) {
                try {
                    // Just Blindly copy the properties over onto the new Navigator
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
            }

            try {
                AITestClass.orgObjectDefineProperty(window, "navigator",
                    {
                        configurable: true,
                        get: function () {
                            return newNavigator || navigator;
                        }
                    });

                setBypassLazyCache(true);
            } catch (e) {
                Assert.ok(false, "Failed to set the navigator obejct");
            }
        }
    }

    protected setLocalStorage(newLocalStorage: Storage | undefined | null) {
        if (!this._orgLocalStorage) {
            // Save the original local storage
            this._orgLocalStorage = AITestClass.orgLocalStorage;
        }

        AITestClass.orgObjectDefineProperty(window, "localStorage",
            {
                configurable: true,
                get: function() {
                    return newLocalStorage;
                }
            });

        setBypassLazyCache(true);
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
                stub(window, "performance").returns(newPerformance);
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

                getPerformance();
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

            this._orgPerformance = null;
        }

        getPerformance();
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
            stub(window, "location").returns(newLocation);
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
                var name = eqPos > -1 ? strSubstr(cookie, 0, eqPos) : cookie;
                document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
            }
        }
    }

    protected _clearSessionStorage() {
        if (window.sessionStorage) {
            window.sessionStorage.clear();
        }
    }

    protected _clearLocalStorage() {
        if (window.localStorage) {
            window.localStorage.clear();
        }
    }

    protected _disableDynProtoBaseFuncs(dynamicProtoInst: typeof dynamicProto = dynamicProto) {
        let defOpts = dynamicProtoInst["_dfOpts"];
        if (defOpts) {
            if (!this._dynProtoOpts) {
                // Save the current settings so we can restore them
                this._dynProtoOpts = {};
                Object.keys(defOpts).forEach((key) => {
                    this._dynProtoOpts[key] = defOpts[key];
                });
            }

            defOpts.useBaseInst = false;
            defOpts.strSetInstFuncs = false;
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

    private _setNavProduct(product: string) {
        // Hook Send beacon which also mocks navigator
        if (!this._orgNavigator) {
            this.hookSendBeacon(null);
        }
        let nav = getNavigator();

        if (!this._navOrgProduct) {
            // Save the original navigator product if we have not already
            this._navOrgProduct = nav.product;
        }

        objDefineProp(nav, "product",
            {
                configurable: true,
                get: function () {
                    return product;
                }
            });

        setBypassLazyCache(true);
    }

    /** Called when the test is starting. */
    private _testStarting() {
        let _self = this;
        // Initialize the sandbox similar to what is done in sinon.js "test()" override. See note on class.
        _self.sandbox = createSandbox(this.sandboxConfig);
        // Clear out all cookies
        _self._deleteAllCookies();
        _self._clearSessionStorage();
        _self._clearLocalStorage();

        if (_self.isEmulatingIe) {
            // Reset any previously cached values, which may have grabbed the mocked values
            setBypassLazyCache(true);

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
        if (AITestClass._currentTestContext) {
            // Tag the test context as finished so we don't try and call the testDone function again
            AITestClass._currentTestContext.finished = true;
            AITestClass._currentTestContext.failed = failed;
        }

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
            this.setNavigator(this._orgNavigator, false);
            Assert.ok(this._orgNavigator === getNavigator(), "Navigator should have been restored - " + this._orgNavigator.userAgent + "::" + getNavigator().userAgent);
            this._orgNavigator = null;
        }

        if (this._orgLocalStorage) {
            this.setLocalStorage(this._orgLocalStorage);
            this._orgLocalStorage = null;
        }

        this._restorePerformance();

        this._beaconHooks = [];
        this._beaconHooked = false;
        this._cleanupAllHooks();
        this._cleanupEvents();
        this._restoreIE();

        Assert.equal(false, isIE(), "We should not be emulating IE anymore - " + getNavigator().userAgent);

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
        AITestClass._currentTestContext = null;

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

    private _restoreIE() {
        // We need to clear any lazy cached global values
        setBypassLazyCache(true);

        this._restoreObject(this._orgObjectFuncs);
        this._orgObjectFuncs = null;

        this._unhookFetch();

        if (this._orgSymbol) {
            let global = window as any;
            global["Symbol"] = this._orgSymbol;
            this._orgSymbol = null;
        }
    }

    private _emulateIE() {
        const objectNames = [ "assign" ];
        if (!this._orgObjectFuncs) {
            this._orgObjectFuncs = {};
            for (var lp = 0; lp < objectNames.length; lp++) {
                let name = objectNames[lp];
                this._orgObjectFuncs[name] = Object[name];
                Object[name] = null;
            }
        }

        // clear any lazy cached global values
        setBypassLazyCache(true);

        let global = getGlobal() as any;
        if (!this._orgFetch) {
            this._orgFetch = global.fetch;
            global.fetch = null;
        }

        // Hook Send beacon which also mocks navigator
        if (!this._orgNavigator) {
            this.hookSendBeacon(null);
        }

        // Remove beacon support
        global.sendBeacon = null;

        // Lets pretend to also be IE9
        this.setUserAgent("Mozilla/4.0 (compatible; MSIE 9.0; Windows NT 6.0; Trident/5.0)");

        if (!this._orgSymbol) {
            this._orgSymbol = global["Symbol"];
            global["Symbol"] = undefined;
        }
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
            _self._xhr = useFakeXMLHttpRequest();
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
                    objForEachKey(events, (evtName, evts) => {
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
                    objForEachKey(events, (evtName, evts) => {
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
sinonAssert.fail = (msg?) => {
    QUnit.assert.ok(false, msg);
};

sinonAssert.pass = (assertion) => {
    QUnit.assert.ok(assertion, "sinon assert");
};

/**
 * Identifies whether the current environment appears to be IE
 */
export function isIE() {
    let nav = getNavigator();
    if (nav) {
        let userAgent = (nav.userAgent || "").toLowerCase();
        return strContains(userAgent, "msie") || strContains(userAgent, "trident/");
    }

    return false;
}

// sinon.config = {
//     injectIntoThis: true,
//     injectInto: null,
//     properties: ["spy", "stub", "mock", "clock", "sandbox"],
//     useFakeTimers: true,
//     useFakeServer: true
// };
