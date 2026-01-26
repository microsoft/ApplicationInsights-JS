// import * as sinon from "sinon";
// import { Assert, AITestClass } from "@microsoft/ai-test-framework";
// import { IPayloadData } from "../../../../../src/JavaScriptSDK.Interfaces/IXHROverride";
// import { IStatsMgr } from "../../../../../src/JavaScriptSDK.Interfaces/IStatsMgr";
// import { AppInsightsCore } from "../../../../../src/core/AppInsightsCore";
// import { IConfiguration } from "../../../../../src/JavaScriptSDK.Interfaces/IConfiguration";
// import { createStatsMgr } from "../../../../../src/core/StatsBeat";
// import { IStatsBeatState } from "../../../../../src/JavaScriptSDK.Interfaces/IStatsBeat";
// import { eStatsType } from "../../../../../src/JavaScriptSDK.Enums/StatsType";
// import { ITelemetryItem } from "../../../../../src/JavaScriptSDK.Interfaces/ITelemetryItem";
// import { IPlugin } from "../../../../../src/JavaScriptSDK.Interfaces/ITelemetryPlugin";
// import { IAppInsightsCore } from "../../../../../src/JavaScriptSDK.Interfaces/IAppInsightsCore";
// import { FeatureOptInMode } from "../../../../../src/JavaScriptSDK.Enums/FeatureOptInEnums";

// const STATS_COLLECTION_SHORT_INTERVAL: number = 900; // 15 minutes

// export class StatsBeatTests extends AITestClass {
//     private _core: AppInsightsCore;
//     private _config: IConfiguration;
//     private _statsMgr: IStatsMgr;
//     private _trackSpy: sinon.SinonSpy;

//     constructor(emulateIe: boolean) {
//         super("StatsBeatTests", emulateIe);
//     }
        
//     public testInitialize() {
//         let _self = this;
//         super.testInitialize();
        
//         _self._config = {
//             instrumentationKey: "Test-iKey",
//             disableInstrumentationKeyValidation: true,
//             _sdk: {
//                 stats: {
//                     shrtInt: STATS_COLLECTION_SHORT_INTERVAL,
//                     endCfg: [
//                         { 
//                             type: 0,
//                             keyMap: [
//                                 {
//                                     key: "stats-key1",
//                                     match: [ "https://example.endpoint.com" ]
//                                 }
//                             ]
//                         }
//                     ]
//                 }
//             }
//         };
        
//         _self._statsMgr = createStatsMgr();
//         _self._core = new AppInsightsCore();
//         // _self._statsMgr.init(_self._core, {
//         //     feature: "StatsBeat",
//         //     getCfg: (core, cfg) => {
//         //         return cfg?._sdk?.stats;
//         //     }
//         // });

//         // Create spy for tracking telemetry
//         _self._trackSpy = this.sandbox.spy(_self._core, "track");
//     }

//     public testCleanup() {
//         super.testCleanup();
//         this._core = null as any;
//         this._statsMgr = null as any;
//     }

//     public registerTests() {
                
//         this.testCase({
//             name: "StatsBeat: Initialization",
//             test: () => {
//                 // Test with no initialization
//                 Assert.equal(false, this._statsMgr.enabled, "StatsBeat should not be initialized by default");

//                 let statsBeatState: IStatsBeatState = {
//                     cKey: "Test-iKey",
//                     endpoint: "https://example.endpoint.com",
//                     sdkVer: "1.0.0",
//                     type: eStatsType.SDK
//                 };
//                 Assert.equal(null, this._statsMgr.newInst(statsBeatState), "StatsBeat should not be created before initialization");
                
//                 // Initialize
//                 this._statsMgr.init(this._core, {
//                     feature: "StatsBeat",
//                     getCfg: (core, cfg) => {
//                         return cfg?._sdk?.stats;
//                     }
//                 });
//                 Assert.equal(true, this._statsMgr.enabled, "StatsBeat should be initialized after initialization");
                
//                 let newInst = this._statsMgr.newInst(statsBeatState);
//                 Assert.ok(!!newInst, "StatsBeat should be created after initialization");
//                 Assert.equal(true, newInst.enabled, "StatsBeat should be enabled after initialization");
//                 Assert.equal("https://example.endpoint.com", newInst.endpoint);
//                 Assert.equal(0, newInst.type);
//             }
//         });
                
//         this.testCase({
//             name: "StatsBeat: count method tracks request metrics",
//             useFakeTimers: true,
//             test: () => {
//                 // Initialize StatsBeat
//                 this._statsMgr.init(this._core, {
//                     feature: "StatsBeat",
//                     getCfg: (core, cfg) => {
//                         return cfg?._sdk?.stats;
//                     }
//                 });
                
//                 // Create mock payload data with timing information
//                 const payloadData = {
//                     urlString: "https://example.endpoint.com",
//                     data: "testData",
//                     headers: {},
//                     timeout: 0,
//                     disableXhrSync: false,
//                     statsBeatData: {
//                         startTime: "2023-10-01T00:00:00Z" // Simulated start time
//                     }
//                 } as IPayloadData;
                
//                 let statsBeatState: IStatsBeatState = {
//                     cKey: "Test-iKey",
//                     endpoint: "https://example.endpoint.com",
//                     sdkVer: "1.0.0",
//                     type: eStatsType.SDK
//                 };                
//                 let statsBeat = this._statsMgr.newInst(statsBeatState);
                
//                 // Test successful request
//                 statsBeat.count(200, payloadData, "https://example.endpoint.com");
                
//                 // Test failed request
//                 statsBeat.count(500, payloadData, "https://example.endpoint.com");

//                 // Test throttled request
//                 statsBeat.count(429, payloadData, "https://example.endpoint.com");
                
//                 // Verify that trackStatsbeats is called when the timer fires
//                 this.clock.tick(STATS_COLLECTION_SHORT_INTERVAL + 1);
                
//                 // Verify that track was called
//                 Assert.ok(this._trackSpy.called, "track should be called when statsbeat timer fires");
                
//                 // When the timer fires, multiple metrics should be sent
//                 Assert.ok(this._trackSpy.callCount >= 3, "Multiple metrics should be tracked");
//             }
//         });

//         this.testCase({
//             name: "StatsBeat: countException method tracks exceptions",
//             useFakeTimers: true,
//             test: () => {
//                 // Initialize StatsBeat
//                 this._statsMgr.init(this._core, {
//                     feature: "StatsBeat",
//                     getCfg: (core, cfg) => {
//                         return cfg?._sdk?.stats;
//                     }
//                 });                

//                 let statsBeatState: IStatsBeatState = {
//                     cKey: "Test-iKey",
//                     endpoint: "https://example.endpoint.com",
//                     sdkVer: "1.0.0",
//                     type: eStatsType.SDK
//                 };                
//                 let statsBeat = this._statsMgr.newInst(statsBeatState);                
                
//                 // Count an exception
//                 statsBeat.countException("https://example.endpoint.com", "NetworkError");
                
//                 // Verify that trackStatsbeats is called when the timer fires
//                 this.clock.tick(STATS_COLLECTION_SHORT_INTERVAL + 1);
                
//                 // Verify that track was called
//                 Assert.ok(this._trackSpy.called, "track should be called when statsbeat timer fires");
                
//                 // Check that exception metrics are tracked
//                 let foundExceptionMetric = false;
//                 for (let i = 0; i < this._trackSpy.callCount; i++) {
//                     const call = this._trackSpy.getCall(i);
//                     const item: ITelemetryItem = call.args[0];
//                     if (item.baseData && 
//                         item.baseData.properties && 
//                         item.baseData.properties.exceptionType === "NetworkError") {
//                         foundExceptionMetric = true;
//                         break;
//                     }
//                 }
                
//                 Assert.ok(foundExceptionMetric, "Exception metrics should be tracked");
//             }
//         });
                
//         this.testCase({
//             name: "StatsBeat: does not send metrics for different endpoints",
//             useFakeTimers: true,
//             test: () => {
//                 // Initialize StatsBeat for a specific endpoint
//                 this._statsMgr.init(this._core, {
//                     feature: "StatsBeat",
//                     getCfg: (core, cfg) => {
//                         return cfg?._sdk?.stats;
//                     }
//                 });
                
//                 // Create mock payload data
//                 const payloadData = {
//                     urlString: "https://example.endpoint.com",
//                     data: "testData",
//                     headers: {},
//                     timeout: 0,
//                     disableXhrSync: false,
//                     statsBeatData: {
//                         startTime: Date.now()
//                     }
//                 } as IPayloadData;

//                 let statsBeatState: IStatsBeatState = {
//                     cKey: "Test-iKey",
//                     endpoint: "https://example.endpoint.com",
//                     sdkVer: "1.0.0",
//                     type: eStatsType.SDK
//                 };                
//                 let statsBeat = this._statsMgr.newInst(statsBeatState);      
                
//                 // Set up spies to check internal calls
//                 const countSpy = this.sandbox.spy(statsBeat, "count");
                
//                 // Count metrics for a different endpoint
//                 statsBeat.count(200, payloadData, "https://different.endpoint.com");
                
//                 // Verify that trackStatsbeats is called when the timer fires
//                 this.clock.tick(STATS_COLLECTION_SHORT_INTERVAL + 1);
//                 // The count method was called, but it should return early
//                 Assert.equal(1, countSpy.callCount, "count method should be called");
//                 Assert.equal(0, this._trackSpy.callCount, "track should not be called for different endpoint");
//             }
//         });

//         this.testCase({
//             name: "StatsBeat: test dynamic configuration changes",
//             useFakeTimers: true,
//             test: () => {
//                 // Setup core with statsbeat enabled
//                 this._core.initialize(this._config, [new ChannelPlugin()]);
//                 // Initialize StatsBeat for a specific endpoint
//                 this._statsMgr.init(this._core, {
//                     feature: "StatsBeat",
//                     getCfg: (core, cfg) => {
//                         return cfg?._sdk?.stats;
//                     }
//                 });
//                 this._core.setStatsMgr(this._statsMgr);                

//                 let statsBeatState: IStatsBeatState = {
//                     cKey: "Test-iKey",
//                     endpoint: "https://example.endpoint.com",
//                     sdkVer: "1.0.0",
//                     type: eStatsType.SDK
//                 };   
                
//                 // Verify that statsbeat is created
//                 const statsbeat = this._core.getStatsBeat(statsBeatState);
//                 Assert.ok(!!statsbeat, "Statsbeat should be created");
                
//                 // Explicitly disable statsbeat
//                 this._core.config.featureOptIn["StatsBeat"].mode = FeatureOptInMode.disable;
//                 this.clock.tick(1); // Allow time for config changes to propagate
                
//                 // Verify that statsbeat is removed
//                 const updatedStatsbeat = this._core.getStatsBeat(statsBeatState);
//                 Assert.ok(!updatedStatsbeat, "Statsbeat should be removed when disabled");
                
//                 // Re-enable statsbeat
//                 this._core.config.featureOptIn["StatsBeat"].mode = FeatureOptInMode.enable;
//                 this.clock.tick(1); // Allow time for config changes to propagate
                
//                 // Verify that statsbeat is created again
//                 const reenabledStatsbeat = this._core.getStatsBeat(statsBeatState);
//                 Assert.ok(reenabledStatsbeat, "Statsbeat should be recreated when re-enabled");

//                 // Test that statsbeat is not created when disabled with undefined
//                 this._core.config.featureOptIn["StatsBeat"].mode = FeatureOptInMode.none;
//                 this.clock.tick(1); // Allow time for config changes to propagate
                
//                 // Verify that statsbeat is removed
//                 Assert.ok(!this._core.getStatsBeat(statsBeatState), "Statsbeat should be removed when disabled");

//                 // Re-enable statsbeat
//                 this._core.config.featureOptIn["StatsBeat"].mode = FeatureOptInMode.enable;
//                 this.clock.tick(1); // Allow time for config changes to propagate
                
//                 // Verify that statsbeat is created again
//                 Assert.ok(!!this._core.getStatsBeat(statsBeatState), "Statsbeat should be recreated when re-enabled");

//                 // Test that statsbeat is not created when disabled with null value
//                 this._core.config.featureOptIn["StatsBeat"].mode = null;
//                 this.clock.tick(1); // Allow time for config changes to propagate
                
//                 // Verify that statsbeat is removed
//                 Assert.ok(!this._core.getStatsBeat(statsBeatState), "Statsbeat should be removed when disabled");
//             }
//         });
//     }
// }

// class ChannelPlugin implements IPlugin {
//     public isFlushInvoked = false;
//     public isTearDownInvoked = false;
//     public isResumeInvoked = false;
//     public isPauseInvoked = false;

//     public identifier = "Sender";
//     public priority: number = 1001;

//     constructor() {
//         this.processTelemetry = this._processTelemetry.bind(this);
//     }
    
//     public pause(): void {
//         this.isPauseInvoked = true;
//     }

//     public resume(): void {
//         this.isResumeInvoked = true;
//     }

//     public teardown(): void {
//         this.isTearDownInvoked = true;
//     }

//     flush(async?: boolean, callBack?: () => void): void {
//         this.isFlushInvoked = true;
//         if (callBack) {
//             callBack();
//         }
//     }

//     public processTelemetry(env: ITelemetryItem) {}

//     setNextPlugin(next: any) {
//         // no next setup
//     }

//     public initialize = (config: IConfiguration, core: IAppInsightsCore, plugin: IPlugin[]) => {
//     }

//     private _processTelemetry(env: ITelemetryItem) {
//     }
// }

// class CustomTestError extends Error {
//     constructor(message = "") {
//       super(message);
//       this.name = "CustomTestError";
//       this.message = message + " -- test error.";
//     }
// }
