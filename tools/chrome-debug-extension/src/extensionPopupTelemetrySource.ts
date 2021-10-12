// -----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// </copyright>
// -----------------------------------------------------------------------

import { ITelemetrySource } from './telemetryViewer';

export class ExtensionPopupTelemetrySource implements ITelemetrySource {
  // tslint:disable-next-line:no-any
  private readonly listeners: Map<number, (newEvent: any) => void> = new Map();
  private nextListenerId: number = 0;

  public startListening = (): void => {
    chrome.runtime.onMessage.addListener(this.handleMessage);
  };

  public stopListening = (): void => {
    chrome.runtime.onMessage.addListener(this.handleMessage);
  };

  // tslint:disable-next-line:no-any
  public addTelemetryListener = (callback: (newEvent: any) => void): number => {
    this.listeners.set(this.nextListenerId, callback);
    return this.nextListenerId++;
  };

  public removeTelemetryListener = (id: number): boolean => {
    return this.listeners.delete(id);
  };

  // tslint:disable-next-line:no-any
  public handleMessage = (message: any): void => {
    // tslint:disable-next-line:no-any
    this.listeners.forEach((listener: (newEvent: any) => void) => {
      listener(message);
    });
  };
}
