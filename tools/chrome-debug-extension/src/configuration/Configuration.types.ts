// -----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// </copyright>
// -----------------------------------------------------------------------

export type ConfigurationType = undefined | keyof IConfigurationURLs;

export interface IConfigurationURLs {
  Default: string;
  Stream: string;
  MSN: string;
  Custom: string;
}

export const ConfigurationURLs: IConfigurationURLs = {
  // Default doesn't load from a URL
  Default: '',
  Stream: 'https://aka.ms/telemetryViewerConfig/Stream',
  MSN: 'TODO',
  // Custom doesn't load from a URL, but from local storage instead
  Custom: ''
};
