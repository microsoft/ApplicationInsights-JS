import { ApplicationInsights, IApplicationInsights } from '../../../src/applicationinsights-web'
import { Sender } from '@microsoft/applicationinsights-channel-js';
import { SinonSpy } from 'sinon';
import { AITestClass, Assert, PollingAssert } from '@microsoft/ai-test-framework';
import { dumpObj } from '@microsoft/applicationinsights-core-js';
import { BreezeChannelIdentifier } from '@microsoft/applicationinsights-common';

export class ValidateE2ETests extends AITestClass {
    private readonly _instrumentationKey = 'b7170927-2d1c-44f1-acec-59f4e1751c11';

    private _ai: IApplicationInsights;

    // Sinon
    private errorSpy: SinonSpy;
    private successSpy: SinonSpy;
    private loggingSpy: SinonSpy;

    private delay = 100;

    constructor() {
        super("ValidateE2ETests");
    }
    
    public testInitialize() {
        try {
            this.useFakeServer = false;
            const init = new ApplicationInsights({
                config: {
                    instrumentationKey: this._instrumentationKey,
                    extensionConfig: {
                        'AppInsightsChannelPlugin': {
                            maxBatchInterval: 500
                        }
                    }
                },
                queue: [],
                version: 2.0
            });
            this._ai = init.loadAppInsights();

            // Setup Sinon stuff
            const sender: Sender = this._ai.appInsights.core.getPlugin<Sender>(BreezeChannelIdentifier).plugin;
            this.errorSpy = this.sandbox.spy(sender, '_onError');
            this.successSpy = this.sandbox.spy(sender, '_onSuccess');
            this.loggingSpy = this.sandbox.stub(this._ai.appInsights.core.logger, 'throwInternal');
        } catch (e) {
            console.error('Failed to initialize');
        }
    }

    public testFinishedCleanup(): void {
        if (this._ai) {
            this._ai.unload(false);
            this._ai = null;
        }        
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
                    const acceptedItems = this.getPayloadMessages(this.successSpy).length;
                    Assert.equal(2, acceptedItems, "backend should accept two events");
                    if (acceptedItems != 2) {
                        this.dumpPayloadMessages(this.successSpy);
                    }
                })
        });

        this.testCaseAsync({
            name: 'E2E.GenericTests: trackEvent sends to backend with NaN value could be handled correctly',
            stepDelay: this.delay,
            steps: [
                () => {
                    const customeProperties = {
                        nanValue: NaN,
                    }
                    this._ai.trackEvent({ name: 'event', properties: { "prop1": NaN, "prop2": NaN }}, customeProperties);
                }]
                .concat(this.waitForResponse())
                .concat(this.boilerPlateAsserts)
                .concat(() => {
                    const acceptedItems = this.getPayloadMessages(this.successSpy).length;
                    Assert.equal(1, acceptedItems, "backend should accept two events");
                    if (acceptedItems != 1) {
                        this.dumpPayloadMessages(this.successSpy);
                    }
                    const payloadStr: string[] = this.getPayloadMessages(this.successSpy);
                    if (payloadStr.length > 0) {
                        const payload = JSON.parse(payloadStr[0]);
                        const data = payload.data;
                        Assert.ok(data && data.baseData);
                        Assert.equal(null, data.baseData.measurements["nanValue"]);
                        Assert.equal("NaN", data.baseData.properties["prop1"]);
                    }
                })
        });

        this.testCaseAsync({
            name: "Validate that track event takes all type of characters",
            stepDelay: this.delay,
            steps: [
                () => {
                    const s1 = "شلاؤيثبلاهتنمةىخحضقسفعشلاؤيصثبل";
                    const s2 = "Ինչու՞ նրանք չեն խոսում Հայերեն";
                    const s3 = "ওরা কন বাংলা বলেত পাের না";
                    const s4 = "妣 啊 僜刓嘰塡奬〉媆孿 偁偄偙 偁A偄E偆I偊O偍U";
                    const s5 = "ßüµ€ÄäÖö€ ερτυθιοπαδφγηξκλζχψωβνΔΦΓΗΞΚΛΨΩΘ რატომ";
                    const s6 = "йцуукенгшщзхъфываполджэс";
                    const s7 = "\x0000\x0001\x0002\x0003\x0004\x0005\x0006\x0007\x0008\x009F";

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
                    let acceptedItems = 0;
                    this.successSpy.args.forEach(call => {
                        call[0].forEach(item => {
                            let message = item;
                            if (typeof item !== "string") {
                                message = item.item;
                            }
                            // Ignore the internal SendBrowserInfoOnUserInit message (Only occurs when running tests in a browser)
                            if (message.indexOf("AI (Internal): 72 ") == -1) {
                                acceptedItems ++;
                            }
                        });
                    });

                    Assert.equal(4, acceptedItems, "backend should accept all four events");
                    if (acceptedItems != 4) {
                        this.dumpPayloadMessages(this.successSpy);
                    }
                })
        });

        this.testCaseAsync({
            name: "Validate that special characters are handled correctly",
            stepDelay: this.delay,
            steps: [
                () => {
                    const s1 = "[]{};,.)(*&^%$#@/\\";

                    this._ai.trackTrace({message: s1}, { p: s1 });
                    this._ai.trackTrace({message: "a"}, { "[]{};,.)(*&^%$#@/\\": "b" });
                }]
                .concat(this.waitForResponse())
                .concat(this.boilerPlateAsserts)
                .concat(() => {
                    const acceptedItems = this.getPayloadMessages(this.successSpy).length;
                    Assert.equal(2, acceptedItems, "backend should accept the event");
                    if (acceptedItems != 2) {
                        this.dumpPayloadMessages(this.successSpy);
                    }
                })
        });
    }

    private waitForResponse() {
        return PollingAssert.createPollingAssert(() => {
            return (this.successSpy.called || this.errorSpy.called);
        }, "Wait for response" + new Date().toISOString(), 15, 1000) as any
    }

    private boilerPlateAsserts() {
        Assert.ok(this.successSpy.called, "success");
        Assert.ok(!this.errorSpy.called, "no error sending");
        const isValidCallCount = this.loggingSpy.callCount === 0;
        Assert.ok(isValidCallCount, "logging spy was called 0 time(s)");
        if (!isValidCallCount) {
            while (this.loggingSpy.args.length) {
                Assert.ok(false, "[warning thrown]: " + dumpObj(this.loggingSpy.args.pop()));
            }
        }
    }
}
