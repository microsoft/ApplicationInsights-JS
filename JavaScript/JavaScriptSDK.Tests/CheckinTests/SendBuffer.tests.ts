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
                Assert.equal("[" + payload1 + ","+ payload2 + "]", batch, "invalid batch");
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

                // act
                var payload1 = "{ test: test }";
                var payload2 = "{ test: test }";

                buffer.enqueue(payload1);
                buffer.enqueue(payload2);

                var buffer2 = this.getSessionStorageSendBuffer(true);

                // verify
                Assert.equal(2, buffer2.count(), "there should be two elements in the buffer");
            }
        });
    }
}

new SendBufferTests().registerTests(); 