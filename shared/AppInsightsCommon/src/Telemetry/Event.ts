// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IDiagnosticLogger } from '@microsoft/applicationinsights-core-js';
import { EventData } from '../Interfaces/Contracts/Generated/EventData';
import { ISerializable } from '../Interfaces/Telemetry/ISerializable';
import { DataSanitizer } from './Common/DataSanitizer';
import { FieldType } from '../Enums';
import { Util } from '../Util';

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

        this.name = DataSanitizer.sanitizeString(logger, name) || Util.NotSpecified;
        this.properties = DataSanitizer.sanitizeProperties(logger, properties);
        this.measurements = DataSanitizer.sanitizeMeasurements(logger, measurements);
    }
}
