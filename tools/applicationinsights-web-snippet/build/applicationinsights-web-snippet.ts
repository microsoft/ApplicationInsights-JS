import { webSnippet } from "./web-snippet";
import { webSnippetCs } from "./web-snippet-cs"

function webSnippetVersion() {
    let parse = /sv:\"([^\"]+)\"/.exec(webSnippet);
    if (parse) {
        return parse[1];
    }

    return "";
}

export { webSnippet, webSnippetCs, webSnippetVersion }