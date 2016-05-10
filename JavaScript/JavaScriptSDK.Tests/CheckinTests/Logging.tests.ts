/// <reference path="..\TestFramework\Common.ts" />
/// <reference path="../../JavaScriptSDK/logging.ts" />
/// <reference path="../../javascriptsdk/appinsights.ts" />


class LoggingTests extends TestClass {

    public testCleanup() {
        // Clear the queue
        this.clearInternalLoggingQueue();

        // Reset the internal event throttle
        Microsoft.ApplicationInsights._InternalLogging.resetInternalMessageCount();

        // Reset the internal throttle max limit
        Microsoft.ApplicationInsights._InternalLogging.setMaxInternalMessageLimit(Number.MAX_VALUE);

        // Clear records indicating what internal message types were already logged
        Microsoft.ApplicationInsights._InternalLogging.clearInternalMessageLoggedTypes();
    }

    /**
     * Clears the internal logging queue
     */
    private clearInternalLoggingQueue() {
        var length = Microsoft.ApplicationInsights._InternalLogging.queue.length;
        for (var i = 0; i < length; i++) {
            Microsoft.ApplicationInsights._InternalLogging.queue.shift();
        }
    }

    public registerTests() {
        var InternalLogging = Microsoft.ApplicationInsights._InternalLogging;
        var InternalLoggingMessage = Microsoft.ApplicationInsights._InternalLogMessage;
        InternalLogging.setMaxInternalMessageLimit(Number.MAX_VALUE);

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
                Assert.ok(!InternalLogging.enableDebugExceptions(), "enableDebugExceptions is false by default");

                // act
                InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, new InternalLoggingMessage(++i, "error!"));

                // verify
                Assert.ok(!throwSpy || throwSpy.calledOnce, "console.warn was called instead of throwing while enableDebugExceptions is false");

                // act
                InternalLogging.enableDebugExceptions = () => true;

                // verify
                Assert.throws(() =>
                    InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, new InternalLoggingMessage(++i, "error!")),
                    "error is thrown when enableDebugExceptions is true");
                Assert.ok(!throwSpy || throwSpy.calledOnce, "console.warn was not called when the error was thrown");

                // cleanup
                InternalLogging.enableDebugExceptions = () => false;                
            }
        });

        this.testCase({
            name: "LoggingTests: verboseLogging collects all logs",
            test: () => {
                // setup
                InternalLogging.enableDebugExceptions = () => false;
                InternalLogging.verboseLogging = () => true;

                var i = 2;
                // act
                InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.WARNING, new InternalLoggingMessage(++i, "error!"));
                InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.WARNING, new InternalLoggingMessage(++i, "error!"));
                InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, new InternalLoggingMessage(++i, "error!"));
                InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, new InternalLoggingMessage(++i, "error!"));

                //verify
                Assert.equal(4, InternalLogging.queue.length);
                Assert.equal("AI (Internal): " + "NONUSRACT_BrowserCannotWriteLocalStorage message:\"error!\"", InternalLogging.queue[0].message);
                Assert.equal("AI: " + "NONUSRACT_BrowserCannotWriteSessionStorage message:\"error!\"", InternalLogging.queue[1].message);
                Assert.equal("AI (Internal): " + "NONUSRACT_BrowserFailedRemovalFromLocalStorage message:\"error!\"", InternalLogging.queue[2].message);
                Assert.equal("AI: " + "NONUSRACT_BrowserFailedRemovalFromSessionStorage message:\"error!\"", InternalLogging.queue[3].message);

                // cleanup
                InternalLogging.verboseLogging = () => false;
            }
        });

        this.testCase({
            name: "LoggingTests: Logging only collects CRITICAL logs by default",
            test: () => {
                // setup
                InternalLogging.enableDebugExceptions = () => false;

                var i = 0;
                // act
                InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.WARNING, new InternalLoggingMessage(++i, "error!"));
                InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.WARNING, new InternalLoggingMessage(++i, "error!"));

                Assert.equal(0, InternalLogging.queue.length);
                
                InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, new InternalLoggingMessage(++i, "error!"));
                InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, new InternalLoggingMessage(++i, "error!"));

                //verify
                Assert.equal(2, InternalLogging.queue.length);
                Assert.equal("AI (Internal): " + "NONUSRACT_BrowserCannotWriteLocalStorage message:\"error!\"", InternalLogging.queue[0].message);
                Assert.equal("AI: " + "NONUSRACT_BrowserCannotWriteSessionStorage message:\"error!\"", InternalLogging.queue[1].message);
            }
        });

        this.testCase({
            name: "LoggingTests: throwInternalUserActionable adds to the queue and calls console.warn",
            test: () => {
                // setup
                var throwSpy = null;
                try {
                    throwSpy = this.sandbox.spy(console, "warn");

                    // act
                    var message = new InternalLoggingMessage(1, "error!");
                    InternalLogging.enableDebugExceptions = () => false;
                    InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message);

                    // verify
                    Assert.ok(throwSpy.calledOnce, "console.warn was not called while debug mode was false");
                    Assert.equal(1, InternalLogging.queue.length);
                    Assert.equal("AI: " + "NONUSRACT_BrowserCannotReadLocalStorage message:\"error!\"", InternalLogging.queue[0].message);

                    // cleanup
                    
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
                    throwSpy = this.sandbox.spy(console, "warn");

                    // act
                    var message = new InternalLoggingMessage(1, "error!");
                    InternalLogging.enableDebugExceptions = () => false;
                    InternalLogging.verboseLogging = () => true;
                    InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message);

                    // verify
                    Assert.ok(throwSpy.calledOnce, "console.warn was not called while debug mode was false");

                    Assert.equal(1, InternalLogging.queue.length);
                    Assert.equal("AI (Internal): " + "NONUSRACT_BrowserCannotReadLocalStorage message:\"error!\"", InternalLogging.queue[0].message);

                    // cleanup
                    InternalLogging.verboseLogging = () => false;

                } catch (e) {
                    Assert.ok(true, "IE8 breaks sinon spies on window objects\n" + e.toString());
                }
            }
        });

        this.testCase({
            name: "LoggingTests: throwInternalNonUserActionable does not call console.warn without verboseLogging",
            test: () => {
                // setup
                var throwSpy = null;
                try {
                    throwSpy = this.sandbox.spy(console, "warn");

                    // act
                    var message = new InternalLoggingMessage(1, "error!");
                    InternalLogging.enableDebugExceptions = () => false;
                    InternalLogging.verboseLogging = () => false;
                    InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message);

                    // verify
                    Assert.ok(throwSpy.notCalled, "console.warn was called while verboseLogging mode was false");

                    Assert.equal(1, InternalLogging.queue.length);
                    Assert.equal("AI (Internal): " + "NONUSRACT_BrowserCannotReadLocalStorage message:\"error!\"", InternalLogging.queue[0].message);

                    // cleanup

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
                    InternalLogging.warnToConsole(message);

                    // verify
                    Assert.ok(throwSpy.calledOnce, "console.warn was called once");
                    Assert.equal(0, InternalLogging.queue.length);

                    // cleanup
                    
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
                    InternalLogging.enableDebugExceptions = () => false;
                    InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, new InternalLoggingMessage(1, "error!"));

                    // verify
                    Assert.ok(throwSpy.calledOnce, "console.log was called when console.warn was not present");

                    // cleanup
                    
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

                var i = 0;
                var maxAllowedInternalMessages = 2;
                var message1 = new InternalLoggingMessage(++i, "");
                var message2 = new InternalLoggingMessage(++i, "");
                var message3 = new InternalLoggingMessage(++i, "");
                var message4 = new InternalLoggingMessage(++i, "");
             
                // setup
                InternalLogging.enableDebugExceptions = () => false;
                InternalLogging.setMaxInternalMessageLimit(maxAllowedInternalMessages);
                InternalLogging.resetInternalMessageCount();

                // act
                InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message1);
                InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message2);
                InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message3);
                InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message4);

                // verify
                Assert.equal(maxAllowedInternalMessages + 1, InternalLogging.queue.length); // Since we always send one "extra" event to denote that limit was reached
                Assert.equal(InternalLogging.queue[0], message1);
                Assert.equal(InternalLogging.queue[1], message2);
                Assert.equal(InternalLogging.queue[2].message, "NONUSRACT_MessageLimitPerPVExceeded message:\"Internal events throttle limit per PageView reached for this app.\"");
            }
        });

        this.testCase({
            name: "LoggingTests: throwInternalNonUserActionable should call logInternalMessage",
            test: () => {
                var maxAllowedInternalMessages = 2;
                var message1 = new InternalLoggingMessage(1, "");
                var logInternalMessageStub = this.sandbox.stub(InternalLogging, 'logInternalMessage');

                // setup
                InternalLogging.enableDebugExceptions = () => false;
                InternalLogging.resetInternalMessageCount();

                // act
                InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message1);

                // verify
                Assert.ok(logInternalMessageStub.calledOnce, 'logInternalMessage was not called by throwInternalNonUserActionable');

                // clean
                
            }
        });

        this.testCase({
            name: "LoggingTests: only single message of specific type can be sent within the same session",
            test: () => {
                var maxAllowedInternalMessages = 2;
                var message1 = new InternalLoggingMessage(1, "1");
                var message2 = new InternalLoggingMessage(2, "2");
               

                // setup
                InternalLogging.enableDebugExceptions = () => false;
                InternalLogging.resetInternalMessageCount();
                InternalLogging.clearInternalMessageLoggedTypes();

                // act
                // send 4 messages, with 2 distinct types
                InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message1);
                InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message2);
                InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message1);
                InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message2);

                // verify
                // only two messages should be in the queue, because we have to distinct types
                Assert.equal(2, InternalLogging.queue.length);
                Assert.equal(InternalLogging.queue[0], message1);
                Assert.equal(InternalLogging.queue[1], message2);              
            }
        });
        
        this.testCase({
            name: "LoggingTests: throwInternalUserActionable should call logInternalMessage",
            test: () => {
                var maxAllowedInternalMessages = 2;
                var message = new InternalLoggingMessage(1, "Internal Test Event");
                var logInternalMessageStub = this.sandbox.stub(InternalLogging, 'logInternalMessage');

                // setup
                InternalLogging.enableDebugExceptions = () => false;
                InternalLogging.resetInternalMessageCount();

                // act
                InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message);

                // verify
                Assert.ok(logInternalMessageStub.calledOnce, 'logInternalMessage was not called by throwInternalUserActionable');

                // clean
                
            }
        });

        this.testCase({
            name: "LoggingTests: logInternalMessage will log events when the throttle is reset",
            test: () => {
                var maxAllowedInternalMessages = 2;
                var i = 0;
                var message1 = new InternalLoggingMessage(++i, "1");
                var message2 = new InternalLoggingMessage(++i, "2");
                var message3 = new InternalLoggingMessage(++i, "3");
                var message4 = new InternalLoggingMessage(++i, "4");

                // setup
                InternalLogging.enableDebugExceptions = () => false;
                InternalLogging.setMaxInternalMessageLimit(maxAllowedInternalMessages);
                InternalLogging.resetInternalMessageCount();
                InternalLogging.clearInternalMessageLoggedTypes();

                // act
                InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message1);
                InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message2);
                InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message3);
                InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message4);

                // verify that internal events are throttled
                Assert.equal(InternalLogging.queue.length, maxAllowedInternalMessages + 1); // Since we always send one "extra" event to denote that limit was reached

                // act again
                this.clearInternalLoggingQueue();
                // reset the message count
                InternalLogging.resetInternalMessageCount();
                InternalLogging.clearInternalMessageLoggedTypes();
                // Send some internal messages
                InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message1);
                InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message2);

                // verify again
                Assert.equal(InternalLogging.queue.length, maxAllowedInternalMessages + 1); // Since we always send one "extra" event to denote that limit was reached
                Assert.equal(InternalLogging.queue[0], message1);
                Assert.equal(InternalLogging.queue[1], message2);
            }
        });
    }
}
new LoggingTests().registerTests(); 