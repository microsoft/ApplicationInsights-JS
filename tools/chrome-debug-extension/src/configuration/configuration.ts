// -----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// </copyright>
// -----------------------------------------------------------------------
import { ConfigurationType, ConfigurationURLs } from './Configuration.types';
import { defaultConfiguration } from './defaultConfiguration';
import { IConfiguration } from './IConfiguration';

export function getConfiguration(
  configurationType: ConfigurationType
): Promise<IConfiguration | undefined> {
  if (configurationType === undefined) {
    return Promise.resolve(undefined);
  }

  if (configurationType === 'Default') {
    return Promise.resolve(defaultConfiguration);
  }

  const url = ConfigurationURLs[configurationType];
  return fetch(url).then((response: Response) => {
    return response.json();
  });
}
