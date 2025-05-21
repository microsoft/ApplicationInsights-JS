"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageView = void 0;
var Constants_1 = require("../Constants");
var HelperFuncs_1 = require("../HelperFuncs");
var DataSanitizer_1 = require("./Common/DataSanitizer");
var PageView = /** @class */ (function () {
    /**
     * Constructs a new instance of the PageEventTelemetry object
     */
    function PageView(logger, name, url, durationMs, properties, measurements, id) {
        this.aiDataContract = {
            ver: 1 /* FieldType.Required */,
            name: 0 /* FieldType.Default */,
            url: 0 /* FieldType.Default */,
            duration: 0 /* FieldType.Default */,
            properties: 0 /* FieldType.Default */,
            measurements: 0 /* FieldType.Default */,
            id: 0 /* FieldType.Default */
        };
        var _self = this;
        _self.ver = 2;
        _self.id = (0, DataSanitizer_1.dataSanitizeId)(logger, id);
        _self.url = (0, DataSanitizer_1.dataSanitizeUrl)(logger, url);
        _self.name = (0, DataSanitizer_1.dataSanitizeString)(logger, name) || Constants_1.strNotSpecified;
        if (!isNaN(durationMs)) {
            _self.duration = (0, HelperFuncs_1.msToTimeSpan)(durationMs);
        }
        _self.properties = (0, DataSanitizer_1.dataSanitizeProperties)(logger, properties);
        _self.measurements = (0, DataSanitizer_1.dataSanitizeMeasurements)(logger, measurements);
    }
    PageView.envelopeType = "Microsoft.ApplicationInsights.{0}.Pageview";
    PageView.dataType = "PageviewData";
    return PageView;
}());
exports.PageView = PageView;
