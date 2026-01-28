// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const MICROSOFT_APPLICATIONINSIGHTS_NAME = (/* #__PURE__ */"Microsoft.ApplicationInsights.");
const MICROSOFT_DOT = (/* #__PURE__ */"microsoft.");
const CLIENT_DOT = (/*#__PURE__*/ "client.");
const HTTP_DOT = (/*#__PURE__*/ "http.");
const NET_DOT = (/*#__PURE__*/ "net.");
const PEER_DOT = (/*#__PURE__*/ "peer.");
const EXCEPTION_DOT = (/*#__PURE__*/ "exception.");
const ENDUSER_DOT = (/*#__PURE__*/ "enduser.");
const URL_DOT = (/*#__PURE__*/ "url.");
const DB_DOT = (/*#__PURE__*/ "db.");
const NETWORK_DOT = (/*#__PURE__*/ "network.");

export const AzureMonitorSampleRate = (/* #__PURE__*/ MICROSOFT_DOT + "sample_rate");
export const ApplicationInsightsCustomEventName = (/* #__PURE__*/ MICROSOFT_DOT + "custom_event.name");
export const MicrosoftClientIp = (/* #__PURE__*/ MICROSOFT_DOT + CLIENT_DOT + "ip");

export const ApplicationInsightsMessageName = (/* #__PURE__*/ MICROSOFT_APPLICATIONINSIGHTS_NAME + "Message");
export const ApplicationInsightsExceptionName = (/* #__PURE__*/ MICROSOFT_APPLICATIONINSIGHTS_NAME + "Exception");
export const ApplicationInsightsPageViewName = (/* #__PURE__*/ MICROSOFT_APPLICATIONINSIGHTS_NAME + "PageView");
export const ApplicationInsightsAvailabilityName = (/* #__PURE__*/ MICROSOFT_APPLICATIONINSIGHTS_NAME + "Availability");
export const ApplicationInsightsEventName = (/* #__PURE__*/ MICROSOFT_APPLICATIONINSIGHTS_NAME + "Event");

export const ApplicationInsightsBaseType = (/* #__PURE__*/ "_MS.baseType");
export const ApplicationInsightsMessageBaseType = (/* #__PURE__*/ "MessageData");
export const ApplicationInsightsExceptionBaseType = (/* #__PURE__*/ "ExceptionData");
export const ApplicationInsightsPageViewBaseType = (/* #__PURE__*/ "PageViewData");
export const ApplicationInsightsAvailabilityBaseType = (/* #__PURE__*/ "AvailabilityData");
export const ApplicationInsightsEventBaseType = (/* #__PURE__*/ "EventData");

export const ATTR_ENDUSER_ID = (/* #__PURE__*/ENDUSER_DOT + "id");
export const ATTR_ENDUSER_PSEUDO_ID = (/* #__PURE__*/ENDUSER_DOT + "pseudo_id");
export const ATTR_HTTP_ROUTE = (/* #__PURE__*/HTTP_DOT + "route");

export const SEMATTRS_NET_PEER_IP = (/*#__PURE__*/ NET_DOT + PEER_DOT + "ip");
export const SEMATTRS_NET_PEER_NAME = (/*#__PURE__*/ NET_DOT + PEER_DOT + "name");
export const SEMATTRS_NET_HOST_IP = (/*#__PURE__*/ NET_DOT + "host.ip");
export const SEMATTRS_PEER_SERVICE = (/*#__PURE__*/ PEER_DOT + "service");
export const SEMATTRS_HTTP_USER_AGENT = (/*#__PURE__*/ HTTP_DOT + "user_agent");
export const SEMATTRS_HTTP_METHOD = (/*#__PURE__*/ HTTP_DOT + "method");
export const SEMATTRS_HTTP_URL = (/*#__PURE__*/ HTTP_DOT + "url");
export const SEMATTRS_HTTP_STATUS_CODE = (/*#__PURE__*/ HTTP_DOT + "status_code");
export const SEMATTRS_HTTP_ROUTE = (/*#__PURE__*/ HTTP_DOT + "route");
export const SEMATTRS_HTTP_HOST = (/*#__PURE__*/ HTTP_DOT + "host");
export const SEMATTRS_DB_SYSTEM = (/*#__PURE__*/ DB_DOT + "system");
export const SEMATTRS_DB_STATEMENT = (/*#__PURE__*/ DB_DOT + "statement");
export const SEMATTRS_DB_OPERATION = (/*#__PURE__*/ DB_DOT + "operation");
export const SEMATTRS_DB_NAME = (/*#__PURE__*/ DB_DOT + "name");
export const SEMATTRS_RPC_SYSTEM = (/*#__PURE__*/ "rpc.system");
export const SEMATTRS_RPC_GRPC_STATUS_CODE = (/*#__PURE__*/ "rpc.grpc.status_code");
export const SEMATTRS_EXCEPTION_TYPE = (/*#__PURE__*/ EXCEPTION_DOT + "type");
export const SEMATTRS_EXCEPTION_MESSAGE = (/*#__PURE__*/ EXCEPTION_DOT + "message");
export const SEMATTRS_EXCEPTION_STACKTRACE = (/*#__PURE__*/ EXCEPTION_DOT + "stacktrace");
export const SEMATTRS_HTTP_SCHEME = (/*#__PURE__*/ HTTP_DOT + "scheme");
export const SEMATTRS_HTTP_TARGET = (/*#__PURE__*/ HTTP_DOT + "target");
export const SEMATTRS_HTTP_FLAVOR = (/*#__PURE__*/ HTTP_DOT + "flavor");
export const SEMATTRS_NET_TRANSPORT = (/*#__PURE__*/ NET_DOT + "transport");
export const SEMATTRS_NET_HOST_NAME = (/*#__PURE__*/ NET_DOT + "host.name");
export const SEMATTRS_NET_HOST_PORT = (/*#__PURE__*/ NET_DOT + "host.port");
export const SEMATTRS_NET_PEER_PORT = (/*#__PURE__*/ NET_DOT + PEER_DOT + "port");
export const SEMATTRS_HTTP_CLIENT_IP = (/*#__PURE__*/ HTTP_DOT + "client_ip");
export const SEMATTRS_ENDUSER_ID = (/*#__PURE__*/ ENDUSER_DOT + "id");

export const ATTR_CLIENT_ADDRESS = (/*#__PURE__*/ CLIENT_DOT + "address");
export const ATTR_CLIENT_PORT = (/*#__PURE__*/ CLIENT_DOT + "port");
export const ATTR_SERVER_ADDRESS = (/*#__PURE__*/ "server.address");
export const ATTR_SERVER_PORT = (/*#__PURE__*/ "server.port");
export const ATTR_URL_FULL = (/*#__PURE__*/ URL_DOT + "full");
export const ATTR_URL_PATH = (/*#__PURE__*/ URL_DOT + "path");
export const ATTR_URL_QUERY = (/*#__PURE__*/ URL_DOT + "query");
export const ATTR_URL_SCHEME = (/*#__PURE__*/ URL_DOT + "scheme");
export const ATTR_ERROR_TYPE = (/*#__PURE__*/ "error.type");
export const ATTR_NETWORK_LOCAL_ADDRESS = (/*#__PURE__*/ NETWORK_DOT + "local.address");
export const ATTR_NETWORK_LOCAL_PORT = (/*#__PURE__*/ NETWORK_DOT + "local.port");
export const ATTR_NETWORK_PROTOCOL_NAME = (/*#__PURE__*/ NETWORK_DOT + "protocol.name");
export const ATTR_NETWORK_PEER_ADDRESS = (/*#__PURE__*/ NETWORK_DOT + PEER_DOT + "address");
export const ATTR_NETWORK_PEER_PORT = (/*#__PURE__*/ NETWORK_DOT + PEER_DOT + "port");
export const ATTR_NETWORK_PROTOCOL_VERSION = (/*#__PURE__*/ NETWORK_DOT + "protocol.version");
export const ATTR_NETWORK_TRANSPORT = (/*#__PURE__*/ NETWORK_DOT + "transport");
export const ATTR_USER_AGENT_ORIGINAL = (/*#__PURE__*/ "user_agent.original");
export const ATTR_HTTP_REQUEST_METHOD = (/*#__PURE__*/ HTTP_DOT + "request.method");
export const ATTR_HTTP_RESPONSE_STATUS_CODE = (/*#__PURE__*/ HTTP_DOT + "response.status_code");
export const ATTR_EXCEPTION_TYPE = (/*#__PURE__*/ EXCEPTION_DOT + "type");
export const ATTR_EXCEPTION_MESSAGE = (/*#__PURE__*/ EXCEPTION_DOT + "message");
export const ATTR_EXCEPTION_STACKTRACE = (/*#__PURE__*/ EXCEPTION_DOT + "stacktrace");
export const EXP_ATTR_ENDUSER_ID = (/*#__PURE__*/ ENDUSER_DOT + "id");
export const EXP_ATTR_ENDUSER_PSEUDO_ID = (/*#__PURE__*/ ENDUSER_DOT + "pseudo_id");
export const EXP_ATTR_SYNTHETIC_TYPE = (/*#__PURE__*/ "synthetic.type");


export const DBSYSTEMVALUES_MONGODB = (/*#__PURE__*/ "mongodb");
export const DBSYSTEMVALUES_COSMOSDB = (/*#__PURE__*/ "cosmosdb");
export const DBSYSTEMVALUES_MYSQL = (/*#__PURE__*/ "mysql");
export const DBSYSTEMVALUES_POSTGRESQL = (/*#__PURE__*/ "postgresql");
export const DBSYSTEMVALUES_REDIS = (/*#__PURE__*/ "redis");
export const DBSYSTEMVALUES_DB2 = (/*#__PURE__*/ "db2");
export const DBSYSTEMVALUES_DERBY = (/*#__PURE__*/ "derby");
export const DBSYSTEMVALUES_MARIADB = (/*#__PURE__*/ "mariadb");
export const DBSYSTEMVALUES_MSSQL = (/*#__PURE__*/ "mssql");
export const DBSYSTEMVALUES_ORACLE = (/*#__PURE__*/ "oracle");
export const DBSYSTEMVALUES_SQLITE = (/*#__PURE__*/ "sqlite");
export const DBSYSTEMVALUES_OTHER_SQL = (/*#__PURE__*/ "other_sql");
export const DBSYSTEMVALUES_HSQLDB = (/*#__PURE__*/ "hsqldb");
export const DBSYSTEMVALUES_H2 = (/*#__PURE__*/ "h2");
