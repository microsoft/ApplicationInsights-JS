import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { AppInsightsCore, createDistributedTraceContext, createDynamicConfig } from "@microsoft/applicationinsights-core-js";
import { _SessionManager } from "../../../src/Context/Session";
import { TelemetryContext } from "../../../src/TelemetryContext";
import { IConfiguration } from "@microsoft/applicationinsights-core-js";
import { TestChannelPlugin } from "./TestChannelPlugin";

export class TelemetryContextTests extends AITestClass {
    private core: AppInsightsCore;
    private _config: IConfiguration;
    private _cookies: { [name: string ]: string } = {};

    constructor(emulateIe?: boolean) {
        super("TelemetryContextTests", emulateIe);
    }

    public testInitialize() {
        let _self = this;
        _self._config = createDynamicConfig({
            instrumentationKey: "Test-iKey",
            disableInstrumentationKeyValidation: true,
            extensions: [ new TestChannelPlugin() ],
            extensionConfig: {
                AppInsightsPropertiesPlugin: {}
            },
            cookieCfg: {
                setCookie: (name: string, value: string) => {},
                getCookie: (name: string) => { return ""; },
                delCookie: (name: string) => {}
            }
        }, null).cfg;

        _self._cookies = {};
        _self.core = new AppInsightsCore();
        _self.core.initialize(_self._config, []);
        _self.core.logger = _self.core.logger;
    }

    public testCleanup() {
        this.core = null;
    }

    public registerTests() {
        this.testCase({
            name: 'TelemetryContext: applyOperationContext - default',
            test: () => {
                let coreParentId = this.core.getTraceCtx()?.getSpanId();
                let coreTraceId = this.core.getTraceCtx()?.getTraceId();
                let context = new TelemetryContext(this.core, this._config.extensionConfig!.AppInsightsPropertiesPlugin);
                let theEvent = {} as any;

                context.applyOperationContext(theEvent);

                Assert.equal(context.telemetryTrace.traceID, theEvent.ext.trace.traceID, "Validate traceId");
                Assert.equal(coreTraceId, theEvent.ext.trace.traceID, "Validate traceId");
                Assert.equal(coreParentId, theEvent.ext.trace.parentID, "ParentID matches the core spanId");
            }
        });

        this.testCase({
            name: 'TelemetryContext: applyOperationContext - uses the current context spanId when it differs from its parent',
            test: () => {
                let parentCtx = this.core.getTraceCtx();
                let parentSpanId = parentCtx.spanId;
                let childCtx = createDistributedTraceContext(parentCtx);
                childCtx.spanId = "0123456789abcdef";
                Assert.equal(parentSpanId, parentCtx.spanId, "Parent spanId should not be changed");
                this.core.setTraceCtx(childCtx);

                let context = new TelemetryContext(this.core, this._config.extensionConfig!.AppInsightsPropertiesPlugin);
                let theEvent = {} as any;
                context.applyOperationContext(theEvent);

                Assert.equal("0123456789abcdef", theEvent.ext.trace.parentID, "ParentID should be the current context spanId");
                Assert.equal(parentCtx.traceId, theEvent.ext.trace.traceID, "Validate traceId");
            }
        });

        this.testCase({
            name: 'TelemetryContext: applyOperationContext - child context sharing its parent spanId',
            test: () => {
                let parentCtx = this.core.getTraceCtx();
                let childCtx = createDistributedTraceContext(parentCtx);
                this.core.setTraceCtx(childCtx);

                let context = new TelemetryContext(this.core, this._config.extensionConfig!.AppInsightsPropertiesPlugin);
                let theEvent = {} as any;
                context.applyOperationContext(theEvent);

                Assert.equal(parentCtx.spanId, theEvent.ext.trace.parentID, "ParentID should be the shared spanId");
            }
        });

        this.testCase({
            name: 'TelemetryContext: applyOperationContext - does not override traceId',
            test: () => {

                Assert.ok(this.core, "Core is not null");
                let context = new TelemetryContext(this.core, this._config.extensionConfig!.AppInsightsPropertiesPlugin);
                let theEvent = {
                    ext: {
                        trace: {
                            traceID: "myTraceId"
                        }
                    }
                } as any;

                context.telemetryTrace.traceID = "defaultTraceId";
                Assert.equal("defaultTraceId", context.telemetryTrace.traceID, "traceId should be defaultTraceId");
                context.telemetryTrace.parentID = "defaultParentId";
                Assert.equal("defaultParentId", context.telemetryTrace.parentID, "parentId should be defaultParentId");

                context.applyOperationContext(theEvent);

                Assert.equal("myTraceId", theEvent.ext.trace.traceID, "Validate traceId");
                Assert.equal("defaultParentId", theEvent.ext.trace.parentID, "Check ParentID");
            }
        });

        this.testCase({
            name: 'TelemetryContext: applyOperationContext - does not override parentID',
            test: () => {

                let context = new TelemetryContext(this.core, this._config.extensionConfig!.AppInsightsPropertiesPlugin);
                let theEvent = {
                    ext: {
                        trace: {
                            parentID: "mySpanId"
                        }
                    }
                } as any;

                context.telemetryTrace.traceID = "defaultTraceId";
                context.telemetryTrace.parentID = "defaultParentId";

                context.applyOperationContext(theEvent);

                Assert.equal("defaultTraceId", theEvent.ext.trace.traceID, "Validate traceId");
                Assert.equal("mySpanId", theEvent.ext.trace.parentID, "Check ParentID");
            }
        });

        this.testCase({
            name: 'TelemetryContext: applyOperationContext - does not override traceId and parentID',
            test: () => {

                let context = new TelemetryContext(this.core, this._config.extensionConfig!.AppInsightsPropertiesPlugin);
                let theEvent = {
                    ext: {
                        trace: {
                            traceID: "myTraceId",
                            parentID: "mySpanId"
                        }
                    }
                } as any;

                context.telemetryTrace.traceID = "defaultTraceId";
                context.telemetryTrace.parentID = "defaultParentId";

                context.applyOperationContext(theEvent);

                Assert.equal("myTraceId", theEvent.ext.trace.traceID, "Validate traceId");
                Assert.equal("mySpanId", theEvent.ext.trace.parentID, "Check ParentID");
            }
        });
    }
}
