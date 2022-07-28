// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IDiagnosticLogger } from "@microsoft/applicationinsights-core-js";
import { strNotSpecified } from "../Constants";
import { FieldType } from "../Enums";
import { IMessageData } from "../Interfaces/Contracts/IMessageData";
import { SeverityLevel } from "../Interfaces/Contracts/SeverityLevel";
import { ISerializable } from "../Interfaces/Telemetry/ISerializable";
import { dataSanitizeMeasurements, dataSanitizeMessage, dataSanitizeProperties } from "./Common/DataSanitizer";

export class Trace implements IMessageData, ISerializable {

    public static envelopeType = "Microsoft.ApplicationInsights.{0}.Message";
    public static dataType = "MessageData";

    public aiDataContract = {
        ver: FieldType.Required,
        message: FieldType.Required,
        severityLevel: FieldType.Default,
        properties: FieldType.Default
    };

    /**
     * Schema version
     */
    public ver: number; // = 2;

    /**
     * Trace message
     */
    public message: string;
 
    /**
     * Trace severity level.
     */
    public severityLevel: SeverityLevel;
 
    /**
     * Collection of custom properties.
     */
    public properties: any;
 
    /**
     * Collection of custom measurements.
     */
    public measurements: any;
 
    /**
     * Constructs a new instance of the TraceTelemetry object
     */
    constructor(logger: IDiagnosticLogger, message: string, severityLevel?: SeverityLevel, properties?: any, measurements?: { [key: string]: number }) {
        let _self = this;
        _self.ver = 2;
        message = message || strNotSpecified;
        _self.message = dataSanitizeMessage(logger, message);
        _self.properties = dataSanitizeProperties(logger, properties);
        _self.measurements = dataSanitizeMeasurements(logger, measurements);

        if (severityLevel) {
            _self.severityLevel = severityLevel;
        }
    }
}
