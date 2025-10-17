import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { _eInternalMessageId } from "@microsoft/applicationinsights-common";
import { SenderPostManager } from "../../../src/JavaScriptSDK/SenderPostManager";
import { IPayloadData } from "@microsoft/applicationinsights-common";
import { getInst, isFunction, mathRandom } from "@nevware21/ts-utils";
import { createPromise, doAwaitResponse } from "@nevware21/ts-async";

export class SendPostManagerTests extends AITestClass {
    private _sender: SenderPostManager;
    private _isCompressionSupported: boolean;
    
    public testInitialize() {
        super.testInitialize();
        this._sender = new SenderPostManager();
        
        // Check if CompressionStream is supported in this environment
        const csStream = getInst("CompressionStream");
        this._isCompressionSupported = isFunction(csStream);
    }

    public testCleanup() {
        super.testCleanup();
        this._sender = null;
    }

   public registerTests() {
        this.testCase({
            name: "preparePayload: compression disabled",
            test: () => {
                const originalData = "This is test data for compression disabled test";
                const payload: IPayloadData = {
                    urlString: "https://test.com",
                    data: originalData,
                    headers: {}
                };

                return createPromise<void>((resolve) => {
                    let callbackPayload: IPayloadData = null;
                    const callback = (processedPayload: IPayloadData) => {
                        callbackPayload = processedPayload;
                        resolve();
                    };

                    // Compression disabled (zipPayload = false)
                    this._sender.preparePayload(callback, false, payload, false);
                    
                    Assert.ok(callbackPayload, "Callback should be called with payload");
                    Assert.equal(callbackPayload.data, originalData, "Data should remain unchanged when compression is disabled");
                    Assert.ok(!callbackPayload.headers["Content-Encoding"], "Content-Encoding header should not be set");
                });
            }
        });

        this.testCase({
            name: "preparePayload: isSync should bypass compression",
            test: () => {
                const originalData = "This is test data for isSync test";
                const payload: IPayloadData = {
                    urlString: "https://test.com",
                    data: originalData,
                    headers: {}
                };

                return createPromise<void>((resolve) => {
                    let callbackPayload: IPayloadData = null;
                    const callback = (processedPayload: IPayloadData) => {
                        callbackPayload = processedPayload;
                        resolve();
                    };

                    // isSync = true should bypass compression even if zipPayload is true
                    this._sender.preparePayload(callback, true, payload, true);
                    
                    Assert.ok(callbackPayload, "Callback should be called with payload");
                    Assert.equal(callbackPayload.data, originalData, "Data should remain unchanged when isSync is true");
                    Assert.ok(!callbackPayload.headers["Content-Encoding"], "Content-Encoding header should not be set");
                });
            }
        });

        this.testCase({
            name: "preparePayload: empty payload data should bypass compression",
            test: () => {
                const payload: IPayloadData = {
                    urlString: "https://test.com",
                    data: null,
                    headers: {}
                };

                return createPromise<void>((resolve) => {
                    let callbackPayload: IPayloadData = null;
                    const callback = (processedPayload: IPayloadData) => {
                        callbackPayload = processedPayload;
                        resolve();
                    };

                    // null payload.data should bypass compression
                    this._sender.preparePayload(callback, true, payload, false);
                    
                    Assert.ok(callbackPayload, "Callback should be called with payload");
                    Assert.equal(callbackPayload.data, null, "null data should remain null");
                    Assert.ok(!callbackPayload.headers["Content-Encoding"], "Content-Encoding header should not be set");
                });
            }
        });

        this.testCase({
            name: "preparePayload: compression enabled with string data",
            timeout: 5000,
            useFakeTimers: false,
            test: () => {
                // Skip test if CompressionStream is not supported in this environment
                if (!this._isCompressionSupported) {
                    Assert.ok(true, "CompressionStream is not supported in this environment, skipping test");
                    return;
                }

                const originalData = "This is test data for compression with string data test";
                const payload: IPayloadData = {
                    urlString: "https://test.com",
                    data: originalData,
                    headers: {}
                };

                return createPromise<void>((resolve) => {

                    let callbackPayload: IPayloadData = null;
                    const callback = (processedPayload: IPayloadData) => {
                        callbackPayload = processedPayload;
                        
                        Assert.ok(callbackPayload, "Callback should be called with payload");
                        Assert.ok(callbackPayload.data instanceof Uint8Array, "Data should be compressed into a Uint8Array");
                        Assert.equal(callbackPayload.headers["Content-Encoding"], "gzip", "Content-Encoding header should be set to gzip");
                        Assert.ok((callbackPayload as any)._chunkCount >= 1, "There should be at least 1 chunk in the compressed data - [" + (callbackPayload as any)._chunkCount + "] chunks processed");
                        
                        // Verify the compressed data can be decompressed back to original
                        this._decompressPayload(callbackPayload.data as Uint8Array).then(decompressedData => {
                            const decoder = new TextDecoder();
                            const decompressedString = decoder.decode(decompressedData);
                            Assert.equal(decompressedString, originalData, "Decompressed data should match original");
                            resolve();
                        }).catch(err => {
                            Assert.ok(false, "Failed to decompress data: " + err);
                            resolve();
                        });
                    };

                    // Enable compression
                    this._sender.preparePayload(callback, true, payload, false);
                });
            }
        });

        this.testCase({
            name: "preparePayload: compression with large payload requiring multiple chunks",
            timeout: 10000, // Longer timeout for large payload
            useFakeTimers: false,
            test: () => {
                // Skip test if CompressionStream is not supported in this environment
                if (!this._isCompressionSupported) {
                    Assert.ok(true, "CompressionStream is not supported in this environment, skipping test");
                    return;
                }

                // Create a large payload that will likely require multiple chunks
                let largePayload = "This is a large payload for compression test.\n";
                while (largePayload.length < 2000000) {
                    largePayload += (mathRandom().toString(36).substring(2)).repeat(2);
                }
                const payload: IPayloadData = {
                    urlString: "https://test.com",
                    data: largePayload,
                    headers: {}
                };

                return createPromise<void>((resolve) => {
                    let callbackPayload: IPayloadData = null;
                    const callback = (processedPayload: IPayloadData) => {
                        callbackPayload = processedPayload;
                        
                        Assert.ok(callbackPayload, "Callback should be called with payload");
                        Assert.ok(callbackPayload.data instanceof Uint8Array, "Data should be compressed into a Uint8Array");
                        Assert.equal(callbackPayload.headers["Content-Encoding"], "gzip", "Content-Encoding header should be set to gzip");
                        
                        // Verify the compressed data is smaller than the original (compression should work)
                        Assert.ok((callbackPayload.data as Uint8Array).length < largePayload.length, 
                            "Compressed data should be smaller than original");
                        
                        Assert.ok((callbackPayload as any)._chunkCount > 1, "There should be multiple chunks in the compressed data - [" + (callbackPayload as any)._chunkCount + "] chunks processed");

                        // Verify the compressed data can be decompressed back to original
                        this._decompressPayload(callbackPayload.data as Uint8Array).then(decompressedData => {
                            const decoder = new TextDecoder();
                            const decompressedString = decoder.decode(decompressedData);
                            Assert.equal(decompressedString, largePayload, "Decompressed data should match original");
                            resolve();
                        }).catch(err => {
                            Assert.ok(false, "Failed to decompress data: " + err);
                            resolve();
                        });
                    };

                    // Enable compression
                    this._sender.preparePayload(callback, true, payload, false);
                });
            }
        });
    }
    
    /**
     * Helper method to decompress payload data using DecompressionStream
     */
    private _decompressPayload(compressedData: Uint8Array): Promise<Uint8Array> {
        return new Promise<Uint8Array>((resolve, reject) => {
            try {
                const dsStream: any = getInst("DecompressionStream");
                if (!isFunction(dsStream)) {
                    reject(new Error("DecompressionStream is not supported"));
                    return;
                }

                // Create a readable stream from compressed data
                const compressedStream = new ReadableStream<Uint8Array>({
                    start(controller) {
                        controller.enqueue(compressedData);
                        controller.close();
                    }
                });
                
                // Decompress the data
                const decompressedStream = compressedStream.pipeThrough(new dsStream("gzip"));
                const reader = (decompressedStream.getReader() as ReadableStreamDefaultReader<Uint8Array>);
                const chunks: Uint8Array[] = [];
                let totalLength = 0;

                // Process each chunk from the decompressed stream reader
                doAwaitResponse(reader.read(), function processChunk(response: any): undefined | Promise<any> {
                    if (!response.rejected) {
                        // Process the chunk and continue reading
                        const result = response.value;
                        if (!result.done) {
                            // Add current chunk and continue reading
                            chunks.push(result.value);
                            totalLength += result.value.length;
                            return doAwaitResponse(reader.read(), processChunk) as any;
                        }

                        // We are complete so combine all chunks
                        const combined = new Uint8Array(totalLength);
                        let offset = 0;
                        for (const chunk of chunks) {
                            combined.set(chunk, offset);
                            offset += chunk.length;
                        }
                        
                        // Return the decompressed data
                        resolve(combined);
                    } else {
                        reject(response.reason);
                    }
                });
                
            } catch (error) {
                reject(error);
            }
        });
    }
}