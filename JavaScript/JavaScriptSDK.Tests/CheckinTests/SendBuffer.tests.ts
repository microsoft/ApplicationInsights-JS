/// <reference path="..\TestFramework\Common.ts" />
/// <reference path="../../JavaScriptSDK/sender.ts" />
/// <reference path="../../javascriptsdk/appinsights.ts" />

class SendBufferTests extends TestClass {

    private getArraySendBuffer: (emitLineDelimitedJson?: boolean) => Microsoft.ApplicationInsights.ArraySendBuffer;
    private getSessionStorageSendBuffer: (emitLineDelimitedJson?: boolean) => Microsoft.ApplicationInsights.SessionStorageSendBuffer;

    public testCleanup() {
        Microsoft.ApplicationInsights.DataLossAnalyzer.enabled = false;
    }

    public testInitialize() {
        if (Microsoft.ApplicationInsights.Util.canUseSessionStorage()) {
            sessionStorage.clear();
        }

        var config: Microsoft.ApplicationInsights.ISenderConfig = {
            emitLineDelimitedJson: () => false,
            storeSendBufferInSessionStorage: () => false,
            endpointUrl: () => null,
            maxBatchSizeInBytes: () => null,
            maxBatchInterval: () => null,
            disableTelemetry: () => null
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

    private BUFFER_KEY = "AI_buffer";
    private SENT_BUFFER_KEY = "AI_sentBuffer";

    public registerTests() {
        // ArraySendBuffer tests

        this.testCase({
            name: "ArraySendBuffer: initialize",
            test: () => {
                // setup
                var buffer = this.getArraySendBuffer();

                // verify
                Assert.equal(0, buffer.count(), "new buffer should be empty");
            }
        });

        this.testCase({
            name: "ArraySendBuffer: can enqueue and clear the buffer",
            test: () => {
                // setup
                var buffer = this.getArraySendBuffer();

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
        });

        this.testCase({
            name: "ArraySendBuffer: can clear empty buffer",
            test: () => {
                // setup
                var buffer = this.getArraySendBuffer();

                // act
                buffer.clear();

                // verify
                Assert.equal(0, buffer.count(), "buffer should be empty");
            }
        });

        this.testCase({
            name: "ArraySendBuffer: call batchPayloads when a buffer is empty",
            test: () => {
                // setup
                var buffer = this.getArraySendBuffer();

                // act
                var batch = buffer.batchPayloads();

                // verify
                Assert.equal(null, batch, "expecting null");
            }
        });

        this.testCase({
            name: "ArraySendBuffer: call batchPayloads when a buffer has one element",
            test: () => {
                // setup
                var buffer = this.getArraySendBuffer();

                // act
                var payload = "{ test: test }";

                buffer.enqueue(payload);
                var batch = buffer.batchPayloads();

                // verify
                Assert.equal("[" + payload + "]", batch, "invalid batch");
            }
        });

        this.testCase({
            name: "ArraySendBuffer: call batchPayloads when a buffer has two elements",
            test: () => {
                // setup
                var buffer = this.getArraySendBuffer();

                // act
                var payload1 = "{ test: test }";
                var payload2 = "{ }";

                buffer.enqueue(payload1);
                buffer.enqueue(payload2);
                var batch = buffer.batchPayloads();

                // verify
                Assert.equal("[" + payload1 + "," + payload2 + "]", batch, "invalid batch");
            }
        });

        this.testCase({
            name: "ArraySendBuffer: call batchPayloads when a buffer has two elements - emitLineDelimitedJson",
            test: () => {
                // setup
                var buffer = this.getArraySendBuffer(true);

                // act
                var payload1 = "{ test: test }";
                var payload2 = "{ test: test }";

                buffer.enqueue(payload1);
                buffer.enqueue(payload2);
                var batch = buffer.batchPayloads();

                // verify
                Assert.equal(payload1 + "\n" + payload2, batch, "invalid batch");
            }
        });

        // SessionStorageSendBuffer tests

        this.testCase({
            name: "SessionStorageSendBuffer: initialize",
            test: () => {
                // setup
                var buffer = this.getSessionStorageSendBuffer();

                // verify
                Assert.equal(0, buffer.count(), "new buffer should be empty");
            }
        });

        this.testCase({
            name: "SessionStorageSendBuffer: can enqueue and clear the buffer",
            test: () => {
                // setup
                var buffer = this.getSessionStorageSendBuffer();

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
        });

        this.testCase({
            name: "SessionStorageSendBuffer: can clear empty buffer",
            test: () => {
                // setup
                var buffer = this.getSessionStorageSendBuffer();

                // act
                buffer.clear();

                // verify
                Assert.equal(0, buffer.count(), "buffer should be empty");
            }
        });

        this.testCase({
            name: "SessionStorageSendBuffer: call batchPayloads when a buffer is empty",
            test: () => {
                // setup
                var buffer = this.getSessionStorageSendBuffer();

                // act
                var batch = buffer.batchPayloads();

                // verify
                Assert.equal(null, batch, "expecting null");
            }
        });

        this.testCase({
            name: "SessionStorageSendBuffer: call batchPayloads when a buffer has one element",
            test: () => {
                // setup
                var buffer = this.getSessionStorageSendBuffer();

                // act
                var payload = "{ test: test }";

                buffer.enqueue(payload);
                var batch = buffer.batchPayloads();

                // verify
                Assert.equal("[" + payload + "]", batch, "invalid batch");
            }
        });

        this.testCase({
            name: "SessionStorageSendBuffer: call batchPayloads when a buffer has two elements",
            test: () => {
                // setup
                var buffer = this.getSessionStorageSendBuffer();

                // act
                var payload1 = "{ test: test }";
                var payload2 = "{ }";

                buffer.enqueue(payload1);
                buffer.enqueue(payload2);
                var batch = buffer.batchPayloads();

                // verify
                Assert.equal("[" + payload1 + "," + payload2 + "]", batch, "invalid batch");
            }
        });

        this.testCase({
            name: "SessionStorageSendBuffer: call batchPayloads when a buffer has two elements - emitLineDelimitedJson",
            test: () => {
                // setup
                var buffer = this.getSessionStorageSendBuffer(true);

                // act
                var payload1 = "{ test: test }";
                var payload2 = "{ test: test }";

                buffer.enqueue(payload1);
                buffer.enqueue(payload2);
                var batch = buffer.batchPayloads();

                // verify
                Assert.equal(payload1 + "\n" + payload2, batch, "invalid batch");
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

}

new SendBufferTests().registerTests(); 