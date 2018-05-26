import { Envelope as AIEnvelope } from '../../../JavaScriptSDK.Interfaces/Contracts/Generated/Envelope';
import { Base } from '../../../JavaScriptSDK.Interfaces/Contracts/Generated/Base';
import { IEnvelope } from '../../../JavaScriptSDK.Interfaces/Telemetry/IEnvelope';
import { DataSanitizer } from '../../../JavaScriptSDK/Telemetry/Common/DataSanitizer';
import { FieldType } from '../../../JavaScriptSDK/Serializer';
import { Util } from 'applicationinsights-common';

export class Envelope extends AIEnvelope implements IEnvelope {

    /**
     * The data contract for serializing this object.
     */
    public aiDataContract;

    /**
     * Constructs a new instance of telemetry data.
     */
    constructor(data: Base, name: string) {
        super();

        this.name = DataSanitizer.sanitizeString(name) || Util.NotSpecified;
        this.data = data;
        this.time = Util.toISOStringForIE8(new Date());

        this.aiDataContract = {
            time: FieldType.Required,
            iKey: FieldType.Required,
            name: FieldType.Required,
            sampleRate: () => {
                return (this.sampleRate == 100) ? FieldType.Hidden : FieldType.Required;
            },
            tags: FieldType.Required,
            data: FieldType.Required
        };
    }
}