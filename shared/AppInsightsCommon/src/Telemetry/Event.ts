// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IDiagnosticLogger } from "@microsoft/applicationinsights-core-js";
import { strNotSpecified } from "../Constants";
import { FieldType } from "../Enums";
import { IEventData } from "../Interfaces/Contracts/IEventData";
import { ISerializable } from "../Interfaces/Telemetry/ISerializable";
import { dataSanitizeMeasurements, dataSanitizeProperties, dataSanitizeString } from "./Common/DataSanitizer";

export class Event implements IEventData, ISerializable {
    public static envelopeType = "Microsoft.ApplicationInsights.{0}.Event";
    public static dataType = "EventData";

    public aiDataContract = {
        ver: FieldType.Required,
        name: FieldType.Required,
        properties: FieldType.Default,
        measurements: FieldType.Default
    };

    /**
     * Schema version
     */
    public ver: number; /* 2 */

    /**
     * Event name. Keep it low cardinality to allow proper grouping and useful metrics.
     */
    public name: string;

    /**
     * Collection of custom properties.
     */
    public properties: any; /* {} */

    /**
     * Collection of custom measurements.
     */
    public measurements: any; /* {} */

    /**
     * Constructs a new instance of the EventTelemetry object
     */
    constructor(logger: IDiagnosticLogger, name: string, properties?: any, measurements?: any) {
        let _self = this;
        _self.ver = 2;
        _self.name = dataSanitizeString(logger, name) || strNotSpecified;
        _self.properties = dataSanitizeProperties(logger, properties);
        _self.measurements = dataSanitizeMeasurements(logger, measurements);
    }
}
