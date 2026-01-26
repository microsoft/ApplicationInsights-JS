import { AITestClass, Assert, PollingAssert } from "@microsoft/ai-test-framework";
import { ITelemetryItem, newId } from "@microsoft/otel-core-js";
import { ApplicationInsights} from "../../../src/index";
import { BreezeChannelIdentifier, ContextTagKeys, utlRemoveSessionStorage } from "@microsoft/otel-core-js";
import { Sender } from "@microsoft/applicationinsights-channel-js";

export class ApplicationInsightsConfigTests extends AITestClass {
    private readonly _instrumentationKey = "b7170927-2d1c-44f1-acec-59f4e1751c11";
    private readonly _endpoint = "endpoint"
    private readonly _connectionString = `InstrumentationKey=${this._instrumentationKey};ingestionendpoint=${this._endpoint}`;
    private readonly _iKey = "testKey";
    private _sessionPrefix: string = newId();
    static registerTests: any;
    private static readonly _expectedTrackMethods = [
        "flush",
        "pollInternalLogs",
        "stopPollingInternalLogs",
        "unload",
        "getPlugin",
        "addPlugin",
        "evtNamespace",
        "addUnloadCb",
        "onCfgChange",
        "getTraceCtx",
        "updateCfg",
        "addTelemetryInitializer"
    ];

    constructor(testName?: string) {
        super(testName || "ApplicationInsightsAISKULightTests");
    }
    
    protected _getTestConfig(sessionPrefix: string, ikey?: boolean, cs?: boolean) {
        return {
            instrumentationKey: ikey? this._iKey : undefined,
            connectionString: cs? this._connectionString : undefined,
            namePrefix: sessionPrefix
        };
    }

    public testInitialize() {
        super.testInitialize();
    }

    public testCleanup() {
        utlRemoveSessionStorage(null as any, "AI_sentBuffer", );
        utlRemoveSessionStorage(null as any, "AI_buffer", );
        utlRemoveSessionStorage(null as any, this._sessionPrefix + "_AI_sentBuffer", );
        utlRemoveSessionStorage(null as any, this._sessionPrefix + "_AI_buffer", );

        super.testCleanup();
    }

    public testFinishedCleanup(): void {
        console.log("* testCleanup(" + (AITestClass.currentTestInfo ? AITestClass.currentTestInfo.name : "<null>") + ")");
    }

    public registerTests() {
        this.addConfigTests();
        this.addApiTests();
    }

    private addConfigTests(): void {
        this.testCase({
            name: "ConfigTests: ApplicationInsights config should set default endpoint",
            test: () => {
                let expectedConnectionString = `InstrumentationKey=${this._instrumentationKey}`
                let _config = {
                    connectionString: expectedConnectionString,
                    namePrefix:this._sessionPrefix
                };
                Assert.ok(_config)
                let ai = new ApplicationInsights(_config);
                this.onDone(() =>{
                    ai.unload(false);
                });
                Assert.ok(ai, "ApplicationInsights light Instance is initialized");
            
                let config = ai.config;
                let expectedIkey = this._instrumentationKey;
                let expectedEndpointUrl = "https://dc.services.visualstudio.com/v2/track";
                let expectedLoggingLevel = 10000;
                Assert.ok(config, "ApplicationInsights Light config exists");
                Assert.equal(expectedConnectionString, config.connectionString, "connection string is set");
                Assert.equal(expectedIkey, config.instrumentationKey, "ikey is set");
                Assert.equal(expectedLoggingLevel, config.diagnosticLogInterval, "diagnosticLogInterval is set to 1000 by default");
                Assert.equal(expectedEndpointUrl, config.endpointUrl, "endpoint url is set from connection string");
            }
        });

        this.testCase({
            name: "ConfigTests: ApplicationInsights config works correctly with connection string",
            test: () => {
                let _config = this._getTestConfig(this._sessionPrefix, false, true);
                Assert.ok(_config)
                let ai = new ApplicationInsights(_config);
                this.onDone(() =>{
                    ai.unload(false);
                });
                Assert.ok(ai, "ApplicationInsights light Instance is initialized");
            
                let config = ai.config;
                let expectedIkey = this._instrumentationKey;
                let expectedConnectionString = this._connectionString;
                let expectedEndpointUrl = `${this._endpoint}/v2/track`;
                let expectedLoggingLevel = 10000;
                Assert.ok(config, "ApplicationInsights Light config exists");
                Assert.equal(expectedConnectionString, config.connectionString, "connection string is set");
                Assert.equal(expectedIkey, config.instrumentationKey, "ikey is set");
                Assert.equal(expectedLoggingLevel, config.diagnosticLogInterval, "diagnosticLogInterval is set to 1000 by default");
                Assert.equal(expectedEndpointUrl, config.endpointUrl, "endpoint url is set from connection string");
            }
        });

        this.testCase({
            name: "ConfigTests: ApplicationInsights config works correctly with connection string and Ikey",
            useFakeTimers: true,
            test: () => {
                let _config = this._getTestConfig(this._sessionPrefix, true, true);
                Assert.ok(_config)
                let ai = new ApplicationInsights(_config);
                this.onDone(() =>{
                    ai.unload(false);
                });
                Assert.ok(ai, "ApplicationInsights light Instance is initialized");
                Assert.ok(ai);
                let config = ai.config;
                let expectedIkey = this._instrumentationKey;
                let expectedConnectionString = this._connectionString;
                let expectedEndpointUrl = `${this._endpoint}/v2/track`;
                let expectedLoggingLevel = 10000;
                Assert.ok(config, "ApplicationInsights Light config exists");
                Assert.equal(expectedConnectionString, config.connectionString, "connection string is set");
                Assert.equal(expectedIkey, config.instrumentationKey, "ikey is set from connection string");
                Assert.equal(expectedLoggingLevel, config.diagnosticLogInterval, "diagnosticLogInterval is set to 1000 by default");
                Assert.equal(expectedEndpointUrl, config.endpointUrl, "endpoint url is set from connection string");
            }
        });

        this.testCase({
            name: "ConfigTests: ApplicationInsights config works correctly with ikey",
            useFakeTimers: true,
            test: () => {
                let _config = this._getTestConfig(this._sessionPrefix, true, false);
                Assert.ok(_config)
                let ai = new ApplicationInsights(_config);
                this.onDone(() =>{
                    ai.unload(false);
                });
                Assert.ok(ai, "ApplicationInsights light Instance is initialized");
                Assert.ok(ai);
                let config = ai.config;
                let expectedIkey = this._iKey;
                let expectedLoggingLevel = 10000;
                Assert.ok(config, "ApplicationInsights Light config exists");
                Assert.ok(!config.connectionString, "connection string shoud not set");
                Assert.equal(expectedIkey, config.instrumentationKey, "ikey is set");
                Assert.equal(expectedLoggingLevel, config.diagnosticLogInterval, "diagnosticLogInterval is set to 1000 by default");
                Assert.ok(!config.endpointUrl, "endpoint url should not set from ikey");
            }
        });

        this.testCase({
            name: "ConfigTests: ApplicationInsights sholuld throw error when no ikey and connection string provided",
            useFakeTimers: true,
            test: () => {
                try {
                    let _config = this._getTestConfig(this._sessionPrefix, false, false);
                    Assert.ok(_config)
                    let ai = new ApplicationInsights(_config);
                    this.onDone(() =>{
                        ai.unload(false);
                    });
                    Assert.ok(false, "ApplicationInsights light Instance should not be initialized");
                    Assert.ok(ai);
                } catch(e) {
                    Assert.ok(true, "error should be thrown");
                }
            }
        });
    }

    public addApiTests(): void {
        this.testCase({
            name: "DynamicConfigTests: Public Members exist",
            test: () => {
                let _config = this._getTestConfig(this._sessionPrefix, true, false);
                Assert.ok(_config)
                let ai = new ApplicationInsights(_config);
                this.onDone(() =>{
                    ai.unload(false);
                });
                Assert.ok(ai, "ApplicationInsights light Instance is initialized");
                let trackMethod = "track";
                let flushMethod = "flush";
                Assert.ok(ai[trackMethod], `${trackMethod} method exists`);
                Assert.equal("function", typeof ai["track"], `${trackMethod} is a function`);
                Assert.ok(ai[flushMethod], `${flushMethod} method exists`);
                Assert.equal("function", typeof ai[flushMethod], `${flushMethod} is a function`);
            }
        });

        
        this.testCase({
            name: 'Proxy function exist',
            test: () => {
                this.onDone(() =>{
                    ai.unload(false);
                });
                let _config = this._getTestConfig(this._sessionPrefix, true, false);
                let ai = new ApplicationInsights(_config);
                ApplicationInsightsConfigTests._expectedTrackMethods.forEach(method => {
                    Assert.ok(ai[method], `${method} exists`);
                    Assert.equal('function', typeof ai[method], `${method} is a function`);
                });
            }
        });


        this.testCase({
            name: "TrackTests: BaseData and baseType should exist",
            test: () => {
                let _config = this._getTestConfig(this._sessionPrefix, true, false);
                Assert.ok(_config)
                let ai = new ApplicationInsights(_config);
                this.onDone(() =>{
                    ai.unload(false);
                });
                Assert.ok(ai, "ApplicationInsights light Instance is initialized");
                let trackMethod = "track";
            
                Assert.ok(ai[trackMethod], `${trackMethod} method exists`);
                Assert.equal("function", typeof ai["track"], `${trackMethod} is a function`);

                let sender: Sender = ai.getPlugin<Sender>(BreezeChannelIdentifier).plugin;
                Assert.ok(sender && sender.processTelemetry, "sender exists");
                let senderSpy = this.sandbox.spy(sender, "processTelemetry");
               
                // Case1: no baseData and no baseType
                ai.track({name: "test"});
                Assert.ok(senderSpy.calledOnce, "sender should be called");
                let item = senderSpy.args[0][0];
                Assert.equal(item.name, "test", "name exists");
                Assert.deepEqual(item.baseData, {}, "baseData exists");
                Assert.equal(item.baseType, "EventData", "baseType exists");

                // Case2: baseData and no baseType
                ai.track({name: "test1", baseData:{a: "test1"}});
                Assert.equal(senderSpy.callCount, 2, "sender should be called again test1");
                item = senderSpy.args[1][0];
                Assert.equal(item.name, "test1", "name exists test1");
                Assert.deepEqual(item.baseData, {a: "test1"}, "baseData exists test1");
                Assert.equal(item.baseType, "EventData", "baseType existstest1");

                // Case3: baseData and baseType
                ai.track({name: "test2", baseData:{a: "test2"}, baseType: "test2"});
                Assert.equal(senderSpy.callCount, 3, "sender should be called again test2");
                item = senderSpy.args[2][0];
                Assert.equal(item.name, "test2", "name exists test2");
                Assert.deepEqual(item.baseData, {a: "test2"}, "baseData exists test2");
                Assert.equal(item.baseType, "test2", "baseType exists test2");

            }
        });

        this.testCase({
            name: 'Proxy function exist',
            test: () => {
                this.onDone(() =>{
                    ai.unload(false);
                });
                let _config = this._getTestConfig(this._sessionPrefix, true, false);
                let ai = new ApplicationInsights(_config);
                ApplicationInsightsConfigTests._expectedTrackMethods.forEach(method => {
                    Assert.ok(ai[method], `${method} exists`);
                    Assert.equal('function', typeof ai[method], `${method} is a function`);
                });
            }
        });

        this.testCase({
            name: 'test proxy function (telemetry initializer) works',
            useFakeTimers: true,
            test: () => {
                this.onDone(() =>{
                    ai.unload(false);
                });
                let _config = this._getTestConfig(this._sessionPrefix, true, false);
                let ai = new ApplicationInsights(_config);
                const telemetryInitializer = {
                    initializer: (envelope) => { }
                }
                const spy = this.sandbox.spy(telemetryInitializer, "initializer");
                // act
                ai.addTelemetryInitializer(telemetryInitializer.initializer);
                ai.track({name: 'test event'});
                this.clock.tick(1);

                 // verify
                 Assert.ok(spy.calledOnce, 'telemetryInitializer was called');
            }
        });
    }

}