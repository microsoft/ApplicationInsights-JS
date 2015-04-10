/// <reference path="..\TestFramework\Common.ts" />
/// <reference path="../../javascriptsdk/appinsights.ts" />

class Sanitizer2ETests extends TestClass {

    private errorSpy;
    private successSpy;
    private loggingSpy;

    /** Method called before the start of each test method */
    public testInitialize() {
        this.useFakeServer = false;
        sinon.fakeServer["restore"]();
        this.useFakeTimers = false;
        this.clock.restore();
        this.errorSpy = sinon.spy(Microsoft.ApplicationInsights.Sender, "_onError");
        this.successSpy = sinon.stub(Microsoft.ApplicationInsights.Sender, "_onSuccess");
        this.loggingSpy = sinon.stub(Microsoft.ApplicationInsights._InternalLogging, "throwInternalUserActionable");
    }

    /** Method called after each test method has completed */
    public testCleanup() {
        this.useFakeServer = true;
        this.useFakeTimers = true;
        this.errorSpy.restore();
        this.successSpy.restore();
        this.loggingSpy.restore();
    }

    public registerTests() {
        var snippet = window["appInsights"];

        /*
        // uncomment this to target prod instead of int
        snippet.endpointUrl = "http://dc.services.visualstudio.com/v2/track";
        snippet.instrumentationKey = "89330895-7c53-4315-a242-85d136ad9c16";
        */

        var delay = snippet.config.maxBatchInterval + 100;
        var testAi = new Microsoft.ApplicationInsights.AppInsights(snippet.config);

        var boilerPlateAsserts = () => {
            Assert.ok(this.successSpy.called, "success");
            Assert.ok(!this.errorSpy.called, "no error sending");
        }

        var asserts = [];
        var pollingCount = 100;
        for (var i = 0; i < pollingCount; i++) {
            asserts.push(() => {
                var message = "polling: " + new Date().toISOString();
                Assert.ok(true, message);
                console.log(message);

                // calling start() causes sinon to resume and ends the async test
                if (this.successSpy.called) {
                    boilerPlateAsserts();
                    this.testCleanup();
                    start();
                } else if (this.errorSpy.called || this.loggingSpy.called) {
                    boilerPlateAsserts();
                    start();
                }
            });
        }

        asserts.push(() => Assert.ok(this.successSpy.called, "success"));
        
        this.testCaseAsync({
            name: "Sanitizer2ETests: Data platform accepts sanitized names",
            stepDelay: delay,
            steps: [
                () => {
                    var properties = {
                        "property1%^~`": "hello",
                        "property2*&#+": "world"
                    };

                    var measurements = {
                        "measurement@|": 300
                    };

                    testAi.trackMetric("test", 5);
                }
            ].concat(asserts)
        });

        this.testCaseAsync({
            name: "Sanitizer2ETests: Data platform accepts legal charater set names",
            stepDelay: delay,
            steps: [
                () => {
                    var properties = {
                        "abcdefghijklmnopqrstuvwxyz": "hello",
                        "ABCDEFGHIJKLMNOPQRSTUVWXYZ": "world"
                    };

                    var measurements = {
                        "(1234567890/ \_-.)": 300
                    };

                    testAi.trackMetric("test", 5);
                }
            ].concat(asserts)
        });

        this.testCaseAsync({
            name: "Sanitizer2ETests: Data platform accepts up to 150 charaters for names",
            stepDelay: delay,
            steps: [
                () => {
                    var len = 150;
                    var name = new Array(len + 1).join('a');

                    testAi.trackMetric(name, 5);
                }
            ].concat(asserts)
        });

        this.testCaseAsync({
            name: "Sanitizer2ETests: Data platform accepts up to 1024 charaters for values",
            stepDelay: delay,
            steps: [
                () => {
                    var len = 1024;
                    var value = new Array(len + 1).join('a');

                    var properties = {
                        "testProp": value
                    };

                    testAi.trackMetric("test", 5);
                }
            ].concat(asserts)
        });

        this.testCaseAsync({
            name: "Sanitizer2ETests: Data platform accepts up to 2048 charaters for url",
            stepDelay: delay,
            steps: [
                () => {
                    var len = 2048;
                    var url = "http://hello.com/";
                    url = url + new Array(len - url.length + 1).join('a');

                    testAi.trackPageView("test", url);
                }
            ].concat(asserts)
        });

        this.testCaseAsync({
            name: "Sanitizer2ETests: Data platform accepts up to 32768 charaters for messages",
            stepDelay: delay,
            steps: [
                () => {
                    var len = 32768;
                    var message = new Array(len + 1).join('a');

                    testAi.trackTrace(message, 5);
                }
            ].concat(asserts)
        });
    }
}
new Sanitizer2ETests().registerTests(); 