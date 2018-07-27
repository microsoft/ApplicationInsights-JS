/// <reference path="../TestFramework/Common.ts" />
/// <reference path="../../JavaScriptSDK/ajax/ajax.ts" />
/// <reference path="../../JavaScriptSDK/ajax/fetch.ts" />
/// <reference path="../../JavaScriptSDK/Util.ts"/>
/// <reference path="../../JavaScriptSDK/Telemetry/RemoteDependencyData.ts"/>

class FetchTests extends TestClass {

    private appInsightsMock = {
        trackDependency: (id: string, method: string, absoluteUrl: string, isAsync: boolean, totalTime: number, success: boolean) => { },
        trackDependencyData: (dependency: Microsoft.ApplicationInsights.Telemetry.RemoteDependencyData) => { },
        context: {
            operation: {
                id: "asdf"
            },
            appId: () => "someid"
        },
        config: {
            disableCorrelationHeaders: false,
            enableCorsCorrelation: false
        }
    }
    private trackDependencySpy: SinonSpy;

    public testInitialize() {
        this.trackDependencySpy = this.sandbox.spy(this.appInsightsMock, "trackDependencyData");
        this.trackDependencySpy.reset();
    }

    public testCleanup() {
    }

    public registerTests() {
        this.useFakeTimers = false;
        this.testCase({
            name: "Fetch: window.fetch gets instrumented",
            test: () => {
                window.fetch = FetchTests.createFetchStub(200);
                let fm = new Microsoft.ApplicationInsights.FetchMonitor(<any>this.appInsightsMock);

                // assert
                let isInstrumented = window.fetch[Microsoft.ApplicationInsights.FetchMonitor.instrumentedByAppInsightsName];
                Assert.equal(true, isInstrumented, "window.fetch is instrumented");
            }
        });

        this.testCaseAsync({
            name: "Fetch: successful request, fetch monitor doesn't change payload",
            steps: [
                () => {
                    window.fetch = FetchTests.createFetchStub(200);
                    let fm = new Microsoft.ApplicationInsights.FetchMonitor(<any>this.appInsightsMock);
                    fetch("bla").then(r => {
                        this["response"] = r;
                        r.text().then(t => this["text"] = t);
                    });
                },
                <() => void>PollingAssert.createPollingAssert(() => this.trackDependencySpy.called, "trackDependencyData is called", 0.1),
                <() => void>PollingAssert.createPollingAssert(() => this["text"] === "bla", "Expected result mismatch", 0.1),
                <() => void>PollingAssert.createPollingAssert(() => this["response"].status === 200, "Expected 200 response code", 0.1)
            ],
            stepDelay: 0
        });


        this.testCaseAsync({
            name: "Fetch: 200 means success",
            steps: [
                () => {
                    window.fetch = FetchTests.createFetchStub(200);
                    let fm = new Microsoft.ApplicationInsights.FetchMonitor(<any>this.appInsightsMock);
                    fetch("bla");
                },
                <() => void>PollingAssert.createPollingAssert(() => this.trackDependencySpy.called, "trackDependencyData is called", 0.1),
                <() => void>PollingAssert.createPollingAssert(() => this.trackDependencySpy.args[0][0].success, "trackDependencyData should receive true as a 'success' argument", 0.1)
            ],
            stepDelay: 0
        });

        this.testCaseAsync({
            name: "Fetch: non 200 means failure",
            steps: [
                () => {
                    window.fetch = FetchTests.createFetchStub(400);
                    let fm = new Microsoft.ApplicationInsights.FetchMonitor(<any>this.appInsightsMock);
                    fetch("bla");
                },
                <() => void>PollingAssert.createPollingAssert(() => this.trackDependencySpy.called, "trackDependencyData is called", 0.1),
                <() => void>PollingAssert.createPollingAssert(() => !this.trackDependencySpy.args[0][0].success, "trackDependencyData should receive false as a 'success' argument", 0.1)
            ],
            stepDelay: 0
        });

        [200, 201, 202, 203, 204, 301, 302, 303, 304].forEach((responseCode) => {
            this.testCaseAsync({
                name: "Fetch: test success http response code: " + responseCode,
                steps: this.testFetchSuccess(responseCode, true),
                stepDelay: 0
            })
        });

        [400, 401, 402, 403, 404, 500, 501].forEach((responseCode) => {
            this.testCaseAsync({
                name: "Fetch: test failure http response code: " + responseCode,
                steps: this.testFetchSuccess(responseCode, false),
                stepDelay: 0
            })
        });
    }

    private testFetchSuccess(responseCode: number, success: boolean): Array<() => void> {
        return [
            () => {
                window.fetch = FetchTests.createFetchStub(responseCode, responseCode === 204 || responseCode === 304 ? null : "bla");
                let fm = new Microsoft.ApplicationInsights.FetchMonitor(<any>this.appInsightsMock);
                fetch("bla");
            },
            <() => void>PollingAssert.createPollingAssert(() => this.trackDependencySpy.args[0][0].success === success, `trackDependencyData should receive ${success} as a 'success' argument`, 0.1)
        ];
    }

    static createFetchStub(responseCode: number, body: string = "bla", timeout: number = 0): (input?: Request | string, init?: RequestInit) => Promise<Response> {
        return (input, init) => new (window as any).Promise(resolve => {
            setTimeout(() => resolve(new Response(body, { status: responseCode, headers: { "Content-Type": "application/json" } })), timeout);
        });
    }
}

new FetchTests().registerTests();