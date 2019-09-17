/// <reference path="./TestFramework/Common.ts" />

import {
    ITelemetryItem, AppInsightsCore,
    IPlugin, IConfiguration, DiagnosticLogger
} from "@microsoft/applicationinsights-core-js";

import { DataSanitizer } from "../src/Telemetry/Common/DataSanitizer";

export class ApplicationInsightsTests extends TestClass {
    logger = new DiagnosticLogger();

    public testInitialize() {
        this.clock.reset();
       
    }

    public testCleanup() {
    }

    public registerTests() {
        // test cases for sanitizeMessage function
        this.testCase({
            name: 'DataSanitizerTests: messages are well processed.',
            test: () => {
                // const define
                const MAX_MESSAGE_LENGTH = DataSanitizer.MAX_MESSAGE_LENGTH;
               
                // use cases
                const messageShort: String = "hi";
                const messageLong = new Array(MAX_MESSAGE_LENGTH + 1).join('abc');
                
                // Assert
                Assert.equal(messageShort.length, DataSanitizer.sanitizeMessage(this.logger, messageShort).length);
                Assert.notEqual(messageLong.length, DataSanitizer.sanitizeMessage(this.logger, messageLong).length);
                Assert.equal(MAX_MESSAGE_LENGTH, DataSanitizer.sanitizeMessage(this.logger, messageLong).length);
            }
        });

        this.testCase({
            name: 'DataSanitizerTests: throrwInternal function is called correctly in sanitizeMessage function',
            test: () => {
                // const define
                const loggerStub = this.sandbox.stub(this.logger , "throwInternal");
                const MAX_MESSAGE_LENGTH = DataSanitizer.MAX_MESSAGE_LENGTH;
                
                // use cases
                const messageShort: String = "hi";
                const messageLong = new Array(MAX_MESSAGE_LENGTH + 2).join('a');

                // Act
                DataSanitizer.sanitizeMessage(this.logger, messageShort);
                Assert.ok(loggerStub.notCalled);
                Assert.equal(0, loggerStub.callCount);

                DataSanitizer.sanitizeMessage(this.logger, messageLong);
                Assert.ok(loggerStub.calledOnce);
                Assert.equal(1, loggerStub.callCount);

                DataSanitizer.sanitizeMessage(this.logger, messageLong);
                Assert.ok(loggerStub.calledTwice);
                Assert.equal(2, loggerStub.callCount);

                loggerStub.restore();
            }
        });

        this.testCase({
            name: 'DataSanitizerTests: messages are fully logged through console',
            test: () => {
                const saniMsgSpy = this.sandbox.spy(DataSanitizer, "sanitizeMessage");

                // const define
                const MAX_MESSAGE_LENGTH = DataSanitizer.MAX_MESSAGE_LENGTH;
               
                // use cases
                const messageShort: String = "hi";
                const messageLong = new Array(MAX_MESSAGE_LENGTH + 1).join('a');

                const msgShortResult = DataSanitizer.sanitizeMessage(this.logger, messageShort);
                Assert.ok(saniMsgSpy.returned(msgShortResult));

                const msgLongResult = DataSanitizer.sanitizeMessage(this.logger, messageLong);
                Assert.ok(saniMsgSpy.returned(msgLongResult));

                saniMsgSpy.restore();
            }
        });

        // test cases for sanitizeString function
        this.testCase({
            name: 'DataSanitizerTest: strings are well processed',
            test: () => {
                // const define
                const MAX_STRING_LENGTH = DataSanitizer.MAX_STRING_LENGTH;
               
                // use cases
                const strShort: String = "hi";
                const strLong = new Array(MAX_STRING_LENGTH + 2).join('a');
                
                // Assert
                Assert.equal(strShort.length, DataSanitizer.sanitizeString(this.logger, strShort).length);
                Assert.notEqual(strLong.length, DataSanitizer.sanitizeString(this.logger, strLong).length);
                Assert.equal(MAX_STRING_LENGTH, DataSanitizer.sanitizeString(this.logger, strLong).length);
            }
        });

        this.testCase({
            name: 'DataSanitizerTests: throrwInternal function is called correctly in sanitizeString function',
            test: () => {
                // const define
                const loggerStub = this.sandbox.stub(this.logger , "throwInternal");
                const MAX_STRING_LENGTH = DataSanitizer.MAX_STRING_LENGTH;
                
                // use cases
                const strShort: String = "hi";
                const strLong = new Array(MAX_STRING_LENGTH + 2).join('a');

                // Act
                DataSanitizer.sanitizeString(this.logger, strShort);
                Assert.ok(loggerStub.notCalled);
                Assert.equal(0, loggerStub.callCount);

                DataSanitizer.sanitizeString(this.logger, strLong);
                Assert.ok(loggerStub.calledOnce);
                Assert.equal(1, loggerStub.callCount);

                DataSanitizer.sanitizeString(this.logger, strLong);
                Assert.ok(loggerStub.calledTwice);
                Assert.equal(2, loggerStub.callCount);

                loggerStub.restore();
            }
        });

        this.testCase({
            name: 'DataSanitizerTests: strings are fully logged through console',
            test: () => {
                const saniStrSpy = this.sandbox.spy(DataSanitizer, "sanitizeString");

                // const define
                const MAX_STRING_LENGTH = DataSanitizer.MAX_STRING_LENGTH;
               
                // use cases
                const strShort: String = "hi";
                const strLong = new Array(MAX_STRING_LENGTH + 2).join('a');

                const strShortResult = DataSanitizer.sanitizeString(this.logger, strShort);
                Assert.ok(saniStrSpy.returned(strShortResult));

                const strLongResult = DataSanitizer.sanitizeString(this.logger, strLong);
                Assert.ok(saniStrSpy.returned(strLongResult));

                saniStrSpy.restore();
            }
        });

        // test cases for sanitizeKey function
        this.testCase({
            name: 'DataSanitizerTest: names are well processed',
            test: () => {
                // const define
                const MAX_NAME_LENGTH = DataSanitizer.MAX_NAME_LENGTH;
               
                // use cases
                const nameShort: String = "hi";
                const nameLong = new Array(MAX_NAME_LENGTH + 2).join('a');
                
                // Assert
                Assert.equal(nameShort.length, DataSanitizer.sanitizeKey(this.logger, nameShort).length);
                Assert.notEqual(nameLong.length, DataSanitizer.sanitizeKey(this.logger, nameLong).length);
                Assert.equal(MAX_NAME_LENGTH, DataSanitizer.sanitizeKey(this.logger, nameLong).length);
            }
        });

        this.testCase({
            name: 'DataSanitizerTests: throrwInternal function is called correctly in sanitizeKey function',
            test: () => {
                // const define
                const loggerStub = this.sandbox.stub(this.logger , "throwInternal");
                const MAX_NAME_LENGTH = DataSanitizer.MAX_NAME_LENGTH;
                
                // use cases
                const nameShort: String = "hi";
                const nameLong = new Array(MAX_NAME_LENGTH + 2).join('a');

                // Act
                DataSanitizer.sanitizeKey(this.logger, nameShort);
                Assert.ok(loggerStub.notCalled);
                Assert.equal(0, loggerStub.callCount);

                DataSanitizer.sanitizeKey(this.logger, nameLong);
                Assert.ok(loggerStub.calledOnce);
                Assert.equal(1, loggerStub.callCount);

                DataSanitizer.sanitizeKey(this.logger, nameLong);
                Assert.ok(loggerStub.calledTwice);
                Assert.equal(2, loggerStub.callCount);

                loggerStub.restore();
            }
        });

        this.testCase({
            name: 'DataSanitizerTests: names are fully logged through console',
            test: () => {
                const saniStrSpy = this.sandbox.spy(DataSanitizer, "sanitizeKey");

                // const define
                const MAX_NAME_LENGTH = DataSanitizer.MAX_NAME_LENGTH;
               
                // use cases
                const nameShort: String = "hi";
                const nameLong = new Array(MAX_NAME_LENGTH + 2).join('a');

                const nameShortResult = DataSanitizer.sanitizeKey(this.logger, nameShort);
                Assert.ok(saniStrSpy.returned(nameShortResult));

                const nameLongResult = DataSanitizer.sanitizeKey(this.logger, nameLong);
                Assert.ok(saniStrSpy.returned(nameLongResult));

                saniStrSpy.restore();
            }
        });

        // test cases for sanitizeInput function
        this.testCase({
            name: 'DataSanitizerTest: inputs are well processed',
            test: () => {
                const MAX_INPUT_LENGTH = 1024;

                // use cases
                const inputShort: String = "hi";
                const inputLong = new Array(MAX_INPUT_LENGTH + 2).join('a');
                
                // Assert
                Assert.equal(inputShort.length, DataSanitizer.sanitizeInput(this.logger, inputShort, MAX_INPUT_LENGTH, 0).length);
                Assert.notEqual(inputLong.length, DataSanitizer.sanitizeInput(this.logger, inputLong, MAX_INPUT_LENGTH, 0).length);
                Assert.equal(MAX_INPUT_LENGTH, DataSanitizer.sanitizeInput(this.logger, inputLong, MAX_INPUT_LENGTH, 0).length);
            }
        });

        this.testCase({
            name: 'DataSanitizerTests: throrwInternal function is called correctly in sanitizeInput function',
            test: () => {
                // const define
                const loggerStub = this.sandbox.stub(this.logger , "throwInternal");
                const MAX_INPUT_LENGTH = 1024;
                
                // use cases
                const inputShort: String = "hi";
                const inputLong = new Array(MAX_INPUT_LENGTH + 2).join('a');

                // Act
                DataSanitizer.sanitizeInput(this.logger, inputShort, MAX_INPUT_LENGTH, 0);
                Assert.ok(loggerStub.notCalled);
                Assert.equal(0, loggerStub.callCount);

                DataSanitizer.sanitizeInput(this.logger, inputLong, MAX_INPUT_LENGTH, 0);
                Assert.ok(loggerStub.calledOnce);
                Assert.equal(1, loggerStub.callCount);

                DataSanitizer.sanitizeInput(this.logger, inputLong, MAX_INPUT_LENGTH, 0);
                Assert.ok(loggerStub.calledTwice);
                Assert.equal(2, loggerStub.callCount);

                loggerStub.restore();
            }
        });

        this.testCase({
            name: 'DataSanitizerTests: inputs are fully logged through console',
            test: () => {
                const saniStrSpy = this.sandbox.spy(DataSanitizer, "sanitizeInput");

                // const define
                const MAX_INPUT_LENGTH = 1024;
               
                // use cases
                const inputShort: String = "hi";
                const inputLong = new Array(MAX_INPUT_LENGTH + 2).join('a');

                const inputShortResult = DataSanitizer.sanitizeInput(this.logger, inputShort, MAX_INPUT_LENGTH, 0);
                Assert.ok(saniStrSpy.returned(inputShortResult));

                const inputLongResult = DataSanitizer.sanitizeInput(this.logger, inputLong, MAX_INPUT_LENGTH, 0);
                Assert.ok(saniStrSpy.returned(inputLongResult));

                saniStrSpy.restore();
            }
        });
    }

}
