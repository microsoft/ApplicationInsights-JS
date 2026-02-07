// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { AIData, FieldType, ISerializable } from "@microsoft/otel-core-js";

export function _createData<TDomain>(baseType: string, data: TDomain): AIData<TDomain> & ISerializable {
    return {
        baseType: baseType,
        baseData: data,
        aiDataContract: {
            baseType: FieldType.Required,
            baseData: FieldType.Required
        }
    };
}
