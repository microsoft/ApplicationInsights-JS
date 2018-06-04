/// <reference path="../TestFramework/Common.ts" />
/// <reference path="../../JavaScriptSDK/AppInsightsCore.ts" />
/// <reference path="../../applicationinsights-core.ts" />

import { IAppInsightsCore, IConfiguration, ITelemetryPlugin, IChannelControls, ITelemetryItem, MinChannelPriorty } from "../../applicationinsights-core"
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
            name: "ApplicationInsightsCore: Validates input",
            test: () => {

                let telemetryPlugin = new TestSamplingPlugin();
                                
                let appInsightsCore: AppInsightsCore;
                appInsightsCore = new AppInsightsCore();
                try {                    
                    appInsightsCore.initialize(null, [telemetryPlugin]);
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

                Assert.ok(false);
            }
        });
    }
}

class TestSamplingPlugin implements ITelemetryPlugin {
    public processTelemetry: (env: ITelemetryItem) => void;
    public start: (config: IConfiguration) => void;
    public identifier: string = "AzureSamplingPlugin";
    public setNextPlugin: (next: ITelemetryPlugin) => void;
    public priority: number = 5;
    private samplingPercentage;
    private nexttPlugin: ITelemetryPlugin;


    constructor() {
        this.processTelemetry = this._processTelemetry.bind(this);
        this.start = this._start.bind(this);
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
        if (!config || !config.extensions[this.identifier]) {
            throw Error("required configuration missing");            
        }

        let pluginConfig = config.extensions[this.identifier];
        this.samplingPercentage = pluginConfig.samplingPercentage;
    }

    private _setNextPlugin(next: ITelemetryPlugin) : void {
        this.nexttPlugin = next;
    }
}

new ApplicationInsightsCoreTests().registerTests();