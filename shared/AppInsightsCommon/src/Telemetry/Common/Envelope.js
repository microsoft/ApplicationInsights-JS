"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Envelope = void 0;
var applicationinsights_core_js_1 = require("@microsoft/applicationinsights-core-js");
var Constants_1 = require("../../Constants");
var DataSanitizer_1 = require("./DataSanitizer");
var Envelope = /** @class */ (function () {
    /**
     * Constructs a new instance of telemetry data.
     */
    function Envelope(logger, data, name) {
        var _this = this;
        var _self = this;
        _self.ver = 1;
        _self.sampleRate = 100.0;
        _self.tags = {};
        _self.name = (0, DataSanitizer_1.dataSanitizeString)(logger, name) || Constants_1.strNotSpecified;
        _self.data = data;
        _self.time = (0, applicationinsights_core_js_1.toISOString)(new Date());
        _self.aiDataContract = {
            time: 1 /* FieldType.Required */,
            iKey: 1 /* FieldType.Required */,
            name: 1 /* FieldType.Required */,
            sampleRate: function () {
                return (_this.sampleRate === 100) ? 4 /* FieldType.Hidden */ : 1 /* FieldType.Required */;
            },
            tags: 1 /* FieldType.Required */,
            data: 1 /* FieldType.Required */
        };
    }
    return Envelope;
}());
exports.Envelope = Envelope;
