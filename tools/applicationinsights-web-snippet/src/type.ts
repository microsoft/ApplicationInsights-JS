import { IConfiguration, Snippet } from "@microsoft/applicationinsights-web";

export interface ISnippetConfig {
    src: string;
    name?: string;
    ld?: number;
    useXhr?: boolean;
    crossOrigin?: string;
    onInit?: any;
    cfg: IConfiguration;
}

export interface Fields {
    strIngestionendpoint?: any;
    endpointsuffix?: any;
    location?: any;
    // Add other properties as needed
  }

export interface AppInsights extends Snippet{
    initialize: boolean;
    cookie?: any;
    core?: any;
  }