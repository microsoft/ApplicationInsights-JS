// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict";
import { getWindow, getDocument, strUndefined, strObject, strFunction, strPrototype }  from './EnvUtils';

// Added to help with minfication
export const Undefined = strUndefined;
const strOnPrefix = "on";
const strAttachEvent = "attachEvent";
const strAddEventHelper = "addEventListener";
const strDetachEvent = "detachEvent";
const strRemoveEventListener = "removeEventListener";

function _isTypeof(value: any, theType: string): boolean {
    return typeof value === theType;
};

function _isUndefined(value: any): boolean {
    return _isTypeof(value, strUndefined) || value === undefined;
};

function _isNullOrUndefined(value: any): boolean {
    return (_isUndefined(value) || value === null);
}

function _hasOwnProperty(obj:any, prop:string): boolean {
    return obj && Object[strPrototype].hasOwnProperty.call(obj, prop);
};

function _isObject(value: any): boolean {
    return _isTypeof(value, strObject);
};

function _isFunction(value: any): boolean {
    return _isTypeof(value, strFunction);
};

/**
 * Binds the specified function to an event, so that the function gets called whenever the event fires on the object
 * @param obj Object to add the event too.
 * @param eventNameWithoutOn String that specifies any of the standard DHTML Events without "on" prefix
 * @param handlerRef Pointer that specifies the function to call when event fires
 * @param useCapture [Optional] Defaults to false
 * @returns True if the function was bound successfully to the event, otherwise false
 */
function _attachEvent(obj:any, eventNameWithoutOn:string, handlerRef:any, useCapture:boolean = false) {
    let result = false;
    if (!_isNullOrUndefined(obj)) {
        try {
            if (!_isNullOrUndefined(obj[strAddEventHelper])) {
                // all browsers except IE before version 9
                obj[strAddEventHelper](eventNameWithoutOn, handlerRef, useCapture);
                result = true;
            } else if (!_isNullOrUndefined(obj[strAttachEvent])) {
                // IE before version 9                    
                obj[strAttachEvent](strOnPrefix + eventNameWithoutOn, handlerRef);
                result = true;
            }
        } catch (e) {
            // Just Ignore any error so that we don't break any execution path
        }
    }

    return result;
}

/**
 * Removes an event handler for the specified event
 * @param Object to remove the event from
 * @param eventNameWithoutOn {string} - The name of the event
 * @param handlerRef {any} - The callback function that needs to be executed for the given event
 * @param useCapture [Optional] Defaults to false
 */
function _detachEvent(obj:any, eventNameWithoutOn:string, handlerRef:any, useCapture:boolean = false) {
    if (!_isNullOrUndefined(obj)) {
        try {
            if (!_isNullOrUndefined(obj[strRemoveEventListener])) {
                obj[strRemoveEventListener](eventNameWithoutOn, handlerRef, useCapture);
            } else if (!_isNullOrUndefined(obj[strDetachEvent])) {
                obj[strDetachEvent](strOnPrefix + eventNameWithoutOn, handlerRef);
            }
        } catch (e) {
            // Just Ignore any error so that we don't break any execution path
        }
    }
}

/**
 * Validates that the string name conforms to the JS IdentifierName specification and if not
 * normalizes the name so that it would. This method does not identify or change any keywords
 * meaning that if you pass in a known keyword the same value will be returned.
 * This is a simplified version
 * @param name The name to validate
 */
export function normalizeJsName(name:string):string {
    let value = name;
    let match = /([^\w\d_$])/g;
    if (match.test(name)) {
        value = name.replace(match, "_");
    }    

    return value;
}

export class CoreUtils {
    public static _canUseCookies: boolean;

    public static isTypeof:(value: any, theType: string) => boolean = _isTypeof;
    
    public static isUndefined:(value: any) => boolean = _isUndefined;
    
    public static isNullOrUndefined:(value: any) => boolean = _isNullOrUndefined;
    
    public static hasOwnProperty:(obj:any, prop:string) => boolean = _hasOwnProperty;
    
    /**
     * Checks if the passed of value is a function.
     * @param {any} value - Value to be checked.
     * @return {boolean} True if the value is a boolean, false otherwise.
     */
    public static isFunction:(value: any) => boolean = _isFunction;

    /**
     * Checks if the passed of value is a function.
     * @param {any} value - Value to be checked.
     * @return {boolean} True if the value is a boolean, false otherwise.
     */
    public static isObject:(value: any) =>  boolean = _isObject;

    /**
     * Check if an object is of type Date
     */
    public static isDate(obj: any): boolean {
        return Object[strPrototype].toString.call(obj) === "[object Date]";
    }

    /**
     * Checks if the type of value is a string.
     * @param {any} value - Value to be checked.
     * @return {boolean} True if the value is a string, false otherwise.
     */
    public static isString(value: any): boolean {
        return _isTypeof(value, "string");
    }

    /**
     * Checks if the type of value is a number.
     * @param {any} value - Value to be checked.
     * @return {boolean} True if the value is a number, false otherwise.
     */
    public static isNumber(value: any): boolean {
        return _isTypeof(value, "number");
    }

    /**
     * Checks if the type of value is a boolean.
     * @param {any} value - Value to be checked.
     * @return {boolean} True if the value is a boolean, false otherwise.
     */
    public static isBoolean(value: any): boolean {
        return _isTypeof(value, "boolean");
    }

    /**
     * Creates a new GUID.
     * @return {string} A GUID.
     */

    public static disableCookies() {
        CoreUtils._canUseCookies = false;
    }

    public static newGuid():  string  {
        return  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(GuidRegex,  (c) => {
            const  r  =  (Math.random()  *  16  |  0),  v  =  (c  ===  'x'  ?  r  :  r  &  0x3  |  0x8);
            return  v.toString(16);
        });
    }

    /**
     * Convert a date to I.S.O. format in IE8
     */
    public static toISOString(date: Date) {
        if (CoreUtils.isDate(date)) {
            const pad = (num: number) => {
                let r = String(num);
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
    }

    /**
     * Performs the specified action for each element in an array. This helper exists to avoid adding a polyfil for older browsers
     * that do not define Array.prototype.xxxx (eg. ES3 only, IE8) just in case any page checks for presence/absence of the prototype
     * implementation. Note: For consistency this will not use the Array.prototype.xxxx implementation if it exists as this would
     * cause a testing requirement to test with and without the implementations
     * @param callbackfn  A function that accepts up to three arguments. forEach calls the callbackfn function one time for each element in the array.
     * @param thisArg  [Optional] An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    public static arrForEach<T>(arr: T[], callbackfn: (value: T, index?: number, array?: T[]) => void, thisArg?: any):void {
        let len = arr.length;
        for (let idx = 0; idx < len; ++idx) {
            if (idx in arr) {
                callbackfn.call(thisArg || arr, arr[idx], idx, arr);
            }
        }
    }

    /**
     * Returns the index of the first occurrence of a value in an array. This helper exists to avoid adding a polyfil for older browsers
     * that do not define Array.prototype.xxxx (eg. ES3 only, IE8) just in case any page checks for presence/absence of the prototype
     * implementation. Note: For consistency this will not use the Array.prototype.xxxx implementation if it exists as this would
     * cause a testing requirement to test with and without the implementations
     * @param searchElement The value to locate in the array.
     * @param fromIndex The array index at which to begin the search. If fromIndex is omitted, the search starts at index 0.
     */
    public static arrIndexOf<T>(arr: T[], searchElement: T, fromIndex?: number): number {
        let len = arr.length;
        let from = fromIndex || 0;
        for (let lp = Math.max(from >= 0 ? from : len - Math.abs(from), 0); lp < len; lp++) {
            if (lp in arr && arr[lp] === searchElement) {
                return lp;
            }
        }

        return -1;
    }

    /**
     * Calls a defined callback function on each element of an array, and returns an array that contains the results. This helper exists 
     * to avoid adding a polyfil for older browsers that do not define Array.prototype.xxxx (eg. ES3 only, IE8) just in case any page 
     * checks for presence/absence of the prototype implementation. Note: For consistency this will not use the Array.prototype.xxxx 
     * implementation if it exists as this would cause a testing requirement to test with and without the implementations
     * @param callbackfn A function that accepts up to three arguments. The map method calls the callbackfn function one time for each element in the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    public static arrMap<T,R>(arr: T[], callbackfn: (value: T, index?: number, array?: T[]) => R, thisArg?: any): R[] {
        let len = arr.length;
        let _this = thisArg || arr;
        let results = new Array(len);
        
        for (let lp = 0; lp < len; lp++) {
            if (lp in arr) {
                results[lp] = callbackfn.call(_this, arr[lp], arr);
            }
        }

        return results;
    }

    /**
     * Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is
     * provided as an argument in the next call to the callback function. This helper exists to avoid adding a polyfil for older browsers that do not define
     * Array.prototype.xxxx (eg. ES3 only, IE8) just in case any page checks for presence/absence of the prototype implementation. Note: For consistency 
     * this will not use the Array.prototype.xxxx implementation if it exists as this would cause a testing requirement to test with and without the implementations
     * @param callbackfn A function that accepts up to four arguments. The reduce method calls the callbackfn function one time for each element in the array.
     * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
     */
    public static arrReduce<T,R>(arr: T[], callbackfn: (previousValue: T|R, currentValue?: T, currentIndex?: number, array?: T[]) => R, initialValue?: R): R {
        let len = arr.length;
        let lp = 0;
        let value;

        // Specifically checking the number of passed arguments as the value could be anything
        if (arguments.length >= 3) {
            value = arguments[2];
        } else {
            while (lp < len && !(lp in arr)) {
                lp++;
            }

            value = arr[lp++];
        }

        while (lp < len) {
            if (lp in arr) {
                value = callbackfn(value, arr[lp], lp, arr);
            }
            lp++;
        }

        return value;
    }

    /**
     * Creates an object that has the specified prototype, and that optionally contains specified properties. This helper exists to avoid adding a polyfil
     * for older browsers that do not define Object.create eg. ES3 only, IE8 just in case any page checks for presence/absence of the prototype implementation.
     * Note: For consistency this will not use the Object.create implementation if it exists as this would cause a testing requirement to test with and without the implementations
     * @param obj Object to use as a prototype. May be null
     */
    public static objCreate(obj:object):any {
        if (obj == null) {
            return {};
        }

        if (!_isObject(obj) && !_isFunction(obj)) {
            throw new TypeError('Object prototype may only be an Object: ' + obj)
        }

        function tmpFunc() {};
        tmpFunc[strPrototype] = obj;

        return new (tmpFunc as any)();
    }

    /**
     * Returns the names of the enumerable string properties and methods of an object. This helper exists to avoid adding a polyfil for older browsers 
     * that do not define Object.keys eg. ES3 only, IE8 just in case any page checks for presence/absence of the prototype implementation.
     * Note: For consistency this will not use the Object.keys implementation if it exists as this would cause a testing requirement to test with and without the implementations
     * @param obj Object that contains the properties and methods. This can be an object that you created or an existing Document Object Model (DOM) object.
     */
     public static objKeys(obj: {}): string[] {
        var hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString');

        if (!_isFunction(obj) && (!_isObject(obj) || obj === null)) {
            throw new TypeError('objKeys called on non-object');
        }

        let result:string[] = [];
        
        for (let prop in obj) {
            if (_hasOwnProperty(obj, prop)) {
                result.push(prop);
            }
        }

        if (hasDontEnumBug) {
            let dontEnums = [
                'toString',
                'toLocaleString',
                'valueOf',
                'hasOwnProperty',
                'isPrototypeOf',
                'propertyIsEnumerable',
                'constructor'
            ];
            let dontEnumsLength = dontEnums.length;
            
            for (let lp = 0; lp < dontEnumsLength; lp++) {
                if (_hasOwnProperty(obj, dontEnums[lp])) {
                    result.push(dontEnums[lp]);
                }
            }
        }

        return result;
    }

    /**
     * Try to define get/set object property accessors for the target object/prototype, this will provide compatibility with
     * existing API definition when run within an ES5+ container that supports accessors but still enable the code to be loaded
     * and executed in an ES3 container, providing basic IE8 compatibility.
     * @param target The object on which to define the property.
     * @param prop The name of the property to be defined or modified.
     * @param getProp The getter function to wire against the getter.
     * @param setProp The setter function to wire against the setter.
     * @returns True if it was able to create the accessors otherwise false
     */
    public static objDefineAccessors<T>(target:any, prop:string, getProp?:() => T, setProp?: (v:T) => void) : boolean {
        let defineProp = Object["defineProperty"];
        if (defineProp) {
            try {
                let descriptor:PropertyDescriptor = {
                    enumerable: true,
                    configurable: true
                }

                if (getProp) {
                    descriptor.get = getProp;
                }
                if (setProp) {
                    descriptor.set = setProp;
                }

                defineProp(target, prop, descriptor);
                return true;
            } catch (e) {
                // IE8 Defines a defineProperty on Object but it's only supported for DOM elements so it will throw
                // We will just ignore this here.
            }
        }

        return false;
    }

    /**
     * Trys to add an event handler for the specified event to the window, body and document
     * @param eventName {string} - The name of the event
     * @param callback {any} - The callback function that needs to be executed for the given event
     * @return {boolean} - true if the handler was successfully added
     */
    public static addEventHandler(eventName: string, callback: any): boolean {
        let result = false;
        let w = getWindow();
        if (w) {
            result = _attachEvent(w, eventName, callback);
            result = _attachEvent(w["body"], eventName, callback) || result;
        }

        let doc = getDocument();
        if (doc) {
            result = EventHelper.Attach(doc, eventName, callback) || result;
        }

        return result;
    }
}

const GuidRegex = /[xy]/g;

export class EventHelper {
    /**
     * Binds the specified function to an event, so that the function gets called whenever the event fires on the object
     * @param obj Object to add the event too.
     * @param eventNameWithoutOn String that specifies any of the standard DHTML Events without "on" prefix
     * @param handlerRef Pointer that specifies the function to call when event fires
     * @returns True if the function was bound successfully to the event, otherwise false
     */
    public static Attach:(obj:any, eventNameWithoutOn:string, handlerRef:any) => boolean = _attachEvent;

    /**
     * Binds the specified function to an event, so that the function gets called whenever the event fires on the object
     * @deprecated Use {@link EventHelper#Attach} as we are already in a class call EventHelper the extra "Event" just causes a larger result
     * @param obj Object to add the event too.
     * @param eventNameWithoutOn String that specifies any of the standard DHTML Events without "on" prefix
     * @param handlerRef Pointer that specifies the function to call when event fires
     * @returns True if the function was bound successfully to the event, otherwise false
     */
    public static AttachEvent:(obj:any, eventNameWithoutOn:string, handlerRef:any) => boolean = _attachEvent;

    /**
     * Removes an event handler for the specified event
     * @param eventName {string} - The name of the event
     * @param callback {any} - The callback function that needs to be executed for the given event
     * @return {boolean} - true if the handler was successfully added
     */
    public static Detach:(obj:any, eventNameWithoutOn:string, handlerRef:any) => void = _detachEvent;

    /**
     * Removes an event handler for the specified event
     * @deprecated Use {@link EventHelper#Detach} as we are already in a class call EventHelper the extra "Event" just causes a larger result
     * @param eventName {string} - The name of the event
     * @param callback {any} - The callback function that needs to be executed for the given event
     * @return {boolean} - true if the handler was successfully added
     */
    public static DetachEvent:(obj:any, eventNameWithoutOn:string, handlerRef:any) => void = _detachEvent;
}
