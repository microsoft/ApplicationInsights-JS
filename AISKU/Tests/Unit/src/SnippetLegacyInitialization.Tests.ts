import { IAppInsightsDeprecated } from "../../../src/ApplicationInsightsDeprecated";
import { ApplicationInsightsContainer } from "../../../src/ApplicationInsightsContainer";
import { IApplicationInsights, Snippet } from "../../../src/Initialization";
import { Sender } from "@microsoft/applicationinsights-channel-js";
import { createLegacySnippet } from "./testLegacySnippet";
import { SinonSpy } from "sinon";
import { AITestClass, Assert, PollingAssert } from "@microsoft/ai-test-framework";
import { hasOwnProperty, isNotNullOrUndefined } from "@microsoft/applicationinsights-core-js";

function getBasicLegacySnippetConfig() {
    return {
        instrumentationKey: 'b7170927-2d1c-44f1-acec-59f4e1751c11',
        disableAjaxTracking: false,
        disableFetchTracking: false,
        maxBatchInterval: 500
    };
}

const _expectedProperties = [
    "config",
    "core",
    "context",
    "cookie",
    "appInsights",
    "appInsightsNew",
    "version"
];

const _expectedTrackMethods = [
    "startTrackEvent",
    "stopTrackEvent",
    "startTrackPage",
    "stopTrackPage",
    "trackException",
    "trackEvent",
    "trackMetric",
    "trackPageView",
    "trackTrace",
    "setAuthenticatedUserContext",
    "clearAuthenticatedUserContext",
    "flush"
];

const _expectedMethodsAfterInitialization = [
    "getCookieMgr"
];

export class SnippetLegacyInitializationTests extends AITestClass {

    // Sinon
    private errorSpy: SinonSpy;
    private successSpy: SinonSpy;
    private loggingSpy: SinonSpy;

    constructor(emulateEs3: boolean) {
        super("SnippetLegacyInitializationTests", emulateEs3);
    }

    public testInitialize() {
        this._disableDynProtoBaseFuncs(); // We need to disable the useBaseInst performance setting as the sinon spy fools the internal logic and the spy is bypassed
        this.useFakeServer = true;
        this.fakeServerAutoRespond = true;
    }

    public testCleanup() {
    }

    public registerTests() {

        this.testCase({
            name: "Check support for 1.0 apis",
            test: () => {
                let theSnippet = this._initializeSnippet(createLegacySnippet(getBasicLegacySnippetConfig()));
                Assert.ok(theSnippet, 'ApplicationInsights SDK exists');
                Assert.ok(theSnippet.downloadAndSetup, "The [Legacy] snippet should have the downloadAndSetup"); // has legacy method
            }
        });

        this.testCaseAsync({
            name: "Public Members exist",
            stepDelay: 1,
            steps: [() => {
                let theSnippet = this._initializeSnippet(createLegacySnippet(getBasicLegacySnippetConfig())) as any;
                _expectedTrackMethods.forEach(method => {
                    Assert.ok(hasOwnProperty(theSnippet, method), `${method} exists`);
                    Assert.ok(theSnippet[method], `${method} exists`);
                    Assert.equal('function', typeof theSnippet[method], `${method} is a function`);

                    let funcSpyNew;
                    let funcSpy;
                    if (method === "setAuthenticatedUserContext" || method === "clearAuthenticatedUserContext") {
                        //funcSpy = this.sandbox.spy(theSnippet.context.user, method);
                        funcSpyNew = this.sandbox.spy(theSnippet.appInsightsNew.context.user, method);
                     } else if (method === "flush") {
                        funcSpyNew = this.sandbox.spy(theSnippet.appInsightsNew, method);
                    } else {
                        funcSpy = this.sandbox.spy(theSnippet.appInsights, method);
                        funcSpyNew = this.sandbox.spy(theSnippet.appInsightsNew, method);
                    }

                    try {
                        theSnippet[method]();
                    } catch(e) {
                        // Do nothing
                    }

                    Assert.ok(funcSpyNew.called, "Function [" + method + "] of the new implementation should have been called")
                    if (funcSpy) {
                        Assert.ok(funcSpy.called, "Function [" + method + "] of the appInsights should have been called")
                    }
                });

                _expectedMethodsAfterInitialization.forEach(method => {
                    Assert.ok(hasOwnProperty(theSnippet, method), `${method} exists`);
                    Assert.ok(theSnippet[method], `${method} exists`);
                    Assert.equal('function', typeof theSnippet[method], `${method} is a function`);

                    let funcSpy = this.sandbox.spy(theSnippet.appInsights, method);
                    let funcSpyNew = this.sandbox.spy(theSnippet.appInsightsNew, method);

                    try {
                        theSnippet[method]();
                    } catch(e) {
                        // Do nothing
                    }

                    Assert.ok(funcSpyNew.called, "Function [" + method + "] of the new implementation should have been called")
                    if (funcSpy) {
                        Assert.ok(funcSpy.called, "Function [" + method + "] of the appInsights should have been called")
                    }
                });

            }, PollingAssert.createPollingAssert(() => {
                try {
                    Assert.ok(true, "* waiting for scheduled actions to send events " + new Date().toISOString());
        
                    if(this.successSpy.called) {
                        let currentCount: number = 0;
                        this.successSpy.args.forEach(call => {
                            call[0].forEach(message => {
                                // Ignore the internal SendBrowserInfoOnUserInit message (Only occurs when running tests in a browser)
                                if (!message || message.indexOf("AI (Internal): 72 ") == -1) {
                                    currentCount ++;
                                }
                            });
                        });
                        return currentCount > 0;
                    }
        
                    return false;
                } catch (e) {
                    Assert.ok(false, "Exception:" + e);
                }
            }, "waiting for sender success", 30, 1000) as any]
        });

        this.testCase({
            name: "Check properties exist",
            test: () => {
                let theSnippet = this._initializeSnippet(createLegacySnippet(getBasicLegacySnippetConfig())) as any;
                _expectedProperties.forEach(property => {
                    Assert.ok(hasOwnProperty(theSnippet, property), `${property} has own property`)
                    Assert.notEqual(undefined, theSnippet[property], `${property} exists`);
                    Assert.notEqual('function', typeof theSnippet[property], `${property} is not a function`);
                });

                Assert.ok(isNotNullOrUndefined(theSnippet.core), "Make sure the core is set");
                Assert.ok(isNotNullOrUndefined(theSnippet.appInsightsNew.core), "Make sure the appInsights core is set");
                Assert.equal(theSnippet.core, theSnippet.appInsightsNew.core, "Make sure the core instances are actually the same");
            }
        });


        this.testCase({
            name: "Check cookie manager access",
            test: () => {
                let theSnippet = this._initializeSnippet(createLegacySnippet(getBasicLegacySnippetConfig())) as any;

                let coreCookieMgr = theSnippet.core.getCookieMgr();
                Assert.ok(isNotNullOrUndefined(coreCookieMgr), "Make sure the cookie manager is returned");
                Assert.equal(true, coreCookieMgr.isEnabled(), "Cookies should be enabled")
                Assert.equal(coreCookieMgr, theSnippet.getCookieMgr(), "Make sure the cookie manager is returned");    

                let appInsightsCookieMgr = theSnippet.appInsightsNew.core.getCookieMgr();
                Assert.ok(isNotNullOrUndefined(appInsightsCookieMgr), "Make sure the cookie manager is returned");
                Assert.equal(true, appInsightsCookieMgr.isEnabled(), "Cookies should be enabled")
                Assert.equal(appInsightsCookieMgr, theSnippet.getCookieMgr(), "Make sure the cookie manager is returned");
                Assert.equal(coreCookieMgr, appInsightsCookieMgr, "Make sure the cookie managers are the same");

                Assert.equal(true, theSnippet.getCookieMgr().isEnabled(), "Cookies should be enabled")

                let appInsightsCookieMgr2 = theSnippet.appInsightsNew.appInsights.core.getCookieMgr();
                Assert.ok(isNotNullOrUndefined(appInsightsCookieMgr2), "Make sure the cookie manager is returned");
                Assert.equal(true, appInsightsCookieMgr2.isEnabled(), "Cookies should be enabled")
                Assert.equal(appInsightsCookieMgr2, theSnippet.getCookieMgr(), "Make sure the cookie manager is returned");
                Assert.equal(coreCookieMgr, appInsightsCookieMgr2, "Make sure the cookie managers are the same");
            }
        });

        this.testCase({
            name: "Check cookie manager access as disabled",
            test: () => {
                let theConfig = getBasicLegacySnippetConfig() as any;
                theConfig.disableCookiesUsage = true;
                let theSnippet = this._initializeSnippet(createLegacySnippet(theConfig)) as any;

                let coreCookieMgr = theSnippet.core.getCookieMgr();
                Assert.ok(isNotNullOrUndefined(coreCookieMgr), "Make sure the cookie manager is returned");
                Assert.equal(false, coreCookieMgr.isEnabled(), "Cookies should be disabled")
                Assert.equal(coreCookieMgr, theSnippet.getCookieMgr(), "Make sure the cookie manager is returned");              

                let appInsightsCookieMgr = theSnippet.appInsightsNew.core.getCookieMgr();
                Assert.ok(isNotNullOrUndefined(appInsightsCookieMgr), "Make sure the cookie manager is returned");
                Assert.equal(false, appInsightsCookieMgr.isEnabled(), "Cookies should be disabled")
                Assert.equal(appInsightsCookieMgr, theSnippet.getCookieMgr(), "Make sure the cookie manager is returned");
                Assert.equal(coreCookieMgr, appInsightsCookieMgr, "Make sure the cookie managers are the same");

                Assert.equal(false, theSnippet.getCookieMgr().isEnabled(), "Cookies should be disabled")

                let appInsightsCookieMgr2 = theSnippet.appInsightsNew.appInsights.core.getCookieMgr();
                Assert.ok(isNotNullOrUndefined(appInsightsCookieMgr2), "Make sure the cookie manager is returned");
                Assert.equal(false, appInsightsCookieMgr2.isEnabled(), "Cookies should be disabled")
                Assert.equal(appInsightsCookieMgr2, theSnippet.getCookieMgr(), "Make sure the cookie manager is returned");
                Assert.equal(coreCookieMgr, appInsightsCookieMgr2, "Make sure the cookie managers are the same");
            }
        });

        this.addLegacyApiTests(createLegacySnippet);
    }

    public addLegacyApiTests(snippetCreator: (config:any) => Snippet): void {
        this.testCaseAsync({
            name: "[Legacy] trackEvent sends to backend",
            stepDelay: 1,
            steps: [() => {
                let theSnippet = this._initializeSnippet(snippetCreator(getBasicLegacySnippetConfig())) as IAppInsightsDeprecated;
                theSnippet.trackEvent("event");
            }].concat(this.asserts(1))
        });

        this.testCaseAsync({
            name: "[Legacy] trackTrace sends to backend",
            stepDelay: 1,
            steps: [() => {
                let theSnippet = this._initializeSnippet(snippetCreator(getBasicLegacySnippetConfig())) as IAppInsightsDeprecated;
                theSnippet.trackTrace("trace");
            }].concat(this.asserts(1))
        });

        this.testCaseAsync({
            name: "[Legacy] trackException sends to backend",
            stepDelay: 1,
            steps: [() => {
                let exception: Error = null;
                let theSnippet = this._initializeSnippet(snippetCreator(getBasicLegacySnippetConfig())) as IAppInsightsDeprecated;

                try {
                    window['a']['b']();
                    Assert.ok(false, 'trackException test not run');
                } catch (e) {
                    exception = e;
                    theSnippet.trackException(exception);
                }
                Assert.ok(exception);
            }].concat(this.asserts(1))
        });

        this.testCaseAsync({
            name: "[Legacy] track metric",
            stepDelay: 1,
            steps: [
                () => {
                    let theSnippet = this._initializeSnippet(snippetCreator(getBasicLegacySnippetConfig())) as IAppInsightsDeprecated;

                    console.log("* calling trackMetric " + new Date().toISOString());
                    for (let i = 0; i < 100; i++) {
                        theSnippet.trackMetric("test" + i,Math.round(100 * Math.random()));
                    }
                    console.log("* done calling trackMetric " + new Date().toISOString());
                }
            ].concat(this.asserts(100))
        });

        this.testCaseAsync({
            name: "[Legacy] track page view",
            stepDelay: 1,
            steps: [
                () => {
                    let theSnippet = this._initializeSnippet(snippetCreator(getBasicLegacySnippetConfig())) as IAppInsightsDeprecated;
                    theSnippet.trackPageView(); // sends 2
                }
            ].concat(this.asserts(2))
        });
    }

    private _initializeSnippet(snippet: Snippet): IAppInsightsDeprecated {
        try {
            // Call the initialization
            ((ApplicationInsightsContainer.getAppInsights(snippet, snippet.version)) as IAppInsightsDeprecated); 

            const appInsights = (snippet as any).appInsights;
            this.onDone(() => {
                if (snippet["unload"]) {
                    snippet["unload"](false);
                } else if (snippet["appInsightsNew"]) {
                    snippet["appInsightsNew"].unload(false);
                }
            });

            Assert.ok(appInsights, "The App insights instance should be populated");
            Assert.ok(appInsights.core, "The Core exists");
            Assert.equal(appInsights.core, (snippet as any).core, "The core instances should match");

            Assert.equal(true, appInsights.isInitialized(), 'App Analytics is initialized');
            Assert.equal(true, appInsights.core.isInitialized(), 'Core is initialized');

            const appInsightsNew = (snippet as any).appInsightsNew;
            Assert.ok(appInsightsNew, "The App insights new instance should be populated");
            Assert.ok(appInsightsNew.core, "The Core exists");
            Assert.equal(appInsightsNew.core, (snippet as any).core, "The core instances should match");
            Assert.equal(true, appInsightsNew.appInsights.isInitialized(), 'App Analytics is initialized');
            Assert.equal(true, appInsightsNew.core.isInitialized(), 'Core is initialized');

            // Setup Sinon stuff
            const sender: Sender = appInsightsNew.core.getTransmissionControls()[0][0] as Sender;
            this.errorSpy = this.sandbox.spy(sender, '_onError');
            this.successSpy = this.sandbox.spy(sender, '_onSuccess');
            this.loggingSpy = this.sandbox.stub(appInsights.core.logger, 'throwInternal');
        } catch (e) {
            console.error('Failed to initialize');
            Assert.ok(false, e);
        }

        // Note: Explicitly returning the original snippet as this should have been updated!
        return snippet as IAppInsightsDeprecated;
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
        try {
            Assert.ok(true, "* checking success spy " + new Date().toISOString());

            if(this.successSpy.called) {
                let currentCount: number = 0;
                this.successSpy.args.forEach(call => {
                    call[0].forEach(message => {
                        // Ignore the internal SendBrowserInfoOnUserInit message (Only occurs when running tests in a browser)
                        if (!message || message.indexOf("AI (Internal): 72 ") == -1) {
                            currentCount ++;
                        }
                    });
                });
                console.log('curr: ' + currentCount + ' exp: ' + expectedCount);
                return currentCount === expectedCount;
            }

            return false;
        } catch (e) {
            Assert.ok(false, "Exception:" + e);
        }
    }, "sender succeeded", 30, 1000))];
}