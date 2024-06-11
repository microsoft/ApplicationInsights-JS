import { IConfiguration } from "@microsoft/applicationinsights-web";

// in the future, we can add more fields here
export interface SdkLoaderConfig {
    instrumentationKey?: string;
    connectionString?: string;
}

export interface ISnippetConfig {
    src: string;
    name?: string;
    ld?: number;
    useXhr?: boolean;
    crossOrigin?: string;
    onInit?: any;
    cfg: IConfiguration;
    cr?: boolean; // cdn retry would be proceed if ture
    dle?: boolean; // Custom optional value to disable sdk load error to be sent
    integrity?: boolean; // Custom optional value to specify whether add the integrity attribute to the script tag
}

export interface Fields {
    strIngestionendpoint?: any;
    endpointsuffix?: any;
    location?: any;
    // Add other properties as needed
}
