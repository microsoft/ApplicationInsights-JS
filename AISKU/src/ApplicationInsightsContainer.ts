import { throwUnsupported } from "@nevware21/ts-utils";
import { IApplicationInsights, Initialization as ApplicationInsights, Snippet } from "./Initialization";

export class ApplicationInsightsContainer {

    public static getAppInsights(snippet: Snippet, version: number) : IApplicationInsights {
        const initialization = new ApplicationInsights(snippet);
        
        // Two target scenarios:
        // Removed: 1. Customer runs v1 snippet + runtime. If customer updates just cdn location to new SDK, it will run in compat mode so old apis work
        // 2. Customer updates to new snippet (that uses cdn location to new SDK. This is same as a new customer onboarding
        // and all api signatures are expected to map to new SDK. Note new snippet specifies version

        if (version >= 2.0) {
            initialization.updateSnippetDefinitions(snippet);
            initialization.loadAppInsights(false);
            return initialization; // default behavior with new snippet
        } else {
            throwUnsupported("V1 API compatibility is no longer supported");
        }
    }
}
