"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.strIkey = exports.strNotSpecified = exports.DEFAULT_BREEZE_PATH = exports.DEFAULT_BREEZE_ENDPOINT = exports.HttpMethod = exports.ProcessLegacy = exports.SampleRate = exports.DisabledPropertyName = void 0;
/**
 * This is an internal property used to cause internal (reporting) requests to be ignored from reporting
 * additional telemetry, to handle polyfil implementations ALL urls used with a disabled request will
 * also be ignored for future requests even when this property is not provided.
 * Tagging as Ignore as this is an internal value and is not expected to be used outside of the SDK
 * @ignore
 */
exports.DisabledPropertyName = "Microsoft_ApplicationInsights_BypassAjaxInstrumentation";
exports.SampleRate = "sampleRate";
exports.ProcessLegacy = "ProcessLegacy";
exports.HttpMethod = "http.method";
exports.DEFAULT_BREEZE_ENDPOINT = "https://dc.services.visualstudio.com";
exports.DEFAULT_BREEZE_PATH = "/v2/track";
exports.strNotSpecified = "not_specified";
exports.strIkey = "iKey";
