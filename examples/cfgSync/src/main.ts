import { ApplicationInsights, IConfig, IConfiguration, IDiagnosticLogger} from "@microsoft/applicationinsights-web";
import {CfgSyncPlugin, ICfgSyncConfig, ICfgSyncMode} from "@microsoft/applicationinsights-cfgsync-js";


export function initMainInstance() {
    let mainCfgSyncPlugin = new CfgSyncPlugin();
    let mainInstCfg = {
        instrumentationKey: "InstrumentationKey=main",
        disableInstrumentationKeyValidation: true,
        extensionConfig:{
            [mainCfgSyncPlugin.identifier]: {
                syncMode: ICfgSyncMode.Broadcast
            } as ICfgSyncConfig,
            ["ApplicationInsightsAnalytics"]: {
                emitLineDelimitedJson: false,
                accountId: "mainaccid",
                sessionRenewalMs: 1000000,
                excludeRequestFromAutoTrackingPatterns: ["excludeRequest1","excludeRequest2"],
                bufferOverride: {
                    getItem: (logger: IDiagnosticLogger, name: string) => {
                        return `${name}test`;
                    },
                    setItem: (logger: IDiagnosticLogger, name: string, data: string) => {
                        return name === "delete"
                    }
                }
            } as IConfig
        },
        extensions:[mainCfgSyncPlugin]
    } as IConfiguration;
    let mainAppInsights = new ApplicationInsights({config: mainInstCfg});
    mainAppInsights.loadAppInsights();
    console.log("main instance");
    console.log(mainAppInsights);
    return [mainAppInsights, mainCfgSyncPlugin];
}