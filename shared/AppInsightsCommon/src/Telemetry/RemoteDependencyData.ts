// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { DataSanitizer } from './Common/DataSanitizer';
import { FieldType } from '../Enums';
import { ISerializable } from '../Interfaces/Telemetry/ISerializable';
import { Util, AjaxHelper} from '../Util';
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
    constructor(logger: IDiagnosticLogger, id: string, absoluteUrl: string, commandName: string, value: number, success: boolean, resultCode: number, method?: string, requestAPI: string = "Ajax", correlationContext?: string, properties?: Object, measurements?: Object) {
        super();

        this.id = id;

        this.duration = Util.msToTimeSpan(value);
        this.success = success;
        this.resultCode = resultCode + "";

        this.type = DataSanitizer.sanitizeString(logger, requestAPI);

        const dependencyFields = AjaxHelper.ParseDependencyPath(logger, absoluteUrl, method, commandName);
        this.data = DataSanitizer.sanitizeUrl(logger, commandName) || dependencyFields.data; // get a value from hosturl if commandName not available
        this.target = DataSanitizer.sanitizeString(logger, dependencyFields.target);
        if (correlationContext) {
            this.target = `${this.target} | ${correlationContext}`;
        }
        this.name = DataSanitizer.sanitizeString(logger, dependencyFields.name);

        this.properties = DataSanitizer.sanitizeProperties(logger, properties);
        this.measurements = DataSanitizer.sanitizeMeasurements(logger, measurements);
    }
}
