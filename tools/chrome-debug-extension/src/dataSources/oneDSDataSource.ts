// -----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// </copyright>
// -----------------------------------------------------------------------

// import { IPerfEvent } from '@microsoft/applicationinsights-core-js';
import { IDataEvent } from './IDataEvent';
import { IDataSource } from './IDataSource';
import { isString, hasOwnProperty } from '@microsoft/applicationinsights-core-js';
import { strShimPrototype } from '@microsoft/applicationinsights-shims';

const strConstructor = "constructor";
export class OneDSDataSource implements IDataSource {
  private readonly listeners: Map<number, (newDataEvent: IDataEvent) => void> = new Map();
  private nextListenerId: number = 0;

  constructor() {}

  public startListening = (): void => {
    chrome.runtime.onMessage.addListener(this.onMessageReceived);
  };

  public stopListening = (): void => {
    chrome.runtime.onMessage.removeListener(this.onMessageReceived);
  };

  public addListener = (callback: (newDataEvent: IDataEvent) => void): number => {
    this.listeners.set(this.nextListenerId, callback);
    return this.nextListenerId++;
  };

  public removeListener = (id: number): boolean => {
    return this.listeners.delete(id);
  };

  // private onMessageReceived = (data: any, sender: any, sendResponse: any): void => {
  //   console.log(`Received message: ${data}`);
  //   if (data && data.eventType) {
  //     // tslint:disable-next-line:no-any
  //     this.listeners.forEach((listener: (newEvent: any) => void) => {
  //       listener({ name: data.eventType, time: 'whenever', data: {} });
  //     });
  //   }
  // }
  private onMessageReceived = (data: string, sender: any, sendResponse: any): void => {
    let event: any = JSON.parse(data);
    // console.log(`Received message: ${data}`);
      // tslint:disable-next-line:no-any
      this.listeners.forEach((listener: (newEvent: any) => void) => {
          listener({
            name: event.name || event.funcName + ":" + this._getTargetName(event.inst) || "other",
            start: event.start,
            // payload: JSON.stringify(perfEvent.payload),
            isAsync: event.isAsync ? "true" : "false",
            time: event.time,
            exTime: event.exTime,
            parent: event.parent || "undefined",
            // childEvts: JSON.stringify(perfEvent.childEvts),
            data: event // insert data as the perfEvent; conditional or always clickable and expandable?
          });
      });
  }

  
  private _getTargetName(target: any) {
    if (target) {
        if (isString(target.identifier)) {
            return target.identifier;
        }

        if (isString(target.name)) {
            return target.name;
        }

        if (hasOwnProperty(target, strShimPrototype)) {
            // Look like a prototype
            return target.name || "";
        }

        return ((target[strConstructor]) || {}).name || "";
    }

    return "";
  }
}
