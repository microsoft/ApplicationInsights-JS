import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import { ApplicationInsights } from "../../../src/applicationinsights-web";
import { eOTelSpanKind, eOTelSpanStatusCode, isTracingSuppressed, ITelemetryItem, unsuppressTracing } from "@microsoft/applicationinsights-core-js";
import { objIs, setBypassLazyCache } from "@nevware21/ts-utils";
import { AnalyticsPluginIdentifier, PropertiesPluginIdentifier } from "@microsoft/applicationinsights-core-js";

/**
 * Integration Tests for Span APIs with Properties Plugin and Analytics Plugin
 *
 * Tests verify that span telemetry correctly integrates with:
 * - PropertiesPlugin: session, user, device, application context
 * - AnalyticsPlugin: telemetry creation, dependency tracking, page views
 * - Telemetry Initializers: custom property injection
 * - SDK configuration: sampling, disabled tracking, etc.
 */
export class OTelInitTests extends AITestClass {
    private _ai!: ApplicationInsights;

    constructor(testName?: string) {
        super(testName || "OTelInitTests");
    }

    public testInitialize() {
        try {
            setBypassLazyCache(true);
            this.useFakeServer = true;
            
            this._ai = new ApplicationInsights({
                config: {
                    instrumentationKey: "test-ikey-123",
                    disableInstrumentationKeyValidation: true,
                    disableAjaxTracking: false,
                    disableXhr: false,
                    disableFetchTracking: false,
                    enableAutoRouteTracking: false,
                    disableExceptionTracking: false,
                    maxBatchInterval: 100,
                    enableDebug: false,
                    extensionConfig: {
                        ["AppInsightsPropertiesPlugin"]: {
                            accountId: "test-account-id"
                        }
                    },
                    traceCfg: {
                        coreTrace: 1
                    } as any
                }
            });

            this._ai.loadAppInsights();
        } catch (e) {
            Assert.ok(false, "Failed to initialize tests: " + e);
            console.error("Failed to initialize tests: " + e);
            throw e;
        }
    }

    public testFinishedCleanup() {
        if (this._ai && this._ai.unload) {
            this._ai.unload(false);
        }
        setBypassLazyCache(false);
    }

    public registerTests() {
        this.testCase({
            name: "OTelInitTests",
            test: () => {
                Assert.ok(this._ai, "ApplicationInsights instance should be initialized");
                Assert.ok(this._ai.getPlugin(PropertiesPluginIdentifier), "PropertiesPlugin should be loaded");
                Assert.ok(this._ai.getPlugin(AnalyticsPluginIdentifier), "AnalyticsPlugin should be loaded");
                Assert.ok(!isTracingSuppressed(this._ai.core), "Tracing should not be suppressed by default");
            }
        });

        this.testCase({
            name: "Validate OTelApi",
            test: () => {
                const otelApi = this._ai.otelApi;
                Assert.ok(otelApi, "OTel API should be available");
                Assert.ok(otelApi.cfg, "OTel configuration should be available");
                Assert.ok(objIs(this._ai, otelApi.host), "OTel API host should be the same as the SKU instance");
                Assert.ok(objIs(otelApi.cfg.traceCfg, this._ai.core.config.traceCfg), "OTel trace configuration should be the same as the SDK config");
                Assert.ok(objIs(otelApi.host.config, this._ai.config), "OTel API config should be the same as the SDK config");
                Assert.ok(objIs(otelApi.host.config, this._ai.core.config), "OTel API config should be the same as the SDK core config");
                Assert.ok(objIs(this._ai.config, this._ai.core.config), "SDK config should be the same as the SDK core config");
            }
        });

        this.testCase({
            name: "Validate Trace suppression",
            test: () => {
                const otelApi = this._ai.otelApi;
                Assert.ok(otelApi, "OTel API should be available");
                Assert.equal(false, isTracingSuppressed(this._ai.core), "Tracing should not be suppressed by default"); 
                Assert.equal(false, otelApi.cfg.traceCfg?.suppressTracing, "supressTracing should be false by default");
                Assert.equal(false, this._ai.core.config.traceCfg.suppressTracing, "suppressTracing should be false by default");

                this._ai.core.config.traceCfg.suppressTracing = true;
                Assert.equal(true, isTracingSuppressed(this._ai.core), "Tracing should be suppressed when suppressTracing is set to true");
                Assert.equal(true, otelApi.cfg.traceCfg?.suppressTracing, "supressTracing should be true when suppressTracing is set to true");
                Assert.equal(true, this._ai.core.config.traceCfg.suppressTracing, "suppressTracing should be true when suppressTracing is set to true");

                unsuppressTracing(this._ai.core);
                Assert.equal(false, isTracingSuppressed(this._ai.core), "Tracing should not be suppressed after unsuppressTracing");
                Assert.equal(false, this._ai.core.config.traceCfg.suppressTracing, "suppressTracing should be false by default");
                Assert.equal(false, otelApi.cfg.traceCfg?.suppressTracing, "supressTracing should be false after unsuppressTracing");
            }
        });

    }
}
