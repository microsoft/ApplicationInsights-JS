const webSnippet = "##replaceIKeySnippet##";
const webSnippetCs = "##replaceConnStringSnippet##";

function webSnippetVersion() {
    let parse = /sv:\"([^\"]+)\"/.exec(webSnippet);
    if (parse) {
        return parse[1];
    }

    return "";
}

function substituteInstrumentationKey(key: string) {
    let userSnippet: String = webSnippet;
    if (key && key.trim() !== "") {
        userSnippet = webSnippet.replace("InstrumentationKey=INSTRUMENTATION_KEY", key);
    };
    return userSnippet;
}

function substituteConnectionString(key: string) {
    let userSnippetCs: String = webSnippetCs;
    if (key && key.trim() !== "") {
        userSnippetCs = webSnippetCs.replace("YOUR_CONNECTION_STRING", key);
    };
    return userSnippetCs;
}

export { webSnippet, webSnippetCs, webSnippetVersion, substituteInstrumentationKey, substituteConnectionString }