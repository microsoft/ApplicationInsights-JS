// -----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// </copyright>
// -----------------------------------------------------------------------

export type ConfigurationType = undefined | keyof IConfigurationURLs;

export interface IConfigurationURLs {
  Stream: string;
  ForTestingErrors: string;
}

export const ConfigurationURLs: IConfigurationURLs = {
  Stream:
    'https://microsoft-my.sharepoint-df.com/personal/kevbrown_microsoft_com/_layouts/15/download.aspx?SourceUrl=%2Fpersonal%2Fkevbrown%5Fmicrosoft%5Fcom%2FDocuments%2FtelemetryViewerConfig%5Fstream%2Ejson',
  ForTestingErrors:
    'https://microsoft-my.sharepoint-df.com/personal/kevbrown_microsoft_com/_layouts/15/download.aspx?SourceUrl=BOGUS_DATA'
};
