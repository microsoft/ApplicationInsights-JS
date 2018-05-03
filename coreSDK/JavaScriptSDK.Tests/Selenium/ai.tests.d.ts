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
declare module Microsoft.ApplicationInsights {
    interface ISerializable {
        /**
         * The set of fields for a serializable object.
         * This defines the serialization order and a value of true/false
         * for each field defines whether the field is required or not.
         */
        aiDataContract: any;
    }
}
declare module Microsoft.ApplicationInsights {
    enum LoggingSeverity {
        /**
         * Error will be sent as internal telemetry
         */
        CRITICAL = 0,
        /**
         * Error will NOT be sent as internal telemetry, and will only be shown in browser console
         */
        WARNING = 1,
    }
    /**
     * Internal message ID. Please create a new one for every conceptually different message. Please keep alphabetically ordered
     */
    enum _InternalMessageId {
        BrowserDoesNotSupportLocalStorage = 0,
        BrowserCannotReadLocalStorage = 1,
        BrowserCannotReadSessionStorage = 2,
        BrowserCannotWriteLocalStorage = 3,
        BrowserCannotWriteSessionStorage = 4,
        BrowserFailedRemovalFromLocalStorage = 5,
        BrowserFailedRemovalFromSessionStorage = 6,
        CannotSendEmptyTelemetry = 7,
        ClientPerformanceMathError = 8,
        ErrorParsingAISessionCookie = 9,
        ErrorPVCalc = 10,
        ExceptionWhileLoggingError = 11,
        FailedAddingTelemetryToBuffer = 12,
        FailedMonitorAjaxAbort = 13,
        FailedMonitorAjaxDur = 14,
        FailedMonitorAjaxOpen = 15,
        FailedMonitorAjaxRSC = 16,
        FailedMonitorAjaxSend = 17,
        FailedMonitorAjaxGetCorrelationHeader = 18,
        FailedToAddHandlerForOnBeforeUnload = 19,
        FailedToSendQueuedTelemetry = 20,
        FailedToReportDataLoss = 21,
        FlushFailed = 22,
        MessageLimitPerPVExceeded = 23,
        MissingRequiredFieldSpecification = 24,
        NavigationTimingNotSupported = 25,
        OnError = 26,
        SessionRenewalDateIsZero = 27,
        SenderNotInitialized = 28,
        StartTrackEventFailed = 29,
        StopTrackEventFailed = 30,
        StartTrackFailed = 31,
        StopTrackFailed = 32,
        TelemetrySampledAndNotSent = 33,
        TrackEventFailed = 34,
        TrackExceptionFailed = 35,
        TrackMetricFailed = 36,
        TrackPVFailed = 37,
        TrackPVFailedCalc = 38,
        TrackTraceFailed = 39,
        TransmissionFailed = 40,
        FailedToSetStorageBuffer = 41,
        FailedToRestoreStorageBuffer = 42,
        InvalidBackendResponse = 43,
        FailedToFixDepricatedValues = 44,
        InvalidDurationValue = 45,
        CannotSerializeObject = 46,
        CannotSerializeObjectNonSerializable = 47,
        CircularReferenceDetected = 48,
        ClearAuthContextFailed = 49,
        ExceptionTruncated = 50,
        IllegalCharsInName = 51,
        ItemNotInArray = 52,
        MaxAjaxPerPVExceeded = 53,
        MessageTruncated = 54,
        NameTooLong = 55,
        SampleRateOutOfRange = 56,
        SetAuthContextFailed = 57,
        SetAuthContextFailedAccountName = 58,
        StringValueTooLong = 59,
        StartCalledMoreThanOnce = 60,
        StopCalledWithoutStart = 61,
        TelemetryInitializerFailed = 62,
        TrackArgumentsNotSpecified = 63,
        UrlTooLong = 64,
        SessionStorageBufferFull = 65,
        CannotAccessCookie = 66,
        IdTooLong = 67,
    }
    class _InternalLogMessage {
        message: string;
        messageId: _InternalMessageId;
        /**
         * For user non actionable traces use AI Internal prefix.
         */
        private static AiNonUserActionablePrefix;
        /**
         * Prefix of the traces in portal.
         */
        private static AiUserActionablePrefix;
        constructor(msgId: _InternalMessageId, msg: string, isUserAct?: boolean, properties?: Object);
        private static sanitizeDiagnosticText(text);
    }
    class _InternalLogging {
        /**
        *  Session storage key for the prefix for the key indicating message type already logged
        */
        private static AIInternalMessagePrefix;
        /**
         * When this is true the SDK will throw exceptions to aid in debugging.
         */
        static enableDebugExceptions: () => boolean;
        /**
         * When this is true the SDK will log more messages to aid in debugging.
         */
        static verboseLogging: () => boolean;
        /**
         * The internal logging queue
         */
        static queue: Array<_InternalLogMessage>;
        /**
         * The maximum number of internal messages allowed to be sent per page view
         */
        private static MAX_INTERNAL_MESSAGE_LIMIT;
        /**
         * Count of internal messages sent
         */
        private static _messageCount;
        /**
         * Holds information about what message types were already logged to console or sent to server.
         */
        private static _messageLogged;
        /**
         * This method will throw exceptions in debug mode or attempt to log the error as a console warning.
         * @param severity {LoggingSeverity} - The severity of the log message
         * @param message {_InternalLogMessage} - The log message.
         */
        static throwInternal(severity: LoggingSeverity, msgId: _InternalMessageId, msg: string, properties?: Object, isUserAct?: boolean): void;
        /**
         * This will write a warning to the console if possible
         * @param message {string} - The warning message
         */
        static warnToConsole(message: string): void;
        /**
         * Resets the internal message count
         */
        static resetInternalMessageCount(): void;
        /**
         * Clears the list of records indicating that internal message type was already logged
         */
        static clearInternalMessageLoggedTypes(): void;
        /**
         * Sets the limit for the number of internal events before they are throttled
         * @param limit {number} - The throttle limit to set for internal events
         */
        static setMaxInternalMessageLimit(limit: number): void;
        /**
         * Logs a message to the internal queue.
         * @param severity {LoggingSeverity} - The severity of the log message
         * @param message {_InternalLogMessage} - The message to log.
         */
        private static logInternalMessage(severity, message);
        /**
         * Indicates whether the internal events are throttled
         */
        private static _areInternalMessagesThrottled();
    }
}
declare module Microsoft.ApplicationInsights {
    class Util {
        private static document;
        private static _canUseCookies;
        private static _canUseLocalStorage;
        private static _canUseSessionStorage;
        static NotSpecified: string;
        static disableStorage(): void;
        /**
         * Gets the localStorage object if available
         * @return {Storage} - Returns the storage object if available else returns null
         */
        private static _getLocalStorageObject();
        /**
         * Tests storage object (localStorage or sessionStorage) to verify that it is usable
         * More details here: https://mathiasbynens.be/notes/localstorage-pattern
         * @param storageType Type of storage
         * @return {Storage} Returns storage object verified that it is usable
         */
        private static _getVerifiedStorageObject(storageType);
        /**
         *  Check if the browser supports local storage.
         *
         *  @returns {boolean} True if local storage is supported.
         */
        static canUseLocalStorage(): boolean;
        /**
         *  Get an object from the browser's local storage
         *
         *  @param {string} name - the name of the object to get from storage
         *  @returns {string} The contents of the storage object with the given name. Null if storage is not supported.
         */
        static getStorage(name: string): string;
        /**
         *  Set the contents of an object in the browser's local storage
         *
         *  @param {string} name - the name of the object to set in storage
         *  @param {string} data - the contents of the object to set in storage
         *  @returns {boolean} True if the storage object could be written.
         */
        static setStorage(name: string, data: string): boolean;
        /**
         *  Remove an object from the browser's local storage
         *
         *  @param {string} name - the name of the object to remove from storage
         *  @returns {boolean} True if the storage object could be removed.
         */
        static removeStorage(name: string): boolean;
        /**
         * Gets the sessionStorage object if available
         * @return {Storage} - Returns the storage object if available else returns null
         */
        private static _getSessionStorageObject();
        /**
         *  Check if the browser supports session storage.
         *
         *  @returns {boolean} True if session storage is supported.
         */
        static canUseSessionStorage(): boolean;
        /**
         *  Gets the list of session storage keys
         *
         *  @returns {string[]} List of session storage keys
         */
        static getSessionStorageKeys(): string[];
        /**
         *  Get an object from the browser's session storage
         *
         *  @param {string} name - the name of the object to get from storage
         *  @returns {string} The contents of the storage object with the given name. Null if storage is not supported.
         */
        static getSessionStorage(name: string): string;
        /**
         *  Set the contents of an object in the browser's session storage
         *
         *  @param {string} name - the name of the object to set in storage
         *  @param {string} data - the contents of the object to set in storage
         *  @returns {boolean} True if the storage object could be written.
         */
        static setSessionStorage(name: string, data: string): boolean;
        /**
         *  Remove an object from the browser's session storage
         *
         *  @param {string} name - the name of the object to remove from storage
         *  @returns {boolean} True if the storage object could be removed.
         */
        static removeSessionStorage(name: string): boolean;
        static disableCookies(): void;
        static canUseCookies(): any;
        /**
         * helper method to set userId and sessionId cookie
         */
        static setCookie(name: any, value: any, domain?: any): void;
        static stringToBoolOrDefault(str: any, defaultValue?: boolean): boolean;
        /**
         * helper method to access userId and sessionId cookie
         */
        static getCookie(name: any): string;
        /**
         * Deletes a cookie by setting it's expiration time in the past.
         * @param name - The name of the cookie to delete.
         */
        static deleteCookie(name: string): void;
        /**
         * helper method to trim strings (IE8 does not implement String.prototype.trim)
         */
        static trim(str: any): string;
        /**
         * generate random id string
         */
        static newId(): string;
        /**
         * Check if an object is of type Array
         */
        static isArray(obj: any): boolean;
        /**
         * Check if an object is of type Error
         */
        static isError(obj: any): boolean;
        /**
         * Check if an object is of type Date
         */
        static isDate(obj: any): boolean;
        /**
         * Convert a date to I.S.O. format in IE8
         */
        static toISOStringForIE8(date: Date): string;
        /**
         * Gets IE version if we are running on IE, or null otherwise
         */
        static getIEVersion(userAgentStr?: string): number;
        /**
         * Convert ms to c# time span format
         */
        static msToTimeSpan(totalms: number): string;
        /**
        * Checks if error has no meaningful data inside. Ususally such errors are received by window.onerror when error
        * happens in a script from other domain (cross origin, CORS).
        */
        static isCrossOriginError(message: string, url: string, lineNumber: number, columnNumber: number, error: Error): boolean;
        /**
        * Returns string representation of an object suitable for diagnostics logging.
        */
        static dump(object: any): string;
        /**
        * Returns the name of object if it's an Error. Otherwise, returns empty string.
        */
        static getExceptionName(object: any): string;
        /**
         * Adds an event handler for the specified event
         * @param eventName {string} - The name of the event
         * @param callback {any} - The callback function that needs to be executed for the given event
         * @return {boolean} - true if the handler was successfully added
         */
        static addEventHandler(eventName: string, callback: any): boolean;
        /**
         * Tells if a browser supports a Beacon API
         */
        static IsBeaconApiSupported(): boolean;
    }
    class UrlHelper {
        private static document;
        private static htmlAnchorElement;
        static parseUrl(url: any): HTMLAnchorElement;
        static getAbsoluteUrl(url: any): string;
        static getPathName(url: any): string;
        static getCompleteUrl(method: string, absoluteUrl: string): string;
    }
    class CorrelationIdHelper {
        static correlationIdPrefix: string;
        /**
        * Checks if a request url is not on a excluded domain list and if it is safe to add correlation headers
        */
        static canIncludeCorrelationHeader(config: IConfig, requestUrl: string, currentHost: string): boolean;
        /**
        * Combines target appId and target role name from response header.
        */
        static getCorrelationContext(responseHeader: string): string;
        /**
        * Gets key from correlation response header
        */
        static getCorrelationContextValue(responseHeader: string, key: string): string;
    }
}
declare module Microsoft.ApplicationInsights {
    /**
     * Enum is used in aiDataContract to describe how fields are serialized.
     * For instance: (Fieldtype.Required | FieldType.Array) will mark the field as required and indicate it's an array
     */
    enum FieldType {
        Default = 0,
        Required = 1,
        Array = 2,
        Hidden = 4,
    }
    class Serializer {
        /**
         * Serializes the current object to a JSON string.
         */
        static serialize(input: ISerializable): string;
        private static _serializeObject(source, name);
        private static _serializeArray(sources, name);
        private static _serializeStringMap(map, expectedType, name);
    }
}
declare module Microsoft.Telemetry {
    /**
     * Data struct to contain only C section with custom fields.
     */
    class Base {
        /**
         * Name of item (B section) if any. If telemetry data is derived straight from this, this should be null.
         */
        baseType: string;
        constructor();
    }
}
declare module Microsoft.Telemetry {
    /**
     * System variables for a telemetry item.
     */
    class Envelope {
        /**
         * Envelope version. For internal use only. By assigning this the default, it will not be serialized within the payload unless changed to a value other than #1.
         */
        ver: number;
        /**
         * Type name of telemetry data item.
         */
        name: string;
        /**
         * Event date time when telemetry item was created. This is the wall clock time on the client when the event was generated. There is no guarantee that the client's time is accurate. This field must be formatted in UTC ISO 8601 format, with a trailing 'Z' character, as described publicly on https://en.wikipedia.org/wiki/ISO_8601#UTC. Note: the number of decimal seconds digits provided are variable (and unspecified). Consumers should handle this, i.e. managed code consumers should not use format 'O' for parsing as it specifies a fixed length. Example: 2009-06-15T13:45:30.0000000Z.
         */
        time: string;
        /**
         * Sampling rate used in application. This telemetry item represents 1 / sampleRate actual telemetry items.
         */
        sampleRate: number;
        /**
         * Sequence field used to track absolute order of uploaded events.
         */
        seq: string;
        /**
         * The application's instrumentation key. The key is typically represented as a GUID, but there are cases when it is not a guid. No code should rely on iKey being a GUID. Instrumentation key is case insensitive.
         */
        iKey: string;
        /**
         * Key/value collection of context properties. See ContextTagKeys for information on available properties.
         */
        tags: any;
        /**
         * Telemetry data item.
         */
        data: Base;
        constructor();
    }
}
declare module Microsoft.ApplicationInsights.Telemetry.Common {
    class Envelope extends Microsoft.Telemetry.Envelope implements IEnvelope {
        /**
         * The data contract for serializing this object.
         */
        aiDataContract: any;
        /**
         * Constructs a new instance of telemetry data.
         */
        constructor(data: Microsoft.Telemetry.Base, name: string);
    }
}
declare module Microsoft.ApplicationInsights.Telemetry.Common {
    class Base extends Microsoft.Telemetry.Base implements ISerializable {
        /**
         * The data contract for serializing this object.
         */
        aiDataContract: {};
    }
}
declare module AI {
    class ContextTagKeys {
        /**
         * Application version. Information in the application context fields is always about the application that is sending the telemetry.
         */
        applicationVersion: string;
        /**
         * Application build.
         */
        applicationBuild: string;
        /**
         * Application type id.
         */
        applicationTypeId: string;
        /**
         * Application id.
         */
        applicationId: string;
        /**
         * Application layer.
         */
        applicationLayer: string;
        /**
         * Unique client device id. Computer name in most cases.
         */
        deviceId: string;
        deviceIp: string;
        deviceLanguage: string;
        /**
         * Device locale using <language>-<REGION> pattern, following RFC 5646. Example 'en-US'.
         */
        deviceLocale: string;
        /**
         * Model of the device the end user of the application is using. Used for client scenarios. If this field is empty then it is derived from the user agent.
         */
        deviceModel: string;
        deviceFriendlyName: string;
        deviceNetwork: string;
        deviceNetworkName: string;
        /**
         * Client device OEM name taken from the browser.
         */
        deviceOEMName: string;
        deviceOS: string;
        /**
         * Operating system name and version of the device the end user of the application is using. If this field is empty then it is derived from the user agent. Example 'Windows 10 Pro 10.0.10586.0'
         */
        deviceOSVersion: string;
        /**
         * Name of the instance where application is running. Computer name for on-premisis, instance name for Azure.
         */
        deviceRoleInstance: string;
        /**
         * Name of the role application is part of. Maps directly to the role name in azure.
         */
        deviceRoleName: string;
        deviceScreenResolution: string;
        /**
         * The type of the device the end user of the application is using. Used primarily to distinguish JavaScript telemetry from server side telemetry. Examples: 'PC', 'Phone', 'Browser'. 'PC' is the default value.
         */
        deviceType: string;
        deviceMachineName: string;
        deviceVMName: string;
        deviceBrowser: string;
        /**
         * The browser name and version as reported by the browser.
         */
        deviceBrowserVersion: string;
        /**
         * The IP address of the client device. IPv4 and IPv6 are supported. Information in the location context fields is always about the end user. When telemetry is sent from a service, the location context is about the user that initiated the operation in the service.
         */
        locationIp: string;
        /**
         * The country of the client device. If any of Country, Province, or City is specified, those values will be preferred over geolocation of the IP address field. Information in the location context fields is always about the end user. When telemetry is sent from a service, the location context is about the user that initiated the operation in the service.
         */
        locationCountry: string;
        /**
         * The province/state of the client device. If any of Country, Province, or City is specified, those values will be preferred over geolocation of the IP address field. Information in the location context fields is always about the end user. When telemetry is sent from a service, the location context is about the user that initiated the operation in the service.
         */
        locationProvince: string;
        /**
         * The city of the client device. If any of Country, Province, or City is specified, those values will be preferred over geolocation of the IP address field. Information in the location context fields is always about the end user. When telemetry is sent from a service, the location context is about the user that initiated the operation in the service.
         */
        locationCity: string;
        /**
         * A unique identifier for the operation instance. The operation.id is created by either a request or a page view. All other telemetry sets this to the value for the containing request or page view. Operation.id is used for finding all the telemetry items for a specific operation instance.
         */
        operationId: string;
        /**
         * The name (group) of the operation. The operation.name is created by either a request or a page view. All other telemetry items set this to the value for the containing request or page view. Operation.name is used for finding all the telemetry items for a group of operations (i.e. 'GET Home/Index').
         */
        operationName: string;
        /**
         * The unique identifier of the telemetry item's immediate parent.
         */
        operationParentId: string;
        operationRootId: string;
        /**
         * Name of synthetic source. Some telemetry from the application may represent a synthetic traffic. It may be web crawler indexing the web site, site availability tests or traces from diagnostic libraries like Application Insights SDK itself.
         */
        operationSyntheticSource: string;
        /**
         * The correlation vector is a light weight vector clock which can be used to identify and order related events across clients and services.
         */
        operationCorrelationVector: string;
        /**
         * Session ID - the instance of the user's interaction with the app. Information in the session context fields is always about the end user. When telemetry is sent from a service, the session context is about the user that initiated the operation in the service.
         */
        sessionId: string;
        /**
         * Boolean value indicating whether the session identified by ai.session.id is first for the user or not.
         */
        sessionIsFirst: string;
        sessionIsNew: string;
        userAccountAcquisitionDate: string;
        /**
         * In multi-tenant applications this is the account ID or name which the user is acting with. Examples may be subscription ID for Azure portal or blog name blogging platform.
         */
        userAccountId: string;
        /**
         * The browser's user agent string as reported by the browser. This property will be used to extract informaiton regarding the customer's browser but will not be stored. Use custom properties to store the original user agent.
         */
        userAgent: string;
        /**
         * Anonymous user id. Represents the end user of the application. When telemetry is sent from a service, the user context is about the user that initiated the operation in the service.
         */
        userId: string;
        /**
         * Store region for UWP applications.
         */
        userStoreRegion: string;
        /**
         * Authenticated user id. The opposite of ai.user.id, this represents the user with a friendly name. Since it's PII information it is not collected by default by most SDKs.
         */
        userAuthUserId: string;
        userAnonymousUserAcquisitionDate: string;
        userAuthenticatedUserAcquisitionDate: string;
        cloudName: string;
        /**
         * Name of the role the application is a part of. Maps directly to the role name in azure.
         */
        cloudRole: string;
        cloudRoleVer: string;
        /**
         * Name of the instance where the application is running. Computer name for on-premisis, instance name for Azure.
         */
        cloudRoleInstance: string;
        cloudEnvironment: string;
        cloudLocation: string;
        cloudDeploymentUnit: string;
        /**
         * SDK version. See https://github.com/Microsoft/ApplicationInsights-Home/blob/master/SDK-AUTHORING.md#sdk-version-specification for information.
         */
        internalSdkVersion: string;
        /**
         * Agent version. Used to indicate the version of StatusMonitor installed on the computer if it is used for data collection.
         */
        internalAgentVersion: string;
        /**
         * This is the node name used for billing purposes. Use it to override the standard detection of nodes.
         */
        internalNodeName: string;
        constructor();
    }
}
declare module Microsoft.ApplicationInsights.Context {
    interface IApplication {
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
declare module Microsoft.ApplicationInsights.Context {
    class Application implements IApplication {
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
declare module Microsoft.ApplicationInsights.Context {
    interface IDevice {
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
declare module Microsoft.ApplicationInsights.Context {
    class Device implements IDevice {
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
declare module Microsoft.ApplicationInsights.Context {
    interface IInternal {
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
declare module Microsoft.ApplicationInsights.Context {
    class Internal implements IInternal {
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
declare module Microsoft.ApplicationInsights.Context {
    interface ILocation {
        /**
         * Client IP address for reverse lookup
         */
        ip: string;
    }
}
declare module Microsoft.ApplicationInsights.Context {
    class Location implements ILocation {
        /**
         * Client IP address for reverse lookup
         */
        ip: string;
    }
}
declare module Microsoft.ApplicationInsights.Context {
    interface IOperation {
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
declare module Microsoft.ApplicationInsights.Context {
    class Operation implements IOperation {
        id: string;
        name: string;
        parentId: string;
        rootId: string;
        syntheticSource: string;
        constructor();
    }
}
declare module Microsoft.ApplicationInsights {
    class HashCodeScoreGenerator {
        static INT_MAX_VALUE: number;
        private static MIN_INPUT_LENGTH;
        getHashCodeScore(key: string): number;
        getHashCode(input: string): number;
    }
}
declare module Microsoft.ApplicationInsights {
    class SamplingScoreGenerator {
        private hashCodeGeneragor;
        constructor();
        getSamplingScore(envelope: Microsoft.ApplicationInsights.IEnvelope): number;
    }
}
declare module Microsoft.ApplicationInsights.Context {
    interface ISample {
        /**
        * Sample rate
        */
        sampleRate: number;
    }
}
declare module Microsoft.ApplicationInsights.Context {
    class Sample implements ISample {
        sampleRate: number;
        private samplingScoreGenerator;
        INT_MAX_VALUE: number;
        constructor(sampleRate: number);
        /**
        * Determines if an envelope is sampled in (i.e. will be sent) or not (i.e. will be dropped).
        */
        isSampledIn(envelope: Microsoft.ApplicationInsights.IEnvelope): boolean;
    }
}
declare module Microsoft.ApplicationInsights.Context {
    interface ISession {
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
declare module Microsoft.ApplicationInsights.Context {
    interface ISessionConfig {
        sessionRenewalMs: () => number;
        sessionExpirationMs: () => number;
        cookieDomain: () => string;
    }
    class Session implements ISession {
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
    class _SessionManager {
        static acquisitionSpan: number;
        static renewalSpan: number;
        static cookieUpdateInterval: number;
        automaticSession: Session;
        config: ISessionConfig;
        private cookieUpdatedTimestamp;
        constructor(config: ISessionConfig);
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
declare module Microsoft.ApplicationInsights.Context {
    interface IUser {
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
}
declare module Microsoft.ApplicationInsights.Context {
    class User implements IUser {
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
        constructor(config: ITelemetryConfig);
        private validateUserInput(id);
    }
}
declare module Microsoft.ApplicationInsights {
    class extensions {
        static IsNullOrUndefined(obj: any): boolean;
    }
    class stringUtils {
        static GetLength(strObject: any): number;
    }
    class dateTime {
        static Now: () => number;
        static GetDuration: (start: number, end: number) => number;
    }
    class EventHelper {
        static AttachEvent(obj: any, eventNameWithoutOn: any, handlerRef: any): boolean;
        static DetachEvent(obj: any, eventNameWithoutOn: any, handlerRef: any): void;
    }
    class AjaxHelper {
        static ParseDependencyPath(absoluteUrl: string, method: string, pathName: string): {
            target: any;
            name: any;
        };
    }
}
declare module Microsoft.ApplicationInsights {
    class XHRMonitoringState {
        openDone: boolean;
        setRequestHeaderDone: boolean;
        sendDone: boolean;
        abortDone: boolean;
        onreadystatechangeCallbackAttached: boolean;
    }
    class ajaxRecord {
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
        clientFailure: number;
        id: string;
        constructor(id: string);
        getAbsoluteUrl(): string;
        getPathName(): any;
        CalculateMetrics: () => void;
    }
}
declare module Microsoft.ApplicationInsights {
    class RequestHeaders {
        /**
         * Request-Context header
         */
        static requestContextHeader: string;
        /**
         * Target instrumentation header that is added to the response and retrieved by the
         * calling application when processing incoming responses.
         */
        static requestContextTargetKey: string;
        /**
         * Request-Context appId format
         */
        static requestContextAppIdFormat: string;
        /**
         * Request-Id header
         */
        static requestIdHeader: string;
        /**
         * Sdk-Context header
         * If this header passed with appId in content then appId will be returned back by the backend.
         */
        static sdkContextHeader: string;
        /**
         * String to pass in header for requesting appId back from the backend.
         */
        static sdkContextHeaderAppIdRequest: string;
        static requestContextHeaderLowerCase: string;
    }
}
declare module Microsoft.Telemetry {
    /**
     * The abstract common base of all domains.
     */
    class Domain {
        constructor();
    }
}
declare module AI {
    /**
     * Instances of Event represent structured event records that can be grouped and searched by their properties. Event data item also creates a metric of event count by name.
     */
    class EventData extends Microsoft.Telemetry.Domain {
        /**
         * Schema version
         */
        ver: number;
        /**
         * Event name. Keep it low cardinality to allow proper grouping and useful metrics.
         */
        name: string;
        /**
         * Collection of custom properties.
         */
        properties: any;
        /**
         * Collection of custom measurements.
         */
        measurements: any;
        constructor();
    }
}
declare module AI {
    /**
     * An instance of PageView represents a generic action on a page like a button click. It is also the base type for PageView.
     */
    class PageViewData extends AI.EventData {
        /**
         * Schema version
         */
        ver: number;
        /**
         * Request URL with all query string parameters
         */
        url: string;
        /**
         * Event name. Keep it low cardinality to allow proper grouping and useful metrics.
         */
        name: string;
        /**
         * Request duration in format: DD.HH:MM:SS.MMMMMM. For a page view (PageViewData), this is the duration. For a page view with performance information (PageViewPerfData), this is the page load time. Must be less than 1000 days.
         */
        duration: string;
        /**
         * Identifier of a page view instance. Used for correlation between page view and other telemetry items.
         */
        id: string;
        /**
         * Collection of custom properties.
         */
        properties: any;
        /**
         * Collection of custom measurements.
         */
        measurements: any;
        constructor();
    }
}
declare module AI {
    /**
     * An instance of Remote Dependency represents an interaction of the monitored component with a remote component/service like SQL or an HTTP endpoint.
     */
    class RemoteDependencyData extends Microsoft.Telemetry.Domain {
        /**
         * Schema version
         */
        ver: number;
        /**
         * Name of the command initiated with this dependency call. Low cardinality value. Examples are stored procedure name and URL path template.
         */
        name: string;
        /**
         * Identifier of a dependency call instance. Used for correlation with the request telemetry item corresponding to this dependency call.
         */
        id: string;
        /**
         * Result code of a dependency call. Examples are SQL error code and HTTP status code.
         */
        resultCode: string;
        /**
         * Request duration in format: DD.HH:MM:SS.MMMMMM. Must be less than 1000 days.
         */
        duration: string;
        /**
         * Indication of successfull or unsuccessfull call.
         */
        success: boolean;
        /**
         * Command initiated by this dependency call. Examples are SQL statement and HTTP URL's with all query parameters.
         */
        data: string;
        /**
         * Target site of a dependency call. Examples are server name, host address.
         */
        target: string;
        /**
         * Dependency type name. Very low cardinality value for logical grouping of dependencies and interpretation of other fields like commandName and resultCode. Examples are SQL, Azure table, and HTTP.
         */
        type: string;
        /**
         * Collection of custom properties.
         */
        properties: any;
        /**
         * Collection of custom measurements.
         */
        measurements: any;
        constructor();
    }
}
declare module Microsoft.ApplicationInsights.Telemetry.Common {
    class DataSanitizer {
        /**
        * Max length allowed for custom names.
        */
        private static MAX_NAME_LENGTH;
        /**
         * Max length allowed for Id field in page views.
         */
        private static MAX_ID_LENGTH;
        /**
         * Max length allowed for custom values.
         */
        private static MAX_PROPERTY_LENGTH;
        /**
         * Max length allowed for names
         */
        private static MAX_STRING_LENGTH;
        /**
         * Max length allowed for url.
         */
        private static MAX_URL_LENGTH;
        /**
         * Max length allowed for messages.
         */
        private static MAX_MESSAGE_LENGTH;
        /**
         * Max length allowed for exceptions.
         */
        private static MAX_EXCEPTION_LENGTH;
        static sanitizeKeyAndAddUniqueness(key: any, map: any): any;
        static sanitizeKey(name: any): any;
        static sanitizeString(value: any, maxLength?: number): any;
        static sanitizeUrl(url: any): any;
        static sanitizeMessage(message: any): any;
        static sanitizeException(exception: any): any;
        static sanitizeProperties(properties: any): any;
        static sanitizeMeasurements(measurements: any): any;
        static sanitizeId(id: string): string;
        static sanitizeInput(input: any, maxLength: number, _msgId: _InternalMessageId): any;
        static padNumber(num: any): string;
    }
}
declare module Microsoft.ApplicationInsights.Telemetry {
    class RemoteDependencyData extends AI.RemoteDependencyData implements ISerializable {
        static envelopeType: string;
        static dataType: string;
        aiDataContract: {
            id: FieldType;
            ver: FieldType;
            name: FieldType;
            resultCode: FieldType;
            duration: FieldType;
            success: FieldType;
            data: FieldType;
            target: FieldType;
            type: FieldType;
            properties: FieldType;
            measurements: FieldType;
            kind: FieldType;
            value: FieldType;
            count: FieldType;
            min: FieldType;
            max: FieldType;
            stdDev: FieldType;
            dependencyKind: FieldType;
            dependencySource: FieldType;
            commandName: FieldType;
            dependencyTypeName: FieldType;
        };
        /**
         * Constructs a new instance of the RemoteDependencyData object
         */
        constructor(id: string, absoluteUrl: string, commandName: string, value: number, success: boolean, resultCode: number, method?: string, properties?: Object, measurements?: Object);
    }
}
declare module Microsoft.ApplicationInsights {
    interface XMLHttpRequestInstrumented extends XMLHttpRequest {
        ajaxData: ajaxRecord;
    }
    class AjaxMonitor {
        private appInsights;
        private initialized;
        private static instrumentedByAppInsightsName;
        private currentWindowHost;
        constructor(appInsights: Microsoft.ApplicationInsights.AppInsights);
        private Init();
        static DisabledPropertyName: string;
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
    }
}
declare module Microsoft.ApplicationInsights {
    interface ISendBuffer {
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
    class ArraySendBuffer implements ISendBuffer {
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
    class SessionStorageSendBuffer implements ISendBuffer {
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
interface XDomainRequest extends XMLHttpRequestEventTarget {
    responseText: string;
    send(payload: string): any;
    open(method: string, url: string): any;
}
declare var XDomainRequest: {
    prototype: XDomainRequest;
    new (): XDomainRequest;
};
declare module Microsoft.ApplicationInsights {
    interface ISenderConfig {
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
    interface IResponseError {
        index: number;
        statusCode: number;
        message: string;
    }
    interface IBackendResponse {
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
    class Sender {
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
        /**
         * A send buffer object
         */
        _buffer: ISendBuffer;
        /**
         * The configuration for this sender instance
         */
        _config: ISenderConfig;
        /**
         * AppId of this component parsed from some backend response.
         */
        _appId: string;
        /**
         * A method which will cause data to be send to the url
         */
        _sender: (payload: string[], isAsync: boolean) => void;
        /**
         * Whether XMLHttpRequest object is supported. Older version of IE (8,9) do not support it.
         */
        _XMLHttpRequestSupported: boolean;
        /**
         * The maximum Beacon API payload size.
         * WC3 documentation allows browsers to set the limit. Chrome current has a limit of 64kb.
         */
        static MaxBeaconPayloadSize: number;
        /**
         * Constructs a new instance of the Sender class
         */
        constructor(config: ISenderConfig);
        /**
         * Add a telemetry item to the send buffer
         */
        send(envelope: Microsoft.ApplicationInsights.IEnvelope): void;
        /**
         * Sets up the timer which triggers actually sending the data.
         */
        private _setupTimer();
        /**
         * Gets the size of the list in bytes.
         * @param list {string[]} - The list to get the size in bytes of.
         */
        private _getSizeInBytes(list);
        /**
         * Immediately send buffered data
         * @param async {boolean} - Indicates if the events should be sent asynchronously
         */
        triggerSend(async?: boolean): void;
        /** Calculates the time to wait before retrying in case of an error based on
         * http://en.wikipedia.org/wiki/Exponential_backoff
         */
        private _setRetryTime();
        /**
         * Parses the response from the backend.
         * @param response - XMLHttpRequest or XDomainRequest response
         */
        private _parseResponse(response);
        /**
         * Checks if the SDK should resend the payload after receiving this status code from the backend.
         * @param statusCode
         */
        private _isRetriable(statusCode);
        /**
         * Resend payload. Adds payload back to the send buffer and setup a send timer (with exponential backoff).
         * @param payload
         */
        private _resendPayload(payload);
        private _formatErrorMessageXhr(xhr, message?);
        private _formatErrorMessageXdr(xdr, message?);
        /**
         * Send XMLHttpRequest
         * @param payload {string} - The data payload to be sent.
         * @param isAsync {boolean} - Indicates if the request should be sent asynchronously
         */
        private _xhrSender(payload, isAsync);
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
        /**
         * Send Beacon API request
         * @param payload {string} - The data payload to be sent.
         * @param isAsync {boolean} - not used
         * Note: Beacon API does not support custom headers and we are not able to get
         * appId from the backend for the correct correlation.
         */
        private _beaconSender(payload, isAsync);
        /**
         * xhr state changes
         */
        _xhrReadyStateChange(xhr: XMLHttpRequest, payload: string[], countOfItemsInPayload: number): void;
        /**
         * xdr state changes
         */
        _xdrOnLoad(xdr: XDomainRequest, payload: string[]): void;
        /**
         * partial success handler
         */
        _onPartialSuccess(payload: string[], results: IBackendResponse): void;
        /**
         * error handler
         */
        _onError(payload: string[], message: string, event?: ErrorEvent): void;
        /**
         * success handler
         */
        _onSuccess(payload: string[], countOfItemsInPayload: number): void;
    }
}
declare module AI {
    /**
     * Defines the level of severity for the event.
     */
    enum SeverityLevel {
        Verbose = 0,
        Information = 1,
        Warning = 2,
        Error = 3,
        Critical = 4,
    }
}
declare module AI {
    /**
     * Instances of Message represent printf-like trace statements that are text-searched. Log4Net, NLog and other text-based log file entries are translated into intances of this type. The message does not have measurements.
     */
    class MessageData extends Microsoft.Telemetry.Domain {
        /**
         * Schema version
         */
        ver: number;
        /**
         * Trace message
         */
        message: string;
        /**
         * Trace severity level.
         */
        severityLevel: AI.SeverityLevel;
        /**
         * Collection of custom properties.
         */
        properties: any;
        constructor();
    }
}
declare module Microsoft.ApplicationInsights.Telemetry {
    class Trace extends AI.MessageData implements ISerializable {
        static envelopeType: string;
        static dataType: string;
        aiDataContract: {
            ver: FieldType;
            message: FieldType;
            severityLevel: FieldType;
            properties: FieldType;
        };
        /**
         * Constructs a new instance of the TraceTelemetry object
         */
        constructor(message: string, properties?: any, severityLevel?: AI.SeverityLevel);
    }
}
declare module Microsoft.ApplicationInsights.Telemetry {
    class Event extends AI.EventData implements ISerializable {
        static envelopeType: string;
        static dataType: string;
        aiDataContract: {
            ver: FieldType;
            name: FieldType;
            properties: FieldType;
            measurements: FieldType;
        };
        /**
         * Constructs a new instance of the EventTelemetry object
         */
        constructor(name: string, properties?: any, measurements?: any);
    }
}
declare module AI {
    /**
     * Exception details of the exception in a chain.
     */
    class ExceptionDetails {
        /**
         * In case exception is nested (outer exception contains inner one), the id and outerId properties are used to represent the nesting.
         */
        id: number;
        /**
         * The value of outerId is a reference to an element in ExceptionDetails that represents the outer exception
         */
        outerId: number;
        /**
         * Exception type name.
         */
        typeName: string;
        /**
         * Exception message.
         */
        message: string;
        /**
         * Indicates if full exception stack is provided in the exception. The stack may be trimmed, such as in the case of a StackOverflow exception.
         */
        hasFullStack: boolean;
        /**
         * Text describing the stack. Either stack or parsedStack should have a value.
         */
        stack: string;
        /**
         * List of stack frames. Either stack or parsedStack should have a value.
         */
        parsedStack: StackFrame[];
        constructor();
    }
}
declare module AI {
    /**
     * An instance of Exception represents a handled or unhandled exception that occurred during execution of the monitored application.
     */
    class ExceptionData extends Microsoft.Telemetry.Domain {
        /**
         * Schema version
         */
        ver: number;
        /**
         * Exception chain - list of inner exceptions.
         */
        exceptions: ExceptionDetails[];
        /**
         * Severity level. Mostly used to indicate exception severity level when it is reported by logging library.
         */
        severityLevel: AI.SeverityLevel;
        /**
         * Collection of custom properties.
         */
        properties: any;
        /**
         * Collection of custom measurements.
         */
        measurements: any;
        constructor();
    }
}
declare module AI {
    /**
     * Stack frame information.
     */
    class StackFrame {
        /**
         * Level in the call stack. For the long stacks SDK may not report every function in a call stack.
         */
        level: number;
        /**
         * Method name.
         */
        method: string;
        /**
         * Name of the assembly (dll, jar, etc.) containing this function.
         */
        assembly: string;
        /**
         * File name or URL of the method implementation.
         */
        fileName: string;
        /**
         * Line number of the code implementation.
         */
        line: number;
        constructor();
    }
}
declare module Microsoft.ApplicationInsights.Telemetry {
    class Exception extends AI.ExceptionData implements ISerializable {
        static envelopeType: string;
        static dataType: string;
        aiDataContract: {
            ver: FieldType;
            exceptions: FieldType;
            severityLevel: FieldType;
            properties: FieldType;
            measurements: FieldType;
        };
        /**
        * Constructs a new isntance of the ExceptionTelemetry object
        */
        constructor(exception: Error, properties?: any, measurements?: any, severityLevel?: AI.SeverityLevel);
        /**
        * Creates a simple exception with 1 stack frame. Useful for manual constracting of exception.
        */
        static CreateSimpleException(message: string, typeName: string, assembly: string, fileName: string, details: string, line: number): Telemetry.Exception;
    }
    class _StackFrame extends AI.StackFrame implements ISerializable {
        static regex: RegExp;
        static baseSize: number;
        sizeInBytes: number;
        aiDataContract: {
            level: FieldType;
            method: FieldType;
            assembly: FieldType;
            fileName: FieldType;
            line: FieldType;
        };
        constructor(frame: string, level: number);
    }
}
declare module AI {
    /**
     * Type of the metric data measurement.
     */
    enum DataPointType {
        Measurement = 0,
        Aggregation = 1,
    }
}
declare module AI {
    /**
     * Metric data single measurement.
     */
    class DataPoint {
        /**
         * Name of the metric.
         */
        name: string;
        /**
         * Metric type. Single measurement or the aggregated value.
         */
        kind: AI.DataPointType;
        /**
         * Single value for measurement. Sum of individual measurements for the aggregation.
         */
        value: number;
        /**
         * Metric weight of the aggregated metric. Should not be set for a measurement.
         */
        count: number;
        /**
         * Minimum value of the aggregated metric. Should not be set for a measurement.
         */
        min: number;
        /**
         * Maximum value of the aggregated metric. Should not be set for a measurement.
         */
        max: number;
        /**
         * Standard deviation of the aggregated metric. Should not be set for a measurement.
         */
        stdDev: number;
        constructor();
    }
}
declare module AI {
    /**
     * An instance of the Metric item is a list of measurements (single data points) and/or aggregations.
     */
    class MetricData extends Microsoft.Telemetry.Domain {
        /**
         * Schema version
         */
        ver: number;
        /**
         * List of metrics. Only one metric in the list is currently supported by Application Insights storage. If multiple data points were sent only the first one will be used.
         */
        metrics: DataPoint[];
        /**
         * Collection of custom properties.
         */
        properties: any;
        constructor();
    }
}
declare module Microsoft.ApplicationInsights.Telemetry.Common {
    class DataPoint extends AI.DataPoint implements ISerializable {
        /**
         * The data contract for serializing this object.
         */
        aiDataContract: {
            name: FieldType;
            kind: FieldType;
            value: FieldType;
            count: FieldType;
            min: FieldType;
            max: FieldType;
            stdDev: FieldType;
        };
    }
}
declare module Microsoft.ApplicationInsights.Telemetry {
    class Metric extends AI.MetricData implements ISerializable {
        static envelopeType: string;
        static dataType: string;
        aiDataContract: {
            ver: FieldType;
            metrics: FieldType;
            properties: FieldType;
        };
        /**
         * Constructs a new instance of the MetricTelemetry object
         */
        constructor(name: string, value: number, count?: number, min?: number, max?: number, properties?: any);
    }
}
declare module Microsoft.ApplicationInsights.Telemetry {
    class PageView extends AI.PageViewData implements ISerializable {
        static envelopeType: string;
        static dataType: string;
        aiDataContract: {
            ver: FieldType;
            name: FieldType;
            url: FieldType;
            duration: FieldType;
            properties: FieldType;
            measurements: FieldType;
            id: FieldType;
        };
        /**
         * Constructs a new instance of the PageEventTelemetry object
         */
        constructor(name?: string, url?: string, durationMs?: number, properties?: any, measurements?: any, id?: string);
    }
}
declare module AI {
    /**
     * An instance of PageViewPerf represents: a page view with no performance data, a page view with performance data, or just the performance data of an earlier page request.
     */
    class PageViewPerfData extends AI.PageViewData {
        /**
         * Schema version
         */
        ver: number;
        /**
         * Request URL with all query string parameters
         */
        url: string;
        /**
         * Performance total in TimeSpan 'G' (general long) format: d:hh:mm:ss.fffffff
         */
        perfTotal: string;
        /**
         * Event name. Keep it low cardinality to allow proper grouping and useful metrics.
         */
        name: string;
        /**
         * Request duration in format: DD.HH:MM:SS.MMMMMM. For a page view (PageViewData), this is the duration. For a page view with performance information (PageViewPerfData), this is the page load time. Must be less than 1000 days.
         */
        duration: string;
        /**
         * Network connection time in TimeSpan 'G' (general long) format: d:hh:mm:ss.fffffff
         */
        networkConnect: string;
        /**
         * Sent request time in TimeSpan 'G' (general long) format: d:hh:mm:ss.fffffff
         */
        sentRequest: string;
        /**
         * Received response time in TimeSpan 'G' (general long) format: d:hh:mm:ss.fffffff
         */
        receivedResponse: string;
        /**
         * DOM processing time in TimeSpan 'G' (general long) format: d:hh:mm:ss.fffffff
         */
        domProcessing: string;
        /**
         * Collection of custom properties.
         */
        properties: any;
        /**
         * Collection of custom measurements.
         */
        measurements: any;
        constructor();
    }
}
declare module Microsoft.ApplicationInsights.Telemetry {
    class PageViewPerformance extends AI.PageViewPerfData implements ISerializable {
        static envelopeType: string;
        static dataType: string;
        private static MAX_DURATION_ALLOWED;
        aiDataContract: {
            ver: FieldType;
            name: FieldType;
            url: FieldType;
            duration: FieldType;
            perfTotal: FieldType;
            networkConnect: FieldType;
            sentRequest: FieldType;
            receivedResponse: FieldType;
            domProcessing: FieldType;
            properties: FieldType;
            measurements: FieldType;
        };
        /**
         * Field indicating whether this instance of PageViewPerformance is valid and should be sent
         */
        private isValid;
        /**
         * Indicates whether this instance of PageViewPerformance is valid and should be sent
         */
        getIsValid(): boolean;
        private durationMs;
        /**
        * Gets the total duration (PLT) in milliseconds. Check getIsValid() before using this method.
        */
        getDurationMs(): number;
        /**
         * Constructs a new instance of the PageEventTelemetry object
         */
        constructor(name: string, url: string, unused: number, properties?: any, measurements?: any);
        static getPerformanceTiming(): PerformanceTiming;
        /**
        * Returns true is window performance timing API is supported, false otherwise.
        */
        static isPerformanceTimingSupported(): PerformanceTiming;
        /**
         * As page loads different parts of performance timing numbers get set. When all of them are set we can report it.
         * Returns true if ready, false otherwise.
         */
        static isPerformanceTimingDataReady(): boolean;
        static getDuration(start: any, end: any): number;
        /**
         * This method tells if given durations should be excluded from collection.
         */
        static shouldCollectDuration(...durations: number[]): boolean;
    }
}
declare module Microsoft.ApplicationInsights {
    interface IEnvelope extends ISerializable {
        ver: number;
        name: string;
        time: string;
        sampleRate: number;
        seq: string;
        iKey: string;
        tags: {
            [name: string]: any;
        };
        data: any;
    }
}
declare module Microsoft.ApplicationInsights {
    interface ITelemetryContext {
        /**
        * The object describing a component tracked by this object.
        */
        application: Context.IApplication;
        /**
         * The object describing a device tracked by this object.
         */
        device: Context.IDevice;
        /**
        * The object describing internal settings.
        */
        internal: Context.IInternal;
        /**
         * The object describing a location tracked by this object.
         */
        location: Context.ILocation;
        /**
         * The object describing a operation tracked by this object.
         */
        operation: Context.IOperation;
        /**
        * The object describing sampling settings.
        */
        sample: Context.ISample;
        /**
         * The object describing a user tracked by this object.
         */
        user: Context.IUser;
        /**
         * The object describing a session tracked by this object.
         */
        session: Context.ISession;
        /**
        * Adds a telemetry initializer to the collection. Telemetry initializers will be called one by one,
        * in the order they were added, before the telemetry item is pushed for sending.
        * If one of the telemetry initializers returns false or throws an error then the telemetry item will not be sent.
        * If it returns true or doesn't return any value the event will be passed to the next telemetry initializer and
        * send to the cloud (if not rejected by other initializers).
        */
        addTelemetryInitializer(telemetryInitializer: (envelope: Microsoft.ApplicationInsights.IEnvelope) => boolean | void): any;
        /**
        * Tracks telemetry object.
        */
        track(envelope: Microsoft.ApplicationInsights.IEnvelope): any;
    }
}
declare module Microsoft.ApplicationInsights {
    interface ITelemetryConfig extends ISenderConfig {
        instrumentationKey: () => string;
        accountId: () => string;
        sessionRenewalMs: () => number;
        sessionExpirationMs: () => number;
        sampleRate: () => number;
        cookieDomain: () => string;
        sdkExtension: () => string;
        isBrowserLinkTrackingEnabled: () => boolean;
        appId: () => string;
    }
    class TelemetryContext implements ITelemetryContext {
        /**
         * The configuration for this telemetry context
         */
        _config: ITelemetryConfig;
        /**
         * The sender instance for this context
         */
        _sender: Sender;
        /**
         * The object describing a component tracked by this object.
         */
        application: Context.Application;
        /**
         * The object describing a device tracked by this object.
         */
        device: Context.Device;
        internal: Context.Internal;
        /**
         * The object describing a location tracked by this object.
         */
        location: Context.Location;
        /**
         * The object describing a operation tracked by this object.
         */
        operation: Context.Operation;
        sample: Context.Sample;
        /**
         * The object describing a user tracked by this object.
         */
        user: Context.User;
        /**
         * The object describing a session tracked by this object.
         */
        session: Context.Session;
        /**
         * AppId of this component if returned by the backend.
         */
        appId: () => string;
        /**
        * The array of telemetry initializers to call before sending each telemetry item.
        */
        private telemetryInitializers;
        /**
         * The session manager that manages session on the base of cookies.
         */
        _sessionManager: Microsoft.ApplicationInsights.Context._SessionManager;
        constructor(config: ITelemetryConfig);
        /**
        * Adds telemetry initializer to the collection. Telemetry initializers will be called one by one
        * before telemetry item is pushed for sending and in the order they were added.
        */
        addTelemetryInitializer(telemetryInitializer: (envelope: Microsoft.ApplicationInsights.IEnvelope) => boolean | void): void;
        /**
         * Use Sender.ts to send telemetry object to the endpoint
         */
        track(envelope: Microsoft.ApplicationInsights.IEnvelope): IEnvelope;
        private _addDefaultTelemetryInitializers();
        private _track(envelope);
        private _applyApplicationContext(envelope, appContext);
        private _applyDeviceContext(envelope, deviceContext);
        private _applyInternalContext(envelope, internalContext);
        private _applyLocationContext(envelope, locationContext);
        private _applyOperationContext(envelope, operationContext);
        private _applySampleContext(envelope, sampleContext);
        private _applySessionContext(envelope, sessionContext);
        private _applyUserContext(envelope, userContext);
    }
}
declare module Microsoft.Telemetry {
    /**
     * Data struct to contain both B and C sections.
     */
    class Data<TDomain> extends Microsoft.Telemetry.Base {
        /**
         * Name of item (B section) if any. If telemetry data is derived straight from this, this should be null.
         */
        baseType: string;
        /**
         * Container for data item (B section).
         */
        baseData: TDomain;
        constructor();
    }
}
declare module Microsoft.ApplicationInsights.Telemetry.Common {
    class Data<TDomain> extends Microsoft.Telemetry.Data<TDomain> implements ISerializable {
        /**
         * The data contract for serializing this object.
         */
        aiDataContract: {
            baseType: FieldType;
            baseData: FieldType;
        };
        /**
         * Constructs a new instance of telemetry data.
         */
        constructor(type: string, data: TDomain);
    }
}
declare module Microsoft.ApplicationInsights.Telemetry {
    /**
    * Class encapsulates sending page views and page view performance telemetry.
    */
    class PageViewManager {
        private pageViewPerformanceSent;
        private overridePageViewDuration;
        private appInsights;
        constructor(appInsights: IAppInsightsInternal, overridePageViewDuration: boolean);
        /**
        * Currently supported cases:
        * 1) (default case) track page view called with default parameters, overridePageViewDuration = false. Page view is sent with page view performance when navigation timing data is available.
        *    If navigation timing is not supported then page view is sent right away with undefined duration. Page view performance is not sent.
        * 2) overridePageViewDuration = true, custom duration provided. Custom duration is used, page view sends right away.
        * 3) overridePageViewDuration = true. Page view is sent right away, duration is time spent from page load till now (or undefined if navigation timing is not supported).
        * 4) overridePageViewDuration = false, custom duration is provided. Page view is sent right away with custom duration.
        *
        * In all cases page view performance is sent once (only for the 1st call of trackPageView), or not sent if navigation timing is not supported.
        */
        trackPageView(name?: string, url?: string, properties?: Object, measurements?: Object, duration?: number): void;
    }
}
declare module Microsoft.ApplicationInsights.Telemetry {
    /**
     * Used to track page visit durations
     */
    class PageVisitTimeManager {
        private prevPageVisitDataKeyName;
        private pageVisitTimeTrackingHandler;
        /**
         * Creates a new instance of PageVisitTimeManager
         * @param pageVisitTimeTrackingHandler Delegate that will be called to send telemetry data to AI (when trackPreviousPageVisit is called)
         * @returns {}
         */
        constructor(pageVisitTimeTrackingHandler: (pageName: string, pageUrl: string, pageVisitTime: number) => void);
        /**
        * Tracks the previous page visit time telemetry (if exists) and starts timing of new page visit time
        * @param currentPageName Name of page to begin timing for visit duration
        * @param currentPageUrl Url of page to begin timing for visit duration
        */
        trackPreviousPageVisit(currentPageName: string, currentPageUrl: string): void;
        /**
         * Stops timing of current page (if exists) and starts timing for duration of visit to pageName
         * @param pageName Name of page to begin timing visit duration
         * @returns {PageVisitData} Page visit data (including duration) of pageName from last call to start or restart, if exists. Null if not.
         */
        restartPageVisitTimer(pageName: string, pageUrl: string): PageVisitData;
        /**
         * Starts timing visit duration of pageName
         * @param pageName
         * @returns {}
         */
        startPageVisitTimer(pageName: string, pageUrl: string): void;
        /**
         * Stops timing of current page, if exists.
         * @returns {PageVisitData} Page visit data (including duration) of pageName from call to start, if exists. Null if not.
         */
        stopPageVisitTimer(): PageVisitData;
    }
    class PageVisitData {
        pageName: string;
        pageUrl: string;
        pageVisitStartTime: number;
        pageVisitTime: number;
        constructor(pageName: any, pageUrl: any);
    }
}
declare module Microsoft.ApplicationInsights {
    class SplitTest {
        private hashCodeGeneragor;
        isEnabled(key: string, percentEnabled: number): boolean;
    }
}
declare module Microsoft.ApplicationInsights {
    interface IConfig {
        instrumentationKey?: string;
        endpointUrl?: string;
        emitLineDelimitedJson?: boolean;
        accountId?: string;
        sessionRenewalMs?: number;
        sessionExpirationMs?: number;
        maxBatchSizeInBytes?: number;
        maxBatchInterval?: number;
        enableDebug?: boolean;
        disableExceptionTracking?: boolean;
        disableTelemetry?: boolean;
        verboseLogging?: boolean;
        diagnosticLogInterval?: number;
        samplingPercentage?: number;
        autoTrackPageVisitTime?: boolean;
        disableAjaxTracking?: boolean;
        overridePageViewDuration?: boolean;
        maxAjaxCallsPerView?: number;
        disableDataLossAnalysis?: boolean;
        disableCorrelationHeaders?: boolean;
        correlationHeaderExcludedDomains?: string[];
        disableFlushOnBeforeUnload?: boolean;
        enableSessionStorageBuffer?: boolean;
        isCookieUseDisabled?: boolean;
        cookieDomain?: string;
        isRetryDisabled?: boolean;
        url?: string;
        isStorageUseDisabled?: boolean;
        isBeaconApiDisabled?: boolean;
        sdkExtension?: string;
        isBrowserLinkTrackingEnabled?: boolean;
        appId?: string;
        enableCorsCorrelation?: boolean;
    }
}
declare module Microsoft.ApplicationInsights {
    interface IAppInsights {
        config: IConfig;
        context: ITelemetryContext;
        queue: Array<() => void>;
        /**
        * Starts timing how long the user views a page or other item. Call this when the page opens.
        * This method doesn't send any telemetry. Call {@link stopTrackTelemetry} to log the page when it closes.
        * @param   name  A string that idenfities this item, unique within this HTML document. Defaults to the document title.
        */
        startTrackPage(name?: string): any;
        /**
        * Logs how long a page or other item was visible, after {@link startTrackPage}. Call this when the page closes.
        * @param   name  The string you used as the name in startTrackPage. Defaults to the document title.
        * @param   url   String - a relative or absolute URL that identifies the page or other item. Defaults to the window location.
        * @param   properties  map[string, string] - additional data used to filter pages and metrics in the portal. Defaults to empty.
        * @param   measurements    map[string, number] - metrics associated with this page, displayed in Metrics Explorer on the portal. Defaults to empty.
        */
        stopTrackPage(name?: string, url?: string, properties?: {
            [name: string]: string;
        }, measurements?: {
            [name: string]: number;
        }): any;
        /**
         * Logs that a page or other item was viewed.
         * @param   name  The string you used as the name in startTrackPage. Defaults to the document title.
         * @param   url   String - a relative or absolute URL that identifies the page or other item. Defaults to the window location.
         * @param   properties  map[string, string] - additional data used to filter pages and metrics in the portal. Defaults to empty.
         * @param   measurements    map[string, number] - metrics associated with this page, displayed in Metrics Explorer on the portal. Defaults to empty.
         * @param   duration    number - the number of milliseconds it took to load the page. Defaults to undefined. If set to default value, page load time is calculated internally.
         */
        trackPageView(name?: string, url?: string, properties?: {
            [name: string]: string;
        }, measurements?: {
            [name: string]: number;
        }, duration?: number): any;
        /**
         * Start timing an extended event. Call {@link stopTrackEvent} to log the event when it ends.
         * @param   name    A string that identifies this event uniquely within the document.
         */
        startTrackEvent(name: string): any;
        /**
         * Log an extended event that you started timing with {@link startTrackEvent}.
         * @param   name    The string you used to identify this event in startTrackEvent.
         * @param   properties  map[string, string] - additional data used to filter events and metrics in the portal. Defaults to empty.
         * @param   measurements    map[string, number] - metrics associated with this event, displayed in Metrics Explorer on the portal. Defaults to empty.
         */
        stopTrackEvent(name: string, properties?: {
            [name: string]: string;
        }, measurements?: {
            [name: string]: number;
        }): any;
        /**
        * Log a user action or other occurrence.
        * @param   name    A string to identify this event in the portal.
        * @param   properties  map[string, string] - additional data used to filter events and metrics in the portal. Defaults to empty.
        * @param   measurements    map[string, number] - metrics associated with this event, displayed in Metrics Explorer on the portal. Defaults to empty.
        */
        trackEvent(name: string, properties?: {
            [name: string]: string;
        }, measurements?: {
            [name: string]: number;
        }): any;
        /**
         * Log a dependency call
         * @param id    unique id, this is used by the backend o correlate server requests. Use Util.newId() to generate a unique Id.
         * @param method    represents request verb (GET, POST, etc.)
         * @param absoluteUrl   absolute url used to make the dependency request
         * @param pathName  the path part of the absolute url
         * @param totalTime total request time
         * @param success   indicates if the request was sessessful
         * @param resultCode    response code returned by the dependency request
         */
        trackDependency(id: string, method: string, absoluteUrl: string, pathName: string, totalTime: number, success: boolean, resultCode: number): any;
        /**
         * Log an exception you have caught.
         * @param   exception   An Error from a catch clause, or the string error message.
         * @param   handledAt   Not used
         * @param   properties  map[string, string] - additional data used to filter events and metrics in the portal. Defaults to empty.
         * @param   measurements    map[string, number] - metrics associated with this event, displayed in Metrics Explorer on the portal. Defaults to empty.
         * @param   severityLevel   AI.SeverityLevel - severity level
         */
        trackException(exception: Error, handledAt?: string, properties?: {
            [name: string]: string;
        }, measurements?: {
            [name: string]: number;
        }, severityLevel?: AI.SeverityLevel): any;
        /**
         * Log a numeric value that is not associated with a specific event. Typically used to send regular reports of performance indicators.
         * To send a single measurement, use just the first two parameters. If you take measurements very frequently, you can reduce the
         * telemetry bandwidth by aggregating multiple measurements and sending the resulting average at intervals.
         * @param   name    A string that identifies the metric.
         * @param   average Number representing either a single measurement, or the average of several measurements.
         * @param   sampleCount The number of measurements represented by the average. Defaults to 1.
         * @param   min The smallest measurement in the sample. Defaults to the average.
         * @param   max The largest measurement in the sample. Defaults to the average.
         */
        trackMetric(name: string, average: number, sampleCount?: number, min?: number, max?: number, properties?: {
            [name: string]: string;
        }): any;
        /**
        * Log a diagnostic message.
        * @param   message A message string
        * @param   properties  map[string, string] - additional data used to filter traces in the portal. Defaults to empty.
        * @param   severityLevel   AI.SeverityLevel - severity level
        */
        trackTrace(message: string, properties?: {
            [name: string]: string;
        }, severityLevel?: AI.SeverityLevel): any;
        /**
         * Immediately send all queued telemetry.
         * @param {boolean} async - If flush should be call asynchronously
         */
        flush(async?: boolean): any;
        /**
        * Sets the autheticated user id and the account id in this session.
        * User auth id and account id should be of type string. They should not contain commas, semi-colons, equal signs, spaces, or vertical-bars.
        *
        * @param authenticatedUserId {string} - The authenticated user id. A unique and persistent string that represents each authenticated user in the service.
        * @param accountId {string} - An optional string to represent the account associated with the authenticated user.
        */
        setAuthenticatedUserContext(authenticatedUserId: string, accountId?: string): any;
        /**
         * Clears the authenticated user id and the account id from the user context.
         */
        clearAuthenticatedUserContext(): any;
        downloadAndSetup?(config: Microsoft.ApplicationInsights.IConfig): void;
        /**
         * The custom error handler for Application Insights
         * @param {string} message - The error message
         * @param {string} url - The url where the error was raised
         * @param {number} lineNumber - The line number where the error was raised
         * @param {number} columnNumber - The column number for the line where the error was raised
         * @param {Error}  error - The Error object
         */
        _onerror(message: string, url: string, lineNumber: number, columnNumber: number, error: Error): any;
    }
}
declare module Microsoft.ApplicationInsights {
    var Version: string;
    /**
    * Internal interface to pass appInsights object to subcomponents without coupling
    */
    interface IAppInsightsInternal {
        sendPageViewInternal(name?: string, url?: string, duration?: number, properties?: Object, measurements?: Object): any;
        sendPageViewPerformanceInternal(pageViewPerformance: ApplicationInsights.Telemetry.PageViewPerformance): any;
        flush(): any;
    }
    /**
     * The main API that sends telemetry to Application Insights.
     * Learn more: http://go.microsoft.com/fwlink/?LinkID=401493
     */
    class AppInsights implements IAppInsightsInternal, IAppInsights {
        private _trackAjaxAttempts;
        private _eventTracking;
        private _pageTracking;
        private _pageViewManager;
        private _pageVisitTimeManager;
        private _ajaxMonitor;
        config: IConfig;
        context: TelemetryContext;
        queue: (() => void)[];
        static defaultConfig: IConfig;
        constructor(config: IConfig);
        sendPageViewInternal(name?: string, url?: string, duration?: number, properties?: Object, measurements?: Object): void;
        sendPageViewPerformanceInternal(pageViewPerformance: ApplicationInsights.Telemetry.PageViewPerformance): void;
        /**
         * Starts timing how long the user views a page or other item. Call this when the page opens.
         * This method doesn't send any telemetry. Call {@link stopTrackTelemetry} to log the page when it closes.
         * @param   name  A string that idenfities this item, unique within this HTML document. Defaults to the document title.
         */
        startTrackPage(name?: string): void;
        /**
         * Logs how long a page or other item was visible, after {@link startTrackPage}. Call this when the page closes.
         * @param   name  The string you used as the name in startTrackPage. Defaults to the document title.
         * @param   url   String - a relative or absolute URL that identifies the page or other item. Defaults to the window location.
         * @param   properties  map[string, string] - additional data used to filter pages and metrics in the portal. Defaults to empty.
         * @param   measurements    map[string, number] - metrics associated with this page, displayed in Metrics Explorer on the portal. Defaults to empty.
         */
        stopTrackPage(name?: string, url?: string, properties?: Object, measurements?: Object): void;
        /**
         * Logs that a page or other item was viewed.
         * @param   name  The string you used as the name in startTrackPage. Defaults to the document title.
         * @param   url   String - a relative or absolute URL that identifies the page or other item. Defaults to the window location.
         * @param   properties  map[string, string] - additional data used to filter pages and metrics in the portal. Defaults to empty.
         * @param   measurements    map[string, number] - metrics associated with this page, displayed in Metrics Explorer on the portal. Defaults to empty.
         * @param   duration    number - the number of milliseconds it took to load the page. Defaults to undefined. If set to default value, page load time is calculated internally.
         */
        trackPageView(name?: string, url?: string, properties?: Object, measurements?: Object, duration?: number): void;
        /**
         * Start timing an extended event. Call {@link stopTrackEvent} to log the event when it ends.
         * @param   name    A string that identifies this event uniquely within the document.
         */
        startTrackEvent(name: string): void;
        /**
         * Log an extended event that you started timing with {@link startTrackEvent}.
         * @param   name    The string you used to identify this event in startTrackEvent.
         * @param   properties  map[string, string] - additional data used to filter events and metrics in the portal. Defaults to empty.
         * @param   measurements    map[string, number] - metrics associated with this event, displayed in Metrics Explorer on the portal. Defaults to empty.
         */
        stopTrackEvent(name: string, properties?: Object, measurements?: Object): void;
        /**
         * Log a user action or other occurrence.
         * @param   name    A string to identify this event in the portal.
         * @param   properties  map[string, string] - additional data used to filter events and metrics in the portal. Defaults to empty.
         * @param   measurements    map[string, number] - metrics associated with this event, displayed in Metrics Explorer on the portal. Defaults to empty.
         */
        trackEvent(name: string, properties?: Object, measurements?: Object): void;
        /**
         * Log a dependency call
         * @param id    unique id, this is used by the backend o correlate server requests. Use Util.newId() to generate a unique Id.
         * @param method    represents request verb (GET, POST, etc.)
         * @param absoluteUrl   absolute url used to make the dependency request
         * @param command   command name
         * @param totalTime total request time
         * @param success   indicates if the request was sessessful
         * @param resultCode    response code returned by the dependency request
         * @param properties    map[string, string] - additional data used to filter events and metrics in the portal. Defaults to empty.
         * @param measurements  map[string, number] - metrics associated with this event, displayed in Metrics Explorer on the portal. Defaults to empty.
         */
        trackDependency(id: string, method: string, absoluteUrl: string, command: string, totalTime: number, success: boolean, resultCode: number, properties?: Object, measurements?: Object): void;
        /**
        * Logs dependency call
        * @param dependencyData dependency data object
        */
        trackDependencyData(dependency: Telemetry.RemoteDependencyData): void;
        /**
         * trackAjax method is obsolete, use trackDependency instead
         */
        trackAjax(id: string, absoluteUrl: string, pathName: string, totalTime: number, success: boolean, resultCode: number, method?: string): void;
        /**
         * Log an exception you have caught.
         * @param   exception   An Error from a catch clause, or the string error message.
         * @param   handledAt   Not used
         * @param   properties  map[string, string] - additional data used to filter events and metrics in the portal. Defaults to empty.
         * @param   measurements    map[string, number] - metrics associated with this event, displayed in Metrics Explorer on the portal. Defaults to empty.
         * @param   severityLevel   AI.SeverityLevel - severity level
         */
        trackException(exception: Error, handledAt?: string, properties?: Object, measurements?: Object, severityLevel?: AI.SeverityLevel): void;
        /**
         * Log a numeric value that is not associated with a specific event. Typically used to send regular reports of performance indicators.
         * To send a single measurement, use just the first two parameters. If you take measurements very frequently, you can reduce the
         * telemetry bandwidth by aggregating multiple measurements and sending the resulting average at intervals.
         * @param   name    A string that identifies the metric.
         * @param   average Number representing either a single measurement, or the average of several measurements.
         * @param   sampleCount The number of measurements represented by the average. Defaults to 1.
         * @param   min The smallest measurement in the sample. Defaults to the average.
         * @param   max The largest measurement in the sample. Defaults to the average.
         */
        trackMetric(name: string, average: number, sampleCount?: number, min?: number, max?: number, properties?: Object): void;
        /**
        * Log a diagnostic message.
        * @param   message A message string
        * @param   properties  map[string, string] - additional data used to filter traces in the portal. Defaults to empty.
        * @param   severityLevel   AI.SeverityLevel - severity level
        */
        trackTrace(message: string, properties?: Object, severityLevel?: AI.SeverityLevel): void;
        /**
       * Log a page visit time
       * @param    pageName    Name of page
       * @param    pageVisitDuration Duration of visit to the page in milleseconds
       */
        private trackPageVisitTime(pageName, pageUrl, pageVisitTime);
        /**
         * Immediately send all queued telemetry.
         * @param {boolean} async - If flush should be call asynchronously
         */
        flush(async?: boolean): void;
        /**
         * Sets the authenticated user id and the account id.
         * User auth id and account id should be of type string. They should not contain commas, semi-colons, equal signs, spaces, or vertical-bars.
         *
         * By default the method will only set the authUserID and accountId for all events in this page view. To add them to all events within
         * the whole session, you should either call this method on every page view or set `storeInCookie = true`.
         *
         * @param authenticatedUserId {string} - The authenticated user id. A unique and persistent string that represents each authenticated user in the service.
         * @param accountId {string} - An optional string to represent the account associated with the authenticated user.
         * @param storeInCookie {boolean} - AuthenticateUserID will be stored in a cookie and added to all events within this session.
         */
        setAuthenticatedUserContext(authenticatedUserId: string, accountId?: string, storeInCookie?: boolean): void;
        /**
         * Clears the authenticated user id and the account id from the user context.
         */
        clearAuthenticatedUserContext(): void;
        /**
        * In case of CORS exceptions - construct an exception manually.
        * See this for more info: http://stackoverflow.com/questions/5913978/cryptic-script-error-reported-in-javascript-in-chrome-and-firefox
        */
        private SendCORSException(properties);
        /**
         * The custom error handler for Application Insights
         * @param {string} message - The error message
         * @param {string} url - The url where the error was raised
         * @param {number} lineNumber - The line number where the error was raised
         * @param {number} columnNumber - The column number for the line where the error was raised
         * @param {Error}  error - The Error object
         */
        _onerror(message: string, url: string, lineNumber: number, columnNumber: number, error: Error): void;
    }
}
declare class AppInsightsTests extends TestClass {
    private getAppInsightsSnippet();
    testInitialize(): void;
    testCleanup(): void;
    registerTests(): void;
    private addPageViewSignatureTests();
    private addStartStopTests();
    private getFirstResult(action, trackStub, skipSessionState?);
}
declare class HashCodeScoreGeneratorTests extends TestClass {
    private originalDocument;
    private results;
    /** Method called before the start of each test method */
    testInitialize(): void;
    /** Method called after each test method has completed */
    testCleanup(): void;
    registerTests(): void;
}
declare class UtilTests extends TestClass {
    testCleanup(): void;
    registerTests(): void;
    private getMockStorage();
}
declare class SampleContextTests extends TestClass {
    private originalDocument;
    private results;
    /** Method called before the start of each test method */
    testInitialize(): void;
    /** Method called after each test method has completed */
    testCleanup(): void;
    registerTests(): void;
    private getEnvelope();
}
declare class UserContextTests extends TestClass {
    constructor();
    /** Method called before the start of each test method */
    testInitialize(): void;
    /** Method called after each test method has completed */
    testCleanup(): void;
    registerTests(): void;
    private getEmptyConfig();
}
declare class SessionContextTests extends TestClass {
    private originalDocument;
    private results;
    private dateTimeNowObj;
    /** Method called before the start of each test method */
    testInitialize(): void;
    /** Method called after each test method has completed */
    testCleanup(): void;
    registerTests(): void;
    private setFakeCookie(id, acqDate, renewalDate);
    private generateFakeSessionCookieData(id, acqDate, renewalDate);
    private restoreFakeCookie();
    private resetStorage();
    private getEmptyConfig();
}
declare class ContractTestHelper extends TestClass {
    name: string;
    private initializer;
    constructor(initializer: () => Microsoft.ApplicationInsights.ISerializable, name: string);
    /** Method called before the start of each test method */
    testInitialize(): void;
    /** Method called after each test method has completed */
    testCleanup(): void;
    registerTests(): void;
    checkSerializableObject(initializer: () => any, name: string): void;
    private allRequiredFieldsAreConstructed(initializer, name);
    private extraFieldsAreRemovedBySerializer(initializer, name);
    private optionalFieldsAreNotRequired(initializer, name);
    private allFieldsAreIncludedIfSpecified(initializer, name);
    private serialize(subject, name);
    private getSubject(construction, name);
}
declare class EventTelemetryTests extends ContractTestHelper {
    constructor();
    /** Method called before the start of each test method */
    testInitialize(): void;
    registerTests(): void;
}
declare class ExceptionTelemetryTests extends ContractTestHelper {
    private exception;
    constructor();
    registerTests(): void;
}
declare var metricName: string;
declare var metricValue: number;
declare class MetricTelemetryTests extends ContractTestHelper {
    constructor();
    registerTests(): void;
}
declare class PageViewPerformanceTelemetryTests extends ContractTestHelper {
    constructor();
    testCleanup(): void;
    registerTests(): void;
}
declare class PageViewTelemetryTests extends ContractTestHelper {
    constructor();
    registerTests(): void;
}
declare class TraceTelemetryTests extends ContractTestHelper {
    constructor();
    registerTests(): void;
}
declare class RemoteDependencyTests extends ContractTestHelper {
    private exception;
    private static id;
    private static method;
    private static testName;
    private static url;
    private static hostName;
    private static totalTime;
    private static success;
    private static resultCode;
    constructor();
    registerTests(): void;
}
declare class DataSanitizerTests extends TestClass {
    private origMaxNameLength;
    private origMaxStringLength;
    private origMaxUrlLength;
    private origMaxMessageLength;
    private origMaxExceptionLength;
    testInitialize(): void;
    testCleanup(): void;
    registerTests(): void;
}
declare class PageVisitTimeManagerTests extends TestClass {
    private throwInternal;
    private getStorageObjectStub;
    /** Method called before the start of each test method */
    testInitialize(): void;
    registerTests(): void;
    private getMockStorage();
}
declare class LoggingTests extends TestClass {
    InternalLogging: typeof Microsoft.ApplicationInsights._InternalLogging;
    InternalLoggingMessage: typeof Microsoft.ApplicationInsights._InternalLogMessage;
    enableDebugExceptionsDefaultValue: boolean;
    verboseLoggingDefaultValue: boolean;
    testInitialize(): void;
    testCleanup(): void;
    /**
     * Clears the internal logging queue
     */
    private clearInternalLoggingQueue();
    registerTests(): void;
}
declare class SenderWrapper extends Microsoft.ApplicationInsights.Sender {
    errorSpy: SinonSpy;
    successSpy: SinonSpy;
    partialSpy: SinonSpy;
    beaconStub: SinonStub;
}
declare class SenderTests extends TestClass {
    private xhr;
    private xdr;
    private fakeServer;
    private getSender;
    private loggingSpy;
    private testTelemetry;
    private endpointUrl;
    private emitLineDelimitedJson;
    private maxBatchSizeInBytes;
    private maxBatchInterval;
    private disableTelemetry;
    private requests;
    testInitialize(): void;
    testCleanup(): void;
    private requestAsserts();
    private logAsserts(expectedCount, expectedMessage?);
    private successAsserts(sender);
    private errorAsserts(sender);
    registerTests(): void;
    private setupDataLossAnalyzer();
    private validatePartialSuccess_NonRetryable(sender);
    private validatePartialSuccess_Retryable(sender);
    private validatePartialSuccess_disabled(sender);
    private getDefaultConfig();
}
declare class SendBufferTests extends TestClass {
    private getArraySendBuffer;
    private getSessionStorageSendBuffer;
    testInitialize(): void;
    testCleanup(): void;
    private BUFFER_KEY;
    private SENT_BUFFER_KEY;
    registerTests(): void;
    private getBuffer(key);
    private Test_Initialize(buffer);
    private Test_CanEnqueueAndClearTheBuffer(buffer);
    private Test_CanClearEmptyBuffer(buffer);
    private Test_CallBatchPayloadsWhenABufferIsEmpty(buffer);
    private Test_CallBatchPayloadsWithOneElement(buffer);
    private Test_CallBatchPayloadsWithTwoElements(buffer);
    private Test_CallBatchPayloadsWithTwoElements_EmitLineDelimitedJson(buffer);
}
declare class SerializerTests extends TestClass {
    private throwInternal;
    /** Method called before the start of each test method */
    testInitialize(): void;
    registerTests(): void;
}
declare class TelemetryContextTests extends TestClass {
    private _telemetryContext;
    private _config;
    /** Method called before the start of each test method */
    testInitialize(): void;
    /** Method called after each test method has completed */
    testCleanup(): void;
    registerTests(): void;
    /**
    * Gets the sinon stub for telemetryContext.sample.isSampledIn function. Result is wrapped to an object
    * which has a counter of how many times the stub was accessed with expected envelope type.
    */
    private getStub(envelopeType, telemetryContext);
    private getTestEventEnvelope(properties?, measurements?);
}
declare module Microsoft.ApplicationInsights {
    interface Snippet {
        queue: Array<() => void>;
        config: IConfig;
    }
    class Initialization {
        snippet: Snippet;
        config: IConfig;
        constructor(snippet: Snippet);
        loadAppInsights(): AppInsights;
        emptyQueue(): void;
        pollInteralLogs(appInsightsInstance: AppInsights): number;
        addHousekeepingBeforeUnload(appInsightsInstance: AppInsights): void;
        static getDefaultConfig(config?: IConfig): IConfig;
    }
}
declare class InitializationTests extends TestClass {
    testInitialize(): void;
    private getAppInsightsSnippet();
    registerTests(): void;
}
declare class AjaxTests extends TestClass {
    private appInsightsMock;
    private trackDependencySpy;
    private callbackSpy;
    private requests;
    testInitialize(): void;
    testCleanup(): void;
    registerTests(): void;
    private testAjaxSuccess(responseCode, success);
}
declare class SplitTestTests extends TestClass {
    registerTests(): void;
}
declare class CorrelationIdHelperTests extends TestClass {
    registerTests(): void;
}
declare module "JavaScriptSDK.Module/AppInsightsModule" {
    export var AppInsights: Microsoft.ApplicationInsights.IAppInsights;
}
declare module "JavaScriptSDK.Tests/CheckinTests/AppInsightsModule.tests" {
    export default class AppInsightsModuleTests extends TestClass {
        private static expectedMethods;
        private static getUncachedScriptUrl();
        testInitialize(): void;
        registerTests(): void;
    }
}
declare module "JavaScriptSDK.Tests/Selenium/checkinTests" {
    export default function registerTests(): void;
}
