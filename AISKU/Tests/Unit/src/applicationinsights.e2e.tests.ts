import { AITestClass, Assert, PollingAssert, EventValidator, TraceValidator, ExceptionValidator, MetricValidator, PageViewValidator, PageViewPerformanceValidator, RemoteDepdencyValidator } from '@microsoft/ai-test-framework';
import { SinonSpy } from 'sinon';
import { ApplicationInsights, IApplicationInsights } from '../../../src/applicationinsights-web'
import { Sender } from '@microsoft/applicationinsights-channel-js';
import { IDependencyTelemetry, ContextTagKeys, Util, Event, Trace, Exception, Metric, PageView, PageViewPerformance, RemoteDependencyData, DistributedTracingModes, RequestHeaders, IAutoExceptionTelemetry } from '@microsoft/applicationinsights-common';
import { AppInsightsCore, ITelemetryItem, getGlobal, dumpObj } from "@microsoft/applicationinsights-core-js";
import { TelemetryContext } from '@microsoft/applicationinsights-properties-js';


export class ApplicationInsightsTests extends AITestClass {
    private static readonly _instrumentationKey = 'b7170927-2d1c-44f1-acec-59f4e1751c11';
    private static readonly _connectionString = `InstrumentationKey=${ApplicationInsightsTests._instrumentationKey}`;
    private static readonly _expectedTrackMethods = [
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

    private _ai: ApplicationInsights;
    private _aiName: string = 'AppInsightsSDK';
    private isFetchPolyfill:boolean = false;

    // Sinon
    private errorSpy: SinonSpy;
    private successSpy: SinonSpy;
    private loggingSpy: SinonSpy;
    private userSpy: SinonSpy;
    private _sessionPrefix: string = Util.newId();
    private trackSpy: SinonSpy;
    private envelopeConstructorSpy: SinonSpy;

    // Context
    private tagKeys = new ContextTagKeys();
    private _config;
    private _appId: string;

    constructor(testName?: string) {
        super(testName || "ApplicationInsightsTests");
    }
    
    protected _getTestConfig(sessionPrefix: string) {
        return {
            connectionString: ApplicationInsightsTests._connectionString,
            disableAjaxTracking: false,
            disableFetchTracking: false,
            enableRequestHeaderTracking: true,
            enableResponseHeaderTracking: true,
            maxBatchInterval: 2500,
            disableExceptionTracking: false,
            namePrefix: sessionPrefix,
            enableCorsCorrelation: true,
            distributedTracingMode: DistributedTracingModes.AI_AND_W3C,
            samplingPercentage: 50,
            convertUndefined: "test-value"
        };
    }

    public testInitialize() {
        try {
            this.isFetchPolyfill = fetch["polyfill"];
            this.useFakeServer = false;
            this._config = this._getTestConfig(this._sessionPrefix);

            const init = new ApplicationInsights({
                config: this._config
            });
            init.loadAppInsights();
            this._ai = init;
            this._ai.addTelemetryInitializer((item: ITelemetryItem) => {
                Assert.equal("4.0", item.ver, "Telemetry items inside telemetry initializers should be in CS4.0 format");
            });

            // Setup Sinon stuff
            const sender: Sender = this._ai.appInsights.core.getTransmissionControls()[0][0] as Sender;
            this.errorSpy = this.sandbox.spy(sender, '_onError');
            this.successSpy = this.sandbox.spy(sender, '_onSuccess');
            this.loggingSpy = this.sandbox.stub(this._ai['core'].logger, 'throwInternal');
            this.trackSpy = this.sandbox.spy(this._ai.appInsights.core, 'track')
            this.sandbox.stub((sender as any)._sample, 'isSampledIn').returns(true);
            this.envelopeConstructorSpy = this.sandbox.spy(Sender, 'constructEnvelope');
            console.log("* testInitialize()");
        } catch (e) {
            console.error('Failed to initialize', e);
        }
    }

    public testFinishedCleanup(): void {
        if (this._ai && this._ai.unload) {
            // force unload
            this._ai.unload(false);
        }

        if (this._ai && this._ai["dependencies"]) {
            this._ai["dependencies"].teardown();
        }

        console.log("* testCleanup(" + (AITestClass.currentTestInfo ? AITestClass.currentTestInfo.name : "<null>") + ")");
    }

    public registerTests() {
        this.addGenericE2ETests();
        this.addAnalyticsApiTests();
        this.addAsyncTests();
        this.addDependencyPluginTests();
        this.addPropertiesPluginTests();
    }

    public addGenericE2ETests(): void {
        this.testCase({
            name: 'E2E.GenericTests: ApplicationInsightsAnalytics is loaded correctly',
            test: () => {
                Assert.ok(this._ai, 'ApplicationInsights SDK exists');
                // TODO: reenable this test when module is available from window w/o snippet
                // Assert.deepEqual(this._ai, window[this._aiName], `AI is available from window.${this._aiName}`);

                Assert.ok(this._ai.appInsights, 'App Analytics exists');
                Assert.equal(true, this._ai.appInsights.isInitialized(), 'App Analytics is initialized');


                Assert.ok(this._ai.appInsights.core, 'Core exists');
                Assert.equal(true, this._ai.appInsights.core.isInitialized(),
                    'Core is initialized');
            }
        });
    }

    public addAnalyticsApiTests(): void {
        this.testCase({
            name: 'E2E.AnalyticsApiTests: Public Members exist',
            test: () => {
                ApplicationInsightsTests._expectedTrackMethods.forEach(method => {
                    Assert.ok(this._ai[method], `${method} exists`);
                    Assert.equal('function', typeof this._ai[method], `${method} is a function`);
                });
            }
        });
    }

    public addAsyncTests(): void {
        this.testCaseAsync({
            name: 'E2E.GenericTests: trackEvent sends to backend',
            stepDelay: 1,
            steps: [() => {
                this._ai.trackEvent({ name: 'event', properties: { "prop1": "value1" }, measurements: { "measurement1": 200 } });
            }].concat(this.asserts(1)).concat(() => {
                const payloadStr: string[] = this.getPayloadMessages(this.successSpy);
                if (payloadStr.length > 0) {
                    const payload = JSON.parse(payloadStr[0]);
                    const data = payload.data;
                    Assert.ok( payload && payload.iKey);
                    Assert.equal( ApplicationInsightsTests._instrumentationKey,payload.iKey,"payload ikey is not set correctly" );
                    Assert.ok(data && data.baseData && data.baseData.properties["prop1"]);
                    Assert.ok(data && data.baseData && data.baseData.measurements["measurement1"]);
                }
            })
        });

        this.testCaseAsync({
            name: 'E2E.GenericTests: trackTrace sends to backend',
            stepDelay: 1,
            steps: [() => {
                this._ai.trackTrace({ message: 'trace', properties: { "foo": "bar", "prop2": "value2" } });
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
            name: 'E2E.GenericTests: legacy trackException sends to backend',
            stepDelay: 1,
            steps: [() => {
                let exception: Error = null;
                try {
                    window['a']['b']();
                    Assert.ok(false, 'trackException test not run');
                } catch (e) {
                    exception = e;
                    this._ai.trackException({ error: exception } as any);
                }
                Assert.ok(exception);
            }].concat(this.asserts(1))
        });

        this.testCaseAsync({
            name: 'E2E.GenericTests: trackException with auto telemetry sends to backend',
            stepDelay: 1,
            steps: [() => {
                let exception: Error = null;
                try {
                    window['a']['b']();
                    Assert.ok(false, 'trackException test not run');
                } catch (e) {
                    // Simulating window.onerror option
                    let autoTelemetry = {
                        message: e.message,
                        url: "https://dummy.auto.example.com",
                        lineNumber: 42,
                        columnNumber: 53,
                        error: e,
                        evt: null
                    } as IAutoExceptionTelemetry;
    
                    exception = e;
                    this._ai.trackException({ exception: autoTelemetry });
                }
                Assert.ok(exception);
            }].concat(this.asserts(1))
        });

        this.testCaseAsync({
            name: 'E2E.GenericTests: trackException with auto telemetry sends to backend with custom properties',
            stepDelay: 1,
            steps: [() => {
                let exception: Error = null;
                try {
                    window['a']['b']();
                    Assert.ok(false, 'trackException test not run');
                } catch (e) {
                    // Simulating window.onerror option
                    let autoTelemetry = {
                        message: e.message,
                        url: "https://dummy.auto.example.com",
                        lineNumber: 42,
                        columnNumber: 53,
                        error: e,
                        evt: null
                    } as IAutoExceptionTelemetry;
    
                    exception = e;
                    this._ai.trackException({ exception: autoTelemetry }, { custom: "custom value" });
                }
                Assert.ok(exception);
            }].concat(this.asserts(1))
        });

        this.testCaseAsync({
            name: 'E2E.GenericTests: trackException with message only sends to backend',
            stepDelay: 1,
            steps: [() => {
                let exception: Error = null;
                try {
                    window['a']['b']();
                    Assert.ok(false, 'trackException test not run');
                } catch (e) {
                    // Simulating window.onerror option
                    let autoTelemetry = {
                        message: e.toString(),
                        url: "https://dummy.message.example.com",
                        lineNumber: 42,
                        columnNumber: 53,
                        error: e.toString(),
                        evt: null
                    } as IAutoExceptionTelemetry;
    
                    exception = e;
                    this._ai.trackException({ exception: autoTelemetry });
                }
                Assert.ok(exception);
            }].concat(this.asserts(1))
        });

        this.testCaseAsync({
            name: 'E2E.GenericTests: trackException with message holding error sends to backend',
            stepDelay: 1,
            steps: [() => {
                let exception: Error = null;
                try {
                    window['a']['b']();
                    Assert.ok(false, 'trackException test not run');
                } catch (e) {
                    // Simulating window.onerror option
                    let autoTelemetry = {
                        message: e,
                        url: "https://dummy.error.example.com",
                        lineNumber: 42,
                        columnNumber: 53,
                        error: undefined,
                        evt: null
                    } as IAutoExceptionTelemetry;
    
                    try {
                        exception = e;
                        this._ai.trackException({ exception: autoTelemetry });
                    } catch (e) {
                        console.log(e);
                        console.log(e.stack);
                        Assert.ok(false, e.stack);
                    }
                }
                Assert.ok(exception);
            }].concat(this.asserts(1))
        });

        this.testCaseAsync({
            name: 'E2E.GenericTests: trackException with message holding error sends to backend with custom properties',
            stepDelay: 1,
            steps: [() => {
                let exception: Error = null;
                try {
                    window['a']['b']();
                    Assert.ok(false, 'trackException test not run');
                } catch (e) {
                    // Simulating window.onerror option
                    let autoTelemetry = {
                        message: e,
                        url: "https://dummy.error.example.com",
                        lineNumber: 42,
                        columnNumber: 53,
                        error: undefined,
                        evt: null
                    } as IAutoExceptionTelemetry;
    
                    try {
                        exception = e;
                        this._ai.trackException({ exception: autoTelemetry }, { custom: "custom value" });
                    } catch (e) {
                        console.log(e);
                        console.log(e.stack);
                        Assert.ok(false, e.stack);
                    }
                }
                Assert.ok(exception);
            }].concat(this.asserts(1))
        });

        this.testCaseAsync({
            name: 'E2E.GenericTests: trackException with no Error sends to backend',
            stepDelay: 1,
            steps: [() => {
                let autoTelemetry = {
                    message: "Test Message",
                    url: "https://dummy.no.error.example.com",
                    lineNumber: 42,
                    columnNumber: 53,
                    error: this,
                    evt: null
                } as IAutoExceptionTelemetry;
                this._ai.trackException({ exception: autoTelemetry });
                Assert.ok(autoTelemetry);
            }].concat(this.asserts(1))
        });

        this.testCaseAsync({
            name: 'E2E.GenericTests: trackException with CustomError sends to backend',
            stepDelay: 1,
            steps: [() => {
                this._ai.trackException({ exception: new CustomTestError("Test Custom Error!") });
            }].concat(this.asserts(1)).concat(() => {
                const payloadStr: string[] = this.getPayloadMessages(this.successSpy);
                if (payloadStr.length > 0) {
                    const payload = JSON.parse(payloadStr[0]);
                    const data = payload.data;
                    Assert.ok(data, "Has Data");
                    if (data) {
                        Assert.ok(data.baseData, "Has BaseData");
                        let baseData = data.baseData;
                        if (baseData) {
                            const ex = baseData.exceptions[0];
                            Assert.ok(ex.message.indexOf("Test Custom Error!") !== -1, "Make sure the error message is present [" + ex.message + "]");
                            Assert.ok(ex.message.indexOf("CustomTestError") !== -1, "Make sure the error type is present [" + ex.message + "]");
                            Assert.equal("CustomTestError", ex.typeName, "Got the correct typename");
                            Assert.ok(ex.stack.length > 0, "Has stack");
                            Assert.ok(ex.parsedStack, "Stack was parsed");
                            Assert.ok(ex.hasFullStack, "Stack has been decoded");
                        }
                    }
                }
            })
        });

        this.testCaseAsync({
            name: 'E2E.GenericTests: trackException with CustomError sends to backend with custom properties',
            stepDelay: 1,
            steps: [() => {
                this._ai.trackException({ exception: new CustomTestError("Test Custom Error!") }, { custom: "custom value" });
            }].concat(this.asserts(1)).concat(() => {
                const payloadStr: string[] = this.getPayloadMessages(this.successSpy);
                if (payloadStr.length > 0) {
                    const payload = JSON.parse(payloadStr[0]);
                    const data = payload.data;
                    Assert.ok(data, "Has Data");
                    if (data) {
                        Assert.ok(data.baseData, "Has BaseData");
                        let baseData = data.baseData;
                        if (baseData) {
                            const ex = baseData.exceptions[0];
                            Assert.ok(ex.message.indexOf("Test Custom Error!") !== -1, "Make sure the error message is present [" + ex.message + "]");
                            Assert.ok(ex.message.indexOf("CustomTestError") !== -1, "Make sure the error type is present [" + ex.message + "]");
                            Assert.equal("CustomTestError", ex.typeName, "Got the correct typename");
                            Assert.ok(ex.stack.length > 0, "Has stack");
                            Assert.ok(ex.parsedStack, "Stack was parsed");
                            Assert.ok(ex.hasFullStack, "Stack has been decoded");

                            Assert.ok(baseData.properties, "Has BaseData properties");
                            Assert.equal(baseData.properties.custom, "custom value");
                        }
                    }
                }
            })
        });

        this.testCaseAsync({
            name: "TelemetryContext: track metric",
            stepDelay: 1,
            steps: [
                () => {
                    console.log("* calling trackMetric " + new Date().toISOString());
                    for (let i = 0; i < 100; i++) {
                        this._ai.trackMetric({ name: "test" + i, average: Math.round(100 * Math.random()), min: 1, max: i+1, stdDev: 10.0 * Math.random() });
                    }
                    console.log("* done calling trackMetric " + new Date().toISOString());
                }
            ].concat(this.asserts(100))
        });

        this.testCaseAsync({
            name: "TelemetryContext: track custom metric",
            stepDelay: 1,
            steps: [
                () => {
                    console.log("* calling trackMetric " + new Date().toISOString());
                    this._ai.trackMetric({ name: "my_custom_metric_0", average: 2 });
                    this._ai.trackMetric({ name: "my_custom_metric_1", average: 1.1, sampleCount: 1, min: 1, max: 1, stdDev: 1.12 });
                    this._ai.trackMetric({ name: "my_custom_metric_2", average: 1.2, sampleCount: 2, min: 1, max: 2, stdDev: 1.23 });
                    this._ai.trackMetric({ name: "my_custom_metric_3", average: 1.3, sampleCount: 3, min: 1, max: 2.5, stdDev: 1.35 });
                    console.log("* done calling trackMetric " + new Date().toISOString());
                }
            ].concat(this.asserts(4))
        });

        this.testCaseAsync({
            name: `TelemetryContext: track page view ${window.location.pathname}`,
            stepDelay: 500,
            steps: [
                () => {
                    this._ai.trackPageView(); // sends 2
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
            stepDelay: 1,
            steps: [
                () => {
                    this._ai.trackPageViewPerformance({ name: 'name', uri: 'url' });
                }
            ].concat(this.asserts(1))
        });

        this.testCaseAsync({
            name: "TelemetryContext: track all types in batch",
            stepDelay: 1,
            steps: [
                () => {
                    let exception = null;
                    try {
                        window["a"]["b"]();
                    } catch (e) {
                        exception = e;
                    }

                    Assert.ok(exception);

                    this._ai.trackException({ exception });
                    this._ai.trackMetric({ name: "test", average: Math.round(100 * Math.random()) });
                    this._ai.trackTrace({ message: "test" });
                    this._ai.trackPageView({}); // sends 2
                    this._ai.trackPageViewPerformance({ name: 'name', uri: 'http://someurl' });
                    this._ai.flush();
                }
            ].concat(this.asserts(6))
        });

        this.testCaseAsync({
            name: "TelemetryContext: track all types in a large batch",
            stepDelay: 1,
            steps: [
                () => {
                    let exception = null;
                    try {
                        window["a"]["b"]();
                    } catch (e) {
                        exception = e;
                    }
                    Assert.ok(exception);

                    for (let i = 0; i < 100; i++) {
                        this._ai.trackException({ exception });
                        this._ai.trackMetric({ name: "test", average: Math.round(100 * Math.random()) });
                        this._ai.trackTrace({ message: "test" });
                        this._ai.trackPageView({ name: `${i}` }); // sends 2 1st time
                    }
                }
            ].concat(this.asserts(401, false))
        });

        this.testCaseAsync({
            name: "TelemetryInitializer: E2E override envelope data",
            stepDelay: 1,
            steps: [
                () => {
                    // Setup
                    const telemetryInitializer = {
                        init: (envelope) => {
                            envelope.baseData.name = 'other name'
                            return true;
                        }
                    }

                    // Act
                    this._ai.addTelemetryInitializer(telemetryInitializer.init);
                    this._ai.trackMetric({ name: "test", average: Math.round(100 * Math.random()) });
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

        this.testCaseAsync({
            name: 'E2E.GenericTests: undefined properties are replaced by customer defined value with config convertUndefined.',
            stepDelay: 1,
            steps: [() => {
                this._ai.trackPageView({ name: 'pageview', properties: { 'prop1': 'val1' }});
                this._ai.trackEvent({ name: 'event', properties: { 'prop2': undefined } });
            }].concat(this.asserts(3)).concat(() => {
                const payloadStr: string[] = this.getPayloadMessages(this.successSpy);
                for (let i = 0; i < payloadStr.length; i++) {
                    const payload = JSON.parse(payloadStr[i]);const baseType = payload.data.baseType;
                    // Make the appropriate assersion depending on the baseType
                    switch (baseType) {
                        case Event.dataType:
                            const eventData = payload.data;
                            Assert.ok(eventData && eventData.baseData && eventData.baseData.properties['prop2']);
                            Assert.equal(eventData.baseData.properties['prop2'], 'test-value');
                            break;
                        case PageView.dataType:
                            const pageViewData = payload.data;
                            Assert.ok(pageViewData && pageViewData.baseData && pageViewData.baseData.properties['prop1']);
                            Assert.equal(pageViewData.baseData.properties['prop1'], 'val1');
                            break;
                        default:
                            break;
                    }
                }
            })
        });
    }

    public addDependencyPluginTests(): void {

        this.testCaseAsync({
            name: "TelemetryContext: trackDependencyData",
            stepDelay: 1,
            steps: [
                () => {
                    const data: IDependencyTelemetry = {
                        target: 'http://abc',
                        responseCode: 200,
                        type: 'GET',
                        id: 'abc'
                    }
                    this._ai.trackDependencyData(data);
                }
            ].concat(this.asserts(1))
        });

        this.testCaseAsync({
            name: "TelemetryContext: auto collection of ajax requests",
            stepDelay: 1,
            useFakeServer: true,
            fakeServerAutoRespond: true,
            steps: [
                () => {
                    const xhr = new XMLHttpRequest();
                    xhr.open('GET', 'https://httpbin.org/status/200');
                    xhr.send();
                    Assert.ok(true);
                }
            ].concat(this.asserts(1))
        });
        let global = getGlobal();
        if (global && global.fetch) {
            this.testCaseAsync({
                name: "DependenciesPlugin: auto collection of outgoing fetch requests " + (this.isFetchPolyfill ? " using polyfill " : ""),
                stepDelay: 5000,
                useFakeFetch: true,
                fakeFetchAutoRespond: true,
                steps: [
                    () => {
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
                ].concat(this.asserts(3, false, false))
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

    public addPropertiesPluginTests(): void {
        this.testCaseAsync({
            name: 'Custom Tags: allowed to send custom properties via addTelemetryInitializer',
            stepDelay: 1,
            steps: [
                () => {
                    this._ai.addTelemetryInitializer((item: ITelemetryItem) => {
                        item.tags[this.tagKeys.cloudName] = "my.custom.cloud.name";
                    });
                    this._ai.trackEvent({ name: "Custom event via addTelemetryInitializer" });
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
            stepDelay: 1,
            steps: [
                () => {
                    this._ai.addTelemetryInitializer((item: ITelemetryItem) => {
                        item.tags.push({[this.tagKeys.cloudName]: "my.shim.cloud.name"});
                    });
                    this._ai.trackEvent({ name: "Custom event" });
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
            stepDelay: 1,
            steps: [
                () => {
                    this._ai.addTelemetryInitializer((item: ITelemetryItem) => {
                        item.tags[this.tagKeys.cloudName] = "my.custom.cloud.name";
                        item.tags[this.tagKeys.locationCity] = "my.custom.location.city";
                        item.tags.push({[this.tagKeys.locationCountry]: "my.custom.location.country"});
                        item.tags.push({[this.tagKeys.operationId]: "my.custom.operation.id"});
                    });
                    this._ai.trackEvent({ name: "Custom event via shimmed addTelemetryInitializer" });
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
            stepDelay: 1,
            steps: [
                () => {
                    const context = (this._ai.context) as TelemetryContext;
                    context.user.setAuthenticatedUserContext('10001');
                    this._ai.trackTrace({ message: 'authUserContext test' });
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
            stepDelay: 1,
            steps: [
                () => {
                    const context = (this._ai.context) as TelemetryContext;
                    context.user.setAuthenticatedUserContext('10001', 'account123');
                    this._ai.trackTrace({ message: 'authUserContext test' });
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
            stepDelay: 1,
            steps: [
                () => {
                    const context = (this._ai.context) as TelemetryContext;
                    context.user.setAuthenticatedUserContext("\u0428", "\u0429");
                    this._ai.trackTrace({ message: 'authUserContext test' });
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
            stepDelay: 1,
            steps: [
                () => {
                    const context = (this._ai.context) as TelemetryContext;
                    context.user.setAuthenticatedUserContext('10002', 'account567');
                    context.user.clearAuthenticatedUserContext();
                    this._ai.trackTrace({ message: 'authUserContext test' });
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
                const context = (this._ai.context) as TelemetryContext;
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
            test: () => {
                this._ai.trackEvent({ name: 'event' });
                Assert.ok(this.envelopeConstructorSpy.called);
                const envelope = this.envelopeConstructorSpy.returnValues[0];
                Assert.equal(envelope.sampleRate, 50, "sampleRate is generated");
                Assert.equal(envelope.iKey, ApplicationInsightsTests._instrumentationKey, "default config iKey is used");
            }
        });

        this.testCase({
            name: 'iKey replacement: envelope will use the non-empty iKey defined in track method',
            test: () => {
                this._ai.trackEvent({ name: 'event1', properties: { "prop1": "value1" }, measurements: { "measurement1": 200 }, iKey:"1a6933ad-aaaa-aaaa-aaaa-000000000000" });
                Assert.ok(this.envelopeConstructorSpy.called);
                const envelope = this.envelopeConstructorSpy.returnValues[0];
                Assert.equal(envelope.iKey, "1a6933ad-aaaa-aaaa-aaaa-000000000000", "trackEvent iKey is replaced");
            }
        });

        this.testCase({
            name: 'iKey replacement: envelope will use the config iKey if defined ikey in track method is empty',
            test: () => {
                this._ai.trackEvent({ name: 'event1', properties: { "prop1": "value1" }, measurements: { "measurement1": 200 }, iKey:"" });
                Assert.ok(this.envelopeConstructorSpy.called);
                const envelope = this.envelopeConstructorSpy.returnValues[0];
                Assert.equal(envelope.iKey, ApplicationInsightsTests._instrumentationKey, "trackEvent iKey should not be replaced");
            }
        });
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
    private asserts: any = (expectedCount: number, includeInit:boolean = false, doBoilerPlate:boolean = true) => [
        () => {
            const message = "polling: " + new Date().toISOString();
            Assert.ok(true, message);
            console.log(message);

            if (doBoilerPlate) {
                if (this.successSpy.called || this.errorSpy.called || this.loggingSpy.called) {
                    this.boilerPlateAsserts();
                }
            }
        },
        (PollingAssert.createPollingAssert(() => {
            let argCount = 0;
            if (this.successSpy.called && this.successSpy.args && this.successSpy.args.length > 0) {
                this.successSpy.args.forEach(call => {
                    argCount += call[0].length;
                });
            }

            Assert.ok(true, "* [" + argCount + " of " + expectedCount + "] checking success spy " + new Date().toISOString());

            if (argCount >= expectedCount) {
                let payloadStr = this.getPayloadMessages(this.successSpy, includeInit);
                if (payloadStr.length > 0) {
                    let currentCount: number = payloadStr.length;
                    console.log('curr: ' + currentCount + ' exp: ' + expectedCount, ' appId: ' + this._ai.context.appId());
                    if (currentCount === expectedCount && !!this._ai.context.appId()) {
                        const payload = JSON.parse(payloadStr[0]);
                        const baseType = payload.data.baseType;
                        // call the appropriate Validate depending on the baseType
                        switch (baseType) {
                            case Event.dataType:
                                return EventValidator.EventValidator.Validate(payload, baseType);
                            case Trace.dataType:
                                return TraceValidator.TraceValidator.Validate(payload, baseType);
                            case Exception.dataType:
                                return ExceptionValidator.ExceptionValidator.Validate(payload, baseType);
                            case Metric.dataType:
                                return MetricValidator.MetricValidator.Validate(payload, baseType);
                            case PageView.dataType:
                                return PageViewValidator.PageViewValidator.Validate(payload, baseType);
                            case PageViewPerformance.dataType:
                                return PageViewPerformanceValidator.PageViewPerformanceValidator.Validate(payload, baseType);
                            case RemoteDependencyData.dataType:
                                return RemoteDepdencyValidator.RemoteDepdencyValidator.Validate(payload, baseType);

                            default:
                                return EventValidator.EventValidator.Validate(payload, baseType);
                        }
                    }
                }
            }

            return false;
        }, "sender succeeded", 60, 1000))
    ];
}

class CustomTestError extends Error {
    constructor(message = "") {
      super(message);
      this.name = "CustomTestError";
      this.message = message + " -- test error.";
    }
}