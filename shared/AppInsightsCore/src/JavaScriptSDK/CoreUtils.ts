// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict";

// Added to help with minfication
let prototype = "prototype";

export class CoreUtils {
    public static _canUseCookies: boolean;

    public static isNullOrUndefined(input: any): boolean {
        return input === null || input === undefined;
    }

    /**
     * Check if an object is of type Date
     */
    public static isDate(obj: any): boolean {
        return Object[prototype].toString.call(obj) === "[object Date]";
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
     * for older browsers that do not define Object.create (eg. ES3 only, IE8) just in case any page checks for presence/absence of the prototype implementation.
     * Note: For consistency this will not use the Object.create implementation if it exists as this would cause a testing requirement to test with and without the implementations
     * @param obj Object to use as a prototype. May be null
     */
    public static objCreate(obj:object):any {
        if (obj == null) {
            return {};
        }

        let type = typeof obj;
        if (type !== 'object' && type !== 'function') {
            throw new TypeError('Object prototype may only be an Object: ' + obj)
        }

        function tmpFunc() {};
        tmpFunc[prototype] = obj;

        return new tmpFunc();
    }

    /**
     * Returns the names of the enumerable string properties and methods of an object. This helper exists to avoid adding a polyfil for older browsers 
     * that do not define Object.create (eg. ES3 only, IE8) just in case any page checks for presence/absence of the prototype implementation.
     * Note: For consistency this will not use the Object.create implementation if it exists as this would cause a testing requirement to test with and without the implementations
     * @param obj Object that contains the properties and methods. This can be an object that you created or an existing Document Object Model (DOM) object.
     */
     public static objKeys(obj: {}): string[] {
        var hasOwnProperty = Object[prototype].hasOwnProperty;
        var hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString');

        let type = typeof obj;
        if (type !== 'function' && (type !== 'object' || obj === null)) {
            throw new TypeError('objKeys called on non-object');
        }

        let result:string[] = [];
        
        for (let prop in obj) {
            if (hasOwnProperty.call(obj, prop)) {
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
                if (hasOwnProperty.call(obj, dontEnums[lp])) {
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
    public static objDefineAccessors<T>(target:any, prop:string, getProp?:() => T, setProp?: (v:T) => void) : boolean
    {
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
}
const GuidRegex = /[xy]/g;