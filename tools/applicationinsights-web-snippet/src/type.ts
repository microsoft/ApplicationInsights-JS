import { IConfiguration } from "@microsoft/applicationinsights-web";

export interface ISnippetConfig {
    src: string;
    name?: string;
    ld?: number;
    useXhr?: boolean;
    crossOrigin?: string;
    onInit?: any;
    cfg: IConfiguration;
    cr?: boolean; // cdn retry would be proceed if ture
}

export interface Fields {
    strIngestionendpoint?: any;
    endpointsuffix?: any;
    location?: any;
    // Add other properties as needed
}
