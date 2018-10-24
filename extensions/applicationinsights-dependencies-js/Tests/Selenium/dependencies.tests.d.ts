/// <reference path="../External/qunit.d.ts" />
/// <reference path="../External/sinon.d.ts" />
/** Wrapper around QUnit asserts. This class has two purposes:
 * - Make Assertion methods easy to discover.
 * - Make them consistent with XUnit assertions in the order of the actual and expected parameter values.
 */
declare class Assert {
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
    static deepEqual(expected: any, actual: any, message?: string): any;
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
    static equal(expected: any, actual: any, message?: string): any;
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
    static notDeepEqual(expected: any, actual: any, message?: string): any;
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
    static notEqual(expected: any, actual: any, message?: string): any;
    static notPropEqual(expected: any, actual: any, message?: string): any;
    static propEqual(expected: any, actual: any, message?: string): any;
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
    static notStrictEqual(expected: any, actual: any, message?: string): any;
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
    static ok(state: any, message?: string): any;
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
    static strictEqual(expected: any, actual: any, message?: string): any;
    /**
    * Assertion to test if a callback throws an exception when run.
    *
    * When testing code that is expected to throw an exception based on a specific set of
    * circumstances, use throws() to catch the error object for testing and comparison.
    *
    * @param block Function to execute
    * @param expected Error Object to compare
    * @param message A short description of the assertion
    */
    static throws(block: () => any, expected: any, message?: string): any;
    /**
    * @param block Function to execute
    * @param message A short description of the assertion
    */
    static throws(block: () => any, message?: string): any;
}
/** Defines a test case */
declare class TestCase {
    /** Name to use for the test case */
    name: string;
    /** Test case method */
    test: () => void;
}
/** Defines a test case */
interface TestCaseAsync {
    /** Name to use for the test case */
    name: string;
    /** time to wait after pre before invoking post and calling start() */
    stepDelay: number;
    /** async steps */
    steps: Array<() => void>;
}
declare class TestClass {
    constructor(name?: string);
    static isPollingStepFlag: string;
    /** The instance of the currently running suite. */
    static currentTestClass: TestClass;
    /** Turns on/off sinon's syncronous implementation of setTimeout. On by default. */
    useFakeTimers: boolean;
    /** Turns on/off sinon's fake implementation of XMLHttpRequest. On by default. */
    useFakeServer: boolean;
    /** Method called before the start of each test method */
    testInitialize(): void;
    /** Method called after each test method has completed */
    testCleanup(): void;
    /** Method in which test class intances should call this.testCase(...) to register each of this suite's tests. */
    registerTests(): void;
    /** Register an async Javascript unit testcase. */
    testCaseAsync(testInfo: TestCaseAsync): void;
    /** Register a Javascript unit testcase. */
    testCase(testInfo: TestCase): void;
    /** Called when the test is starting. */
    private _testStarting();
    /** Called when the test is completed. */
    private _testCompleted(failed?);
    /**** Sinon methods and properties ***/
    clock: SinonFakeTimers;
    server: SinonFakeServer;
    sandbox: SinonSandbox;
    /** Creates an anonymous function that records arguments, this value, exceptions and return values for all calls. */
    spy(): SinonSpy;
    /** Spies on the provided function */
    spy(funcToWrap: Function): SinonSpy;
    /** Creates a spy for object.methodName and replaces the original method with the spy. The spy acts exactly like the original method in all cases. The original method can be restored by calling object.methodName.restore(). The returned spy is the function object which replaced the original method. spy === object.method. */
    spy(object: any, methodName: string, func?: Function): SinonSpy;
    /** Creates an anonymous stub function. */
    stub(): SinonStub;
    /** Stubs all the object's methods. */
    stub(object: any): SinonStub;
    /** Replaces object.methodName with a func, wrapped in a spy. As usual, object.methodName.restore(); can be used to restore the original method. */
    stub(object: any, methodName: string, func?: Function): SinonStub;
    /** Creates a mock for the provided object.Does not change the object, but returns a mock object to set expectations on the object's methods. */
    mock(object: any): SinonMock;
    /**** end: Sinon methods and properties ***/
    /** Sends a JSON response to the provided request.
     * @param request The request to respond to.
     * @param data Data to respond with.
     * @param errorCode Optional error code to send with the request, default is 200
    */
    sendJsonResponse(request: SinonFakeXMLHttpRequest, data: any, errorCode?: number): void;
    protected setUserAgent(userAgent: string): void;
}
declare module "src/ajaxRecord" {
    import { IDiagnosticLogger } from 'applicationinsights-core-js';
    export class XHRMonitoringState {
        openDone: boolean;
        setRequestHeaderDone: boolean;
        sendDone: boolean;
        abortDone: boolean;
        onreadystatechangeCallbackAttached: boolean;
    }
    export class ajaxRecord {
        completed: boolean;
        requestHeadersSize: any;
        ttfb: any;
        responseReceivingDuration: any;
        callbackDuration: any;
        ajaxTotalDuration: any;
        aborted: any;
        pageUrl: any;
        requestUrl: any;
        requestSize: number;
        method: any;
        status: any;
        requestSentTime: any;
        responseStartedTime: any;
        responseFinishedTime: any;
        callbackFinishedTime: any;
        endTime: any;
        originalOnreadystatechage: any;
        xhrMonitoringState: XHRMonitoringState;
        private _logger;
        clientFailure: number;
        id: string;
        constructor(id: string, logger: IDiagnosticLogger);
        getAbsoluteUrl(): string;
        getPathName(): any;
        CalculateMetrics: () => void;
    }
}
declare module "src/ajaxUtils" {
    export class stringUtils {
        static GetLength(strObject: any): number;
    }
    export class EventHelper {
        static AttachEvent(obj: any, eventNameWithoutOn: any, handlerRef: any): boolean;
        static DetachEvent(obj: any, eventNameWithoutOn: any, handlerRef: any): void;
    }
}
declare module "src/ajax" {
    import { IDependencyTelemetry } from 'applicationinsights-common';
    import { IAppInsightsCore, ITelemetryPlugin, IConfiguration, IPlugin, ITelemetryItem } from 'applicationinsights-core-js';
    import { ajaxRecord } from "src/ajaxRecord";
    export interface XMLHttpRequestInstrumented extends XMLHttpRequest {
        ajaxData: ajaxRecord;
    }
    export interface IDependenciesPlugin {
        trackDependencyData(dependency: IDependencyTelemetry, properties?: {
            [key: string]: any;
        }, systemProperties?: {
            [key: string]: any;
        }): any;
    }
    export class AjaxMonitor implements ITelemetryPlugin, IDependenciesPlugin {
        private initialized;
        private currentWindowHost;
        private _core;
        private _config;
        private _nextPlugin;
        private _trackAjaxAttempts;
        constructor();
        private isMonitoredInstance(xhr, excludeAjaxDataValidation?);
        private supportsMonitoring();
        private instrumentOpen();
        private openHandler(xhr, method, url, async);
        private static getFailedAjaxDiagnosticsMessage(xhr);
        private instrumentSend();
        private sendHandler(xhr, content);
        private instrumentAbort();
        private attachToOnReadyStateChange(xhr);
        private onAjaxComplete(xhr);
        private getCorrelationContext(xhr);
        /**
            * Logs dependency call
            * @param dependencyData dependency data object
            */
        trackDependencyData(dependency: IDependencyTelemetry, properties?: {
            [key: string]: any;
        }, systemProperties?: {
            [key: string]: any;
        }): void;
        processTelemetry(item: ITelemetryItem): void;
        identifier: string;
        setNextPlugin(next: ITelemetryPlugin): void;
        priority: number;
        initialize(config: IConfiguration, core: IAppInsightsCore, extensions: IPlugin[]): void;
    }
}
declare module "Tests/Selenium/ajax.tests" {
    export class AjaxTests extends TestClass {
        private appInsightsMock;
        private trackDependencySpy;
        testInitialize(): void;
        testCleanup(): void;
        registerTests(): void;
        private testAjaxSuccess(responseCode, success);
    }
}
declare module "Tests/Selenium/dependencies.tests" {
    export function runTests(): void;
}
