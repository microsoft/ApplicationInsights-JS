// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { FieldType } from "../../enums/ai/Enums";
import { IDiagnosticLogger } from "../../interfaces/ai/IDiagnosticLogger";
import { IRemoteDependencyData } from "../../interfaces/ai/contracts/IRemoteDependencyData";
import { ISerializable } from "../../interfaces/ai/telemetry/ISerializable";
import { msToTimeSpan } from "../../utils/HelperFuncsCore";
import { AjaxHelperParseDependencyPath } from "../../utils/Util";
import { dataSanitizeMeasurements, dataSanitizeProperties, dataSanitizeString, dataSanitizeUrl } from "./Common/DataSanitizer";
import { RemoteDependencyDataType } from "./DataTypes";
import { RemoteDependencyEnvelopeType } from "./EnvelopeTypes";

/**
 * @deprecated - will be removed in future releases as this was only used by the applicationinsights-channel-js package.
 * And it no longer uses this class.
 */
export class RemoteDependencyData implements IRemoteDependencyData, ISerializable {
    /**
     * @deprecated Use the constant RemoteDependencyEnvelopeType instead.
     */
    public static envelopeType = RemoteDependencyEnvelopeType;

    /**
     * @deprecated Use the constant RemoteDependencyDataType instead.
     */
    public static dataType = RemoteDependencyDataType;

    public aiDataContract = {
        id: FieldType.Required,
        ver: FieldType.Required,
        name: FieldType.Default,
        resultCode: FieldType.Default,
        duration: FieldType.Default,
        success: FieldType.Default,
        data: FieldType.Default,
        target: FieldType.Default,
        type: FieldType.Default,
        properties: FieldType.Default,
        measurements: FieldType.Default,

        kind: FieldType.Default,
        value: FieldType.Default,
        count: FieldType.Default,
        min: FieldType.Default,
        max: FieldType.Default,
        stdDev: FieldType.Default,
        dependencyKind: FieldType.Default,
        dependencySource: FieldType.Default,
        commandName: FieldType.Default,
        dependencyTypeName: FieldType.Default
    }

    /**
     * Schema version
     */
    public ver: number; // = 2;

    /**
     * Name of the command initiated with this dependency call. Low cardinality value. Examples are stored procedure name and URL path template.
     */
    public name: string;
 
    /**
     * Identifier of a dependency call instance. Used for correlation with the request telemetry item corresponding to this dependency call.
     */
    public id: string;
 
    /**
     * Result code of a dependency call. Examples are SQL error code and HTTP status code.
     */
    public resultCode: string;
 
    /**
     * Request duration in format: DD.HH:MM:SS.MMMMMM. Must be less than 1000 days.
     */
    public duration: string;
 
    /**
     * Indication of successful or unsuccessful call.
     */
    public success: boolean; /* true */
 
    /**
     * Command initiated by this dependency call. Examples are SQL statement and HTTP URL's with all query parameters.
     */
    public data: string;
 
    /**
     * Target site of a dependency call. Examples are server name, host address.
     */
    public target: string;
 
    /**
     * Dependency type name. Very low cardinality value for logical grouping of dependencies and interpretation of other fields like commandName and resultCode. Examples are SQL, Azure table, and HTTP.
     */
    public type: string;
 
    /**
     * Collection of custom properties.
     */
    public properties: any; // = {};
 
    /**
     * Collection of custom measurements.
     */
    public measurements: any; // = {};
 
    /**
     * Constructs a new instance of the RemoteDependencyData object
     */
    constructor(logger: IDiagnosticLogger, id: string, absoluteUrl: string, commandName: string, value: number, success: boolean, resultCode: number, method?: string, requestAPI: string = "Ajax", correlationContext?: string, properties?: Object, measurements?: Object) {
        let _self = this;

        _self.ver = 2;
        _self.id = id;
        _self.duration = msToTimeSpan(value);
        _self.success = success;
        _self.resultCode = "" + resultCode;

        _self.type = dataSanitizeString(logger, requestAPI);

        const dependencyFields = AjaxHelperParseDependencyPath(logger, absoluteUrl, method, commandName);
        _self.data = dataSanitizeUrl(logger, commandName) || dependencyFields.data; // get a value from hosturl if commandName not available
        _self.target = dataSanitizeString(logger, dependencyFields.target);
        if (correlationContext) {
            _self.target = `${_self.target} | ${correlationContext}`;
        }
        _self.name = dataSanitizeString(logger, dependencyFields.name);

        _self.properties = dataSanitizeProperties(logger, properties);
        _self.measurements = dataSanitizeMeasurements(logger, measurements);
    }
}
