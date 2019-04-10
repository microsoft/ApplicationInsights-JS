/// <reference path="../TestFramework/Common.ts" />
/// <reference path="../../JavaScriptSDK/AppInsights.ts" />
/// <reference path="../../JavaScriptSDK/Initialization.ts" />

class ValidateTests extends TestClass {

    public errorSpy: SinonSpy;
    public successSpy: SinonSpy;
    public loggingSpy: SinonSpy;

    private delay: number;
    private config: Microsoft.ApplicationInsights.IConfig;
    private testAi: Microsoft.ApplicationInsights.AppInsights;

    constructor() {
        super();

        this.config = Microsoft.ApplicationInsights.Initialization.getDefaultConfig();
        this.config.maxBatchInterval = 100;
        this.config.endpointUrl = "https://dc.services.visualstudio.com/v2/validate";
        this.config.instrumentationKey = "b7170927-2d1c-44f1-acec-59f4e1751c11";
        this.config.enableSessionStorageBuffer = false;

        this.delay = this.config.maxBatchInterval + 100;
    }

    public testInitialize() {
        this.useFakeServer = false;
        sinon.fakeServer["restore"]();
        this.useFakeTimers = false;
        this.clock.restore();

        this.errorSpy = this.sandbox.spy(this.testAi.context._sender, "_onError");
        this.successSpy = this.sandbox.stub(this.testAi.context._sender, "_onSuccess");
        this.loggingSpy = this.sandbox.stub(Microsoft.ApplicationInsights._InternalLogging, "throwInternal");
    }

    public testCleanup() {
        this.useFakeServer = true;
        this.useFakeTimers = true;
    }

    public registerTests() {
        this.testAi = new Microsoft.ApplicationInsights.AppInsights(this.config);

        this.testCaseAsync({
            name: "Validate track event",
            stepDelay: this.delay,
            steps: [
                () => {
                    this.testAi.trackEvent("test");
                    this.testAi.trackEvent("test event", { p1: "value 1", p2: "value 2" }, { m1: 123, m2: 456.7 });
                }]
                .concat(this.waitForResponse())
                .concat(this.boilerPlateAsserts)
                .concat(() => {
                    var acceptedItems = this.successSpy.args[0][1];
                    Assert.equal(2, acceptedItems, "backend should accept two events");
                })
        });

        this.testCaseAsync({
            name: "Validate track event with invalid measurement types",
            stepDelay: this.delay,
            steps: [
                () => {
                    this.testAi.trackEvent("test event", { p1: "value 1" }, { m1: "invalid" });
                }]
                .concat(this.waitForResponse())
                .concat(() => {
                    Assert.ok(!this.successSpy.called, "success not called");
                    Assert.ok(this.errorSpy.called, "error called");

                    let response = this.errorSpy.args[0][1] as string;
                    response = response.replace("XMLHttpRequest,Status:400,Response:", "");

                    var result = JSON.parse(response);

                    Assert.equal(1, result.itemsReceived, "backend received wrong number of elements");
                    Assert.equal(0, result.itemsAccepted, "backend accepted invalid number of events");

                    var errors = result.errors;
                    Assert.equal(1, errors.length, "expecting one error");
                    Assert.equal(400, errors[0].statusCode, "invalid error status code");

                    var expectedMessage = "200: Child value 'NaN' for key 'm1' is of incorrect type. Expected: number, Actual: string";
                    Assert.equal(expectedMessage, errors[0].message, "invalid error message");
                })
        });

        this.testCaseAsync({
            name: "Validate that track event takes all type of characters",
            stepDelay: this.delay,
            steps: [
                () => {
                    var s1 = "شلاؤيثبلاهتنمةىخحضقسفعشلاؤيصثبل";
                    var s2 = "Ինչու՞ նրանք չեն խոսում Հայերեն";
                    var s3 = "ওরা কন বাংলা বলেত পাের না";
                    var s4 = "妣 啊 僜刓嘰塡奬〉媆孿 偁偄偙 偁A偄E偆I偊O偍U";
                    var s5 = "ßüµ€ÄäÖö€ ερτυθιοπαδφγηξκλζχψωβνΔΦΓΗΞΚΛΨΩΘ რატომ";
                    var s6 = "йцуукенгшщзхъфываполджэс";
                    var s7 = "\x0000\x0001\x0002\x0003\x0004\x0005\x0006\x0007\x0008\x009F";

                    // white spaces
                    this.testAi.trackEvent(" abcd efg   ", { " abc " : "value 1", " " : "value 2" });

                    // international characters
                    this.testAi.trackEvent(s1, { p: s2 });
                    this.testAi.trackEvent(s3, { p: s4 });
                    this.testAi.trackEvent(s5, { p: s6, p2: s7 });
                }]
                .concat(this.waitForResponse())
                .concat(this.boilerPlateAsserts)
                .concat(() => {
                    var acceptedItems = this.successSpy.args[0][1];
                    Assert.equal(4, acceptedItems, "backend should accept all four events");
                })
        });

        this.testCaseAsync({
            name: "Validate that special characters are handled correctly",
            stepDelay: this.delay,
            steps: [
                () => {
                    var s1 = "[]{};,.)(*&^%$#@/\\";

                    this.testAi.trackEvent(s1, { p: s1 });
                    this.testAi.trackEvent("a", { "[]{};,.)(*&^%$#@/\\": "b" });
                }]
                .concat(this.waitForResponse())
                .concat(this.boilerPlateAsserts)
                .concat(() => {
                    var acceptedItems = this.successSpy.args[0][1];
                    Assert.equal(2, acceptedItems, "backend should accept the event");
                })
        });
    }

    private waitForResponse() {
        return <any>PollingAssert.createPollingAssert(() => {
            return (this.successSpy.called || this.errorSpy.called);
        }, "Wait for response" + new Date().toISOString())
    }

    private boilerPlateAsserts() {
        Assert.ok(this.successSpy.called, "success");
        Assert.ok(!this.errorSpy.called, "no error sending");
        var isValidCallCount = this.loggingSpy.callCount === 0;
        Assert.ok(isValidCallCount, "logging spy was called 0 time(s)");
        if (!isValidCallCount) {
            while (this.loggingSpy.args.length) {
                Assert.ok(false, "[warning thrown]: " + this.loggingSpy.args.pop());
            }
        }
    }

    private parseResponse(response) {
        var result = JSON.parse(response);

        if (result && result.itemsReceived && result.itemsReceived >= result.itemsAccepted &&
            result.itemsReceived - result.itemsAccepted == result.errors.length) {
            return result;
        }
    }
}

new ValidateTests().registerTests();