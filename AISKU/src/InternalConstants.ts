// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// Note: DON'T Export these const from the package as we are still targeting ES3 this will export a mutable variables that someone could change!!!
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

// Generally you should only put values that are used more than 2 times and then only if not already exposed as a constant (such as SdkCoreNames)
// as when using "short" named values from here they will be will be minified smaller than the SdkCoreNames[eSdkCoreNames.xxxx] value.

const _AUTHENTICATED_USER_CONTEXT = "AuthenticatedUserContext";
const _TRACK = "track";
export const STR_EMPTY = "";
export const STR_SNIPPET = "snippet";
export const STR_GET_COOKIE_MGR = "getCookieMgr";
export const STR_START_TRACK_PAGE = "startTrackPage";
export const STR_STOP_TRACK_PAGE = "stopTrackPage";
export const STR_FLUSH = "flush";
export const STR_START_TRACK_EVENT = "startTrackEvent";
export const STR_STOP_TRACK_EVENT = "stopTrackEvent";
export const STR_ADD_TELEMETRY_INITIALIZER = "addTelemetryInitializer";
export const STR_ADD_TELEMETRY_INITIALIZERS = STR_ADD_TELEMETRY_INITIALIZER + "s" as "addTelemetryInitializers";
export const STR_POLL_INTERNAL_LOGS = "pollInternalLogs";
export const STR_GET_PLUGIN = "getPlugin";
export const STR_EVT_NAMESPACE = "evtNamespace";
export const STR_TRACK_EVENT = _TRACK + "Event" as "trackEvent";
export const STR_TRACK_TRACE = _TRACK + "Trace" as "trackTrace";
export const STR_TRACK_METRIC = _TRACK + "Metric" as "trackMetric";
export const STR_TRACK_PAGE_VIEW = _TRACK + "PageView" as "trackPageView";
export const STR_TRACK_EXCEPTION = _TRACK + "Exception" as "trackException";
export const STR_TRACK_DEPENDENCY_DATA = _TRACK + "DependencyData" as "trackDependencyData";
export const STR_SET_AUTHENTICATED_USER_CONTEXT = "set" + _AUTHENTICATED_USER_CONTEXT as "setAuthenticatedUserContext";
export const STR_CLEAR_AUTHENTICATED_USER_CONTEXT = "clear" + _AUTHENTICATED_USER_CONTEXT as "clearAuthenticatedUserContext";
