import { DistributedTracingModes } from '@microsoft/applicationinsights-common';
import { ApplicationInsightsTests } from './applicationinsights.e2e.tests';

const _instrumentationKey = 'b7170927-2d1c-44f1-acec-59f4e1751c11';
const _connectionString = `InstrumentationKey=${_instrumentationKey}`;

export class ApplicationInsightsFetchTests extends ApplicationInsightsTests {

    constructor() {
        super("ApplicationInsightsFetchTests-XHR Disabled");
    }
    
    protected _getTestConfig(sessionPrefix: string) {
        return {
            connectionString: _connectionString,
            disableAjaxTracking: false,
            disableFetchTracking: false,
            disableXhr: true,               // Disable XHR support
            enableRequestHeaderTracking: true,
            enableResponseHeaderTracking: true,
            maxBatchInterval: 2500,
            disableExceptionTracking: false,
            namePrefix: sessionPrefix,
            enableCorsCorrelation: true,
            distributedTracingMode: DistributedTracingModes.AI_AND_W3C,
            samplingPercentage: 50,
            convertUndefined: "test-value"
        };
    }
}
