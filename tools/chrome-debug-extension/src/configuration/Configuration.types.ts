// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export type ConfigurationType = undefined | keyof IConfigurationURLs;

export interface IConfigurationURLs {
    Default: string;
    Stream: string;
    AMC: string;
    MSN: string;
    Custom: string;
}

export const ConfigurationURLs: IConfigurationURLs = {
    // Default doesn't load from a URL
    Default: "",
    Stream: "https://aka.ms/telemetryViewerConfig/Stream",
    AMC: "https://aka.ms/telemetryViewerConfig/AMC",
    MSN: "TODO",
    // Custom doesn't load from a URL, but from local storage instead
    Custom: ""
};
