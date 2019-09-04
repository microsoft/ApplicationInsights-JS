// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { PageViewPerfData } from '../Interfaces/Contracts/Generated/PageViewPerfData';
import { FieldType } from '../Enums';
import { ISerializable } from '../Interfaces/Telemetry/ISerializable';
import { DataSanitizer } from './Common/DataSanitizer';
import { Util } from '../Util';
import { IDiagnosticLogger, _InternalMessageId, LoggingSeverity } from '@microsoft/applicationinsights-core-js';
import { IPageViewPerformanceTelemetry } from '../Interfaces/IPageViewPerformanceTelemetry';


export class PageViewPerformance extends PageViewPerfData implements ISerializable {

    public static envelopeType = "Microsoft.ApplicationInsights.{0}.PageviewPerformance";
    public static dataType = "PageviewPerformanceData";

    public aiDataContract = {
        ver: FieldType.Required,
        name: FieldType.Default,
        url: FieldType.Default,
        duration: FieldType.Default,
        perfTotal: FieldType.Default,
        networkConnect: FieldType.Default,
        sentRequest: FieldType.Default,
        receivedResponse: FieldType.Default,
        domProcessing: FieldType.Default,
        properties: FieldType.Default,
        measurements: FieldType.Default
    };

    /**
     * Constructs a new instance of the PageEventTelemetry object
     */
    constructor(logger: IDiagnosticLogger, name: string, url: string, unused: number, properties?: { [key: string]: string }, measurements?: { [key: string]: number }, cs4BaseData?: IPageViewPerformanceTelemetry) {
        super();
        this.url = DataSanitizer.sanitizeUrl(logger, url);
        this.name = DataSanitizer.sanitizeString(logger, name) || Util.NotSpecified;

        this.properties = DataSanitizer.sanitizeProperties(logger, properties);
        this.measurements = DataSanitizer.sanitizeMeasurements(logger, measurements);

        if (cs4BaseData) {
            this.domProcessing = cs4BaseData.domProcessing;
            this.duration = cs4BaseData.duration
            this.networkConnect = cs4BaseData.networkConnect;
            this.perfTotal = cs4BaseData.perfTotal;
            this.receivedResponse = cs4BaseData.receivedResponse;
            this.sentRequest = cs4BaseData.sentRequest;
        }
    }
}
