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
declare module "Interfaces/Context/ISession" {
    export interface ISession {
        /**
        * The session ID.
        */
        id: string;
        /**
         * The true if this is the first session
         */
        isFirst: boolean;
        /**
         * The date at which this guid was genereated.
         * Per the spec the ID will be regenerated if more than acquisitionSpan milliseconds ellapse from this time.
         */
        acquisitionDate: number;
        /**
         * The date at which this session ID was last reported.
         * This value should be updated whenever telemetry is sent using this ID.
         * Per the spec the ID will be regenerated if more than renewalSpan milliseconds elapse from this time with no activity.
         */
        renewalDate: number;
    }
}
declare module "Context/Session" {
    import { ISession } from "Interfaces/Context/ISession";
    import { IDiagnosticLogger } from 'applicationinsights-core-js';
    export interface ISessionConfig {
        sessionRenewalMs: () => number;
        sessionExpirationMs: () => number;
        cookieDomain: () => string;
    }
    export class Session implements ISession {
        /**
         * The session ID.
         */
        id: string;
        /**
         * The true if this is the first session
         */
        isFirst: boolean;
        /**
         * The date at which this guid was genereated.
         * Per the spec the ID will be regenerated if more than acquisitionSpan milliseconds ellapse from this time.
         */
        acquisitionDate: number;
        /**
         * The date at which this session ID was last reported.
         * This value should be updated whenever telemetry is sent using this ID.
         * Per the spec the ID will be regenerated if more than renewalSpan milliseconds elapse from this time with no activity.
         */
        renewalDate: number;
    }
    export class _SessionManager {
        static acquisitionSpan: number;
        static renewalSpan: number;
        static cookieUpdateInterval: number;
        automaticSession: Session;
        config: ISessionConfig;
        private cookieUpdatedTimestamp;
        private _logger;
        constructor(config: ISessionConfig, logger?: IDiagnosticLogger);
        update(): void;
        /**
         *  Record the current state of the automatic session and store it in our cookie string format
         *  into the browser's local storage. This is used to restore the session data when the cookie
         *  expires.
         */
        backup(): void;
        /**
         *  Use ai_session cookie data or local storage data (when the cookie is unavailable) to
         *  initialize the automatic session.
         */
        private initializeAutomaticSession();
        /**
         *  Extract id, aquisitionDate, and renewalDate from an ai_session payload string and
         *  use this data to initialize automaticSession.
         *
         *  @param {string} sessionData - The string stored in an ai_session cookie or local storage backup
         */
        private initializeAutomaticSessionWithData(sessionData);
        private renew();
        private setCookie(guid, acq, renewal);
        private setStorage(guid, acq, renewal);
    }
}
declare module "Interfaces/Context/IApplication" {
    export interface IApplication {
        /**
         * The application version.
         */
        ver: string;
        /**
         * The application build version.
         */
        build: string;
    }
}
declare module "Context/Application" {
    import { IApplication } from "Interfaces/Context/IApplication";
    export class Application implements IApplication {
        /**
         * The application version.
         */
        ver: string;
        /**
         * The application build version.
         */
        build: string;
    }
}
declare module "Interfaces/Context/IDevice" {
    export interface IDevice {
        /**
         * The type for the current device.
         */
        type: string;
        /**
         * A device unique ID.
         */
        id: string;
        /**
         * The device OEM for the current device.
         */
        oemName: string;
        /**
         * The device model for the current device.
         */
        model: string;
        /**
         * The IANA interface type for the internet connected network adapter.
         */
        network: number;
        /**
         * The application screen resolution.
         */
        resolution: string;
        /**
         * The current display language of the operating system.
         */
        locale: string;
        /**
         * The IP address.
         */
        ip: string;
        /**
         * The device language.
         */
        language: string;
        /**
         * The OS name.
         */
        os: string;
        /**
         * The OS version.
         */
        osversion: string;
    }
}
declare module "Context/Device" {
    import { IDevice } from "Interfaces/Context/IDevice";
    export class Device implements IDevice {
        /**
         * The type for the current device.
         */
        type: string;
        /**
         * A device unique ID.
         */
        id: string;
        /**
         * The device OEM for the current device.
         */
        oemName: string;
        /**
         * The device model for the current device.
         */
        model: string;
        /**
         * The IANA interface type for the internet connected network adapter.
         */
        network: number;
        /**
         * The application screen resolution.
         */
        resolution: string;
        /**
         * The current display language of the operating system.
         */
        locale: string;
        /**
         * The IP address.
         */
        ip: string;
        /**
         * The device language.
         */
        language: string;
        /**
         * The OS name.
         */
        os: string;
        /**
         * The OS version.
         */
        osversion: string;
        /**
         * Constructs a new instance of the Device class
         */
        constructor();
    }
}
declare module "Interfaces/Context/IInternal" {
    export interface IInternal {
        /**
        * The SDK version used to create this telemetry item.
        */
        sdkVersion: string;
        /**
         * The SDK agent version.
         */
        agentVersion: string;
    }
}
declare module "Interfaces/ITelemetryConfig" {
    export interface ITelemetryConfig {
        instrumentationKey: () => string;
        accountId: () => string;
        sessionRenewalMs: () => number;
        sampleRate: () => number;
        sessionExpirationMs: () => number;
        cookieDomain: () => string;
        sdkExtension: () => string;
        isBrowserLinkTrackingEnabled: () => boolean;
        appId: () => string;
    }
}
declare module "Context/Internal" {
    import { IInternal } from "Interfaces/Context/IInternal";
    import { ITelemetryConfig } from "Interfaces/ITelemetryConfig";
    export class Internal implements IInternal {
        /**
         * The SDK version used to create this telemetry item.
         */
        sdkVersion: string;
        /**
         * The SDK agent version.
         */
        agentVersion: string;
        /**
        * Constructs a new instance of the internal telemetry data class.
        */
        constructor(config: ITelemetryConfig);
    }
}
declare module "Interfaces/Context/ILocation" {
    export interface ILocation {
        /**
         * Client IP address for reverse lookup
         */
        ip: string;
    }
}
declare module "Context/Location" {
    import { ILocation } from "Interfaces/Context/ILocation";
    export class Location implements ILocation {
        /**
         * Client IP address for reverse lookup
         */
        ip: string;
    }
}
declare module "Interfaces/Context/IOperation" {
    export interface IOperation {
        /**
         * Operation id
         */
        id: string;
        /**
         * Operation name
         */
        name: string;
        /**
         * Parent operation id
         */
        parentId: string;
        /**
         * Root operation id
         */
        rootId: string;
        /**
         * Synthetic source of the operation
         */
        syntheticSource: string;
    }
}
declare module "Context/Operation" {
    import { IOperation } from "Interfaces/Context/IOperation";
    export class Operation implements IOperation {
        id: string;
        name: string;
        parentId: string;
        rootId: string;
        syntheticSource: string;
        constructor();
    }
}
declare module "Interfaces/Context/IUser" {
    export interface IUser {
        /**
        * The telemetry configuration.
        */
        config: any;
        /**
         * The user ID.
         */
        id: string;
        /**
         * Authenticated user id
         */
        authenticatedId: string;
        /**
         * The account ID.
         */
        accountId: string;
        /**
         * The account acquisition date.
         */
        accountAcquisitionDate: string;
        /**
         * The user agent string.
         */
        agent: string;
        /**
         * The store region.
         */
        storeRegion: string;
    }
    export interface IUserContextPlugin {
        setAuthenticatedUserContext(authenticatedUserId: string, accountId?: string, storeInCookie?: boolean): any;
        clearAuthenticatedUserContext(): any;
    }
}
declare module "Context/User" {
    import { IUser, IUserContextPlugin } from "Interfaces/Context/IUser";
    import { ITelemetryConfig } from "Interfaces/ITelemetryConfig";
    import { IDiagnosticLogger } from 'applicationinsights-core-js';
    export class User implements IUser, IUserContextPlugin {
        static cookieSeparator: string;
        static userCookieName: string;
        static authUserCookieName: string;
        /**
         * The telemetry configuration.
         */
        config: ITelemetryConfig;
        /**
         * The user ID.
         */
        id: string;
        /**
         * Authenticated user id
         */
        authenticatedId: string;
        /**
         * The account ID.
         */
        accountId: string;
        /**
         * The account acquisition date.
         */
        accountAcquisitionDate: string;
        /**
         * The user agent string.
         */
        agent: string;
        /**
         * The store region.
         */
        storeRegion: string;
        private _logger;
        /**
        * Sets the authenticated user id and the account id in this session.
        *
        * @param authenticatedUserId {string} - The authenticated user id. A unique and persistent string that represents each authenticated user in the service.
        * @param accountId {string} - An optional string to represent the account associated with the authenticated user.
        */
        setAuthenticatedUserContext(authenticatedUserId: string, accountId?: string, storeInCookie?: boolean): void;
        /**
         * Clears the authenticated user id and the account id from the user context.
         * @returns {}
         */
        clearAuthenticatedUserContext(): void;
        constructor(config: ITelemetryConfig, logger: IDiagnosticLogger);
        private validateUserInput(id);
    }
}
declare module "HashCodeScoreGenerator" {
    export class HashCodeScoreGenerator {
        static INT_MAX_VALUE: number;
        private static MIN_INPUT_LENGTH;
        getHashCodeScore(key: string): number;
        getHashCode(input: string): number;
    }
}
declare module "SamplingScoreGenerator" {
    import { IEnvelope } from 'applicationinsights-common';
    export class SamplingScoreGenerator {
        private hashCodeGeneragor;
        constructor();
        getSamplingScore(envelope: IEnvelope): number;
    }
}
declare module "Interfaces/Context/ISample" {
    export interface ISample {
        /**
        * Sample rate
        */
        sampleRate: number;
    }
}
declare module "Context/Sample" {
    import { ISample } from "Interfaces/Context/ISample";
    import { ITelemetryItem, IDiagnosticLogger } from 'applicationinsights-core-js';
    export class Sample implements ISample {
        sampleRate: number;
        private samplingScoreGenerator;
        private _logger;
        INT_MAX_VALUE: number;
        constructor(sampleRate: number, logger?: IDiagnosticLogger);
        /**
        * Determines if an envelope is sampled in (i.e. will be sent) or not (i.e. will be dropped).
        */
        isSampledIn(envelope: ITelemetryItem): boolean;
    }
}
declare module "Interfaces/ITelemetryContext" {
    import { IApplication } from "Interfaces/Context/IApplication";
    import { IDevice } from "Interfaces/Context/IDevice";
    import { IInternal } from "Interfaces/Context/IInternal";
    import { ILocation } from "Interfaces/Context/ILocation";
    import { IOperation } from "Interfaces/Context/IOperation";
    import { IUser } from "Interfaces/Context/IUser";
    import { ISession } from "Interfaces/Context/ISession";
    export interface ITelemetryContext {
        /**
        * The object describing a component tracked by this object.
        */
        application: IApplication;
        /**
         * The object describing a device tracked by this object.
         */
        device: IDevice;
        /**
        * The object describing internal settings.
        */
        internal: IInternal;
        /**
         * The object describing a location tracked by this object.
         */
        location: ILocation;
        /**
         * The object describing a operation tracked by this object.
         */
        operation: IOperation;
        /**
         * The object describing a user tracked by this object.
         */
        user: IUser;
        /**
         * The object describing a session tracked by this object.
         */
        session: ISession;
    }
}
declare module "Interfaces/IPropertiesPlugin" {
    import { IUserContextPlugin } from "Interfaces/Context/IUser";
    export interface IPropertiesPlugin extends IUserContextPlugin {
    }
}
declare module "PropertiesPlugin" {
    /**
     * PropertiesPlugin.ts
     * @copyright Microsoft 2018
     */
    import { ITelemetryPlugin, IConfiguration, IAppInsightsCore, IPlugin, ITelemetryItem } from 'applicationinsights-core-js';
    import { Session, _SessionManager } from "Context/Session";
    import { Application } from "Context/Application";
    import { Device } from "Context/Device";
    import { Internal } from "Context/Internal";
    import { Location } from "Context/Location";
    import { Operation } from "Context/Operation";
    import { User } from "Context/User";
    import { Sample } from "Context/Sample";
    import { ITelemetryContext } from "Interfaces/ITelemetryContext";
    export default class PropertiesPlugin implements ITelemetryPlugin, ITelemetryContext {
        priority: number;
        identifier: string;
        application: Application;
        device: Device;
        location: Location;
        operation: Operation;
        user: User;
        internal: Internal;
        session: Session;
        sample: Sample;
        _sessionManager: _SessionManager;
        private _nextPlugin;
        private _extensionConfig;
        initialize(config: IConfiguration, core: IAppInsightsCore, extensions: IPlugin[]): void;
        /**
         * Add Part A fields to the event
         * @param event The event that needs to be processed
         */
        processTelemetry(event: ITelemetryItem): void;
        /**
         * Sets the next plugin that comes after this plugin
         * @param nextPlugin The next plugin
         */
        setNextPlugin(nextPlugin: ITelemetryPlugin): void;
        private _processTelemetryInternal(event);
        private static _applySessionContext(tags, sessionContext);
        private static _applyApplicationContext(tagsItem, appContext);
        private static _applyDeviceContext(tagsItem, deviceContext);
        private static _applyInternalContext(tagsItem, internalContext);
        private static _applyLocationContext(tagsItem, locationContext);
        private static _applySampleContext(tagsItem, sampleContext);
        private static _applyOperationContext(tagsItem, operationContext);
        private static _applyUserContext(tagsItem, userContext);
    }
}
declare module "Tests/Selenium/properties.tests" {
    export class PropertiesTests extends TestClass {
        private properties;
        private core;
        testInitialize(): void;
        testCleanup(): void;
        registerTests(): void;
        private addUserTests();
        private getEmptyConfig();
    }
    export function runTests(): void;
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
