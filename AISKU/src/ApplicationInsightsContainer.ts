import { IAppInsightsDeprecated, AppInsightsDeprecated } from "./ApplicationInsightsDeprecated";
import { Initialization as ApplicationInsights, Snippet, IApplicationInsights } from "./Initialization";

export class ApplicationInsightsContainer {

    public static getAppInsights(snippet: Snippet, version: number) : IApplicationInsights | IAppInsightsDeprecated {
        const initialization = new ApplicationInsights(snippet);
        const legacyMode = version !== 2.0 ? true : false;

        // Two target scenarios:
        // 1. Customer runs v1 snippet + runtime. If customer updates just cdn location to new SDK, it will run in compat mode so old apis work
        // 2. Customer updates to new snippet (that uses cdn location to new SDK. This is same as a new customer onboarding
        // and all api signatures are expected to map to new SDK. Note new snippet specifies version

        if (version === 2.0) {
            initialization.updateSnippetDefinitions(snippet);
            initialization.loadAppInsights(legacyMode);
            return initialization; // default behavior with new snippet
        } else {
            const legacy = new AppInsightsDeprecated(snippet, initialization); // target scenario old snippet + updated endpoint
            legacy.updateSnippetDefinitions(snippet);
            initialization.loadAppInsights(legacyMode);
            return legacy;
        }
    }
}
