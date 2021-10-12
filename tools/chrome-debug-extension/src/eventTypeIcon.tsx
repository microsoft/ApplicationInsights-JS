// -----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// </copyright>
// -----------------------------------------------------------------------

import React from 'react';
import { EventType } from './dataHelpers';

interface IEventTypeIconProps {
  eventType: EventType | undefined;
  supress?: EventType[];
}

export const EventTypeIcon = (props: IEventTypeIconProps): React.ReactElement<IEventTypeIconProps> => {
  if (props.eventType && props.supress && props.supress.indexOf(props.eventType) > -1) {
    return <div />;
  }
  switch (props.eventType) {
    case undefined:
      return <img src='../images/all.png' className='typeIcon' />;
    case EventType.appLogic:
      return <img src='../images/appLogic.png' className='typeIcon' />;
    case EventType.warning:
      return <img src='../images/warning.png' className='typeIcon' />;
    case EventType.fatalError:
      return <img src='../images/error.png' className='typeIcon' />;
    case EventType.performance:
      return <img src='../images/performance.png' className='typeIcon' />;
    default:
      return <div />;
  }
};
