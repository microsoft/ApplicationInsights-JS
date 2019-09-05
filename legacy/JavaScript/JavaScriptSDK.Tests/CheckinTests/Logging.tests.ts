/// <reference path="../TestFramework/Common.ts" />
/// <reference path="../../JavaScriptSDK/Logging.ts" />
/// <reference path="../../JavaScriptSDK/AppInsights.ts" />


class LoggingTests extends TestClass {

    InternalLogging = Microsoft.ApplicationInsights._InternalLogging;
    InternalLoggingMessage = Microsoft.ApplicationInsights._InternalLogMessage;

    enableDebugExceptionsDefaultValue = Microsoft.ApplicationInsights._InternalLogging.enableDebugExceptions();
    verboseLoggingDefaultValue = Microsoft.ApplicationInsights._InternalLogging.verboseLogging();

    public testInitialize() {
        this.InternalLogging.setMaxInternalMessageLimit(Number.MAX_VALUE);
    }

    public testCleanup() {
        // Clear the queue
        this.clearInternalLoggingQueue();

        // Reset the internal event throttle
        this.InternalLogging.resetInternalMessageCount();

        // Reset the internal throttle max limit
        this.InternalLogging.setMaxInternalMessageLimit(Number.MAX_VALUE);

        // Clear records indicating what internal message types were already logged
        this.InternalLogging.clearInternalMessageLoggedTypes();

        // Reset to a default state
        this.InternalLogging.enableDebugExceptions = () => this.enableDebugExceptionsDefaultValue;
        this.InternalLogging.verboseLogging = () => this.verboseLoggingDefaultValue;
    }

    /**
     * Clears the internal logging queue
     */
    private clearInternalLoggingQueue() {
        var length = this.InternalLogging.queue.length;
        for (var i = 0; i < length; i++) {
            this.InternalLogging.queue.shift();
        }
    }

    public registerTests() {
        this.testCase({
            name: "LoggingTests: enableDebugExceptions enables exceptions",
            test: () => {
                // setup
                var throwSpy = null;
                try {
                    throwSpy = this.sandbox.spy(console, "warn");
                } catch (e) {
                    Assert.ok(true, "IE8 breaks sinon spies \n" + e.toString());
                }

                var i = 0;

                // verify
                Assert.ok(!this.InternalLogging.enableDebugExceptions(), "enableDebugExceptions is false by default");

                // act
                this.InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, ++i, "error!", null, true);

                // verify
                Assert.ok(!throwSpy || throwSpy.calledOnce, "console.warn was called instead of throwing while enableDebugExceptions is false");

                // act
                this.InternalLogging.enableDebugExceptions = () => true;

                // verify
                Assert.throws(() =>
                    this.InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, ++i, "error!", null, true),
                    "error is thrown when enableDebugExceptions is true");
                Assert.ok(!throwSpy || throwSpy.calledOnce, "console.warn was not called when the error was thrown");
            }
        });

        this.testCase({
            name: "LoggingTests: verboseLogging collects all logs",
            test: () => {
                // setup
                this.InternalLogging.enableDebugExceptions = () => false;
                this.InternalLogging.verboseLogging = () => true;

                var i = 2;
                // act
                this.InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.WARNING, ++i, "error!");
                this.InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.WARNING, ++i, "error!", null, true);
                this.InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, ++i, "error!");
                this.InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, ++i, "error!", null, true);

                //verify
                Assert.equal(4, this.InternalLogging.queue.length);
                Assert.equal("AI (Internal): " + "BrowserCannotWriteLocalStorage message:\"error!\"", this.InternalLogging.queue[0].message);
                Assert.equal("AI: " + "BrowserCannotWriteSessionStorage message:\"error!\"", this.InternalLogging.queue[1].message);
                Assert.equal("AI (Internal): " + "BrowserFailedRemovalFromLocalStorage message:\"error!\"", this.InternalLogging.queue[2].message);
                Assert.equal("AI: " + "BrowserFailedRemovalFromSessionStorage message:\"error!\"", this.InternalLogging.queue[3].message);
            }
        });

        this.testCase({
            name: "LoggingTests: Logging only collects CRITICAL logs by default",
            test: () => {
                // setup
                this.InternalLogging.enableDebugExceptions = () => false;

                var i = 0;
                // act
                this.InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.WARNING, ++i, "error!");
                this.InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.WARNING, ++i, "error!", null, true);

                Assert.equal(0, this.InternalLogging.queue.length);

                this.InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, ++i, "error!");
                this.InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, ++i, "error!", null, true);

                //verify
                Assert.equal(2, this.InternalLogging.queue.length);
                Assert.equal("AI (Internal): " + "BrowserCannotWriteLocalStorage message:\"error!\"", this.InternalLogging.queue[0].message);
                Assert.equal("AI: " + "BrowserCannotWriteSessionStorage message:\"error!\"", this.InternalLogging.queue[1].message);
            }
        });

        this.testCase({
            name: "LoggingTests: throwInternal adds to the queue and calls console.warn",
            test: () => {
                // setup
                var throwSpy = null;
                try {
                    throwSpy = this.sandbox.spy(console, "warn");

                    // act
                    this.InternalLogging.enableDebugExceptions = () => false;
                    this.InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, 1, "error!", null, true);

                    // verify
                    Assert.ok(throwSpy.calledOnce, "console.warn was not called while debug mode was false");
                    Assert.equal(1, this.InternalLogging.queue.length);
                    Assert.equal("AI: " + "BrowserCannotReadLocalStorage message:\"error!\"", this.InternalLogging.queue[0].message);

                } catch (e) {
                    Assert.ok(true, "IE8 breaks sinon spies on window objects\n" + e.toString());
                }
            }
        });

        this.testCase({
            name: "LoggingTests: throwInternal adds to the queue and calls console.warn",
            test: () => {
                // setup
                var throwSpy = null;
                try {
                    throwSpy = this.sandbox.spy(console, "warn");

                    // act
                    this.InternalLogging.enableDebugExceptions = () => false;
                    this.InternalLogging.verboseLogging = () => true;
                    this.InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, 1, "error!");

                    // verify
                    Assert.ok(throwSpy.calledOnce, "console.warn was not called while debug mode was false");

                    Assert.equal(1, this.InternalLogging.queue.length);
                    Assert.equal("AI (Internal): " + "BrowserCannotReadLocalStorage message:\"error!\"", this.InternalLogging.queue[0].message);

                } catch (e) {
                    Assert.ok(true, "IE8 breaks sinon spies on window objects\n" + e.toString());
                }
            }
        });

        this.testCase({
            name: "LoggingTests: throwInternal does not call console.warn without verboseLogging",
            test: () => {
                // setup
                var throwSpy = null;
                try {
                    throwSpy = this.sandbox.spy(console, "warn");

                    // act
                    this.InternalLogging.enableDebugExceptions = () => false;
                    this.InternalLogging.verboseLogging = () => false;
                    this.InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, 1, "error!");

                    // verify
                    Assert.ok(throwSpy.notCalled, "console.warn was called while verboseLogging mode was false");

                    Assert.equal(1, this.InternalLogging.queue.length);
                    Assert.equal("AI (Internal): " + "BrowserCannotReadLocalStorage message:\"error!\"", this.InternalLogging.queue[0].message);

                } catch (e) {
                    Assert.ok(true, "IE8 breaks sinon spies on window objects\n" + e.toString());
                }
            }
        });

        this.testCase({
            name: "LoggingTests: throwInternal (userActionable) logs only one message of a given type to console (without verboseLogging)",
            test: () => {
                // setup
                var throwSpy = null;
                try {
                    throwSpy = this.sandbox.spy(console, "warn");
                    this.InternalLogging.enableDebugExceptions = () => false;
                    this.InternalLogging.verboseLogging = () => false;

                    // act
                    // send 4 messages, with 2 distinct types
                    this.InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, 1, "error!", null, true);
                    this.InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, 2, "error 2!", null, true);
                    this.InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, 1, "error!", null, true);
                    this.InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, 2, "error 2!", null, true);

                    // verify
                    Assert.ok(throwSpy.calledTwice, "console.warn was called only once per each message type");

                } catch (e) {
                    Assert.ok(true, "IE8 breaks sinon spies on window objects\n" + e.toString());
                }
            }
        });

        this.testCase({
            name: "LoggingTests: throwInternal (userActionable) always log to console with verbose logging",
            test: () => {
                // setup
                var throwSpy = null;
                try {
                    throwSpy = this.sandbox.spy(console, "warn");
                    this.InternalLogging.enableDebugExceptions = () => false;
                    this.InternalLogging.verboseLogging = () => true;

                    // act
                    // send 4 messages, with 2 distinct types
                    this.InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, 1, "error!", null, true);
                    this.InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, 2, "error 2!", null, true);
                    this.InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, 1, "error!", null, true);
                    this.InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, 2, "error 2!", null, true);

                    // verify
                    Assert.equal(4, throwSpy.callCount, "console.warn was called for each message");

                } catch (e) {
                    Assert.ok(true, "IE8 breaks sinon spies on window objects\n" + e.toString());
                }
            }
        });

        this.testCase({
            name: "LoggingTests: warnToConsole does not add to the queue ",
            test: () => {
                // setup
                var throwSpy = null;
                try {
                    throwSpy = this.sandbox.spy(console, "warn");

                    // act
                    var message = "error!";
                    this.InternalLogging.warnToConsole(message);

                    // verify
                    Assert.ok(throwSpy.calledOnce, "console.warn was called once");
                    Assert.equal(0, this.InternalLogging.queue.length);

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
                    throwSpy = this.sandbox.spy(console, "log");

                    // act
                    this.InternalLogging.enableDebugExceptions = () => false;
                    this.InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, 1, "error!", null, true);

                    // verify
                    Assert.ok(throwSpy.calledOnce, "console.log was called when console.warn was not present");

                } catch (e) {
                    Assert.ok(true, "IE8 breaks sinon spies on window objects\n" + e.toString());
                } finally {
                    console.warn = warn;
                }
            }
        });

        this.testCase({
            name: "LoggingTests: logInternalMessage throttles messages when the throttle limit is reached",
            test: () => {

                var maxAllowedInternalMessages = 2;

                // setup
                this.InternalLogging.enableDebugExceptions = () => false;
                this.InternalLogging.setMaxInternalMessageLimit(maxAllowedInternalMessages);
                this.InternalLogging.resetInternalMessageCount();

                // act
                this.InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, Microsoft.ApplicationInsights._InternalMessageId.BrowserCannotReadLocalStorage, "");
                this.InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, Microsoft.ApplicationInsights._InternalMessageId.BrowserCannotReadSessionStorage, "");
                this.InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, Microsoft.ApplicationInsights._InternalMessageId.BrowserCannotWriteLocalStorage, "");
                this.InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, Microsoft.ApplicationInsights._InternalMessageId.BrowserCannotWriteSessionStorage, "");

                // verify
                Assert.equal(maxAllowedInternalMessages + 1, this.InternalLogging.queue.length); // Since we always send one "extra" event to denote that limit was reached
                Assert.equal(this.InternalLogging.queue[0].message, "AI (Internal): BrowserCannotReadLocalStorage");
                Assert.equal(this.InternalLogging.queue[1].message, "AI (Internal): BrowserCannotReadSessionStorage");
                Assert.equal(this.InternalLogging.queue[2].message, "AI (Internal): MessageLimitPerPVExceeded message:\"Internal events throttle limit per PageView reached for this app.\"");
            }
        });

        this.testCase({
            name: "LoggingTests: throwInternal should call logInternalMessage",
            test: () => {
                var maxAllowedInternalMessages = 2;
                var logInternalMessageStub = this.sandbox.stub(this.InternalLogging, 'logInternalMessage');

                // setup
                this.InternalLogging.enableDebugExceptions = () => false;
                this.InternalLogging.resetInternalMessageCount();

                // act
                this.InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, 1, "");

                // verify
                Assert.ok(logInternalMessageStub.calledOnce, 'logInternalMessage was not called by throwInternal');

            }
        });

        this.testCase({
            name: "LoggingTests: only single message of specific type can be sent within the same session",
            test: () => {
                var maxAllowedInternalMessages = 2;

                // setup
                this.InternalLogging.enableDebugExceptions = () => false;
                this.InternalLogging.resetInternalMessageCount();
                this.InternalLogging.clearInternalMessageLoggedTypes();

                var id1 = Microsoft.ApplicationInsights._InternalMessageId.BrowserCannotReadLocalStorage;
                var id2 = Microsoft.ApplicationInsights._InternalMessageId.BrowserCannotReadSessionStorage;

                // act
                // send 4 messages, with 2 distinct types
                this.InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, id1, "1");
                this.InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, id2, "2");
                this.InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, id1, "1");
                this.InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, id2, "2");

                // verify
                // only two messages should be in the queue, because we have to distinct types
                Assert.equal(2, this.InternalLogging.queue.length);
                Assert.equal(this.InternalLogging.queue[0].message, "AI (Internal): BrowserCannotReadLocalStorage message:\"1\"");
                Assert.equal(this.InternalLogging.queue[1].message, "AI (Internal): BrowserCannotReadSessionStorage message:\"2\"");
            }
        });

        this.testCase({
            name: "LoggingTests: only single message of specific type can be sent within the same page view when session storage is not available",
            test: () => {
                var maxAllowedInternalMessages = 2;
                var id1 = Microsoft.ApplicationInsights._InternalMessageId.BrowserCannotReadLocalStorage;
                var id2 = Microsoft.ApplicationInsights._InternalMessageId.BrowserCannotReadSessionStorage;

                // disable session storage
                var utilCanUseSession = Microsoft.ApplicationInsights.Util.canUseSessionStorage;
                Microsoft.ApplicationInsights.Util.canUseSessionStorage = () => {
                    return false;
                };

                // setup
                this.InternalLogging.enableDebugExceptions = () => false;
                this.InternalLogging.resetInternalMessageCount();
                this.InternalLogging.clearInternalMessageLoggedTypes();

                // act
                // send 4 messages, with 2 distinct types
                this.InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, id1, "1");
                this.InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, id2, "2");
                this.InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, id1, "1");
                this.InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, id2, "2");

                // verify
                // only two messages should be in the queue, because we have to distinct types
                Assert.equal(2, this.InternalLogging.queue.length);
                Assert.equal(this.InternalLogging.queue[0].message, "AI (Internal): BrowserCannotReadLocalStorage message:\"1\"");
                Assert.equal(this.InternalLogging.queue[1].message, "AI (Internal): BrowserCannotReadSessionStorage message:\"2\"");

                // clean up - reset session storage
                Microsoft.ApplicationInsights.Util.canUseSessionStorage = utilCanUseSession;
            }
        });

        this.testCase({
            name: "LoggingTests: throwInternal (user actionable) should call logInternalMessage",
            test: () => {
                var maxAllowedInternalMessages = 2;
                var logInternalMessageStub = this.sandbox.stub(this.InternalLogging, 'logInternalMessage');
                var id1 = Microsoft.ApplicationInsights._InternalMessageId.BrowserCannotReadLocalStorage;

                // setup
                this.InternalLogging.enableDebugExceptions = () => false;
                this.InternalLogging.resetInternalMessageCount();

                // act
                this.InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, id1, "Internal Test Event", null, true);

                // verify
                Assert.ok(logInternalMessageStub.calledOnce, 'logInternalMessage was not called by throwInternal');

            }
        });

        this.testCase({
            name: "LoggingTests: logInternalMessage will log events when the throttle is reset",
            test: () => {
                var maxAllowedInternalMessages = 2;
                var id1 = Microsoft.ApplicationInsights._InternalMessageId.BrowserCannotReadLocalStorage;
                var id2 = Microsoft.ApplicationInsights._InternalMessageId.BrowserCannotReadSessionStorage;
                var id3 = Microsoft.ApplicationInsights._InternalMessageId.BrowserCannotWriteLocalStorage;
                var id4 = Microsoft.ApplicationInsights._InternalMessageId.BrowserCannotWriteSessionStorage;

                // setup
                this.InternalLogging.enableDebugExceptions = () => false;
                this.InternalLogging.setMaxInternalMessageLimit(maxAllowedInternalMessages);
                this.InternalLogging.resetInternalMessageCount();
                this.InternalLogging.clearInternalMessageLoggedTypes();

                // act
                this.InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, id1, "1");
                this.InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, id2, "2", null, true);
                this.InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, id3, "3");
                this.InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, id4, "4", null, true);

                // verify that internal events are throttled
                Assert.equal(this.InternalLogging.queue.length, maxAllowedInternalMessages + 1); // Since we always send one "extra" event to denote that limit was reached

                // act again
                this.clearInternalLoggingQueue();
                // reset the message count
                this.InternalLogging.resetInternalMessageCount();
                this.InternalLogging.clearInternalMessageLoggedTypes();
                // Send some internal messages
                this.InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, id1, "1");
                this.InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, id2, "2");

                // verify again
                Assert.equal(this.InternalLogging.queue.length, maxAllowedInternalMessages + 1); // Since we always send one "extra" event to denote that limit was reached
                Assert.equal(this.InternalLogging.queue[0].message, "AI (Internal): BrowserCannotReadLocalStorage message:\"1\"");
                Assert.equal(this.InternalLogging.queue[1].message, "AI (Internal): BrowserCannotReadSessionStorage message:\"2\"");
            }
        });
    }
}
new LoggingTests().registerTests(); 