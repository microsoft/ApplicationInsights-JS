// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { MessageSource, MessageType } from "../Enums";
import { IMessage } from "../interfaces/IMessage";
import { IDataSource } from "./IDataSource";

/**
 * This data source listens to both the network and the SDK for events
 */
export class DefaultDataSource implements IDataSource {

    public addListener: (callback: (newMessage: IMessage) => void) => number;
    public removeListener: (id: number) => boolean;
    public startListening: () => void;
    public stopListening: () => void;

    constructor(_tabId: number, urls: string[], ignoreNotifications?: boolean) {
        let _self = this;
        let listeners: Map<number, (newMessage: IMessage) => void> = new Map();
        let nextListenerId: number = 0;

        if (!urls || urls.length === 0) {
            urls = ["*://*.microsoft.com/OneCollector/*", "*://*.visualstudio.com/v2/track*", "*://*.eastus-8.in.applicationinsights.azure.com/v2/track*"];
        }

        _self.startListening = (): void => {
            // Monitor network traffic for telemetry
            chrome.webRequest.onBeforeRequest.addListener(
                (details: chrome.webRequest.WebRequestBodyDetails) => {
                    Promise.resolve(_processWebRequest(details)).then(() => {
                        return {};
                    }).catch((error) => {
                        console.error("Error during processing:", error);
                        return {};
                    });
                    return {};
                },
                // filters
                {
                    urls
                },
                ["requestBody"]
            );

            chrome.runtime.onMessage.addListener(_onMessageReceived);
        };
    
        _self.stopListening = (): void => {
            chrome.webRequest.onBeforeRequest.removeListener((details: chrome.webRequest.WebRequestBodyDetails) => {
                Promise.resolve(_processWebRequest(details)).then(() => {
                    return {};
                }).catch((error) => {
                    console.error("Error during processing:", error);
                    return {};
                });
                return {};
            });
            chrome.runtime.onMessage.removeListener(_onMessageReceived);
        };
    
        _self.addListener = (callback: (newMessage: IMessage) => void): number => {
            listeners.set(nextListenerId, callback);
            return nextListenerId++;
        };
    
        _self.removeListener = (id: number): boolean => {
            return listeners.delete(id);
        };

        let decompressEvents = async function (compressedString: ArrayBuffer) {
            // Step 1: Convert the binary string to a Uint8Array
            const binaryData = compressedString;
        
            // Step 2: Create a ReadableStream from the Uint8Array
            const compressedReadableStream = new ReadableStream({
                start(controller) {
                    controller.enqueue(binaryData);
                    controller.close();
                }
            });

            const DecompressionStream = (window as any).DecompressionStream;
            if (!DecompressionStream) {
                console.error("DecompressionStream is not available in this environment");
                return null;  // Return null or handle the error accordingly
            }
        
            // Step 3: Pipe through DecompressionStream
            const decompressedReadableStream = compressedReadableStream.pipeThrough(
                new (window as any).DecompressionStream("gzip")
            );
        
            let decompressedUint8Array: Uint8Array;

            // Read the decompressed chunks
            const reader = decompressedReadableStream.getReader();
            let result;
            const chunks: Uint8Array[] = [];

            // Read all chunks
            while (!(result = await reader.read()).done) {
                let chunk = result.value;
                if (chunk instanceof Uint8Array) {
                    chunks.push(chunk);
                }
            }

            // Calculate the total size of all chunks
            const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);

            // Create a single Uint8Array to hold all chunks
            decompressedUint8Array = new Uint8Array(totalLength);

            // Copy all chunks into the decompressedUint8Array
            let offset = 0;
            for (const chunk of chunks) {
                decompressedUint8Array.set(chunk, offset); // Copy the chunk into the array
                offset += chunk.length; // Move the offset by the chunk length
            }
            return decompressedUint8Array.buffer;
        };
    
        async function _processWebRequest(details: chrome.webRequest.WebRequestBodyDetails): Promise<void> {
            if (details && (details.type === "xmlhttprequest" || details.type === "ping")) {
                let rawdata: chrome.webRequest.UploadData[] | undefined;
                if (details.requestBody && details.requestBody.raw && details.requestBody.raw.length > 0 && details.requestBody.raw[0].bytes) {
                    rawdata = details.requestBody.raw;
                    const arrayBuffer = details.requestBody.raw[0].bytes;

                    // Check if the data might be gzipped (first two bytes 0x1F 0x8B)
                    const checkGzip = new Uint8Array(arrayBuffer);
                    if (checkGzip[0] === 0x1F && checkGzip[1] === 0x8B) {
                        console.log("This is gzipped.");
                        
                        // Decompress the gzipped data
                        try {
                            let decompressedData = await decompressEvents(arrayBuffer);
                            if (decompressedData) {
                                rawdata[0].bytes = decompressedData;
                                console.log("After decompression:", rawdata);
                            } else {
                                console.error("Decompression failed.");
                            }
                            
                        } catch (error) {
                            console.error("Error during decompression:", error);
                        }
                    } else {
                        console.log("Data is not gzipped.");
                    }
                }
                const events = details.requestBody && _convertToStringArray(rawdata);
                if (events) {
                    for (let i = events.length - 1; i >= 0; i--) {
                        try {
                            const event = JSON.parse(events[i]);
                            if (event !== undefined) {
                                if (Array.isArray(event)) {
                                    for (const subEvent of event) {
                                        _handleMessage(subEvent, details);
                                    }
                                } else {
                                    _handleMessage(event, details);
                                }
                            }
                        } catch (e) {
                            // Ignore
                        }
                    }
                }
            }
        }
    
        function _handleMessage(message: any, details: chrome.webRequest.WebRequestBodyDetails): void {
            if (message) {
                let msg: IMessage = {
                    id: MessageType.Network,
                    src: MessageSource.WebRequest,
                    tabId: details.tabId,
                    details: {
                        name: message.name,
                        time: message.time,
                        data: message
                    }
                };
                listeners.forEach((listener: (message: IMessage) => void) => {
                    listener(msg);
                });
            }
        }
    
        function _convertToStringArray(buf: chrome.webRequest.UploadData[] | undefined): string[] {
            if (buf !== undefined) {
                try {
                    const data = buf[0].bytes;
                    if (data) {
                        const decoder = new TextDecoder();
                        return decoder.decode(new Uint8Array(data)).split("\n");
                    }
                } catch (e) {
                    // Ignore
                }
            }

            return [];
        }

        function _onMessageReceived(message: any, sender: any, sendResponse: any): void {
            let msg = message as IMessage;
    
            if (ignoreNotifications === true && msg.id === MessageType.Notification) {
                return;
            }
            
            // Only handle notifications and
            if (msg.id === MessageType.Notification || msg.id === MessageType.DebugEvent || msg.id === MessageType.DiagnosticLog || msg.id === MessageType.GenericEvent) {
                if (sender && sender.tab && msg.details) {
                    msg.tabId = msg.tabId || sender.tab.id;

                    try {
                        listeners.forEach((listener: (message: IMessage) => void) => {
                            listener(msg);
                        });
                    } catch (e) {
                        console.error("Unexpected Message: " + JSON.stringify(e));
                    }
                }
            }
        }
    }
}
