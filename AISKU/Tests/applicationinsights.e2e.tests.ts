/// <reference path='./TestFramework/Common.ts' />
import { ApplicationInsights, IApplicationInsights } from '../src/applicationinsights-web'
import { Sender } from '@microsoft/applicationinsights-channel-js';
import { IDependencyTelemetry, ContextTagKeys, Util, Event, Trace, Exception, Metric, PageView, PageViewPerformance, RemoteDependencyData, DistributedTracingModes, RequestHeaders } from '@microsoft/applicationinsights-common';
import { AppInsightsCore, ITelemetryItem } from "@microsoft/applicationinsights-core-js";
import { TelemetryContext } from '@microsoft/applicationinsights-properties-js';
import { AjaxPlugin } from '@microsoft/applicationinsights-dependencies-js';
import { EventValidator } from './TelemetryValidation/EventValidator';
import { TraceValidator } from './TelemetryValidation/TraceValidator';
import { ExceptionValidator } from './TelemetryValidation/ExceptionValidator';
import { MetricValidator } from './TelemetryValidation/MetricValidator';
import { PageViewPerformanceValidator } from './TelemetryValidation/PageViewPerformanceValidator';
import { PageViewValidator } from './TelemetryValidation/PageViewValidator';
import { RemoteDepdencyValidator } from './TelemetryValidation/RemoteDepdencyValidator';

export class ApplicationInsightsTests extends TestClass {
    private static readonly _instrumentationKey = 'b7170927-2d1c-44f1-acec-59f4e1751c11';
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

    // Sinon
    private errorSpy: SinonSpy;
    private successSpy: SinonSpy;
    private loggingSpy: SinonSpy;
    private userSpy: SinonSpy;
    private sessionPrefix: string = Util.newId();
    private trackSpy: SinonSpy;

    // Context
    private tagKeys = new ContextTagKeys();
    private _config;
    private _appId: string;

    public testInitialize() {
        try {
            this.useFakeServer = false;
            (sinon.fakeServer as any).restore();
            this.useFakeTimers = false;
            this.clock.restore();
            this._config = {
                instrumentationKey: ApplicationInsightsTests._instrumentationKey,
                disableAjaxTracking: false,
                disableFetchTracking: false,
                enableRequestHeaderTracking: true,
                enableResponseHeaderTracking: true,
                maxBatchInterval: 2500,
                disableExceptionTracking: false,
                namePrefix: this.sessionPrefix,
                enableCorsCorrelation: true,
                distributedTracingMode: DistributedTracingModes.AI_AND_W3C
            };

            const init = new ApplicationInsights({
                config: this._config
            });
            init.loadAppInsights();
            this._ai = init;
            this._ai.addTelemetryInitializer((item: ITelemetryItem) => {
                Assert.equal("4.0", item.ver, "Telemetry items inside telemetry initializers should be in CS4.0 format");
            });


            // Setup Sinon stuff
            const sender: Sender = this._ai.appInsights.core['_channelController'].channelQueue[0][0];
            this.errorSpy = this.sandbox.spy(sender, '_onError');
            this.successSpy = this.sandbox.spy(sender, '_onSuccess');
            this.loggingSpy = this.sandbox.stub(this._ai['core'].logger, 'throwInternal');
            this.trackSpy = this.sandbox.spy(this._ai['dependencies'], 'trackDependencyDataInternal')
        } catch (e) {
            console.error('Failed to initialize');
        }
    }

    public testCleanup() {
        this.useFakeServer = true;
        this.useFakeTimers = true;
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
                Assert.equal(true, this._ai.appInsights['_isInitialized'], 'App Analytics is initialized');


                Assert.ok(this._ai.appInsights.core, 'Core exists');
                Assert.equal(true, this._ai.appInsights.core['_isInitialized'],
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

                if (this.successSpy.called) {
                    const payloadStr: string[] = this.successSpy.args[0][0];
                    const payload = JSON.parse(payloadStr[0]);
                    const data = payload.data;
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
                const payloadStr: string[] = this.successSpy.args[0][0];
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
            stepDelay: 1,
            steps: [() => {
                let exception: Error = null;
                try {
                    window['a']['b']();
                    Assert.ok(false, 'trackException test not run');
                } catch (e) {
                    exception = e;
                    this._ai.trackException({ exception });
                }
                Assert.ok(exception);
            }].concat(this.asserts(1))
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
            name: "TelemetryContext: track metric",
            stepDelay: 1,
            steps: [
                () => {
                    console.log("* calling trackMetric " + new Date().toISOString());
                    for (let i = 0; i < 100; i++) {
                        this._ai.trackMetric({ name: "test" + i, average: Math.round(100 * Math.random()) });
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
                    this._ai.trackPageView(); // sends 2
                }
            ].concat(this.asserts(2)).concat(() => {

                if (this.successSpy.called) {
                    const payloadStr: string[] = this.successSpy.args[0][0];
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
            ].concat(this.asserts(401))
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
                    if (this.successSpy.called) {
                        const payloadStr: string[] = this.successSpy.args[0][0];
                        Assert.equal(1, payloadStr.length, 'Only 1 track item is sent');
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

    public addDependencyPluginTests(): void {

        this.testCase({
            name: "DependenciesPlugin: initialization yields a defined _context value",
            test: () => {
                const extensions = (this._ai.core as AppInsightsCore)._extensions;
                let ajax: AjaxPlugin, extIx=0;
                while (!ajax && extIx < extensions.length) {
                    if (extensions[extIx].identifier === AjaxPlugin.identifier) {
                        ajax = extensions[extIx] as AjaxPlugin;
                    }
                    extIx++;
                }

                Assert.ok(ajax);
                Assert.equal(AjaxPlugin.identifier, ajax.identifier);
                Assert.ok(ajax["_context"]);
            }
        })

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
            steps: [
                () => {
                    const xhr = new XMLHttpRequest();
                    xhr.open('GET', 'https://httpbin.org/status/200');
                    xhr.send();
                    Assert.ok(true);
                }
            ].concat(this.asserts(1))
        });
        if (window && window.fetch) {
            this.testCaseAsync({
                name: "DependenciesPlugin: auto collection of outgoing fetch requests",
                stepDelay: 5000,
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
                ]
                    .concat(this.asserts(3))
                    .concat(() => {
                        Assert.ok(this.trackSpy.calledThrice, "trackDependencyDataInternal is called");
                        Assert.equal("Fetch", this.trackSpy.args[0][0].type, "request is Fetch type");
                        Assert.equal('value', this.trackSpy.args[0][0].properties.requestHeaders['header'], "fetch request's user defined request header is stored");
                        Assert.ok(this.trackSpy.args[0][0].properties.responseHeaders, "fetch request's reponse header is stored");
                        Assert.equal(3, Object.keys(this.trackSpy.args[1][0].properties.requestHeaders).length, "two request headers set up when there's no user defined request header");
                        Assert.ok(this.trackSpy.args[1][0].properties.requestHeaders[RequestHeaders.requestIdHeader], "Request-Id header");
                        Assert.ok(this.trackSpy.args[1][0].properties.requestHeaders[RequestHeaders.requestContextHeader], "Request-Context header");
                        Assert.ok(this.trackSpy.args[1][0].properties.requestHeaders[RequestHeaders.traceParentHeader], "traceparent");
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
                    this._ai.trackEvent({ name: "Custom event" });
                }
            ]
            .concat(this.asserts(1))
            .concat(PollingAssert.createPollingAssert(() => {
                if (this.successSpy.called) {
                    const payloadStr: string[] = this.successSpy.args[0][0];
                    Assert.equal(1, payloadStr.length, 'Only 1 track item is sent');
                    const payload = JSON.parse(payloadStr[0]);
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
                if (this.successSpy.called) {
                    const payloadStr: string[] = this.successSpy.args[0][0];
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
                    this._ai.trackEvent({ name: "Custom event" });
                }
            ]
            .concat(this.asserts(1))
            .concat(PollingAssert.createPollingAssert(() => {
                if (this.successSpy.called) {
                    const payloadStr: string[] = this.successSpy.args[0][0];
                    Assert.equal(1, payloadStr.length, 'Only 1 track item is sent');
                    const payload = JSON.parse(payloadStr[0]);
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
                    if (this.successSpy.called) {
                        const payloadStr: string[] = this.successSpy.args[0][0];
                        if (payloadStr.length !== 1) {
                            // Only 1 track should be sent
                            return false;
                        }
                        const payload = JSON.parse(payloadStr[0]);
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
                    if (this.successSpy.called) {
                        const payloadStr: string[] = this.successSpy.args[0][0];
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
                    if (this.successSpy.called) {
                        const payloadStr: string[] = this.successSpy.args[0][0];
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
                    if (this.successSpy.called) {
                        const payloadStr: string[] = this.successSpy.args[0][0];
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

        if (this.successSpy.called) {
            let currentCount: number = 0;
            this.successSpy.args.forEach(call => {
                currentCount += call[1];
            });
            console.log('curr: ' + currentCount + ' exp: ' + expectedCount, ' appId: ' + this._ai.context.appId());
            if (currentCount === expectedCount && !!this._ai.context.appId()) {
                const payloadStr: string[] = this.successSpy.args[0][0];
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
            return false;
        } else {
            return false;
        }
    }, "sender succeeded", 60, 1000))];
}
