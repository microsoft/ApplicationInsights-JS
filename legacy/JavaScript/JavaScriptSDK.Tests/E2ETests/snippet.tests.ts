/// <reference path="../TestFramework/Common.ts" />
/// <reference path="../../JavaScriptSDK/Sender.ts" />
/// <reference path="../../JavaScriptSDK/AppInsights.ts" />

class SnippetTests extends TestClass {
    private aiName = "appInsights";
    private originalAppInsights;
    private queueSpy;

    // PostBuildScript adds an extra code to the snippet to push 100 tests events to the queue.
    // Those events will be drained during AppInsights Init().
    private queueCallCount = 100;
    private senderMocks;

    private loadSnippet(path, resetWindow = true) {
        // load ai via the snippet
        if (resetWindow) {
            window[this.aiName] = undefined;
        }
        var key = "E2ETests";
        var snippetPath = window.location.href.split(key)[0] + key + path;
        var scriptElement = document.createElement("script");
        scriptElement.src = snippetPath;
        scriptElement.id = "testSnippet";
        document.getElementsByTagName("script")[0].parentNode.appendChild(scriptElement);
    }

    /** Method called before the start of each test method */
    public testInitialize() {
        var timingEnabled = typeof window != "undefined" && window.performance && window.performance.timing;

        this.originalAppInsights = window[this.aiName];
        window[this.aiName] = undefined;
        try {
            delete window[this.aiName];
        } catch (e) {
        }

        window['queueTest'] = () => null;

        // used to observe if events stored in the queue are executed when the AI is loaded
        this.queueSpy = this.sandbox.spy(window, "queueTest");
        this.useFakeTimers = false;
        this.clock.restore();
        this.useFakeServer = false;
        sinon.fakeServer["restore"]();
    }

    /** Method called after each test method has completed */
    public testCleanup() {
        this.useFakeServer = true;
        this.useFakeTimers = true;
        window[this.aiName] = this.originalAppInsights;
    }

    public registerTests() {
        var snippet_Latest = "/snippetLatest.js";

        // snippet version 1.0
        var snippet_10 = "/snippet_1.0.js";

        // old snippet, before snippet versioning was implemented
        var snippet_01 = "/snippet_0.1.js";

        this.testSnippet(snippet_Latest);
        this.testSnippet(snippet_10);
        this.testSnippet(snippet_01);

        this.testCaseAsync({
            name: "SnippetTests: API version 0.10 and lower can send (url,prop,meas) and the url is set correctly",
            stepDelay: 250,
            steps: [
                () => {
                    this.loadSnippet(snippet_01);
                },
                () => {
                    this.senderMocks = this.setAppInsights();

                    window["appInsights"].trackPageView("test", { property: "p1" }, { measurement: 5 });
                }]
                .concat(this.waitForResponse())
                .concat(() => {
                    Assert.equal(this.queueCallCount, this.queueSpy.callCount, "queue is emptied");
                    Assert.equal(1, this.senderMocks.sender.callCount, "v2 send called 1 time");
                    this.boilerPlateAsserts(this.senderMocks);

                    // check url and properties
                    var pv = <Microsoft.ApplicationInsights.Telemetry.PageView>this.senderMocks.sender.args[0][0].data.baseData;
                    Assert.deepEqual("test", pv.url, "url was set correctly");
                    Assert.deepEqual({ property: "p1" }, pv.properties, "properties were set correctly");
                    Assert.deepEqual({ measurement: 5 }, pv.measurements, "measurements were set correctly");
                })
        });

        this.testCaseAsync({
            name: "SnippetTests: SDK are handled correctly",
            stepDelay: 250,
            steps: [
                () => {
                    this.loadSnippet(snippet_Latest);
                },
                () => {
                    this.senderMocks = this.setAppInsights();

                    window["appInsights"].trackPageView("test", { property: "p1" }, { measurement: 5 });
                }]
                .concat(this.waitForResponse())
                .concat(() => {
                    Assert.equal(this.queueCallCount, this.queueSpy.callCount, "queue is emptied");
                    Assert.equal(1, this.senderMocks.sender.callCount, "v2 send called");
                    this.boilerPlateAsserts(this.senderMocks);

                    // check url and properties
                    var expectedSdk = "javascript:" + Microsoft.ApplicationInsights.Version;

                    var data = <Microsoft.ApplicationInsights.Telemetry.Common.Envelope>this.senderMocks.sender.args[0][0];
                    Assert.equal(expectedSdk, data.tags["ai.internal.sdkVersion"], "sdk version was set correctly");
                })
        });

        this.testCaseAsync({
            name: "SnippetTests: SDK sends an Exception when an Error is thrown",
            stepDelay: 250,
            steps: [
                () => {
                    this.loadSnippet(snippet_Latest);
                },
                () => {
                    this.senderMocks = this.setAppInsights();

                    // we can't simply throw because it will fail the test
                    // this will only validate that if the _onError is called it sends the Exception to AI
                    window["appInsights"]._onerror("upps!");
                }]
                .concat(this.waitForResponse())
                .concat(() => {
                    Assert.equal(this.queueCallCount, this.queueSpy.callCount, "queue is emptied");
                    Assert.equal(1, this.senderMocks.sender.callCount, "sender called");
                    this.boilerPlateAsserts(this.senderMocks);

                    var data = <Microsoft.ApplicationInsights.Telemetry.Common.Envelope>this.senderMocks.sender.args[0][0];
                    Assert.ok(data.name.indexOf(".Exception") !== -1, "Exception event recorded");
                    Assert.equal("upps!", (<any>data.data).baseData.exceptions[0].message, "error has correct message");
                })
        });

        var trackPageSpy: SinonSpy;

        this.testCaseAsync({
            name: "SnippetTests: it's safe to initialize the snippet twice, but it should report only one pageView",
            stepDelay: 250,
            steps: [
                () => {
                    this.loadSnippet(snippet_Latest);
                },
                () => {
                    trackPageSpy = this.sandbox.spy(window["appInsights"], "trackPageView");
                    this.loadSnippet(snippet_Latest, false);
                },
                () => {
                    Assert.equal(trackPageSpy.callCount, 0);
                }]
        });
    }

    private testSnippet(snippetPath) {
        var delay = 250;

        this.testCaseAsync({
            name: "SnippetTests: " + snippetPath + " is loaded",
            stepDelay: 50,
            steps: [
                () => {
                    this.loadSnippet(snippetPath);
                },
                () => {
                    Assert.ok(window[this.aiName], this.aiName + " is loaded");
                }
            ]
        });

        this.testCaseAsync({
            name: "SnippetTests: " + snippetPath + " drains the queue",
            stepDelay: 250,
            steps: [
                () => {
                    this.loadSnippet(snippetPath);
                }]
                .concat(<any>PollingAssert.createPollingAssert(() => {
                    return (!window[this.aiName].hasOwnProperty("queue"))
                }, "waiting for AI Init() to finish" + new Date().toISOString()))
                .concat(() => {
                    Assert.ok(!window[this.aiName].hasOwnProperty("queue"), "queue was removed during the init");
                    Assert.equal(this.queueCallCount, this.queueSpy.callCount, "should drain the queue");
                })
        });

        this.testCaseAsync({
            name: "SnippetTests: " + snippetPath + " configuration is read dynamically",
            stepDelay: delay,
            steps: [
                () => {
                    this.loadSnippet(snippetPath);
                },
                () => {
                    this.checkConfig();
                }
            ]
        });

        this.testCaseAsync({
            name: "SnippetTests: " + snippetPath + " can send to v2 endpoint with V2 API",
            stepDelay: delay,
            steps: [
                () => {
                    this.loadSnippet(snippetPath);
                },
                () => {
                    this.senderMocks = this.setAppInsights();
                    window[this.aiName].trackEvent("test");
                    window[this.aiName].trackException(new Error("oh no!"));
                    window[this.aiName].trackMetric("test", Math.round(100 * Math.random()));
                    window[this.aiName].trackTrace("test");
                    window[this.aiName].trackPageView("test page");
                }]
                .concat(this.waitForResponse())
                .concat(() => {
                    Assert.equal(this.queueCallCount, this.queueSpy.callCount, "queue is emptied");
                    Assert.equal(5, this.senderMocks.sender.callCount, "send called 5 times");
                    this.boilerPlateAsserts(this.senderMocks);
                })
        });
    }

    private waitForResponse() {
        return <any>PollingAssert.createPollingAssert(() => {
            return (this.senderMocks.successSpy.called || this.senderMocks.errorSpy.called);
        }, "Wait for response" + new Date().toISOString())
    }

    private checkConfig() {
        var initial = window[this.aiName];
        var test = (expected, memberName, readFunction) => {
            var appIn = <Microsoft.ApplicationInsights.AppInsights>window[this.aiName];
            appIn.config[memberName] = expected;
            var actual = readFunction();
            Assert.equal(expected, actual, memberName + ": value is read dynamically");
        };

        var testSenderValues = (expected, memberName) => {
            var appIn = <Microsoft.ApplicationInsights.AppInsights>window[this.aiName];
            test(expected, memberName, appIn.context._sender._config[memberName]);
        };

        var testContextValues = (expected, memberName) => {
            var appIn = <Microsoft.ApplicationInsights.AppInsights>window[this.aiName];
            test(expected, memberName, appIn.context._config[memberName]);
        };

        // sender values
        testSenderValues(10, "maxBatchInterval");
        testSenderValues(10, "maxBatchSizeInBytes");
        testSenderValues(10, "endpointUrl");
        testSenderValues(false, "disableTelemetry");

        // context values
        testContextValues("instrumentationKey", "instrumentationKey");
        testContextValues("accountId", "accountId");

        // logging
        test(true, "enableDebug", Microsoft.ApplicationInsights._InternalLogging.enableDebugExceptions);
    }

    private setAppInsights() {
        window["appInsights"].endpointUrl = "https://dc.services.visualstudio.com/v2/track";
        window["appInsights"].maxBatchInterval = 1;
        var appIn = <Microsoft.ApplicationInsights.AppInsights>window[this.aiName];
        var sender = this.sandbox.spy(appIn.context._sender, "send");
        var errorSpy = this.sandbox.spy(appIn.context._sender, "_onError");
        var successSpy = this.sandbox.spy(appIn.context._sender, "_onSuccess");
        var loggingSpy = this.sandbox.spy(Microsoft.ApplicationInsights._InternalLogging, "throwInternal");

        return {
            sender: sender,
            errorSpy: errorSpy,
            successSpy: successSpy,
            loggingSpy: loggingSpy,
            restore: () => {
            }
        };
    }

    private boilerPlateAsserts(spies) {
        Assert.ok(spies.successSpy.called, "success handler was called");
        Assert.ok(!spies.errorSpy.called, "no error sending");
        var isValidCallCount = spies.loggingSpy.callCount === 0;
        Assert.ok(isValidCallCount, "logging spy was called 0 time(s)");
        if (!isValidCallCount) {
            while (spies.loggingSpy.args.length) {
                Assert.ok(false, "[warning thrown]: " + spies.loggingSpy.args.pop());
            }
        }
    }
}

new SnippetTests().registerTests();