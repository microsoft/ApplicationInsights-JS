import { AITestClass } from "@microsoft/ai-test-framework";
import { HttpManager } from "../../../src/HttpManager";
import { AppInsightsCore, BaseTelemetryPlugin, EventSendType, IAppInsightsCore, IConfiguration, IExtendedConfiguration, IPlugin, IProcessTelemetryContext, ITelemetryItem, SendRequestReason, TransportType, isBeaconsSupported} from "@microsoft/1ds-core-js";
import { PostChannel, IXHROverride, IPayloadData } from "../../../src/Index";
import { IPostTransmissionTelemetryItem, EventBatchNotificationReason, IChannelConfiguration } from "../../../src/DataModels";
import { EventBatch } from "../../../src/EventBatch";

interface EventDetail {
    batches: EventBatch[];
    reason: EventBatchNotificationReason;
    isSync: boolean;
}

interface SendHookDetail {
    payload: IPayloadData;
    isSync: boolean;
}

export class HttpManagerTest extends AITestClass {

    private postManager: PostChannel
    private xhrOverrideSpy: any;
    private core: AppInsightsCore;
    private _requeueEvents: EventDetail[] = [];
    private _sendEvents: EventDetail[] = [];
    private _sentEvents: EventDetail[] = [];
    private _dropEvents: EventDetail[] = [];
    private _hookCalls: SendHookDetail[] = [];

    constructor(name?: string, emulateEs3?: boolean) {
        super(name, emulateEs3);
        
        this.assertNoEvents = true;
        this.assertNoHooks = true;
    }

    public testInitialize() {
        // Reset the cached isBeacons supported
        isBeaconsSupported(false);

        this._requeueEvents = [];
        this._sendEvents = [];
        this._sentEvents = [];
        this._dropEvents = [];
        this._hookCalls = [];
        this.core = new AppInsightsCore();
        var config = {
            instrumentationKey: ""
        };
        this.postManager = new PostChannel();
        this.core.initialize(config, [this.postManager]);
    }

    public testFinishedCleanup(): void {
        if (this.postManager) {
            // Stop the post channel from sending any events (after the fake server has been removed)
            this.postManager.pause();
        }

        if (this.core && this.core.isInitialized()) {
            this.core.unload(false);
        }
    }

     public registerTests() {
        let _requeueNotification = (batches: EventBatch[], reason?: EventBatchNotificationReason, isSyncRequest?: boolean) => {
            this._requeueEvents.push({
                batches: batches,
                reason: reason,
                isSync: isSyncRequest
            });
        };
    
        let _sendNotification = (batches: EventBatch[], reason?: EventBatchNotificationReason, isSyncRequest?: boolean) => {
            this._sendEvents.push({
                batches: batches,
                reason: reason,
                isSync: isSyncRequest
            });
        };
    
        let _sentNotification = (batches: EventBatch[], reason?: EventBatchNotificationReason, isSyncRequest?: boolean) => {
            this._sentEvents.push({
                batches: batches,
                reason: reason,
                isSync: isSyncRequest
            });
        };
    
        let _dropNotification = (batches: EventBatch[], reason?: EventBatchNotificationReason, isSyncRequest?: boolean) => {
            this._dropEvents.push({
                batches: batches,
                reason: reason,
                isSync: isSyncRequest
            });
        };

        let _sendHook = (payload: IPayloadData, callback: (modifiedBuffer: IPayloadData) => void, isSync?: boolean) => {
            this._hookCalls.push({
                payload: payload,
                isSync: isSync
            });
            // just call the callback
            callback(payload);
        };

        this.testCase({
            name: "HttpManager: dynamic config",
            useFakeTimers: true,
            test: () => {
                let xhrOverride: IXHROverride = {
                    sendPOST: (payload: IPayloadData,
                        oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                        oncomplete(200, {});
                    }
                };
                let hookSpy = this.sandbox.spy(_sendHook);
                let cbSpy = this.sandbox.spy();
                let core = this.core;
                let postChannel = this.postManager;
                let postId = postChannel.identifier;
                core.config.extensionConfig = core.config.extensionConfig || {};
                core.config.extensionConfig[postId].payloadListener = cbSpy;
                core.config.extensionConfig[postId].payloadPreprocessor = hookSpy;
                core.config.extensionConfig[postId].httpXHROverride = xhrOverride;
                core.config.endpointUrl = "testEndpoint";

                let testBatch = EventBatch.create("testToken", [this._createEvent()]);
                let manager: HttpManager = new HttpManager(500, 2, 1, {
                    requeue: _requeueNotification,
                    send: _sendNotification,
                    sent: _sentNotification,
                    drop: _dropNotification
                });
                
                manager.initialize(core.config, core, postChannel);
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0], xhrOverride, " the override should be set");
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, undefined, "transport is set to undefined");
                QUnit.assert.ok(hookSpy.notCalled, "sendhook should not be called");
                QUnit.assert.equal(this._sendEvents.length, 0, "No batches sent yet");
                QUnit.assert.equal(this._sentEvents.length, 0, "No batches Completed yet");
                manager.sendSynchronousBatch(testBatch);
                QUnit.assert.ok(hookSpy.calledOnce, "preprocessor should be called when the manager makes an HTTP request");
                QUnit.assert.ok(hookSpy.args[0][2], "preprocessor should have been told its a sync request");
                QUnit.assert.equal(this._sendEvents.length, 1, "batches sent");
                QUnit.assert.equal(this._sentEvents.length, 1, "batches Completed");
                QUnit.assert.equal(testBatch.events()[0].sendAttempt, 1, "attempt should be 1");
                QUnit.assert.ok(cbSpy.calledOnce, "listener should be called");
                QUnit.assert.ok(cbSpy.args[0][2], "listener should have been told its a sync request");
                let payload = cbSpy.args[0][1];
                QUnit.assert.equal(payload.urlString, "testEndpoint?cors=true&content-type=application/x-json-stream&w=0", "endpoint should be testEndpoint");
                QUnit.assert.equal(payload.headers.apikey, "testToken", "headers should contain testToken");
                QUnit.assert.equal(payload.timeout, undefined, "Timeout was undefined");
                QUnit.assert.equal(payload.disableXhrSync, false, "disable XHRSync was false");
                QUnit.assert.equal(payload.disableFetchKeepAlive, false, "disable fetch keep alive should be false");

                // dynamic changes
                core.config.extensionConfig[postId].disableFetchKeepAlive = true;
                core.config.endpointUrl = "newEndpoint";
                this.clock.tick(1);
                testBatch = EventBatch.create("newToken", [this._createEvent()]);
                manager.sendSynchronousBatch(testBatch);
                QUnit.assert.equal(this._sendEvents.length, 2, "batches sent should be 2");
                QUnit.assert.equal(this._sentEvents.length, 2, "batches Completed should be 2");
                QUnit.assert.equal(testBatch.events()[0].sendAttempt, 1, "attempt should be 1");
                QUnit.assert.ok(cbSpy.args[0][2], "listener should have been told its a sync request");
                QUnit.assert.equal(cbSpy.callCount, 2, "listener should be called twice");
                payload = cbSpy.args[1][1];
                QUnit.assert.equal(payload.urlString, "newEndpoint?cors=true&content-type=application/x-json-stream&w=0","endpoint should be newEndpoint");
                QUnit.assert.equal(payload.headers.apikey, "newToken", "apikey should contain newToken");
                QUnit.assert.equal(payload.timeout, undefined, "Timeout was undefined");
                QUnit.assert.equal(payload.disableXhrSync, false, "disable XHRSync was false");
                QUnit.assert.equal(payload.disableFetchKeepAlive, true, "disable fetch keep alive should be true");

                
                let fetchCalls = this.hookFetch((resolve) => {
                    setTimeout(function() {
                        resolve();
                    }, 0);
                });
                core.config.extensionConfig[postId].httpXHROverride = null;
                core.config.extensionConfig[postId].transports= TransportType.Fetch;
                core.config.extensionConfig[postId].disableFetchKeepAlive = false;
                this.clock.tick(1);
                QUnit.assert.ok(manager["_getDbgPlgTargets"]()[0], "Make sure that there is a transport");
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, TransportType.Fetch, "Make sure that the transport type is fetch");

                testBatch = EventBatch.create("newToken", [this._createEvent()]);
                manager.sendSynchronousBatch(testBatch);
                QUnit.assert.equal(fetchCalls.length, 1, "fetch call length should be 1");
                QUnit.assert.equal(this._requeueEvents.length, 0, "requeueEvents should be 0");
                QUnit.assert.ok(fetchCalls[0].input, "fetch call should not empty");
                QUnit.assert.equal(fetchCalls[0].init.body, "{\"name\":\"testEvent\",\"iKey\":\"o:\",\"data\":{\"baseData\":{}}}", "should get expected data");
                QUnit.assert.equal(testBatch.events()[0].sendAttempt, 1, "attempt should be 1");
            }
        });

        this.testCase({
            name: "HttpManager: Offline Support",
            useFakeTimers: true,
            test: () => {
                let core = this.core;
                let postChannel = this.postManager;
                core.config.extensionConfig = core.config.extensionConfig || {};
                let postId = postChannel.identifier;
      
                core.config.endpointUrl = "testEndpoint";

                let manager: HttpManager = new HttpManager(500, 2, 1, {
                    requeue: _requeueNotification,
                    send: _sendNotification,
                    sent: _sentNotification,
                    drop: _dropNotification
                });
                
                manager.initialize(core.config, core, postChannel);
                QUnit.assert.ok(manager._serializeOfflineEvt, "seralize function should exist");
                let evt = this._createEvent();
                evt.iKey = "testKey-123";
                let evtStr = manager._serializeOfflineEvt(evt);
                QUnit.assert.equal(evtStr, `{"name":"testEvent","iKey":"o:testKey","data":{"baseData":{}}}`,"Event should be serialized");

                QUnit.assert.ok(manager._getOfflineRequestDetails, "request details function should exist");
                let details = manager._getOfflineRequestDetails();
                QUnit.assert.equal(details.url, "testEndpoint?cors=true&content-type=application/x-json-stream&w=0", "get expected Url");
                QUnit.assert.ok(details.hdrs, "get headers Url");
                QUnit.assert.ok(details.useHdrs, "should use headers");
                
            }
        });

        this.testCase({
            name: "payloadPreprocessor with override",
            useFakeTimers: true,
            test: () => {
                var xhrOverride: IXHROverride = {
                    sendPOST: (payload: IPayloadData,
                        oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                        oncomplete(200, null);
                    }
                };

                let testBatch = EventBatch.create("testToken", [this._createEvent()]);

                // Using the default values defined as const values in Postchannel
                // 500 = MaxNumberEventPerBatch
                // 2 = MaxConnections
                // 1 = MaxRetries
                var manager: HttpManager = new HttpManager(500, 2, 1, {
                    requeue: _requeueNotification,
                    send: _sendNotification,
                    sent: _sentNotification,
                    drop: _dropNotification
                });
                const hookSpy = this.sandbox.spy(_sendHook);
                this.core.config.extensionConfig![this.postManager.identifier].payloadPreprocessor = hookSpy;

                this.core.config.extensionConfig![this.postManager.identifier].httpXHROverride = xhrOverride;
                this.core.config.endpointUrl = "testEndpoint";
                manager.initialize(this.core.config, this.core, this.postManager);
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0], xhrOverride, "Make sure that the override is used as the internal transport");
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, undefined, "Make sure that no transport value is defined");

                QUnit.assert.ok(hookSpy.notCalled); // precondition
                QUnit.assert.equal(this._sendEvents.length, 0, "No batches sent yet");
                QUnit.assert.equal(this._sentEvents.length, 0, "No batches Completed yet");
                manager.sendSynchronousBatch(testBatch);
                QUnit.assert.ok(hookSpy.calledOnce, "preprocessor should be called when the manager makes an HTTP request");
                QUnit.assert.ok(hookSpy.args[0][2], "preprocessor should have been told its a sync request");
                QUnit.assert.equal(this._sendEvents.length, 1, "batches sent");
                QUnit.assert.equal(this._sentEvents.length, 1, "batches Completed");
            }
        });

        this.testCase({
            name: "payloadPreprocessor with override throws before calling callback",
            useFakeTimers: true,
            test: () => {
                var xhrOverride: IXHROverride = {
                    sendPOST: (payload: IPayloadData,
                        oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                        oncomplete(200, null);
                    }
                };

                let testBatch = EventBatch.create("testToken", [this._createEvent()]);
                let sendHookCalled = 0;

                var manager: HttpManager = new HttpManager(500, 2, 1, {
                    requeue: _requeueNotification,
                    send: _sendNotification,
                    sent: _sentNotification,
                    drop: _dropNotification
                });
                this.core.config.extensionConfig![this.postManager.identifier].payloadPreprocessor = (payload, callback, isAsync) => {
                    sendHookCalled++;
                    throw "Fake Error";
                };

                this.core.config.extensionConfig![this.postManager.identifier].httpXHROverride = xhrOverride;
                this.core.config.endpointUrl = "testEndpoint";
                manager.initialize(this.core.config, this.core, this.postManager);
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0], xhrOverride, "Make sure that the override is used as the internal transport");
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, undefined, "Make sure that no transport value is defined");

                QUnit.assert.ok(sendHookCalled == 0); // precondition
                QUnit.assert.equal(this._sendEvents.length, 0, "No batches sent yet");
                QUnit.assert.equal(this._sentEvents.length, 0, "No batches Completed yet");
                manager.sendSynchronousBatch(testBatch);
                // Notifications are sent asynchronously
                QUnit.assert.equal(sendHookCalled, 1, "preprocessor should be called when the manager makes an HTTP request");
                QUnit.assert.equal(this._sendEvents.length, 1, "batches sent");
                QUnit.assert.equal(this._sentEvents.length, 1, "batches Completed");
            }
        });

        this.testCase({
            name: "payloadPreprocessor with override throws after calling callback",
            useFakeTimers: true,
            test: () => {
                var xhrOverride: IXHROverride = {
                    sendPOST: (payload: IPayloadData,
                        oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                        oncomplete(200, null);
                    }
                };

                let testBatch = EventBatch.create("testToken", [this._createEvent()]);
                let sendHookCalled = 0;

                var manager: HttpManager = new HttpManager(500, 2, 1, {
                    requeue: _requeueNotification,
                    send: _sendNotification,
                    sent: _sentNotification,
                    drop: _dropNotification
                });
                const hookSpy = this.sandbox.spy(_sendHook);
                this.core.config.extensionConfig![this.postManager.identifier].payloadPreprocessor = (payload, callback, isAsync) => {
                    sendHookCalled++;
                    callback(payload);
                    throw "Fake Error";
                };

                this.core.config.extensionConfig![this.postManager.identifier].httpXHROverride = xhrOverride;
                this.core.config.endpointUrl = "testEndpoint";
                manager.initialize(this.core.config, this.core, this.postManager);
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0], xhrOverride, "Make sure that the override is used as the internal transport");
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, undefined, "Make sure that no transport value is defined");

                QUnit.assert.ok(sendHookCalled == 0); // precondition
                QUnit.assert.equal(this._sendEvents.length, 0, "No batches sent yet");
                QUnit.assert.equal(this._sentEvents.length, 0, "No batches Completed yet");
                manager.sendSynchronousBatch(testBatch);
                QUnit.assert.equal(sendHookCalled, 1, "preprocessor should be called when the manager makes an HTTP request");
                QUnit.assert.equal(this._sendEvents.length, 1, "batches sent");
                QUnit.assert.equal(this._sentEvents.length, 1, "batches Completed");
            }
        });

        if (!this.isEmulatingIe) {
            this.testCase({
                name: "payloadPreprocessor should not be called during teardown with custom override",
                useFakeTimers: true,
                test: () => {
                    var xhrOverride: IXHROverride = {
                        sendPOST: (payload: IPayloadData,
                            oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                            oncomplete(200, null);
                        }
                    };
    
                    var manager: HttpManager = new HttpManager(500, 2, 1, {
                        requeue: _requeueNotification,
                        send: _sendNotification,
                        sent: _sentNotification,
                        drop: _dropNotification
                    });
    
                    const hookSpy = this.sandbox.spy(_sendHook);
                    this.core.config.extensionConfig![this.postManager.identifier].payloadPreprocessor = hookSpy;
    
                    this.core.config.extensionConfig![this.postManager.identifier].httpXHROverride = xhrOverride;
                    this.core.config.endpointUrl = "testEndpoint";
                    manager.initialize(this.core.config, this.core, this.postManager);
                    QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0], xhrOverride, "Make sure that the override is used as the internal transport");
                    QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, undefined, "Make sure that no transport value is defined");
    
                    manager.addBatch(EventBatch.create("testToken", [this._createEvent()]));
                    QUnit.assert.ok(hookSpy.notCalled); // precondition
                    QUnit.assert.equal(this._sendEvents.length, 0, "No batches sent yet");
                    QUnit.assert.equal(this._sentEvents.length, 0, "No batches Completed yet");
                    manager.teardown();
                    QUnit.assert.ok(hookSpy.notCalled, "preprocessor should not be called when the manager is being torn down");
                    // QUnit.assert.ok(hookSpy.args[0][2], "preprocessor should have been told its a sync request");
                    QUnit.assert.equal(this._sendEvents.length, 1, "batches sent");
                    QUnit.assert.equal(this._sentEvents.length, 1, "batches Completed");
                }
            });

            // Beacons don't exist in ES3 mode
            this.testCase({
                name: "payloadPreprocessor not called during teardown with beacons",
                useFakeTimers: true,
                test: () => {
                        var manager: HttpManager = new HttpManager(500, 2, 1, {
                        requeue: _requeueNotification,
                        send: _sendNotification,
                        sent: _sentNotification,
                        drop: _dropNotification
                    });
                    const hookSpy = this.sandbox.spy(_sendHook);
                    this.core.config.extensionConfig![this.postManager.identifier].payloadPreprocessor = hookSpy;
    
                    this.core.config.endpointUrl = "testEndpoint";
                    manager.initialize(this.core.config, this.core, this.postManager);
                    manager.addBatch(EventBatch.create("testToken", [this._createEvent()]));
                    QUnit.assert.ok(hookSpy.notCalled); // precondition
                    QUnit.assert.equal(this._sendEvents.length, 0, "No batches sent yet");
                    QUnit.assert.equal(this._sentEvents.length, 0, "No batches Completed yet");
                    manager.teardown();
                    QUnit.assert.ok(hookSpy.notCalled, "preprocessor should not be called when the manager is being torn down");
                    QUnit.assert.equal(this._sendEvents.length, 1, "batches sent");
                    QUnit.assert.equal(this._sentEvents.length, 1, "batches Completed");
                }
            });
        }

        this.testCase({
            name: "payloadListener with override",
            useFakeTimers: true,
            test: () => {
                var xhrOverride: IXHROverride = {
                    sendPOST: (payload: IPayloadData,
                        oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                        oncomplete(200, null);
                    }
                };

                var manager: HttpManager = new HttpManager(500, 2, 1, {
                    requeue: _requeueNotification,
                    send: _sendNotification,
                    sent: _sentNotification,
                    drop: _dropNotification
                });
                const cbSpy = this.sandbox.spy();
                this.core.config.extensionConfig![this.postManager.identifier].payloadListener = cbSpy;

                this.core.config.extensionConfig![this.postManager.identifier].httpXHROverride = xhrOverride;
                this.core.config.endpointUrl = "testEndpoint";
                manager.initialize(this.core.config, this.core, this.postManager);
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0], xhrOverride, "Make sure that the override is used as the internal transport");
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, undefined, "Make sure that no transport value is defined");

                QUnit.assert.ok(cbSpy.notCalled); // precondition
                manager.sendSynchronousBatch(EventBatch.create("testToken", [this._createEvent()]));
                QUnit.assert.ok(cbSpy.calledOnce, "listener should be called when the manager makes an HTTP request");
                QUnit.assert.ok(cbSpy.args[0][2], "listener should have been told its a sync request");
                QUnit.assert.ok(!cbSpy.args[0][3], "listener should have been told its not a beacon request");
            }
        });

        this.testCase({
            name: "payloadListener with override called during teardown",
            useFakeTimers: true,
            test: () => {
                let overrideCalled = false;
                var xhrOverride: IXHROverride = {
                    sendPOST: (payload: IPayloadData,
                        oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                        overrideCalled = true;
                        oncomplete(200, null);
                    }
                };

                var manager: HttpManager = new HttpManager(500, 2, 1, {
                    requeue: _requeueNotification,
                    send: _sendNotification,
                    sent: _sentNotification,
                    drop: _dropNotification
                });

                const cbSpy = this.sandbox.spy();
                this.core.config.extensionConfig![this.postManager.identifier].payloadListener = cbSpy;

                // This stops the internal code from falling back to use sendBeacon() when running in ES3 mode during testing
                this.core.config.extensionConfig![this.postManager.identifier].alwaysUseXhrOverride = this.isEmulatingIe ? true : undefined;
                this.core.config.extensionConfig![this.postManager.identifier].httpXHROverride = xhrOverride;
                this.core.config.endpointUrl = "testEndpoint";
                manager.initialize(this.core.config, this.core, this.postManager);
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0], xhrOverride, "Make sure that the override is used as the internal transport");
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, undefined, "Make sure that no transport value is defined");

                manager.addBatch(EventBatch.create("testToken", [this._createEvent()]));
                QUnit.assert.ok(cbSpy.notCalled); // precondition
                manager.teardown();
                QUnit.assert.ok(cbSpy.calledOnce, "listener should be called when the manager makes an HTTP request");
                QUnit.assert.ok(cbSpy.args[0][2], "listener should have been told its a sync request");
                QUnit.assert.ok(!cbSpy.args[0][3], "listener should have been told its not a beacon request");
                if (this.isEmulatingIe) {
                    QUnit.assert.ok(overrideCalled, "The override should always be called");
                } else {
                    QUnit.assert.ok(!overrideCalled, "The override should not be called");
                }
            }
        });

        this.testCase({
            name: "payloadListener with override called during teardown and override is always called",
            useFakeTimers: true,
            test: () => {
                let overrideCalled = false;
                var xhrOverride: IXHROverride = {
                    sendPOST: (payload: IPayloadData,
                        oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                        overrideCalled = true;
                        oncomplete(200, null);
                    }
                };

                var manager: HttpManager = new HttpManager(500, 2, 1, {
                    requeue: _requeueNotification,
                    send: _sendNotification,
                    sent: _sentNotification,
                    drop: _dropNotification
                });

                const cbSpy = this.sandbox.spy();
                this.core.config.extensionConfig![this.postManager.identifier].payloadListener = cbSpy;

                // This stops the internal code from falling back to use sendBeacon() when running in ES3 mode during testing
                this.core.config.extensionConfig![this.postManager.identifier].alwaysUseXhrOverride = true;
                this.core.config.extensionConfig![this.postManager.identifier].httpXHROverride = xhrOverride;
                this.core.config.endpointUrl = "testEndpoint";
                manager.initialize(this.core.config, this.core, this.postManager);
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0], xhrOverride, "Make sure that the override is used as the internal transport");
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, undefined, "Make sure that no transport value is defined");

                manager.addBatch(EventBatch.create("testToken", [this._createEvent()]));
                QUnit.assert.ok(cbSpy.notCalled); // precondition
                manager.teardown();
                QUnit.assert.ok(cbSpy.calledOnce, "listener should be called when the manager makes an HTTP request");
                QUnit.assert.ok(cbSpy.args[0][2], "listener should have been told its a sync request");
                QUnit.assert.ok(!cbSpy.args[0][3], "listener should have been told its not a beacon request");
                QUnit.assert.ok(overrideCalled, "The override should always be called");
            }
        });

        if (!this.isEmulatingIe) {
            this.testCase({
                name: "payloadListener called during teardown without xhr override using beacon for teardown",
                useFakeTimers: true,
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
                        setTimeout(function() {
                            resolve();
                        }, 0);
                    });
    
                        var manager: HttpManager = new HttpManager(500, 2, 1, {
                        requeue: _requeueNotification,
                        send: _sendNotification,
                        sent: _sentNotification,
                        drop: _dropNotification
                    });
    
                    const cbSpy = this.sandbox.spy();
                    this.core.config.extensionConfig![this.postManager.identifier].payloadListener = cbSpy;
    
                    this.core.config.endpointUrl = "testEndpoint";
                    manager.initialize(this.core.config, this.core, this.postManager);
                    QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, TransportType.Xhr, "Make sure that XHR was actually selected as the transport");
    
                    manager.addBatch(EventBatch.create("testToken", [this._createEvent()]));
                    QUnit.assert.ok(cbSpy.notCalled); // precondition
                    manager.teardown();
                    QUnit.assert.ok(cbSpy.calledOnce, "listener should be called when the manager makes an HTTP request");
                    QUnit.assert.ok(cbSpy.args[0][2], "listener should have been told its a sync request");
                    QUnit.assert.ok(cbSpy.args[0][3], "listener should have been told its a beacon request");
                    QUnit.assert.equal(fetchCalls.length, 0, "Make sure fetch was not called as beacons should be used for teardown");
                    QUnit.assert.equal(beaconCalls.length, 1, "Expect thant sendBeacon was called")
                }
            });

            this.testCase({
                name: "SendBeacon would not drop batches when local storage is available",
                useFakeTimers: true,
                test: () => {
                    let beaconCalls = [];
                    this.hookSendBeacon((url, data) => {
                        beaconCalls.push({
                            url,
                            data,
                        });
                        return false;
                    });
                    var fetchCalls = this.hookFetch((resolve) => {
                        setTimeout(function() {
                            resolve();
                        }, 0);
                    });
    
                    var xhrOverride: IXHROverride = {
                        sendPOST: (payload: IPayloadData,
                            oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                            //Error code
                            oncomplete(0, null);
                        }
                    };
                    let testBatch = EventBatch.create("testToken", [this._createEvent()]);

                    var manager: HttpManager = new HttpManager(500, 2, 1, {
                        requeue: _requeueNotification,
                        send: _sendNotification,
                        sent: _sentNotification,
                        drop: _dropNotification
                    });
                   
                    this.core.config.extensionConfig![this.postManager.identifier].httpXHROverride = xhrOverride;
                    this.core.config.endpointUrl = "testEndpoint";
                    manager.initialize(this.core.config, this.core, this.postManager);
                    QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0], xhrOverride, "Make sure that the override is used as the internal transport");
                    QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, undefined, "Make sure that no transport value is defined");
    
                    manager.sendSynchronousBatch(testBatch, EventSendType.SendBeacon);
                    QUnit.assert.equal(this._requeueEvents.length, 0, "Send Beacon doesn't Requeue failed events");

                    QUnit.assert.equal(beaconCalls.length, 2, "Two Beacon attempts should have occurred");
                    QUnit.assert.equal(fetchCalls.length, 0, "No fetch calls should have occurred");
                    // Without local storage, after the second failure, baecon will be dropped
                    QUnit.assert.equal(this._dropEvents.length, 1, "No batches have been dropped");

                    let localStorage = new TestLocalStorageChannel();
                    this.core.addPlugin(localStorage);
                    let testBatch2 = EventBatch.create("testToken", [this._createEvent("testEvent1"), this._createEvent("testEvent2"), this._createEvent("testEvent3")]);

                    this.clock.tick(1);
                    
                    manager.sendSynchronousBatch(testBatch2, EventSendType.SendBeacon);
                    QUnit.assert.equal(this._requeueEvents.length, 0, "Send Beacon doesn't Requeue failed events");

                    QUnit.assert.equal(beaconCalls.length, 4, "Four Beacon attempts should have occurred");
                    QUnit.assert.equal(fetchCalls.length, 0, "No fetch calls should have occurred");
                    // With local storage, failed sending request will not cause the batch to get dropped
                    QUnit.assert.equal(this._dropEvents.length, 1, "This time batche will not be dropped");
                }
            });

            this.testCase({
                name: "even if local storage is available, beacon would not be dropped if successfully send",
                useFakeTimers: true,
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
                        setTimeout(function() {
                            resolve();
                        }, 0);
                    });
    
                    var xhrOverride: IXHROverride = {
                        sendPOST: (payload: IPayloadData,
                            oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                            //Error code
                            oncomplete(0, null);
                        }
                    };
                    let testBatch = EventBatch.create("testToken", [this._createEvent()]);

                    var manager: HttpManager = new HttpManager(500, 2, 1, {
                        requeue: _requeueNotification,
                        send: _sendNotification,
                        sent: _sentNotification,
                        drop: _dropNotification
                    });
                   
                    this.core.config.extensionConfig![this.postManager.identifier].httpXHROverride = xhrOverride;
                    this.core.config.endpointUrl = "testEndpoint";
                    manager.initialize(this.core.config, this.core, this.postManager);
                    QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0], xhrOverride, "Make sure that the override is used as the internal transport");
                    QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, undefined, "Make sure that no transport value is defined");
    
                    let localStorage = new TestLocalStorageChannel();
                    this.core.addPlugin(localStorage);
                    let testBatch2 = EventBatch.create("testToken", [this._createEvent("testEvent1"), this._createEvent("testEvent2"), this._createEvent("testEvent3")]);

                    this.clock.tick(1);
                    
                    manager.sendSynchronousBatch(testBatch2, EventSendType.SendBeacon);
                    QUnit.assert.equal(this._requeueEvents.length, 0, "Send Beacon doesn't Requeue failed events");
                    // the first call would success, so should not go to the split and call again
                    QUnit.assert.equal(beaconCalls.length, 1, "Only one Beacon attempts should have occurred");
                    QUnit.assert.equal(fetchCalls.length, 0, "No fetch calls should have occurred");
                    // With local storage, sussefully sending request will not cause the batch to get dropped
                    QUnit.assert.equal(this._dropEvents.length, 0, "No batche should be dropped");
                }
            });

            this.testCase({
                name: "payloadListener called during teardown without xhr override using fetch",
                useFakeTimers: true,
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
                        setTimeout(function() {
                            resolve();
                        }, 0);
                    });

                    let channelConfig: IChannelConfiguration = {
                        transports: TransportType.Fetch,
                    };

                    let core = new AppInsightsCore();
                    var config: IExtendedConfiguration = {
                        instrumentationKey: "",
                        extensionConfig: {
                            "PostChannel": channelConfig
                        }
                    };

                    let postManager = new PostChannel();
                    core.initialize(config, [postManager]);

                    this.onDone(() => {
                        core.unload(false);
                    });

                        var manager: HttpManager = new HttpManager(500, 2, 1, {
                        requeue: _requeueNotification,
                        send: _sendNotification,
                        sent: _sentNotification,
                        drop: _dropNotification
                    });
                    const cbSpy = this.sandbox.spy();
                    core.config.extensionConfig![this.postManager.identifier].payloadListener = cbSpy;
    
                    core.config.endpointUrl = "testEndpoint";
                    manager.initialize(core.config, core, postManager);
                    QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, TransportType.Fetch, "Make sure that fetch was actually selected as the transport");

                    manager.addBatch(EventBatch.create("testToken", [this._createEvent()]));
                    QUnit.assert.ok(cbSpy.notCalled); // precondition
                    manager.teardown();
                    QUnit.assert.ok(cbSpy.calledOnce, "listener should be called when the manager makes an HTTP request");
                    QUnit.assert.ok(cbSpy.args[0][2], "listener should have been told its a sync request");
                    QUnit.assert.ok(cbSpy.args[0][3], "listener should have been told its a beacon request");
                    QUnit.assert.equal(fetchCalls.length, 0, "Make sure fetch was not called as beacons should be used for teardown");
                    QUnit.assert.equal(beaconCalls.length, 1, "Expect thant sendBeacon was called")
                }
            });

            this.testCase({
                name: "payloadListener called during teardown without xhr override using fetch and explicit sendBeacon",
                useFakeTimers: true,
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
                        setTimeout(function() {
                            resolve();
                        }, 0);
                    });

                    let channelConfig: IChannelConfiguration = {
                        transports: TransportType.Fetch,
                        useSendBeacon: true
                    };

                    let core = new AppInsightsCore();
                    var config: IExtendedConfiguration = {
                        instrumentationKey: "",
                        extensionConfig: {
                            "PostChannel": channelConfig
                        }
                    };

                    let postManager = new PostChannel();
                    core.initialize(config, [postManager]);

                    this.onDone(() => {
                        core.unload(false);
                    });

                        var manager: HttpManager = new HttpManager(500, 2, 1, {
                        requeue: _requeueNotification,
                        send: _sendNotification,
                        sent: _sentNotification,
                        drop: _dropNotification
                    });
                    const cbSpy = this.sandbox.spy();
                    core.config.extensionConfig![this.postManager.identifier].payloadListener = cbSpy;
    
                    core.config.endpointUrl = "testEndpoint";
                    manager.initialize(core.config, core, postManager);
                    QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, TransportType.Fetch, "Make sure that fetch was actually selected as the transport");

                    manager.addBatch(EventBatch.create("testToken", [this._createEvent()]));
                    QUnit.assert.ok(cbSpy.notCalled); // precondition
                    manager.setUnloading(true);       // Simulate page unload
                    manager.teardown();
                    QUnit.assert.ok(cbSpy.calledOnce, "listener should be called when the manager makes an HTTP request");
                    QUnit.assert.ok(cbSpy.args[0][2], "listener should have been told its a sync request");
                    QUnit.assert.ok(cbSpy.args[0][3], "listener should have been told its a beacon request");
                    QUnit.assert.equal(fetchCalls.length, 0, "Make sure fetch was not called as beacons should be used for teardown");
                    QUnit.assert.equal(beaconCalls.length, 1, "Expect thant sendBeacon was called");
                    QUnit.assert.ok(beaconCalls[0].url.indexOf("NoResponseBody=") !== -1, "Make sure NoResponseBody was requested")
                }
            });


            this.testCase({
                name: "payloadListener called during teardown without xhr override using fetch and explicit sendBeacon with addNoResponse",
                useFakeTimers: true,
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
                        setTimeout(function() {
                            resolve();
                        }, 0);
                    });

                    let channelConfig: IChannelConfiguration = {
                        transports: TransportType.Fetch,
                        useSendBeacon: true,
                        addNoResponse: false
                    };

                    let core = new AppInsightsCore();
                    var config: IExtendedConfiguration = {
                        instrumentationKey: "",
                        extensionConfig: {
                            "PostChannel": channelConfig
                        }
                    };

                    let postManager = new PostChannel();
                    core.initialize(config, [postManager]);

                    this.onDone(() => {
                        core.unload(false);
                    });

                    var manager: HttpManager = new HttpManager(500, 2, 1, {
                        requeue: _requeueNotification,
                        send: _sendNotification,
                        sent: _sentNotification,
                        drop: _dropNotification
                    });
                    const cbSpy = this.sandbox.spy();
                    core.config.extensionConfig![this.postManager.identifier].payloadListener = cbSpy;
    
                    core.config.endpointUrl = "testEndpoint";
                    manager.initialize(core.config, core, postManager);
                    QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, TransportType.Fetch, "Make sure that fetch was actually selected as the transport");

                    manager.addBatch(EventBatch.create("testToken", [this._createEvent()]));
                    QUnit.assert.ok(cbSpy.notCalled); // precondition
                    manager.setUnloading(true);       // Simulate page unload
                    manager.teardown();
                    QUnit.assert.ok(cbSpy.calledOnce, "listener should be called when the manager makes an HTTP request");
                    QUnit.assert.ok(cbSpy.args[0][2], "listener should have been told its a sync request");
                    QUnit.assert.ok(cbSpy.args[0][3], "listener should have been told its a beacon request");
                    QUnit.assert.equal(fetchCalls.length, 0, "Make sure fetch was not called as beacons should be used for teardown");
                    QUnit.assert.equal(beaconCalls.length, 1, "Expect thant sendBeacon was called");
                    QUnit.assert.ok(beaconCalls[0].url.indexOf("NoResponseBody=") === -1, "Make sure NoResponseBody was NOT requested")
                }
            });

            this.testCase({
                name: "payloadListener called during teardown without xhr override and disabling sendBeacon using fetch",
                useFakeTimers: true,
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
                        setTimeout(function() {
                            resolve();
                        }, 0);
                    });

                    let channelConfig: IChannelConfiguration = {
                        transports: TransportType.Fetch,
                        useSendBeacon: false
                    };

                    let core = new AppInsightsCore();
                    var config: IExtendedConfiguration = {
                        instrumentationKey: "",
                        extensionConfig: {
                            "PostChannel": channelConfig
                        }
                    };

                    let postManager = new PostChannel();
                    core.initialize(config, [postManager]);

                    this.onDone(() => {
                        core.unload(false);
                    });

                        var manager: HttpManager = new HttpManager(500, 2, 1, {
                        requeue: _requeueNotification,
                        send: _sendNotification,
                        sent: _sentNotification,
                        drop: _dropNotification
                    });
                    const cbSpy = this.sandbox.spy();
                    core.config.extensionConfig![this.postManager.identifier].payloadListener = cbSpy;
    
                    core.config.endpointUrl = "testEndpoint";
                    manager.initialize(core.config, core, postManager);
                    QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, TransportType.Fetch, "Make sure that fetch was actually selected as the transport");

                    manager.addBatch(EventBatch.create("testToken", [this._createEvent()]));
                    QUnit.assert.ok(cbSpy.notCalled);   // precondition
                    manager.setUnloading(true);         // Simulate page unload
                    manager.teardown();
                    QUnit.assert.ok(cbSpy.calledOnce, "listener should be called when the manager makes an HTTP request");
                    QUnit.assert.ok(cbSpy.args[0][2], "listener should have been told its a sync request");
                    QUnit.assert.ok(cbSpy.args[0][3], "listener should have been told its a beacon request (reduced payload size)");
                    QUnit.assert.equal(fetchCalls.length, 1, "It should have used fetch as sendBeacon is disabled for teardown");
                    QUnit.assert.equal(beaconCalls.length, 0, "Expect thant sendBeacon was not called")
                    QUnit.assert.ok((fetchCalls[0].input as string).indexOf("NoResponseBody=") !== -1, "Make sure NoResponseBody was requested")
                }
            });

            this.testCase({
                name: "payloadListener called during simulated unload with teardown without xhr override using fetch for unload and normal",
                useFakeTimers: true,
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
                        setTimeout(function() {
                            resolve();
                        }, 0);
                    });

                    let channelConfig: IChannelConfiguration = {
                        transports: TransportType.Fetch,
                        unloadTransports: TransportType.Fetch
                    };

                    let core = new AppInsightsCore();
                    var config: IExtendedConfiguration = {
                        instrumentationKey: "",
                        extensionConfig: {
                            "PostChannel": channelConfig
                        }
                    };

                    let postManager = new PostChannel();
                    core.initialize(config, [postManager]);

                    this.onDone(() => {
                        core.unload(false);
                    });

                        var manager: HttpManager = new HttpManager(500, 2, 1, {
                        requeue: _requeueNotification,
                        send: _sendNotification,
                        sent: _sentNotification,
                        drop: _dropNotification
                    });
                    const cbSpy = this.sandbox.spy();
                    core.config.extensionConfig![this.postManager.identifier].payloadListener = cbSpy;
    
                    core.config.endpointUrl = "testEndpoint";
                    manager.initialize(core.config, core, postManager);
                    QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, TransportType.Fetch, "Make sure that fetch was actually selected as the transport");

                    manager.addBatch(EventBatch.create("testToken", [this._createEvent()]));
                    QUnit.assert.ok(cbSpy.notCalled); // precondition
                    manager.setUnloading(true);         // Simulate page unload
                    manager.teardown();
                    QUnit.assert.ok(cbSpy.calledOnce, "listener should be called when the manager makes an HTTP request");
                    QUnit.assert.ok(cbSpy.args[0][2], "listener should have been told its a sync request");
                    QUnit.assert.ok(cbSpy.args[0][3], "listener should have been told its a beacon request");
                    QUnit.assert.equal(cbSpy.args[0][1].timeout, undefined, "Timeout was undefined");
                    QUnit.assert.equal(cbSpy.args[0][1].disableXhrSync, false, "disable XHRSync was false");
                    QUnit.assert.equal(cbSpy.args[0][1].disableFetchKeepAlive, false, "disable fetch keep alive was false");
                    QUnit.assert.equal(fetchCalls.length, 1, "It should have used fetch as we requested for teardown");
                    QUnit.assert.ok((fetchCalls[0].input as string).indexOf("NoResponseBody=") !== -1, "Make sure NoResponseBody was requested")
                    QUnit.assert.equal(beaconCalls.length, 0, "Expect thant sendBeacon was not called")
                }
            });

            this.testCase({
                name: "payloadListener called during simulated unload with teardown without xhr override specifying fetch for unload and normal but disabling fetch keepalive",
                useFakeTimers: true,
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
                        setTimeout(function() {
                            resolve();
                        }, 0);
                    });

                    let channelConfig: IChannelConfiguration = {
                        transports: TransportType.Fetch,
                        unloadTransports: TransportType.Fetch,
                        disableFetchKeepAlive: true
                    };

                    let core = new AppInsightsCore();
                    var config: IExtendedConfiguration = {
                        instrumentationKey: "",
                        extensionConfig: {
                            "PostChannel": channelConfig
                        }
                    };

                    let postManager = new PostChannel();
                    core.initialize(config, [postManager]);

                    this.onDone(() => {
                        core.unload(false);
                    });

                        var manager: HttpManager = new HttpManager(500, 2, 1, {
                        requeue: _requeueNotification,
                        send: _sendNotification,
                        sent: _sentNotification,
                        drop: _dropNotification
                    });
                    const cbSpy = this.sandbox.spy();
                    core.config.extensionConfig![this.postManager.identifier].payloadListener = cbSpy;
    
                    core.config.endpointUrl = "testEndpoint";
                    manager.initialize(core.config, core, postManager);
                    QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, TransportType.Fetch, "Make sure that fetch was actually selected as the transport");

                    manager.addBatch(EventBatch.create("testToken", [this._createEvent()]));
                    QUnit.assert.ok(cbSpy.notCalled); // precondition
                    manager.setUnloading(true);         // Simulate page unload
                    manager.teardown();
                    QUnit.assert.ok(cbSpy.calledOnce, "listener should be called when the manager makes an HTTP request");
                    QUnit.assert.ok(cbSpy.args[0][2], "listener should have been told its a sync request");
                    QUnit.assert.ok(cbSpy.args[0][3], "listener should have been told its a beacon request");
                    QUnit.assert.equal(cbSpy.args[0][1].timeout, undefined, "Timeout was undefined");
                    QUnit.assert.equal(cbSpy.args[0][1].disableXhrSync, false, "disable XHRSync was false");
                    QUnit.assert.equal(cbSpy.args[0][1].disableFetchKeepAlive, true, "disable fetch keep alive was true");
    
                    QUnit.assert.equal(fetchCalls.length, 0, "It should have used fetch as we requested for teardown");
                    QUnit.assert.equal(beaconCalls.length, 1, "Expect thant sendBeacon was called")
                    QUnit.assert.ok(beaconCalls[0].url.indexOf("NoResponseBody=") !== -1, "Make sure NoResponseBody was requested")
                }
            });

            this.testCase({
                name: "payloadListener called during teardown without send beacon and using fetch",
                useFakeTimers: true,
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
                        setTimeout(function() {
                            resolve();
                        }, 0);
                    });

                    let channelConfig: IChannelConfiguration = {
                        transports: [ TransportType.Fetch ],
                        unloadTransports: [ TransportType.Fetch ]
                    };

                    let core = new AppInsightsCore();
                    var config: IExtendedConfiguration = {
                        instrumentationKey: "",
                        extensionConfig: {
                            "PostChannel": channelConfig
                        }
                    };

                    let postManager = new PostChannel();
                    core.initialize(config, [postManager]);

                    this.onDone(() => {
                        core.unload(false);
                    });

                    var manager: HttpManager = new HttpManager(500, 2, 1, {
                        requeue: _requeueNotification,
                        send: _sendNotification,
                        sent: _sentNotification,
                        drop: _dropNotification
                    });

                    const cbSpy = this.sandbox.spy();
                    core.config.extensionConfig![this.postManager.identifier].payloadListener = cbSpy;
    
                    core.config.endpointUrl = "testEndpoint";
                    manager.initialize(core.config, core, postManager);
                    QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, TransportType.Fetch, "Make sure that fetch was actually selected as the transport");

                    manager.addBatch(EventBatch.create("testToken", [this._createEvent()]));
                    QUnit.assert.ok(cbSpy.notCalled); // precondition
                    manager.setUnloading(true);         // Simulate page unload
                    manager.teardown();
                    QUnit.assert.ok(cbSpy.calledOnce, "listener should be called when the manager makes an HTTP request");
                    QUnit.assert.ok(cbSpy.args[0][2], "listener should have been told its a sync request");
                    QUnit.assert.ok(cbSpy.args[0][3], "listener should have been told its a beacon request");
                    QUnit.assert.equal(cbSpy.args[0][1].timeout, undefined, "Timeout was undefined");
                    QUnit.assert.equal(cbSpy.args[0][1].disableXhrSync, false, "disable XHRSync was false");
                    QUnit.assert.equal(cbSpy.args[0][1].disableFetchKeepAlive, false, "disable fetch keep alive was false");
                    QUnit.assert.equal(fetchCalls.length, 1, "It should have used fetch as we requested for teardown");
                    QUnit.assert.ok((fetchCalls[0].input as string).indexOf("NoResponseBody=") !== -1, "Make sure NoResponseBody was requested")
                    QUnit.assert.equal(beaconCalls.length, 0, "Expect thant sendBeacon was not called")
                }
            });

            this.testCase({
                name: "payloadListener called during teardown without send beacon and using fetch with noResponseBody",
                useFakeTimers: true,
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
                        setTimeout(function() {
                            resolve();
                        }, 0);
                    });

                    let channelConfig: IChannelConfiguration = {
                        transports: [ TransportType.Fetch ],
                        unloadTransports: [ TransportType.Fetch ],
                        addNoResponse: false
                    };

                    let core = new AppInsightsCore();
                    var config: IExtendedConfiguration = {
                        instrumentationKey: "",
                        extensionConfig: {
                            "PostChannel": channelConfig
                        }
                    };

                    let postManager = new PostChannel();
                    core.initialize(config, [postManager]);

                    this.onDone(() => {
                        core.unload(false);
                    });

                        var manager: HttpManager = new HttpManager(500, 2, 1, {
                        requeue: _requeueNotification,
                        send: _sendNotification,
                        sent: _sentNotification,
                        drop: _dropNotification
                    });
                    const cbSpy = this.sandbox.spy();
                    core.config.extensionConfig![this.postManager.identifier].payloadListener = cbSpy;
    
                    core.config.endpointUrl = "testEndpoint";
                    manager.initialize(core.config, core, postManager);
                    QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, TransportType.Fetch, "Make sure that fetch was actually selected as the transport");

                    manager.addBatch(EventBatch.create("testToken", [this._createEvent()]));
                    QUnit.assert.ok(cbSpy.notCalled); // precondition
                    manager.setUnloading(true);         // Simulate page unload
                    manager.teardown();
                    QUnit.assert.ok(cbSpy.calledOnce, "listener should be called when the manager makes an HTTP request");
                    QUnit.assert.ok(cbSpy.args[0][2], "listener should have been told its a sync request");
                    QUnit.assert.ok(cbSpy.args[0][3], "listener should have been told its a beacon request");
                    QUnit.assert.equal(cbSpy.args[0][1].timeout, undefined, "Timeout was undefined");
                    QUnit.assert.equal(cbSpy.args[0][1].disableXhrSync, false, "disable XHRSync was false");
                    QUnit.assert.equal(cbSpy.args[0][1].disableFetchKeepAlive, false, "disable fetch keep alive was false");
                    QUnit.assert.equal(fetchCalls.length, 1, "It should have used fetch as we requested for teardown");
                    QUnit.assert.ok((fetchCalls[0].input as string).indexOf("NoResponseBody=") === -1, "Make sure NoResponseBody was NOT requested")
                    QUnit.assert.equal(beaconCalls.length, 0, "Expect thant sendBeacon was not called")
                }
            });
        }

        this.testCase({
            name: "payloadPreprocessor and payloadListener",
            useFakeTimers: true,
            test: () => {
                var xhrOverride: IXHROverride = {
                    sendPOST: (payload: IPayloadData,
                        oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                        oncomplete(200, null);
                    }
                };

                var manager: HttpManager = new HttpManager(500, 2, 1, {
                    requeue: _requeueNotification,
                    send: _sendNotification,
                    sent: _sentNotification,
                    drop: _dropNotification
                });
                const hookSpy = this.sandbox.spy(_sendHook);
                this.core.config.extensionConfig![this.postManager.identifier].payloadPreprocessor = hookSpy;

                const listenerSpy = this.sandbox.spy();
                this.core.config.extensionConfig![this.postManager.identifier].payloadListener = listenerSpy;

                this.core.config.extensionConfig![this.postManager.identifier].httpXHROverride = xhrOverride;
                this.core.config.endpointUrl = "testEndpoint";
                manager.initialize(this.core.config, this.core, this.postManager);
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0], xhrOverride, "Make sure that the override is used as the internal transport");
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, undefined, "Make sure that no transport value is defined");

                manager.addBatch(EventBatch.create("testToken", [this._createEvent()]));
                QUnit.assert.ok(hookSpy.notCalled); // precondition
                QUnit.assert.ok(listenerSpy.notCalled); // precondition
                manager.sendQueuedRequests();
                QUnit.assert.ok(hookSpy.calledOnce, "preprocessor should be called when the manager makes an HTTP request");
                QUnit.assert.ok(!hookSpy.args[0][2], "preprocessor should have been told its not a sync request");
                QUnit.assert.ok(listenerSpy.called, "listener requires the sendHook to call its callback");
                QUnit.assert.ok(listenerSpy.calledOnce, "listener should be called via the send hook callback");
                QUnit.assert.ok(!listenerSpy.args[0][2], "listener should have been told its not a sync request");
                QUnit.assert.ok(!listenerSpy.args[0][3], "listener should have been told its not a beacon request");
            }
        });

        this.testCase({
            name: "payloadPreprocessor and payloadListener during teardown with override",
            useFakeTimers: true,
            test: () => {
                var xhrOverride: IXHROverride = {
                    sendPOST: (payload: IPayloadData,
                        oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                        oncomplete(200, null);
                    }
                };

                var manager: HttpManager = new HttpManager(500, 2, 1, {
                    requeue: _requeueNotification,
                    send: _sendNotification,
                    sent: _sentNotification,
                    drop: _dropNotification
                });
                const hookSpy = this.sandbox.spy(_sendHook);
                this.core.config.extensionConfig![this.postManager.identifier].payloadPreprocessor = hookSpy;

                const listenerSpy = this.sandbox.spy();
                this.core.config.extensionConfig![this.postManager.identifier].payloadListener = listenerSpy;

                this.core.config.extensionConfig![this.postManager.identifier].httpXHROverride = xhrOverride;
                this.core.config.endpointUrl = "testEndpoint";
                manager.initialize(this.core.config, this.core, this.postManager);
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0], xhrOverride, "Make sure that the override is used as the internal transport");
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, undefined, "Make sure that no transport value is defined");

                manager.addBatch(EventBatch.create("testToken", [this._createEvent()]));
                QUnit.assert.ok(hookSpy.notCalled); // precondition
                QUnit.assert.ok(listenerSpy.notCalled); // precondition
                manager.teardown();
                QUnit.assert.ok(hookSpy.notCalled, "preprocessor should not be called when the manager is being torn down");
                // QUnit.assert.ok(hookSpy.args[0][2], "preprocessor should have been told its a sync request");
                QUnit.assert.ok(listenerSpy.called, "listener should be called when the manager makes an HTTP request");
                QUnit.assert.ok(listenerSpy.calledOnce, "listener should be called via the send hook callback");
                QUnit.assert.ok(listenerSpy.args[0][2], "listener should have been told its a sync request");
                QUnit.assert.ok(!listenerSpy.args[0][3], "listener should have been told its not a beacon request");
            }
        });

        this.testCase({
            name: "payloadPreprocessor and payloadListener during teardown without xhr override",
            useFakeTimers: true,
            test: () => {
                var manager: HttpManager = new HttpManager(500, 2, 1, {
                    requeue: _requeueNotification,
                    send: _sendNotification,
                    sent: _sentNotification,
                    drop: _dropNotification
                });
                const hookSpy = this.sandbox.spy(_sendHook);
                this.core.config.extensionConfig![this.postManager.identifier].payloadPreprocessor = hookSpy;

                const listenerSpy = this.sandbox.spy();
                this.core.config.extensionConfig![this.postManager.identifier].payloadListener = listenerSpy;

                this.core.config.endpointUrl = "testEndpoint";
                manager.initialize(this.core.config, this.core, this.postManager);
                manager.addBatch(EventBatch.create("testToken", [this._createEvent()]));
                QUnit.assert.ok(hookSpy.notCalled); // precondition
                QUnit.assert.ok(listenerSpy.notCalled); // precondition
                manager.teardown();
                QUnit.assert.ok(hookSpy.notCalled, "preprocessor should not be called when the manager is being torn down");
                QUnit.assert.ok(listenerSpy.calledOnce, "listener should be called via the send hook callback");
                QUnit.assert.ok(listenerSpy.args[0][2], "listener should have been told its a sync request");
                QUnit.assert.ok(listenerSpy.args[0][3], "listener should have been told its a beacon request");
            }
        });

        this.testCase({
            name: "sendSynchronousRequest",
            useFakeTimers: true,
            test: () => {
                var xhrOverride: IXHROverride = {
                    sendPOST: (payload: IPayloadData,
                        oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                        oncomplete(200, null);
                    }
                };

                let testBatch = EventBatch.create("testToken", [this._createEvent()]);
                var manager: HttpManager = new HttpManager(500, 2, 1, {
                    requeue: _requeueNotification,
                    send: _sendNotification,
                    sent: _sentNotification,
                    drop: _dropNotification
                });
                let xhrOverrideSpy = this.sandbox.spy(xhrOverride, "sendPOST");

                this.core.config.extensionConfig![this.postManager.identifier].httpXHROverride = xhrOverride;
                this.core.config.endpointUrl = "testEndpoint";
                manager.initialize(this.core.config, this.core, this.postManager);
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0], xhrOverride, "Make sure that the override is used as the internal transport");
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, undefined, "Make sure that no transport value is defined");

                QUnit.assert.equal(this._sendEvents.length, 0, "No events sent yet");
                manager.sendSynchronousBatch(testBatch);
                QUnit.assert.equal(this._sendEvents.length, 1, "No events sent yet");
                QUnit.assert.equal(xhrOverrideSpy.called, true);
                QUnit.assert.equal(this._requeueEvents.length, 0);
                QUnit.assert.equal(this._sendEvents.length, 1);
                QUnit.assert.equal(this._sentEvents.length, 1);
                var overrideArgs = xhrOverrideSpy.getCall(0).args;
                QUnit.assert.notEqual(overrideArgs[0].urlString, "");
                QUnit.assert.equal(overrideArgs[0].data, "{\"name\":\"testEvent\",\"iKey\":\"o:\",\"data\":{\"baseData\":{}}}");
                QUnit.assert.equal(testBatch.events()[0].sendAttempt, 1);
                this.clock.tick(1);
                QUnit.assert.equal(this._requeueEvents.length, 0);
                QUnit.assert.equal(this._sendEvents.length, 1);
                QUnit.assert.equal(this._sentEvents.length, 1);
            }
        });

        this.testCase({
            name: "Validate synchronous event with 299 response",
            useFakeTimers: true,
            test: () => {
                var xhrOverride: IXHROverride = {
                    sendPOST: (payload: IPayloadData,
                        oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                        // Error code
                        oncomplete(299, null);
                    }
                };
                let testBatch = EventBatch.create("testToken", [this._createEvent()]);
                var manager: HttpManager = new HttpManager(500, 2, 1, {
                    requeue: _requeueNotification,
                    send: _sendNotification,
                    sent: _sentNotification,
                    drop: _dropNotification
                });
                this.core.config.extensionConfig![this.postManager.identifier].httpXHROverride = xhrOverride;
                this.core.config.endpointUrl = "testEndpoint";
                manager.initialize(this.core.config, this.core, this.postManager);
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0], xhrOverride, "Make sure that the override is used as the internal transport");
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, undefined, "Make sure that no transport value is defined");

                manager.sendSynchronousBatch(testBatch);
                QUnit.assert.equal(this._requeueEvents.length, 1, "Requeue got called once");
                var addBackRequestArg: EventBatch = this._requeueEvents[0].batches[0];
                QUnit.assert.equal(addBackRequestArg.count(), 1);
                QUnit.assert.equal(addBackRequestArg.events()[0].name, "testEvent");
            }
        });

        this.testCase({
            name: "Validate synchronous event with zero response - Default Send Type (Synchronous)",
            useFakeTimers: true,
            test: () => {
                let beaconCalls = [];
                this.hookSendBeacon((url, data) => {
                    beaconCalls.push({
                        url,
                        data,
                    });
                    return false;
                });
                var fetchCalls = this.hookFetch((resolve) => {
                    setTimeout(function() {
                        resolve();
                    }, 0);
                });

                var xhrOverride: IXHROverride = {
                    sendPOST: (payload: IPayloadData,
                        oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                        //Error code
                        oncomplete(0, null);
                    }
                };
                let testBatch = EventBatch.create("testToken", [this._createEvent()]);
                var manager: HttpManager = new HttpManager(500, 2, 1, {
                    requeue: _requeueNotification,
                    send: _sendNotification,
                    sent: _sentNotification,
                    drop: _dropNotification
                });
                this.core.config.extensionConfig![this.postManager.identifier].httpXHROverride = xhrOverride;
                this.core.config.endpointUrl = "testEndpoint";
                manager.initialize(this.core.config, this.core, this.postManager);
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0], xhrOverride, "Make sure that the override is used as the internal transport");
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, undefined, "Make sure that no transport value is defined");

                manager.sendSynchronousBatch(testBatch);
                // Once requeued HttpManager has handed responsibility of the batch back to the "listener" (PostChannel)
                QUnit.assert.equal(this._requeueEvents.length, 1, "Requeue got called once");

                var addBackRequestArg: EventBatch = this._requeueEvents[0].batches[0];
                QUnit.assert.equal(addBackRequestArg.count(), 1);
                QUnit.assert.equal(addBackRequestArg.events()[0].name, "testEvent");

                QUnit.assert.equal(beaconCalls.length, 0, "No Beacon calls should have occurred");
                QUnit.assert.equal(fetchCalls.length, 0, "No fetch calls should have occurred");

                QUnit.assert.equal(this._sendEvents.length, 1, "A batch has been sent");
                QUnit.assert.equal(this._sentEvents.length, 0, "No batches Completed yet");
                QUnit.assert.equal(this._dropEvents.length, 0, "No batches have been dropped");
            }
        });

        if (!this.isEmulatingIe) {
            this.testCase({
                name: "Validate synchronous event with failed response - Explicit Send Type (SendBeacon)",
                useFakeTimers: true,
                test: () => {
                    let beaconCalls = [];
                    this.hookSendBeacon((url, data) => {
                        beaconCalls.push({
                            url,
                            data,
                        });
                        return false;
                    });
                    var fetchCalls = this.hookFetch((resolve) => {
                        setTimeout(function() {
                            resolve();
                        }, 0);
                    });
    
                    var xhrOverride: IXHROverride = {
                        sendPOST: (payload: IPayloadData,
                            oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                            //Error code
                            oncomplete(0, null);
                        }
                    };
                        let testBatch = EventBatch.create("testToken", [this._createEvent()]);
                    var manager: HttpManager = new HttpManager(500, 2, 1, {
                        requeue: _requeueNotification,
                        send: _sendNotification,
                        sent: _sentNotification,
                        drop: _dropNotification
                    });
                    this.core.config.extensionConfig![this.postManager.identifier].httpXHROverride = xhrOverride;
                    this.core.config.endpointUrl = "testEndpoint";
                    manager.initialize(this.core.config, this.core, this.postManager);
                    QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0], xhrOverride, "Make sure that the override is used as the internal transport");
                    QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, undefined, "Make sure that no transport value is defined");
    
                    manager.sendSynchronousBatch(testBatch, EventSendType.SendBeacon);
                    QUnit.assert.equal(this._requeueEvents.length, 0, "Send Beacon doesn't Requeue failed events");
    
                    QUnit.assert.equal(beaconCalls.length, 2, "Two Beacon attempts should have occurred");
                    QUnit.assert.equal(fetchCalls.length, 0, "No fetch calls should have occurred");
                    QUnit.assert.equal(this._sendEvents.length, 1, "A batch has been sent");
                    QUnit.assert.equal(this._sentEvents.length, 1, "No batches Completed yet");
                    // The 2nd failed will cause the batch to get dropped
                    QUnit.assert.equal(this._dropEvents.length, 1, "One batches have been dropped");
                }
            });
        }

        this.testCase({
            name: "Validate synchronous event with zero response always using the override - Explicit Send Type (SendBeacon)",
            useFakeTimers: true,
            test: () => {
                let beaconCalls = [];
                this.hookSendBeacon((url, data) => {
                    beaconCalls.push({
                        url,
                        data,
                    });
                    return false;
                });
                var fetchCalls = this.hookFetch((resolve) => {
                    setTimeout(function() {
                        resolve();
                    }, 0);
                });

                var xhrOverride: IXHROverride = {
                    sendPOST: (payload: IPayloadData,
                        oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                        //Error code
                        oncomplete(0, null);
                    }
                };
                let testBatch = EventBatch.create("testToken", [this._createEvent()]);
                var manager: HttpManager = new HttpManager(500, 2, 1, {
                    requeue: _requeueNotification,
                    send: _sendNotification,
                    sent: _sentNotification,
                    drop: _dropNotification
                });

                this.core.config.extensionConfig![this.postManager.identifier].alwaysUseXhrOverride = true;
                this.core.config.extensionConfig![this.postManager.identifier].httpXHROverride = xhrOverride;
                this.core.config.endpointUrl = "testEndpoint";
                manager.initialize(this.core.config, this.core, this.postManager);
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0], xhrOverride, "Make sure that the override is used as the internal transport");
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, undefined, "Make sure that no transport value is defined");

                manager.sendSynchronousBatch(testBatch, EventSendType.SendBeacon);
                // Once Requeued HttpManager hands responsibility of the batch back to the PostChannel
                QUnit.assert.equal(this._requeueEvents.length, 1, "The httpXhrOverride will Requeue");

                var addBackRequestArg: EventBatch = this._requeueEvents[0].batches[0];
                QUnit.assert.equal(addBackRequestArg.count(), 1);
                QUnit.assert.equal(addBackRequestArg.events()[0].name, "testEvent");

                QUnit.assert.equal(beaconCalls.length, 0, "No Beacon calls should have occurred");
                QUnit.assert.equal(fetchCalls.length, 0, "No fetch calls should have occurred");
                QUnit.assert.equal(this._sendEvents.length, 1, "A batch has been sent");
                QUnit.assert.equal(this._sentEvents.length, 0, "No batches Completed yet");
                QUnit.assert.equal(this._dropEvents.length, 0, "No batches have been dropped");
            }
        });

        this.testCase({
            name: "Validate synchronous event with delayed failed response - Explicit Send Type (SyncFetch)",
            useFakeTimers: true,
            test: () => {
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
                    }, 1);
                });

                var xhrOverride: IXHROverride = {
                    sendPOST: (payload: IPayloadData,
                        oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                        //Error code
                        oncomplete(0, null);
                    }
                };
                let testBatch = EventBatch.create("testToken", [this._createEvent()]);
                var manager: HttpManager = new HttpManager(500, 2, 1, {
                    requeue: _requeueNotification,
                    send: _sendNotification,
                    sent: _sentNotification,
                    drop: _dropNotification
                });
                this.core.config.extensionConfig![this.postManager.identifier].httpXHROverride = xhrOverride;
                this.core.config.endpointUrl = "testEndpoint";
                manager.initialize(this.core.config, this.core, this.postManager);
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0], xhrOverride, "Make sure that the override is used as the internal transport");
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, undefined, "Make sure that no transport value is defined");

                manager.sendSynchronousBatch(testBatch, EventSendType.SyncFetch);
                QUnit.assert.equal(this._requeueEvents.length, 0, "wE need to wait for the response to get processed");
                QUnit.assert.equal(fetchCalls.length, 1, "We should have performed a fetch call");
                QUnit.assert.equal(this._sendEvents.length, 1, "A batch has been sent");
                QUnit.assert.equal(this._sentEvents.length, 0, "Only unload reason causes the batch to be considered successful!");
                QUnit.assert.equal(this._dropEvents.length, 0, "No batches have been dropped");

                // This would have caused a "Retry"
                let retryAttempt = 0;
                /// Trigger the retry as it's random we need to loop
                while (retryAttempt < 4000 && this._sendEvents.length === 1) {
                    this.clock.tick(100);
                    retryAttempt += 100;
                }
                

                this.clock.tick(100);

                // Nothing should have occurred
                QUnit.assert.equal(this._requeueEvents.length, 1, "A Sync Fetch eventually requeues should occur unless it was an unload");
                QUnit.assert.equal(fetchCalls.length, 1, "We should have performed a fetch call");
                QUnit.assert.equal(this._sendEvents.length, 1, "A batch has been sent");
                QUnit.assert.equal(this._sentEvents.length, 0, "Only unload reason causes the batch to be considered successful!");
                QUnit.assert.equal(this._dropEvents.length, 0, "No batches have been dropped");
            }
        });

        this.testCase({
            name: "Validate synchronous event with delayed failed response but simulating unload - Explicit Send Type (SyncFetch)",
            useFakeTimers: true,
            test: () => {
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
                    }, 1);
                });

                var xhrOverride: IXHROverride = {
                    sendPOST: (payload: IPayloadData,
                        oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                        //Error code
                        oncomplete(0, null);
                    }
                };
                let testBatch = EventBatch.create("testToken", [this._createEvent()]);
                var manager: HttpManager = new HttpManager(500, 2, 1, {
                    requeue: _requeueNotification,
                    send: _sendNotification,
                    sent: _sentNotification,
                    drop: _dropNotification
                });
                this.core.config.extensionConfig![this.postManager.identifier].httpXHROverride = xhrOverride;
                this.core.config.endpointUrl = "testEndpoint";
                manager.initialize(this.core.config, this.core, this.postManager);
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0], xhrOverride, "Make sure that the override is used as the internal transport");
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, undefined, "Make sure that no transport value is defined");

                manager.sendSynchronousBatch(testBatch, EventSendType.SyncFetch, SendRequestReason.Unload);
                QUnit.assert.equal(this._requeueEvents.length, 0, "A Sync Fetch during unload acts like sendBeacon() -- ignores response so no requeue should occur");
                QUnit.assert.equal(fetchCalls.length, 1, "We should have performed a fetch call");
                QUnit.assert.equal(this._sendEvents.length, 1, "A batch has been sent");
                QUnit.assert.equal(this._sentEvents.length, 1, "A sync Fetch during an unload is considered successful!");
                QUnit.assert.equal(this._dropEvents.length, 0, "No batches have been dropped");

                this.clock.tick(100);

                // Nothing should have occurred
                QUnit.assert.equal(this._requeueEvents.length, 0, "A Sync Fetch during unload acts like sendBeacon() -- ignores response so no requeue should occur");
                QUnit.assert.equal(fetchCalls.length, 1, "We should have performed a fetch call");
                QUnit.assert.equal(this._sendEvents.length, 1, "A batch has been sent");
                QUnit.assert.equal(this._sentEvents.length, 1, "A sync Fetch during an unload is considered successful!");
                QUnit.assert.equal(this._dropEvents.length, 0, "No batches have been dropped");
            }
        });

        this.testCase({
            name: "Validate synchronous event with immediate reject - Explicit Send Type (SyncFetch)",
            useFakeTimers: true,
            test: () => {
                let beaconCalls = [];
                this.hookSendBeacon((url, data) => {
                    beaconCalls.push({
                        url,
                        data,
                    });
                    return false;
                });
                var fetchCalls = this.hookFetch((resolve, reject) => {
                    reject();
                });

                var xhrOverride: IXHROverride = {
                    sendPOST: (payload: IPayloadData,
                        oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                        //Error code
                        oncomplete(0, null);
                    }
                };
                let testBatch = EventBatch.create("testToken", [this._createEvent()]);
                var manager: HttpManager = new HttpManager(500, 2, 1, {
                    requeue: _requeueNotification,
                    send: _sendNotification,
                    sent: _sentNotification,
                    drop: _dropNotification
                });
                this.core.config.extensionConfig![this.postManager.identifier].httpXHROverride = xhrOverride;
                this.core.config.endpointUrl = "testEndpoint";
                manager.initialize(this.core.config, this.core, this.postManager);
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0], xhrOverride, "Make sure that the override is used as the internal transport");
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, undefined, "Make sure that no transport value is defined");

                manager.sendSynchronousBatch(testBatch, EventSendType.SyncFetch);
                QUnit.assert.equal(fetchCalls.length, 1, "We should have performed a fetch call");

                // An immediate failure should requeue the events and once requeued HttpManager has handed responsibility of the batch back to the "listener" (PostChannel)
                QUnit.assert.equal(this._requeueEvents.length, 1, "Requeue got called once");

                var addBackRequestArg: EventBatch = this._requeueEvents[0].batches[0];
                QUnit.assert.equal(addBackRequestArg.count(), 1);
                QUnit.assert.equal(addBackRequestArg.events()[0].name, "testEvent");

                QUnit.assert.equal(beaconCalls.length, 0, "No Beacon calls should have occurred");
                QUnit.assert.equal(fetchCalls.length, 1, "No fetch calls should have occurred");

                QUnit.assert.equal(this._sendEvents.length, 1, "A batch has been sent");
                QUnit.assert.equal(this._sentEvents.length, 0, "No batches Completed yet");
                QUnit.assert.equal(this._dropEvents.length, 0, "No batches have been dropped");

                /// Move forward to trigger and possible the 2nd timeout (which should not occur)
                this.clock.tick(5000);

                // Still No additional retries should occur
                QUnit.assert.equal(beaconCalls.length, 0, "No Beacon calls should have occurred");
                QUnit.assert.equal(fetchCalls.length, 1, "No fetch calls should have occurred");
                QUnit.assert.equal(this._requeueEvents.length, 1, "It did not get Requeue again");
                QUnit.assert.equal(this._sendEvents.length, 1, "A batch has been sent");
                QUnit.assert.equal(this._sentEvents.length, 0, "No batches Completed yet");
                QUnit.assert.equal(this._dropEvents.length, 0, "Batches should have been dropped");
            }
        });

        this.testCase({
            name: "retry synchronous event with zero response always use override - Default Send Type (SyncFetch)",
            useFakeTimers: true,
            test: () => {
                let beaconCalls = [];
                this.hookSendBeacon((url, data) => {
                    beaconCalls.push({
                        url,
                        data,
                    });
                    return false;
                });
                var fetchCalls = this.hookFetch((resolve) => {
                    setTimeout(function() {
                        resolve();
                    }, 0);
                });

                var xhrOverride: IXHROverride = {
                    sendPOST: (payload: IPayloadData,
                        oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                        //Error code
                        oncomplete(0, null);
                    }
                };
                let testBatch = EventBatch.create("testToken", [this._createEvent()]);
                var manager: HttpManager = new HttpManager(500, 2, 1, {
                    requeue: _requeueNotification,
                    send: _sendNotification,
                    sent: _sentNotification,
                    drop: _dropNotification
                });

                this.core.config.extensionConfig![this.postManager.identifier].alwaysUseXhrOverride = true;
                this.core.config.extensionConfig![this.postManager.identifier].httpXHROverride = xhrOverride;
                this.core.config.endpointUrl = "testEndpoint";
                manager.initialize(this.core.config, this.core, this.postManager);
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0], xhrOverride, "Make sure that the override is used as the internal transport");
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, undefined, "Make sure that no transport value is defined");

                manager.sendSynchronousBatch(testBatch, EventSendType.SendBeacon);
                // Once Requeued HttpManager hands responsibility of the batch back to the PostChannel
                QUnit.assert.equal(this._requeueEvents.length, 1, "The httpXhrOverride will Requeue");

                var addBackRequestArg: EventBatch = this._requeueEvents[0].batches[0];
                QUnit.assert.equal(addBackRequestArg.count(), 1);
                QUnit.assert.equal(addBackRequestArg.events()[0].name, "testEvent");

                QUnit.assert.equal(beaconCalls.length, 0, "No Beacon calls should have occurred");
                QUnit.assert.equal(fetchCalls.length, 0, "No fetch calls should have occurred");
                QUnit.assert.equal(this._sendEvents.length, 1, "A batch has been sent");
                QUnit.assert.equal(this._sentEvents.length, 0, "No batches Completed yet");
                QUnit.assert.equal(this._dropEvents.length, 0, "No batches have been dropped");
            }
        });

        this.testCase({
            name: "retry synchronous event with zero response - Default Send Type (Batched)",
            useFakeTimers: true,
            test: () => {
                var xhrOverride: IXHROverride = {
                    sendPOST: (payload: IPayloadData,
                        oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                        //Error code
                        oncomplete(0, null);
                    }
                };
                let testBatch = EventBatch.create("testToken", [this._createEvent()]);
                var manager: HttpManager = new HttpManager(500, 2, 1, {
                    requeue: _requeueNotification,
                    send: _sendNotification,
                    sent: _sentNotification,
                    drop: _dropNotification
                });
                this.core.config.extensionConfig![this.postManager.identifier].httpXHROverride = xhrOverride;
                this.core.config.endpointUrl = "testEndpoint";
                manager.initialize(this.core.config, this.core, this.postManager);
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0], xhrOverride, "Make sure that the override is used as the internal transport");
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, undefined, "Make sure that no transport value is defined");

                manager.sendSynchronousBatch(testBatch, EventSendType.Batched);
                QUnit.assert.equal(this._requeueEvents.length, 0, "Normal batched events cause a retry and not a requeue");

                QUnit.assert.equal(this._sendEvents.length, 1, "A batch has been sent");
                QUnit.assert.equal(this._sentEvents.length, 0, "No batches Completed yet");
                QUnit.assert.equal(this._dropEvents.length, 0, "No batches have been dropped");

                let retryAttempt = 0;
                /// Trigger the retry as it's random we need to loop (initial send plus retry send)
                while (retryAttempt < 40 && this._sendEvents.length < 2) {
                    this.clock.tick(100);
                    retryAttempt += 1;
                }
                
                QUnit.assert.equal(this._requeueEvents.length, 1, "It got Requeued");
                QUnit.assert.equal(this._sendEvents.length, 2, "And it got sent");
                QUnit.assert.equal(this._sentEvents.length, 0, "No batches Completed yet");
                QUnit.assert.equal(this._dropEvents.length, 0, "No batches have been dropped");
            }
        });

        this.testCase({
            name: "sendQueuedRequests with override",
            useFakeTimers: true,
            test: () => {
                var xhrOverride: IXHROverride = {
                    sendPOST: (payload: IPayloadData,
                        oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                        oncomplete(200, null);
                    }
                };
                let testBatch = EventBatch.create("testToken", [this._createEvent()]);
                var manager: HttpManager = new HttpManager(500, 2, 1, {
                    requeue: _requeueNotification,
                    send: _sendNotification,
                    sent: _sentNotification,
                    drop: _dropNotification
                });
                let xhrOverrideSpy = this.sandbox.spy(xhrOverride, "sendPOST");

                this.core.config.extensionConfig![this.postManager.identifier].httpXHROverride = xhrOverride;
                this.core.config.endpointUrl = "testEndpoint";
                manager.initialize(this.core.config, this.core, this.postManager);
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0], xhrOverride, "Make sure that the override is used as the internal transport");
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, undefined, "Make sure that no transport value is defined");

                manager.addBatch(testBatch);
                manager.sendQueuedRequests();
                QUnit.assert.equal(xhrOverrideSpy.called, true);
                QUnit.assert.equal(this._requeueEvents.length, 0);
                var overrideArgs = xhrOverrideSpy.getCall(0).args;
                QUnit.assert.notEqual(overrideArgs[0].urlString, "");
                QUnit.assert.equal(overrideArgs[0].data, "{\"name\":\"testEvent\",\"iKey\":\"o:\",\"data\":{\"baseData\":{}}}");
                QUnit.assert.equal(testBatch.events()[0].sendAttempt, 1);
            }
        });

        this.testCase({
            name: "sendQueuedRequests with fetch",
            useFakeTimers: true,
            test: () => {
                var fetchCalls = this.hookFetch((resolve) => {
                    setTimeout(function() {
                        resolve();
                    }, 0);
                });

                let testBatch = EventBatch.create("testToken", [this._createEvent()]);
                var manager: HttpManager = new HttpManager(500, 2, 1, {
                    requeue: _requeueNotification,
                    send: _sendNotification,
                    sent: _sentNotification,
                    drop: _dropNotification
                });
                this.core.config.extensionConfig![this.postManager.identifier].transports = TransportType.Fetch;
                this.core.config.endpointUrl = "testEndpoint";
                manager.initialize(this.core.config, this.core, this.postManager);
                QUnit.assert.ok(manager["_getDbgPlgTargets"]()[0], "Make sure that there is a transport");
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, TransportType.Fetch, "Make sure that the transport type is fetch");

                manager.addBatch(testBatch);
                manager.sendQueuedRequests();
                QUnit.assert.equal(fetchCalls.length, 1);
                QUnit.assert.equal(this._requeueEvents.length, 0);
                QUnit.assert.notEqual(fetchCalls[0].input, "");
                QUnit.assert.equal(fetchCalls[0].init.body, "{\"name\":\"testEvent\",\"iKey\":\"o:\",\"data\":{\"baseData\":{}}}");
                QUnit.assert.equal(testBatch.events()[0].sendAttempt, 1);
            }
        });

        if (!this.isEmulatingIe) {
            this.testCase({
                name: "sendQueuedRequests with beacons",
                useFakeTimers: true,
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
                        setTimeout(function() {
                            resolve();
                        }, 0);
                    });

                        let testBatch = EventBatch.create("testToken", [this._createEvent()]);
                    var manager: HttpManager = new HttpManager(500, 2, 1, {
                        requeue: _requeueNotification,
                        send: _sendNotification,
                        sent: _sentNotification,
                        drop: _dropNotification
                    });
                    this.core.config.extensionConfig![this.postManager.identifier].transports = TransportType.Beacon;
                    this.core.config.endpointUrl = "testEndpoint";
                    manager.initialize(this.core.config, this.core, this.postManager);
                    QUnit.assert.ok(manager["_getDbgPlgTargets"]()[0], "Make sure that there is a transport");
                    QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, TransportType.Beacon, "Make sure that the transport type is Beacon");

                    manager.addBatch(testBatch);
                    manager.sendQueuedRequests();
                    QUnit.assert.equal(fetchCalls.length, 0);
                    QUnit.assert.equal(beaconCalls.length, 1);
                    QUnit.assert.equal(this._requeueEvents.length, 0);
                    QUnit.assert.notEqual(beaconCalls[0].url, "");
                    QUnit.assert.equal(beaconCalls[0].data, "{\"name\":\"testEvent\",\"iKey\":\"o:\",\"data\":{\"baseData\":{}}}");
                    QUnit.assert.equal(testBatch.events()[0].sendAttempt, 1);
                }
            });

            this.testCase({
                name: "sendQueuedRequests with beacons with splitting",
                useFakeTimers: true,
                test: () => {
                    let beaconCalls = [];
                    this.hookSendBeacon((url, data) => {
                        beaconCalls.push({
                            url,
                            data,
                        });

                        if (beaconCalls.length === 1) {
                            // fail the first request so it gets split and resent
                            return false;
                        }

                        return true;
                    });
                    var fetchCalls = this.hookFetch((resolve) => {
                        setTimeout(function() {
                            resolve();
                        }, 0);
                    });

                        let testBatch = EventBatch.create("testToken", [this._createEvent("testEvent1"), this._createEvent("testEvent2"), this._createEvent("testEvent3")]);
                    var manager: HttpManager = new HttpManager(500, 2, 1, {
                        requeue: _requeueNotification,
                        send: _sendNotification,
                        sent: _sentNotification,
                        drop: _dropNotification
                    });
                    this.core.config.extensionConfig![this.postManager.identifier].transports = TransportType.Beacon;
                    this.core.config.endpointUrl = "testEndpoint";
                    manager.initialize(this.core.config, this.core, this.postManager);
                    QUnit.assert.ok(manager["_getDbgPlgTargets"]()[0], "Make sure that there is a transport");
                    QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, TransportType.Beacon, "Make sure that the transport type is Beacon");

                    manager.addBatch(testBatch);
                    manager.sendQueuedRequests();
                    QUnit.assert.equal(fetchCalls.length, 0);
                    QUnit.assert.equal(beaconCalls.length, 4);
                    QUnit.assert.equal(this._requeueEvents.length, 0);
                    QUnit.assert.notEqual(beaconCalls[0].url, "");
                    QUnit.assert.equal(beaconCalls[0].data, "{\"name\":\"testEvent1\",\"iKey\":\"o:\",\"data\":{\"baseData\":{}}}\n{\"name\":\"testEvent2\",\"iKey\":\"o:\",\"data\":{\"baseData\":{}}}\n{\"name\":\"testEvent3\",\"iKey\":\"o:\",\"data\":{\"baseData\":{}}}");
                    QUnit.assert.equal(testBatch.events()[0].sendAttempt, 1);
                    QUnit.assert.notEqual(beaconCalls[1].url, "");
                    QUnit.assert.equal(beaconCalls[1].data, "{\"name\":\"testEvent1\",\"iKey\":\"o:\",\"data\":{\"baseData\":{}}}");
                    QUnit.assert.notEqual(beaconCalls[2].url, "");
                    QUnit.assert.equal(beaconCalls[2].data, "{\"name\":\"testEvent2\",\"iKey\":\"o:\",\"data\":{\"baseData\":{}}}");
                    QUnit.assert.notEqual(beaconCalls[3].url, "");
                    QUnit.assert.equal(beaconCalls[3].data, "{\"name\":\"testEvent3\",\"iKey\":\"o:\",\"data\":{\"baseData\":{}}}");
                }
            });
        }

        this.testCase({
            name: "w parameter",
            useFakeTimers: true,
            test: () => {
                var xhrOverride: IXHROverride = {
                    sendPOST: (payload: IPayloadData,
                        oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                        oncomplete(200, null);
                    }
                };
                var manager: HttpManager = new HttpManager(500, 2, 1, {
                    requeue: _requeueNotification,
                    send: _sendNotification,
                    sent: _sentNotification,
                    drop: _dropNotification
                });
                let xhrOverrideSpy = this.sandbox.spy(xhrOverride, "sendPOST");

                this.core.config.extensionConfig![this.postManager.identifier].httpXHROverride = xhrOverride;
                this.core.config.endpointUrl = "testEndpoint";
                manager.initialize(this.core.config, this.core, this.postManager);
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0], xhrOverride, "Make sure that the override is used as the internal transport");
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, undefined, "Make sure that no transport value is defined");

                this.core.getWParam = () => {
                    return 0;
                }
                manager.sendSynchronousBatch(EventBatch.create("testToken", [this._createEvent()]));
                QUnit.assert.equal(xhrOverrideSpy.called, true);
                var overrideArgs = xhrOverrideSpy.getCall(0).args;
                QUnit.assert.ok(overrideArgs[0].urlString.indexOf("w=0") > -1);
                // w parameter is updated correctly
                this.core.getWParam = () => {
                    return 2;
                }
                manager.sendSynchronousBatch(EventBatch.create("testToken", [this._createEvent()]));
                overrideArgs = xhrOverrideSpy.getCall(1).args;
                QUnit.assert.ok(overrideArgs[0].urlString.indexOf("w=2") > -1);
            }
        });

        this.testCase({
            name: "MSFPC test",
            useFakeTimers: true,
            test: () => {
                var xhrOverride: IXHROverride = {
                    sendPOST: (payload: IPayloadData,
                        oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                        oncomplete(200, null);
                    }
                };
                var manager: HttpManager = new HttpManager(500, 2, 1, {
                    requeue: _requeueNotification,
                    send: _sendNotification,
                    sent: _sentNotification,
                    drop: _dropNotification
                });
                let xhrOverrideSpy = this.sandbox.spy(xhrOverride, "sendPOST");

                this.core.config.extensionConfig![this.postManager.identifier].httpXHROverride = xhrOverride;
                this.core.config.endpointUrl = "testEndpoint";
                manager.initialize(this.core.config, this.core, this.postManager);
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0], xhrOverride, "Make sure that the override is used as the internal transport");
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, undefined, "Make sure that no transport value is defined");

                var testEvent = {
                    name: "testEvent",
                    ext: {}
                };
                testEvent.ext["intweb"] = {};
                testEvent.ext["intweb"]["msfpc"] = "testMSFPC";
                manager.sendSynchronousBatch(EventBatch.create("testToken", [testEvent]));
                QUnit.assert.equal(xhrOverrideSpy.called, true);
                var overrideArgs = xhrOverrideSpy.getCall(0).args;
                QUnit.assert.ok(overrideArgs[0].urlString.indexOf("ext.intweb.msfpc") > -1);
                // MSFPC not added in query string if not available in the event
                manager.sendSynchronousBatch(EventBatch.create("testToken", [this._createEvent()]));
                overrideArgs = xhrOverrideSpy.getCall(1).args;
                QUnit.assert.ok(overrideArgs[0].urlString.indexOf("ext.intweb.msfpc") === -1);
            }
        });

        this.testCaseAsync({
            name: "retry not synchronous event",
            stepDelay: 6000,
            steps: [
                () => {
                    var xhrOverride: IXHROverride = {
                        sendPOST: (payload: IPayloadData,
                            oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                            //Error code
                            oncomplete(299, null);
                        }
                    };
                        var manager: HttpManager = new HttpManager(500, 2, 1, {
                        requeue: _requeueNotification,
                        send: _sendNotification,
                        sent: _sentNotification,
                        drop: _dropNotification
                    });
                    
                    manager.addBatch(EventBatch.create("testToken", [this._createEvent()]));
                    this.xhrOverrideSpy = this.sandbox.spy(xhrOverride, "sendPOST");

                    this.core.config.extensionConfig![this.postManager.identifier].httpXHROverride = xhrOverride;
                    this.core.config.endpointUrl = "testEndpoint";
                    manager.initialize(this.core.config, this.core, this.postManager);
                    QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0], xhrOverride, "Make sure that the override is used as the internal transport");
                    QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, undefined, "Make sure that no transport value is defined");

                    manager.sendQueuedRequests();
                }]
                .concat(() => {
                    QUnit.assert.equal(this.xhrOverrideSpy.called, true);
                    QUnit.assert.equal(this.xhrOverrideSpy.callCount, 2);
                    var secondEventArg = this.xhrOverrideSpy.getCall(1).args[0].urlString;
                    QUnit.assert.notEqual(secondEventArg, null);
                })
        });

        if (!this.isEmulatingIe) {
            this.testCase({
                name: "sendQueuedRequests with beacons once unload is detected",
                useFakeTimers: true,
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
                        setTimeout(function() {
                            resolve();
                        }, 0);
                    });

                        let testBatch = EventBatch.create("testToken", [this._createEvent()]);
                    var manager: HttpManager = new HttpManager(500, 2, 1, {
                        requeue: _requeueNotification,
                        send: _sendNotification,
                        sent: _sentNotification,
                        drop: _dropNotification
                    });
                    this.core.config.endpointUrl = "testEndpoint";
                    manager.initialize(this.core.config, this.core, this.postManager);
                    manager.setUnloading(true);
                    QUnit.assert.ok(manager["_getDbgPlgTargets"]()[0], "Make sure that there is a transport");
                    QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, TransportType.Xhr, "Make sure that the transport type is Xhr");

                    manager.addBatch(testBatch);
                    manager.sendQueuedRequests();
                    QUnit.assert.equal(fetchCalls.length, 0);
                    QUnit.assert.equal(beaconCalls.length, 1);
                    QUnit.assert.equal(this._requeueEvents.length, 0);
                    QUnit.assert.notEqual(beaconCalls[0].url, "");
                    QUnit.assert.ok(beaconCalls[0].url.indexOf("NoResponseBody=") !== -1, "Make sure NoResponseBody was requested")
                    QUnit.assert.equal(beaconCalls[0].data, "{\"name\":\"testEvent\",\"iKey\":\"o:\",\"data\":{\"baseData\":{}}}");
                    QUnit.assert.equal(testBatch.events()[0].sendAttempt, 1);
                }
            });

            this.testCase({
                name: "sendQueuedRequests with beacons and splitting once unload is detected",
                useFakeTimers: true,
                test: () => {
                    let beaconCalls = [];
                    this.hookSendBeacon((url, data) => {
                        beaconCalls.push({
                            url,
                            data,
                        });

                        if (beaconCalls.length === 1) {
                            // fail the first request so it gets split and resent
                            return false;
                        }

                        return true;
                    });
                    var fetchCalls = this.hookFetch((resolve) => {
                        setTimeout(function() {
                            resolve();
                        }, 0);
                    });

                        let testBatch = EventBatch.create("testToken", [this._createEvent("testEvent1"), this._createEvent("testEvent2"), this._createEvent("testEvent3")]);
                    var manager: HttpManager = new HttpManager(500, 2, 1, {
                        requeue: _requeueNotification,
                        send: _sendNotification,
                        sent: _sentNotification,
                        drop: _dropNotification
                    });
                    this.core.config.endpointUrl = "testEndpoint";
                    manager.initialize(this.core.config, this.core, this.postManager);
                    // Simulate sending with beacons
                    manager.setUnloading(true);
                    QUnit.assert.ok(manager["_getDbgPlgTargets"]()[0], "Make sure that there is a transport");
                    QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, TransportType.Xhr, "Make sure that the transport type is Xhr");

                    manager.addBatch(testBatch);
                    manager.sendQueuedRequests();
                    QUnit.assert.equal(fetchCalls.length, 0);
                    QUnit.assert.equal(beaconCalls.length, 4);
                    QUnit.assert.equal(this._requeueEvents.length, 0);
                    QUnit.assert.notEqual(beaconCalls[0].url, "");
                    QUnit.assert.ok(beaconCalls[0].url.indexOf("NoResponseBody=") !== -1, "Make sure NoResponseBody was requested")
                    QUnit.assert.equal(beaconCalls[0].data, "{\"name\":\"testEvent1\",\"iKey\":\"o:\",\"data\":{\"baseData\":{}}}\n{\"name\":\"testEvent2\",\"iKey\":\"o:\",\"data\":{\"baseData\":{}}}\n{\"name\":\"testEvent3\",\"iKey\":\"o:\",\"data\":{\"baseData\":{}}}");
                    QUnit.assert.equal(testBatch.events()[0].sendAttempt, 1);
                    QUnit.assert.notEqual(beaconCalls[1].url, "");
                    QUnit.assert.ok(beaconCalls[1].url.indexOf("NoResponseBody=") !== -1, "Make sure NoResponseBody was requested")
                    QUnit.assert.equal(beaconCalls[1].data, "{\"name\":\"testEvent1\",\"iKey\":\"o:\",\"data\":{\"baseData\":{}}}");
                    QUnit.assert.notEqual(beaconCalls[2].url, "");
                    QUnit.assert.ok(beaconCalls[2].url.indexOf("NoResponseBody=") !== -1, "Make sure NoResponseBody was requested")
                    QUnit.assert.equal(beaconCalls[2].data, "{\"name\":\"testEvent2\",\"iKey\":\"o:\",\"data\":{\"baseData\":{}}}");
                    QUnit.assert.notEqual(beaconCalls[3].url, "");
                    QUnit.assert.ok(beaconCalls[3].url.indexOf("NoResponseBody=") !== -1, "Make sure NoResponseBody was requested")
                    QUnit.assert.equal(beaconCalls[3].data, "{\"name\":\"testEvent3\",\"iKey\":\"o:\",\"data\":{\"baseData\":{}}}");
                }
            });
        }

        this.testCase({
            name: "Validate that override and preprocessor receives timeout and disableXhr config settings with defaults",
            useFakeTimers: true,
            test: () => {
                let sentPayloadData = [];
                var xhrOverride: IXHROverride = {
                    sendPOST: (payload: IPayloadData, oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                        
                        sentPayloadData.push({
                            payload,
                            sync
                        });
                        oncomplete(200, null);
                    }
                };

                let testBatch = EventBatch.create("testToken", [this._createEvent()]);

                var manager: HttpManager = new HttpManager(500, 2, 1, {
                    requeue: _requeueNotification,
                    send: _sendNotification,
                    sent: _sentNotification,
                    drop: _dropNotification
                });
                const hookSpy = this.sandbox.spy(_sendHook);
                this.core.config.extensionConfig![this.postManager.identifier].payloadPreprocessor = hookSpy;

                this.core.config.extensionConfig![this.postManager.identifier].httpXHROverride = xhrOverride;
                this.core.config.endpointUrl = "testEndpoint";
                manager.initialize(this.core.config, this.core, this.postManager);
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0], xhrOverride, "Make sure that the override is used as the internal transport");
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, undefined, "Make sure that no transport value is defined");

                QUnit.assert.equal(this._sendEvents.length, 0, "No batches sent yet");
                QUnit.assert.equal(this._sentEvents.length, 0, "No batches Completed yet");
                manager.sendSynchronousBatch(testBatch);
                // Notifications are sent asynchronously
                QUnit.assert.equal(this._sendEvents.length, 1, "batches sent");
                QUnit.assert.equal(this._sentEvents.length, 1, "batches Completed");

                QUnit.assert.equal(this._hookCalls.length, 1, "Hook data got the payload");
                QUnit.assert.equal(this._hookCalls[0].payload.timeout, undefined, "Timeout was undefined");
                QUnit.assert.equal(this._hookCalls[0].payload.disableXhrSync, false, "disable XHRSync was false");
                QUnit.assert.equal(this._hookCalls[0].payload.disableFetchKeepAlive, false, "disable fetch keep alive was false");

                QUnit.assert.equal(sentPayloadData.length, 1, "Sent payload data got the payload");
                QUnit.assert.equal(sentPayloadData[0].sync, true, "This should have been a synchronous request");
                QUnit.assert.equal(sentPayloadData[0].payload.timeout, undefined, "Timeout was undefined");
                QUnit.assert.equal(sentPayloadData[0].payload.disableXhrSync, false, "disable XHRSync was false");
                QUnit.assert.equal(this._hookCalls[0].payload.disableFetchKeepAlive, false, "disable fetch keep alive was false");
            }
        });

        this.testCase({
            name: "Validate that override and preprocessor receives timeout and disableXhr config settings with not disabled",
            useFakeTimers: true,
            test: () => {
                let sentPayloadData = [];
                var xhrOverride: IXHROverride = {
                    sendPOST: (payload: IPayloadData, oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                        
                        sentPayloadData.push({
                            payload,
                            sync
                        });
                        oncomplete(200, null);
                    }
                };

                let testBatch = EventBatch.create("testToken", [this._createEvent()]);

                var manager: HttpManager = new HttpManager(500, 2, 1, {
                    requeue: _requeueNotification,
                    send: _sendNotification,
                    sent: _sentNotification,
                    drop: _dropNotification
                });

                const hookSpy = this.sandbox.spy(_sendHook);
                this.core.config.extensionConfig![this.postManager.identifier].payloadPreprocessor = hookSpy;

                this.core.config.extensionConfig![this.postManager.identifier].disableXhrSync = false;
                this.core.config.extensionConfig![this.postManager.identifier].xhrTimeout = 1000;
                this.core.config.extensionConfig![this.postManager.identifier].httpXHROverride = xhrOverride;
                this.core.config.endpointUrl = "testEndpoint";
                manager.initialize(this.core.config, this.core, this.postManager);
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0], xhrOverride, "Make sure that the override is used as the internal transport");
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, undefined, "Make sure that no transport value is defined");

                QUnit.assert.equal(this._hookCalls.length, 0, "Nothing should be sent yet");
                manager.sendSynchronousBatch(testBatch);

                QUnit.assert.equal(this._hookCalls.length, 1, "Hook data got the payload");
                QUnit.assert.equal(this._hookCalls[0].payload.timeout, 1000, "Timeout was undefined");
                QUnit.assert.equal(this._hookCalls[0].payload.disableXhrSync, false, "disable XHRSync was undefined");

                QUnit.assert.equal(sentPayloadData.length, 1, "Sent payload data got the payload");
                QUnit.assert.equal(sentPayloadData[0].sync, true, "Should have been a synchronous request");
                QUnit.assert.equal(sentPayloadData[0].payload.timeout, 1000, "Timeout was undefined");
                QUnit.assert.equal(sentPayloadData[0].payload.disableXhrSync, false, "disable XHRSync was undefined");
            }
        });

        this.testCase({
            name: "Validate that override and preprocessor receives timeout and disableXhr config settings with not disabled",
            useFakeTimers: true,
            test: () => {
                let sentPayloadData = [];
                var xhrOverride: IXHROverride = {
                    sendPOST: (payload: IPayloadData, oncomplete: (status: number, headers: { [headerName: string]: string }) => void, sync?: boolean) => {
                        
                        sentPayloadData.push({
                            payload,
                            sync
                        });
                        oncomplete(200, null);
                    }
                };

                let testBatch = EventBatch.create("testToken", [this._createEvent()]);

                var manager: HttpManager = new HttpManager(500, 2, 1, {
                    requeue: _requeueNotification,
                    send: _sendNotification,
                    sent: _sentNotification,
                    drop: _dropNotification
                });

                const hookSpy = this.sandbox.spy(_sendHook);
                this.core.config.extensionConfig![this.postManager.identifier].payloadPreprocessor = hookSpy;

                this.core.config.extensionConfig![this.postManager.identifier].disableXhrSync = true;
                this.core.config.extensionConfig![this.postManager.identifier].xhrTimeout = 2000;
                this.core.config.extensionConfig![this.postManager.identifier].httpXHROverride = xhrOverride;
                this.core.config.endpointUrl = "testEndpoint";
                manager.initialize(this.core.config, this.core, this.postManager);
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0], xhrOverride, "Make sure that the override is used as the internal transport");
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, undefined, "Make sure that no transport value is defined");

                QUnit.assert.equal(this._hookCalls.length, 0, "Nothing should be called yet");
                manager.sendSynchronousBatch(testBatch);

                QUnit.assert.equal(this._hookCalls.length, 1, "Hook data got the payload");
                QUnit.assert.equal(this._hookCalls[0].payload.timeout, 2000, "Timeout was undefined");
                QUnit.assert.equal(this._hookCalls[0].payload.disableXhrSync, true, "disable XHRSync was undefined");

                QUnit.assert.equal(sentPayloadData.length, 1, "Sent payload data got the payload");
                QUnit.assert.equal(sentPayloadData[0].sync, true, "Should have been a synchronous request");
                QUnit.assert.equal(sentPayloadData[0].payload.timeout, 2000, "Timeout was undefined");
                QUnit.assert.equal(sentPayloadData[0].payload.disableXhrSync, true, "disable XHRSync was undefined");
            }
        });

        this.testCase({
            name: "Validate timeout with Xhr",
            useFakeTimers: true,
            test: () => {
                var manager: HttpManager = new HttpManager(500, 2, 1, {
                    requeue: _requeueNotification,
                    send: _sendNotification,
                    sent: _sentNotification,
                    drop: _dropNotification
                });
                
                const cbSpy = this.sandbox.spy();
                this.core.config.extensionConfig![this.postManager.identifier].payloadListener = cbSpy;

                this.core.config.extensionConfig![this.postManager.identifier].xhrTimeout = 500;
                this.core.config.endpointUrl = "testEndpoint";
                manager.initialize(this.core.config, this.core, this.postManager);
                QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, TransportType.Xhr, "Make sure that XHR was actually selected as the transport");

                manager.addBatch(EventBatch.create("testToken", [this._createEvent()]));
                QUnit.assert.ok(cbSpy.notCalled); // precondition
                QUnit.assert.equal(this._requeueEvents.length, 0, "No batches requeued");
                QUnit.assert.equal(this._sendEvents.length, 0, "No batches sent yet");
                QUnit.assert.equal(this._sentEvents.length, 0, "No batches Completed yet");
                QUnit.assert.equal(this._dropEvents.length, 0, "No batches have been dropped");
                manager.sendQueuedRequests(EventSendType.Batched);
                this.clock.tick(100);

                QUnit.assert.equal(this._sendEvents.length, 1, "A batch has been sent");
                QUnit.assert.equal(this._requeueEvents.length, 0, "No batches requeued");
                QUnit.assert.equal(this._sentEvents.length, 0, "No batches Completed yet");
                QUnit.assert.equal(this._dropEvents.length, 0, "No batches have been dropped");

                QUnit.assert.ok(cbSpy.calledOnce, "listener should be called when the manager makes an HTTP request");
                QUnit.assert.ok(!cbSpy.args[0][2], "listener should have been told its not a sync request");
                QUnit.assert.ok(!cbSpy.args[0][3], "listener should have been told its not a beacon request");

                /// Move forward to trigger the "timeout" and notifications
                this.clock.tick(400);

                QUnit.assert.ok(cbSpy.calledOnce, "listener should be called when the manager makes an HTTP request");

                QUnit.assert.equal(this._requeueEvents.length, 0, "No batches requeued");
                QUnit.assert.equal(this._sendEvents.length, 1, "A batch has been sent");
                QUnit.assert.equal(this._sentEvents.length, 0, "No batches Completed yet");
                QUnit.assert.equal(this._dropEvents.length, 0, "No batches have been dropped");

                let retryAttempt = 0;
                /// Trigger the retry as it's random we need to loop
                while (retryAttempt< 4000 && this._requeueEvents.length < 2) {
                    this.clock.tick(100);
                    retryAttempt += 1;
                }
                    
                QUnit.assert.equal(cbSpy.callCount, 2, "listener should be called when the manager makes an HTTP request");

                QUnit.assert.equal(this._sendEvents.length, 2, "A batch has been sent twice (initial and retry)");
                QUnit.assert.equal(this._requeueEvents.length, 1, "After the retry the events where requeued");
                QUnit.assert.equal(this._sentEvents.length, 0, "No batches Completed yet");
                QUnit.assert.equal(this._dropEvents.length, 0, "Events where not dropped");
            }
        });

        if (!this.isEmulatingIe) {
            this.testCase({
                name: "Validate timeout with fetch",
                useFakeTimers: true,
                test: () => {
                    var fetchCalls = this.hookFetch((_resolve) => {
                        // Do nothing to simulate no response
                    });
    
                    let channelConfig: IChannelConfiguration = {
                        transports: TransportType.Fetch,
                        xhrTimeout: 500
                    };
    
                    let core = new AppInsightsCore();
                    var config: IExtendedConfiguration = {
                        instrumentationKey: "",
                        extensionConfig: {
                            "PostChannel": channelConfig
                        }
                    };
    
                    let postManager = new PostChannel();
                    core.initialize(config, [postManager]);
    
                    this.onDone(() => {
                        core.unload(false);
                    });

                        var manager: HttpManager = new HttpManager(500, 2, 1, {
                        requeue: _requeueNotification,
                        send: _sendNotification,
                        sent: _sentNotification,
                        drop: _dropNotification
                    });
                    const cbSpy = this.sandbox.spy();
                    core.config.extensionConfig![this.postManager.identifier].payloadListener = cbSpy;
    
                    core.config.endpointUrl = "testEndpoint";
                    manager.initialize(core.config, core, postManager);
                    QUnit.assert.equal(manager["_getDbgPlgTargets"]()[0]._transport, TransportType.Fetch, "Make sure that fetch was actually selected as the transport");
    
                    manager.addBatch(EventBatch.create("testToken", [this._createEvent()]));
                    QUnit.assert.ok(cbSpy.notCalled); // precondition
                    QUnit.assert.equal(this._requeueEvents.length, 0, "No batches requeued");
                    QUnit.assert.equal(this._sendEvents.length, 0, "No batches sent yet");
                    QUnit.assert.equal(this._sentEvents.length, 0, "No batches Completed yet");
                    QUnit.assert.equal(this._dropEvents.length, 0, "No batches have been dropped");
    
                    manager.sendQueuedRequests(EventSendType.Batched);
                    this.clock.tick(100);
    
                    QUnit.assert.equal(this._sendEvents.length, 1, "One send attempt sent");
                    QUnit.assert.equal(this._requeueEvents.length, 0, "No batches requeued");
                    QUnit.assert.equal(this._sentEvents.length, 0, "No batches Completed yet");
                    QUnit.assert.equal(this._dropEvents.length, 0, "No batches have been dropped");
    
                    QUnit.assert.ok(cbSpy.calledOnce, "listener should be called when the manager makes an HTTP request");
                    QUnit.assert.ok(!cbSpy.args[0][2], "listener should have been told its not a sync request");
                    QUnit.assert.ok(!cbSpy.args[0][3], "listener should have been told its not a beacon request");
                    QUnit.assert.equal(fetchCalls.length, 1, "Make sure fetch was called");
    
                    let retryAttempt = 0;
                    /// Trigger the retry as it's random we need to loop
                    while (retryAttempt < 4000 && cbSpy.callCount === 1) {
                        this.clock.tick(100);
                        retryAttempt += 1;
                    }
                        
                    QUnit.assert.equal(cbSpy.callCount, 2, "listener should be called when the manager makes an HTTP request");

                    QUnit.assert.equal(this._sendEvents.length, 2, "A batch has been sent");
                    QUnit.assert.equal(this._requeueEvents.length, 0, "Batche was requeued");
                    QUnit.assert.equal(this._sentEvents.length, 0, "No batches Completed yet");
                    QUnit.assert.equal(this._dropEvents.length, 0, "No batches have been dropped");
                    QUnit.assert.equal(fetchCalls.length, 2, "Make sure fetch was called");
                }
            });
        }
    }

    private _createEvent(name = "testEvent") {
        var testEvent: IPostTransmissionTelemetryItem = {
            sendAttempt: 0,
            name: name
        };

        return testEvent;
    }
}

class TestLocalStorageChannel extends BaseTelemetryPlugin implements IPlugin {
    processTelemetry(env: ITelemetryItem, itemCtx?: IProcessTelemetryContext | undefined): void {
        throw new Error("Method not implemented.");
    }
    public identifier: string = "LocalStorage";    
    
}