import { IAppInsightsDeprecated, AppInsightsDeprecated } from "./ApplicationInsightsDeprecated";
import { Initialization, Snippet, IApplicationInsights } from "./Initialization";

export class ApplicationInsightsContainer {

    getAppInsights(snippet: Snippet, hasDeprecatedSupport: boolean = false) : IApplicationInsights | IAppInsightsDeprecated {
        let init = new Initialization(snippet);
        if (!hasDeprecatedSupport) {
            return init;
        } else {
            return new AppInsightsDeprecated(snippet, init.loadAppInsights());
        }
    }
}