"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Metric = void 0;
var Constants_1 = require("../Constants");
var DataPoint_1 = require("./Common/DataPoint");
var DataSanitizer_1 = require("./Common/DataSanitizer");
var Metric = /** @class */ (function () {
    /**
     * Constructs a new instance of the MetricTelemetry object
     */
    function Metric(logger, name, value, count, min, max, stdDev, properties, measurements) {
        this.aiDataContract = {
            ver: 1 /* FieldType.Required */,
            metrics: 1 /* FieldType.Required */,
            properties: 0 /* FieldType.Default */
        };
        var _self = this;
        _self.ver = 2;
        var dataPoint = new DataPoint_1.DataPoint();
        dataPoint.count = count > 0 ? count : undefined;
        dataPoint.max = isNaN(max) || max === null ? undefined : max;
        dataPoint.min = isNaN(min) || min === null ? undefined : min;
        dataPoint.name = (0, DataSanitizer_1.dataSanitizeString)(logger, name) || Constants_1.strNotSpecified;
        dataPoint.value = value;
        dataPoint.stdDev = isNaN(stdDev) || stdDev === null ? undefined : stdDev;
        _self.metrics = [dataPoint];
        _self.properties = (0, DataSanitizer_1.dataSanitizeProperties)(logger, properties);
        _self.measurements = (0, DataSanitizer_1.dataSanitizeMeasurements)(logger, measurements);
    }
    Metric.envelopeType = "Microsoft.ApplicationInsights.{0}.Metric";
    Metric.dataType = "MetricData";
    return Metric;
}());
exports.Metric = Metric;
