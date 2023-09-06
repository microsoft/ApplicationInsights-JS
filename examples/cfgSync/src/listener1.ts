import { ApplicationInsights, IConfiguration} from "@microsoft/applicationinsights-web";
import {CfgSyncPlugin, ICfgSyncConfig, ICfgSyncMode} from "@microsoft/applicationinsights-cfgsync-js"

export function initListenerInstance1() {
    let listenerCfgSyncPlugin1 = new CfgSyncPlugin();
    let listenerInstCfg1 = {
        instrumentationKey: "InstrumentationKey=balabala",
        disableInstrumentationKeyValidation: false,
        maxMessageLimit: 20,
        messageSwitch: {"disableIkeyDeprecationMessage": false},
        // featureOptIn: {disableInstrumentationKeyValidation: {mode: 3, cfgValue:false}},
        throttleMgrCfg: {
            limit: {
                samplingRate: 3,
                maxSendNumber: 1
            },
            interval: {
                monthInterval: 8,
                daysOfMonth: [1]
            }
        },
        extensionConfig:{
            [listenerCfgSyncPlugin1.identifier]: {
                syncMode: ICfgSyncMode.Receive,
                cfgUrl: "https://tstcdnstore.blob.core.windows.net/cdn/nevtest/ai.cfgsync.json",
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
    console.log("listenerInstCfg1", listenerInstCfg1);
    let listenerAppInsights1 = new ApplicationInsights({config: listenerInstCfg1});
    listenerAppInsights1.loadAppInsights();
    console.log("listener 1");
    console.log(listenerAppInsights1);
    return  listenerAppInsights1;
}