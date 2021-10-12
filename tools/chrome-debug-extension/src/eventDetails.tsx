// -----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// </copyright>
// -----------------------------------------------------------------------

import React from 'react';

interface IEventDetailsProps {
  // tslint:disable-next-line:no-any
  data: any;
}

export const EventDetails = (props: IEventDetailsProps): React.ReactElement<IEventDetailsProps> => {
  return (
    <div className='eventDetailsDiv'>
      <pre>{JSON.stringify(props.data, undefined, 2)}</pre>
    </div>
  );
};
