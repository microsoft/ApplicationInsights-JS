/// <reference path="..\TestFramework\Common.ts" />
/// <reference path="../../JavaScriptSDK/sender.ts" />
/// <reference path="../../javascriptsdk/appinsights.ts" />

class SenderTests extends TestClass {

    private xhr;
    private xdr;
    private fakeServer;
    private getSender;
    private errorSpy;
    private successSpy;
    private loggingSpy;
    private testTelemetry;
    private endpointUrl: string;
    private emitLineDelimitedJson: boolean;
    private maxBatchSizeInBytes: number;
    private maxBatchInterval: number;
    private disableTelemetry: boolean;

    public testInitialize() {
        this.xhr = sinon.useFakeXMLHttpRequest();
        this.xdr = window["XDomainRequest"];
        this.fakeServer = sinon.fakeServer.create();
        this.endpointUrl = "testUrl";
        this.maxBatchSizeInBytes = 1000000;
        this.maxBatchInterval = 1;
        this.disableTelemetry = false;

        var config: Microsoft.ApplicationInsights.ISenderConfig = {
            endpointUrl: () => this.endpointUrl,
            emitLineDelimitedJson: () => this.emitLineDelimitedJson,
            maxBatchSizeInBytes: () => this.maxBatchSizeInBytes,
            maxBatchInterval: () => this.maxBatchInterval,
            disableTelemetry: () => this.disableTelemetry
        };
          
        this.getSender = () => new Microsoft.ApplicationInsights.Sender(config);
        this.errorSpy = sinon.spy(Microsoft.ApplicationInsights.Sender, "_onError");
        this.successSpy = sinon.stub(Microsoft.ApplicationInsights.Sender, "_onSuccess");
        this.loggingSpy = sinon.stub(Microsoft.ApplicationInsights._InternalLogging, "warnToConsole");
        this.testTelemetry = { aiDataContract: true };
    }

    public testCleanup() {
        if (this.xdr === undefined) {
            delete window["XDomainRequest"];
        } else {
            window["XDomainRequest"] = this.xdr;
        }

        this.errorSpy.restore();
        this.successSpy.restore();
        this.loggingSpy.restore();
    }

    public registerTests() {

        var requestAsserts = () => {
            Assert.ok(this.fakeServer.requests.length > 0, "request was sent");
            var method = this.fakeServer.getHTTPMethod(this.fakeServer.requests[0]);
            Assert.equal("POST", method, "requets method is 'POST'");
        }

        var logAsserts = (expectedCount) => {
            var isValidCallCount = this.loggingSpy.callCount === expectedCount;
            Assert.ok(isValidCallCount, "logging spy was called " + expectedCount + " time(s)");
            if (!isValidCallCount) {
                for (var i = 0; i < this.loggingSpy.args.length; i++) {
                    Assert.ok(false, "[warning thrown]: " + this.loggingSpy.args[i]);
                }
            }
        }

        var successAsserts = () => {
            Assert.ok(this.successSpy.called, "success was invoked");
            Assert.ok(this.errorSpy.notCalled, "no error");
        }

        var errorAsserts = () => {
            Assert.ok(this.errorSpy.called, "error was invoked");
            Assert.ok(this.successSpy.notCalled, "success was not invoked");
        }

        this.testCase({
            name: "SenderTests: uninitialized sender throws a warning when invoked",
            test: () => {
                // act
                var sender: Microsoft.ApplicationInsights.Sender = this.getSender();
                sender.send(this.testTelemetry);

                // verify
                Assert.ok(this.successSpy.notCalled, "success handler was not invoked");
                Assert.ok(this.errorSpy.notCalled, "error handler was not invoked");
                logAsserts(1);
            }
        });

        this.testCase({
            name: "SenderTests: sender throws when no arg is passed",
            test: () => {
                // setup
                XMLHttpRequest = <any>(() => {
                    var xhr = new this.xhr;
                    xhr.withCredentials = false;
                    return xhr;
                });

                // act
                var sender: Microsoft.ApplicationInsights.Sender = this.getSender();
                sender.send(undefined);

                // verify
                Assert.ok(this.successSpy.notCalled, "success handler was not invoked");
                Assert.ok(this.errorSpy.notCalled, "error handler was not invoked");
                logAsserts(1);
            }
        });

        this.testCase({
            name: "SenderTests: XMLHttpRequest sender can be invoked and handles errors",
            test: () => {
                // setup
                XMLHttpRequest = <any>(() => {
                    var xhr = new this.xhr;
                    xhr.withCredentials = false;
                    return xhr;
                });

                // act
                var sender: Microsoft.ApplicationInsights.Sender = this.getSender();

                // verify
                Assert.ok(sender, "sender was constructed");

                // act
                this.fakeServer.requests.pop();
                sender.send(this.testTelemetry);
                this.clock.tick(sender._config.maxBatchInterval());

                // verify
                requestAsserts();
                this.fakeServer.requests.pop().respond(200, { "Content-Type": "application/json" }, '{"test":"success"}"');
                successAsserts();
                logAsserts(0);
                this.successSpy.reset();
                this.errorSpy.reset();

                // act
                this.fakeServer.requests.pop();
                sender.send(this.testTelemetry);
                this.clock.tick(sender._config.maxBatchInterval());

                // verify
                requestAsserts();
                this.fakeServer.requests.pop().respond(404, { "Content-Type": "application/json" }, '{"test":"not found"}"');
                errorAsserts();
                logAsserts(1);
                this.successSpy.reset();
                this.errorSpy.reset();
            }
        });

        this.testCase({
            name: "SenderTests: XDomain sender can be invoked and handles errors",
            test: () => {
                // setup
                XDomainRequest = <any>(() => {
                    var xdr = new this.xhr;
                    xdr.onload = xdr.onreadystatechange;
                    xdr.responseText = 200;
                    return xdr;
                });

                // act
                var sender: Microsoft.ApplicationInsights.Sender = this.getSender();

                // verify
                Assert.ok(sender, "sender was constructed");

                // act
                this.fakeServer.requests.pop();
                sender.send(this.testTelemetry);
                this.clock.tick(sender._config.maxBatchInterval());

                // verify
                requestAsserts();
                this.fakeServer.requests[0].respond(200, { "Content-Type": "application/json" }, '200');
                successAsserts();
                logAsserts(0);
                this.successSpy.reset();
                this.errorSpy.reset();

                // act
                this.fakeServer.requests.pop();
                sender.send(this.testTelemetry);
                this.clock.tick(sender._config.maxBatchInterval());

                // verify
                requestAsserts();
                this.fakeServer.requests[0].respond(404, { "Content-Type": "application/json" }, '400');
                errorAsserts();
                logAsserts(2);
                this.successSpy.reset();
                this.errorSpy.reset();
            }
        });

        this.testCase({
            name: "SenderTests: XMLHttpRequest and XDomainRequest native error handlers are logged",
            test: () => {
                // setup
                var xhr = new this.xhr;
                XMLHttpRequest = <any>(() => {
                    xhr.withCredentials = false;
                    return xhr;
                });

                
                var sender: Microsoft.ApplicationInsights.Sender = this.getSender();
                this.clock.tick(sender._config.maxBatchInterval() + 1);
                sender.send(this.testTelemetry);
                sender.triggerSend();
                xhr.onerror();

                // verify
                errorAsserts();
                this.errorSpy.reset();

                // setup
                var xdr = new this.xhr;
                XMLHttpRequest = <any>(() => {});
                XDomainRequest = <any>(() => {
                    xdr.onload = xdr.onreadystatechange;
                    xdr.responseText = 200;
                    return xdr;
                });

                sender = this.getSender();
                this.clock.tick(sender._config.maxBatchInterval() + 1);
                sender.send(this.testTelemetry);
                sender.triggerSend();
                xdr.onerror();

                // verify
                errorAsserts();
                this.errorSpy.reset();
            }
        });

        this.testCase({
            name: "SenderTests: sender invokes early when the buffer is full",
            test: () => {
                // setup
                var sender: Microsoft.ApplicationInsights.Sender = this.getSender();
                sender._sender = () => null;
                var senderSpy = sinon.spy(sender, "_sender");
                this.maxBatchSizeInBytes = Microsoft.ApplicationInsights.Serializer.serialize(this.testTelemetry).length
                this.maxBatchInterval = 1;
                this.clock.now = 1;

                // act (this will fill the buffer and then overflow to send immediately)
                sender.send(this.testTelemetry);
                sender.send(this.testTelemetry);

                // verify
                Assert.ok(senderSpy.calledOnce, "sender was invoked");

                // act (make sure second message is sent after max interval is reached)
                senderSpy.reset();
                this.clock.tick(sender._config.maxBatchInterval());

                // verify
                Assert.ok(senderSpy.calledOnce, "sender was invoked a second time after maxInterval elapsed");
                logAsserts(0);

                // act (make sure nothing more is sent when max interval is reached)
                senderSpy.reset();
                this.clock.tick(sender._config.maxBatchInterval());

                // verify
                Assert.ok(senderSpy.notCalled, "sender was not invoked a third time after maxInterval elapsed");
                logAsserts(0);

                senderSpy.restore();
            }
        });

        this.testCase({
            name: "SenderTests: sender timeout is reset after each successful send",
            test: () => {
                // setup
                var sender: Microsoft.ApplicationInsights.Sender = this.getSender();
                sender._sender = () => null;
                var senderSpy = sinon.spy(sender, "_sender");
                this.maxBatchSizeInBytes = Microsoft.ApplicationInsights.Serializer.serialize(this.testTelemetry).length;
                this.maxBatchInterval = 1;
                this.clock.now = 1;

                // act (this will fill the buffer once, trigger a send, then refill and overflow)
                Microsoft.ApplicationInsights._InternalLogging.enableDebugExceptions = () => true;
                sender.send(this.testTelemetry);
                sender.send(this.testTelemetry);
                // sender.send(this.testTelemetry); todo: send again here once throttling is re-enabled

                // verify
                Assert.ok(senderSpy.calledOnce, "sender was invoked");
                logAsserts(0);

                senderSpy.restore();
                Microsoft.ApplicationInsights._InternalLogging.enableDebugExceptions = () => false;
            }
        });

        this.testCase({
            name: "SenderTests: sender throttles requests when buffer is filled twice before minInterval has ellapsed",
            test: () => {
                // setup
                var sender: Microsoft.ApplicationInsights.Sender = this.getSender();
                sender._sender = () => null;
                var senderSpy = sinon.spy(sender, "_sender");
                this.maxBatchSizeInBytes = Microsoft.ApplicationInsights.Serializer.serialize(this.testTelemetry).length * 2;
                this.maxBatchInterval = 2;

                // act
                sender.send(this.testTelemetry);
                this.clock.tick(sender._config.maxBatchInterval());
                sender.send(this.testTelemetry);
                this.clock.tick(sender._config.maxBatchInterval());

                // verify
                Assert.ok(senderSpy.calledTwice, "sender was invoked twice");
                logAsserts(0);

                // act (fill buffer, trigger send, refill buffer, wait)
                this.clock.tick(1);
                senderSpy.reset();
                sender.send(this.testTelemetry);
                sender.send(this.testTelemetry);
                sender.send(this.testTelemetry);
                sender.send(this.testTelemetry);
                this.clock.tick(sender._config.maxBatchInterval());

                // verify
                Assert.ok(senderSpy.calledTwice, "sender was invoked twice");
                logAsserts(0);

                senderSpy.restore();
            }
        });

        this.testCase({
            name: "SenderTests: Verify default value of enableTracking is false",
            test: () => {
                // setup
                var sender: Microsoft.ApplicationInsights.Sender = this.getSender();
               
                // verify
                Assert.ok(!sender._config.disableTelemetry(), "default value for disable tracking is false");
                logAsserts(0);
            }
        });

        this.testCase({
            name: "SenderTests: enableTracking switch is set to false.  Sender should not send/save data",
            test: () => {
                // setup
                this.disableTelemetry = true;
                var sender: Microsoft.ApplicationInsights.Sender = this.getSender();
                sender._sender = () => null;
                var senderSpy = sinon.spy(sender, "_sender");
                
                // act
                sender.send(this.testTelemetry);
                this.clock.tick(sender._config.maxBatchInterval());

                // verify
                Assert.ok(senderSpy.notCalled, "sender was not called");
                logAsserts(0);

                senderSpy.restore();
            }
        });

        this.testCase({
            name: "SenderTests: enableTracking switch is set to false.  Trigger send should not send data",
            test: () => {
                // setup
                this.disableTelemetry = true;
                var sender: Microsoft.ApplicationInsights.Sender = this.getSender();
                sender._sender = () => null;
                var senderSpy = sinon.spy(sender, "_sender");
                this.maxBatchInterval = 100;

                // act
                sender.send(this.testTelemetry);
                sender.triggerSend();
                
                // verify
                Assert.ok(senderSpy.notCalled, "sender was not called");
                logAsserts(0);

                senderSpy.restore();
            }
        });

        this.testCase({
            name: "SenderTests: triggerSend should send event data asynchronously by default",
            test: () => {
                // setup
                var sender: Microsoft.ApplicationInsights.Sender = this.getSender();
                sender._sender = () => null;
                var senderSpy = sinon.spy(sender, "_sender");
                this.maxBatchInterval = 100;

                // act
                sender.send(this.testTelemetry);
                sender.triggerSend();
                
                // verify
                Assert.equal(true, senderSpy.getCall(0).args[1], "triggerSend should have called _send with async = true");

                senderSpy.restore();
            }
        });

        this.testCase({
            name: "SenderTests: triggerSend should send event data synchronously when asked to.",
            test: () => {
                // setup
                var sender: Microsoft.ApplicationInsights.Sender = this.getSender();
                sender._sender = () => null;
                var senderSpy = sinon.spy(sender, "_sender");
                this.maxBatchInterval = 100;

                // act
                sender.send(this.testTelemetry);
                sender.triggerSend(false /* async */);
                
                // verify
                Assert.equal(false, senderSpy.getCall(0).args[1], "triggerSend should have called _send with async = false");

                senderSpy.restore();
            }
        });

        this.testCase({
            name: "SenderTests: triggerSend should send event data asynchronously when asked to `explicitly`",
            test: () => {
                // setup
                var sender: Microsoft.ApplicationInsights.Sender = this.getSender();
                sender._sender = () => null;
                var senderSpy = sinon.spy(sender, "_sender");
                this.maxBatchInterval = 100;

                // act
                sender.send(this.testTelemetry);
                sender.triggerSend(true /* async */);
                
                // verify
                Assert.equal(true, senderSpy.getCall(0).args[1], "triggerSend should have called _send with async = true");

                senderSpy.restore();
            }
        });
    }
}

new SenderTests().registerTests(); 