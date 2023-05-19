/**
* @copyright Microsoft 2020
* File containing utility functions.
*/

import {
    _InternalMessageId, _eInternalMessageId, arrForEach, createEnumStyle, getDocument, hasDocument, hasOwnProperty, isNullOrUndefined,
    objExtend
} from "@microsoft/applicationinsights-core-js";
import { IClickAnalyticsConfiguration } from "../Interfaces/Datamodel";

const DEFAULT_DONOT_TRACK_TAG = "ai-dnt";
const DEFAULT_AI_BLOB_ATTRIBUTE_TAG = "ai-blob";
const DEFAULT_DATA_PREFIX = "data-";

export const enum _eExtendedInternalMessageId {
    CannotParseAiBlobValue = 101,
    InvalidContentBlob = 102,
    TrackPageActionEventFailed = 103
}

export const _ExtendedInternalMessageId = {
    ..._InternalMessageId,
    ...createEnumStyle<typeof _eExtendedInternalMessageId>({
        CannotParseAiBlobValue: _eExtendedInternalMessageId.CannotParseAiBlobValue,
        InvalidContentBlob: _eExtendedInternalMessageId.InvalidContentBlob,
        TrackPageActionEventFailed: _eExtendedInternalMessageId.TrackPageActionEventFailed
    })
}

export type _ExtendedInternalMessageId = number | _eExtendedInternalMessageId | _eInternalMessageId;


/**
 * Finds attributes in overrideConfig which are invalid or should be objects
 * and deletes them. useful in override config
 * @param overrideConfig - override config object
 * @param attributeNamesExpectedObjects - attributes that should be objects in override config object
 */
export function removeNonObjectsAndInvalidElements(overrideConfig: IClickAnalyticsConfiguration, attributeNamesExpectedObjects: Array<string>): void {
    removeInvalidElements(overrideConfig);
    for (var i in attributeNamesExpectedObjects) {
        if (hasOwnProperty(attributeNamesExpectedObjects, i)) {
            var objectName = attributeNamesExpectedObjects[i];
            if (typeof overrideConfig[objectName] === "object") {
                removeInvalidElements(overrideConfig[objectName]);
            } else {
                delete overrideConfig[objectName];
            }
        }
    }
}

/**
 * Finds attributes in object which are invalid
 * and deletes them. useful in override config
 * @param object Input object
 */
export function removeInvalidElements(object: Object): void {
    /// Because the config object 'callback' contains only functions,
    /// when it is stringified it returns the empty object. This explains
    /// the workaround regarding 'callback'
    for (var property in object) {
        if (!isValueAssigned(object[property]) ||
            (JSON.stringify(object[property]) === "{}" && (property !== "callback"))) {
            delete object[property];
        }
    }
}

/**
 * Checks if value is assigned to the given param.
 * @param value - The token from which the tenant id is to be extracted.
 * @returns True/false denoting if value is assigned to the param.
 */
export function isValueAssigned(value: any) {
    /// <summary> takes a value and checks for undefined, null and empty string </summary>
    /// <param type="any"> value to be tested </param>
    /// <returns> true if value is null undefined or emptyString </returns>
    return !(isNullOrUndefined(value) || value === "");
}

/**
 * Determines whether an event is a right click or not
 * @param evt - Mouse event
 * @returns true if the event is a right click
 */
export function isRightClick(evt: any): boolean {
    try {
        if ("which" in evt) { // Chrome, FF, ...
            return (evt.which === 3);
        } else if ("button" in evt) { // IE, ...
            return (evt.button === 2);
        }
    } catch (e) {
        // This can happen with some native browser objects, but should not happen for the type we are checking for
    }
}

/**
 * Determines whether an event is a left click or not
 * @param evt - Mouse event
 * @returns true if the event is a left click
 */
export function isLeftClick(evt: any): boolean {
    try {
        if ("which" in evt) { // Chrome, FF, ...
            return (evt.which === 1);
        } else if ("button" in evt) { // IE, ...
            return (evt.button === 1);
        }
    } catch (e) {
        // This can happen with some native browser objects, but should not happen for the type we are checking for
    }
}

/**
 * Determines whether an event is a middle click or not
 * @param evt - Mouse event
 * @returns true if the event is a middle click
 */
export function isMiddleClick(evt: any): boolean {
    try {
        if ("which" in evt) { // Chrome, FF, ...
            return (evt.which === 2);
        } else if ("button" in evt) { // IE, ...
            return (evt.button === 4);
        }
    } catch (e) {
        // This can happen with some native browser objects, but should not happen for the type we are checking for
    }
}

/**
 *  Determines whether an event is a keyboard enter or not
 * @param evt - Keyboard event
 * @returns true if the event is a keyboard enter
 */
export function isKeyboardEnter(evt: KeyboardEvent): boolean {
    try {
        if ("keyCode" in evt) { // Chrome, FF, ...
            return (evt.keyCode === 13);
        }
    } catch (e) {
        // This can happen with some native browser objects, but should not happen for the type we are checking for
    }
}

/**
 *  Determines whether an event is a keyboard space or not
 * @param evt - Keyboard event
 * @returns true if the event is a space enter
 */
export function isKeyboardSpace(evt: KeyboardEvent) {
    try {
        if ("keyCode" in evt) { // Chrome, FF, ...
            return (evt.keyCode === 32);
        }
    } catch (e) {
        // This can happen with some native browser objects, but should not happen for the type we are checking for
    }
}

/**
 *  Determines whether the elemt have a DNT(Do Not Track) tag
 * @param element - DOM element
 * @param doNotTrackFieldName - DOM element
 * @returns true if the element must not be tarcked
 */
export function isElementDnt(element: Element, doNotTrackFieldName: string): boolean {
    var dntElement = findClosestByAttribute(element, doNotTrackFieldName);
    if (!isValueAssigned(dntElement)) {
        return false;
    }
    return true;
}

/**
 * Walks up DOM tree to find element with attribute
 * @param el - DOM element
 * @param attribute - Attribute name
 * @returns Dom element which contains attribute
 */
export function findClosestByAttribute(el: Element, attribute: string): Element {
    return walkUpDomChainWithElementValidation(el, isAttributeInElement, attribute);
}

/**
 * checks if attribute is in element.
 * method checks for empty string, in case the attribute is set but no value is assigned to it
 * @param element - DOM element
 * @param attributeToLookFor - Attribute name
 * @returns true if attribute is in element, even if empty string
 */
export function isAttributeInElement(element: Element, attributeToLookFor: string): Boolean {
    var value = element.getAttribute(attributeToLookFor);
    return isValueAssigned(value);
}

/**
 * Walks up DOM tree to find element which matches validationMethod
 * @param el - DOM element
 * @param validationMethod - DOM element validation method
 * @param validationMethodParam - DOM element validation method parameters
 * @returns Dom element which is an anchor
 */
export function walkUpDomChainWithElementValidation(el: Element, validationMethod: Function, validationMethodParam?: any): Element {
    var element = el;
    if (element) {
        while (!validationMethod(element, validationMethodParam)) {
            element = (element.parentNode as Element);
            if (!element || !(element.getAttribute)) {
                return null;
            }
        }
        return element;
    }
}


/**
 * Determine if DOM element is an anchor
 * @param element - DOM element
 * @returns Is element an anchor
 */
export function isElementAnAnchor(element: Element): boolean {
    return element.nodeName === "A";
}

/**
 * Walks up DOM tree to find anchor element
 * @param element - DOM element
 * @returns Dom element which is an anchor
 */
export function findClosestAnchor(element: Element): Element {
    /// <summary> Walks up DOM tree to find anchor element </summary>
    /// <param type='object'> DOM element </param>
    /// <returns> Dom element which is an anchor</returns>

    return walkUpDomChainWithElementValidation(element, isElementAnAnchor);
}

/**
 * Returns the specified field and also removes the property from the object if exists.
 * @param obj - Input object
 * @param fieldName - >Name of the field/property to be extracted
 * @returns Value of the specified tag
 */
export function extractFieldFromObject(obj: Object, fieldName: string): string {
    var fieldValue: any;
    if (obj && obj[fieldName]) {
        fieldValue = obj[fieldName];
        delete obj[fieldName];
    }

    return fieldValue;
}

/**
 *  Adds surrounding square brackets to the passed in text
 * @param str - Input string
 * @returns String with surrounding brackets
 */
export function bracketIt(str: string): string {
    /// <summary>
    ///  Adds surrounding square brackets to the passed in text
    /// </summary>
    return "[" + str + "]";
}

export function validateContentNamePrefix ( config: IClickAnalyticsConfiguration, defaultDataPrefix: string) {
    return isValueAssigned(config.dataTags.customDataPrefix) && (config.dataTags.customDataPrefix.indexOf(defaultDataPrefix) === 0);
}

/**
 * Merge passed in configuration with default configuration
 * @param overrideConfig
 */
export function mergeConfig(overrideConfig: IClickAnalyticsConfiguration): IClickAnalyticsConfiguration {
    let defaultConfig: IClickAnalyticsConfiguration = {
        // General library settings
        autoCapture: true,
        callback: {
            pageActionPageTags: null
        },
        pageTags: {},
        // overrideValues to use instead of collecting automatically
        coreData: {
            referrerUri: hasDocument() ? getDocument().referrer : "",
            requestUri: "",
            pageName: "",
            pageType: ""
        },
        dataTags: {
            useDefaultContentNameOrId: false,
            aiBlobAttributeTag: DEFAULT_AI_BLOB_ATTRIBUTE_TAG,
            customDataPrefix: DEFAULT_DATA_PREFIX,
            captureAllMetaDataContent: false,
            dntDataTag: DEFAULT_DONOT_TRACK_TAG
        },
        behaviorValidator: (key:string) => key || "",
        defaultRightClickBhvr: "",
        dropInvalidEvents : false
    };

    let attributesThatAreObjectsInConfig: any[] = [];
    for (const attribute in defaultConfig) {
        if (typeof defaultConfig[attribute] === "object") {
            attributesThatAreObjectsInConfig.push(attribute);
        }
    }

    if (overrideConfig) {
        // delete attributes that should be object and
        // delete properties that are null, undefined, ''
        removeNonObjectsAndInvalidElements(overrideConfig, attributesThatAreObjectsInConfig);
        if(isValueAssigned(overrideConfig.dataTags)) {
            overrideConfig.dataTags.customDataPrefix = validateContentNamePrefix(overrideConfig, DEFAULT_DATA_PREFIX) ? overrideConfig.dataTags.customDataPrefix : DEFAULT_DATA_PREFIX;
        }
    }

    return objExtend(true, defaultConfig, overrideConfig || {});
}

export function BehaviorMapValidator (map: any) {
    return (key: string)  => map[key] || "";
}

export function BehaviorValueValidator (behaviorArray: string[]) {
    return (key: string) => {
        let result;
        arrForEach(behaviorArray, (value) => {
            if (value === key) {
                result = value;
                return -1;
            }
        });
        return result || "";
    }

}

export function BehaviorEnumValidator (enumObj: any) {
    return (key: string)  => enumObj[key] || "";
}
