import { IAppInsightsDeprecated } from "../../../src/ApplicationInsightsDeprecated";
import { ApplicationInsightsContainer } from "../../../src/ApplicationInsightsContainer";
import { IApplicationInsights, Snippet } from "../../../src/Initialization";
import { Sender } from "@microsoft/applicationinsights-channel-js";
import { SinonSpy } from "sinon";
import { AITestClass, Assert, PollingAssert } from "@microsoft/ai-test-framework";
import { createSnippetV5 } from "./testSnippetV5";
import { createSnippetV6 } from "./testSnippetV6";
import { dumpObj, hasOwnProperty, isNotNullOrUndefined, ITelemetryItem, objForEachKey } from "@microsoft/applicationinsights-core-js";
import { ContextTagKeys, DistributedTracingModes, IConfig, IDependencyTelemetry, RequestHeaders, Util, utlRemoveSessionStorage } from "@microsoft/applicationinsights-common";
import { getGlobal } from "@microsoft/applicationinsights-shims";
import { TelemetryContext } from "@microsoft/applicationinsights-properties-js";

const TestInstrumentationKey = 'b7170927-2d1c-44f1-acec-59f4e1751c11';
const TestConnectionString = 'InstrumentationKey=b7170927-2d1c-44f1-acec-59f4e1751c11';

const _expectedBeforeProperties = [
    "config",
    "cookie"
];

const _expectedAfterProperties = [
    "appInsights",
    "core",
    "context"
];

const _expectedTrackMethods = [
    "startTrackPage",
    "stopTrackPage",
    "trackException",
    "trackEvent",
    "trackMetric",
    "trackPageView",
    "trackTrace",
    "trackDependencyData",
    "setAuthenticatedUserContext",
    "clearAuthenticatedUserContext",
    "trackPageViewPerformance",
    "addTelemetryInitializer",
    "flush"
];

const _expectedMethodsAfterInitialization = [
    "getCookieMgr"
];

function getSnippetConfig(sessionPrefix: string, addSampling: boolean = false) {
    return {
        src: "",
        cfg: {
            connectionString: `InstrumentationKey=${TestInstrumentationKey}`,
            disableAjaxTracking: false,
            disableFetchTracking: false,
            enableRequestHeaderTracking: true,
            enableResponseHeaderTracking: true,
            maxBatchInterval: 500,
            disableExceptionTracking: false,
            namePrefix: `sessionPrefix`,
            enableCorsCorrelation: true,
            distributedTracingMode: DistributedTracingModes.AI_AND_W3C,
            samplingPercentage: addSampling ? 50 : undefined
        } as IConfig
    };
};

function getSnippetConfigConnectionString(sessionPrefix: string) {
    return {
        src: "",
        cfg: {
            connectionString: TestConnectionString,
            disableAjaxTracking: false,
            disableFetchTracking: false,
            enableRequestHeaderTracking: true,
            enableResponseHeaderTracking: true,
            maxBatchInterval: 500,
            disableExceptionTracking: false,
            namePrefix: `sessionPrefix`,
            enableCorsCorrelation: true,
            distributedTracingMode: DistributedTracingModes.AI_AND_W3C
        } as IConfig
    };
};

function getSnippetConfigWrongConnectionString(sessionPrefix: string) {
    return {
        src: "",
        cfg: {
            connectionString: 'wrong connection string'+TestConnectionString,
            disableAjaxTracking: false,
            disableFetchTracking: false,
            enableRequestHeaderTracking: true,
            enableResponseHeaderTracking: true,
            maxBatchInterval: 500,
            disableExceptionTracking: false,
            namePrefix: `sessionPrefix`,
            enableCorsCorrelation: true,
            distributedTracingMode: DistributedTracingModes.AI_AND_W3C
        } as IConfig
    };
};

function getSnippetConfigNotSetConnectionString(sessionPrefix: string) {
    return {
        src: "",
        cfg: {
            connectionString: '',
            disableAjaxTracking: false,
            disableFetchTracking: false,
            enableRequestHeaderTracking: true,
            enableResponseHeaderTracking: true,
            maxBatchInterval: 500,
            disableExceptionTracking: false,
            namePrefix: `sessionPrefix`,
            enableCorsCorrelation: true,
            distributedTracingMode: DistributedTracingModes.AI_AND_W3C
        } as IConfig
    };
};

export class SnippetInitializationTests extends AITestClass {

    // Context 
    private tagKeys = new ContextTagKeys();

    // Sinon
    private errorSpy: SinonSpy;
    private successSpy: SinonSpy;
    private loggingSpy: SinonSpy;
    private isFetchPolyfill:boolean = false;
    private sessionPrefix: string = Util.newId();
    private trackSpy: SinonSpy;
    private envelopeConstructorSpy: SinonSpy;

    constructor(emulateEs3: boolean) {
        super("SnippetInitializationTests", emulateEs3);
    }

    // Add any new snippet configurations to this map
    private _theSnippets = {
        "v5": createSnippetV5,
        "v6": createSnippetV6
    };
    
    public testInitialize() {
        this._disableDynProtoBaseFuncs(); // We need to disable the useBaseInst performance setting as the sinon spy fools the internal logic and the spy is bypassed

        try {
            this.useFakeServer = true;
            this.useFakeFetch = true;
            this.fakeServerAutoRespond = true;
            this.fakeFetchAutoRespond = true;
            this.isFetchPolyfill = fetch && fetch["polyfill"];

            console.log("* testInitialize()");
        } catch (e) {
            console.error('Failed to initialize', e);
        }
    }

    public testCleanup() {
        utlRemoveSessionStorage(null as any, "AI_sentBuffer", );
        utlRemoveSessionStorage(null as any, "AI_buffer", );
        utlRemoveSessionStorage(null as any, "sessionPrefix_AI_sentBuffer", );
        utlRemoveSessionStorage(null as any, "sessionPrefix_AI_buffer", );
    }

    public registerTests() {

        objForEachKey(this._theSnippets, (snippetName, snippetCreator) => {
            this.testCase({
                name: "[" + snippetName + "] check NO support for 1.0 apis",
                test: () => {
                    let theSnippet = this._initializeSnippet(snippetCreator(getSnippetConfig(this.sessionPrefix))) as any;
                    Assert.ok(theSnippet, 'ApplicationInsights SDK exists');
                    Assert.ok(!(theSnippet as IAppInsightsDeprecated).downloadAndSetup, "The [" + snippetName + "] snippet should NOT have the downloadAndSetup"); // has legacy method
                }
            });

            this.testCaseAsync({
                name: "checkConnectionString",
                stepDelay: 100,
                steps: [
                    () => {
                        let theSnippet = this._initializeSnippet(snippetCreator(getSnippetConfigConnectionString(this.sessionPrefix)));
                        theSnippet.trackEvent({ name: 'event', properties: { "prop1": "value1" }, measurements: { "measurement1": 200 } });
                    }
                ]
                .concat(this.asserts(1)).concat(() => {
                    const payloadStr: string[] = this.getPayloadMessages(this.successSpy);
                    if (payloadStr.length > 0) {
                       const payload = JSON.parse(payloadStr[0]);
                       const data = payload.data;
                       Assert.ok(data && data.baseData && data.baseData.properties["prop1"]);
                       Assert.ok(data && data.baseData && data.baseData.measurements["measurement1"]);
                    }
                })
            });

            this.testCase({
                name: "checkIncorrectConnectionString",
                test: () => {
                    let theSnippet:any = null;
                    let exception: Error = null;
                    //this.useFakeServer = false;
                    try {
                        let snippet:Snippet = snippetCreator(getSnippetConfigWrongConnectionString(this.sessionPrefix));
                        // Call the initialization
                        let ai = ((ApplicationInsightsContainer.getAppInsights(snippet, snippet.version)) as IApplicationInsights);
                        Assert.equal(true, ai.appInsights.isInitialized(), "isInitialized");
                    } catch (e) {
                        Assert.equal(e.message, "Please provide instrumentation key", "Server would not start when get incorrect connection string");
                    }
                }
            });

            this.testCase({
                name: "checkConnectionStringNotSet",
                test: () => {
                    let theSnippet:any = null;
                    let exception: Error = null;
                    //this.useFakeServer = false;
                    try {
                        let snippet:Snippet = snippetCreator(getSnippetConfigNotSetConnectionString(this.sessionPrefix));
                        // Call the initialization
                        ((ApplicationInsightsContainer.getAppInsights(snippet, snippet.version)) as IApplicationInsights);
                    } catch (e) {
                        Assert.equal(e.message, "Please provide instrumentation key", "Server would not start without connection string");
                    }
                }
            });


            this.testCaseAsync({
                name: "[" + snippetName + "] : Public Members exist",
                stepDelay: 100,
                steps: [() => {
                    let theSnippet = this._initializeSnippet(snippetCreator(getSnippetConfig(this.sessionPrefix))) as any;
                    _expectedTrackMethods.forEach(method => {
                        Assert.ok(theSnippet[method], `${method} exists`);
                        Assert.equal('function', typeof theSnippet[method], `${method} is a function`);

                        let funcSpy;
                        if (method === "trackDependencyData" || method === "flush") {
                            // we don't have any available reference to the underlying call, so while we want to check
                            // that this functions exists we can't validate that it is called
                        } else if (method === "setAuthenticatedUserContext" || method === "clearAuthenticatedUserContext") {
                            funcSpy = this.sandbox.spy(theSnippet.context.user, method);
                        } else if (method === "addTelemetryInitializer") {
                            funcSpy = this.sandbox.spy(theSnippet.core, method);
                        } else {
                            funcSpy = this.sandbox.spy(theSnippet.appInsights, method);
                        }

                        try {
                            theSnippet[method]();
                        } catch(e) {
                            // Do nothing
                        }
    
                        if (funcSpy) {
                            Assert.ok(funcSpy.called, "Function [" + method + "] of the appInsights should have been called")
                        }
                    });

                    _expectedMethodsAfterInitialization.forEach(method => {
                        Assert.ok(theSnippet[method], `${method} exists`);
                        Assert.equal('function', typeof theSnippet[method], `${method} is a function`);

                        let funcSpy = this.sandbox.spy(theSnippet.appInsights, method);

                        try {
                            theSnippet[method]();
                        } catch(e) {
                            // Do nothing
                        }
    
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
                    let preSnippet = snippetCreator(getSnippetConfig(this.sessionPrefix));
                    _expectedBeforeProperties.forEach(property => {
                        Assert.ok(hasOwnProperty(preSnippet, property), `${property} has property`);
                        Assert.ok(isNotNullOrUndefined(preSnippet[property]), `${property} exists`);
                    });
                    _expectedAfterProperties.forEach(property => {
                        Assert.ok(!hasOwnProperty(preSnippet, property), `${property} does not exist`);
                    });

                    let theSnippet = this._initializeSnippet(preSnippet) as any;
                    _expectedAfterProperties.forEach(property => {
                        Assert.ok(hasOwnProperty(theSnippet, property) , `${property} exists`);
                        Assert.notEqual('function', typeof theSnippet[property], `${property} is not a function`);
                    });

                    Assert.ok(isNotNullOrUndefined(theSnippet.core), "Make sure the core is set");
                    Assert.ok(isNotNullOrUndefined(theSnippet.appInsights.core), "Make sure the appInsights core is set");
                    Assert.equal(theSnippet.core, theSnippet.appInsights.core, "Make sure the core instances are actually the same");
                }
            });

            this.testCase({
                name: "Check cookie manager access",
                test: () => {
                    let theSnippet = this._initializeSnippet(snippetCreator(getSnippetConfig(this.sessionPrefix))) as any;

                    let coreCookieMgr = theSnippet.core.getCookieMgr();
                    Assert.ok(isNotNullOrUndefined(coreCookieMgr), "Make sure the cookie manager is returned");
                    Assert.equal(true, coreCookieMgr.isEnabled(), "Cookies should be enabled")
                    Assert.equal(coreCookieMgr, theSnippet.getCookieMgr(), "Make sure the cookie manager is returned");    

                    let appInsightsCookieMgr = theSnippet.appInsights.core.getCookieMgr();
                    Assert.ok(isNotNullOrUndefined(appInsightsCookieMgr), "Make sure the cookie manager is returned");
                    Assert.equal(true, appInsightsCookieMgr.isEnabled(), "Cookies should be enabled")
                    Assert.equal(appInsightsCookieMgr, theSnippet.getCookieMgr(), "Make sure the cookie manager is returned");
                    Assert.equal(coreCookieMgr, appInsightsCookieMgr, "Make sure the cookie managers are the same");

                    Assert.equal(true, theSnippet.getCookieMgr().isEnabled(), "Cookies should be enabled")
                }
            });

            this.testCase({
                name: "Check cookie manager access as disabled",
                test: () => {
                    let theConfig = getSnippetConfig(this.sessionPrefix);
                    theConfig.cfg.disableCookiesUsage = true;
                    let theSnippet = this._initializeSnippet(snippetCreator(theConfig)) as any;

                    let coreCookieMgr = theSnippet.core.getCookieMgr();
                    Assert.ok(isNotNullOrUndefined(coreCookieMgr), "Make sure the cookie manager is returned");
                    Assert.equal(false, coreCookieMgr.isEnabled(), "Cookies should be disabled")
                    Assert.equal(coreCookieMgr, theSnippet.getCookieMgr(), "Make sure the cookie manager is returned");              

                    let appInsightsCookieMgr = theSnippet.appInsights.core.getCookieMgr();
                    Assert.ok(isNotNullOrUndefined(appInsightsCookieMgr), "Make sure the cookie manager is returned");
                    Assert.equal(false, appInsightsCookieMgr.isEnabled(), "Cookies should be disabled")
                    Assert.equal(appInsightsCookieMgr, theSnippet.getCookieMgr(), "Make sure the cookie manager is returned");
                    Assert.equal(coreCookieMgr, appInsightsCookieMgr, "Make sure the cookie managers are the same");

                    Assert.equal(false, theSnippet.getCookieMgr().isEnabled(), "Cookies should be disabled")
                }
            });

            this.addAnalyticsApiTests(snippetName, snippetCreator);
            this.addAsyncTests(snippetName, snippetCreator);
            this.addDependencyPluginTests(snippetName, snippetCreator);
            this.addPropertiesPluginTests(snippetName, snippetCreator);
        });
    }

    public addAnalyticsApiTests(snippetName: string, snippetCreator: (config:any) => Snippet): void {
        this.testCase({
            name: 'E2E.AnalyticsApiTests: Public Members exist',
            test: () => {
                let theSnippet = this._initializeSnippet(snippetCreator(getSnippetConfig(this.sessionPrefix))) as any;
                _expectedTrackMethods.forEach(method => {
                    Assert.ok(theSnippet[method], `${method} exists`);
                    Assert.equal('function', typeof theSnippet[method], `${method} is a function`);
                });
                _expectedMethodsAfterInitialization.forEach(method => {
                    Assert.ok(theSnippet[method], `${method} does exists`);
                    Assert.equal('function', typeof theSnippet[method], `${method} is a function`);
                });
            }
        });
    }

    public addAsyncTests(snippetName: string, snippetCreator: (config:any) => Snippet): void {
        this.testCaseAsync({
            name: 'E2E.GenericTests: trackEvent sends to backend',
            stepDelay: 100,
            steps: [() => {
                let theSnippet = this._initializeSnippet(snippetCreator(getSnippetConfig(this.sessionPrefix)));
                theSnippet.trackEvent({ name: 'event', properties: { "prop1": "value1" }, measurements: { "measurement1": 200 } });
            }].concat(this.asserts(1)).concat(() => {

                const payloadStr: string[] = this.getPayloadMessages(this.successSpy);
                if (payloadStr.length > 0) {
                    const payload = JSON.parse(payloadStr[0]);
                    const data = payload.data;
                    Assert.ok(data && data.baseData && data.baseData.properties["prop1"]);
                    Assert.ok(data && data.baseData && data.baseData.measurements["measurement1"]);
                }
            })
        });

        this.testCaseAsync({
            name: 'E2E.GenericTests: trackTrace sends to backend',
            stepDelay: 100,
            steps: [() => {
                let theSnippet = this._initializeSnippet(snippetCreator(getSnippetConfig(this.sessionPrefix)));
                theSnippet.trackTrace({ message: 'trace', properties: { "foo": "bar", "prop2": "value2" } });
            }].concat(this.asserts(1)).concat(() => {
                const payloadStr: string[] = this.getPayloadMessages(this.successSpy);
                const payload = JSON.parse(payloadStr[0]);
                const data = payload.data;
                Assert.ok(data && data.baseData &&
                    data.baseData.properties["foo"] && data.baseData.properties["prop2"]);
                Assert.equal("bar", data.baseData.properties["foo"]);
                Assert.equal("value2", data.baseData.properties["prop2"]);
            })
        });

        this.testCaseAsync({
            name: 'E2E.GenericTests: trackException sends to backend',
            stepDelay: 100,
            steps: [() => {
                let theSnippet = this._initializeSnippet(snippetCreator(getSnippetConfig(this.sessionPrefix)));
                let exception: Error = null;
                try {
                    window['a']['b']();
                    Assert.ok(false, 'trackException test not run');
                } catch (e) {
                    exception = e;
                    theSnippet.trackException({ exception });
                }
                Assert.ok(exception);
            }].concat(this.asserts(1))
        });

        this.testCaseAsync({
            name: 'E2E.GenericTests: legacy trackException sends to backend',
            stepDelay: 100,
            steps: [() => {
                let theSnippet = this._initializeSnippet(snippetCreator(getSnippetConfig(this.sessionPrefix)));
                let exception: Error = null;
                try {
                    window['a']['b']();
                    Assert.ok(false, 'trackException test not run');
                } catch (e) {
                    exception = e;
                    theSnippet.trackException({ error: exception } as any);
                }
                Assert.ok(exception);
            }].concat(this.asserts(1))
        });

        this.testCaseAsync({
            name: "TelemetryContext: track metric",
            stepDelay: 100,
            steps: [
                () => {
                    let theSnippet = this._initializeSnippet(snippetCreator(getSnippetConfig(this.sessionPrefix)));
                    console.log("* calling trackMetric " + new Date().toISOString());
                    for (let i = 0; i < 100; i++) {
                        theSnippet.trackMetric({ name: "test" + i, average: Math.round(100 * Math.random()) });
                    }
                    console.log("* done calling trackMetric " + new Date().toISOString());
                }
            ].concat(this.asserts(100))
        });

        this.testCaseAsync({
            name: `TelemetryContext: track page view ${window.location.pathname}`,
            stepDelay: 500,
            steps: [
                () => {
                    let theSnippet = this._initializeSnippet(snippetCreator(getSnippetConfig(this.sessionPrefix)));
                    theSnippet.trackPageView({}); // sends 2
                }
            ]
            .concat(this.asserts(2))
            .concat(() => {

                const payloadStr: string[] = this.getPayloadMessages(this.successSpy);
                if (payloadStr.length > 0) {
                    const payload = JSON.parse(payloadStr[0]);
                    const data = payload.data;
                    Assert.ok(data.baseData.id, "pageView id is defined");
                    Assert.ok(data.baseData.id.length > 0);
                    Assert.ok(payload.tags["ai.operation.id"]);
                    Assert.equal(data.baseData.id, payload.tags["ai.operation.id"], "pageView id matches current operation id");
                } else {
                    Assert.ok(false, "successSpy not called");
                }
            })
        });

        this.testCaseAsync({
            name: "TelemetryContext: track page view performance",
            stepDelay: 100,
            steps: [
                () => {
                    let theSnippet = this._initializeSnippet(snippetCreator(getSnippetConfig(this.sessionPrefix)));
                    theSnippet.trackPageViewPerformance({ name: 'name', uri: 'url' });
                }
            ].concat(this.asserts(1))
        });

        this.testCaseAsync({
            name: "TelemetryContext: track all types in batch",
            stepDelay: 100,
            steps: [
                () => {
                    let theSnippet = this._initializeSnippet(snippetCreator(getSnippetConfig(this.sessionPrefix)));
                    let exception = null;
                    try {
                        window["a"]["b"]();
                    } catch (e) {
                        exception = e;
                    }

                    Assert.ok(exception);

                    theSnippet.trackException({ exception });
                    theSnippet.trackMetric({ name: "test", average: Math.round(100 * Math.random()) });
                    theSnippet.trackTrace({ message: "test" });
                    theSnippet.trackPageView({}); // sends 2
                    theSnippet.trackPageViewPerformance({ name: 'name', uri: 'http://someurl' });
                    theSnippet.flush();
                }
            ].concat(this.asserts(6))
        });

        this.testCaseAsync({
            name: "TelemetryContext: track all types in a large batch",
            stepDelay: 100,
            steps: [
                () => {
                    let theSnippet = this._initializeSnippet(snippetCreator(getSnippetConfig(this.sessionPrefix)));
                    let exception = null;
                    try {
                        window["a"]["b"]();
                    } catch (e) {
                        exception = e;
                    }
                    Assert.ok(exception);

                    for (let i = 0; i < 100; i++) {
                        theSnippet.trackException({ exception });
                        theSnippet.trackMetric({ name: "test", average: Math.round(100 * Math.random()) });
                        theSnippet.trackTrace({ message: "test" });
                        theSnippet.trackPageView({ name: `${i}` }); // sends 2 1st time
                    }
                }
            ].concat(this.asserts(401, false))
        });

        this.testCaseAsync({
            name: "TelemetryInitializer: E2E override envelope data",
            stepDelay: 100,
            steps: [
                () => {
                    let theSnippet = this._initializeSnippet(snippetCreator(getSnippetConfig(this.sessionPrefix)));
                    // Setup
                    const telemetryInitializer = {
                        init: (envelope) => {
                            envelope.baseData.name = 'other name'
                            return true;
                        }
                    }


                    // Act
                    theSnippet.addTelemetryInitializer(telemetryInitializer.init);
                    theSnippet.trackMetric({ name: "test", average: Math.round(100 * Math.random()) });
                }
            ]
                .concat(this.asserts(1))
                .concat(() => {
                    const payloadStr: string[] = this.getPayloadMessages(this.successSpy);
                    if (payloadStr.length > 0) {
                        let payloadItems = payloadStr.length;
                        Assert.equal(1, payloadItems, 'Only 1 track item is sent');
                        const payload = JSON.parse(payloadStr[0]);
                        Assert.ok(payload);

                        if (payload && payload.baseData) {
                            const nameResult: string = payload.data.baseData.metrics[0].name;
                            const nameExpect: string = 'other name';
                            Assert.equal(nameExpect, nameResult, 'telemetryinitializer override successful');
                        }
                    }
                })
        });
    }

    public addDependencyPluginTests(snippetName: string, snippetCreator: (config:any) => Snippet): void {

        this.testCaseAsync({
            name: "TelemetryContext: trackDependencyData",
            stepDelay: 100,
            steps: [
                () => {
                    let theSnippet = this._initializeSnippet(snippetCreator(getSnippetConfig(this.sessionPrefix)));
                    const data: IDependencyTelemetry = {
                        target: 'http://abc',
                        responseCode: 200,
                        type: 'GET',
                        id: 'abc'
                    }
                    theSnippet.trackDependencyData(data);
                }
            ].concat(this.asserts(1))
        });

        if (!this.isEmulatingEs3) {
            // If we are emulating ES3 then XHR is not hooked
            this.testCaseAsync({
                name: "TelemetryContext: auto collection of ajax requests",
                stepDelay: 100,
                steps: [
                    () => {
                        let theSnippet = this._initializeSnippet(snippetCreator(getSnippetConfig(this.sessionPrefix)));
                        const xhr = new XMLHttpRequest();
                        xhr.open('GET', 'https://httpbin.org/status/200');
                        xhr.send();
                        Assert.ok(true);
                    }
                ].concat(this.asserts(1))
            });
        }
        
        let global = getGlobal();
        if (global && global.fetch && !this.isEmulatingEs3) {
            this.testCaseAsync({
                name: "DependenciesPlugin: auto collection of outgoing fetch requests " + (this.isFetchPolyfill ? " using polyfill " : ""),
                stepDelay: 2000,
                steps: [
                    () => {
                        let theSnippet = this._initializeSnippet(snippetCreator(getSnippetConfig(this.sessionPrefix)));
                        fetch('https://httpbin.org/status/200', { method: 'GET', headers: { 'header': 'value'} });
                        Assert.ok(true, "fetch monitoring is instrumented");
                    },
                    () => {
                        fetch('https://httpbin.org/status/200', { method: 'GET' });
                        Assert.ok(true, "fetch monitoring is instrumented");
                    },
                    () => {
                        fetch('https://httpbin.org/status/200');
                        Assert.ok(true, "fetch monitoring is instrumented");
                    }
                ]
                    .concat(this.asserts(3, false, false))
                    .concat(() => {
                        let args = [];
                        this.trackSpy.args.forEach(call => {
                            let message = call[0].baseData.message||"";
                            // Ignore the internal SendBrowserInfoOnUserInit message (Only occurs when running tests in a browser)
                            if (message.indexOf("AI (Internal): 72 ") == -1) {
                                args.push(call[0]);
                            }
                        });

                        let type = "Fetch";
                        if (this.isFetchPolyfill) {
                            type = "Ajax";
                            Assert.ok(true, "Using fetch polyfill");
                        }

                        Assert.equal(3, args.length, "track is called 3 times");
                        let baseData = args[0].baseData;
                        Assert.equal(type, baseData.type, "request is " + type + " type");
                        Assert.equal('value', baseData.properties.requestHeaders['header'], "fetch request's user defined request header is stored");
                        Assert.ok(baseData.properties.responseHeaders, "fetch request's reponse header is stored");

                        baseData = args[1].baseData;
                        Assert.equal(3, Object.keys(baseData.properties.requestHeaders).length, "two request headers set up when there's no user defined request header");
                        Assert.ok(baseData.properties.requestHeaders[RequestHeaders.requestIdHeader], "Request-Id header");
                        Assert.ok(baseData.properties.requestHeaders[RequestHeaders.requestContextHeader], "Request-Context header");
                        Assert.ok(baseData.properties.requestHeaders[RequestHeaders.traceParentHeader], "traceparent");
                        const id: string = baseData.id;
                        const regex = id.match(/\|.{32}\..{16}\./g);
                        Assert.ok(id.length > 0);
                        Assert.equal(1, regex.length)
                        Assert.equal(id, regex[0]);
                    })
            });
        } else {
            this.testCase({
                name: "DependenciesPlugin: No crash when fetch not supported",
                test: () => {
                    Assert.ok(true, "fetch monitoring is correctly not instrumented")
                }
            });
        }
    }

    public addPropertiesPluginTests(snippetName: string, snippetCreator: (config:any) => Snippet): void {
        this.testCaseAsync({
            name: 'Custom Tags: allowed to send custom properties via addTelemetryInitializer',
            stepDelay: 100,
            steps: [
                () => {
                    let theSnippet = this._initializeSnippet(snippetCreator(getSnippetConfig(this.sessionPrefix)));
                    theSnippet.addTelemetryInitializer((item: ITelemetryItem) => {
                        item.tags[this.tagKeys.cloudName] = "my.custom.cloud.name";
                    });
                    theSnippet.trackEvent({ name: "Custom event via addTelemetryInitializer" });
                }
            ]
            .concat(this.asserts(1, false, false))
            .concat(PollingAssert.createPollingAssert(() => {
                const payloadStr: string[] = this.getPayloadMessages(this.successSpy);
                if (payloadStr.length) {
                    const payload = JSON.parse(payloadStr[0]);
                        Assert.equal(1, payloadStr.length, 'Only 1 track item is sent - ' + payload.name);
                        Assert.ok(payload);

                    if (payload && payload.tags) {
                        const tagResult: string = payload.tags && payload.tags[this.tagKeys.cloudName];
                        const tagExpect: string = 'my.custom.cloud.name';
                        Assert.equal(tagResult, tagExpect, 'telemetryinitializer tag override successful');
                        return true;
                    }
                    return false;
                }
            }, 'Set custom tags') as any)
        });

        this.testCaseAsync({
            name: 'Custom Tags: allowed to send custom properties via addTelemetryInitializer & shimmed addTelemetryInitializer',
            stepDelay: 100,
            steps: [
                () => {
                    let theSnippet = this._initializeSnippet(snippetCreator(getSnippetConfig(this.sessionPrefix)));
                    theSnippet.addTelemetryInitializer((item: ITelemetryItem) => {
                        item.tags.push({[this.tagKeys.cloudName]: "my.shim.cloud.name"});
                    });
                    theSnippet.trackEvent({ name: "Custom event" });
                }
            ]
            .concat(this.asserts(1))
            .concat(PollingAssert.createPollingAssert(() => {
                const payloadStr: string[] = this.getPayloadMessages(this.successSpy);
                if (payloadStr.length > 0) {
                    Assert.equal(1, payloadStr.length, 'Only 1 track item is sent');
                    const payload = JSON.parse(payloadStr[0]);
                    Assert.ok(payload);

                    if (payload && payload.tags) {
                        const tagResult: string = payload.tags && payload.tags[this.tagKeys.cloudName];
                        const tagExpect: string = 'my.shim.cloud.name';
                        Assert.equal(tagResult, tagExpect, 'telemetryinitializer tag override successful');
                        return true;
                    }
                    return false;
                }
            }, 'Set custom tags') as any)
        });

        this.testCaseAsync({
            name: 'Custom Tags: allowed to send custom properties via shimmed addTelemetryInitializer',
            stepDelay: 100,
            steps: [
                () => {
                    let theSnippet = this._initializeSnippet(snippetCreator(getSnippetConfig(this.sessionPrefix)));
                    theSnippet.addTelemetryInitializer((item: ITelemetryItem) => {
                        item.tags[this.tagKeys.cloudName] = "my.custom.cloud.name";
                        item.tags[this.tagKeys.locationCity] = "my.custom.location.city";
                        item.tags.push({[this.tagKeys.locationCountry]: "my.custom.location.country"});
                        item.tags.push({[this.tagKeys.operationId]: "my.custom.operation.id"});
                    });
                    theSnippet.trackEvent({ name: "Custom event via shimmed addTelemetryInitializer" });
                }
            ]
            .concat(this.asserts(1))
            .concat(PollingAssert.createPollingAssert(() => {
                const payloadStr: string[] = this.getPayloadMessages(this.successSpy);
                if (payloadStr.length > 0) {
                    const payload = JSON.parse(payloadStr[0]);
                    Assert.equal(1, payloadStr.length, 'Only 1 track item is sent - ' + payload.name);
                    if (payloadStr.length > 1) {
                        this.dumpPayloadMessages(this.successSpy);
                    }
                    Assert.ok(payload);

                    if (payload && payload.tags) {
                        const tagResult1: string = payload.tags && payload.tags[this.tagKeys.cloudName];
                        const tagExpect1: string = 'my.custom.cloud.name';
                        Assert.equal(tagResult1, tagExpect1, 'telemetryinitializer tag override successful');
                        const tagResult2: string = payload.tags && payload.tags[this.tagKeys.locationCity];
                        const tagExpect2: string = 'my.custom.location.city';
                        Assert.equal(tagResult2, tagExpect2, 'telemetryinitializer tag override successful');
                        const tagResult3: string = payload.tags && payload.tags[this.tagKeys.locationCountry];
                        const tagExpect3: string = 'my.custom.location.country';
                        Assert.equal(tagResult3, tagExpect3, 'telemetryinitializer tag override successful');
                        const tagResult4: string = payload.tags && payload.tags[this.tagKeys.operationId];
                        const tagExpect4: string = 'my.custom.operation.id';
                        Assert.equal(tagResult4, tagExpect4, 'telemetryinitializer tag override successful');
                        return true;
                    }
                    return false;
                }
            }, 'Set custom tags') as any)
        });

        this.testCaseAsync({
            name: 'AuthenticatedUserContext: setAuthenticatedUserContext authId',
            stepDelay: 100,
            steps: [
                () => {
                    let theSnippet = this._initializeSnippet(snippetCreator(getSnippetConfig(this.sessionPrefix)));
                    const context = (theSnippet.context) as TelemetryContext;
                    context.user.setAuthenticatedUserContext('10001');
                    theSnippet.trackTrace({ message: 'authUserContext test' });
                }
            ]
                .concat(this.asserts(1))
                .concat(PollingAssert.createPollingAssert(() => {
                    let payloadStr = this.getPayloadMessages(this.successSpy);
                    if (payloadStr.length > 0) {
                        let payloadEvents = payloadStr.length;
                        let thePayload:string = payloadStr[0];

                        if (payloadEvents !== 1) {
                            // Only 1 track should be sent
                            return false;
                        }
                        const payload = JSON.parse(thePayload);
                        if (payload && payload.tags) {
                            const tagName: string = this.tagKeys.userAuthUserId;
                            return '10001' === payload.tags[tagName];
                        }
                    }
                    return false;
                }, 'user.authenticatedId') as any)
        });

        this.testCaseAsync({
            name: 'AuthenticatedUserContext: setAuthenticatedUserContext authId and accountId',
            stepDelay: 100,
            steps: [
                () => {
                    let theSnippet = this._initializeSnippet(snippetCreator(getSnippetConfig(this.sessionPrefix)));
                    const context = (theSnippet.context) as TelemetryContext;
                    context.user.setAuthenticatedUserContext('10001', 'account123');
                    theSnippet.trackTrace({ message: 'authUserContext test' });
                }
            ]
                .concat(this.asserts(1))
                .concat(PollingAssert.createPollingAssert(() => {
                    const payloadStr: string[] = this.getPayloadMessages(this.successSpy);
                    if (payloadStr.length > 0) {
                        if (payloadStr.length !== 1) {
                            // Only 1 track should be sent
                            return false;
                        }
                        const payload = JSON.parse(payloadStr[0]);
                        if (payload && payload.tags) {
                            const authTag: string = this.tagKeys.userAuthUserId;
                            const accountTag: string = this.tagKeys.userAccountId;
                            return '10001' === payload.tags[authTag] /*&&
                            'account123' === payload.tags[accountTag] */; // bug https://msazure.visualstudio.com/One/_workitems/edit/3508825
                        }
                    }
                    return false;
                }, 'user.authenticatedId') as any)
        });

        this.testCaseAsync({
            name: 'AuthenticatedUserContext: setAuthenticatedUserContext non-ascii authId and accountId',
            stepDelay: 100,
            steps: [
                () => {
                    let theSnippet = this._initializeSnippet(snippetCreator(getSnippetConfig(this.sessionPrefix)));
                    const context = (theSnippet.context) as TelemetryContext;
                    context.user.setAuthenticatedUserContext("\u0428", "\u0429");
                    theSnippet.trackTrace({ message: 'authUserContext test' });
                }
            ]
                .concat(this.asserts(1))
                .concat(PollingAssert.createPollingAssert(() => {
                    const payloadStr: string[] = this.getPayloadMessages(this.successSpy);
                    if (payloadStr.length > 0) {
                        if (payloadStr.length !== 1) {
                            // Only 1 track should be sent
                            return false;
                        }
                        const payload = JSON.parse(payloadStr[0]);
                        if (payload && payload.tags) {
                            const authTag: string = this.tagKeys.userAuthUserId;
                            const accountTag: string = this.tagKeys.userAccountId;
                            return '\u0428' === payload.tags[authTag] /* &&
                            '\u0429' === payload.tags[accountTag] */; // bug https://msazure.visualstudio.com/One/_workitems/edit/3508825
                        }
                    }
                    return false;
                }, 'user.authenticatedId') as any)
        });

        this.testCaseAsync({
            name: 'AuthenticatedUserContext: clearAuthenticatedUserContext',
            stepDelay: 100,
            steps: [
                () => {
                    let theSnippet = this._initializeSnippet(snippetCreator(getSnippetConfig(this.sessionPrefix)));
                    const context = (theSnippet.context) as TelemetryContext;
                    context.user.setAuthenticatedUserContext('10002', 'account567');
                    context.user.clearAuthenticatedUserContext();
                    theSnippet.trackTrace({ message: 'authUserContext test' });
                }
            ]
                .concat(this.asserts(1))
                .concat(PollingAssert.createPollingAssert(() => {
                    const payloadStr: string[] = this.getPayloadMessages(this.successSpy);
                    if (payloadStr.length > 0) {
                        if (payloadStr.length !== 1) {
                            // Only 1 track should be sent
                            return false;
                        }
                        const payload = JSON.parse(payloadStr[0]);
                        if (payload && payload.tags) {
                            const authTag: string = this.tagKeys.userAuthUserId;
                            const accountTag: string = this.tagKeys.userAccountId;
                            return undefined === payload.tags[authTag] &&
                                undefined === payload.tags[accountTag];
                        }
                    }
                    return false;
                }, 'user.authenticatedId') as any)
        });

        // This doesn't need to be e2e
        this.testCase({
            name: 'AuthenticatedUserContext: setAuthenticatedUserContext does not set the cookie by default',
            test: () => {
                // Setup
                let theSnippet = this._initializeSnippet(snippetCreator(getSnippetConfig(this.sessionPrefix)));
                const context = (theSnippet.context) as TelemetryContext;
                const authSpy: SinonSpy = this.sandbox.spy(context.user, 'setAuthenticatedUserContext');
                const cookieSpy: SinonSpy = this.sandbox.spy(Util, 'setCookie');

                // Act
                context.user.setAuthenticatedUserContext('10002', 'account567');

                // Test
                Assert.ok(authSpy.calledOnce, 'setAuthenticatedUserContext called');
                Assert.equal(false, authSpy.calledWithExactly('10001', 'account567', false), 'Correct default args to setAuthenticatedUserContext');
                Assert.ok(cookieSpy.notCalled, 'cookie never set');
            }
        });

        this.testCase({
            name: 'Sampling: sampleRate is generated as a field in the envelope when it is less than 100',
            test:() => {
                let theSnippet = this._initializeSnippet(snippetCreator(getSnippetConfig(this.sessionPrefix, true)));
                theSnippet.trackEvent({ name: 'event' });
                Assert.ok(this.envelopeConstructorSpy.called);
                const envelope = this.envelopeConstructorSpy.returnValues[0];
                Assert.equal(envelope.sampleRate, 50, "sampleRate is generated");
            }
        })
    }

    private _initializeSnippet(snippet: Snippet): IApplicationInsights {
        try {
            //this.useFakeServer = false;

            // Call the initialization
            ((ApplicationInsightsContainer.getAppInsights(snippet, snippet.version)) as IApplicationInsights);

            // Setup Sinon stuff
            const appInsights = (snippet as any).appInsights;
            this.onDone(() => {
                if (snippet) {
                    if (snippet["unload"]) {
                        snippet["unload"](false);
                    } else if (snippet["appInsightsNew"]) {
                        snippet["appInsightsNew"].unload(false);
                    }
                }
            });

            Assert.ok(appInsights, "The App insights instance should be populated");
            Assert.ok(appInsights.core, "The Core exists");
            Assert.equal(appInsights.core, (snippet as any).core, "The core instances should match");

            Assert.equal(true, appInsights.isInitialized(), 'App Analytics is initialized');
            Assert.equal(true, appInsights.core.isInitialized(), 'Core is initialized');

            const sender: Sender = appInsights.core.getTransmissionControls()[0][0] as Sender;
            this.errorSpy = this.sandbox.spy(sender, '_onError');
            this.successSpy = this.sandbox.spy(sender, '_onSuccess');
            this.loggingSpy = this.sandbox.stub(appInsights.core.logger, 'throwInternal');
            this.trackSpy = this.sandbox.spy(appInsights.core, 'track')
            this.sandbox.stub((sender as any)._sample, 'isSampledIn').returns(true);
            this.envelopeConstructorSpy = this.sandbox.spy(Sender, 'constructEnvelope');

        } catch (e) {
            console.error('Failed to initialize');
            Assert.ok(false, e);
        }

        // Note: Explicitly returning the original snippet as this should have been updated!
        return snippet as any;
    }

    private boilerPlateAsserts = () => {
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
                call[0].forEach(message => {
                    // Ignore the internal SendBrowserInfoOnUserInit message (Only occurs when running tests in a browser)
                    if (!message || message.indexOf("AI (Internal): 72 ") == -1) {
                        currentCount ++;
                        //console.log(" - " + JSON.stringify(call));
                    }
                });
            });
            console.log('curr: ' + currentCount + ' exp: ' + expectedCount);
            return currentCount === expectedCount;
        } else {
            return false;
        }
    }, "sender succeeded", 30, 500))];
}