import { DistributedTracingModes, IConfig } from '@microsoft/applicationinsights-core-js';
import { ApplicationInsightsTests } from './applicationinsights.e2e.tests';
import { IConfiguration } from '@microsoft/applicationinsights-core-js';

const _instrumentationKey = 'b7170927-2d1c-44f1-acec-59f4e1751c11';
const _connectionString = `InstrumentationKey=${_instrumentationKey}`;

export class ApplicationInsightsFetchTests extends ApplicationInsightsTests {

    constructor() {
        super("ApplicationInsightsFetchTests-XHR Disabled");
    }
    
    protected _getTestConfig(sessionPrefix: string) {
        let config: IConfiguration & IConfig = {
            connectionString: _connectionString,
            disableAjaxTracking: false,
            disableFetchTracking: false,
            disableXhr: true,               // Disable XHR support
            enableRequestHeaderTracking: true,
            enableResponseHeaderTracking: true,
            maxBatchInterval: 500,
            disableExceptionTracking: false,
            namePrefix: sessionPrefix,
            enableCorsCorrelation: true,
            distributedTracingMode: DistributedTracingModes.AI_AND_W3C,
            samplingPercentage: 50,
            convertUndefined: "test-value",
            disablePageUnloadEvents: [ "beforeunload" ],
            extensionConfig: {
                ["AppInsightsCfgSyncPlugin"]: {
                    cfgUrl: ""
                }
            }
        };

        return config;
    }

    public testInitialize() {
        super.testInitialize();

        // Use the fake server for fetch tests as multiple test runs are causing timeout issues
        // this.useFakeServer = true;
        // this.fakeServerAutoRespond = true;
        this.useFakeFetch = true;
        this.fakeFetchAutoRespond = true;
    }
}
