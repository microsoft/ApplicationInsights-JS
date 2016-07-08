/// <reference path="..\TestFramework\Common.ts" />
/// <reference path="../../JavaScriptSDK/sender.ts" />
/// <reference path="../../JavaScriptSDK/SendBuffer.ts"/>
/// <reference path="../../javascriptsdk/appinsights.ts" />

class SenderWrapper extends Microsoft.ApplicationInsights.Sender {
    errorSpy: SinonSpy;
    successSpy: SinonSpy
}

class SenderTests extends TestClass {

    private xhr;
    private xdr;
    private fakeServer;
    private getSender: () => SenderWrapper;
    private loggingSpy;
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

        var config: Microsoft.ApplicationInsights.ISenderConfig = {
            endpointUrl: () => this.endpointUrl,
            emitLineDelimitedJson: () => this.emitLineDelimitedJson,
            maxBatchSizeInBytes: () => this.maxBatchSizeInBytes,
            maxBatchInterval: () => this.maxBatchInterval,
            disableTelemetry: () => this.disableTelemetry,
            enableSessionStorageBuffer: () => false
        };

        this.getSender = () => {
            var sender = <SenderWrapper>new Microsoft.ApplicationInsights.Sender(config);

            sender.errorSpy = this.sandbox.spy(sender, "_onError");
            sender.successSpy = this.sandbox.spy(sender, "_onSuccess");

            return sender;
        }

        this.loggingSpy = this.sandbox.stub(Microsoft.ApplicationInsights._InternalLogging, "warnToConsole");
        this.testTelemetry = { aiDataContract: true };

        Microsoft.ApplicationInsights._InternalLogging.verboseLogging = () => true;
    }

    public testCleanup() {
        // reset enableDebugger to a default value
        Microsoft.ApplicationInsights._InternalLogging.enableDebugExceptions = () => false;
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

        var successAsserts = (sender: any) => {
            Assert.ok(sender.successSpy.called, "success was invoked");
            Assert.ok(sender.errorSpy.notCalled, "no error");
        }

        var errorAsserts = (sender: any) => {
            Assert.ok(sender.errorSpy.called, "error was invoked");
            Assert.ok(sender.successSpy.notCalled, "success was not invoked");
        }

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
                var sender = this.getSender();
                sender.send(undefined);

                // verify
                Assert.ok(sender.successSpy.notCalled, "success handler was not invoked");
                Assert.ok(sender.errorSpy.notCalled, "error handler was not invoked");
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
                var sender = this.getSender();

                // verify
                Assert.ok(sender, "sender was constructed");

                // act
                this.fakeServer.requests.pop();
                sender.send(this.testTelemetry);
                this.clock.tick(sender._config.maxBatchInterval());

                // verify
                requestAsserts();
                this.fakeServer.requests.pop().respond(200, { "Content-Type": "application/json" }, '{"test":"success"}"');
                successAsserts(sender);
                logAsserts(0);
                sender.successSpy.reset();
                sender.errorSpy.reset();

                // act
                this.fakeServer.requests.pop();
                sender.send(this.testTelemetry);
                this.clock.tick(sender._config.maxBatchInterval());

                // verify
                requestAsserts();
                this.fakeServer.requests.pop().respond(404, { "Content-Type": "application/json" }, '{"test":"not found"}"');
                errorAsserts(sender);
                logAsserts(1);
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

                XDomainRequest = <any>(() => {
                    var xdr = new this.xhr;
                    xdr.onload = xdr.onreadystatechange;
                    xdr.responseText = 200;
                    return xdr;
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
                requestAsserts();
                this.fakeServer.requests[0].respond(200, { "Content-Type": "application/json" }, '200');
                successAsserts(sender);
                logAsserts(0);
                sender.successSpy.reset();
                sender.errorSpy.reset();

                // act
                this.fakeServer.requests.pop();
                sender.send(this.testTelemetry);
                this.clock.tick(sender._config.maxBatchInterval());

                // verify
                requestAsserts();
                this.fakeServer.requests[0].respond(404, { "Content-Type": "application/json" }, '400');
                errorAsserts(sender);
                logAsserts(1);
                sender.successSpy.reset();
                sender.errorSpy.reset();
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
                errorAsserts(sender);
                sender.errorSpy.reset();

                // setup
                var xdr = new this.xhr;
                XMLHttpRequest = <any>(() => { });
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
                errorAsserts(sender);
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
                logAsserts(0);

                // act (make sure nothing more is sent when max interval is reached)
                senderSpy.reset();
                this.clock.tick(sender._config.maxBatchInterval());

                // verify
                Assert.ok(senderSpy.notCalled, "sender was not invoked a third time after maxInterval elapsed");
                logAsserts(0);


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
                logAsserts(0);
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
                logAsserts(0);
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
                logAsserts(0);


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
                var sender = this.getSender();
                sender._sender = () => null;
                var senderSpy = this.sandbox.spy(sender, "_sender");

                // act
                sender.send(this.testTelemetry);
                this.clock.tick(sender._config.maxBatchInterval());

                // verify
                Assert.ok(senderSpy.notCalled, "sender was not called");
                logAsserts(0);


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
                logAsserts(0);


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

        this.testCase({
            name: "SenderTests: data loss analyzer - send(item), queued, sent; result 0",
            test: () => {
                // setup
                this.setupDataLossAnaluzed();
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
                this.setupDataLossAnaluzed();
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
                this.setupDataLossAnaluzed();
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
                this.setupDataLossAnaluzed();
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
        });

        this.testCase({
            name: "SenderTests: use Array buffer by default",
            test: () => {
                // setup
                var config: Microsoft.ApplicationInsights.ISenderConfig = {
                    endpointUrl: () => this.endpointUrl,
                    emitLineDelimitedJson: () => this.emitLineDelimitedJson,
                    maxBatchSizeInBytes: () => this.maxBatchSizeInBytes,
                    maxBatchInterval: () => this.maxBatchInterval,
                    disableTelemetry: () => this.disableTelemetry,
                    enableSessionStorageBuffer: () => false
                };

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
                var config: Microsoft.ApplicationInsights.ISenderConfig = {
                    endpointUrl: () => this.endpointUrl,
                    emitLineDelimitedJson: () => this.emitLineDelimitedJson,
                    maxBatchSizeInBytes: () => this.maxBatchSizeInBytes,
                    maxBatchInterval: () => this.maxBatchInterval,
                    disableTelemetry: () => this.disableTelemetry,
                    enableSessionStorageBuffer: () => true
                };

                // act
                var sender = new Microsoft.ApplicationInsights.Sender(config);

                // Validate
                Assert.ok(sender._buffer instanceof Microsoft.ApplicationInsights.SessionStorageSendBuffer, "sender should use SessionStorage buffer");
            }
        });

        this.testCase({
            name: "SenderTests: does not use SessionStorageBuffer when enableSessionStorageBuffer is true and SessionStorage is not supported",
            test: () => {
                var utilCanUserSession = Microsoft.ApplicationInsights.Util.canUseSessionStorage;

                // setup
                var config: Microsoft.ApplicationInsights.ISenderConfig = {
                    endpointUrl: () => this.endpointUrl,
                    emitLineDelimitedJson: () => this.emitLineDelimitedJson,
                    maxBatchSizeInBytes: () => this.maxBatchSizeInBytes,
                    maxBatchInterval: () => this.maxBatchInterval,
                    disableTelemetry: () => this.disableTelemetry,
                    enableSessionStorageBuffer: () => true
                };

                Microsoft.ApplicationInsights.Util.canUseSessionStorage = () => {
                    return false;
                };

                // act
                var sender = new Microsoft.ApplicationInsights.Sender(config);

                // Validate
                Assert.ok(sender._buffer instanceof Microsoft.ApplicationInsights.ArraySendBuffer, "sender should use Array buffer");

                // clean up
                Microsoft.ApplicationInsights.Util.canUseSessionStorage = utilCanUserSession;
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

                // act
                var sender = this.getSender();

                // verify
                Assert.ok(sender, "sender was constructed");

                // act
                var data = new Microsoft.ApplicationInsights.Telemetry.Common.Data<string>('string', '[{ "payload" : "1" }, { "payload" : "2" }]');
                var envelope = new Microsoft.ApplicationInsights.Telemetry.Common.Envelope(data, '');
                sender.send(envelope);

                // TODO: send buffer has two items
                
                this.clock.tick(sender._config.maxBatchInterval());

                // verify
                requestAsserts();
                this.fakeServer.requests.pop().respond(
                    206,
                    { "Content-Type": "application/json" },
                    // backend rejected 1 out of 2 payloads. First payload was too old and should be dropped.
                    { "itemsReceived": 2, "itemsAccepted": 1, "errors": [{ "index": 0, "statusCode": 400, "message": "103: Field 'time' on type 'Envelope' is older than the allowed min date. Expected: now - 172800000ms, Actual: now - 31622528281ms" }] }
                );
                successAsserts(sender);
                logAsserts(0);
                sender.successSpy.reset();
                sender.errorSpy.reset();

                // TODO: the buffer is empty
            }
        });

        // TODO: retryable - two payloads out of three
        // 


        this.testCase({
            name: "SenderTests: XDomain sender can handle partial success errors",
            test: () => {
                // setup
                // pretend that you are IE8/IE9 browser which supports XDomainRequests
                XMLHttpRequest = <any>(() => {
                    var xhr = new this.xhr;
                    delete xhr.withCredentials;
                    return xhr;
                });

                XDomainRequest = <any>(() => {
                    var xdr = new this.xhr;
                    xdr.onload = xdr.onreadystatechange;
                    xdr.responseText = 200;
                    return xdr;
                });

                // act
                var sender = this.getSender();

                // verify
                Assert.ok(sender, "sender was constructed");

                // act
                this.fakeServer.requests.pop();
                var data = new Microsoft.ApplicationInsights.Telemetry.Common.Data<string>('string', '[{ "time": "2016-05-23T01:46:28.456Z", "iKey": "56a5d7a1-1d3a-4e8c-b72b-949f7d4e8aa6", "name": "Microsoft.ApplicationInsights.56a5d7a11d3a4e8cb72b949f7d4e8aa6.Pageview", "tags": { "ai.session.id": "nkzq2", "ai.device.id": "browser", "ai.device.type": "Browser", "ai.internal.sdkVersion": "JavaScript:0.22.14", "ai.user.id": "JoO1+", "ai.operation.id": "eNJXm", "ai.operation.name": "/" }, "data": { "baseType": "PageviewData", "baseData": { "ver": 2, "name": "Home Page - DNDRampUp", "url": "http://localhost:3947/", "duration": "00:00:00.150" } } }, { "time": "2016-05-19T01:46:28.459Z", "iKey": "56a5d7a1-1d3a-4e8c-b72b-949f7d4e8aa6", "name": "Microsoft.ApplicationInsights.56a5d7a11d3a4e8cb72b949f7d4e8aa6.PageviewPerformance", "tags": { "ai.session.id": "nkzq2", "ai.device.id": "browser", "ai.device.type": "Browser", "ai.internal.sdkVersion": "JavaScript:0.22.14", "ai.user.id": "JoO1+", "ai.operation.id": "eNJXm", "ai.operation.name": "/" }, "data": { "baseType": "PageviewPerformanceData", "baseData": { "ver": 2, "name": "Home Page - DNDRampUp", "url": "http://localhost:3947/", "duration": "00:00:00.150", "perfTotal": "00:00:00.150", "networkConnect": "00:00:00.004", "sentRequest": "00:00:00.000", "receivedResponse": "00:00:00.002", "domProcessing": "00:00:00.126" } } }]');
                var envelope = new Microsoft.ApplicationInsights.Telemetry.Common.Envelope(data, '');
                sender.send(envelope);
                this.clock.tick(sender._config.maxBatchInterval());

                // verify
                // TODO: configure a sender that does not mock the onthe retry logic
                requestAsserts();
                this.fakeServer.requests[0].respond(
                    206,
                    { "itemsReceived": 2, "itemsAccepted": 1, "errors": [{ "index": 1, "statusCode": 400, "message": "103: Field 'time' on type 'Envelope' is older than the allowed min date. Expected: now - 172800000ms, Actual: now - 414962282ms" }] },
                    '206');
                successAsserts(sender);
                logAsserts(0);
                sender.successSpy.reset();
                sender.errorSpy.reset();
            }
        });
    }

    private setupDataLossAnaluzed() {
        Microsoft.ApplicationInsights.DataLossAnalyzer.enabled = true;
        Microsoft.ApplicationInsights.DataLossAnalyzer.appInsights = <any>{ trackTrace: (message) => { }, flush: () => { }, context: { _sender: { _XMLHttpRequestSupported: true } } };
    }
}

new SenderTests().registerTests(); 