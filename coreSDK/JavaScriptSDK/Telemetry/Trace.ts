import { MessageData } from '../../JavaScriptSDK.Interfaces/Contracts/Generated/MessageData';
import { ISerializable } from '../../JavaScriptSDK.Interfaces/Telemetry/ISerializable';
import { DataSanitizer } from './Common/DataSanitizer';
import { FieldType } from '../Serializer';
import { SeverityLevel } from '../../JavaScriptSDK.Interfaces/Contracts/Generated/SeverityLevel';
import { Util } from 'applicationinsights-common';

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
    constructor(message: string, properties?: any, severityLevel?: SeverityLevel) {
        super();
        message = message || Util.NotSpecified;
        this.message = DataSanitizer.sanitizeMessage(message);
        this.properties = DataSanitizer.sanitizeProperties(properties);

        if (severityLevel) {
            this.severityLevel = severityLevel;
        }
    }
}