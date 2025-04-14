import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { AppInsightsCore, IAppInsightsCore, IConfiguration, IPlugin, ITelemetryItem } from "../../../src/applicationinsights-core-js";
import { Statsbeat } from "../../../src/JavaScriptSDK/StatsBeat";
import { IPayloadData } from "../../../src/JavaScriptSDK.Interfaces/IXHROverride";
import * as sinon from "sinon";
const STATS_COLLECTION_SHORT_INTERVAL: number = 900000; // 15 minutes

export class StatsBeatTests extends AITestClass {
    private _core: AppInsightsCore;
    private _config: IConfiguration;
    private _statsbeat: Statsbeat;
    private _trackSpy: sinon.SinonSpy;

    constructor(emulateIe: boolean) {
        super("StatsBeatTests", emulateIe);
    }

    public testInitialize() {
        let _self = this;
        super.testInitialize();
        
        _self._config = {
            instrumentationKey: "Test-iKey",
            disableInstrumentationKeyValidation: true,
            _sdk: {
                stats: true  // Enable statsbeat by default
            }
        };
        
        _self._core = new AppInsightsCore();
        _self._statsbeat = new Statsbeat();
        
        // Create spy for tracking telemetry
        _self._trackSpy = this.sandbox.spy(_self._core, "track");
    }

    public testCleanup() {
        super.testCleanup();
        this._core = null;
        this._statsbeat = null;
    }

    public registerTests() {

        this.testCase({
            name: "StatsBeat: Initialization",
            test: () => {
                // Test with no initialization
                Assert.equal(false, this._statsbeat.isInitialized(), "StatsBeat should not be initialized by default");
                
                // Initialize and test
                this._statsbeat.initialize(this._core, {
                    ikey: "Test-iKey",
                    endpoint: "https://example.endpoint.com",
                    version: "1.0.0"
                });
                Assert.equal(true, this._statsbeat.isInitialized(), "StatsBeat should be initialized after initialization");
            }
        });

        this.testCase({
            name: "StatsBeat: count method tracks request metrics",
            useFakeTimers: true,
            test: () => {
                // Initialize StatsBeat
                this._statsbeat.initialize(this._core, {
                    ikey: "Test-iKey",
                    endpoint: "https://example.endpoint.com",
                    version: "1.0.0"
                });
                
                // Create mock payload data with timing information
                const payloadData = {
                    urlString: "https://example.endpoint.com",
                    data: "testData",
                    headers: {},
                    timeout: 0,
                    disableXhrSync: false,
                    statsBeatData: {
                        startTime: "2023-10-01T00:00:00Z" // Simulated start time
                    }
                } as IPayloadData;
                
                // Test successful request
                this._statsbeat.count(200, payloadData, "https://example.endpoint.com");
                
                // Test failed request
                this._statsbeat.count(500, payloadData, "https://example.endpoint.com");
                
                // Test throttled request
                this._statsbeat.count(429, payloadData, "https://example.endpoint.com");
                
                // Verify that trackStatsbeats is called when the timer fires
                this.clock.tick(STATS_COLLECTION_SHORT_INTERVAL + 1);
                
                // Verify that track was called
                Assert.ok(this._trackSpy.called, "track should be called when statsbeat timer fires");
                
                // When the timer fires, multiple metrics should be sent
                Assert.ok(this._trackSpy.callCount >= 3, "Multiple metrics should be tracked");
            }
        });

        this.testCase({
            name: "StatsBeat: countException method tracks exceptions",
            useFakeTimers: true,
            test: () => {
                // Initialize StatsBeat
                this._statsbeat.initialize(this._core, {
                    ikey: "Test-iKey",
                    endpoint: "https://example.endpoint.com",
                    version: "1.0.0"
                });
                
                // Count an exception
                this._statsbeat.countException("https://example.endpoint.com", "NetworkError");
                
                // Verify that trackStatsbeats is called when the timer fires
                this.clock.tick(STATS_COLLECTION_SHORT_INTERVAL + 1);
                
                // Verify that track was called
                Assert.ok(this._trackSpy.called, "track should be called when statsbeat timer fires");
                
                // Check that exception metrics are tracked
                let foundExceptionMetric = false;
                for (let i = 0; i < this._trackSpy.callCount; i++) {
                    const call = this._trackSpy.getCall(i);
                    const item: ITelemetryItem = call.args[0];
                    if (item.baseData && 
                        item.baseData.properties && 
                        item.baseData.properties.exceptionType === "NetworkError") {
                        foundExceptionMetric = true;
                        break;
                    }
                }
                
                Assert.ok(foundExceptionMetric, "Exception metrics should be tracked");
            }
        });

        this.testCase({
            name: "StatsBeat: does not send metrics for different endpoints",
            useFakeTimers: true,
            test: () => {
                // Initialize StatsBeat for a specific endpoint
                this._statsbeat.initialize(this._core, {
                    ikey: "Test-iKey",
                    endpoint: "https://example.endpoint.com",
                    version: "1.0.0"
                });
                
                // Create mock payload data
                const payloadData = {
                    urlString: "https://example.endpoint.com",
                    data: "testData",
                    headers: {},
                    timeout: 0,
                    disableXhrSync: false,
                    statsBeatData: {
                        startTime: Date.now()
                    }
                } as IPayloadData;
                
                // Set up spies to check internal calls
                const countSpy = this.sandbox.spy(this._statsbeat, "count");
                
                // Count metrics for a different endpoint
                this._statsbeat.count(200, payloadData, "https://different.endpoint.com");

                // Verify that trackStatsbeats is called when the timer fires
                this.clock.tick(STATS_COLLECTION_SHORT_INTERVAL + 1);
                // The count method was called, but it should return early
                Assert.equal(1, countSpy.callCount, "count method should be called");
                Assert.equal(0, this._trackSpy.callCount, "track should not be called for different endpoint");
            }
        });

        this.testCase({
            name: "StatsBeat: test dynamic configuration changes",
            useFakeTimers: true,
            test: () => {
                // Setup core with statsbeat enabled
                this._core.initialize(this._config, [new ChannelPlugin()]);
                
                // Verify that statsbeat is created
                const statsbeat = this._core.getStatsBeat();
                Assert.ok(statsbeat, "Statsbeat should be created");
                
                // Update configuration to disable statsbeat
                if (!this._core.config._sdk) {
                    this._core.config._sdk = {};
                }
                this._core.config._sdk.stats = false;
                this.clock.tick(1); // Allow time for config changes to propagate
                
                // Verify that statsbeat is removed
                const updatedStatsbeat = this._core.getStatsBeat();
                Assert.ok(!updatedStatsbeat, "Statsbeat should be removed when disabled");
                
                // Re-enable statsbeat
                this._core.config._sdk.stats = true;
                this.clock.tick(1); // Allow time for config changes to propagate
                
                // Verify that statsbeat is created again
                const reenabledStatsbeat = this._core.getStatsBeat();
                Assert.ok(reenabledStatsbeat, "Statsbeat should be recreated when re-enabled");
            }
        });
    }
}

class ChannelPlugin implements IPlugin {
    public isFlushInvoked = false;
    public isTearDownInvoked = false;
    public isResumeInvoked = false;
    public isPauseInvoked = false;

    public identifier = "Sender";
    public priority: number = 1001;

    constructor() {
        this.processTelemetry = this._processTelemetry.bind(this);
    }
    
    public pause(): void {
        this.isPauseInvoked = true;
    }

    public resume(): void {
        this.isResumeInvoked = true;
    }

    public teardown(): void {
        this.isTearDownInvoked = true;
    }

    flush(async?: boolean, callBack?: () => void): void {
        this.isFlushInvoked = true;
        if (callBack) {
            callBack();
        }
    }

    public processTelemetry(env: ITelemetryItem) {}

    setNextPlugin(next: any) {
        // no next setup
    }

    public initialize = (config: IConfiguration, core: IAppInsightsCore, plugin: IPlugin[]) => {
    }

    private _processTelemetry(env: ITelemetryItem) {
    }
}

class CustomTestError extends Error {
    constructor(message = "") {
      super(message);
      this.name = "CustomTestError";
      this.message = message + " -- test error.";
    }
}