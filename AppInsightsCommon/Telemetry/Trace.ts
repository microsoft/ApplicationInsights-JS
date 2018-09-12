import { MessageData } from '../Interfaces/Contracts/Generated/MessageData';
import { ISerializable } from '../Interfaces/Telemetry/ISerializable';
import { DataSanitizer } from './Common/DataSanitizer';
import { FieldType } from '../Enums';
import { SeverityLevel } from '../Interfaces/Contracts/Generated/SeverityLevel';
import { Util } from '../Util';
import { IDiagnosticLogger } from 'applicationinsights-core-js';

export class Trace extends MessageData implements ISerializable {

    public static envelopeType = "Microsoft.ApplicationInsights.{0}.Message";
    public static dataType = "MessageData";

    public aiDataContract = {
        ver: FieldType.Required,
        message: FieldType.Required,
        severityLevel: FieldType.Default,
        properties: FieldType.Default
    };

    /**
     * Constructs a new instance of the TraceTelemetry object
     */
    constructor(logger: IDiagnosticLogger, message: string, properties?: any, severityLevel?: SeverityLevel) {
        super();
        message = message || Util.NotSpecified;
        this.message = DataSanitizer.sanitizeMessage(logger, message);
        this.properties = DataSanitizer.sanitizeProperties(logger, properties);

        if (severityLevel) {
            this.severityLevel = severityLevel;
        }
    }
}