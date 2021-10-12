// -----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// </copyright>
// -----------------------------------------------------------------------

import FileSaver from 'file-saver';
import * as React from 'react';
import {
  EventType,
  getCondensedDetails,
  getDynamicValue,
  getEventType,
  ICounts,
  unpackMessage
} from './dataHelpers';
import { EventDetails } from './eventDetails';
import { EventTable } from './eventTable';
import { IConfiguration } from './IConfiguration';
import { OptionsBar } from './optionsBar';
import { SplitPanel } from './splitPanel';

export interface ITelemetrySource {
  // tslint:disable-next-line:no-any
  addTelemetryListener: (newEvent: any) => number;
  removeTelemetryListener: (id: number) => boolean;
}

interface ITelemetryViewerProps {
  telemetrySource: ITelemetrySource;
}

const configurationCacheKey = 'configuration';

export const TelemetryViewer = (props: ITelemetryViewerProps): React.ReactElement<ITelemetryViewerProps> => {
  // tslint:disable-next-line:no-any
  const [eventData, setEventData] = React.useState<any[]>([]);
  const sessionMap = React.useRef<Map<string, number>>(new Map<string, number>());
  const nextSessionNumber = React.useRef<number>(0);

  // tslint:disable-next-line:no-any
  const [filteredEventData, setFilteredEventData] = React.useState<any[]>([]);
  const [configuration, setConfiguration] = React.useState<IConfiguration>({
    filterText: '',
    filterByType: undefined,
    showCondensedDetails: false
  });
  const [selectedIndex, setSelectedIndex] = React.useState<number | undefined>(undefined);
  const [counts, setCounts] = React.useState<ICounts>({
    all: 0,
    appLogic: 0,
    performance: 0,
    warning: 0,
    fatalError: 0
  });
  const [isDraggingOver, setIsDraggingOver] = React.useState<boolean>(false);

  // tslint:disable-next-line:no-any
  const reprocessAllEventData = (eventsToProcess: any[], configurationToUse: IConfiguration): void => {
    const newCounts: ICounts = {
      all: 0,
      appLogic: 0,
      performance: 0,
      warning: 0,
      fatalError: 0
    };

    // tslint:disable-next-line:no-any
    const incrementCounts = (singleEvent: any) => {
      const eventType = getEventType(singleEvent);
      newCounts.all++;
      switch (eventType) {
        case EventType.appLogic:
          newCounts.appLogic++;
          break;
        case EventType.performance:
          newCounts.performance++;
          break;
        case EventType.warning:
          newCounts.warning++;
          break;
        case EventType.fatalError:
          newCounts.fatalError++;
          break;
      }
    };

    // tslint:disable-next-line:no-any
    const results: any[] = [];
    const filterText: string | undefined =
      configurationToUse.filterText && configurationToUse.filterText.length > 0
        ? configurationToUse.filterText.toLowerCase()
        : undefined;
    const resultsFiltered: boolean =
      filterText !== undefined || configurationToUse.filterByType !== undefined;

    // tslint:disable-next-line:no-any
    eventsToProcess.forEach((singleEvent: any): void => {
      if (resultsFiltered) {
        const filterTextAllowsIt: boolean = filterText
          ? singleEvent.name.toLowerCase().includes(filterText) ||
            singleEvent.dynamicValue.toLowerCase().includes(filterText) ||
            (singleEvent.data.name && singleEvent.data.name.toLowerCase().includes(filterText))
          : true;
        const filterByTypeAllowsIt: boolean = configurationToUse.filterByType
          ? getEventType(singleEvent) === configurationToUse.filterByType
          : true;

        // Counts should only be filtered by text, not event type
        if (filterTextAllowsIt) {
          incrementCounts(singleEvent);
        }

        // Final results should be filtered by both text and event type
        if (filterByTypeAllowsIt && filterTextAllowsIt) {
          results.push(singleEvent);
        }
      } else {
        incrementCounts(singleEvent);
      }
    });

    setCounts(newCounts);
    setFilteredEventData(resultsFiltered ? results : eventsToProcess);
  };

  // tslint:disable-next-line:no-any
  const handleMessage = (message: any): void => {
    const newEvent = unpackMessage(message);

    if (
      newEvent === undefined ||
      newEvent.data === undefined ||
      newEvent.data.streamContextsVersion === undefined
    ) {
      return;
    }

    // Snap off a copy of the current array using slice() since we should never directly modify React state
    const newEventData = eventData.slice();
    newEvent.dynamicValue = getDynamicValue(newEvent);
    newEvent.condensedDetails = getCondensedDetails(newEvent);
    newEvent.sessionNumber = getSessionNumber(newEvent.data ? newEvent.data.playbackSessionId : undefined);
    newEventData.push(newEvent);

    // Note, we must pass an update function here so that we don't lose events when React coalesces many of these
    // calls into one batch.  If we simply added to the current list, the last such operation would win, not all of them.

    // tslint:disable-next-line:no-any
    setEventData((prevArray: any[]) =>
      // tslint:disable-next-line:no-any
      prevArray.concat(newEventData).sort((a: any, b: any) => Date.parse(a.time) - Date.parse(b.time))
    );
  };

  const getSessionNumber = (playbackSessionId: string | undefined): string => {
    if (playbackSessionId && playbackSessionId !== 'mis') {
      let sessionNumber = sessionMap.current.get(playbackSessionId);
      if (sessionNumber === undefined) {
        sessionNumber = nextSessionNumber.current++;
        sessionMap.current.set(playbackSessionId, sessionNumber);
      }
      return sessionNumber.toLocaleString();
    }

    return '?';
  };

  const handleNewConfig = (newConfiguration: IConfiguration): void => {
    try {
      localStorage.setItem(configurationCacheKey, JSON.stringify(newConfiguration));
    } catch {
      // Default is OK
    }

    setConfiguration(newConfiguration);
  };

  const handleOnRowClickFromEventTable = (e: React.MouseEvent<HTMLTableRowElement, MouseEvent>): void => {
    const itemData = e.currentTarget.getAttribute('item-data');
    const newSelectedIndex: number | undefined = itemData ? parseInt(itemData, 10) : undefined;

    setSelectedIndex(newSelectedIndex);
  };

  const handleClear = (): void => {
    // tslint:disable-next-line:no-any
    const newEventData: any[] = [];
    setEventData(newEventData);
    setSelectedIndex(undefined);
    sessionMap.current.clear();
    nextSessionNumber.current = 0;
  };

  const handleSave = (): void => {
    const blob = new Blob([JSON.stringify(eventData)], { type: 'application/json;charset=utf-8' });
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
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>): void => {
    // Prevent default behavior (Prevent file from being opened)
    event.preventDefault();

    setIsDraggingOver(false);

    if (event.dataTransfer.items) {
      // tslint:disable-next-line:prefer-for-of
      for (let i = 0; i < event.dataTransfer.items.length; i++) {
        if (event.dataTransfer.items[i].kind === 'file') {
          const file = event.dataTransfer.items[i].getAsFile();
          if (file && file.type === 'application/json') {
            handleImport(file);
            return;
          }
        }
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>): void => {
    setIsDraggingOver(true);
    event.preventDefault();
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>): void => {
    setIsDraggingOver(false);
  };

  // ****************************************************** async await
  const handleImport = (file: File) => {
    file.text().then((stringData) => {
      const parsedData = JSON.parse(stringData);
      if (Array.isArray(parsedData)) {
        setEventData(parsedData);
        setSelectedIndex(undefined);

        // Repopulate sessionMap
        for (const singleEvent of parsedData) {
          const sessionNumber = Number.parseInt(singleEvent.sessionNumber, 10);
          const playbackSessionId = singleEvent.data ? singleEvent.data.playbackSessionId : undefined;
          if (playbackSessionId && !isNaN(sessionNumber)) {
            sessionMap.current.set(playbackSessionId, sessionNumber);
            if (sessionNumber >= nextSessionNumber.current) {
              nextSessionNumber.current = sessionNumber + 1;
            }
          }
        }
      }
    });
  };

  React.useEffect(() => {
    try {
      const json = localStorage.getItem(configurationCacheKey);
      if (json) {
        setConfiguration(JSON.parse(json));
      }
    } catch {
      // Default is OK
    }

    const telemetrySourceRegistrationId = props.telemetrySource.addTelemetryListener(handleMessage);

    return () => {
      props.telemetrySource.removeTelemetryListener(telemetrySourceRegistrationId);
    };
  }, []);

  React.useEffect(() => {
    reprocessAllEventData(eventData, configuration);
  }, [eventData, configuration]);

  const detailsData =
    selectedIndex !== undefined && filteredEventData !== undefined && selectedIndex < filteredEventData.length
      ? configuration.showCondensedDetails
        ? filteredEventData[selectedIndex].condensedDetails
        : {
            name: filteredEventData[selectedIndex].name,
            time: filteredEventData[selectedIndex].time,
            data: filteredEventData[selectedIndex].data
          }
      : undefined;

  return (
    <div className='rootDiv'>
      <div className='headerDiv'>
        <OptionsBar
          configuration={configuration}
          onConfigChanged={handleNewConfig}
          counts={counts}
          onClear={handleClear}
          onSave={handleSave}
        />
      </div>
      <div
        className='contentDiv'
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <SplitPanel
          top={
            <EventTable
              data={filteredEventData}
              selectedIndex={selectedIndex}
              onRowClickHandler={
                // tslint:disable-next-line:jsx-no-lambda
                (e: React.MouseEvent<HTMLTableRowElement, MouseEvent>) => handleOnRowClickFromEventTable(e)
              }
            />
          }
          bottom={<EventDetails data={detailsData} />}
        />
        {isDraggingOver ? (
          <div className='dragTarget'>
            <div className='dragTargetText'>Drop telemetry recordings here</div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
