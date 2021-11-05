// -----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// </copyright>
// -----------------------------------------------------------------------

import { IDataEvent } from "./IDataEvent";
import { IDataSource } from "./IDataSource";

export class NetworkDataSource implements IDataSource {
    private readonly listeners: Map<number, (newDataEvent: IDataEvent) => void> = new Map();
    private nextListenerId: number = 0;

    constructor(private urls?: string) { }

    public startListening = (): void => {
        // Monitor network traffic for telemetry
        chrome.webRequest.onBeforeRequest.addListener(
            this.processWebRequest,
            // filters
            {
                urls: [this.urls || "*://*.microsoft.com/OneCollector/*"]
            },
            ["requestBody"]
        );
    };

    public stopListening = (): void => {
        chrome.webRequest.onBeforeRequest.removeListener(this.processWebRequest);
    };

    public addListener = (callback: (newDataEvent: IDataEvent) => void): number => {
        this.listeners.set(this.nextListenerId, callback);
        return this.nextListenerId++;
    };

    public removeListener = (id: number): boolean => {
        return this.listeners.delete(id);
    };

    private processWebRequest = (details: chrome.webRequest.WebRequestBodyDetails): void => {
        if (details.type === "xmlhttprequest") {
            const events = details.requestBody && this.convertToStringArray(details.requestBody.raw);
            if (events) {
                for (let i = events.length - 1; i >= 0; i--) {
                    const event = JSON.parse(events[i]);
                    if (event !== undefined) {
                        if (Array.isArray(event)) {
                            for (const subEvent of event) {
                                this.handleMessage(subEvent);
                            }
                        } else {
                            this.handleMessage(event);
                        }
                    }
                }
            }
        }
    };

    // tslint:disable-next-line:no-any
    private handleMessage = (message: any): void => {
        this.listeners.forEach((listener: (newEvent: IDataEvent) => void) => {
            listener(message as IDataEvent);
        });
    };

    private convertToStringArray(buf: chrome.webRequest.UploadData[] | undefined): string[] {
        if (buf !== undefined) {
            const data = buf[0].bytes;
            if (data) {
                const decoder = new TextDecoder();
                return decoder.decode(new Uint8Array(data)).split("\n");
            }
        }
        return [""];
    }
}
