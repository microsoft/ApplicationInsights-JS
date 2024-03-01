import { strRepeat } from "@nevware21/ts-utils";
import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import {  DiagnosticLogger, IPayloadData, OnCompleteCallback, TransportType } from "@microsoft/applicationinsights-core-js";
import { dataSanitizeInput, dataSanitizeKey, dataSanitizeMessage, DataSanitizerValues, dataSanitizeString } from "../../../src/Telemetry/Common/DataSanitizer";
import { SenderPostManager } from "../../../src/SenderPostManager";
import { _ISendPostMgrConfig, _ISenderOnComplete } from "../../../src/applicationinsights-common";


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
            name: "SendPostManager: init and change with expected config",
            useFakeTimers: true,
            test: () => {
                let SendPostMgr = new SenderPostManager();
                let onXhrCalled = 0;
                let onFetchCalled = 0;
                let onBeaconRetryCalled = 0;
                let onCompleteFuncs = {
                    fetchOnComplete: (response: Response, onComplete: OnCompleteCallback, resValue?: string, payload?: IPayloadData) => {
                        onFetchCalled ++;
                        Assert.equal(onXhrCalled, 1, "onxhr is called once test1");
                        Assert.equal(onFetchCalled, 1, "onFetch is called once test1");
                    },
                    xhrOnComplete: (request: XMLHttpRequest, onComplete: OnCompleteCallback, payload?: IPayloadData) => {
                        if (request.readyState === 4) {
                            onXhrCalled ++;
                        }
                        
                    },
                    beaconOnRetry: (data: IPayloadData, onComplete: OnCompleteCallback, canSend: (payload: IPayloadData, oncomplete: OnCompleteCallback, sync?: boolean) => boolean) => {
                        onBeaconRetryCalled ++;
                    }

                } as _ISenderOnComplete;

                let onCompleteCallback = (status: number, headers: {
                    [headerName: string]: string;
                }, response?: string) => {
                    return;
                };
                
                let transports = [TransportType.Xhr, TransportType.Fetch, TransportType.Beacon];


                // use xhr
                let config = {
                    enableSendPromise: false,
                    isOneDs: false,
                    disableCredentials: false,
                    disableXhr: false,
                    disableBeacon: false,
                    disableBeaconSync: false,
                    senderOnCompleteCallBack: onCompleteFuncs
                } as _ISendPostMgrConfig;
                let payload = {
                    urlString: "test",
                    data: "test data"
                } as IPayloadData;

                SendPostMgr.initialize(config, this.logger);
                let isInit = SendPostMgr["_getDbgPlgTargets"]()[0];
                Assert.ok(isInit, "should init");
                let isOneDs = SendPostMgr["_getDbgPlgTargets"]()[1];
                Assert.equal(isOneDs, false, "is not oneds");
                let credentials = SendPostMgr["_getDbgPlgTargets"]()[2];
                Assert.equal(credentials, false, "credentials is set ot false");
                let promise = SendPostMgr["_getDbgPlgTargets"]()[3];
                Assert.equal(promise, false, "promise is set ot false");

                let inst = SendPostMgr.getXhrInst(transports, false);
                Assert.ok(inst, "xhr interface should exist");
                inst.sendPOST(payload, onCompleteCallback, false);
           

                Assert.equal(this._getXhrRequests().length, 1, "xhr is called once");
                let request = this._getXhrRequests()[0];
                this.sendJsonResponse(request, {}, 200);
                Assert.equal(onXhrCalled, 1, "onxhr is called once");
                Assert.equal(onFetchCalled, 0, "onFetch is not called");
                Assert.equal(onBeaconRetryCalled, 0, "onBeacon is not called");

                // use fetch
                config = {
                    enableSendPromise: false,
                    isOneDs: false,
                    disableCredentials: false,
                    disableXhr: true,
                    disableBeacon: false,
                    disableBeaconSync: false,
                    senderOnCompleteCallBack: onCompleteFuncs
                } as _ISendPostMgrConfig;
                SendPostMgr.SetConfig(config);

                let res = {
                    status: 200,
                    headers: { "Content-type": "application/json" },
                    value: {},
                    ok: true,
                    text: () => {
                        return "test";
                    }
                };
            
                this.hookFetch((resolve) => {
                    AITestClass.orgSetTimeout(function() {
                        resolve(res);
                    }, 0);
                });

                inst = SendPostMgr.getXhrInst(transports, false);
                Assert.ok(inst, "xhr interface should exist test1");
                inst.sendPOST(payload, onCompleteCallback, false);

                this.clock.tick(10);


                // use beacon
                config = {
                    enableSendPromise: false,
                    isOneDs: false,
                    disableCredentials: false,
                    disableXhr: true,
                    disableBeacon: false,
                    disableBeaconSync: false,
                    senderOnCompleteCallBack: onCompleteFuncs
                } as _ISendPostMgrConfig;
                SendPostMgr.SetConfig(config);
                this.hookSendBeacon((url, data) => {
                    return false;
                });
                transports = [TransportType.Xhr,TransportType.Beacon];
                inst = SendPostMgr.getXhrInst(transports, false);
                Assert.ok(inst, "xhr interface should exist test2");
                inst.sendPOST(payload, onCompleteCallback, false);
                Assert.equal(onBeaconRetryCalled, 1, "onBeacon is not called test2");

                // change config
                config = {
                    enableSendPromise: true,
                    isOneDs: true,
                    disableCredentials: true,
                    disableXhr: false,
                    disableBeacon: true,
                    disableBeaconSync: false,
                    senderOnCompleteCallBack: onCompleteFuncs
                } as _ISendPostMgrConfig;
                SendPostMgr.SetConfig(config);
                isInit = SendPostMgr["_getDbgPlgTargets"]()[0];
                Assert.ok(isInit, "should init test3");
                isOneDs = SendPostMgr["_getDbgPlgTargets"]()[1];
                Assert.equal(isOneDs, true, "is not oneds test3");
                credentials = SendPostMgr["_getDbgPlgTargets"]()[2];
                Assert.equal(credentials, true, "credentials is set ot false test3");
                promise = SendPostMgr["_getDbgPlgTargets"]()[3];
                Assert.equal(promise, true, "promise is set ot false test3");
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
