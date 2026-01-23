// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { FieldType } from "../../../enums/ai/Enums";
import { IData } from "../../../interfaces/ai/contracts/IData";
import { ISerializable } from "../../../interfaces/ai/telemetry/ISerializable";

export class Data<TDomain> implements IData<TDomain>, ISerializable {

    /**
     * The data contract for serializing this object.
     */
    public aiDataContract = {
        baseType: FieldType.Required,
        baseData: FieldType.Required
    }

    /**
     * Name of item (B section) if any. If telemetry data is derived straight from this, this should be null.
     */
    public baseType: string;

    /**
     * Container for data item (B section).
     */
    public baseData: TDomain;

    /**
     * Constructs a new instance of telemetry data.
     */
    constructor(baseType: string, data: TDomain) {
        this.baseType = baseType;
        this.baseData = data;
    }
}
