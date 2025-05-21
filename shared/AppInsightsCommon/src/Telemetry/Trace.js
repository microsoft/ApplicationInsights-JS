"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Trace = void 0;
var Constants_1 = require("../Constants");
var DataSanitizer_1 = require("./Common/DataSanitizer");
var Trace = /** @class */ (function () {
    /**
     * Constructs a new instance of the TraceTelemetry object
     */
    function Trace(logger, message, severityLevel, properties, measurements) {
        this.aiDataContract = {
            ver: 1 /* FieldType.Required */,
            message: 1 /* FieldType.Required */,
            severityLevel: 0 /* FieldType.Default */,
            properties: 0 /* FieldType.Default */
        };
        var _self = this;
        _self.ver = 2;
        message = message || Constants_1.strNotSpecified;
        _self.message = (0, DataSanitizer_1.dataSanitizeMessage)(logger, message);
        _self.properties = (0, DataSanitizer_1.dataSanitizeProperties)(logger, properties);
        _self.measurements = (0, DataSanitizer_1.dataSanitizeMeasurements)(logger, measurements);
        if (severityLevel) {
            _self.severityLevel = severityLevel;
        }
    }
    Trace.envelopeType = "Microsoft.ApplicationInsights.{0}.Message";
    Trace.dataType = "MessageData";
    return Trace;
}());
exports.Trace = Trace;
