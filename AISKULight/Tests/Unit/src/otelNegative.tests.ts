// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import { ApplicationInsights } from "../../../src/index";
import { utlRemoveSessionStorage } from "@microsoft/applicationinsights-common";
import { isNullOrUndefined, newId } from "@microsoft/applicationinsights-core-js";

/**
 * Negative tests for OpenTelemetry usage in AISKU Light
 * These tests ensure that no exceptions are thrown and helpers behave correctly
 * when there is no trace provider or OTel support instances
 */
export class AISKULightOTelNegativeTests extends AITestClass {
    private readonly _instrumentationKey = "testIkey-1234-5678-9012-3456789012";
    private _sessionPrefix: string;

    public testInitialize() {
        super.testInitialize();
        this._sessionPrefix = newId();
    }

    public testCleanup() {
        utlRemoveSessionStorage(null as any, "AI_sentBuffer");
        utlRemoveSessionStorage(null as any, "AI_buffer");
        utlRemoveSessionStorage(null as any, this._sessionPrefix + "_AI_sentBuffer");
        utlRemoveSessionStorage(null as any, this._sessionPrefix + "_AI_buffer");
        super.testCleanup();
    }

    public registerTests() {
        this.addTraceContextWithoutProviderTests();
        this.addUnloadWithoutProviderTests();
        this.addConfigurationChangesWithoutProviderTests();
    }

    private addTraceContextWithoutProviderTests(): void {
        this.testCase({
            name: "AISKULight.getTraceCtx: should return valid context without trace provider",
            test: () => {
                // Arrange
                const config = {
                    instrumentationKey: this._instrumentationKey,
                    namePrefix: this._sessionPrefix
                };
                const ai = new ApplicationInsights(config);
                this.onDone(() => {
                    ai.unload(false);
                });

                // Act - no trace provider is set by default in AISKU Light
                const ctx = ai.getTraceCtx();

                // Assert - should return a valid context without throwing
                Assert.ok(ctx !== undefined, "Should return a context (can be null)");
                
                // If it returns a context, it should be valid
                Assert.ok(!isNullOrUndefined(ctx?.traceId), "Context should have traceId");
                Assert.ok(!isNullOrUndefined(ctx?.spanId), "Context should have spanId");
                Assert.equal("", ctx?.spanId, "SpanId should be empty string without provider");
            }
        });

        this.testCase({
            name: "AISKULight.getTraceCtx: should not throw when called multiple times",
            test: () => {
                // Arrange
                const config = {
                    instrumentationKey: this._instrumentationKey,
                    namePrefix: this._sessionPrefix
                };
                const ai = new ApplicationInsights(config);
                this.onDone(() => {
                    ai.unload(false);
                });

                // Act & Assert
                Assert.doesNotThrow(() => {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const _ctx1 = ai.getTraceCtx();
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const _ctx2 = ai.getTraceCtx();
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const _ctx3 = ai.getTraceCtx();
                    
                    // Multiple calls should work without issues
                    Assert.ok(true, "Multiple getTraceCtx calls should not throw");
                    Assert.equal(_ctx1, _ctx2, "Multiple calls should return same context instance");
                    Assert.equal(_ctx2, _ctx3, "Multiple calls should return same context instance");
                    Assert.equal(_ctx1?.traceId, _ctx2?.traceId, "TraceId should be consistent across calls");
                    Assert.equal(_ctx2?.traceId, _ctx3?.traceId, "TraceId should be consistent across calls");
                    Assert.equal(_ctx1?.spanId, _ctx2?.spanId, "SpanId should be consistent across calls");
                    Assert.equal(_ctx2?.spanId, _ctx3?.spanId, "SpanId should be consistent across calls");
                }, "Multiple getTraceCtx calls should be safe");
            }
        });

        this.testCase({
            name: "AISKULight: getTraceCtx should work after unload",
            test: () => {
                // Arrange
                const config = {
                    instrumentationKey: this._instrumentationKey,
                    namePrefix: this._sessionPrefix
                };
                const ai = new ApplicationInsights(config);

                // Act - unload first
                ai.unload(false);

                // Assert - should not throw even after unload
                Assert.doesNotThrow(() => {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const _ctx = ai.getTraceCtx();
                    // Context might be null after unload, which is fine
                }, "getTraceCtx should not throw after unload");
            }
        });
    }



    private addUnloadWithoutProviderTests(): void {
        this.testCase({
            name: "AISKULight: unload should work gracefully without trace provider",
            test: () => {
                // Arrange
                const config = {
                    instrumentationKey: this._instrumentationKey,
                    namePrefix: this._sessionPrefix
                };
                const ai = new ApplicationInsights(config);

                // Act & Assert
                Assert.doesNotThrow(() => {
                    ai.unload(false);
                }, "Unload should work without trace provider");

                // Verify we can still access config after unload
                Assert.ok(ai.config, "Config should still be accessible after unload");
            }
        });

        this.testCase({
            name: "AISKULight: unload with async flag should work without provider",
            test: () => {
                // Arrange
                const config = {
                    instrumentationKey: this._instrumentationKey,
                    namePrefix: this._sessionPrefix
                };
                const ai = new ApplicationInsights(config);

                // Act & Assert
                Assert.doesNotThrow(() => {
                    ai.unload(true);
                }, "Async unload should work without trace provider");
            }
        });
    }

    private addConfigurationChangesWithoutProviderTests(): void {
        this.testCase({
            name: "AISKULight: should handle traceCfg in config without trace provider",
            test: () => {
                // Arrange
                const config = {
                    instrumentationKey: this._instrumentationKey,
                    namePrefix: this._sessionPrefix,
                    traceCfg: {
                        suppressTracing: false
                    }
                };

                // Act & Assert
                Assert.doesNotThrow(() => {
                    const ai = new ApplicationInsights(config);
                    
                    // Verify traceCfg is present
                    Assert.ok(ai.config.traceCfg, "traceCfg should be accessible");
                    
                    this.onDone(() => {
                        ai.unload(false);
                    });
                }, "Should handle traceCfg without trace provider");
            }
        });
    }
}
