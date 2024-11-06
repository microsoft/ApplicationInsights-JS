import { IConfiguration } from "@microsoft/applicationinsights-web";

export interface SdkLoaderConfig {
    instrumentationKey?: string;
    connectionString?: string;
    src?: string;
    name?: string;
    ld?: number;
    useXhr?: boolean;
    crossOrigin?: string;
    cfg?: any;
    cr?: boolean;
    dle?: boolean;
    sri?: boolean;
    pl?: boolean;
    pn?: string;
    ttp?: TrustedTypePolicy;
}

export abstract class TrustedTypePolicy {
    readonly name: string;
    createHTML?: ((input: string, ...args: any[]) => string) | undefined;
    createScript?: ((input: string, ...args: any[]) => string) | undefined;
    createScriptURL?: ((input: string, ...args: any[]) => string) | undefined;
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
    sri?: boolean; // Custom optional value to specify whether fetching the snippet from integrity file and do integrity check
    /**
     * Custom optional value to specify whether to enable the trusted type policy check on snippet
     */
    pl?: boolean;
    /**
     * Custom optional value to specify the name of the trusted type policy that would be implemented on the snippet, default is 'aiPolicy'
     */
    pn?: string;
    /*
    * Custom optional value to specify the trusted type policy that would be applied on the snippet src
    */
    ttp?: TrustedTypePolicy;
    /**
     * Custom optional value to specify the nounce tag value that would be applied on the script when we drop it on the page
     */
    nt?: string;
}

export interface Fields {
    strIngestionendpoint?: any;
    endpointsuffix?: any;
    location?: any;

    // Add other properties as needed
}
