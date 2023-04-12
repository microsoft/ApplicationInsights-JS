import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import { newId } from "@microsoft/applicationinsights-core-js";
import { ApplicationInsights} from "../../../src/index";
import { utlRemoveSessionStorage } from "@microsoft/applicationinsights-common";

export class ApplicationInsightsConfigTests extends AITestClass {
    private readonly _instrumentationKey = "b7170927-2d1c-44f1-acec-59f4e1751c11";
    private readonly _endpoint = "endpoint"
    private readonly _connectionString = `InstrumentationKey=${this._instrumentationKey};ingestionendpoint=${this._endpoint}`;
    private readonly _iKey = "testKey";
    private _sessionPrefix: string = newId();
    static registerTests: any;

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
    }

}