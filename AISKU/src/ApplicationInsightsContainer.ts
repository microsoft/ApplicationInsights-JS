import { _legacyCookieMgr } from "@microsoft/applicationinsights-core-js";
import { AppInsightsDeprecated, IAppInsightsDeprecated } from "./ApplicationInsightsDeprecated";
import { IApplicationInsights, Initialization as ApplicationInsights, Snippet } from "./Initialization";

export class ApplicationInsightsContainer {

    public static getAppInsights(snippet: Snippet, version: number) : IApplicationInsights | IAppInsightsDeprecated {
        const initialization = new ApplicationInsights(snippet);
        const legacyMode = version >= 2 ? false: true;
        
        // Side effect is to create, initialize and listen to the CoreUtils._canUseCookies changes
        // Called here to support backward compatibility
        _legacyCookieMgr();

        // Two target scenarios:
        // 1. Customer runs v1 snippet + runtime. If customer updates just cdn location to new SDK, it will run in compat mode so old apis work
        // 2. Customer updates to new snippet (that uses cdn location to new SDK. This is same as a new customer onboarding
        // and all api signatures are expected to map to new SDK. Note new snippet specifies version

        if (!legacyMode) {
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
