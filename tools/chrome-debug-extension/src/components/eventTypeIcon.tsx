// -----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// </copyright>
// -----------------------------------------------------------------------

import React from 'react';
import { DataEventType } from '../dataSources/IDataEvent';

interface IEventTypeIconProps {
  eventType: DataEventType | undefined;
  suppress?: DataEventType[];
}

export const EventTypeIcon = (props: IEventTypeIconProps): React.ReactElement<IEventTypeIconProps> => {
  if (props.eventType && props.suppress && props.suppress.indexOf(props.eventType) > -1) {
    return <div />;
  }
  switch (props.eventType) {
    case undefined:
      return <img src='../images/all.png' className='typeIcon' />;
    case 'appLogic':
      return <img src='../images/appLogic.png' className='typeIcon' />;
    case 'warning':
      return <img src='../images/warning.png' className='typeIcon' />;
    case 'fatalError':
      return <img src='../images/error.png' className='typeIcon' />;
    case 'performance':
      return <img src='../images/performance.png' className='typeIcon' />;
    default:
      return <div />;
  }
};
