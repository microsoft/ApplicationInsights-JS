// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
    ATTR_CLIENT_ADDRESS, ATTR_CLIENT_PORT, ATTR_ENDUSER_ID, ATTR_ENDUSER_PSEUDO_ID, ATTR_ERROR_TYPE, ATTR_EXCEPTION_MESSAGE,
    ATTR_EXCEPTION_STACKTRACE, ATTR_EXCEPTION_TYPE, ATTR_HTTP_REQUEST_METHOD, ATTR_HTTP_RESPONSE_STATUS_CODE, ATTR_NETWORK_LOCAL_ADDRESS,
    ATTR_NETWORK_LOCAL_PORT, ATTR_NETWORK_PEER_ADDRESS, ATTR_NETWORK_PEER_PORT, ATTR_NETWORK_PROTOCOL_NAME, ATTR_NETWORK_PROTOCOL_VERSION,
    ATTR_NETWORK_TRANSPORT, ATTR_SERVER_ADDRESS, ATTR_SERVER_PORT, ATTR_URL_FULL, ATTR_URL_PATH, ATTR_URL_QUERY, ATTR_URL_SCHEME,
    ATTR_USER_AGENT_ORIGINAL, EXP_ATTR_ENDUSER_ID, EXP_ATTR_ENDUSER_PSEUDO_ID, EXP_ATTR_SYNTHETIC_TYPE, IAppInsightsCore,
    IAttributeContainer, IConfiguration, IReadableSpan, OTelAttributeValue, SEMATTRS_DB_NAME, SEMATTRS_DB_OPERATION, SEMATTRS_DB_STATEMENT,
    SEMATTRS_DB_SYSTEM, SEMATTRS_ENDUSER_ID, SEMATTRS_EXCEPTION_MESSAGE, SEMATTRS_EXCEPTION_STACKTRACE, SEMATTRS_EXCEPTION_TYPE,
    SEMATTRS_HTTP_CLIENT_IP, SEMATTRS_HTTP_FLAVOR, SEMATTRS_HTTP_HOST, SEMATTRS_HTTP_METHOD, SEMATTRS_HTTP_ROUTE, SEMATTRS_HTTP_SCHEME,
    SEMATTRS_HTTP_STATUS_CODE, SEMATTRS_HTTP_TARGET, SEMATTRS_HTTP_URL, SEMATTRS_HTTP_USER_AGENT, SEMATTRS_NET_HOST_IP,
    SEMATTRS_NET_HOST_NAME, SEMATTRS_NET_HOST_PORT, SEMATTRS_NET_PEER_IP, SEMATTRS_NET_PEER_NAME, SEMATTRS_NET_PEER_PORT,
    SEMATTRS_NET_TRANSPORT, SEMATTRS_PEER_SERVICE, SEMATTRS_RPC_GRPC_STATUS_CODE, SEMATTRS_RPC_SYSTEM, createAttributeContainer,
    eOTelSpanKind, eOTelSpanStatusCode, fieldRedaction, getHttpClientIp, getHttpHost, getHttpMethod, getHttpScheme, getHttpStatusCode,
    getHttpUrl, getSyntheticType, getUserAgent, hrTimeToMilliseconds, toISOString
} from "@microsoft/applicationinsights-core-js";
import {
    ILazyValue, arrIncludes, asString, getLazy, getNavigator, isBoolean, isNullOrUndefined, isNumber, isString, strLower, strStartsWith,
    throwError
} from "@nevware21/ts-utils";
import { IExtendedTelemetryItem } from "./DataModels";
import { STR_NOT_SPECIFIED } from "./InternalConstants";

/**
 * Azure SDK namespace.
 * @internal
 */
const AzNamespace = "az.namespace";
const AzResourceNamespace = "azure.resource_provider.namespace";

const PORT_REGEX: ILazyValue<RegExp> = (/*#__PURE__*/ getLazy(() => new RegExp(/(https?)(:\/\/.*)(:\d+)(\S*)/)));
const HTTP_DOT = "http.";

const _MS_PROCESSED_BY_METRICS_EXTRACTORS = "_MS.ProcessedByMetricExtractors";

/**
 * Legacy HTTP semantic convention values
 * @internal
 */
const _ignoreSemanticValues: ILazyValue<string[]> = (/* #__PURE__*/ getLazy(_initIgnoreSemanticValues));

/**
 * OTelSpan common schema Part B telemetry definition
 */
export interface IMsWebSpanTelemetry {
    /**
     * The span name is a human-readable string which concisely identifies the work
     * represented by the Span, for example, an RPC method name, a function name, or
     * the name of a subtask or stage within a larger computation. The span name should
     * be the most general string that identifies a (statistically) interesting class
     * of Spans, rather than individual Span instances. That is, "get_user" is a
     * reasonable name, while "get_user/314159", where "314159" is a user ID, is not a
     * good name due to its high cardinality.
     * @see [OpenTelemetry Span Name Guidelines](https://github.com/open-telemetry/opentelemetry-specification/blob/main/specification/trace/api.md#span)
     * @example
     * ```json
     * "get_user"
     * ```
     */
    name: string;

    /**
     * Based on OpenTelemetry definition of SpanKind
     * it is the type of span. Can be used to specify additional relationships between
     * spans in addition to a parent/child relationship.
     * @example
     * ```json
     * 2
     * ```
     */
    kind: eOTelSpanKind;

    /**
     * Start time of the span. This field must be formatted in UTC ISO8601
     * format, with a trailing 'Z' character. Note: the number of decimal
     * seconds digits provided is variable (and unspecified). Consumers
     * should handle this, i.e. managed code consumers should not use format
     * "O" for parsing as it specifies a fixed length.
     * @example
     * ```json
     * "2018-09-05T22:51:22.4936Z"
     * ```
     */
    startTime: string;

    /**
     * Boolean to indicate the status of the operation whether it was a success or
     * failed. This field is required. When not set explicitly to false - a request is
     * considered to be successful.
     * @example
     * ```json
     * true
     * ```
     */
    success: boolean;

    /**
     * Status message for the span execution. This may be the exception type, error
     * code or friendly message to indicate status for the operation. This can be used
     * to report generic status for spans (not protocol-specific).
     * @remark
     * If you report `httpStatusCode`, `statusMessage` should not be reported and will be ignored.
     * @example
     * ```json
     * "Connection Failure"
     * ```
     */
    statusMessage?: string;

    /**
     * The spanId of this span's parent span. If this is a root span, then this field
     * must be empty.
     * @example
     * ```json
     * "103067aa04a70897"
     * ```
     */
    parentId?: string;

    /**
     * For spans of type Client/Consumer for calls to Azure resources provide the Azure
     * resource provider who would be fullfilling the request. Please follow the list
     * provided [here](https://docs.microsoft.com/azure/azure-resource-manager/management/azure-services-resource-providers)
     * @example
     * ```json
     * "Microsoft.EventHub"
     * ```
     */
    azureResourceProvider?: string;

    /**
     * Links can be used to represent batched operations where a Span was initiated by
     * multiple initiating Spans, each representing a single incoming item being
     * processed in the batch. Another example is to link operation that is causally
     * related to multiple operations. The "allocate host" operation could potentially
     * fulfill multiple "create vm" operations.
     *
     * An array of related span links
     * @example
     * ```json
     * [{"toTraceId":"5eca8b153632494ba00f619d6877b134","toSpanId":"d4c1279b6e7b7c47"}]
     * ```
     */
    links?: string;

    /**
     * Duration of the span in milliseconds. This is the difference between
     * endTime (the Part A "time" field) and startTime.
     */
    duration?: number;

    /**
     * TraceState provides vendor-specific trace context information.
     * It is defined in the [W3C TraceContext specification](https://www.w3.org/TR/trace-context/#tracestate-header).
     * @example
     * ```json
     * "rojo=00f067aa0ba902b7,congo=t61rcWkgMzE"
     * ```
     */
    traceState?: string;

    /**
     * Additional properties
     */
    [key: string]: any;
}

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
        EXP_ATTR_SYNTHETIC_TYPE,

        // Azure SDK attributes are not included as they are not part of the span attributes
        AzNamespace,
        AzResourceNamespace,
        "az.client_request_id",
        "azure.client.id",
        "az.service_request_id",
        "azure.service.request.id"

    ];
}

function _applyExtValue<V = string>(ext: any, extName: any, name: string, value: V, overwriteExt: boolean ) {
    if (isString(value) || isNumber(value) || isBoolean(value)) {
        let target = ext[extName] = ext[extName] || {};
        _applyValue(target, name, value, overwriteExt);
    }
}

function _applyValue<V = string>(target: any, name: string, value: V, overwriteTarget: boolean ) {
    if (target) {
        if (isString(value) || isNumber(value) || isBoolean(value)) {
            let targetValue = target[name];
            if (!overwriteTarget && (targetValue || isString(targetValue) || isNumber(targetValue) || isBoolean(targetValue))) {
                value = targetValue;
            }

            target[name] = value;
        }
    }

    return target;
}

function _populateExtensionsFromSpan(telemetryItem: IExtendedTelemetryItem, span: IReadableSpan, container: IAttributeContainer): void {
    let ext = telemetryItem.ext = telemetryItem.ext || {};

    // Map OpenTelemetry enduser attributes to Application Insights user attributes
    const endUserId = container.get(ATTR_ENDUSER_ID);
    if (endUserId) {
        _applyExtValue(ext, "user", "authId", asString(endUserId), false);
    }

    const endUserPseudoId = container.get(ATTR_ENDUSER_PSEUDO_ID);
    if (endUserPseudoId) {
        _applyExtValue(ext, "user", "id", asString(endUserPseudoId), false);
    }
}

/**
 * Check to see if the key is in the list of known properties to ignore (exclude)
 * from part C properties population.
 * @param key - the property key to check
 * @param contextKeys - The current context keys
 * @returns true if the key should be ignored, false otherwise
 */
function _isIgnorePartCKey(key: string): boolean {
    let result = false;

    if (arrIncludes(_ignoreSemanticValues.v, key)) {
        // The key is in set of known keys to ignore
        result = true;
    } else if (strStartsWith(key, "microsoft.")) {
        // Ignoring all ALL keys starting with "microsoft."
        result = true;
    }

    return result;
}

function _populatePartC(item: IExtendedTelemetryItem, container: IAttributeContainer): void {
    if (container) {
        let partC = item.data = (item.data || {});

        _applyValue(partC, "httpHost", getHttpHost(container), false);
        _applyValue(partC, "httpScheme", getHttpScheme(container), false);
        _applyValue(partC, "httpClientIp", getHttpClientIp(container), false);
        _applyValue(partC, "httpUserAgent", getUserAgent(container), false);
        _applyValue(partC, "httpRoute", container.get(SEMATTRS_HTTP_ROUTE), false);

        _applyValue(partC, "netPeerName", container.get(SEMATTRS_NET_PEER_NAME), false);
        _applyValue(partC, "netPeerPort", container.get(SEMATTRS_NET_PEER_PORT), false);
        _applyValue(partC, "netPeerIp", container.get(SEMATTRS_NET_PEER_IP), false);
        _applyValue(partC, "peerService", container.get("service.name") || container.get(SEMATTRS_PEER_SERVICE), false);

        let syntheticSource = getSyntheticType(container);
        if (!!syntheticSource) {
            _applyValue(partC, "userAgentSyntheticType", syntheticSource, false);
        }

        let nav = getNavigator();
        if (nav && nav.userAgent) {
            _applyValue(partC, "userAgentOriginal", nav.userAgent, false);
        }

        // Azure SDK fields
        _applyValue(partC, "azureClientRequestId", container.get("azure.client.id") || container.get("az.client_request_id"), false);
        _applyValue(partC, "azureServiceRequestId", container.get("azure.service.request.id") || container.get("az.service_request_id"), false);


        let sampleRate = container.get("microsoft.sample_rate");
        if (!isNullOrUndefined(sampleRate)) {
            _applyValue(partC, "sampleRate", sampleRate, false);
        }

        container.forEach((key: string, value) => {
            // Avoid duplication ignoring fields already mapped.
            if (!_isIgnorePartCKey(key)) {
                partC[key] = value;
            }
        });
    }
}

function _populateHttpProperties(otelSpanTelemetry: IMsWebSpanTelemetry, container: IAttributeContainer, httpMethod: OTelAttributeValue | undefined, config: IConfiguration): void {
    if (httpMethod) {
        // Step the HTTP method
        _applyValue(otelSpanTelemetry, "httpMethod", httpMethod, false);

        // HTTP Dependency
        let httpUrl = getHttpUrl(container);
        if (httpUrl) {
            try {
                // Remove default port
                const res = PORT_REGEX.v.exec(asString(httpUrl));
                if (res !== null) {
                    const protocol = res[1];
                    const port = res[3];
                    if (
                        (protocol === "https" && port === ":443") ||
                        (protocol === "http" && port === ":80")
                    ) {
                        // Drop port
                        httpUrl = res[1] + res[2] + res[4];
                    }
                }
            } catch {
                /* no-op */
            }

            _applyValue(otelSpanTelemetry, "httpUrl", fieldRedaction(asString(httpUrl), config), false);
        }

        const httpStatusCode = getHttpStatusCode(container);
        if (httpStatusCode) {
            _applyValue(otelSpanTelemetry, "httpStatusCode", httpStatusCode, false);
        }
    }
}

function _populateDbProperties(otelSpanTelemetry: IMsWebSpanTelemetry, container: IAttributeContainer, dbSystem: OTelAttributeValue | undefined): void {
    if (dbSystem) {
        _applyValue(otelSpanTelemetry, "dbSystem", dbSystem, false);

        // Set the statement
        _applyValue(otelSpanTelemetry, "dbStatement", container.get(SEMATTRS_DB_STATEMENT) || container.get(SEMATTRS_DB_OPERATION), false);
        _applyValue(otelSpanTelemetry, "dbName", container.get(SEMATTRS_DB_NAME) || dbSystem || "<undefined>", false);
    }
}

function _populateRpcDependencyProperties(otelSpanTelemetry: IMsWebSpanTelemetry, container: IAttributeContainer, rpcSystem: OTelAttributeValue | undefined): void {
    if (rpcSystem) {
        _applyValue(otelSpanTelemetry, "rpcSystem", strLower(rpcSystem), false);
        _applyValue(otelSpanTelemetry, "rpcGrpcStatusCode", container.get(SEMATTRS_RPC_GRPC_STATUS_CODE), false);
    }
}

function _createOTelSpanTelemetryItem(core: IAppInsightsCore, span: IReadableSpan): IExtendedTelemetryItem {
    let container = span.attribContainer || createAttributeContainer(span.attributes);
    let spanCtx = span.spanContext();

    let statusCode = span.status ? span.status.code : eOTelSpanStatusCode.UNSET;

    let spanTelemetry: IMsWebSpanTelemetry = {
        name: span.name, // Default
        kind: span.kind,
        startTime: toISOString(new Date(hrTimeToMilliseconds(span.startTime))),
        success: statusCode !== eOTelSpanStatusCode.UNSET ? statusCode !== eOTelSpanStatusCode.ERROR : (Number(getHttpStatusCode(container)) || 0) < 400,
        duration: hrTimeToMilliseconds(span.duration)
        //azureResourceProvider: undefined, // Not currently supported
        //links: UNDEFINED_VALUE,         // Not currently supported
    };

    // Set the parentId if available
    let parentCtx = span.parentSpanContext || (spanCtx ? spanCtx.parentCtx : null);
    _applyValue(spanTelemetry, "parentId", span.parentSpanId || (parentCtx ? parentCtx.spanId : null), false);

    if (spanCtx) {
        let traceState = spanCtx.traceState;
        if (traceState && !traceState.isEmpty) {
            _applyValue(spanTelemetry, "traceState", traceState.hdrs(1)[0], false);
        }
    }

    _populateHttpProperties(spanTelemetry, container, getHttpMethod(container), core.config);
    _populateDbProperties(spanTelemetry, container, container.get(SEMATTRS_DB_SYSTEM));
    _populateRpcDependencyProperties(spanTelemetry, container, container.get(SEMATTRS_RPC_SYSTEM));

    _applyValue(spanTelemetry, "azureResourceProvider", container.get(AzResourceNamespace) || container.get(AzNamespace), false);

    return _createTelemetryItem<IMsWebSpanTelemetry>(spanTelemetry, span, "OTelSpan", "Ms.Web.Span");
}

function _createTelemetryItem<T>(item: T, span: IReadableSpan, baseType: string, eventName: string): IExtendedTelemetryItem {

    eventName = eventName || STR_NOT_SPECIFIED;

    if (isNullOrUndefined(item) ||
        isNullOrUndefined(baseType) ||
        isNullOrUndefined(eventName)) {
        throwError("Input doesn't contain all required fields");
    }
    
    let iKey = "";
    if ((item as any).iKey) {
        iKey = (item as any).iKey;
        delete (item as any).iKey;
    }

    let telemetryItem: IExtendedTelemetryItem = {
        name: eventName,
        time: toISOString(span.endTime ? new Date(hrTimeToMilliseconds(span.endTime)) : new Date()),
        iKey: iKey,                 // this will be set in TelemetryContext
        ext: {},                    // part A
        baseType,
        baseData: item as any,      // Part B
        data: {}                    // part C
    };

    return telemetryItem;
}

/**
 * Create an extended common schema telemetry item from the provided span
 * @param core - The app insights core instance
 * @param span - The span to create the telemetry item from
 * @returns A new extended telemetry item or null if the span kind is not supported
 */
export function createExtendedTelemetryItemFromSpan(core: IAppInsightsCore, span: IReadableSpan): IExtendedTelemetryItem | null {
    let telemetryItem: IExtendedTelemetryItem  = _createOTelSpanTelemetryItem(core, span);
    let container = span.attribContainer || createAttributeContainer(span.attributes);

    if (telemetryItem) {
        // Set the Span common schema fields

        // Set start time for the telemetry item from the event, not the time it is being processed (the default)
        // The channel envelope creator uses this value when creating the envelope only when defined, otherwise it
        // uses the time when the item is being processed
        let partB = telemetryItem.baseData = telemetryItem.baseData || {};
        partB.startTime = new Date(hrTimeToMilliseconds(span.startTime));
        
        let spanContext = span.spanContext();
        if (spanContext) {
            // Add dt extension to the telemetry item
            let ext = telemetryItem.ext = telemetryItem.ext || {};
            let dt = ext["dt"] = ext["dt"] || {};

            // Don't overwrite any existing values
            _applyValue(dt, "spanId", spanContext.spanId, false);
            _applyValue(dt, "traceId", spanContext.traceId, false);
            _applyValue(dt, "traceFlags", spanContext.traceFlags, false);
        }

        _populateExtensionsFromSpan(telemetryItem, span, container);
        _populatePartC(telemetryItem, container);

        // Azure SDK
    }

    return telemetryItem;
}
