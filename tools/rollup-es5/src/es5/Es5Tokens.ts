// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { IEs5CheckKeyword, IEs5Keyword } from "./Interfaces";

export const defaultEs5Tokens:IEs5Keyword[] = [
];

export const defaultEs5CheckTokens:IEs5CheckKeyword[] = [
    {
        funcNames: [ /Object\.(is|fromEntries|entries|setPrototypeOf)\(/g ],
        errorMsg: "[%funcName%] is not supported in an IE/ES5 environment, use a helper function or add explicit check for existence"
    },
    {
        funcNames: [ /Object\.(assign)\(/g ],
        errorMsg: "[%funcName%] is not supported in an IE/ES5 environment, use a helper function or add explicit check for existence",
        ignoreIds: [
            "applicationinsights-react-js",  // Don't break build if these exist in the final react extension
            "object-assign\\index.js",          // object-assign node module contains a pre existence check before usage
            "object-assign/index.js"            // object-assign node module contains a pre existence check before usage
        ]
    },
    {
        funcNames: [ /Object\.(keys)\(/g ],
        errorMsg: "[%funcName%] is not supported in an IE/ES5 environment, use a helper function or add explicit check for existence",
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
        errorMsg: "[%funcName%] is not supported in an IE/ES5 environment, use a helper function or add explicit check for existence",
        ignoreIds: [
            "tslib.es6",                    // tslib.es6 library has a pre existence check before usage
            "object-assign\\index.js",      // object-assign node module contains a pre existence check before usage
            "object-assign/index.js"        // object-assign node module contains a pre existence check before usage
        ]
    },
    {
        funcNames: [ /([\w0-9]*)\.(trim)[\s]*\(/g ],
        errorMsg: "[%funcName%] is not a supported string method in an IE/ES5 environment, use strTrim().",
        ignoreFuncMatch: [
            "Util.trim",                            // Make sure this isn't a reference to Util.trim()
            "DataSanitizer.trim"                    // Make sure this isn't a reference to Util.trim()
        ]
    },
    {
        funcNames: [ /([\w0-9]*)\.(startsWith)[\s]*\(/g ],
        errorMsg: "[%funcName%] is not a supported string method in an IE/ES5 environment, use strStartsWith().",
        ignoreFuncMatch: [
        ]
    },
    {
        funcNames: [ /([\w0-9]*)\.(endsWith)[\s]*\(/g ],
        errorMsg: "[%funcName%] is not a supported string method in an IE/ES5 environment, use strEndsWith().",
        ignoreFuncMatch: [
        ]
    }
];

