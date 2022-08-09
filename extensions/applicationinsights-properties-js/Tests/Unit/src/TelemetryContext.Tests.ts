import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { AppInsightsCore, DiagnosticLogger, createCookieMgr } from "@microsoft/applicationinsights-core-js";
import { _SessionManager } from "../../../src/Context/Session";
import { TelemetryContext } from "../../../src/TelemetryContext";
import { ITelemetryConfig } from "../../../src/Interfaces/ITelemetryConfig";

export class TelemetryContextTests extends AITestClass {
    private core: AppInsightsCore;
    private _cookies: { [name: string ]: string } = {};

    constructor(emulateEs3?: boolean) {
        super("TelemetryContextTests", emulateEs3);
    }

    public testInitialize() {
        let _self = this;
        _self._cookies = {};
        _self.core = new AppInsightsCore();
        _self.core.logger = new DiagnosticLogger();
        _self.core.setCookieMgr(createCookieMgr({
            cookieCfg: {
                setCookie: (name: string, value: string) => {},
                getCookie: (name: string) => { return ""; },
                delCookie: (name: string) => {}
            }
        }, _self.core.logger))
    }

    public testCleanup() {
        this.core = null;
    }

    public registerTests() {
        this.testCase({
            name: 'TelemetryContext: applyOperationContext - default',
            test: () => {

                let context = new TelemetryContext(this.core, {} as ITelemetryConfig);
                let theEvent = {} as any;

                context.applyOperationContext(theEvent);

                Assert.equal(context.telemetryTrace.traceID, theEvent.ext.trace.traceID, "Validate traceId");
                Assert.equal(undefined, theEvent.ext.trace.parentID, "No ParentID");
            }

        });

        this.testCase({
            name: 'TelemetryContext: applyOperationContext - does not override traceId',
            test: () => {

                let context = new TelemetryContext(this.core, {} as ITelemetryConfig);
                let theEvent = {
                    ext: {
                        trace: {
                            traceID: "myTraceId"
                        }
                    }
                } as any;

                context.telemetryTrace.traceID = "defaultTraceId";
                context.telemetryTrace.parentID = "defaultParentId";

                context.applyOperationContext(theEvent);

                Assert.equal("myTraceId", theEvent.ext.trace.traceID, "Validate traceId");
                Assert.equal("defaultParentId", theEvent.ext.trace.parentID, "Check ParentID");
            }
        });

        this.testCase({
            name: 'TelemetryContext: applyOperationContext - does not override parentID',
            test: () => {

                let context = new TelemetryContext(this.core, {} as ITelemetryConfig);
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

                let context = new TelemetryContext(this.core, {} as ITelemetryConfig);
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
