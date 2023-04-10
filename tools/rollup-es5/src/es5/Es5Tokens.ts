// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { IEs5CheckKeyword, IEs5Keyword } from "./Interfaces";

export const defaultEs5Tokens:IEs5Keyword[] = [
];

export const defaultEs5CheckTokens:IEs5CheckKeyword[] = [
    {
        funcNames: [ /\bObject\.(is|fromEntries|entries|setPrototypeOf)\(/g ],
        errorMsg: "[%funcName%] is not supported in a IE/ES5 environment, use a helper function or add explicit check for existence"
    },
    {
        funcNames: [ /\bObject\.(assign)\(/g ],
        errorMsg: "[%funcName%] is not supported in a IE/ES5 environment, use a helper function or add explicit check for existence",
        ignoreIds: [
            "applicationinsights-react-js",  // Don't break build if these exist in the final react extension
            "object-assign\\index.js",          // object-assign node module contains a pre existence check before usage
            "object-assign/index.js"            // object-assign node module contains a pre existence check before usage
        ]
    },
    {
        funcNames: [ /\bObject\.(keys|hasOwn)\(/g ],
        errorMsg: "[%funcName%] is not supported in a IE/ES5 environment, use a helper function or add explicit check for existence",
        ignoreIds: [
            "react.production.min.js",      // Don't break build if these exist in the react prod source code
            "react.development.js",         // Don't break build if these exist in the react dev source code
            "applicationinsights-react-js",  // Don't break build if these exist in the final react extension
            "object-assign\\index.js",      // object-assign node module contains a pre existence check before usage
            "object-assign/index.js"        // object-assign node module contains a pre existence check before usage
        ]
    },
    {
        funcNames: [ /\bObject\.(getOwnPropertySymbols)\(/g ],
        errorMsg: "[%funcName%] is not supported in a IE/ES5 environment, use a helper function or add explicit check for existence",
        ignoreIds: [
            "tslib.es6",                    // tslib.es6 library has a pre existence check before usage
            "object-assign\\index.js",      // object-assign node module contains a pre existence check before usage
            "object-assign/index.js"        // object-assign node module contains a pre existence check before usage
        ]
    },
    {
        funcNames: [ /([\w0-9]*)\.(trim|substr|trimEnd|trimStart|includes|padStart|padEnd)[\s]*\(/g ],
        errorMsg: "[%funcName%] is not a supported string method in a IE/ES5 environment, use strTrim*(), strSubstr(), strIncludes().",
        ignoreFuncMatch: [
            "Util.trim",                            // Make sure this isn't a reference to Util.trim()
            "DataSanitizer.trim"                    // Make sure this isn't a reference to Util.trim()
        ]
    },
    {
        funcNames: [ /([\w0-9]*)\.(startsWith)[\s]*\(/g ],
        errorMsg: "[%funcName%] is not a supported string method in a IE/ES5 environment, use strStartsWith().",
        ignoreFuncMatch: [
            "this.startsWith",
            "_this.startsWith",
            "self.startsWith",
            "_self.startsWith"
        ]
    },
    {
        funcNames: [ /([\w0-9]*)\.(endsWith)[\s]*\(/g ],
        errorMsg: "[%funcName%] is not a supported string method in a IE/ES5 environment, use strEndsWith().",
        ignoreFuncMatch: [
            "this.endsWith",
            "_this.endsWith",
            "self.endsWith",
            "_self.endsWith"
        ]
    },
    {
        funcNames: [ /([\w0-9]*)\.(find|findIndex|findLast|findLastIndex)[\s]*\(/g ],
        errorMsg: "[%funcName%] is not supported array method in a IE/ES5 environment, use a helper function or add explicit check for existence.",
        ignoreFuncMatch: [
            "_this.find",
            "this.find",
            "_self.find",
            "self.find",
            "_this.findIndex",
            "this.findIndex",
            "_self.findIndex",
            "self.findIndex",
            "_this.findLast",
            "this.findLast",
            "_self.findLast",
            "self.findLast",
            "_this.findLastIndex",
            "this.findLastIndex",
            "_self.findLastIndex",
            "self.findLastIndex"
        ]
    },
    {
        funcNames: [ /[^\w\"\']Date\.(now)\(/g ],
        errorMsg: "[%funcName%] is not supported Date method in a IE/ES5 environment, use a helper function or add explicit check for existence"
    },
    {
        funcNames: [ /[^\w\"\']new\s+Promise[\s]*\(/g ],
        errorMsg: "[%funcName%] is not supported in all IE/ES5 environments, use a helper function or add explicit check for existence",
        ignoreIds: [
            "ms.localstorage-",
            "ms.localstorage.",
            "ms.sigs-",
            "ms.sigs.",
            "promise\\nativePromise.js",
            "promise/nativePromise.js"
        ]
    },
    {
        funcNames: [ /[^\w\"\']Promise\.(all|race|reject|resolve|allSettled|reject)[\s]*\(/g ],
        errorMsg: "[%funcName%] is not supported in all IE/ES5 environments, use a helper function or add explicit check for existence"
    },
    {
        funcNames: [ /[^\w\"\'](await)\b/g ],
        errorMsg: "[%funcName%] is not supported in all IE/ES5 environments, use a helper function or add explicit check for existence",
        ignoreFuncMatch: [
            "/await",
            "\\await"
        ]
    },
    {
        funcNames: [ /[^\w\"\'](async)\s+[\w]+/g ],
        errorMsg: "[%funcName%] is not supported in all IE/ES5 environments, use a helper function or add explicit check for existence",
        ignoreFuncMatch: [
            "/async",
            "\\async"
        ]
    },
    {
        funcNames: [ /[^\w\"\']Symbol\s*\(/g ],
        errorMsg: "[%funcName%] is not supported in all IE/ES5 environments, use a helper function or add explicit check for existence"
    },
    {
        funcNames: [ /[^\w\"\'](Symbol\.\w+)/g ],
        errorMsg: "[%funcName%] is not supported in all IE/ES5 environments, use a helper function or add explicit check for existence"
    }
];

