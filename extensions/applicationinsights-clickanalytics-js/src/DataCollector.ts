/**
 * DataCollector.ts
 * @author Krishna Yalamanchili (kryalama)
 * @copyright Microsoft 2018
 */
import {
    isValueAssigned, isDocumentObjectAvailable,
    _ExtendedInternalMessageId, getLocation, getDocument, getWindow
} from '@ms/1ds-core-js';
import { _findClosestAnchor } from './common/Utils';


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
 * Check if a given element has an element has data-dc attribute defined with a value 'pii'
 * @param element - An html element
 * @returns Flag indicating if an element is market PII.
 */
export function _isPii(element: Element) {
    if (!element || !element.attributes) {
        return false;
    }

    try {
        var pii = element.getAttribute('data-dc');

        if (isValueAssigned(pii)) {
            if (pii.toLowerCase() === 'pii') {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    } catch (e) {
        return false;
    }
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
