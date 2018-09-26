/// <reference path='./TestFramework/Common.ts' />
import { Initialization, IApplicationInsights } from '../Initialization'
import { ApplicationInsights } from 'applicationinsights-analytics-js';
import { Sender } from 'applicationinsights-channel-js';

export class ValidateE2ETests extends TestClass {
    private readonly _instrumentationKey = 'b7170927-2d1c-44f1-acec-59f4e1751c11';
    
    private _ai: IApplicationInsights;

    // Sinon
    private errorSpy: SinonSpy;
    private successSpy: SinonSpy;
    private loggingSpy: SinonSpy;

    private delay = 100;

    public testInitialize() {
        try{
            this.useFakeServer = false;
            (<any>sinon.fakeServer).restore();
            this.useFakeTimers = false;
            this.clock.restore();

            var init = new Initialization({
                config: {
                    instrumentationKey: this._instrumentationKey,
                    extensionConfig: {
                        'AppInsightsChannelPlugin': {
                            maxBatchInterval: 500
                        }
                    }
                },
                queue: []
            });
            this._ai = init.loadAppInsights();

            // Setup Sinon stuff
            const sender: Sender = this._ai.appInsights.core['_extensions'][3].channelQueue[0][0];
            this.errorSpy = this.sandbox.spy(sender, '_onError');
            this.successSpy = this.sandbox.spy(sender, '_onSuccess');
            this.loggingSpy = this.sandbox.stub(this._ai.appInsights.core.logger, 'throwInternal');
        } catch (e) {
            console.error('Failed to initialize');
        }
    }

    public testCleanup() {
        this.useFakeServer = true;
        this.useFakeTimers = true;
    }

    public registerTests() {
        this.addAsyncTests();
    }

    private addAsyncTests(): void {
        this.testCaseAsync({
            name: "Validate track event",
            stepDelay: this.delay,
            steps: [
                () => {
                    this._ai.trackTrace({message: "test"});
                    this._ai.trackTrace({message: "test event"}, { p1: "value 1", p2: "value 2", m1: 123, m2: 456.7 });
                }]
                .concat(this.waitForResponse())
                .concat(this.boilerPlateAsserts)
                .concat(() => {
                    var acceptedItems = this.successSpy.args[0][1];
                    Assert.equal(2, acceptedItems, "backend should accept two events");
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
                this._ai.trackTrace({message: " abcd efg   "}, { " abc " : "value 1", " " : "value 2" });

                // international characters
                this._ai.trackTrace({message: s1}, { p: s2 });
                this._ai.trackTrace({message: s3}, { p: s4 });
                this._ai.trackTrace({message: s5}, { p: s6, p2: s7 });
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

                this._ai.trackTrace({message: s1}, { p: s1 });
                this._ai.trackTrace({message: "a"}, { "[]{};,.)(*&^%$#@/\\": "b" });
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
        }, "Wait for response" + new Date().toISOString(), 5, 1000)
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
}
