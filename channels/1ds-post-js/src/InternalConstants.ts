// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// Note: DON'T Export these const from the package as we are still targeting ES3 this will export a mutable variables that someone could change!!!
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

// Generally you should only put values that are used more than 2 times and then only if not already exposed as a constant (such as SdkCoreNames)
// as when using "short" named values from here they will be will be minified smaller than the SdkCoreNames[eSdkCoreNames.xxxx] value.

export const STR_EMPTY = "";
export const STR_POST_METHOD = "POST";
export const STR_DISABLED_PROPERTY_NAME: string = "Microsoft_ApplicationInsights_BypassAjaxInstrumentation";

export const STR_DROPPED = "drop";
export const STR_SENDING = "send";
export const STR_REQUEUE = "requeue";
export const STR_RESPONSE_FAIL = "rspFail";
export const STR_OTHER = "oth";

export const DEFAULT_CACHE_CONTROL = "no-cache, no-store";
export const DEFAULT_CONTENT_TYPE = "application/x-json-stream";
export const STR_CACHE_CONTROL = "cache-control";
export const STR_CONTENT_TYPE_HEADER = "content-type";
export const STR_KILL_TOKENS_HEADER = "kill-tokens";
export const STR_KILL_DURATION_HEADER = "kill-duration";
export const STR_KILL_DURATION_SECONDS_HEADER = "kill-duration-seconds";
export const STR_TIME_DELTA_HEADER = "time-delta-millis";
export const STR_CLIENT_VERSION = "client-version";
export const STR_CLIENT_ID = "client-id";
export const STR_TIME_DELTA_TO_APPLY = "time-delta-to-apply-millis";
export const STR_UPLOAD_TIME = "upload-time";
export const STR_API_KEY = "apikey";
export const STR_MSA_DEVICE_TICKET = "AuthMsaDeviceTicket";
export const STR_AUTH_XTOKEN = "AuthXToken";
export const STR_SDK_VERSION = "sdk-version";
export const STR_NO_RESPONSE_BODY = "NoResponseBody";

export const STR_MSFPC = "msfpc";

export const STR_TRACE = "trace";
export const STR_USER = "user";
