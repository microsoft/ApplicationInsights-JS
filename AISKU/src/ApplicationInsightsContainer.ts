import { IAppInsightsDeprecated, AppInsightsDeprecated } from "./ApplicationInsightsDeprecated";
import { Initialization as ApplicationInsights, Snippet, IApplicationInsights } from "./Initialization";
import { CoreUtils } from "@microsoft/applicationinsights-core-js";

export class ApplicationInsightsContainer {

    getAppInsights(snippet: Snippet) : IApplicationInsights | IAppInsightsDeprecated {
        let initialization = new ApplicationInsights(snippet);
        initialization.loadAppInsights();
        
        if (snippet && CoreUtils.isNullOrUndefined(snippet.oldApiSupport)) {
            return initialization;
        } else {
            return new AppInsightsDeprecated(snippet, initialization);
        }
    }
}