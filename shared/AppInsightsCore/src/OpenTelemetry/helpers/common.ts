// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ILazyValue, asString, dumpObj, isError, isObject, isPrimitive, safe, safeGetLazy } from "@nevware21/ts-utils";
import { getJSON } from "../../JavaScriptSDK/EnvUtils";
import { STR_EMPTY } from "../../JavaScriptSDK/InternalConstants";
import { IAttributeContainer } from "../attribute/IAttributeContainer";
import {
    DBSYSTEMVALUES_DB2, DBSYSTEMVALUES_DERBY, DBSYSTEMVALUES_H2, DBSYSTEMVALUES_HSQLDB, DBSYSTEMVALUES_MARIADB, DBSYSTEMVALUES_MSSQL,
    DBSYSTEMVALUES_ORACLE, DBSYSTEMVALUES_OTHER_SQL, DBSYSTEMVALUES_SQLITE
} from "../attribute/SemanticConventions";
import { OTelAttributeValue } from "../interfaces/IOTelAttributes";

const _hasJsonStringify: ILazyValue<boolean> = (/*#__PURE__*/ safeGetLazy(() => !!getJSON().stringify, null));

const SYNTHETIC_TYPE = (/*#__PURE__*/ "user_agent.synthetic.type");
const CLIENT_DOT = (/*#__PURE__*/ "client.");
const HTTP_DOT = (/*#__PURE__*/ "http.");
const NET_DOT = (/*#__PURE__*/ "net.");
const PEER_DOT = (/*#__PURE__*/ "peer.");

const ATTR_NETWORK_PEER_ADDRESS = (/*#__PURE__*/ "network.peer.address");
const SEMATTRS_NET_PEER_IP = (/*#__PURE__*/ NET_DOT + PEER_DOT + "ip");
const ATTR_CLIENT_ADDRESS = (/*#__PURE__*/ CLIENT_DOT + "address");
const SEMATTRS_HTTP_CLIENT_IP = (/*#__PURE__*/ HTTP_DOT + "client_ip");
const ATTR_USER_AGENT_ORIGINAL = (/*#__PURE__*/ "user_agent.original");
const SEMATTRS_HTTP_USER_AGENT = (/*#__PURE__*/ HTTP_DOT + "user_agent");
const ATTR_URL_FULL = (/*#__PURE__*/ "url.full");
const SEMATTRS_HTTP_URL = (/*#__PURE__*/ HTTP_DOT + "url");
const ATTR_HTTP_REQUEST_METHOD = (/*#__PURE__*/ HTTP_DOT + "request.method");
const SEMATTRS_HTTP_METHOD = (/*#__PURE__*/ HTTP_DOT + "method");
const ATTR_HTTP_RESPONSE_STATUS_CODE = (/*#__PURE__*/ HTTP_DOT + "response.status_code");
const SEMATTRS_HTTP_STATUS_CODE = (/*#__PURE__*/ HTTP_DOT + "status_code");
const ATTR_URL_SCHEME = (/*#__PURE__*/ "url.scheme");
const SEMATTRS_HTTP_SCHEME = (/*#__PURE__*/ HTTP_DOT + "scheme");
const ATTR_URL_PATH = (/*#__PURE__*/ "url.path");
const ATTR_URL_QUERY = (/*#__PURE__*/ "url.query");
const SEMATTRS_HTTP_TARGET = (/*#__PURE__*/ HTTP_DOT + "target");
const ATTR_SERVER_ADDRESS = (/*#__PURE__*/ "server.address");
const SEMATTRS_HTTP_HOST = (/*#__PURE__*/ HTTP_DOT + "host");
const SEMATTRS_NET_PEER_NAME = (/*#__PURE__*/ NET_DOT + PEER_DOT + "name");
const ATTR_CLIENT_PORT = (/*#__PURE__*/ CLIENT_DOT + "port");
const ATTR_SERVER_PORT = (/*#__PURE__*/ "server.port");
const SEMATTRS_NET_PEER_PORT = (/*#__PURE__*/ NET_DOT + PEER_DOT + "port");
const SEMATTRS_PEER_SERVICE = (/*#__PURE__*/ PEER_DOT + "service");

/**
 * Get the URL from the attribute container
 * @param container - The attribute container to extract the URL from
 * @returns The constructed URL string
 */
/* #__NO_SIDE_EFFECTS__ */
export function getUrl(container: IAttributeContainer): string {
    let result = "";
    if (container) {
        const httpMethod = getHttpMethod(container);
        if (httpMethod) {
            const httpUrl = getHttpUrl(container);
            if (httpUrl) {
                result = asString(httpUrl);
            } else {
                const httpScheme = getHttpScheme(container);
                const httpTarget = getHttpTarget(container);
                if (httpScheme && httpTarget) {
                    const httpHost = getHttpHost(container);
                    if (httpHost) {
                        result = httpScheme + "://" + httpHost + httpTarget;
                    } else {
                        const netPeerPort = getNetPeerPort(container);
                        if (netPeerPort) {
                            const netPeerName = getNetPeerName(container);
                            if (netPeerName) {
                                result = httpScheme + "://" + netPeerName + ":" + netPeerPort + httpTarget;
                            } else {
                                const netPeerIp = getPeerIp(container);
                                if (netPeerIp) {
                                    result = httpScheme + "://" + netPeerIp + ":" + netPeerPort + httpTarget;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    return result;
}

/**
 * Gets the synthetic type from the attribute container
 * @param container - The attribute container to extract the synthetic type from
 * @returns The synthetic type value
 */
/* #__NO_SIDE_EFFECTS__ */
export function getSyntheticType(container: IAttributeContainer): OTelAttributeValue {
    return container.get(SYNTHETIC_TYPE);
}

/**
 * Determine if the attribute container represents a synthetic source
 * @param container - The attribute container to check
 * @returns True if the attribute container is from a synthetic source
 */
/* #__NO_SIDE_EFFECTS__ */
export function isSyntheticSource(container: IAttributeContainer): boolean {
    return !!getSyntheticType(container);
}

/**
 * Serialize an attribute value to a string value
 * @param value - The attribute value to serialize
 * @returns The serialized string value
 */
/* #__NO_SIDE_EFFECTS__ */
export function serializeAttribute(value: any): string | number | bigint | boolean | undefined | symbol | null {
    let result: string | number | boolean | null | undefined;
    if (isError(value)) {
        result = dumpObj(value);
    } else if ((!value.toString || isObject(value)) && _hasJsonStringify.v) {
        result = safe(getJSON().stringify, [value]).v;
    } else if (isPrimitive(value)) {
        // We keep primitives as-is, so that the standard attribute types are preserved
        // These are converted as required in the sending channel(s)
        result = value as any;
    } else {
        result = asString(value);
    }

    // Return scalar and undefined values
    return result;
}

/**
 * Peer address of the network connection - IP address or Unix domain socket name.
 *
 * @example 10.1.2.80
 * @example /tmp/my.sock
 * @since 3.4.0
 */
/* #__NO_SIDE_EFFECTS__ */
export function getPeerIp(container: IAttributeContainer): OTelAttributeValue | undefined {
    if (container) {
        return container.get(ATTR_NETWORK_PEER_ADDRESS) || container.get(SEMATTRS_NET_PEER_IP);
    }
}

/* #__NO_SIDE_EFFECTS__ */
export function getLocationIp(container: IAttributeContainer): OTelAttributeValue | undefined {
    let result: OTelAttributeValue | undefined;
    if (container) {
        const httpClientIp = getHttpClientIp(container);
        if (httpClientIp) {
            result = asString(httpClientIp);
        }

        if (!result) {
            const netPeerIp = getPeerIp(container);
            if (netPeerIp) {
                result = asString(netPeerIp);
            }
        }
    }

    return result;
}

/* #__NO_SIDE_EFFECTS__ */
export function getHttpClientIp(container: IAttributeContainer): OTelAttributeValue | undefined {
    if (container) {
        return container.get(ATTR_CLIENT_ADDRESS) || container.get(SEMATTRS_HTTP_CLIENT_IP);
    }
}

/* #__NO_SIDE_EFFECTS__ */
export function getUserAgent(container: IAttributeContainer): OTelAttributeValue | undefined {
    if (container) {
        return container.get(ATTR_USER_AGENT_ORIGINAL) || container.get(SEMATTRS_HTTP_USER_AGENT);
    }
}

/* #__NO_SIDE_EFFECTS__ */
export function getHttpUrl(container: IAttributeContainer): OTelAttributeValue | undefined {
    // Stable sem conv only supports populating url from `url.full`
    if (container) {
        return container.get(ATTR_URL_FULL) || container.get(SEMATTRS_HTTP_URL);
    }
}

/* #__NO_SIDE_EFFECTS__ */
export function getHttpMethod(container: IAttributeContainer): OTelAttributeValue | undefined {
    if (container) {
        return container.get(ATTR_HTTP_REQUEST_METHOD) || container.get(SEMATTRS_HTTP_METHOD);
    }
}

/* #__NO_SIDE_EFFECTS__ */
export function getHttpStatusCode(container: IAttributeContainer): OTelAttributeValue | undefined {
    if (container) {
        return container.get(ATTR_HTTP_RESPONSE_STATUS_CODE) || container.get(SEMATTRS_HTTP_STATUS_CODE);
    }
}

/* #__NO_SIDE_EFFECTS__ */
export function getHttpScheme(container: IAttributeContainer): OTelAttributeValue | undefined {
    if (container) {
        return container.get(ATTR_URL_SCHEME) || container.get(SEMATTRS_HTTP_SCHEME);
    }
}

/* #__NO_SIDE_EFFECTS__ */
export function getHttpTarget(container: IAttributeContainer): OTelAttributeValue | undefined {
    if (container) {
        return container.get(ATTR_URL_PATH) || container.get(ATTR_URL_QUERY) || container.get(SEMATTRS_HTTP_TARGET);
    }
}

/* #__NO_SIDE_EFFECTS__ */
export function getHttpHost(container: IAttributeContainer): OTelAttributeValue | undefined {
    if (container) {
        return container.get(ATTR_SERVER_ADDRESS) || container.get(SEMATTRS_HTTP_HOST);
    }
}

/* #__NO_SIDE_EFFECTS__ */
export function getNetPeerName(container: IAttributeContainer): OTelAttributeValue | undefined {
    if (container) {
        return container.get(ATTR_CLIENT_ADDRESS) || container.get(SEMATTRS_NET_PEER_NAME);
    }
}

/* #__NO_SIDE_EFFECTS__ */
export function getNetPeerPort(container: IAttributeContainer): OTelAttributeValue | undefined {
    if (container) {
        return (
            container.get(ATTR_CLIENT_PORT) ||
            container.get(ATTR_SERVER_PORT) ||
            container.get(SEMATTRS_NET_PEER_PORT)
        );
    }
}

export function getDependencyTarget(container: IAttributeContainer): string {
    let result: string;
    if (container) {
        const peerService = container.get(SEMATTRS_PEER_SERVICE);
        if (peerService) {
            result = asString(peerService);
        }
        
        if (!result) {
            const httpHost = getHttpHost(container);
            if (httpHost) {
                result = asString(httpHost);
            }
        }

        if (!result) {
            const httpUrl = getHttpUrl(container);
            if (httpUrl) {
                result = asString(httpUrl);
            }
        }

        if (!result) {
            const netPeerName = getNetPeerName(container);
            if (netPeerName) {
                result = asString(netPeerName);
            }
        }
        if (!result) {
            const netPeerIp = getPeerIp(container);
            if (netPeerIp) {
                result = asString(netPeerIp);
            }
        }
    }

    return result || STR_EMPTY;
}

/** #__NO_SIDE_EFFECTS__ */
export function isSqlDB(dbSystem: string): boolean {
    return (
        dbSystem === DBSYSTEMVALUES_DB2 ||
        dbSystem === DBSYSTEMVALUES_DERBY ||
        dbSystem === DBSYSTEMVALUES_MARIADB ||
        dbSystem === DBSYSTEMVALUES_MSSQL ||
        dbSystem === DBSYSTEMVALUES_ORACLE ||
        dbSystem === DBSYSTEMVALUES_SQLITE ||
        dbSystem === DBSYSTEMVALUES_OTHER_SQL ||
        dbSystem === DBSYSTEMVALUES_HSQLDB ||
        dbSystem === DBSYSTEMVALUES_H2
    );
}
