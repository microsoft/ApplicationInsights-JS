"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataPoint = void 0;
var DataPoint = /** @class */ (function () {
    function DataPoint() {
        /**
         * The data contract for serializing this object.
         */
        this.aiDataContract = {
            name: 1 /* FieldType.Required */,
            kind: 0 /* FieldType.Default */,
            value: 1 /* FieldType.Required */,
            count: 0 /* FieldType.Default */,
            min: 0 /* FieldType.Default */,
            max: 0 /* FieldType.Default */,
            stdDev: 0 /* FieldType.Default */
        };
        /**
         * Metric type. Single measurement or the aggregated value.
         */
        this.kind = 0 /* DataPointType.Measurement */;
    }
    return DataPoint;
}());
exports.DataPoint = DataPoint;
