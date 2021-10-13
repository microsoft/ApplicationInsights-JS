// -----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// </copyright>
// -----------------------------------------------------------------------

import { IConfiguration } from '../configuration/IConfiguration';
import { IDataSource } from './IDataSource';
import { NetworkDataSource } from './networkDataSource';

export function createDataSource(configuration: IConfiguration): IDataSource {
  switch (configuration.dataSourceType) {
    case 'Network':
      {
        return new NetworkDataSource(configuration.dataSourceUrls);
      }
      break;
    default: {
      throw new Error(
        `Unrecognized data source supplied in the configuration: ${configuration.dataSourceType}`
      );
    }
  }
}
