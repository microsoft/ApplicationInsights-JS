import { ApplicationInsights, IConfiguration} from "@microsoft/applicationinsights-web";
import {CfgSyncPlugin, ICfgSyncConfig, ICfgSyncMode} from "@microsoft/applicationinsights-cfgsync-js"

export function initListenerInstance1() {
    let listenerCfgSyncPlugin1 = new CfgSyncPlugin();
    let listenerInstCfg1 = {
        connectionString: "InstrumentationKey=listener1",
        disableInstrumentationKeyValidation: true,
        extensionConfig:{
            [listenerCfgSyncPlugin1.identifier]: {
                syncMode: ICfgSyncMode.Receive,
                nonOverrideConfigs: {
                    connectionString: true,
                    instrumentationKey: true,
                    endpointUrl: true,
                    extensionConfig: {
                        ["ApplicationInsightsAnalytics"]: {
                            accountId: true
                        }
                    }
                }
            } as ICfgSyncConfig
        },
        extensions:[listenerCfgSyncPlugin1]
    } as IConfiguration;
    let listenerAppInsights1 = new ApplicationInsights({config: listenerInstCfg1});
    listenerAppInsights1.loadAppInsights();
    console.log("listener 1");
    console.log(listenerAppInsights1);
    return  [listenerAppInsights1, listenerCfgSyncPlugin1];
}