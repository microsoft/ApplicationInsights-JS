// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { strNotSpecified } from "../../constants/Constants";
import { FieldType } from "../../enums/ai/Enums";
import { IDiagnosticLogger } from "../../interfaces/ai/IDiagnosticLogger";
import { IMessageData } from "../../interfaces/ai/contracts/IMessageData";
import { SeverityLevel } from "../../interfaces/ai/contracts/SeverityLevel";
import { ISerializable } from "../../interfaces/ai/telemetry/ISerializable";
import { dataSanitizeMeasurements, dataSanitizeMessage, dataSanitizeProperties } from "./Common/DataSanitizer";
import { TraceDataType } from "./DataTypes";
import { TraceEnvelopeType } from "./EnvelopeTypes";

export class Trace implements IMessageData, ISerializable {
    /**
     * @deprecated Use the constant TraceEnvelopeType instead.
     */
    public static envelopeType = TraceEnvelopeType;

    /**
     * @deprecated Use the constant TraceDataType instead.
     */
    public static dataType = TraceDataType;

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
