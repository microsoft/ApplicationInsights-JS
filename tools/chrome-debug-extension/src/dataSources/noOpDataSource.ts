// -----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// </copyright>
// -----------------------------------------------------------------------

import { IDataEvent } from './IDataEvent';
import { IDataSource } from './IDataSource';

export class NoOpDataSource implements IDataSource {
  private nextListenerId: number = 0;

  public startListening = (): void => {
  };

  public stopListening = (): void => {
  };

  public addListener = (callback: (newDataEvent: IDataEvent) => void): number => {
    return this.nextListenerId++;
  };

  public removeListener = (id: number): boolean => {
    return true;
  };
}
