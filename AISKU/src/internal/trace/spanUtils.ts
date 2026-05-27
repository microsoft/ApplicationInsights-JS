// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
    ATTR_CLIENT_ADDRESS, ATTR_CLIENT_PORT, ATTR_ENDUSER_ID, ATTR_ENDUSER_PSEUDO_ID, ATTR_ERROR_TYPE, ATTR_EXCEPTION_MESSAGE,
    ATTR_EXCEPTION_STACKTRACE, ATTR_EXCEPTION_TYPE, ATTR_HTTP_REQUEST_METHOD, ATTR_HTTP_RESPONSE_STATUS_CODE, ATTR_HTTP_ROUTE,
    ATTR_NETWORK_LOCAL_ADDRESS, ATTR_NETWORK_LOCAL_PORT, ATTR_NETWORK_PEER_ADDRESS, ATTR_NETWORK_PEER_PORT, ATTR_NETWORK_PROTOCOL_NAME,
    ATTR_NETWORK_PROTOCOL_VERSION, ATTR_NETWORK_TRANSPORT, ATTR_SERVER_ADDRESS, ATTR_SERVER_PORT, ATTR_URL_FULL, ATTR_URL_PATH,
    ATTR_URL_QUERY, ATTR_URL_SCHEME, ATTR_USER_AGENT_ORIGINAL, CtxTagKeys, DBSYSTEMVALUES_MONGODB, DBSYSTEMVALUES_MYSQL,
    DBSYSTEMVALUES_POSTGRESQL, DBSYSTEMVALUES_REDIS, EXP_ATTR_ENDUSER_ID, EXP_ATTR_ENDUSER_PSEUDO_ID, EXP_ATTR_SYNTHETIC_TYPE,
    IAppInsightsCore, IAttributeContainer, IConfiguration, IContextTagKeys, IDependencyTelemetry, IReadableSpan, IRequestTelemetry,
    ITelemetryItem, MicrosoftClientIp, OTelAttributeValue, RemoteDependencyDataType, RemoteDependencyEnvelopeType, RequestDataType,
    RequestEnvelopeType, SEMATTRS_DB_NAME, SEMATTRS_DB_OPERATION, SEMATTRS_DB_STATEMENT, SEMATTRS_DB_SYSTEM, SEMATTRS_ENDUSER_ID,
    SEMATTRS_EXCEPTION_MESSAGE, SEMATTRS_EXCEPTION_STACKTRACE, SEMATTRS_EXCEPTION_TYPE, SEMATTRS_HTTP_CLIENT_IP, SEMATTRS_HTTP_FLAVOR,
    SEMATTRS_HTTP_HOST, SEMATTRS_HTTP_METHOD, SEMATTRS_HTTP_ROUTE, SEMATTRS_HTTP_SCHEME, SEMATTRS_HTTP_STATUS_CODE, SEMATTRS_HTTP_TARGET,
    SEMATTRS_HTTP_URL, SEMATTRS_HTTP_USER_AGENT, SEMATTRS_NET_HOST_IP, SEMATTRS_NET_HOST_NAME, SEMATTRS_NET_HOST_PORT, SEMATTRS_NET_PEER_IP,
    SEMATTRS_NET_PEER_NAME, SEMATTRS_NET_PEER_PORT, SEMATTRS_NET_TRANSPORT, SEMATTRS_PEER_SERVICE, SEMATTRS_RPC_GRPC_STATUS_CODE,
    SEMATTRS_RPC_SYSTEM, Tags, createAttributeContainer, createTelemetryItem, eDependencyTypes, eOTelSpanKind, eOTelSpanStatusCode,
    fieldRedaction, getDependencyTarget, getHttpMethod, getHttpStatusCode, getHttpUrl, getLocationIp, getUrl, getUserAgent,
    hrTimeToMilliseconds, isSqlDB, isSyntheticSource, urlGetPathName
} from "@microsoft/applicationinsights-core-js";
import { ILazyValue, arrIncludes, asString, getLazy, isNullOrUndefined, strLower, strStartsWith } from "@nevware21/ts-utils";
import { STR_EMPTY, UNDEFINED_VALUE } from "../../InternalConstants";

/**
 * Azure SDK namespace.
 * @internal
 */
const AzNamespace = "az.namespace";
const AzResourceNamespace = "azure.resource_provider.namespace";

/**
 * Azure SDK Eventhub.
 * @internal
 */
const MicrosoftEventHub = "Microsoft.EventHub";

/**
 * Azure SDK message bus destination.
 * @internal
 */
const MessageBusDestination = "message_bus.destination";

/**
 * AI time since enqueued attribute.
 * @internal
 */
const TIME_SINCE_ENQUEUED = "timeSinceEnqueued";

const PORT_REGEX: ILazyValue<RegExp> = (/*#__PURE__*/ getLazy(() => new RegExp(/(https?)(:\/\/.*)(:\d+)(\S*)/)));
const HTTP_DOT = (/*#__PURE__*/ "http.");

const _MS_PROCESSED_BY_METRICS_EXTRACTORS = (/* #__PURE__*/"_MS.ProcessedByMetricExtractors");

/**
 * Legacy HTTP semantic convention values
 * @internal
 */
const _ignoreSemanticValues: ILazyValue<string[]> = (/* #__PURE__*/ getLazy(_initIgnoreSemanticValues));

/* #__NO_SIDE_EFFECTS__ */
function _initIgnoreSemanticValues(): string[] {
    return [
        // Internal Microsoft attributes
        _MS_PROCESSED_BY_METRICS_EXTRACTORS,

        // Legacy HTTP semantic values
        SEMATTRS_NET_PEER_IP,
        SEMATTRS_NET_PEER_NAME,
        SEMATTRS_NET_HOST_IP,
        SEMATTRS_PEER_SERVICE,
        SEMATTRS_HTTP_USER_AGENT,
        SEMATTRS_HTTP_METHOD,
        SEMATTRS_HTTP_URL,
        SEMATTRS_HTTP_STATUS_CODE,
        SEMATTRS_HTTP_ROUTE,
        SEMATTRS_HTTP_HOST,
        SEMATTRS_DB_SYSTEM,
        SEMATTRS_DB_STATEMENT,
        SEMATTRS_DB_OPERATION,
        SEMATTRS_DB_NAME,
        SEMATTRS_RPC_SYSTEM,
        SEMATTRS_RPC_GRPC_STATUS_CODE,
        SEMATTRS_EXCEPTION_TYPE,
        SEMATTRS_EXCEPTION_MESSAGE,
        SEMATTRS_EXCEPTION_STACKTRACE,
        SEMATTRS_HTTP_SCHEME,
        SEMATTRS_HTTP_TARGET,
        SEMATTRS_HTTP_FLAVOR,
        SEMATTRS_NET_TRANSPORT,
        SEMATTRS_NET_HOST_NAME,
        SEMATTRS_NET_HOST_PORT,
        SEMATTRS_NET_PEER_PORT,
        SEMATTRS_HTTP_CLIENT_IP,
        SEMATTRS_ENDUSER_ID,
        HTTP_DOT + "status_text",

        // http Semabtic conventions
        ATTR_CLIENT_ADDRESS,
        ATTR_CLIENT_PORT,
        ATTR_SERVER_ADDRESS,
        ATTR_SERVER_PORT,
        ATTR_URL_FULL,
        ATTR_URL_PATH,
        ATTR_URL_QUERY,
        ATTR_URL_SCHEME,
        ATTR_ERROR_TYPE,
        ATTR_NETWORK_LOCAL_ADDRESS,
        ATTR_NETWORK_LOCAL_PORT,
        ATTR_NETWORK_PROTOCOL_NAME,
        ATTR_NETWORK_PEER_ADDRESS,
        ATTR_NETWORK_PEER_PORT,
        ATTR_NETWORK_PROTOCOL_VERSION,
        ATTR_NETWORK_TRANSPORT,
        ATTR_USER_AGENT_ORIGINAL,
        ATTR_HTTP_REQUEST_METHOD,
        ATTR_HTTP_RESPONSE_STATUS_CODE,
        ATTR_EXCEPTION_TYPE,
        ATTR_EXCEPTION_MESSAGE,
        ATTR_EXCEPTION_STACKTRACE,
        EXP_ATTR_ENDUSER_ID,
        EXP_ATTR_ENDUSER_PSEUDO_ID,
        EXP_ATTR_SYNTHETIC_TYPE
    ];
}

function _populateTagsFromSpan(telemetryItem: ITelemetryItem, span: IReadableSpan, contextKeys: IContextTagKeys, config: IConfiguration): void {

    let tags: Tags = telemetryItem.tags = (telemetryItem.tags || [] as Tags);
    let container = span.attribContainer || createAttributeContainer(span.attributes);

    tags[contextKeys.operationId] = span.spanContext().traceId;
    if ((span.parentSpanContext || {}).spanId) {
        tags[contextKeys.operationParentId] = span.parentSpanContext.spanId;
    }

    // Map OpenTelemetry enduser attributes to Application Insights user attributes
    const endUserId = container.get(ATTR_ENDUSER_ID);
    if (endUserId) {
        tags[contextKeys.userAuthUserId] = asString(endUserId);
    }

    const endUserPseudoId = container.get(ATTR_ENDUSER_PSEUDO_ID);
    if (endUserPseudoId) {
        tags[contextKeys.userId] = asString(endUserPseudoId);
    }

    const httpUserAgent = getUserAgent(container);
    if (httpUserAgent) {
        tags["ai.user.userAgent"] = String(httpUserAgent);
    }
    if (isSyntheticSource(container)) {
        tags[contextKeys.operationSyntheticSource] = "True";
    }

    // Check for microsoft.client.ip first - this takes precedence over all other IP logic
    const microsoftClientIp = container.get(MicrosoftClientIp);
    if (microsoftClientIp) {
        tags[contextKeys.locationIp] = asString(microsoftClientIp);
    }

    if (span.kind === eOTelSpanKind.SERVER) {
        const httpMethod = getHttpMethod(container);
        // Only use the fallback IP logic for server spans if microsoft.client.ip is not set
        if (!microsoftClientIp) {
            tags[contextKeys.locationIp] = getLocationIp(container);
        }

        if (httpMethod) {
            const httpRoute = container.get(ATTR_HTTP_ROUTE);
            const httpUrl = getHttpUrl(container);
            tags[contextKeys.operationName] = span.name; // Default
            if (httpRoute) {
                // AiOperationName max length is 1024
                // https://github.com/MohanGsk/ApplicationInsights-Home/blob/master/EndpointSpecs/Schemas/Bond/ContextTagKeys.bond
                tags[contextKeys.operationName] = httpMethod + " " + fieldRedaction(asString(httpRoute), config);
            } else if (httpUrl) {
                try {
                    const urlPathName = fieldRedaction(urlGetPathName(asString(httpUrl)), config);
                    tags[contextKeys.operationName] = httpMethod + " " + urlPathName;
                } catch {
                    /* no-op */
                }
            }
        } else {
            tags[contextKeys.operationName] = span.name;
        }
    } else {
        let opName = container.get(contextKeys.operationName);
        if (opName) {
            tags[contextKeys.operationName] = opName as string;
        }
    }
    // TODO: Location IP TBD for non server spans
}

/**
 * Check to see if the key is in the list of known properties to ignore (exclude)
 * from the properties collection
 * @param key - the property key to check
 * @param contextKeys - The current context keys
 * @returns true if the key should be ignored, false otherwise
 */
function _isIgnorePropertiesKey(key: string, contextKeys: IContextTagKeys): boolean {
    let result = false;

    if (arrIncludes(_ignoreSemanticValues.v, key)) {
        // The key is in set of known keys to ignore
        result = true;
    } else if (strStartsWith(key, "microsoft.")) {
        // Ignoring all ALL keys starting with "microsoft."
        result = true;
    } else if (key === contextKeys.operationName) {
        // Ignoring the key if it is the operation name context tag
        result = true;
    }

    return result;
}

function _populatePropertiesFromAttributes(item: ITelemetryItem, contextKeys: IContextTagKeys, container: IAttributeContainer): void {
    if (container) {
        let baseData = item.baseData = (item.baseData || {});
        let properties: { [propertyName: string]: any } = baseData.properties = (baseData.properties || {});

        container.forEach((key: string, value) => {
            // Avoid duplication ignoring fields already mapped.
            if (!_isIgnorePropertiesKey(key, contextKeys)) {
                properties[key] = value;
            }
        });
    }
}

function _populateHttpDependencyProperties(dependencyTelemetry: IDependencyTelemetry, container: IAttributeContainer, httpMethod: OTelAttributeValue | undefined, config: IConfiguration): boolean {
    if (httpMethod) {
        // HTTP Dependency
        const httpUrl = getHttpUrl(container);
        if (httpUrl) {
            try {
                const pathName = urlGetPathName(asString(httpUrl));
                if (pathName) {
                    dependencyTelemetry.name = httpMethod + " " + fieldRedaction(pathName, config);
                }
            } catch {
                /* no-op */
            }
        }

        dependencyTelemetry.type = eDependencyTypes.Http;
        dependencyTelemetry.data = fieldRedaction(getUrl(container), config);
        const httpStatusCode = getHttpStatusCode(container);
        if (httpStatusCode) {
            dependencyTelemetry.responseCode = +httpStatusCode;
        }

        let target = getDependencyTarget(container);
        if (target) {
            try {
                // Remove default port
                const res = PORT_REGEX.v.exec(target);
                if (res !== null) {
                    const protocol = res[1];
                    const port = res[3];
                    if (
                        (protocol === "https" && port === ":443") ||
                        (protocol === "http" && port === ":80")
                    ) {
                        // Drop port
                        target = res[1] + res[2] + res[4];
                    }
                }
            } catch {
                /* no-op */
            }

            dependencyTelemetry.target = target;
        }
    }

    return !!httpMethod;
}

function _populateDbDependencyProperties(dependencyTelemetry: IDependencyTelemetry, container: IAttributeContainer, dbSystem: OTelAttributeValue | undefined): boolean {
    if (dbSystem) {
        // TODO: Remove special logic when Azure UX supports OpenTelemetry dbSystem
        if (String(dbSystem) === DBSYSTEMVALUES_MYSQL) {
            dependencyTelemetry.type = "mysql";
        } else if (String(dbSystem) === DBSYSTEMVALUES_POSTGRESQL) {
            dependencyTelemetry.type = "postgresql";
        } else if (String(dbSystem) === DBSYSTEMVALUES_MONGODB) {
            dependencyTelemetry.type = "mongodb";
        } else if (String(dbSystem) === DBSYSTEMVALUES_REDIS) {
            dependencyTelemetry.type = "redis";
        } else if (isSqlDB(String(dbSystem))) {
            dependencyTelemetry.type = "SQL";
        } else {
            dependencyTelemetry.type = String(dbSystem);
        }
        const dbStatement = container.get(SEMATTRS_DB_STATEMENT);
        const dbOperation = container.get(SEMATTRS_DB_OPERATION);
        if (dbStatement) {
            dependencyTelemetry.data = String(dbStatement);
        } else if (dbOperation) {
            dependencyTelemetry.data = String(dbOperation);
        }
        const target = getDependencyTarget(container);
        const dbName = container.get(SEMATTRS_DB_NAME);
        if (target) {
            dependencyTelemetry.target = dbName ? target + "|" + asString(dbName) : target;
        } else {
            dependencyTelemetry.target = dbName ? asString(dbName) : asString(dbSystem);
        }
    }

    return !!dbSystem;
}

function _populateRpcDependencyProperties(dependencyTelemetry: IDependencyTelemetry, container: IAttributeContainer, rpcSystem: OTelAttributeValue | undefined): boolean {
    if (rpcSystem) {
        if (strLower(rpcSystem) === "wcf") {
            dependencyTelemetry.type = eDependencyTypes.Wcf;
        } else {
            dependencyTelemetry.type = eDependencyTypes.Grpc;
        }
        const grpcStatusCode = container.get(SEMATTRS_RPC_GRPC_STATUS_CODE);
        if (!isNullOrUndefined(grpcStatusCode)) {
            dependencyTelemetry.responseCode = +grpcStatusCode;
        }
        const target = getDependencyTarget(container);
        if (target) {
            dependencyTelemetry.target = asString(target);
        } else {
            dependencyTelemetry.target = String(rpcSystem);
        }
    }

    return !!rpcSystem;
}

function createDependencyTelemetryItem(core: IAppInsightsCore, span: IReadableSpan, contextKeys: IContextTagKeys): ITelemetryItem {
    let container = span.attribContainer || createAttributeContainer(span.attributes);
    let dependencyType = "Dependency";

    if (span.kind === eOTelSpanKind.PRODUCER) {
        dependencyType = eDependencyTypes.QueueMessage;
    } else if (span.kind === eOTelSpanKind.INTERNAL && span.parentSpanContext) {
        dependencyType = eDependencyTypes.InProc;
    }

    let spanCtx = span.spanContext();
    let dependencyTelemetry: IDependencyTelemetry = {
        name: span.name, // Default
        id: spanCtx.spanId || core.getTraceCtx().spanId,
        success: (span.status || {}).code !== eOTelSpanStatusCode.ERROR,
        responseCode: 0,
        type: dependencyType,
        duration: hrTimeToMilliseconds(span.duration),
        data: STR_EMPTY,
        target: STR_EMPTY,
        properties: UNDEFINED_VALUE,
        measurements: UNDEFINED_VALUE
    };

    // Check for HTTP Dependency
    if (!_populateHttpDependencyProperties(dependencyTelemetry, container, getHttpMethod(container), core.config)) {
        // Check for DB Dependency
        if (!_populateDbDependencyProperties(dependencyTelemetry, container, container.get(SEMATTRS_DB_SYSTEM))) {
            // Check for Rpc Dependency
            _populateRpcDependencyProperties(dependencyTelemetry, container, container.get(SEMATTRS_RPC_SYSTEM));
        }
    }

    return createTelemetryItem<IDependencyTelemetry>(dependencyTelemetry, RemoteDependencyDataType, RemoteDependencyEnvelopeType.replace("{0}.", ""), core.logger);
}

function createRequestTelemetryItem(core: IAppInsightsCore, span: IReadableSpan, contextKeys: IContextTagKeys): ITelemetryItem {
    let container = span.attribContainer || createAttributeContainer(span.attributes);

    let spanCtx = span.spanContext();
    const requestData: IRequestTelemetry = {
        name: span.name, // Default
        id: spanCtx.spanId || core.getTraceCtx().spanId,
        success:
            span.status.code !== eOTelSpanStatusCode.UNSET
                ? span.status.code === eOTelSpanStatusCode.OK
                : (Number(getHttpStatusCode(container)) || 0) < 400,
        responseCode: 0,
        duration: hrTimeToMilliseconds(span.duration),
        source: undefined
    };
    const httpMethod = getHttpMethod(container);
    const grpcStatusCode = container.get(SEMATTRS_RPC_GRPC_STATUS_CODE);
    if (httpMethod) {
        requestData.url = fieldRedaction(getUrl(container), core.config);
        const httpStatusCode = getHttpStatusCode(container);
        if (httpStatusCode) {
            requestData.responseCode = +httpStatusCode;
        }
    } else if (grpcStatusCode) {
        requestData.responseCode = +grpcStatusCode;
    }

    return createTelemetryItem<IRequestTelemetry>(requestData, RequestDataType, RequestEnvelopeType.replace("{0}.", ""), core.logger);
}

export function createTelemetryItemFromSpan(core: IAppInsightsCore, span: IReadableSpan): ITelemetryItem | null {
    let telemetryItem: ITelemetryItem = null;
    let container = span.attribContainer || createAttributeContainer(span.attributes);
    let contextKeys: IContextTagKeys = CtxTagKeys;
    let kind = span.kind;
    if (kind == eOTelSpanKind.SERVER || kind == eOTelSpanKind.CONSUMER) {
        // Request
        telemetryItem = createRequestTelemetryItem(core, span, contextKeys);
    } else if (kind == eOTelSpanKind.CLIENT || kind == eOTelSpanKind.PRODUCER || kind == eOTelSpanKind.INTERNAL) {
        // RemoteDependency
        telemetryItem = createDependencyTelemetryItem(core, span, contextKeys);
    } else {
        //diag.error(`Unsupported span kind ${span.kind}`);
    }

    if (telemetryItem) {
        // Set start time for the telemetry item from the event, not the time it is being processed (the default)
        // The channel envelope creator uses this value when creating the envelope only when defined, otherwise it
        // uses the time when the item is being processed
        let baseData = telemetryItem.baseData = telemetryItem.baseData || {};
        baseData.startTime = new Date(hrTimeToMilliseconds(span.startTime));
        
        // Add dt extension to the telemetry item
        let ext = telemetryItem.ext = telemetryItem.ext || {};
        let dt = ext["dt"] = ext["dt"] || {};

        // Don't overwrite any existing values
        dt.spanId = dt.spanId || span.spanContext().spanId;
        dt.traceId = dt.traceId || span.spanContext().traceId;
        
        let traceFlags = span.spanContext().traceFlags;
        if (!isNullOrUndefined(traceFlags)) {
            dt.traceFlags = dt.traceFlags || traceFlags;
        }

        _populateTagsFromSpan(telemetryItem, span, contextKeys, core.config);
        _populatePropertiesFromAttributes(telemetryItem, contextKeys, container);

        let sampleRate = container.get("microsoft.sample_rate");
        if (!isNullOrUndefined(sampleRate)) {
            (telemetryItem as any).sampleRate = Number(sampleRate);
        }

        // Azure SDK
        let azNamespace = container.get(AzResourceNamespace) || container.get(AzNamespace);
        if (azNamespace) {
            if (span.kind === eOTelSpanKind.INTERNAL) {
                baseData.type = eDependencyTypes.InProc + " | " + azNamespace;
            }

            if (azNamespace === MicrosoftEventHub) {
                _parseEventHubSpan(telemetryItem, span);
            }
        }
    }

    return telemetryItem;
}

/**
 * Implementation of Mapping to Azure Monitor
 *
 * https://gist.github.com/lmolkova/e4215c0f44a49ef824983382762e6b92#mapping-to-azure-monitor-application-insights-telemetry
 * @internal
 */
function _parseEventHubSpan(telemetryItem: ITelemetryItem, span: IReadableSpan): void {
    let baseData = telemetryItem.baseData = telemetryItem.baseData || {};
    let container = span.attribContainer || createAttributeContainer(span.attributes);
    const namespace = container.get(AzResourceNamespace) || container.get(AzNamespace);
    const peerAddress = asString(container.get(SEMATTRS_NET_PEER_NAME) || container.get("peer.address") || "unknown").replace(/\/$/g, ""); // remove trailing "/"
    const messageBusDestination = (container.get(MessageBusDestination) || "unknown") as string;
    let baseType = baseData.type || "";
    let kind = span.kind;

    if (kind === eOTelSpanKind.CLIENT) {
        baseType = namespace;
        baseData.target = peerAddress + "/" + messageBusDestination;
    } else if (kind === eOTelSpanKind.PRODUCER) {
        baseType = "Queue Message | " + namespace;
        baseData.target = peerAddress + "/" + messageBusDestination;
    } else if (kind === eOTelSpanKind.CONSUMER) {
        baseType = "Queue Message | " + namespace;
        (baseData as any).source = peerAddress + "/" + messageBusDestination;

        let measurements = baseData.measurements = (baseData.measurements || {});
        let timeSinceEnqueued = container.get("timeSinceEnqueued");
        if (timeSinceEnqueued) {
            measurements[TIME_SINCE_ENQUEUED] = Number(timeSinceEnqueued);
        } else {
            let enqueuedTime = parseFloat(asString(container.get("enqueuedTime")));
            if (isNaN(enqueuedTime)) {
                enqueuedTime = 0;
            }

            measurements[TIME_SINCE_ENQUEUED] = hrTimeToMilliseconds(span.startTime) - enqueuedTime;
        }
    }

    baseData.type = baseType;
}
