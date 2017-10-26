/// <reference path="../TestFramework/Common.ts" />
/// <reference path="../../JavaScriptSDK/AppInsights.ts" />
/// <reference path="../../JavaScriptSDK/Initialization.ts" />

class SenderE2ETests extends TestClass {

    private errorSpy: SinonSpy;
    private successSpy: SinonSpy;
    private loggingSpy: SinonSpy;
    private beaconSpy: SinonSpy;

    private delay: number;
    private aiClient: Microsoft.ApplicationInsights.AppInsights;
    private maxBatchInterval = 100;

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

    public getAiClient(config: Microsoft.ApplicationInsights.IConfig): Microsoft.ApplicationInsights.AppInsights {
        config.maxBatchInterval = this.maxBatchInterval;
        config.endpointUrl = "https://dc.services.visualstudio.com/v2/track";
        config.instrumentationKey = "b7170927-2d1c-44f1-acec-59f4e1751c11";
        
        return new Microsoft.ApplicationInsights.AppInsights(config);
    }

    public registerTests() {
        this.delay = this.maxBatchInterval + 100;

        this.testCaseAsync({
            name: "TelemetryContext: send event using Beacon API",
            stepDelay: this.delay,
            steps: [
                () => {
                    if (!(<any>navigator).sendBeacon) {
                        (<any>navigator)['sendBeacon'] = (url: any, data: any) => { };
                    }

                    var config = Microsoft.ApplicationInsights.Initialization.getDefaultConfig();
                    config.isBeaconApiDisabled = false;

                    this.aiClient = this.getAiClient(config);
                    this.beaconSpy = this.sandbox.spy(navigator, "sendBeacon");

                    this.aiClient.trackEvent("test");
                },
                () => {
                    Assert.ok(this.beaconSpy.calledOnce);

                    var payload = <string>this.beaconSpy.args[0][1];
                    Assert.ok(payload.indexOf('{"baseType":"EventData","baseData":{"ver":2,"name":"test"}}') >= 0);
                }
            ]
        });

    }
}
new SenderE2ETests().registerTests();