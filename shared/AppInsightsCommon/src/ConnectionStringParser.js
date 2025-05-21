"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionStringParser = void 0;
exports.parseConnectionString = parseConnectionString;
var applicationinsights_core_js_1 = require("@microsoft/applicationinsights-core-js");
var Constants_1 = require("./Constants");
var _FIELDS_SEPARATOR = ";";
var _FIELD_KEY_VALUE_SEPARATOR = "=";
function parseConnectionString(connectionString) {
    if (!connectionString) {
        return {};
    }
    var kvPairs = connectionString.split(_FIELDS_SEPARATOR);
    var result = (0, applicationinsights_core_js_1.arrReduce)(kvPairs, function (fields, kv) {
        var kvParts = kv.split(_FIELD_KEY_VALUE_SEPARATOR);
        if (kvParts.length === 2) { // only save fields with valid formats
            var key = kvParts[0].toLowerCase();
            var value = kvParts[1];
            fields[key] = value;
        }
        return fields;
    }, {});
    if ((0, applicationinsights_core_js_1.objKeys)(result).length > 0) {
        // this is a valid connection string, so parse the results
        if (result.endpointsuffix) {
            // apply the default endpoints
            var locationPrefix = result.location ? result.location + "." : "";
            result.ingestionendpoint = result.ingestionendpoint || ("https://" + locationPrefix + "dc." + result.endpointsuffix);
        }
        // apply user override endpoint or the default endpoints
        result.ingestionendpoint = result.ingestionendpoint || Constants_1.DEFAULT_BREEZE_ENDPOINT;
        if ((0, applicationinsights_core_js_1.strEndsWith)(result.ingestionendpoint, "/")) {
            result.ingestionendpoint = result.ingestionendpoint.slice(0, -1);
        }
    }
    return result;
}
exports.ConnectionStringParser = {
    parse: parseConnectionString
};
