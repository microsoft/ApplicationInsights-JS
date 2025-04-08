import { AITestClass, Assert, PollingAssert } from "@microsoft/ai-test-framework";
import { AppInsightsCore, getWindow, IPayloadData, ITelemetryItem, strContains, TransportType } from "@microsoft/applicationinsights-core-js";
import { Sender } from "../../../src/Sender";
import { SinonSpy } from 'sinon';
import { ISenderConfig } from "../../../types/applicationinsights-channel-js";
import { isBeaconApiSupported } from "@microsoft/applicationinsights-common";
export class StatsbeatTests extends AITestClass {
    private _core: AppInsightsCore;
    private _sender: Sender;
    private statsbeatCountSpy: SinonSpy;
    private fetchStub: sinon.SinonStub;
    private fakeXMLHttpRequest: any;
    private trackSpy: SinonSpy;
    public testInitialize() {
        this._core = new AppInsightsCore();
        this._sender = new Sender();
        this.fakeXMLHttpRequest = (window as any).XMLHttpRequest;
    }

    public testFinishedCleanup() {
        if (this._sender && this._sender.isInitialized()) {
            this._sender.pause();
            this._sender._buffer.clear();
            this._sender.teardown();
        }
        this._sender = null;
        this._core = null;
        if (this.statsbeatCountSpy) {
            this.statsbeatCountSpy.restore();
        }
        if (this.fetchStub) {
            this.fetchStub.restore();
        }
        if (this.trackSpy) {
            this.trackSpy.restore();
        }
        (window as any).XMLHttpRequest = this.fakeXMLHttpRequest;
    }

    public registerTests() {
        this.testCase({
            name: "Statsbeat initializes when stats is true",
            test: () => {
                let config = {
                    _sdk: {stats: true},
                    instrumentationKey: "Test-iKey"
                };

                // Initialize core with the configuration
                this._core.initialize(config, [this._sender]);

                // Get Statsbeat from core
                const statsbeat = this._core.getStatsBeat();

                // Assert that Statsbeat is initialized
                QUnit.assert.ok(statsbeat, "Statsbeat is initialized");
                QUnit.assert.ok(statsbeat.isInitialized(), "Statsbeat is marked as initialized");
            }
        });

        this.testCase({
            name: "Statsbeat dynamically updates when stats changes",
            useFakeTimers: true,
            test: () => {
                let config = {
                    _sdk: {stats: false},
                    instrumentationKey: "Test-iKey"
                };
    
                // Initialize core with the configuration
                this._core.initialize(config, [this._sender]);
    
                // Initially, Statsbeat should be null
                let statsbeat = this._core.getStatsBeat();
                QUnit.assert.ok(!statsbeat, "Statsbeat is null when _sdk.stats is false");
    
                // Dynamically enable Statsbeat using _sdk.stats
                if (!this._core.config._sdk) {
                    this._core.config._sdk = {};
                }
                this._core.config._sdk.stats = true;
                this.clock.tick(1); // Simulate time passing for dynamic config update
    
                statsbeat = this._core.getStatsBeat();
                QUnit.assert.ok(statsbeat, "Statsbeat is initialized after enabling _sdk.stats");
                QUnit.assert.ok(statsbeat.isInitialized(), "Statsbeat is marked as initialized after enabling _sdk.stats");
    
                // Dynamically disable Statsbeat again
                this._core.config._sdk.stats = false;
                this.clock.tick(1); // Simulate time passing for dynamic config update
    
                statsbeat = this._core.getStatsBeat();
                QUnit.assert.ok(!statsbeat, "Statsbeat is null after disabling disableStatsBeat again");
            }
        });

        this.testCaseAsync({
            name: "Statsbeat increments success count when fetch sender is called once",
            useFakeTimers: true,
            stepDelay: 100,
            steps: [
                () => {
                    let sendBeaconCalled = false;
                    this.hookSendBeacon((url: string) => {
                        sendBeaconCalled = true;
                        return false;
                    });
                    this.fetchStub = this.sandbox.stub(window, "fetch").callsFake(() => {
                        return Promise.resolve(new Response("{}", {
                            status: 200,
                            statusText: "OK"
                        }));
                    });
                    let config = {
                        endpointUrl: "https//:test",
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
                        instrumentationKey: "000e0000-e000-0000-a000-000000000000",
                        _sdk: { stats: true },
                        extensionConfig: {[sender.identifier]: config}
                    };

                    cr.initialize(coreConfig, [sender]);
                    this.statsbeatCountSpy = this.sandbox.spy(cr.getStatsBeat(), 'count');
                    this.trackSpy = this.sandbox.spy(cr, 'track');
                    this.onDone(() => {
                        sender.teardown();
                    });

                    const telemetryItem: ITelemetryItem = {
                        name: 'fake item',
                        iKey: 'testIkey2;ingestionendpoint=testUrl1',
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
                    this.clock.tick(900000); // Simulate time passing for statsbeat to be sent
                }
            ].concat(PollingAssert.createPollingAssert(() => {
                if (this.statsbeatCountSpy.called && this.fetchStub.called) {
                    Assert.equal(this.statsbeatCountSpy.callCount, 1, "Statsbeat count should be calledonce");
                    Assert.equal(this.fetchStub.callCount, 1, "Fetch sender should be called once");
                    Assert.equal(this.statsbeatCountSpy.firstCall.args[0], 200, "Statsbeat count should be called with status 200");
                    let data = JSON.stringify(this.statsbeatCountSpy.firstCall.args[1]);
                    Assert.ok(strContains(data, "startTime"), "Statsbeat count should be called with startTime set");
                    Assert.equal(this.statsbeatCountSpy.firstCall.args[2], "localhost", "Statsbeat count should be called with host localhost");
                    // console.log("this.trackSpy", this.trackSpy.called);
                    let statsbeatEvent = this.trackSpy.firstCall.args[0];
                    Assert.equal(statsbeatEvent.baseType, "MetricData", "Statsbeat event should be of type MetricData");
                    Assert.equal(statsbeatEvent.baseData.name, "Request_Success_Count", "Statsbeat event should be of type Request_Success_Count");
                    return true;
                }
                return false;
            }, "Waiting for fetch sender and Statsbeat count to be called") as any)
        });

        this.testCaseAsync({
            name: "Statsbeat increments retry count when fetch sender is called once",
            useFakeTimers: true,
            stepDelay: 100,
            steps: [
                () => {
                    let sendBeaconCalled = false;
                    this.hookSendBeacon((url: string) => {
                        sendBeaconCalled = true;
                        return false;
                    });
                    this.fetchStub = this.sandbox.stub(window, "fetch").callsFake(() => {
                        return Promise.resolve(new Response("{}", {
                            status: 439,
                            statusText: "not a success response" // this result fetch api throw out an error and status code will be changed to 400
                        }));
                    });
                    let config = {
                        endpointUrl: "https//:test",
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
                        instrumentationKey: "000e0000-e000-0000-a000-000000000000",
                        _sdk: { stats: true },
                        extensionConfig: {[sender.identifier]: config}
                    };

                    cr.initialize(coreConfig, [sender]);
                    this.statsbeatCountSpy = this.sandbox.spy(cr.getStatsBeat(), 'count');
                    this.trackSpy = this.sandbox.spy(cr, 'track');
                    this.onDone(() => {
                        sender.teardown();
                    });

                    const telemetryItem: ITelemetryItem = {
                        name: 'fake item',
                        iKey: 'testIkey2;ingestionendpoint=testUrl1',
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
                    this.clock.tick(900000); // Simulate time passing for statsbeat to be sent
                }
            ].concat(PollingAssert.createPollingAssert(() => {
                if (this.statsbeatCountSpy.called && this.fetchStub.called) {
                    Assert.equal(this.statsbeatCountSpy.callCount, 1, "Statsbeat count should be calledonce");
                    Assert.equal(this.fetchStub.callCount, 1, "Fetch sender should be called once");
                    Assert.equal(this.statsbeatCountSpy.firstCall.args[0], 400, "Statsbeat count should be called with status 400");
                    let data = JSON.stringify(this.statsbeatCountSpy.firstCall.args);
                    Assert.ok(strContains(data, "startTime"), "Statsbeat count should be called with startTime set");
                    let statsbeatEvent = this.trackSpy.firstCall.args[0];
                    Assert.equal(statsbeatEvent.baseType, "MetricData", "Statsbeat event should be of type MetricData");
                    Assert.equal(statsbeatEvent.baseData.name, "failure", "Statsbeat event should be of type failure");
                    (window as any).XMLHttpRequest = this.fakeXMLHttpRequest;
                    return true;
                }
                return false;
            }, "Waiting for fetch sender and Statsbeat count to be called", 60, 1000) as any)
        });
    }
}