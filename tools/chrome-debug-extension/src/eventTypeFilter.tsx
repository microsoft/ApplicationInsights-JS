// -----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// </copyright>
// -----------------------------------------------------------------------

import React from 'react';
import { EventType, ICounts } from './dataHelpers';
import { EventTypeCounter } from './eventTypeCounter';

interface IEventTypeFilterProps {
  currentEventTypeFilter: EventType | undefined;
  onEventTypeFilterChanged: (newEventTypeFilter: EventType | undefined) => void;
  counts: ICounts;
}

export const EventTypeFilter = (props: IEventTypeFilterProps): React.ReactElement<IEventTypeFilterProps> => {
  function selectionChanged(event: React.ChangeEvent<HTMLInputElement>): void {
    props.onEventTypeFilterChanged(event.target.value ? Number.parseInt(event.target.value, 10) : undefined);
  }

  return (
    <div className='eventTypeFilterContainer'>
      <div className='eventTypeFilterInputContainer'>
        <input
          id='foo'
          type='radio'
          name='eventTypeFilter'
          className='eventTypeFilterInput'
          title='All'
          value={undefined}
          checked={props.currentEventTypeFilter === undefined}
          onChange={selectionChanged}
        />
        <EventTypeCounter eventType={undefined} count={props.counts.all} />
      </div>
      <div className='eventTypeFilterInputContainer'>
        <input
          name='eventTypeFilter'
          type='radio'
          className='eventTypeFilterInput'
          title='Just app logic'
          value={EventType.appLogic}
          checked={props.currentEventTypeFilter === EventType.appLogic}
          onChange={selectionChanged}
        />
        <EventTypeCounter eventType={EventType.appLogic} count={props.counts.appLogic} />
      </div>
      <div className='eventTypeFilterInputContainer'>
        <input
          name='eventTypeFilter'
          type='radio'
          className='eventTypeFilterInput'
          title='Just performance'
          value={EventType.performance}
          checked={props.currentEventTypeFilter === EventType.performance}
          onChange={selectionChanged}
        />
        <EventTypeCounter eventType={EventType.performance} count={props.counts.performance} />
      </div>
      <div className='eventTypeFilterInputContainer'>
        <input
          name='eventTypeFilter'
          type='radio'
          className='eventTypeFilterInput'
          title='Just warnings'
          checked={props.currentEventTypeFilter === EventType.warning}
          value={EventType.warning}
          onChange={selectionChanged}
        />
        <EventTypeCounter eventType={EventType.warning} count={props.counts.warning} />
      </div>
      <div className='eventTypeFilterInputContainer'>
        <input
          name='eventTypeFilter'
          type='radio'
          className='eventTypeFilterInput'
          title='Just fatal errors'
          checked={props.currentEventTypeFilter === EventType.fatalError}
          value={EventType.fatalError}
          onChange={selectionChanged}
        />
        <EventTypeCounter eventType={EventType.fatalError} count={props.counts.fatalError} />
      </div>
    </div>
  );
};
