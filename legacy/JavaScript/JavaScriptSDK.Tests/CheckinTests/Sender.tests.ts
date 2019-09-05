/// <reference path="../TestFramework/Common.ts" />
/// <reference path="../../JavaScriptSDK/Util.ts"/>
/// <reference path="../../JavaScriptSDK/Sender.ts" />
/// <reference path="../../JavaScriptSDK/SendBuffer.ts"/>
/// <reference path="../../JavaScriptSDK/AppInsights.ts" />
/// <reference path="../../JavaScriptSDK/Util.ts" />

class SenderWrapper extends Microsoft.ApplicationInsights.Sender {
    errorSpy: SinonSpy;
    successSpy: SinonSpy;
    partialSpy: SinonSpy;

    beaconStub: SinonStub;
}

class SenderTests extends TestClass {

    private xhr;
    private xdr;
    private fakeServer: SinonFakeServer;
    private getSender: () => SenderWrapper;
    private loggingSpy: SinonStub;
    private testTelemetry;
    private endpointUrl: string;
    private emitLineDelimitedJson: boolean;
    private maxBatchSizeInBytes: number;
    private maxBatchInterval: number;
    private disableTelemetry: boolean;
    private requests;

    public testInitialize() {
        if (Microsoft.ApplicationInsights.Util.canUseSessionStorage()) {
            sessionStorage.clear();
        }

        this.requests = [];
        this.xhr = sinon.useFakeXMLHttpRequest();
        this.xdr = sinon.useFakeXMLHttpRequest();
        this.fakeServer = sinon.fakeServer.create();
        this.endpointUrl = "testUrl";
        this.maxBatchSizeInBytes = 1000000;
        this.maxBatchInterval = 1;
        this.disableTelemetry = false;

        var config = this.getDefaultConfig();

        this.getSender = () => {
            var sender = <SenderWrapper>new Microsoft.ApplicationInsights.Sender(config);

            sender.errorSpy = this.sandbox.spy(sender, "_onError");
            sender.successSpy = this.sandbox.spy(sender, "_onSuccess");
            sender.partialSpy = this.sandbox.spy(sender, "_onPartialSuccess");

            return sender;
        }

        this.loggingSpy = this.sandbox.stub(Microsoft.ApplicationInsights._InternalLogging, "warnToConsole");
        this.testTelemetry = { aiDataContract: true };

        Microsoft.ApplicationInsights._InternalLogging.verboseLogging = () => true;
    }

    public testCleanup() {
        // reset enableDebugger to a default value
        Microsoft.ApplicationInsights._InternalLogging.enableDebugExceptions = () => false;
        this.loggingSpy.reset();

        // clear session storage buffers
        Microsoft.ApplicationInsights.Util.setSessionStorage(Microsoft.ApplicationInsights.SessionStorageSendBuffer.BUFFER_KEY, null);
        Microsoft.ApplicationInsights.Util.setSessionStorage(Microsoft.ApplicationInsights.SessionStorageSendBuffer.SENT_BUFFER_KEY, null);
    }

    private requestAsserts() {
        Assert.ok(this.fakeServer.requests.length > 0, "request was sent");
        var method = this.fakeServer.getHTTPMethod(this.fakeServer.requests[0]);
        Assert.equal("POST", method, "requets method is 'POST'");
    };

    private logAsserts(expectedCount, expectedMessage?: string) {
        var isValidCallCount = this.loggingSpy.callCount === expectedCount;
        Assert.ok(isValidCallCount, "logging spy was called " + expectedCount + " time(s)");
        if (!isValidCallCount) {
            for (var i = 0; i < this.loggingSpy.args.length; i++) {
                Assert.ok(false, "[warning thrown]: " + this.loggingSpy.args[i]);
            }
        }
        if (expectedMessage) {
            Assert.ok(this.loggingSpy.args[0][0].indexOf(expectedMessage) !== -1);
        }
    }

    private successAsserts(sender: any) {
        Assert.ok(sender.successSpy.called, "success was invoked");
        Assert.ok(sender.errorSpy.notCalled, "no error");
    }

    private errorAsserts(sender: any) {
        Assert.ok(sender.errorSpy.called, "error was invoked");
        Assert.ok(sender.successSpy.notCalled, "success was not invoked");
    }

    public registerTests() {

        this.testCase({
            name: "SenderTests: uninitialized sender throws a warning when invoked",
            test: () => {
                // setup
                XMLHttpRequest = undefined;
                var sender = this.getSender();

                // act
                sender.send(this.testTelemetry);

                // verify
                Assert.ok(sender.successSpy.notCalled, "success handler was not invoked");
                Assert.ok(sender.errorSpy.notCalled, "error handler was not invoked");
                this.logAsserts(1);
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
                var sender = this.getSender();
                sender.send(undefined);

                // verify
                Assert.ok(sender.successSpy.notCalled, "success handler was not invoked");
                Assert.ok(sender.errorSpy.notCalled, "error handler was not invoked");
                this.logAsserts(1);
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
                var sender = this.getSender();

                // verify
                Assert.ok(sender, "sender was constructed");

                // act
                this.fakeServer.requests.pop();
                sender.send(this.testTelemetry);
                this.clock.tick(sender._config.maxBatchInterval());

                // verify
                this.requestAsserts();
                this.fakeServer.requests.pop().respond(200, { "Content-Type": "application/json" }, '{"itemsReceived": 1, "itemsAccepted": 1, "errors": []}');
                this.successAsserts(sender);
                this.logAsserts(0);
                sender.successSpy.reset();
                sender.errorSpy.reset();

                // act
                this.fakeServer.requests.pop();
                sender.send(this.testTelemetry);
                this.clock.tick(sender._config.maxBatchInterval());

                // verify
                this.requestAsserts();
                this.fakeServer.requests[0].respond(404, { "Content-Type": "application/json" }, '{"itemsReceived": 1, "itemsAccepted": 0, "errors": [{ "index": 0, "statusCode": 404, "message": "Not found" }]}');
                this.errorAsserts(sender);
                this.logAsserts(1, "message:XMLHttpRequest,Status:404");
                sender.successSpy.reset();
                sender.errorSpy.reset();
            }
        });

        this.testCase({
            name: "SenderTests: XMLHttpRequest sender adds SDK-Context header for AI internal URLs",
            test: () => {
                this.endpointUrl = "https://dc.services.visualstudio.com/v2/track";

                // setup
                var headersSpy: SinonSpy;
                XMLHttpRequest = <any>(() => {
                    var xhr = new this.xhr;
                    xhr.withCredentials = false;
                    headersSpy = this.sandbox.spy(xhr, "setRequestHeader");
                    return xhr;
                });
                
                // act
                var sender = this.getSender();
                this.fakeServer.requests.pop();
                sender.send(this.testTelemetry);
                this.clock.tick(sender._config.maxBatchInterval());

                // verify
                Assert.equal(2, headersSpy.callCount);
                Assert.ok(headersSpy.calledWith("Sdk-Context"));
                
                this.logAsserts(0);
                sender.successSpy.reset();
                sender.errorSpy.reset();
            }
        });

        this.testCase({
            name: "SenderTests: XMLHttpRequest sender doesn't add SDK-Context header for non AI internal URLs",
            test: () => {
                this.endpointUrl = "https://external.endpoint/v2/track";
                // setup
                var headersSpy: SinonSpy;
                XMLHttpRequest = <any>(() => {
                    var xhr = new this.xhr;
                    xhr.withCredentials = false;
                    headersSpy = this.sandbox.spy(xhr, "setRequestHeader");
                    return xhr;
                });
                
                // act
                var sender = this.getSender();
                this.fakeServer.requests.pop();
                sender.send(this.testTelemetry);
                this.clock.tick(sender._config.maxBatchInterval());

                // verify
                Assert.equal(1, headersSpy.callCount);
                Assert.ok(!headersSpy.calledWith("Sdk-Context"));
                
                this.logAsserts(0);
                sender.successSpy.reset();
                sender.errorSpy.reset();
            }
        });


        this.testCase({
            name: "SenderTests: XDomain sender can be invoked and handles errors",
            test: () => {
                // setup
                // pretend that you are IE8/IE9 browser which supports XDomainRequests
                XMLHttpRequest = <any>(() => {
                    var xhr = new this.xhr;
                    delete xhr.withCredentials;
                    return xhr;
                });

                window["XDomainRequest"] = <any>(() => {
                    var xdr = new this.xhr;
                    xdr.onload = xdr.onreadystatechange;
                    xdr.responseText = 200;
                    return xdr;
                });

                // act
                var sender = this.getSender();
                sender._config.endpointUrl = () => window.location.protocol + "//fakeEndpoint";

                // verify
                Assert.ok(sender, "sender was constructed");

                // act
                this.fakeServer.requests.pop();
                sender.send(this.testTelemetry);
                this.clock.tick(sender._config.maxBatchInterval());

                // verify
                this.requestAsserts();
                this.fakeServer.requests[0].respond(200, { "Content-Type": "application/json" }, '200');
                this.successAsserts(sender);
                this.logAsserts(0);
                sender.successSpy.reset();
                sender.errorSpy.reset();

                // act
                this.fakeServer.requests.pop();
                sender.send(this.testTelemetry);
                this.clock.tick(sender._config.maxBatchInterval());

                // verify
                this.requestAsserts();
                this.fakeServer.requests[0].respond(404, { "Content-Type": "application/json" }, '{ "itemsReceived": 1, "itemsAccepted": 0, "errors": [{ "index": 0, "statusCode": 404, "message": "Not found" }]}');
                this.errorAsserts(sender);
                this.logAsserts(1, "message:partial success 0 of 1");
                sender.successSpy.reset();
                sender.errorSpy.reset();
            }
        });

        this.testCase({
            name: "SenderTests: XDomain will drop the telemetry if the Endpoint protocol doesn't match the hosting page protocol",
            test: () => {
                // setup
                // pretend that you are IE8/IE9 browser which supports XDomainRequests
                XMLHttpRequest = <any>(() => {
                    var xhr = new this.xhr;
                    delete xhr.withCredentials;
                    return xhr;
                });

                window["XDomainRequest"] = <any>(() => {
                    var xdr = new this.xhr;
                    xdr.onload = xdr.onreadystatechange;
                    xdr.responseText = 206;
                    return xdr;
                });

                // act
                var config = this.getDefaultConfig();
                config.endpointUrl = () => "fake://example.com";

                var sender = <SenderWrapper>new Microsoft.ApplicationInsights.Sender(config);

                this.fakeServer.requests.pop();
                sender.errorSpy = this.sandbox.spy(sender, "_onError");
                sender.successSpy = this.sandbox.spy(sender, "_onSuccess");
                sender.partialSpy = this.sandbox.spy(sender, "_onPartialSuccess");

                Assert.equal(0, this.fakeServer.requests.length, "request was not sent");
                Assert.ok(sender.errorSpy.notCalled, "error not called");
                Assert.ok(sender.successSpy.notCalled, "success not called");
                Assert.ok(sender.partialSpy.notCalled, "partial not called");

                Assert.equal(sender._buffer.count(), 0, "buffer should be empty");
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


                var sender = this.getSender();
                this.clock.tick(sender._config.maxBatchInterval() + 1);
                sender.send(this.testTelemetry);
                sender.triggerSend();
                xhr.onerror();

                // verify
                this.errorAsserts(sender);
                sender.errorSpy.reset();

                // setup
                var xdr = new this.xhr;
                XMLHttpRequest = <any>(() => { });
                window["XDomainRequest"] = <any>(() => {
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
                this.errorAsserts(sender);
                sender.errorSpy.reset();
            }
        });

        this.testCase({
            name: "SenderTests: sender invokes early when the buffer is full",
            test: () => {
                // setup
                var sender = this.getSender();
                sender._sender = () => null;
                var senderSpy = this.sandbox.spy(sender, "_sender");
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
                this.logAsserts(0);

                // act (make sure nothing more is sent when max interval is reached)
                senderSpy.reset();
                this.clock.tick(sender._config.maxBatchInterval());

                // verify
                Assert.ok(senderSpy.notCalled, "sender was not invoked a third time after maxInterval elapsed");
                this.logAsserts(0);
            }
        });

        this.testCase({
            name: "SenderTests: sender timeout is reset after each successful send",
            test: () => {
                // setup
                var sender = this.getSender();
                sender._sender = () => null;
                var senderSpy = this.sandbox.spy(sender, "_sender");
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
                this.logAsserts(0);
            }
        });

        this.testCase({
            name: "SenderTests: sender throttles requests when buffer is filled twice before minInterval has ellapsed",
            test: () => {
                // setup
                var sender = this.getSender();
                sender._sender = () => null;
                var senderSpy = this.sandbox.spy(sender, "_sender");
                this.maxBatchSizeInBytes = Microsoft.ApplicationInsights.Serializer.serialize(this.testTelemetry).length * 2 + 3; // +3 for "[],"
                this.maxBatchInterval = 2;

                // act
                sender.send(this.testTelemetry);
                this.clock.tick(sender._config.maxBatchInterval());
                sender.send(this.testTelemetry);
                this.clock.tick(sender._config.maxBatchInterval());

                // verify
                Assert.ok(senderSpy.calledTwice, "sender was invoked twice");
                this.logAsserts(0);
                sender._buffer.clear();

                // act (fill buffer, trigger send, refill buffer, wait)
                this.clock.tick(1);
                senderSpy.reset();
                sender.send(this.testTelemetry);
                sender.send(this.testTelemetry);
                sender.send(this.testTelemetry);
                sender._buffer.clear();
                sender.send(this.testTelemetry);
                sender.send(this.testTelemetry);
                sender.send(this.testTelemetry);

                // verify
                Assert.ok(senderSpy.calledTwice, "sender was invoked twice");
                this.logAsserts(0);
            }
        });

        this.testCase({
            name: "SenderTests: Verify default value of enableTracking is false",
            test: () => {
                // setup
                var sender: Microsoft.ApplicationInsights.Sender = this.getSender();

                // verify
                Assert.ok(!sender._config.disableTelemetry(), "default value for disable tracking is false");
                this.logAsserts(0);
            }
        });

        this.testCase({
            name: "SenderTests: enableTracking switch is set to false.  Sender should not send/save data",
            test: () => {
                // setup
                this.disableTelemetry = true;
                var sender = this.getSender();
                sender._sender = () => null;
                var senderSpy = this.sandbox.spy(sender, "_sender");

                // act
                sender.send(this.testTelemetry);
                this.clock.tick(sender._config.maxBatchInterval());

                // verify
                Assert.ok(senderSpy.notCalled, "sender was not called");
                this.logAsserts(0);
            }
        });

        this.testCase({
            name: "SenderTests: enableTracking switch is set to false.  Trigger send should not send data",
            test: () => {
                // setup
                this.disableTelemetry = true;
                var sender = this.getSender();
                sender._sender = () => null;
                var senderSpy = this.sandbox.spy(sender, "_sender");
                this.maxBatchInterval = 100;

                // act
                sender.send(this.testTelemetry);
                sender.triggerSend();

                // verify
                Assert.ok(senderSpy.notCalled, "sender was not called");
                this.logAsserts(0);
            }
        });

        this.testCase({
            name: "SenderTests: triggerSend should send event data asynchronously by default",
            test: () => {
                // setup
                var sender = this.getSender();
                sender._sender = () => null;
                var senderSpy = this.sandbox.spy(sender, "_sender");
                this.maxBatchInterval = 100;

                // act
                sender.send(this.testTelemetry);
                sender.triggerSend();

                // verify
                Assert.equal(true, senderSpy.getCall(0).args[1], "triggerSend should have called _send with async = true");
            }
        });

        this.testCase({
            name: "SenderTests: triggerSend should send event data synchronously when asked to.",
            test: () => {
                // setup
                var sender = this.getSender();
                sender._sender = () => null;
                var senderSpy = this.sandbox.spy(sender, "_sender");
                this.maxBatchInterval = 100;

                // act
                sender.send(this.testTelemetry);
                sender.triggerSend(false /* async */);

                // verify
                Assert.equal(false, senderSpy.getCall(0).args[1], "triggerSend should have called _send with async = false");
            }
        });

        this.testCase({
            name: "SenderTests: triggerSend should send event data asynchronously when asked to `explicitly`",
            test: () => {
                // setup
                var sender = this.getSender();
                sender._sender = () => null;
                var senderSpy = this.sandbox.spy(sender, "_sender");
                this.maxBatchInterval = 100;

                // act
                sender.send(this.testTelemetry);
                sender.triggerSend(true /* async */);

                // verify
                Assert.equal(true, senderSpy.getCall(0).args[1], "triggerSend should have called _send with async = true");
            }
        });

        // TODO: move DataLossAnalyzer tests to a separate class
        /*this.testCase({
            name: "SenderTests: data loss analyzer - send(item), queued, sent; result 0",
            test: () => {
                // setup
                this.setupDataLossAnalyzer();
                var sender = this.getSender();
                this.fakeServer.requests.pop(); // xhr was created inside Sender's constructor, removing it to avoid confusion
                var senderSpy = this.sandbox.spy(sender, "_sender");

                // act
                sender.send(this.testTelemetry);
                sender.triggerSend();
                this.fakeServer.requests[0].respond(200, {}, "");

                // Validate
                Assert.equal(0, Microsoft.ApplicationInsights.DataLossAnalyzer.getNumberOfLostItems());
            }
        });

        this.testCase({
            name: "SenderTests: data loss analyzer - send(item), queued, send(item), queued, sent; result 0",
            test: () => {
                // setup
                this.setupDataLossAnalyzer();
                var sender = this.getSender();
                this.fakeServer.requests.pop(); // xhr was created inside Sender's constructor, removing it to avoid confusion
                var senderSpy = this.sandbox.spy(sender, "_sender");

                // act
                sender.send(this.testTelemetry);
                sender.send(this.testTelemetry);
                sender.triggerSend();
                this.fakeServer.requests[0].respond(200, {}, "");

                // Validate
                Assert.equal(0, Microsoft.ApplicationInsights.DataLossAnalyzer.getNumberOfLostItems());
            }
        });

        this.testCase({
            name: "SenderTests: data loss analyzer - send(item), queued, sent, send(item), leave; result 1",
            test: () => {
                // setup
                this.setupDataLossAnalyzer();
                var sender = this.getSender();
                this.fakeServer.requests.pop(); // xhr was created inside Sender's constructor, removing it to avoid confusion
                var senderSpy = this.sandbox.spy(sender, "_sender");

                // act
                sender.send(this.testTelemetry);
                sender.triggerSend();
                this.fakeServer.requests[0].respond(200, {}, "");
                sender.send(this.testTelemetry);

                // Validate
                Assert.equal(1, Microsoft.ApplicationInsights.DataLossAnalyzer.getNumberOfLostItems());
            }
        });

        this.testCase({
            name: "SenderTests: data loss analyzer - send(item), queued, post failed; result 1",
            test: () => {
                // setup
                this.setupDataLossAnalyzer();
                var sender = this.getSender();
                this.fakeServer.requests.pop(); // xhr was created inside Sender's constructor, removing it to avoid confusion
                var senderSpy = this.sandbox.spy(sender, "_sender");

                // act
                sender.send(this.testTelemetry);
                sender.triggerSend();
                this.fakeServer.requests[0].respond(400, {}, "");

                // Validate
                Assert.equal(1, Microsoft.ApplicationInsights.DataLossAnalyzer.getNumberOfLostItems());
            }
        });

        this.testCase({
            name: "SenderTests: data loss analyzer is disabled for XDomainRequest",
            test: () => {
                // setup
                Microsoft.ApplicationInsights.DataLossAnalyzer.enabled = true;
                Microsoft.ApplicationInsights.DataLossAnalyzer.appInsights = <any>{ trackTrace: (message) => { }, flush: () => { }, context: { _sender: { _XMLHttpRequestSupported: false } } };
                var sender = this.getSender();
                this.fakeServer.requests.pop(); // xDomainRequest was created inside Sender's constructor, removing it to avoid confusion
                var senderSpy = this.sandbox.spy(sender, "_sender");

                // act
                sender.send(this.testTelemetry);
                sender.triggerSend();
                this.fakeServer.requests[0].respond(400, {}, "");

                // Validate
                Assert.equal(0, Microsoft.ApplicationInsights.DataLossAnalyzer.getNumberOfLostItems());
            }
        });*/

        this.testCase({
            name: "SenderTests: use Array buffer by default",
            test: () => {
                // setup
                var config = this.getDefaultConfig();
                config.enableSessionStorageBuffer = () => false;

                // act
                var sender = new Microsoft.ApplicationInsights.Sender(config);

                // Validate
                Assert.ok(sender._buffer instanceof Microsoft.ApplicationInsights.ArraySendBuffer, "sender should use Array buffer by default");
            }
        });

        this.testCase({
            name: "SenderTests: use SessionStorageBuffer when enableSessionStorageBuffer is true",
            test: () => {
                // setup
                var config = this.getDefaultConfig();
                config.enableSessionStorageBuffer = () => true;

                // act
                var sender = new Microsoft.ApplicationInsights.Sender(config);

                // Validate
                Assert.ok(sender._buffer instanceof Microsoft.ApplicationInsights.SessionStorageSendBuffer, "sender should use SessionStorage buffer");
            }
        });

        this.testCase({
            name: "SenderTests: does not use SessionStorageBuffer when enableSessionStorageBuffer is true and SessionStorage is not supported",
            test: () => {
                var utilCanUseSession = Microsoft.ApplicationInsights.Util.canUseSessionStorage;

                // setup
                var config = this.getDefaultConfig();
                config.enableSessionStorageBuffer = () => true;

                Microsoft.ApplicationInsights.Util.canUseSessionStorage = () => {
                    return false;
                };

                // act
                var sender = new Microsoft.ApplicationInsights.Sender(config);

                // Validate
                Assert.ok(sender._buffer instanceof Microsoft.ApplicationInsights.ArraySendBuffer, "sender should use Array buffer");

                // clean up
                Microsoft.ApplicationInsights.Util.canUseSessionStorage = utilCanUseSession;
            }
        });

        this.testCase({
            name: "SenderTests: XMLHttpRequest sender retries on retriable response code from the backend.",
            test: () => {
                // setup
                XMLHttpRequest = <any>(() => {
                    var xhr = new this.xhr;
                    xhr.withCredentials = false;
                    return xhr;
                });

                var retriableResponses = [408, 429, 500, 503];

                retriableResponses.forEach(statusCode => {
                    var sender = this.getSender();
                    Assert.ok(sender, "sender was constructed. Testing response code: " + statusCode);

                    // send two items
                    this.fakeServer.requests.pop();
                    sender.send(this.testTelemetry);
                    sender.send(this.testTelemetry);

                    Assert.equal(2, sender._buffer.count(), "Buffer has two items");

                    // trigger send
                    this.clock.tick(sender._config.maxBatchInterval());

                    this.requestAsserts();
                    this.fakeServer.requests.pop().respond(
                        statusCode,
                        { "Content-Type": "application/json" },
                        // response with retriable status code
                        '{ "itemsReceived": 2, "itemsAccepted": 0, "errors": [{ "index": 0, "statusCode": 408, "message": "error" }, { "index": 1, "statusCode": 408, "message": "error" }] }'
                    );

                    // verify
                    Assert.ok(sender.successSpy.notCalled, "success was not invoked");
                    Assert.ok(sender.errorSpy.notCalled, "error was not invoked");

                    this.logAsserts(1);
                    Assert.equal(2, sender._buffer.count(), "Buffer has 2 items to retry.");

                    // validate session storage buffers
                    var buffer: string[] = JSON.parse(Microsoft.ApplicationInsights.Util.getSessionStorage(Microsoft.ApplicationInsights.SessionStorageSendBuffer.BUFFER_KEY));
                    var sentBuffer: string[] = JSON.parse(Microsoft.ApplicationInsights.Util.getSessionStorage(Microsoft.ApplicationInsights.SessionStorageSendBuffer.SENT_BUFFER_KEY));

                    Assert.equal(2, buffer.length, "Session storage buffer has 2 items");
                    Assert.equal(0, sentBuffer.length, "Session storage sent buffer is empty");

                    // clean up
                    this.testCleanup();
                });
            }
        });

        this.testCase({
            name: "SenderTests: XMLHttpRequest sender successfully parses appId from the response.",
            test: () => {
                // setup
                XMLHttpRequest = <any>(() => {
                    var xhr = new this.xhr;
                    xhr.withCredentials = false;
                    return xhr;
                });

                var sender = this.getSender();
                Assert.ok(sender, "sender was constructed. Testing response code: 200");

                this.fakeServer.requests.pop();
                sender.send(this.testTelemetry);

                Assert.equal(1, sender._buffer.count(), "Buffer has one item");

                // trigger send
                this.clock.tick(sender._config.maxBatchInterval());

                this.requestAsserts();
                this.fakeServer.requests.pop().respond(
                    200,
                    { "Content-Type": "application/json" },
                    '{ "itemsReceived": 1, "itemsAccepted": 1, "errors": [], "appId": "C16FBA4D-ECE9-472E-8125-4FF5BEFAF8C1" }'
                );

                // verify
                Assert.ok(sender.successSpy.called, "success was invoked");
                Assert.ok(sender.errorSpy.notCalled, "error was not invoked");

                Assert.equal("C16FBA4D-ECE9-472E-8125-4FF5BEFAF8C1", sender._appId, "App Id was parsed.");

                // clean up
                this.testCleanup();
            }
        });

        this.testCase({
            name: "SenderTests: XMLHttpRequest sender does not store appId from the response if it's not returned.",
            test: () => {
                // setup
                XMLHttpRequest = <any>(() => {
                    var xhr = new this.xhr;
                    xhr.withCredentials = false;
                    return xhr;
                });

                var sender = this.getSender();
                Assert.ok(sender, "sender was constructed. Testing response code: 200");

                this.fakeServer.requests.pop();
                sender.send(this.testTelemetry);

                Assert.equal(1, sender._buffer.count(), "Buffer has one item");

                // trigger send
                this.clock.tick(sender._config.maxBatchInterval());

                this.requestAsserts();
                this.fakeServer.requests.pop().respond(
                    200,
                    { "Content-Type": "application/json" },
                    '{ "itemsReceived": 1, "itemsAccepted": 1, "errors": [] }'
                );

                // verify
                Assert.ok(sender.successSpy.called, "success was invoked");
                Assert.ok(sender.errorSpy.notCalled, "error was not invoked");

                Assert.equal(null, sender._appId, "App Id was not parsed.");

                // clean up
                this.testCleanup();
            }
        });        

        this.testCase({
            name: "SenderTests: XMLHttpRequest sender does NOT retry on non-retriable response code from the backend.",
            test: () => {
                // setup
                XMLHttpRequest = <any>(() => {
                    var xhr = new this.xhr;
                    xhr.withCredentials = false;
                    return xhr;
                });

                var retriableResponses = [300, 400, 404, 501];

                retriableResponses.forEach(statusCode => {
                    var sender = this.getSender();
                    Assert.ok(sender, "sender was constructed. Testing response code: " + statusCode);

                    // send two items
                    this.fakeServer.requests.pop();
                    sender.send(this.testTelemetry);
                    sender.send(this.testTelemetry);

                    Assert.equal(2, sender._buffer.count(), "Buffer has two items");

                    // trigger send
                    this.clock.tick(sender._config.maxBatchInterval());

                    this.requestAsserts();
                    this.fakeServer.requests.pop().respond(
                        statusCode,
                        { "Content-Type": "application/json" },
                        // response with retriable status code
                        '{ "itemsReceived": 2, "itemsAccepted": 0, "errors": [{ "index": 0, "statusCode": 408, "message": "error" }, { "index": 1, "statusCode": 408, "message": "error" }] }'
                    );

                    // verify
                    Assert.ok(sender.successSpy.notCalled, "success was not invoked");
                    Assert.ok(sender.errorSpy.called, "error was invoked");

                    this.logAsserts(1);
                    Assert.equal(0, sender._buffer.count(), "Buffer has 0 items - nothing to retry.");

                    // validate session storage buffers
                    var buffer: string[] = JSON.parse(Microsoft.ApplicationInsights.Util.getSessionStorage(Microsoft.ApplicationInsights.SessionStorageSendBuffer.BUFFER_KEY));
                    var sentBuffer: string[] = JSON.parse(Microsoft.ApplicationInsights.Util.getSessionStorage(Microsoft.ApplicationInsights.SessionStorageSendBuffer.SENT_BUFFER_KEY));

                    Assert.equal(0, buffer.length, "Session storage buffer is empty");
                    Assert.equal(0, sentBuffer.length, "Session storage sent buffer is empty");

                    // clean up
                    this.testCleanup();
                });
            }
        });

        this.testCase({
            name: "SenderTests: XMLHttpRequest sender can handle partial success errors. Non-retryable",
            test: () => {
                // setup
                XMLHttpRequest = <any>(() => {
                    var xhr = new this.xhr;
                    xhr.withCredentials = false;
                    return xhr;
                });

                var sender = this.getSender();
                this.validatePartialSuccess_NonRetryable(sender);
            }
        });

        this.testCase({
            name: "SenderTests: XMLHttpRequest sender can handle partial success errors. Retryable",
            test: () => {
                // setup
                XMLHttpRequest = <any>(() => {
                    var xhr = new this.xhr;
                    xhr.withCredentials = false;
                    return xhr;
                });

                var sender = this.getSender();
                this.validatePartialSuccess_Retryable(sender);
            }
        });

        this.testCase({
            name: "SenderTests: XMLHttpRequest - can disable partial response handling",
            test: () => {
                // setup
                XMLHttpRequest = <any>(() => {
                    var xhr = new this.xhr;
                    xhr.withCredentials = false;
                    return xhr;
                });

                var sender = this.getSender();
                // disable partial response handling
                sender._config.isRetryDisabled = () => true;

                this.validatePartialSuccess_disabled(sender);
            }
        });

        this.testCase({
            name: "SenderTests: XDomain sender can handle partial success errors. Non-retryable",
            test: () => {
                // setup
                // pretend that you are IE8/IE9 browser which supports XDomainRequests
                XMLHttpRequest = <any>(() => {
                    var xhr = new this.xhr;
                    delete xhr.withCredentials;
                    return xhr;
                });

                window["XDomainRequest"] = <any>(() => {
                    var xdr = new this.xhr;
                    xdr.onload = xdr.onreadystatechange;
                    xdr.responseText = 206;
                    return xdr;
                });

                var sender = this.getSender();
                sender._config.endpointUrl = () => window.location.protocol + "//fakeEndpoint";

                this.validatePartialSuccess_NonRetryable(sender);
            }
        });

        this.testCase({
            name: "SenderTests: XDomain sender can handle partial success errors. Retryable",
            test: () => {
                // setup
                // pretend that you are IE8/IE9 browser which supports XDomainRequests
                XMLHttpRequest = <any>(() => {
                    var xhr = new this.xhr;
                    delete xhr.withCredentials;
                    return xhr;
                });

                window["XDomainRequest"] = <any>(() => {
                    var xdr = new this.xhr;
                    xdr.onload = xdr.onreadystatechange;
                    xdr.responseText = 206;
                    return xdr;
                });

                var sender = this.getSender();
                sender._config.endpointUrl = () => window.location.protocol + "//fakeEndpoint";

                this.validatePartialSuccess_Retryable(sender);
            }
        });

        this.testCase({
            name: "SenderTests: XDomain - can disable partial response handling",
            test: () => {
                // setup
                XMLHttpRequest = <any>(() => {
                    var xhr = new this.xhr;
                    delete xhr.withCredentials;
                    return xhr;
                });

                var sender = this.getSender();
                sender._config.endpointUrl = () => window.location.protocol + "//fakeEndpoint";
                sender._config.isRetryDisabled = () => true;

                this.validatePartialSuccess_disabled(sender);
            }
        });

        this.testCase({
            name: "SenderTests: ParseResponse - invalid number of errors",
            test: () => {
                // setup
                XMLHttpRequest = <any>(() => {
                    var xhr = new this.xhr;
                    xhr.withCredentials = false;
                    return xhr;
                });

                var sender = this.getSender();
                Assert.ok(sender, "sender was constructed");

                // too many errors
                var response = '{ "itemsReceived": 2, "itemsAccepted": 1, "errors": [{ "index": 0, "statusCode": 408, "message": "error" }, { "index": 2, "statusCode": 429, "message": "error" }] }';
                var result = <Microsoft.ApplicationInsights.IBackendResponse>(<any>sender)._parseResponse(response);

                Assert.ok(!result, "Parse should fail when there are too many errors (2 instead of 1)");

                // no errors
                response = '{ "itemsReceived": 2, "itemsAccepted": 1, "errors": [] }';
                result = <Microsoft.ApplicationInsights.IBackendResponse>(<any>sender)._parseResponse(response);

                Assert.ok(!result, "Parse should fail - there should be one error");

                // no warnings
                this.logAsserts(0);
            }
        });

        this.testCase({
            name: "SenderTests: ParseResponse - invalid number of accepted items",
            test: () => {
                // setup
                XMLHttpRequest = <any>(() => {
                    var xhr = new this.xhr;
                    xhr.withCredentials = false;
                    return xhr;
                });

                var sender = this.getSender();
                Assert.ok(sender, "sender was constructed");

                // too many items accepted
                var response = '{ "itemsReceived": 1, "itemsAccepted": 2, "errors": [] }';
                var result = <Microsoft.ApplicationInsights.IBackendResponse>(<any>sender)._parseResponse(response);

                Assert.ok(!result, "Parse should fail - there are too itemsAccepted > itemsReceived");

                // no warnings
                this.logAsserts(0);
            }
        });

        this.testCase({
            name: "SenderTests: ParseResponse - invalid response",
            test: () => {
                // setup
                XMLHttpRequest = <any>(() => {
                    var xhr = new this.xhr;
                    xhr.withCredentials = false;
                    return xhr;
                });

                var sender = this.getSender();
                Assert.ok(sender, "sender was constructed");

                var response = '{}';
                var result = <Microsoft.ApplicationInsights.IBackendResponse>(<any>sender)._parseResponse(response);
                Assert.ok(!result, "Parse should fail for an empty response");

                response = '{ "itemsReceived": 1, "itemsAccepted": 2, "errors": [] }';
                result = <Microsoft.ApplicationInsights.IBackendResponse>(<any>sender)._parseResponse(response);
                Assert.ok(!result, "Parse should fail - itemsAccepted grater than itemsReceived");

                response = '{ "itemsAccepted": 2, "errors": [] }';
                result = <Microsoft.ApplicationInsights.IBackendResponse>(<any>sender)._parseResponse(response);
                Assert.ok(!result, "Parse should fail - itemsReceived field missing");

                // no warnings
                this.logAsserts(0);
            }
        });

        this.testCase({
            name: "SenderTests: ParseResponse - can successfully parse empty response",
            test: () => {
                // setup
                XMLHttpRequest = <any>(() => {
                    var xhr = new this.xhr;
                    xhr.withCredentials = false;
                    return xhr;
                });

                var sender = this.getSender();
                Assert.ok(sender, "sender was constructed");

                var response = "";
                var result = <Microsoft.ApplicationInsights.IBackendResponse>(<any>sender)._parseResponse(response);
                Assert.ok(!result, "Parse should fail - response is empty");

                // no warnings
                this.logAsserts(0);
            }
        });

        this.testCase({
            name: "SenderTests: ParseResponse - parse error logs a InvalidBackendResponse error",
            test: () => {
                // setup
                XMLHttpRequest = <any>(() => {
                    var xhr = new this.xhr;
                    xhr.withCredentials = false;
                    return xhr;
                });

                var sender = this.getSender();
                Assert.ok(sender, "sender was constructed");

                var response = '{ "itemsReceived: }';
                var result = <Microsoft.ApplicationInsights.IBackendResponse>(<any>sender)._parseResponse(response);
                Assert.ok(!result, "Parse should fail");

                this.logAsserts(1);
                Assert.equal('AI (Internal): InvalidBackendResponse message:"Cannot parse the response. SyntaxError" props:"{response:{ \\itemsReceived: }}"', this.loggingSpy.args[0][0], "Expecting one warning message");
            }
        });

        this.testCase({
            name: "SenderTests: setRetryTime sets correct _retryAt for zero and one consecutive errors",
            test: () => {
                // setup
                var sender = this.getSender();
                Assert.ok(sender, "sender was constructed");

                var now = 1468864738000;
                this.clock.setSystemTime(now);

                // zero consecutive errors
                (<any>sender)._consecutiveErrors = 0;
                (<any>sender)._setRetryTime();

                Assert.equal(now + 10 * 1000, (<any>sender)._retryAt, "Invalid retry time.");

                // one consecutive errors
                (<any>sender)._consecutiveErrors = 1;
                (<any>sender)._setRetryTime();

                Assert.equal(now + 10 * 1000, (<any>sender)._retryAt, "Invalid retry time.");
            }
        });

        this.testCase({
            name: "SenderTests: setRetryTime sets correct _retryAt for two consecutive errors",
            test: () => {
                // setup
                var sender = this.getSender();
                Assert.ok(sender, "sender was constructed");

                var now = 1468864738000;
                this.clock.setSystemTime(now);

                // act
                (<any>sender)._consecutiveErrors = 2;
                (<any>sender)._setRetryTime();

                // validate - exponential back = 1.5 * Random() * 10 + 1
                Assert.ok((<any>sender)._retryAt >= now + 1 * 1000, "Invalid retry time.");
                Assert.ok((<any>sender)._retryAt <= now + 16 * 1000, "Invalid retry time.");
            }
        });

        this.testCase({
            name: "SenderTests: XMLHttpRequest can send and process the resposne from Vortex",
            test: () => {
                // setup
                XMLHttpRequest = <any>(() => {
                    var xhr = new this.xhr;
                    xhr.withCredentials = false;
                    return xhr;
                });

                var sender = this.getSender();
                Assert.ok(sender, "sender was constructed");

                // send sample telemetry
                this.fakeServer.requests.pop();
                sender.send(this.testTelemetry);
                this.clock.tick(sender._config.maxBatchInterval());

                // handle 200 from the Vortex
                this.requestAsserts();
                this.fakeServer.requests.pop().respond(200, { "Content-Type": "application/json" }, '{"ipv":false,"pvm":null,"rej":0,"bln":0,"acc":1,"efi":[]}');
                this.successAsserts(sender);
                this.logAsserts(0);
                sender.successSpy.reset();
                sender.errorSpy.reset();

                // send sample telemetry
                this.fakeServer.requests.pop();
                sender.send(this.testTelemetry);
                this.clock.tick(sender._config.maxBatchInterval());

                // handle 404 from the Vortex
                this.requestAsserts();
                this.fakeServer.requests.pop().respond(404, { "Content-Type": "application/json" }, '{"ipv":false,"pvm":null,"rej":1,"bln":0,"acc":0,"efi":["404"]}');
                this.errorAsserts(sender);
                this.logAsserts(1);
                sender.successSpy.reset();
                sender.errorSpy.reset();

                // cleanup
                this.loggingSpy.reset();

                // send sample telemetry
                this.fakeServer.requests.pop();
                sender.send(this.testTelemetry);
                this.clock.tick(sender._config.maxBatchInterval());

                // handle 206 from the Vortex. We don't handle partial retries from Vortex. 
                this.requestAsserts();
                this.fakeServer.requests.pop().respond(206, { "Content-Type": "application/json" }, '{"ipv":false,"pvm":null,"rej":1,"bln":0,"acc":0,"efi":["206"]}');
                this.errorAsserts(sender);
                this.logAsserts(1);
                sender.successSpy.reset();
                sender.errorSpy.reset();

                // nothing to retry - validate session storage buffers are empty 
                var buffer: string[] = JSON.parse(Microsoft.ApplicationInsights.Util.getSessionStorage(Microsoft.ApplicationInsights.SessionStorageSendBuffer.BUFFER_KEY));
                var sentBuffer: string[] = JSON.parse(Microsoft.ApplicationInsights.Util.getSessionStorage(Microsoft.ApplicationInsights.SessionStorageSendBuffer.SENT_BUFFER_KEY));
                Assert.equal(0, buffer.length, "Session storage buffer is empty");
                Assert.equal(0, sentBuffer.length, "Session storage sent buffer is empty");
            }
        });

        this.testCase({
            name: "SenderTests: send() is using BeaconAPI sender if the BeaconAPI is enabled",
            test: () => {
                if (!navigator.sendBeacon) {
                    navigator['sendBeacon'] = (url: string, data?: any) => { return true; };
                }

                // enable beacon API and mock sender
                var config = this.getDefaultConfig();
                config.isBeaconApiDisabled = () => false;

                var sender = <SenderWrapper>new Microsoft.ApplicationInsights.Sender(config);
                sender.beaconStub = this.sandbox.stub((
                    navigator), "sendBeacon");

                Assert.ok(sender, "sender was constructed");
                Assert.ok(Microsoft.ApplicationInsights.Util.IsBeaconApiSupported(), "Beacon API is supported");
                Assert.ok(sender.beaconStub.notCalled, "Beacon API was not called before");

                // send telemetry
                sender.send(this.testTelemetry);
                this.clock.tick(sender._config.maxBatchInterval());

                // verify that beaconSender was used
                Assert.ok(sender.beaconStub.calledOnce, "Beacon API was called once");
            }
        });

        this.testCase({
            name: "SenderTests: send() is not using BeaconAPI sender if the BeaconAPI is disabled",
            test: () => {
                if (!navigator.sendBeacon) {
                    navigator['sendBeacon'] = (url: string, data?: any) => { return true; };
                }

                // enable beacon API and mock sender
                var config = this.getDefaultConfig();
                config.isBeaconApiDisabled = () => true;

                var sender = <SenderWrapper>new Microsoft.ApplicationInsights.Sender(config);
                sender.beaconStub = this.sandbox.stub((navigator), "sendBeacon");

                Assert.ok(sender, "sender was constructed");
                Assert.ok(Microsoft.ApplicationInsights.Util.IsBeaconApiSupported(), "Beacon API is supported");
                Assert.ok(sender.beaconStub.notCalled, "Beacon API was not called before");

                // send telemetry
                sender.send(this.testTelemetry);
                this.clock.tick(sender._config.maxBatchInterval());

                // verify that beaconSender was used
                Assert.ok(sender.beaconStub.notCalled, "Beacon API was not called before");
            }
        });
    }

    private setupDataLossAnalyzer() {
        // TODO: move DataLossAnalyzer tests to a separate class
        // Microsoft.ApplicationInsights.DataLossAnalyzer.enabled = true;
        // Microsoft.ApplicationInsights.DataLossAnalyzer.appInsights = <any>{ trackTrace: (message) => { }, flush: () => { }, context: { _sender: { _XMLHttpRequestSupported: true } } };
    }

    private validatePartialSuccess_NonRetryable(sender) {
        Assert.ok(sender, "sender was constructed");

        // send two items
        this.fakeServer.requests.pop();
        sender.send(this.testTelemetry);
        sender.send(this.testTelemetry);

        Assert.equal(2, sender._buffer.count(), "Buffer has two items");

        // trigger send
        this.clock.tick(sender._config.maxBatchInterval());

        this.requestAsserts();
        this.fakeServer.requests.pop().respond(
            206,
            { "Content-Type": "application/json" },
            // backend rejected 1 out of 2 payloads. First payload was too old and should be dropped (non-retryable).
            '{ "itemsReceived": 2, "itemsAccepted": 1, "errors": [{ "index": 0, "statusCode": 400, "message": "103: Field time on type Envelope is older than the allowed min date. Expected: now - 172800000ms, Actual: now - 31622528281ms" }] }'
        );

        // verify
        Assert.ok(sender.successSpy.called, "success was invoked");

        this.logAsserts(1);
        Assert.equal('AI (Internal): OnError message:"Failed to send telemetry." props:"{message:partial success 1 of 2}"', this.loggingSpy.args[0][0], "Expecting one warning message");

        // the buffer is empty. 
        Assert.equal(0, sender._buffer.count(), "Buffer is empty");

        // session storage buffers are also empty
        var buffer: string[] = JSON.parse(Microsoft.ApplicationInsights.Util.getSessionStorage(Microsoft.ApplicationInsights.SessionStorageSendBuffer.BUFFER_KEY));
        var sentBuffer: string[] = JSON.parse(Microsoft.ApplicationInsights.Util.getSessionStorage(Microsoft.ApplicationInsights.SessionStorageSendBuffer.SENT_BUFFER_KEY));

        Assert.equal(0, buffer.length, "Session storage buffer is empty");
        Assert.equal(0, sentBuffer.length, "Session storage sent buffer is empty");

        // clean up
        sender.successSpy.reset();
        sender.errorSpy.reset();
    }

    private validatePartialSuccess_Retryable(sender) {
        Assert.ok(sender, "sender was constructed");

        // send six items
        this.fakeServer.requests.pop();

        for (var i = 0; i < 6; i++) {
            var payload = {
                aiDataContract: {
                    payload: 0
                },
                ver: 0,
                name: null,
                time: null,
                sampleRate: null,
                seq: null,
                iKey: null,
                flags: null,
                deviceId: null,
                os: null,
                osVer: null,
                appId: null,
                appVer: null,
                userId: null,
                tags: null,
                payload: i
            };

            sender.send(payload);
        }

        Assert.equal(6, sender._buffer.count(), "Buffer has six items");

        // trigger send
        this.clock.tick(sender._config.maxBatchInterval());

        this.requestAsserts();
        this.fakeServer.requests.pop().respond(
            206,
            { "Content-Type": "application/json" },
            // backend rejected 5 out of 6 payloads. Rejected payloads response codes: 408, 429, 429, 500, 503 (all retryable)
            '{ "itemsReceived": 6, "itemsAccepted": 1, "errors": [{ "index": 1, "statusCode": 408, "message": "error" }, { "index": 2, "statusCode": 429, "message": "error" }, { "index": 3, "statusCode": 429, "message": "error" }, { "index": 4, "statusCode": 500, "message": "error" }, { "index": 5, "statusCode": 503, "message": "error" }] }'
        );

        // verify
        Assert.ok(sender.successSpy.called, "success was invoked");

        // partial response warning
        this.logAsserts(1);

        // the buffer has 5 items - payloads 1-5, payload 0 was accepted by the backend and should not be re-send
        Assert.equal(5, sender._buffer.count(), "Buffer has 5 items to retry.");

        Assert.equal('{"payload":5}', sender._buffer.getItems()[0], "Invalid item in the buffer");
        Assert.equal('{"payload":1}', sender._buffer.getItems()[4], "Invalid item in the buffer");

        // validate session storage buffers
        var buffer: string[] = JSON.parse(Microsoft.ApplicationInsights.Util.getSessionStorage(Microsoft.ApplicationInsights.SessionStorageSendBuffer.BUFFER_KEY));
        var sentBuffer: string[] = JSON.parse(Microsoft.ApplicationInsights.Util.getSessionStorage(Microsoft.ApplicationInsights.SessionStorageSendBuffer.SENT_BUFFER_KEY));

        Assert.equal(5, buffer.length, "Session storage buffer has 5 items");
        Assert.equal(0, sentBuffer.length, "Session storage sent buffer is empty");

        // clean up
        sender.successSpy.reset();
        sender.errorSpy.reset();
    }

    private validatePartialSuccess_disabled(sender) {
        // send two items
        this.fakeServer.requests.pop();
        sender.send(this.testTelemetry);
        sender.send(this.testTelemetry);

        Assert.equal(2, sender._buffer.count(), "Buffer has two items");

        // trigger send
        this.clock.tick(sender._config.maxBatchInterval());

        this.requestAsserts();
        this.fakeServer.requests.pop().respond(
            206,
            { "Content-Type": "application/json" },
            // backend rejected 1 out of 2 payloads. First payload was too old and should be dropped (non-retryable).
            '{ "itemsReceived": 2, "itemsAccepted": 1, "errors": [{ "index": 0, "statusCode": 400, "message": "103: Field time on type Envelope is older than the allowed min date. Expected: now - 172800000ms, Actual: now - 31622528281ms" }] }'
        );

        // verify
        Assert.ok(!sender.successSpy.called, "success was NOT invoked");
        Assert.ok(!sender.partialSpy.called, "partialSpy was NOT invoked");
        Assert.ok(sender.errorSpy.called, "error was invoked");

        this.logAsserts(1);
        Assert.ok((<string>this.loggingSpy.args[0][0]).concat('AI (Internal): OnError message:"Failed to send telemetry.'), "Expecting one warning message");

        // the buffer is empty. 
        Assert.equal(0, sender._buffer.count(), "Buffer is empty");

        // session storage buffers are also empty
        var buffer: string[] = JSON.parse(Microsoft.ApplicationInsights.Util.getSessionStorage(Microsoft.ApplicationInsights.SessionStorageSendBuffer.BUFFER_KEY));
        var sentBuffer: string[] = JSON.parse(Microsoft.ApplicationInsights.Util.getSessionStorage(Microsoft.ApplicationInsights.SessionStorageSendBuffer.SENT_BUFFER_KEY));

        Assert.equal(0, buffer.length, "Session storage buffer is empty");
        Assert.equal(0, sentBuffer.length, "Session storage sent buffer is empty");
    }

    private getDefaultConfig(): Microsoft.ApplicationInsights.ISenderConfig {
        return {
            endpointUrl: () => this.endpointUrl,
            emitLineDelimitedJson: () => this.emitLineDelimitedJson,
            maxBatchSizeInBytes: () => this.maxBatchSizeInBytes,
            maxBatchInterval: () => this.maxBatchInterval,
            disableTelemetry: () => this.disableTelemetry,
            enableSessionStorageBuffer: () => true,
            isRetryDisabled: () => false,
            isBeaconApiDisabled: () => true
        };
    }
}

new SenderTests().registerTests(); 