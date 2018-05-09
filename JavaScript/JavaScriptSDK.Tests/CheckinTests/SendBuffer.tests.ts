/// <reference path="../TestFramework/Common.ts" />
/// <reference path="../../JavaScriptSDK/Sender.ts" />
/// <reference path="../../JavaScriptSDK/AppInsights.ts" />

class SendBufferTests extends TestClass {

    private getArraySendBuffer: (emitLineDelimitedJson?: boolean) => Microsoft.ApplicationInsights.ArraySendBuffer;
    private getSessionStorageSendBuffer: (emitLineDelimitedJson?: boolean) => Microsoft.ApplicationInsights.SessionStorageSendBuffer;

    public testInitialize() {
        if (Microsoft.ApplicationInsights.Util.canUseSessionStorage()) {
            sessionStorage.clear();
        }

        var config: Microsoft.ApplicationInsights.ISenderConfig = {
            emitLineDelimitedJson: () => false,
            enableSessionStorageBuffer: () => false,
            endpointUrl: () => null,
            maxBatchSizeInBytes: () => null,
            maxBatchInterval: () => null,
            disableTelemetry: () => null,
            isRetryDisabled: () => null,
            isBeaconApiDisabled: () => true
        };

        this.getArraySendBuffer = (emitLineDelimitedJson?: boolean) => {
            if (emitLineDelimitedJson) {
                config.emitLineDelimitedJson = () => emitLineDelimitedJson;
            }

            return new Microsoft.ApplicationInsights.ArraySendBuffer(config);
        }

        this.getSessionStorageSendBuffer = (emitLineDelimitedJson?: boolean) => {
            if (emitLineDelimitedJson) {
                config.emitLineDelimitedJson = () => emitLineDelimitedJson;
            }

            return new Microsoft.ApplicationInsights.SessionStorageSendBuffer(config);
        }
    }

    public testCleanup() {
        // reset enableDebugger to a default value
        Microsoft.ApplicationInsights._InternalLogging.enableDebugExceptions = () => false;
    }

    private BUFFER_KEY = "AI_buffer";
    private SENT_BUFFER_KEY = "AI_sentBuffer";

    public registerTests() {

        this.testCase({
            name: "ArraySendBuffer: initialize",
            test: () => {
                var buffer = this.getArraySendBuffer();

                this.Test_Initialize(buffer);
            }
        });

        this.testCase({
            name: "SessionStorageSendBuffer: initialize",
            test: () => {
                var buffer = this.getSessionStorageSendBuffer();

                this.Test_Initialize(buffer);
            }
        });

        this.testCase({
            name: "ArraySendBuffer: can enqueue and clear the buffer",
            test: () => {
                var buffer = this.getArraySendBuffer();

                this.Test_CanEnqueueAndClearTheBuffer(buffer);
            }
        });

        this.testCase({
            name: "SessionStorageSendBuffer: can enqueue and clear the buffer",
            test: () => {
                var buffer = this.getSessionStorageSendBuffer();

                this.Test_CanEnqueueAndClearTheBuffer(buffer);
            }
        });


        this.testCase({
            name: "ArraySendBuffer: can clear empty buffer",
            test: () => {
                var buffer = this.getArraySendBuffer();

                this.Test_CanClearEmptyBuffer(buffer);
            }
        });

        this.testCase({
            name: "SessionStorageSendBuffer: can clear empty buffer",
            test: () => {
                var buffer = this.getSessionStorageSendBuffer();

                this.Test_CanClearEmptyBuffer(buffer);
            }
        });

        this.testCase({
            name: "ArraySendBuffer: call batchPayloads when a buffer is empty",
            test: () => {
                var buffer = this.getArraySendBuffer();

                this.Test_CanClearEmptyBuffer(buffer);
            }
        });

        this.testCase({
            name: "SessionStorageSendBuffer: call batchPayloads when a buffer is empty",
            test: () => {
                var buffer = this.getSessionStorageSendBuffer();

                this.Test_CanClearEmptyBuffer(buffer);
            }
        });


        this.testCase({
            name: "ArraySendBuffer: call batchPayloads when a buffer has one element",
            test: () => {
                var buffer = this.getArraySendBuffer();

                this.Test_CallBatchPayloadsWithOneElement(buffer);
            }
        });

        this.testCase({
            name: "SessionStorageSendBuffer: call batchPayloads when a buffer has one element",
            test: () => {
                var buffer = this.getSessionStorageSendBuffer();

                this.Test_CallBatchPayloadsWithOneElement(buffer);
            }
        });

        this.testCase({
            name: "ArraySendBuffer: call batchPayloads when a buffer has two elements",
            test: () => {
                var buffer = this.getArraySendBuffer();

                this.Test_CallBatchPayloadsWithTwoElements(buffer);
            }
        });

        this.testCase({
            name: "SessionStorageSendBuffer: call batchPayloads when a buffer has two elements",
            test: () => {
                var buffer = this.getSessionStorageSendBuffer();

                this.Test_CallBatchPayloadsWithTwoElements(buffer);
            }
        });

        this.testCase({
            name: "ArraySendBuffer: call batchPayloads when a buffer has two elements - emitLineDelimitedJson",
            test: () => {
                var buffer = this.getArraySendBuffer(true);

                this.Test_CallBatchPayloadsWithTwoElements_EmitLineDelimitedJson(buffer);
            }
        });

        this.testCase({
            name: "SessionStorageSendBuffer: call batchPayloads when a buffer has two elements - emitLineDelimitedJson",
            test: () => {
                var buffer = this.getSessionStorageSendBuffer(true);

                this.Test_CallBatchPayloadsWithTwoElements_EmitLineDelimitedJson(buffer);
            }
        });

        this.testCase({
            name: "SessionStorageSendBuffer: is restored from the Session storage in constructor",
            test: () => {
                // setup
                var buffer = this.getSessionStorageSendBuffer(true);
                var payload1 = "{ test: test1 }";
                var payload2 = "{ test: test2 }";
                var payload3 = "{ test: test3 }";

                // act
                buffer.enqueue(payload1);
                buffer.enqueue(payload2);
                buffer.enqueue(payload3);

                var sent = [payload1, payload2];
                buffer.markAsSent(sent);

                var delivered = [payload1];
                buffer.clearSent(delivered);

                var buffer2 = this.getSessionStorageSendBuffer(true);

                // verify
                Assert.equal(2, buffer2.count(), "there should be two elements in the buffer");
            }
        });

        this.testCase({
            name: "SessionStorageSendBuffer: markAsSent saves items in the SENT_BUFFER",
            test: () => {
                // setup
                var buffer = this.getSessionStorageSendBuffer(true);

                // act
                var payload1 = "{ test: test }";
                var payload2 = "{ test: test }";

                buffer.enqueue(payload1);
                buffer.enqueue(payload2);

                // verify
                Assert.equal(2, buffer.count(), "there should be two elements in the buffer");

                // act
                var payload = buffer.getItems();
                buffer.markAsSent(payload);

                // verify
                Assert.equal(0, buffer.count(), "There shouldn't be any items in the buffer");
                var sentBuffer = this.getBuffer(this.SENT_BUFFER_KEY);

                Assert.equal(2, sentBuffer.length, "There should be 2 items in the sent buffer");
            }
        });

        this.testCase({
            name: "SessionStorageSendBuffer: markAsSent removes only sent items from the buffer",
            test: () => {
                // setup
                var buffer = this.getSessionStorageSendBuffer(true);

                // act
                var payload1 = "{ test: test1 }";
                var payload2 = "{ test: test2 }";
                var payload3 = "{ test: test3 }";

                buffer.enqueue(payload1);
                buffer.enqueue(payload2);
                buffer.enqueue(payload3);

                // verify
                Assert.equal(3, buffer.count(), "there should be three elements in the buffer");

                // act
                var payload = [payload1, payload2];
                buffer.markAsSent(payload);

                // verify
                Assert.equal(1, buffer.count(), "There should be one notsent item left in the buffer");
                var sentBuffer = this.getBuffer(this.SENT_BUFFER_KEY);

                Assert.equal(2, sentBuffer.length, "There should be 2 items in the sent buffer");
            }
        });

        this.testCase({
            name: "SessionStorageSendBuffer: clearSent clears the SENT_BUFFER",
            test: () => {
                // setup
                var buffer = this.getSessionStorageSendBuffer(true);

                var payload1 = "{ test: test1 }";
                var payload2 = "{ test: test2 }";

                buffer.enqueue(payload1);
                buffer.enqueue(payload2);

                var payload = buffer.getItems();
                buffer.markAsSent(payload);

                // act
                buffer.clearSent(payload);

                // verify
                var sentBuffer = this.getBuffer(this.SENT_BUFFER_KEY);
                Assert.equal(0, sentBuffer.length, "There should be 0 items in the sent buffer");
            }
        });

        this.testCase({
            name: "SessionStorageSendBuffer: does not store more than 2000 elements",
            test: () => {
                var buffer = this.getSessionStorageSendBuffer();

                for (var i = 0; i < 2000; i++) {
                    buffer.enqueue("i=" + i);
                }

                Assert.equal(2000, buffer.count(), "Buffer has 100 elements");

                buffer.enqueue("I don't fit!");

                Assert.equal(2000, buffer.count(), "Buffer should not allow to enqueue 101th element");
            }
        });

        this.testCase({
            name: "SessionStorageSendBuffer: logs a warning if the buffer is full",
            test: () => {
                var buffer = this.getSessionStorageSendBuffer();

                var loggingSpy = this.sandbox.spy(Microsoft.ApplicationInsights._InternalLogging, "throwInternal");

                for (var i = 0; i < 2000; i++) {
                    buffer.enqueue("i=" + i);
                }

                Assert.equal(2000, buffer.count(), "Buffer has 100 elements");

                buffer.enqueue("I don't fit!");

                Assert.ok(loggingSpy.calledOnce, "BufferFull warning logged to console");

                buffer.enqueue("I don't fit!");

                Assert.ok(loggingSpy.calledOnce, "BufferFull warning should be logged only once.");
            }
        });
    }

    private getBuffer(key: string): string[] {
        var bufferJson = Microsoft.ApplicationInsights.Util.getSessionStorage(key);

        if (bufferJson) {
            var buffer: string[] = JSON.parse(bufferJson);
            if (buffer) {
                return buffer;
            }
        }

        return [];
    }

    private Test_Initialize(buffer: Microsoft.ApplicationInsights.ISendBuffer) {
        // verify
        Assert.equal(0, buffer.count(), "new buffer should be empty");
    }

    private Test_CanEnqueueAndClearTheBuffer(buffer: Microsoft.ApplicationInsights.ISendBuffer) {
        // act
        buffer.enqueue("");

        // verify
        Assert.equal(1, buffer.count(), "one item expected");

        // act
        buffer.enqueue("");

        // verify
        Assert.equal(2, buffer.count(), "two items expected");

        //act
        buffer.clear();

        // verify
        Assert.equal(0, buffer.count(), "buffer should be empty");
    }

    private Test_CanClearEmptyBuffer(buffer: Microsoft.ApplicationInsights.ISendBuffer) {
        //verify
        Assert.equal(0, buffer.count(), "buffer should be empty");

        // act
        buffer.clear();

        // verify
        Assert.equal(0, buffer.count(), "buffer should be empty");
    }

    private Test_CallBatchPayloadsWhenABufferIsEmpty(buffer: Microsoft.ApplicationInsights.ISendBuffer) {
        // act
        var batch = buffer.batchPayloads(null);

        // verify
        Assert.equal(null, batch, "expecting null");
    }

    private Test_CallBatchPayloadsWithOneElement(buffer: Microsoft.ApplicationInsights.ISendBuffer) {
        // act
        var payload = "{ test: test }";

        var batch = buffer.batchPayloads([payload]);

        // verify
        Assert.equal("[" + payload + "]", batch, "invalid batch");
    }

    private Test_CallBatchPayloadsWithTwoElements(buffer: Microsoft.ApplicationInsights.ISendBuffer) {
        // act
        var payload1 = "{ test: test }";
        var payload2 = "{ }";

        var batch = buffer.batchPayloads([payload1, payload2]);

        // verify
        Assert.equal(['[', payload1, ',', payload2, ']'].join(''), batch, "invalid batch");
    }

    private Test_CallBatchPayloadsWithTwoElements_EmitLineDelimitedJson(buffer: Microsoft.ApplicationInsights.ISendBuffer) {
        // act
        var payload1 = "{ test: test }";
        var payload2 = "{ test: test }";

        var batch = buffer.batchPayloads([payload1, payload2]);

        // verify
        Assert.equal(payload1 + "\n" + payload2, batch, "invalid batch");
    }
}

new SendBufferTests().registerTests(); 