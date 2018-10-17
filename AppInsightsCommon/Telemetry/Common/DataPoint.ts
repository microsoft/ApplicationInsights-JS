// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { DataPoint as AIDataPoint } from '../../Interfaces/Contracts/Generated/DataPoint';
import { ISerializable } from '../../Interfaces/Telemetry/ISerializable';
import { FieldType } from '../../Enums';

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