/// <reference path="../TestFramework/Common.ts" />
/// <reference path="../../JavaScriptSDK/AppInsights.ts" />
/// <reference path="../../JavaScriptSDK/Initialization.ts" />

class Sanitizer2ETests extends TestClass {

    private config: any;
    private delay: number;

    /** Method called before the start of each test method */
    public testInitialize() {
        this.useFakeServer = false;
        sinon.fakeServer["restore"]();
        this.useFakeTimers = false;
        this.clock.restore();
    }

    /** Method called after each test method has completed */
    public testCleanup() {
        this.useFakeServer = true;
        this.useFakeTimers = true;
    }

    private setAppInsights() {
        var testAi = new Microsoft.ApplicationInsights.AppInsights(this.config);

        var sender = this.sandbox.spy(testAi.context._sender, "send");
        var errorSpy = this.sandbox.spy(testAi.context._sender, "_onError");
        var successSpy = this.sandbox.spy(testAi.context._sender, "_onSuccess");
        var loggingSpy = this.sandbox.spy(Microsoft.ApplicationInsights._InternalLogging, "throwInternal");

        return {
            appInsights: testAi,
            sender: sender,
            errorSpy: errorSpy,
            successSpy: successSpy,
            loggingSpy: loggingSpy,
            restore: () => {
            }
        };
    }

    public registerTests() {
        this.config = Microsoft.ApplicationInsights.Initialization.getDefaultConfig();
        this.config.maxBatchInterval = 1000;
        this.config.endpointUrl = "https://dc.services.visualstudio.com/v2/track";
        this.config.instrumentationKey = "b7170927-2d1c-44f1-acec-59f4e1751c11";

        this.delay = 100;

        var boilerPlateAsserts = (mocks: any) => {
            Assert.ok(mocks.successSpy.called, "success");
            Assert.ok(!mocks.errorSpy.called, "no error sending");
        }

        var aiT1;
        this.testCaseAsync({
            name: "Sanitizer2ETests: Data platform accepts sanitized names",
            stepDelay: this.delay,
            steps: [
                () => {
                    aiT1 = this.setAppInsights();

                    var properties = {
                        "property1%^~`": "hello",
                        "property2*&#+": "world"
                    };

                    var measurements = {
                        "measurement@|": 300
                    };

                    aiT1.appInsights.trackMetric("test", 5);
                },
            ].concat(<any>PollingAssert.createPollingAssert(() => {
                Assert.ok(true, "waiting for response " + new Date().toISOString());
                return (aiT1.successSpy.called || aiT1.errorSpy.called || aiT1.loggingSpy.called);
            }, "Wait for response"))
                .concat(() => {
                    boilerPlateAsserts(aiT1);
                })
        });

        var aiT2;
        this.testCaseAsync({
            name: "Sanitizer2ETests: Data platform accepts legal charater set names",
            stepDelay: this.delay,
            steps: [
                () => {
                    aiT2 = this.setAppInsights();

                    var properties = {
                        "abcdefghijklmnopqrstuvwxyz": "hello",
                        "ABCDEFGHIJKLMNOPQRSTUVWXYZ": "world"
                    };

                    var measurements = {
                        "(1234567890/ \_-.)": 300
                    };

                    aiT2.appInsights.trackMetric("test", 5);
                },
            ].concat(<any>PollingAssert.createPollingAssert(() => {
                Assert.ok(true, "waiting for response " + new Date().toISOString());
                return (aiT2.successSpy.called || aiT2.errorSpy.called || aiT2.loggingSpy.called);
            }, "Wait for response"))
                .concat(() => {
                    boilerPlateAsserts(aiT2);
                })
        });

        var aiT3;
        this.testCaseAsync({
            name: "Sanitizer2ETests: Data platform accepts up to 150 charaters for names",
            stepDelay: this.delay,
            steps: [
                () => {
                    aiT3 = this.setAppInsights();

                    var len = 150;
                    var name = new Array(len + 1).join('a');

                    aiT3.appInsights.trackMetric(name, 5);
                },
            ].concat(<any>PollingAssert.createPollingAssert(() => {
                Assert.ok(true, "waiting for response " + new Date().toISOString());
                return (aiT3.successSpy.called || aiT3.errorSpy.called || aiT3.loggingSpy.called);
            }, "Wait for response"))
                .concat(() => {
                    boilerPlateAsserts(aiT3);
                })
        });

        var aiT4;
        this.testCaseAsync({
            name: "Sanitizer2ETests: Data platform accepts up to 1024 charaters for values",
            stepDelay: this.delay,
            steps: [
                () => {
                    aiT4 = this.setAppInsights()

                    var len = 1024;
                    var value = new Array(len + 1).join('a');

                    var properties = {
                        "testProp": value
                    };

                    aiT4.appInsights.trackMetric("test", 5);
                },
            ].concat(<any>PollingAssert.createPollingAssert(() => {
                Assert.ok(true, "waiting for response " + new Date().toISOString());
                return (aiT4.successSpy.called || aiT4.errorSpy.called || aiT4.loggingSpy.called);
            }, "Wait for response"))
                .concat(() => {
                    boilerPlateAsserts(aiT4);
                })
        });

        var aiT5;
        this.testCaseAsync({
            name: "Sanitizer2ETests: Data platform accepts up to 2048 charaters for url",
            stepDelay: this.delay,
            steps: [
                () => {
                    aiT5 = this.setAppInsights()

                    var len = 2048;
                    var url = "http://hello.com/";
                    url = url + new Array(len - url.length + 1).join('a');

                    aiT5.appInsights.trackPageView("test", url);
                },
            ].concat(<any>PollingAssert.createPollingAssert(() => {
                Assert.ok(true, "waiting for response " + new Date().toISOString());
                return (aiT5.successSpy.called || aiT5.errorSpy.called || aiT5.loggingSpy.called);
            }, "Wait for response"))
                .concat(() => {
                    boilerPlateAsserts(aiT5);
                })
        });

        var aiT6;
        this.testCaseAsync({
            name: "Sanitizer2ETests: Data platform accepts up to 32768 charaters for messages",
            stepDelay: this.delay,
            steps: [
                () => {
                    aiT6 = this.setAppInsights();

                    var len = 32768;
                    var message = new Array(len + 1).join('a');

                    aiT6.appInsights.trackTrace(message, 5);
                },
            ].concat(<any>PollingAssert.createPollingAssert(() => {
                Assert.ok(true, "waiting for response " + new Date().toISOString());
                return (aiT6.successSpy.called || aiT6.errorSpy.called || aiT6.loggingSpy.called);
            }, "Wait for response"))
                .concat(() => {
                    boilerPlateAsserts(aiT6);
                })
        });
    }
}
new Sanitizer2ETests().registerTests();