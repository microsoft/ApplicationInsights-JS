import { IAppInsightsDeprecated, AppInsightsDeprecated } from "./ApplicationInsightsDeprecated";
import { Initialization as ApplicationInsights, Snippet, IApplicationInsights } from "./Initialization";

export class ApplicationInsightsContainer {

    getAppInsights(snippet: Snippet, oldApiSupport: boolean = false) : IApplicationInsights | IAppInsightsDeprecated {
        let initialization = new ApplicationInsights(snippet);
        initialization.loadAppInsights();
        
        if (!oldApiSupport) {
            return initialization;
        } else {
            return new AppInsightsDeprecated(snippet, initialization);
        }
    }
}