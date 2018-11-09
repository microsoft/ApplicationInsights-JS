/// <reference path='./TestFramework/Common.ts' />
import { ApplicationInsights, IApplicationInsights } from '../src/applicationinsights-web'
import { Sender } from '@microsoft/applicationinsights-channel-js';
import { IDependencyTelemetry, ContextTagKeys, Util } from '@microsoft/applicationinsights-common';

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

    private _ai: IApplicationInsights;
    private _aiName: string = 'AppInsightsSDK';

    // Sinon
    private errorSpy: SinonSpy;
    private successSpy: SinonSpy;
    private loggingSpy: SinonSpy;
    private userSpy: SinonSpy;

    // Context
    private tagKeys = new ContextTagKeys();

    public testInitialize() {
        try {
            this.useFakeServer = false;
            (<any>sinon.fakeServer).restore();
            this.useFakeTimers = false;
            this.clock.restore();

            var init = new ApplicationInsights({
                config: {
                    instrumentationKey: ApplicationInsightsTests._instrumentationKey,
                    extensionConfig: {
                        AppInsightsChannelPlugin: {
                            maxBatchInterval: 5000
                        },
                        ApplicationInsightsAnalytics: {
                            disableExceptionTracking: false
                        },
                        AjaxDependencyPlugin: {
                            disableAjaxTracking: false,
                            disableFetchTracking: false
                        }
                    }
                },
                queue: []
            });
            this._ai = init.loadAppInsights();

            // Setup Sinon stuff
            const sender: Sender = this._ai.appInsights.core['_channelController'].channelQueue[0][0];
            this.errorSpy = this.sandbox.spy(sender, '_onError');
            this.successSpy = this.sandbox.spy(sender, '_onSuccess');
            this.loggingSpy = this.sandbox.stub(this._ai['core'].logger, 'throwInternal');
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
                this._ai.trackEvent({name: 'event'});
            }].concat(this.asserts(1))
        });
        
        this.testCaseAsync({
            name: 'E2E.GenericTests: trackTrace sends to backend',
            stepDelay: 1,
            steps: [() => {
                this._ai.trackTrace({message: 'trace'});
            }].concat(this.asserts(1))
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
                    this._ai.trackException({error: exception});
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
                    for (var i = 0; i < 100; i++) {
                        this._ai.trackMetric({name: "test" + i, average: Math.round(100 * Math.random())});
                    }
                    console.log("* done calling trackMetric " + new Date().toISOString());
                }
            ].concat(this.asserts(100))
        });

        this.testCaseAsync({
            name: "TelemetryContext: track page view",
            stepDelay: 1,
            steps: [
                () => {
                    this._ai.trackPageView({}); // sends 2
                }
            ].concat(this.asserts(2))
        });

        this.testCaseAsync({
            name: "TelemetryContext: track page view performance",
            stepDelay: 1,
            steps: [
                () => {
                    this._ai.trackPageViewPerformance({name: 'name', url: 'url'});
                }
            ].concat(this.asserts(1))
        });

        this.testCaseAsync({
            name: "TelemetryContext: track all types in batch",
            stepDelay: 1,
            steps: [
                () => {
                    var exception = null;
                    try {
                        window["a"]["b"]();
                    } catch (e) {
                        exception = e;
                    }

                    Assert.ok(exception);

                    this._ai.trackException({error: exception});
                    this._ai.trackMetric({name: "test", average: Math.round(100 * Math.random())});
                    this._ai.trackTrace({message: "test"});
                    this._ai.trackPageView({}); // sends 2
                    this._ai.trackPageViewPerformance({name: 'name', url:'http://someurl'});
                }
            ].concat(this.asserts(6))
        });

        this.testCaseAsync({
            name: "TelemetryContext: track all types in a large batch",
            stepDelay: 1,
            steps: [
                () => {
                    var exception = null;
                    try {
                        window["a"]["b"]();
                    } catch (e) {
                        exception = e;
                    }
                    Assert.ok(exception);

                    for (var i = 0; i < 100; i++) {
                        this._ai.trackException({error: exception});
                        this._ai.trackMetric({name: "test", average: Math.round(100 * Math.random())});
                        this._ai.trackTrace({message: "test"});
                        this._ai.trackPageView({name: `${i}`}); // sends 2 1st time
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
                    var telemetryInitializer = {
                        init: (envelope) => {
                            envelope.baseData.name = 'other name'
                            return true;
                        }
                    }

                    // Act
                    this._ai.addTelemetryInitializer(telemetryInitializer.init);
                    this._ai.trackMetric({name: "test", average: Math.round(100 * Math.random())});
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
        
        this.testCaseAsync({
            name: "TelemetryContext: trackDependencyData",
            stepDelay: 1,
            steps: [
                () => {
                    const data: IDependencyTelemetry = {
                        absoluteUrl: 'http://abc',
                        resultCode: 200,
                        method: 'GET',
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
                    let xhr = new XMLHttpRequest();
                    xhr.open('GET', 'https://httpbin.org/status/200');
                    xhr.send();
                    Assert.ok(true);
                }
            ].concat(this.asserts(1))
        });
        if (window && window.fetch) {
            this.testCaseAsync({
                name: "DependenciesPlugin: auto collection of outgoing fetch requests",
                stepDelay: 1,
                steps: [
                    () => {
                        fetch('https://httpbin.org/status/200', { method: 'GET' });
                        Assert.ok(true, "fetch monitoring is instrumented");
                    }
                ].concat(this.asserts(1))
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
            name: 'AuthenticatedUserContext: setAuthenticatedUserContext authId',
            stepDelay: 1,
            steps: [
                () => {
                    this._ai.setAuthenticatedUserContext('10001');
                    this._ai.trackTrace({message: 'authUserContext test'});
                }
            ]
            .concat(this.asserts(1))
            .concat(<any>PollingAssert.createPollingAssert(() => {
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
            }, 'user.authenticatedId', 5, 500))
        });

        this.testCaseAsync({
            name: 'AuthenticatedUserContext: setAuthenticatedUserContext authId and accountId',
            stepDelay: 1,
            steps: [
                () => {
                    this._ai.setAuthenticatedUserContext('10001', 'account123');
                    this._ai.trackTrace({message: 'authUserContext test'});
                }
            ]
            .concat(this.asserts(1))
            .concat(<any>PollingAssert.createPollingAssert(() => {
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
                        return '10001' === payload.tags[authTag] &&
                            'account123' === payload.tags[accountTag];
                    }
                }
                return false;
            }, 'user.authenticatedId', 5, 500))
        });

        this.testCaseAsync({
            name: 'AuthenticatedUserContext: setAuthenticatedUserContext non-ascii authId and accountId',
            stepDelay: 1,
            steps: [
                () => {
                    this._ai.setAuthenticatedUserContext("\u0428", "\u0429");
                    this._ai.trackTrace({message: 'authUserContext test'});
                }
            ]
            .concat(this.asserts(1))
            .concat(<any>PollingAssert.createPollingAssert(() => {
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
                        return '\u0428' === payload.tags[authTag] &&
                            '\u0429' === payload.tags[accountTag];
                    }
                }
                return false;
            }, 'user.authenticatedId', 5, 500))
        });

        this.testCaseAsync({
            name: 'AuthenticatedUserContext: clearAuthenticatedUserContext',
            stepDelay: 1,
            steps: [
                () => {
                    this._ai.setAuthenticatedUserContext('10002', 'account567');
                    this._ai.clearAuthenticatedUserContext();
                    this._ai.trackTrace({message: 'authUserContext test'});
                }
            ]
            .concat(this.asserts(1))
            .concat(<any>PollingAssert.createPollingAssert(() => {
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
            }, 'user.authenticatedId', 5, 500))
        });

        // This doesn't need to be e2e
        this.testCase({
            name: 'AuthenticatedUserContext: setAuthenticatedUserContext does not set the cookie by default',
            test: () => {
                // Setup
                const authSpy: SinonSpy = this.sandbox.spy(this._ai, 'setAuthenticatedUserContext');
                const cookieSpy: SinonSpy = this.sandbox.spy(Util, 'setCookie');

                // Act
                this._ai.setAuthenticatedUserContext('10002', 'account567');

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
        var isValidCallCount = this.loggingSpy.callCount === 0;
        Assert.ok(isValidCallCount, "logging spy was called 0 time(s)");
        if (!isValidCallCount) {
            while (this.loggingSpy.args.length) {
                Assert.ok(false, "[warning thrown]: " + this.loggingSpy.args.pop());
            }
        }
    }
    private asserts: any = (expectedCount: number) => [() => {
        var message = "polling: " + new Date().toISOString();
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
    }, "sender succeeded", 15, 1000))];
}
