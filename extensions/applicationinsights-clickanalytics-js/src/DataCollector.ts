/**
* @copyright Microsoft 2020
*/

import { getDocument, getLocation, getWindow, hasDocument, isFunction } from "@microsoft/applicationinsights-core-js";
import { IClickAnalyticsConfiguration, IOverrideValues } from "./Interfaces/Datamodel";
import { findClosestAnchor, isValueAssigned } from "./common/Utils";

var clickCaptureInputTypes = { BUTTON: true, CHECKBOX: true, RADIO: true, RESET: true, SUBMIT: true };


/**
 * Get Image href of a given HTMLImageElement
 * @param element - An html image element
 * @returns Href value.
 */
export function getImageHref(element: HTMLImageElement): string {
    var temp = element;
    if (temp) {
        var parent = findClosestAnchor(temp as Element);
        if ((parent as any).length === 1) {
            const firstParent = parent[0];
            if (firstParent.href) {
                return firstParent.href;
            } else if (firstParent.src) {
                return (firstParent.src);
            }
        }
    }
    return "";
}


/**
 * Get click target
 * @returns Click target URI
 */
export function getClickTarget(element: any) {
    var clickTarget = "";
    switch (element.tagName) {
    case "A":
    case "AREA":
        clickTarget = element.href || "";
        break;
    case "IMG":
        clickTarget = getImageHref(element as HTMLImageElement);
        break;
    case "INPUT":
        var type = element.type;
        if (type && (clickCaptureInputTypes[type.toUpperCase()])) {
            let loc = getLocation() || ({} as Location);
            if (element.form) {
                clickTarget = element.form.action || (loc.pathname || "");
            } else {
                clickTarget = loc.pathname || "";
            }
        }
        break;
    default:
        break;
    }
    return clickTarget;
}

/**
 * Execute callback when DOM finish loading
 */
export function onDomLoaded(callback: () => void) {
    onDomReadyDo(() => {
        if (hasDocument() && getDocument().readyState === "complete") {
            callback();
        } else {
            let win = getWindow();
            if (win) {
                if (win.addEventListener) {
                    win.addEventListener("load", () => {
                        callback();
                    }); // NB **not** 'onload'
                } else if ((win as any).attachEvent) {
                    (win as any).attachEvent("onload", () => {
                        callback();
                    }); // IE8
                }
            }
        }
    });
}

// use smallest domready ever for IE8. When IE8 is deprecated, use addEventListener('DomContentLoaded')
function onDomReadyDo(f: any) {
    /// <summary> fires function f on domRead </summary>
    /// <param type='function'>function to call on domRead</param>

    let doc = getDocument() || ({} as Document);
    /in/.test(doc.readyState) ? setTimeout(() => {
        onDomReadyDo(f);
    }, 100) : f.call();
}

/**
 * Gets the pageName from the DOM or by calling a override if set.
 * @param config - configuration object
 * @returns Page name.
 */
export function getPageName(config: IClickAnalyticsConfiguration, overrideValues: IOverrideValues) {
    /// <summary>
    ///  Gets the pageName from the DOM or by calling a override if set.
    /// </summary>

    if (overrideValues && overrideValues.pageName) {
        return overrideValues.pageName;
    } else if (config.callback && isFunction(config.callback.pageName)) {
        return config.callback.pageName();
    } else if (config.coreData && config.coreData.pageName) {
        return config.coreData.pageName;
    } else {
        const doc = getDocument();
        return doc && doc.title || "";
    }
}

/**
 * Sanitize URL values
 * @param config - Configuration
 * @param location - window.location or document.location
 * @returns Flag indicating if an element is market PII.
 */
export function sanitizeUrl(config: IClickAnalyticsConfiguration, location: Location): string {
    if (!location) {
        return null;
    }
    var url = location.protocol + "//" + (location.hostname || location.host) +         // location.hostname is not supported on Opera and Opera for Android
        (isValueAssigned(location.port) ? ":" + location.port : "") +
        location.pathname;
        
    if (!!config.urlCollectHash) { // false by default
        url += (isValueAssigned(location.hash)? location.hash : "");
    }

    if (!!config.urlCollectQuery) { // false by default
        url += (isValueAssigned(location.search)? location.search : "");
    }

    return url;
}

/**
 * Get URI, sanitize the value if configured on
 * @param config - Configuration
 * @param location - window.location or document.location
 * @returns Flag indicating if an element is market PII.
 */
export function getUri(config: IClickAnalyticsConfiguration, location: any): string {
    if (config.coreData && config.coreData.requestUri && config.coreData.requestUri !== "") {
        return config.coreData.requestUri;
    }
    return sanitizeUrl(config, location);
}
