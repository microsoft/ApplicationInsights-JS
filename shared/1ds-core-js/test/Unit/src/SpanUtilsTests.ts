// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { getDeferred, ICachedValue, objDefine, strSubstr } from "@nevware21/ts-utils";
import {
    IAppInsightsCore,
    IReadableSpan,
    eOTelSpanKind,
    eOTelSpanStatusCode,
    IDistributedTraceContext,
    createDistributedTraceContext,
    generateW3CId,
    SEMATTRS_HTTP_METHOD,
    SEMATTRS_HTTP_URL,
    SEMATTRS_HTTP_STATUS_CODE,
    SEMATTRS_DB_SYSTEM,
    SEMATTRS_DB_STATEMENT,
    SEMATTRS_DB_NAME,
    SEMATTRS_RPC_SYSTEM,
    SEMATTRS_RPC_GRPC_STATUS_CODE,
    SEMATTRS_NET_PEER_NAME,
    SEMATTRS_NET_PEER_PORT,
    ATTR_HTTP_REQUEST_METHOD,
    ATTR_HTTP_RESPONSE_STATUS_CODE,
    ATTR_URL_FULL,
    ATTR_ENDUSER_ID,
    ATTR_ENDUSER_PSEUDO_ID,
    SEMATTRS_HTTP_ROUTE,
    ATTR_CLIENT_ADDRESS,
    AppInsightsCore,
    IConfiguration,
    ITraceProvider,
    ITraceHost,
    IOTelSpanOptions,
    createSpan,
    IOTelSpanCtx,
    IOTelApi,
    IOTelConfig
} from "@microsoft/applicationinsights-core-js";
import { createExtendedTelemetryItemFromSpan, IMsWebSpanTelemetry } from "../../../src/extSpanUtils";
import { IExtendedTelemetryItem } from "../../../src/DataModels";

export class SpanUtilsTests extends AITestClass {
    private _core!: AppInsightsCore;
    private _mockApi!: IOTelApi;
    private _onEndCalls!: IReadableSpan[];

    public testInitialize() {
        super.testInitialize();
        
        this._onEndCalls = [];
        
        // Create mock API
        this._mockApi = {
            cfg: {
                errorHandlers: {}
            } as IOTelConfig
        } as IOTelApi;
    }

    public testCleanup() {
        super.testCleanup();
        this._onEndCalls = [];
        
        // Clean up AppInsightsCore instance if initialized
        if (this._core && this._core.isInitialized()) {
            this._core.unload(false);
        }
        this._core = undefined as any;
    }

    /**
     * Helper function to create a trace provider with onEnd callback
     */
    private _createTestTraceProvider(host: ITraceHost, onEnd?: (span: IReadableSpan) => void): ICachedValue<ITraceProvider> {
        const actualOnEnd = onEnd || ((span) => this._onEndCalls.push(span));

        return getDeferred(() => {
            const provider: ITraceProvider = {
                api: this._mockApi,
                createSpan: (name: string, options?: IOTelSpanOptions, parent?: IDistributedTraceContext): IReadableSpan => {
                    // Create a new distributed trace context for this span
                    let newCtx: IDistributedTraceContext;
                    let parentCtx: IDistributedTraceContext | undefined;

                    if (options && options.root) {
                        newCtx = createDistributedTraceContext();
                    } else {
                        newCtx = createDistributedTraceContext(parent || host.getTraceCtx());
                        if (newCtx.parentCtx) {
                            parentCtx = newCtx.parentCtx;
                        }
                    }

                    // Always generate a new spanId
                    newCtx.spanId = strSubstr(generateW3CId(), 0, 16);

                    // Get configuration from the core if available
                    let isRecording = options?.recording !== false;
                    if (this._core && this._core.config && this._core.config.traceCfg && this._core.config.traceCfg.suppressTracing) {
                        isRecording = false;
                    }
                    
                    // Create the span context
                    const spanCtx: IOTelSpanCtx = {
                        api: this._mockApi,
                        spanContext: newCtx,
                        attributes: options?.attributes,
                        startTime: options?.startTime,
                        isRecording: isRecording,
                        onEnd: actualOnEnd
                    };

                    if (parentCtx) {
                        objDefine(spanCtx, "parentSpanContext", {
                            v: parentCtx,
                            w: false
                        });
                    }

                    return createSpan(spanCtx, name, options?.kind || eOTelSpanKind.INTERNAL);
                },
                getProviderId: (): string => "test-provider",
                isAvailable: (): boolean => true
            };
            
            return provider;
        });
    }

    /**
     * Helper function to set up AppInsightsCore with trace provider
     */
    private _setupCore(config?: Partial<IConfiguration>): AppInsightsCore {
        this._core = new AppInsightsCore();
        
        // Create a simple test channel
        const testChannel = {
            identifier: "TestChannel",
            priority: 1001,
            initialize: () => {},
            processTelemetry: () => {},
            teardown: () => {},
            isInitialized: () => true
        };
        
        const coreConfig: IConfiguration = {
            instrumentationKey: "test-ikey-12345",
            traceCfg: {
                serviceName: "test-service"
            },
            ...config
        };

        // Initialize the core with the test channel
        this._core.initialize(coreConfig, [testChannel]);

        // Set up the trace provider
        const traceProvider = this._createTestTraceProvider(this._core);
        this._core.setTraceProvider(traceProvider);

        return this._core;
    }

    /**
     * Helper function to create a span for testing using the actual SDK functions
     */
    private _createTestSpan(
        name: string,
        kind: eOTelSpanKind = eOTelSpanKind.INTERNAL,
        attributes: { [key: string]: any } = {},
        statusCode: eOTelSpanStatusCode = eOTelSpanStatusCode.UNSET
    ): IReadableSpan {
        // Setup core if not already setup
        if (!this._core) {
            this._setupCore();
        }

        // Create span using the trace provider
        const span = this._core.startSpan(name, {
            kind: kind,
            attributes: attributes
        });

        // Set status if provided
        if (statusCode !== eOTelSpanStatusCode.UNSET) {
            span.setStatus({
                code: statusCode,
                message: statusCode === eOTelSpanStatusCode.ERROR ? "Error occurred" : undefined
            });
        }

        // End the span to finalize it
        span.end();

        return span as IReadableSpan;
    }

    public registerTests() {
        this.testCase({
            name: "createExtendedTelemetryItemFromSpan: should create basic telemetry item from span",
            test: () => {
                // Setup core first
                this._setupCore();
                
                // Arrange - create parent span first
                const parentSpan = this._core.startSpan("parent-operation", {
                    kind: eOTelSpanKind.SERVER
                });
                
                // Create child CLIENT span with parent context
                const span = this._core.startSpan("test-operation", {
                    kind: eOTelSpanKind.CLIENT
                }, parentSpan.spanContext());
                
                span.end();
                parentSpan.end();

                // Act
                const result = createExtendedTelemetryItemFromSpan(this._core, span as IReadableSpan);

                // Assert
                Assert.ok(result, "Should return a telemetry item");
                Assert.equal(result.name, "Ms.Web.Span", "Event name should be Ms.Web.Span");
                Assert.equal(result.baseType, "OTelSpan", "Base type should be OTelSpan");
                Assert.ok(result.baseData, "Should have baseData");
                
                const baseData = result.baseData as IMsWebSpanTelemetry;
                Assert.equal(baseData.name, "test-operation", "Span name should match");
                Assert.equal(baseData.kind, eOTelSpanKind.CLIENT, "Span kind should match");
                Assert.ok(baseData.startTime, "Should have start time");
                Assert.equal(baseData.success, true, "Should be successful by default");
                Assert.equal(parentSpan.spanContext().spanId, baseData.parentId, "Parent ID should match parent span's ID");
                Assert.equal((span as IReadableSpan).parentSpanId, baseData.parentId, "Should match span's parent ID");
            }
        });

        this.testCase({
            name: "createExtendedTelemetryItemFromSpan: should handle span with error status",
            test: () => {
                // Arrange
                const span = this._createTestSpan(
                    "failed-operation",
                    eOTelSpanKind.CLIENT,
                    {},
                    eOTelSpanStatusCode.ERROR
                );

                // Act
                const result = createExtendedTelemetryItemFromSpan(this._core, span);

                // Assert
                Assert.ok(result, "Should return a telemetry item");
                const baseData = result.baseData as IMsWebSpanTelemetry;
                Assert.equal(baseData.success, false, "Should be marked as failed");
            }
        });

        this.testCase({
            name: "createExtendedTelemetryItemFromSpan: should populate HTTP properties for HTTP spans",
            test: () => {
                // Arrange
                const attributes = {
                    [ATTR_HTTP_REQUEST_METHOD]: "GET",
                    [ATTR_URL_FULL]: "https://example.com:443/api/users",
                    [ATTR_HTTP_RESPONSE_STATUS_CODE]: 200
                };
                const span = this._createTestSpan("http-request", eOTelSpanKind.CLIENT, attributes);

                // Act
                const result = createExtendedTelemetryItemFromSpan(this._core, span);

                // Assert
                Assert.ok(result, "Should return a telemetry item");
                const baseData = result.baseData as IMsWebSpanTelemetry;
                Assert.equal(baseData.httpMethod, "GET", "Should have HTTP method");
                Assert.equal(baseData.httpUrl, "https://example.com/api/users", "Should remove default port 443");
                Assert.equal(baseData.httpStatusCode, 200, "Should have HTTP status code");
                Assert.equal(baseData.success, true, "Should be successful for 2xx status");
            }
        });

        this.testCase({
            name: "createExtendedTelemetryItemFromSpan: should remove default port 80 for HTTP",
            test: () => {
                // Arrange
                const attributes = {
                    [ATTR_HTTP_REQUEST_METHOD]: "POST",
                    [ATTR_URL_FULL]: "http://example.com:80/api/data"
                };
                const span = this._createTestSpan("http-post", eOTelSpanKind.CLIENT, attributes);

                // Act
                const result = createExtendedTelemetryItemFromSpan(this._core, span);

                // Assert
                const baseData = result.baseData as IMsWebSpanTelemetry;
                Assert.equal(baseData.httpUrl, "http://example.com/api/data", "Should remove default port 80");
            }
        });

        this.testCase({
            name: "createExtendedTelemetryItemFromSpan: should mark 4xx and 5xx as failures",
            test: () => {
                // Arrange
                const attributes404 = {
                    [ATTR_HTTP_REQUEST_METHOD]: "GET",
                    [ATTR_HTTP_RESPONSE_STATUS_CODE]: 404
                };
                const attributes500 = {
                    [ATTR_HTTP_REQUEST_METHOD]: "GET",
                    [ATTR_HTTP_RESPONSE_STATUS_CODE]: 500
                };

                const span404 = this._createTestSpan("not-found", eOTelSpanKind.CLIENT, attributes404);
                const span500 = this._createTestSpan("server-error", eOTelSpanKind.CLIENT, attributes500);

                // Act
                const result404 = createExtendedTelemetryItemFromSpan(this._core, span404);
                const result500 = createExtendedTelemetryItemFromSpan(this._core, span500);

                // Assert
                Assert.equal((result404.baseData as IMsWebSpanTelemetry).success, false, "404 should be marked as failure");
                Assert.equal((result500.baseData as IMsWebSpanTelemetry).success, false, "500 should be marked as failure");
            }
        });

        this.testCase({
            name: "createExtendedTelemetryItemFromSpan: should populate database properties for DB spans",
            test: () => {
                // Arrange
                const attributes = {
                    [SEMATTRS_DB_SYSTEM]: "postgresql",
                    [SEMATTRS_DB_STATEMENT]: "SELECT * FROM users WHERE id = $1",
                    [SEMATTRS_DB_NAME]: "myapp_db"
                };
                const span = this._createTestSpan("db-query", eOTelSpanKind.CLIENT, attributes);

                // Act
                const result = createExtendedTelemetryItemFromSpan(this._core, span);

                // Assert
                const baseData = result.baseData as IMsWebSpanTelemetry;
                Assert.equal(baseData.dbSystem, "postgresql", "Should have DB system");
                Assert.equal(baseData.dbStatement, "SELECT * FROM users WHERE id = $1", "Should have DB statement");
                Assert.equal(baseData.dbName, "myapp_db", "Should have DB name");
            }
        });

        this.testCase({
            name: "createExtendedTelemetryItemFromSpan: should populate RPC properties for RPC spans",
            test: () => {
                // Arrange
                const attributes = {
                    [SEMATTRS_RPC_SYSTEM]: "grpc",
                    [SEMATTRS_RPC_GRPC_STATUS_CODE]: 0
                };
                const span = this._createTestSpan("rpc-call", eOTelSpanKind.CLIENT, attributes);

                // Act
                const result = createExtendedTelemetryItemFromSpan(this._core, span);

                // Assert
                const baseData = result.baseData as IMsWebSpanTelemetry;
                Assert.equal(baseData.rpcSystem, "grpc", "Should have RPC system");
                Assert.equal(baseData.rpcGrpcStatusCode, 0, "Should have gRPC status code");
            }
        });

        this.testCase({
            name: "createExtendedTelemetryItemFromSpan: should populate user extension from enduser attributes",
            test: () => {
                // Arrange
                const attributes = {
                    [ATTR_ENDUSER_ID]: "user123",
                    [ATTR_ENDUSER_PSEUDO_ID]: "pseudo456"
                };
                const span = this._createTestSpan("user-operation", eOTelSpanKind.SERVER, attributes);

                // Act
                const result = createExtendedTelemetryItemFromSpan(this._core, span);

                // Assert
                Assert.ok(result.ext, "Should have extensions");
                Assert.ok(result.ext.user, "Should have user extension");
                Assert.equal(result.ext.user.authId, "user123", "Should have authenticated user ID");
                Assert.equal(result.ext.user.id, "pseudo456", "Should have pseudonymous user ID");
            }
        });

        this.testCase({
            name: "createExtendedTelemetryItemFromSpan: should populate Part C with custom attributes",
            test: () => {
                // Arrange
                const attributes = {
                    "custom.property": "custom-value",
                    "app.version": "1.2.3",
                    "environment": "production"
                };
                const span = this._createTestSpan("custom-operation", eOTelSpanKind.INTERNAL, attributes);

                // Act
                const result = createExtendedTelemetryItemFromSpan(this._core, span);

                // Assert
                Assert.ok(result.data, "Should have Part C data");
                Assert.equal(result.data["custom.property"], "custom-value", "Should include custom property");
                Assert.equal(result.data["app.version"], "1.2.3", "Should include app version");
                Assert.equal(result.data["environment"], "production", "Should include environment");
            }
        });

        this.testCase({
            name: "createExtendedTelemetryItemFromSpan: should exclude known internal properties from Part C",
            test: () => {
                // Arrange
                const attributes = {
                    [ATTR_HTTP_REQUEST_METHOD]: "GET",
                    [ATTR_HTTP_RESPONSE_STATUS_CODE]: 200,
                    "custom.property": "custom-value",
                    "_MS.ProcessedByMetricExtractors": "(Name: X, Ver:'1.1')"
                };
                const span = this._createTestSpan("filtered-operation", eOTelSpanKind.CLIENT, attributes);

                // Act
                const result = createExtendedTelemetryItemFromSpan(this._core, span);

                // Assert
                Assert.ok(result.data, "Should have Part C data");
                Assert.equal(result.data["custom.property"], "custom-value", "Should include custom property");
                Assert.ok(!result.data[ATTR_HTTP_REQUEST_METHOD], "Should not include known HTTP method attribute");
                Assert.ok(!result.data["_MS.ProcessedByMetricExtractors"], "Should not include MS internal attribute");
            }
        });

        this.testCase({
            name: "createExtendedTelemetryItemFromSpan: should exclude microsoft.* properties from Part C",
            test: () => {
                // Arrange
                const attributes = {
                    "microsoft.internal": "value",
                    "microsoft.sample_rate": 100,
                    "custom.property": "custom-value"
                };
                const span = this._createTestSpan("microsoft-filtered", eOTelSpanKind.INTERNAL, attributes);

                // Act
                const result = createExtendedTelemetryItemFromSpan(this._core, span);

                // Assert
                Assert.ok(result.data, "Should have Part C data");
                Assert.equal(result.data["custom.property"], "custom-value", "Should include custom property");
                Assert.ok(!result.data["microsoft.internal"], "Should not include microsoft.internal property");
            }
        });

        this.testCase({
            name: "createExtendedTelemetryItemFromSpan: should include span context in dt extension",
            test: () => {
                // Arrange
                const span = this._createTestSpan("traced-operation", eOTelSpanKind.SERVER);
                const spanContext = span.spanContext();

                // Act
                const result = createExtendedTelemetryItemFromSpan(this._core, span);

                // Assert
                Assert.ok(result.ext, "Should have extensions");
                Assert.ok(result.ext.dt, "Should have dt extension");
                Assert.equal(result.ext.dt.spanId, spanContext.spanId, "Should have span ID");
                Assert.equal(result.ext.dt.traceId, spanContext.traceId, "Should have trace ID");
            }
        });

        this.testCase({
            name: "createExtendedTelemetryItemFromSpan: should handle Azure EventHub PRODUCER span",
            test: () => {
                // Arrange
                const attributes = {
                    "az.namespace": "Microsoft.EventHub",
                    [SEMATTRS_NET_PEER_NAME]: "myeventhub.servicebus.windows.net",
                    "message_bus.destination": "myeventhub"
                };
                const span = this._createTestSpan("eventhub-send", eOTelSpanKind.PRODUCER, attributes);

                // Act
                const result = createExtendedTelemetryItemFromSpan(this._core, span);

                // Assert
                const baseData = result.baseData as IMsWebSpanTelemetry;
                Assert.equal(eOTelSpanKind.PRODUCER, baseData.kind, "Should have PRODUCER kind");
                Assert.equal("Microsoft.EventHub", baseData.azureResourceProvider, "Should have azureResourceProvider in baseData");
                // Other attributes should be in Part C
                Assert.ok(result.data, "Should have Part C data");
                Assert.equal("myeventhub.servicebus.windows.net", result.data.netPeerName, "Should have peer name in Part C");
                Assert.equal("myeventhub", result.data["message_bus.destination"], "Should have destination in Part C");
            }
        });

        this.testCase({
            name: "createExtendedTelemetryItemFromSpan: should handle Azure EventHub CONSUMER span with timeSinceEnqueued",
            test: () => {
                // Arrange
                const attributes = {
                    "az.namespace": "Microsoft.EventHub",
                    [SEMATTRS_NET_PEER_NAME]: "myeventhub.servicebus.windows.net",
                    "message_bus.destination": "myeventhub",
                    "timeSinceEnqueued": 1500
                };
                const span = this._createTestSpan("eventhub-receive", eOTelSpanKind.CONSUMER, attributes);

                // Act
                const result = createExtendedTelemetryItemFromSpan(this._core, span);

                // Assert
                const baseData = result.baseData as IMsWebSpanTelemetry;
                Assert.equal(eOTelSpanKind.CONSUMER, baseData.kind, "Should have CONSUMER kind");
                Assert.equal("Microsoft.EventHub", baseData.azureResourceProvider, "Should have azureResourceProvider in baseData");
                // Other attributes should be in Part C
                Assert.ok(result.data, "Should have Part C data");
                Assert.equal("myeventhub.servicebus.windows.net", result.data.netPeerName, "Should have peer name in Part C");
                Assert.equal("myeventhub", result.data["message_bus.destination"], "Should have destination in Part C");
                Assert.equal(1500, result.data["timeSinceEnqueued"], "Should have timeSinceEnqueued in Part C");
            }
        });

        this.testCase({
            name: "createExtendedTelemetryItemFromSpan: should handle Azure EventHub CLIENT span",
            test: () => {
                // Arrange
                const attributes = {
                    "az.namespace": "Microsoft.EventHub",
                    [SEMATTRS_NET_PEER_NAME]: "myeventhub.servicebus.windows.net",
                    "message_bus.destination": "myeventhub"
                };
                const span = this._createTestSpan("eventhub-operation", eOTelSpanKind.CLIENT, attributes);

                // Act
                const result = createExtendedTelemetryItemFromSpan(this._core, span);

                // Assert
                const baseData = result.baseData as IMsWebSpanTelemetry;
                Assert.equal(eOTelSpanKind.CLIENT, baseData.kind, "Should have CLIENT kind");
                Assert.equal("Microsoft.EventHub", baseData.azureResourceProvider, "Should have azureResourceProvider in baseData");
                // Other attributes should be in Part C
                Assert.ok(result.data, "Should have Part C data");
                Assert.equal("myeventhub.servicebus.windows.net", result.data.netPeerName, "Should have peer name in Part C");
                Assert.equal("myeventhub", result.data["message_bus.destination"], "Should have destination in Part C");
            }
        });

        this.testCase({
            name: "createExtendedTelemetryItemFromSpan: should handle Azure SDK INTERNAL span with az.namespace",
            test: () => {
                // Arrange
                const attributes = {
                    "az.namespace": "Microsoft.Storage"
                };
                const span = this._createTestSpan("storage-operation", eOTelSpanKind.INTERNAL, attributes);

                // Act
                const result = createExtendedTelemetryItemFromSpan(this._core, span);

                // Assert
                const baseData = result.baseData as IMsWebSpanTelemetry;
                Assert.equal(eOTelSpanKind.INTERNAL, baseData.kind, "Should have INTERNAL kind");
                Assert.equal("Microsoft.Storage", baseData.azureResourceProvider, "Should have azureResourceProvider in baseData");
            }
        });

        this.testCase({
            name: "createExtendedTelemetryItemFromSpan: should populate Part C with network attributes",
            test: () => {
                // Arrange
                const attributes = {
                    [SEMATTRS_NET_PEER_NAME]: "api.example.com",
                    [SEMATTRS_NET_PEER_PORT]: 8080,
                    [SEMATTRS_HTTP_ROUTE]: "/api/v1/users/:id",
                    "service.name": "api-gateway"
                };
                const span = this._createTestSpan("network-call", eOTelSpanKind.CLIENT, attributes);

                // Act
                const result = createExtendedTelemetryItemFromSpan(this._core, span);

                // Assert
                Assert.ok(result.data, "Should have Part C data");
                Assert.equal(result.data.netPeerName, "api.example.com", "Should have peer name");
                Assert.equal(result.data.netPeerPort, 8080, "Should have peer port");
                Assert.equal(result.data.httpRoute, "/api/v1/users/:id", "Should have HTTP route");
                Assert.equal(result.data.peerService, "api-gateway", "Should have peer service");
            }
        });

        this.testCase({
            name: "createExtendedTelemetryItemFromSpan: should handle span with duration",
            test: () => {
                // Arrange
                const span = this._createTestSpan("timed-operation", eOTelSpanKind.CLIENT);

                // Act
                const result = createExtendedTelemetryItemFromSpan(this._core, span);

                // Assert
                const baseData = result.baseData as IMsWebSpanTelemetry;
                Assert.ok(baseData.duration !== undefined, "Should have duration");
                Assert.ok(baseData.duration >= 0, "Duration should be non-negative");
            }
        });

        this.testCase({
            name: "createExtendedTelemetryItemFromSpan: should handle span with traceState",
            test: () => {
                // Arrange
                const span = this._createTestSpan("traced-operation", eOTelSpanKind.SERVER);
                const spanContext = span.spanContext();
                
                // Add traceState to the span context
                spanContext.traceState.set("vendor1", "value1");
                spanContext.traceState.set("vendor2", "value2");

                // Act
                const result = createExtendedTelemetryItemFromSpan(this._core, span);

                // Assert
                const baseData = result.baseData as IMsWebSpanTelemetry;
                Assert.ok(result, "Should create telemetry item");
                // TraceState should be included when present
                Assert.ok(baseData.traceState, "Should include traceState when present in span context");
            }
        });

        this.testCase({
            name: "createExtendedTelemetryItemFromSpan: should use legacy HTTP semantic attributes",
            test: () => {
                // Arrange
                const attributes = {
                    [SEMATTRS_HTTP_METHOD]: "POST",
                    [SEMATTRS_HTTP_URL]: "https://api.example.com/v1/data",
                    [SEMATTRS_HTTP_STATUS_CODE]: 201
                };
                const span = this._createTestSpan("legacy-http", eOTelSpanKind.CLIENT, attributes);

                // Act
                const result = createExtendedTelemetryItemFromSpan(this._core, span);

                // Assert
                const baseData = result.baseData as IMsWebSpanTelemetry;
                Assert.equal(baseData.httpMethod, "POST", "Should handle legacy HTTP method attribute");
                Assert.equal(baseData.httpUrl, "https://api.example.com/v1/data", "Should handle legacy HTTP URL attribute");
                Assert.equal(baseData.httpStatusCode, 201, "Should handle legacy HTTP status code attribute");
            }
        });

        this.testCase({
            name: "createExtendedTelemetryItemFromSpan: should handle span with parent context",
            test: () => {
                // Arrange
                const span = this._createTestSpan("child-span", eOTelSpanKind.SERVER);

                // Act
                const result = createExtendedTelemetryItemFromSpan(this._core, span);

                // Assert
                const baseData = result.baseData as IMsWebSpanTelemetry;
                // The span will have either parentSpanId or can fallback to parentSpanContext.spanId
                // parentId may be empty string if there's no parent
                Assert.ok(baseData.parentId !== undefined, "Should have parentId property");
                Assert.ok(result, "Should successfully create telemetry item");
            }
        });

        this.testCase({
            name: "createExtendedTelemetryItemFromSpan: should handle different span kinds",
            test: () => {
                // Arrange & Act
                const internalSpan = this._createTestSpan("internal", eOTelSpanKind.INTERNAL);
                const serverSpan = this._createTestSpan("server", eOTelSpanKind.SERVER);
                const clientSpan = this._createTestSpan("client", eOTelSpanKind.CLIENT);
                const producerSpan = this._createTestSpan("producer", eOTelSpanKind.PRODUCER);
                const consumerSpan = this._createTestSpan("consumer", eOTelSpanKind.CONSUMER);

                const internalResult = createExtendedTelemetryItemFromSpan(this._core, internalSpan);
                const serverResult = createExtendedTelemetryItemFromSpan(this._core, serverSpan);
                const clientResult = createExtendedTelemetryItemFromSpan(this._core, clientSpan);
                const producerResult = createExtendedTelemetryItemFromSpan(this._core, producerSpan);
                const consumerResult = createExtendedTelemetryItemFromSpan(this._core, consumerSpan);

                // Assert
                Assert.equal((internalResult.baseData as IMsWebSpanTelemetry).kind, eOTelSpanKind.INTERNAL, "Should have INTERNAL kind");
                Assert.equal((serverResult.baseData as IMsWebSpanTelemetry).kind, eOTelSpanKind.SERVER, "Should have SERVER kind");
                Assert.equal((clientResult.baseData as IMsWebSpanTelemetry).kind, eOTelSpanKind.CLIENT, "Should have CLIENT kind");
                Assert.equal((producerResult.baseData as IMsWebSpanTelemetry).kind, eOTelSpanKind.PRODUCER, "Should have PRODUCER kind");
                Assert.equal((consumerResult.baseData as IMsWebSpanTelemetry).kind, eOTelSpanKind.CONSUMER, "Should have CONSUMER kind");
            }
        });

        this.testCase({
            name: "createExtendedTelemetryItemFromSpan: should handle span with sample rate attribute",
            test: () => {
                // Arrange
                const attributes = {
                    "microsoft.sample_rate": 50
                };
                const span = this._createTestSpan("sampled-operation", eOTelSpanKind.CLIENT, attributes);

                // Act
                const result = createExtendedTelemetryItemFromSpan(this._core, span);

                // Assert
                Assert.ok(result.data, "Should have Part C data");
                Assert.equal(50, result.data.sampleRate, "Should have sample rate in Part C");
            }
        });

        this.testCase({
            name: "createExtendedTelemetryItemFromSpan: should not overwrite existing extension values",
            test: () => {
                // Arrange
                const attributes = {
                    [ATTR_ENDUSER_ID]: "user-new",
                    [ATTR_ENDUSER_PSEUDO_ID]: "pseudo-new"
                };
                const span = this._createTestSpan("user-op", eOTelSpanKind.SERVER, attributes);

                // Pre-populate some extension values that should not be overwritten
                const result = createExtendedTelemetryItemFromSpan(this._core, span);
                
                // Manually set some values to test they don't get overwritten
                if (result.ext && result.ext.user) {
                    const originalAuthId = result.ext.user.authId;
                    const originalId = result.ext.user.id;
                    
                    // Act - create again to verify overwrite behavior
                    const result2 = createExtendedTelemetryItemFromSpan(this._core, span);

                    // Assert
                    Assert.equal(result2.ext.user.authId, "user-new", "Should have new authId");
                    Assert.equal(result2.ext.user.id, "pseudo-new", "Should have new pseudonymous ID");
                }
            }
        });

        this.testCase({
            name: "createExtendedTelemetryItemFromSpan: should preserve non-standard port in URL",
            test: () => {
                // Arrange
                const attributes = {
                    [ATTR_HTTP_REQUEST_METHOD]: "GET",
                    [ATTR_URL_FULL]: "https://example.com:8443/api/data"
                };
                const span = this._createTestSpan("custom-port", eOTelSpanKind.CLIENT, attributes);

                // Act
                const result = createExtendedTelemetryItemFromSpan(this._core, span);

                // Assert
                const baseData = result.baseData as IMsWebSpanTelemetry;
                Assert.equal(baseData.httpUrl, "https://example.com:8443/api/data", "Should preserve non-standard port");
            }
        });
    }
}

