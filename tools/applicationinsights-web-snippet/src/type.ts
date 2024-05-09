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
    type?: string; // Custom optional value to specify the type of the snippet, e.g. "cjs.js"
}

export interface Fields {
    strIngestionendpoint?: any;
    endpointsuffix?: any;
    location?: any;
    // Add other properties as needed
}
