"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Event = void 0;
var Constants_1 = require("../Constants");
var DataSanitizer_1 = require("./Common/DataSanitizer");
var Event = /** @class */ (function () {
    /**
     * Constructs a new instance of the EventTelemetry object
     */
    function Event(logger, name, properties, measurements) {
        this.aiDataContract = {
            ver: 1 /* FieldType.Required */,
            name: 1 /* FieldType.Required */,
            properties: 0 /* FieldType.Default */,
            measurements: 0 /* FieldType.Default */
        };
        var _self = this;
        _self.ver = 2;
        _self.name = (0, DataSanitizer_1.dataSanitizeString)(logger, name) || Constants_1.strNotSpecified;
        _self.properties = (0, DataSanitizer_1.dataSanitizeProperties)(logger, properties);
        _self.measurements = (0, DataSanitizer_1.dataSanitizeMeasurements)(logger, measurements);
    }
    Event.envelopeType = "Microsoft.ApplicationInsights.{0}.Event";
    Event.dataType = "EventData";
    return Event;
}());
exports.Event = Event;
