/// <reference path="../TestFramework/Common.ts" />
/// <reference path="../../JavaScriptSDK/AppInsightsCore.ts" />
/// <reference path="../../applicationinsights-core-js.ts" />

import { IConfiguration, ITelemetryPlugin, ITelemetryItem } from "../../applicationinsights-core-js"
import { AppInsightsCore } from "../../JavaScriptSDK/AppInsightsCore";

export class ApplicationInsightsCoreTests extends TestClass {

    public testInitialize() {
        super.testInitialize();
    }

    public testCleanup() {
        super.testCleanup();
    }

    public registerTests() {

        this.testCase({
            name: "ApplicationInsightsCore: Initialization validates input",
            test: () => {

                let samplingPlugin = new TestSamplingPlugin();
                                
                let appInsightsCore = new AppInsightsCore();
                try {                    
                    appInsightsCore.initialize(null, [samplingPlugin]);
                } catch (error) {
                    Assert.ok(true, "Validates configuration");                    
                }

                let config2 : IConfiguration = {
                        endpointUrl: "https://dc.services.visualstudio.com/v2/track",
                        instrumentationKey: "40ed4f60-2a2f-4f94-a617-22b20a520864",
                        extensions: {}
                };

                try {                    
                    appInsightsCore.initialize(config2, null);
                } catch (error) {
                    Assert.ok(true, "Validates extensions are provided");                    
                }
            }
        });

        this.testCase({
            name: "ApplicationInsightsCore: Initialization initializes setNextPlugin",
            test: () => {
                let samplingPlugin = new TestSamplingPlugin();
                samplingPlugin.priority = 20;

                let channelPlugin = new TestSamplingPlugin();
                channelPlugin.priority = 120;
                // Assert prior to initialize
                Assert.ok(!samplingPlugin.nexttPlugin, "Not setup prior to pipeline initialization");

                let appInsightsCore = new AppInsightsCore();
                appInsightsCore.initialize(
                    {instrumentationKey: "09465199-12AA-4124-817F-544738CC7C41"}, 
                    [samplingPlugin, channelPlugin]);
                Assert.ok(!!samplingPlugin.nexttPlugin, "Not setup prior to pipeline initialization");
            }
        });
    }
}

class TestSamplingPlugin implements ITelemetryPlugin {
    public processTelemetry: (env: ITelemetryItem) => void;
    public initialize: (config: IConfiguration) => void;
    public identifier: string = "AzureSamplingPlugin";
    public setNextPlugin: (next: ITelemetryPlugin) => void;
    public priority: number = 5;
    private samplingPercentage;
    public nexttPlugin: ITelemetryPlugin;


    constructor() {
        this.processTelemetry = this._processTelemetry.bind(this);
        this.initialize = this._start.bind(this);
        this.setNextPlugin = this._setNextPlugin.bind(this);
    }

    private _processTelemetry(env: ITelemetryItem) {
        if (!env) {
            throw Error("Invalid telemetry object");
        }

        if (!env.domainProperties) {
            throw Error("Need domain properties specified");
        }
    }

    private _start(config: IConfiguration) {
        if (!config) {
            throw Error("required configuration missing");            
        }

        let pluginConfig = config.extensions ? config.extensions[this.identifier] : null;
        this.samplingPercentage = pluginConfig? pluginConfig.samplingPercentage : 100;
    }

    private _setNextPlugin(next: ITelemetryPlugin) : void {
        this.nexttPlugin = next;
    }
}