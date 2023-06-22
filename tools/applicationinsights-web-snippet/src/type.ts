import { IConfiguration } from "@microsoft/applicationinsights-web";
export interface ISnippetConfig {
    src: string;
    name?: string;
    ld?: number;
    useXhr?: boolean;
    crossOrigin?: string;
    onInit?: any;
    cfg: {
        connectionString: any;
    };
}

export interface AIConfig extends IConfiguration {
    autoExceptionInstrumented?: boolean;
    url?: string;
}

export interface Fields {
    strIngestionendpoint?: any;
    endpointsuffix?: any;
    location?: any;
    // Add other properties as needed
  }

export interface Envelope{
    time?: any;
    iKey?: string;
    name?: string;
    sampleRate?: number;
    tags?: any;
    data: {
        baseData: {
            ver?: number;
            exceptions?: any[];
            message?: string;
            properties?: any;
        },
        baseType?: any,

    }
  }

export interface ScriptElement extends HTMLElement{
    src?: any;
    onload: any;
    onreadystatechange?: any;
    readyState?: any;
  }

export interface AppInsights{
    initialize: boolean;
    queue: any[];
    sv: string;
    version: number;
    config: AIConfig;
    cookie?: any;
    core?: any;

  }