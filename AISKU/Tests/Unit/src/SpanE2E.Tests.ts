import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import { ApplicationInsights } from "../../../src/applicationinsights-web";
import { eOTelSpanKind, eOTelSpanStatusCode } from "@microsoft/applicationinsights-core-js";

/**
 * E2E Tests for Span APIs that send real telemetry to Breeze endpoint
 *
 * These tests can be run manually to verify telemetry appears correctly in the Azure Portal:
 * 1. Set MANUAL_E2E_TEST to true
 * 2. Replace the instrumentationKey with a valid test iKey
 * 3. Run the tests
 * 4. Check the Azure Portal for the telemetry within 1-2 minutes
 *
 * Look for:
 * - Dependencies in the "Performance" blade
 * - Requests in the "Performance" blade
 * - Custom properties and measurements
 * - Distributed trace correlation
 * - End-to-end transaction view
 */
export class SpanE2ETests extends AITestClass {
    // Set to true to actually send telemetry to Breeze for manual validation
    private static readonly MANUAL_E2E_TEST = false;

    // Replace with your test instrumentation key for manual E2E testing
    private static readonly _instrumentationKey = "b7170927-2d1c-44f1-acec-59f4e1751c11";
    private static readonly _connectionString = `InstrumentationKey=${SpanE2ETests._instrumentationKey}`;

    private _ai!: ApplicationInsights;

    constructor(testName?: string) {
        super(testName || "SpanE2ETests");
    }

    public testInitialize() {
        try {
            this.useFakeServer = !SpanE2ETests.MANUAL_E2E_TEST;

            this._ai = new ApplicationInsights({
                config: {
                    connectionString: SpanE2ETests._connectionString,
                    disableAjaxTracking: false,
                    disableXhr: false,
                    disableFetchTracking: false,
                    enableAutoRouteTracking: true,
                    disableExceptionTracking: false,
                    maxBatchInterval: 1000, // Send quickly for manual testing
                    enableDebug: true,
                    loggingLevelConsole: 2 // Show warnings and errors
                }
            });

            this._ai.loadAppInsights();

            if (SpanE2ETests.MANUAL_E2E_TEST) {
                console.log("=== MANUAL E2E TEST MODE ===");
                console.log("Telemetry will be sent to Breeze endpoint");
                console.log("Check Azure Portal in 1-2 minutes");
                console.log("Instrumentation Key:", SpanE2ETests._instrumentationKey);
                console.log("============================");
            }
        } catch (e) {
            console.error("Failed to initialize tests: " + e);
            throw e;
        }
    }

    public testFinishedCleanup() {
        if (this._ai && this._ai.unload) {
            // Flush any pending telemetry before cleanup
            this._ai.flush();
            this._ai.unload(false);
        }
    }

    public registerTests() {
        this.addE2EBasicSpanTests();
        this.addE2EDistributedTraceTests();
        this.addE2EHttpDependencyTests();
        this.addE2EDatabaseDependencyTests();
        this.addE2EComplexScenarioTests();
    }

    private addE2EBasicSpanTests(): void {
        this.testCase({
            name: "E2E: Basic CLIENT span creates RemoteDependency in portal",
            test: () => {
                // This will appear in the Azure Portal under Performance -> Dependencies
                const span = this._ai.startSpan("E2E-BasicClientSpan", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "test.scenario": "basic-client",
                        "test.timestamp": new Date().toISOString(),
                        "test.type": "manual-validation",
                        "custom.property": "This should appear in custom properties"
                    }
                });

                // Simulate some work
                if (span) {
                    span.setAttribute("work.completed", true);
                    span.setStatus({ code: eOTelSpanStatusCode.OK });
                    span.end();
                }

                // Flush to ensure it's sent
                this._ai.flush();

                Assert.ok(span, "Span should be created");

                if (SpanE2ETests.MANUAL_E2E_TEST) {
                    console.log("✓ Basic CLIENT span sent - Check Azure Portal Dependencies");
                }
            }
        });

        this.testCase({
            name: "E2E: Basic SERVER span creates Request in portal",
            test: () => {
                // This will appear in the Azure Portal under Performance -> Requests
                const span = this._ai.startSpan("E2E-BasicServerSpan", {
                    kind: eOTelSpanKind.SERVER,
                    attributes: {
                        "http.method": "POST",
                        "http.url": "https://example.com/api/test",
                        "http.status_code": 200,
                        "test.scenario": "basic-server",
                        "test.timestamp": new Date().toISOString()
                    }
                });

                if (span) {
                    span.setStatus({ code: eOTelSpanStatusCode.OK });
                    span.end();
                }

                this._ai.flush();

                Assert.ok(span, "Span should be created");

                if (SpanE2ETests.MANUAL_E2E_TEST) {
                    console.log("✓ Basic SERVER span sent - Check Azure Portal Requests");
                }
            }
        });

        this.testCase({
            name: "E2E: Failed span shows as error in portal",
            test: () => {
                const span = this._ai.startSpan("E2E-FailedOperation", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "test.scenario": "failure-case",
                        "test.timestamp": new Date().toISOString()
                    }
                });

                if (span) {
                    // Simulate a failure
                    span.setAttribute("error.type", "TimeoutError");
                    span.setAttribute("error.message", "Operation timed out after 5000ms");
                    span.setStatus({
                        code: eOTelSpanStatusCode.ERROR,
                        message: "Operation failed due to timeout"
                    });
                    span.end();
                }

                this._ai.flush();

                Assert.ok(span, "Span should be created");

                if (SpanE2ETests.MANUAL_E2E_TEST) {
                    console.log("✓ Failed span sent - Should show success=false in portal");
                }
            }
        });
    }

    private addE2EDistributedTraceTests(): void {
        this.testCase({
            name: "E2E: Parent-child span relationship visible in portal",
            test: () => {
                // Create parent span
                const parentSpan = this._ai.startSpan("E2E-ParentOperation", {
                    kind: eOTelSpanKind.SERVER,
                    attributes: {
                        "test.scenario": "distributed-trace",
                        "test.timestamp": new Date().toISOString(),
                        "operation.level": "parent"
                    }
                });

                const parentContext = parentSpan?.spanContext();

                // Create child span with explicit parent
                const childSpan1 = this._ai.startSpan("E2E-ChildOperation1", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "operation.level": "child",
                        "child.index": 1
                    }
                }, parentContext);

                if (childSpan1) {
                    childSpan1.setAttribute("http.url", "https://api.example.com/users");
                    childSpan1.setAttribute("http.method", "GET");
                    childSpan1.setStatus({ code: eOTelSpanStatusCode.OK });
                    childSpan1.end();
                }

                // Create another child
                const childSpan2 = this._ai.startSpan("E2E-ChildOperation2", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "operation.level": "child",
                        "child.index": 2
                    }
                }, parentContext);

                if (childSpan2) {
                    childSpan2.setAttribute("http.url", "https://api.example.com/orders");
                    childSpan2.setAttribute("http.method", "POST");
                    childSpan2.setStatus({ code: eOTelSpanStatusCode.OK });
                    childSpan2.end();
                }

                // End parent
                if (parentSpan) {
                    parentSpan.setAttribute("children.count", 2);
                    parentSpan.setStatus({ code: eOTelSpanStatusCode.OK });
                    parentSpan.end();
                }

                this._ai.flush();

                Assert.ok(parentSpan && childSpan1 && childSpan2, "All spans should be created");

                if (SpanE2ETests.MANUAL_E2E_TEST) {
                    console.log("✓ Distributed trace sent - Check End-to-End Transaction view");
                    console.log("  Parent operation.id:", parentContext?.traceId);
                }
            }
        });

        this.testCase({
            name: "E2E: Nested span hierarchy (3 levels) visible in portal",
            test: () => {
                // Level 1: Root
                const rootSpan = this._ai.startSpan("E2E-RootOperation", {
                    kind: eOTelSpanKind.SERVER,
                    attributes: {
                        "test.scenario": "nested-hierarchy",
                        "test.timestamp": new Date().toISOString(),
                        "span.level": 1
                    }
                });

                const rootContext = rootSpan?.spanContext();

                // Level 2: Child
                const level2Span = this._ai.startSpan("E2E-Level2Operation", {
                    kind: eOTelSpanKind.INTERNAL,
                    attributes: {
                        "span.level": 2
                    }
                }, rootContext);

                const level2Context = level2Span?.spanContext();

                // Level 3: Grandchild
                const level3Span = this._ai.startSpan("E2E-Level3Operation", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "span.level": 3,
                        "http.url": "https://api.example.com/deep-call"
                    }
                }, level2Context);

                // End in reverse order (child first, parent last)
                if (level3Span) {
                    level3Span.setStatus({ code: eOTelSpanStatusCode.OK });
                    level3Span.end();
                }

                if (level2Span) {
                    level2Span.setStatus({ code: eOTelSpanStatusCode.OK });
                    level2Span.end();
                }

                if (rootSpan) {
                    rootSpan.setStatus({ code: eOTelSpanStatusCode.OK });
                    rootSpan.end();
                }

                this._ai.flush();

                Assert.ok(rootSpan && level2Span && level3Span, "All spans should be created");

                if (SpanE2ETests.MANUAL_E2E_TEST) {
                    console.log("✓ 3-level nested trace sent - Check transaction timeline");
                }
            }
        });
    }

    private addE2EHttpDependencyTests(): void {
        this.testCase({
            name: "E2E: HTTP dependency with full details in portal",
            test: () => {
                const span = this._ai.startSpan("E2E-HTTPDependency", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "http.method": "POST",
                        "http.url": "https://api.example.com/v1/users/create",
                        "http.status_code": 201,
                        "http.request.header.content-type": "application/json",
                        "http.response.header.content-length": "1234",
                        "test.scenario": "http-dependency",
                        "test.timestamp": new Date().toISOString(),
                        "request.body.size": 512,
                        "response.time.ms": 145
                    }
                });

                if (span) {
                    span.setStatus({ code: eOTelSpanStatusCode.OK });
                    span.end();
                }

                this._ai.flush();

                Assert.ok(span, "Span should be created");

                if (SpanE2ETests.MANUAL_E2E_TEST) {
                    console.log("✓ HTTP dependency sent - Check Dependencies with full HTTP details");
                }
            }
        });

        this.testCase({
            name: "E2E: HTTP dependency with various status codes in portal",
            test: () => {
                const statusCodes = [200, 201, 204, 400, 401, 403, 404, 500, 502, 503];

                for (const statusCode of statusCodes) {
                    const isSuccess = statusCode >= 200 && statusCode < 400;
                    const span = this._ai.startSpan(`E2E-HTTP-${statusCode}`, {
                        kind: eOTelSpanKind.CLIENT,
                        attributes: {
                            "http.method": "GET",
                            "http.url": `https://api.example.com/status/${statusCode}`,
                            "http.status_code": statusCode,
                            "test.scenario": "http-status-codes",
                            "test.timestamp": new Date().toISOString()
                        }
                    });

                    if (span) {
                        span.setStatus({
                            code: isSuccess ? eOTelSpanStatusCode.OK : eOTelSpanStatusCode.ERROR
                        });
                        span.end();
                    }
                }

                this._ai.flush();

                if (SpanE2ETests.MANUAL_E2E_TEST) {
                    console.log("✓ Multiple HTTP status codes sent - Check success/failure in portal");
                }

                Assert.ok(true, "Multiple status codes tested");
            }
        });
    }

    private addE2EDatabaseDependencyTests(): void {
        this.testCase({
            name: "E2E: Database dependencies appear in portal",
            test: () => {
                const databases = [
                    { system: "mysql", statement: "SELECT * FROM users WHERE id = ?", name: "production_db" },
                    { system: "postgresql", statement: "INSERT INTO logs (message, level) VALUES ($1, $2)", name: "logs_db" },
                    { system: "mongodb", statement: "db.products.find({category: 'electronics'})", name: "catalog_db" },
                    { system: "redis", statement: "GET user:session:abc123", name: "cache_db" },
                    { system: "mssql", statement: "EXEC sp_GetUserOrders @UserId=123", name: "orders_db" }
                ];

                for (const db of databases) {
                    const span = this._ai.startSpan(`E2E-DB-${db.system}`, {
                        kind: eOTelSpanKind.CLIENT,
                        attributes: {
                            "db.system": db.system,
                            "db.statement": db.statement,
                            "db.name": db.name,
                            "db.user": "app_user",
                            "net.peer.name": `${db.system}.example.com`,
                            "net.peer.port": 5432,
                            "test.scenario": "database-dependencies",
                            "test.timestamp": new Date().toISOString()
                        }
                    });

                    if (span) {
                        span.setAttribute("db.rows.affected", 42);
                        span.setAttribute("db.duration.ms", 23);
                        span.setStatus({ code: eOTelSpanStatusCode.OK });
                        span.end();
                    }
                }

                this._ai.flush();

                if (SpanE2ETests.MANUAL_E2E_TEST) {
                    console.log("✓ Database dependencies sent - Check Dependencies for SQL/NoSQL types");
                }

                Assert.ok(true, "Database dependencies tested");
            }
        });

        this.testCase({
            name: "E2E: Database slow query marked appropriately",
            test: () => {
                const span = this._ai.startSpan("E2E-SlowDatabaseQuery", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "db.system": "postgresql",
                        "db.statement": "SELECT * FROM orders JOIN users ON orders.user_id = users.id WHERE created_at > NOW() - INTERVAL '30 days'",
                        "db.name": "analytics_db",
                        "test.scenario": "slow-query",
                        "test.timestamp": new Date().toISOString(),
                        "db.query.execution.plan": "SeqScan on orders (cost=0.00..1000.00 rows=10000)",
                        "db.slow.query": true,
                        "db.duration.ms": 5432
                    }
                });

                if (span) {
                    // Mark as warning (not error, but slow)
                    span.setStatus({ code: eOTelSpanStatusCode.OK });
                    span.setAttribute("performance.warning", "Query exceeded 1000ms threshold");
                    span.end();
                }

                this._ai.flush();

                Assert.ok(span, "Slow query span created");

                if (SpanE2ETests.MANUAL_E2E_TEST) {
                    console.log("✓ Slow database query sent - Check duration in portal");
                }
            }
        });
    }

    private addE2EComplexScenarioTests(): void {
        this.testCase({
            name: "E2E: Complex e-commerce checkout scenario in portal",
            test: () => {
                // Simulate a complete e-commerce checkout flow with multiple dependencies
                const timestamp = new Date().toISOString();

                // 1. Initial checkout request
                const checkoutSpan = this._ai.startSpan("E2E-CheckoutRequest", {
                    kind: eOTelSpanKind.SERVER,
                    attributes: {
                        "test.scenario": "complex-ecommerce",
                        "test.timestamp": timestamp,
                        "http.method": "POST",
                        "http.url": "https://shop.example.com/api/checkout",
                        "http.status_code": 200,
                        "user.id": "user_12345",
                        "cart.items.count": 3,
                        "cart.total.amount": 299.97
                    }
                });

                const checkoutContext = checkoutSpan?.spanContext();

                // 2. Validate inventory
                const inventorySpan = this._ai.startSpan("E2E-ValidateInventory", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "http.method": "POST",
                        "http.url": "https://inventory-api.example.com/validate",
                        "http.status_code": 200,
                        "items.validated": 3
                    }
                }, checkoutContext);

                if (inventorySpan) {
                    inventorySpan.setStatus({ code: eOTelSpanStatusCode.OK });
                    inventorySpan.end();
                }

                // 3. Calculate shipping
                const shippingSpan = this._ai.startSpan("E2E-CalculateShipping", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "http.method": "POST",
                        "http.url": "https://shipping-api.example.com/calculate",
                        "http.status_code": 200,
                        "shipping.method": "express",
                        "shipping.cost": 15.99
                    }
                }, checkoutContext);

                if (shippingSpan) {
                    shippingSpan.setStatus({ code: eOTelSpanStatusCode.OK });
                    shippingSpan.end();
                }

                // 4. Process payment
                const paymentSpan = this._ai.startSpan("E2E-ProcessPayment", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "http.method": "POST",
                        "http.url": "https://payments.example.com/charge",
                        "http.status_code": 200,
                        "payment.method": "credit_card",
                        "payment.amount": 315.96,
                        "payment.currency": "USD"
                    }
                }, checkoutContext);

                if (paymentSpan) {
                    paymentSpan.setAttribute("payment.processor", "stripe");
                    paymentSpan.setAttribute("payment.transaction.id", "txn_abc123xyz");
                    paymentSpan.setStatus({ code: eOTelSpanStatusCode.OK });
                    paymentSpan.end();
                }

                // 5. Create order in database
                const createOrderSpan = this._ai.startSpan("E2E-CreateOrder", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "db.system": "postgresql",
                        "db.statement": "INSERT INTO orders (user_id, total, status) VALUES ($1, $2, $3) RETURNING id",
                        "db.name": "orders_db",
                        "db.operation": "INSERT"
                    }
                }, checkoutContext);

                if (createOrderSpan) {
                    createOrderSpan.setAttribute("order.id", "ord_98765");
                    createOrderSpan.setStatus({ code: eOTelSpanStatusCode.OK });
                    createOrderSpan.end();
                }

                // 6. Send confirmation email
                const emailSpan = this._ai.startSpan("E2E-SendConfirmationEmail", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "http.method": "POST",
                        "http.url": "https://email-service.example.com/send",
                        "http.status_code": 202,
                        "email.recipient": "user@example.com",
                        "email.template": "order-confirmation"
                    }
                }, checkoutContext);

                if (emailSpan) {
                    emailSpan.setStatus({ code: eOTelSpanStatusCode.OK });
                    emailSpan.end();
                }

                // 7. Update cache
                const cacheSpan = this._ai.startSpan("E2E-UpdateCache", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "db.system": "redis",
                        "db.statement": "SET user:12345:last_order ord_98765 EX 86400",
                        "cache.operation": "set",
                        "cache.key": "user:12345:last_order"
                    }
                }, checkoutContext);

                if (cacheSpan) {
                    cacheSpan.setStatus({ code: eOTelSpanStatusCode.OK });
                    cacheSpan.end();
                }

                // Complete checkout
                if (checkoutSpan) {
                    checkoutSpan.setAttribute("checkout.status", "completed");
                    checkoutSpan.setAttribute("order.id", "ord_98765");
                    checkoutSpan.setAttribute("dependencies.count", 7);
                    checkoutSpan.setStatus({ code: eOTelSpanStatusCode.OK });
                    checkoutSpan.end();
                }

                this._ai.flush();

                Assert.ok(checkoutSpan, "Checkout span created");

                if (SpanE2ETests.MANUAL_E2E_TEST) {
                    console.log("✓ Complex e-commerce scenario sent");
                    console.log("  Trace ID:", checkoutContext?.traceId);
                    console.log("  Check End-to-End Transaction view for complete flow");
                    console.log("  Expected: 1 Request + 7 Dependencies");
                }
            }
        });

        this.testCase({
            name: "E2E: Mixed success and failure scenario in portal",
            test: () => {
                const timestamp = new Date().toISOString();

                // Parent operation
                const operationSpan = this._ai.startSpan("E2E-MixedResultsOperation", {
                    kind: eOTelSpanKind.SERVER,
                    attributes: {
                        "test.scenario": "mixed-success-failure",
                        "test.timestamp": timestamp
                    }
                });

                const operationContext = operationSpan?.spanContext();

                // Successful child 1
                const successSpan1 = this._ai.startSpan("E2E-SuccessfulCall1", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "http.url": "https://api.example.com/service1",
                        "http.status_code": 200
                    }
                }, operationContext);

                if (successSpan1) {
                    successSpan1.setStatus({ code: eOTelSpanStatusCode.OK });
                    successSpan1.end();
                }

                // Failed child
                const failedSpan = this._ai.startSpan("E2E-FailedCall", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "http.url": "https://api.example.com/service2",
                        "http.status_code": 503
                    }
                }, operationContext);

                if (failedSpan) {
                    failedSpan.setAttribute("error.type", "ServiceUnavailable");
                    failedSpan.setAttribute("retry.count", 3);
                    failedSpan.setStatus({
                        code: eOTelSpanStatusCode.ERROR,
                        message: "Service temporarily unavailable"
                    });
                    failedSpan.end();
                }

                // Successful child 2 (after retry)
                const successSpan2 = this._ai.startSpan("E2E-SuccessfulCall2", {
                    kind: eOTelSpanKind.CLIENT,
                    attributes: {
                        "http.url": "https://api.example.com/service3",
                        "http.status_code": 200
                    }
                }, operationContext);

                if (successSpan2) {
                    successSpan2.setStatus({ code: eOTelSpanStatusCode.OK });
                    successSpan2.end();
                }

                // Parent partially successful
                if (operationSpan) {
                    operationSpan.setAttribute("successful.calls", 2);
                    operationSpan.setAttribute("failed.calls", 1);
                    operationSpan.setAttribute("total.calls", 3);
                    operationSpan.setStatus({ code: eOTelSpanStatusCode.OK });
                    operationSpan.end();
                }

                this._ai.flush();

                Assert.ok(operationSpan, "Operation span created");

                if (SpanE2ETests.MANUAL_E2E_TEST) {
                    console.log("✓ Mixed success/failure scenario sent");
                    console.log("  Check for 2 successful + 1 failed dependency in transaction");
                }
            }
        });

        this.testCase({
            name: "E2E: Span with rich custom properties for portal search",
            test: () => {
                const span = this._ai.startSpan("E2E-RichProperties", {
                    kind: eOTelSpanKind.SERVER,
                    attributes: {
                        "test.scenario": "rich-properties",
                        "test.timestamp": new Date().toISOString(),

                        // Business context
                        "business.tenant": "acme-corp",
                        "business.region": "us-west-2",
                        "business.environment": "production",

                        // User context
                        "user.id": "user_12345",
                        "user.email": "test@example.com",
                        "user.subscription": "premium",
                        "user.account.age.days": 456,

                        // Request context
                        "request.id": "req_abc123",
                        "request.source": "web-app",
                        "request.version": "v2.3.1",

                        // Performance metrics
                        "performance.db.queries": 5,
                        "performance.cache.hits": 3,
                        "performance.cache.misses": 2,
                        "performance.total.ms": 234,

                        // Feature flags
                        "feature.new.checkout": true,
                        "feature.ab.test.group": "variant-b",

                        // Custom measurements
                        "metrics.items.processed": 42,
                        "metrics.data.size.kb": 128
                    }
                });

                if (span) {
                    span.setStatus({ code: eOTelSpanStatusCode.OK });
                    span.end();
                }

                this._ai.flush();

                Assert.ok(span, "Span with rich properties created");

                if (SpanE2ETests.MANUAL_E2E_TEST) {
                    console.log("✓ Span with rich properties sent");
                    console.log("  Use Application Insights search to filter by custom properties");
                    console.log("  Example queries:");
                    console.log("    - customDimensions.business.tenant == 'acme-corp'");
                    console.log("    - customDimensions.user.subscription == 'premium'");
                    console.log("    - customDimensions.feature.new.checkout == true");
                }
            }
        });
    }
}
