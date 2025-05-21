"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageViewPerformance = void 0;
var Constants_1 = require("../Constants");
var DataSanitizer_1 = require("./Common/DataSanitizer");
var PageViewPerformance = /** @class */ (function () {
    /**
     * Constructs a new instance of the PageEventTelemetry object
     */
    function PageViewPerformance(logger, name, url, unused, properties, measurements, cs4BaseData) {
        this.aiDataContract = {
            ver: 1 /* FieldType.Required */,
            name: 0 /* FieldType.Default */,
            url: 0 /* FieldType.Default */,
            duration: 0 /* FieldType.Default */,
            perfTotal: 0 /* FieldType.Default */,
            networkConnect: 0 /* FieldType.Default */,
            sentRequest: 0 /* FieldType.Default */,
            receivedResponse: 0 /* FieldType.Default */,
            domProcessing: 0 /* FieldType.Default */,
            properties: 0 /* FieldType.Default */,
            measurements: 0 /* FieldType.Default */
        };
        var _self = this;
        _self.ver = 2;
        _self.url = (0, DataSanitizer_1.dataSanitizeUrl)(logger, url);
        _self.name = (0, DataSanitizer_1.dataSanitizeString)(logger, name) || Constants_1.strNotSpecified;
        _self.properties = (0, DataSanitizer_1.dataSanitizeProperties)(logger, properties);
        _self.measurements = (0, DataSanitizer_1.dataSanitizeMeasurements)(logger, measurements);
        if (cs4BaseData) {
            _self.domProcessing = cs4BaseData.domProcessing;
            _self.duration = cs4BaseData.duration;
            _self.networkConnect = cs4BaseData.networkConnect;
            _self.perfTotal = cs4BaseData.perfTotal;
            _self.receivedResponse = cs4BaseData.receivedResponse;
            _self.sentRequest = cs4BaseData.sentRequest;
        }
    }
    PageViewPerformance.envelopeType = "Microsoft.ApplicationInsights.{0}.PageviewPerformance";
    PageViewPerformance.dataType = "PageviewPerformanceData";
    return PageViewPerformance;
}());
exports.PageViewPerformance = PageViewPerformance;
