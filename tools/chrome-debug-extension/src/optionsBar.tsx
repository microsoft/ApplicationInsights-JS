// -----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// </copyright>
// -----------------------------------------------------------------------

import React from 'react';
import { EventType, ICounts } from './dataHelpers';
import { EventTypeFilter } from './eventTypeFilter';
import { IConfiguration } from './IConfiguration';

interface IOptionsBarProps {
  configuration: IConfiguration;
  onConfigChanged: (newConfig: IConfiguration) => void;
  counts: ICounts;
  onClear: () => void;
  onSave: () => void;
}

export const OptionsBar = (props: IOptionsBarProps): React.ReactElement<IOptionsBarProps> => {
  function handleFilterTextOnChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const newConfiguration = {
      ...props.configuration,
      filterText: e.currentTarget.value
    };
    props.onConfigChanged(newConfiguration);
  }

  function onFilterChanged(newEventTypeFilter: EventType | undefined): void {
    const newConfiguration = {
      ...props.configuration,
      filterByType: newEventTypeFilter
    };
    props.onConfigChanged(newConfiguration);
  }

  function onShowCondensedDetailsChanged(): void {
    const newConfiguration = {
      ...props.configuration,
      showCondensedDetails: !props.configuration.showCondensedDetails
    };
    props.onConfigChanged(newConfiguration);
  }

  return (
    <div className='optionsBarDiv'>
      <input
        type='search'
        className='inputBox'
        placeholder='Filter...'
        value={props.configuration.filterText}
        onChange={handleFilterTextOnChange}
      />
      <EventTypeFilter
        currentEventTypeFilter={props.configuration.filterByType}
        onEventTypeFilterChanged={onFilterChanged}
        counts={props.counts}
      />
      <input
        type='checkbox'
        id='condenseDetailsButton'
        checked={props.configuration.showCondensedDetails}
        className='condenseDetailsButton verticallyCenteredFlexItem'
        onChange={onShowCondensedDetailsChanged}
      />
      <label htmlFor='condenseDetailsButton' className='checkBoxLabel verticallyCenteredFlexItem'>
        Condense details
      </label>
      <button onClick={props.onSave} title='Save' className='saveButton'>
        <img src='../images/save.png' className='verticallyCenteredFlexItem' />
      </button>
      <button onClick={props.onClear} title='Clear all' className='clearButton'>
        <img src='../images/clear.png' className='verticallyCenteredFlexItem' />
      </button>
    </div>
  );
};
