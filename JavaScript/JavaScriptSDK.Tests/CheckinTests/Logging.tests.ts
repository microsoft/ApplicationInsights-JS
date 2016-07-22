/// <reference path="..\TestFramework\Common.ts" />
/// <reference path="../../JavaScriptSDK/logging.ts" />
/// <reference path="../../javascriptsdk/appinsights.ts" />


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
                this.InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, new this.InternalLoggingMessage(++i, "error!"));

                // verify
                Assert.ok(!throwSpy || throwSpy.calledOnce, "console.warn was called instead of throwing while enableDebugExceptions is false");

                // act
                this.InternalLogging.enableDebugExceptions = () => true;

                // verify
                Assert.throws(() =>
                    this.InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, new this.InternalLoggingMessage(++i, "error!")),
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
                this.InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.WARNING, new this.InternalLoggingMessage(++i, "error!"));
                this.InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.WARNING, new this.InternalLoggingMessage(++i, "error!"));
                this.InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, new this.InternalLoggingMessage(++i, "error!"));
                this.InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, new this.InternalLoggingMessage(++i, "error!"));

                //verify
                Assert.equal(4, this.InternalLogging.queue.length);
                Assert.equal("AI (Internal): " + "NONUSRACT_BrowserCannotWriteLocalStorage message:\"error!\"", this.InternalLogging.queue[0].message);
                Assert.equal("AI: " + "NONUSRACT_BrowserCannotWriteSessionStorage message:\"error!\"", this.InternalLogging.queue[1].message);
                Assert.equal("AI (Internal): " + "NONUSRACT_BrowserFailedRemovalFromLocalStorage message:\"error!\"", this.InternalLogging.queue[2].message);
                Assert.equal("AI: " + "NONUSRACT_BrowserFailedRemovalFromSessionStorage message:\"error!\"", this.InternalLogging.queue[3].message);
            }
        });

        this.testCase({
            name: "LoggingTests: Logging only collects CRITICAL logs by default",
            test: () => {
                // setup
                this.InternalLogging.enableDebugExceptions = () => false;

                var i = 0;
                // act
                this.InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.WARNING, new this.InternalLoggingMessage(++i, "error!"));
                this.InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.WARNING, new this.InternalLoggingMessage(++i, "error!"));

                Assert.equal(0, this.InternalLogging.queue.length);
                
                this.InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, new this.InternalLoggingMessage(++i, "error!"));
                this.InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, new this.InternalLoggingMessage(++i, "error!"));

                //verify
                Assert.equal(2, this.InternalLogging.queue.length);
                Assert.equal("AI (Internal): " + "NONUSRACT_BrowserCannotWriteLocalStorage message:\"error!\"", this.InternalLogging.queue[0].message);
                Assert.equal("AI: " + "NONUSRACT_BrowserCannotWriteSessionStorage message:\"error!\"", this.InternalLogging.queue[1].message);
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
                    var message = new this.InternalLoggingMessage(1, "error!");
                    this.InternalLogging.enableDebugExceptions = () => false;
                    this.InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message);

                    // verify
                    Assert.ok(throwSpy.calledOnce, "console.warn was not called while debug mode was false");
                    Assert.equal(1, this.InternalLogging.queue.length);
                    Assert.equal("AI: " + "NONUSRACT_BrowserCannotReadLocalStorage message:\"error!\"", this.InternalLogging.queue[0].message);
                    
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
                    var message = new this.InternalLoggingMessage(1, "error!");
                    this.InternalLogging.enableDebugExceptions = () => false;
                    this.InternalLogging.verboseLogging = () => true;
                    this.InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message);

                    // verify
                    Assert.ok(throwSpy.calledOnce, "console.warn was not called while debug mode was false");

                    Assert.equal(1, this.InternalLogging.queue.length);
                    Assert.equal("AI (Internal): " + "NONUSRACT_BrowserCannotReadLocalStorage message:\"error!\"", this.InternalLogging.queue[0].message);

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
                    var message = new this.InternalLoggingMessage(1, "error!");
                    this.InternalLogging.enableDebugExceptions = () => false;
                    this.InternalLogging.verboseLogging = () => false;
                    this.InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message);

                    // verify
                    Assert.ok(throwSpy.notCalled, "console.warn was called while verboseLogging mode was false");

                    Assert.equal(1, this.InternalLogging.queue.length);
                    Assert.equal("AI (Internal): " + "NONUSRACT_BrowserCannotReadLocalStorage message:\"error!\"", this.InternalLogging.queue[0].message);

                } catch (e) {
                    Assert.ok(true, "IE8 breaks sinon spies on window objects\n" + e.toString());
                }
            }
        });

        this.testCase({
            name: "LoggingTests: throwInternalUserActionable logs only one message of a given type to console (without verboseLogging)",
            test: () => {
                // setup
                var throwSpy = null;
                try {
                    throwSpy = this.sandbox.spy(console, "warn");
                    this.InternalLogging.enableDebugExceptions = () => false;
                    this.InternalLogging.verboseLogging = () => false;

                    var message1 = new this.InternalLoggingMessage(1, "error!");
                    var message2 = new this.InternalLoggingMessage(2, "error 2!");

                    // act
                    // send 4 messages, with 2 distinct types
                    this.InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message1);
                    this.InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message2);
                    this.InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message1);
                    this.InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message2);

                    // verify
                    Assert.ok(throwSpy.calledTwice, "console.warn was called only once per each message type");

                } catch (e) {
                    Assert.ok(true, "IE8 breaks sinon spies on window objects\n" + e.toString());
                }
            }
        });

        this.testCase({
            name: "LoggingTests: throwInternalUserActionable always log to console with verbose logging",
            test: () => {
                // setup
                var throwSpy = null;
                try {
                    throwSpy = this.sandbox.spy(console, "warn");
                    this.InternalLogging.enableDebugExceptions = () => false;
                    this.InternalLogging.verboseLogging = () => true;

                    var message1 = new this.InternalLoggingMessage(1, "error!");
                    var message2 = new this.InternalLoggingMessage(2, "error 2!");

                    // act
                    // send 4 messages, with 2 distinct types
                    this.InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message1);
                    this.InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message2);
                    this.InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message1);
                    this.InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message2);

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
                    this.InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, new this.InternalLoggingMessage(1, "error!"));

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

                var i = 0;
                var maxAllowedInternalMessages = 2;
                var message1 = new this.InternalLoggingMessage(++i, "");
                var message2 = new this.InternalLoggingMessage(++i, "");
                var message3 = new this.InternalLoggingMessage(++i, "");
                var message4 = new this.InternalLoggingMessage(++i, "");
             
                // setup
                this.InternalLogging.enableDebugExceptions = () => false;
                this.InternalLogging.setMaxInternalMessageLimit(maxAllowedInternalMessages);
                this.InternalLogging.resetInternalMessageCount();

                // act
                this.InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message1);
                this.InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message2);
                this.InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message3);
                this.InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message4);

                // verify
                Assert.equal(maxAllowedInternalMessages + 1, this.InternalLogging.queue.length); // Since we always send one "extra" event to denote that limit was reached
                Assert.equal(this.InternalLogging.queue[0], message1);
                Assert.equal(this.InternalLogging.queue[1], message2);
                Assert.equal(this.InternalLogging.queue[2].message, "NONUSRACT_MessageLimitPerPVExceeded message:\"Internal events throttle limit per PageView reached for this app.\"");
            }
        });

        this.testCase({
            name: "LoggingTests: throwInternalNonUserActionable should call logInternalMessage",
            test: () => {
                var maxAllowedInternalMessages = 2;
                var message1 = new this.InternalLoggingMessage(1, "");
                var logInternalMessageStub = this.sandbox.stub(this.InternalLogging, 'logInternalMessage');

                // setup
                this.InternalLogging.enableDebugExceptions = () => false;
                this.InternalLogging.resetInternalMessageCount();

                // act
                this.InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message1);

                // verify
                Assert.ok(logInternalMessageStub.calledOnce, 'logInternalMessage was not called by throwInternalNonUserActionable');
                
            }
        });

        this.testCase({
            name: "LoggingTests: only single message of specific type can be sent within the same session",
            test: () => {
                var maxAllowedInternalMessages = 2;
                var message1 = new this.InternalLoggingMessage(1, "1");
                var message2 = new this.InternalLoggingMessage(2, "2");

                // setup
                this.InternalLogging.enableDebugExceptions = () => false;
                this.InternalLogging.resetInternalMessageCount();
                this.InternalLogging.clearInternalMessageLoggedTypes();

                // act
                // send 4 messages, with 2 distinct types
                this.InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message1);
                this.InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message2);
                this.InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message1);
                this.InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message2);

                // verify
                // only two messages should be in the queue, because we have to distinct types
                Assert.equal(2, this.InternalLogging.queue.length);
                Assert.equal(this.InternalLogging.queue[0], message1);
                Assert.equal(this.InternalLogging.queue[1], message2);              
            }
        });

        this.testCase({
            name: "LoggingTests: only single message of specific type can be sent within the same page view when session storage is not available",
            test: () => {
                var maxAllowedInternalMessages = 2;
                var message1 = new this.InternalLoggingMessage(1, "1");
                var message2 = new this.InternalLoggingMessage(2, "2");

                // disable session storage
                var utilCanUserSession = Microsoft.ApplicationInsights.Util.canUseSessionStorage;
                Microsoft.ApplicationInsights.Util.canUseSessionStorage = () => {
                    return false;
                };

                // setup
                this.InternalLogging.enableDebugExceptions = () => false;
                this.InternalLogging.resetInternalMessageCount();
                this.InternalLogging.clearInternalMessageLoggedTypes();

                // act
                // send 4 messages, with 2 distinct types
                this.InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message1);
                this.InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message2);
                this.InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message1);
                this.InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message2);

                // verify
                // only two messages should be in the queue, because we have to distinct types
                Assert.equal(2, this.InternalLogging.queue.length);
                Assert.equal(this.InternalLogging.queue[0], message1);
                Assert.equal(this.InternalLogging.queue[1], message2);

                // clean up - reset session storage
                Microsoft.ApplicationInsights.Util.canUseSessionStorage = utilCanUserSession;
            }
        });
        
        this.testCase({
            name: "LoggingTests: throwInternalUserActionable should call logInternalMessage",
            test: () => {
                var maxAllowedInternalMessages = 2;
                var message = new this.InternalLoggingMessage(1, "Internal Test Event");
                var logInternalMessageStub = this.sandbox.stub(this.InternalLogging, 'logInternalMessage');

                // setup
                this.InternalLogging.enableDebugExceptions = () => false;
                this.InternalLogging.resetInternalMessageCount();

                // act
                this.InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message);

                // verify
                Assert.ok(logInternalMessageStub.calledOnce, 'logInternalMessage was not called by throwInternalUserActionable');
                
            }
        });

        this.testCase({
            name: "LoggingTests: logInternalMessage will log events when the throttle is reset",
            test: () => {
                var maxAllowedInternalMessages = 2;
                var i = 0;
                var message1 = new this.InternalLoggingMessage(++i, "1");
                var message2 = new this.InternalLoggingMessage(++i, "2");
                var message3 = new this.InternalLoggingMessage(++i, "3");
                var message4 = new this.InternalLoggingMessage(++i, "4");

                // setup
                this.InternalLogging.enableDebugExceptions = () => false;
                this.InternalLogging.setMaxInternalMessageLimit(maxAllowedInternalMessages);
                this.InternalLogging.resetInternalMessageCount();
                this.InternalLogging.clearInternalMessageLoggedTypes();

                // act
                this.InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message1);
                this.InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message2);
                this.InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message3);
                this.InternalLogging.throwInternalUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message4);

                // verify that internal events are throttled
                Assert.equal(this.InternalLogging.queue.length, maxAllowedInternalMessages + 1); // Since we always send one "extra" event to denote that limit was reached

                // act again
                this.clearInternalLoggingQueue();
                // reset the message count
                this.InternalLogging.resetInternalMessageCount();
                this.InternalLogging.clearInternalMessageLoggedTypes();
                // Send some internal messages
                this.InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message1);
                this.InternalLogging.throwInternalNonUserActionable(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, message2);

                // verify again
                Assert.equal(this.InternalLogging.queue.length, maxAllowedInternalMessages + 1); // Since we always send one "extra" event to denote that limit was reached
                Assert.equal(this.InternalLogging.queue[0], message1);
                Assert.equal(this.InternalLogging.queue[1], message2);
            }
        });
    }
}
new LoggingTests().registerTests(); 