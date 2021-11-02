// -----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// </copyright>
// -----------------------------------------------------------------------

import { IConfiguration } from '../configuration/IConfiguration';
import { IDataSource } from './IDataSource';
import { NetworkDataSource } from './networkDataSource';
import { NoOpDataSource } from './noOpDataSource';
import { OneDSDataSource } from './oneDSDataSource';

export function createDataSource(configuration: IConfiguration): IDataSource {
  // If on localhost, assume we are doing local testing (e.g. for accessibility issues) and use the NoOpDataSource
  if (window.location.host.indexOf('localhost') === 0) {
    return new NoOpDataSource();
  }

  switch (configuration.dataSourceType) {
    case 'Network': {
      return new NetworkDataSource(configuration.dataSourceUrls);
    }
    case 'OneDSDataSource': {
      return new OneDSDataSource();
    }
    default: {
      throw new Error(
        `Unrecognized data source supplied in the configuration: ${configuration.dataSourceType}`
      );
    }
  }
}
