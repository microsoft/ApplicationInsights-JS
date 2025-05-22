import { hasWindow, isUndefined, throwUnsupported } from "@nevware21/ts-utils";
import { AppInsightsSku } from "./AISku";
import { IApplicationInsights } from "./IApplicationInsights";
import { Snippet } from "./Snippet";

/**
 * Detects if the current environment is a server-side rendering environment.
 * This is used to prevent the SDK from initializing in environments like
 * Angular SSR in Cloudflare Workers where certain operations are prohibited.
 * @returns {boolean} True if the environment appears to be server-side rendering
 */
export function isServerSideRenderingEnvironment(): boolean {
    // Check for typical SSR environments:
    // 1. No window object (Node.js, most SSR)
    // 2. Window exists but document is not fully initialized (some hybrid SSR)
    // 3. Process exists and is running in a Node-like environment

    // Check if we're in a non-browser environment
    if (!hasWindow()) {
        return true;
    }

    // Check for Angular Universal/SSR specific indicators
    const win = window as any;
    if (win && typeof win === 'object') {
        // Angular Universal might have these properties
        if (win["process"] && win["process"]["browser"] === false) {
            return true;
        }

        // Check for restricted properties in environment (like name property in Cloudflare Workers)
        // that would cause the SDK to fail
        try {
            // Test for the ability to redefine properties like 'name' which is not allowed in Cloudflare Workers
            const testObj = {};
            Object.defineProperty(testObj, 'name', { value: 'test' });
        } catch (e) {
            // If we can't define properties, we're likely in a restricted environment
            return true;
        }
    }

    // Check for CloudFlare worker environment
    if (typeof self !== 'undefined' && typeof self.WorkerGlobalScope !== 'undefined') {
        // Additional CloudFlare worker check
        if (self instanceof self.WorkerGlobalScope) {
            return true;
        }
    }

    return false;
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
