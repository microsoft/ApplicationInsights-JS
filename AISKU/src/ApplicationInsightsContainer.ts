import { throwUnsupported } from "@nevware21/ts-utils";
import { AppInsightsSku } from "./AISku";
import { IApplicationInsights } from "./IApplicationInsights";
import { Snippet } from "./Snippet";

export class ApplicationInsightsContainer {

    public static getAppInsights(snippet: Snippet, version: number) : IApplicationInsights {
        const theSku = new AppInsightsSku(snippet);
        
        // Two target scenarios:
        // Removed: 1. Customer runs v1 snippet + runtime. If customer updates just cdn location to new SDK, it will run in compat mode so old apis work
        // 2. Customer updates to new snippet (that uses cdn location to new SDK. This is same as a new customer onboarding
        // and all api signatures are expected to map to new SDK. Note new snippet specifies version

        if (version >= 2.0) {
            theSku.updateSnippetDefinitions(snippet);
            theSku.loadAppInsights(false);
            return theSku; // default behavior with new snippet
        }
        
        throwUnsupported("V1 API compatibility is no longer supported");
    }
}
