// -----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// </copyright>
// -----------------------------------------------------------------------

import * as React from 'react';
import { getDetails } from '../dataSources/dataHelpers';
import { IDataEvent } from '../dataSources/IDataEvent';
import { Session } from '../session';
import { EventDetails } from './eventDetails';
import { EventTable } from './eventTable';
import { IFilterSettings } from './IFilterSettings';
import { OptionsBar } from './optionsBar';
import { SplitPanel } from './splitPanel';

interface ITelemetryViewerProps {
  session: Session;
  onShowConfigurationSelection: () => void;
}

const filterSettingsCacheKey = 'filterSettings';

export const TelemetryViewer = (props: ITelemetryViewerProps): React.ReactElement<ITelemetryViewerProps> => {
  const [filteredEventData, setFilteredEventData] = React.useState<IDataEvent[]>([]);
  const [filterSettings, setFilterSettings] = React.useState<IFilterSettings>({
    filterText: '',
    filterByType: undefined,
    showCondensedDetails: false
  });
  const [selectedIndex, setSelectedIndex] = React.useState<number | undefined>(undefined);
  const [isDraggingOver, setIsDraggingOver] = React.useState<boolean>(false);

  const handleNewFilterSettings = (newFilterSettings: IFilterSettings): void => {
    try {
      localStorage.setItem(filterSettingsCacheKey, JSON.stringify(newFilterSettings));
    } catch {
      // Default is OK
    }

    setFilterSettings(newFilterSettings);
  };

  const handleOnRowClickFromEventTable = (target: EventTarget & HTMLTableRowElement): void => {
    const itemData = target.getAttribute('item-data');
    const newSelectedIndex: number | undefined = itemData ? parseInt(itemData, 10) : undefined;

    setSelectedIndex(newSelectedIndex);
  };

  const handleClear = (): void => {
    // tslint:disable-next-line:no-any
    props.session.clear();
    setSelectedIndex(undefined);
  };

  const handleSave = (): void => {
    props.session.save();
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

  const handleImport = (file: File): Promise<void> => {
    return file.text().then((stringData: string) => {
      if (props.session.load(stringData)) {
        setSelectedIndex(undefined);
      }
    });
  };

  const onFilteredDataChanged = (): void => {
    setFilteredEventData(props.session.filteredData);
  };

  React.useEffect(() => {
    try {
      const json = localStorage.getItem(filterSettingsCacheKey);
      if (json) {
        setFilterSettings(JSON.parse(json));
      }
    } catch {
      // Default is OK
    }

    props.session.onFilteredDataChanged = onFilteredDataChanged;
    onFilteredDataChanged();

    return () => {
      props.session.onFilteredDataChanged = undefined;
    };
  }, []);

  React.useEffect(() => {
    props.session.filterSettings = filterSettings;
  }, [filterSettings]);

  const detailsData =
    selectedIndex !== undefined && filteredEventData !== undefined && selectedIndex < filteredEventData.length
      ? filterSettings.showCondensedDetails
        ? filteredEventData[selectedIndex].condensedDetails
        : getDetails(filteredEventData[selectedIndex])
      : undefined;

  return (
    <div className='rootDiv'>
      <div className='headerDiv'>
        <OptionsBar
          filterSettings={filterSettings}
          onFilterSettingsChanged={handleNewFilterSettings}
          counts={props.session.counts}
          onClear={handleClear}
          onSave={handleSave}
          onShowConfigurationSelection={props.onShowConfigurationSelection}
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
              configuration={props.session.configuration}
              dataEvents={filteredEventData}
              selectedIndex={selectedIndex}
              onRowClickHandler={handleOnRowClickFromEventTable}
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
