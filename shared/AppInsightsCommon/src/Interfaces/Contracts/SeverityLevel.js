"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeverityLevel = void 0;
var applicationinsights_core_js_1 = require("@microsoft/applicationinsights-core-js");
/**
 * Defines the level of severity for the event.
 */
exports.SeverityLevel = (0, applicationinsights_core_js_1.createEnumStyle)({
    Verbose: 0 /* eSeverityLevel.Verbose */,
    Information: 1 /* eSeverityLevel.Information */,
    Warning: 2 /* eSeverityLevel.Warning */,
    Error: 3 /* eSeverityLevel.Error */,
    Critical: 4 /* eSeverityLevel.Critical */
});
