// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Data as AIData } from '../../Interfaces/Contracts/Generated/Data';
import { ISerializable } from '../../Interfaces/Telemetry/ISerializable';
import { FieldType } from '../../Enums';

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
    constructor(baseType: string, data: TDomain) {
        super();

        this.baseType = baseType;
        this.baseData = data;
    }
}