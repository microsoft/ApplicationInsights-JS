// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const MICROSOFT_APPLICATIONINSIGHTS_NAME = "Microsoft.ApplicationInsights.";
const MICROSOFT_DOT = "microsoft.";
const CLIENT_DOT = "client.";
const HTTP_DOT = "http.";
const NET_DOT = "net.";
const PEER_DOT = "peer.";
const EXCEPTION_DOT = "exception.";
const ENDUSER_DOT = "enduser.";
const URL_DOT = "url.";
const DB_DOT = "db.";
const NETWORK_DOT = "network.";

export const AzureMonitorSampleRate = MICROSOFT_DOT + "sample_rate";
export const ApplicationInsightsCustomEventName = MICROSOFT_DOT + "custom_event.name";
export const MicrosoftClientIp = MICROSOFT_DOT + CLIENT_DOT + "ip";

export const ApplicationInsightsMessageName = MICROSOFT_APPLICATIONINSIGHTS_NAME + "Message";
export const ApplicationInsightsExceptionName = MICROSOFT_APPLICATIONINSIGHTS_NAME + "Exception";
export const ApplicationInsightsPageViewName = MICROSOFT_APPLICATIONINSIGHTS_NAME + "PageView";
export const ApplicationInsightsAvailabilityName = MICROSOFT_APPLICATIONINSIGHTS_NAME + "Availability";
export const ApplicationInsightsEventName = MICROSOFT_APPLICATIONINSIGHTS_NAME + "Event";

export const ApplicationInsightsBaseType = "_MS.baseType";
export const ApplicationInsightsMessageBaseType = "MessageData";
export const ApplicationInsightsExceptionBaseType = "ExceptionData";
export const ApplicationInsightsPageViewBaseType = "PageViewData";
export const ApplicationInsightsAvailabilityBaseType = "AvailabilityData";
export const ApplicationInsightsEventBaseType = "EventData";

export const ATTR_ENDUSER_ID = ENDUSER_DOT + "id";
export const ATTR_ENDUSER_PSEUDO_ID = ENDUSER_DOT + "pseudo_id";
export const ATTR_HTTP_ROUTE = HTTP_DOT + "route";

export const SEMATTRS_NET_PEER_IP = NET_DOT + PEER_DOT + "ip";
export const SEMATTRS_NET_PEER_NAME = NET_DOT + PEER_DOT + "name";
export const SEMATTRS_NET_HOST_IP = NET_DOT + "host.ip";
export const SEMATTRS_PEER_SERVICE = PEER_DOT + "service";
export const SEMATTRS_HTTP_USER_AGENT = HTTP_DOT + "user_agent";
export const SEMATTRS_HTTP_METHOD = HTTP_DOT + "method";
export const SEMATTRS_HTTP_URL = HTTP_DOT + "url";
export const SEMATTRS_HTTP_STATUS_CODE = HTTP_DOT + "status_code";
export const SEMATTRS_HTTP_ROUTE = HTTP_DOT + "route";
export const SEMATTRS_HTTP_HOST = HTTP_DOT + "host";
export const SEMATTRS_DB_SYSTEM = DB_DOT + "system";
export const SEMATTRS_DB_STATEMENT = DB_DOT + "statement";
export const SEMATTRS_DB_OPERATION = DB_DOT + "operation";
export const SEMATTRS_DB_NAME = DB_DOT + "name";
export const SEMATTRS_RPC_SYSTEM = "rpc.system";
export const SEMATTRS_RPC_GRPC_STATUS_CODE = "rpc.grpc.status_code";
export const SEMATTRS_EXCEPTION_TYPE = EXCEPTION_DOT + "type";
export const SEMATTRS_EXCEPTION_MESSAGE = EXCEPTION_DOT + "message";
export const SEMATTRS_EXCEPTION_STACKTRACE = EXCEPTION_DOT + "stacktrace";
export const SEMATTRS_HTTP_SCHEME = HTTP_DOT + "scheme";
export const SEMATTRS_HTTP_TARGET = HTTP_DOT + "target";
export const SEMATTRS_HTTP_FLAVOR = HTTP_DOT + "flavor";
export const SEMATTRS_NET_TRANSPORT = NET_DOT + "transport";
export const SEMATTRS_NET_HOST_NAME = NET_DOT + "host.name";
export const SEMATTRS_NET_HOST_PORT = NET_DOT + "host.port";
export const SEMATTRS_NET_PEER_PORT = NET_DOT + PEER_DOT + "port";
export const SEMATTRS_HTTP_CLIENT_IP = HTTP_DOT + "client_ip";
export const SEMATTRS_ENDUSER_ID = ENDUSER_DOT + "id";

export const ATTR_CLIENT_ADDRESS = CLIENT_DOT + "address";
export const ATTR_CLIENT_PORT = CLIENT_DOT + "port";
export const ATTR_SERVER_ADDRESS = "server.address";
export const ATTR_SERVER_PORT = "server.port";
export const ATTR_URL_FULL = URL_DOT + "full";
export const ATTR_URL_PATH = URL_DOT + "path";
export const ATTR_URL_QUERY = URL_DOT + "query";
export const ATTR_URL_SCHEME = URL_DOT + "scheme";
export const ATTR_ERROR_TYPE = "error.type";
export const ATTR_NETWORK_LOCAL_ADDRESS = NETWORK_DOT + "local.address";
export const ATTR_NETWORK_LOCAL_PORT = NETWORK_DOT + "local.port";
export const ATTR_NETWORK_PROTOCOL_NAME = NETWORK_DOT + "protocol.name";
export const ATTR_NETWORK_PEER_ADDRESS = NETWORK_DOT + PEER_DOT + "address";
export const ATTR_NETWORK_PEER_PORT = NETWORK_DOT + PEER_DOT + "port";
export const ATTR_NETWORK_PROTOCOL_VERSION = NETWORK_DOT + "protocol.version";
export const ATTR_NETWORK_TRANSPORT = NETWORK_DOT + "transport";
export const ATTR_USER_AGENT_ORIGINAL = "user_agent.original";
export const ATTR_HTTP_REQUEST_METHOD = HTTP_DOT + "request.method";
export const ATTR_HTTP_RESPONSE_STATUS_CODE = HTTP_DOT + "response.status_code";
export const ATTR_EXCEPTION_TYPE = EXCEPTION_DOT + "type";
export const ATTR_EXCEPTION_MESSAGE = EXCEPTION_DOT + "message";
export const ATTR_EXCEPTION_STACKTRACE = EXCEPTION_DOT + "stacktrace";
export const EXP_ATTR_ENDUSER_ID = ENDUSER_DOT + "id";
export const EXP_ATTR_ENDUSER_PSEUDO_ID = ENDUSER_DOT + "pseudo_id";
export const EXP_ATTR_SYNTHETIC_TYPE = "synthetic.type";


export const DBSYSTEMVALUES_MONGODB = "mongodb";
export const DBSYSTEMVALUES_COSMOSDB = "cosmosdb";
export const DBSYSTEMVALUES_MYSQL = "mysql";
export const DBSYSTEMVALUES_POSTGRESQL = "postgresql";
export const DBSYSTEMVALUES_REDIS = "redis";
export const DBSYSTEMVALUES_DB2 = "db2";
export const DBSYSTEMVALUES_DERBY = "derby";
export const DBSYSTEMVALUES_MARIADB = "mariadb";
export const DBSYSTEMVALUES_MSSQL = "mssql";
export const DBSYSTEMVALUES_ORACLE = "oracle";
export const DBSYSTEMVALUES_SQLITE = "sqlite";
export const DBSYSTEMVALUES_OTHER_SQL = "other_sql";
export const DBSYSTEMVALUES_HSQLDB = "hsqldb";
export const DBSYSTEMVALUES_H2 = "h2";
