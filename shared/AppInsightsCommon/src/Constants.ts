// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * This is an internal property used to cause internal (reporting) requests to be ignored from reporting
 * additional telemetry, to handle polyfil implementations ALL urls used with a disabled request will 
 * also be ignored for future requests even when this property is not provided.
 * Tagging as Ignore as this is an internal value and is not expected to be used outside of the SDK
 * @ignore
 */
export const DisabledPropertyName: string = "Microsoft_ApplicationInsights_BypassAjaxInstrumentation";
export const SampleRate = "sampleRate";
export const ProcessLegacy = "ProcessLegacy";
export const HttpMethod = "http.method";
export const DEFAULT_BREEZE_ENDPOINT = "https://dc.services.visualstudio.com";