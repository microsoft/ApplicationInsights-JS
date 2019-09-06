import { IAppInsightsDeprecated } from "../src/ApplicationInsightsDeprecated";
import { ApplicationInsightsContainer } from "../src/ApplicationInsightsContainer";
import { Snippet } from "../src/Initialization";
import { Sender } from "@microsoft/applicationinsights-channel-js";

export class ApplicationInsightsDeprecatedTests extends TestClass {
    private static readonly _instrumentationKey = 'b7170927-2d1c-44f1-acec-59f4e1751c11';
    private _aiDeprecated: IAppInsightsDeprecated;
    private _snippet: Snippet;

    // Sinon
    private errorSpy: SinonSpy;
    private successSpy: SinonSpy;
    private loggingSpy: SinonSpy;
    private clearSpy: SinonSpy;
    private _name = "ApplicationInsightsDeprecatedTests: ";
    
    public testInitialize() {
        try {

            this.useFakeServer = false;
            (sinon.fakeServer as any).restore();
            this.useFakeTimers = false;
            this.clock.restore();

            this._snippet = {
                config: {
                    instrumentationKey: ApplicationInsightsDeprecatedTests._instrumentationKey,
                    disableAjaxTracking: false,
                    disableFetchTracking: false
                },
                queue: [],
                version: 1.0
            }

            this._aiDeprecated = ((ApplicationInsightsContainer.getAppInsights(this._snippet, this._snippet.version)) as IAppInsightsDeprecated); 
            // Setup Sinon stuff
            const appInsights = (this._aiDeprecated as any).appInsightsNew;
            const sender: Sender = appInsights.core['_channelController'].channelQueue[0][0];
            this.errorSpy = this.sandbox.spy(sender, '_onError');
            this.successSpy = this.sandbox.spy(sender, '_onSuccess');
            this.loggingSpy = this.sandbox.stub(appInsights.core.logger, 'throwInternal');
        } catch (e) {
            console.error('Failed to initialize');
        }
    }

    public testCleanup() {
        this.useFakeServer = true;
        this.useFakeTimers = true;
    }

    public registerTests() {

        this.addApiTests();
        this.testCase({
            name: 'config.oldApiSupport set to true returns support for 1.0 apis',
            test: () => {

                Assert.ok(this._aiDeprecated, 'ApplicationInsights SDK exists');
                Assert.ok((this._aiDeprecated as IAppInsightsDeprecated).downloadAndSetup); // has legacy method
            }
        });
    }

    public addApiTests(): void {
        this.testCaseAsync({
            name: this._name + 'ApplicationInsightsDeprecatedTests: trackEvent sends to backend',
            stepDelay: 1,
            steps: [() => {
                this._aiDeprecated.trackEvent('event');
            }].concat(this.asserts(1))
        });

        this.testCaseAsync({
            name: this._name + 'trackTrace sends to backend',
            stepDelay: 1,
            steps: [() => {
                this._aiDeprecated.trackTrace('trace');
            }].concat(this.asserts(1))
        });

        this.testCaseAsync({
            name: this._name + 'trackException sends to backend',
            stepDelay: 1,
            steps: [() => {
                let exception: Error = null;
                try {
                    window['a']['b']();
                    Assert.ok(false, 'trackException test not run');
                } catch (e) {
                    exception = e;
                    this._aiDeprecated.trackException(exception);
                }
                Assert.ok(exception);
            }].concat(this.asserts(1))
        });

        this.testCaseAsync({
            name: this._name + "track metric",
            stepDelay: 1,
            steps: [
                () => {
                    console.log("* calling trackMetric " + new Date().toISOString());
                    for (let i = 0; i < 100; i++) {
                        this._aiDeprecated.trackMetric("test" + i,Math.round(100 * Math.random()));
                    }
                    console.log("* done calling trackMetric " + new Date().toISOString());
                }
            ].concat(this.asserts(100))
        });

        this.testCaseAsync({
            name: this._name + "track page view",
            stepDelay: 1,
            steps: [
                () => {
                    this._aiDeprecated.trackPageView(); // sends 2
                }
            ].concat(this.asserts(2))
        });
    }

    private boilerPlateAsserts = () => {
        Assert.ok(this.successSpy.called, "success");
        Assert.ok(!this.errorSpy.called, "no error sending");
        const isValidCallCount = this.loggingSpy.callCount === 0;
        Assert.ok(isValidCallCount, "logging spy was called 0 time(s)");
        if (!isValidCallCount) {
            while (this.loggingSpy.args.length) {
                Assert.ok(false, "[warning thrown]: " + this.loggingSpy.args.pop());
            }
        }
    }
    private asserts: any = (expectedCount: number) => [() => {
        const message = "polling: " + new Date().toISOString();
        Assert.ok(true, message);
        console.log(message);

        if (this.successSpy.called) {
            this.boilerPlateAsserts();
            this.testCleanup();
        } else if (this.errorSpy.called || this.loggingSpy.called) {
            this.boilerPlateAsserts();
        }
    },
    (PollingAssert.createPollingAssert(() => {
        Assert.ok(true, "* checking success spy " + new Date().toISOString());

        if(this.successSpy.called) {
            let currentCount: number = 0;
            this.successSpy.args.forEach(call => {
                currentCount += call[1];
            });
            console.log('curr: ' + currentCount + ' exp: ' + expectedCount);
            return currentCount === expectedCount;
        } else {
            return false;
        }
    }, "sender succeeded", 30, 1000))];
}