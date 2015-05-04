
/// <reference path="..\TestFramework\Common.ts" />
/// <reference path="../../javascriptsdk/initialization.ts" />
/// <reference path="../../javascriptsdk/appinsights.ts" />

class InitializationTests extends TestClass {

    public testInitialize() {
        window['queueTest'] = function () { };
    }

    private getAppInsightsSnippet() {
        var snippet: Microsoft.ApplicationInsights.IConfig = {
            instrumentationKey: "ffffffff-ffff-ffff-ffff-ffffffffffff",
            endpointUrl: "//dc-int.services.visualstudio.com/v2/track",
            emitLineDelimitedJson: false,
            accountId: undefined,
            appUserId: undefined,
            sessionRenewalMs: 10,
            sessionExpirationMs: 10,
            maxBatchSizeInBytes: 1000000,
            maxBatchInterval: 1,
            enableDebug: true,
            autoCollectErrors: false,
            disableTelemetry: false,
            verboseLogging: true,
            diagnosticLogInterval: 1
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
                    appUserId: undefined,
                    sessionRenewalMs: undefined,
                    sessionExpirationMs: undefined,
                    maxBatchSizeInBytes: undefined,
                    maxBatchInterval: undefined,
                    enableDebug: undefined,
                    autoCollectErrors: undefined,
                    disableTelemetry: undefined,
                    verboseLogging: undefined,
                    diagnosticLogInterval: undefined
                };

                var snippet = <Microsoft.ApplicationInsights.Snippet> {
                    config: emptyConfig,
                    queue: []
                    }

                var init = new Microsoft.ApplicationInsights.Initialization(snippet);

                Assert.equal("//dc.services.visualstudio.com/v2/track", init.config.endpointUrl);
                Assert.equal(30 * 60 * 1000, init.config.sessionRenewalMs);
                Assert.equal(24 * 60 * 60 * 1000, init.config.sessionExpirationMs);
                Assert.equal(1000000, init.config.maxBatchSizeInBytes);
                Assert.equal(15000, init.config.maxBatchInterval);
                Assert.ok(!init.config.enableDebug);
                Assert.ok(init.config.autoCollectErrors);
                Assert.equal(15000, init.config.maxBatchInterval);
                Assert.ok(!init.config.verboseLogging);
                Assert.equal(10000, init.config.diagnosticLogInterval);
            }
        });

        this.testCase({
            name: "InitializationTests: constructor takes the user specified values",
            test: () => {
                var userConfig = this.getAppInsightsSnippet();

                var snippet = <Microsoft.ApplicationInsights.Snippet> {
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
                Assert.ok(!init.config.autoCollectErrors);
                Assert.equal(1, init.config.maxBatchInterval);
                Assert.ok(init.config.verboseLogging);
                Assert.equal(1, init.config.diagnosticLogInterval);
            }
        });

        this.testCase({
            name: "InitializationTests: polling for log messages",
            test: () => {
                var userConfig = this.getAppInsightsSnippet();
                var snippet = <Microsoft.ApplicationInsights.Snippet> {
                    config: userConfig,
                    queue: []
                }

                var init = new Microsoft.ApplicationInsights.Initialization(snippet);
                var appInsightsLocal = init.loadAppInsights();
                var trackTraceSpy = sinon.spy(appInsightsLocal, "trackTrace");

                var queue: Array<string> = Microsoft.ApplicationInsights._InternalLogging["queue"];
                var length = queue.length;
                for (var i = 0; i < length; i++) {
                    queue.shift();
                }
                queue.push("Hello1");
                queue.push("Hello2");

                init.loadAppInsights();
                var poller = init.pollInteralLogs(appInsightsLocal);

                this.clock.tick(2);
                var data1 = trackTraceSpy.args[0][0];
                Assert.ok("Hello1", data1.message);

                var data2 = trackTraceSpy.args[1][0];
                Assert.ok("Hello2", data2.message);

                clearInterval(poller);

                trackTraceSpy.restore();
                
            }
        });


        this.testCase({
            name: "InitializationTests: in config - 'false' string is treated as a boolean false",
            test: () => {

                var userConfig = {
                    enableDebug: "false",
                    autoCollectErrors: "false",
                    disableTelemetry: "false",
                    verboseLogging: "false",
                    emitLineDelimitedJson: "false",
                };

                var config = Microsoft.ApplicationInsights.Initialization.getDefaultConfig(<any>userConfig);

                Assert.ok(!config.enableDebug);
                Assert.ok(!config.autoCollectErrors);
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
                    autoCollectErrors: "true",
                    disableTelemetry: "true",
                    verboseLogging: "true",
                    emitLineDelimitedJson: "true",
                };

                var config = Microsoft.ApplicationInsights.Initialization.getDefaultConfig(<any>userConfig);

                Assert.ok(config.enableDebug);
                Assert.ok(config.autoCollectErrors);
                Assert.ok(config.disableTelemetry);
                Assert.ok(config.verboseLogging);
                Assert.ok(config.emitLineDelimitedJson);
            }
        });
    }
}

new InitializationTests().registerTests(); 