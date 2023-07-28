import { ApplicationInsights, IConfiguration} from "@microsoft/applicationinsights-web";
import {CfgSyncPlugin, ICfgSyncConfig, ICfgSyncMode} from "@microsoft/applicationinsights-cfgsync-js"

export function initListenerInstance2() {
    let listenerCfgSyncPlugin2 = new CfgSyncPlugin();
    let listenerInstCfg2 = {
        connectionString: "InstrumentationKey=listener2",
        disableInstrumentationKeyValidation: true,
        extensionConfig:{
            [listenerCfgSyncPlugin2.identifier]: {
                syncMode: ICfgSyncMode.Receive,
                nonOverrideConfigs: {
                    connectionString: true,
                    instrumentationKey: true,
                    endpointUrl: true,
                    extensionConfig: {
                        ["ApplicationInsightsAnalytics"]: {
                            excludeRequestFromAutoTrackingPatterns: true,
                            bufferOverride: true
                        }
                    }
                }
            } as ICfgSyncConfig
        },
        extensions:[listenerCfgSyncPlugin2]
    } as IConfiguration;
    let listenerAppInsights2 = new ApplicationInsights({config: listenerInstCfg2});
    listenerAppInsights2.loadAppInsights();
    console.log("listener 2");
    console.log(listenerAppInsights2);
    return  [listenerAppInsights2, listenerCfgSyncPlugin2];
}