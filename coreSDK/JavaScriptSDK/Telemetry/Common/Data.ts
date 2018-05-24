import { Data as AIData } from '../../../JavaScriptSDK.Interfaces/Contracts/Generated/Data';
import { ISerializable } from '../../../JavaScriptSDK.Interfaces/Telemetry/ISerializable';
import { FieldType } from '../../../JavaScriptSDK/Serializer';

export class Data<TDomain> extends AIData<TDomain> implements ISerializable {

    /**
     * The data contract for serializing this object.
     */
    public aiDataContract = {
        baseType: FieldType.Required,
        baseData: FieldType.Required
    }

    /**
     * Constructs a new instance of telemetry data.
     */
    constructor(type: string, data: TDomain) {
        super();

        this.baseType = type;
        this.baseData = data;
    }
}