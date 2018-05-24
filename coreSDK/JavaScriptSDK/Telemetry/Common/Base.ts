import { Base as AIBase } from '../../../JavaScriptSDK.Interfaces/Contracts/Generated/Base';
import { ISerializable } from '../../../JavaScriptSDK.Interfaces/Telemetry/ISerializable';

export class Base extends AIBase implements ISerializable {

    /**
     * The data contract for serializing this object.
     */
    public aiDataContract = {};
}