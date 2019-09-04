/// <reference path="../TestFramework/Common.ts" />
/// <reference path="../../JavaScriptSDK/Initialization.ts" />
/// <reference path="../../JavaScriptSDK/AppInsights.ts" />

class InitializationTests extends TestClass {

    public testInitialize() {
        window['queueTest'] = function () { };
    }

    private getAppInsightsSnippet() {
        var snippet: Microsoft.ApplicationInsights.IConfig = {
            instrumentationKey: "ffffffff-ffff-ffff-ffff-ffffffffffff",
            endpointUrl: "https://dc.services.visualstudio.com/v2/track",
            emitLineDelimitedJson: false,
            accountId: undefined,
            sessionRenewalMs: 10,
            sessionExpirationMs: 10,
            maxBatchSizeInBytes: 1000000,
            maxBatchInterval: 1,
            enableDebug: true,
            disableExceptionTracking: false,
            disableTelemetry: false,
            verboseLogging: true,
            diagnosticLogInterval: 1,
            autoTrackPageVisitTime: false,
            samplingPercentage: 33,
            disableAjaxTracking: true,
            overridePageViewDuration: false,
            maxAjaxCallsPerView: 44,
            disableDataLossAnalysis: true,
            disableCorrelationHeaders: false,
            disableFlushOnBeforeUnload: false,
            cookieDomain: undefined,
            enableSessionStorageBuffer: false,
            enableCorsCorrelation: false
        };

        // set default values
        return snippet;
    }

    public registerTests() {
        this.testCase({
            name: "InitializationTests: constructor throws if Instrumentation Key is not set",
            test: () => {
                var snippet = <any>{};
                var msg = "";
                try {
                    var init = new Microsoft.ApplicationInsights.Initialization(snippet);
                }
                catch (err) {
                    msg = err.message;
                }

                Assert.equal("Cannot load Application Insights SDK, no instrumentationKey was provided.", msg);
            }
        });

        this.testCase({
            name: "InitializationTests: constructor sets defaults",
            test: () => {
                var emptyConfig = <Microsoft.ApplicationInsights.IConfig>{
                    instrumentationKey: "ffffffff-ffff - ffff - ffff - ffffffffffff",
                    endpointUrl: undefined,
                    accountId: undefined,
                    sessionRenewalMs: undefined,
                    sessionExpirationMs: undefined,
                    maxBatchSizeInBytes: undefined,
                    maxBatchInterval: undefined,
                    enableDebug: undefined,
                    disableExceptionTracking: undefined,
                    disableTelemetry: undefined,
                    verboseLogging: undefined,
                    diagnosticLogInterval: undefined,
                    samplingPercentage: undefined,
                    maxAjaxCallsPerView: undefined
                };

                var snippet = <Microsoft.ApplicationInsights.Snippet>{
                    config: emptyConfig,
                    queue: []
                }

                var init = new Microsoft.ApplicationInsights.Initialization(snippet);

                Assert.equal("https://dc.services.visualstudio.com/v2/track", init.config.endpointUrl);
                Assert.equal(30 * 60 * 1000, init.config.sessionRenewalMs);
                Assert.equal(24 * 60 * 60 * 1000, init.config.sessionExpirationMs);
                Assert.equal(102400, init.config.maxBatchSizeInBytes);
                Assert.equal(15000, init.config.maxBatchInterval);
                Assert.ok(!init.config.enableDebug);
                Assert.ok(!init.config.disableExceptionTracking);
                Assert.equal(15000, init.config.maxBatchInterval);
                Assert.ok(!init.config.verboseLogging);
                Assert.equal(10000, init.config.diagnosticLogInterval);
                Assert.equal(100, init.config.samplingPercentage);
                Assert.equal(500, init.config.maxAjaxCallsPerView);
            }
        });

        this.testCase({
            name: "InitializationTests: constructor takes the user specified values",
            test: () => {
                var userConfig = this.getAppInsightsSnippet();

                var snippet = <Microsoft.ApplicationInsights.Snippet>{
                    config: userConfig,
                    queue: []
                }

                var init = new Microsoft.ApplicationInsights.Initialization(snippet);

                Assert.equal(userConfig.endpointUrl, init.config.endpointUrl);
                Assert.equal(userConfig.sessionRenewalMs, init.config.sessionRenewalMs);
                Assert.equal(userConfig.sessionExpirationMs, init.config.sessionExpirationMs);
                Assert.equal(userConfig.maxBatchSizeInBytes, init.config.maxBatchSizeInBytes);
                Assert.equal(userConfig.maxBatchInterval, init.config.maxBatchInterval);
                Assert.ok(init.config.enableDebug);
                Assert.ok(!init.config.disableExceptionTracking);
                Assert.equal(1, init.config.maxBatchInterval);
                Assert.ok(init.config.verboseLogging);
                Assert.equal(1, init.config.diagnosticLogInterval);
                Assert.equal(33, init.config.samplingPercentage);
                Assert.equal(44, init.config.maxAjaxCallsPerView);
            }
        });

        this.testCase({
            name: "InitializationTests: invalid sampling values are treated as sampling OFF (sampling percentage gets set to 100)",
            test: () => {
                var res = Microsoft.ApplicationInsights.Initialization.getDefaultConfig(<any>{ samplingPercentage: 0 });
                Assert.equal(100, res.samplingPercentage);

                res = Microsoft.ApplicationInsights.Initialization.getDefaultConfig(<any>{ samplingPercentage: "" });
                Assert.equal(100, res.samplingPercentage);

                res = Microsoft.ApplicationInsights.Initialization.getDefaultConfig(<any>{ samplingPercentage: null });
                Assert.equal(100, res.samplingPercentage);

                res = Microsoft.ApplicationInsights.Initialization.getDefaultConfig(<any>{ samplingPercentage: undefined });
                Assert.equal(100, res.samplingPercentage);

                res = Microsoft.ApplicationInsights.Initialization.getDefaultConfig(<any>{ samplingPercentage: false });
                Assert.equal(100, res.samplingPercentage);

                res = Microsoft.ApplicationInsights.Initialization.getDefaultConfig(<any>{ samplingPercentage: -123 });
                Assert.equal(100, res.samplingPercentage);

                res = Microsoft.ApplicationInsights.Initialization.getDefaultConfig(<any>{ samplingPercentage: 123 });
                Assert.equal(100, res.samplingPercentage);

                // "50" is treated as correct number and doesn't reset sampling percentage to 100.
                res = Microsoft.ApplicationInsights.Initialization.getDefaultConfig(<any>{ samplingPercentage: "50" });
                Assert.equal(50, res.samplingPercentage);
            }
        });

        this.testCase({
            name: "InitializationTests: polling for log messages",
            test: () => {
                var userConfig = this.getAppInsightsSnippet();
                var snippet = <Microsoft.ApplicationInsights.Snippet>{
                    config: userConfig,
                    queue: []
                }

                var init = new Microsoft.ApplicationInsights.Initialization(snippet);
                var appInsightsLocal = init.loadAppInsights();
                var trackTraceSpy = this.sandbox.stub(appInsightsLocal, "trackTrace");

                var queue: Array<Microsoft.ApplicationInsights._InternalLogMessage> = Microsoft.ApplicationInsights._InternalLogging["queue"];
                var length = queue.length;
                for (var i = 0; i < length; i++) {
                    queue.shift();
                }
                queue.push(new Microsoft.ApplicationInsights._InternalLogMessage(1, "Hello1"));
                queue.push(new Microsoft.ApplicationInsights._InternalLogMessage(2, "Hello2"));

                init.loadAppInsights();
                var poller = init.pollInteralLogs(appInsightsLocal);

                this.clock.tick(2);
                var data1 = trackTraceSpy.args[0][0];
                Assert.ok("Hello1", data1.message);

                var data2 = trackTraceSpy.args[1][0];
                Assert.ok("Hello2", data2.message);

                clearInterval(poller);



            }
        });


        this.testCase({
            name: "InitializationTests: in config - 'false' string is treated as a boolean false",
            test: () => {

                var userConfig = {
                    enableDebug: "false",
                    disableExceptionTracking: "false",
                    disableTelemetry: "false",
                    verboseLogging: "false",
                    emitLineDelimitedJson: "false",
                };

                var config = Microsoft.ApplicationInsights.Initialization.getDefaultConfig(<any>userConfig);

                Assert.ok(!config.enableDebug);
                Assert.ok(!config.disableExceptionTracking);
                Assert.ok(!config.disableTelemetry);
                Assert.ok(!config.verboseLogging);
                Assert.ok(!config.emitLineDelimitedJson);
            }
        });

        this.testCase({
            name: "InitializationTests: in config - 'true' string is treated as a boolean true",
            test: () => {

                var userConfig = {
                    enableDebug: "true",
                    disableExceptionTracking: "true",
                    disableTelemetry: "true",
                    verboseLogging: "true",
                    emitLineDelimitedJson: "true",
                };

                var config = Microsoft.ApplicationInsights.Initialization.getDefaultConfig(<any>userConfig);

                Assert.ok(config.enableDebug);
                Assert.ok(config.disableExceptionTracking);
                Assert.ok(config.disableTelemetry);
                Assert.ok(config.verboseLogging);
                Assert.ok(config.emitLineDelimitedJson);
            }
        });

        this.testCase({
            name: "InitializationTests: beforeunload handler is appropriately added",
            test: () => {
                // Assemble
                var userConfig = this.getAppInsightsSnippet();
                var snippet = <Microsoft.ApplicationInsights.Snippet>{
                    config: userConfig,
                    queue: []
                };
                var addEventHandlerStub = this.sandbox.stub(Microsoft.ApplicationInsights.Util, 'addEventHandler').returns(true);
                var init = new Microsoft.ApplicationInsights.Initialization(snippet);
                var appInsightsLocal = init.loadAppInsights();

                // Act
                init.addHousekeepingBeforeUnload(appInsightsLocal);

                // Assert
                Assert.ok(addEventHandlerStub.calledOnce);
                Assert.equal(addEventHandlerStub.getCall(0).args[0], 'beforeunload');
                Assert.ok(addEventHandlerStub.getCall(0).args[1] !== undefined, 'addEventHandler was called with undefined callback');
            }
        });

        this.testCase({
            name: "InitializationTests: disableFlushOnBeforeUnload switch works",
            test: () => {
                // Assemble
                var userConfig = this.getAppInsightsSnippet();
                userConfig.disableFlushOnBeforeUnload = true;
                var snippet = <Microsoft.ApplicationInsights.Snippet>{
                    config: userConfig,
                    queue: []
                };
                var addEventHandlerStub = this.sandbox.stub(Microsoft.ApplicationInsights.Util, 'addEventHandler').returns(true);
                var init = new Microsoft.ApplicationInsights.Initialization(snippet);
                var appInsightsLocal = init.loadAppInsights();

                // Act
                init.addHousekeepingBeforeUnload(appInsightsLocal);

                // Assert
                Assert.ok(addEventHandlerStub.notCalled);
            }
        });
    }
}

new InitializationTests().registerTests(); 