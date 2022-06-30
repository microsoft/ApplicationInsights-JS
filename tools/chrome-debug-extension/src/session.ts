// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import FileSaver from "file-saver";
import _ from "lodash";
import { MessageSource } from "./Enums";
import { LogEntry } from "./LogEntry";
import { IFilterSettings } from "./components/IFilterSettings";
import { IConfiguration, ISpecialFieldNames } from "./configuration/IConfiguration";
import { DataEventType, IDataEvent } from "./dataSources/IDataEvent";
import { IDataSource } from "./dataSources/IDataSource";
import {
    ICounts, getCondensedDetails, getDynamicFieldValue, getEventType, getFieldValueAsString, getSessionId
} from "./dataSources/dataHelpers";
import { createDataSource } from "./dataSources/dataSources";
import { makeRegex } from "./helpers";
import { IMessage } from "./interfaces/IMessage";

export class Session {
    public onFilteredDataChanged: undefined | ((filterSettings: IFilterSettings) => void);

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

    constructor(public configuration: IConfiguration, prevSession?: Session) {
        this._dataSource = createDataSource(this.configuration);
        if (prevSession) {
            this._rawData = this._getSaveRawData(prevSession._rawData) || [];
            this.recalculateFilteredData();
        }

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
        const blob = new Blob([JSON.stringify(this._getSaveRawData(this._rawData))], { type: "application/json;charset=utf-8" });
        const now = new Date();
        const dateString = `${now.getFullYear().toString()}-${now.getMonth().toString().padStart(2, "0")}-${now
            .getDay()
            .toString()
            .padStart(2, "0")}`;
        const timeString = `${now.getHours().toString().padStart(2, "0")}.${now
            .getMinutes()
            .toString()
            .padStart(2, "0")}.${now.getSeconds().toString().padStart(2, "0")}.${now
            .getMilliseconds()
            .toString()
            .padStart(3, "0")}`;
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
                    // Remove any previous saved / cached condensedDetails
                    delete singleEvent.condensedDetails;
                    const sessionNo = singleEvent.sessionNumber;
                    if (sessionNo) {
                        const sessionNumber = Number.parseInt(sessionNo, 10);
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

    private _getSaveRawData(prevData: IDataEvent[]) {
        try {
            let saveData = JSON.parse(JSON.stringify(prevData));

            if (Array.isArray(saveData)) {

                // Repopulate sessionMap with the sessionNumbers already calculated in the stored data
                for (const singleEvent of saveData) {
                    // Remove content we don't want to save
                    delete singleEvent.condensedDetails;
                }
            } else if (saveData) {
                delete saveData.condensedDetails;
            }

            return saveData;
        } catch(e) {
            // ignore
        }

        return prevData || [];
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
            case "appLogic":
                newCounts.appLogic++;
                break;
            case "performance":
                newCounts.performance++;
                break;
            case "warning":
                newCounts.warning++;
                break;
            case "fatalError":
                newCounts.fatalError++;
                break;
            }
        };

        const filterText: string | undefined =
            this._filterSettings && this._filterSettings.filterText && this._filterSettings.filterText.length > 0
                ? this._filterSettings.filterText
                : undefined;
        const resultsFiltered: boolean = this._filterSettings &&
            (filterText !== undefined || this._filterSettings.filterByType !== undefined);
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
        this.onFilteredDataChanged && this.onFilteredDataChanged(this._filterSettings);
    }

    private filterTextAllowsIt(singleDataEvent: IDataEvent, filterText: string | undefined): boolean {
        if (!filterText) {
            return true;
        }

        let lowerFilterText = filterText.toLowerCase();
        let regEx: RegExp|null = null;
        if (filterText?.indexOf("*") !== -1) {
            regEx = makeRegex(filterText, false);
        }

        for (const columnToDisplay of this.configuration.columnsToDisplay) {
            const value = getDynamicFieldValue(singleDataEvent, columnToDisplay.prioritizedFieldNames);
            if (value) {
                switch (columnToDisplay.type) {
                case "SessionNumber":
                case "NumberDelta":
                case "TimeDelta":
                    break;
                default:
                    if (regEx) {
                        if (regEx.exec(value) != null) {
                            return true;
                        }
                    } else if (value.toLowerCase().includes(lowerFilterText)) {
                        return true;
                    }
                }
            }
        }

        if (this._filterSettings.filterContent) {
            let excludeKeys: string[] = [];
            let logEntry = singleDataEvent.logEntry = singleDataEvent.logEntry || new LogEntry(singleDataEvent.data, 0);
            if (logEntry.isMatch(filterText, excludeKeys, true)) {
                return true;
            }
        }

        return false;
    }

    private onNewDataEvent = (message: IMessage): void => {
        let dataEvent = message.details;

        switch (message.src) {
        case MessageSource.WebRequest:
            if (!this._filterSettings.listenNetwork) {
                // Stop logging web requests
                return;
            }
            break;
            
        case MessageSource.DebugEvent:
        case MessageSource.EventSentNotification:
        case MessageSource.EventsDiscardedNotification:
        case MessageSource.EventsSendNotification:
        case MessageSource.DiagnosticLog:
        case MessageSource.PerfEvent:
            if (!this._filterSettings.listenSdk) {
                // Stop logging SDK requests
                return ;
            }
            break;
        }

        // If the configuration specifies a required field, check to see if it is present
        if (this.configuration.ignoreEventsWithoutThisField) {
            const requiredValue = getFieldValueAsString(
                dataEvent.data,
                this.configuration.ignoreEventsWithoutThisField
            );
            if (requiredValue === undefined) {
                return;
            }
        }

        // Annotate the new event
        dataEvent.condensedDetails = getCondensedDetails(dataEvent, this.configuration);
        dataEvent.sessionNumber = dataEvent.sessionNumber || this.getSessionNumber(dataEvent);
        dataEvent.type = dataEvent.type || getEventType(dataEvent, this.configuration);
        dataEvent.tabId = dataEvent.tabId || message.tabId;

        let specialFieldNames: ISpecialFieldNames = (this.configuration.specialFieldNames || {});

        // Parse any JSON fields and replace them with the parsed object
        if (specialFieldNames.jsonFieldNames) {
            for (const jsonFieldName of specialFieldNames.jsonFieldNames) {
                const stringValue = getFieldValueAsString(dataEvent.data, jsonFieldName);
                if (stringValue !== undefined) {
                    try {
                        const objectValue = JSON.parse(stringValue);
                        _.set(dataEvent, jsonFieldName, objectValue);
                    } catch {
                        // That's OK, best effort
                    }
                }
            }
        }

        // Add it to the raw list in time order
        this._rawData.push(dataEvent);
        this._rawData.sort((a: IDataEvent, b: IDataEvent) => Date.parse(a.time) - Date.parse(b.time));

        // Reapply filter (if any)
        this.recalculateFilteredData();
    };

    private getSessionNumber = (dataEvent: IDataEvent): string => {
        const sessionId = getSessionId(dataEvent, this.configuration);

        if (sessionId && sessionId !== "mis") {
            let sessionNumber = this._sessionMap.get(sessionId);
            if (sessionNumber === undefined) {
                sessionNumber = this._nextSessionNumber++;
                this._sessionMap.set(sessionId, sessionNumber);
            }
            return sessionNumber.toLocaleString();
        }

        return "?";
    };
}
