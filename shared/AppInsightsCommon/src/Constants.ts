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
export const DEFAULT_BREEZE_PATH = "/v2/track";
export const strNotSpecified = "not_specified";
export const strIkey = "iKey";

// String constants for event names
export const STR_EVENTS_DISCARDED = "eventsDiscarded";
export const STR_EVENTS_SEND_REQUEST = "eventsSendRequest";
export const STR_EVENTS_SENT = "eventsSent";
export const STR_PERF_EVENT = "perfEvent";
export const STR_OFFLINE_DROP = "offlineDrop";
export const STR_OFFLINE_SENT = "offlineSent";
export const STR_OFFLINE_STORE = "offlineStore";

// String constants for core properties
export const STR_GET_PERF_MGR = "_getPerfMgr";
export const STR_CORE = "_core";
export const STR_DISABLED = "disabled";
export const STR_PRIORITY = "priority";
export const STR_PROCESS_TELEMETRY = "processTelemetry";
