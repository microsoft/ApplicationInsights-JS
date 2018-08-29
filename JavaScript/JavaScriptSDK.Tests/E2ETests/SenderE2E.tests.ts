/// <reference path="../TestFramework/Common.ts" />
/// <reference path="../../JavaScriptSDK/AppInsights.ts" />
/// <reference path="../../JavaScriptSDK/Initialization.ts" />

class SenderE2ETests extends TestClass {

    private errorSpy: SinonSpy;
    private vortexSpy: SinonSpy;
    private aiSpy: SinonSpy;
    private loggingSpy: SinonSpy;
    private beaconSpy: SinonSpy;

    private delay: number;
    private aiClient: Microsoft.ApplicationInsights.AppInsights;
    private beaconClient: Microsoft.ApplicationInsights.AppInsights;
    private vortexAiClient: Microsoft.ApplicationInsights.AppInsights;
    private maxBatchInterval = 100;

    /** Method called before the start of each test method */
    public testInitialize() {
        this.useFakeServer = false;
        sinon.fakeServer["restore"]();
        this.useFakeTimers = false;
        this.clock.restore();

        this.loggingSpy = this.sandbox.stub(Microsoft.ApplicationInsights._InternalLogging, "throwInternal");
        this.vortexSpy = this.sandbox.stub(this.vortexAiClient.context._sender, "_onSuccess");
        this.aiSpy = this.sandbox.stub(this.aiClient.context._sender, "_onSuccess");
        this.errorSpy = this.sandbox.spy(this.vortexAiClient.context._sender, "_onError");

        if (this.vortexAiClient) {
            this.vortexAiClient.context._sender._buffer.clear();
        }
        if (this.aiClient) {
            this.aiClient.context._sender._buffer.clear();
        }
        if (this.beaconClient) {
            this.beaconClient.context._sender._buffer.clear();
        }
    }

    /** Method called after each test method has completed */
    public testCleanup() {
        this.useFakeServer = true;
        this.useFakeTimers = true;

        if (this.vortexAiClient) {
            this.vortexAiClient.context._sender._buffer.clear();
        }
        if (this.aiClient) {
            this.aiClient.context._sender._buffer.clear();
        }
        if (this.beaconClient) {
            this.beaconClient.context._sender._buffer.clear();
        }
    }

    public getAiClient(config: Microsoft.ApplicationInsights.IConfig): Microsoft.ApplicationInsights.AppInsights {
        config.maxBatchInterval = this.maxBatchInterval;
        config.endpointUrl = "https://dc.services.visualstudio.com/v2/track";
        config.instrumentationKey = "b7170927-2d1c-44f1-acec-59f4e1751c11";

        return new Microsoft.ApplicationInsights.AppInsights(config);
    }

    public getVortexAiClient(config: Microsoft.ApplicationInsights.IConfig): Microsoft.ApplicationInsights.AppInsights {
        config.maxBatchInterval = this.maxBatchInterval;
        config.endpointUrl = "https://vortex.data.microsoft.com/collect/v1";
        config.instrumentationKey = "AIF-e2e0e295-6686-4684-a2e9-a739bdf45a11";
        config.emitLineDelimitedJson = true; // Vortex will 400 reject if false

        return new Microsoft.ApplicationInsights.AppInsights(config);
    }

    public registerTests() {
        this.delay = this.maxBatchInterval + 100;

        if (!(<any>navigator).sendBeacon) {
            (<any>navigator)['sendBeacon'] = (url: any, data: any) => { return true; };
        }
        let beaconConfig = Microsoft.ApplicationInsights.Initialization.getDefaultConfig();
        beaconConfig.isBeaconApiDisabled = false;
        this.beaconClient = this.getAiClient(beaconConfig);

        let aiConfig = Microsoft.ApplicationInsights.Initialization.getDefaultConfig();
        this.aiClient = this.getAiClient(aiConfig);

        let vortexConfig = Microsoft.ApplicationInsights.Initialization.getDefaultConfig();
        this.vortexAiClient = this.getVortexAiClient(vortexConfig);

        this.testCaseAsync({
            name: "TelemetryContext: send event using Beacon API",
            stepDelay: this.delay,
            steps: [
                () => {
                    this.beaconSpy = this.sandbox.spy(navigator, "sendBeacon");
                    this.beaconClient.trackEvent("test");
                },
                () => {
                    Assert.ok(this.beaconSpy.calledOnce);

                    var payload = this.beaconSpy.args[0][1];
                    Assert.equal("text/plain;charset=utf-8", payload.type);

                    let reader = new FileReader();
                    reader.addEventListener('loadend', (e) => {
                        let text = (<any>e).srcElement.result;
                        Assert.ok(text.indexOf('{"baseType":"EventData","baseData":{"ver":2,"name":"test"}}') >= 0);
                    });
                    reader.readAsText(payload);
                }
            ]
        });

        this.testCaseAsync({
            name: "endpointUrl: Telemetry data can be successfully sent to vortex endpoint",
            stepDelay: this.delay,
            steps: [
                // Act
                () => {
                    this.vortexAiClient.trackEvent("test 1");
                    this.vortexAiClient.trackEvent("test 2");
                    this.vortexAiClient.trackEvent("test 3");
                },
                // Assert
                <() => void>PollingAssert.createPollingAssert(() => {
                    return this.vortexSpy.called || this.errorSpy.called;
                }, "Response received"),
                () => {
                    Assert.ok(this.vortexSpy.calledOnce, "Telemetry sent");
                    Assert.ok(!this.errorSpy.called, "No errors when sending");

                    let isValidCallCount = this.loggingSpy.callCount === 0;
                    Assert.ok(isValidCallCount, "logging spy was called 0 time(s)");
                    if (!isValidCallCount) {
                        while (this.loggingSpy.args.length) {
                            Assert.ok(false, "[warning thrown]: " + this.loggingSpy.args.pop());
                        }
                    }

                    let itemsAccepted = this.vortexSpy.args[0][1];
                    Assert.equal(3, itemsAccepted, "backend should accept 3 items");
                }
            ]
        });
    }
}
new SenderE2ETests().registerTests();