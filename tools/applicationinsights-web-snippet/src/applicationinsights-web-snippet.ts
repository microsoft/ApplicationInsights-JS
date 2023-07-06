const webSnippet = "##replaceIKeySnippet##";
const webSnippetCs = "##replaceConnStringSnippet##";

function webSnippetVersion() {
    let parse = /sv:\"([^\"]+)\"/.exec(webSnippet);
    if (parse) {
        return parse[1];
    }

    return "";
}

export { webSnippet, webSnippetCs, webSnippetVersion }