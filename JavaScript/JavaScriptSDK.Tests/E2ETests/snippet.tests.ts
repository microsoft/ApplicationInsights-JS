/// <reference path="..\TestFramework\Common.ts" />
/// <reference path="../../javascriptsdk/sender.ts" />
/// <reference path="../../javascriptsdk/appinsights.ts" />

class SnippetTests extends TestClass {
    private name = "appInsights";
    private instrumentationKey = "3e6a441c-b52b-4f39-8944-f81dd6c2dc46";
    private originalAppInsights;
    private timingOffset = 0;
    private queueSpy;
    private queueCallCount = 100;

    private loadSnippet(path) {
        // load ai via the snippet
        window["appInsights"] = undefined;
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
        this.timingOffset = timingEnabled ? 1 : 0;

        this.originalAppInsights = window[this.name];
        window[this.name] = undefined;
        try {
            delete window[this.name];
        } catch (e) {
        }

        window['queueTest'] = () => null;
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
        window[this.name] = this.originalAppInsights;
    }

    public registerTests() {
        var path70 = "/sprint70Snippet.js";
        var path69 = "/sprint69Snippet.js";
        var path66 = "/sprint66Snippet.js";

        this.testSnippet(path70);
        this.testSnippet(path69);
        this.testSnippet(path66);

        var senderSpy71V2;
        this.testCaseAsync({
            name: "SnippetTests: API version 0.10 and lower can send (url,prop,meas) and the url is set correctly",
            stepDelay: 250,
            steps: [
                () => {
                    this.loadSnippet(path69);
                },
                () => {
                    senderSpy71V2 = this.setAppInsights();

                    window["appInsights"].trackPageView("test", { property: "p1" }, { measurement: 5 });
                },
                () => {
                    Assert.equal(this.queueCallCount, this.queueSpy.callCount, "queue is emptied");
                    Assert.equal(2, senderSpy71V2.sender.callCount, "v2 send called " + 2 + " times");
                    this.boilerPlateAsserts(senderSpy71V2);

                    // check url and properties
                    var pv = <Microsoft.ApplicationInsights.Telemetry.PageView>senderSpy71V2.sender.args[0][0].data.baseData;
                    Assert.deepEqual("test", pv.url, "url was set correctly");
                    Assert.deepEqual({ property: "p1" }, pv.properties, "properties were set correctly");
                    Assert.deepEqual({ measurement: 5 }, pv.measurements, "measurements were set correctly");

                }
            ]
        });

        var senderSpy66V2V1;
        this.testCaseAsync({
            name: "SnippetTests: sprint 66 snippet sends to v2 endpoint with v1 API",
            stepDelay: 250,
            steps: [
                () => {
                    this.loadSnippet(path66);
                },
                () => {
                    senderSpy66V2V1 = this.setAppInsights();

                    window["appInsights"].logEvent("test");
                    window["appInsights"].logPageView();
                },
                () => {
                    Assert.equal(this.queueCallCount, this.queueSpy.callCount, "queue is emptied");
                    var count = 2 + this.timingOffset;
                    Assert.equal(count, senderSpy66V2V1.sender.callCount, "v2 send called " + count + " times");
                    this.boilerPlateAsserts(senderSpy66V2V1);

                }
            ]
        });
    }

    private testSnippet(snippetPath) {
        var delay = 250;


        this.testCaseAsync({
            name: "SnippetTests: sprint " + snippetPath + " is loaded",
            stepDelay: 50,
            steps: [
                () => {
                    this.loadSnippet(snippetPath);
                },
                () => {
                    Assert.ok(window[this.name], this.name + " is loaded");
                }
            ]
        });

        this.testCaseAsync({
            name: "SnippetTests: sprint " + snippetPath + " drains the queue",
            stepDelay: 250,
            steps: [
                () => {
                    this.loadSnippet(snippetPath);
                },
                () => {
                    Assert.equal(this.queueCallCount, this.queueSpy.callCount, "queue is emptied");
                }
            ]
        });

        this.testCaseAsync({
            name: "SnippetTests: sprint " + snippetPath + " configuration is read dynamically",
            stepDelay: delay,
            steps: [
                () => {
                    this.loadSnippet(snippetPath);
                },
                this.checkConfig
            ]
        });

        var sender;
        this.testCaseAsync({
            name: "SnippetTests: sprint " + snippetPath + " can send to v2 endpoint with V2 API",
            stepDelay: delay,
            steps: [
                () => {
                    this.loadSnippet(snippetPath);
                },
                () => {
                    sender = this.setAppInsights();
                    window[this.name].trackEvent("test");
                    window[this.name].trackException(new Error("oh no!"));
                    window[this.name].trackMetric("test", Math.round(100 * Math.random()));
                    window[this.name].trackTrace("test");
                    window[this.name].trackPageView();
                },
                () => {
                    Assert.equal(this.queueCallCount, this.queueSpy.callCount, "queue is emptied");
                    var count = 5 + this.timingOffset;
                    Assert.equal(count, sender.sender.callCount, "send called " + count + " times");
                    this.boilerPlateAsserts(sender);

                }
            ]
        });
    }

    private checkConfig() {
        var initial = window[this.name];
        var test = (expected, memberName, readFunction) => {
            var appIn = <Microsoft.ApplicationInsights.AppInsights>window[this.name];
            appIn.config[memberName] = expected;
            var actual = readFunction();
            Assert.equal(expected, actual, memberName + ": value is read dynamically");
        };

        var testSenderValues = (expected, memberName) => {
            var appIn = <Microsoft.ApplicationInsights.AppInsights>window[this.name];
            test(expected, memberName, appIn.context._sender._config[memberName]);
        };

        var testContextValues = (expected, memberName) => {
            var appIn = <Microsoft.ApplicationInsights.AppInsights>window[this.name];
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
        var appIn = <Microsoft.ApplicationInsights.AppInsights>window[this.name];
        var sender = this.sandbox.spy(appIn.context._sender, "send");
        var errorSpy = this.sandbox.spy(appIn.context._sender, "_onError");
        var successSpy = this.sandbox.spy(appIn.context._sender, "_onSuccess");
        var loggingSpy = this.sandbox.spy(Microsoft.ApplicationInsights._InternalLogging, "throwInternalUserActionable");

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