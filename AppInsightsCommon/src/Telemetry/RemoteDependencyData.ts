// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { DataSanitizer } from './Common/DataSanitizer';
import { FieldType } from '../Enums';
import { ISerializable } from '../Interfaces/Telemetry/ISerializable';
import { Util } from '../Util';
import { AjaxHelper } from '../Util';
import { RemoteDependencyData as GeneratedRemoteDependencyData } from '../Interfaces/Contracts/Generated/RemoteDependencyData';
import { IDiagnosticLogger } from '@microsoft/applicationinsights-core-js';

export class RemoteDependencyData extends GeneratedRemoteDependencyData implements ISerializable {

    public static envelopeType = "Microsoft.ApplicationInsights.{0}.RemoteDependency";
    public static dataType = "RemoteDependencyData";

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
        dependencyTypeName: FieldType.Default,
    }

    /**
     * Constructs a new instance of the RemoteDependencyData object
     */
    constructor(logger: IDiagnosticLogger, id: string, absoluteUrl: string, commandName: string, value: number, success: boolean, resultCode: number, method?: string, requestType: string = "Ajax", properties?: Object, measurements?: Object) {
        super();

        this.id = id;

        this.duration = Util.msToTimeSpan(value);
        this.success = success;
        this.resultCode = resultCode + "";

        this.type = requestType;
        this.data = DataSanitizer.sanitizeUrl(logger, commandName);

        var dependencyFields = AjaxHelper.ParseDependencyPath(logger, absoluteUrl, method, commandName);
        this.target = dependencyFields.target;
        this.name = dependencyFields.name;

        this.properties = DataSanitizer.sanitizeProperties(logger, properties);
        this.measurements = DataSanitizer.sanitizeMeasurements(logger, measurements);
    }
}
