import { hasWindow, isUndefined, throwUnsupported } from "@nevware21/ts-utils";
import { AppInsightsSku } from "./AISku";
import { IApplicationInsights } from "./IApplicationInsights";
import { Snippet } from "./Snippet";

/**
 * Detects if the current environment has restrictions that would prevent
 * the Application Insights SDK from functioning correctly.
 * Specifically targets environments like Cloudflare Workers with Angular SSR
 * where property redefinition is prohibited.
 * @returns {boolean} True if the environment has restrictions that would break the SDK
 */
export function isServerSideRenderingEnvironment(): boolean {
    // Only check for environments with property redefinition restrictions
    // that would cause the SDK to fail (like Cloudflare Workers)
    try {
        // Test for the ability to redefine properties like 'name' 
        // which is not allowed in Cloudflare Workers
        const testObj = {};
        Object.defineProperty(testObj, 'name', { value: 'test' });
        // If we can define properties, the environment is compatible
        return false;
    } catch (e) {
        // If we can't define properties, we're in a restricted environment
        return true;
    }
}

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
