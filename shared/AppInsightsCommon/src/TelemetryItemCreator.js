"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelemetryItemCreator = void 0;
exports.createTelemetryItem = createTelemetryItem;
var applicationinsights_core_js_1 = require("@microsoft/applicationinsights-core-js");
var Constants_1 = require("./Constants");
var DataSanitizer_1 = require("./Telemetry/Common/DataSanitizer");
/**
 * Create a telemetry item that the 1DS channel understands
 * @param item - domain specific properties; part B
 * @param baseType - telemetry item type. ie PageViewData
 * @param envelopeName - Name of the envelope, e.g., `Microsoft.ApplicationInsights.\<instrumentation key\>.PageView`.
 * @param customProperties - user defined custom properties; part C
 * @param systemProperties - system properties that are added to the context; part A
 * @returns ITelemetryItem that is sent to channel
 */
function createTelemetryItem(item, baseType, envelopeName, logger, customProperties, systemProperties) {
    envelopeName = (0, DataSanitizer_1.dataSanitizeString)(logger, envelopeName) || Constants_1.strNotSpecified;
    if ((0, applicationinsights_core_js_1.isNullOrUndefined)(item) ||
        (0, applicationinsights_core_js_1.isNullOrUndefined)(baseType) ||
        (0, applicationinsights_core_js_1.isNullOrUndefined)(envelopeName)) {
        (0, applicationinsights_core_js_1.throwError)("Input doesn't contain all required fields");
    }
    var iKey = "";
    if (item[Constants_1.strIkey]) {
        iKey = item[Constants_1.strIkey];
        delete item[Constants_1.strIkey];
    }
    var telemetryItem = {
        name: envelopeName,
        time: (0, applicationinsights_core_js_1.toISOString)(new Date()),
        iKey: iKey, // this will be set in TelemetryContext
        ext: systemProperties ? systemProperties : {}, // part A
        tags: [],
        data: {},
        baseType: baseType,
        baseData: item // Part B
    };
    // Part C
    if (!(0, applicationinsights_core_js_1.isNullOrUndefined)(customProperties)) {
        (0, applicationinsights_core_js_1.objForEachKey)(customProperties, function (prop, value) {
            telemetryItem.data[prop] = value;
        });
    }
    return telemetryItem;
}
var TelemetryItemCreator = /** @class */ (function () {
    function TelemetryItemCreator() {
    }
    /**
     * Create a telemetry item that the 1DS channel understands
     * @param item - domain specific properties; part B
     * @param baseType - telemetry item type. ie PageViewData
     * @param envelopeName - Name of the envelope (e.g., Microsoft.ApplicationInsights.[instrumentationKey].PageView).
     * @param customProperties - user defined custom properties; part C
     * @param systemProperties - system properties that are added to the context; part A
     * @returns ITelemetryItem that is sent to channel
     */
    TelemetryItemCreator.create = createTelemetryItem;
    return TelemetryItemCreator;
}());
exports.TelemetryItemCreator = TelemetryItemCreator;
