// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { createAsyncRejectedPromise, doAwait, IPromise } from "@nevware21/ts-async";
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
                _processWebRequest,
                // filters
                {
                    urls
                },
                ["requestBody"]
            );

            chrome.runtime.onMessage.addListener(_onMessageReceived);
        };
    
        _self.stopListening = (): void => {
            chrome.webRequest.onBeforeRequest.removeListener(_processWebRequest);
            chrome.runtime.onMessage.removeListener(_onMessageReceived);
        };
    
        _self.addListener = (callback: (newMessage: IMessage) => void): number => {
            listeners.set(nextListenerId, callback);
            return nextListenerId++;
        };
    
        _self.removeListener = (id: number): boolean => {
            return listeners.delete(id);
        };

        function isGzip(data: ArrayBuffer): boolean {
            const checkGzip = new Uint8Array(data);
            if (checkGzip[0] === 0x1F && checkGzip[1] === 0x8B) {
                console.log("This is gzipped.");
                return true;
            }
            return false;
        }

        function decompressEvents(compressedString: ArrayBuffer): IPromise<Uint8Array> {
            const DecompressionStream = (window as any).DecompressionStream;
        
            if (DecompressionStream && typeof DecompressionStream !== "undefined") {
                // If DecompressionStream is available, use it
                const binaryData = new Uint8Array(compressedString);
        
                // Create a ReadableStream from the Uint8Array
                const compressedReadableStream = new ReadableStream({
                    start(controller) {
                        controller.enqueue(binaryData);
                        controller.close();
                    }
                });
        
                // Pipe through the DecompressionStream (gzip)
                const decompressedReadableStream = compressedReadableStream.pipeThrough(
                    new DecompressionStream("gzip")
                );
        
                // Read the decompressed stream and return a Uint8Array
                return new Response(decompressedReadableStream)
                    .arrayBuffer()
                    .then((decompressedBuffer) => {
                        return new Uint8Array(decompressedBuffer); // Return the decompressed data as Uint8Array
                    });
            } else {
                return createAsyncRejectedPromise(new Error("DecompressionStream is not supported in this environment."));
            }
        }

        function processEvents(events: string[] | null, details: chrome.webRequest.WebRequestBodyDetails): void {
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
    
        function _processWebRequest(details: chrome.webRequest.WebRequestBodyDetails): void {
            if (details && (details.type === "xmlhttprequest" || details.type === "ping")) {
                if (details.requestBody && details.requestBody.raw) {
                    let gzipped = isGzip(details.requestBody.raw[0].bytes as ArrayBuffer);
                    console.log("Gzipped: " + gzipped);
                    var events: string[] | null;
                    if (gzipped) {
                        doAwait(decompressEvents(details.requestBody.raw[0].bytes as ArrayBuffer), (decompressedData) => {
                            if (decompressedData) {
                                // details.requestBody.raw[0].bytes = decompressedData;
                                console.log("After decompression:", decompressedData);
                                events = _convertToStringArray([{bytes: decompressedData}]);
                                processEvents(events, details);
                            } else {
                                console.error("Decompression failed.");
                            }
                        });
                    } else {
                        events = details.requestBody && _convertToStringArray(details.requestBody.raw);
                        processEvents(events, details);
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
