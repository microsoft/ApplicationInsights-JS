/// <reference path="./TestFramework/Common.ts" />
/// <reference path="../JavaScriptSDK/ApplicationInsights.ts" />

import { IConfig, Util } from "applicationinsights-common";
import { ApplicationInsights } from "../JavaScriptSDK/ApplicationInsights";

export class ApplicationInsightsTests extends TestClass {
    private getAppInsightsSnippet() {
        var snippet: IConfig = {
            instrumentationKey: "",
            endpointUrl: "https://dc.services.visualstudio.com/v2/track",
            emitLineDelimitedJson: false,
            accountId: undefined,
            sessionRenewalMs: 10,
            sessionExpirationMs: 10,
            maxBatchSizeInBytes: 1000000,
            maxBatchInterval: 1,
            enableDebug: false,
            disableExceptionTracking: false,
            disableTelemetry: false,
            verboseLogging: false,
            diagnosticLogInterval: 1000,
            autoTrackPageVisitTime: false,
            samplingPercentage: 100,
            disableAjaxTracking: true,
            overridePageViewDuration: false,
            maxAjaxCallsPerView: 20,
            cookieDomain: undefined,
            disableDataLossAnalysis: true,
            disableCorrelationHeaders: false,
            disableFlushOnBeforeUnload: false,
            enableSessionStorageBuffer: false,
            isCookieUseDisabled: false,
            isRetryDisabled: false,
            isStorageUseDisabled: false,
            isBeaconApiDisabled: true,
            appId: undefined,
            enableCorsCorrelation: false
        };

        // set default values
        return snippet;
    }

    public testInitialize() {
        this.clock.reset();
        Util.setCookie('ai_session', "");
        Util.setCookie('ai_user', "");
        if (Util.canUseLocalStorage()) {
            window.localStorage.clear();
        }
    }

    public testCleanup() {
        Util.setCookie('ai_session', "");
        Util.setCookie('ai_user', "");
        if (Util.canUseLocalStorage()) {
            window.localStorage.clear();
        }
    }

    public registerTests() {
        this.testCase({
            name: "AppInsightsTests: public members are correct",
            test: () => {
                var appInsights = new ApplicationInsights(this.getAppInsightsSnippet());
                var leTest = (name) => {
                    Assert.ok(name in appInsights, name + " exists");
                }

                var members = ["config"];
                while (members.length) {
                    leTest(members.pop());
                }
            }
        });
    }
}