module Microsoft.ApplicationInsights.Core {

    "use strict";

    export interface ITelemetryItem {
        name: string;
        timestamp: Date;
        baseType : string;
        iKey: string;
        sytemProperties?: { [key: string]: any };
        domainProperties?: { [key: string]: any };
        customProperties?: { [key: string]: any };
    }
}