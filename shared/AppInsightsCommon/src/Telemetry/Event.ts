// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IDiagnosticLogger } from "@microsoft/applicationinsights-core-js";
import { EventData } from "../Interfaces/Contracts/Generated/EventData";
import { ISerializable } from "../Interfaces/Telemetry/ISerializable";
import { dataSanitizeString, dataSanitizeProperties, dataSanitizeMeasurements } from "./Common/DataSanitizer";
import { FieldType } from "../Enums";
import { strNotSpecified } from "../Constants";

export class Event extends EventData implements ISerializable {

    public static envelopeType = "Microsoft.ApplicationInsights.{0}.Event";
    public static dataType = "EventData";

    public aiDataContract = {
        ver: FieldType.Required,
        name: FieldType.Required,
        properties: FieldType.Default,
        measurements: FieldType.Default
    }

    /**
     * Constructs a new instance of the EventTelemetry object
     */
    constructor(logger: IDiagnosticLogger, name: string, properties?: any, measurements?: any) {

        super();

        this.name = dataSanitizeString(logger, name) || strNotSpecified;
        this.properties = dataSanitizeProperties(logger, properties);
        this.measurements = dataSanitizeMeasurements(logger, measurements);
    }
}
