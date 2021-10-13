// -----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// </copyright>
// -----------------------------------------------------------------------
import { ConfigurationType, ConfigurationURLs } from './Configuration.types';
import { IConfiguration } from './IConfiguration';

export function getConfiguration(
  configurationType: ConfigurationType
): Promise<IConfiguration | undefined> {
  if (configurationType === undefined) {
    return Promise.resolve(undefined);
  }

  const url = ConfigurationURLs[configurationType];
  return fetch(url).then((response: Response) => {
    return response.json();
  });
}
