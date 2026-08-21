// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export const STR_EMPTY = "";
export const STR_OTLP_CHANNEL = "OtlpChannel";

/**
 * The prefix applied to attributes that carry Application Insights specific information which has no
 * OpenTelemetry semantic convention equivalent. Keeping these in a dedicated namespace avoids
 * colliding with (and being mistaken for) a real semantic convention.
 */
export const MS_PREFIX = "microsoft.";
export const MS_EXT_PREFIX = "microsoft.ext.";

/**
 * The Part A extension names that are consumed directly rather than being copied into attributes.
 */
export const EXT_DT = "dt";
export const EXT_TRACE = "trace";
export const EXT_METADATA = "metadata";

/**
 * OpenTelemetry semantic convention attribute keys used by the converter.
 */
export const ATTR_HTTP_REQUEST_METHOD = "http.request.method";
export const ATTR_HTTP_RESPONSE_STATUS_CODE = "http.response.status_code";
export const ATTR_URL_FULL = "url.full";
export const ATTR_SERVER_ADDRESS = "server.address";
export const ATTR_SERVER_PORT = "server.port";
export const ATTR_PEER_SERVICE = "peer.service";
export const ATTR_DB_SYSTEM = "db.system";
export const ATTR_DB_STATEMENT = "db.statement";
export const ATTR_RPC_SYSTEM = "rpc.system";
export const ATTR_EXCEPTION_TYPE = "exception.type";
export const ATTR_EXCEPTION_MESSAGE = "exception.message";
export const ATTR_EXCEPTION_STACKTRACE = "exception.stacktrace";
export const ATTR_URL_PATH = "url.path";
export const ATTR_EVENT_NAME = "event.name";

/**
 * OpenTelemetry semantic convention resource attribute keys used by the resource builder.
 */
export const ATTR_SERVICE_NAME = "service.name";
export const ATTR_SERVICE_VERSION = "service.version";
export const ATTR_SERVICE_INSTANCE_ID = "service.instance.id";
export const ATTR_TELEMETRY_SDK_NAME = "telemetry.sdk.name";
export const ATTR_TELEMETRY_SDK_LANGUAGE = "telemetry.sdk.language";
export const ATTR_TELEMETRY_SDK_VERSION = "telemetry.sdk.version";
export const ATTR_DEVICE_ID = "device.id";
export const ATTR_DEVICE_MODEL_NAME = "device.model.name";
export const ATTR_OS_TYPE = "os.type";
export const ATTR_OS_VERSION = "os.version";
export const ATTR_BROWSER_LANGUAGE = "browser.language";
export const ATTR_USER_ID = "user.id";

/**
 * The default instrumentation scope reported for exported records.
 */
export const DEFAULT_SCOPE_NAME = "@microsoft/applicationinsights-web";

/**
 * The signal specific paths appended to the configured base endpoint.
 */
export const PATH_TRACES = "/v1/traces";
export const PATH_LOGS = "/v1/logs";
