// -----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// </copyright>
// -----------------------------------------------------------------------

import FileSaver from 'file-saver';
import _ from 'lodash';

import { IFilterSettings } from './components/IFilterSettings';
import { IConfiguration } from './configuration/IConfiguration';
import {
  getCondensedDetails,
  getDynamicFieldValue,
  getEventType,
  getFieldValueAsString,
  getSessionId,
  ICounts
} from './dataSources/dataHelpers';
import { createDataSource } from './dataSources/dataSources';
import { DataEventType, IDataEvent } from './dataSources/IDataEvent';
import { IDataSource } from './dataSources/IDataSource';

export class Session {
  public onFilteredDataChanged: undefined | (() => void);

  private _dataSource: IDataSource;
  private _filteredData: IDataEvent[];
  private _rawData: IDataEvent[] = [];
  private _filterSettings: IFilterSettings;
  private _listenerSubscriptionId: number;
  private _sessionMap = new Map<string, number>();
  private _nextSessionNumber = 0;
  private _counts: ICounts = {
    all: 0,
    appLogic: 0,
    performance: 0,
    warning: 0,
    fatalError: 0
  };

  public get filteredData(): IDataEvent[] {
    return this._filteredData;
  }

  public set filterSettings(newFilterSettings: IFilterSettings) {
    this._filterSettings = newFilterSettings;
    this.recalculateFilteredData();
  }

  public get counts(): ICounts {
    return this._counts;
  }

  constructor(public configuration: IConfiguration) {
    this._dataSource = createDataSource(this.configuration);

    this._dataSource.startListening();
    this._listenerSubscriptionId = this._dataSource.addListener(this.onNewDataEvent);
  }

  public clear(): void {
    this._sessionMap.clear();
    this._nextSessionNumber = 0;
    this._rawData = [];
    this.recalculateFilteredData();
  }

  public save(): void {
    const blob = new Blob([JSON.stringify(this._rawData)], { type: 'application/json;charset=utf-8' });
    const now = new Date();
    const dateString = `${now.getFullYear().toString()}-${now.getMonth().toString().padStart(2, '0')}-${now
      .getDay()
      .toString()
      .padStart(2, '0')}`;
    const timeString = `${now.getHours().toString().padStart(2, '0')}.${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}.${now.getSeconds().toString().padStart(2, '0')}.${now
      .getMilliseconds()
      .toString()
      .padStart(3, '0')}`;
    const fileName = `Telemetry capture ${dateString} ${timeString}.json`;
    FileSaver.saveAs(blob, fileName);
  }

  public load(saveData: string): boolean {
    try {
      const parsedData = JSON.parse(saveData);

      if (Array.isArray(parsedData)) {
        this._rawData = parsedData;

        // Repopulate sessionMap with the sessionNumbers already calculated in the stored data
        for (const singleEvent of this._rawData) {
          if (singleEvent.sessionNumber) {
            const sessionNumber = Number.parseInt(singleEvent.sessionNumber, 10);
            const sessionId = getSessionId(singleEvent, this.configuration);
            if (sessionId && !isNaN(sessionNumber)) {
              this._sessionMap.set(sessionId, sessionNumber);
              if (sessionNumber >= this._nextSessionNumber) {
                this._nextSessionNumber = sessionNumber + 1;
              }
            }
          }
        }

        this.recalculateFilteredData();

        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  public dispose(): void {
    this._dataSource.removeListener(this._listenerSubscriptionId);
    this._dataSource.stopListening();
  }

  private recalculateFilteredData(): void {
    const newCounts: ICounts = {
      all: 0,
      appLogic: 0,
      performance: 0,
      warning: 0,
      fatalError: 0
    };

    const incrementCounts = (dataEventType?: DataEventType) => {
      newCounts.all++;
      switch (dataEventType) {
        case 'appLogic':
          newCounts.appLogic++;
          break;
        case 'performance':
          newCounts.performance++;
          break;
        case 'warning':
          newCounts.warning++;
          break;
        case 'fatalError':
          newCounts.fatalError++;
          break;
      }
    };

    const filterText: string | undefined =
      this._filterSettings.filterText && this._filterSettings.filterText.length > 0
        ? this._filterSettings.filterText.toLowerCase()
        : undefined;
    const resultsFiltered: boolean =
      filterText !== undefined || this._filterSettings.filterByType !== undefined;
    const newFilteredData: IDataEvent[] = resultsFiltered ? [] : this._rawData.slice();

    // tslint:disable-next-line:no-any
    this._rawData.forEach((singleDataEvent: IDataEvent): void => {
      if (resultsFiltered) {
        const filterByTextAllowsIt = this.filterTextAllowsIt(singleDataEvent, filterText);
        const filterByTypeAllowsIt: boolean = this._filterSettings.filterByType
          ? singleDataEvent.type === this._filterSettings.filterByType
          : true;

        // Counts should only be filtered by text, not event type
        if (filterByTextAllowsIt) {
          incrementCounts(singleDataEvent.type);
        }

        // Final results should be filtered by both text and event type
        if (filterByTypeAllowsIt && filterByTextAllowsIt) {
          newFilteredData.push(singleDataEvent);
        }
      } else {
        incrementCounts(singleDataEvent.type);
      }
    });

    // Save the results
    this._counts = newCounts;
    this._filteredData = newFilteredData;

    // Notify the listener if there is one
    this.onFilteredDataChanged && this.onFilteredDataChanged();
  }

  private filterTextAllowsIt(singleDataEvent: IDataEvent, filterText: string | undefined): boolean {
    if (!filterText) {
      return true;
    }

    for (const columnToDisplay of this.configuration.columnsToDisplay) {
      const value = getDynamicFieldValue(singleDataEvent, columnToDisplay.prioritizedFieldNames);
      if (value && value.toLowerCase().includes(filterText)) {
        return true;
      }
    }
    return false;
  }

  private onNewDataEvent = (newDataEvent: IDataEvent): void => {
    // If the configuration specifies a required field, check to see if it is present
    if (this.configuration.ignoreEventsWithoutThisField) {
      const requiredValue = getFieldValueAsString(
        newDataEvent,
        this.configuration.ignoreEventsWithoutThisField
      );
      if (requiredValue === undefined) {
        return;
      }
    }

    // Annotate the new event
    newDataEvent.condensedDetails = getCondensedDetails(newDataEvent, this.configuration);
    newDataEvent.sessionNumber = this.getSessionNumber(newDataEvent);
    newDataEvent.type = getEventType(newDataEvent, this.configuration);

    // Parse any JSON fields and replace them with the parsed object
    if (this.configuration.specialFieldNames.jsonFieldNames) {
      for (const jsonFieldName of this.configuration.specialFieldNames.jsonFieldNames) {
        const stringValue = getFieldValueAsString(newDataEvent, jsonFieldName);
        if (stringValue !== undefined) {
          try {
            const objectValue = JSON.parse(stringValue);
            _.set(newDataEvent, jsonFieldName, objectValue);
          } catch {
            // That's OK, best effort
          }
        }
      }
    }

    // Add it to the raw list in time order
    this._rawData.push(newDataEvent);
    this._rawData.sort((a: IDataEvent, b: IDataEvent) => Date.parse(a.time) - Date.parse(b.time));

    // Reapply filter (if any)
    this.recalculateFilteredData();
  };

  private getSessionNumber = (dataEvent: IDataEvent): string => {
    const sessionId = getSessionId(dataEvent, this.configuration);

    if (sessionId && sessionId !== 'mis') {
      let sessionNumber = this._sessionMap.get(sessionId);
      if (sessionNumber === undefined) {
        sessionNumber = this._nextSessionNumber++;
        this._sessionMap.set(sessionId, sessionNumber);
      }
      return sessionNumber.toLocaleString();
    }

    return '?';
  };
}
