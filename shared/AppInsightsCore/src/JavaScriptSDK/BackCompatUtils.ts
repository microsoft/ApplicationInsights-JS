// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict";
import { arrForEach, arrIndexOf, isBoolean, objDefineAccessors } from "./HelperFuncs";
import { ICookieMgr } from "../JavaScriptSDK.Interfaces/ICookieMgr";
import { CoreUtils } from "./CoreUtils";

let _cookieMgrs: ICookieMgr[] = null;
let _canUseCookies: boolean;    // legacy supported config

/**
 * @ignore
 * Internal function to provide backward compatibility for support usage of CoreUtils._canUseCookies property
 * it should not be exported out of the module (applicationinsights-core)
 */
 export function _listenCoreUtilsCanUseCookies(cookieMgr: ICookieMgr) {
    let legacyCanUseCookies = (CoreUtils as any)._canUseCookies;

    if (_cookieMgrs === null) {
        _cookieMgrs = [];
        _canUseCookies = legacyCanUseCookies;

        // Dynamically create get/set property accessors for backward compatibility for enabling / disabling cookies
        // this WILL NOT work for ES3 browsers (< IE8)
        objDefineAccessors<boolean>(CoreUtils, "_canUseCookies", 
            () => {
                return _canUseCookies;
            }, 
            (value) => {
                _canUseCookies = value;
                arrForEach(_cookieMgrs, (mgr) => {
                    mgr.setEnabled(value);
                });
            });   
    }

    if (arrIndexOf(_cookieMgrs, cookieMgr) === -1) {
        _cookieMgrs.push(cookieMgr);
    }

    if (isBoolean(legacyCanUseCookies)) {
        cookieMgr.setEnabled(legacyCanUseCookies);
    }

    if (isBoolean(_canUseCookies)) {
        cookieMgr.setEnabled(_canUseCookies);
    }
}
