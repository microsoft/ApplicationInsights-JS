import { IAppInsightsDeprecated, AppInsightsDeprecated } from "./ApplicationInsightsDeprecated";
import { Initialization as ApplicationInsights, Snippet, IApplicationInsights } from "./Initialization";

export class ApplicationInsightsContainer {

    public static getAppInsights(snippet: Snippet, version: number) : IApplicationInsights | IAppInsightsDeprecated {
        let initialization = new ApplicationInsights(snippet);
        initialization.loadAppInsights();
        
        // Two target scenarios:
        // 1. Customer runs v1 snippet + runtime. If customer updates just cdn location to new SDK, it will run in compat mode so old apis work
        // 2. Customer updates to new snippet (that uses cdn location to new SDK. This is same as a new customer onboarding 
        // and all api signatures are expected to map to new SDK

        if (version === 2.0) {
            return initialization; // default behavior with new snippet
        } else {
            return new AppInsightsDeprecated(snippet, initialization); // target scenario old snippet + updated endpoint
        }
    }
}