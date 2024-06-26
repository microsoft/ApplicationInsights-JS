import { AITestClass, PollingAssert } from "@microsoft/ai-test-framework";
import { Sender } from "../../../src/Sender";
import { IOfflineListener, createOfflineListener, utlGetSessionStorageKeys, utlRemoveSessionStorage } from "@microsoft/applicationinsights-common";
import { EnvelopeCreator } from '../../../src/EnvelopeCreator';
import { Exception, CtxTagKeys, isBeaconApiSupported, DEFAULT_BREEZE_ENDPOINT, DEFAULT_BREEZE_PATH, utlCanUseSessionStorage, utlGetSessionStorage, utlSetSessionStorage } from "@microsoft/applicationinsights-common";
import { ITelemetryItem, AppInsightsCore, ITelemetryPlugin, DiagnosticLogger, NotificationManager, SendRequestReason, _eInternalMessageId, safeGetLogger, isString, isArray, arrForEach, isBeaconsSupported, IXHROverride, IPayloadData,TransportType, getWindow, ActiveStatus } from "@microsoft/applicationinsights-core-js";
import { ArraySendBuffer, SessionStorageSendBuffer } from "../../../src/SendBuffer";
import { IInternalStorageItem, ISenderConfig } from "../../../src/Interfaces";
import { createAsyncResolvedPromise } from "@nevware21/ts-async";



const BUFFER_KEY = "AI_buffer_1";
const SENT_BUFFER_KEY = "AI_sentBuffer_1";
export class SenderTests extends AITestClass {
    private _sender: Sender;
    private _instrumentationKey = 'iKey';
    private _offline: IOfflineListener;

    protected _getBuffer(key: string, logger: DiagnosticLogger, namePrefix?: string): IInternalStorageItem[] {
        let prefixedKey = key;
        try {
            prefixedKey = namePrefix ? namePrefix + "_" + prefixedKey : prefixedKey;
            const bufferJson = utlGetSessionStorage(logger, prefixedKey);
            if (bufferJson) {
                let buffer: IInternalStorageItem[] = JSON.parse(bufferJson);
                if (isString(buffer)) {
                    buffer = JSON.parse(buffer as any);
                }

                if (buffer && isArray(buffer)) {
                    return buffer;
                }
            }
        } catch (e) {
            QUnit.assert.ok(false, "Exception - " + e);
        }
        return [];
    }

    public testInitialize() {
        this._sender = new Sender();
        this._offline = createOfflineListener("SenderTests");
        // Reset the cached isBeacons supported
        isBeaconsSupported(false);
    }

    public testFinishedCleanup() {
        if (this._offline) {
            this._offline.unload();
        }

        if (this._sender && this._sender.isInitialized()) {
            this._sender.pause();
            this._sender._buffer.clear();
            this._sender.teardown();
        }
        this._sender = null;
    }

    public registerTests() {

        this.testCase({
            name: "Channel Config: Channel can properly take args from root config",
            test: () => {
                this._sender.initialize(
                    {
                        instrumentationKey: 'abc',
                        maxBatchInterval: 123,
                        endpointUrl: 'https://example.com',
                        maxBatchSizeInBytes: 654,
                        extensionConfig: {
                            [this._sender.identifier]: {
                                maxBatchSizeInBytes: 456
                            }
                        }

                    }, new AppInsightsCore(), []
                );

                let extConfig = this._sender._senderConfig;
                QUnit.assert.equal(123, extConfig.maxBatchInterval, 'Channel config can be set from root config (maxBatchInterval)');
                QUnit.assert.equal('https://example.com', extConfig.endpointUrl, 'Channel config can be set from root config (endpointUrl)');
                QUnit.assert.notEqual(654, extConfig.maxBatchSizeInBytes, 'Channel config does not equal root config option if extensionConfig field is also set');
                QUnit.assert.equal(456, extConfig.maxBatchSizeInBytes, 'Channel config prioritizes extensionConfig over root config');
            }
        });

        this.testCase({
            name: "Channel Config: Config can be set from root dynamically",
            useFakeTimers: true,
            test: () => {
                let core = new AppInsightsCore();
                let id = this._sender.identifier;
                let coreConfig = {
                    instrumentationKey: "abc",
                    extensionConfig: {
                        [id]: {
                        
                        }
                    }
                }
                core.initialize(coreConfig, [this._sender]);

                // check defaults
                let defaultSenderConfig = this._sender._senderConfig;
                QUnit.assert.equal(15000, defaultSenderConfig.maxBatchInterval, "Channel default maxBatchInterval config is set");
                QUnit.assert.equal("https://dc.services.visualstudio.com/v2/track", defaultSenderConfig.endpointUrl, "Channel default endpointUrl config is set");
                QUnit.assert.equal(102400, defaultSenderConfig.maxBatchSizeInBytes, "Channel default maxBatchSizeInBytes config is set");
                QUnit.assert.equal(false, defaultSenderConfig.emitLineDelimitedJson, "Channel default emitLineDelimitedJson config is set");
                QUnit.assert.equal(false, defaultSenderConfig.disableTelemetry, "Channel default disableTelemetry config is set");
                QUnit.assert.equal(true, defaultSenderConfig.enableSessionStorageBuffer, "Channel default enableSessionStorageBuffer config is set");
                QUnit.assert.equal(false, defaultSenderConfig.isRetryDisabled, "Channel default isRetryDisabled config is set");
                QUnit.assert.equal(true, defaultSenderConfig.isBeaconApiDisabled, "Channel default isBeaconApiDisabled config is set");
                QUnit.assert.equal(false, defaultSenderConfig.disableXhr, "Channel default disableXhr config is set");
                QUnit.assert.equal(false, defaultSenderConfig.onunloadDisableFetch, "Channel default onunloadDisableFetch config is set");
                QUnit.assert.equal(false, defaultSenderConfig.onunloadDisableBeacon, "Channel default onunloadDisableBeacon config is set");
                QUnit.assert.equal(undefined, defaultSenderConfig.namePrefix, "Channel default namePrefix config is set");
                QUnit.assert.equal(100, defaultSenderConfig.samplingPercentage, "Channel default samplingPercentage config is set");
                QUnit.assert.equal(undefined, defaultSenderConfig.customHeaders, "Channel default customHeaders config is set");
                QUnit.assert.equal(undefined, defaultSenderConfig.convertUndefined, "Channel default convertUndefined config is set");
                QUnit.assert.equal(10000, defaultSenderConfig.eventsLimitInMem, "Channel default eventsLimitInMem config is set");
                QUnit.assert.equal(undefined, defaultSenderConfig.httpXHROverride, "Channel default httpXHROverride config is set");
                QUnit.assert.equal(false, defaultSenderConfig.alwaysUseXhrOverride, "Channel default alwaysUseXhrOverride config is set");
                QUnit.assert.equal(true, defaultSenderConfig.disableSendBeaconSplit, "Channel default disableSendBeaconSplit config is set");
                QUnit.assert.equal(10, defaultSenderConfig.maxRetryCnt, "Channel default maxRetryCnt config is set");

                //check dynamic config
                core.config.extensionConfig =  core.config.extensionConfig? core.config.extensionConfig : {};
                let config = {
                    maxBatchInterval: 10000,
                    maxBatchSizeInBytes: 100000,
                    endpointUrl: "https://test",
                    emitLineDelimitedJson: true,
                    disableTelemetry: true,
                    enableSessionStorageBuffer: false,
                    isRetryDisabled: true,
                    disableXhr: true,
                    samplingPercentage: 90,
                    customHeaders: [{header: "header1",value:"value1"}],
                    alwaysUseXhrOverride: true,
                    disableSendBeaconSplit: false
                }
                core.config.extensionConfig[id] = config;
                this.clock.tick(1);
                let curSenderConfig = this._sender._senderConfig;
                QUnit.assert.equal(10000, curSenderConfig.maxBatchInterval, "Channel maxBatchInterval config is dynamically set");
                QUnit.assert.equal(100000, curSenderConfig.maxBatchSizeInBytes, "Channel maxBatchSizeInBytes config is dynamically set");
                QUnit.assert.equal("https://test", curSenderConfig.endpointUrl, "Channel endpointUrl config is dynamically set");
                QUnit.assert.equal(true, curSenderConfig.emitLineDelimitedJson, "Channel emitLineDelimitedJson config is dynamically set");
                QUnit.assert.equal(true, curSenderConfig.disableTelemetry, "Channel disableTelemetry config is dynamically set");
                QUnit.assert.equal(false, curSenderConfig.enableSessionStorageBuffer, "Channel enableSessionStorageBuffer config is dynamically set");
                QUnit.assert.equal(true, curSenderConfig.isRetryDisabled, "Channel isRetryDisabled config is dynamically set");
                QUnit.assert.equal(90, curSenderConfig.samplingPercentage, "Channel samplingPercentage config is dynamically set");
                QUnit.assert.deepEqual([{header: "header1",value:"value1"}], curSenderConfig.customHeaders, "Channel customHeaders config is dynamically set");
                QUnit.assert.deepEqual(true, curSenderConfig.alwaysUseXhrOverride, "Channel alwaysUseXhrOverride config is dynamically set");
                QUnit.assert.equal(false, curSenderConfig.disableSendBeaconSplit, "Channel disableSendBeaconSplit config is dynamically set");

                core.config.extensionConfig[this._sender.identifier].emitLineDelimitedJson = undefined;
                core.config.extensionConfig[this._sender.identifier].endpointUrl = undefined;
                this.clock.tick(1);
                QUnit.assert.equal("https://dc.services.visualstudio.com/v2/track", this._sender._senderConfig.endpointUrl, "Channel default endpointUrl config is set");
                QUnit.assert.equal(false,  this._sender._senderConfig.emitLineDelimitedJson, "Channel default emitLineDelimitedJson config is set");
            }
        });

        this.testCaseAsync({
            name: "Channel Init: init with promise",
            stepDelay: 100,
            useFakeTimers: true,
            steps: [() => {

                let core = new AppInsightsCore();
                let ikeyPromise = createAsyncResolvedPromise("testIkey");
                let urlPromise = createAsyncResolvedPromise("testUrl");
                let coreConfig = {
                    instrumentationKey: ikeyPromise,
                    endpointUrl: urlPromise,
                    initTimeOut: 80000,
                    extensionConfig: {}
                }
                core.initialize(coreConfig, [this._sender]);
        
                let status = core.activeStatus && core.activeStatus();
                QUnit.assert.equal(status, ActiveStatus.PENDING, "status should be set to pending");
                
                
            }].concat(PollingAssert.createPollingAssert(() => {
                let core = this._sender.core;
                let activeStatus = core.activeStatus && core.activeStatus();
            
                if (activeStatus === ActiveStatus.ACTIVE) {
                    QUnit.assert.equal("testIkey", core.config.instrumentationKey, "ikey should be set");
                    QUnit.assert.equal("testUrl", core.config.endpointUrl ,"endpoint shoule be set");
                    return true;
                }
                return false;
            }, "Wait for promise response" + new Date().toISOString(), 60, 1000) as any)
        });

        this.testCase({
            name: "Channel Config: Sender override can be handled correctly",
            useFakeTimers: true,
            test: () => {
                let core = new AppInsightsCore();
                let sentPayloadData: any[] = [];
                var xhrOverride: IXHROverride = {
                    sendPOST: (payload: IPayloadData, oncomplete: (status: number, headers: {[headerName: string]: string;}, response?: string) => void, sync?: boolean) => {
                        sentPayloadData.push({payload: payload, sync: sync});
                    }
                };

                let coreConfig = {
                    instrumentationKey: "abc",
                    extensionConfig: {
                        [this._sender.identifier]: {
                            httpXHROverride: xhrOverride
                        }
                    }
                }
                let testBatch: IInternalStorageItem[] = [{item: "test", cnt: 0}, {item: "test1", cnt: 0}];
                const telemetryItem: ITelemetryItem = {
                    name: "fake item",
                    iKey: "test",
                    baseType: "some type",
                    baseData: {}
                };
                core.initialize(coreConfig, [this._sender]);

                // with always override to false
                QUnit.assert.deepEqual(xhrOverride, this._sender._senderConfig.httpXHROverride, "Channel httpXHROverride config is set");
                QUnit.assert.deepEqual(false, this._sender._senderConfig.alwaysUseXhrOverride, "Channel alwaysUseXhrOverride config is set");
                this._sender._sender(testBatch, true);
                QUnit.assert.equal(0, sentPayloadData.length, "httpXHROverride is not called once with always override to false");
                this._sender._sender(testBatch, false);
                QUnit.assert.equal(0, sentPayloadData.length, "httpXHROverride is not called once  with always override to false test1");

                try {
                    this._sender.processTelemetry(telemetryItem);
                } catch(e) {
                    QUnit.assert.ok(false, "Exception - " + e);
                }
                this._sender.onunloadFlush();
                QUnit.assert.deepEqual(0, sentPayloadData.length, "httpXHROverride should not be called again test2");


                // with always override to true
                core.config.extensionConfig = core.config.extensionConfig || {};
                core.config.extensionConfig[this._sender.identifier].alwaysUseXhrOverride = true;
                this.clock.tick(1);
                QUnit.assert.deepEqual(true, this._sender._senderConfig.alwaysUseXhrOverride, "Channel alwaysUseXhrOverride config is set to true dynamically");
                this._sender._sender(testBatch, true);
                QUnit.assert.deepEqual(1, sentPayloadData.length, "httpXHROverride should be called with always override to true");
                let payload = sentPayloadData[0].payload;
                let sync = sentPayloadData[0].sync;
                QUnit.assert.equal(false, sync, "Channel httpXHROverride sync is called with false during send test1 (sender interface should be opposite with the sender)");
                QUnit.assert.deepEqual(testBatch, payload.oriPayload, "Channel httpXHROverride sync is called with expected original payload");
                QUnit.assert.deepEqual(this._sender._buffer.batchPayloads(testBatch),payload.data, "Channel httpXHROverride sync is called with expected batch payload");

                try {
                    this._sender.processTelemetry(telemetryItem);
                } catch(e) {
                    QUnit.assert.ok(false, "Exception - " + e);
                }
                this._sender.onunloadFlush();
                QUnit.assert.deepEqual(2, sentPayloadData.length, "httpXHROverride should be called");
                let data = sentPayloadData[1].payload.oriPayload;
                payload = JSON.parse(data[0].item);
                QUnit.assert.deepEqual("test", payload.iKey, "httpXHROverride should send expected payload test1");
                sync = sentPayloadData[1].sync;
                QUnit.assert.equal(true, sync, "Channel httpXHROverride sync is called with true during send test2 (sender interface should be opposite with the sender)");
                
            }
        });

        this.testCase({
            name: "Channel Config MaxRetry Count: payload exceeds max retry count should not be sent again",
            useFakeTimers: true,
            test: () => {
                let core = new AppInsightsCore();

                let coreConfig = {
                    instrumentationKey: "abc",
                    extensionConfig: {
                        [this._sender.identifier]: {
                            //httpXHROverride: xhrOverride,
                            //alwaysUseXhrOverride: true,
                            maxRetryCnt: 1
                        }
                    }
                }
                const telemetryItem: ITelemetryItem = {
                    name: "fake item",
                    iKey: "test",
                    baseType: "some type",
                    baseData: {}
                };
                core.initialize(coreConfig, [this._sender]);
              
                let logger = new DiagnosticLogger({instrumentationKey: "abc"});
                core.logger = logger;
                QUnit.assert.deepEqual(this._getBuffer(BUFFER_KEY, logger), [], "session storage buffer is empty");
                QUnit.assert.deepEqual(this._getBuffer(SENT_BUFFER_KEY, logger), [], "session storage sent buffer is empty");
                try {
                    this._sender.processTelemetry(telemetryItem);
                    QUnit.assert.deepEqual(this._getBuffer(BUFFER_KEY, logger).length, 1, "session storage buffer should have 1 item");
                    QUnit.assert.deepEqual(this._getBuffer(SENT_BUFFER_KEY, logger), [], "session storage sent buffer is empty test1");
                } catch(e) {
                    QUnit.assert.ok(false, "Exception - " + e);
                }
                
                // inital send, cnt = 0
                this._sender.flush(false);
                QUnit.assert.deepEqual(this._getBuffer(BUFFER_KEY, logger), [], "session storage buffer is empty");
                QUnit.assert.deepEqual(this._getBuffer(SENT_BUFFER_KEY, logger).length, 1, "session storage sent buffer should have one event");

                let requests = this._getXhrRequests();
                QUnit.assert.deepEqual(requests.length, 1, "should have only 1 requests");
                let request = requests[0];
                this.sendJsonResponse(request, {}, 500);
                QUnit.assert.deepEqual(this._getBuffer(BUFFER_KEY, logger).length, 1, "session storage buffer should have one item test2");
                QUnit.assert.deepEqual(this._getBuffer(SENT_BUFFER_KEY, logger), [], "session storage sent buffer should not have one event test2");
                
                QUnit.assert.deepEqual(this._getBuffer(BUFFER_KEY, logger)[0].cnt, 1, "session storage buffer should have item with retry cnt 1");
                
                // retry 1, cnt = 1
                this._sender.flush(false);
                QUnit.assert.deepEqual(this._getBuffer(BUFFER_KEY, logger), [], "session storage buffer is empty test4");
                QUnit.assert.deepEqual(this._getBuffer(SENT_BUFFER_KEY, logger).length, 1, "session storage sent buffer should have one event test4");
                
                requests = this._getXhrRequests();
                QUnit.assert.deepEqual(requests.length, 2, "should have only 1 requests");
                request = requests[1];
                this.sendJsonResponse(request, {}, 500);
                // items should not be added back
                QUnit.assert.deepEqual(this._getBuffer(BUFFER_KEY, logger), [], "session storage buffer should not have one item test5");
                QUnit.assert.deepEqual(this._getBuffer(SENT_BUFFER_KEY, logger), [], "session storage sent buffer should not have one event test5");
                
            }
        });

        this.testCase({
            name: "Channel Config: Invalid paylod Sender should not be sent",
            useFakeTimers: true,
            test: () => {
                let core = new AppInsightsCore();
                let sentPayloadData: any[] = [];
                var xhrOverride: IXHROverride = {
                    sendPOST: (payload: IPayloadData, oncomplete: (status: number, headers: {[headerName: string]: string;}, response?: string) => void, sync?: boolean) => {
                        sentPayloadData.push({payload: payload, sync: sync});
                    }
                };

                let coreConfig = {
                    instrumentationKey: "abc",
                    extensionConfig: {
                        [this._sender.identifier]: {
                            httpXHROverride: xhrOverride,
                            alwaysUseXhrOverride: true
                        }
                    }
                }
                let testBatch: string[] = ["test", "test1"];
           
                core.initialize(coreConfig, [this._sender]);

                QUnit.assert.deepEqual(xhrOverride, this._sender._senderConfig.httpXHROverride, "Channel httpXHROverride config is set");
                QUnit.assert.deepEqual(true, this._sender._senderConfig.alwaysUseXhrOverride, "Channel alwaysUseXhrOverride config is set");
                // case 1: payload is null
                this._sender._sender(null as any, true);
                QUnit.assert.equal(0, sentPayloadData.length, "httpXHROverride is not called test1");
                this._sender._sender(null as any, false);
                QUnit.assert.equal(0, sentPayloadData.length, "httpXHROverride is not called once sync test1");

                // case 2: payload is none array
                this._sender._sender({} as any, true);
                QUnit.assert.equal(0, sentPayloadData.length, "httpXHROverride is not called test2");
                this._sender._sender({} as any, false);
                QUnit.assert.equal(0, sentPayloadData.length, "httpXHROverride is not called once sync test2");

                // case 3: payload is an empty array
                this._sender._sender([] as any, true);
                QUnit.assert.equal(0, sentPayloadData.length, "httpXHROverride is not called test3");
                this._sender._sender([] as any, false);
                QUnit.assert.equal(0, sentPayloadData.length, "httpXHROverride is not called once sync test3");

                
                this._sender._sender(testBatch, true);
                QUnit.assert.equal(1, sentPayloadData.length, "httpXHROverride is called test4");
                this._sender._sender(testBatch, false);
                QUnit.assert.equal(2, sentPayloadData.length, "httpXHROverride is called once sync test4");
                
                
            }
        });

        this.testCase({
            name: "Channel Config: sessionStorage can get items from previous buffers",
            useFakeTimers: true,
            test: () => {
                let core = new AppInsightsCore();
                let coreConfig = {
                    instrumentationKey: "b7170927-2d1c-44f1-acec-59f4e1751c13",
                    extensionConfig: {
                        [this._sender.identifier]: {
                            namePrefix: "test"
                        }
                    }
                }

                let item1: ITelemetryItem = {
                    name: "fake item1",
                    iKey: "abc",
                    baseType: "some type",
                    baseData: {}
                };

                let item2: ITelemetryItem = {
                    name: "fake item2",
                    iKey: "abc",
                    baseType: "some type",
                    baseData: {}
                };

                let item3: ITelemetryItem = {
                    name: "fake item3",
                    iKey: "abc",
                    baseType: "some type",
                    baseData: {}
                };

                let item4: ITelemetryItem = {
                    name: "fake item4",
                    iKey: "abc",
                    baseType: "some type",
                    baseData: {}
                };

                let item5: ITelemetryItem = {
                    name: "fake item5",
                    iKey: "abc",
                    baseType: "some type",
                    baseData: {}
                };

                let items = [item1, item2];
                let sentItems = [item3];
                let prefixItems = [item4, item5];
                //mock previous items stored in previous buffer key
                sessionStorage.setItem("AI_buffer",JSON.stringify(items));
                sessionStorage.setItem("AI_sentBuffer",JSON.stringify(sentItems));
                sessionStorage.setItem("test_AI_buffer",JSON.stringify(prefixItems));

                let keys = utlGetSessionStorageKeys();
                QUnit.assert.deepEqual(keys.length, 3, "session buffer should contain only three keys");

                let logger = new DiagnosticLogger({instrumentationKey: "abc"});
                core.logger = logger;

                core.initialize(coreConfig, [this._sender]);
                QUnit.assert.equal(true, this._sender._senderConfig.enableSessionStorageBuffer, "Channel default enableSessionStorageBuffer config is set");
                QUnit.assert.equal(true, utlCanUseSessionStorage(), "SessionStorage should be able to use");
                QUnit.assert.deepEqual(this._getBuffer("test_" + BUFFER_KEY, logger).length, 5, "session storage buffer should contain all previous events");
                QUnit.assert.deepEqual(this._getBuffer("test_" + SENT_BUFFER_KEY, logger), [], "session storage sent buffer is empty");
                
                let previousItems = this._sender._buffer.getItems();
                
                QUnit.assert.deepEqual(previousItems.length, 5, "buffer should contain 5 previous items");
                
                keys = utlGetSessionStorageKeys();
                QUnit.assert.deepEqual(keys.length, 2, "session buffer should contain only two keys");
                QUnit.assert.ok(keys.indexOf("test_" + BUFFER_KEY) > -1, "session buffer key contain buffer key");
                QUnit.assert.ok(keys.indexOf("test_" +  SENT_BUFFER_KEY) > -1, "session buffer key contain sent buffer key");

                utlRemoveSessionStorage(logger, "test_" + BUFFER_KEY);
                utlRemoveSessionStorage(logger, "test_" + SENT_BUFFER_KEY);
                

            }
        });


        this.testCase({
            name: "Channel Config: sessionStorage change from true to false can be handled correctly",
            useFakeTimers: true,
            test: () => {
                let core = new AppInsightsCore();
                let coreConfig = {
                    instrumentationKey: "b7170927-2d1c-44f1-acec-59f4e1751c13",
                    extensionConfig: {
                        [this._sender.identifier]: {
                        
                        }
                    }
                }

                let logger = new DiagnosticLogger({instrumentationKey: "abc"});
                core.logger = logger;
                const loggerSpy = this.sandbox.stub(this._sender, "triggerSend");

                core.initialize(coreConfig, [this._sender]);
                QUnit.assert.equal(true, this._sender._senderConfig.enableSessionStorageBuffer, "Channel default enableSessionStorageBuffer config is set");
                QUnit.assert.equal(true, utlCanUseSessionStorage(), "SessionStorage should be able to use");
                QUnit.assert.deepEqual(this._getBuffer(BUFFER_KEY, logger), [], "session storage buffer is empty");
                QUnit.assert.deepEqual(this._getBuffer(SENT_BUFFER_KEY, logger), [], "session storage sent buffer is empty");
                QUnit.assert.deepEqual(this._sender._buffer.getItems(), [], "buffer is empty");
                

                const telemetryItem: ITelemetryItem = {
                    name: "fake item",
                    iKey: "abc",
                    baseType: "some type",
                    baseData: {}
                };
                try {
                    this._sender.processTelemetry(telemetryItem);
                } catch(e) {
                    QUnit.assert.ok(false, "Exception - " + e);
                }

                QUnit.assert.equal(false, loggerSpy.calledOnce, "The send has not yet been triggered");
                let payload  = this._getBuffer(BUFFER_KEY, logger);
                QUnit.assert.equal(payload.length, 1, "payload length is equal to one");
                QUnit.assert.ok(payload[0].item.indexOf("some type") > 0, "payload is saved to session storage");
                let sentPayload  = this._getBuffer(SENT_BUFFER_KEY, logger);
                QUnit.assert.deepEqual([], sentPayload, "sent payload is empty");
                QUnit.assert.equal(this._sender._buffer.getItems().length, 1, "buffer length shoule be one");

                // change enableSessionStorageBuffer
                core.config.extensionConfig =  core.config.extensionConfig? core.config.extensionConfig : {};
                core.config.extensionConfig[this._sender.identifier].enableSessionStorageBuffer = false;

                this.clock.tick(1);
                QUnit.assert.equal(false, this._sender._senderConfig.enableSessionStorageBuffer, "Channel enableSessionStorageBuffer config is disabled");
                QUnit.assert.equal(this._sender._buffer.getItems().length, 1, "session storage buffer is transferred");
                QUnit.assert.ok(this._sender._buffer.getItems()[0].item.indexOf("some type") > 1, "in memory storage buffer is set");
                
                this.clock.tick(15000);
                QUnit.assert.equal(true, loggerSpy.calledOnce, "The send has been triggered");
                QUnit.assert.deepEqual(this._getBuffer(BUFFER_KEY, logger), [], "session storage buffer is empty");
                QUnit.assert.deepEqual(this._getBuffer(SENT_BUFFER_KEY, logger), [], "session storage sent buffer is empty");

                utlSetSessionStorage(logger, BUFFER_KEY,JSON.stringify([]));
            }
        });

        this.testCase({
            name: "Storage Prefix Test: prefix should be added after init",
            useFakeTimers: true,
            test: () => {
                let core = new AppInsightsCore();
                let setItemSpy = this.sandbox.spy(window.sessionStorage, "setItem");
                let storagePrefix = "storageTestPrefix"
                let coreConfig = {
                    instrumentationKey: "b7170927-2d1c-44f1-acec-59f4e1751c13ttt",
                    storagePrefix: storagePrefix,
                    extensionConfig: {
                        [this._sender.identifier]: {
                        
                        }
                    }
                }
                let logger = new DiagnosticLogger({instrumentationKey: "abc"});
                core.logger = logger;
                core.initialize(coreConfig, [this._sender]);
                let firstCallArgs = setItemSpy.args[0]; // Arguments of the first call
                QUnit.assert.true(JSON.stringify(firstCallArgs).includes(storagePrefix));
                utlSetSessionStorage(logger, BUFFER_KEY,JSON.stringify([]));
            }
        });

        this.testCase({
            name: "Channel Config: sessionStorage change from false to true can be handled correctly",
            useFakeTimers: true,
            test: () => {
                let core = new AppInsightsCore();
                let coreConfig = {
                    instrumentationKey: "b7170927-2d1c-44f1-acec-59f4e1751c13",
                    enableSessionStorageBuffer: false,
                    extensionConfig: {
                        [this._sender.identifier]: {
                        
                        }
                    }
                }

                let logger = new DiagnosticLogger({instrumentationKey: "abc"});
                core.logger = logger;
                const loggerSpy = this.sandbox.stub(this._sender, "triggerSend");
                core.initialize(coreConfig, [this._sender]);
                QUnit.assert.equal(false, this._sender._senderConfig.enableSessionStorageBuffer, "Channel enableSessionStorageBuffer config is set to false");
                QUnit.assert.equal(true, utlCanUseSessionStorage(), "utlCanUseSessionStorage should return true");
                QUnit.assert.deepEqual(this._getBuffer(BUFFER_KEY, logger), [], "session storage buffer is empty");
                QUnit.assert.deepEqual(this._getBuffer(SENT_BUFFER_KEY, logger), [], "session storage sent buffer is empty");
                QUnit.assert.deepEqual(this._sender._buffer.getItems(), [], "buffer is empty");
      
                const telemetryItem: ITelemetryItem = {
                    name: "fake item",
                    iKey: "abc",
                    baseType: "some type",
                    baseData: {}
                };

                try {
                    this._sender.processTelemetry(telemetryItem);
                } catch(e) {
                    QUnit.assert.ok(false, "Exception - " + e);
                }
                QUnit.assert.equal(false, loggerSpy.calledOnce, "The send has not yet been triggered");
                QUnit.assert.equal(this._sender._buffer.getItems().length, 1, "session storage in memory buffer is set");
                QUnit.assert.deepEqual(this._getBuffer(BUFFER_KEY, logger), [], "session storage buffer is empty");
                QUnit.assert.deepEqual(this._getBuffer(SENT_BUFFER_KEY, logger), [], "session storage sent buffer is empty");

                // change enableSessionStorageBuffer
                core.config.extensionConfig =  core.config.extensionConfig? core.config.extensionConfig : {};
                core.config.extensionConfig[this._sender.identifier].enableSessionStorageBuffer = true;
                this.clock.tick(1);
                QUnit.assert.equal(true, this._sender._senderConfig.enableSessionStorageBuffer, "Channel enableSessionStorageBuffer config is set to true");

                let payload  = this._getBuffer(BUFFER_KEY, logger);
                QUnit.assert.equal(payload.length, 1, "payload length is equal to one");
                QUnit.assert.ok(payload[0].item.indexOf("some type") > 0, "payload is saved to session storage");
                QUnit.assert.equal(this._sender._buffer.getItems().length, 1, "buffer length shoule be one");
                let sentPayload  = this._getBuffer(SENT_BUFFER_KEY, logger);
                QUnit.assert.deepEqual([], sentPayload, "sent payload is empty");

                utlSetSessionStorage(logger, BUFFER_KEY,JSON.stringify([]));
            }
        });

        this.testCase({
            name: "Channel Config: sessionStorage prefixName change can be handled correctly",
            useFakeTimers: true,
            test: () => {
                let core = new AppInsightsCore();
                let coreConfig = {
                    instrumentationKey: "b7170927-2d1c-44f1-acec-59f4e1751c13",
                    extensionConfig: {
                        [this._sender.identifier]: {
                        
                        }
                    }
                }
                let prefixName = "test";
                let logger = new DiagnosticLogger({instrumentationKey: "abc"});
                core.logger = logger;
                const loggerSpy = this.sandbox.stub(this._sender, "triggerSend");
                core.initialize(coreConfig, [this._sender]);
                QUnit.assert.equal(true, this._sender._senderConfig.enableSessionStorageBuffer, "Channel enableSessionStorageBuffer config is set to true");
                QUnit.assert.equal(undefined, this._sender._senderConfig.namePrefix, "Channel namePrefix config is set to default");
                QUnit.assert.equal(true, utlCanUseSessionStorage(), "utlCanUseSessionStorage should return true");
                QUnit.assert.deepEqual(this._getBuffer(BUFFER_KEY, logger), [], "session storage buffer is empty");
                QUnit.assert.deepEqual(this._getBuffer(BUFFER_KEY, logger, prefixName), [], "session storage buffer with prefix is empty");
      
                const telemetryItem: ITelemetryItem = {
                    name: "fake item",
                    iKey: "abc",
                    baseType: "some type",
                    baseData: {}
                };

                try {
                    this._sender.processTelemetry(telemetryItem);
                } catch(e) {
                    QUnit.assert.ok(false, "Exception - " + e);
                }
                QUnit.assert.equal(false, loggerSpy.calledOnce, "The send has not yet been triggered");
                QUnit.assert.equal(this._sender._buffer.getItems().length, 1, "session storage buffer is set");
                let payload  = this._getBuffer(BUFFER_KEY, logger);
                QUnit.assert.equal(payload.length, 1, "payload length is equal to one");
                QUnit.assert.ok(payload[0].item.indexOf("some type") > 0, "payload is saved to session storage");
                QUnit.assert.deepEqual(this._getBuffer(BUFFER_KEY, logger, prefixName), [], "session storage buffer with prefix is empty");


                // change prefix
                core.config.extensionConfig = core.config.extensionConfig? core.config.extensionConfig : {};
                core.config.extensionConfig[this._sender.identifier].namePrefix = prefixName;
                this.clock.tick(1);
                QUnit.assert.equal(prefixName, this._sender._senderConfig.namePrefix, "Channel namePrefix config is set");

                QUnit.assert.deepEqual([], this._getBuffer(BUFFER_KEY, logger), "default buffer is empty");
                QUnit.assert.deepEqual(this._getBuffer(SENT_BUFFER_KEY, logger), [], "session storage sent buffer is empty");
                payload  = this._getBuffer(BUFFER_KEY, logger, prefixName);
                QUnit.assert.equal(payload.length, 1, "payload length is equal to one");
                QUnit.assert.ok(payload[0].item.indexOf("some type") > 0, "payload is saved to session storage with prefix");
                QUnit.assert.equal(this._sender._buffer.getItems().length, 1, "new session storage buffer is set");
               
                utlSetSessionStorage(logger, BUFFER_KEY,JSON.stringify([]));
                utlSetSessionStorage(logger, `${prefixName}_${BUFFER_KEY}`,JSON.stringify([]));
            }
        });

        this.testCase({
            name: "Channel Config: endpoint change can be handled correctly",
            useFakeTimers: true,
            test: () => {
                let core = new AppInsightsCore();
                let coreConfig = {
                    instrumentationKey: "b7170927-2d1c-44f1-acec-59f4e1751c13",
                    extensionConfig: {
                        [this._sender.identifier]: {
                        
                        }
                    }
                }

                let logger = new DiagnosticLogger({instrumentationKey: "abc"});
                core.logger = logger;
                const loggerSpy = this.sandbox.stub(this._sender, "triggerSend");

                core.initialize(coreConfig, [this._sender]);
                QUnit.assert.equal("https://dc.services.visualstudio.com/v2/track", this._sender._senderConfig.endpointUrl, "Channel default endpointUrl config is set");
                QUnit.assert.equal(true, this._sender._senderConfig.enableSessionStorageBuffer, "Channel enableSessionStorageBuffer config is set to false");
                QUnit.assert.equal(true, utlCanUseSessionStorage(), "utlCanUseSessionStorage should return true");
                QUnit.assert.deepEqual(this._getBuffer(BUFFER_KEY, logger), [], "session storage buffer is empty");
                QUnit.assert.deepEqual(this._getBuffer(SENT_BUFFER_KEY, logger), [], "session storage sent buffer is empty");
                

                const telemetryItem: ITelemetryItem = {
                    name: "fake item",
                    iKey: "test",
                    baseType: "some type",
                    baseData: {}
                };
                try {
                    this._sender.processTelemetry(telemetryItem);
                } catch(e) {
                    QUnit.assert.ok(false, "Exception - " + e);
                }

                QUnit.assert.equal(false, loggerSpy.calledOnce, "The send has not yet been triggered");
                let payload  = this._getBuffer(BUFFER_KEY, logger);
                QUnit.assert.equal(payload.length, 1, "payload length is equal to one");
                QUnit.assert.ok(payload[0].item.indexOf("some type") > 0, "payload is saved to session storage");

                // change endpointUrl
                core.config.extensionConfig =  core.config.extensionConfig? core.config.extensionConfig : {};
                core.config.extensionConfig[this._sender.identifier].endpointUrl = "https://example.com";

                this.clock.tick(1);
                QUnit.assert.equal("https://example.com", this._sender._senderConfig.endpointUrl, "Channel endpointUrl config is changed");
                payload  = this._sender._buffer.getItems();
                QUnit.assert.deepEqual(payload.length, 1, "buffer is not changed");
                payload  = this._getBuffer(BUFFER_KEY, logger);
                QUnit.assert.ok(payload[0].item.indexOf("some type") > 0, "payload is not changed");

                utlSetSessionStorage(logger, BUFFER_KEY,JSON.stringify([]));
            }
        });

        this.testCase({
            name: "ArraySendBuffer createNew: function createNew() can return expected array buffer",
            test: () => {
                let config = {
                    endpointUrl: "https//: test",
                    emitLineDelimitedJson: false,
                    maxBatchInterval: 15000,
                    maxBatchSizeInBytes: 102400,
                    disableTelemetry: false,
                    enableSessionStorageBuffer: true,
                    isRetryDisabled: false,
                    isBeaconApiDisabled:true,
                    disableXhr: false,
                    onunloadDisableFetch: false,
                    onunloadDisableBeacon: false,
                    instrumentationKey:"key",
                    namePrefix: "",
                    samplingPercentage: 100,
                    customHeaders: [{header:"header",value:"val" }],
                    convertUndefined: "",
                    eventsLimitInMem: 10000
                } as ISenderConfig;
                let logger = new DiagnosticLogger({instrumentationKey: "abc"});

                let arrBuffer = new ArraySendBuffer(logger, config);
                let arrBufferCopy= arrBuffer.createNew(logger, config, false); // set to false to make sure it is array buffer
                QUnit.assert.deepEqual(arrBufferCopy.getItems(), [], "payload should be empty");

                //let payload = [{"payload1"}, "payload2", "payload3", "payload4", "payload5", "payload6"];
                let payload = [{item: "payload1", cnt: 0}, {item: "payload2", cnt: 0}, {item: "payload3", cnt: 0}, {item: "payload4", cnt: 0}, {item: "payload5", cnt: 0}, {item: "payload6", cnt: 0} ];
                arrForEach(payload, (val) =>{
                    arrBuffer.enqueue(val);
                });
                arrBufferCopy = arrBuffer.createNew(logger, config, false);
                QUnit.assert.deepEqual(payload, arrBufferCopy.getItems(), "payload should be same");
                arrBuffer.enqueue({item:"payload", cnt: 0});
                QUnit.assert.deepEqual(arrBuffer.getItems().length, 7, "arrBuffer length");
                QUnit.assert.deepEqual(arrBufferCopy.getItems().length, 6, "copy is deep copy");
            }
        });

        this.testCase({
            name: "ArraySendBuffer Max Count: item exceeds max cnt should not be added again",
            test: () => {
                let config = {
                    endpointUrl: "https//: test",
                    emitLineDelimitedJson: false,
                    maxBatchInterval: 15000,
                    maxBatchSizeInBytes: 102400,
                    disableTelemetry: false,
                    enableSessionStorageBuffer: true,
                    isRetryDisabled: false,
                    isBeaconApiDisabled:true,
                    disableXhr: false,
                    onunloadDisableFetch: false,
                    onunloadDisableBeacon: false,
                    instrumentationKey:"key",
                    namePrefix: "",
                    samplingPercentage: 100,
                    customHeaders: [{header:"header",value:"val" }],
                    convertUndefined: "",
                    eventsLimitInMem: 10000,
                    maxRetryCnt: 1
                } as ISenderConfig;
                let logger = new DiagnosticLogger({instrumentationKey: "abc"});

                let arrBuffer = new ArraySendBuffer(logger, config);
                QUnit.assert.deepEqual(arrBuffer.getItems(), [], "payload should be empty");
                let payload1 = {item: "payload1", cnt: 1};
                arrBuffer.enqueue(payload1);
                QUnit.assert.deepEqual(arrBuffer.getItems().length, 1, "buffer should have one item");

                let payload2 = {item: "payload2", cnt: 2};
                arrBuffer.enqueue(payload2);
                QUnit.assert.deepEqual(arrBuffer.getItems().length, 1, "payload exceeds max cnt should not be added again");

                utlSetSessionStorage(logger, BUFFER_KEY,JSON.stringify([]))
            }
        });


        this.testCase({
            name: "ArraySendBuffer createNew: function createNew() can return expected sessionStorage buffer",
            test: () => {
                let config = {
                    endpointUrl: "https//: test",
                    emitLineDelimitedJson: false,
                    maxBatchInterval: 15000,
                    maxBatchSizeInBytes: 102400,
                    disableTelemetry: false,
                    enableSessionStorageBuffer: true,
                    isRetryDisabled: false,
                    isBeaconApiDisabled:true,
                    disableXhr: false,
                    onunloadDisableFetch: false,
                    onunloadDisableBeacon: false,
                    instrumentationKey:"key",
                    namePrefix: "",
                    samplingPercentage: 100,
                    customHeaders: [{header:"header",value:"val" }],
                    convertUndefined: "",
                    eventsLimitInMem: 10000
                } as ISenderConfig;
                let logger = new DiagnosticLogger({instrumentationKey: "abc"});

                let arrBuffer = new ArraySendBuffer(logger, config);
                let sessionBuffer =  arrBuffer.createNew(logger, config, true); // set to false to make sure it is session storage buffer
                QUnit.assert.deepEqual(sessionBuffer.getItems(), [], "payload should be empty");

                //let payload = ["payload1", "payload2", "payload3", "payload4", "payload5", "payload6"];
                let payload = [{item: "payload1", cnt: 0}, {item: "payload2", cnt: 0}, {item: "payload3", cnt: 0}, {item: "payload4", cnt: 0}, {item: "payload5", cnt: 0}, {item: "payload6", cnt: 0} ];
                arrForEach(payload, (val) =>{
                    arrBuffer.enqueue(val);
                });
                sessionBuffer = arrBuffer.createNew(logger, config, true);
                QUnit.assert.deepEqual(sessionBuffer.getItems(), payload, "payload should be same");
                QUnit.assert.deepEqual(this._getBuffer(BUFFER_KEY, logger), payload, "session storage buffer is set");
                arrBuffer.enqueue({item: "payload", cnt: 0});
                QUnit.assert.deepEqual(arrBuffer.getItems().length, 7, "arrBuffer length");
                QUnit.assert.deepEqual(sessionBuffer.getItems().length, 6, "copy is deep copy");

                utlSetSessionStorage(logger, BUFFER_KEY,JSON.stringify([]));
            }
        });

        this.testCase({
            name: "SessionStorageSendBuffer createNew: function createNew() can return expected array buffer",
            test: () => {
                let config = {
                    endpointUrl: "https//: test",
                    emitLineDelimitedJson: false,
                    maxBatchInterval: 15000,
                    maxBatchSizeInBytes: 102400,
                    disableTelemetry: false,
                    enableSessionStorageBuffer: true,
                    isRetryDisabled: false,
                    isBeaconApiDisabled:true,
                    disableXhr: false,
                    onunloadDisableFetch: false,
                    onunloadDisableBeacon: false,
                    instrumentationKey:"key",
                    namePrefix: "",
                    samplingPercentage: 100,
                    customHeaders: [{header:"header",value:"val" }],
                    convertUndefined: "",
                    eventsLimitInMem: 10000
                } as ISenderConfig;
                let logger = new DiagnosticLogger({instrumentationKey: "abc"});
                
                let sessionBuffer = new SessionStorageSendBuffer(logger, config);
                let arrBuffer = sessionBuffer.createNew(logger, config, false);
                QUnit.assert.deepEqual(arrBuffer.getItems(), [], "payload should be empty");

                //let payload = ["payload1", "payload2", "payload3", "payload4", "payload5", "payload6"];
                let payload = [{item: "payload1", cnt: 0}, {item: "payload2", cnt: 0}, {item: "payload3", cnt: 0}, {item: "payload4", cnt: 0}, {item: "payload5", cnt: 0}, {item: "payload6", cnt: 0} ];
                arrForEach(payload, (val) =>{
                    sessionBuffer.enqueue(val);
                });
                QUnit.assert.deepEqual(this._getBuffer(BUFFER_KEY, logger), payload, "session storage buffer is set");
                arrBuffer = sessionBuffer.createNew(logger, config, false);
                QUnit.assert.deepEqual(arrBuffer.getItems(), payload, "payload should be same");
                sessionBuffer.enqueue({item: "payload", cnt: 0});
                QUnit.assert.deepEqual(sessionBuffer.getItems().length, 1, "sessionBuffer length");
                QUnit.assert.deepEqual(this._getBuffer(BUFFER_KEY, logger), [{item: "payload", cnt: 0}], "session storage buffer is set");
                QUnit.assert.deepEqual(arrBuffer.getItems().length, 6, "copy is deep copy");

                utlSetSessionStorage(logger, BUFFER_KEY,JSON.stringify([]));
            }
        });

        this.testCase({
            name: "SessionStorageSendBuffer Max Count: payload exceeds max retry cnt should not be added again",
            test: () => {
                let config = {
                    endpointUrl: "https//: test",
                    emitLineDelimitedJson: false,
                    maxBatchInterval: 15000,
                    maxBatchSizeInBytes: 102400,
                    disableTelemetry: false,
                    enableSessionStorageBuffer: true,
                    isRetryDisabled: false,
                    isBeaconApiDisabled:true,
                    disableXhr: false,
                    onunloadDisableFetch: false,
                    onunloadDisableBeacon: false,
                    instrumentationKey:"key",
                    namePrefix: "",
                    samplingPercentage: 100,
                    customHeaders: [{header:"header",value:"val" }],
                    convertUndefined: "",
                    eventsLimitInMem: 10000,
                    maxRetryCnt: 1
                } as ISenderConfig;
                let logger = new DiagnosticLogger({instrumentationKey: "abc"});
                
                let sessionBuffer = new SessionStorageSendBuffer(logger, config);
                QUnit.assert.deepEqual(sessionBuffer.getItems(), [], "payload should be empty");
                let payload1 = {item: "payload1", cnt: 1};
                sessionBuffer.enqueue(payload1);
                QUnit.assert.deepEqual(sessionBuffer.getItems().length, 1, "should have only one payload");

                let payload2 = {item: "payload2", cnt: 2};
                sessionBuffer.enqueue(payload2);
                QUnit.assert.deepEqual(sessionBuffer.getItems().length, 1, "should have only one payload");

                utlSetSessionStorage(logger, BUFFER_KEY,JSON.stringify([]));
            }
        });

        this.testCase({
            name: "SessionStorageSendBuffer createNew: function createNew() can return expected sessionStorage buffer with same prefix name",
            test: () => {
                let config = {
                    endpointUrl: "https//: test",
                    emitLineDelimitedJson: false,
                    maxBatchInterval: 15000,
                    maxBatchSizeInBytes: 102400,
                    disableTelemetry: false,
                    enableSessionStorageBuffer: true,
                    isRetryDisabled: false,
                    isBeaconApiDisabled:true,
                    disableXhr: false,
                    onunloadDisableFetch: false,
                    onunloadDisableBeacon: false,
                    instrumentationKey:"key",
                    namePrefix: "",
                    samplingPercentage: 100,
                    customHeaders: [{header:"header",value:"val" }],
                    convertUndefined: "",
                    eventsLimitInMem: 10000
                } as ISenderConfig;
                let logger = new DiagnosticLogger({instrumentationKey: "abc"});
                
                let sessionBuffer = new SessionStorageSendBuffer(logger, config);
                let sessionBufferCopy = sessionBuffer.createNew(logger, config, true);
                QUnit.assert.deepEqual(sessionBufferCopy.getItems(), [], "payload should be empty");
                QUnit.assert.deepEqual(this._getBuffer(BUFFER_KEY, logger), [], "session storage buffer should be empty");

                //let payload = ["payload1", "payload2", "payload3", "payload4", "payload5", "payload6"];
                let payload = [{item: "payload1", cnt: 0}, {item: "payload2", cnt: 0}, {item: "payload3", cnt: 0}, {item: "payload4", cnt: 0}, {item: "payload5", cnt: 0}, {item: "payload6", cnt: 0} ];
                let sentPayload = [{item: "sent1", cnt: 0}, {item: "sent2", cnt: 0}, {item: "sent3", cnt: 0}, {item: "sent4", cnt: 0} ];
                //let sentPayload = ["sent1", "sent2","sent3","sent4"];
                arrForEach(payload, (val) =>{
                    sessionBuffer.enqueue(val);
                });
                sessionBuffer.markAsSent(sentPayload);
                QUnit.assert.deepEqual(this._getBuffer(BUFFER_KEY, logger), payload, "session storage buffer is set");
                QUnit.assert.deepEqual(this._getBuffer(SENT_BUFFER_KEY, logger), sentPayload, "session storage sent buffer is set");

                QUnit.assert.deepEqual(sessionBuffer.getItems(), payload, "getItems() should only return unsent items");
                sessionBufferCopy = sessionBuffer.createNew(logger, config, true);
                QUnit.assert.deepEqual(sessionBufferCopy.getItems(), payload, "payload should be same");
                QUnit.assert.deepEqual(sessionBuffer.getItems(), [], "original session storage buffer should be clear");
                QUnit.assert.deepEqual(this._getBuffer(BUFFER_KEY, logger), payload, "session storage should not be changed");
                QUnit.assert.deepEqual(this._getBuffer(SENT_BUFFER_KEY, logger), sentPayload, "session storage sent buffer should not be changed");

                utlSetSessionStorage(logger, BUFFER_KEY,JSON.stringify([]));
                utlSetSessionStorage(logger, SENT_BUFFER_KEY,JSON.stringify([]));
            }
        });

        this.testCase({
            name: "SessionStorageSendBuffer createNew: function createNew() can return expected sessionStorage buffer with different prefix name",
            test: () => {
                let prefix = "prefix"
                let config = {
                    endpointUrl: "https//: test",
                    emitLineDelimitedJson: false,
                    maxBatchInterval: 15000,
                    maxBatchSizeInBytes: 102400,
                    disableTelemetry: false,
                    enableSessionStorageBuffer: true,
                    isRetryDisabled: false,
                    isBeaconApiDisabled:true,
                    disableXhr: false,
                    onunloadDisableFetch: false,
                    onunloadDisableBeacon: false,
                    instrumentationKey:"key",
                    namePrefix: "",
                    samplingPercentage: 100,
                    customHeaders: [{header:"header",value:"val" }],
                    convertUndefined: "",
                    eventsLimitInMem: 10000
                } as ISenderConfig;
                let newConfig = {...config};
                newConfig.namePrefix = prefix;
                let logger = new DiagnosticLogger({instrumentationKey: "abc"});
                
                let sessionBuffer = new SessionStorageSendBuffer(logger, config);
                let sessionBufferCopy = sessionBuffer.createNew(logger, newConfig, true);
                QUnit.assert.deepEqual(sessionBufferCopy.getItems(), [], "payload should be empty");
                QUnit.assert.deepEqual(this._getBuffer(BUFFER_KEY, logger), [], "session storage buffer should be empty");
                QUnit.assert.deepEqual(this._getBuffer(SENT_BUFFER_KEY, logger), [], "session storage sent buffer should be empty");
                QUnit.assert.deepEqual(this._getBuffer(SENT_BUFFER_KEY, logger, prefix), [], "session storage sent buffer with prefix should be empty");

                // let payload = ["payload1", "payload2", "payload3", "payload4", "payload5", "payload6"];
                // let sentPayload = ["sent1", "sent2","sent3","sent4"];
                let payload = [{item: "payload1", cnt: 0}, {item: "payload2", cnt: 0}, {item: "payload3", cnt: 0}, {item: "payload4", cnt: 0}, {item: "payload5", cnt: 0}, {item: "payload6", cnt: 0} ];
                let sentPayload = [{item: "sent1", cnt: 0}, {item: "sent2", cnt: 0}, {item: "sent3", cnt: 0}, {item: "sent4", cnt: 0} ];
                arrForEach(payload, (val) =>{
                    sessionBuffer.enqueue(val);
                });
                sessionBuffer.markAsSent(sentPayload);
                QUnit.assert.deepEqual(this._getBuffer(BUFFER_KEY, logger), payload, "session storage buffer is set");
                QUnit.assert.deepEqual(this._getBuffer(SENT_BUFFER_KEY, logger), sentPayload, "session storage sent buffer is set");

                QUnit.assert.deepEqual(sessionBuffer.getItems(), payload, "getItems() should only return unsent items");
                sessionBufferCopy =  sessionBuffer.createNew(logger, newConfig, true);
                QUnit.assert.deepEqual(sessionBufferCopy.getItems(), payload, "payload should be same");
                QUnit.assert.deepEqual(sessionBuffer.getItems(), [], "original session storage buffer should be clear");
                QUnit.assert.deepEqual(this._getBuffer(BUFFER_KEY, logger, prefix), payload, "new session storage buffer should be set");
                QUnit.assert.deepEqual(this._getBuffer(SENT_BUFFER_KEY, logger, prefix), sentPayload, "session storage sent buffer with prefix should be set");
                QUnit.assert.deepEqual(this._getBuffer(BUFFER_KEY, logger), [], "previous session storage should be clear");
                QUnit.assert.deepEqual(this._getBuffer(SENT_BUFFER_KEY, logger), [], "previous session storage sent buffer should be clear");

                utlSetSessionStorage(logger, BUFFER_KEY,JSON.stringify([]));
                utlSetSessionStorage(logger, SENT_BUFFER_KEY,JSON.stringify([]));
                utlSetSessionStorage(logger, `${prefix}_${BUFFER_KEY}`,JSON.stringify([]));
                utlSetSessionStorage(logger, `${prefix}_${SENT_BUFFER_KEY}`,JSON.stringify([]));
            }
        });

        
        this.testCase({
            name: "Channel Config: Offline Support",
            test: () => {
                this._sender.initialize(
                    {
                        instrumentationKey: "abc",
                        maxBatchInterval: 123,
                        endpointUrl: DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH,
                        maxBatchSizeInBytes: 654,
                        extensionConfig: {
                            [this._sender.identifier]: {
                                maxBatchSizeInBytes: 456
                            }
                        }

                    }, new AppInsightsCore(), []
                );

                let event: ITelemetryItem = {
                    name: 'fake item',
                    iKey: 'iKey',
                    baseType: 'some type',
                    baseData: {}
                };

                let offlineSupport = this._sender.getOfflineSupport() as any;
                QUnit.assert.ok(offlineSupport.serialize, "serialize exist");
                let eventStr = offlineSupport.serialize(event);
                let expectedStr = `"iKey":"iKey","name":"Microsoft.ApplicationInsights.iKey.Event","tags":{"ai.internal.sdkVersion":"javascript:${EnvelopeCreator.Version}"},"data":{"baseType":"EventData","baseData":{"ver":2,"name":"not_specified","properties":{"baseTypeSource":"some type"},"measurements":{}}}`;
                QUnit.assert.ok(eventStr.indexOf(expectedStr) > -1, "get expected string");
                
                let testStr = `{"name":"testEvent","iKey":"o:testIkey","data":{"baseData":{}}}`;
                QUnit.assert.ok(offlineSupport.batch, "batch should exit");
                let batch = offlineSupport.batch([testStr, testStr]);
                QUnit.assert.equal(batch, `[{"name":"testEvent","iKey":"o:testIkey","data":{"baseData":{}}},{"name":"testEvent","iKey":"o:testIkey","data":{"baseData":{}}}]`, "get expected batch");

                QUnit.assert.ok(offlineSupport.shouldProcess, "should process should exit");
                QUnit.assert.equal(offlineSupport.shouldProcess(event), true, "should process");

                QUnit.assert.ok(offlineSupport.createPayload, "getOffline createPayload should exit");
                let details = offlineSupport.createPayload("test");
                QUnit.assert.equal(details.urlString, "https://dc.services.visualstudio.com/v2/track", "get expected Url");
                QUnit.assert.ok(details.headers, "should have headers");
                QUnit.assert.equal(details.headers["Sdk-Context"], "appId", "get expected headers");
                QUnit.assert.equal(details.data, "test", "should use headers");
            }
        });


        this.testCase({
            name: "Channel Config: Validate empty endpointURL falls back to the default",
            test: () => {
                this._sender.initialize(
                    {
                        instrumentationKey: 'abc',
                        maxBatchInterval: 123,
                        endpointUrl: '',
                        maxBatchSizeInBytes: 654,
                        extensionConfig: {
                            [this._sender.identifier]: {
                                maxBatchSizeInBytes: 456
                            }
                        }

                    }, new AppInsightsCore(), []
                );

                QUnit.assert.equal(123, this._sender._senderConfig.maxBatchInterval, 'Channel config can be set from root config (maxBatchInterval)');
                QUnit.assert.equal(DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH, this._sender._senderConfig.endpointUrl, 'Channel config can be set from root config (endpointUrl)');
                QUnit.assert.notEqual(654, this._sender._senderConfig.maxBatchSizeInBytes, 'Channel config does not equal root config option if extensionConfig field is also set');
                QUnit.assert.equal(456, this._sender._senderConfig.maxBatchSizeInBytes, 'Channel config prioritizes extensionConfig over root config');
            }
        });

        this.testCase({
            name: "Channel Config: Session storage can be enabled",
            test: () => {
                let setItemSpy = this.sandbox.spy(window.sessionStorage, "setItem");
                let getItemSpy = this.sandbox.spy(window.sessionStorage, "getItem");

                this._sender.initialize(
                    {
                        enableSessionStorageBuffer: true
                    }, new AppInsightsCore(), []
                );

                const telemetryItem: ITelemetryItem = {
                    name: 'fake item',
                    iKey: 'iKey',
                    baseType: 'some type',
                    baseData: {}
                };
                this._sender.processTelemetry(telemetryItem, null);

                QUnit.assert.true(this._sender._buffer instanceof SessionStorageSendBuffer, 'Channel config can be set from root config (enableSessionStorageBuffer)');
                QUnit.assert.equal(false, setItemSpy.calledOnce, "The setItem has not yet been triggered");
                QUnit.assert.equal(false, getItemSpy.calledOnce, "The getItemSpy has not yet been triggered");
            }
        });

        this.testCase({
            name: "Channel Config: Session storage with buffer override is used",
            test: () => {
                let setItemSpy = this.sandbox.stub();
                let getItemSpy = this.sandbox.stub();

                this._sender.initialize(
                    {
                        enableSessionStorageBuffer: true,
                        bufferOverride: {
                            getItem: getItemSpy,
                            setItem: setItemSpy
                        }
                    }, new AppInsightsCore(), []
                );

                const telemetryItem: ITelemetryItem = {
                    name: 'fake item',
                    iKey: 'iKey',
                    baseType: 'some type',
                    baseData: {}
                };
                this._sender.processTelemetry(telemetryItem, null);

                QUnit.assert.true(this._sender._buffer instanceof SessionStorageSendBuffer, 'Channel config can be set from root config (enableSessionStorageBuffer)');
                QUnit.assert.equal(false, setItemSpy.calledOnce, "The setItem has not yet been triggered");
                QUnit.assert.equal(false, getItemSpy.calledOnce, "The getItemSpy has not yet been triggered");
            }
        });

        this.testCase({
            name: "Channel Config: Session storage can be disabled",
            test: () => {
                this._sender.initialize(
                    {
                        enableSessionStorageBuffer: false
                    }, new AppInsightsCore(), []
                );

                QUnit.assert.true(this._sender._buffer instanceof ArraySendBuffer, 'Channel config can be set from root config (enableSessionStorageBuffer)');
            }
        });

        this.testCase({
            name: "Channel Config: Session storage ignores buffer override when disabled",
            test: () => {
                this._sender.initialize(
                    {
                        enableSessionStorageBuffer: false,
                        bufferOverride: {
                            getItem: this.sandbox.stub(),
                            setItem: this.sandbox.stub()
                        }
                    }, new AppInsightsCore(), []
                );

                QUnit.assert.true(this._sender._buffer instanceof ArraySendBuffer, 'Channel config can be set from root config (enableSessionStorageBuffer)');
            }
        });

        this.testCase({
            name: "processTelemetry can be called with optional fields undefined",
            useFakeTimers: true,
            test: () => {
                this._sender.initialize({
                    instrumentationKey: 'abc'
                }, new AppInsightsCore(), []);

                const loggerSpy = this.sandbox.stub(this._sender, "triggerSend");
                const telemetryItem: ITelemetryItem = {
                    name: 'fake item',
                    iKey: 'iKey',
                    baseType: 'some type',
                    baseData: {}
                };
                try {
                    this._sender.processTelemetry(telemetryItem, null);
                } catch(e) {
                    QUnit.assert.ok(false, "Exception - " + e);
                }

                QUnit.assert.equal(false, loggerSpy.calledOnce, "The send has not yet been triggered");
                this.clock.tick(15000);
                QUnit.assert.equal(true, loggerSpy.calledOnce, "The send has been triggered");
            }
        })

        this.testCase({
            name: "processTelemetry process ItelemetryItem with iKey",
            useFakeTimers: true,
            test: () => {
                this._sender.initialize({
                    instrumentationKey: 'abc'
                }, new AppInsightsCore(), []);

                const loggerSpy = this.sandbox.stub(this._sender, "triggerSend");
                const expectedIkey = 'testIkey';
                const telemetryItem: ITelemetryItem = {
                    name: 'fake item',
                    iKey: expectedIkey,
                    baseType: 'some type',
                    baseData: {}
                };
                try {
                    this._sender.processTelemetry(telemetryItem, null);
                    let buffer = this._sender._buffer.getItems();
                    let payload = JSON.parse(buffer[buffer.length-1].item);
                    var actualIkey = payload.iKey;
                } catch(e) {
                    QUnit.assert.ok(false, "Exception - " + e);
                }

                QUnit.assert.equal(false, loggerSpy.calledOnce, "The send has not yet been triggered");
                QUnit.assert.equal(expectedIkey, actualIkey, "processTelemetry replaced ItelemetryItem Ikey");
                this.clock.tick(15000);
                QUnit.assert.equal(true, loggerSpy.calledOnce, "The send has been triggered");
            }
        })

        this.testCase({
            name: "telemetry is not send when legacy telemetry initializer returns false",
            test: () => {
                const cr = new AppInsightsCore();
                cr.logger = new DiagnosticLogger({instrumentationKey: "ikey"});
                this._sender.initialize({
                    instrumentationKey: 'abc'
                }, cr, []);

                const nextPlugin = <ITelemetryPlugin> {
                    identifier: "foo",
                    processTelemetry: (it) => {},
                    priority: 200,
                    setNextPlugin: (it) => {}
                };
                this._sender.setNextPlugin(nextPlugin);

                const processTelemetrySpy = this.sandbox.stub(nextPlugin, "processTelemetry");
                const telemetryItem: ITelemetryItem = {
                    name: 'fake item',
                    iKey: 'iKey',
                    baseType: 'some type',
                    baseData: {},
                    tags: [
                    ]
                };

                telemetryItem.tags["ProcessLegacy"] = [e => true, e => false, f=> true];
                try {
                    this._sender.processTelemetry(telemetryItem, null);
                } catch(e) {
                    QUnit.assert.ok(false);
                }

                QUnit.assert.ok(!processTelemetrySpy.calledOnce);
            }
        });

        this.testCase({
            name: 'BeaconAPI is not used when isBeaconApiDisabled flag is true',
            test: () => {
                let sendBeaconCalled = false;
                this.hookSendBeacon((url: string) => {
                    sendBeaconCalled = true;
                    return true;
                });

                const sender = new Sender();
                const cr = new AppInsightsCore();

                sender.initialize({
                    instrumentationKey: 'abc',
                    isBeaconApiDisabled: true
                }, cr, []);
                this.onDone(() => {
                    sender.teardown();
                });

                const telemetryItem: ITelemetryItem = {
                    name: 'fake item',
                    iKey: 'iKey',
                    baseType: 'some type',
                    baseData: {}
                };

                QUnit.assert.ok(isBeaconApiSupported(), "Beacon API is supported");
                QUnit.assert.equal(false, sendBeaconCalled, "Beacon API was not called before");
                QUnit.assert.equal(0, this._getXhrRequests().length, "xhr sender was not called before");

                try {
                    sender.processTelemetry(telemetryItem, null);
                    sender.flush();
                } catch(e) {
                    QUnit.assert.ok(false);
                }

                QUnit.assert.equal(false, sendBeaconCalled, "Beacon API is disabled, Beacon API is not called");
                QUnit.assert.equal(1, this._getXhrRequests().length, "xhr sender is called when Beacon API is disabled");
            }
        });

        this.testCase({
            name: 'beaconSender is called when isBeaconApiDisabled flag is false',
            useFakeTimers: true,
            test: () => {
                let sendBeaconCalled = false;
                this.hookSendBeacon((url: string) => {
                    sendBeaconCalled = true;
                    return true;
                });

                const cr = new AppInsightsCore();
                const sender = new Sender();

                sender.initialize({
                    instrumentationKey: 'abc',
                    isBeaconApiDisabled: false
                }, cr, []);
                this.onDone(() => {
                    sender.teardown();
                });

                const telemetryItem: ITelemetryItem = {
                    name: 'fake item',
                    iKey: 'iKey',
                    baseType: 'some type',
                    baseData: {}
                };

                QUnit.assert.ok(isBeaconApiSupported(), "Beacon API is supported");
                QUnit.assert.equal(false, sendBeaconCalled, "Beacon API was not called before");
                QUnit.assert.equal(0, this._getXhrRequests().length, "xhr sender was not called before");

                try {
                    sender.processTelemetry(telemetryItem, null);
                    sender.flush();
                } catch(e) {
                    QUnit.assert.ok(false);
                }

                this.clock.tick(15000);

                QUnit.assert.equal(0, this._getXhrRequests().length, "xhr sender is not called when Beacon API is enabled");
                QUnit.assert.equal(true, sendBeaconCalled, "Beacon API is enabled, Beacon API is called");
            }
        });

        
        this.testCase({
            name: 'Unload Transport Type: User provide fetch in unloadtransports, but it is disabled, so we should use beacon',
            test: () => {
                let window = getWindow();
                let fakeXMLHttpRequest = (window as any).XMLHttpRequest;
                let fetchstub = this.sandbox.stub((window as any), "fetch");

                let sendBeaconCalled = false;
                this.hookSendBeacon((url: string) => {
                    sendBeaconCalled = true;
                    return true;
                });

                let config = {
                    endpointUrl: "https//: test",
                    emitLineDelimitedJson: false,
                    maxBatchInterval: 15000,
                    maxBatchSizeInBytes: 102400,
                    disableTelemetry: false,
                    enableSessionStorageBuffer: true,
                    isRetryDisabled: false,
                    isBeaconApiDisabled: false,
                    disableXhr: false,
                    onunloadDisableFetch: true,
                    onunloadDisableBeacon: false,
                    instrumentationKey:"key",
                    namePrefix: "",
                    samplingPercentage: 100,
                    customHeaders: [{header:"header",value:"val" }],
                    convertUndefined: "",
                    eventsLimitInMem: 10000,
                    unloadTransports: [TransportType.Fetch]
                } as ISenderConfig;

                const sender = new Sender();
                const cr = new AppInsightsCore();
                var coreConfig = {
                    instrumentationKey: "",
                    extensionConfig: {[sender.identifier]: config}
                };

                cr.initialize(coreConfig, [sender]);

                this.onDone(() => {
                    sender.teardown();
                });

                const telemetryItem: ITelemetryItem = {
                    name: 'fake item',
                    iKey: 'iKey',
                    baseType: 'some type',
                    baseData: {}
                };

                QUnit.assert.ok(isBeaconApiSupported(), "Beacon API is supported");
                QUnit.assert.equal(false, sendBeaconCalled, "Beacon API was not called before");
                QUnit.assert.equal(0, this._getXhrRequests().length, "xhr sender was not called before");

                try {
                    sender.processTelemetry(telemetryItem, null);
                    sender.onunloadFlush();
                } catch(e) {
                    QUnit.assert.ok(false);
                }

                QUnit.assert.equal(true, sendBeaconCalled, "Beacon API should be called");
                QUnit.assert.equal(0, this._getXhrRequests().length, "xhr sender is not called");
                QUnit.assert.ok(!fetchstub.called, "fetch sender is blocked");
                // store it back
                (window as any).XMLHttpRequest = fakeXMLHttpRequest;
            }
        });

        this.testCase({
            name: 'Unload Transport Type: User provide fetch in unloadtransports, we should use fetch',
            test: () => {
                let window = getWindow();
                let fakeXMLHttpRequest = (window as any).XMLHttpRequest;
                let fetchstub = this.sandbox.stub((window as any), "fetch");

                let sendBeaconCalled = false;
                this.hookSendBeacon((url: string) => {
                    sendBeaconCalled = true;
                    return true;
                });

                let config = {
                    endpointUrl: "https//: test",
                    emitLineDelimitedJson: false,
                    maxBatchInterval: 15000,
                    maxBatchSizeInBytes: 102400,
                    disableTelemetry: false,
                    enableSessionStorageBuffer: true,
                    isRetryDisabled: false,
                    isBeaconApiDisabled: false,
                    disableXhr: false,
                    onunloadDisableFetch: false,
                    onunloadDisableBeacon: false,
                    instrumentationKey:"key",
                    namePrefix: "",
                    samplingPercentage: 100,
                    customHeaders: [{header:"header",value:"val" }],
                    convertUndefined: "",
                    eventsLimitInMem: 10000,
                    unloadTransports: [TransportType.Fetch]
                } as ISenderConfig;

                const sender = new Sender();
                const cr = new AppInsightsCore();
                var coreConfig = {
                    instrumentationKey: "",
                    extensionConfig: {[sender.identifier]: config}
                };

                cr.initialize(coreConfig, [sender]);

                this.onDone(() => {
                    sender.teardown();
                });

                const telemetryItem: ITelemetryItem = {
                    name: 'fake item',
                    iKey: 'iKey',
                    baseType: 'some type',
                    baseData: {}
                };

                QUnit.assert.ok(isBeaconApiSupported(), "Beacon API is supported");
                QUnit.assert.equal(false, sendBeaconCalled, "Beacon API was not called before");
                QUnit.assert.equal(0, this._getXhrRequests().length, "xhr sender was not called before");

                try {
                    sender.processTelemetry(telemetryItem, null);
                    sender.onunloadFlush();
                } catch(e) {
                    QUnit.assert.ok(false);
                }

                QUnit.assert.equal(false, sendBeaconCalled, "Beacon API should not be called");
                QUnit.assert.equal(0, this._getXhrRequests().length, "xhr sender is not called");
                QUnit.assert.ok(fetchstub.called, "fetch sender is called");
                // store it back
                (window as any).XMLHttpRequest = fakeXMLHttpRequest;
            }
        });

       
        this.testCase({
            name: 'Unload Transport Type: User provide beacon in unloadtransports, we should use beacon',
            test: () => {
                let window = getWindow();
                let fakeXMLHttpRequest = (window as any).XMLHttpRequest;
                let fetchstub = this.sandbox.stub((window as any), "fetch");

                let sendBeaconCalled = false;
                this.hookSendBeacon((url: string) => {
                    sendBeaconCalled = true;
                    return true;
                });

                let config = {
                    endpointUrl: "https//: test",
                    emitLineDelimitedJson: false,
                    maxBatchInterval: 15000,
                    maxBatchSizeInBytes: 102400,
                    disableTelemetry: false,
                    enableSessionStorageBuffer: true,
                    isRetryDisabled: false,
                    isBeaconApiDisabled: false,
                    disableXhr: false,
                    onunloadDisableFetch: false,
                    onunloadDisableBeacon: false,
                    instrumentationKey:"key",
                    namePrefix: "",
                    samplingPercentage: 100,
                    customHeaders: [{header:"header",value:"val" }],
                    convertUndefined: "",
                    eventsLimitInMem: 10000,
                    unloadTransports: [TransportType.Beacon]
                } as ISenderConfig;

                const sender = new Sender();
                const cr = new AppInsightsCore();
                var coreConfig = {
                    instrumentationKey: "",
                    extensionConfig: {[sender.identifier]: config}
                };

                cr.initialize(coreConfig, [sender]);

                this.onDone(() => {
                    sender.teardown();
                });

                const telemetryItem: ITelemetryItem = {
                    name: 'fake item',
                    iKey: 'iKey',
                    baseType: 'some type',
                    baseData: {}
                };

                QUnit.assert.ok(isBeaconApiSupported(), "Beacon API is supported");
                QUnit.assert.equal(false, sendBeaconCalled, "Beacon API was not called before");
                QUnit.assert.equal(0, this._getXhrRequests().length, "xhr sender was not called before");

                try {
                    sender.processTelemetry(telemetryItem, null);
                    sender.onunloadFlush();
                } catch(e) {
                    QUnit.assert.ok(false);
                }

                QUnit.assert.equal(true, sendBeaconCalled, "Beacon API should be called");
                QUnit.assert.equal(0, this._getXhrRequests().length, "xhr sender is not called");
                QUnit.assert.ok(!fetchstub.called, "fetch sender is not called");
                // store it back
                (window as any).XMLHttpRequest = fakeXMLHttpRequest;
            }
        });

        this.testCase({
            name: 'Transport Type: isBeaconApiDisabled is true and User provide beacon in transports, we should still block beacon',
            test: () => {
                let window = getWindow();
                let fakeXMLHttpRequest = (window as any).XMLHttpRequest;
                let fetchstub = this.sandbox.stub((window as any), "fetch");

                let sendBeaconCalled = false;
                this.hookSendBeacon((url: string) => {
                    sendBeaconCalled = true;
                    return false;
                });

                let config = {
                    endpointUrl: "https//: test",
                    emitLineDelimitedJson: false,
                    maxBatchInterval: 15000,
                    maxBatchSizeInBytes: 102400,
                    disableTelemetry: false,
                    enableSessionStorageBuffer: true,
                    isRetryDisabled: false,
                    isBeaconApiDisabled: true,
                    disableXhr: false,
                    onunloadDisableFetch: false,
                    onunloadDisableBeacon: false,
                    instrumentationKey:"key",
                    namePrefix: "",
                    samplingPercentage: 100,
                    customHeaders: [{header:"header",value:"val" }],
                    convertUndefined: "",
                    eventsLimitInMem: 10000,
                    transports: [TransportType.Beacon]
                } as ISenderConfig;

                const sender = new Sender();
                const cr = new AppInsightsCore();
                var coreConfig = {
                    instrumentationKey: "",
                    extensionConfig: {[sender.identifier]: config}
                };

                cr.initialize(coreConfig, [sender]);

                this.onDone(() => {
                    sender.teardown();
                });

                const telemetryItem: ITelemetryItem = {
                    name: 'fake item',
                    iKey: 'iKey',
                    baseType: 'some type',
                    baseData: {}
                };

                QUnit.assert.ok(isBeaconApiSupported(), "Beacon API is supported");
                QUnit.assert.equal(false, sendBeaconCalled, "Beacon API was not called before");
                QUnit.assert.equal(0, this._getXhrRequests().length, "xhr sender was not called before");

                try {
                    sender.processTelemetry(telemetryItem, null);
                    sender.flush();
                } catch(e) {
                    QUnit.assert.ok(false);
                }

                QUnit.assert.equal(false, sendBeaconCalled, "Beacon API is blocked, Beacon API should not be called");
                QUnit.assert.equal(1, this._getXhrRequests().length, "xhr sender is called");
                QUnit.assert.ok(!fetchstub.called, "fetch sender is not called");
                // store it back
                (window as any).XMLHttpRequest = fakeXMLHttpRequest;
            }
        });
        this.testCase({
            name: 'Transport Type: isBeaconApiDisabled is false and User provide beacon in transports, we should pick beacon',
            useFakeTimers: true,
            test: () => {
                let sendBeaconCalled = false;
                this.hookSendBeacon((url: string) => {
                    sendBeaconCalled = true;
                    return true;
                });
          let config = {
                    isBeaconApiDisabled: false,
                    disableXhr: false,
                    transports: [TransportType.Beacon]
                } as ISenderConfig;

                const sender = new Sender();
                const cr = new AppInsightsCore();
                var coreConfig = {
                    instrumentationKey: "",
                    extensionConfig: {[sender.identifier]: config}
                };

                cr.initialize(coreConfig, [sender]);

                this.onDone(() => {
                    sender.teardown();
                });
                const telemetryItem: ITelemetryItem = {
                    name: 'fake item',
                    iKey: 'iKey',
                    baseType: 'some type',
                    baseData: {}
                };

                QUnit.assert.ok(isBeaconApiSupported(), "Beacon API is supported");
                QUnit.assert.equal(false, sendBeaconCalled, "Beacon API was not called before");
                QUnit.assert.equal(0, this._getXhrRequests().length, "xhr sender was not called before");

                try {
                    sender.processTelemetry(telemetryItem, null);
                    sender.flush();
                } catch(e) {
                    QUnit.assert.ok(false);
                }

                this.clock.tick(15000);

                QUnit.assert.equal(0, this._getXhrRequests().length, "xhr sender is not called when Beacon API is enabled");
                QUnit.assert.equal(true, sendBeaconCalled, "Beacon API is enabled, Beacon API is called");
            }
        });

 

        this.testCase({
            name: 'Transport Type: disableXhr is false, and user provide xhr in transports',
            test: () => {
                let window = getWindow();
                let fakeXMLHttpRequest = (window as any).XMLHttpRequest;
                let fetchstub = this.sandbox.stub((window as any), "fetch");

                let sendBeaconCalled = false;
                this.hookSendBeacon((url: string) => {
                    sendBeaconCalled = true;
                    return false;
                });

                let config = {
                    endpointUrl: "https//: test",
                    emitLineDelimitedJson: false,
                    maxBatchInterval: 15000,
                    maxBatchSizeInBytes: 102400,
                    disableTelemetry: false,
                    enableSessionStorageBuffer: true,
                    isRetryDisabled: false,
                    isBeaconApiDisabled:true,
                    disableXhr: false,
                    onunloadDisableFetch: false,
                    onunloadDisableBeacon: false,
                    instrumentationKey:"key",
                    namePrefix: "",
                    samplingPercentage: 100,
                    customHeaders: [{header:"header",value:"val" }],
                    convertUndefined: "",
                    eventsLimitInMem: 10000,
                    transports: [TransportType.Xhr]
                } as ISenderConfig;

                const sender = new Sender();
                const cr = new AppInsightsCore();
                var coreConfig = {
                    instrumentationKey: "",
                    extensionConfig: {[sender.identifier]: config}
                };

                cr.initialize(coreConfig, [sender]);

                this.onDone(() => {
                    sender.teardown();
                });

                const telemetryItem: ITelemetryItem = {
                    name: 'fake item',
                    iKey: 'iKey',
                    baseType: 'some type',
                    baseData: {}
                };

                QUnit.assert.ok(isBeaconApiSupported(), "Beacon API is supported");
                QUnit.assert.equal(false, sendBeaconCalled, "Beacon API was not called before");
                QUnit.assert.equal(0, this._getXhrRequests().length, "xhr sender was not called before");

                try {
                    sender.processTelemetry(telemetryItem, null);
                    sender.flush();
                } catch(e) {
                    QUnit.assert.ok(false);
                }

                QUnit.assert.equal(false, sendBeaconCalled, "Beacon API is disabled, Beacon API is not called");
                QUnit.assert.equal(1, this._getXhrRequests().length, "xhr sender is called");
                QUnit.assert.ok(!fetchstub.called, "fetch sender is not called");
                // store it back
                (window as any).XMLHttpRequest = fakeXMLHttpRequest;
            }
        });

        this.testCase({
            name: 'Transport Type: disableXhr is false, but user provide fetch in transports',
            test: () => {
                let window = getWindow();
                let fakeXMLHttpRequest = (window as any).XMLHttpRequest;
                let fetchstub = this.sandbox.stub((window as any), "fetch");

                let sendBeaconCalled = false;
                this.hookSendBeacon((url: string) => {
                    sendBeaconCalled = true;
                    return false;
                });

                let config = {
                    endpointUrl: "https//: test",
                    emitLineDelimitedJson: false,
                    maxBatchInterval: 15000,
                    maxBatchSizeInBytes: 102400,
                    disableTelemetry: false,
                    enableSessionStorageBuffer: true,
                    isRetryDisabled: false,
                    isBeaconApiDisabled:true,
                    disableXhr: false,
                    onunloadDisableFetch: false,
                    onunloadDisableBeacon: false,
                    instrumentationKey:"key",
                    namePrefix: "",
                    samplingPercentage: 100,
                    customHeaders: [{header:"header",value:"val" }],
                    convertUndefined: "",
                    eventsLimitInMem: 10000,
                    transports: [TransportType.Fetch]
                } as ISenderConfig;

                const sender = new Sender();
                const cr = new AppInsightsCore();
                var coreConfig = {
                    instrumentationKey: "",
                    extensionConfig: {[sender.identifier]: config}
                };

                cr.initialize(coreConfig, [sender]);

                this.onDone(() => {
                    sender.teardown();
                });

                const telemetryItem: ITelemetryItem = {
                    name: 'fake item',
                    iKey: 'iKey',
                    baseType: 'some type',
                    baseData: {}
                };

                QUnit.assert.ok(isBeaconApiSupported(), "Beacon API is supported");
                QUnit.assert.equal(false, sendBeaconCalled, "Beacon API was not called before");
                QUnit.assert.equal(0, this._getXhrRequests().length, "xhr sender was not called before");

                try {
                    sender.processTelemetry(telemetryItem, null);
                    sender.flush();
                } catch(e) {
                    QUnit.assert.ok(false);
                }

                QUnit.assert.equal(false, sendBeaconCalled, "Beacon API is disabled, Beacon API is not called");
                QUnit.assert.equal(0, this._getXhrRequests().length, "xhr sender is not called");
                QUnit.assert.ok(fetchstub.called, "fetch sender is called");
                // store it back
                (window as any).XMLHttpRequest = fakeXMLHttpRequest;
            }
        });

        this.testCase({
            name: "disableBeaconSplit is set to true,  xhr should be used to send data diretly instead of splitting payloads.",
            useFakeTimers: true,
            test: () => {
                let window = getWindow();
                let fetchstub = this.sandbox.stub((window as any), "fetch");
                let fakeXMLHttpRequest = (window as any).XMLHttpRequest;
                let sessionStorage = window.sessionStorage;
                QUnit.assert.ok(sessionStorage, "sessionStorage API is supported");
                sessionStorage.clear();

                let sendBeaconCalled = false;
                this.hookSendBeacon((url: string) => {
                    sendBeaconCalled = true;
                    return false;
                });

                const sender = new Sender();
                const cr = new AppInsightsCore();

                sender.initialize({
                    instrumentationKey: "abc",
                    extensionConfig: {
                        [sender.identifier]: {
                            disableSendBeaconSplit: true,
                            onunloadDisableFetch: true,
                            disableXhr: true
                            // to make sure beacon is used
                        }
                    }
                    
                }, cr, []);
                this.onDone(() => {
                    sender.teardown();
                });

                const telemetryItem: ITelemetryItem = {
                    name: "fake item",
                    iKey: "iKey",
                    baseType: "some type",
                    baseData: {
                        largePayload: new Array(64 + 1).join("test")
                    }
                };

                let buffer = sender._buffer;

                QUnit.assert.ok(isBeaconApiSupported(), "Beacon API is supported");
                QUnit.assert.equal(false, sendBeaconCalled, "Beacon API was not called before");
                QUnit.assert.equal(0, this._getXhrRequests().length, "xhr sender was not called before");
                QUnit.assert.equal(0, buffer.getItems().length, "sender buffer should be clear");

                try {
                    sender.processTelemetry(telemetryItem, null);
                    QUnit.assert.equal(1, buffer.getItems().length, "sender buffer should have one payload");
                    let bufferItems = JSON.parse(sessionStorage.getItem(BUFFER_KEY) as any);
                    QUnit.assert.equal(bufferItems.length, 1, "sender buffer should have one payload");
                    let sentItems = JSON.parse(sessionStorage.getItem(SENT_BUFFER_KEY) as any);
                    QUnit.assert.equal(0, sentItems.length, "sent buffer should have zero payload");
                    sender.onunloadFlush();
                } catch(e) {
                    QUnit.assert.ok(false);
                }

                this.clock.tick(5);

                QUnit.assert.equal(true, sendBeaconCalled, "Beacon API should be called");
                QUnit.assert.equal(1, this._getXhrRequests().length, "xhr sender should be called");
                let xhrRequest =  this._getXhrRequests()[0];
                QUnit.assert.equal(false, fetchstub.called, "fetch sender is not called");
                QUnit.assert.equal(0, buffer.getItems().length, "sender buffer should not have one payload");
                QUnit.assert.equal(0, buffer.count(), "sender buffer should not have any payload");
                let bufferItems = JSON.parse(sessionStorage.getItem(BUFFER_KEY) as any);
                QUnit.assert.equal(bufferItems.length, 0, "sender buffer should be clear payload");
                let sentItems = JSON.parse(sessionStorage.getItem(SENT_BUFFER_KEY) as any);
                QUnit.assert.equal(1, sentItems.length, "sent buffer should have only one payload");

                this.sendJsonResponse(xhrRequest, {}, 200);
                bufferItems = JSON.parse(sessionStorage.getItem(BUFFER_KEY) as any);
                QUnit.assert.equal(bufferItems.length, 0, "sender buffer should be clear payload");
                sentItems = JSON.parse(sessionStorage.getItem(SENT_BUFFER_KEY) as any);
                QUnit.assert.equal(0, sentItems.length, "sent buffer should have no payload");

                (window as any).XMLHttpRequest = fakeXMLHttpRequest;
                sessionStorage.clear();
                
            }
        });

        this.testCase({
            name: "disableBeaconSplit is set to false, xhr should not be called to send small payload.",
            test: () => {
                let window = getWindow();
                let fetchstub = this.sandbox.stub((window as any), "fetch");
                let fakeXMLHttpRequest = (window as any).XMLHttpRequest;
                let sessionStorage = window.sessionStorage;
                QUnit.assert.ok(sessionStorage, "sessionStorage API is supported");
                sessionStorage.clear();

                let sendBeaconCalled = 0;
                this.hookSendBeacon((url: string) => {
                    sendBeaconCalled += 1;
                    return true;
                });

                const sender = new Sender();
                const cr = new AppInsightsCore();

                sender.initialize({
                    instrumentationKey: "abc",
                    extensionConfig: {
                        [sender.identifier]: {
                            onunloadDisableFetch: true,
                            disableXhr: true,
                            disableSendBeaconSplit: false
                            // to make sure beacon is used
                        }
                    }
                    
                }, cr, []);
                this.onDone(() => {
                    sender.teardown();
                });

                const telemetryItem: ITelemetryItem = {
                    name: "item",
                    iKey: "iKey",
                    baseType: "type",
                    baseData: {}
                };


                let buffer = sender._buffer;

                QUnit.assert.ok(isBeaconApiSupported(), "Beacon API is supported");
                QUnit.assert.equal(0, sendBeaconCalled, "Beacon API was not called before");
                QUnit.assert.equal(0, this._getXhrRequests().length, "xhr sender was not called before");
                QUnit.assert.equal(0, buffer.getItems().length, "sender buffer should be clear");

                try {
                    sender.processTelemetry(telemetryItem, null);
                    QUnit.assert.equal(1, buffer.getItems().length, "sender buffer should have one payload");
                    let bufferItems = JSON.parse(sessionStorage.getItem(BUFFER_KEY) as any);
                    QUnit.assert.equal(bufferItems.length, 1, "sender buffer should have one payload");
                    let sentItems = JSON.parse(sessionStorage.getItem(SENT_BUFFER_KEY) as any);
                    QUnit.assert.equal(0, sentItems.length, "sent buffer should have zero payload");
                    sender.onunloadFlush();
                } catch(e) {
                    QUnit.assert.ok(false);
                }

                QUnit.assert.equal(1, sendBeaconCalled, "Beacon API should be called");
                QUnit.assert.equal(0, this._getXhrRequests().length, "xhr sender should be called");
                QUnit.assert.equal(false, fetchstub.called, "fetch sender is not called");
                QUnit.assert.equal(0, buffer.getItems().length, "sender buffer should not have one payload");
                QUnit.assert.equal(0, buffer.count(), "sender buffer should not have any payload");
                let bufferItems = JSON.parse(sessionStorage.getItem(BUFFER_KEY) as any);
                QUnit.assert.equal(bufferItems.length, 0, "sender buffer should be clear payload");
                let sentItems = JSON.parse(sessionStorage.getItem(SENT_BUFFER_KEY) as any);
                QUnit.assert.equal(0, sentItems.length, "sent buffer should not have one payload");

                (window as any).XMLHttpRequest = fakeXMLHttpRequest;
                sessionStorage.clear();
                
            }
        });

        this.testCase({
            name: "disableBeaconSplit is set to false, xhr should be called to send large payload.",
            useFakeTimers: true,
            test: () => {
                let window = getWindow();
                let fetchstub = this.sandbox.stub((window as any), "fetch");
                let fakeXMLHttpRequest = (window as any).XMLHttpRequest;
                let sessionStorage = window.sessionStorage;
                QUnit.assert.ok(sessionStorage, "sessionStorage API is supported");
                sessionStorage.clear();

                let sendBeaconCalled = 0;
                this.hookSendBeacon((url: string) => {
                    sendBeaconCalled += 1;
                    if (sendBeaconCalled == 2) {
                        return true;
                    }
                    return false;
                });

                const sender = new Sender();
                const cr = new AppInsightsCore();

                sender.initialize({
                    instrumentationKey: "abc",
                    extensionConfig: {
                        [sender.identifier]: {
                            onunloadDisableFetch: true,
                            disableXhr: true,
                            disableSendBeaconSplit: false
                            
                            // to make sure beacon is used
                        }
                    }
                    
                }, cr, []);
                this.onDone(() => {
                    sender.teardown();
                });

                const telemetryItem: ITelemetryItem = {
                    name: "item",
                    iKey: "iKey",
                    baseType: "type",
                    baseData: {}
                };

                const telemetryItem1: ITelemetryItem = {
                    name: "item",
                    iKey: "iKey1",
                    baseType: "type",
                    baseData: {}
                };


                let buffer = sender._buffer;

                QUnit.assert.ok(isBeaconApiSupported(), "Beacon API is supported");
                QUnit.assert.equal(0, sendBeaconCalled, "Beacon API was not called before");
                QUnit.assert.equal(0, this._getXhrRequests().length, "xhr sender was not called before");
                QUnit.assert.equal(0, buffer.getItems().length, "sender buffer should be clear");

                try {
                    sender.processTelemetry(telemetryItem, null);
                    sender.processTelemetry(telemetryItem1, null);
                    QUnit.assert.equal(2, buffer.getItems().length, "sender buffer should have one payload");
                    let bufferItems = JSON.parse(sessionStorage.getItem(BUFFER_KEY) as any);
                    QUnit.assert.equal(bufferItems.length, 2, "sender buffer should have one payload");
                    let sentItems = JSON.parse(sessionStorage.getItem(SENT_BUFFER_KEY) as any);
                    QUnit.assert.equal(0, sentItems.length, "sent buffer should have zero payload");
                    sender.onunloadFlush();
                } catch(e) {
                    QUnit.assert.ok(false);
                }
                this.clock.tick(5);

                QUnit.assert.equal(3, sendBeaconCalled, "Beacon API should be called 3 times");
                QUnit.assert.equal(1, this._getXhrRequests().length, "xhr sender should be called");
                let xhrRequest = this._getXhrRequests()[0];
                QUnit.assert.equal(false, fetchstub.called, "fetch sender is not called");
                QUnit.assert.equal(0, buffer.getItems().length, "sender buffer should not have one payload");
                QUnit.assert.equal(0, buffer.count(), "sender buffer should not have any payload");
                let bufferItems = JSON.parse(sessionStorage.getItem(BUFFER_KEY) as any);
                QUnit.assert.equal(bufferItems.length, 0, "sender buffer should be clear payload");
                let sentItems = JSON.parse(sessionStorage.getItem(SENT_BUFFER_KEY) as any);
                QUnit.assert.equal(1, sentItems.length, "sent buffer should have one payload");
                QUnit.assert.ok(sentItems[0].item.indexOf("iKey1") >= 0, "sent buffer should have ikey1 payload");

                this.sendJsonResponse(xhrRequest, {}, 200);
                bufferItems = JSON.parse(sessionStorage.getItem(BUFFER_KEY) as any);
                QUnit.assert.equal(bufferItems.length, 0, "sender buffer should have no payload test1");
                sentItems = JSON.parse(sessionStorage.getItem(SENT_BUFFER_KEY) as any);
                QUnit.assert.equal(0, sentItems.length, "sent buffer should have zero payload test1");

                (window as any).XMLHttpRequest = fakeXMLHttpRequest;
                sessionStorage.clear();
                
            }
        });

        this.testCase({
            name: "fetchKeepAliveSender should not send duplicacted events during unload.",
            useFakeTimers: true,
            test: () => {
                let window = getWindow();
                let fetchstub = this.sandbox.stub((window as any), "fetch");
                let fakeXMLHttpRequest = (window as any).XMLHttpRequest;
                let sessionStorage = window.sessionStorage;
                let sessionSpy = this.sandbox.spy(sessionStorage,"setItem");
                QUnit.assert.ok(sessionStorage, "sessionStorage API is supported");
                sessionStorage.clear();

                let sendBeaconCalled = 0;
                this.hookSendBeacon((url: string) => {
                    sendBeaconCalled += 1;
                    return true;
                });
                const sender = new Sender();
                const cr = new AppInsightsCore();

                sender.initialize({
                    instrumentationKey: "abc",
                    extensionConfig: {
                        [sender.identifier]: {
                            disableXhr: true,
                            disableSendBeaconSplit: false
                        }
                    }
                    
                }, cr, []);
                this.onDone(() => {
                    sender.teardown();
                });

                const telemetryItem: ITelemetryItem = {
                    name: "item",
                    iKey: "iKey",
                    baseType: "type",
                    baseData: {}
                };


                let buffer = sender._buffer;

                QUnit.assert.ok(isBeaconApiSupported(), "Beacon API is supported");
                QUnit.assert.equal(0, sendBeaconCalled, "Beacon API was not called before");
                QUnit.assert.equal(0, this._getXhrRequests().length, "xhr sender was not called before");
                QUnit.assert.equal(0, buffer.getItems().length, "sender buffer should be clear");
                QUnit.assert.equal(false, fetchstub.called, "fetch sender is not called before");

                try {
                    sender.processTelemetry(telemetryItem, null);
                    QUnit.assert.equal(1, buffer.getItems().length, "sender buffer should have one payload");
                    let bufferItems = JSON.parse(sessionStorage.getItem(BUFFER_KEY) as any);
                    QUnit.assert.equal(bufferItems.length, 1, "sender buffer should have one payload");
                    let sentItems = JSON.parse(sessionStorage.getItem(SENT_BUFFER_KEY) as any);
                    QUnit.assert.equal(0, sentItems.length, "sent buffer should have zero payload");
                    sender.onunloadFlush();
                } catch(e) {
                    QUnit.assert.ok(false);
                }
                this.clock.tick(5);

                QUnit.assert.equal(0, sendBeaconCalled, "Beacon API should be not called");
                QUnit.assert.equal(0, this._getXhrRequests().length, "xhr sender should not be called");
                QUnit.assert.equal(true, fetchstub.calledOnce, "fetch sender is called once");
                QUnit.assert.equal(0, buffer.getItems().length, "sender buffer should not have one payload");
                QUnit.assert.equal(0, buffer.count(), "sender buffer should not have any payload");
                let bufferItems = JSON.parse(sessionStorage.getItem(BUFFER_KEY) as any);
                QUnit.assert.equal(bufferItems.length, 0, "sender buffer should be clear payload");
                let sentItems = JSON.parse(sessionStorage.getItem(SENT_BUFFER_KEY) as any);
                QUnit.assert.equal(0, sentItems.length, "sent buffer should have one payload test1");

                let setItemCalled = 0;
                let args = sessionSpy.args;
                let itemCount = 0;
                args.forEach((arg) => {
                    if (arg && arg[0] === SENT_BUFFER_KEY) {
                        let data = JSON.parse(arg[1]);
                        let cnt = data.length;
                        if(data && cnt) {
                            setItemCalled ++;
                            itemCount += cnt;
                        }
                    }
                });
                QUnit.assert.equal(1, setItemCalled, "sent buffer session should have be called once");
                QUnit.assert.equal(1, itemCount, "sent buffer session should have be called once with one item");

                (window as any).XMLHttpRequest = fakeXMLHttpRequest;
                sessionStorage.clear();
                
            }
        });

        this.testCase({
            name: "fetchKeepAliveSender should only trigger fetch once during unload.",
            useFakeTimers: true,
            test: () => {
                let window = getWindow();
                let fakeXMLHttpRequest = (window as any).XMLHttpRequest;
                let sessionStorage = window.sessionStorage;
                QUnit.assert.ok(sessionStorage, "sessionStorage API is supported");
                sessionStorage.clear();

                let sendBeaconCalled = 0;
                this.hookSendBeacon((url: string) => {
                    sendBeaconCalled += 1;
                    return true;
                });
                let fetchCalls = this.hookFetch((resolve) => {
                    setTimeout(function() {
                        resolve();
                    }, 0);
                });

                const sender = new Sender();
                const cr = new AppInsightsCore();

                sender.initialize({
                    instrumentationKey: "abc",
                    extensionConfig: {
                        [sender.identifier]: {
                            disableXhr: true,
                            disableSendBeaconSplit: false
                        }
                    }
                    
                }, cr, []);
                this.onDone(() => {
                    sender.teardown();
                });

                const telemetryItem: ITelemetryItem = {
                    name: "item",
                    iKey: "iKey",
                    baseType: "type",
                    baseData: {}
                };


                let buffer = sender._buffer;

                QUnit.assert.ok(isBeaconApiSupported(), "Beacon API is supported");
                QUnit.assert.equal(0, sendBeaconCalled, "Beacon API was not called before");
                QUnit.assert.equal(0, this._getXhrRequests().length, "xhr sender was not called before");
                QUnit.assert.equal(0, buffer.getItems().length, "sender buffer should be clear");
                QUnit.assert.equal(0, fetchCalls.length, "fetch calls should not be called before");

                try {
                    sender.processTelemetry(telemetryItem, null);
                    QUnit.assert.equal(1, buffer.getItems().length, "sender buffer should have one payload");
                    let bufferItems = JSON.parse(sessionStorage.getItem(BUFFER_KEY) as any);
                    QUnit.assert.equal(bufferItems.length, 1, "sender buffer should have one payload");
                    let sentItems = JSON.parse(sessionStorage.getItem(SENT_BUFFER_KEY) as any);
                    QUnit.assert.equal(0, sentItems.length, "sent buffer should have zero payload");
                    sender.onunloadFlush();
                } catch(e) {
                    QUnit.assert.ok(false);
                }
                this.clock.tick(5);

                QUnit.assert.equal(0, sendBeaconCalled, "Beacon API should be not called");
                QUnit.assert.equal(1, fetchCalls.length, "fetch calls should be called only once");
                QUnit.assert.equal(0, this._getXhrRequests().length, "xhr sender should not be called");
                QUnit.assert.equal(0, buffer.getItems().length, "sender buffer should not have one payload");
                QUnit.assert.equal(0, buffer.count(), "sender buffer should not have any payload");
                let bufferItems = JSON.parse(sessionStorage.getItem(BUFFER_KEY) as any);
                QUnit.assert.equal(bufferItems.length, 0, "sender buffer should be clear payload");
                let sentItems = JSON.parse(sessionStorage.getItem(SENT_BUFFER_KEY) as any);
                QUnit.assert.equal(0, sentItems.length, "sent buffer should not have one payload");


                (window as any).XMLHttpRequest = fakeXMLHttpRequest;
                sessionStorage.clear();
                
            }
        });

        this.testCase({
            name: "Onunloadflush: send payloads with fetch.",
            test: () => {
                let window = getWindow();
                let fetchstub = this.sandbox.stub((window as any), "fetch");
                let fakeXMLHttpRequest = (window as any).XMLHttpRequest;
                let sessionStorage = window.sessionStorage;
                let sessionSpy = this.sandbox.spy(sessionStorage,"setItem");
                QUnit.assert.ok(sessionStorage, "sessionStorage API is supported");
                sessionStorage.clear();

                let sendBeaconCalled = 0;
                this.hookSendBeacon((url: string) => {
                    sendBeaconCalled += 1;
                    return true;
                });

                const sender = new Sender();
                const cr = new AppInsightsCore();

                sender.initialize({
                    instrumentationKey: "abc",
                    extensionConfig: {
                        [sender.identifier]: {
                            onunloadDisableFetch: false,
                            disableXhr: true,
                            disableSendBeaconSplit: false
                            // to make sure beacon is used
                        }
                    }

                }, cr, []);
                this.onDone(() => {
                    sender.teardown();
                });

                const telemetryItem: ITelemetryItem = {
                    name: "large item",
                    iKey: "iKey",
                    baseType: "type",
                    baseData: {
                        name: "large item"

                    }
                };

                const telemetryItem1: ITelemetryItem = {
                    name: "smell item",
                    iKey: "iKey",
                    baseType: "type",
                    baseData: {
                        name: "small item"

                    }
                };


                let buffer = sender._buffer;

                QUnit.assert.ok(isBeaconApiSupported(), "Beacon API is supported");
                QUnit.assert.equal(0, sendBeaconCalled, "Beacon API was not called before");
                QUnit.assert.equal(0, this._getXhrRequests().length, "xhr sender was not called before");
                QUnit.assert.equal(0, buffer.getItems().length, "sender buffer should be clear");

                try {
                    sender.processTelemetry(telemetryItem, null);
                    sender.processTelemetry(telemetryItem1, null);
                    QUnit.assert.equal(2, buffer.getItems().length, "sender buffer should have two payload");
                    let bufferItems = JSON.parse(sessionStorage.getItem(BUFFER_KEY) as any);
                    QUnit.assert.equal(bufferItems.length, 2, "sender buffer should have two payload");
                    let sentItems = JSON.parse(sessionStorage.getItem(SENT_BUFFER_KEY) as any);
                    QUnit.assert.equal(0, sentItems.length, "sent buffer should have zero payload");
                    sender.onunloadFlush();
                } catch(e) {
                    QUnit.assert.ok(false);
                }

                QUnit.assert.equal(0, sendBeaconCalled, "Beacon API should not be called");
                QUnit.assert.equal(0, this._getXhrRequests().length, "xhr sender should not be called");
                QUnit.assert.equal(true, fetchstub.called, "fetch sender is called");
                QUnit.assert.equal(0, buffer.getItems().length, "sender buffer should not have one payload");
                QUnit.assert.equal(0, buffer.count(), "sender buffer should not have any payload");
                let bufferItems = JSON.parse(sessionStorage.getItem(BUFFER_KEY) as any);
                QUnit.assert.equal(bufferItems.length, 0, "sender buffer should be clear payload");
                let sentItems = JSON.parse(sessionStorage.getItem(SENT_BUFFER_KEY) as any);
                QUnit.assert.equal(0, sentItems.length, "sent buffer should have no payload left");

                let setItemCalled = 0;
                let itemCount = 0;
                let args = sessionSpy.args;
                args.forEach((arg) => {
                    if (arg && arg[0] === SENT_BUFFER_KEY) {
                        let data = JSON.parse(arg[1]);
                        let cnt = data.length;
                        if(data && cnt) {
                            setItemCalled ++;
                            itemCount += cnt;
                        }
                    }
                });
                QUnit.assert.equal(1, setItemCalled, "sent buffer session should have be called once");
                QUnit.assert.equal(2, itemCount, "sent buffer session should have be called once with two item");

                (window as any).XMLHttpRequest = fakeXMLHttpRequest;
                sessionStorage.clear();

            }
        });

        this.testCase({
            name: "Onunloadflush: send payloads with beacon.",
            test: () => {
                let window = getWindow();
                let fetchstub = this.sandbox.stub((window as any), "fetch");
                let fakeXMLHttpRequest = (window as any).XMLHttpRequest;
                let sessionStorage = window.sessionStorage;
                QUnit.assert.ok(sessionStorage, "sessionStorage API is supported");
                sessionStorage.clear();

                let sendBeaconCalled = 0;
                this.hookSendBeacon((url: string) => {
                    sendBeaconCalled += 1;
                    return false;
                });

                const sender = new Sender();
                const cr = new AppInsightsCore();

                sender.initialize({
                    instrumentationKey: "abc",
                    extensionConfig: {
                        [sender.identifier]: {
                            onunloadDisableFetch: true,
                            disableXhr: true,
                            disableSendBeaconSplit: false
                            // to make sure beacon is used
                        }
                    }

                }, cr, []);
                this.onDone(() => {
                    sender.teardown();
                });

                const telemetryItem: ITelemetryItem = {
                    name: "small item",
                    iKey: "iKey",
                    baseType: "type",
                    baseData: {
                        name: "small item"
                    }
                };

                const telemetryItem1: ITelemetryItem = {
                    name: "large item",
                    iKey: "iKey",
                    baseType: "type",
                    baseData: {
                        name: "large item"
                    }
                };


                let buffer = sender._buffer;

                QUnit.assert.ok(isBeaconApiSupported(), "Beacon API is supported");
                QUnit.assert.equal(0, sendBeaconCalled, "Beacon API was not called before");
                QUnit.assert.equal(0, this._getXhrRequests().length, "xhr sender was not called before");
                QUnit.assert.equal(0, buffer.getItems().length, "sender buffer should be clear");

                try {
                    sender.processTelemetry(telemetryItem, null);
                    sender.processTelemetry(telemetryItem1, null);
                    QUnit.assert.equal(2, buffer.getItems().length, "sender buffer should have two payload");
                    let bufferItems = JSON.parse(sessionStorage.getItem(BUFFER_KEY) as any);
                    QUnit.assert.equal(bufferItems.length, 2, "sender buffer should have two payload");
                    let sentItems = JSON.parse(sessionStorage.getItem(SENT_BUFFER_KEY) as any);
                    QUnit.assert.equal(0, sentItems.length, "sent buffer should have zero payload");
                    sender.onunloadFlush();
                } catch(e) {
                    QUnit.assert.ok(false);
                }

                QUnit.assert.equal(3, sendBeaconCalled, "Beacon API should be called");
                QUnit.assert.equal(1, this._getXhrRequests().length, "xhr sender should not be called");
                QUnit.assert.equal(false, fetchstub.called, "fetch sender is called");
                QUnit.assert.equal(0, buffer.getItems().length, "sender buffer should not have one payload");
                QUnit.assert.equal(0, buffer.count(), "sender buffer should not have any payload");
                let bufferItems = JSON.parse(sessionStorage.getItem(BUFFER_KEY) as any);
                QUnit.assert.equal(bufferItems.length, 0, "sender buffer should be clear payload");
                let sentItems = JSON.parse(sessionStorage.getItem(SENT_BUFFER_KEY) as any);
                QUnit.assert.equal(2, sentItems.length, "sent buffer should not have two payload");

                (window as any).XMLHttpRequest = fakeXMLHttpRequest;
                sessionStorage.clear();

            }
        });


        this.testCase({
            name: 'FetchAPI is used when isBeaconApiDisabled flag is true and disableXhr flag is true , use fetch sender.',
            test: () => {
                let window = getWindow();
                let fakeXMLHttpRequest = (window as any).XMLHttpRequest;
                let fetchstub = this.sandbox.stub((window as any), "fetch");

                let sendBeaconCalled = false;
                this.hookSendBeacon((url: string) => {
                    sendBeaconCalled = true;
                    return false;
                });

                const sender = new Sender();
                const cr = new AppInsightsCore();

                sender.initialize({
                    instrumentationKey: 'abc',
                    isBeaconApiDisabled: true,
                    disableXhr: true
                }, cr, []);
                this.onDone(() => {
                    sender.teardown();
                });

                const telemetryItem: ITelemetryItem = {
                    name: 'fake item',
                    iKey: 'iKey',
                    baseType: 'some type',
                    baseData: {}
                };

                QUnit.assert.ok(isBeaconApiSupported(), "Beacon API is supported");
                QUnit.assert.equal(false, sendBeaconCalled, "Beacon API was not called before");
                QUnit.assert.equal(0, this._getXhrRequests().length, "xhr sender was not called before");

                try {
                    sender.processTelemetry(telemetryItem, null);
                    sender.flush();
                } catch(e) {
                    QUnit.assert.ok(false);
                }

                QUnit.assert.equal(false, sendBeaconCalled, "Beacon API is disabled, Beacon API is not called");
                QUnit.assert.equal(0, this._getXhrRequests().length, "xhr sender is not called");
                QUnit.assert.ok(fetchstub.called, "fetch sender is called");
                // store it back
                (window as any).XMLHttpRequest = fakeXMLHttpRequest;
            }
        });

        this.testCase({
            name: 'FetchAPI is used when isBeaconApiDisabled flag is true and XMLHttpRequest is not supported, use fetch sender.',
            test: () => {
                let window = getWindow();
                let fakeXMLHttpRequest = (window as any).XMLHttpRequest;
                (window as any).XMLHttpRequest = undefined;
                let fetchstub = this.sandbox.stub((window as any), "fetch");

                let sendBeaconCalled = false;
                this.hookSendBeacon((url: string) => {
                    sendBeaconCalled = true;
                    return false;
                });

                const sender = new Sender();
                const cr = new AppInsightsCore();

                sender.initialize({
                    instrumentationKey: 'abc',
                    isBeaconApiDisabled: true
                }, cr, []);
                this.onDone(() => {
                    sender.teardown();
                });

                const telemetryItem: ITelemetryItem = {
                    name: 'fake item',
                    iKey: 'iKey',
                    baseType: 'some type',
                    baseData: {}
                };

                QUnit.assert.ok(isBeaconApiSupported(), "Beacon API is supported");
                QUnit.assert.equal(false, sendBeaconCalled, "Beacon API was not called before");
                QUnit.assert.equal(0, this._getXhrRequests().length, "xhr sender was not called before");

                try {
                    sender.processTelemetry(telemetryItem, null);
                    sender.flush();
                } catch(e) {
                    QUnit.assert.ok(false);
                }

                QUnit.assert.equal(false, sendBeaconCalled, "Beacon API is disabled, Beacon API is not called");
                QUnit.assert.equal(0, this._getXhrRequests().length, "xhr sender is not called");
                QUnit.assert.ok(fetchstub.called, "fetch sender is called");
                // store it back
                (window as any).XMLHttpRequest = fakeXMLHttpRequest;
            }
        });

        this.testCase({
            name: 'Users are not allowed to add customHeaders when endpointUrl is Breeze.',
            test: () => {
                let sendBeaconCalled = false;
                this.hookSendBeacon((url: string) => {
                    sendBeaconCalled = true;
                    return true;
                });

                const sender = new Sender();
                const cr = new AppInsightsCore();

                sender.initialize({
                    instrumentationKey: 'abc',
                    isBeaconApiDisabled: true,
                    customHeaders: [
                        {
                            header: 'testHeader',
                            value: 'testValue'
                        }
                    ]
                }, cr, []);
                this.onDone(() => {
                    sender.teardown();
                });

                const telemetryItem: ITelemetryItem = {
                    name: 'fake item',
                    iKey: 'iKey',
                    baseType: 'some type',
                    baseData: {}
                };

                try {
                    sender.processTelemetry(telemetryItem, null);
                    sender.flush();
                } catch(e) {
                    QUnit.assert.ok(false);
                }

                QUnit.assert.equal(1, this._getXhrRequests().length, "xhr sender is called");
                QUnit.assert.notOk(this._getXhrRequests()[0].requestHeaders.hasOwnProperty('testHeader'));
            }
        });

        this.testCase({
            name: 'Users are allowed to add customHeaders when endpointUrl is not Breeze.',
            test: () => {
                let sendBeaconCalled = false;
                this.hookSendBeacon((url: string) => {
                    sendBeaconCalled = true;
                    return true;
                });

                const sender = new Sender();
                const cr = new AppInsightsCore();

                sender.initialize({
                    instrumentationKey: 'abc',
                    isBeaconApiDisabled: true,
                    endpointUrl: 'https://example.com',
                    customHeaders: [
                        {
                            header: 'testHeader',
                            value: 'testValue'
                        }
                    ]
                }, cr, []);
                this.onDone(() => {
                    sender.teardown();
                });

                const telemetryItem: ITelemetryItem = {
                    name: 'fake item',
                    iKey: 'iKey',
                    baseType: 'some type',
                    baseData: {}
                };

                try {
                    sender.processTelemetry(telemetryItem, null);
                    sender.flush();
                } catch(e) {
                    QUnit.assert.ok(false);
                }

                QUnit.assert.equal(1, this._getXhrRequests().length, "xhr sender is called");
                QUnit.assert.ok(this._getXhrRequests()[0].requestHeaders.hasOwnProperty('testHeader'));
                QUnit.assert.equal(this._getXhrRequests()[0].requestHeaders.testHeader, 'testValue');
            }
        });

        this.testCase({
            name: 'Users are allowed to add customHeaders via addHeader method.',
            test: () => {
                let sendBeaconCalled = false;
                this.hookSendBeacon((url: string) => {
                    sendBeaconCalled = true;
                    return true;
                });

                const sender = new Sender();
                const cr = new AppInsightsCore();

                sender.addHeader('testHeader', 'testValue');

                sender.initialize({
                    instrumentationKey: 'abc',
                    isBeaconApiDisabled: true
                }, cr, []);
                this.onDone(() => {
                    sender.teardown();
                });

                const telemetryItem: ITelemetryItem = {
                    name: 'fake item',
                    iKey: 'iKey',
                    baseType: 'some type',
                    baseData: {}
                };

                try {
                    sender.processTelemetry(telemetryItem, null);
                    sender.flush();
                } catch(e) {
                    QUnit.assert.ok(false);
                }

                QUnit.assert.equal(1, this._getXhrRequests().length, "xhr sender is called");
                QUnit.assert.ok(this._getXhrRequests()[0].requestHeaders.hasOwnProperty('testHeader'));
                QUnit.assert.equal(this._getXhrRequests()[0].requestHeaders.testHeader, 'testValue');
            }
        });

        this.testCase({
            name: "AppInsightsTests: AppInsights Envelope created for Custom Event",
            test: () => {
                const inputEnvelope: ITelemetryItem = {
                    name: "test",
                    time: new Date("2018-06-12").toISOString(),
                    iKey: "iKey",
                    ext: {
                        app: {
                            sesId: "d041d2e5fa834b4f9eee41ac163bf402"
                        },
                        device: {
                            deviceClass: "Browser",
                            localId: "browser"
                        },
                        os: {
                            osVer: "Windows11"
                        }
                    },
                    tags: [{"ai.internal.sdkVersion": "javascript:2.5.1"}],
                    data: {
                        "property1": "val1",
                        "measurement1": 50.0,
                        "measurement2": 1.3,
                        "property2": "val2"
                    },
                    baseData: {
                        "name": "Event Name"
                    }
                };
                const appInsightsEnvelope = Sender.constructEnvelope(inputEnvelope, this._instrumentationKey, safeGetLogger(null));

                const baseData = appInsightsEnvelope.data.baseData;

                // Assert measurements
                const resultMeasurements = baseData.measurements;
                QUnit.assert.ok(resultMeasurements);
                QUnit.assert.ok(resultMeasurements["measurement1"]);
                QUnit.assert.equal(50.0, resultMeasurements["measurement1"]);
                QUnit.assert.ok(resultMeasurements["measurement2"]);
                QUnit.assert.equal(1.3, resultMeasurements["measurement2"]);

                // Assert custom properties
                QUnit.assert.ok(baseData.properties);
                QUnit.assert.equal("val1", baseData.properties["property1"]);
                QUnit.assert.equal("val2", baseData.properties["property2"]);

                // Assert Event name
                QUnit.assert.ok(baseData.name);
                QUnit.assert.equal("Event Name", baseData.name);

                // Assert ver
                QUnit.assert.ok(baseData.ver);
                QUnit.assert.equal(2, baseData.ver);

                // Assert baseType added by default
                QUnit.assert.ok(appInsightsEnvelope.data.baseType);
                QUnit.assert.equal("EventData", appInsightsEnvelope.data.baseType);

                // Assert tags
                QUnit.assert.ok(appInsightsEnvelope.tags);
                QUnit.assert.equal("d041d2e5fa834b4f9eee41ac163bf402", appInsightsEnvelope.tags["ai.session.id"]);
                QUnit.assert.equal("browser", appInsightsEnvelope.tags["ai.device.id"]);
                QUnit.assert.equal("browser", appInsightsEnvelope.tags["ai.device.id"]);
                QUnit.assert.equal("Windows11", appInsightsEnvelope.tags["ai.device.osVersion"]);

                QUnit.assert.equal("Browser", appInsightsEnvelope.tags["ai.device.type"]);
                QUnit.assert.equal("javascript:2.5.1", appInsightsEnvelope.tags["ai.internal.sdkVersion"]);

                // Assert name
                QUnit.assert.ok(appInsightsEnvelope.name);
                QUnit.assert.equal("Microsoft.ApplicationInsights.iKey.Event", appInsightsEnvelope.name);

                // Assert iKey
                QUnit.assert.ok(appInsightsEnvelope.iKey);
                QUnit.assert.equal("iKey", appInsightsEnvelope.iKey);

                // Assert timestamp
                QUnit.assert.ok(appInsightsEnvelope.time);
            }
        });

        this.testCase({
            name: "AppInsightsTests: AppInsights Envelope use default config iKey when iKey of ItelemetryItem is empty",
            test: () => {
                const inputEnvelope: ITelemetryItem = {
                    name: "test",
                    iKey: "",
                    ext: {},
                    data: { "property1": "val1"},
                    baseData: {
                        "name": "Event Name"
                    }
                };
                const appInsightsEnvelope = Sender.constructEnvelope(inputEnvelope, this._instrumentationKey, null);

                const baseData = appInsightsEnvelope.data.baseData;

                // Assert Event name
                QUnit.assert.ok(baseData.name);
                QUnit.assert.equal("Event Name", baseData.name);

                // Assert name
                QUnit.assert.ok(appInsightsEnvelope.name);
                QUnit.assert.equal("Microsoft.ApplicationInsights.iKey.Event", appInsightsEnvelope.name);

                // Assert iKey
                QUnit.assert.ok(appInsightsEnvelope.iKey);
                QUnit.assert.equal( this._instrumentationKey, appInsightsEnvelope.iKey, "default config iKey is not set");
            }
        });

        this.testCase({
            name: "AppInsightsTests: AppInsights Envelope  unknown type returns custom Event data type",
            test: () => {
                const inputEnvelope: ITelemetryItem = {
                    name: "test",
                    time: new Date("2018-06-12").toISOString(),
                    iKey: "iKey",
                    ext: {
                        "ai.session.id": "d041d2e5fa834b4f9eee41ac163bf402",
                        "ai.device.id": "browser",
                        "ai.device.type": "Browser",
                    },
                    tags: [{}],
                    data: {
                        "property1": "val1",
                        "measurement1": 50.0,
                        "measurement2": 1.3,
                        "property2": "val2"
                    },
                    baseType: "PageUnloadData",
                    baseData: {
                        id: "EADE2F09-DEBA-4B60-A222-E1D80BB8AA7F",
                        vpHeight: 1002,
                        vScrollOffset: 292
                    }
                };
                const appInsightsEnvelope = Sender.constructEnvelope(inputEnvelope, this._instrumentationKey, null);
                const baseData = appInsightsEnvelope.data.baseData;

                // Assert measurements
                const resultMeasurements = baseData.measurements;
                QUnit.assert.ok(resultMeasurements);
                QUnit.assert.ok(resultMeasurements["measurement1"]);
                QUnit.assert.equal(50.0, resultMeasurements["measurement1"]);
                QUnit.assert.ok(resultMeasurements["measurement2"]);
                QUnit.assert.equal(1.3, resultMeasurements["measurement2"]);
                QUnit.assert.ok(resultMeasurements["vpHeight"]);
                QUnit.assert.equal(1002, resultMeasurements["vpHeight"]);
                QUnit.assert.ok(resultMeasurements["vScrollOffset"]);
                QUnit.assert.equal(292, resultMeasurements["vScrollOffset"]);

                // Assert custom properties
                QUnit.assert.ok(baseData.properties);
                QUnit.assert.equal("val1", baseData.properties["property1"]);
                QUnit.assert.equal("val2", baseData.properties["property2"]);
                QUnit.assert.equal("EADE2F09-DEBA-4B60-A222-E1D80BB8AA7F", baseData.properties["id"]);

                // Assert Event name
                QUnit.assert.ok(baseData.name);
                QUnit.assert.equal("PageUnloadData", baseData.properties['baseTypeSource']);

                // Assert ver
                QUnit.assert.ok(baseData.ver);
                QUnit.assert.equal(2, baseData.ver);

                QUnit.assert.equal(`javascript:${EnvelopeCreator.Version}`, appInsightsEnvelope.tags["ai.internal.sdkVersion"]);
            }
        })

        this.testCase({
            name: "AppInsightsTests: AppInsights Envelope create for Dependency Data",
            test: () => {
                // setup
                const inputEnvelope: ITelemetryItem = {
                    name: "test",
                    time: new Date("2018-06-12").toISOString(),
                    iKey: "iKey",
                    ext: {
                        "user" : {
                            "localId": "TestId",
                            "authId": "AuthenticatedId",
                            "id": "TestId"
                        }
                    },
                    tags: [{"ai.user.accountId": "TestAccountId"},
                           {"ai.location.ip": "10.22.8.2"}],
                    baseType: "RemoteDependencyData",
                    baseData: {
                        id: 'some id',
                        name: "Some name given",
                        success: true,
                        responseCode: 200,
                        duration: 123,
                        type: 'Fetch',
                        data: 'some data',
                        target: 'https://example.com/test/name?q=bar',
                        correlationContext: "cid-v1:foo"
                    },
                    data: {
                        property1: "val1",
                        property2: "val2",
                        measurement1: 50.0,
                        measurement2: 1.3
                    }

                }

                // act
                const appInsightsEnvelope = Sender.constructEnvelope(inputEnvelope, this._instrumentationKey, null);
                const { baseData } = appInsightsEnvelope.data;

                // assert
                const resultDuration = baseData.duration;
                QUnit.assert.equal("00:00:00.123", resultDuration);

                // Assert measurements
                const resultMeasurements = baseData.measurements;
                QUnit.assert.ok(resultMeasurements);
                QUnit.assert.ok(resultMeasurements["measurement1"]);
                QUnit.assert.equal(50.0, resultMeasurements["measurement1"]);
                QUnit.assert.ok(resultMeasurements["measurement2"]);
                QUnit.assert.equal(1.3, resultMeasurements["measurement2"]);
                QUnit.assert.ok(!resultMeasurements.duration, "duration is not supposed to be treated as measurement");

                // Assert custom properties
                QUnit.assert.ok(baseData.properties);
                QUnit.assert.equal("val1", baseData.properties["property1"]);
                QUnit.assert.equal("val2", baseData.properties["property2"]);

                // Assert baseData
                QUnit.assert.ok(baseData.name);
                QUnit.assert.equal("Some name given", baseData.data);
                QUnit.assert.equal("some id", baseData.id);
                QUnit.assert.equal(true, baseData.success);
                QUnit.assert.equal(200, baseData.resultCode);
                QUnit.assert.equal("Some name given", baseData.name);
                QUnit.assert.equal("example.com | cid-v1:foo", baseData.target);

                // Assert ver
                QUnit.assert.ok(baseData.ver);
                QUnit.assert.equal(2, baseData.ver);

                // Assert baseType
                QUnit.assert.ok(appInsightsEnvelope.data.baseType);
                QUnit.assert.equal("RemoteDependencyData", appInsightsEnvelope.data.baseType);

                // Assert tags
                QUnit.assert.ok(appInsightsEnvelope.tags);
                QUnit.assert.equal("TestAccountId", appInsightsEnvelope.tags["ai.user.accountId"]);
                QUnit.assert.equal("10.22.8.2", appInsightsEnvelope.tags["ai.location.ip"]);

                QUnit.assert.equal("AuthenticatedId", appInsightsEnvelope.tags["ai.user.authUserId"]);
                QUnit.assert.equal("TestId", appInsightsEnvelope.tags["ai.user.id"]);

                // Assert name
                QUnit.assert.ok(appInsightsEnvelope.name);
                QUnit.assert.equal("Microsoft.ApplicationInsights.iKey.RemoteDependency", appInsightsEnvelope.name);

                // Assert iKey
                QUnit.assert.ok(appInsightsEnvelope.iKey);
                QUnit.assert.equal("iKey", appInsightsEnvelope.iKey);

                // Assert timestamp
                QUnit.assert.ok(appInsightsEnvelope.time);
            }
        });

        this.testCase({
            name: "AppInsightsTests: When name is not provided, it is obtained from hostname",
            test: () => {
                // setup
                const inputEnvelope: ITelemetryItem = {
                    name: "test",
                    time: new Date("2018-06-12").toISOString(),
                    iKey: "iKey",
                    ext: {
                        "user" : {
                            "localId": "TestId",
                            "authId": "AuthenticatedId",
                            "id": "TestId"
                        }
                    },
                    tags: [{"ai.user.accountId": "TestAccountId"},
                           {"ai.location.ip": "10.22.8.2"}, {"ai.internal.sdkVersion": "1234"}],
                    baseType: "RemoteDependencyData",
                    baseData: {
                        id: 'some id',
                        success: true,
                        responseCode: 200,
                        duration: 123,
                        type: 'Fetch',
                        data: 'some data',
                        target: 'https://example.com/test/name'
                    },
                    data: {
                        property1: "val1",
                        property2: "val2",
                        measurement1: 50.0,
                        measurement2: 1.3
                    }

                }

                // act
                const appInsightsEnvelope = Sender.constructEnvelope(inputEnvelope, this._instrumentationKey, null);
                const { baseData } = appInsightsEnvelope.data;

                // Assert baseData
                QUnit.assert.ok(baseData.name);
                QUnit.assert.equal("GET /test/name", baseData.name); // retrieved from target
                QUnit.assert.equal("/test/name", baseData.data);

                // Assert sdkVersion
                QUnit.assert.equal("1234", appInsightsEnvelope.tags["ai.internal.sdkVersion"])
            }
        });

        this.testCase({
            name: "AppInsightsTests: AppInsights Envelope created for Page View",
            test: () => {
                // setup
                const inputEnvelope: ITelemetryItem = {
                    name: "test",
                    time: new Date("2018-06-12").toISOString(),
                    iKey: "iKey",
                    ext: {
                        "user": {
                            "localId": "TestId",
                            "authId": "AuthenticatedId",
                            "id": "TestId"
                        },
                        "trace": {
                            "traceID": "1528B5FF-6455-4657-BE77-E6664CAC72DC",
                            "parentID": "1528B5FF-6455-4657-BE77-E6664CACEEEE"
                        }
                    },
                    tags: [{"ai.user.accountId": "TestAccountId"}],
                    baseType: "PageviewData",
                    baseData: {
                        "name": "Page View Name",
                        "uri": "https://fakeUri.com",
                        properties: {
                            "property1": "val1",
                            "property2": "val2",
                            "duration": 300000
                        },
                        measurements: {
                            "measurement1": 50.0,
                            "measurement2": 1.3,
                        }
                    },
                    data: {
                        "property3": "val3",
                        "measurement3": 1000
                    }
                };

                // Act
                const appInsightsEnvelope = Sender.constructEnvelope(inputEnvelope, this._instrumentationKey, null);
                const baseData = appInsightsEnvelope.data.baseData;

                // Assert duration
                const resultDuration = baseData.duration;
                QUnit.assert.equal("00:05:00.000", resultDuration);

                // Assert measurements
                const resultMeasurements = baseData.measurements;
                const  props = baseData.properties;
                QUnit.assert.ok(resultMeasurements);
                QUnit.assert.ok(resultMeasurements["measurement1"]);
                QUnit.assert.equal(50.0, resultMeasurements["measurement1"]);
                QUnit.assert.ok(resultMeasurements["measurement2"]);
                QUnit.assert.equal(1.3, resultMeasurements["measurement2"]);
                QUnit.assert.ok(!resultMeasurements.duration, "duration is not supposed to be treated as property in envelope");

                // Assert custom properties
                QUnit.assert.ok(baseData.properties);
                QUnit.assert.equal("val1", baseData.properties["property1"]);
                QUnit.assert.equal("val2", baseData.properties["property2"]);

                // Assert deprecated data custom properties/measurements
                QUnit.assert.equal("val3", baseData.properties["property3"])
                QUnit.assert.equal(1000, baseData.measurements["measurement3"]);

                // Assert Page View name
                QUnit.assert.ok(baseData.name);
                QUnit.assert.equal("Page View Name", baseData.name);


                // Assert ver
                QUnit.assert.ok(baseData.ver);
                QUnit.assert.equal(2, baseData.ver);

                // Assert baseType
                QUnit.assert.ok(appInsightsEnvelope.data.baseType);
                QUnit.assert.equal("PageviewData", appInsightsEnvelope.data.baseType);

                // Assert tags
                QUnit.assert.ok(appInsightsEnvelope.tags);
                QUnit.assert.equal("TestAccountId", appInsightsEnvelope.tags["ai.user.accountId"]);
                QUnit.assert.equal("AuthenticatedId", appInsightsEnvelope.tags["ai.user.authUserId"]);
                QUnit.assert.equal("TestId", appInsightsEnvelope.tags["ai.user.id"]);

                // Assert sdkVersion
                QUnit.assert.ok(EnvelopeCreator.Version)
                QUnit.assert.ok(EnvelopeCreator.Version.length > 0)
                QUnit.assert.equal(`javascript:${EnvelopeCreator.Version}`, appInsightsEnvelope.tags["ai.internal.sdkVersion"])

                // QUnit.assert.equal("d041d2e5fa834b4f9eee41ac163bf402", appInsightsEnvelope.tags["ai.session.id"]);
                // QUnit.assert.equal("browser", appInsightsEnvelope.tags["ai.device.id"]);
                // QUnit.assert.equal("Browser", appInsightsEnvelope.tags["ai.device.type"]);
                // QUnit.assert.equal("javascript:1.0.18", appInsightsEnvelope.tags["ai.internal.sdkVersion"]);

                // Assert name
                QUnit.assert.ok(appInsightsEnvelope.name);
                QUnit.assert.equal("Microsoft.ApplicationInsights.iKey.Pageview", appInsightsEnvelope.name);

                // Assert iKey
                QUnit.assert.ok(appInsightsEnvelope.iKey);
                QUnit.assert.equal("iKey", appInsightsEnvelope.iKey);

                // Assert timestamp
                QUnit.assert.ok(appInsightsEnvelope.time);


                QUnit.assert.equal("1528B5FF-6455-4657-BE77-E6664CAC72DC", appInsightsEnvelope.tags["ai.operation.id"]);
                QUnit.assert.equal("1528B5FF-6455-4657-BE77-E6664CACEEEE", appInsightsEnvelope.tags["ai.operation.parentId"])
            }
        });

        this.testCase({
            name: "AppInsightsTests: AppInsights Envelope created for Page View with duration in customProperties Part C",
            test: () => {
                // setup
                const inputEnvelope: ITelemetryItem = {
                    name: "test",
                    time: new Date("2018-06-12").toISOString(),
                    iKey: "iKey",
                    ext: {
                        "user": {
                            "localId": "TestId",
                            "authId": "AuthenticatedId",
                            "id": "TestId"
                        },
                        "trace": {
                            "traceID": "1528B5FF-6455-4657-BE77-E6664CAC72DC",
                            "parentID": "1528B5FF-6455-4657-BE77-E6664CACEEEE"
                        }
                    },
                    tags: [{"ai.user.accountId": "TestAccountId"}],
                    baseType: "PageviewData",
                    baseData: {
                        "name": "Page View Name",
                        "uri": "https://fakeUri.com",
                        properties: {
                            "property1": "val1",
                            "property2": "val2",
                        },
                        measurements: {
                            "measurement1": 50.0,
                            "measurement2": 1.3,
                        }
                    },
                    data: {
                        "duration": 300000
                    }
                };

                // Act
                const appInsightsEnvelope = Sender.constructEnvelope(inputEnvelope, this._instrumentationKey, null);
                const baseData = appInsightsEnvelope.data.baseData;

                // Assert duration
                const resultDuration = baseData.duration;
                QUnit.assert.equal("00:05:00.000", resultDuration);
            }
        });

        this.testCase({
            name: 'Envelope: custom properties are put into envelope for Exception data type',
            test: () => {
                const bd = new Exception(
                    null,
                    new Error(),
                    {"property1": "val1", "property2": "val2" },
                    {"measurement1": 50.0, "measurement2": 1.3 }
                );
                const inputEnvelope: ITelemetryItem = {
                    name: "test",
                    time: new Date("2018-06-12").toISOString(),
                    iKey: "iKey",
                    baseType: Exception.dataType,
                    baseData: bd,
                    data: {
                        "property3": "val3",
                        "measurement3": 3.0
                    },
                    ext: {
                        "user": {
                            "localId": "TestId",
                            "authId": "AuthenticatedId",
                            "id": "TestId"
                        }
                    },
                    tags: [{"user.accountId": "TestAccountId"}],
                };

                // Act
                const appInsightsEnvelope = Sender.constructEnvelope(inputEnvelope, this._instrumentationKey, null);
                const baseData = appInsightsEnvelope.data.baseData; 

                QUnit.assert.equal("val3", baseData.properties["property3"], "ExceptionData: customProperties (item.data) are added to the properties of the envelope and not included in the item.data")
                QUnit.assert.equal("val1", baseData.properties["property1"], "ExceptionData: properties (item.baseData.properties) are added to telemetry envelope");
                QUnit.assert.equal(50.0, baseData.measurements["measurement1"], "ExceptionData: measurements (item.baseData.measurements) are added to telemetry envelope");

            }
        });

        this.testCase({
            name: 'Offline watcher is listening to events',
            test: () => {
                QUnit.assert.ok(this._offline.isListening(), 'Offline is listening');
                QUnit.assert.equal(true, this._offline.isOnline(), 'Offline reports online status');
            }
        });

        this.testCase({
            name: 'Offline watcher responds to offline events (window.addEventListener)',
            useFakeTimers: true,
            test: () => {
                // Setup
                const offlineEvent = new Event('offline');
                const onlineEvent = new Event('online');

                // Verify precondition
                QUnit.assert.ok(this._offline.isListening());
                QUnit.assert.ok(this._offline.isOnline());

                // Act - Go offline
                window.dispatchEvent(offlineEvent);
                this.clock.tick(1);

                // Verify offline
                QUnit.assert.ok(!this._offline.isOnline());

                // Act - Go online
                window.dispatchEvent(onlineEvent);
                this.clock.tick(1);

                // Verify online
                QUnit.assert.ok(this._offline.isOnline());
            }
        });

        this.testCase({
            name: "AppInsightsTests: AppInsights Envelope created for Page View with new web extension",
            test: () => {
                // setup
                const inputEnvelope: ITelemetryItem = {
                    name: "test",
                    iKey: "iKey",
                    ext: {
                        "web": {
                            "domain": "www.bing.com",
                            "userConsent": true,
                            "screenRes": "1024x768",
                            "browser": "internet explorer",
                            "browserVer": "48.0",
                            "isManual": true,
                            "browserLang": "EN"
                        }
                    },
                    baseType: "PageviewData",
                    baseData: {
                        "name": "Page View Name",
                        "uri": "https://fakeUri.com",
                        "startTime": new Date(123),
                        properties: {
                            "property1": "val1",
                            "property2": "val2"
                        },
                        measurements: {
                            "measurement1": 50.0,
                        }
                    }
                };

                // Act
                const appInsightsEnvelope = Sender.constructEnvelope(inputEnvelope, this._instrumentationKey, null);
                const baseData = appInsightsEnvelope.data.baseData;

                // Assert envelope
                QUnit.assert.deepEqual(appInsightsEnvelope.time, new Date(123).toISOString());

                // Assert measurements
                const resultMeasurements = baseData.measurements;
                QUnit.assert.ok(resultMeasurements);
                QUnit.assert.ok(resultMeasurements["measurement1"]);
                QUnit.assert.equal(50.0, resultMeasurements["measurement1"]);

                // Assert custom properties
                QUnit.assert.ok(baseData.properties);
                QUnit.assert.equal("val1", baseData.properties["property1"]);
                QUnit.assert.equal("val2", baseData.properties["property2"]);
                QUnit.assert.equal("true", baseData.properties["isManual"]);
                QUnit.assert.equal("1024x768", baseData.properties["screenRes"]);
                QUnit.assert.equal("true", baseData.properties["userConsent"]);
                QUnit.assert.equal("www.bing.com", baseData.properties["domain"]);

                QUnit.assert.equal("internet explorer", appInsightsEnvelope.tags[CtxTagKeys.deviceBrowser]);
                QUnit.assert.equal("48.0", appInsightsEnvelope.tags[CtxTagKeys.deviceBrowserVersion]);
                QUnit.assert.equal("EN", appInsightsEnvelope.tags[CtxTagKeys.deviceLanguage]);

                // Assert Page View name
                QUnit.assert.ok(baseData.name);
                QUnit.assert.equal("Page View Name", baseData.name);

                // Assert ver
                QUnit.assert.ok(baseData.ver);
                QUnit.assert.equal(2, baseData.ver);

                // Assert baseType
                QUnit.assert.ok(appInsightsEnvelope.data.baseType);
                QUnit.assert.equal("PageviewData", appInsightsEnvelope.data.baseType);

                // Assert name
                QUnit.assert.ok(appInsightsEnvelope.name);
                QUnit.assert.equal("Microsoft.ApplicationInsights.iKey.Pageview", appInsightsEnvelope.name);
            }
        });

        this.testCase({
            name: "Channel Config: Notification is sent when requests are being sent when requests exceed max batch size",
            useFakeTimers: true,
            test: () => {
                let sendNotifications = [];
                let notificationManager = new NotificationManager();
                notificationManager.addNotificationListener({
                    eventsSendRequest: (sendReason: number, isAsync?: boolean) => {
                        sendNotifications.push({
                            sendReason,
                            isAsync
                        });
                    }
                });

                let core = new AppInsightsCore();
                this.sandbox.stub(core, "getNotifyMgr").returns(notificationManager);

                this._sender.initialize(
                    {
                        instrumentationKey: 'abc',
                        maxBatchInterval: 123,
                        endpointUrl: 'https://example.com',
                        maxBatchSizeInBytes: 100,
                        extensionConfig: {
                            [this._sender.identifier]: {
                                maxBatchSizeInBytes: 100
                            }
                        }

                    }, core, []
                );

                const loggerSpy = this.sandbox.spy(this._sender, "triggerSend");
                const telemetryItem: ITelemetryItem = {
                    name: 'fake item',
                    iKey: 'iKey',
                    baseType: 'some type',
                    baseData: {}
                };
                try {
                    this._sender.processTelemetry(telemetryItem, null);
                    this._sender.processTelemetry(telemetryItem, null);
                } catch(e) {
                    QUnit.assert.ok(false);
                }

                QUnit.assert.equal(true, loggerSpy.called);
                this.clock.tick(1);
                QUnit.assert.ok(sendNotifications.length === 1);
                QUnit.assert.ok(sendNotifications[0].sendReason === SendRequestReason.MaxBatchSize);
            }
        });

        this.testCase({
            name: "Channel Config: Notification is sent when requests are being sent with manual flush",
            useFakeTimers: true,
            test: () => {
                let sendNotifications = [];
                let notificationManager = new NotificationManager();
                notificationManager.addNotificationListener({
                    eventsSendRequest: (sendReason: number, isAsync?: boolean) => {
                        sendNotifications.push({
                            sendReason,
                            isAsync
                        });
                    }
                });

                let core = new AppInsightsCore();
                this.sandbox.stub(core, "getNotifyMgr").returns(notificationManager);

                this._sender.initialize(
                    {
                        instrumentationKey: 'abc',
                        maxBatchInterval: 123,
                        endpointUrl: 'https://example.com',
                        extensionConfig: {
                        }

                    }, core, []
                );

                const loggerSpy = this.sandbox.spy(this._sender, "triggerSend");
                const telemetryItem: ITelemetryItem = {
                    name: 'fake item',
                    iKey: 'iKey',
                    baseType: 'some type',
                    baseData: {}
                };
                try {
                    this._sender.processTelemetry(telemetryItem, null);
                } catch(e) {
                    QUnit.assert.ok(false);
                }

                QUnit.assert.equal(false, loggerSpy.calledOnce);
                QUnit.assert.equal(0, sendNotifications.length);

                this._sender.flush();
                QUnit.assert.equal(true, loggerSpy.calledOnce);
                QUnit.assert.equal(0, sendNotifications.length);

                this.clock.tick(1);

                QUnit.assert.equal(1, sendNotifications.length);
                QUnit.assert.equal(SendRequestReason.ManualFlush, sendNotifications[0].sendReason);
            }
        });

        this.testCase({
            name: "IKey Validation Test",
            test: () => {
                let appInsightsCore = new AppInsightsCore();
                appInsightsCore.logger = new DiagnosticLogger();
                let messageId: _eInternalMessageId = _eInternalMessageId.InvalidInstrumentationKey;
                this._sender.initialize(
                    {
                        instrumentationKey: '1aa11111-bbbb-1ccc-8ddd-eeeeffff3333',
                        maxBatchInterval: 123,
                        endpointUrl: 'https://example.com',
                        maxBatchSizeInBytes: 654,
                        extensionConfig: {
                            [this._sender.identifier]: {
                                maxBatchSizeInBytes: 456
                            }
                        }

                    }, appInsightsCore, []
                );

                QUnit.assert.equal(0, appInsightsCore.logger.queue.length, "POST: No messageId logged");
                this._sender.teardown();

                appInsightsCore = new AppInsightsCore();
                appInsightsCore.logger = new DiagnosticLogger();
                messageId = _eInternalMessageId.InvalidInstrumentationKey;
                this._sender.initialize(
                    {
                        instrumentationKey: '1aa11111bbbb1ccc8dddeeeeffff3333',
                        maxBatchInterval: 123,
                        endpointUrl: 'https://example.com',
                        maxBatchSizeInBytes: 654,
                        extensionConfig: {
                            [this._sender.identifier]: {
                                maxBatchSizeInBytes: 456
                            }
                        }

                    }, appInsightsCore, []
                );

                QUnit.assert.equal(1, appInsightsCore.logger.queue.length, "POST: Correct messageId logged");
                QUnit.assert.ok(appInsightsCore.logger.queue[0].message.indexOf('Invalid Instrumentation key') !== -1, "Correct message logged");
                QUnit.assert.equal(messageId, appInsightsCore.logger.queue[0].messageId, "Correct message logged");
                this._sender.teardown();

                appInsightsCore = new AppInsightsCore();
                appInsightsCore.logger = new DiagnosticLogger();
                messageId = _eInternalMessageId.InvalidInstrumentationKey;
                this._sender.initialize(
                    {
                        instrumentationKey: 'abc',
                        maxBatchInterval: 123,
                        endpointUrl: 'https://example.com',
                        maxBatchSizeInBytes: 654,
                        extensionConfig: {
                            [this._sender.identifier]: {
                                maxBatchSizeInBytes: 456
                            }
                        }

                    }, appInsightsCore, []
                );

                QUnit.assert.equal(1, appInsightsCore.logger.queue.length, "POST: Correct messageId logged");
                QUnit.assert.ok(appInsightsCore.logger.queue[0].message.indexOf('Invalid Instrumentation key') !== -1, "Correct message logged");
                QUnit.assert.equal(messageId, appInsightsCore.logger.queue[0].messageId, "Correct message logged");
                this._sender.teardown();

                appInsightsCore = new AppInsightsCore();
                appInsightsCore.logger = new DiagnosticLogger();
                messageId = _eInternalMessageId.InvalidInstrumentationKey;
                this._sender.initialize(
                    {
                        instrumentationKey: '',
                        maxBatchInterval: 123,
                        endpointUrl: 'https://example.com',
                        maxBatchSizeInBytes: 654,
                        extensionConfig: {
                            [this._sender.identifier]: {
                                maxBatchSizeInBytes: 456
                            }
                        }

                    }, appInsightsCore, []
                );

                QUnit.assert.equal(1, appInsightsCore.logger.queue.length, "POST: Correct messageId logged");
                QUnit.assert.ok(appInsightsCore.logger.queue[0].message.indexOf('Invalid Instrumentation key') !== -1, "Correct message logged");
                QUnit.assert.equal(messageId, appInsightsCore.logger.queue[0].messageId, "Correct message logged");
                this._sender.teardown();

                appInsightsCore = new AppInsightsCore();
                appInsightsCore.logger = new DiagnosticLogger();
                messageId = _eInternalMessageId.InvalidInstrumentationKey;
                this._sender.initialize(
                    {
                        instrumentationKey: 'abc',
                        maxBatchInterval: 123,
                        endpointUrl: 'https://example.com',
                        maxBatchSizeInBytes: 654,
                        extensionConfig: {
                            [this._sender.identifier]: {
                                maxBatchSizeInBytes: 456
                            }
                        },
                        disableInstrumentationKeyValidation: true

                    }, appInsightsCore, []
                );

                QUnit.assert.equal(0, appInsightsCore.logger.queue.length, "POST: No messageId logged");
                this._sender.teardown();
            }
        });

        this.testCase({
            name: "Channel Config: convert custom dimension undefined values to customer defined value with config convertUndefined",
            test: () => {
                const inputEnvelope: ITelemetryItem = {
                    name: "test",
                    iKey: "iKey",
                    data: {
                        "property1": undefined,
                        "property2": "value2"
                    },
                    baseData: {
                        "name": "Event Name"
                    }
                };
                const appInsightsEnvelope = Sender.constructEnvelope(inputEnvelope, this._instrumentationKey, null, "test");

                const baseData = appInsightsEnvelope.data.baseData;

                // Assert custom properties
                QUnit.assert.ok(baseData.properties);
                QUnit.assert.equal("test", baseData.properties["property1"]);
                QUnit.assert.equal("value2", baseData.properties["property2"]);
            }
        });

        this.testCase({
            name: "Channel Config: Validate pausing and resuming sending with manual flush",
            useFakeTimers: true,
            test: () => {
                let sendNotifications = [];
                let notificationManager = new NotificationManager();
                notificationManager.addNotificationListener({
                    eventsSendRequest: (sendReason: number, isAsync?: boolean) => {
                        sendNotifications.push({
                            sendReason,
                            isAsync
                        });
                    }
                });

                let core = new AppInsightsCore();
                this.sandbox.stub(core, "getNotifyMgr").returns(notificationManager);

                this._sender.initialize(
                    {
                        instrumentationKey: 'abc',
                        maxBatchInterval: 123,
                        endpointUrl: 'https://example.com',
                        extensionConfig: {
                        }

                    }, core, []
                );

                const loggerSpy = this.sandbox.spy(this._sender, "triggerSend");
                const telemetryItem: ITelemetryItem = {
                    name: 'fake item',
                    iKey: 'iKey',
                    baseType: 'some type',
                    baseData: {}
                };
                try {
                    this._sender.processTelemetry(telemetryItem, null);
                } catch(e) {
                    QUnit.assert.ok(false);
                }

                QUnit.assert.equal(false, loggerSpy.calledOnce);
                QUnit.assert.equal(0, sendNotifications.length);

                this._sender.pause();
                this._sender.flush();
                QUnit.assert.equal(false, loggerSpy.calledOnce);
                QUnit.assert.equal(0, sendNotifications.length);

                this.clock.tick(1);

                QUnit.assert.equal(0, sendNotifications.length);

                this._sender.resume();
                this._sender.flush();
                QUnit.assert.equal(true, loggerSpy.calledOnce);
                QUnit.assert.equal(0, sendNotifications.length);

                this.clock.tick(1);

                QUnit.assert.equal(1, sendNotifications.length);
                QUnit.assert.equal(SendRequestReason.ManualFlush, sendNotifications[0].sendReason);
            }
        });

        this.testCase({
            name: "Channel Config: Validate pausing and resuming sending when exceeding the batch size limits",
            useFakeTimers: true,
            test: () => {
                let sendNotifications = [];
                let notificationManager = new NotificationManager();
                notificationManager.addNotificationListener({
                    eventsSendRequest: (sendReason: number, isAsync?: boolean) => {
                        sendNotifications.push({
                            sendReason,
                            isAsync
                        });
                    }
                });

                let core = new AppInsightsCore();
                this.sandbox.stub(core, "getNotifyMgr").returns(notificationManager);

                this._sender.initialize(
                    {
                        instrumentationKey: 'abc',
                        maxBatchInterval: 123,
                        maxBatchSizeInBytes: 4096,
                        endpointUrl: 'https://example.com',
                        extensionConfig: {
                        }

                    }, core, []
                );

                const triggerSendSpy = this.sandbox.spy(this._sender, "triggerSend");
                const telemetryItem: ITelemetryItem = {
                    name: 'fake item',
                    iKey: 'iKey',
                    baseType: 'some type',
                    baseData: {}
                };

                this._sender.pause();

                // Keep sending events until the max payload size is reached
                while (!triggerSendSpy.calledOnce) {
                    try {
                        this._sender.processTelemetry(telemetryItem, null);
                    } catch(e) {
                        QUnit.assert.ok(false);
                    }
                }

                QUnit.assert.equal(true, triggerSendSpy.calledOnce);
                QUnit.assert.equal(0, sendNotifications.length);

                this.clock.tick(1);

                QUnit.assert.equal(0, sendNotifications.length);

                QUnit.assert.equal(false, triggerSendSpy.calledTwice);
                this._sender.resume();

                QUnit.assert.equal(true, triggerSendSpy.calledTwice);
                QUnit.assert.equal(0, sendNotifications.length);

                this.clock.tick(1);

                QUnit.assert.equal(1, sendNotifications.length);
                QUnit.assert.equal(SendRequestReason.MaxBatchSize, sendNotifications[0].sendReason);
            }
        });

        this.testCase({
            name: "Channel Config: Process telemetry when offline and exceeding the batch size limits",
            useFakeTimers: true,
            test: () => {
                const maxBatchSizeInBytes = 1024;
                let core = new AppInsightsCore();
                
                this._sender.initialize(
                    {
                        instrumentationKey: 'abc',
                        maxBatchInterval: 123,
                        maxBatchSizeInBytes: maxBatchSizeInBytes,
                        endpointUrl: 'https://example.com',
                        extensionConfig: {
                        }
                        
                    }, core, []
                );
                
                const triggerSendSpy = this.sandbox.spy(this._sender, "triggerSend");
                const telemetryItem: ITelemetryItem = {
                    name: 'fake item with some really long name to take up space quickly',
                    iKey: 'iKey',
                    baseType: 'some type',
                    baseData: {}
                };

                // Act - Go offline
                const offlineEvent = new Event('offline');
                window.dispatchEvent(offlineEvent);

                // Keep sending events until the max payload size is exceeded
                while (!triggerSendSpy.called && this._sender._buffer.size() < maxBatchSizeInBytes) {
                    try {
                        this._sender.processTelemetry(telemetryItem, null);
                    } catch(e) {
                        QUnit.assert.ok(false);
                    }
                }

                QUnit.assert.equal(false, triggerSendSpy.called);

                this.clock.tick(1);

                QUnit.assert.equal(false, triggerSendSpy.called);
            }
        });

        this.testCase({
            name: 'Envelope: operation.name is correctly truncated if required',
            test: () => {
                const excessiveName = new Array(1234).join("a"); // exceeds max of 1024

                const bd = new Exception(
                    null,
                    new Error(),
                    {"property1": "val1", "property2": "val2" },
                    {"measurement1": 50.0, "measurement2": 1.3 }
                );
                const inputEnvelope: ITelemetryItem = {
                    name: "test",
                    time: new Date("2018-06-12").toISOString(),
                    iKey: "iKey",
                    baseType: Exception.dataType,
                    baseData: bd,
                    data: {
                        "property3": "val3",
                        "measurement3": 3.0
                    },
                    ext: {
                        "trace": {
                            "traceID": "1528B5FF-6455-4657-BE77-E6664CAC72DC",
                            "parentID": "1528B5FF-6455-4657-BE77-E6664CACEEEE",
                            "name": excessiveName
                        }
                    },
                    tags: [
                        {"user.accountId": "TestAccountId"},
                    ],
                };

                // Act
                const appInsightsEnvelope = Sender.constructEnvelope(inputEnvelope, this._instrumentationKey, null);
                const baseData = appInsightsEnvelope.data.baseData; 

                QUnit.assert.equal("val3", baseData.properties["property3"], "ExceptionData: customProperties (item.data) are added to the properties of the envelope and not included in the item.data")
                QUnit.assert.equal("val1", baseData.properties["property1"], "ExceptionData: properties (item.baseData.properties) are added to telemetry envelope");
                QUnit.assert.equal(50.0, baseData.measurements["measurement1"], "ExceptionData: measurements (item.baseData.measurements) are added to telemetry envelope");
                QUnit.assert.equal(1024, appInsightsEnvelope.tags["ai.operation.name"].length, "The ai.operation.name should have been truncated to the maximum");
            }
        });
    }
}