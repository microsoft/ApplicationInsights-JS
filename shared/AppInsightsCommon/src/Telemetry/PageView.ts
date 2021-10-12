// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { PageViewData } from "../Interfaces/Contracts/Generated/PageViewData";
import { dataSanitizeId, dataSanitizeMeasurements, dataSanitizeProperties, dataSanitizeString, dataSanitizeUrl } from "./Common/DataSanitizer";
import { ISerializable } from "../Interfaces/Telemetry/ISerializable";
import { FieldType } from "../Enums";
import { IDiagnosticLogger } from "@microsoft/applicationinsights-core-js";
import { msToTimeSpan } from "../HelperFuncs";
import { strNotSpecified } from "../Constants";

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

        this.id = dataSanitizeId(logger, id);
        this.url = dataSanitizeUrl(logger, url);
        this.name = dataSanitizeString(logger, name) || strNotSpecified;
        if (!isNaN(durationMs)) {
            this.duration = msToTimeSpan(durationMs);
        }
        this.properties = dataSanitizeProperties(logger, properties);
        this.measurements = dataSanitizeMeasurements(logger, measurements);
    }
}
