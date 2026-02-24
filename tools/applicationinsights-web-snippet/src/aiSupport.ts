// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { IEnvelope } from "@microsoft/applicationinsights-core-js";
import { _getTime } from "./support";

let strEmpty = "";



export function _createAiEnvelope(iKey: string, theType: string, sv: string, version: number, locn: Location): IEnvelope {
    let tags = {};
    let type = "Browser";
    let strAiDevice = "ai.device.";
    let strAiOperationName = "ai.operation.name";
    let strAiSdkVersion = "ai.internal.sdkVersion";
    let strToLowerCase = "toLowerCase";
    tags[strAiDevice + "id"] = type[strToLowerCase]();
    tags[strAiDevice + "type"] = type;
    tags[strAiOperationName] = locn && locn.pathname || "_unknown_";
    tags[strAiSdkVersion] = "javascript:snippet_" + (sv || version);

    let envelope:IEnvelope = {
        time: _getTime(),
        iKey: iKey,
        name: "Microsoft.ApplicationInsights." + iKey.replace(/-/g, strEmpty) + "." + theType,
        sampleRate: 100,
        tags: tags,
        data: {
            baseData: {
                ver: 2
            }
        },
        ver: undefined,
        seq: "1",
        aiDataContract: undefined
    };
    return envelope;
}

let track = "track";
let trackPage = "TrackPage";
let trackEvent = "TrackEvent";

export const aiMethod = [
    track + "Event",
    track + "Exception",
    track + "PageView",
    track + "PageViewPerformance",
    "addTelemetryInitializer",
    track + "Trace",
    track + "DependencyData",
    track + "Metric",
    "start" + trackPage,
    "stop" + trackPage,
    "start" + trackEvent,
    "stop" + trackEvent,
    "setAuthenticatedUserContext",
    "clearAuthenticatedUserContext",
    "flush"
]

