// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { IDiagnosticLogger } from "../JavaScriptSDK.Interfaces/IDiagnosticLogger";
import { ICookieMgr, ICookieMgrConfig } from "../JavaScriptSDK.Interfaces/ICookieMgr";
import { _eInternalMessageId, eLoggingSeverity } from "../JavaScriptSDK.Enums/LoggingEnums";
import { dumpObj, getDocument, getLocation, getNavigator, isIE } from "./EnvUtils";
import {
    arrForEach, dateNow, getExceptionName, isFunction, isNotNullOrUndefined, isNullOrUndefined, isString, isTruthy, isUndefined,
    objForEachKey, setValue, strContains, strEndsWith, strTrim
} from "./HelperFuncs";
import { IConfiguration } from "../JavaScriptSDK.Interfaces/IConfiguration";
import { IAppInsightsCore } from "../JavaScriptSDK.Interfaces/IAppInsightsCore";
import { strEmpty } from "./InternalConstants";
import { _throwInternal } from "./DiagnosticLogger";

const strToGMTString = "toGMTString";
const strToUTCString = "toUTCString";
const strCookie = "cookie";
const strExpires = "expires";
const strEnabled = "enabled";
const strIsCookieUseDisabled = "isCookieUseDisabled";
const strDisableCookiesUsage = "disableCookiesUsage";
const strConfigCookieMgr = "_ckMgr";

let _supportsCookies: boolean = null;
let _allowUaSameSite: boolean = null;
let _parsedCookieValue: string = null;
let _doc = getDocument();
let _cookieCache = {};
let _globalCookieConfig = {};

/**
 * @ignore
 * DO NOT USE or export from the module, this is exposed as public to support backward compatibility of previous static utility methods only.
 * If you want to manager cookies either use the ICookieMgr available from the core instance via getCookieMgr() or create
 * your own instance of the CookieMgr and use that.
 * Using this directly for enabling / disabling cookie handling will not only affect your usage but EVERY user of cookies.
 * Example, if you are using a shared component that is also using Application Insights you will affect their cookie handling.
 * @param logger - The DiagnosticLogger to use for reporting errors.
 */
export function _gblCookieMgr(config?: IConfiguration, logger?: IDiagnosticLogger): ICookieMgr {
    // Stash the global instance against the BaseCookieMgr class
    let inst = createCookieMgr[strConfigCookieMgr] || _globalCookieConfig[strConfigCookieMgr];
    if (!inst) {
        // Note: not using the getSetValue() helper as that would require always creating a temporary cookieMgr
        // that ultimately is never used
        inst = createCookieMgr[strConfigCookieMgr] = createCookieMgr(config, logger);
        _globalCookieConfig[strConfigCookieMgr] = inst;
    }

    return inst;
}

function _isMgrEnabled(cookieMgr: ICookieMgr) {
    if (cookieMgr) {
        return cookieMgr.isEnabled();
    }

    return true;
}

function _createCookieMgrConfig(rootConfig: IConfiguration): ICookieMgrConfig {
    let cookieMgrCfg = rootConfig.cookieCfg = rootConfig.cookieCfg || {};

    // Sets the values from the root config if not already present on the cookieMgrCfg
    setValue(cookieMgrCfg, "domain", rootConfig.cookieDomain, isNotNullOrUndefined, isNullOrUndefined);
    setValue(cookieMgrCfg, "path", rootConfig.cookiePath || "/", null, isNullOrUndefined);
    if (isNullOrUndefined(cookieMgrCfg[strEnabled])) {
        // Set the enabled from the provided setting or the legacy root values
        let cookieEnabled: boolean;
        if (!isUndefined(rootConfig[strIsCookieUseDisabled])) {
            cookieEnabled = !rootConfig[strIsCookieUseDisabled];
        }
        if (!isUndefined(rootConfig[strDisableCookiesUsage])) {
            cookieEnabled = !rootConfig[strDisableCookiesUsage];
        }

        cookieMgrCfg[strEnabled] = cookieEnabled;
    }

    return cookieMgrCfg;
}

/**
 * Helper to return the ICookieMgr from the core (if not null/undefined) or a default implementation
 * associated with the configuration or a legacy default.
 * @param core
 * @param config
 * @returns
 */
export function safeGetCookieMgr(core: IAppInsightsCore, config?: IConfiguration) {
    let cookieMgr: ICookieMgr;
    if (core) {
        // Always returns an instance
        cookieMgr = core.getCookieMgr();
    } else if (config) {
        let cookieCfg = config.cookieCfg;
        if (cookieCfg[strConfigCookieMgr]) {
            cookieMgr = cookieCfg[strConfigCookieMgr];
        } else {
            cookieMgr = createCookieMgr(config);
        }
    }

    if (!cookieMgr) {
        // Get or initialize the default global (legacy) cookie manager if we couldn't find one
        cookieMgr = _gblCookieMgr(config, (core || {} as any).logger);
    }

    return cookieMgr;
}

export function createCookieMgr(rootConfig?: IConfiguration, logger?: IDiagnosticLogger): ICookieMgr {
    let cookieMgrConfig = _createCookieMgrConfig(rootConfig || _globalCookieConfig);

    let _path = cookieMgrConfig.path || "/";
    let _domain = cookieMgrConfig.domain;
    // Explicitly checking against false, so that setting to undefined will === true
    let _enabled = cookieMgrConfig[strEnabled] !== false;

    let cookieMgr: ICookieMgr = {
        isEnabled: () => {
            let enabled = _enabled && areCookiesSupported(logger);
            // Using an indirect lookup for any global cookie manager to support tree shaking for SDK's
            // that don't use the "applicationinsights-core" version of the default cookie function
            let gblManager = _globalCookieConfig[strConfigCookieMgr];
            if (enabled && gblManager && cookieMgr !== gblManager) {
                // Make sure the GlobalCookie Manager instance (if not this instance) is also enabled.
                // As the global (deprecated) functions may have been called (for backward compatibility)
                enabled = _isMgrEnabled(gblManager);
            }

            return enabled;
        },
        setEnabled: (value: boolean) => {
            // Explicitly checking against false, so that setting to undefined will === true
            _enabled = value !== false;
        },
        set: (name: string, value: string, maxAgeSec?: number, domain?: string, path?: string) => {
            let result = false;
            if (_isMgrEnabled(cookieMgr)) {
                let values: any = {};
                let theValue = strTrim(value || strEmpty);
                let idx = theValue.indexOf(";");
                if (idx !== -1) {
                    theValue = strTrim(value.substring(0, idx));
                    values = _extractParts(value.substring(idx + 1));
                }

                // Only update domain if not already present (isUndefined) and the value is truthy (not null, undefined or empty string)
                setValue(values, "domain",  domain || _domain, isTruthy, isUndefined);
            
                if (!isNullOrUndefined(maxAgeSec)) {
                    const _isIE = isIE();
                    if (isUndefined(values[strExpires])) {
                        const nowMs = dateNow();
                        // Only add expires if not already present
                        let expireMs = nowMs + (maxAgeSec * 1000);
            
                        // Sanity check, if zero or -ve then ignore
                        if (expireMs > 0) {
                            let expiry = new Date();
                            expiry.setTime(expireMs);
                            setValue(values, strExpires,
                                _formatDate(expiry, !_isIE ? strToUTCString : strToGMTString) || _formatDate(expiry, _isIE ? strToGMTString : strToUTCString) || strEmpty,
                                isTruthy);
                        }
                    }
            
                    if (!_isIE) {
                        // Only replace if not already present
                        setValue(values, "max-age", strEmpty + maxAgeSec, null, isUndefined);
                    }
                }
            
                let location = getLocation();
                if (location && location.protocol === "https:") {
                    setValue(values, "secure", null, null, isUndefined);

                    // Only set same site if not also secure
                    if (_allowUaSameSite === null) {
                        _allowUaSameSite = !uaDisallowsSameSiteNone((getNavigator() || {} as Navigator).userAgent);
                    }

                    if (_allowUaSameSite) {
                        setValue(values, "SameSite", "None", null, isUndefined);
                    }
                }
            
                setValue(values, "path", path || _path, null, isUndefined);
            
                let setCookieFn = cookieMgrConfig.setCookie || _setCookieValue;
                setCookieFn(name, _formatCookieValue(theValue, values));
                result = true;
            }

            return result;
        },
        get: (name: string): string => {
            let value = strEmpty
            if (_isMgrEnabled(cookieMgr)) {
                value = (cookieMgrConfig.getCookie || _getCookieValue)(name);
            }

            return value;
        },
        del: (name: string, path?: string) => {
            let result = false;
            if (_isMgrEnabled(cookieMgr)) {
                // Only remove the cookie if the manager and cookie support has not been disabled
                result = cookieMgr.purge(name, path);
            }

            return result;
        },
        purge: (name: string, path?: string) => {
            let result = false;
            if (areCookiesSupported(logger)) {
                // Setting the expiration date in the past immediately removes the cookie
                let values = {
                    ["path"]: path ? path : "/",
                    [strExpires]: "Thu, 01 Jan 1970 00:00:01 GMT"
                }

                if (!isIE()) {
                    // Set max age to expire now
                    values["max-age"] = "0"
                }

                let delCookie = cookieMgrConfig.delCookie || _setCookieValue;
                delCookie(name, _formatCookieValue(strEmpty, values));
                result = true;
            }

            return result;
        }
    };

    // Associated this cookie manager with the config
    cookieMgr[strConfigCookieMgr] = cookieMgr;
    
    return cookieMgr
}

/*
* Helper method to tell if document.cookie object is supported by the runtime
*/
export function areCookiesSupported(logger?: IDiagnosticLogger): any {
    if (_supportsCookies === null) {
        _supportsCookies = false;

        try {
            let doc = _doc || {} as Document;
            _supportsCookies = doc[strCookie] !== undefined;
        } catch (e) {
            _throwInternal(
                logger,
                eLoggingSeverity.WARNING,
                _eInternalMessageId.CannotAccessCookie,
                "Cannot access document.cookie - " + getExceptionName(e),
                { exception: dumpObj(e) });
        }
    }

    return _supportsCookies;
}

function _extractParts(theValue: string) {
    let values: { [key: string]: string } = {};
    if (theValue && theValue.length) {
        let parts = strTrim(theValue).split(";");
        arrForEach(parts, (thePart) => {
            thePart = strTrim(thePart || strEmpty);
            if (thePart) {
                let idx = thePart.indexOf("=");
                if (idx === -1) {
                    values[thePart] = null;
                } else {
                    values[strTrim(thePart.substring(0, idx))] = strTrim(thePart.substring(idx + 1));
                }
            }
        });
    }

    return values;
}

function _formatDate(theDate: Date, func: string) {
    if (isFunction(theDate[func])) {
        return theDate[func]();
    }
    
    return null;
}

function _formatCookieValue(value: string, values: any) {
    let cookieValue = value || strEmpty;
    objForEachKey(values, (name, theValue) => {
        cookieValue += "; " + name + (!isNullOrUndefined(theValue) ? "=" + theValue : strEmpty);
    });

    return cookieValue;
}

function _getCookieValue(name: string) {
    let cookieValue = strEmpty;
    if (_doc) {
        let theCookie = _doc[strCookie] || strEmpty;
        if (_parsedCookieValue !== theCookie) {
            _cookieCache = _extractParts(theCookie);
            _parsedCookieValue = theCookie;
        }

        cookieValue = strTrim(_cookieCache[name] || strEmpty);
    }

    return cookieValue;
}

function _setCookieValue(name: string, cookieValue: string) {
    if (_doc) {
        _doc[strCookie] = name + "=" + cookieValue;
    }
}

export function uaDisallowsSameSiteNone(userAgent: string) {
    if (!isString(userAgent)) {
        return false;
    }

    // Cover all iOS based browsers here. This includes:
    // - Safari on iOS 12 for iPhone, iPod Touch, iPad
    // - WkWebview on iOS 12 for iPhone, iPod Touch, iPad
    // - Chrome on iOS 12 for iPhone, iPod Touch, iPad
    // All of which are broken by SameSite=None, because they use the iOS networking stack
    if (strContains(userAgent, "CPU iPhone OS 12") || strContains(userAgent, "iPad; CPU OS 12")) {
        return true;
    }

    // Cover Mac OS X based browsers that use the Mac OS networking stack. This includes:
    // - Safari on Mac OS X
    // This does not include:
    // - Internal browser on Mac OS X
    // - Chrome on Mac OS X
    // - Chromium on Mac OS X
    // Because they do not use the Mac OS networking stack.
    if (strContains(userAgent, "Macintosh; Intel Mac OS X 10_14") && strContains(userAgent, "Version/") && strContains(userAgent, "Safari")) {
        return true;
    }

    // Cover Mac OS X internal browsers that use the Mac OS networking stack. This includes:
    // - Internal browser on Mac OS X
    // This does not include:
    // - Safari on Mac OS X
    // - Chrome on Mac OS X
    // - Chromium on Mac OS X
    // Because they do not use the Mac OS networking stack.
    if (strContains(userAgent, "Macintosh; Intel Mac OS X 10_14") && strEndsWith(userAgent, "AppleWebKit/605.1.15 (KHTML, like Gecko)")) {
        return true;
    }

    // Cover Chrome 50-69, because some versions are broken by SameSite=None, and none in this range require it.
    // Note: this covers some pre-Chromium Edge versions, but pre-Chromim Edge does not require SameSite=None, so this is fine.
    // Note: this regex applies to Windows, Mac OS X, and Linux, deliberately.
    if (strContains(userAgent, "Chrome/5") || strContains(userAgent, "Chrome/6")) {
        return true;
    }

    // Unreal Engine runs Chromium 59, but does not advertise as Chrome until 4.23. Treat versions of Unreal
    // that don't specify their Chrome version as lacking support for SameSite=None.
    if (strContains(userAgent, "UnrealEngine") && !strContains(userAgent, "Chrome")) {
        return true;
    }

    // UCBrowser < 12.13.2 ignores Set-Cookie headers with SameSite=None
    // NB: this rule isn't complete - you need regex to make a complete rule.
    // See: https://www.chromium.org/updates/same-site/incompatible-clients
    if (strContains(userAgent, "UCBrowser/12") || strContains(userAgent, "UCBrowser/11")) {
        return true;
    }

    return false;
}
