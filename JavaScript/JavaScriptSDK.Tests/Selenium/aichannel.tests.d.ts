/// <reference path="../../../AppInsightsChannel/Tests/External/qunit.d.ts" />
/// <reference path="../../../AppInsightsChannel/Tests/External/sinon.d.ts" />
/// <reference path="../../../AppInsightsChannel/node_modules/applicationinsights-core-js/bundle/applicationinsights-core-js.d.ts" />
/// <reference path="../../../AppInsightsChannel/node_modules/applicationinsights-common/bundle/applicationinsights-common.d.ts" />
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
declare module "Interfaces" {
    export interface ISenderConfig {
        /**
         * The url to which payloads will be sent
         */
        endpointUrl: () => string;
        /**
        * The JSON format (normal vs line delimited). True means line delimited JSON.
        */
        emitLineDelimitedJson: () => boolean;
        /**
         * The maximum size of a batch in bytes
         */
        maxBatchSizeInBytes: () => number;
        /**
         * The maximum interval allowed between calls to batchInvoke
         */
        maxBatchInterval: () => number;
        /**
         * The master off switch.  Do not send any data if set to TRUE
         */
        disableTelemetry: () => boolean;
        /**
         * Store a copy of a send buffer in the session storage
         */
        enableSessionStorageBuffer: () => boolean;
        /**
         * Is retry handler disabled.
         * If enabled, retry on 206 (partial success), 408 (timeout), 429 (too many requests), 500 (internal server error) and 503 (service unavailable).
         */
        isRetryDisabled: () => boolean;
        isBeaconApiDisabled: () => boolean;
    }
    export interface IBackendResponse {
        /**
         * Number of items received by the backend
         */
        itemsReceived: number;
        /**
         * Number of items succesfuly accepted by the backend
         */
        itemsAccepted: number;
        /**
         * List of errors for items which were not accepted
         */
        errors: IResponseError[];
        /**
         * App id returned by the backend - not necessary returned, but we don't need it with each response.
         */
        appId?: string;
    }
    export interface XDomainRequest extends XMLHttpRequestEventTarget {
        responseText: string;
        send(payload: string): any;
        open(method: string, url: string): any;
    }
    export interface IResponseError {
        index: number;
        statusCode: number;
        message: string;
    }
}
declare module "SendBuffer" {
    import { ISenderConfig } from "Interfaces";
    export interface ISendBuffer {
        /**
         * Enqueue the payload
         */
        enqueue: (payload: string) => void;
        /**
         * Returns the number of elements in the buffer
         */
        count: () => number;
        /**
         * Clears the buffer
         */
        clear: () => void;
        /**
         * Returns items stored in the buffer
         */
        getItems: () => string[];
        /**
         * Build a batch of all elements in the payload array
         */
        batchPayloads: (payload: string[]) => string;
        /**
         * Moves items to the SENT_BUFFER.
         * The buffer holds items which were sent, but we haven't received any response from the backend yet.
         */
        markAsSent: (payload: string[]) => void;
        /**
         * Removes items from the SENT_BUFFER. Should be called on successful response from the backend.
         */
        clearSent: (payload: string[]) => void;
    }
    export class ArraySendBuffer implements ISendBuffer {
        private _config;
        private _buffer;
        constructor(config: ISenderConfig);
        enqueue(payload: string): void;
        count(): number;
        clear(): void;
        getItems(): string[];
        batchPayloads(payload: string[]): string;
        markAsSent(payload: string[]): void;
        clearSent(payload: string[]): void;
    }
    export class SessionStorageSendBuffer implements ISendBuffer {
        static BUFFER_KEY: string;
        static SENT_BUFFER_KEY: string;
        static MAX_BUFFER_SIZE: number;
        private _bufferFullMessageSent;
        private _buffer;
        private _config;
        constructor(config: ISenderConfig);
        enqueue(payload: string): void;
        count(): number;
        clear(): void;
        getItems(): string[];
        batchPayloads(payload: string[]): string;
        markAsSent(payload: string[]): void;
        clearSent(payload: string[]): void;
        private removePayloadsFromBuffer(payloads, buffer);
        private getBuffer(key);
        private setBuffer(key, buffer);
    }
}
declare module "EnvelopeCreator" {
    import { IEnvelope, Data } from 'applicationinsights-common';
    import { ITelemetryItem } from 'applicationinsights-core-js';
    export const ContextTagKeys: string[];
    export abstract class EnvelopeCreator {
        abstract Create(telemetryItem: ITelemetryItem): IEnvelope;
        protected static extractMeasurements(properties: {
            [key: string]: any;
        }): {
            [key: string]: any;
        };
        protected static createEnvelope<T>(envelopeType: string, telemetryItem: ITelemetryItem, data: Data<T>): IEnvelope;
    }
    export class DependencyEnvelopeCreator extends EnvelopeCreator {
        static DependencyEnvelopeCreator: DependencyEnvelopeCreator;
        Create(telemetryItem: ITelemetryItem): IEnvelope;
    }
    export class EventEnvelopeCreator extends EnvelopeCreator {
        static EventEnvelopeCreator: EventEnvelopeCreator;
        Create(telemetryItem: ITelemetryItem): IEnvelope;
    }
    export class ExceptionEnvelopeCreator extends EnvelopeCreator {
        static ExceptionEnvelopeCreator: ExceptionEnvelopeCreator;
        Create(telemetryItem: ITelemetryItem): IEnvelope;
    }
    export class MetricEnvelopeCreator extends EnvelopeCreator {
        static MetricEnvelopeCreator: MetricEnvelopeCreator;
        Create(telemetryItem: ITelemetryItem): IEnvelope;
    }
    export class PageViewEnvelopeCreator extends EnvelopeCreator {
        static PageViewEnvelopeCreator: PageViewEnvelopeCreator;
        Create(telemetryItem: ITelemetryItem): IEnvelope;
    }
    export class PageViewPerformanceEnvelopeCreator extends EnvelopeCreator {
        static PageViewPerformanceEnvelopeCreator: PageViewPerformanceEnvelopeCreator;
        Create(telemetryItem: ITelemetryItem): IEnvelope;
    }
    export class TraceEnvelopeCreator extends EnvelopeCreator {
        static TraceEnvelopeCreator: TraceEnvelopeCreator;
        Create(telemetryItem: ITelemetryItem): IEnvelope;
    }
}
declare module "TelemetryValidation/ITypeValidator" {
    import { ITelemetryItem } from 'applicationinsights-core-js';
    export interface ITypeValidator {
        Validate(item: ITelemetryItem): boolean;
    }
}
declare module "TelemetryValidation/EventValidator" {
    import { ITypeValidator } from "TelemetryValidation/ITypeValidator";
    import { ITelemetryItem } from 'applicationinsights-core-js';
    export class EventValidator implements ITypeValidator {
        static EventValidator: EventValidator;
        Validate(item: ITelemetryItem): boolean;
    }
}
declare module "TelemetryValidation/TraceValidator" {
    import { ITypeValidator } from "TelemetryValidation/ITypeValidator";
    import { ITelemetryItem } from 'applicationinsights-core-js';
    export class TraceValidator implements ITypeValidator {
        static TraceValidator: TraceValidator;
        Validate(item: ITelemetryItem): boolean;
    }
}
declare module "TelemetryValidation/ExceptionValidator" {
    import { ITypeValidator } from "TelemetryValidation/ITypeValidator";
    import { ITelemetryItem } from 'applicationinsights-core-js';
    export class ExceptionValidator implements ITypeValidator {
        static ExceptionValidator: ExceptionValidator;
        Validate(item: ITelemetryItem): boolean;
        private static _validateExceptions(exceptions);
    }
}
declare module "TelemetryValidation/MetricValidator" {
    import { ITypeValidator } from "TelemetryValidation/ITypeValidator";
    import { ITelemetryItem } from 'applicationinsights-core-js';
    export class MetricValidator implements ITypeValidator {
        static MetricValidator: MetricValidator;
        Validate(event: ITelemetryItem): boolean;
    }
}
declare module "TelemetryValidation/PageViewPerformanceValidator" {
    import { ITypeValidator } from "TelemetryValidation/ITypeValidator";
    import { ITelemetryItem } from 'applicationinsights-core-js';
    export class PageViewPerformanceValidator implements ITypeValidator {
        static PageViewPerformanceValidator: PageViewPerformanceValidator;
        Validate(item: ITelemetryItem): boolean;
    }
}
declare module "TelemetryValidation/PageViewValidator" {
    import { ITypeValidator } from "TelemetryValidation/ITypeValidator";
    import { ITelemetryItem } from 'applicationinsights-core-js';
    export class PageViewValidator implements ITypeValidator {
        static PageViewValidator: PageViewValidator;
        Validate(item: ITelemetryItem): boolean;
    }
}
declare module "TelemetryValidation/RemoteDepdencyValidator" {
    import { ITypeValidator } from "TelemetryValidation/ITypeValidator";
    import { ITelemetryItem } from 'applicationinsights-core-js';
    export class RemoteDepdencyValidator implements ITypeValidator {
        static RemoteDepdencyValidator: RemoteDepdencyValidator;
        Validate(item: ITelemetryItem): boolean;
    }
}
declare module "Serializer" {
    import { ISerializable } from 'applicationinsights-common';
    export class Serializer {
        /**
         * Serializes the current object to a JSON string.
         */
        static serialize(input: ISerializable): string;
        private static _serializeObject(source, name);
        private static _serializeArray(sources, name);
        private static _serializeStringMap(map, expectedType, name);
    }
}
declare module "Sender" {
    import { ISenderConfig, XDomainRequest as IXDomainRequest, IBackendResponse } from "Interfaces";
    import { ISendBuffer } from "SendBuffer";
    import { IChannelControls, ITelemetryPlugin, ITelemetryItem, IConfiguration } from 'applicationinsights-core-js';
    export class Sender implements IChannelControls {
        priority: number;
        identifier: string;
        pause(): void;
        resume(): void;
        flush(): void;
        teardown(): void;
        setNextPlugin: (next: ITelemetryPlugin) => void;
        /**
         * The configuration for this sender instance
         */
        _config: ISenderConfig;
        /**
         * A method which will cause data to be send to the url
         */
        _sender: (payload: string[], isAsync: boolean) => void;
        /**
         * A send buffer object
         */
        _buffer: ISendBuffer;
        /**
         * AppId of this component parsed from some backend response.
         */
        _appId: string;
        /**
         * Whether XMLHttpRequest object is supported. Older version of IE (8,9) do not support it.
         */
        _XMLHttpRequestSupported: boolean;
        /**
         * How many times in a row a retryable error condition has occurred.
         */
        private _consecutiveErrors;
        /**
         * The time to retry at in milliseconds from 1970/01/01 (this makes the timer calculation easy).
         */
        private _retryAt;
        /**
         * The time of the last send operation.
         */
        private _lastSend;
        /**
         * Handle to the timer for delayed sending of batches of data.
         */
        private _timeoutHandle;
        initialize(config: IConfiguration): void;
        processTelemetry(envelope: ITelemetryItem): void;
        /**
         * xhr state changes
         */
        _xhrReadyStateChange(xhr: XMLHttpRequest, payload: string[], countOfItemsInPayload: number): void;
        /**
         * Immediately send buffered data
         * @param async {boolean} - Indicates if the events should be sent asynchronously
         */
        triggerSend(async?: boolean): void;
        /**
         * error handler
         */
        _onError(payload: string[], message: string, event?: ErrorEvent): void;
        /**
         * partial success handler
         */
        _onPartialSuccess(payload: string[], results: IBackendResponse): void;
        /**
         * success handler
         */
        _onSuccess(payload: string[], countOfItemsInPayload: number): void;
        /**
         * xdr state changes
         */
        _xdrOnLoad(xdr: IXDomainRequest, payload: string[]): void;
        private static _getDefaultAppInsightsChannelConfig(config, identifier);
        private static _validate(envelope);
        private static _constructEnvelope(envelope);
        /**
         * Send Beacon API request
         * @param payload {string} - The data payload to be sent.
         * @param isAsync {boolean} - not used
         * Note: Beacon API does not support custom headers and we are not able to get
         * appId from the backend for the correct correlation.
         */
        private _beaconSender(payload, isAsync);
        /**
         * Send XMLHttpRequest
         * @param payload {string} - The data payload to be sent.
         * @param isAsync {boolean} - Indicates if the request should be sent asynchronously
         */
        private _xhrSender(payload, isAsync);
        /**
         * Parses the response from the backend.
         * @param response - XMLHttpRequest or XDomainRequest response
         */
        private _parseResponse(response);
        /**
         * Resend payload. Adds payload back to the send buffer and setup a send timer (with exponential backoff).
         * @param payload
         */
        private _resendPayload(payload);
        /** Calculates the time to wait before retrying in case of an error based on
         * http://en.wikipedia.org/wiki/Exponential_backoff
         */
        private _setRetryTime();
        /**
         * Sets up the timer which triggers actually sending the data.
         */
        private _setupTimer();
        /**
         * Checks if the SDK should resend the payload after receiving this status code from the backend.
         * @param statusCode
         */
        private _isRetriable(statusCode);
        private _formatErrorMessageXhr(xhr, message?);
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
        private _xdrSender(payload, isAsync);
        private _formatErrorMessageXdr(xdr, message?);
    }
}
declare class AppInsightsChannelTests extends TestClass {
    testInitialize(): void;
    testCleanup(): void;
    registerTests(): void;
}
