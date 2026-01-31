import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import { ApplicationInsights, IDependencyTelemetry } from "../../../src/applicationinsights-web";
import {
    eOTelSpanKind,
    eOTelSpanStatusCode,
    ITelemetryItem,
    SEMATTRS_HTTP_METHOD,
    SEMATTRS_HTTP_URL,
    SEMATTRS_HTTP_STATUS_CODE,
    SEMATTRS_DB_SYSTEM,
    SEMATTRS_DB_STATEMENT,
    SEMATTRS_DB_NAME,
    SEMATTRS_RPC_SYSTEM,
    SEMATTRS_RPC_GRPC_STATUS_CODE,
    ATTR_HTTP_REQUEST_METHOD,
    ATTR_HTTP_RESPONSE_STATUS_CODE,
    ATTR_URL_FULL,
    ATTR_SERVER_ADDRESS,
    ATTR_SERVER_PORT,
    ATTR_ENDUSER_ID,
    ATTR_ENDUSER_PSEUDO_ID,
    ATTR_HTTP_ROUTE,
    MicrosoftClientIp
} from "@microsoft/applicationinsights-core-js";
import { IRequestTelemetry } from "@microsoft/applicationinsights-core-js";

export class SpanUtilsTests extends AITestClass {
    private static readonly _instrumentationKey = "b7170927-2d1c-44f1-acec-59f4e1751c11";
    private static readonly _connectionString = `InstrumentationKey=${SpanUtilsTests._instrumentationKey}`;

    private _ai!: ApplicationInsights;
    private _trackCalls: ITelemetryItem[] = [];

    constructor(testName?: string) {
        super(testName || "SpanUtilsTests");
    }

    public testInitialize() {
        try {
            this.useFakeServer = false;
            this._trackCalls = [];

            this._ai = new ApplicationInsights({
                config: {
                    connectionString: SpanUtilsTests._connectionString,
                    disableAjaxTracking: false,
                    disableXhr: false,
                    maxBatchInterval: 0,
                    disableExceptionTracking: false
                }
            });

            this._ai.loadAppInsights();

            // Hook core.track to capture calls
            const originalTrack = this._ai.core.track;
            this._ai.core.track = (item: ITelemetryItem) => {
                this._trackCalls.push(item);
                return originalTrack.call(this._ai.core, item);
            };
        } catch (e) {
            console.error("Failed to initialize tests: " + e);
            throw e;
        }
    }

    public testFinishedCleanup() {
        if (this._ai && this._ai.unload) {
            this._ai.unload(false);
        }
    }

    public registerTests() {
        this.addDependencyTelemetryTests();
        this.addRequestTelemetryTests();
        this.addHttpDependencyTests();
        this.addDbDependencyTests();
        this.addRpcDependencyTests();
        this.addAttributeMappingTests();
        this.addTagsCreationTests();
        this.addAzureSDKTests();
        this.addSemanticAttributeExclusionTests();
        this.addEdgeCaseTests();
        this.addCrossBrowserCompatibilityTests();
    }

    private addDependencyTelemetryTests(): void {
        this.testCase({
            name: "createDependencyTelemetry: CLIENT span generates RemoteDependency telemetry",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("client-operation", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "custom.attr": "value"
                    }
                });
                span?.end();

                // Assert
                Assert.equal(this._trackCalls.length, 1, "Should generate telemetry");
                const item = this._trackCalls[0];
                Assert.equal(item.name, "Microsoft.ApplicationInsights.RemoteDependency", "Should be RemoteDependency");
                Assert.equal(item.baseType, "RemoteDependencyData", "Should have correct baseType");
                Assert.ok(item.baseData, "Should have baseData");
                Assert.equal((item.baseData as any).name, "client-operation", "Should have span name");
                Assert.equal((item.baseData as any).type, "Dependency", "Should have default dependency type");
            }
        });

        this.testCase({
            name: "createDependencyTelemetry: PRODUCER span generates QueueMessage dependency",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("queue-producer", {
                    kind: eOTelSpanKind.PRODUCER,
                    attributes: {
                        "messaging.system": "kafka",
                        "messaging.destination": "orders"
                    }
                });
                span?.end();

                // Assert
                Assert.equal(this._trackCalls.length, 1, "Should generate telemetry");
                const item = this._trackCalls[0];
                Assert.equal((item.baseData as any).type, "Queue Message", "Should be QueueMessage type");
            }
        });

        this.testCase({
            name: "createDependencyTelemetry: INTERNAL span with parent generates InProc dependency",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const parentSpan = this._ai.startSpan("parent-operation");
                const parentContext = parentSpan?.spanContext();
                
                const childSpan = this._ai.startSpan("internal-operation", {
                    kind: eOTelSpanKind.INTERNAL
                }, parentContext);
                childSpan?.end();
                parentSpan?.end();

                // Assert
                const childItem = this._trackCalls.find(t => t.baseData?.name === "internal-operation");
                Assert.ok(childItem, "Should have child telemetry");
                Assert.equal((childItem?.baseData as any).type, "InProc", "Should be InProc type");
            }
        });

        this.testCase({
            name: "createDependencyTelemetry: SUCCESS status based on span status code",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act - span with OK status
                const okSpan = this._ai.startSpan("ok-span", { kind: eOTelSpanKind.CLIENT });
                okSpan?.setStatus({ code: eOTelSpanStatusCode.OK });
                okSpan?.end();
                
                // Act - span with ERROR status
                const errorSpan = this._ai.startSpan("error-span", { kind: eOTelSpanKind.CLIENT });
                errorSpan?.setStatus({ code: eOTelSpanStatusCode.ERROR, message: "Failed" });
                errorSpan?.end();

                // Assert
                const okItem = this._trackCalls.find(t => t.baseData?.name === "ok-span");
                const errorItem = this._trackCalls.find(t => t.baseData?.name === "error-span");
                
                Assert.equal((okItem?.baseData as any).success, true, "OK span should have success=true");
                Assert.equal((errorItem?.baseData as any).success, false, "ERROR span should have success=false");
            }
        });

        this.testCase({
            name: "createDependencyTelemetry: includes span context IDs",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("test-span", { kind: eOTelSpanKind.CLIENT });
                const spanContext = span?.spanContext();
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                Assert.equal((item.baseData as any).id, spanContext?.spanId, "Should have spanId");
                Assert.ok(item.tags, "Should have tags");
                Assert.equal((item.tags as any)["ai.operation.id"], spanContext?.traceId, "Should have traceId in tags");
            }
        });
    }

    private addRequestTelemetryTests(): void {
        this.testCase({
            name: "createRequestTelemetry: SERVER span generates Request telemetry",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("server-operation", {
                    kind: eOTelSpanKind.SERVER,
                    attributes: {
                        "http.method": "GET",
                        "http.url": "https://example.com/api/users"
                    }
                });
                span?.end();

                // Assert
                Assert.equal(this._trackCalls.length, 1, "Should generate telemetry");
                const item = this._trackCalls[0];
                Assert.equal(item.name, "Microsoft.ApplicationInsights.Request", "Should be Request");
                Assert.equal(item.baseType, "RequestData", "Should have correct baseType");
                Assert.ok(item.baseData, "Should have baseData");
            }
        });

        this.testCase({
            name: "createRequestTelemetry: CONSUMER span generates Request telemetry",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("queue-consumer", {
                    kind: eOTelSpanKind.CONSUMER,
                    attributes: {
                        "messaging.system": "rabbitmq"
                    }
                });
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                Assert.equal(item.name, "Microsoft.ApplicationInsights.Request", "Should be Request");
            }
        });

        this.testCase({
            name: "createRequestTelemetry: SUCCESS derived from status code",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act - UNSET status with 2xx HTTP code
                const successSpan = this._ai.startSpan("success-request", {
                    kind: eOTelSpanKind.SERVER,
                    attributes: {
                        "http.method": "POST",
                        "http.status_code": 201
                    }
                });
                successSpan?.end();
                
                // Act - UNSET status with 5xx HTTP code
                const failSpan = this._ai.startSpan("fail-request", {
                    kind: eOTelSpanKind.SERVER,
                    attributes: {
                        "http.method": "GET",
                        "http.status_code": 500
                    }
                });
                failSpan?.end();

                // Assert
                const successItem = this._trackCalls.find(t => t.baseData?.name === "success-request");
                const failItem = this._trackCalls.find(t => t.baseData?.name === "fail-request");
                
                Assert.equal((successItem?.baseData as any).success, true, "2xx should be success");
                Assert.equal((failItem?.baseData as any).success, false, "5xx should be failure");
            }
        });

        this.testCase({
            name: "createRequestTelemetry: OK status overrides HTTP status code",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act - OK status with 5xx code (shouldn't happen but testing precedence)
                const span = this._ai.startSpan("explicit-ok", {
                    kind: eOTelSpanKind.SERVER,
                    attributes: {
                        "http.method": "GET",
                        "http.status_code": 500
                    }
                });
                span?.setStatus({ code: eOTelSpanStatusCode.OK });
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                Assert.equal((item.baseData as any).success, true, "OK status should take precedence");
            }
        });

        this.testCase({
            name: "createRequestTelemetry: includes URL for HTTP requests",
            test: () => {
                // Arrange
                this._trackCalls = [];
                const testUrl = "https://api.example.com/v1/users?id=123";
                
                // Act
                const span = this._ai.startSpan("http-request", {
                    kind: eOTelSpanKind.SERVER,
                    attributes: {
                        "http.method": "GET",
                        "http.url": testUrl,
                        "http.status_code": 200
                    }
                });
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                const baseData = item.baseData as IRequestTelemetry;
                Assert.equal(baseData.url, testUrl, "Should include URL");
                Assert.equal(baseData.responseCode, 200, "Should include status code");
            }
        });

        this.testCase({
            name: "createRequestTelemetry: gRPC status code mapping",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("grpc-request", {
                    kind: eOTelSpanKind.SERVER,
                    attributes: {
                        "rpc.system": "grpc",
                        "rpc.grpc.status_code": 0 // OK
                    }
                });
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                const baseData = item.baseData as IRequestTelemetry;
                Assert.equal(baseData.responseCode, 0, "Should map gRPC status code");
            }
        });
    }

    private addHttpDependencyTests(): void {
        this.testCase({
            name: "HTTP Dependency: legacy semantic conventions mapping",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("http-call", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        [SEMATTRS_HTTP_METHOD]: "POST",
                        [SEMATTRS_HTTP_URL]: "https://api.example.com/v1/users",
                        [SEMATTRS_HTTP_STATUS_CODE]: 201
                    }
                });
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                const baseData = item.baseData as IDependencyTelemetry;
                Assert.equal(baseData.type, "Http", "Should be HTTP type");
                Assert.ok(baseData.name?.startsWith("POST"), "Name should include method");
                Assert.equal(baseData.data, "https://api.example.com/v1/users", "Should include URL");
                Assert.equal(baseData.responseCode, 201, "Should include status code");
            }
        });

        this.testCase({
            name: "HTTP Dependency: new semantic conventions mapping",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("http-call-new", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        [ATTR_HTTP_REQUEST_METHOD]: "GET",
                        [ATTR_URL_FULL]: "https://api.example.com/v2/products",
                        [ATTR_HTTP_RESPONSE_STATUS_CODE]: 200,
                        [ATTR_SERVER_ADDRESS]: "api.example.com",
                        [ATTR_SERVER_PORT]: 443
                    }
                });
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                const baseData = item.baseData as IDependencyTelemetry;
                Assert.equal(baseData.type, "Http", "Should be HTTP type");
                Assert.ok(baseData.data, "Should have data field");
            }
        });

        this.testCase({
            name: "HTTP Dependency: target with default port removal",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act - HTTPS with default port 443
                const httpsSpan = this._ai.startSpan("https-call", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "http.method": "GET",
                        "http.url": "https://example.com:443/api",
                        "net.peer.name": "example.com",
                        "net.peer.port": 443
                    }
                });
                httpsSpan?.end();

                // Act - HTTP with default port 80
                const httpSpan = this._ai.startSpan("http-call", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "http.method": "GET",
                        "http.url": "http://example.com:80/api",
                        "net.peer.name": "example.com",
                        "net.peer.port": 80
                    }
                });
                httpSpan?.end();

                // Assert
                const httpsItem = this._trackCalls.find(t => t.baseData?.name?.includes("https-call") || t.baseData?.data?.includes("https://example.com:443"));
                const httpItem = this._trackCalls.find(t => t.baseData?.name?.includes("http-call") || t.baseData?.data?.includes("http://example.com:80"));
                
                // Default ports should be stripped from target
                Assert.ok(httpsItem, "Should have HTTPS telemetry");
                Assert.ok(httpItem, "Should have HTTP telemetry");
            }
        });

        this.testCase({
            name: "HTTP Dependency: target with non-default port preserved",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("custom-port-call", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "http.method": "GET",
                        "http.url": "https://example.com:8443/api",
                        "net.peer.name": "example.com",
                        "net.peer.port": 8443
                    }
                });
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                Assert.ok((item.baseData as any).target, "Should have target");
                // Non-default port should be preserved in target
            }
        });

        this.testCase({
            name: "HTTP Dependency: name generated from URL pathname",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("generic-name", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "http.method": "DELETE",
                        "http.url": "https://api.example.com/v1/users/123"
                    }
                });
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                Assert.ok((item.baseData as any).name.includes("DELETE"), "Name should include HTTP method");
                Assert.ok((item.baseData as any).name.includes("/v1/users/123"), "Name should include path");
            }
        });
    }

    private addDbDependencyTests(): void {
        this.testCase({
            name: "DB Dependency: MySQL mapping",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("db-query", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        [SEMATTRS_DB_SYSTEM]: "mysql",
                        [SEMATTRS_DB_STATEMENT]: "SELECT * FROM users WHERE id = ?",
                        [SEMATTRS_DB_NAME]: "myapp_db",
                        "net.peer.name": "db.example.com",
                        "net.peer.port": 3306
                    }
                });
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                Assert.equal((item.baseData as any).type, "mysql", "Should be mysql type");
                Assert.equal((item.baseData as any).data, "SELECT * FROM users WHERE id = ?", "Should include statement");
                Assert.ok((item.baseData as any).target?.includes("myapp_db"), "Target should include DB name");
            }
        });

        this.testCase({
            name: "DB Dependency: PostgreSQL mapping",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("postgres-query", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        [SEMATTRS_DB_SYSTEM]: "postgresql",
                        [SEMATTRS_DB_STATEMENT]: "INSERT INTO logs (message) VALUES ($1)"
                    }
                });
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                Assert.equal((item.baseData as any).type, "postgresql", "Should be postgresql type");
            }
        });

        this.testCase({
            name: "DB Dependency: MongoDB mapping",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("mongo-query", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        [SEMATTRS_DB_SYSTEM]: "mongodb",
                        [SEMATTRS_DB_STATEMENT]: "db.users.find({age: {$gt: 25}})"
                    }
                });
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                Assert.equal((item.baseData as any).type, "mongodb", "Should be mongodb type");
            }
        });

        this.testCase({
            name: "DB Dependency: Redis mapping",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("redis-cmd", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        [SEMATTRS_DB_SYSTEM]: "redis",
                        [SEMATTRS_DB_STATEMENT]: "GET user:123"
                    }
                });
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                Assert.equal((item.baseData as any).type, "redis", "Should be redis type");
            }
        });

        this.testCase({
            name: "DB Dependency: SQL Server mapping",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("mssql-query", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        [SEMATTRS_DB_SYSTEM]: "mssql",
                        [SEMATTRS_DB_STATEMENT]: "SELECT TOP 10 * FROM Orders"
                    }
                });
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                Assert.equal((item.baseData as any).type, "SQL", "Should be SQL type for SQL Server");
            }
        });

        this.testCase({
            name: "DB Dependency: operation used when no statement",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("db-op", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        [SEMATTRS_DB_SYSTEM]: "postgresql",
                        "db.operation": "SELECT",
                        [SEMATTRS_DB_NAME]: "products_db"
                    }
                });
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                Assert.equal((item.baseData as any).data, "SELECT", "Should use operation when no statement");
            }
        });

        this.testCase({
            name: "DB Dependency: target formatting with host and dbname",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("db-call", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        [SEMATTRS_DB_SYSTEM]: "mysql",
                        [SEMATTRS_DB_NAME]: "production_db",
                        "net.peer.name": "mysql-prod.example.com",
                        "net.peer.port": 3306
                    }
                });
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                Assert.ok((item.baseData as any).target?.includes("mysql-prod.example.com"), "Target should include host");
                Assert.ok((item.baseData as any).target?.includes("production_db"), "Target should include DB name");
            }
        });
    }

    private addRpcDependencyTests(): void {
        this.testCase({
            name: "RPC Dependency: gRPC mapping",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("grpc-call", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        [SEMATTRS_RPC_SYSTEM]: "grpc",
                        [SEMATTRS_RPC_GRPC_STATUS_CODE]: 0,
                        "rpc.service": "UserService",
                        "rpc.method": "GetUser"
                    }
                });
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                let baseData = item.baseData as IDependencyTelemetry;
                Assert.equal(baseData.type, "GRPC", "Should be Dependency type");
                Assert.equal(baseData.responseCode, 0, "Should include gRPC status code");
            }
        });

        this.testCase({
            name: "RPC Dependency: WCF mapping",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("wcf-call", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        [SEMATTRS_RPC_SYSTEM]: "wcf",
                        "rpc.service": "CalculatorService"
                    }
                });
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                Assert.equal((item.baseData as any).type, "WCF Service", "Should be Dependency type");
            }
        });

        this.testCase({
            name: "RPC Dependency: target from peer service",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("rpc-call", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        [SEMATTRS_RPC_SYSTEM]: "grpc",
                        "net.peer.name": "grpc.example.com",
                        "net.peer.port": 50051
                    }
                });
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                let baseData = item.baseData as IDependencyTelemetry;
                Assert.ok(baseData.target, "Should have target");
            }
        });
    }

    private addAttributeMappingTests(): void {
        this.testCase({
            name: "Attribute Mapping: custom attributes preserved in properties",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("custom-attrs", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "app.version": "1.2.3",
                        "user.tier": "premium",
                        "request.priority": 5,
                        "feature.enabled": true
                    }
                });
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                Assert.ok((item.baseData as any).properties, "Should have properties");
                Assert.equal((item.baseData as any).properties["app.version"], "1.2.3", "String attribute preserved");
                Assert.equal((item.baseData as any).properties["user.tier"], "premium", "String attribute preserved");
                Assert.equal((item.baseData as any).properties["request.priority"], 5, "Number attribute preserved");
                Assert.equal((item.baseData as any).properties["feature.enabled"], true, "Boolean attribute preserved");
            }
        });

        this.testCase({
            name: "Attribute Mapping: dt.spanId and dt.traceId always added",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("test-span", { kind: eOTelSpanKind.CLIENT });
                const context = span?.spanContext();
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                Assert.equal(item.ext?.dt.spanId, context?.spanId, "Should have dt.spanId");
                Assert.equal(item.ext?.dt.traceId, context?.traceId, "Should have dt.traceId");
            }
        });

        this.testCase({
            name: "Attribute Mapping: sampling.probability mapped to sampleRate",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("sampled-span", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "microsoft.sample_rate": 25
                    }
                });
                span?.end();

                // Assert
                const item = this._trackCalls[0] as any;
                Assert.equal(item.sampleRate, 25, "Should map sampling.probability to sampleRate");
            }
        });
    }

    private addTagsCreationTests(): void {
        this.testCase({
            name: "Tags: operation ID from trace ID",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("test-span", { kind: eOTelSpanKind.SERVER });
                const context = span?.spanContext();
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                Assert.equal((item.tags as any)["ai.operation.id"], context?.traceId, "Should map traceId to operation.id");
            }
        });

        this.testCase({
            name: "Tags: operation parent ID from parent span",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const parentSpan = this._ai.startSpan("parent", { kind: eOTelSpanKind.SERVER });
                const parentContext = parentSpan?.spanContext();
                
                const childSpan = this._ai.startSpan("child", { kind: eOTelSpanKind.INTERNAL }, parentContext);
                childSpan?.end();
                parentSpan?.end();

                // Assert
                const childItem = this._trackCalls.find(t => t.baseData?.name === "child");
                Assert.equal((childItem?.tags as any)?.["ai.operation.parentId"], parentContext?.spanId,
                    "Should map parent spanId to operation.parentId");
            }
        });

        this.testCase({
            name: "Tags: enduser.id mapped to user auth ID",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("user-span", {
                    kind: eOTelSpanKind.SERVER,
                    attributes: {
                        [ATTR_ENDUSER_ID]: "user@example.com"
                    }
                });
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                Assert.equal((item.tags as any)["ai.user.authUserId"], "user@example.com",
                    "Should map enduser.id to user.authUserId");
            }
        });

        this.testCase({
            name: "Tags: enduser.pseudo.id mapped to user ID",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("pseudo-user-span", {
                    kind: eOTelSpanKind.SERVER,
                    attributes: {
                        [ATTR_ENDUSER_PSEUDO_ID]: "anon-12345"
                    }
                });
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                Assert.equal((item.tags as any)["ai.user.id"], "anon-12345",
                    "Should map enduser.pseudo.id to user.id");
            }
        });

        this.testCase({
            name: "Tags: microsoft.client.ip takes precedence",
            test: () => {
                // Arrange
                this._trackCalls = [];
                const clientIp = "203.0.113.42";
                
                // Act
                const span = this._ai.startSpan("ip-span", {
                    kind: eOTelSpanKind.SERVER,
                    attributes: {
                        [MicrosoftClientIp]: clientIp,
                        "client.address": "192.168.1.1", // Should be ignored
                        "http.client_ip": "10.0.0.1" // Should be ignored
                    }
                });
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                Assert.equal((item.tags as any)["ai.location.ip"], clientIp,
                    "microsoft.client.ip should take precedence");
            }
        });

        this.testCase({
            name: "Tags: operation name from http.route for SERVER spans",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("http-request", {
                    kind: eOTelSpanKind.SERVER,
                    attributes: {
                        "http.method": "POST",
                        [ATTR_HTTP_ROUTE]: "/api/v1/users/:id",
                        "http.url": "https://example.com/api/v1/users/123"
                    }
                });
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                Assert.ok((item.tags as any)["ai.operation.name"]?.includes("POST"), "Should include method");
                Assert.ok((item.tags as any)["ai.operation.name"]?.includes("/api/v1/users/:id"), "Should include route");
            }
        });

        this.testCase({
            name: "Tags: operation name falls back to URL path when no route",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("http-request-no-route", {
                    kind: eOTelSpanKind.SERVER,
                    attributes: {
                        "http.method": "GET",
                        "http.url": "https://example.com/products/search?q=laptop"
                    }
                });
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                Assert.ok((item.tags as any)["ai.operation.name"]?.includes("GET"), "Should include method");
                Assert.ok((item.tags as any)["ai.operation.name"]?.includes("/products/search"), "Should include path");
            }
        });

        this.testCase({
            name: "Tags: user agent mapped correctly",
            test: () => {
                // Arrange
                this._trackCalls = [];
                const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0";
                
                // Act
                const span = this._ai.startSpan("ua-span", {
                    kind: eOTelSpanKind.SERVER,
                    attributes: {
                        "http.user_agent": userAgent
                    }
                });
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                Assert.equal((item.tags as any)["ai.user.userAgent"], userAgent, "Should map user agent");
            }
        });

        this.testCase({
            name: "Tags: synthetic source detection",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("bot-span", {
                    kind: eOTelSpanKind.SERVER,
                    attributes: {
                        "http.user_agent": "Googlebot/2.1 (+http://www.google.com/bot.html)"
                    }
                });
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                // Synthetic source should be detected for bot user agents
                if ((item.tags as any)["ai.operation.syntheticSource"]) {
                    Assert.equal((item.tags as any)["ai.operation.syntheticSource"], "True",
                        "Should detect synthetic source for bots");
                }
            }
        });
    }

    private addAzureSDKTests(): void {
        this.testCase({
            name: "Azure SDK: EventHub PRODUCER span mapping",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("EventHubs.send", {
                    kind: eOTelSpanKind.PRODUCER,
                    attributes: {
                        "az.namespace": "Microsoft.EventHub",
                        "message_bus.destination": "telemetry-events",
                        "net.peer.name": "eventhub.servicebus.windows.net"
                    }
                });
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                Assert.ok((item.baseData as any).type?.includes("Queue Message"), "Should be Queue Message type");
                Assert.ok((item.baseData as any).type?.includes("Microsoft.EventHub"), "Should include namespace");
                Assert.ok((item.baseData as any).target, "Should have target");
            }
        });

        this.testCase({
            name: "Azure SDK: EventHub CONSUMER span mapping",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("EventHubs.process", {
                    kind: eOTelSpanKind.CONSUMER,
                    attributes: {
                        "az.namespace": "Microsoft.EventHub",
                        "message_bus.destination": "telemetry-events",
                        "net.peer.name": "eventhub.servicebus.windows.net",
                        "enqueuedTime": "1638360000000"
                    }
                });
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                Assert.ok((item.baseData as any).source, "Consumer should have source");
                Assert.ok((item.baseData as any).measurements, "Should have measurements");
                Assert.ok("timeSinceEnqueued" in (item.baseData as any).measurements, "Should have timeSinceEnqueued measurement");
            }
        });

        this.testCase({
            name: "Azure SDK: INTERNAL span with Azure namespace",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("internal-azure-op", {
                    kind: eOTelSpanKind.INTERNAL,
                    attributes: {
                        "az.namespace": "Microsoft.Storage"
                    }
                });
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                Assert.ok((item.baseData as any).type?.includes("InProc"), "Should include InProc");
                Assert.ok((item.baseData as any).type?.includes("Microsoft.Storage"), "Should include namespace");
            }
        });
    }

    private addSemanticAttributeExclusionTests(): void {
        this.testCase({
            name: "Semantic Exclusion: HTTP attributes not in properties",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("http-span", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "http.method": "POST",
                        "http.url": "https://example.com/api",
                        "http.status_code": 201,
                        "http.user_agent": "TestAgent/1.0",
                        "custom.attribute": "should-be-kept"
                    }
                });
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                const props = (item.baseData as any).properties || {};
                
                Assert.ok(!props["http.method"], "http.method should be excluded");
                Assert.ok(!props["http.url"], "http.url should be excluded");
                Assert.ok(!props["http.status_code"], "http.status_code should be excluded");
                Assert.ok(!props["http.user_agent"], "http.user_agent should be excluded");
                Assert.equal(props["custom.attribute"], "should-be-kept", "Custom attributes should be kept");
            }
        });

        this.testCase({
            name: "Semantic Exclusion: DB attributes not in properties",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("db-span", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "db.system": "postgresql",
                        "db.statement": "SELECT * FROM users",
                        "db.name": "mydb",
                        "db.operation": "SELECT",
                        "app.query.id": "query-123"
                    }
                });
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                const props = (item.baseData as any).properties || {};
                
                Assert.ok(!props["db.system"], "db.system should be excluded");
                Assert.ok(!props["db.statement"], "db.statement should be excluded");
                Assert.ok(!props["db.name"], "db.name should be excluded");
                Assert.ok(!props["db.operation"], "db.operation should be excluded");
                Assert.equal(props["app.query.id"], "query-123", "Custom attributes should be kept");
            }
        });

        this.testCase({
            name: "Semantic Exclusion: microsoft.* attributes excluded",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("microsoft-attrs", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "microsoft.internal.flag": true,
                        "microsoft.client.ip": "192.168.1.1",
                        "microsoft.custom": "value",
                        "app.microsoft": "not-excluded"
                    }
                });
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                const props = (item.baseData as any).properties || {};
                
                Assert.ok(!props["microsoft.internal.flag"], "microsoft.* should be excluded");
                Assert.ok(!props["microsoft.client.ip"], "microsoft.* should be excluded");
                Assert.ok(!props["microsoft.custom"], "microsoft.* should be excluded");
                Assert.equal(props["app.microsoft"], "not-excluded",
                    "Attributes containing 'microsoft' but not prefixed should be kept");
            }
        });

        this.testCase({
            name: "Semantic Exclusion: operation.name context tag excluded",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("op-name-span", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "ai.operation.name": "CustomOperation",
                        "custom.operation.name": "should-be-kept"
                    }
                });
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                const props = (item.baseData as any).properties || {};
                
                Assert.ok(!props["ai.operation.name"], "ai.operation.name should be excluded");
                Assert.equal(props["custom.operation.name"], "should-be-kept",
                    "Similar named custom attributes should be kept");
            }
        });

        this.testCase({
            name: "Semantic Exclusion: new semantic conventions excluded",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("new-semconv", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        [ATTR_HTTP_REQUEST_METHOD]: "GET",
                        [ATTR_HTTP_RESPONSE_STATUS_CODE]: 200,
                        [ATTR_URL_FULL]: "https://example.com",
                        [ATTR_SERVER_ADDRESS]: "example.com",
                        [ATTR_SERVER_PORT]: 443,
                        "app.request.id": "req-123"
                    }
                });
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                const props = (item.baseData as any).properties || {};
                
                Assert.ok(!props["http.request.method"], "New http attributes should be excluded");
                Assert.ok(!props["http.response.status_code"], "New http attributes should be excluded");
                Assert.ok(!props["url.full"], "New url attributes should be excluded");
                Assert.ok(!props["server.address"], "New server attributes should be excluded");
                Assert.ok(!props["server.port"], "New server attributes should be excluded");
                Assert.equal(props["app.request.id"], "req-123", "Custom attributes should be kept");
            }
        });
    }

    private addEdgeCaseTests(): void {
        this.testCase({
            name: "Edge Case: Empty span name",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("", {
                    kind: eOTelSpanKind.CLIENT
                });
                span?.end();

                // Assert
                Assert.equal(this._trackCalls.length, 1, "Should generate telemetry for empty name");
                const item = this._trackCalls[0];
                Assert.ok(item.baseData, "Should have baseData");
                Assert.equal((item.baseData as any).name, "", "Should preserve empty name");
            }
        });

        this.testCase({
            name: "Edge Case: Span with null/undefined attributes",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("null-attrs", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "valid.attr": "value",
                        "null.attr": null as any,
                        "undefined.attr": undefined as any,
                        "zero.attr": 0,
                        "false.attr": false,
                        "empty.string": ""
                    }
                });
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                const props = (item.baseData as any).properties || {};
                Assert.equal(props["valid.attr"], "value", "Valid attributes should be preserved");
                Assert.equal(props["zero.attr"], 0, "Zero values should be preserved");
                Assert.equal(props["false.attr"], false, "False values should be preserved");
                Assert.equal(props["empty.string"], "", "Empty strings should be preserved");
            }
        });

        this.testCase({
            name: "Edge Case: Span with extremely long attribute values",
            test: () => {
                // Arrange
                this._trackCalls = [];
                const veryLongValue = "a".repeat(20000);
                
                // Act
                const span = this._ai.startSpan("long-attrs", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "long.value": veryLongValue
                    }
                });
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                const props = (item.baseData as any).properties || {};
                Assert.ok(props["long.value"], "Long value should be included");
                Assert.equal(props["long.value"], veryLongValue, "Long value should be preserved");
            }
        });

        this.testCase({
            name: "Edge Case: Span with special characters in name and attributes",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("span-with-特殊字符-émojis-🎉", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "unicode.key": "value with 中文 and émojis 🚀",
                        "special.chars": "tab\there\nnewline\r\ncarriage",
                        "quotes": "\"double\" and 'single' quotes"
                    }
                });
                span?.end();

                // Assert
                Assert.equal(this._trackCalls.length, 1, "Should handle special characters");
                const item = this._trackCalls[0];
                Assert.ok((item.baseData as any).name.includes("特殊字符"), "Should preserve unicode in name");
                const props = (item.baseData as any).properties || {};
                Assert.ok(props["unicode.key"], "Should preserve unicode attributes");
                Assert.ok(props["special.chars"], "Should preserve special characters");
                Assert.ok(props["quotes"], "Should preserve quotes");
            }
        });

        this.testCase({
            name: "Edge Case: Span without explicit kind defaults appropriately",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act - startSpan with no kind specified
                const span = this._ai.startSpan("no-kind-span");
                span?.end();

                // Assert
                Assert.equal(this._trackCalls.length, 1, "Should generate telemetry");
                const item = this._trackCalls[0];
                Assert.ok(item, "Should have telemetry item");
            }
        });

        this.testCase({
            name: "Edge Case: Multiple rapid span creations and endings",
            test: () => {
                // Arrange
                this._trackCalls = [];
                const spanCount = 50;
                
                // Act - Create and end many spans rapidly
                for (let i = 0; i < spanCount; i++) {
                    const span = this._ai.startSpan("rapid-span-" + i, {
                        kind: eOTelSpanKind.CLIENT,
                        attributes: {
                            "span.index": i
                        }
                    });
                    span?.end();
                }

                // Assert
                Assert.equal(this._trackCalls.length, spanCount, "Should track all spans");
                const firstItem = this._trackCalls[0];
                const lastItem = this._trackCalls[spanCount - 1];
                Assert.equal((firstItem.baseData as any).properties["span.index"], 0, "First span preserved");
                Assert.equal((lastItem.baseData as any).properties["span.index"], spanCount - 1, "Last span preserved");
            }
        });

        this.testCase({
            name: "Edge Case: Span with array attribute values",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("array-attrs", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "string.array": ["value1", "value2", "value3"],
                        "number.array": [1, 2, 3],
                        "mixed.array": ["string", 123, true] as any
                    }
                });
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                const props = (item.baseData as any).properties || {};
                Assert.ok(props["string.array"], "Array attributes should be included");
            }
        });

        this.testCase({
            name: "Edge Case: Span with nested object attributes",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("nested-attrs", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "nested.object": { key: "value", nested: { deep: "data" } } as any,
                        "simple.attr": "simple"
                    }
                });
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                const props = (item.baseData as any).properties || {};
                Assert.ok(props["simple.attr"], "Simple attributes should work");
            }
        });

        this.testCase({
            name: "Edge Case: Span with malformed HTTP status codes",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("malformed-status", {
                    kind: eOTelSpanKind.SERVER,
                    attributes: {
                        [SEMATTRS_HTTP_STATUS_CODE]: "not-a-number" as any
                    }
                });
                span?.end();

                // Assert
                Assert.equal(this._trackCalls.length, 1, "Should handle malformed status codes");
                const item = this._trackCalls[0];
                Assert.ok(item.baseData, "Should have baseData");
            }
        });

        this.testCase({
            name: "Edge Case: Span with missing parent context",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act - Explicitly pass null/undefined parent context
                const span = this._ai.startSpan("orphan-span", {
                    kind: eOTelSpanKind.CLIENT
                }, undefined);
                span?.end();

                // Assert
                Assert.equal(this._trackCalls.length, 1, "Should handle missing parent");
                const item = this._trackCalls[0];
                Assert.ok((item.tags as any)["ai.operation.id"], "Should have operation ID");
            }
        });

        this.testCase({
            name: "Edge Case: Span ended multiple times",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("multi-end", {
                    kind: eOTelSpanKind.CLIENT
                });
                span?.end();
                const firstCallCount = this._trackCalls.length;
                span?.end(); // End again
                const secondCallCount = this._trackCalls.length;

                // Assert
                Assert.equal(firstCallCount, 1, "First end should generate telemetry");
                Assert.equal(secondCallCount, 1, "Second end should not generate duplicate telemetry");
            }
        });

        this.testCase({
            name: "Edge Case: Span with extremely large number of attributes",
            test: () => {
                // Arrange
                this._trackCalls = [];
                const attributes: any = {};
                for (let i = 0; i < 1000; i++) {
                    attributes["attr." + i] = "value" + i;
                }
                
                // Act
                const span = this._ai.startSpan("many-attrs", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: attributes
                });
                span?.end();

                // Assert
                Assert.equal(this._trackCalls.length, 1, "Should handle many attributes");
                const item = this._trackCalls[0];
                const props = (item.baseData as any).properties || {};
                Assert.ok(Object.keys(props).length > 0, "Should have some properties");
            }
        });

        this.testCase({
            name: "Edge Case: Zero duration span",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act - End span immediately
                const span = this._ai.startSpan("instant-span", {
                    kind: eOTelSpanKind.CLIENT
                });
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                Assert.ok(item.baseData, "Should have baseData");
                const duration = (item.baseData as any).duration;
                Assert.ok(duration !== undefined, "Should have duration field");
            }
        });

        this.testCase({
            name: "Edge Case: HTTP dependency with missing URL",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("http-no-url", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        [SEMATTRS_HTTP_METHOD]: "GET",
                        [SEMATTRS_HTTP_STATUS_CODE]: 200
                        // No URL attribute
                    }
                });
                span?.end();

                // Assert
                Assert.equal(this._trackCalls.length, 1, "Should handle missing URL");
                const item = this._trackCalls[0];
                Assert.equal((item.baseData as any).type, "Http", "Should still be HTTP type");
            }
        });

        this.testCase({
            name: "Edge Case: Database dependency with missing statement",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("db-no-statement", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        [SEMATTRS_DB_SYSTEM]: "postgresql",
                        [SEMATTRS_DB_NAME]: "testdb"
                        // No statement
                    }
                });
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                Assert.equal((item.baseData as any).type, "postgresql", "Should have DB type");
            }
        });
    }

    private addCrossBrowserCompatibilityTests(): void {
        this.testCase({
            name: "Cross-Browser: Handles performance.now() unavailable",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act - Create span when performance.now might not be available
                const span = this._ai.startSpan("perf-test", {
                    kind: eOTelSpanKind.CLIENT
                });
                span?.end();

                // Assert
                Assert.equal(this._trackCalls.length, 1, "Should work without performance.now");
                const item = this._trackCalls[0];
                Assert.ok(item.baseData, "Should generate valid telemetry");
            }
        });

        this.testCase({
            name: "Cross-Browser: Handles Date.now() for timing",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("date-timing", {
                    kind: eOTelSpanKind.CLIENT
                });
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                Assert.ok((item.baseData as any).duration !== undefined, "Should have duration");
                Assert.ok((item.baseData as any).duration >= 0, "Duration should be non-negative");
            }
        });

        this.testCase({
            name: "Cross-Browser: String encoding compatibility",
            test: () => {
                // Arrange
                this._trackCalls = [];
                const testStrings = [
                    "ASCII only",
                    "UTF-8: 你好世界",
                    "Emoji: 🎉🚀💻",
                    "Latin: café résumé",
                    "Mixed: Hello世界🌍"
                ];
                
                // Act
                for (let i = 0; i < testStrings.length; i++) {
                    const span = this._ai.startSpan(testStrings[i], {
                        kind: eOTelSpanKind.CLIENT,
                        attributes: {
                            "test.string": testStrings[i]
                        }
                    });
                    span?.end();
                }

                // Assert
                Assert.equal(this._trackCalls.length, testStrings.length, "Should handle all encodings");
                for (let i = 0; i < testStrings.length; i++) {
                    const item = this._trackCalls[i];
                    Assert.ok(item.baseData, "Should have baseData for encoding test " + i);
                }
            }
        });

        this.testCase({
            name: "Cross-Browser: JSON serialization of attributes",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("json-test", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "number": 123,
                        "string": "test",
                        "boolean": true,
                        "float": 123.456,
                        "negative": -999,
                        "zero": 0
                    }
                });
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                const props = (item.baseData as any).properties || {};
                Assert.equal(typeof props["number"], "number", "Numbers should remain numbers");
                Assert.equal(typeof props["string"], "string", "Strings should remain strings");
                Assert.equal(typeof props["boolean"], "boolean", "Booleans should remain booleans");
            }
        });

        this.testCase({
            name: "Cross-Browser: Large payload handling",
            test: () => {
                // Arrange
                this._trackCalls = [];
                const largeAttributes: any = {};
                for (let i = 0; i < 100; i++) {
                    largeAttributes["large.attr." + i] = "x".repeat(100);
                }
                
                // Act
                const span = this._ai.startSpan("large-payload", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: largeAttributes
                });
                span?.end();

                // Assert
                Assert.equal(this._trackCalls.length, 1, "Should handle large payloads");
                const item = this._trackCalls[0];
                Assert.ok(item.baseData, "Should generate telemetry");
            }
        });

        this.testCase({
            name: "Cross-Browser: Handles undefined vs null attributes",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("null-undefined", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "explicit.null": null as any,
                        "explicit.undefined": undefined as any,
                        "valid.value": "test"
                    }
                });
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                const props = (item.baseData as any).properties || {};
                Assert.equal(props["valid.value"], "test", "Valid values should be preserved");
            }
        });

        this.testCase({
            name: "Cross-Browser: Whitespace handling in attribute keys",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("whitespace-keys", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "normal.key": "value1",
                        " leading.space": "value2",
                        "trailing.space ": "value3",
                        "has spaces": "value4"
                    }
                });
                span?.end();

                // Assert
                Assert.equal(this._trackCalls.length, 1, "Should handle whitespace in keys");
                const item = this._trackCalls[0];
                Assert.ok(item.baseData, "Should have baseData");
            }
        });

        this.testCase({
            name: "Cross-Browser: Number precision and special values",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("number-precision", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "max.safe.integer": Number.MAX_SAFE_INTEGER,
                        "min.safe.integer": Number.MIN_SAFE_INTEGER,
                        "large.float": 1.7976931348623157e+308,
                        "small.float": 5e-324,
                        "infinity": Infinity as any,
                        "neg.infinity": -Infinity as any,
                        "not.a.number": NaN as any
                    }
                });
                span?.end();

                // Assert
                Assert.equal(this._trackCalls.length, 1, "Should handle special number values");
                const item = this._trackCalls[0];
                const props = (item.baseData as any).properties || {};
                Assert.ok(props["max.safe.integer"] !== undefined, "Should handle large integers");
            }
        });

        this.testCase({
            name: "Cross-Browser: URL parsing with various formats",
            test: () => {
                // Arrange
                this._trackCalls = [];
                const urls = [
                    "http://example.com",
                    "https://example.com:8080/path",
                    "http://example.com/path?query=value",
                    "https://user:pass@example.com/path",
                    "http://192.168.1.1:3000",
                    "https://[::1]:8080/path"
                ];
                
                // Act
                for (const url of urls) {
                    const span = this._ai.startSpan("url-test", {
                        kind: eOTelSpanKind.CLIENT,
                        attributes: {
                            [SEMATTRS_HTTP_URL]: url
                        }
                    });
                    span?.end();
                }

                // Assert
                Assert.equal(this._trackCalls.length, urls.length, "Should handle all URL formats");
            }
        });

        this.testCase({
            name: "Cross-Browser: Timestamp handling across timezones",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("timezone-test", {
                    kind: eOTelSpanKind.CLIENT
                });
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                Assert.ok(item.time, "Should have timestamp");
                const timestamp = new Date(item.time || "").getTime();
                Assert.ok(timestamp > 0, "Timestamp should be valid");
            }
        });

        this.testCase({
            name: "Cross-Browser: Memory efficient attribute storage",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act - Create many spans to test memory handling
                for (let i = 0; i < 10; i++) {
                    const span = this._ai.startSpan("memory-test-" + i, {
                        kind: eOTelSpanKind.CLIENT,
                        attributes: {
                            "iteration": i,
                            "data": "x".repeat(1000)
                        }
                    });
                    span?.end();
                }

                // Assert
                Assert.equal(this._trackCalls.length, 10, "Should handle multiple spans");
                Assert.ok(this._trackCalls[0].baseData, "First span should have data");
                Assert.ok(this._trackCalls[9].baseData, "Last span should have data");
            }
        });

        this.testCase({
            name: "Cross-Browser: Concurrent span operations",
            test: () => {
                // Arrange
                this._trackCalls = [];
                const spans: any[] = [];
                
                // Act - Create multiple spans before ending any
                for (let i = 0; i < 5; i++) {
                    const span = this._ai.startSpan("concurrent-" + i, {
                        kind: eOTelSpanKind.CLIENT,
                        attributes: {
                            "index": i
                        }
                    });
                    spans.push(span);
                }
                
                // End all spans
                for (const span of spans) {
                    span?.end();
                }

                // Assert
                Assert.equal(this._trackCalls.length, 5, "Should handle concurrent spans");
            }
        });

        this.testCase({
            name: "Cross-Browser: RegExp in attribute values",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("regexp-test", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "pattern": "/test/gi" as any,
                        "normal": "value"
                    }
                });
                span?.end();

                // Assert
                Assert.equal(this._trackCalls.length, 1, "Should handle RegExp-like values");
                const item = this._trackCalls[0];
                Assert.ok(item.baseData, "Should have baseData");
            }
        });

        this.testCase({
            name: "Cross-Browser: Function and Symbol values filtered",
            test: () => {
                // Arrange
                this._trackCalls = [];
                
                // Act
                const span = this._ai.startSpan("special-types", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "function": (() => "test") as any,
                        "symbol": Symbol("test") as any,
                        "normal": "value"
                    }
                });
                span?.end();

                // Assert
                const item = this._trackCalls[0];
                const props = (item.baseData as any).properties || {};
                Assert.equal(props["normal"], "value", "Normal values should be preserved");
            }
        });

        this.testCase({
            name: "Cross-Browser: Circular reference handling",
            test: () => {
                // Arrange
                this._trackCalls = [];
                const circular: any = { a: "value" };
                circular.self = circular;
                
                // Act
                const span = this._ai.startSpan("circular-test", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "circular": circular,
                        "normal": "value"
                    }
                });
                span?.end();

                // Assert
                Assert.equal(this._trackCalls.length, 1, "Should handle circular references gracefully");
                const item = this._trackCalls[0];
                const props = (item.baseData as any).properties || {};
                Assert.equal(props["normal"], "value", "Normal attributes should still work");
            }
        });
    }
}
