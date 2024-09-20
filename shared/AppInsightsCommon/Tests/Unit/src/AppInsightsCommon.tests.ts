import { strRepeat } from "@nevware21/ts-utils";
import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import {  DiagnosticLogger } from "@microsoft/applicationinsights-core-js";
import { dataSanitizeInput, dataSanitizeKey, dataSanitizeMessage, dataSanitizeProperties, DataSanitizerValues, dataSanitizeString } from "../../../src/Telemetry/Common/DataSanitizer";


export class ApplicationInsightsTests extends AITestClass {
    logger = new DiagnosticLogger();


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
            name: 'DataSanitizerTests: property sanitizer respects default truncation limit.',
            test: () => {
                // const define
                const MAX_PROPERTY_LENGTH = DataSanitizerValues.MAX_PROPERTY_LENGTH;

                // use cases
                const messageShort: String = "hi";
                const messageLong = strRepeat("abc", MAX_PROPERTY_LENGTH + 1);
                
                // Assert
                Assert.equal(messageShort.length, dataSanitizeProperties(this.logger, messageShort).length);
                Assert.notEqual(messageLong.length, dataSanitizeProperties(this.logger, messageLong).length);
                Assert.equal(MAX_PROPERTY_LENGTH, dataSanitizeProperties(this.logger, messageLong).length);
            }
        })

        this.testCase({
            name: 'DataSanitizerTests: property sanitizer respects max length parameter being passed in.',
            test: () => {
                // const define
                const customMaxLength = 5;

                // use cases
                const messageShort: String = "hi";
                const messageLong = strRepeat("abc",  customMaxLength + 1);

                // Assert
                Assert.equal(messageShort.length, dataSanitizeProperties(this.logger, messageShort, customMaxLength).length);
                Assert.notEqual(messageLong.length, dataSanitizeProperties(this.logger, messageLong, customMaxLength).length);
                Assert.equal(customMaxLength, dataSanitizeProperties(this.logger, messageLong, customMaxLength).length);
            }
        })

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
    }
}
