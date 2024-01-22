import { SdkLoaderConfig } from "./type";

const webSnippet = "##replaceIKeySnippet##";
const webSnippetCs = "##replaceConnStringSnippet##";

function webSnippetVersion() {
    let parse = /sv:\"([^\"]+)\"/.exec(webSnippet);
    if (parse) {
        return parse[1];
    }

    return "";
}

function getSdkLoaderScript(config: SdkLoaderConfig) {
    let snippet: string = webSnippet;
    if (config && config.connectionString) {
        snippet = webSnippetCs.replace("YOUR_CONNECTION_STRING", config.connectionString);
    } else if (config && config.instrumentationKey) {
        snippet = webSnippet.replace("InstrumentationKey=INSTRUMENTATION_KEY", config.instrumentationKey);
    } else {
        console.log("No instrumentationKey or connectionString was provided to the init function");
    }
    return snippet;
}


export { webSnippet, webSnippetCs, webSnippetVersion, getSdkLoaderScript }