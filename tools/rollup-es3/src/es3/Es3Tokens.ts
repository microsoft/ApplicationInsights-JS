// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { IEs3CheckKeyword, IEs3Keyword } from "./Interfaces";

export const defaultEs3Tokens:IEs3Keyword[] = [
    {
        funcNames: [ /Object\.(defineProperty)[\s]*\(/g ],
        errorMsg: "[Object.defineProperty] is not supported in an ES3 environment, use a helper function or add an explicit existence check",
        extract: /(Object)\.(defineProperty)[\s]*\(([^)]*)\)([;]?)/g,
        checkGroups: [ 2 ],     // Identifies that this group MUST contain a value for this to token to be replaced
        namedGroups: [          // Used to simulate named RegEx groups and provide replacement token names
            { name: "src", idx: 0 },
            { name: "class", idx: 1 },
            { name: "function", idx: 2 },
            { name: "semi", idx: 4},
            { name: "args", idx: 3}
        ],
        replace:"(function(obj, prop, descriptor) { " +
            "/* ai_es3_polyfil %function% */ " +
            "var func = %class%[\"%function%\"]; " +
            "if (func) { try { return func(obj, prop, descriptor); } catch(e) { /* IE8 defines defineProperty, but will throw */ } } " +
            "if (descriptor && typeof descriptor.value !== undefined) { obj[prop] = descriptor.value; } " +
            "return obj; " +
            "})(%args%)%semi%"
    },
    {
        funcNames: [/Object\.getOwnPropertyDescriptor[\s]*\(/g ],
        errorMsg: "[Object.getOwnPropertyDescriptor] is not supported in an ES3 environment, use a helper function or add an explicit existence check",
        extract: /(Object)\.(getOwnPropertyDescriptor)[\s]*\(([^)]*)\)([;]?)/g,
        checkGroups: [ 2 ],
        namedGroups: [
            { name: "src", idx: 0 },
            { name: "class", idx: 1 },
            { name: "function", idx: 2 },
            { name: "semi", idx: 4},
            { name: "args", idx: 3}
        ],
        replace:"(function(obj, prop) { " +
            "/* ai_es3_polyfil %function% */" +
            "var func = %class%[\"%function%\"]; " +
            "if (func) { return func(obj, prop); } " +
            "return undefined; " +
            "})(%args%)%semi%"
    },
    {
        funcNames: [/Object\.create[\s]*\(/g ],
        errorMsg: "[Object.create] is not supported in an ES3 environment, use the helper function objCreate() or add an explicit existence check",
        // We are only supporting the version that takes a single argument
        extract: /(Object)\.(create)[\s]*\(([^,)]*)\)([;]?)/g,
        checkGroups: [ 2 ],
        namedGroups: [
            { name: "src", idx: 0 },
            { name: "class", idx: 1 },
            { name: "function", idx: 2 },
            { name: "semi", idx: 4},
            { name: "args", idx: 3}
        ],
        replace:"(function(obj) { " +
                "/* ai_es3_polyfil %function% */ " +
                "var func = %class%[\"%function%\"]; " +
                // Use build in Object.create
                "if (func) { return func(obj); } " +
                "if (obj == null) { return {}; }; " +
                "var type = typeof obj; " +
                "if (type !== 'object' && type !== 'function') { throw new TypeError('Object prototype may only be an Object:' + obj); } " +
                "function tmpFunc() {}; tmpFunc.prototype = obj; return new tmpFunc(); " +
                "})(%args%)%semi%"
    },
    {
        funcNames: [/Object\.(freeze|seal)[\s]*\(/g ],
        errorMsg: "[Object.freeze] is not supported in an ES3 environment, use a helper or add an explicit existence check",
        extract: /(Object)\.(freeze|seal)[\s]*\(([^)]*)\)([;]?)/g,
        checkGroups: [ 2 ],
        namedGroups: [
            { name: "src", idx: 0 },
            { name: "class", idx: 1 },
            { name: "function", idx: 2 },
            { name: "semi", idx: 4},
            { name: "args", idx: 3}
        ],
        replace:"(function(obj) { " +
                "/* ai_es3_polyfil %function% */ " +
                "var func = %class%[\"%function%\"]; " +
                // Use existing function if available
                "if (func) { return func(obj); } " +
                "return obj; " +
                "})(%args%)%semi%"
    },
    {
        funcNames: [ /[\s(,]get[\s]+([\w]+)[\s]*\(\)[\s]*\{/g ],
        errorMsg: "[%funcName%] is not supported in an ES3 environment.",
        extract: /([\s(,])get[\s]+([\w]+)[\s]*\(\)[\s]*\{[\s]*return[\s]*([^;]*);[\s]*\}/g,
        checkGroups: [2, 3],
        namedGroups: [
            { name: "src", idx: 0 },
            { name: "prefix", idx: 1 },
            { name: "name", idx: 2 },
            { name: "value", idx: 3 }
        ],
        replace:"%prefix%%name%: (function(obj) { " +
            "/* ai_es3polyfil get %name% */ " +
            "if (obj == null || typeof obj !== \"object\") { return obj; } " +
            "var cpy = obj.constructor(); " +
            "for (var attr in obj) { " +
                "if (obj.hasOwnProperty(attr)) { cpy[attr] = obj[attr]; } " +
            "} " +
            "return cpy; "+
            "})(%value%)"
    }
];

export const defaultEs3CheckTokens:IEs3CheckKeyword[] = [
    {
        funcNames: [ /Object\.(defineProperty|create|getPrototypeOf|getOwnPropertyDescriptor|preventExtensions|is|isExtensible|seal|isSealed|freeze|isFrozen|fromEntries|entries|isPrototypeOf|setPrototypeOf)\(/g ],
        errorMsg: "[%funcName%] is not supported in an ES3 environment, use a helper function or add explicit check for existence"
    },
    {
        funcNames: [ /Object\.(defineProperties)\(/g ],
        errorMsg: "[%funcName%] is not supported in an ES3 environment, use a helper function or add explicit check for existence",
        ignoreIds: [
            "applicationinsights-react-js", // Don't break build if these exist in the final react extension
            "react.production.min.js",      // Don't break build if these exist in the react prod source code
            "react.development.js"          // Don't break build if these exist in the react dev source code
        ]
    },
    {
        funcNames: [ /Object\.(assign|getOwnPropertyNames)\(/g ],
        errorMsg: "[%funcName%] is not supported in an ES3 environment, use a helper function or add explicit check for existence",
        ignoreIds: [
            "applicationinsights-react-js",  // Don't break build if these exist in the final react extension
            "object-assign\\index.js",          // object-assign node module contains a pre existence check before usage
            "object-assign/index.js"            // object-assign node module contains a pre existence check before usage
        ]
    },
    {
        funcNames: [ /Object\.(keys)\(/g ],
        errorMsg: "[%funcName%] is not supported in an ES3 environment, use a helper function or add explicit check for existence",
        ignoreIds: [
            "react.production.min.js",      // Don't break build if these exist in the react prod source code
            "react.development.js",         // Don't break build if these exist in the react dev source code
            "applicationinsights-react-js",  // Don't break build if these exist in the final react extension
            "object-assign\\index.js",      // object-assign node module contains a pre existence check before usage
            "object-assign/index.js"        // object-assign node module contains a pre existence check before usage
        ]
    },
    {
        funcNames: [ /Object\.(getOwnPropertySymbols)\(/g ],
        errorMsg: "[%funcName%] is not supported in an ES3 environment, use a helper function or add explicit check for existence",
        ignoreIds: [
            "tslib.es6",                    // tslib.es6 library has a pre existence check before usage
            "object-assign\\index.js",      // object-assign node module contains a pre existence check before usage
            "object-assign/index.js"        // object-assign node module contains a pre existence check before usage
        ]
    },
    {
        funcNames: [ /([\w0-9$]*)\.toISOString[\s]*\(/g ],
        errorMsg: "[%funcName%] is not supported in an ES3 environment, use getISOString()",
        ignoreFuncMatch: [
            // eslint-disable-next-line security/detect-unsafe-regex
            /CoreUtils(\$[\d]{0,5})?\.isISOString/,     // Make sure this isn't a reference to CoreUtils.isISOString(); CoreUtils$1.isISOString();
            "Utils.toISOString"                         // or if it's a reference to Utils.isISOString()
        ]
    },
    {
        funcNames: [ /\.(every|some|filter|reduce|reduceRight)[\s]*\(/g ],
        errorMsg: "[%funcName%] is not a supported array method in an ES3 environment."
    },
    {
        funcNames: [ /\.(map)[\s]*\(/g ],
        errorMsg: "[%funcName%] is not a supported array method in an ES3 environment.",
        ignoreIds: [
            "react.production.min.js",          // Don't break build if these exist in the react prod source code
            "react.development.js",             // Don't break build if these exist in the react dev source code
            "applicationinsights-react-js",     // Don't break build if these exist in the final react extension
            "object-assign\\index.js",          // object-assign node module usage is only after checking for existence of Object.assign
            "object-assign/index.js"            // object-assign node module usage is only after checking for existence of Object.assign
        ]
    },
    {
        funcNames: [ /([\w0-9]*)\.(forEach)[\s]*\(/g ],
        errorMsg: "[%funcName%] is not a supported array method in an ES3 environment, use arrForEach().",
        ignoreFuncMatch: [
            "headers.forEach"               // Ignore patterns that look like the response headers processing
        ],
        ignoreIds: [
            "applicationinsights-react-js", // Don't break build if these exist in the final react extension
            "object-assign\\index.js",      // object-assign node module usage is only after checking for existence of Object.assign
            "object-assign/index.js"        // object-assign node module usage is only after checking for existence of Object.assign
        ]
    },
    {
        funcNames: [ /[\s(,][gs]et[\s]+([\w]+)[\s]*\(\)[\s]*\{/g ],
        errorMsg: "[%funcName%] is not supported in an ES3 environment."
    },
    {
        funcNames: [ /([\w0-9]*)\.(trim)[\s]*\(/g ],
        errorMsg: "[%funcName%] is not a supported string method in an ES3 environment, use strTrim().",
        ignoreFuncMatch: [
            "Util.trim",                            // Make sure this isn't a reference to Util.trim()
            "DataSanitizer.trim"                    // Make sure this isn't a reference to Util.trim()
        ]
    },
    {
        funcNames: [ /([\w0-9]*)\.(startsWith)[\s]*\(/g ],
        errorMsg: "[%funcName%] is not a supported string method in an ES3 environment, use strStartsWith().",
        ignoreFuncMatch: [
        ]
    },
    {
        funcNames: [ /([\w0-9]*)\.(endsWith)[\s]*\(/g ],
        errorMsg: "[%funcName%] is not a supported string method in an ES3 environment, use strEndsWith().",
        ignoreFuncMatch: [
        ]
    },
    {
        funcNames: [ /([\w0-9$]*)(\(\))?\.now[\s]*\(\)/g ],
        errorMsg: "[%funcName%] is not supported in an ES3 environment, use dateNow() or perfNow()",
        ignoreFuncMatch: [
            "perf.now()",                           // This assume a pre-check that now actually exists
            "dt.now()"                              // This assume a pre-check that now actually exists
        ]
    }
];

