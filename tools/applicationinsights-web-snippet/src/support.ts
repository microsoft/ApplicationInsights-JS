import { IEnvelope } from "@microsoft/applicationinsights-common";
import { oneDsEnvelope } from "./1dsType";

let strEmpty = "";

// Gets the time as an ISO date format, using a function as IE7/8 doesn't support toISOString
export function _getTime() {
    let date = new Date();
    function pad(num: Number) {
        let r = strEmpty + num;
        if (r.length === 1) {
            r = "0" + r;
        }

        return r;
    }

    return date.getUTCFullYear()
        + "-" + pad(date.getUTCMonth() + 1)
        + "-" + pad(date.getUTCDate())
        + "T" + pad(date.getUTCHours())
        + ":" + pad(date.getUTCMinutes())
        + ":" + pad(date.getUTCSeconds())
        + "." + String((date.getUTCMilliseconds() / 1000).toFixed(3)).slice(2, 5)
        + "Z";
}

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

export function _createOneDsEnvelope(iKey: string, theType: string, _epoch: number, _sequence: number, sv: string): oneDsEnvelope {
    let UInt32Mask = 0x100000000;
    if (_epoch === 0) {
        _epoch = Math.floor((UInt32Mask * Math.random()) | 0) >>> 0;
    }
    let envelope: oneDsEnvelope = {
        data: {
            baseData: {
                ver: 2
            }
        },
        ext: {
            app: { sesId: "0000" },
            intweb: {},
            sdk: {
                ver: "javascript:" + sv,
                epoch: "" + _epoch,
                seq: _sequence++
            },
            utc: {
                popSample: 100
            },
            web: {
                userConsent: false
            }
        },
        time: _getTime(),
        iKey: "o:" + _getTenantId(iKey),
        name: theType,
        ver: "4.0"
    };
    _addTimeZone(envelope);
    _addUser(envelope);
    return envelope;
}

function _getTenantId(apiKey: string): string {
    let result: string = "";

    if (apiKey) {
        const indexTenantId: number = apiKey.indexOf("-");
        if (indexTenantId > -1) {
            result = apiKey.substring(0, indexTenantId);
        }
    }
    return result;
}

function _addTimeZone(envelope: any): void {
    // Add time zone
    const timeZone: number = new Date().getTimezoneOffset();
    let minutes: number = timeZone % 60;
    let hours: number = (timeZone - minutes) / 60;
    let timeZonePrefix: string = "+";
    if (hours > 0) {
        timeZonePrefix = "-";
    }
    hours = Math.abs(hours);
    minutes = Math.abs(minutes);

    envelope.ext = envelope.ext || {};
    envelope.ext.loc = {  // Add time zone
        tz: timeZonePrefix + (hours < 10 ? "0" + hours : hours.toString()) + ":" + (minutes < 10 ? "0" + minutes : minutes.toString())
    };
}

function _addUser(envelope: any): void {
    const strUndefined: string = "undefined";
    // Add user language
    if (typeof navigator !== strUndefined) {
        const nav: Navigator & { userLanguage?: string } = navigator;
        envelope.ext = envelope.ext || {};
        envelope.ext.user = {
            locale: nav.userLanguage || nav.language
        };
    }
}



let track = "track";
let trackPage = "TrackPage";
let trackEvent = "TrackEvent";
let capturePage = "capturePage";


export const oneDsMethods = [
    track + "Event",
    track + "Exception",
    trackPage + "View",
    trackPage + "ViewPerformance",
    "addTelemetryInitializer",
    track,
    trackPage + "Action",
    track + "ContentUpdate",
    trackPage + "Unload",
    capturePage + "View",
    capturePage + "ViewPerformance",
    capturePage + "Action",
    capturePage + "Unload",
    "captureContentUpdate"
]

export const aiMethod = [
    track + "Event",
    track + "Exception",
    trackPage + "View",
    trackPage + "ViewPerformance",
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

