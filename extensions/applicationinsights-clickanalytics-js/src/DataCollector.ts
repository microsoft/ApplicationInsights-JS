/**
 * DataCollector.ts
 * @author Krishna Yalamanchili (kryalama)
 * @copyright Microsoft 2018
 */
import {
    getLocation, getDocument, getWindow
} from '@microsoft/applicationinsights-core-js';
import { _findClosestAnchor, isDocumentObjectAvailable, isValueAssigned } from './common/Utils';
import { IClickAnalyticsConfiguration, IOverrideValues } from './Interfaces/Datamodel';


var clickCaptureInputTypes = { BUTTON: true, CHECKBOX: true, RADIO: true, RESET: true, SUBMIT: true };


/**
 * Get Image href of a given HTMLImageElement
 * @param element - An html image element
 * @returns Href value.
 */
export function _getImageHref(element: HTMLImageElement): string {
    var temp = element;
    if (temp) {
        var parent = _findClosestAnchor(<Element>temp);
        if ((<any>parent).length === 1) {
            if (parent[0].href) {
                return parent[0].href;
            } else if (parent[0].src) {
                return (parent[0].src);
            }
        }
    }
    return '';
}


/** 
 * Get click target
 * @returns Click target URI
 */
export function _getClickTarget(element: any) {
    var clickTarget = '';
    switch (element.tagName) {
        case 'A':
        case 'AREA':
            clickTarget = element.href || '';
            break;
        case 'IMG':
            clickTarget = _getImageHref(<HTMLImageElement>element);
            break;
        case 'INPUT':
            var type = element.type;
            if (type && (clickCaptureInputTypes[type.toUpperCase()])) {
                let loc = getLocation() || <Location>{};
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
        if (isDocumentObjectAvailable && document.readyState === 'complete') {
            callback();
        } else {
            let win = getWindow();
            if (win) {
                if (win.addEventListener) {
                    win.addEventListener('load', () => {
                        callback();
                    }); // NB **not** 'onload'
                } else if ((<any>win).attachEvent) {
                    (<any>win).attachEvent('onload', () => {
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

    let doc = getDocument() || <Document>{};
    /in/.test(doc.readyState) ? setTimeout(() => { onDomReadyDo(f); }, 100) : f.call();
}

/**
 * Gets the pageName from the DOM or by calling a override if set.
 * @param config - configuration object
 * @returns Page name.
 */
export function _getPageName(config: IClickAnalyticsConfiguration, overrideValues: IOverrideValues) {
    /// <summary>
    ///  Gets the pageName from the DOM or by calling a override if set.
    /// </summary>

    if (overrideValues && overrideValues.pageName) {
        return overrideValues.pageName;
    } else if (config.callback && typeof (config.callback.pageName) === 'function') {
        return config.callback.pageName();
    } else if (config.coreData && config.coreData.pageName) {
        return config.coreData.pageName;
    } else {
        let loc = getLocation() || <Location>{};
        var pagename = loc.pathname || "";
        var fragments = pagename.split('/');
        if (fragments && fragments[fragments.length - 1] !== '') {
            pagename = fragments[fragments.length - 1];
        } else {
            pagename = 'Undefined';
        }
        return pagename;
    }
}

/**
 * Sanitize URL values 
 * @param config - Configuration
 * @param location - window.location or document.location
 * @returns Flag indicating if an element is market PII.
 */
export function _sanitizeUrl(config: IClickAnalyticsConfiguration, location: Location): string {
    if (!location) {
        return null;
    }
    var url = location.protocol + '//' + (location.hostname || location.host) +         // location.hostname is not supported on Opera and Opera for Android
        (isValueAssigned(location.port) ? ':' + location.port : '') +
        location.pathname;

    if (config.urlCollectHash) { // false by default
        url += (location.hash || '');
    }

    if (config.urlCollectQuery) { // false by default
        var query = location.search;
        if (!query) {
            // in older browsers the query parameters can be contained in the hash
            var hash = location.hash || '';
            var queryIndex = hash.indexOf('?');
            if (queryIndex !== -1) {
                query = hash.slice(queryIndex);
            }
        }
        return url + query;
    }
    return url;
}

/**
 * Get URI, sanitize the value if configured on
 * @param config - Configuration
 * @param location - window.location or document.location
 * @returns Flag indicating if an element is market PII.
 */
export function _getUri(config: IClickAnalyticsConfiguration, location: any): string {
    if (config.coreData && config.coreData.requestUri && config.coreData.requestUri !== '') {
        return config.coreData.requestUri;
    }
    return _sanitizeUrl(config, location);
}