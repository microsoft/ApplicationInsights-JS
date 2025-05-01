import { AITestClass, PollingAssert, TestHelper } from "@microsoft/ai-test-framework";
import { IExtendedConfiguration, AppInsightsCore, EventLatency, ITelemetryItem, IExtendedTelemetryItem, SendRequestReason, EventSendType, isFetchSupported, objKeys, arrForEach, isBeaconsSupported, EventPersistence, isNullOrUndefined, getGlobal } from '@microsoft/1ds-core-js';
import { PostChannel, IXHROverride, IPayloadData } from '../../../src/Index';
import { IPostTransmissionTelemetryItem, IChannelConfiguration } from '../../../src/DataModels';
import { SinonSpy } from 'sinon';
import { createAsyncResolvedPromise, IPromise } from "@nevware21/ts-async";
import { ActiveStatus } from "@microsoft/1ds-core-js";


interface IEventsSendRequests {
    sendReason: number;
    isAsync: boolean;
}

export function generateString(length: number): string {
    let result: string = "";

    for (let i = 0; i < length; ++i) {
      result += "a";
    }

    return result;
}

export class PostChannelTest extends AITestClass {
    private config: IExtendedConfiguration;
    private postChannel: PostChannel
    private xhrOverride: IXHROverride;
    private setTimeoutOverride: Function;
    private clearTimeoutOverride: Function;
    private genericSpy: SinonSpy;
    private core: AppInsightsCore;
    private eventsSent: Array<IExtendedTelemetryItem> = [];
    private eventsDiscarded: Array<IExtendedTelemetryItem> = [];
    private eventsSendRequests: Array<IEventsSendRequests> = [];
    private testMessage: string;
    private beaconCalls = [];
    private ctx: any;

    constructor(name?: string, emulateEs3?: boolean) {
        super(name, emulateEs3);
        
        this.assertNoEvents = true;
        this.assertNoHooks = true;
    }


    public testInitialize() {
        // Reset the cached isBeacons supported
        isBeaconsSupported(false);

        this.core = new AppInsightsCore();
        this.config = {
            instrumentationKey: 'testIkey',
            endpointUrl: 'https://testEndpoint',
            featureOptIn : {["zipPayload"]: {mode: 1}},
            extensionConfig: []
        };
        this.postChannel = new PostChannel();
        this.testMessage = "";
        this.eventsSent = [];
        this.eventsDiscarded = [];
        this.eventsSendRequests = [];
        this.xhrOverride = new AutoCompleteXhrOverride();
        this.setTimeoutOverride = (handler: Function, timeout?: number) => {
            this.testMessage = "testSetTimeout";
            setTimeout(handler, timeout ? timeout / 2 : timeout);
        };
        this.clearTimeoutOverride = (params: any) => {
            this.testMessage = "testClearTimeout";
            clearTimeout(params);
        };
        this.ctx = {};
    }

    public testFinishedCleanup(): void {
        if (this.postChannel) {
            // Stop the post channel from sending any events (after the fake server has been removed)
            this.postChannel.pause();
        }

        if (this.core && this.core.isInitialized()) {
            this.core.unload(false);
        }
        this.ctx = null;
    }

    public registerTests() {
        this.testCase({
            name: "Override configs",
            test: () => {
                this.config.extensionConfig[this.postChannel.identifier] = {
                    overrideInstrumentationKey: "overrideIkey-",
                    overrideEndpointUrl: "overrideEndpoint",
                    httpXHROverride: this.xhrOverride,
                };

                var spy = this.sandbox.spy(this.xhrOverride, 'sendPOST');
                this.core.initialize(this.config, [this.postChannel]);

                var event: IPostTransmissionTelemetryItem = {
                    name: 'testEvent',
                    sync: true
                };
                this.postChannel.processTelemetry(event);
                QUnit.assert.equal(spy.called, true);
                QUnit.assert.ok(spy.getCall(0).args[0].urlString.toString().indexOf("overrideEndpoint") > -1);
                QUnit.assert.equal(spy.getCall(0).args[0].data, "{\"name\":\"testEvent\",\"iKey\":\"o:overrideIkey\",\"data\":{\"baseData\":{}}}");
                QUnit.assert.equal(isNaN(event.timings.processTelemetryStart["PostChannel"] as number), false);
            }
        });

        this.testCase({
            name: "Override configs at the root level with a post channel configuration",
            test: () => {
                this.config.extensionConfig[this.postChannel.identifier] = {
                    httpXHROverride: this.xhrOverride
                };

                this.config["overrideInstrumentationKey"] = "overrideIkey-";
                this.config["overrideEndpointUrl"] = "overrideEndpoint";


                var spy = this.sandbox.spy(this.xhrOverride, 'sendPOST');
                this.core.initialize(this.config, [this.postChannel]);

                var event: IPostTransmissionTelemetryItem = {
                    name: 'testEvent',
                    sync: true
                };
                this.postChannel.processTelemetry(event);
                QUnit.assert.equal(spy.called, true);
                QUnit.assert.ok(spy.getCall(0).args[0].urlString.toString().indexOf("overrideEndpoint") > -1);
                QUnit.assert.equal(spy.getCall(0).args[0].data, "{\"name\":\"testEvent\",\"iKey\":\"o:overrideIkey\",\"data\":{\"baseData\":{}}}");
                QUnit.assert.equal(isNaN(event.timings.processTelemetryStart["PostChannel"] as number), false);
            }
        });

        this.testCase({
            name: "Post Channel: dynamic config defaults",
            useFakeTimers: true,
            test: () => {
                let config = this.config;
                let core = this.core;
                let postChannel = this.postChannel;
                core.initialize(config, [postChannel]);
                let identifier = postChannel.identifier;

                let undefValue: undefined;
                let expectedConfig : IChannelConfiguration = {
                    eventsLimitInMem: 10000,
                    immediateEventLimit: 500,
                    autoFlushEventsLimit: 0,
                    disableAutoBatchFlushLimit: false,
                    httpXHROverride: undefValue ,
                    overrideInstrumentationKey: undefValue,
                    overrideEndpointUrl: undefValue,
                    disableTelemetry: false,
                    ignoreMc1Ms0CookieProcessing: false,
                    setTimeoutOverride: undefValue,
                    clearTimeoutOverride: undefValue,
                    payloadPreprocessor: undefValue,
                    payloadListener: undefValue,
                    disableEventTimings: undefValue,
                    valueSanitizer: undefValue,
                    stringifyObjects: undefValue,
                    enableCompoundKey: undefValue,
                    disableOptimizeObj: false,
                    transports: undefValue,
                    unloadTransports: undefValue,
                    useSendBeacon: undefValue,
                    disableFetchKeepAlive: undefValue,
                    avoidOptions: false,
                    xhrTimeout: undefValue,
                    disableXhrSync: undefValue,
                    alwaysUseXhrOverride: false,
                    fetchCredentials: undefValue,
                    maxEventRetryAttempts: 6,
                    maxUnloadEventRetryAttempts: 2,
                    addNoResponse: undefValue,
                    excludeCsMetaData: undefValue,
                    requestLimit: {}
                };
                let actaulConfig =  postChannel["_getDbgPlgTargets"]()[1];
                QUnit.assert.deepEqual(expectedConfig, actaulConfig, "default config should be set");

                // change config with validation
                core.config.extensionConfig = core.config.extensionConfig || {};
                core.config.extensionConfig[identifier].eventsLimitInMem = -1;
                core.config.extensionConfig[identifier].maxEventRetryAttempts = "";
                core.config.extensionConfig[identifier].httpXHROverride = "";
                this.clock.tick(1);
                actaulConfig = postChannel["_getDbgPlgTargets"]()[1];
                QUnit.assert.deepEqual(actaulConfig.eventsLimitInMem, 10000, "eventsLimitInMem should not be changed by numbers smaller than 0");
                QUnit.assert.deepEqual(actaulConfig.maxEventRetryAttempts, 6, "maxEventRetryAttempt should not be changed by string values");
                QUnit.assert.deepEqual(actaulConfig.httpXHROverride, undefined, "xhttpXHROverride should not be changed by string values");
                
                core.config.extensionConfig[identifier].eventsLimitInMem = 100;
                core.config.extensionConfig[identifier].maxEventRetryAttempts = 10;
                core.config.extensionConfig[identifier].httpXHROverride = this.xhrOverride;
                this.clock.tick(1);
                actaulConfig = postChannel["_getDbgPlgTargets"]()[1];
                QUnit.assert.deepEqual(actaulConfig.eventsLimitInMem, 100, "eventsLimitInMem should be changed dynamically");
                QUnit.assert.deepEqual(actaulConfig.maxEventRetryAttempts, 10, "maxEventRetryAttempt should should be changed dynamically");
                QUnit.assert.deepEqual(actaulConfig.httpXHROverride, this.xhrOverride, "xhrOverride should be changed dynamically");
            }
        });


        this.testCase({
            name: "Fetch Credentials config default to be null, and support dynamic change",
            useFakeTimers: true,
            test: () => {
                let config = this.config;
                let core = this.core;
                let postChannel = this.postChannel;
                core.initialize(config, [postChannel]);
                let actaulConfig =  postChannel["_getDbgPlgTargets"]()[1];
                QUnit.assert.deepEqual(actaulConfig["fetchCredentials"], undefined, "fetchCredentials was undefined if not set");
                let httpManager =  postChannel["_getDbgPlgTargets"]()[0];
                QUnit.assert.deepEqual(httpManager["_getDbgPlgTargets"]()[4].fetchCredentials, undefined, "fetchCredentials was undefined if not set");
                if (core.config.extensionConfig){
                    core.config.extensionConfig[postChannel.identifier].fetchCredentials = "omit";
                }
                this.clock.tick(1);
                actaulConfig = postChannel["_getDbgPlgTargets"]()[1];
                QUnit.assert.deepEqual(actaulConfig["fetchCredentials"], "omit", "post channel fetchCredentials was set to omit");
                httpManager =  postChannel["_getDbgPlgTargets"]()[0];
                console.log("get", JSON.stringify(httpManager["_getDbgPlgTargets"]()[4]));
                QUnit.assert.deepEqual(httpManager["_getDbgPlgTargets"]()[4].fetchCredentials, "omit", "http manager fetchCredentials was set to omit");
            }
        });

        this.testCase({
            name: "Post Channel: dynamic config changes",
            useFakeTimers: true,
            test: () => {
                let config = this.config;
                let core = this.core;
                let postChannel = this.postChannel;
                let identifier = postChannel.identifier;
                let event: IPostTransmissionTelemetryItem = {
                    name: "testEvent",
                    latency: EventLatency.RealTime,
                    iKey: "testIkey"
                };
                core.initialize(config, [postChannel]);


                // test timeout
                postChannel.processTelemetry(event);
                this.clock.tick(1001);
                QUnit.assert.equal(this.testMessage, "", "should use default test message");
                core.config.extensionConfig = core.config.extensionConfig || {};
                core.config.extensionConfig[identifier].setTimeoutOverride = this.setTimeoutOverride;
                this.clock.tick(1);

                let extConfig = postChannel["_getDbgPlgTargets"]()[1];
                QUnit.assert.ok(extConfig.setTimeoutOverride, "setTimeoutOverride config should be changed dynamically");
                postChannel.processTelemetry(event);
                this.clock.tick(501);
                QUnit.assert.equal(this.testMessage, "testSetTimeout", "setTimeoutOverride should be changed dynamically");


                //test ignoreMc1Ms0CookieProcessing
                let path = core.getWParam();
                QUnit.assert.equal(path, 0, "warm path should be default to 0");
                core.config.extensionConfig[identifier].ignoreMc1Ms0CookieProcessing = true;
                this.clock.tick(1);

                path = core.getWParam();
                QUnit.assert.equal(path, 2, "warm path should be updated dynamically");


                // test disableTelemetry, overrideInstrumentationKey
                postChannel.flush(false);
                let spy = this.sandbox.spy(this.xhrOverride, "sendPOST");
                core.config.extensionConfig[identifier].httpXHROverride = this.xhrOverride;
                core.config.extensionConfig[identifier].overrideInstrumentationKey = "overrideIkey-";
                this.clock.tick(1);

                extConfig = postChannel["_getDbgPlgTargets"]()[1];
                QUnit.assert.equal(extConfig.overrideInstrumentationKey, "overrideIkey-", "overrideInstrumentationKey should be changed to true dynamically");
                QUnit.assert.ok(extConfig.httpXHROverride, "httpXHROverride should be set");
                postChannel.processTelemetry(event);
                postChannel.flush(false);
                QUnit.assert.ok(spy.called, "sendPOST should be called");
                QUnit.assert.equal(spy.callCount, 1, "sendPOST count should be called once ");
                QUnit.assert.equal(spy.getCall(0).args[0].data, "{\"name\":\"testEvent\",\"iKey\":\"o:overrideIkey\",\"data\":{\"baseData\":{}}}", "data should be set test1");
                
                core.config.extensionConfig[identifier].disableTelemetry = true;
                this.clock.tick(1);

                extConfig = postChannel["_getDbgPlgTargets"]()[1];
                QUnit.assert.equal(extConfig.disableTelemetry, true, "disableTelemetry should be changed dynamically");
                postChannel.processTelemetry(event);
                postChannel.flush(false);
                QUnit.assert.equal(spy.callCount, 1, "sendPOST count should be 1 test1");

                 // test eventsLimitInMem
                 core.config.extensionConfig[identifier].disableTelemetry = false;
                 core.config.extensionConfig[identifier].eventsLimitInMem = 1;
                 this.clock.tick(1);
                 extConfig = postChannel["_getDbgPlgTargets"]()[1];
                 QUnit.assert.equal(extConfig.disableTelemetry, false, "telemetry should be enabled dynamically");
                 QUnit.assert.equal(extConfig.eventsLimitInMem, 1, "eventsLimitInMem should be changed dynamically");
                 postChannel.flush(false);
                 QUnit.assert.equal(spy.callCount, 1, "sendPOST count should be 1");
                 postChannel.processTelemetry(event);
                 postChannel.processTelemetry(event);
                 postChannel.flush(false);
                 QUnit.assert.equal(spy.callCount, 2, "sendPOST count should be 2");
                 QUnit.assert.equal(spy.getCall(1).args[0].data, "{\"name\":\"testEvent\",\"iKey\":\"o:overrideIkey\",\"data\":{\"baseData\":{}}}", "data should be set test2");

                 // TODO: NOTE: maxEventRetryAttempts and maxUnloadEventRetryAttempts are not used by httpMgr, http mgr will always use initial values

            }
        });

        this.testCaseAsync({
            name: "zip test: gzip encode is working and content-encode header is set",
            stepDelay: 10,
            useFakeTimers: true,
            useFakeServer: true,
            steps: [
                () => {
                    this.genericSpy = this.sandbox.spy(this.xhrOverride, 'sendPOST');
                    this.config.featureOptIn = {["zipPayload"]: {mode: 3}};
                    this.config.extensionConfig[this.postChannel.identifier] = {
                        httpXHROverride: this.xhrOverride,
                    };
                    this.core.initialize(this.config, [this.postChannel]);
                    var event: IPostTransmissionTelemetryItem = {
                        name: 'testEvent',
                        sync: false,
                        latency: EventLatency.Normal,
                        iKey: 'testIkey'
                    };
                    this.postChannel.processTelemetry(event);
                    this.postChannel.flush();
                    this.clock.tick(10);
                }].concat(PollingAssert.createPollingAssert(() => {
                    if (this.genericSpy.called){
                        let request = this.genericSpy.getCall(0).args[0];
                        let gzipData = request.data;
                        QUnit.assert.ok(gzipData, "data should be set");
                        QUnit.assert.equal(true, gzipData[0] === 0x1F && gzipData[1] === 0x8B, "telemetry should be gzip encoded");
                        QUnit.assert.equal(request.headers["Content-Encoding"], "gzip", "telemetry should be gzip encoded");
                        return true;
                    }
                    return false;
                }, "Wait for promise response" + new Date().toISOString(), 60, 1000) as any)
            });

         
        this.testCaseAsync({
            name: "zip is default to be off",
            stepDelay: 10,
            useFakeTimers: true,
            useFakeServer: true,
            steps: [
                () => {
                    this.genericSpy = this.sandbox.spy(this.xhrOverride, 'sendPOST');
                    this.config.extensionConfig[this.postChannel.identifier] = {
                        httpXHROverride: this.xhrOverride
                    };
                    this.core.initialize(this.config, [this.postChannel]);
                    var event: IPostTransmissionTelemetryItem = {
                        name: 'testEvent',
                        sync: false,
                        latency: EventLatency.Normal,
                        iKey: 'testIkey'
                    };
                    this.postChannel.processTelemetry(event);
                    this.postChannel.flush();
                    this.clock.tick(10);
                }].concat(PollingAssert.createPollingAssert(() => {
                    if (this.genericSpy.called){
                        let request = this.genericSpy.getCall(0).args[0];
                        QUnit.assert.equal(request.headers["Content-Encoding"], undefined, "header should not be added");
                        QUnit.assert.ok(JSON.stringify(request.data).includes("testEvent"), "telemetry should not be encoded");
                        return true;
                    }
                    return false;
                }, "Wait for promise response" + new Date().toISOString(), 60, 1000) as any)
            });

            this.testCaseAsync({
                name: "test dynamic zip config",
                stepDelay: 10,
                useFakeTimers: true,
                useFakeServer: true,
                steps: [
                    () => {
                        this.genericSpy = this.sandbox.spy(this.xhrOverride, 'sendPOST');
                        this.config.extensionConfig[this.postChannel.identifier] = {
                            httpXHROverride: this.xhrOverride
                        };
                        this.core.initialize(this.config, [this.postChannel]);
                        var event: IPostTransmissionTelemetryItem = {
                            name: 'testEvent',
                            sync: false,
                            latency: EventLatency.Normal,
                            iKey: 'testIkey'
                        };
                        this.postChannel.processTelemetry(event);
                        this.postChannel.flush();
                        this.clock.tick(10);
                        this.core.config.featureOptIn = {["zipPayload"]: {mode: 3}};
                        this.clock.tick(1);
                        this.core.track(event);
                        this.postChannel.flush();
                        this.clock.tick(10);
                    }].concat(PollingAssert.createPollingAssert(() => {
                        if (this.genericSpy.callCount === 2) {
                            let request = this.genericSpy.getCall(0).args[0];
                            QUnit.assert.equal(request.headers["Content-Encoding"], undefined, "header should not be added");
                            QUnit.assert.ok(JSON.stringify(request.data).includes("testEvent"), "telemetry should not be encoded");
                            let request2 = this.genericSpy.getCall(1).args[0];
                            QUnit.assert.equal(request2.headers["Content-Encoding"], "gzip", "Telemetry should be gzip encoded after zipPayload is set to true");
                            return true;
                        }
                        return false;
                    }, "Wait for promise response" + new Date().toISOString(), 60, 1000) as any)
                });
           


        this.testCaseAsync({
            name: "Init: init with ikey Promise and endpointUrl Promise",
            stepDelay: 100,
            useFakeTimers: true,
            steps: [() => {

                let config = this.config;
                config.initTimeOut = 80000;
                let ikeyPromise = createAsyncResolvedPromise("testIkey-test");
                let urlPromise = createAsyncResolvedPromise("https://testEndpoint");
                this.ctx.ikeyPromise = ikeyPromise;
                this.ctx.urlPromise = urlPromise;
                config.instrumentationKey = ikeyPromise;
                config.endpointUrl = urlPromise;
                let core = this.core;
                let postChannel = this.postChannel;
                let identifier = postChannel.identifier;
                let spy = this.sandbox.spy(this.xhrOverride, "sendPOST");
                config.extensionConfig = {[identifier]: {}};
                config.extensionConfig[identifier].httpXHROverride = this.xhrOverride;
                this.ctx.spy = spy;
         
                core.initialize(config, [postChannel]);
                let status = core.activeStatus && core.activeStatus();
                QUnit.assert.equal(status, ActiveStatus.PENDING, "status should be set to pending");

                let event: IPostTransmissionTelemetryItem = {
                    name: "testEvent",
                    iKey: "testIkey-test",
                    latency: EventLatency.RealTime
                };
                postChannel.processTelemetry(event);
                
            }].concat(PollingAssert.createPollingAssert(() => {
                let core = this.core;
                let activeStatus = core.activeStatus && core.activeStatus();
                let ikeyPromise = this.ctx.ikeyPromise;
                let urlPromise = this.ctx.urlPromise;
                let config = this.core.config;
                let spy = this.ctx.spy;
              
            
                if (ikeyPromise.state === "resolved" && urlPromise.state === "resolved" && activeStatus === ActiveStatus.ACTIVE) {
                    QUnit.assert.equal("testIkey-test", core.config.instrumentationKey, "ikey should be set");
                    QUnit.assert.equal("https://testEndpoint", core.config.endpointUrl ,"endpoint shoule be set");

                    let httpManager = this.postChannel["_getDbgPlgTargets"]()[0];
                    QUnit.assert.ok(httpManager ,"http Manager exists");
                    let url = httpManager["_getDbgPlgTargets"]()[5];
                    QUnit.assert.ok(url.indexOf("https://testEndpoint") > -1 ,"http manager endpoint shoule be set");

                    this.postChannel.flush(false);
                    QUnit.assert.equal(spy.callCount, 1, "sendPOST count should be 1");
                    QUnit.assert.equal(spy.getCall(0).args[0].data, "{\"name\":\"testEvent\",\"iKey\":\"o:testIkey\",\"data\":{\"baseData\":{}}}", "data should be set");
                    
                    return true;
                }
                return false;
            }, "Wait for promise response" + new Date().toISOString(), 60, 1000) as any)
        });


        this.testCase({
            name: "Post Channel: Offline Support",
            useFakeTimers: true,
            test: () => {
                let config = this.config;
                let core = this.core;
                let postChannel = this.postChannel;
                let postId = this.postChannel.identifier;
                config.instrumentationKey = "ikey-123"
                let event: IPostTransmissionTelemetryItem = {
                    name: "testEvent",
                    iKey: "testIkey-123"
                };
                core.initialize(config, [postChannel]);
                let offlineSupport = this.postChannel.getOfflineSupport() as any;
                QUnit.assert.ok(offlineSupport.serialize, "serialize exist");
                let eventStr = offlineSupport.serialize(event);
                let expectedStr = `{"name":"testEvent","iKey":"o:testIkey","data":{"baseData":{}}}`;
                QUnit.assert.equal(eventStr, expectedStr, "get expected string");

                let url = offlineSupport.getUrl();
                QUnit.assert.equal(url, "https://testEndpoint?cors=true&content-type=application/x-json-stream&w=0", "get expected url string");
                
                QUnit.assert.ok(offlineSupport.batch, "batch should exit");
                let batch = offlineSupport.batch([expectedStr, expectedStr]);
                QUnit.assert.equal(batch, expectedStr + "\n" + expectedStr, "get expected batch");

                QUnit.assert.ok(offlineSupport.shouldProcess, "should process should exit");
                QUnit.assert.equal(offlineSupport.shouldProcess(event), true, "should process");

                QUnit.assert.ok(offlineSupport.createPayload, "createPayload should exit");
                QUnit.assert.equal(offlineSupport.createPayload("test"), null, "createPayload should return null now");
                let details = offlineSupport.createOneDSPayload([event]);
                QUnit.assert.equal(details.urlString, "https://testEndpoint?cors=true&content-type=application/x-json-stream&w=0", "get expected Url");
                QUnit.assert.ok(details.headers, "get headers Url");
                QUnit.assert.equal(details.data, expectedStr, "get expected data");

                this.core.config.extensionConfig = this.core.config.extensionConfig || {};
                this.core.config.extensionConfig[postId].disableTelemetry = true;
                this.clock.tick(1);
                offlineSupport = this.postChannel.getOfflineSupport() as any;
                QUnit.assert.equal(offlineSupport.shouldProcess(event), false, "should not process");
                
            }
        });


        this.testCase({
            name: "Send Sync Event with Specific type override",
            test: () => {
                let beaconCalls = [];
                this.hookSendBeacon((url, data) => {
                    beaconCalls.push({
                        url,
                        data,
                    });

                    return true;
                });

                var fetchCalls = this.hookFetch((resolve) => {
                    AITestClass.orgSetTimeout(function() {
                        resolve();
                    }, 0);
                });

                this.config.extensionConfig[this.postChannel.identifier] = {
                    overrideInstrumentationKey: "overrideIkey-",
                    overrideEndpointUrl: "overrideEndpoint",
                    httpXHROverride: this.xhrOverride,
                };

                this.core.initialize(this.config, [this.postChannel]);

                var spy = this.sandbox.spy(this.xhrOverride, 'sendPOST');
                var event: IPostTransmissionTelemetryItem = {
                    name: 'testEvent-xhr',
                    sync: EventSendType.Synchronous
                };
                this.postChannel.processTelemetry(event);
                QUnit.assert.equal(spy.called, true);
                QUnit.assert.equal(fetchCalls.length, 0);
                QUnit.assert.equal(beaconCalls.length, 0);
                QUnit.assert.ok(spy.getCall(0).args[0].urlString.toString().indexOf("overrideEndpoint") > -1);
                QUnit.assert.equal(spy.getCall(0).args[0].data, "{\"name\":\"testEvent-xhr\",\"iKey\":\"o:overrideIkey\",\"data\":{\"baseData\":{}}}");
                QUnit.assert.equal(isNaN(event.timings.processTelemetryStart["PostChannel"] as number), false);

                var eventFetch: IPostTransmissionTelemetryItem = {
                    name: 'testEvent-beacon',
                    sync: EventSendType.SendBeacon
                };
                this.postChannel.processTelemetry(eventFetch);

                QUnit.assert.equal(fetchCalls.length, 0);
                QUnit.assert.equal(beaconCalls.length, 1);
                QUnit.assert.notEqual(beaconCalls[0].input, "");
                QUnit.assert.equal(beaconCalls[0].data, "{\"name\":\"testEvent-beacon\",\"iKey\":\"o:overrideIkey\",\"data\":{\"baseData\":{}}}");

                var eventFetch: IPostTransmissionTelemetryItem = {
                    name: 'testEvent-syncFetch',
                    sync: EventSendType.SyncFetch
                };
                this.postChannel.processTelemetry(eventFetch);

                if (!isFetchSupported(true)) {
                    // Sync fetch is not supported (Firefox) so it should fall back to sendBeacon
                    QUnit.assert.equal(fetchCalls.length, 0);
                    QUnit.assert.equal(beaconCalls.length, 2);
                    QUnit.assert.equal(beaconCalls[1].data, "{\"name\":\"testEvent-syncFetch\",\"iKey\":\"o:overrideIkey\",\"data\":{\"baseData\":{}}}");
                } else {
                    QUnit.assert.equal(fetchCalls.length, 1);
                    QUnit.assert.equal(beaconCalls.length, 1);
                    QUnit.assert.notEqual(fetchCalls[0].input, "");
                    QUnit.assert.equal(fetchCalls[0].init.body, "{\"name\":\"testEvent-syncFetch\",\"iKey\":\"o:overrideIkey\",\"data\":{\"baseData\":{}}}");
                }
            }
        });

        this.testCase({
            name: "flush sync with override - Normal",
            test: () => {
                this.config.extensionConfig[this.postChannel.identifier] = {
                    httpXHROverride: this.xhrOverride
                };
                this.core.initialize(this.config, [this.postChannel]);
                var spy = this.sandbox.spy(this.xhrOverride, 'sendPOST');
                var event: IPostTransmissionTelemetryItem = {
                    name: 'testEvent',
                    sync: false,
                    latency: EventLatency.Normal,
                    iKey: 'testIkey'
                };
                this.postChannel.processTelemetry(event);
                this.postChannel.flush(false);
                QUnit.assert.equal(spy.called, true);
                QUnit.assert.equal(spy.callCount, 1);
                QUnit.assert.equal(spy.getCall(0).args[0].data, "{\"name\":\"testEvent\",\"iKey\":\"o:\",\"data\":{\"baseData\":{}}}");
            }
        });

        this.testCase({
            name: "flush sync with override - Cost Deferred",
            test: () => {
                this.config.extensionConfig[this.postChannel.identifier] = {
                    httpXHROverride: this.xhrOverride
                };
                this.core.initialize(this.config, [this.postChannel]);
                var spy = this.sandbox.spy(this.xhrOverride, 'sendPOST');
                var event: IPostTransmissionTelemetryItem = {
                    name: 'testEvent',
                    sync: false,
                    latency: EventLatency.CostDeferred,
                    iKey: 'testIkey'
                };
                this.postChannel.processTelemetry(event);
                this.postChannel.flush(false);
                QUnit.assert.equal(spy.called, true);
                QUnit.assert.equal(spy.callCount, 1);
                QUnit.assert.equal(spy.getCall(0).args[0].data, "{\"name\":\"testEvent\",\"iKey\":\"o:\",\"data\":{\"baseData\":{}}}");
            }
        });

        this.testCase({
            name: "flush sync with override - Real time",
            test: () => {
                this.config.extensionConfig[this.postChannel.identifier] = {
                    httpXHROverride: this.xhrOverride
                };
                this.core.initialize(this.config, [this.postChannel]);
                var spy = this.sandbox.spy(this.xhrOverride, 'sendPOST');
                var event: IPostTransmissionTelemetryItem = {
                    name: 'testEvent',
                    sync: false,
                    latency: EventLatency.RealTime,
                    iKey: 'testIkey'
                };
                this.postChannel.processTelemetry(event);
                this.postChannel.flush(false);
                QUnit.assert.equal(spy.called, true);
                QUnit.assert.equal(spy.callCount, 1);
                QUnit.assert.equal(spy.getCall(0).args[0].data, "{\"name\":\"testEvent\",\"iKey\":\"o:\",\"data\":{\"baseData\":{}}}");
            }
        });

        this.testCase({
            name: "flush sync with override - Direct",
            test: () => {
                this.config.extensionConfig[this.postChannel.identifier] = {
                    httpXHROverride: this.xhrOverride
                };
                this.core.initialize(this.config, [this.postChannel]);
                var spy = this.sandbox.spy(this.xhrOverride, 'sendPOST');
                var event: IPostTransmissionTelemetryItem = {
                    name: 'testEvent',
                    sync: false,
                    latency: EventLatency.Immediate,
                    iKey: 'testIkey'
                };
                this.postChannel.processTelemetry(event);
                this.postChannel.flush(false);
                QUnit.assert.equal(spy.called, true);
                QUnit.assert.equal(spy.callCount, 1);
                QUnit.assert.equal(spy.getCall(0).args[0].data, "{\"name\":\"testEvent\",\"iKey\":\"o:\",\"data\":{\"baseData\":{}}}");
            }
        });

        this.testCase({
            name: "flush async with override - Normal",
            useFakeTimers: true,
            useFakeServer: true,
            test: () => {
                this.config.extensionConfig[this.postChannel.identifier] = {
                    httpXHROverride: this.xhrOverride
                };
                this.core.initialize(this.config, [this.postChannel]);
                this.genericSpy = this.sandbox.spy(this.xhrOverride, 'sendPOST');
                var event: IPostTransmissionTelemetryItem = {
                    name: 'testEvent',
                    sync: false,
                    latency: EventLatency.Normal,
                    iKey: 'testIkey'
                };
                this.postChannel.processTelemetry(event);
                this.postChannel.flush(true);

                // Nothing should have been sent yet
                QUnit.assert.equal(this.genericSpy.called, false);

                this.clock.tick(1000);

                QUnit.assert.equal(this.genericSpy.called, true);
                QUnit.assert.equal(this.genericSpy.callCount, 1);
                QUnit.assert.equal(this.genericSpy.getCall(0).args[0].data, "{\"name\":\"testEvent\",\"iKey\":\"o:\",\"data\":{\"baseData\":{}}}");
            }
        });

        this.testCase({
            name: "flush async with override - Cost Deferred",
            useFakeTimers: true,
            useFakeServer: true,
            test: () => {
                this.config.extensionConfig[this.postChannel.identifier] = {
                    httpXHROverride: this.xhrOverride
                };
                this.core.initialize(this.config, [this.postChannel]);
                this.genericSpy = this.sandbox.spy(this.xhrOverride, 'sendPOST');
                var event: IPostTransmissionTelemetryItem = {
                    name: 'testEvent',
                    sync: false,
                    latency: EventLatency.CostDeferred,
                    iKey: 'testIkey'
                };
                this.postChannel.processTelemetry(event);
                this.postChannel.flush(true);

                // Nothing should have been sent yet
                QUnit.assert.equal(this.genericSpy.called, false);

                this.clock.tick(1000);

                QUnit.assert.equal(this.genericSpy.called, true);
                QUnit.assert.equal(this.genericSpy.callCount, 1);
                QUnit.assert.equal(this.genericSpy.getCall(0).args[0].data, "{\"name\":\"testEvent\",\"iKey\":\"o:\",\"data\":{\"baseData\":{}}}");
            }
        });

        this.testCase({
            name: "flush async with override - Real time",
            useFakeTimers: true,
            useFakeServer: true,
            test: () => {
                this.config.extensionConfig[this.postChannel.identifier] = {
                    httpXHROverride: this.xhrOverride
                };
                this.core.initialize(this.config, [this.postChannel]);
                this.genericSpy = this.sandbox.spy(this.xhrOverride, 'sendPOST');
                var event: IPostTransmissionTelemetryItem = {
                    name: 'testEvent',
                    sync: false,
                    latency: EventLatency.RealTime,
                    iKey: 'testIkey'
                };
                this.postChannel.processTelemetry(event);
                this.postChannel.flush(true);

                // Nothing should have been sent yet
                QUnit.assert.equal(this.genericSpy.called, false);

                this.clock.tick(1000);

                QUnit.assert.equal(this.genericSpy.called, true);
                QUnit.assert.equal(this.genericSpy.callCount, 1);
                QUnit.assert.equal(this.genericSpy.getCall(0).args[0].data, "{\"name\":\"testEvent\",\"iKey\":\"o:\",\"data\":{\"baseData\":{}}}");
            }
        });

        this.testCase({
            name: "flush async with override - Direct",
            useFakeTimers: true,
            useFakeServer: true,
            test: () => {
                this.config.extensionConfig[this.postChannel.identifier] = {
                    httpXHROverride: this.xhrOverride
                };
                this.core.initialize(this.config, [this.postChannel]);
                this.genericSpy = this.sandbox.spy(this.xhrOverride, 'sendPOST');
                var event: IPostTransmissionTelemetryItem = {
                    name: 'testEvent',
                    sync: false,
                    latency: EventLatency.Immediate,
                    iKey: 'testIkey'
                };
                this.postChannel.processTelemetry(event);
                this.postChannel.flush(true);

                // Nothing should have been sent yet
                QUnit.assert.equal(this.genericSpy.called, false);

                this.clock.tick(1000);

                QUnit.assert.equal(this.genericSpy.called, true);
                QUnit.assert.equal(this.genericSpy.callCount, 1);
                QUnit.assert.equal(this.genericSpy.getCall(0).args[0].data, "{\"name\":\"testEvent\",\"iKey\":\"o:\",\"data\":{\"baseData\":{}}}");
            }
        });

        this.testCase({
            name: "qspHeaders",
            test: () => {
                this.config.extensionConfig[this.postChannel.identifier] = {
                    httpXHROverride: this.xhrOverride
                };
                this.config.anonCookieName = "APP_ANON";
                this.core.initialize(this.config, [this.postChannel]);
                var spy = this.sandbox.spy(this.xhrOverride, 'sendPOST');
                var event: IPostTransmissionTelemetryItem = {
                    name: 'testEvent',
                    sync: false,
                    latency: EventLatency.Normal,
                    iKey: 'testIkey'
                };
                this.postChannel.processTelemetry(event);
                this.postChannel.flush(false);
                QUnit.assert.equal(spy.called, true);
                QUnit.assert.ok(spy.getCall(0).args[0].urlString.indexOf('anoncknm=APP_ANON') > -1);
            }
        });

        this.testCase({
            name: "Avoid Headers: default",
            test: () => {
                this.config.extensionConfig[this.postChannel.identifier] = {
                    httpXHROverride: this.xhrOverride
                };
                this.core.initialize(this.config, [this.postChannel]);
                var spy = this.sandbox.spy(this.xhrOverride, 'sendPOST');
                var event: IPostTransmissionTelemetryItem = {
                    name: 'testEvent',
                    sync: false,
                    latency: EventLatency.Normal,
                    iKey: 'testIkey'
                };
                this.postChannel.processTelemetry(event);
                this.postChannel.flush(false);
                QUnit.assert.equal(spy.called, true);
                QUnit.assert.ok(spy.getCall(0).args[0].headers != null);
                QUnit.assert.equal(objKeys(spy.getCall(0).args[0].headers).length, 7);
            }
        });

        this.testCase({
            name: "Validate Avoid Headers: Explicitly Enabled (don't add default headers) with no manual headers",
            test: () => {
                this.config.extensionConfig[this.postChannel.identifier] = {
                    httpXHROverride: this.xhrOverride,
                    avoidOptions: true
                };
                this.core.initialize(this.config, [this.postChannel]);
                var spy = this.sandbox.spy(this.xhrOverride, 'sendPOST');
                var event: IPostTransmissionTelemetryItem = {
                    name: 'testEvent',
                    sync: false,
                    latency: EventLatency.Normal,
                    iKey: 'testIkey'
                };
                this.postChannel.processTelemetry(event);
                this.postChannel.flush(false);
                QUnit.assert.equal(spy.called, true);
                QUnit.assert.ok(spy.getCall(0).args[0].headers != null);
                QUnit.assert.equal(objKeys(spy.getCall(0).args[0].headers).length, 0);
            }
        });

        this.testCase({
            name: "Validate Avoid Headers: Explicitly Disabled (include and use headers)",
            test: () => {
                this.config.extensionConfig[this.postChannel.identifier] = {
                    httpXHROverride: this.xhrOverride,
                    avoidOptions: false
                };
                this.core.initialize(this.config, [this.postChannel]);
                var spy = this.sandbox.spy(this.xhrOverride, 'sendPOST');
                var event: IPostTransmissionTelemetryItem = {
                    name: 'testEvent',
                    sync: false,
                    latency: EventLatency.Normal,
                    iKey: 'testIkey'
                };
                this.postChannel.processTelemetry(event);
                this.postChannel.flush(false);
                QUnit.assert.equal(spy.called, true);
                QUnit.assert.ok(spy.getCall(0).args[0].headers != null);
                QUnit.assert.equal(objKeys(spy.getCall(0).args[0].headers).length, 7);
                QUnit.assert.equal(spy.getCall(0).args[0].headers["cache-control"], "no-cache, no-store");
                QUnit.assert.equal(spy.getCall(0).args[0].headers["content-type"], "application/x-json-stream");
                // Header should be present
                QUnit.assert.notEqual(spy.getCall(0).args[0].headers["upload-time"], undefined, spy.getCall(0).args[0].headers["upload-time"]);
            }
        });

        this.testCase({
            name: "Validate Avoid Headers: Explicitly Enabled with manual headers (will add the default headers)",
            test: () => {
                this.config.extensionConfig[this.postChannel.identifier] = {
                    httpXHROverride: this.xhrOverride,
                    avoidOptions: true                  // Also means put as much as possible on the query string
                };
                this.core.initialize(this.config, [this.postChannel]);
                this.postChannel.setMsaAuthTicket("testMSA");
                var spy = this.sandbox.spy(this.xhrOverride, 'sendPOST');
                var event: IPostTransmissionTelemetryItem = {
                    name: 'testEvent',
                    sync: false,
                    latency: EventLatency.Normal,
                    iKey: 'testIkey'
                };
                this.postChannel.processTelemetry(event);
                this.postChannel.flush(false);
                QUnit.assert.equal(spy.called, true);
                QUnit.assert.ok(spy.getCall(0).args[0].headers != null);
                QUnit.assert.equal(objKeys(spy.getCall(0).args[0].headers).length, 3);
                QUnit.assert.equal(spy.getCall(0).args[0].headers["cache-control"], "no-cache, no-store");
                QUnit.assert.equal(spy.getCall(0).args[0].headers["content-type"], "application/x-json-stream");
                QUnit.assert.equal(spy.getCall(0).args[0].headers["AuthMsaDeviceTicket"], "testMSA");

                // Header should not be present as we should be attempting to avoid an options call
                QUnit.assert.equal(spy.getCall(0).args[0].headers["upload-time"], undefined, spy.getCall(0).args[0].headers["upload-time"]);

            }
        });

        this.testCase({
            name: "Add MSA Auth ticket in headers",
            test: () => {
                this.config.extensionConfig[this.postChannel.identifier] = {
                    httpXHROverride: this.xhrOverride
                };
                this.core.initialize(this.config, [this.postChannel]);
                this.postChannel.setMsaAuthTicket("testMSA");
                var spy = this.sandbox.spy(this.xhrOverride, 'sendPOST');
                var event: IPostTransmissionTelemetryItem = {
                    name: 'testEvent',
                    sync: false,
                    latency: EventLatency.Normal,
                    iKey: 'testIkey'
                };
                this.postChannel.processTelemetry(event);
                this.postChannel.flush(false);
                QUnit.assert.equal(spy.called, true);
                QUnit.assert.equal(spy.getCall(0).args[0].headers["AuthMsaDeviceTicket"],"testMSA");
            }
        });

        this.testCase({
            name: "event sent using beacons",
            useFakeTimers: true,
            test: () => {
                this.beaconCalls = [];
                this.hookSendBeacon((url, body) => {
                    this.beaconCalls.push({ url, body });
                    return true;
                });
                this.core.initialize(this.config, [this.postChannel]);
                this.core.addNotificationListener({
                    eventsSent: (events: IExtendedTelemetryItem[]) => {
                        for (var i = 0; i < events.length; i++) {
                            this.eventsSent.push(events[i]);
                        }
                    },
                    eventsDiscarded: (events: IExtendedTelemetryItem[]) => {
                        for (var i = 0; i < events.length; i++) {
                            this.eventsDiscarded.push(events[i]);
                        }
                    },
                });
                var event: IPostTransmissionTelemetryItem = {
                    name: 'testEvent',
                    sync: false,
                    latency: EventLatency.Normal,
                    iKey: 'testIkey'
                };
                this.postChannel.processTelemetry(event);
                QUnit.assert.equal(this.beaconCalls.length, 0);
                // teardown should send events synchronously so don't cause any ticks
                this.postChannel.teardown();
                QUnit.assert.equal(this.beaconCalls.length, 1, "There should have been 1 beacon call");
                if (this.eventsSent.length === 0) {
                    // The NotificationManger currently always sends the eventsSent() and eventsDiscarded via a timeout, so we need to schedule it
                    // Remove this after 3P Notification manager is fixed
                    this.clock.tick(1);
                } else {
                    QUnit.assert.ok(false, "Looks like the 3P notification manager is now fixed -- you should now remove this if block test work around");
                }
                QUnit.assert.equal(this.eventsSent.length, 1, "There should have been 1 event");
                QUnit.assert.equal(this.eventsDiscarded.length, 0, "No events should have been discarded");
            }
        });

        this.testCase({
            name: "setTimeout override",
            useFakeTimers: true,
            test: () => {
                    this.config.extensionConfig[this.postChannel.identifier] = {
                        httpXHROverride: this.xhrOverride,
                        setTimeoutOverride: this.setTimeoutOverride
                    };
                    this.core.initialize(this.config, [this.postChannel]);
                    this.core.addNotificationListener({
                        eventsSent: (events: IExtendedTelemetryItem[]) => {
                            for (var i = 0; i < events.length; i++) {
                                this.eventsSent.push(events[i]);
                            }
                        },
                        eventsDiscarded: (events: IExtendedTelemetryItem[]) => {
                            for (var i = 0; i < events.length; i++) {
                                this.eventsDiscarded.push(events[i]);
                            }
                        },
                    });
                    var event: IPostTransmissionTelemetryItem = {
                        name: 'testEvent',
                        latency: EventLatency.RealTime,
                        iKey: 'testIkey'
                    };
                    this.postChannel.processTelemetry(event);

                    // the override halves the timeout value so simulated 500ms should suffice plus 1ms for the event to be sent
                    this.clock.tick(501);
                    QUnit.assert.equal(this.eventsSent.length, 1);
                    QUnit.assert.equal(isNaN(this.eventsSent[0].timings.processTelemetryStart["PostChannel"] as number), false);
                    QUnit.assert.equal(isNaN(this.eventsSent[0].timings.sendEventStart["PostChannel"] as number), false);
                    QUnit.assert.equal(isNaN(this.eventsSent[0].timings.sendEventCompleted["PostChannel"] as number), false);
                    QUnit.assert.equal(isNaN(this.eventsSent[0].timings.serializationStart["PostChannel"] as number), false);
                    QUnit.assert.equal(isNaN(this.eventsSent[0].timings.serializationCompleted["PostChannel"] as number), false);
                    QUnit.assert.equal(this.testMessage, "testSetTimeout");
                }
        });

        this.testCaseAsync({
            name: "clearTimeout override",
            stepDelay: 4000,
            steps: [
                () => {
                    this.config.extensionConfig[this.postChannel.identifier] = {
                        httpXHROverride: this.xhrOverride,
                        clearTimeoutOverride: this.clearTimeoutOverride,
                    };
                    this.core.initialize(this.config, [this.postChannel]);
                    this.core.addNotificationListener({
                        eventsSent: (events: IExtendedTelemetryItem[]) => {
                            for (var i = 0; i < events.length; i++) {
                                this.eventsSent.push(events[i]);
                            }
                        }
                    });
                    var event: IPostTransmissionTelemetryItem = {
                        name: 'testEvent',
                        latency: EventLatency.RealTime,
                        iKey: 'testIkey'
                    };
                    this.core.track(event);
                    this.postChannel.flush(false);
                }]
                .concat(() => {
                    QUnit.assert.ok(this.eventsSent.length == 1);
                    QUnit.assert.equal(this.testMessage, "testClearTimeout");
                })
        });

        this.testCase({
            name: "sendBeacon size limit",
            useFakeTimers: true,
            test: () => {
                    this.beaconCalls = [];
                    this.hookSendBeacon((url, body) => {
                        this.beaconCalls.push({ url, body });
                        return true;
                    });

                    this.core.initialize(this.config, [this.postChannel]);
                    this.core.addNotificationListener({
                        eventsSent: (events: IExtendedTelemetryItem[]) => {
                            for (var i = 0; i < events.length; i++) {
                                this.eventsSent.push(events[i]);
                            }
                        },
                        eventsDiscarded: (events: IExtendedTelemetryItem[]) => {
                            for (var i = 0; i < events.length; i++) {
                                this.eventsDiscarded.push(events[i]);
                            }
                        },
                    });
                    for (var i = 0; i < 600; i++) {
                        var event: IPostTransmissionTelemetryItem = {
                            name: 'testEvent',
                            sync: false,
                            latency: EventLatency.Normal,
                            iKey: 'testIkey',
                            data: {
                                field: "1234567890qwertyuiopasdfghjklzxcvbnm1234567890qwertyuiopasdfghjklzxcvbnm1234567890"
                            }
                        };
                        this.postChannel.processTelemetry(event);
                    }

                    QUnit.assert.equal(this.beaconCalls.length, 0);
                    // teardown should send events synchronously so don't cause any ticks
                    this.postChannel.teardown();

                    QUnit.assert.ok(this.beaconCalls.length > 0);
                    if (!(this.eventsSent.length > 400 && this.eventsSent.length < 590)) {
                        // The NotificationManger currently always sends the eventsSent() and eventsDiscarded via a timeout, so we need to schedule it
                        // Remove this after 3P Notification manager is fixed
                        this.clock.tick(10);
                    } else {
                        QUnit.assert.ok(false, "Looks like the 3P notification manager is now fixed -- you should now remove this if block test work around");
                    }

                    QUnit.assert.equal(this.eventsSent.length, 600, "expected all 600 events have been sent");
                    QUnit.assert.equal(this.eventsDiscarded.length, 0);
                    QUnit.assert.equal(isNaN(this.eventsSent[0].timings.sendEventStart["PostChannel"]), false);
                    QUnit.assert.equal(isNaN(this.eventsSent[0].timings.sendEventCompleted["PostChannel"]), false);
                }
        });

        this.testCase({
            name: "Ignore MC1 and MS0 cookies",
            test: () => {
                this.config.extensionConfig[this.postChannel.identifier] = {
                    ignoreMc1Ms0CookieProcessing: true,
                };
                this.core.initialize(this.config, [this.postChannel]);
                QUnit.assert.equal(this.core.getWParam(), 2)
            }
        });

        this.testCase({
            name: "Notifications: events send notification on teardown",
            useFakeTimers: true,
            useFakeServer: true,
            test: () => {
                this.core.initialize(this.config, [this.postChannel]);
                this.core.addNotificationListener({
                    eventsSent: (events: IExtendedTelemetryItem[]) => {
                        for (var i = 0; i < events.length; i++) {
                            this.eventsSent.push(events[i]);
                        }
                    },
                    eventsSendRequest: (sendReason: number, isAsync?: boolean) => {
                        this.eventsSendRequests.push({
                            sendReason,
                            isAsync
                        });
                    }
                });
                var event: IPostTransmissionTelemetryItem = {
                    name: 'testEvent',
                    sync: false,
                    latency: EventLatency.Normal,
                    iKey: 'testIkey'
                };
                this.postChannel.processTelemetry(event);
                this.postChannel.teardown();

                QUnit.assert.equal(this.eventsSendRequests.length, 1);
                QUnit.assert.equal(SendRequestReason.Unload, this.eventsSendRequests[0].sendReason);
                QUnit.assert.equal(false, this.eventsSendRequests[0].isAsync);

                if (this.eventsSent.length === 0) {
                    // The NotificationManger currently always sends the eventsSent() and eventsDiscarded via a timeout, so we need to schedule it
                    // Remove this after 3P Notification manager is fixed
                    this.clock.tick(1);
                } else {
                    QUnit.assert.ok(false, "Looks like the 3P notification manager is now fixed -- you should now remove this if block test work around");
                }

                QUnit.assert.equal(this.eventsSent.length, 1);
                QUnit.assert.equal(this.eventsDiscarded.length, 0);
            }
        });

        this.testCaseAsync({
            name: "Notifications: events send notification on flush",
            stepDelay: 10,
            useFakeTimers: true,
            useFakeServer: true,
            steps: [
                () => {
                    this.core.initialize(this.config, [this.postChannel]);
                    this.core.addNotificationListener({
                        eventsSendRequest: (sendReason: number, isAsync?: boolean) => {
                            this.eventsSendRequests.push({
                                sendReason,
                                isAsync
                            });
                        }
                    });
                    var event: IPostTransmissionTelemetryItem = {
                        name: 'testEvent',
                        sync: false,
                        latency: EventLatency.Normal,
                        iKey: 'testIkey'
                    };
                    this.postChannel.processTelemetry(event);
                    this.postChannel.flush();
                    QUnit.assert.equal(this.eventsSendRequests.length, 0);
                    this.clock.tick(10);
                    QUnit.assert.equal(this.eventsSendRequests.length, 1);
                    QUnit.assert.equal(SendRequestReason.ManualFlush, this.eventsSendRequests[0].sendReason);
                    QUnit.assert.equal(true, this.eventsSendRequests[0].isAsync);
                }]
        });

        this.testCaseAsync({
            name: "Notifications: events send events on auto flush limit exceeded",
            stepDelay: 10,
            useFakeTimers: true,
            useFakeServer: true,
            steps: [
                () => {
                    let extConfig = this.config.extensionConfig[this.postChannel.identifier] || {};
                    extConfig.autoFlushEventsLimit = 2;
                    this.config.extensionConfig[this.postChannel.identifier] = extConfig;

                    this.core.initialize(this.config, [this.postChannel]);
                    this.core.addNotificationListener({
                        eventsSendRequest: (sendReason: number, isAsync?: boolean) => {
                            this.eventsSendRequests.push({
                                sendReason,
                                isAsync
                            });
                        }
                    });
                    this.postChannel.processTelemetry({
                        name: 'testEvent1',
                        sync: false,
                        latency: EventLatency.Normal,
                        iKey: 'testIkey'
                    } as IPostTransmissionTelemetryItem);
                    this.postChannel.processTelemetry({
                        name: 'testEvent2',
                        sync: false,
                        latency: EventLatency.Normal,
                        iKey: 'testIkey'
                    } as IPostTransmissionTelemetryItem);
                    this.postChannel.processTelemetry({
                        name: 'testEvent3',
                        sync: false,
                        latency: EventLatency.Normal,
                        iKey: 'testIkey'
                    } as IPostTransmissionTelemetryItem);
                    QUnit.assert.equal(this.eventsSendRequests.length, 0);
                    this.clock.tick(10);
                    QUnit.assert.equal(this.eventsSendRequests.length, 1);
                    QUnit.assert.equal(SendRequestReason.MaxQueuedEvents, this.eventsSendRequests[0].sendReason);
                    QUnit.assert.equal(true, this.eventsSendRequests[0].isAsync);
                }]
        });

        this.testCaseAsync({
            name: "Notifications: events sent when dynamically changing the auto flush limit to a smaller value",
            stepDelay: 10,
            useFakeTimers: true,
            useFakeServer: true,
            steps: [
                () => {
                    let extConfig = this.config.extensionConfig[this.postChannel.identifier] || {};
                    this.config.extensionConfig[this.postChannel.identifier] = extConfig;

                    this.core.initialize(this.config, [this.postChannel]);
                    this.core.addNotificationListener({
                        eventsSendRequest: (sendReason: number, isAsync?: boolean) => {
                            this.eventsSendRequests.push({
                                sendReason,
                                isAsync
                            });
                        }
                    });
                    this.postChannel.processTelemetry({
                        name: 'testEvent1',
                        sync: false,
                        latency: EventLatency.Normal,
                        iKey: 'testIkey'
                    } as IPostTransmissionTelemetryItem);
                    this.postChannel.processTelemetry({
                        name: 'testEvent2',
                        sync: false,
                        latency: EventLatency.Normal,
                        iKey: 'testIkey'
                    } as IPostTransmissionTelemetryItem);
                    this.postChannel.processTelemetry({
                        name: 'testEvent3',
                        sync: false,
                        latency: EventLatency.Normal,
                        iKey: 'testIkey'
                    } as IPostTransmissionTelemetryItem);
                    QUnit.assert.equal(this.eventsSendRequests.length, 0);
                    this.clock.tick(10);
                    QUnit.assert.equal(this.eventsSendRequests.length, 0);

                    this.postChannel.setEventQueueLimits(1000, 2);
                    QUnit.assert.equal(this.eventsSendRequests.length, 0);

                    // Let the async flush occur
                    this.clock.tick(10);
                    QUnit.assert.equal(this.eventsSendRequests.length, 1);
                    QUnit.assert.equal(SendRequestReason.MaxQueuedEvents, this.eventsSendRequests[0].sendReason);
                    QUnit.assert.equal(true, this.eventsSendRequests[0].isAsync);
                }]
        });

        this.testCaseAsync({
            name: "Notifications: events are not sent when dynamically changing the auto flush limit to a larger value",
            stepDelay: 10,
            useFakeTimers: true,
            useFakeServer: true,
            steps: [
                () => {
                    let extConfig = this.config.extensionConfig[this.postChannel.identifier] || {};
                    this.config.extensionConfig[this.postChannel.identifier] = extConfig;

                    this.core.initialize(this.config, [this.postChannel]);
                    this.core.addNotificationListener({
                        eventsSendRequest: (sendReason: number, isAsync?: boolean) => {
                            this.eventsSendRequests.push({
                                sendReason,
                                isAsync
                            });
                        }
                    });
                    this.postChannel.processTelemetry({
                        name: 'testEvent1',
                        sync: false,
                        latency: EventLatency.Normal,
                        iKey: 'testIkey'
                    } as IPostTransmissionTelemetryItem);
                    this.postChannel.processTelemetry({
                        name: 'testEvent2',
                        sync: false,
                        latency: EventLatency.Normal,
                        iKey: 'testIkey'
                    } as IPostTransmissionTelemetryItem);
                    this.postChannel.processTelemetry({
                        name: 'testEvent3',
                        sync: false,
                        latency: EventLatency.Normal,
                        iKey: 'testIkey'
                    } as IPostTransmissionTelemetryItem);
                    QUnit.assert.equal(this.eventsSendRequests.length, 0);
                    this.clock.tick(10);
                    QUnit.assert.equal(this.eventsSendRequests.length, 0);

                    this.postChannel.setEventQueueLimits(1000, 10);
                    QUnit.assert.equal(this.eventsSendRequests.length, 0);

                    // Let the async flush occur
                    for (let lp = 0; lp < 10; lp++) {
                        this.clock.tick(10);
                        QUnit.assert.equal(this.eventsSendRequests.length, 0);
                    }
                }]
        });

        this.testCaseAsync({
            name: "Notifications: events are not sent when dynamically changing the auto flush limit to nothing",
            stepDelay: 10,
            useFakeTimers: true,
            useFakeServer: true,
            steps: [
                () => {
                    let extConfig = this.config.extensionConfig[this.postChannel.identifier] || {};
                    this.config.extensionConfig[this.postChannel.identifier] = extConfig;

                    this.core.initialize(this.config, [this.postChannel]);
                    this.core.addNotificationListener({
                        eventsSendRequest: (sendReason: number, isAsync?: boolean) => {
                            this.eventsSendRequests.push({
                                sendReason,
                                isAsync
                            });
                        }
                    });
                    this.postChannel.processTelemetry({
                        name: 'testEvent1',
                        sync: false,
                        latency: EventLatency.Normal,
                        iKey: 'testIkey'
                    } as IPostTransmissionTelemetryItem);
                    this.postChannel.processTelemetry({
                        name: 'testEvent2',
                        sync: false,
                        latency: EventLatency.Normal,
                        iKey: 'testIkey'
                    } as IPostTransmissionTelemetryItem);
                    this.postChannel.processTelemetry({
                        name: 'testEvent3',
                        sync: false,
                        latency: EventLatency.Normal,
                        iKey: 'testIkey'
                    } as IPostTransmissionTelemetryItem);
                    QUnit.assert.equal(this.eventsSendRequests.length, 0);
                    this.clock.tick(10);
                    QUnit.assert.equal(this.eventsSendRequests.length, 0);

                    this.postChannel.setEventQueueLimits(1000);
                    QUnit.assert.equal(this.eventsSendRequests.length, 0);

                    // Let the async flush occur
                    this.clock.tick(10);
                    QUnit.assert.equal(this.eventsSendRequests.length, 0);
                }]
        });

        this.testCase({
            name: "Notifications: validate discarded events for excessive event using beacons",
            useFakeTimers: true,
            test: () => {
                this.beaconCalls = [];
                this.hookSendBeacon((url, body) => {
                    this.beaconCalls.push({ url, body });
                    return true;
                });
                this.core.initialize(this.config, [this.postChannel]);
                this.core.addNotificationListener({
                    eventsSent: (events: IExtendedTelemetryItem[]) => {
                        for (var i = 0; i < events.length; i++) {
                            this.eventsSent.push(events[i]);
                        }
                    },
                    eventsDiscarded: (events: IExtendedTelemetryItem[]) => {
                        for (var i = 0; i < events.length; i++) {
                            this.eventsDiscarded.push(events[i]);
                        }
                    },
                });

                let eventWithVeryLongString: IPostTransmissionTelemetryItem = {
                    iKey: "testIkey",
                    name: "OfficeWAC_JS_1DS_Test_InvalidEvent",
                    data: {
                        StringValue: "Hello World Again",
                        VeryLongString: generateString(64 * 1024) // 64Kb string
                    }
                };

                this.postChannel.processTelemetry(eventWithVeryLongString);
                QUnit.assert.equal(this.beaconCalls.length, 0);
                // teardown should send events synchronously so don't cause any ticks
                this.postChannel.teardown();
                QUnit.assert.equal(this.beaconCalls.length, 0, "There should still have been 0 beacon calls");
                if (this.eventsDiscarded.length === 0) {
                    // The NotificationManger currently always sends the eventsSent() and eventsDiscarded via a timeout, so we need to schedule it
                    // Remove this after 3P Notification manager is fixed
                    this.clock.tick(1);
                } else {
                    QUnit.assert.ok(false, "Looks like the 3P notification manager is now fixed -- you should now remove this if block test work around");
                }
                QUnit.assert.equal(this.eventsSent.length, 0, "The event should not have been sent");
                QUnit.assert.equal(this.eventsDiscarded.length, 1, "The event should have been discarded");
                QUnit.assert.equal(this.eventsDiscarded[0].name, "OfficeWAC_JS_1DS_Test_InvalidEvent");
            }
        });

        this.testCase({
            name: "Notifications: validate discarded events for excessive event and large (valid) event using beacons",
            useFakeTimers: true,
            test: () => {
                this.beaconCalls = [];
                this.hookSendBeacon((url, body) => {
                    this.beaconCalls.push({ url, body });
                    return true;
                });
                this.core.initialize(this.config, [this.postChannel]);
                this.core.addNotificationListener({
                    eventsSent: (events: IExtendedTelemetryItem[]) => {
                        for (var i = 0; i < events.length; i++) {
                            this.eventsSent.push(events[i]);
                        }
                    },
                    eventsDiscarded: (events: IExtendedTelemetryItem[]) => {
                        for (var i = 0; i < events.length; i++) {
                            this.eventsDiscarded.push(events[i]);
                        }
                    },
                });

                this.postChannel.processTelemetry({
                    iKey: "testIkey",
                    name: "OfficeWAC_JS_1DS_Test_InvalidEvent",
                    data: {
                        StringValue: "Hello World Again",
                        VeryLongString: generateString(64 * 1024) // 64Kb string
                    }
                });

                this.postChannel.processTelemetry({
                    iKey: "testIkey",
                    name: "OfficeWAC_JS_1DS_Test_ValidEvent",
                    data: {
                        StringValue: "Hello World Again",
                        VeryLongString: generateString(32 * 1024) // 32Kb string
                    }
                });
                QUnit.assert.equal(this.beaconCalls.length, 0);
                // teardown should send events synchronously so don't cause any ticks
                this.postChannel.teardown();
                QUnit.assert.equal(this.beaconCalls.length, 1, "There should have been 1 beacon calls");
                if (this.eventsSent.length === 0) {
                    // The NotificationManger currently always sends the eventsSent() and eventsDiscarded via a timeout, so we need to schedule it
                    // Remove this after 3P Notification manager is fixed
                    this.clock.tick(10);
                } else {
                    QUnit.assert.ok(false, "Looks like the 3P notification manager is now fixed -- you should now remove this if block test work around");
                }
                QUnit.assert.equal(this.eventsSent.length, 1, "The valid event should have been sent");
                QUnit.assert.equal(this.eventsDiscarded.length, 1, "The event should have been discarded");
                QUnit.assert.equal(this.eventsSent[0].name, "OfficeWAC_JS_1DS_Test_ValidEvent");
                QUnit.assert.equal(this.eventsDiscarded[0].name, "OfficeWAC_JS_1DS_Test_InvalidEvent");
            }
        });

        this.testCase({
            name: "Notifications: validate discarded events for large (valid) event and then an excessive event using beacons",
            useFakeTimers: true,
            test: () => {
                this.beaconCalls = [];
                this.hookSendBeacon((url, body) => {
                    this.beaconCalls.push({ url, body });
                    return true;
                });
                this.core.initialize(this.config, [this.postChannel]);
                this.core.addNotificationListener({
                    eventsSent: (events: IExtendedTelemetryItem[]) => {
                        for (var i = 0; i < events.length; i++) {
                            this.eventsSent.push(events[i]);
                        }
                    },
                    eventsDiscarded: (events: IExtendedTelemetryItem[]) => {
                        for (var i = 0; i < events.length; i++) {
                            this.eventsDiscarded.push(events[i]);
                        }
                    },
                });

                this.postChannel.processTelemetry({
                    iKey: "testIkey",
                    name: "OfficeWAC_JS_1DS_Test_ValidEvent",
                    data: {
                        StringValue: "Hello World Again",
                        VeryLongString: generateString(60 * 1024) // 60Kb string
                    }
                });

                this.postChannel.processTelemetry({
                    iKey: "testIkey",
                    name: "OfficeWAC_JS_1DS_Test_InvalidEvent",
                    data: {
                        StringValue: "Hello World Again",
                        VeryLongString: generateString(64 * 1024) // 64Kb string
                    }
                });
                QUnit.assert.equal(this.beaconCalls.length, 0);
                // teardown should send events synchronously so don't cause any ticks
                this.postChannel.teardown();
                QUnit.assert.equal(this.beaconCalls.length, 1, "There should have been 1 beacon calls");
                if (this.eventsSent.length === 0) {
                    // The NotificationManger currently always sends the eventsSent() and eventsDiscarded via a timeout, so we need to schedule it
                    // Remove this after 3P Notification manager is fixed
                    this.clock.tick(10);
                } else {
                    QUnit.assert.ok(false, "Looks like the 3P notification manager is now fixed -- you should now remove this if block test work around");
                }
                QUnit.assert.equal(this.eventsSent.length, 1, "The valid event should have been sent");
                QUnit.assert.equal(this.eventsDiscarded.length, 1, "The event should have been discarded");
                QUnit.assert.equal(this.eventsSent[0].name, "OfficeWAC_JS_1DS_Test_ValidEvent");
                QUnit.assert.equal(this.eventsDiscarded[0].name, "OfficeWAC_JS_1DS_Test_InvalidEvent");
            }
        });

        this.testCase({
            name: "Notifications: validate discarded events for excessive event using normal flow",
            useFakeTimers: true,
            test: () => {
                this.config.extensionConfig[this.postChannel.identifier] = {
                    httpXHROverride: this.xhrOverride
                };

                this.core.initialize(this.config, [this.postChannel]);
                this.core.addNotificationListener({
                    eventsSent: (events: IExtendedTelemetryItem[]) => {
                        for (var i = 0; i < events.length; i++) {
                            this.eventsSent.push(events[i]);
                        }
                    },
                    eventsDiscarded: (events: IExtendedTelemetryItem[]) => {
                        for (var i = 0; i < events.length; i++) {
                            this.eventsDiscarded.push(events[i]);
                        }
                    },
                });

                let eventWithVeryLongString: IPostTransmissionTelemetryItem = {
                    iKey: "testIkey",
                    name: "OfficeWAC_JS_1DS_Test_InvalidEvent",
                    data: {
                        StringValue: "Hello World Again",
                        VeryLongString: generateString(2.5 * 1024 * 1024) // 2.5Mb string
                    }
                };

                this.postChannel.processTelemetry(eventWithVeryLongString);
                QUnit.assert.equal(this.eventsSent.length, 0);
                QUnit.assert.equal(this.eventsDiscarded.length, 0);
                this.postChannel.flush(false);
                this.clock.tick(100);
                QUnit.assert.equal(this.eventsSent.length, 0, "The event should not have been sent");
                QUnit.assert.equal(this.eventsDiscarded.length, 1, "The event should have been discarded");
                QUnit.assert.equal(this.eventsDiscarded[0].name, "OfficeWAC_JS_1DS_Test_InvalidEvent");
            }
        });

        this.testCase({
            name: "Notifications: validate discarded events for excessive event and a large event using normal flow",
            useFakeTimers: true,
            test: () => {
                this.config.extensionConfig[this.postChannel.identifier] = {
                    httpXHROverride: this.xhrOverride
                };

                this.core.initialize(this.config, [this.postChannel]);
                this.core.addNotificationListener({
                    eventsSent: (events: IExtendedTelemetryItem[]) => {
                        for (var i = 0; i < events.length; i++) {
                            this.eventsSent.push(events[i]);
                        }
                    },
                    eventsDiscarded: (events: IExtendedTelemetryItem[]) => {
                        for (var i = 0; i < events.length; i++) {
                            this.eventsDiscarded.push(events[i]);
                        }
                    },
                });

                this.postChannel.processTelemetry({
                    iKey: "testIkey",
                    name: "OfficeWAC_JS_1DS_Test_InvalidEvent",
                    data: {
                        StringValue: "Hello World Again",
                        VeryLongString: generateString(2.5 * 1024 * 1024) // 2.5Mb string
                    }
                });

                this.postChannel.processTelemetry({
                    iKey: "testIkey",
                    name: "OfficeWAC_JS_1DS_Test_ValidEvent",
                    data: {
                        StringValue: "Hello World Again",
                        VeryLongString: generateString(64 * 1024) // 64Kb string (bigger than the beacon limit, but ok for normal flow)
                    }
                });
                QUnit.assert.equal(this.eventsSent.length, 0);
                this.postChannel.flush(false);
                this.clock.tick(100);
                QUnit.assert.equal(this.eventsSent.length, 1, "The valid event should have been sent");
                QUnit.assert.equal(this.eventsDiscarded.length, 1, "The event should have been discarded");
                QUnit.assert.equal(this.eventsSent[0].name, "OfficeWAC_JS_1DS_Test_ValidEvent");
                QUnit.assert.equal(this.eventsDiscarded[0].name, "OfficeWAC_JS_1DS_Test_InvalidEvent");
            }
        });

        this.testCase({
            name: "Notifications: validate discarded events for a large event and then an excessive event using normal flow",
            useFakeTimers: true,
            test: () => {
                this.config.extensionConfig[this.postChannel.identifier] = {
                    httpXHROverride: this.xhrOverride
                };

                this.core.initialize(this.config, [this.postChannel]);
                this.core.addNotificationListener({
                    eventsSent: (events: IExtendedTelemetryItem[]) => {
                        for (var i = 0; i < events.length; i++) {
                            this.eventsSent.push(events[i]);
                        }
                    },
                    eventsDiscarded: (events: IExtendedTelemetryItem[]) => {
                        for (var i = 0; i < events.length; i++) {
                            this.eventsDiscarded.push(events[i]);
                        }
                    },
                });

                this.postChannel.processTelemetry({
                    iKey: "testIkey",
                    name: "OfficeWAC_JS_1DS_Test_ValidEvent",
                    data: {
                        StringValue: "Hello World Again",
                        VeryLongString: generateString(64 * 1024) // 64Kb string (bigger than the beacon limit, but ok for normal flow)
                    }
                });

                this.postChannel.processTelemetry({
                    iKey: "testIkey",
                    name: "OfficeWAC_JS_1DS_Test_InvalidEvent",
                    data: {
                        StringValue: "Hello World Again",
                        VeryLongString: generateString(2.5 * 1024 * 1024) // 2.5Mb string
                    }
                });
                QUnit.assert.equal(this.eventsSent.length, 0);
                this.postChannel.flush(false);
                this.clock.tick(100);
                QUnit.assert.equal(this.eventsSent.length, 1, "The valid event should have been sent");
                QUnit.assert.equal(this.eventsDiscarded.length, 1, "The event should have been discarded");
                QUnit.assert.equal(this.eventsSent[0].name, "OfficeWAC_JS_1DS_Test_ValidEvent");
                QUnit.assert.equal(this.eventsDiscarded[0].name, "OfficeWAC_JS_1DS_Test_InvalidEvent");
            }
        });

        this.testCase({
            name: "addResponseHandler",
            useFakeTimers: true,
            useFakeServer: true,
            test: () => {
                let handlerCalled = false;
                let extConfig = this.config.extensionConfig[this.postChannel.identifier] || {};
                this.config.extensionConfig[this.postChannel.identifier] = extConfig;

                this.core.initialize(this.config, [this.postChannel]);
                this.postChannel.addResponseHandler((responseText) => {
                    handlerCalled = true;
                });
                QUnit.assert.ok(!handlerCalled, "Make sure the response handler has not yet been called");
                this.postChannel.processTelemetry({
                    name: 'testEvent1',
                    sync: false,
                    latency: EventLatency.Normal,
                    iKey: 'testIkey'
                } as IPostTransmissionTelemetryItem);
                this.postChannel.flush();
                this.clock.tick(100);
                QUnit.assert.ok(!handlerCalled, "Make sure the response handler has not yet been called");
                this._getXhrRequests().forEach((request) => {
                    if (request.method) {
                        this.sendJsonResponse(request, {}, 200);
                    }
                });
                this.clock.tick(100);

                QUnit.assert.ok(handlerCalled, "Make sure the response handler is called");
            }
        });

        this.testCase({
            name: "removeResponseHandler",
            useFakeTimers: true,
            useFakeServer: true,
            test: () => {
                let handlerCalled = 0;
                let extConfig = this.config.extensionConfig[this.postChannel.identifier] || {};
                this.config.extensionConfig[this.postChannel.identifier] = extConfig;

                this.core.initialize(this.config, [this.postChannel]);
                let removeCall = this.postChannel.addResponseHandler((responseText) => {
                    handlerCalled += 1;
                });
                QUnit.assert.ok(handlerCalled == 0, "Make sure the response handler has not yet been called");
                
                // Send 1600 events and accumulate 1.6 seconds of "time"
                for (let lp = 0; lp < 1600; lp++) {
                    var event: IPostTransmissionTelemetryItem = {
                        name: 'testEvent-' + lp,
                        latency: EventLatency.Normal,
                        iKey: 'testIkey'
                    };
                    this.postChannel.processTelemetry(event);
                    this.clock.tick(1);
                }
              
                this.postChannel.flush();
                this.clock.tick(400);
                QUnit.assert.ok(handlerCalled == 0, "Make sure the response handler has not yet been called");
                let request = this._getXhrRequests()[0]
                this.sendJsonResponse(request, {}, 200);
                
                this.clock.tick(100);

                let num = handlerCalled;
                QUnit.assert.ok(num > 0, "Make sure the response handler is called");

                removeCall.rm();
                this.postChannel.flush();
                this.clock.tick(400);
                QUnit.assert.ok(num == handlerCalled, "Make sure the response handler has not yet been called again");
                
                request = this._getXhrRequests()[1]
                this.sendJsonResponse(request, {}, 200);
                this.clock.tick(100);
                QUnit.assert.ok(num == handlerCalled, "Make sure the response handler is removed and not being called");
            }
        });

        this.testCase({
            name: "test request batching and sending",
            useFakeTimers: true,
            test: () => {
                let sentRequests = [];
                let sentEvents = [];
                let discardEvents = [];
                let sendEvents = [];

                this.config.extensionConfig[this.postChannel.identifier] = {
                    httpXHROverride: {
                        sendPOST: (payload: IPayloadData,
                            oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                                sentRequests.push({
                                    payload: payload,
                                    isSync: sync,
                                    oncomplete: oncomplete
                                });
                            }
                    }
                };

                let extConfig = this.config.extensionConfig[this.postChannel.identifier] || {};
                this.config.extensionConfig[this.postChannel.identifier] = extConfig;

                this.core.initialize(this.config, [this.postChannel]);
                this.core.addNotificationListener({
                    eventsSent: (events: ITelemetryItem[]) => {
                        sentEvents.push(events);
                    },
                    eventsDiscarded: (events: ITelemetryItem[], reason: number) => {
                        discardEvents.push({
                            events: events,
                            reason: reason
                        });
                    },
                    eventsSendRequest: (sendReason: number, isAsync?: boolean) => {
                        sendEvents.push({
                            sendReason: sendReason,
                            isAsync: isAsync
                        });
                    }
                });

                // Send 1600 events and accumulate 1.6 seconds of "time"
                for (let lp = 0; lp < 1600; lp++) {
                    var event: IPostTransmissionTelemetryItem = {
                        name: 'testEvent-' + lp,
                        latency: EventLatency.Normal,
                        iKey: 'testIkey'
                    };
                    this.postChannel.processTelemetry(event);
                    this.clock.tick(1);
                }

                // No Events should yet be sent for "normal" events
                QUnit.assert.equal(sentRequests.length, 0, 'No events should have been triggered yet');
                QUnit.assert.equal(sendEvents.length, 0, 'No send events should have been sent yet');
                QUnit.assert.equal(sentEvents.length, 0, 'No sent events should have been sent yet');
                QUnit.assert.equal(discardEvents.length, 0, 'No discard events should have been sent yet');

                // Move timer up to 2 seconds -- triggering the first request
                this.clock.tick(400);
                // Clock Skew manager should block any additional requests from being immediately sent
                QUnit.assert.equal(sentRequests.length, 1, '1 request should have been triggered -- waiting for the kill switch for first response');
                QUnit.assert.equal(sendEvents.length, 0, '1 send event should have been sent yet -- they are sent as a async event -- based on the request type');
                QUnit.assert.equal(sentEvents.length, 0, 'No sent events should have been sent yet');
                QUnit.assert.equal(discardEvents.length, 0, 'No discard events should have been sent yet');

                // Trigger any extra event notifications
                this.clock.tick(1);
                QUnit.assert.equal(sendEvents.length, 1, '1 send event should have been sent yet -- they are sent as a async event');
                QUnit.assert.equal(sentEvents.length, 0, 'No sent events should have been sent yet');
                QUnit.assert.equal(discardEvents.length, 0, 'No discard events should have been sent yet');

                let data = sentRequests[0].payload.data.split('\n');
                QUnit.assert.equal(data.length, 500, 'There should be 500 events');

                // process the 1st request as successful, triggering a flushing of 2 additional requests
                sentRequests[0].oncomplete(200, {});

                // No extra events should be triggered yet
                QUnit.assert.equal(sentRequests.length, 3, '3 request should have been triggered');
                QUnit.assert.equal(sendEvents.length, 1, 'One send event should have been sent yet -- as they are sent async');
                QUnit.assert.equal(sentEvents.length, 0, 'No sent events should have been sent yet - they are sent async');
                QUnit.assert.equal(discardEvents.length, 0, 'No discard events should have been sent yet');

                // Trigger any extra event notifications
                this.clock.tick(1);
                QUnit.assert.equal(sendEvents.length, 3, '3 send events should have been sent yet -- they are sent as a async event');
                QUnit.assert.equal(sentEvents.length, 1, '1 sent event should have been sent yet -- they are sent async');
                QUnit.assert.equal(discardEvents.length, 0, 'No discard events should have been sent yet');

                // This should have caused an additional 2 requests to be sent
                QUnit.assert.equal(sentRequests.length, 3, '3 Events should have been triggered');
                QUnit.assert.equal(sendEvents.length, 3, '3 send events should have been sent yet');
                QUnit.assert.equal(sentEvents.length, 1, 'One sent event should have been sent yet');
                QUnit.assert.equal(discardEvents.length, 0, 'No discard events should have been sent yet');

                // process the 3rd request as successful
                sentRequests[2].oncomplete(200, {});

                // This should have caused an additional requests to be sent
                QUnit.assert.equal(sentRequests.length, 4, '4 Events should have been triggered');
                QUnit.assert.equal(sendEvents.length, 3, '3 send events should have been sent yet');
                QUnit.assert.equal(sentEvents.length, 1, '1 sent events should have been sent yet');
                QUnit.assert.equal(discardEvents.length, 0, 'No discard events should have been sent yet');

                // The forth request should have only included the remaining 400 requests
                data = sentRequests[3].payload.data.split('\n');
                QUnit.assert.equal(data.length, 100, 'There should be 100 events');

                // Trigger any extra event notifications
                this.clock.tick(1);
                QUnit.assert.equal(sentRequests.length, 4, '4 Events should have been triggered');
                QUnit.assert.equal(sendEvents.length, 4, '4 send events should have been sent yet');
                QUnit.assert.equal(sentEvents.length, 2, '2 sent (completed) events should have been sent yet');
                QUnit.assert.equal(discardEvents.length, 0, 'No discard events should have been sent yet');
            }
        });

        this.testCase({
            name: "test request batching and sending with a direct event after batched events",
            useFakeTimers: true,
            test: () => {
                let sentRequests = [];
                let sentEvents = [];
                let discardEvents = [];
                let sendEvents = [];

                this.config.extensionConfig[this.postChannel.identifier] = {
                    httpXHROverride: {
                        sendPOST: (payload: IPayloadData,
                            oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                                sentRequests.push({
                                    payload: payload,
                                    isSync: sync,
                                    oncomplete: oncomplete
                                });
                            }
                    }
                };

                let extConfig = this.config.extensionConfig[this.postChannel.identifier] || {};
                this.config.extensionConfig[this.postChannel.identifier] = extConfig;

                this.core.initialize(this.config, [this.postChannel]);
                this.core.addNotificationListener({
                    eventsSent: (events: ITelemetryItem[]) => {
                        sentEvents.push(events);
                    },
                    eventsDiscarded: (events: ITelemetryItem[], reason: number) => {
                        discardEvents.push({
                            events: events,
                            reason: reason
                        });
                    },
                    eventsSendRequest: (sendReason: number, isAsync?: boolean) => {
                        sendEvents.push({
                            sendReason: sendReason,
                            isAsync: isAsync
                        });
                    }
                });

                // Send 1600 events and accumulate 1.6 seconds of "time"
                for (let lp = 0; lp < 1600; lp++) {
                    var event: IPostTransmissionTelemetryItem = {
                        name: 'testEvent-' + lp,
                        latency: EventLatency.Normal,
                        iKey: 'testIkey'
                    };
                    this.postChannel.processTelemetry(event);
                    this.clock.tick(1);
                }

                // No Events should yet be sent for "normal" events
                QUnit.assert.equal(sentRequests.length, 0, 'No events should have been triggered yet');
                QUnit.assert.equal(sendEvents.length, 0, 'No send events should have been sent yet');
                QUnit.assert.equal(sentEvents.length, 0, 'No sent events should have been sent yet');
                QUnit.assert.equal(discardEvents.length, 0, 'No discard events should have been sent yet');

                var event: IPostTransmissionTelemetryItem = {
                    name: 'testEvent-direct0',
                    latency: EventLatency.Immediate,
                    iKey: 'testIkey'
                };
                this.postChannel.processTelemetry(event);

                // Still No Events should yet be sent for "normal" events
                QUnit.assert.equal(sentRequests.length, 0, 'No events should have been triggered yet');
                QUnit.assert.equal(sendEvents.length, 0, 'No send events should have been sent yet');
                QUnit.assert.equal(sentEvents.length, 0, 'No sent events should have been sent yet');
                QUnit.assert.equal(discardEvents.length, 0, 'No discard events should have been sent yet');

                // Move timer 1ms -- triggering the direct send
                this.clock.tick(1);

                // Clock Skew manager should block any additional requests from being immediately sent
                QUnit.assert.equal(sentRequests.length, 1, '1 request should have been triggered -- waiting for the kill switch for first response');

                let data = sentRequests[0].payload.data.split('\n');
                QUnit.assert.equal(data.length, 1, 'There should be 1 events');
                QUnit.assert.ok(data[0].indexOf("testEvent-direct0") !== -1, "The sent event should be the direct event");

                // Move timer 1ms -- triggering the notifications
                this.clock.tick(1);
                QUnit.assert.equal(sentRequests.length, 1, '1 request should have been triggered -- waiting for the kill switch for first response');
                QUnit.assert.equal(sendEvents.length, 1, '1 send event should have been sent yet -- they are sent as a async event -- based on the request type');
                QUnit.assert.equal(sentEvents.length, 0, 'No sent events should have been sent yet');
                QUnit.assert.equal(discardEvents.length, 0, 'No discard events should have been sent yet');

                // Move timer up to 2 seconds -- triggering the timeout for normal requests
                this.clock.tick(399);

                // Clock Skew manager should block any additional requests from being immediately sent
                QUnit.assert.equal(sentRequests.length, 1, '1 request should have been triggered -- waiting for the kill switch for first response');
                QUnit.assert.equal(sendEvents.length, 1, '1 send event should have been sent yet -- they are sent as a async event -- based on the request type');
                QUnit.assert.equal(sentEvents.length, 0, 'No sent events should have been sent yet');
                QUnit.assert.equal(discardEvents.length, 0, 'No discard events should have been sent yet');

                // process the 1st request as successful, triggering a flushing of 2 additional requests
                sentRequests[0].oncomplete(200, {});

                QUnit.assert.equal(sentRequests.length, 3, '3 request should have been triggered -- waiting for the kill switch for first response');
                QUnit.assert.equal(sendEvents.length, 1, '1 send event should have been sent yet -- they are sent as a async event');
                QUnit.assert.equal(sentEvents.length, 0, 'No sent events should have been sent yet');
                QUnit.assert.equal(discardEvents.length, 0, 'No discard events should have been sent yet');

                data = sentRequests[1].payload.data.split('\n');
                QUnit.assert.equal(data.length, 500, 'There should be 500 events');

                data = sentRequests[2].payload.data.split('\n');
                QUnit.assert.equal(data.length, 500, 'There should be 500 events');

                // Trigger any extra event notifications and 2nd send
                this.clock.tick(1);

                // No extra events should be triggered yet
                QUnit.assert.equal(sentRequests.length, 3, '3 request should have been triggered');
                QUnit.assert.equal(sendEvents.length, 3, 'Three send event should have been sent yet -- as they are sent async');
                QUnit.assert.equal(sentEvents.length, 1, 'No sent events should have been sent yet - they are sent async');
                QUnit.assert.equal(discardEvents.length, 0, 'No discard events should have been sent yet');

                // process the 3rd request as successful
                sentRequests[2].oncomplete(200, {});

                // This should have caused an additional request to be sent (Direct + Normal + Normal (complete) + Normal)
                QUnit.assert.equal(sentRequests.length, 4, '4 Events should have been triggered');
                QUnit.assert.equal(sendEvents.length, 3, '3 send events should have been sent yet');
                QUnit.assert.equal(sentEvents.length, 1, '1 sent events should have been sent yet');
                QUnit.assert.equal(discardEvents.length, 0, 'No discard events should have been sent yet');

                // Trigger any extra event notifications and 2nd send
                this.clock.tick(1);

                QUnit.assert.equal(sentRequests.length, 4, '4 Events should have been triggered');
                QUnit.assert.equal(sendEvents.length, 4, '4 send events should have been sent yet');
                QUnit.assert.equal(sentEvents.length, 2, '1 sent events should have been sent yet');
                QUnit.assert.equal(discardEvents.length, 0, 'No discard events should have been sent yet');

                data = sentRequests[3].payload.data.split('\n');
                QUnit.assert.equal(data.length, 500, 'There should be 500 events');

                // process the 3rd request as successful
                sentRequests[1].oncomplete(200, {});

                // This should have caused an additional request to be sent (Direct + Normal (complete) + Normal (complete) + Normal + Normal)
                QUnit.assert.equal(sentRequests.length, 5, '5 Events should have been triggered');
                QUnit.assert.equal(sendEvents.length, 4, '4 send events should have been sent yet');
                QUnit.assert.equal(sentEvents.length, 2, '1 sent events should have been sent yet');
                QUnit.assert.equal(discardEvents.length, 0, 'No discard events should have been sent yet');

                // Trigger any extra event notifications
                this.clock.tick(1);
                // This should have caused an additional request to be sent (Direct + Normal (complete) + Normal (complete) + Normal + Normal)
                QUnit.assert.equal(sentRequests.length, 5, '5 Events should have been triggered');
                QUnit.assert.equal(sendEvents.length, 5, '5 send events should have been sent yet');
                QUnit.assert.equal(sentEvents.length, 3, '3 sent events should have been sent yet');
                QUnit.assert.equal(discardEvents.length, 0, 'No discard events should have been sent yet');

                // The forth request should have only included the remaining 400 requests
                data = sentRequests[4].payload.data.split('\n');
                QUnit.assert.equal(data.length, 100, 'There should be 100 events');

                // Trigger any extra event notifications
                this.clock.tick(1);
                QUnit.assert.equal(sentRequests.length, 5, '5 Events should have been triggered');
                QUnit.assert.equal(sendEvents.length, 5, '5 send events should have been sent yet');
                QUnit.assert.equal(sentEvents.length, 3, '3 sent (completed) events should have been sent yet');
                QUnit.assert.equal(discardEvents.length, 0, 'No discard events should have been sent yet');
            }
        });

        this.testCase({
            name: "test the default queueSize and discard events with excessive events before the first flush request with no response",
            useFakeTimers: true,
            test: () => {
                let sentRequests = [];
                let sentEvents = [];
                let discardEvents = [];
                let sendEvents = [];

                this.config.extensionConfig![this.postChannel.identifier] = {
                    httpXHROverride: {
                        sendPOST: (payload: IPayloadData,
                            oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                                sentRequests.push({
                                    payload: payload,
                                    isSync: sync,
                                    oncomplete: oncomplete
                                });
                            }
                    }
                };

                let extConfig = this.config.extensionConfig![this.postChannel.identifier] || {};
                this.config.extensionConfig![this.postChannel.identifier] = extConfig;

                this.core.initialize(this.config, [this.postChannel]);
                this.core.addNotificationListener({
                    eventsSent: (events: ITelemetryItem[]) => {
                        sentEvents.push(events);
                    },
                    eventsDiscarded: (events: ITelemetryItem[], reason: number) => {
                        discardEvents.push({
                            events: events,
                            reason: reason
                        });
                    },
                    eventsSendRequest: (sendReason: number, isAsync?: boolean) => {
                        sendEvents.push({
                            sendReason: sendReason,
                            isAsync: isAsync
                        });
                    }
                });

                // Send 11666 events = Queuelimit of 10,000 + auto flush limit 1,667
                for (let lp = 0; lp < 11667; lp++) {
                    this.postChannel.processTelemetry({
                        name: 'testEvent-' + lp,
                        latency: EventLatency.Normal,
                        iKey: 'testIkey'
                    } as IPostTransmissionTelemetryItem);
                }

                QUnit.assert.equal(sendEvents.length, 0, 'No Send events yet as they are sent async');
                QUnit.assert.equal(sentRequests.length, 0, "We haven't actually sent the request yet");

                // Include 10 additional events -- triggering 1 discard batch
                for (let lp = 0; lp < 10; lp++) {
                    this.postChannel.processTelemetry({
                        name: 'discardTriggerEvent-' + lp,
                        latency: EventLatency.Normal,
                        iKey: 'testIkey'
                    } as IPostTransmissionTelemetryItem);
                }

                // Let the auto flush send event to send
                this.clock.tick(1);
                QUnit.assert.equal(sendEvents.length, 1, 'Only 1 request should have been sent because of the kill switch');
                QUnit.assert.equal(sentRequests.length, 1, 'Only 1 request should have been sent because of the kill switch');

                let data = sentRequests[0].payload.data.split('\n');
                QUnit.assert.equal(data.length, 500, 'There should be 500 events');

                // Allow the request and event notifications to be sent
                this.clock.tick(1);
                QUnit.assert.equal(sendEvents.length, 1, 'Only 1 request should have been sent because of the kill switch');
                QUnit.assert.equal(sentRequests.length, 1, 'Only 1 request should have been sent because of the kill switch');
                QUnit.assert.equal(discardEvents.length, 1, 'We should have at least 1 discard event');

                sentRequests[0].oncomplete(200, {});

                this.clock.tick(1);
                QUnit.assert.equal(sendEvents.length, 3, '3 request should now have been sent');
                QUnit.assert.equal(sentRequests.length, 3, '3 request should now have been sent');
                QUnit.assert.equal(discardEvents.length, 1, 'We should have at least 1 discard event');

                QUnit.assert.equal(discardEvents[0].events.length, 20, 'There should be 20 discarded events');
                QUnit.assert.equal(discardEvents[0].events[0].name, 'testEvent-1667', 'The first event discarded should be event 1667 not the extra discarded event');
                QUnit.assert.equal(discardEvents[0].events[1].name, 'testEvent-1668', 'The second event discarded should be event 1668 not the extra discarded event');

                QUnit.assert.ok(JSON.stringify(discardEvents[0].events).indexOf('discardTriggerEvent-') === -1, 'The discard trigger event should not have been the event discarded');
            }
        });

        this.testCase({
            name: "test the default queueSize and discard events with excessive events before the first flush request with no response and direct latency",
            useFakeTimers: true,
            test: () => {
                let sentRequests = [];
                let sentEvents = [];
                let discardEvents = [];
                let sendEvents = [];

                this.config.extensionConfig[this.postChannel.identifier] = {
                    httpXHROverride: {
                        sendPOST: (payload: IPayloadData,
                            oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                                sentRequests.push({
                                    payload: payload,
                                    isSync: sync,
                                    oncomplete: oncomplete
                                });
                            }
                    }
                };

                let extConfig = this.config.extensionConfig[this.postChannel.identifier] || {};
                this.config.extensionConfig[this.postChannel.identifier] = extConfig;

                this.core.initialize(this.config, [this.postChannel]);
                this.core.addNotificationListener({
                    eventsSent: (events: ITelemetryItem[]) => {
                        sentEvents.push(events);
                    },
                    eventsDiscarded: (events: ITelemetryItem[], reason: number) => {
                        discardEvents.push({
                            events: events,
                            reason: reason
                        });
                    },
                    eventsSendRequest: (sendReason: number, isAsync?: boolean) => {
                        sendEvents.push({
                            sendReason: sendReason,
                            isAsync: isAsync
                        });
                    }
                });

                // Send 100 normal events
                for (let lp = 0; lp < 100; lp++) {
                    this.postChannel.processTelemetry({
                        name: 'testEvent-' + lp,
                        latency: EventLatency.Normal,
                        iKey: 'testIkey'
                    } as IPostTransmissionTelemetryItem);
                }

                // Send 10 direct events (should not cause any additional normal events to be discarded)
                // As direct events are not "effectively" batched as part of the normal queuing
                for (let lp = 0; lp < 10; lp++) {
                    this.postChannel.processTelemetry({
                        name: 'testEvent-direct-' + lp,
                        latency: EventLatency.Immediate,
                        iKey: 'testIkey'
                    } as IPostTransmissionTelemetryItem);
                }

                // Send 11566 additional events = Queuelimit of 10,000 + auto flush limit 1,667
                for (let lp = 100; lp < 11667; lp++) {
                    this.postChannel.processTelemetry({
                        name: 'testEvent-' + lp,
                        latency: EventLatency.Normal,
                        iKey: 'testIkey'
                    } as IPostTransmissionTelemetryItem);
                }

                QUnit.assert.equal(sendEvents.length, 0, 'No Send events yet as they are sent async');
                QUnit.assert.equal(sentRequests.length, 0, "We haven't actually sent the request yet");

                // Let the direct events to send
                this.clock.tick(1);
                QUnit.assert.equal(sendEvents.length, 1, 'Only 1 request should have been sent because of the kill switch');
                QUnit.assert.equal(sentRequests.length, 1, 'Only 1 request should have been sent because of the kill switch');
                QUnit.assert.equal(discardEvents.length, 0, 'We should have at least 0 discard event');

                let data = sentRequests[0].payload.data.split('\n');
                QUnit.assert.equal(data.length, 500, 'There should be 500 events -- the 10 direct plus 490 normal events');
                QUnit.assert.ok(data[0].indexOf('testEvent-direct-0') !== -1);
                QUnit.assert.ok(data[9].indexOf('testEvent-direct-9') !== -1);

                this.postChannel.processTelemetry({
                    name: 'discardTriggerEvent-0',
                    latency: EventLatency.Normal,
                    iKey: 'testIkey'
                } as IPostTransmissionTelemetryItem);

                // Cause the direct send events to process (unblocking normal sending)
                sentRequests[0].oncomplete(200, {});

                data = sentRequests[1].payload.data.split('\n');
                QUnit.assert.equal(data.length, 500, 'There should be 500 events');

                data = sentRequests[2].payload.data.split('\n');
                QUnit.assert.equal(data.length, 500, 'There should be 500 events');

                // Allow the request and event notifications to be sent
                this.clock.tick(1);
                QUnit.assert.equal(sendEvents.length, 3, 'Only 1 request should have been sent because of the kill switch');
                QUnit.assert.equal(sentRequests.length, 3, 'Only 1 request should have been sent because of the kill switch');
                QUnit.assert.equal(discardEvents.length, 1, 'We should have at least 1 discard event');

                sentRequests[1].oncomplete(200, {});

                this.clock.tick(1);
                QUnit.assert.equal(sendEvents.length, 4, '4 request should now have been sent');
                QUnit.assert.equal(sentRequests.length, 4, '4 request should now have been sent');
                QUnit.assert.equal(discardEvents.length, 1, 'We should have at least 1 discard event');

                QUnit.assert.equal(discardEvents[0].events.length, 20, 'There should be 20 discarded events');
                QUnit.assert.equal(discardEvents[0].events[0].name, 'testEvent-1667', 'The first event discarded should be event 1667 not the extra discarded event');
                QUnit.assert.equal(discardEvents[0].events[1].name, 'testEvent-1668', 'The second event discarded should be event 1668 not the extra discarded event');

                QUnit.assert.ok(JSON.stringify(discardEvents[0].events).indexOf('discardTriggerEvent-0') === -1, 'The discard trigger event should not have been the event discarded');
            }
        });

        this.testCase({
            name: "test the default queueSize and discard events with excessive events after the first flush request with no response",
            useFakeTimers: true,
            test: () => {
                let sentRequests = [];
                let sentEvents = [];
                let discardEvents = [];
                let sendEvents = [];

                this.config.extensionConfig[this.postChannel.identifier] = {
                    httpXHROverride: {
                        sendPOST: (payload: IPayloadData,
                            oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                                sentRequests.push({
                                    payload: payload,
                                    isSync: sync,
                                    oncomplete: oncomplete
                                });
                            }
                    }
                };

                let extConfig = this.config.extensionConfig[this.postChannel.identifier] || {};
                this.config.extensionConfig[this.postChannel.identifier] = extConfig;

                this.core.initialize(this.config, [this.postChannel]);
                this.core.addNotificationListener({
                    eventsSent: (events: ITelemetryItem[]) => {
                        sentEvents.push(events);
                    },
                    eventsDiscarded: (events: ITelemetryItem[], reason: number) => {
                        discardEvents.push({
                            events: events,
                            reason: reason
                        });
                    },
                    eventsSendRequest: (sendReason: number, isAsync?: boolean) => {
                        sendEvents.push({
                            sendReason: sendReason,
                            isAsync: isAsync
                        });
                    }
                });

                // Send 11666 events = Queue limit of 10,000 + auto flush limit 1,667
                for (let lp = 0; lp < 11667; lp++) {
                    this.postChannel.processTelemetry({
                        name: 'testEvent-' + lp,
                        latency: EventLatency.Normal,
                        iKey: 'testIkey'
                    } as IPostTransmissionTelemetryItem);
                }

                QUnit.assert.equal(sendEvents.length, 0, 'No Send events yet as they are sent async');
                QUnit.assert.equal(sentRequests.length, 0, "We haven't actually sent the request yet");

                // Let the auto flush queue and send event -- this will also clear the queue from the PostChannel
                this.clock.tick(1);
                QUnit.assert.equal(sendEvents.length, 1, 'Only 1 request should have been sent because of the kill switch');
                QUnit.assert.equal(sentRequests.length, 1, 'Only 1 request should have been sent because of the kill switch');
                
                let data = sentRequests[0].payload.data.split('\n');
                QUnit.assert.equal(data.length, 500, 'There should be 500 events');

                // No process the "extra" event (which fails if flush has not occurred)
                this.postChannel.processTelemetry({
                    name: 'discardEvent-0',
                    latency: EventLatency.Normal,
                    iKey: 'testIkey'
                } as IPostTransmissionTelemetryItem);

                // Allow the request and event notifications to be sent
                this.clock.tick(1);
                QUnit.assert.equal(sendEvents.length, 1, 'Only 1 request should have been sent because of the kill switch');
                QUnit.assert.equal(sentRequests.length, 1, 'Only 1 request should have been sent because of the kill switch');
                QUnit.assert.equal(discardEvents.length, 0, 'Nothing should have been discarded as the events are scheduled to be sent');

                sentRequests[0].oncomplete(200, {});

                this.clock.tick(1);
                QUnit.assert.equal(sendEvents.length, 3, '3 request should now have been sent');
                QUnit.assert.equal(sentRequests.length, 3, '3 request should now have been sent');
                QUnit.assert.equal(discardEvents.length, 0, 'Nothing should have been discarded as the events are scheduled to be sent');
            }
        });

        this.testCase({
            name: "test mixed event latency batching and sending",
            useFakeTimers: true,
            test: () => {
                let sentRequests = [];
                let sentEvents = [];
                let discardEvents = [];
                let sendEvents = [];

                this.config.extensionConfig[this.postChannel.identifier] = {
                    httpXHROverride: {
                        sendPOST: (payload: IPayloadData,
                            oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                                sentRequests.push({
                                    payload: payload,
                                    isSync: sync,
                                    oncomplete: oncomplete
                                });
                            }
                    }
                };

                let extConfig = this.config.extensionConfig[this.postChannel.identifier] || {};
                this.config.extensionConfig[this.postChannel.identifier] = extConfig;

                this.core.initialize(this.config, [this.postChannel]);
                this.core.addNotificationListener({
                    eventsSent: (events: ITelemetryItem[]) => {
                        sentEvents.push(events);
                    },
                    eventsDiscarded: (events: ITelemetryItem[], reason: number) => {
                        discardEvents.push({
                            events: events,
                            reason: reason
                        });
                    },
                    eventsSendRequest: (sendReason: number, isAsync?: boolean) => {
                        sendEvents.push({
                            sendReason: sendReason,
                            isAsync: isAsync
                        });
                    }
                });

                let latencyMap = {
                    [EventLatency.Normal] : [],
                    [EventLatency.RealTime] : []
                };
                // Send 1600 events and accumulate 1.6 seconds of "time"
                for (let lp = 0; lp < 1600; lp++) {
                    var event: IPostTransmissionTelemetryItem = {
                        name: 'testEvent-' + lp,
                        latency: lp % 2 ? EventLatency.Normal : EventLatency.RealTime,
                        iKey: 'testIkey'
                    };
                    latencyMap[event.latency].push(event.name);
                    this.postChannel.processTelemetry(event);
                    this.clock.tick(1);
                }

                // No Events should yet be sent for "normal" events, but the "realtime" ones should have been 
                QUnit.assert.equal(sentRequests.length, 1, 'Critical events should have been triggered yet');
                QUnit.assert.equal(sendEvents.length, 1, '1 send event should have been sent -- they are sent as a async event');
                QUnit.assert.equal(sentEvents.length, 0, 'No sent events should have been sent yet');
                QUnit.assert.equal(discardEvents.length, 0, 'No discard events should have been sent yet');

                let data = sentRequests[0].payload.data.split('\n');
                QUnit.assert.equal(data.length, 500, 'There should be 500 events');

                let allCritical = true;
                for (let lp = 0; lp < data.length; lp++) {
                    let evt = JSON.parse(data[lp]);
                    if (latencyMap[EventLatency.RealTime].indexOf(evt.name) === -1) {
                        QUnit.assert.ok(false, "Event does not belong to the RealTime Latency - " + JSON.stringify(evt));
                        allCritical = false;
                        break;
                    }
                }
                QUnit.assert.ok(allCritical, "Not all of the events in batch 1 where realtime events");

                // Move timer up to 2 seconds -- triggering the second request which should contain a mixture of events (normal / realtime)
                this.clock.tick(400);
                // Clock Skew manager should block any additional requests from being immediately sent
                QUnit.assert.equal(sentRequests.length, 1, '1 request should have been triggered -- waiting for the kill switch for first response');
                QUnit.assert.equal(sendEvents.length, 1, '1 send event should have been sent yet -- they are sent as a async event -- based on the request type');
                QUnit.assert.equal(sentEvents.length, 0, 'No sent events should have been sent yet');
                QUnit.assert.equal(discardEvents.length, 0, 'No discard events should have been sent yet');

                // Trigger any extra event notifications
                this.clock.tick(1);
                QUnit.assert.equal(sentRequests.length, 1, '1 request should have been triggered -- waiting for the kill switch for first response');
                QUnit.assert.equal(sentEvents.length, 0, 'No sent events should have been sent yet');
                QUnit.assert.equal(discardEvents.length, 0, 'No discard events should have been sent yet');

                // process the 1st request as successful, triggering a flushing of 2 additional requests
                sentRequests[0].oncomplete(200, {});

                // No extra events should be triggered yet
                QUnit.assert.equal(sentRequests.length, 3, '3 request should have been triggered');
                QUnit.assert.equal(sendEvents.length, 1, 'One send event should have been sent yet -- as they are sent async');
                QUnit.assert.equal(sentEvents.length, 0, 'No sent events should have been sent yet - they are sent async');
                QUnit.assert.equal(discardEvents.length, 0, 'No discard events should have been sent yet');

                data = sentRequests[1].payload.data.split('\n');
                QUnit.assert.equal(data.length, 500, 'Second batch should also contain 500 events');

                let hasCritical = false;
                let hasNormal = false;
                arrForEach(data, (evtData: string) => {
                    let evt = JSON.parse(evtData);
                    hasNormal = hasNormal || latencyMap[EventLatency.Normal].indexOf(evt.name) !== -1;
                    hasCritical = hasCritical || latencyMap[EventLatency.RealTime].indexOf(evt.name) !== -1;
                });

                QUnit.assert.ok(hasCritical, "Batch must contain realtime events - " + JSON.stringify(data));
                QUnit.assert.ok(hasNormal, "Batch must contain normal events - " + JSON.stringify(data));

                // Trigger any extra event notifications
                this.clock.tick(1);
                QUnit.assert.equal(sendEvents.length, 3, '3 send events should have been sent yet -- they are sent as a async event');
                QUnit.assert.equal(sentEvents.length, 1, '1 sent event should have been sent yet -- they are sent async');
                QUnit.assert.equal(discardEvents.length, 0, 'No discard events should have been sent yet');

                // This should have caused an additional 2 requests to be sent
                QUnit.assert.equal(sentRequests.length, 3, '3 Events should have been triggered');
                QUnit.assert.equal(sendEvents.length, 3, '3 send events should have been sent yet');
                QUnit.assert.equal(sentEvents.length, 1, 'One sent event should have been sent yet');
                QUnit.assert.equal(discardEvents.length, 0, 'No discard events should have been sent yet');

                // process the 3rd request as successful
                sentRequests[2].oncomplete(200, {});

                // This should have caused an additional requests to be sent
                QUnit.assert.equal(sentRequests.length, 4, '4 Events should have been triggered');
                QUnit.assert.equal(sendEvents.length, 3, '3 send events should have been sent yet');
                QUnit.assert.equal(sentEvents.length, 1, '1 sent events should have been sent yet');
                QUnit.assert.equal(discardEvents.length, 0, 'No discard events should have been sent yet');

                // The forth request should have only included the remaining 400 requests
                data = sentRequests[3].payload.data.split('\n');
                QUnit.assert.equal(data.length, 100, 'There should be 100 events');

                hasCritical = false;
                hasNormal = false;
                arrForEach(data, (evtData: string) => {
                    let evt = JSON.parse(evtData);
                    hasNormal = hasNormal || latencyMap[EventLatency.Normal].indexOf(evt.name) !== -1;
                    hasCritical = hasCritical || latencyMap[EventLatency.RealTime].indexOf(evt.name) !== -1;
                });

                QUnit.assert.ok(!hasCritical, "All critical events should have been sent in the first 2 batches - " + JSON.stringify(data));
                QUnit.assert.ok(hasNormal, "Batch must contain normal events - " + JSON.stringify(data));

                // Trigger any extra event notifications
                this.clock.tick(1);
                QUnit.assert.equal(sentRequests.length, 4, '4 Events should have been triggered');
                QUnit.assert.equal(sendEvents.length, 4, '4 send events should have been sent yet');
                QUnit.assert.equal(sentEvents.length, 2, '2 sent (completed) events should have been sent yet');
                QUnit.assert.equal(discardEvents.length, 0, 'No discard events should have been sent yet');
            }
        });

        this.testCase({
            name: "test the queue counts are reset when events can't be dropped",
            useFakeTimers: true,
            test: () => {
                let sentRequests = [];
                let sentEvents = [];
                let discardEvents = [];
                let sendEvents = [];

                this.config.extensionConfig[this.postChannel.identifier] = {
                    httpXHROverride: {
                        sendPOST: (payload: IPayloadData,
                            oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                                sentRequests.push({
                                    payload: payload,
                                    isSync: sync,
                                    oncomplete: oncomplete
                                });
                            }
                    }
                };

                let extConfig = this.config.extensionConfig[this.postChannel.identifier] || {};
                this.config.extensionConfig[this.postChannel.identifier] = extConfig;

                this.core.initialize(this.config, [this.postChannel]);
                this.core.addNotificationListener({
                    eventsSent: (events: ITelemetryItem[]) => {
                        sentEvents.push(events);
                    },
                    eventsDiscarded: (events: ITelemetryItem[], reason: number) => {
                        discardEvents.push({
                            events: events,
                            reason: reason
                        });
                    },
                    eventsSendRequest: (sendReason: number, isAsync?: boolean) => {
                        sendEvents.push({
                            sendReason: sendReason,
                            isAsync: isAsync
                        });
                    }
                });

                // Send 11666 events = Queuelimit of 10,000 + auto flush limit 1,667
                for (let lp = 0; lp < 11667; lp++) {
                    this.postChannel.processTelemetry({
                        name: 'testEvent-' + lp,
                        latency: EventLatency.RealTime,
                        iKey: 'testIkey'
                    } as IPostTransmissionTelemetryItem);
                }

                QUnit.assert.equal(sendEvents.length, 0, 'No Send events yet as they are sent async');
                QUnit.assert.equal(sentRequests.length, 0, "We haven't actually sent the request yet");

                // Attempt to add a normal event that should get discarded
                this.postChannel.processTelemetry({
                    name: 'discardTriggerEvent-0',
                    latency: EventLatency.Normal,
                    iKey: 'testIkey'
                } as IPostTransmissionTelemetryItem);

                // Let the auto flush send event to send
                this.clock.tick(1);
                QUnit.assert.equal(sendEvents.length, 1, 'Only 1 request should have been sent because of the kill switch');
                QUnit.assert.equal(sentRequests.length, 1, 'Only 1 request should have been sent because of the kill switch');
                QUnit.assert.equal(discardEvents.length, 1, 'We should have at least 1 discard event');

                QUnit.assert.equal(discardEvents[0].events.length, 1, 'There should be 1 discarded event');
                QUnit.assert.equal(discardEvents[0].events[0].name, 'discardTriggerEvent-0', 'The first event discarded should be event discardTriggerEvent-0');
            }
        });

        this.testCase({
            name: "Validate unload scenario with zero response code and requeuing during beforeunload/unload - default",
            useFakeTimers: true,
            test: () => {
                let sentNotifications = [];
                let discardNotifications = [];
                let sendNotifications = [];
                let xhrRequests = [];
                let beaconCalls = [];

                this.hookSendBeacon((url, data) => {
                    beaconCalls.push({
                        url,
                        data,
                    });
                    return false;
                });

                var fetchCalls = this.hookFetch((resolve, reject) => {
                    setTimeout(function() {
                        reject();
                    }, 0);
                });

                this.config.extensionConfig[this.postChannel.identifier] = {
                    httpXHROverride: {
                        sendPOST: (payload: IPayloadData,
                            oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                                xhrRequests.push({
                                    payload: payload,
                                    isSync: sync,
                                    oncomplete: oncomplete
                                });

                                // Return on error immediately to simulate a synchronous failure
                                oncomplete(0, {});
                            }
                    }
                };

                let channelConfig: IChannelConfiguration = this.config.extensionConfig[this.postChannel.identifier] || {};
                this.config.extensionConfig[this.postChannel.identifier] = channelConfig;

                // Always use the XHR Override so that we can correct simulate a zero response
                channelConfig.alwaysUseXhrOverride = true;

                this.core.initialize(this.config, [this.postChannel]);
                this.core.addNotificationListener({
                    eventsSent: (events: ITelemetryItem[]) => {
                        sentNotifications.push(events);
                    },
                    eventsDiscarded: (events: ITelemetryItem[], reason: number) => {
                        discardNotifications.push({
                            events: events,
                            reason: reason
                        });
                    },
                    eventsSendRequest: (sendReason: number, isAsync?: boolean) => {
                        sendNotifications.push({
                            sendReason: sendReason,
                            isAsync: isAsync
                        });
                    }
                });

                for (let lp = 0; lp < 50; lp++) {
                    this.postChannel.processTelemetry({
                        name: 'testEvent-' + lp,
                        latency: EventLatency.RealTime,
                        iKey: 'testIkey'
                    } as IPostTransmissionTelemetryItem);
                }

                QUnit.assert.equal(sendNotifications.length, 0, 'No Send events yet as they are sent');
                QUnit.assert.equal(sentNotifications.length, 0, 'No Sent events yet as they are sent');
                QUnit.assert.equal(discardNotifications.length, 0, 'No Discard events yet as they are sent');
                QUnit.assert.equal(xhrRequests.length, 0, "We haven't actually sent the request yet");
                QUnit.assert.equal(fetchCalls.length, 0, "No Fetch requests");
                QUnit.assert.equal(beaconCalls.length, 0, "No Beacon requests");

                // Simulate an beforeunload event which will cause the event to get re-queued
                document.dispatchEvent(new Event("beforeunload"));
                QUnit.assert.equal(sendNotifications.length, 1, 'We should now have attempted to send the events');
                QUnit.assert.equal(sentNotifications.length, 0, 'No Sent events yet as they are sent');
                QUnit.assert.equal(discardNotifications.length, 0, 'No Discard events yet as they are sent');
                QUnit.assert.equal(xhrRequests.length, 1, "Only 1 requests should be sent");
                QUnit.assert.equal(fetchCalls.length, 0, "No Fetch requests");
                QUnit.assert.equal(beaconCalls.length, 0, "No Beacon requests");

                // Let the auto flush send event to send
                this.clock.tick(1);
                QUnit.assert.equal(sendNotifications.length, 1, '1 requests should have been sent because of requeue and sync resend');
                QUnit.assert.equal(xhrRequests.length, 1, '1 request should have been sent because of requeue and sync resend');
                QUnit.assert.equal(discardNotifications.length, 0, 'We should have at least no discard events');

                // Simulate an unload event which will cause the event triggering the internal unload logic
                document.dispatchEvent(new Event("unload"));
                QUnit.assert.equal(sendNotifications.length, 2, 'We should now have attempted to send the events');
                QUnit.assert.equal(sentNotifications.length, 0, 'No Sent events yet as they are sent');
                QUnit.assert.equal(xhrRequests.length, 2, "2 requests should be sent");
                QUnit.assert.equal(fetchCalls.length, 0, "No Fetch requests");
                QUnit.assert.equal(beaconCalls.length, 0, "No Beacon requests");

                QUnit.assert.equal(discardNotifications.length, 0, 'There should no discarded events yet!');
                // Discard events are always executed on the next cycle
                this.clock.tick(1);
                QUnit.assert.equal(discardNotifications.length, 1, 'There should be 1 batch of events should have been discarded');
                QUnit.assert.equal(discardNotifications[0].events.length, 50, 'There should be 50 discarded event');
                QUnit.assert.equal(discardNotifications[0].events[0].name, 'testEvent-0', 'The first event discarded should be event testEvent-0');

                // Lets tick over some time to see if anything else happens
                this.clock.tick(10000);
                QUnit.assert.equal(sendNotifications.length, 2, '2 requests should have been sent because of requeue and sync resend');
                QUnit.assert.equal(xhrRequests.length, 2, '2 requests should have been sent because of requeue and sync resend');

                QUnit.assert.equal(discardNotifications.length, 1, 'There should be 1 batch of events should have been discarded');
                QUnit.assert.equal(discardNotifications[0].events.length, 50, 'There should be 50 discarded event');
                QUnit.assert.equal(discardNotifications[0].events[0].name, 'testEvent-0', 'The first event discarded should be event testEvent-0');
            }
        });

        this.testCase({
            name: "Validate unload scenario with zero response code and requeuing during beforeunload/unload - maxUnloadRetryEvents == 5",
            useFakeTimers: true,
            test: () => {
                let sentNotifications = [];
                let discardNotifications = [];
                let sendNotifications = [];
                let xhrRequests = [];
                let beaconCalls = [];

                this.hookSendBeacon((url, data) => {
                    beaconCalls.push({
                        url,
                        data,
                    });
                    return false;
                });

                var fetchCalls = this.hookFetch((resolve, reject) => {
                    setTimeout(function() {
                        reject();
                    }, 0);
                });

                this.config.extensionConfig[this.postChannel.identifier] = {
                    httpXHROverride: {
                        sendPOST: (payload: IPayloadData,
                            oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                                xhrRequests.push({
                                    payload: payload,
                                    isSync: sync,
                                    oncomplete: oncomplete
                                });

                                // Return on error immediately to simulate a synchronous failure
                                oncomplete(0, {});
                            }
                    }
                };

                let channelConfig: IChannelConfiguration = this.config.extensionConfig[this.postChannel.identifier] || {};
                this.config.extensionConfig[this.postChannel.identifier] = channelConfig;

                // Always use the XHR Override so that we can correct simulate a zero response
                channelConfig.alwaysUseXhrOverride = true;
                channelConfig.maxUnloadEventRetryAttempts = 5;

                this.core.initialize(this.config, [this.postChannel]);
                this.core.addNotificationListener({
                    eventsSent: (events: ITelemetryItem[]) => {
                        sentNotifications.push(events);
                    },
                    eventsDiscarded: (events: ITelemetryItem[], reason: number) => {
                        discardNotifications.push({
                            events: events,
                            reason: reason
                        });
                    },
                    eventsSendRequest: (sendReason: number, isAsync?: boolean) => {
                        sendNotifications.push({
                            sendReason: sendReason,
                            isAsync: isAsync
                        });
                    }
                });

                for (let lp = 0; lp < 50; lp++) {
                    this.postChannel.processTelemetry({
                        name: 'testEvent-' + lp,
                        latency: EventLatency.RealTime,
                        iKey: 'testIkey'
                    } as IPostTransmissionTelemetryItem);
                }

                QUnit.assert.equal(sendNotifications.length, 0, 'No Send events yet as they are sent');
                QUnit.assert.equal(sentNotifications.length, 0, 'No Sent events yet as they are sent');
                QUnit.assert.equal(discardNotifications.length, 0, 'No Discard events yet as they are sent');
                QUnit.assert.equal(xhrRequests.length, 0, "We haven't actually sent the request yet");
                QUnit.assert.equal(fetchCalls.length, 0, "No Fetch requests");
                QUnit.assert.equal(beaconCalls.length, 0, "No Beacon requests");

                // Simulate an beforeunload event which will cause the event to get re-queued
                document.dispatchEvent(new Event("beforeunload"));
                QUnit.assert.equal(sendNotifications.length, 1, 'We should now have attempted to send the events');
                QUnit.assert.equal(sentNotifications.length, 0, 'No Sent events yet as they are sent');
                QUnit.assert.equal(discardNotifications.length, 0, 'No Discard events yet as they are sent');
                QUnit.assert.equal(xhrRequests.length, 1, "Only 1 requests should be sent");
                QUnit.assert.equal(fetchCalls.length, 0, "No Fetch requests");
                QUnit.assert.equal(beaconCalls.length, 0, "No Beacon requests");

                // Let the auto flush send event to send
                this.clock.tick(1);
                QUnit.assert.equal(sendNotifications.length, 1, '1 requests should have been sent because of requeue and sync resend');
                QUnit.assert.equal(xhrRequests.length, 1, '1 request should have been sent because of requeue and sync resend');
                QUnit.assert.equal(discardNotifications.length, 0, 'We should have at least no discard events');

                // Simulate an unload event which will cause the event triggering the internal unload logic
                document.dispatchEvent(new Event("unload"));
                QUnit.assert.equal(sendNotifications.length, 5, 'We should now have attempted to send the events');
                QUnit.assert.equal(sentNotifications.length, 0, 'No Sent events yet as they are sent');
                QUnit.assert.equal(xhrRequests.length, 5, "5 requests should be sent");
                QUnit.assert.equal(fetchCalls.length, 0, "No Fetch requests");
                QUnit.assert.equal(beaconCalls.length, 0, "No Beacon requests");
                QUnit.assert.equal(discardNotifications.length, 0, 'There should no discarded events yet!');

                // Discard events are always executed on the next cycle
                this.clock.tick(1);
                QUnit.assert.equal(discardNotifications.length, 1, 'There should be 1 batch of events should have been discarded');
                QUnit.assert.equal(discardNotifications[0].events.length, 50, 'There should be 50 discarded event');
                QUnit.assert.equal(discardNotifications[0].events[0].name, 'testEvent-0', 'The first event discarded should be event testEvent-0');

                // Just tick over some additional time
                this.clock.tick(10000);
                QUnit.assert.equal(sendNotifications.length, 5, '5 requests should have been sent because of requeue and sync resend');
                QUnit.assert.equal(xhrRequests.length, 5, '5 requests should have been sent because of requeue and sync resend');
                QUnit.assert.equal(discardNotifications.length, 1, 'There should be 1 batch of events should have been discarded');
                QUnit.assert.equal(discardNotifications[0].events.length, 50, 'There should be 50 discarded event');
                QUnit.assert.equal(discardNotifications[0].events[0].name, 'testEvent-0', 'The first event discarded should be event testEvent-0');
            }
        });

        this.testCase({
            name: "Validate unload scenario with zero response code and requeuing during unload - default",
            useFakeTimers: true,
            test: () => {
                let sentNotifications = [];
                let discardNotifications = [];
                let sendNotifications = [];
                let xhrRequests = [];
                let beaconCalls = [];

                this.hookSendBeacon((url, data) => {
                    beaconCalls.push({
                        url,
                        data,
                    });
                    return false;
                });

                var fetchCalls = this.hookFetch((resolve, reject) => {
                    setTimeout(function() {
                        reject();
                    }, 0);
                });

                this.config.extensionConfig[this.postChannel.identifier] = {
                    httpXHROverride: {
                        sendPOST: (payload: IPayloadData,
                            oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                                xhrRequests.push({
                                    payload: payload,
                                    isSync: sync,
                                    oncomplete: oncomplete
                                });

                                // Return on error immediately to simulate a synchronous failure
                                oncomplete(0, {});
                            }
                    }
                };

                let channelConfig: IChannelConfiguration = this.config.extensionConfig[this.postChannel.identifier] || {};
                this.config.extensionConfig[this.postChannel.identifier] = channelConfig;

                // Always use the XHR Override so that we can correct simulate a zero response
                channelConfig.alwaysUseXhrOverride = true;

                this.core.initialize(this.config, [this.postChannel]);
                this.core.addNotificationListener({
                    eventsSent: (events: ITelemetryItem[]) => {
                        sentNotifications.push(events);
                    },
                    eventsDiscarded: (events: ITelemetryItem[], reason: number) => {
                        discardNotifications.push({
                            events: events,
                            reason: reason
                        });
                    },
                    eventsSendRequest: (sendReason: number, isAsync?: boolean) => {
                        sendNotifications.push({
                            sendReason: sendReason,
                            isAsync: isAsync
                        });
                    }
                });

                for (let lp = 0; lp < 50; lp++) {
                    this.postChannel.processTelemetry({
                        name: 'testEvent-' + lp,
                        latency: EventLatency.RealTime,
                        iKey: 'testIkey'
                    } as IPostTransmissionTelemetryItem);
                }

                QUnit.assert.equal(sendNotifications.length, 0, 'No Send events yet as they are sent');
                QUnit.assert.equal(sentNotifications.length, 0, 'No Sent events yet as they are sent');
                QUnit.assert.equal(discardNotifications.length, 0, 'No Discard events yet as they are sent');
                QUnit.assert.equal(xhrRequests.length, 0, "We haven't actually sent the request yet");
                QUnit.assert.equal(fetchCalls.length, 0, "No Fetch requests");
                QUnit.assert.equal(beaconCalls.length, 0, "No Beacon requests");

                // Simulate an unload event
                document.dispatchEvent(new Event("unload"));
                QUnit.assert.equal(sendNotifications.length, 2, 'We should now have attempted to send the events');
                QUnit.assert.equal(sentNotifications.length, 0, 'No Sent events yet as they are sent');
                QUnit.assert.equal(xhrRequests.length, 2, "2 attempts requeue events should be sent");
                QUnit.assert.equal(fetchCalls.length, 0, "No Fetch requests");
                QUnit.assert.equal(beaconCalls.length, 0, "No Beacon requests");
                QUnit.assert.equal(discardNotifications.length, 0, 'There should no discarded events yet!');

                // Discard events are always executed on the next cycle
                this.clock.tick(1);
                QUnit.assert.equal(discardNotifications.length, 1, 'There should be 1 batch of events should have been discarded');
                QUnit.assert.equal(discardNotifications[0].events.length, 50, 'There should be 50 discarded event');
                QUnit.assert.equal(discardNotifications[0].events[0].name, 'testEvent-0', 'The first event discarded should be event testEvent-0');

                // Tick over some additional time
                this.clock.tick(10000);
                QUnit.assert.equal(sendNotifications.length, 2, '2 requests should have been sent because of requeue and sync resend');
                QUnit.assert.equal(xhrRequests.length, 2, 'Still 2 requests should have been sent because of requeue sync resend');
                QUnit.assert.equal(discardNotifications.length, 1, 'There should be 1 batch of events should have been discarded');
                QUnit.assert.equal(discardNotifications[0].events.length, 50, 'There should be 50 discarded event');
                QUnit.assert.equal(discardNotifications[0].events[0].name, 'testEvent-0', 'The first event discarded should be event testEvent-0');
            }
        });

        this.testCase({
            name: "Validate unload scenario with zero response code and requeuing during unload - with maxUnloadEvents == 5",
            useFakeTimers: true,
            test: () => {
                let sentNotifications = [];
                let discardNotifications = [];
                let sendNotifications = [];
                let xhrRequests = [];
                let beaconCalls = [];

                this.hookSendBeacon((url, data) => {
                    beaconCalls.push({
                        url,
                        data,
                    });
                    return false;
                });

                var fetchCalls = this.hookFetch((resolve, reject) => {
                    setTimeout(function() {
                        reject();
                    }, 0);
                });

                this.config.extensionConfig[this.postChannel.identifier] = {
                    httpXHROverride: {
                        sendPOST: (payload: IPayloadData,
                            oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                                xhrRequests.push({
                                    payload: payload,
                                    isSync: sync,
                                    oncomplete: oncomplete
                                });

                                // Return on error immediately to simulate a synchronous failure
                                oncomplete(0, {});
                            }
                    }
                };

                let channelConfig: IChannelConfiguration = this.config.extensionConfig[this.postChannel.identifier] || {};
                this.config.extensionConfig[this.postChannel.identifier] = channelConfig;

                // Always use the XHR Override so that we can correct simulate a zero response
                channelConfig.alwaysUseXhrOverride = true;
                channelConfig.maxUnloadEventRetryAttempts = 5;

                this.core.initialize(this.config, [this.postChannel]);
                this.core.addNotificationListener({
                    eventsSent: (events: ITelemetryItem[]) => {
                        sentNotifications.push(events);
                    },
                    eventsDiscarded: (events: ITelemetryItem[], reason: number) => {
                        discardNotifications.push({
                            events: events,
                            reason: reason
                        });
                    },
                    eventsSendRequest: (sendReason: number, isAsync?: boolean) => {
                        sendNotifications.push({
                            sendReason: sendReason,
                            isAsync: isAsync
                        });
                    }
                });

                for (let lp = 0; lp < 50; lp++) {
                    this.postChannel.processTelemetry({
                        name: 'testEvent-' + lp,
                        latency: EventLatency.RealTime,
                        iKey: 'testIkey'
                    } as IPostTransmissionTelemetryItem);
                }

                QUnit.assert.equal(sendNotifications.length, 0, 'No Send events yet as they are sent');
                QUnit.assert.equal(sentNotifications.length, 0, 'No Sent events yet as they are sent');
                QUnit.assert.equal(discardNotifications.length, 0, 'No Discard events yet as they are sent');
                QUnit.assert.equal(xhrRequests.length, 0, "We haven't actually sent the request yet");
                QUnit.assert.equal(fetchCalls.length, 0, "No Fetch requests");
                QUnit.assert.equal(beaconCalls.length, 0, "No Beacon requests");

                // Simulate an unload event
                document.dispatchEvent(new Event("unload"));
                QUnit.assert.equal(sendNotifications.length, 5, 'We should now have attempted to send the events');
                QUnit.assert.equal(sentNotifications.length, 0, 'No Sent events yet as they are sent');
                QUnit.assert.equal(xhrRequests.length, 5, "5 attempts requeue events should be sent");
                QUnit.assert.equal(fetchCalls.length, 0, "No Fetch requests");
                QUnit.assert.equal(beaconCalls.length, 0, "No Beacon requests");
                QUnit.assert.equal(discardNotifications.length, 0, 'There should no discarded events yet!');

                // Discard events are always executed on the next cycle
                this.clock.tick(1);
                QUnit.assert.equal(discardNotifications.length, 1, 'There should be 1 batch of events should have been discarded');
                QUnit.assert.equal(discardNotifications[0].events.length, 50, 'There should be 50 discarded event');
                QUnit.assert.equal(discardNotifications[0].events[0].name, 'testEvent-0', 'The first event discarded should be event testEvent-0');

                // Tick over some time to make sure nothing else happens
                this.clock.tick(10000);
                QUnit.assert.equal(sendNotifications.length, 5, '5 requests should have been sent because of requeue and sync resend');
                QUnit.assert.equal(xhrRequests.length, 5, 'Still 5 requests should have been sent because of requeue sync resend');

                QUnit.assert.equal(discardNotifications.length, 1, 'There should be 1 batch of events should have been discarded');
                QUnit.assert.equal(discardNotifications[0].events.length, 50, 'There should be 50 discarded event');
                QUnit.assert.equal(discardNotifications[0].events[0].name, 'testEvent-0', 'The first event discarded should be event testEvent-0');
            }
        });

        this.testCase({
            name: "Validate synchronous flush scenario with zero response code and requeuing with synchronous flushing and no unload - default retries",
            useFakeTimers: true,
            test: () => {
                let sentNotifications = [];
                let discardNotifications = [];
                let sendNotifications = [];
                let xhrRequests = [];
                let beaconCalls = [];

                this.hookSendBeacon((url, data) => {
                    beaconCalls.push({
                        url,
                        data,
                    });
                    return false;
                });

                var fetchCalls = this.hookFetch((resolve, reject) => {
                    setTimeout(function() {
                        reject();
                    }, 0);
                });

                this.config.extensionConfig[this.postChannel.identifier] = {
                    httpXHROverride: {
                        sendPOST: (payload: IPayloadData,
                            oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                                xhrRequests.push({
                                    payload: payload,
                                    isSync: sync,
                                    oncomplete: oncomplete
                                });

                                // Return on error immediately to simulate a synchronous failure
                                oncomplete(0, {});
                            }
                    }
                };

                let channelConfig: IChannelConfiguration = this.config.extensionConfig[this.postChannel.identifier] || {};
                this.config.extensionConfig[this.postChannel.identifier] = channelConfig;

                // Always use the XHR Override so that we can correct simulate a zero response
                channelConfig.alwaysUseXhrOverride = true;

                this.core.initialize(this.config, [this.postChannel]);
                this.core.addNotificationListener({
                    eventsSent: (events: ITelemetryItem[]) => {
                        sentNotifications.push(events);
                    },
                    eventsDiscarded: (events: ITelemetryItem[], reason: number) => {
                        discardNotifications.push({
                            events: events,
                            reason: reason
                        });
                    },
                    eventsSendRequest: (sendReason: number, isAsync?: boolean) => {
                        sendNotifications.push({
                            sendReason: sendReason,
                            isAsync: isAsync
                        });
                    }
                });

                for (let lp = 0; lp < 50; lp++) {
                    this.postChannel.processTelemetry({
                        name: 'testEvent-' + lp,
                        latency: EventLatency.RealTime,
                        iKey: 'testIkey'
                    } as IPostTransmissionTelemetryItem);
                }

                QUnit.assert.equal(sendNotifications.length, 0, 'No Send events yet as they are sent');
                QUnit.assert.equal(sentNotifications.length, 0, 'No Sent events yet as they are sent');
                QUnit.assert.equal(discardNotifications.length, 0, 'No Discard events yet as they are sent');
                QUnit.assert.equal(xhrRequests.length, 0, "We haven't actually sent the request yet");
                QUnit.assert.equal(fetchCalls.length, 0, "No Fetch requests");
                QUnit.assert.equal(beaconCalls.length, 0, "No Beacon requests");

                let flushCompleted = 0;
                for (let lp = 0; lp < 8; lp++) {
                    // cause a synchronous flush
                    this.postChannel.flush(false, () => {
                        flushCompleted++;
                    });

                    QUnit.assert.equal(flushCompleted, lp + 1, "The flush should have been completed synchronously");
                    QUnit.assert.equal(sentNotifications.length, 0, 'No Sent events yet as they are sent');
                    if (lp < 6) {
                        QUnit.assert.equal(sendNotifications.length, lp + 1, 'request should have been sent and the events requeued');
                        QUnit.assert.equal(discardNotifications.length, 0, 'No Discard events yet as they are sent');
                        QUnit.assert.equal(xhrRequests.length, lp + 1, "Check the number of attempts and requeue events should be sent");
                    } else {
                        QUnit.assert.equal(sendNotifications.length, 6, 'request should have been sent and the events requeued');
                        QUnit.assert.equal(xhrRequests.length, 6, "Only 6 attempts and requeue events should be sent");
                        QUnit.assert.equal(discardNotifications.length, 1, 'The batch should now have been discarded');
                        QUnit.assert.equal(discardNotifications[0].events.length, 50, 'There should be 50 discarded event');
                        QUnit.assert.equal(discardNotifications[0].events[0].name, 'testEvent-0', 'The first event discarded should be event testEvent-0');
                    }

                    QUnit.assert.equal(fetchCalls.length, 0, "No Fetch requests");
                    QUnit.assert.equal(beaconCalls.length, 0, "No Beacon requests");

                    // Should not be required but lets just tick over some time
                    this.clock.tick(1);
                }
            }
        });

        this.testCase({
            name: "Validate asynchronous flush scenario with zero response code and requeuing and no unload - default retries",
            useFakeTimers: true,
            test: () => {
                let sentNotifications = [];
                let discardNotifications = [];
                let sendNotifications = [];
                let xhrRequests = [];
                let beaconCalls = [];

                this.hookSendBeacon((url, data) => {
                    beaconCalls.push({
                        url,
                        data,
                    });
                    return false;
                });

                var fetchCalls = this.hookFetch((resolve, reject) => {
                    setTimeout(function() {
                        reject();
                    }, 0);
                });

                this.config.extensionConfig[this.postChannel.identifier] = {
                    httpXHROverride: {
                        sendPOST: (payload: IPayloadData,
                            oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                                xhrRequests.push({
                                    payload: payload,
                                    isSync: sync,
                                    oncomplete: oncomplete
                                });

                                // Return on error immediately to simulate a synchronous failure
                                oncomplete(0, {});
                            }
                    }
                };

                let channelConfig: IChannelConfiguration = this.config.extensionConfig[this.postChannel.identifier] || {};
                this.config.extensionConfig[this.postChannel.identifier] = channelConfig;

                // Always use the XHR Override so that we can correct simulate a zero response
                channelConfig.alwaysUseXhrOverride = true;

                this.core.initialize(this.config, [this.postChannel]);
                this.core.addNotificationListener({
                    eventsSent: (events: ITelemetryItem[]) => {
                        sentNotifications.push(events);
                    },
                    eventsDiscarded: (events: ITelemetryItem[], reason: number) => {
                        discardNotifications.push({
                            events: events,
                            reason: reason
                        });
                    },
                    eventsSendRequest: (sendReason: number, isAsync?: boolean) => {
                        sendNotifications.push({
                            sendReason: sendReason,
                            isAsync: isAsync
                        });
                    }
                });

                for (let lp = 0; lp < 50; lp++) {
                    this.postChannel.processTelemetry({
                        name: 'testEvent-' + lp,
                        latency: EventLatency.RealTime,
                        iKey: 'testIkey'
                    } as IPostTransmissionTelemetryItem);
                }

                QUnit.assert.equal(sendNotifications.length, 0, 'No Send events yet as they are sent');
                QUnit.assert.equal(sentNotifications.length, 0, 'No Sent events yet as they are sent');
                QUnit.assert.equal(discardNotifications.length, 0, 'No Discard events yet as they are sent');
                QUnit.assert.equal(xhrRequests.length, 0, "We haven't actually sent the request yet");
                QUnit.assert.equal(fetchCalls.length, 0, "No Fetch requests");
                QUnit.assert.equal(beaconCalls.length, 0, "No Beacon requests");

                let flushCompleted = 0;
                for (let lp = 0; lp < 8; lp++) {
                    // cause a asynchronous flush
                    this.postChannel.flush(true, () => {
                        flushCompleted++;
                    });

                    QUnit.assert.equal(sentNotifications.length, 0, 'No Sent events yet as they are sent');
                    if (lp < 3) {
                        QUnit.assert.equal(flushCompleted, lp, lp + ":The flush should have been completed asynchronously");
                        QUnit.assert.equal(sendNotifications.length, (lp * 2), lp + ":request should have been sent and the events requeued");
                        QUnit.assert.equal(discardNotifications.length, 0, lp + ":No Discard events yet as they are sent");
                        QUnit.assert.equal(xhrRequests.length, (lp * 2), lp + ":Check the number of attempts and requeue events should be sent");

                        // Simulate time passing for the requeue/random back off timer for sending of the events and wait for the flush to complete
                        let attempt = 0;
                        while (attempt < 6000 && flushCompleted === lp) {
                            this.clock.tick(10);
                            attempt++;
                        }

                        QUnit.assert.equal(flushCompleted, lp + 1, "The flush should have been completed asynchronously");
                        QUnit.assert.equal(sendNotifications.length, ((lp + 1) * 2), 'request should have been sent and the events requeued');
                        QUnit.assert.equal(xhrRequests.length, ((lp + 1) * 2), "Check the number of attempts and requeue events should be sent");
                        if (lp === 2) {
                            QUnit.assert.equal(discardNotifications.length, 1, "The batch should now have been discarded");
                            QUnit.assert.equal(discardNotifications[0].events.length, 50, "There should be 50 discarded event");
                            QUnit.assert.equal(discardNotifications[0].events[0].name, 'testEvent-0', "The first event discarded should be event testEvent-0");
                        } else {
                            QUnit.assert.equal(discardNotifications.length, 0, 'No Discard events yet as they are sent');
                        }
                    } else {
                        QUnit.assert.equal(flushCompleted, lp, lp + ":The flush should have been completed asynchronously");
                        this.clock.tick(30000);
                        QUnit.assert.equal(flushCompleted, (lp + 1), lp + ":The flush should have been completed asynchronously");
                        QUnit.assert.equal(sendNotifications.length, 6, lp + ":request should have been sent and the events requeued");
                        QUnit.assert.equal(xhrRequests.length, 6, lp + ":Only 6 attempts and requeue events should be sent");
                        QUnit.assert.equal(discardNotifications.length, 1, 'No Discard events yet as they are sent');
                        QUnit.assert.equal(discardNotifications[0].events.length, 50, "There should be 50 discarded event");
                        QUnit.assert.equal(discardNotifications[0].events[0].name, 'testEvent-0', "The first event discarded should be event testEvent-0");
                    }

                    QUnit.assert.equal(fetchCalls.length, 0, "No Fetch requests");
                    QUnit.assert.equal(beaconCalls.length, 0, "No Beacon requests");

                    // Should not be required but lets just tick over some time
                    this.clock.tick(1);
                }
            }
        });

        this.testCase({
            name: "Validate synchronous flush scenario with zero response code and requeuing with synchronous flushing and no unload - maxEventRetry == 5",
            useFakeTimers: true,
            test: () => {
                let sentNotifications = [];
                let discardNotifications = [];
                let sendNotifications = [];
                let xhrRequests = [];
                let beaconCalls = [];

                this.hookSendBeacon((url, data) => {
                    beaconCalls.push({
                        url,
                        data,
                    });
                    return false;
                });

                var fetchCalls = this.hookFetch((resolve, reject) => {
                    setTimeout(function() {
                        reject();
                    }, 0);
                });

                this.config.extensionConfig[this.postChannel.identifier] = {
                    httpXHROverride: {
                        sendPOST: (payload: IPayloadData,
                            oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                                xhrRequests.push({
                                    payload: payload,
                                    isSync: sync,
                                    oncomplete: oncomplete
                                });

                                // Return on error immediately to simulate a synchronous failure
                                oncomplete(0, {});
                            }
                    }
                };

                let channelConfig: IChannelConfiguration = this.config.extensionConfig[this.postChannel.identifier] || {};
                this.config.extensionConfig[this.postChannel.identifier] = channelConfig;

                // Always use the XHR Override so that we can correct simulate a zero response
                channelConfig.alwaysUseXhrOverride = true;
                channelConfig.maxEventRetryAttempts = 5;

                this.core.initialize(this.config, [this.postChannel]);
                this.core.addNotificationListener({
                    eventsSent: (events: ITelemetryItem[]) => {
                        sentNotifications.push(events);
                    },
                    eventsDiscarded: (events: ITelemetryItem[], reason: number) => {
                        discardNotifications.push({
                            events: events,
                            reason: reason
                        });
                    },
                    eventsSendRequest: (sendReason: number, isAsync?: boolean) => {
                        sendNotifications.push({
                            sendReason: sendReason,
                            isAsync: isAsync
                        });
                    }
                });

                for (let lp = 0; lp < 50; lp++) {
                    this.postChannel.processTelemetry({
                        name: 'testEvent-' + lp,
                        latency: EventLatency.RealTime,
                        iKey: 'testIkey'
                    } as IPostTransmissionTelemetryItem);
                }

                QUnit.assert.equal(sendNotifications.length, 0, 'No Send events yet as they are sent');
                QUnit.assert.equal(sentNotifications.length, 0, 'No Sent events yet as they are sent');
                QUnit.assert.equal(discardNotifications.length, 0, 'No Discard events yet as they are sent');
                QUnit.assert.equal(xhrRequests.length, 0, "We haven't actually sent the request yet");
                QUnit.assert.equal(fetchCalls.length, 0, "No Fetch requests");
                QUnit.assert.equal(beaconCalls.length, 0, "No Beacon requests");

                let flushCompleted = 0;
                for (let lp = 0; lp < 8; lp++) {
                    // cause a synchronous flush
                    this.postChannel.flush(false, () => {
                        flushCompleted++;
                    });

                    QUnit.assert.equal(flushCompleted, lp + 1, "The flush should have been completed synchronously");
                    QUnit.assert.equal(sentNotifications.length, 0, 'No Sent events yet as they are sent');
                    if (lp < 5) {
                        QUnit.assert.equal(sendNotifications.length, lp + 1, 'request should have been sent and the events requeued');
                        QUnit.assert.equal(discardNotifications.length, 0, 'No Discard events yet as they are sent');
                        QUnit.assert.equal(xhrRequests.length, lp + 1, "Check the number of attempts and requeue events should be sent");
                    } else {
                        QUnit.assert.equal(sendNotifications.length, 5, 'request should have been sent and the events requeued');
                        QUnit.assert.equal(xhrRequests.length, 5, "Only 5 attempts and requeue events should be sent");
                        QUnit.assert.equal(discardNotifications.length, 1, 'The batch should now have been discarded');
                        QUnit.assert.equal(discardNotifications[0].events.length, 50, 'There should be 50 discarded event');
                        QUnit.assert.equal(discardNotifications[0].events[0].name, 'testEvent-0', 'The first event discarded should be event testEvent-0');
                    }

                    QUnit.assert.equal(fetchCalls.length, 0, "No Fetch requests");
                    QUnit.assert.equal(beaconCalls.length, 0, "No Beacon requests");

                    // Should not be required but lets just tick over some time
                    this.clock.tick(1);
                }
            }
        });

        this.testCase({
            name: "Validate asynchronous flush scenario with zero response code and requeuing and no unload - maxEventRetry == 5",
            useFakeTimers: true,
            test: () => {
                let sentNotifications = [];
                let discardNotifications = [];
                let sendNotifications = [];
                let xhrRequests = [];
                let beaconCalls = [];

                this.hookSendBeacon((url, data) => {
                    beaconCalls.push({
                        url,
                        data,
                    });
                    return false;
                });

                var fetchCalls = this.hookFetch((resolve, reject) => {
                    setTimeout(function() {
                        reject();
                    }, 0);
                });

                this.config.extensionConfig[this.postChannel.identifier] = {
                    httpXHROverride: {
                        sendPOST: (payload: IPayloadData,
                            oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                                xhrRequests.push({
                                    payload: payload,
                                    isSync: sync,
                                    oncomplete: oncomplete
                                });

                                // Return on error immediately to simulate a synchronous failure
                                oncomplete(0, {});
                            }
                    }
                };

                let channelConfig: IChannelConfiguration = this.config.extensionConfig[this.postChannel.identifier] || {};
                this.config.extensionConfig[this.postChannel.identifier] = channelConfig;

                // Always use the XHR Override so that we can correct simulate a zero response
                channelConfig.alwaysUseXhrOverride = true;
                channelConfig.maxEventRetryAttempts = 5;

                this.core.initialize(this.config, [this.postChannel]);
                this.core.addNotificationListener({
                    eventsSent: (events: ITelemetryItem[]) => {
                        sentNotifications.push(events);
                    },
                    eventsDiscarded: (events: ITelemetryItem[], reason: number) => {
                        discardNotifications.push({
                            events: events,
                            reason: reason
                        });
                    },
                    eventsSendRequest: (sendReason: number, isAsync?: boolean) => {
                        sendNotifications.push({
                            sendReason: sendReason,
                            isAsync: isAsync
                        });
                    }
                });

                for (let lp = 0; lp < 50; lp++) {
                    this.postChannel.processTelemetry({
                        name: 'testEvent-' + lp,
                        latency: EventLatency.RealTime,
                        iKey: 'testIkey'
                    } as IPostTransmissionTelemetryItem);
                }

                QUnit.assert.equal(sendNotifications.length, 0, 'No Send events yet as they are sent');
                QUnit.assert.equal(sentNotifications.length, 0, 'No Sent events yet as they are sent');
                QUnit.assert.equal(discardNotifications.length, 0, 'No Discard events yet as they are sent');
                QUnit.assert.equal(xhrRequests.length, 0, "We haven't actually sent the request yet");
                QUnit.assert.equal(fetchCalls.length, 0, "No Fetch requests");
                QUnit.assert.equal(beaconCalls.length, 0, "No Beacon requests");

                let flushCompleted = 0;
                for (let lp = 0; lp < 8; lp++) {
                    // cause a asynchronous flush
                    this.postChannel.flush(true, () => {
                        flushCompleted++;
                    });

                    QUnit.assert.equal(sentNotifications.length, 0, 'No Sent events yet as they are sent');
                    if (lp < 3) {
                        QUnit.assert.equal(flushCompleted, lp, lp + ":The flush should have been completed asynchronously");
                        QUnit.assert.equal(sendNotifications.length, (lp * 2), lp + ":request should have been sent and the events requeued");
                        QUnit.assert.equal(discardNotifications.length, 0, lp + ":No Discard events yet as they are sent");
                        QUnit.assert.equal(xhrRequests.length, (lp * 2), lp + ":Check the number of attempts and requeue events should be sent");

                        // Simulate time passing for the requeue/random back off timer for sending of the events and wait for the flush to complete
                        let attempt = 0;
                        while (attempt < 6000 && flushCompleted === lp) {
                            this.clock.tick(10);
                            attempt++;
                        }

                        QUnit.assert.equal(flushCompleted, lp + 1, "The flush should have been completed asynchronously");
                        if (lp === 2) {
                            QUnit.assert.equal(sendNotifications.length, 6, lp + ":request should have been sent and the events requeued");
                            QUnit.assert.equal(xhrRequests.length, 6, lp + ":Only 6 attempts and requeue events should be sent");
                            QUnit.assert.equal(discardNotifications.length, 1, "The batch should now have been discarded");
                            QUnit.assert.equal(discardNotifications[0].events.length, 50, "There should be 50 discarded event");
                            QUnit.assert.equal(discardNotifications[0].events[0].name, 'testEvent-0', "The first event discarded should be event testEvent-0");
                        } else {
                            QUnit.assert.equal(sendNotifications.length, ((lp + 1) * 2), 'request should have been sent and the events requeued');
                            QUnit.assert.equal(xhrRequests.length, ((lp + 1) * 2), "Check the number of attempts and requeue events should be sent");
                            QUnit.assert.equal(discardNotifications.length, 0, 'No Discard events yet as they are sent');
                        }
                    } else {
                        QUnit.assert.equal(flushCompleted, lp, lp + ":The flush should have been completed asynchronously");
                        this.clock.tick(30000);
                        QUnit.assert.equal(flushCompleted, (lp + 1), lp + ":The flush should have been completed asynchronously");
                        QUnit.assert.equal(sendNotifications.length, 6, lp + ":request should have been sent and the events requeued");
                        QUnit.assert.equal(xhrRequests.length, 6, lp + ":Only 6 attempts and requeue events should be sent");
                        QUnit.assert.equal(discardNotifications.length, 1, 'No Discard events yet as they are sent');
                        QUnit.assert.equal(discardNotifications[0].events.length, 50, "There should be 50 discarded event");
                        QUnit.assert.equal(discardNotifications[0].events[0].name, 'testEvent-0', "The first event discarded should be event testEvent-0");
                    }

                    QUnit.assert.equal(fetchCalls.length, 0, "No Fetch requests");
                    QUnit.assert.equal(beaconCalls.length, 0, "No Beacon requests");

                    // Should not be required but lets just tick over some time
                    this.clock.tick(1);
                }
            }
        });

        this.testCase({
            name: "Validate asynchronous flush scenario with zero response code and requeuing and no unload - maxEventRetry == 4",
            useFakeTimers: true,
            test: () => {
                let sentNotifications = [];
                let discardNotifications = [];
                let sendNotifications = [];
                let xhrRequests = [];
                let beaconCalls = [];

                this.hookSendBeacon((url, data) => {
                    beaconCalls.push({
                        url,
                        data,
                    });
                    return false;
                });

                var fetchCalls = this.hookFetch((resolve, reject) => {
                    setTimeout(function() {
                        reject();
                    }, 0);
                });

                this.config.extensionConfig[this.postChannel.identifier] = {
                    httpXHROverride: {
                        sendPOST: (payload: IPayloadData,
                            oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                                xhrRequests.push({
                                    payload: payload,
                                    isSync: sync,
                                    oncomplete: oncomplete
                                });

                                // Return on error immediately to simulate a synchronous failure
                                oncomplete(0, {});
                            }
                    }
                };

                let channelConfig: IChannelConfiguration = this.config.extensionConfig[this.postChannel.identifier] || {};
                this.config.extensionConfig[this.postChannel.identifier] = channelConfig;

                // Always use the XHR Override so that we can correct simulate a zero response
                channelConfig.alwaysUseXhrOverride = true;
                channelConfig.maxEventRetryAttempts = 4;

                this.core.initialize(this.config, [this.postChannel]);
                this.core.addNotificationListener({
                    eventsSent: (events: ITelemetryItem[]) => {
                        sentNotifications.push(events);
                    },
                    eventsDiscarded: (events: ITelemetryItem[], reason: number) => {
                        discardNotifications.push({
                            events: events,
                            reason: reason
                        });
                    },
                    eventsSendRequest: (sendReason: number, isAsync?: boolean) => {
                        sendNotifications.push({
                            sendReason: sendReason,
                            isAsync: isAsync
                        });
                    }
                });

                for (let lp = 0; lp < 50; lp++) {
                    this.postChannel.processTelemetry({
                        name: 'testEvent-' + lp,
                        latency: EventLatency.RealTime,
                        iKey: 'testIkey'
                    } as IPostTransmissionTelemetryItem);
                }

                QUnit.assert.equal(sendNotifications.length, 0, 'No Send events yet as they are sent');
                QUnit.assert.equal(sentNotifications.length, 0, 'No Sent events yet as they are sent');
                QUnit.assert.equal(discardNotifications.length, 0, 'No Discard events yet as they are sent');
                QUnit.assert.equal(xhrRequests.length, 0, "We haven't actually sent the request yet");
                QUnit.assert.equal(fetchCalls.length, 0, "No Fetch requests");
                QUnit.assert.equal(beaconCalls.length, 0, "No Beacon requests");

                let flushCompleted = 0;
                for (let lp = 0; lp < 8; lp++) {
                    // cause a asynchronous flush
                    this.postChannel.flush(true, () => {
                        flushCompleted++;
                    });

                    QUnit.assert.equal(sentNotifications.length, 0, 'No Sent events yet as they are sent');
                    if (lp < 2) {
                        QUnit.assert.equal(flushCompleted, lp, lp + ":The flush should have been completed asynchronously");
                        QUnit.assert.equal(sendNotifications.length, (lp * 2), lp + ":request should have been sent and the events requeued");
                        QUnit.assert.equal(discardNotifications.length, 0, lp + ":No Discard events yet as they are sent");
                        QUnit.assert.equal(xhrRequests.length, (lp * 2), lp + ":Check the number of attempts and requeue events should be sent");

                        // Simulate time passing for the requeue/random back off timer for sending of the events and wait for the flush to complete
                        let attempt = 0;
                        while (attempt < 6000 && flushCompleted === lp) {
                            this.clock.tick(10);
                            attempt++;
                        }

                        QUnit.assert.equal(flushCompleted, lp + 1, "The flush should have been completed asynchronously");
                        if (lp === 1) {
                            QUnit.assert.equal(sendNotifications.length, 4, lp + ":request should have been sent and the events requeued");
                            QUnit.assert.equal(xhrRequests.length, 4, lp + ":Only 4 attempts and requeue events should be sent");
                            QUnit.assert.equal(discardNotifications.length, 1, "The batch should now have been discarded");
                            QUnit.assert.equal(discardNotifications[0].events.length, 50, "There should be 50 discarded event");
                            QUnit.assert.equal(discardNotifications[0].events[0].name, 'testEvent-0', "The first event discarded should be event testEvent-0");
                        } else {
                            QUnit.assert.equal(sendNotifications.length, ((lp + 1) * 2), 'request should have been sent and the events requeued');
                            QUnit.assert.equal(xhrRequests.length, ((lp + 1) * 2), "Check the number of attempts and requeue events should be sent");
                            QUnit.assert.equal(discardNotifications.length, 0, 'No Discard events yet as they are sent');
                        }
                    } else {
                        QUnit.assert.equal(flushCompleted, lp, lp + ":The flush should have been completed asynchronously");
                        this.clock.tick(30000);
                        QUnit.assert.equal(flushCompleted, (lp + 1), lp + ":The flush should have been completed asynchronously");
                        QUnit.assert.equal(sendNotifications.length, 4, lp + ":request should have been sent and the events requeued");
                        QUnit.assert.equal(xhrRequests.length, 4, lp + ":Only 4 attempts and requeue events should be sent");
                        QUnit.assert.equal(discardNotifications.length, 1, 'No Discard events yet as they are sent');
                        QUnit.assert.equal(discardNotifications[0].events.length, 50, "There should be 50 discarded event");
                        QUnit.assert.equal(discardNotifications[0].events[0].name, 'testEvent-0', "The first event discarded should be event testEvent-0");
                    }

                    QUnit.assert.equal(fetchCalls.length, 0, "No Fetch requests");
                    QUnit.assert.equal(beaconCalls.length, 0, "No Beacon requests");

                    // Should not be required but lets just tick over some time
                    this.clock.tick(1);
                }
            }
        });

        this.testCase({
            name: "Validate retry scenario with zero response code -- hitting the maximum back off limit",
            useFakeTimers: true,
            test: () => {
                let sentNotifications = [];
                let discardNotifications = [];
                let sendNotifications = [];
                let xhrRequests = [];
                let beaconCalls = [];

                this.hookSendBeacon((url, data) => {
                    beaconCalls.push({
                        url,
                        data,
                    });
                    return false;
                });

                var fetchCalls = this.hookFetch((resolve, reject) => {
                    setTimeout(function() {
                        reject();
                    }, 0);
                });

                this.config.extensionConfig[this.postChannel.identifier] = {
                    httpXHROverride: {
                        sendPOST: (payload: IPayloadData,
                            oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                                xhrRequests.push({
                                    payload: payload,
                                    isSync: sync,
                                    oncomplete: oncomplete
                                });

                                setTimeout(function() {
                                    oncomplete(0, {});
                                }, 0);
                            }
                    }
                };

                let channelConfig: IChannelConfiguration = this.config.extensionConfig[this.postChannel.identifier] || {};
                this.config.extensionConfig[this.postChannel.identifier] = channelConfig;

                // Always use the XHR Override so that we can correct simulate a zero response
                channelConfig.alwaysUseXhrOverride = true;

                this.core.initialize(this.config, [this.postChannel]);
                this.core.addNotificationListener({
                    eventsSent: (events: ITelemetryItem[]) => {
                        sentNotifications.push(events);
                    },
                    eventsDiscarded: (events: ITelemetryItem[], reason: number) => {
                        discardNotifications.push({
                            events: events,
                            reason: reason
                        });
                    },
                    eventsSendRequest: (sendReason: number, isAsync?: boolean) => {
                        sendNotifications.push({
                            sendReason: sendReason,
                            isAsync: isAsync
                        });
                    }
                });

                for (let lp = 0; lp < 50; lp++) {
                    this.postChannel.processTelemetry({
                        name: 'testEvent-' + lp,
                        latency: EventLatency.RealTime,
                        iKey: 'testIkey'
                    } as IPostTransmissionTelemetryItem);
                }

                QUnit.assert.equal(sendNotifications.length, 0, 'No Send events yet as they are sent');
                QUnit.assert.equal(sentNotifications.length, 0, 'No Sent events yet as they are sent');
                QUnit.assert.equal(discardNotifications.length, 0, 'No Discard events yet as they are sent');
                QUnit.assert.equal(xhrRequests.length, 0, "We haven't actually sent the request yet");
                QUnit.assert.equal(fetchCalls.length, 0, "No Fetch requests");
                QUnit.assert.equal(beaconCalls.length, 0, "No Beacon requests");

                this.postChannel.flush();

                // Let the auto flush send event to send
                this.clock.tick(2);

                for (let retry = 0; retry < 8; retry++) {
                    if (retry < 4) {
                        QUnit.assert.equal(sendNotifications.length, retry + 1, retry + ": We should now have attempted to send the events");
                        QUnit.assert.equal(sentNotifications.length, 0, retry + ": No Sent events yet as they are sent");
                        QUnit.assert.equal(discardNotifications.length, 0, retry + ": No Discard events yet as they are sent");
                        QUnit.assert.equal(xhrRequests.length, retry + 1, retry + ": Check requests should be sent");
                        QUnit.assert.equal(fetchCalls.length, 0, retry + ": No Fetch requests");
                        QUnit.assert.equal(beaconCalls.length, 0, retry + ": No Beacon requests");
    
                        // Simulate time passing for the requeue and sending of the events
                        let attempt = 0;
                        while (attempt < 6000 && sendNotifications.length === (retry + 1)) {
                            this.clock.tick(10);
                            attempt++;
                        }
                    } else {
                        QUnit.assert.equal(sendNotifications.length, 4, retry + ": We should now have attempted to send the events");
                        QUnit.assert.equal(sentNotifications.length, 0, retry + ": No Sent events yet as they are sent");
                        QUnit.assert.equal(xhrRequests.length, 4, retry + ": Check requests should be sent");
                        QUnit.assert.equal(fetchCalls.length, 0, retry + ": No Fetch requests");
                        QUnit.assert.equal(beaconCalls.length, 0, retry + ": No Beacon requests");

                        // Jump forward 30 seconds
                        this.clock.tick(30000);
                    }
                }

                // Add a new event which will cause a new event to be sent
                this.postChannel.processTelemetry({
                    name: 'testEvent-extra',
                    latency: EventLatency.RealTime,
                    iKey: 'testIkey'
                } as IPostTransmissionTelemetryItem);                

                // Simulate time passing for the requeue/random back off timer for sending of the events
                let attempt = 0;
                while (attempt < 6000 && sendNotifications.length < 5) {
                    this.clock.tick(10);
                    attempt++;
                }

                QUnit.assert.equal(sendNotifications.length, 5, 'We should now have attempted to send the events');
                QUnit.assert.equal(sentNotifications.length, 0, 'No Sent events yet as they are sent');
                QUnit.assert.equal(xhrRequests.length, 5, "Check requests should be sent");
                QUnit.assert.equal(fetchCalls.length, 0, "No Fetch requests");
                QUnit.assert.equal(beaconCalls.length, 0, "No Beacon requests");

                // Simulate time passing for the retry which uses a random back off timer for sending of the events
                attempt = 0;
                while (attempt < 7000 && (sendNotifications.length < 6 || discardNotifications.length < 1 || xhrRequests.length < 6)) {
                    this.clock.tick(10);
                    attempt++;
                }

                QUnit.assert.equal(sendNotifications.length, 6, 'We should now have attempted to send the events');
                QUnit.assert.equal(sentNotifications.length, 0, 'No Sent events yet as they are sent');
                QUnit.assert.equal(xhrRequests.length, 6, "Check requests should be sent");
                QUnit.assert.equal(fetchCalls.length, 0, "No Fetch requests");
                QUnit.assert.equal(beaconCalls.length, 0, "No Beacon requests");

                QUnit.assert.equal(discardNotifications.length, 1, 'The batch should now have been discarded');
                QUnit.assert.equal(discardNotifications[0].events.length, 50, 'There should be 50 discarded event');
                QUnit.assert.equal(discardNotifications[0].events[0].name, 'testEvent-0', 'The first event discarded should be event testEvent-0');

            }
        });

        this.testCase({
            name: "Post Channel: check excludeCsMetaData",
            useFakeTimers: true,
            useFakeServer: true,
            test: () => {
                let config = this.config;
                let core = this.core;
                let postChannel = this.postChannel;
                let identifier = postChannel.identifier;
                let event1: IPostTransmissionTelemetryItem = TestHelper.mockEvent(EventPersistence.Normal);
                let event2: IPostTransmissionTelemetryItem = TestHelper.mockEvent(EventPersistence.Normal);
                core.initialize(config, [postChannel]);

                // test timeout
                core.track(event1);
                this.clock.tick(10001);

                let requests = this._getXhrRequests();
                QUnit.assert.equal(requests.length, 1, "request should be sent");
                requests[0].respond(200, {}, "response body");

                QUnit.assert.equal(requests[0].method, "POST", "request method should be POST");

                let evt = JSON.parse(requests[0]["requestBody"]);
                QUnit.assert.equal(evt.name, event1.name, "request data should be set");
                let metaData = evt.ext.metadata;
                QUnit.assert.ok(!isNullOrUndefined(metaData));
                QUnit.assert.equal(metaData.f.evValue2.t, 8193, "evValue should be tagged");
                QUnit.assert.equal(metaData.f.value5.t, 6, "value5 should be tagged as number");
                QUnit.assert.equal(metaData.f.value1.a.t, 6, "value1 should be tagged as array of numbers");

                // Disable CsMetaData
                core!.config!.extensionConfig![identifier].excludeCsMetaData = true;
                // Let the dynamic config changes occur
                this.clock.tick(1);

                core.track(event2);
                this.clock.tick(10001);

                requests = this._getXhrRequests();
                QUnit.assert.equal(requests.length, 2, "request should be sent");
                requests[1].respond(200, {}, "response body");

                QUnit.assert.equal(requests[1].method, "POST", "request method should be POST");

                evt = JSON.parse(requests[1]["requestBody"]);
                QUnit.assert.equal(evt.name, event2.name, "request data should be set");
                metaData = evt.ext.metadata;
                QUnit.assert.equal(metaData, undefined, "metadata should be undefined");
            }
        });

    }
}

class AutoCompleteXhrOverride {
    public sendPOST(payload: IPayloadData, oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) {
        oncomplete(200, null);
    }
}