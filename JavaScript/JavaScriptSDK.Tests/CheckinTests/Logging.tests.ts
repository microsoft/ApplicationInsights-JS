/// <reference path="..\TestFramework\Common.ts" />
/// <reference path="../../JavaScriptSDK/logging.ts" />
/// <reference path="../../javascriptsdk/appinsights.ts" />


class LoggingTests extends TestClass {

    public testCleanup() {
        // Clear the queue
        var length = Microsoft.ApplicationInsights._InternalLogging.queue.length;
        for (var i = 0; i < length; i++) {
            Microsoft.ApplicationInsights._InternalLogging.queue.shift();
        }
    }

    public registerTests() {

        this.testCase({
            name: "LoggingTests: enableDebugExceptions enables exceptions",
            test: () => {
                // setup
                var throwSpy = null;
                try {
                    throwSpy = sinon.spy(console, "warn");
                } catch (e) {
                    Assert.ok(true, "IE8 breaks sinon spies \n" + e.toString());
                }

                // verify
                Assert.ok(!Microsoft.ApplicationInsights._InternalLogging.enableDebugExceptions(), "enableDebugExceptions is false by default");

                // act
                Microsoft.ApplicationInsights._InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, "error!");

                // verify
                Assert.ok(!throwSpy || throwSpy.calledOnce, "console.warn was called instead of throwing while enableDebugExceptions is false");

                // act
                Microsoft.ApplicationInsights._InternalLogging.enableDebugExceptions = () => true;

                // verify
                Assert.throws(() =>
                    Microsoft.ApplicationInsights._InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, "error!"),
                    "error is thrown when enableDebugExceptions is true");
                Assert.ok(!throwSpy || throwSpy.calledOnce, "console.warn was not called when the error was thrown");

                // cleanup
                Microsoft.ApplicationInsights._InternalLogging.enableDebugExceptions = () => false;
                !throwSpy || throwSpy.restore(); // IE8
            }
        });

        this.testCase({
            name: "LoggingTests: verboseLogging collects all logs",
            test: () => {
                // setup
                Microsoft.ApplicationInsights._InternalLogging.enableDebugExceptions = () => false;
                Microsoft.ApplicationInsights._InternalLogging.verboseLogging = () => true;

                // act
                var message = "error!";
                Microsoft.ApplicationInsights._InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.WARNING, message);
                Microsoft.ApplicationInsights._InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.WARNING, message);
                Microsoft.ApplicationInsights._InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message);
                Microsoft.ApplicationInsights._InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message);

                //verify
                Assert.equal(4, Microsoft.ApplicationInsights._InternalLogging.queue.length);
                Assert.equal("AI (Internal): " + message, Microsoft.ApplicationInsights._InternalLogging.queue[0]);
                Assert.equal("AI: " + message, Microsoft.ApplicationInsights._InternalLogging.queue[1]);
                Assert.equal("AI (Internal): " + message, Microsoft.ApplicationInsights._InternalLogging.queue[2]);
                Assert.equal("AI: " + message, Microsoft.ApplicationInsights._InternalLogging.queue[3]);

                // cleanup
                Microsoft.ApplicationInsights._InternalLogging.verboseLogging = () => false;
            }
        });

        this.testCase({
            name: "LoggingTests: Logging only collects CRITICAL logs by default",
            test: () => {
                // setup
                Microsoft.ApplicationInsights._InternalLogging.enableDebugExceptions = () => false;

                // act
                var message = "error!";
                Microsoft.ApplicationInsights._InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.WARNING, message);
                Microsoft.ApplicationInsights._InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.WARNING, message);

                Assert.equal(0, Microsoft.ApplicationInsights._InternalLogging.queue.length);
                
                Microsoft.ApplicationInsights._InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message);
                Microsoft.ApplicationInsights._InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message);

                //verify
                Assert.equal(2, Microsoft.ApplicationInsights._InternalLogging.queue.length);
                Assert.equal("AI (Internal): " + message, Microsoft.ApplicationInsights._InternalLogging.queue[0]);
                Assert.equal("AI: " + message, Microsoft.ApplicationInsights._InternalLogging.queue[1]);
            }
        });

        this.testCase({
            name: "LoggingTests: throwInternalUserActionable adds to the queue and calls console.warn",
            test: () => {
                // setup
                var throwSpy = null;
                try {
                    throwSpy = sinon.spy(console, "warn");

                    // act
                    var message = "error!";
                    Microsoft.ApplicationInsights._InternalLogging.enableDebugExceptions = () => false;
                    Microsoft.ApplicationInsights._InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message);

                    // verify
                    Assert.ok(throwSpy.calledOnce, "console.warn was not called while debug mode was false");
                    Assert.equal(1, Microsoft.ApplicationInsights._InternalLogging.queue.length);
                    Assert.equal("AI: " + message, Microsoft.ApplicationInsights._InternalLogging.queue[0]);

                    // cleanup
                    throwSpy.restore();
                } catch (e) {
                    Assert.ok(true, "IE8 breaks sinon spies on window objects\n" + e.toString());
                }
            }
        });

        this.testCase({
            name: "LoggingTests: throwInternalNonUserActionable adds to the queue and calls console.warn",
            test: () => {
                // setup
                var throwSpy = null;
                try {
                    throwSpy = sinon.spy(console, "warn");

                    // act
                    var message = "error!";
                    Microsoft.ApplicationInsights._InternalLogging.enableDebugExceptions = () => false;
                    Microsoft.ApplicationInsights._InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message);

                    // verify
                    Assert.ok(throwSpy.calledOnce, "console.warn was not called while debug mode was false");

                    Assert.equal(1, Microsoft.ApplicationInsights._InternalLogging.queue.length);
                    Assert.equal("AI (Internal): " + message, Microsoft.ApplicationInsights._InternalLogging.queue[0]);

                    // cleanup
                    throwSpy.restore();
                } catch (e) {
                    Assert.ok(true, "IE8 breaks sinon spies on window objects\n" + e.toString());
                }
            }
        });

        this.testCase({
            name: "LoggingTests: warn does not add to the queue ",
            test: () => {
                // setup
                var throwSpy = null;
                try {
                    throwSpy = sinon.spy(console, "warn");

                    // act
                    var message = "error!";
                    Microsoft.ApplicationInsights._InternalLogging.warn(message);

                    // verify
                    Assert.ok(throwSpy.calledOnce, "console.warn was called once");
                    Assert.equal(0, Microsoft.ApplicationInsights._InternalLogging.queue.length);

                    // cleanup
                    throwSpy.restore();
                } catch (e) {
                    Assert.ok(true, "IE8 breaks sinon spies on window objects\n" + e.toString());
                }
            }
        });

        this.testCase({
            name: "LoggingTests: console.warn falls back to console.log",
            test: () => {
                // setup
                var throwSpy = null;
                var warn = console.warn;
                try {
                    console.warn = undefined;
                    throwSpy = sinon.spy(console, "log");

                    // act
                    Microsoft.ApplicationInsights._InternalLogging.enableDebugExceptions = () => false;
                    Microsoft.ApplicationInsights._InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, "error!");

                    // verify
                    Assert.ok(throwSpy.calledOnce, "console.log was called when console.warn was not present");

                    // cleanup
                    throwSpy.restore();
                } catch (e) {
                    Assert.ok(true, "IE8 breaks sinon spies on window objects\n" + e.toString());
                } finally {
                    console.warn = warn;
                }
            }
        });
    }
}
new LoggingTests().registerTests(); 