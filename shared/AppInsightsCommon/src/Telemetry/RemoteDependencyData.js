"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoteDependencyData = void 0;
var HelperFuncs_1 = require("../HelperFuncs");
var Util_1 = require("../Util");
var DataSanitizer_1 = require("./Common/DataSanitizer");
var RemoteDependencyData = /** @class */ (function () {
    /**
     * Constructs a new instance of the RemoteDependencyData object
     */
    function RemoteDependencyData(logger, id, absoluteUrl, commandName, value, success, resultCode, method, requestAPI, correlationContext, properties, measurements) {
        if (requestAPI === void 0) { requestAPI = "Ajax"; }
        this.aiDataContract = {
            id: 1 /* FieldType.Required */,
            ver: 1 /* FieldType.Required */,
            name: 0 /* FieldType.Default */,
            resultCode: 0 /* FieldType.Default */,
            duration: 0 /* FieldType.Default */,
            success: 0 /* FieldType.Default */,
            data: 0 /* FieldType.Default */,
            target: 0 /* FieldType.Default */,
            type: 0 /* FieldType.Default */,
            properties: 0 /* FieldType.Default */,
            measurements: 0 /* FieldType.Default */,
            kind: 0 /* FieldType.Default */,
            value: 0 /* FieldType.Default */,
            count: 0 /* FieldType.Default */,
            min: 0 /* FieldType.Default */,
            max: 0 /* FieldType.Default */,
            stdDev: 0 /* FieldType.Default */,
            dependencyKind: 0 /* FieldType.Default */,
            dependencySource: 0 /* FieldType.Default */,
            commandName: 0 /* FieldType.Default */,
            dependencyTypeName: 0 /* FieldType.Default */
        };
        var _self = this;
        _self.ver = 2;
        _self.id = id;
        _self.duration = (0, HelperFuncs_1.msToTimeSpan)(value);
        _self.success = success;
        _self.resultCode = resultCode + "";
        _self.type = (0, DataSanitizer_1.dataSanitizeString)(logger, requestAPI);
        var dependencyFields = (0, Util_1.AjaxHelperParseDependencyPath)(logger, absoluteUrl, method, commandName);
        _self.data = (0, DataSanitizer_1.dataSanitizeUrl)(logger, commandName) || dependencyFields.data; // get a value from hosturl if commandName not available
        _self.target = (0, DataSanitizer_1.dataSanitizeString)(logger, dependencyFields.target);
        if (correlationContext) {
            _self.target = "".concat(_self.target, " | ").concat(correlationContext);
        }
        _self.name = (0, DataSanitizer_1.dataSanitizeString)(logger, dependencyFields.name);
        _self.properties = (0, DataSanitizer_1.dataSanitizeProperties)(logger, properties);
        _self.measurements = (0, DataSanitizer_1.dataSanitizeMeasurements)(logger, measurements);
    }
    RemoteDependencyData.envelopeType = "Microsoft.ApplicationInsights.{0}.RemoteDependency";
    RemoteDependencyData.dataType = "RemoteDependencyData";
    return RemoteDependencyData;
}());
exports.RemoteDependencyData = RemoteDependencyData;
