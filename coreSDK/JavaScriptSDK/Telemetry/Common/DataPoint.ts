import { DataPoint as AIDataPoint } from '../../../JavaScriptSDK.Interfaces/Contracts/Generated/DataPoint';
import { ISerializable } from '../../../JavaScriptSDK.Interfaces/Telemetry/ISerializable';
import { FieldType } from '../../../JavaScriptSDK/Serializer';

export class DataPoint extends AIDataPoint implements ISerializable {

    /**
     * The data contract for serializing this object.
     */
    public aiDataContract = {
        name: FieldType.Required,
        kind: FieldType.Default,
        value: FieldType.Required,
        count: FieldType.Default,
        min: FieldType.Default,
        max: FieldType.Default,
        stdDev: FieldType.Default
    }
}