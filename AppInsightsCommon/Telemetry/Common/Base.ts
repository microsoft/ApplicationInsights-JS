import { ISerializable } from '../../Interfaces/ISerializable';
import { Base as AIBase } from '../../Interfaces/Contracts/Generated/Base'


export class Base extends AIBase implements ISerializable {

    /**
     * The data contract for serializing this object.
     */
    public aiDataContract = {};
}