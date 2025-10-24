import { strRepeat } from "@nevware21/ts-utils";
import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { LoggingSeverity, _InternalMessageId } from "../../../src/Enums/LoggingEnums";
import { IConfiguration } from "../../../src/Interfaces/IConfiguration";
import { IDiagnosticLogger, IInternalLogMessage } from "../../../src/Interfaces/IDiagnosticLogger";
import { dataSanitizeInput, dataSanitizeKey, dataSanitizeMessage, DataSanitizerValues, dataSanitizeString, dataSanitizeUrl } from "../../../src/Telemetry/Common/DataSanitizer";


class TestDiagnosticLogger implements IDiagnosticLogger {
    public queue: IInternalLogMessage[];
    private _consoleLevel: number;

    constructor(consoleLevel?: number) {
        this.queue = [];
        this._consoleLevel = (consoleLevel !== undefined ? consoleLevel : 0);
    }

    // Minimal IDiagnosticLogger implementation to avoid importing core DiagnosticLogger
    public consoleLoggingLevel(): number {
        return this._consoleLevel;
    }

    public throwInternal(_severity: LoggingSeverity, msgId: _InternalMessageId, msg: string): void {
        this.queue.push({ message: msg, messageId: msgId });
    }

    public warnToConsole(_message: string): void {
        // No-op for tests
    }

    public resetInternalMessageCount(): void {
        this.queue.length = 0;
    }
}


export class ApplicationInsightsTests extends AITestClass {
    logger = new TestDiagnosticLogger();


    public testInitialize() {
   
    }

    public testCleanup() {
    }

    public registerTests() {
        // test cases for sanitizeMessage function
        this.testCase({
            name: 'DataSanitizerTests: messages are well processed.',
            test: () => {
                // const define
                const MAX_MESSAGE_LENGTH = DataSanitizerValues.MAX_MESSAGE_LENGTH;
               
                // use cases
                const messageShort: String = "hi";
                const messageLong = strRepeat("abc", MAX_MESSAGE_LENGTH + 1);
                
                // Assert
                Assert.equal(messageShort.length, dataSanitizeMessage(this.logger, messageShort).length);
                Assert.notEqual(messageLong.length, dataSanitizeMessage(this.logger, messageLong).length);
                Assert.equal(MAX_MESSAGE_LENGTH, dataSanitizeMessage(this.logger, messageLong).length);
            }
        });

        this.testCase({
            name: 'DataSanitizerTests: throwInternal function is called correctly in sanitizeMessage function',
            test: () => {
                // const define
                const loggerStub = this.sandbox.stub(this.logger , "throwInternal");
                const MAX_MESSAGE_LENGTH = DataSanitizerValues.MAX_MESSAGE_LENGTH;
                
                // use cases
                const messageShort: String = "hi";
                const messageLong = strRepeat("a", MAX_MESSAGE_LENGTH + 2);

                // Act
                dataSanitizeMessage(this.logger, messageShort);
                Assert.ok(loggerStub.notCalled);
                Assert.equal(0, loggerStub.callCount);

                dataSanitizeMessage(this.logger, messageLong);
                Assert.ok(loggerStub.calledOnce);
                Assert.equal(1, loggerStub.callCount);

                dataSanitizeMessage(this.logger, messageLong);
                Assert.ok(loggerStub.calledTwice);
                Assert.equal(2, loggerStub.callCount);

                loggerStub.restore();
            }
        });

        this.testCase({
            name: 'DataSanitizerTests: messages are fully logged through console',
            test: () => {
                const loggerStub = this.sandbox.stub(this.logger , "throwInternal");

                // const define
                const MAX_MESSAGE_LENGTH = DataSanitizerValues.MAX_MESSAGE_LENGTH;
               
                // use cases
                const messageShort: String = "hi";
                const messageLong = strRepeat("a", MAX_MESSAGE_LENGTH + 1);

                Assert.equal(messageShort, dataSanitizeMessage(this.logger, messageShort));
                Assert.ok(loggerStub.notCalled);
                Assert.equal(0, loggerStub.callCount);

                Assert.equal(messageLong.substring(0, MAX_MESSAGE_LENGTH), dataSanitizeMessage(this.logger, messageLong));
                Assert.ok(loggerStub.calledOnce);
                Assert.equal(1, loggerStub.callCount);

                loggerStub.restore();
            }
        });

        // test cases for sanitizeString function
        this.testCase({
            name: 'DataSanitizerTest: strings are well processed',
            test: () => {
                // const define
                const MAX_STRING_LENGTH = DataSanitizerValues.MAX_STRING_LENGTH;
               
                // use cases
                const strShort: String = "hi";
                const strLong = strRepeat("a", MAX_STRING_LENGTH + 2);
                
                // Assert
                Assert.equal(strShort.length, dataSanitizeString(this.logger, strShort).length);
                Assert.notEqual(strLong.length, dataSanitizeString(this.logger, strLong).length);
                Assert.equal(MAX_STRING_LENGTH, dataSanitizeString(this.logger, strLong).length);
            }
        });

        this.testCase({
            name: 'DataSanitizerTests: throrwInternal function is called correctly in sanitizeString function',
            test: () => {
                // const define
                const loggerStub = this.sandbox.stub(this.logger , "throwInternal");
                const MAX_STRING_LENGTH = DataSanitizerValues.MAX_STRING_LENGTH;
                
                // use cases
                const strShort: String = "hi";
                const strLong = strRepeat("a", MAX_STRING_LENGTH + 2);

                // Act
                dataSanitizeString(this.logger, strShort);
                Assert.ok(loggerStub.notCalled);
                Assert.equal(0, loggerStub.callCount);

                dataSanitizeString(this.logger, strLong);
                Assert.ok(loggerStub.calledOnce);
                Assert.equal(1, loggerStub.callCount);

                dataSanitizeString(this.logger, strLong);
                Assert.ok(loggerStub.calledTwice);
                Assert.equal(2, loggerStub.callCount);

                loggerStub.restore();
            }
        });

        this.testCase({
            name: 'DataSanitizerTests: strings are fully logged through console',
            test: () => {
                const loggerStub = this.sandbox.stub(this.logger , "throwInternal");

                // const define
                const MAX_STRING_LENGTH = DataSanitizerValues.MAX_STRING_LENGTH;
               
                // use cases
                const strShort: String = "hi";
                const strLong = strRepeat("a", MAX_STRING_LENGTH + 2);

                Assert.equal(strShort, dataSanitizeString(this.logger, strShort));
                Assert.ok(loggerStub.notCalled);
                Assert.equal(0, loggerStub.callCount);

                Assert.equal(strLong.substring(0, MAX_STRING_LENGTH), dataSanitizeString(this.logger, strLong));
                Assert.ok(loggerStub.calledOnce);
                Assert.equal(1, loggerStub.callCount);

                loggerStub.restore();
            }
        });

        // test cases for sanitizeKey function
        this.testCase({
            name: 'DataSanitizerTest: names are well processed',
            test: () => {
                // const define
                const MAX_NAME_LENGTH = DataSanitizerValues.MAX_NAME_LENGTH;
               
                // use cases
                const nameShort: String = "hi";
                const nameLong = strRepeat("a", MAX_NAME_LENGTH + 2);
                
                // Assert
                Assert.equal(nameShort.length, dataSanitizeKey(this.logger, nameShort).length);
                Assert.notEqual(nameLong.length, dataSanitizeKey(this.logger, nameLong).length);
                Assert.equal(MAX_NAME_LENGTH, dataSanitizeKey(this.logger, nameLong).length);
            }
        });

        this.testCase({
            name: 'DataSanitizerTests: throrwInternal function is called correctly in sanitizeKey function',
            test: () => {
                // const define
                const loggerStub = this.sandbox.stub(this.logger , "throwInternal");
                const MAX_NAME_LENGTH = DataSanitizerValues.MAX_NAME_LENGTH;
                
                // use cases
                const nameShort: String = "hi";
                const nameLong = strRepeat("a", MAX_NAME_LENGTH + 2);

                // Act
                dataSanitizeKey(this.logger, nameShort);
                Assert.ok(loggerStub.notCalled);
                Assert.equal(0, loggerStub.callCount);

                dataSanitizeKey(this.logger, nameLong);
                Assert.ok(loggerStub.calledOnce);
                Assert.equal(1, loggerStub.callCount);

                dataSanitizeKey(this.logger, nameLong);
                Assert.ok(loggerStub.calledTwice);
                Assert.equal(2, loggerStub.callCount);

                loggerStub.restore();
            }
        });

        this.testCase({
            name: 'DataSanitizerTests: names are fully logged through console',
            test: () => {
                const loggerStub = this.sandbox.stub(this.logger , "throwInternal");

                // const define
                const MAX_NAME_LENGTH = DataSanitizerValues.MAX_NAME_LENGTH;
               
                // use cases
                const nameShort: String = "hi";
                const nameLong = strRepeat("a", MAX_NAME_LENGTH + 2);

                Assert.equal(nameShort, dataSanitizeKey(this.logger, nameShort));
                Assert.ok(loggerStub.notCalled);

                Assert.equal(nameLong.substring(0, MAX_NAME_LENGTH), dataSanitizeKey(this.logger, nameLong));
                Assert.ok(loggerStub.calledOnce);
                Assert.equal(1, loggerStub.callCount);

                loggerStub.restore();
            }
        });

        // test cases for sanitizeInput function
        this.testCase({
            name: 'DataSanitizerTest: inputs are well processed',
            test: () => {
                const MAX_INPUT_LENGTH = 1024;

                // use cases
                const inputShort: String = "hi";
                const inputLong = strRepeat("a", MAX_INPUT_LENGTH + 2);
                
                // Assert
                Assert.equal(inputShort.length, dataSanitizeInput(this.logger, inputShort, MAX_INPUT_LENGTH, 0).length);
                Assert.notEqual(inputLong.length, dataSanitizeInput(this.logger, inputLong, MAX_INPUT_LENGTH, 0).length);
                Assert.equal(MAX_INPUT_LENGTH, dataSanitizeInput(this.logger, inputLong, MAX_INPUT_LENGTH, 0).length);
            }
        });

        this.testCase({
            name: 'DataSanitizerTests: throwInternal function is called correctly in sanitizeInput function',
            test: () => {
                // const define
                const loggerStub = this.sandbox.stub(this.logger , "throwInternal");
                const MAX_INPUT_LENGTH = 1024;
                
                // use cases
                const inputShort: String = "hi";
                const inputLong = strRepeat("a", MAX_INPUT_LENGTH + 2);

                // Act
                dataSanitizeInput(this.logger, inputShort, MAX_INPUT_LENGTH, 0);
                Assert.ok(loggerStub.notCalled);
                Assert.equal(0, loggerStub.callCount);

                dataSanitizeInput(this.logger, inputLong, MAX_INPUT_LENGTH, 0);
                Assert.ok(loggerStub.calledOnce);
                Assert.equal(1, loggerStub.callCount);

                dataSanitizeInput(this.logger, inputLong, MAX_INPUT_LENGTH, 0);
                Assert.ok(loggerStub.calledTwice);
                Assert.equal(2, loggerStub.callCount);

                loggerStub.restore();
            }
        });

        this.testCase({
            name: 'DataSanitizerTests: inputs are fully logged through console',
            test: () => {
                const loggerStub = this.sandbox.stub(this.logger , "throwInternal");

                // const define
                const MAX_INPUT_LENGTH = 1024;
               
                // use cases
                const inputShort: String = "hi";
                const inputLong = strRepeat("a", MAX_INPUT_LENGTH + 2);

                Assert.equal(inputShort, dataSanitizeInput(this.logger, inputShort, MAX_INPUT_LENGTH, 0));
                Assert.ok(loggerStub.notCalled);
                Assert.equal(0, loggerStub.callCount);

                Assert.equal(inputLong.substring(0, MAX_INPUT_LENGTH), dataSanitizeInput(this.logger, inputLong, MAX_INPUT_LENGTH, 0));
                Assert.ok(loggerStub.calledOnce);
                Assert.equal(1, loggerStub.callCount);

                loggerStub.restore();
            }
        });
        this.testCase({
            name: 'DataSanitizerTests: dataSanitizeUrl properly redacts credentials in URLs with config enabled',
            test: () => {
                // URLs with credentials
                let config = {} as IConfiguration;
                const urlWithCredentials = "https://username:password@example.com/path";
                const expectedRedactedUrl = "https://REDACTED:REDACTED@example.com/path";

                // Act & Assert
                const result = dataSanitizeUrl(this.logger, urlWithCredentials, config);
                Assert.equal(expectedRedactedUrl, result);
            }
        });
        this.testCase({
            name: 'DataSanitizerTests: dataSanitizeUrl properly redacts credentials in URLs with config disabled',
            test: () => {
                // URLs with credentials
                let config = {redactUrls: false} as IConfiguration;
                const urlWithCredentials = "https://username:password@example.com/path";

                // Act & Assert
                const result = dataSanitizeUrl(this.logger, urlWithCredentials, config);
                Assert.equal(urlWithCredentials, result);
            }
        });
        this.testCase({
            name: 'DataSanitizerTests: dataSanitizeUrl handles invalid URLs',
            test: () => {
                // Invalid URL that will cause URL constructor to throw
                const invalidUrl = 123545;

                // Act & Assert
                const result = dataSanitizeUrl(this.logger, invalidUrl);
                Assert.equal(invalidUrl, result, "Invalid URLs should be returned unchanged");
            }
        });
        this.testCase({
            name: 'DataSanitizerTests: dataSanitizeUrl still enforces maximum length after redaction',
            test: () => {
                // Setup
                let config = {} as IConfiguration;
                const loggerStub = this.sandbox.stub(this.logger, "throwInternal");
                const MAX_URL_LENGTH = DataSanitizerValues.MAX_URL_LENGTH;

                // Create a very long URL with sensitive information
                const longBaseUrl = "https://username:password@example.com/";
                const longPathPart = strRepeat("a", MAX_URL_LENGTH);
                const longUrl = longBaseUrl + longPathPart;

                // Act
                const result = dataSanitizeUrl(this.logger, longUrl, config);

                // Assert
                Assert.equal(MAX_URL_LENGTH, result.length, "URL should be truncated to maximum length");
                Assert.equal(true, result.indexOf("REDACTED") > -1, "Redaction should happen before truncation");
                Assert.ok(loggerStub.calledOnce, "Logger should be called once for oversized URL");

                loggerStub.restore();
            }
        });
        this.testCase({
            name: 'DataSanitizerTests: dataSanitizeUrl handles null and undefined inputs',
            test: () => {
                // Act & Assert
                const nullResult = dataSanitizeUrl(this.logger, null);
                Assert.equal(null, nullResult, "Null input should return null");

                const undefinedResult = dataSanitizeUrl(this.logger, undefined);
                Assert.equal(undefined, undefinedResult, "Undefined input should return undefined");
            }
        });
        this.testCase({
            name: 'DataSanitizerTests: dataSanitizeUrl preserves URLs with no sensitive information',
            test: () => {
                // URL with no sensitive information
                let config = {} as IConfiguration;
                const safeUrl = "https://example.com/api?param1=value1&param2=value2";

                // Act & Assert
                const result = dataSanitizeUrl(this.logger, safeUrl, config);
                Assert.equal(safeUrl, result, "URL with no sensitive info should remain unchanged");
            }
        });
        this.testCase({
            name: 'DataSanitizerTests: dataSanitizeUrl properly redacts sensitive query parameters',
            test: () => {
                // URLs with sensitive query parameters
                let config = {} as IConfiguration;
                const urlWithSensitiveParams = "https://example.com/api?Signature=secret&normal=value";
                const expectedRedactedUrl = "https://example.com/api?Signature=REDACTED&normal=value";

                // Act & Assert
                const result = dataSanitizeUrl(this.logger, urlWithSensitiveParams, config);
                Assert.equal(expectedRedactedUrl, result);
            }
        });
        this.testCase({
            name: 'DataSanitizerTests: dataSanitizeUrl properly redacts sensitive query parameters (default + custom)',
            test: () => {
                // URLs with sensitive query parameters
                let config = {
                    redactQueryParams: ["authorize", "api_key", "password"]
                } as IConfiguration;
                const urlWithSensitiveParams = "https://example.com/api?Signature=secret&authorize=value";
                const expectedRedactedUrl = "https://example.com/api?Signature=REDACTED&authorize=REDACTED";

                // Act & Assert
                const result = dataSanitizeUrl(this.logger, urlWithSensitiveParams, config);
                Assert.equal(expectedRedactedUrl, result);
            }
        });
    }
}
