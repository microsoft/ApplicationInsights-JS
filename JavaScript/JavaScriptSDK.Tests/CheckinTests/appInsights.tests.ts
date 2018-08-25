/// <reference path="../TestFramework/Common.ts" />
/// <reference path="../../JavaScriptSDK/AppInsights.ts" />
/// <reference path="../../JavaScriptSDK/Util.ts"/>

class AppInsightsTests extends TestClass {
    private getAppInsightsSnippet() {
        var snippet: Microsoft.ApplicationInsights.IConfig = {
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
        if (this.clock) {
            this.clock.reset();
        }
        Microsoft.ApplicationInsights.Util.setCookie('ai_session', "");
        Microsoft.ApplicationInsights.Util.setCookie('ai_user', "");
        if (Microsoft.ApplicationInsights.Util.canUseLocalStorage()) {
            window.localStorage.clear();
        }
    }

    public testCleanup() {
        Microsoft.ApplicationInsights.Util.setCookie('ai_session', "");
        Microsoft.ApplicationInsights.Util.setCookie('ai_user', "");
        if (Microsoft.ApplicationInsights.Util.canUseLocalStorage()) {
            window.localStorage.clear();
        }
    }

    public registerTests() {

        this.testCase({
            name: "AppInsightsTests: public members are correct",
            test: () => {
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
                var leTest = (name) => {
                    Assert.ok(name in appInsights, name + " exists");
                }

                var members = ["context"];
                while (members.length) {
                    leTest(members.pop());
                }
            }
        });

        this.testCase({
            name: "AppInsightsTests: public methods are correct",
            test: () => {
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
                var leTest = (name) => {
                    Assert.ok(name in appInsights, name + " exists");
                    Assert.ok(typeof appInsights[name] === "function", name + " is a method");
                }

                var methods = ["trackTrace", "trackEvent", "trackMetric", "trackException", "trackPageView", "trackAjax"];
                while (methods.length) {
                    leTest(methods.pop());
                }
            }
        });

        this.testCase({
            name: "AppInsightsTests: master off switch can disable sending data",
            test: () => {
                // setup
                var config = this.getAppInsightsSnippet();
                config.disableTelemetry = true;
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(config);
                appInsights.context._sender._sender = () => null;
                var senderStub = this.sandbox.stub(appInsights.context._sender, "_sender", () => {
                    console.log("GOT HERE");
                });

                // verify
                var test = (action) => {
                    action();
                    this.clock.tick(1);
                    Assert.ok(senderStub.notCalled, "sender was not called called for: " + action);

                };

                // act
                test(() => appInsights.trackEvent("testEvent"));
            }
        });

        this.testCase({
            name: "AppInsightsTests: track page view performance",
            test: () => {
                // setup
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
                var trackStub = this.sandbox.stub(appInsights.context._sender, "send");

                // act
                appInsights.trackPageView();

                // act
                this.clock.tick(100);

                // verify
                Assert.ok(trackStub.calledTwice, "track was called");
            }
        });

        this.testCase({
            name: "AppInsightsTests: envelope type, data type and ikey are correct",
            test: () => {
                // setup
                var iKey = "BDC8736D-D8E8-4B69-B19B-B0CE6B66A456";
                var iKeyNoDash = "BDC8736DD8E84B69B19BB0CE6B66A456";
                var config = this.getAppInsightsSnippet();
                config.instrumentationKey = iKey;
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(config);
                var trackStub = this.sandbox.stub(appInsights.context._sender, "send");

                // verify
                var test = (action, expectedEnvelopeType, expectedDataType) => {
                    action();
                    var envelope = this.getFirstResult(action, trackStub);
                    Assert.equal(iKey, envelope.iKey, "envelope iKey");
                    Assert.equal(expectedEnvelopeType.replace("{0}", iKeyNoDash), envelope.name, "envelope name");
                    Assert.equal(expectedDataType, envelope.data.baseType, "type name");
                    trackStub.reset();
                };

                // act
                test(() => appInsights.trackEvent("testEvent"), Microsoft.ApplicationInsights.Telemetry.Event.envelopeType, Microsoft.ApplicationInsights.Telemetry.Event.dataType);
            }
        });

        this.testCase({
            name: "AppInsightsTests: envelope time is correct",
            test: () => {
                // setup
                var config = this.getAppInsightsSnippet();
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(config);
                var trackStub = this.sandbox.stub(appInsights.context._sender, "send");
                this.clock.tick(60000);

                // act 
                appInsights.trackEvent("testEvent");

                // verify
                var envelope = this.getFirstResult("track was called", trackStub);
                Assert.equal(60000, new Date(envelope.time).getTime(), "envelope time");
            }
        });

        this.testCase({
            name: "AppInsightsTests: appId is propagated from the config",
            test: () => {
                var expectedAppId = "BDC8736D-D8E8-4B69-B19B-B0CE6B66A456";

                // setup
                var config = this.getAppInsightsSnippet();
                config.appId = expectedAppId;
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(config);
                var trackStub = this.sandbox.stub(appInsights.context._sender, "send");
                this.clock.tick(60000);

                Assert.equal(expectedAppId, appInsights.context._sender._appId);

                // act 
                appInsights.trackEvent("testEvent");

                // verify
                Assert.equal(expectedAppId, appInsights.context._sender._appId);
            }
        });

        this.testCase({
            name: "AppInsightsTests: application context is applied",
            test: () => {
                // setup
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
                appInsights.context.application.ver = "101";
                appInsights.context.application.build = "101";
                var trackStub = this.sandbox.stub(appInsights.context._sender, "send");

                // verify
                var test = (action) => {
                    action();
                    this.clock.tick(1);
                    var envelope = this.getFirstResult(action, trackStub);
                    var contextKeys = new AI.ContextTagKeys();
                    Assert.equal("101", envelope.tags[contextKeys.applicationVersion], "application.ver");
                    Assert.equal("101", envelope.tags[contextKeys.applicationBuild], "application.build");
                    trackStub.reset();
                };

                // act
                test(() => appInsights.trackEvent("testEvent"));
            }
        });

        this.testCase({
            name: "AppInsightsTests: device context is applied",
            test: () => {
                // setup
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
                appInsights.context.device.id = "101";
                appInsights.context.device.ip = "101";
                appInsights.context.device.language = "101";
                appInsights.context.device.locale = "101";
                appInsights.context.device.model = "101";
                appInsights.context.device.network = 101;
                appInsights.context.device.oemName = "101";
                appInsights.context.device.os = "101";
                appInsights.context.device.osversion = "101";
                appInsights.context.device.resolution = "101";
                appInsights.context.device.type = "101";

                var trackStub = this.sandbox.stub(appInsights.context._sender, "send");

                // verify
                var test = (action) => {
                    action();
                    this.clock.tick(1);
                    var envelope = this.getFirstResult(action, trackStub);
                    var contextKeys = new AI.ContextTagKeys();
                    Assert.equal("101", envelope.tags[contextKeys.deviceId], "device.id");
                    Assert.equal("101", envelope.tags[contextKeys.deviceIp], "device.ip");
                    Assert.equal("101", envelope.tags[contextKeys.deviceLanguage], "device.language");
                    Assert.equal("101", envelope.tags[contextKeys.deviceLocale], "device.locale");
                    Assert.equal("101", envelope.tags[contextKeys.deviceModel], "device.model");
                    Assert.equal("101", envelope.tags[contextKeys.deviceNetwork], "device.network");
                    Assert.equal("101", envelope.tags[contextKeys.deviceOEMName], "device.oemName");
                    Assert.equal("101", envelope.tags[contextKeys.deviceOS], "device.os");
                    Assert.equal("101", envelope.tags[contextKeys.deviceOSVersion], "device.osversion");
                    Assert.equal("101", envelope.tags[contextKeys.deviceScreenResolution], "device.resolution");
                    Assert.equal("101", envelope.tags[contextKeys.deviceType], "device.type");

                    trackStub.reset();
                };

                // act
                test(() => appInsights.trackEvent("testEvent"));
            }
        });

        this.testCase({
            name: "AppInsightsTests: internal context is applied",
            test: () => {
                // setup
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
                appInsights.context.internal.agentVersion = "101";
                appInsights.context.internal.sdkVersion = "101";
                var trackStub = this.sandbox.stub(appInsights.context._sender, "send");

                // verify
                var test = (action) => {
                    action();
                    this.clock.tick(1);
                    var envelope = this.getFirstResult(action, trackStub);
                    var contextKeys = new AI.ContextTagKeys();
                    Assert.equal("101", envelope.tags[contextKeys.internalAgentVersion], "internal.agentVersion");
                    Assert.equal("101", envelope.tags[contextKeys.internalSdkVersion], "internal.sdkVersion");
                    trackStub.reset();
                };

                // act
                test(() => appInsights.trackEvent("testEvent"));
            }
        });

        this.testCase({
            name: "AppInsightsTests: location context is applied",
            test: () => {
                // setup
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
                appInsights.context.location.ip = "101";
                var trackStub = this.sandbox.stub(appInsights.context._sender, "send");

                // verify
                var test = (action) => {
                    action();
                    this.clock.tick(1);
                    var envelope = this.getFirstResult(action, trackStub);
                    var contextKeys = new AI.ContextTagKeys();
                    Assert.equal("101", envelope.tags[contextKeys.locationIp], "location.ip");
                    trackStub.reset();
                };

                // act
                test(() => appInsights.trackEvent("testEvent"));
            }
        });

        this.testCase({
            name: "AppInsightsTests: operation context is applied",
            test: () => {
                // setup
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
                appInsights.context.operation.id = "101";
                appInsights.context.operation.name = "101";
                appInsights.context.operation.parentId = "101";
                appInsights.context.operation.rootId = "101";
                appInsights.context.operation.syntheticSource = "101";
                var trackStub = this.sandbox.stub(appInsights.context._sender, "send");

                // verify
                var test = (action) => {
                    action();
                    this.clock.tick(1);
                    var envelope = this.getFirstResult(action, trackStub);
                    var contextKeys = new AI.ContextTagKeys();
                    Assert.equal("101", envelope.tags[contextKeys.operationId], "operation.id");
                    Assert.equal("101", envelope.tags[contextKeys.operationName], "operation.name");
                    Assert.equal("101", envelope.tags[contextKeys.operationParentId], "operation.parentId");
                    Assert.equal("101", envelope.tags[contextKeys.operationRootId], "operation.rootId");
                    Assert.equal("101", envelope.tags[contextKeys.operationSyntheticSource], "operation.syntheticSource");
                    trackStub.reset();
                };

                // act
                test(() => appInsights.trackEvent("testEvent"));
            }
        });

        this.testCase({
            name: "AppInsightsTests: sample context is applied",
            test: () => {
                // setup
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
                appInsights.context.sample.sampleRate = 33;
                var trackSpy = this.sandbox.spy(appInsights.context, "_track");

                // verify
                var test = (action) => {
                    action();
                    this.clock.tick(1);
                    var envelope = trackSpy.returnValues[0];
                    var contextKeys = new AI.ContextTagKeys();
                    Assert.equal(33, envelope.sampleRate, "sample.sampleRate");
                    trackSpy.reset();
                };

                // act
                test(() => appInsights.trackEvent("testEvent"));
            }
        });

        this.testCase({
            name: "AppInsightsTests: appInsights.context.sample.IsSampledIn() receives an envelope with sampling-related contexts applied (sample, user)",
            test: () => {
                // setup
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
                appInsights.context.sample.sampleRate = 33;
                appInsights.context.user.id = "asdf";
                var trackSpy = this.sandbox.spy(appInsights.context.sample, "isSampledIn");

                // verify
                var test = (action) => {
                    action();
                    this.clock.tick(1);
                    //var envelope = this.getFirstResult(action, trackStub);
                    var envelope = trackSpy.args[0][0];
                    var contextKeys = new AI.ContextTagKeys();
                    Assert.equal(33, envelope.sampleRate, "sample.sampleRate");
                    Assert.equal("asdf", envelope.tags[contextKeys.userId], "user.id");
                    trackSpy.reset();
                };

                // act
                test(() => appInsights.trackEvent("testEvent"));
                var pageViewTimeout = 100; // page views are sent with 100 ms delay (see trackPageView implementation).
                test(() => { appInsights.trackPageView(); this.clock.tick(pageViewTimeout); });
                test(() => appInsights.trackException(new Error()));
                test(() => appInsights.trackTrace("testTrace"));
            }
        });

        this.testCase({
            name: "AppInsightsTests: session context is applied",
            test: () => {
                // setup
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
                appInsights.context.session.id = "101";
                appInsights.context.session.isFirst = true;
                var trackStub = this.sandbox.stub(appInsights.context._sender, "send");

                // verify
                var test = (action) => {
                    action();
                    this.clock.tick(1);
                    var envelope = this.getFirstResult(action, trackStub);
                    var contextKeys = new AI.ContextTagKeys();
                    Assert.equal("101", envelope.tags[contextKeys.sessionId], "session.id");
                    Assert.equal(true, envelope.tags[contextKeys.sessionIsFirst], "session.isFirstSession");
                    trackStub.reset();
                };

                // act
                test(() => appInsights.trackEvent("testEvent"));
            }
        });

        this.testCase({
            name: "AppInsightsTests: user context is applied",
            test: () => {
                // setup
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
                appInsights.context.user.accountId = "101";
                appInsights.context.user.agent = "101";
                appInsights.context.user.id = "101";
                appInsights.context.user.storeRegion = "101";
                var trackStub = this.sandbox.stub(appInsights.context._sender, "send");

                // verify
                var test = (action) => {
                    action();
                    this.clock.tick(1);
                    var envelope = this.getFirstResult(action, trackStub);
                    var contextKeys = new AI.ContextTagKeys();
                    Assert.equal("101", envelope.tags[contextKeys.userAccountId], "user.accountId");
                    Assert.equal("101", envelope.tags[contextKeys.userAgent], "user.agent");
                    Assert.equal("101", envelope.tags[contextKeys.userId], "user.id");
                    Assert.equal("101", envelope.tags[contextKeys.userStoreRegion], "user.storeRegion");
                    trackStub.reset();
                };

                // act
                test(() => appInsights.trackEvent("testEvent"));
            }
        });

        this.testCase({
            name: "AppInsightsTests: set authenticatedId context is applied",
            test: () => {
                // setup
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());

                appInsights.setAuthenticatedUserContext("10001");

                var trackStub = this.sandbox.stub(appInsights.context._sender, "send");

                // verify
                var test = (action) => {
                    action();
                    this.clock.tick(1);
                    var envelope = this.getFirstResult(action, trackStub);
                    var contextKeys = new AI.ContextTagKeys();
                    Assert.equal("10001", envelope.tags[contextKeys.userAuthUserId], "user.authenticatedId");

                    trackStub.reset();
                };

                // act
                test(() => appInsights.trackEvent("testEvent"));
            }
        });

        this.testCase({
            name: "AppInsightsTests: set authenticatedId and accountId context is applied",
            test: () => {
                // setup
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());

                appInsights.setAuthenticatedUserContext("10001", "account33");

                var trackStub = this.sandbox.stub(appInsights.context._sender, "send");

                // verify
                var test = (action) => {
                    action();
                    this.clock.tick(1);
                    var envelope = this.getFirstResult(action, trackStub);
                    var contextKeys = new AI.ContextTagKeys();
                    Assert.equal("10001", envelope.tags[contextKeys.userAuthUserId], "user.authenticatedId");
                    Assert.equal("account33", envelope.tags[contextKeys.userAccountId], "user.accountId");

                    trackStub.reset();
                };

                // act
                test(() => appInsights.trackEvent("testEvent"));
            }
        });

        this.testCase({
            name: "AppInsightsTests: set authenticatedId and accountId context is applied with non-ascii languages",
            test: () => {
                // setup
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());

                appInsights.setAuthenticatedUserContext("\u0428", "\u0429"); // Cyrillic characters
                var trackStub = this.sandbox.stub(appInsights.context._sender, "send");

                // verify
                var test = (action) => {
                    action();
                    this.clock.tick(1);
                    var envelope = this.getFirstResult(action, trackStub);
                    var contextKeys = new AI.ContextTagKeys();
                    Assert.equal("\u0428", envelope.tags[contextKeys.userAuthUserId], "user.authenticatedId is correct");
                    Assert.equal("\u0429", envelope.tags[contextKeys.userAccountId], "user.accountId is correct");

                    trackStub.reset();
                };

                // act 
                test(() => appInsights.trackEvent("testEvent"));
            }
        });

        this.testCase({
            name: "AppInsightsTests: clear authID context is applied",
            test: () => {
                // setup
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
                var trackStub = this.sandbox.stub(appInsights.context._sender, "send");
                appInsights.setAuthenticatedUserContext("1234", "abcd");

                // Clear authenticatedId
                appInsights.clearAuthenticatedUserContext();

                // verify
                var test = (action) => {
                    action();
                    this.clock.tick(1);
                    var envelope = this.getFirstResult(action, trackStub);
                    var contextKeys = new AI.ContextTagKeys();
                    Assert.equal(undefined, envelope.tags[contextKeys.userAuthUserId], "user.authenticatedId");
                    Assert.equal(undefined, envelope.tags[contextKeys.userAccountId], "user.accountId");

                    trackStub.reset();
                };

                // act
                test(() => appInsights.trackEvent("testEvent"));
            }
        });

        this.testCase({
            name: "AppInsightsTests: set authenticatedId does not set the cookie by default",
            test: () => {
                let appInsights = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
                let setAuthStub = this.sandbox.stub(appInsights.context.user, "setAuthenticatedUserContext");

                appInsights.setAuthenticatedUserContext("10001");

                Assert.equal(true, setAuthStub.calledOnce);
                Assert.equal(false, setAuthStub.calledWithExactly("10001", null, false));

                setAuthStub.reset();
            }
        });

        this.testCase({
            name: "AppInsightsTests: trackPageView sends user-specified duration when passed",
            test: () => {
                var snippet = this.getAppInsightsSnippet();
                snippet.overridePageViewDuration = true;
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(snippet);
                var spy = this.sandbox.spy(appInsights, "sendPageViewInternal");

                // act
                appInsights.trackPageView(null, null, null, null, 124);

                // verify
                Assert.ok(spy.calledOnce, "sendPageViewInternal is called");
                Assert.equal(124, spy.args[0][2], "PageView duration doesn't match expected value");
            }
        });

        this.testCase({
            name: "AppInsightsTests: trackPageView sends user-specified duration when 0 passed",
            test: () => {
                var snippet = this.getAppInsightsSnippet();
                snippet.overridePageViewDuration = true;
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(snippet);
                var spy = this.sandbox.spy(appInsights, "sendPageViewInternal");

                // act
                appInsights.trackPageView(null, null, null, null, 0);

                // verify
                Assert.ok(spy.calledOnce, "sendPageViewInternal is called");
                Assert.equal(0, spy.args[0][2], "PageView duration doesn't match expected value");
            }
        });

        this.testCase({
            name: "AppInsightsTests: trackPageView sends custom duration when configured by user",
            test: () => {
                var snippet = this.getAppInsightsSnippet();
                snippet.overridePageViewDuration = true;
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(snippet);
                var spy = this.sandbox.spy(appInsights, "sendPageViewInternal");
                var stub = this.sandbox.stub(Microsoft.ApplicationInsights.Telemetry.PageViewPerformance, "getPerformanceTiming",
                    () => {
                        return { navigationStart: 0 };
                    });
                var getDurationMsStub = this.sandbox.stub(Microsoft.ApplicationInsights.Telemetry.PageViewPerformance.prototype, "getDurationMs",
                    () => {
                        return 54321;
                    });

                // act
                this.clock.tick(123);
                appInsights.trackPageView();

                // verify
                Assert.ok(spy.calledOnce, "sendPageViewInternal is called");
                Assert.equal(123, spy.args[0][2], "PageView duration doesn't match expected value");
            }
        });

        this.testCase({
            name: "AppInsightsTests: by default trackPageView gets the data from page view performance when it's available",
            test: () => {
                // setup
                var expectedDuration = 123;
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
                var spy = this.sandbox.stub(appInsights, "sendPageViewInternal");
                var checkPageLoadStub = this.sandbox.stub(Microsoft.ApplicationInsights.Telemetry.PageViewPerformance, "isPerformanceTimingDataReady",
                    () => { return true; });
                var getDurationStub = this.sandbox.stub(Microsoft.ApplicationInsights.Telemetry.PageViewPerformance.prototype, "getDurationMs",
                    () => { return expectedDuration; });

                // act
                appInsights.trackPageView();

                // Data not available yet - should not send events
                this.clock.tick(100);
                Assert.ok(spy.calledOnce, "Data is available so page view should be sent");
                Assert.equal(expectedDuration, spy.args[0][2], "Page view duration taken from page view performance object doesn't match expected value");
            }
        });


        this.testCase({
            name: "AppInsightsTests: if performance data is no valid then trackPageView sends page view with duration equal time to spent from navigation start time till calling into trackPageView",
            test: () => {
                // setup
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
                var spy = this.sandbox.stub(appInsights, "sendPageViewInternal");
                var checkPageLoadStub = this.sandbox.stub(Microsoft.ApplicationInsights.Telemetry.PageViewPerformance, "isPerformanceTimingDataReady",
                    () => { return true; });
                var getIsValidStub = this.sandbox.stub(Microsoft.ApplicationInsights.Telemetry.PageViewPerformance.prototype, "getIsValid",
                    () => { return false; });
                var stub = this.sandbox.stub(Microsoft.ApplicationInsights.Telemetry.PageViewPerformance, "getPerformanceTiming",
                    () => {
                        return { navigationStart: 0 };
                    });

                this.clock.tick(50);

                // act
                appInsights.trackPageView();

                // Data not available yet - should not send events
                this.clock.tick(100);
                Assert.ok(spy.called, "Page view should not be sent since the timing data is invalid");
                Assert.equal(50, spy.args[0][2], "Page view duration should be equal to time from navigation start to when trackPageView is called (aka 'override page view duration' mode)");
            }
        });

        this.testCase({
            name: "AppInsightsTests: if in 'override page view duration' mode, trackPageView won't report duration if it exceeded max duration",
            test: () => {
                // setup
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
                var spy = this.sandbox.stub(appInsights, "sendPageViewInternal");
                var checkPageLoadStub = this.sandbox.stub(Microsoft.ApplicationInsights.Telemetry.PageViewPerformance, "isPerformanceTimingDataReady",
                    () => { return true; });
                var getIsValidStub = this.sandbox.stub(Microsoft.ApplicationInsights.Telemetry.PageViewPerformance.prototype, "getIsValid",
                    () => { return false; });
                var stub = this.sandbox.stub(Microsoft.ApplicationInsights.Telemetry.PageViewPerformance, "getPerformanceTiming",
                    () => {
                        return { navigationStart: 0 };
                    });

                this.clock.tick(3600000);

                // mock user agent
                let originalUserAgent = navigator.userAgent;
                try {
                    this.setUserAgent("Googlebot/2.1");
                } catch (ex) {
                    Assert.ok(true, 'cannot run this test in the current setup - try Chrome');
                    return;
                }

                // act
                appInsights.trackPageView();

                // Data not available yet - should not send events
                this.clock.tick(100);
                Assert.ok(spy.called, "Page view should not be sent since the timing data is invalid");
                Assert.equal(undefined, spy.args[0][2], "Page view duration should be undefined if it's coming from GoogleBot and is >=1h");

                // restore original user agent
                this.setUserAgent(originalUserAgent);
            }
        });

        this.testCase({
            name: "AppInsightsTests: trackPageView sends base data and performance data when available",
            test: () => {
                // setup
                var perfDataAvailable = false;
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
                var triggerStub = this.sandbox.stub(appInsights.context, "track");
                var checkPageLoadStub = this.sandbox.stub(Microsoft.ApplicationInsights.Telemetry.PageViewPerformance, "isPerformanceTimingDataReady", () => { return perfDataAvailable; });

                // act
                appInsights.trackPageView();

                // Data not available yet - should not send events
                this.clock.tick(100);
                Assert.ok(triggerStub.notCalled, "Data is not yet available hence nothing is sent");

                // Data becomes available - both page view and client perf should be sent
                perfDataAvailable = true;
                this.clock.tick(100);
                Assert.ok(triggerStub.calledTwice, "Data is available hence both page view and client perf should be sent");
            }
        });

        this.testCase({
            name: "AppInsightsTests: a page view is sent after 60 seconds even if perf data is not available",
            test: () => {
                // setup
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
                var spy = this.sandbox.stub(appInsights, "sendPageViewInternal");
                var checkPageLoadStub = this.sandbox.stub(Microsoft.ApplicationInsights.Telemetry.PageViewPerformance, "isPerformanceTimingDataReady",
                    () => { return false; });
                var stub = this.sandbox.stub(Microsoft.ApplicationInsights.Telemetry.PageViewPerformance, "getPerformanceTiming",
                    () => {
                        return { navigationStart: 0 };
                    });

                // act
                appInsights.trackPageView();

                // 60+ seconds passed, page view is supposed to be sent                
                this.clock.tick(65432);
                Assert.ok(spy.calledOnce, "60 seconds passed, page view is supposed to be sent");
                Assert.equal(60000, spy.args[0][2], "Page view duration doesn't match expected maximum duration (60000 ms)");
            }
        });

        this.testCase({
            name: "AppInsightsTests: a page view is sent with undefined duration if navigation timing API is not supported",
            test: () => {
                // setup
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
                var spy = this.sandbox.stub(appInsights, "sendPageViewInternal");
                var checkPageLoadStub = this.sandbox.stub(Microsoft.ApplicationInsights.Telemetry.PageViewPerformance, "isPerformanceTimingSupported",
                    () => { return false; });

                // act
                appInsights.trackPageView();
                this.clock.tick(100);

                // assert
                Assert.ok(spy.calledOnce, "sendPageViewInternal should be called even if navigation timing is not supported");
                Assert.equal(undefined, spy.args[0][2], "Page view duration should be `undefined`");
            }
        });

        this.testCase({
            name: "AppInsightsTests: trackException accepts single exception and an array of exceptions",
            test: () => {
                // setup
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
                var trackStub = this.sandbox.stub(appInsights.context._sender, "send");

                appInsights.trackException(new Error());
                Assert.ok(trackStub.calledOnce, "single exception is tracked");
                appInsights.trackException(<any>[new Error()]);
                Assert.ok(trackStub.calledTwice, "array of exceptions is tracked");
            }
        });

        this.testCase({
            name: "AppInsightsTests: trackException allows logging errors with different severity level",
            test: () => {
                // setup
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
                var trackStub = this.sandbox.stub(appInsights.context, "track");

                appInsights.trackException(new Error(), "test", null, null, AI.SeverityLevel.Critical);

                Assert.ok(trackStub.calledOnce, "single exception is tracked");
                Assert.equal(AI.SeverityLevel.Critical, trackStub.firstCall.args[0].data.baseData.severityLevel);

                trackStub.reset();

                appInsights.trackException(new Error(), "test", null, null, AI.SeverityLevel.Error);

                Assert.ok(trackStub.calledOnce, "single exception is tracked");
                Assert.equal(AI.SeverityLevel.Error, trackStub.firstCall.args[0].data.baseData.severityLevel);
            }
        });

        this.testCase({
            name: "AppInsightsTests: trackMetric batches metrics sent in a hot loop",
            test: () => {
                // setup
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
                var trackStub = this.sandbox.stub(appInsights.context._sender, "send");

                // act 
                appInsights.trackMetric("testMetric", 0);
                this.clock.tick(1);

                // verify
                Assert.ok(trackStub.calledOnce, "track was called once after sending one metric");
                trackStub.reset();

                // act
                for (var i = 0; i < 100; i++) {
                    appInsights.trackMetric("testMetric", 0);
                }

                this.clock.tick(1);

                // verify
                Assert.equal(100, trackStub.callCount, "track was called 100 times");
            }
        });

        this.testCase({
            name: "AppInsightsTests: config methods are set based on snippet",
            test: () => {
                // setup
                var snippet = this.getAppInsightsSnippet();
                snippet.cookieDomain = ".example.com";

                var appInsights = new Microsoft.ApplicationInsights.AppInsights(snippet);

                var test = (name) => {
                    Assert.equal(snippet[name], appInsights.context._config[name](), name + " is set and correct");
                };

                // verify
                test("instrumentationKey");
                test("accountId");
                test("sessionRenewalMs");
                test("sessionExpirationMs");
                test("cookieDomain");
                test("maxBatchSizeInBytes");
                test("maxBatchInterval");

                test("endpointUrl");
                test("emitLineDelimitedJson");
                test("maxBatchSizeInBytes");
                test("maxBatchInterval");
                test("disableTelemetry");
                test("enableSessionStorageBuffer");
                test("isRetryDisabled");
                test("isBeaconApiDisabled");

                Assert.equal(snippet.enableDebug, Microsoft.ApplicationInsights._InternalLogging.enableDebugExceptions(), "enableDebugExceptions is set and correct");
            }
        });

        this.testCase({
            name: "AppInsightsTests: disabled session storage and change the max payload size if Beacon API is enabled",
            test: () => {
                // setup
                var snippet = this.getAppInsightsSnippet();

                snippet.isBeaconApiDisabled = false;
                snippet.enableSessionStorageBuffer = true;
                snippet.maxBatchSizeInBytes = 1000000;

                var appInsights = new Microsoft.ApplicationInsights.AppInsights(snippet);

                if (Microsoft.ApplicationInsights.Util.IsBeaconApiSupported()) {
                    Assert.equal(false, appInsights.context._config.isBeaconApiDisabled(), "Beacon API enabled");
                    Assert.equal(false, appInsights.context._config.enableSessionStorageBuffer(), "Session storage disabled");
                    Assert.equal(65536, appInsights.context._config.maxBatchSizeInBytes(), "Max batch size overriden by Beacon API payload limitation");
                } else {
                    Assert.equal(false, appInsights.context._config.isBeaconApiDisabled(), "Beacon API enabled");
                    Assert.equal(true, appInsights.context._config.enableSessionStorageBuffer(), "Session storage disabled");
                    Assert.equal(1000000, appInsights.context._config.maxBatchSizeInBytes(), "Max batch size overriden by Beacon API payload limitation");
                }
            }
        });

        this.testCase({
            name: "AppInsights._onerror creates a dump of unexpected error thrown by trackException for logging",
            test: () => {
                var sut = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
                var dumpSpy = this.sandbox.stub(Microsoft.ApplicationInsights.Util, "dump")
                var unexpectedError = new Error();
                var stub = this.sandbox.stub(sut, "trackException").throws(unexpectedError);

                sut._onerror("any message", "any://url", 420, 42, new Error());

                Assert.ok(dumpSpy.calledWith(unexpectedError));
            }
        });

        this.testCase({
            name: "AppInsights._onerror stringifies error object",
            test: () => {
                var sut = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
                var dumpSpy = this.sandbox.spy(Microsoft.ApplicationInsights.Util, "dump")
                var unexpectedError = new Error("my cool message");
                var stub = this.sandbox.stub(sut, "trackException").throws(unexpectedError);

                sut._onerror("any message", "any://url", 420, 42, new Error());

                Assert.ok(dumpSpy.returnValues[0].indexOf("stack: ") != -1);
                Assert.ok(dumpSpy.returnValues[0].indexOf("message: 'my cool message'") != -1);
                Assert.ok(dumpSpy.returnValues[0].indexOf("name: 'Error'") != -1);
            }
        });

        this.testCase({
            name: "AppInsights._onerror logs name of unexpected error thrown by trackException for diagnostics",
            test: () => {
                var sut = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
                var throwInternal = this.sandbox.spy(Microsoft.ApplicationInsights._InternalLogging, "throwInternal");
                var nameStub = this.sandbox.stub(Microsoft.ApplicationInsights.Util, "getExceptionName");
                var stub = this.sandbox.stub(sut, "trackException").throws(new Error());
                var expectedErrorName: string = "test error";
                nameStub.returns(expectedErrorName);

                sut._onerror("any message", "any://url", 420, 42, new Error());

                var logMessage: string = throwInternal.getCall(0).args[2];
                Assert.notEqual(-1, logMessage.indexOf(expectedErrorName));
            }
        });

        this.testCase({
            name: "AppInsights._onerror add document URL in case of CORS error",
            test: () => {
                // prepare
                var sut = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
                var trackSpy = this.sandbox.spy(sut.context, "track");

                // act
                sut._onerror("Script error.", "", 0, 0, null);

                // assert
                Assert.equal(document.URL, (<any>trackSpy.args[0][0]).data.baseData.properties.url);
            }
        });

        this.testCase({
            name: "AppInsights._onerror adds document URL in case of no CORS error",
            test: () => {
                // prepare
                var sut = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
                var trackExceptionSpy = this.sandbox.spy(sut, "trackException");

                // act
                // Last arg is not an error\null which will be treated as not CORS issue
                sut._onerror("Script error.", "", 0, 0, <any>new Object());

                // assert
                // properties are passed as a 3rd parameter
                Assert.equal(document.URL, (<any>trackExceptionSpy.args[0][2]).url);
            }
        });

        this.addPageViewSignatureTests();
        this.addStartStopTests();
    }

    private addPageViewSignatureTests() {
        var testValues = {
            name: "name",
            url: "url",
            duration: 1000,
            properties: {
                "property1": 5,
                "property2": 10
            },
            measurements: {
                "measurement": 300
            }
        };

        var test = (trackAction, validateAction) => {
            // setup
            var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
            var stub = this.sandbox.stub(Microsoft.ApplicationInsights.Telemetry.PageViewManager.prototype, "trackPageView");

            // act
            trackAction(appInsights);

            // verify
            Assert.ok(stub.called);
            var data = stub.args[0];
            validateAction(data);
        }


        this.testCase({
            name: name + "PageviewData is initialized in constructor with 0 parameters and valid",
            test: () => {
                var trackAction = (ai) => ai.trackPageView();
                var validateAction = (data) => {
                    Assert.notEqual(testValues.name, data[0]);
                    Assert.notEqual(testValues.url, data[1]);
                    Assert.notEqual(testValues.properties, data[2]);
                    Assert.notEqual(testValues.measurements, data[3]);
                };

                test(trackAction, validateAction);
            }
        });

        this.testCase({
            name: name + "PageviewData is initialized in constructor with name and valid",
            test: () => {
                var trackAction = (ai) => ai.trackPageView(testValues.name);

                var validateAction = (data) => {
                    Assert.equal(testValues.name, data[0]);
                    Assert.notEqual(testValues.url, data[1]);
                    Assert.notEqual(testValues.properties, data[2]);
                    Assert.notEqual(testValues.measurements, data[3]);
                };

                test(trackAction, validateAction);
            }
        });

        this.testCase({
            name: name + "PageviewData is initialized in constructor with name and properties and valid",
            test: () => {
                var trackAction = (ai) => ai.trackPageView(testValues.name, null, testValues.properties);

                var validateAction = (data) => {
                    Assert.equal(testValues.name, data[0]);
                    Assert.notEqual(testValues.url, data[1]);
                    Assert.deepEqual(testValues.properties, data[2]);
                    Assert.notEqual(testValues.measurements, data[3]);
                };

                test(trackAction, validateAction);
            }
        });

        this.testCase({
            name: name + "PageviewData is initialized in constructor with name and url and valid",
            test: () => {
                var trackAction = (ai) => ai.trackPageView(testValues.name, testValues.url);

                var validateAction = (data) => {
                    Assert.equal(testValues.name, data[0]);
                    Assert.equal(testValues.url, data[1]);
                    Assert.notEqual(testValues.properties, data[2]);
                    Assert.notEqual(testValues.measurements, data[3]);
                };

                test(trackAction, validateAction);
            }
        });

        this.testCase({
            name: name + "PageviewData is initialized in constructor with name, properties, and measurements and valid",
            test: () => {
                var trackAction = (ai) => ai.trackPageView(testValues.name, null, testValues.properties, testValues.measurements);

                var validateAction = (data) => {
                    Assert.equal(testValues.name, data[0]);
                    Assert.notEqual(testValues.url, data[1]);
                    Assert.deepEqual(testValues.properties, data[2]);
                    Assert.deepEqual(testValues.measurements, data[3]);
                };

                test(trackAction, validateAction);
            }
        });

        this.testCase({
            name: name + "PageviewData is initialized in constructor with name, url, and properties and valid",
            test: () => {
                var trackAction = (ai) => ai.trackPageView(testValues.name, testValues.url, testValues.properties);

                var validateAction = (data) => {
                    Assert.equal(testValues.name, data[0]);
                    Assert.equal(testValues.url, data[1]);
                    Assert.deepEqual(testValues.properties, data[2]);
                    Assert.notEqual(testValues.measurements, data[3]);
                };

                test(trackAction, validateAction);
            }
        });


        this.testCase({
            name: name + "PageviewData is initialized in constructor with name, url, properties, and measurements and valid",
            test: () => {
                var trackAction = (ai) => ai.trackPageView(testValues.name, testValues.url, testValues.properties, testValues.measurements);

                var validateAction = (data) => {
                    Assert.equal(testValues.name, data[0]);
                    Assert.equal(testValues.url, data[1]);
                    Assert.deepEqual(testValues.properties, data[2]);
                    Assert.deepEqual(testValues.measurements, data[3]);
                };

                test(trackAction, validateAction);
            }
        });
    }

    private addStartStopTests() {
        var testValues = {
            name: "name",
            url: "url",
            duration: 200,
            properties: {
                "property1": 5,
                "property2": 10
            },
            measurements: {
                "measurement": 300
            }
        };

        this.testCase({
            name: "Timing Tests: Start/StopPageView pass correct duration",
            test: () => {
                // setup
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
                var spy = this.sandbox.spy(appInsights, "sendPageViewInternal");

                // act
                appInsights.startTrackPage();
                this.clock.tick(testValues.duration);
                appInsights.stopTrackPage();

                // verify
                Assert.ok(spy.calledOnce, "stop track page view sent data");
                var actualDuration = spy.args[0][2];
                Assert.equal(testValues.duration, actualDuration, "duration is calculated and sent correctly");
            }
        });

        this.testCase({
            name: "Timing Tests: Start/StopPageView tracks single page view with no parameters",
            test: () => {
                // setup
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
                var trackStub = this.sandbox.stub(appInsights.context._sender, "send");
                this.clock.tick(10);        // Needed to ensure the duration calculation works

                // act
                appInsights.startTrackPage();
                this.clock.tick(testValues.duration);
                appInsights.stopTrackPage();
                Assert.ok(trackStub.calledOnce, "single page view tracking stopped");

                // verify
                var telemetry = <Microsoft.ApplicationInsights.Telemetry.PageView>trackStub.args[0][0].data.baseData;
                Assert.notEqual(testValues.name, telemetry.name);
                Assert.notEqual(testValues.url, telemetry.url);
                Assert.notEqual(testValues.properties, telemetry.properties);
                Assert.notEqual(testValues.measurements, telemetry.measurements);
            }
        });

        this.testCase({
            name: "Timing Tests: Start/StopPageView tracks single page view with all parameters",
            test: () => {
                // setup
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
                var trackStub = this.sandbox.stub(appInsights.context._sender, "send");
                this.clock.tick(10);        // Needed to ensure the duration calculation works

                // act
                appInsights.startTrackPage(testValues.name);
                this.clock.tick(testValues.duration);
                appInsights.stopTrackPage(testValues.name, testValues.url, testValues.properties, testValues.measurements);
                Assert.ok(trackStub.calledOnce, "single page view tracking stopped");

                // verify
                var telemetry = <Microsoft.ApplicationInsights.Telemetry.PageView>trackStub.args[0][0].data.baseData;
                Assert.equal(testValues.name, telemetry.name);
                Assert.equal(testValues.url, telemetry.url);
                Assert.deepEqual(testValues.properties, telemetry.properties);
                Assert.deepEqual(testValues.measurements, telemetry.measurements);

                // act
                trackStub.reset();
                appInsights.startTrackPage(testValues.name);
                this.clock.tick(testValues.duration);
                appInsights.stopTrackPage(testValues.name, testValues.url, testValues.properties, testValues.measurements);
                Assert.ok(trackStub.calledOnce, "single page view tracking stopped");

                // verify
                telemetry = <Microsoft.ApplicationInsights.Telemetry.PageView>trackStub.args[0][0].data.baseData;
                Assert.equal(testValues.name, telemetry.name);
                Assert.equal(testValues.url, telemetry.url);
                Assert.deepEqual(testValues.properties, telemetry.properties);
                Assert.deepEqual(testValues.measurements, telemetry.measurements);
            }
        });

        this.testCase({
            name: "Timing Tests: Multiple Start/StopPageView track single pages view ",
            test: () => {
                // setup
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
                var trackStub = this.sandbox.stub(appInsights.context._sender, "send");
                this.clock.tick(10);        // Needed to ensure the duration calculation works

                // act
                appInsights.startTrackPage(testValues.name);
                this.clock.tick(testValues.duration);

                appInsights.startTrackPage();
                this.clock.tick(testValues.duration);
                appInsights.stopTrackPage();
                Assert.ok(trackStub.calledOnce, "single page view tracking stopped no parameters");

                this.clock.tick(testValues.duration);
                appInsights.stopTrackPage(testValues.name, testValues.url, testValues.properties, testValues.measurements);
                Assert.ok(trackStub.calledTwice, "single page view tracking stopped all parameters");

                // verify
                // Empty parameters
                var telemetry = <Microsoft.ApplicationInsights.Telemetry.PageView>trackStub.args[0][0].data.baseData;
                Assert.notEqual(testValues.name, telemetry.name);
                Assert.notEqual(testValues.url, telemetry.url);
                Assert.notEqual(testValues.properties, telemetry.properties);
                Assert.notEqual(testValues.measurements, telemetry.measurements);

                // All parameters
                telemetry = <Microsoft.ApplicationInsights.Telemetry.PageView>trackStub.args[1][0].data.baseData;
                Assert.equal(testValues.name, telemetry.name);
                Assert.equal(testValues.url, telemetry.url);
                Assert.deepEqual(testValues.properties, telemetry.properties);
                Assert.deepEqual(testValues.measurements, telemetry.measurements);
            }
        });

        this.testCase({
            name: "Timing Tests: Multiple startTrackPage",
            test:
                () => {
                    // setup
                    var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
                    var logStub = this.sandbox.stub(Microsoft.ApplicationInsights._InternalLogging, "throwInternal");
                    Microsoft.ApplicationInsights._InternalLogging.verboseLogging = () => true;

                    // act
                    appInsights.startTrackPage();
                    appInsights.startTrackPage();

                    // verify
                    Assert.ok(logStub.calledOnce, "calling start twice triggers warning to user");
                }
        });

        this.testCase({
            name: "Timing Tests: stopTrackPage called without a corresponding start",
            test:
                () => {
                    // setup
                    var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
                    var logStub = this.sandbox.stub(Microsoft.ApplicationInsights._InternalLogging, "throwInternal");
                    Microsoft.ApplicationInsights._InternalLogging.verboseLogging = () => true;

                    // act
                    appInsights.stopTrackPage();

                    // verify
                    Assert.ok(logStub.calledOnce, "calling stop without a corresponding start triggers warning to user");
                }
        });

        this.testCase({
            name: "Timing Tests: Start/StopTrackEvent",
            test: () => {
                // setup
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
                var trackStub = this.sandbox.stub(appInsights.context._sender, "send");
                this.clock.tick(10);        // Needed to ensure the duration calculation works

                // act
                appInsights.startTrackEvent(testValues.name);
                this.clock.tick(testValues.duration);
                appInsights.stopTrackEvent(testValues.name, testValues.properties, testValues.measurements);
                Assert.ok(trackStub.calledOnce, "single page view tracking stopped");

                // verify
                var telemetry = <Microsoft.ApplicationInsights.Telemetry.Event>trackStub.args[0][0].data.baseData;
                Assert.equal(testValues.name, telemetry.name);
                Assert.deepEqual(testValues.properties, telemetry.properties);
                Assert.deepEqual(testValues.measurements, telemetry.measurements);

                // act
                trackStub.reset();
                appInsights.startTrackEvent(testValues.name);
                this.clock.tick(testValues.duration);
                appInsights.stopTrackEvent(testValues.name, testValues.properties, testValues.measurements);
                Assert.ok(trackStub.calledOnce, "single page view tracking stopped");

                // verify
                telemetry = <Microsoft.ApplicationInsights.Telemetry.Event>trackStub.args[0][0].data.baseData;
                Assert.equal(testValues.name, telemetry.name);
                Assert.deepEqual(testValues.properties, telemetry.properties);
                Assert.deepEqual(testValues.measurements, telemetry.measurements);
            }
        });

        this.testCase({
            name: "Timing Tests: Multiple Start/StopTrackEvent",
            test: () => {
                // setup

                var testValues2 = {
                    name: "test2",
                    duration: 500
                };

                var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
                var trackStub = this.sandbox.stub(appInsights.context._sender, "send");
                this.clock.tick(10);        // Needed to ensure the duration calculation works

                // act
                appInsights.startTrackEvent(testValues.name);

                appInsights.startTrackEvent(testValues2.name);
                this.clock.tick(testValues2.duration);
                appInsights.stopTrackEvent(testValues2.name);
                Assert.ok(trackStub.calledOnce, "single event tracking stopped for " + testValues2.name);

                this.clock.tick(testValues.duration);
                appInsights.stopTrackEvent(testValues.name, testValues.properties, testValues.measurements);
                Assert.ok(trackStub.calledTwice, "single event tracking stopped for " + testValues.name);

                // verify
                // TestValues2
                var telemetry = <Microsoft.ApplicationInsights.Telemetry.Event>trackStub.args[0][0].data.baseData;
                Assert.equal(testValues2.name, telemetry.name);

                // TestValues1
                telemetry = <Microsoft.ApplicationInsights.Telemetry.Event>trackStub.args[1][0].data.baseData;
                Assert.equal(testValues.name, telemetry.name);
                Assert.deepEqual(testValues.properties, telemetry.properties);
                Assert.deepEqual(testValues.measurements, telemetry.measurements);
            }
        });

        this.testCase({
            name: "Timing Tests: Multiple startTrackEvent",
            test:
                () => {
                    // setup
                    var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
                    var logStub = this.sandbox.stub(Microsoft.ApplicationInsights._InternalLogging, "throwInternal");
                    Microsoft.ApplicationInsights._InternalLogging.verboseLogging = () => true;

                    // act
                    appInsights.startTrackEvent("Event1");
                    appInsights.startTrackEvent("Event1");

                    // verify
                    Assert.ok(logStub.calledOnce, "calling startTrackEvent twice triggers warning to user");
                }
        });

        this.testCase({
            name: "Timing Tests: stopTrackPage called without a corresponding start",
            test:
                () => {
                    // setup
                    var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
                    var logStub = this.sandbox.stub(Microsoft.ApplicationInsights._InternalLogging, "throwInternal");
                    Microsoft.ApplicationInsights._InternalLogging.verboseLogging = () => true;

                    // act
                    appInsights.stopTrackPage("Event1");

                    // verify
                    Assert.ok(logStub.calledOnce, "calling stopTrackEvent without a corresponding start triggers warning to user");
                }
        });

        this.testCase({
            name: "Timing Tests: Start/StopTrackEvent has correct duration",
            test: () => {
                // setup

                var testValues1 = {
                    name: "test1",
                    duration: 300
                };

                var testValues2 = {
                    name: "test2",
                    duration: 200
                };

                var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
                var trackStub = this.sandbox.stub(appInsights.context._sender, "send");
                this.clock.tick(55);        // Needed to ensure the duration calculation works

                // act
                appInsights.startTrackEvent(testValues1.name);
                this.clock.tick(testValues1.duration);
                appInsights.stopTrackEvent(testValues1.name);

                appInsights.startTrackEvent(testValues2.name);
                this.clock.tick(testValues2.duration);
                appInsights.stopTrackEvent(testValues2.name);

                // verify
                // TestValues1
                var telemetry = <Microsoft.ApplicationInsights.Telemetry.Event>trackStub.args[0][0].data.baseData;
                Assert.equal(testValues1.name, telemetry.name);
                Assert.equal(testValues1.duration, telemetry.measurements["duration"]);

                // TestValues2
                telemetry = <Microsoft.ApplicationInsights.Telemetry.Event>trackStub.args[1][0].data.baseData;
                Assert.equal(testValues2.name, telemetry.name);
                Assert.equal(testValues2.duration, telemetry.measurements["duration"]);
            }
        });

        this.testCase({
            name: "Timing Tests: Start/StopTrackEvent custom duration is not overriden",
            test: () => {
                // setup
                var testValues2 = {
                    name: "name2",
                    url: "url",
                    duration: 345,
                    properties: {
                        "property1": 5
                    },
                    measurements: {
                        "duration": 777
                    }
                };

                var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
                var trackStub = this.sandbox.stub(appInsights.context._sender, "send");
                this.clock.tick(10);

                // act
                appInsights.startTrackEvent(testValues2.name);
                this.clock.tick(testValues2.duration);
                appInsights.stopTrackEvent(testValues2.name, testValues2.properties, testValues2.measurements);
                Assert.ok(trackStub.calledOnce, "single page view tracking stopped");

                // verify
                var telemetry = <Microsoft.ApplicationInsights.Telemetry.Event>trackStub.args[0][0].data.baseData;
                Assert.equal(testValues2.name, telemetry.name);
                Assert.deepEqual(testValues2.properties, telemetry.properties);
                Assert.deepEqual(testValues2.measurements, telemetry.measurements);
            }
        });

        this.testCase({
            name: "flush causes queue to be sent",
            test:
                () => {
                    // setup
                    var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
                    appInsights.config.maxBatchInterval = 100;
                    Microsoft.ApplicationInsights._InternalLogging.verboseLogging = () => true;
                    appInsights.context._sender._sender = () => null;
                    var senderSpy = this.sandbox.spy(appInsights.context._sender, "_sender");

                    // act
                    appInsights.trackEvent("Event1");
                    appInsights.trackEvent("Event2");
                    appInsights.trackEvent("Event3");

                    // verify
                    this.clock.tick(1);
                    Assert.ok(senderSpy.notCalled, "data is not sent without calling flush");

                    // act
                    appInsights.flush();

                    // verify
                    this.clock.tick(1);
                    Assert.ok(senderSpy.calledOnce, "data is sent after calling flush");
                }
        });

        this.testCase({
            name: "PageView should cause internal event throttle to be reset",
            test: () => {
                // setup
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
                Microsoft.ApplicationInsights._InternalLogging.verboseLogging = () => true;
                appInsights.context._sender._sender = () => null;
                var senderStub = this.sandbox.stub(appInsights.context._sender, "_sender");
                var resetInternalMessageCountStub = this.sandbox.stub(Microsoft.ApplicationInsights._InternalLogging, "resetInternalMessageCount");

                // setup a page view envelope
                var pageView = new Microsoft.ApplicationInsights.Telemetry.PageView();
                var pageViewData = new Microsoft.ApplicationInsights.Telemetry.Common.Data<Microsoft.ApplicationInsights.Telemetry.PageView>(Microsoft.ApplicationInsights.Telemetry.PageView.dataType, pageView);
                var pageViewEnvelope = new Microsoft.ApplicationInsights.Telemetry.Common.Envelope(pageViewData, Microsoft.ApplicationInsights.Telemetry.PageView.envelopeType);

                // act
                appInsights.context.track(pageViewEnvelope);

                // verify
                Assert.ok(resetInternalMessageCountStub.calledOnce, "Internal throttle was not reset even though Page View was tracked");

            }
        });

        this.testCase({
            name: "No other event than PageView should cause internal event throttle to be reset",
            test: () => {
                // setup
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
                Microsoft.ApplicationInsights._InternalLogging.verboseLogging = () => true;
                appInsights.context._sender._sender = () => null;
                var senderStub = this.sandbox.stub(appInsights.context._sender, "_sender");
                var resetInternalMessageCountStub = this.sandbox.stub(Microsoft.ApplicationInsights._InternalLogging, "resetInternalMessageCount");

                // setup a some other envelope
                var event = new Microsoft.ApplicationInsights.Telemetry.Event('Test Event');
                var eventData = new Microsoft.ApplicationInsights.Telemetry.Common.Data<Microsoft.ApplicationInsights.Telemetry.Event>(Microsoft.ApplicationInsights.Telemetry.Event.dataType, event);
                var eventEnvelope = new Microsoft.ApplicationInsights.Telemetry.Common.Envelope(eventData, Microsoft.ApplicationInsights.Telemetry.Event.envelopeType);

                // act
                appInsights.context.track(eventEnvelope);

                // verify
                Assert.ok(resetInternalMessageCountStub.notCalled, "Internal throttle was reset even though Page View was not tracked");
            }
        });

        this.testCase({
            name: "trackDependency passes ajax data correctly",
            test: () => {
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
                var trackStub = this.sandbox.stub(appInsights.context, "track");
                var pathName = "/api/temp/ABCD";
                var url = "https://tempurl.net/api/temp/ABCD?param1=test&param2=test";
                var commandName = "GET " + url;
                var target = "tempurl.net"
                var duration = 123;
                var success = false;
                var resultCode = 404;

                var properties = { "property1": 5 };
                var measurements = { "duration": 777 };

                // Act
                appInsights.trackDependency("0", "GET", url, commandName, duration, success, resultCode, properties, measurements);

                // Assert
                Assert.ok(trackStub.called, "Track should be called");
                var rdd = <Microsoft.ApplicationInsights.Telemetry.RemoteDependencyData>(<any>trackStub.args[0][0]).data.baseData;
                Assert.equal("GET " + pathName, rdd.name);
                Assert.equal(commandName, rdd.data);
                Assert.equal(target, rdd.target);
                Assert.equal("00:00:00.123", rdd.duration);
                Assert.equal(success, rdd.success);
                Assert.equal(resultCode, rdd.resultCode);
                Assert.deepEqual(properties, rdd.properties);
                Assert.deepEqual(measurements, rdd.measurements);
            }
        });

        this.testCase({
            name: "trackDependency includes instrumentation key into envelope name",
            test: () => {
                var iKey = "BDC8736D-D8E8-4B69-B19B-B0CE6B66A456";
                var iKeyNoDash = "BDC8736DD8E84B69B19BB0CE6B66A456";
                var snippet = this.getAppInsightsSnippet();
                snippet.instrumentationKey = iKey;
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(snippet);

                var trackStub = this.sandbox.stub(appInsights.context._sender, "send");

                // verify
                var test = (action, expectedEnvelopeType, expectedDataType) => {
                    action();
                    var envelope = this.getFirstResult(action, trackStub);
                    Assert.equal(iKey, envelope.iKey, "envelope iKey");
                    Assert.equal(expectedEnvelopeType.replace("{0}", iKeyNoDash), envelope.name, "envelope name");
                    Assert.equal(expectedDataType, envelope.data.baseType, "type name");
                    trackStub.reset();
                };

                // act
                test(() => appInsights.trackDependency("0", "GET", "http://asdf", "test", 123, true, 200), Microsoft.ApplicationInsights.Telemetry.RemoteDependencyData.envelopeType,
                    Microsoft.ApplicationInsights.Telemetry.RemoteDependencyData.dataType);
            }
        });

        this.testCase({
            name: "trackDependency - by default no more than 20 ajaxes per view",
            test: () => {
                var snippet = this.getAppInsightsSnippet();
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(snippet);
                var trackStub = this.sandbox.stub(appInsights.context, "track");

                // Act
                for (var i = 0; i < 100; ++i) {
                    appInsights.trackDependency("0", "GET", "http://asdf", "test", 123, true, 200);
                }

                // Assert
                Assert.equal(20, trackStub.callCount, "Expected 20 invokations of trackAjax");
            }
        });

        this.testCase({
            name: "trackDependency - trackPageView resets counter of sent ajaxes",
            test: () => {
                var snippet = this.getAppInsightsSnippet();
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(snippet);
                var trackStub = this.sandbox.stub(appInsights.context, "track");

                // Act
                for (var i = 0; i < 100; ++i) {
                    appInsights.trackDependency("0", "POST", "http://asdf", "test", 123, true, 200);
                }

                appInsights.sendPageViewInternal("asdf", "http://microsoft.com", 123);
                trackStub.reset();

                for (var i = 0; i < 100; ++i) {
                    appInsights.trackDependency("0", "POST", "http://asdf", "test", 123, true, 200);
                }

                // Assert
                Assert.equal(20, trackStub.callCount, "Expected 20 invokations of trackAjax");
            }
        });

        this.testCase({
            name: "trackDependency - only 1 user actionable trace about ajaxes limit per view",
            test: () => {
                var snippet = this.getAppInsightsSnippet();
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(snippet);
                var trackStub = this.sandbox.stub(appInsights.context, "track");
                var loggingSpy = this.sandbox.spy(Microsoft.ApplicationInsights._InternalLogging, "throwInternal");

                // Act
                for (var i = 0; i < 20; ++i) {
                    appInsights.trackDependency("0", "POST", "http://asdf", "test", 123, true, 200);
                }

                loggingSpy.reset();

                for (var i = 0; i < 100; ++i) {
                    appInsights.trackDependency("0", "POST", "http://asdf", "test", 123, true, 200);
                }

                // Assert
                Assert.equal(1, loggingSpy.callCount, "Expected 1 invokation of internal logging");
            }
        });

        this.testCase({
            name: "trackDependency - '-1' means no ajax per view limit",
            test: () => {
                var snippet = this.getAppInsightsSnippet();
                snippet.maxAjaxCallsPerView = -1;
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(snippet);
                var trackStub = this.sandbox.stub(appInsights.context, "track");
                var ajaxCallsCount = 1000;

                // Act
                for (var i = 0; i < ajaxCallsCount; ++i) {
                    appInsights.trackDependency("0", "POST", "http://asdf", "test", 123, true, 200);
                }

                // Assert
                Assert.equal(ajaxCallsCount, trackStub.callCount, "Expected " + ajaxCallsCount + " invokations of trackAjax (no limit)");
            }
        });

        this.testCase({
            name: "trackAjax obsolete method is still supported",
            test: () => {
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(this.getAppInsightsSnippet());
                var trackStub = this.sandbox.stub(appInsights.context, "track");
                var pathName = "http://myurl.com/test";
                var url = "http://myurl.com/test";
                var target = "myurl.com"
                var duration = 123;
                var success = false;
                var resultCode = 404;

                // Act
                appInsights.trackAjax("0", url, pathName, duration, success, resultCode);

                // Assert
                Assert.ok(trackStub.called, "Track should be called");
                var rdd = <Microsoft.ApplicationInsights.Telemetry.RemoteDependencyData>(<any>trackStub.args[0][0]).data.baseData;
                Assert.equal("/test", rdd.name);
                Assert.equal(url, rdd.data);
                Assert.equal(target, rdd.target);
                Assert.equal("00:00:00.123", rdd.duration);
                Assert.equal(success, rdd.success);
            }
        });

        this.testCase({
            name: "Ajax - Request-Context is not set if appId was not set",
            test: () => {
                var snippet = this.getAppInsightsSnippet();
                snippet.disableAjaxTracking = false;
                snippet.disableCorrelationHeaders = false;
                snippet.enableCorsCorrelation = true;
                snippet.maxBatchInterval = 0;
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(snippet);

                var trackStub = this.sandbox.spy(appInsights, "trackDependencyData");
                var expectedRootId = appInsights.context.operation.id;
                Assert.ok(expectedRootId.length > 0, "root id was initialized to non empty string");

                // Act
                var xhr = new XMLHttpRequest();
                xhr.open("GET", "/bla");
                xhr.send();

                var expectedAjaxId = (<any>xhr).ajaxData.id;
                Assert.ok(expectedAjaxId.length > 0, "ajax id was initialized");

                // Emulate response                               
                (<any>xhr).respond("200", {}, "");

                // Assert
                Assert.equal(expectedAjaxId, (<any>xhr).requestHeaders['Request-Id'], "Request-Id is set correctly");
                Assert.equal(null, (<any>xhr).requestHeaders['Request-Context'], "Request-Context is not set");
                Assert.equal(expectedAjaxId, trackStub.args[0][0].id, "ajax id passed to trackAjax correctly");
            }
        });

        this.testCase({
            name: "Ajax - Request-Id and Request-Context are set and passed correctly",
            test: () => {
                var snippet = this.getAppInsightsSnippet();
                snippet.disableAjaxTracking = false;
                snippet.disableCorrelationHeaders = false;
                snippet.enableCorsCorrelation = false;
                snippet.maxBatchInterval = 0;
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(snippet);
                appInsights.context.appId = () => "C16FBA4D-ECE9-472E-8125-4FF5BEFAF8C1";

                var trackStub = this.sandbox.spy(appInsights, "trackDependencyData");
                var expectedRootId = appInsights.context.operation.id;
                Assert.ok(expectedRootId.length > 0, "root id was initialized to non empty string");

                // Act
                var xhr = new XMLHttpRequest();
                xhr.open("GET", "/bla");
                xhr.send();

                var expectedAjaxId = (<any>xhr).ajaxData.id;
                Assert.ok(expectedAjaxId.length > 0, "ajax id was initialized");

                // Emulate response                               
                (<any>xhr).respond("200", {}, "");

                // Assert
                Assert.equal(expectedAjaxId, (<any>xhr).requestHeaders['Request-Id'], "Request-Id is set correctly");
                Assert.equal("appId=cid-v1:C16FBA4D-ECE9-472E-8125-4FF5BEFAF8C1", (<any>xhr).requestHeaders['Request-Context'], "Request-Context is set correctly");
                Assert.equal(expectedAjaxId, trackStub.args[0][0].id, "ajax id passed to trackAjax correctly");
            }
        });

        this.testCase({
            name: "Ajax - Request-Id is not set for dependency calls with different port number if CORS correlation turned off",
            test: () => {
                var snippet = this.getAppInsightsSnippet();
                snippet.disableAjaxTracking = false;
                snippet.disableCorrelationHeaders = false;
                snippet.enableCorsCorrelation = false;
                snippet.maxBatchInterval = 0;
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(snippet);
                var trackStub = this.sandbox.spy(appInsights, "trackDependencyData");
                var expectedRootId = appInsights.context.operation.id;
                Assert.ok(expectedRootId.length > 0, "root id was initialized to non empty string");

                // override currentWindowHost
                var sampleHost = "api.applicationinsights.io";
                (<any>appInsights)._ajaxMonitor.currentWindowHost = sampleHost;

                // Act
                var xhr = new XMLHttpRequest();
                xhr.open("GET", "https://" + sampleHost + ":888/test");
                xhr.send();

                var expectedAjaxId = (<any>xhr).ajaxData.id;
                Assert.ok(expectedAjaxId.length > 0, "ajax id was initialized");

                // Emulate response                               
                (<any>xhr).respond("200", {}, "");

                // Assert
                Assert.equal(null, (<any>xhr).requestHeaders['Request-Id'], "Request-Id is not set");
            }
        });

        this.testCase({
            name: "Ajax - Request-Id is set for dependency calls with different port number if CORS correlation turned on",
            test: () => {
                var snippet = this.getAppInsightsSnippet();
                snippet.disableAjaxTracking = false;
                snippet.disableCorrelationHeaders = false;
                snippet.enableCorsCorrelation = true;
                snippet.maxBatchInterval = 0;
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(snippet);
                var trackStub = this.sandbox.spy(appInsights, "trackDependencyData");
                var expectedRootId = appInsights.context.operation.id;
                Assert.ok(expectedRootId.length > 0, "root id was initialized to non empty string");

                // override currentWindowHost
                var sampleHost = "api.applicationinsights.io";
                (<any>appInsights)._ajaxMonitor.currentWindowHost = sampleHost;

                // Act
                var xhr = new XMLHttpRequest();
                xhr.open("GET", "https://" + sampleHost + ":888/test");
                xhr.send();

                var expectedAjaxId = (<any>xhr).ajaxData.id;
                Assert.ok(expectedAjaxId.length > 0, "ajax id was initialized");

                // Emulate response                               
                (<any>xhr).respond("200", {}, "");

                // Assert
                Assert.equal(expectedAjaxId, (<any>xhr).requestHeaders['Request-Id'], "Request-Id is set correctly");
                Assert.equal(expectedAjaxId, trackStub.args[0][0].id, "ajax id passed to trackAjax correctly");
            }
        });

        this.testCase({
            name: "Ajax - disableCorrelationHeaders disables Request-Id and Request-Context headers",
            test: () => {
                var snippet = this.getAppInsightsSnippet();
                snippet.disableAjaxTracking = false;
                snippet.disableCorrelationHeaders = true;
                snippet.enableCorsCorrelation = true;
                snippet.maxBatchInterval = 0;

                var appInsights = new Microsoft.ApplicationInsights.AppInsights(snippet);
                appInsights.context.appId = () => "C16FBA4D-ECE9-472E-8125-4FF5BEFAF8C1";

                var trackStub = this.sandbox.spy(appInsights, "trackDependencyData");
                var expectedRootId = appInsights.context.operation.id;
                Assert.ok(expectedRootId.length > 0, "root id was initialized to non empty string");

                // Act
                var xhr = new XMLHttpRequest();
                xhr.open("GET", "/bla");
                xhr.send();

                // Emulate response                               
                (<any>xhr).respond("200", {}, "");

                // Assert
                Assert.equal(null, (<any>xhr).requestHeaders['Request-Id'], "Request-Id header is not set.");
                Assert.equal(null, (<any>xhr).requestHeaders['Request-Context'], "Request-Context header is not set.");
            }
        });

        this.testCase({
            name: "Ajax - Request-Id and Request-Context headers are disabled for excluded domain",
            test: () => {
                var snippet = this.getAppInsightsSnippet();
                snippet.disableAjaxTracking = false;
                snippet.disableCorrelationHeaders = false;
                snippet.enableCorsCorrelation = true;
                snippet.correlationHeaderExcludedDomains = ["some.excluded.domain"];
                snippet.maxBatchInterval = 0;
                var appInsights = new Microsoft.ApplicationInsights.AppInsights(snippet);
                var trackStub = this.sandbox.spy(appInsights, "trackDependencyData");
                var expectedRootId = appInsights.context.operation.id;
                Assert.ok(expectedRootId.length > 0, "root id was initialized to non empty string");

                // Act
                var xhr = new XMLHttpRequest();
                xhr.open("GET", "http://some.excluded.domain/test");
                xhr.send();

                // Emulate response                               
                (<any>xhr).respond("200", {}, "");

                // Assert
                Assert.equal(null, (<any>xhr).requestHeaders['Request-Id'], "Request-Id header is not set.");
                Assert.equal(null, (<any>xhr).requestHeaders['Request-Context'], "Request-Context header is not set.");
            }
        });
    }

    private getFirstResult(action: string, trackStub: SinonStub, skipSessionState?: boolean) {
        var index: number;
        if (skipSessionState) {
            index = 1;
        } else {
            index = 0;
        }
        Assert.ok(trackStub.args && trackStub.args[index] && trackStub.args[index], "track was called for: " + action);
        return <Microsoft.Telemetry.Envelope>trackStub.args[index][0];
    }
}
new AppInsightsTests().registerTests();