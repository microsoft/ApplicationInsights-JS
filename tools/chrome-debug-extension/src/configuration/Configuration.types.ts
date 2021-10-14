// -----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// </copyright>
// -----------------------------------------------------------------------

export type ConfigurationType = undefined | keyof IConfigurationURLs;

export interface IConfigurationURLs {
  Stream: string;
  MSN: string;
  ForTestingErrors: string;
  Custom: string;
}

export const ConfigurationURLs: IConfigurationURLs = {
  Stream:
    'https://microsoft-my.sharepoint-df.com/personal/kevbrown_microsoft_com/_layouts/15/download.aspx?SourceUrl=%2Fpersonal%2Fkevbrown%5Fmicrosoft%5Fcom%2FDocuments%2FtelemetryViewerConfig%5Fstream%2Ejson',
  MSN: 'MIKE_INSERT_DOWNLOAD.ASPX_URL_HERE',
  ForTestingErrors:
    'https://microsoft-my.sharepoint-df.com/personal/kevbrown_microsoft_com/_layouts/15/download.aspx?SourceUrl=BOGUS_DATA',
  // Custom doesn't load from a URL, but from local storage instead
  Custom: ''
};
