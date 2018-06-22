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
declare class PollingAssert {
    /**
    * Starts polling assertion function for a period of time after which it's considered failed.
    * @param {() => boolean} assertionFunctionReturnsBoolean - funciton returning true if condition passes and false if condition fails. Assertion will be done on this function's result.
    * @param {string} assertDescription - message shown with the assertion
    * @param {number} timeoutSeconds - timeout in seconds after which assertion fails
    * @param {number} pollIntervalMs - polling interval in milliseconds
    * @returns {(nextTestStep) => void} callback which will be invoked by the TestClass
    */
    static createPollingAssert(assertionFunctionReturnsBoolean: () => boolean, assertDescription: string, timeoutSeconds?: number, pollIntervalMs?: number): (nextTestStep) => void;
}
declare module "JavaScriptSDK.Interfaces/ITelemetryItem" {
    /**
     * Telemety item supported in Core
     */
    export interface ITelemetryItem {
        /**
         * Unique name of the telemetry item
         */
        name: string;
        /**
         * Timestamp when item was sent
         */
        timestamp: Date;
        /**
         * Telemetry type
         */
        baseType: string;
        /**
         * Identifier of the resource that uniquely identifies which resource data is sent to
         */
        instrumentationKey: string;
        /**
         * System context properties of the telemetry item, example: ip address, city etc
         */
        sytemProperties?: {
            [key: string]: any;
        };
        /**
         * Telemetry properties pertaining to domain about which data is being captured. Example, duration, referrerUri for browser page
         * This is standard set by domain
         */
        domainProperties?: {
            [key: string]: any;
        };
        /**
         * Custom properties to be captured about the telemetry item
         */
        customProperties?: {
            [key: string]: any;
        };
    }
}
declare module "JavaScriptSDK.Interfaces/IConfiguration" {
    /**
     * Configuration provided to SDK core
     */
    export interface IConfiguration {
        /**
        * Instrumentation key of resource
        */
        instrumentationKey: string;
        /**
        * Endpoint where telemetry data is sent
        */
        endpointUrl?: string;
        /**
        * Extension configs loaded in SDK
        */
        extensions?: {
            [key: string]: any;
        };
    }
}
declare module "JavaScriptSDK.Interfaces/ITelemetryPlugin" {
    import { ITelemetryItem } from "JavaScriptSDK.Interfaces/ITelemetryItem";
    import { IConfiguration } from "JavaScriptSDK.Interfaces/IConfiguration";
    import { IAppInsightsCore } from "JavaScriptSDK.Interfaces/IAppInsightsCore";
    /**
     * Configuration provided to SDK core
     */
    export interface ITelemetryPlugin extends IPlugin {
        /**
        * Call back for telemetry processing before it it is sent
        */
        processTelemetry: (env: ITelemetryItem) => void;
        /**
        * Extension name
        */
        identifier: string;
        /**
        * Set next extension for telemetry processing
        */
        setNextPlugin: (next: ITelemetryPlugin) => void;
        /**
        * Priority of the extension
        */
        priority: number;
    }
    export interface IPlugin {
        /**
        * Initialize plugin loaded by SDK
        */
        initialize: (config: IConfiguration, core: IAppInsightsCore, extensions: IPlugin[]) => void;
    }
}
declare module "JavaScriptSDK.Interfaces/IChannelControls" {
    import { ITelemetryPlugin } from "JavaScriptSDK.Interfaces/ITelemetryPlugin";
    /**
     * Provides data transmission capabilities
     */
    export interface IChannelControls extends ITelemetryPlugin {
        /**
         * Pause sending data
         */
        pause(): void;
        /**
         * Resume sending data
         */
        resume(): void;
        /**
         * Tear down transmission pipeline
         */
        teardown(): void;
    }
    export const MinChannelPriorty: number;
}
declare module "JavaScriptSDK.Interfaces/IAppInsightsCore" {
    import { ITelemetryItem } from "JavaScriptSDK.Interfaces/ITelemetryItem";
    import { IChannelControls } from "JavaScriptSDK.Interfaces/IChannelControls";
    import { IPlugin } from "JavaScriptSDK.Interfaces/ITelemetryPlugin";
    import { IConfiguration } from "JavaScriptSDK.Interfaces/IConfiguration";
    export interface IAppInsightsCore {
        config: IConfiguration;
        initialize(config: IConfiguration, extensions: IPlugin[]): void;
        getTransmissionControl(): IChannelControls;
        track(telemetryItem: ITelemetryItem): any;
    }
}
declare module "JavaScriptSDK/CoreUtils" {
    export class CoreUtils {
        static isNullOrUndefined(input: any): boolean;
    }
}
declare module "JavaScriptSDK/AppInsightsCore" {
    import { IAppInsightsCore } from "JavaScriptSDK.Interfaces/IAppInsightsCore";
    import { IConfiguration } from "JavaScriptSDK.Interfaces/IConfiguration";
    import { IPlugin } from "JavaScriptSDK.Interfaces/ITelemetryPlugin";
    import { IChannelControls } from "JavaScriptSDK.Interfaces/IChannelControls";
    import { ITelemetryItem } from "JavaScriptSDK.Interfaces/ITelemetryItem";
    export class AppInsightsCore implements IAppInsightsCore {
        config: IConfiguration;
        static defaultConfig: IConfiguration;
        private _extensions;
        constructor();
        initialize(config: IConfiguration, extensions: IPlugin[]): void;
        getTransmissionControl(): IChannelControls;
        track(telemetryItem: ITelemetryItem): void;
        private _validateTelmetryItem(telemetryItem);
    }
}
declare module "applicationinsights-core-js" {
    export { IConfiguration } from "JavaScriptSDK.Interfaces/IConfiguration";
    export { IChannelControls, MinChannelPriorty } from "JavaScriptSDK.Interfaces/IChannelControls";
    export { ITelemetryPlugin, IPlugin } from "JavaScriptSDK.Interfaces/ITelemetryPlugin";
    export { IAppInsightsCore } from "JavaScriptSDK.Interfaces/IAppInsightsCore";
    export { ITelemetryItem } from "JavaScriptSDK.Interfaces/ITelemetryItem";
    export { AppInsightsCore } from "JavaScriptSDK/AppInsightsCore";
}
declare module "JavaScriptSDK.Tests/Selenium/ApplicationInsightsCore.Tests" {
    export class ApplicationInsightsCoreTests extends TestClass {
        testInitialize(): void;
        testCleanup(): void;
        registerTests(): void;
    }
}
declare module "JavaScriptSDK.Tests/Selenium/aitests" {
    export function runTests(): void;
}
