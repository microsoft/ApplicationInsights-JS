// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Initialization as ApplicationInsights, Telemetry, Snippet } from "./Initialization";
import { ApplicationInsightsContainer } from "./ApplicationInsightsContainer";

export { Initialization as ApplicationInsights, Telemetry, Snippet } from "./Initialization";

"use strict";

const Undefined = "undefined";
function _logWarn(aiName:string, message:string) {
    // TODO: Find better place to warn to console when SDK initialization fails
    var _console = typeof console !== Undefined ? console : null;
    if (_console && _console.warn) {
        _console.warn("Failed to initialize AppInsights JS SDK for instance " + (aiName || "<unknown>") + " - " + message);
    }
}

// should be global function that should load as soon as SDK loads
try {

    // E2E sku on load initializes core and pipeline using snippet as input for configuration
    // tslint:disable-next-line: no-var-keyword
    var aiName;
    if (typeof window !== Undefined) {
        var _window = window;
        aiName = _window["appInsightsSDK"] || "appInsights";
        if (typeof JSON !== Undefined) {
            // get snippet or initialize to an empty object

            if (_window[aiName] !== undefined) {
                // this is the typical case for browser+snippet
                const snippet: Snippet = _window[aiName] || ({ version: 2.0 } as any);

                // overwrite snippet with full appInsights
                // only initiaize if required and detected snippet version is >= 2 or not defined
                if ((snippet.version >= 2.0 && (_window[aiName] as any).initialize) || snippet.version === undefined ) {
                    ApplicationInsightsContainer.getAppInsights(snippet, snippet.version);
                }
            }
        } else {
            _logWarn(aiName, "Missing JSON - you must supply a JSON polyfill!");
        }
    } else {
        _logWarn(aiName, "Missing window");
    }
    // Hack: If legacy SDK exists, skip this step (Microsoft.ApplicationInsights exists).
    // else write what was there for v2 SDK prior to rollup bundle output name change.
    // e.g Microsoft.ApplicationInsights.ApplicationInsights, Microsoft.ApplicationInsights.Telemetry
    // @todo uncomment once integration tests for this can be added
    // if (typeof window !== Undefined && window && ((window as any).Microsoft && !(window as any).Microsoft.ApplicationInsights)) {
    //     (window as any).Microsoft = (window as any).Microsoft || {};
    //     (window as any).Microsoft.ApplicationInsights = {
    //         ApplicationInsights, Telemetry
    //     };
    // }
} catch (e) {
    _logWarn(aiName, e.message);
}
