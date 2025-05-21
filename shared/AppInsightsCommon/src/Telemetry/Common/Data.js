"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Data = void 0;
var Data = /** @class */ (function () {
    /**
     * Constructs a new instance of telemetry data.
     */
    function Data(baseType, data) {
        /**
         * The data contract for serializing this object.
         */
        this.aiDataContract = {
            baseType: 1 /* FieldType.Required */,
            baseData: 1 /* FieldType.Required */
        };
        this.baseType = baseType;
        this.baseData = data;
    }
    return Data;
}());
exports.Data = Data;
