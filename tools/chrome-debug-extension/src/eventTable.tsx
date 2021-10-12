// -----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// </copyright>
// -----------------------------------------------------------------------

import React from 'react';
import { EventType, getEventType } from './dataHelpers';
import { EventTypeIcon } from './eventTypeIcon';

interface IEventTableProps {
  // tslint:disable-next-line:no-any
  data: any[];
  selectedIndex: number | undefined;
  // tslint:disable-next-line:no-any
  onRowClickHandler: any;
}

export const EventTable = (props: IEventTableProps): React.ReactElement<IEventTableProps> => {
  // Not state because we want these to be per-render
  let lastMsSinceAppStart: number;
  let msDelta: number;
  let lastSessionId: string = '';

  return (
    <div className='eventTableDiv'>
      <table className='eventTable'>
        <thead>
          <tr>
            <th>&nbsp;</th>
            <th>Session</th>
            <th>msSinceAppStart</th>
            <th>Δ ms</th>
            <th>Event Name</th>
            <th>Name</th>
            <th>Dynamic Value</th>
          </tr>
        </thead>
        <tbody>
          {
            // tslint:disable-next-line:no-any
            props.data.map((value: any, index: any) => {
              msDelta = value.data.msSinceAppStart - lastMsSinceAppStart;
              msDelta = msDelta >= 0 ? msDelta : 0; // If a new session begins, this will be negative
              lastMsSinceAppStart = value.data.msSinceAppStart;

              let className = index === props.selectedIndex ? 'selected' : '';
              let sessionId = '';
              if (value && value.data && value.data.clientSessionId) {
                sessionId = value.data.clientSessionId;
              } else if (value && value.data && value.data.playbackSessionId) {
                sessionId = value.data.playbackSessionId;
              }

              if (lastSessionId.length === 0 || (sessionId.length > 0 && sessionId !== lastSessionId)) {
                className += ' newSessionRow';
              }
              lastSessionId = sessionId;
              return (
                <tr key={index} item-data={index} className={className} onClick={props.onRowClickHandler}>
                  <td>
                    <EventTypeIcon eventType={getEventType(value)} supress={[EventType.appLogic]} />
                  </td>
                  <td> {value.sessionNumber.toLocaleString()} </td>
                  <td> {Math.trunc(value.data.msSinceAppStart).toLocaleString()} </td>
                  <td> {msDelta ? Math.trunc(msDelta).toLocaleString() : ''} </td>
                  <td> {value.name} </td>
                  <td> {value.data.name} </td>
                  <td> {value.dynamicValue} </td>
                </tr>
              );
            })
          }
        </tbody>
      </table>
    </div>
  );
};
