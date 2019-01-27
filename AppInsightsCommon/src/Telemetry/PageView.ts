// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { PageViewData } from '../Interfaces/Contracts/Generated/PageViewData';
import { DataSanitizer } from './Common/DataSanitizer';
import { ISerializable } from '../Interfaces/Telemetry/ISerializable';
import { FieldType } from '../Enums';
import { Util } from '../Util';
import { IDiagnosticLogger } from '@microsoft/applicationinsights-core-js';

export class PageView extends PageViewData implements ISerializable {

    public static envelopeType = "Microsoft.ApplicationInsights.{0}.Pageview";
    public static dataType = "PageviewData";

    public aiDataContract = {
        ver: FieldType.Required,
        name: FieldType.Default,
        url: FieldType.Default,
        duration: FieldType.Default,
        properties: FieldType.Default,
        measurements: FieldType.Default,
        id: FieldType.Default
    }

    /**
     * Constructs a new instance of the PageEventTelemetry object
     */
    constructor(logger: IDiagnosticLogger, name?: string, url?: string, durationMs?: number, properties?: {[key: string]: string}, measurements?: {[key: string]: number}, id?: string) {
        super();

        this.id = DataSanitizer.sanitizeId(logger, id);
        this.url = DataSanitizer.sanitizeUrl(logger, url);
        this.name = DataSanitizer.sanitizeString(logger, name) || Util.NotSpecified;
        if (!isNaN(durationMs)) {
            this.duration = Util.msToTimeSpan(durationMs);
        }
        this.properties = DataSanitizer.sanitizeProperties(logger, properties);
        this.measurements = DataSanitizer.sanitizeMeasurements(logger, measurements);
    }
}
