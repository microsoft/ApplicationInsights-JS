# Tree-Shaking Enhancements / Recommendations

As part of changes introduced in version 2.6.0 we are deprecating and removing the *internal* usages of the static helper classes `CoreUtils`, `EventHelper`, `Util`, `UrlHelper`, `DateTimeUtils` and `ConnectionStringParser` to provide better support for tree-shaking algorithms so that unused code can be safely dropped when using NPM packages.

As part of these changes we are now exporting the functions as top level root (direct) from the modules so that you can simply refactor your code to achieve better tree-shaking.

To further assist with some tree-shakers, we have also changed these from static classes to const objects that reference the new exported functions (*mostly*). Future changes are required to continue refactoring out further the references below that have no currently available replacement or are not listed.

**Why?**

Simplistically, any reference to any property or function that was defined in these static classes would require that ALL of the properties and functions must be included in the resulting code as this code becomes unshakable (using static analysis).

> Note: While we have tagged the classes as deprecated, they will continue to be exported and we are not currently planning on removing them from the current packages that they are exported from.

## Deprecated functions and replacements

| Existing | Replacement |
|----------|-------------|
| **CoreUtils** | **@microsoft/applicationinsights-core-js** |
| CoreUtils._canUseCookies | None - Do not use as this will cause all of CoreUtils reference to be included in your final code.<br> Refactor your cookie handling to use the `appInsights.getCookieMgr().setEnabled(true/false)` to set the value and `appInsights.getCookieMgr().isEnabled()` to check the value. |
| CoreUtils.isTypeof | isTypeof |
| CoreUtils.isUndefined | isUndefined |
| CoreUtils.isNullOrUndefined | isNullOrUndefined |
| CoreUtils.hasOwnProperty | hasOwnProperty |
| CoreUtils.isFunction | isFunction |
| CoreUtils.isObject | isObject |
| CoreUtils.isDate | isDate |
| CoreUtils.isArray | isArray |
| CoreUtils.isError | isError |
| CoreUtils.isString | isString |
| CoreUtils.isNumber | isNumber |
| CoreUtils.isBoolean | isBoolean |
| CoreUtils.toISOString | toISOString or getISOString |
| CoreUtils.arrForEach | arrForEach |
| CoreUtils.arrIndexOf | arrIndexOf |
| CoreUtils.arrMap | arrMap |
| CoreUtils.arrReduce | arrReduce |
| CoreUtils.strTrim | strTrim |
| CoreUtils.objCreate | objCreateFn |
| CoreUtils.objKeys | objKeys |
| CoreUtils.objDefineAccessors | objDefineAccessors |
| CoreUtils.addEventHandler | addEventHandler |
| CoreUtils.dateNow | dateNow |
| CoreUtils.isIE | isIE |
| CoreUtils.disableCookies | disableCookies<br>Referencing either will cause CoreUtils to be referenced for backward compatibility.<br> Refactor your cookie handling to use the `appInsights.getCookieMgr().setEnabled(false)` |
| CoreUtils.newGuid | newGuid |
| CoreUtils.perfNow | perfNow |
| CoreUtils.newId | newId |
| CoreUtils.randomValue | randomValue |
| CoreUtils.random32 | random32 |
| CoreUtils.mwcRandomSeed | mwcRandomSeed |
| CoreUtils.mwcRandom32 | mwcRandom32 |
| CoreUtils.generateW3CId | generateW3CId |
| **EventHelper** | **@microsoft/applicationinsights-core-js** |
| EventHelper.Attach | attachEvent |
| EventHelper.AttachEvent | attachEvent |
| EventHelper.Detach | detachEvent |
| EventHelper.DetachEvent |  detachEvent |
| **Util** | **@microsoft/applicationinsights-common-js** |
| Util.NotSpecified | strNotSpecified |
| Util.createDomEvent | createDomEvent |
| Util.disableStorage | utlDisableStorage |
| Util.isInternalApplicationInsightsEndpoint | isInternalApplicationInsightsEndpoint |
| Util.canUseLocalStorage | utlCanUseLocalStorage |
| Util.getStorage | utlGetLocalStorage |
| Util.setStorage | utlSetLocalStorage |
| Util.removeStorage | utlRemoveStorage |
| Util.canUseSessionStorage | utlCanUseSessionStorage |
| Util.getSessionStorageKeys | utlGetSessionStorageKeys |
| Util.getSessionStorage | utlGetSessionStorage |
| Util.setSessionStorage | utlSetSessionStorage |
| Util.removeSessionStorage | utlRemoveSessionStorage |
| Util.disableCookies | disableCookies<br>Referencing either will cause CoreUtils to be referenced for backward compatibility.<br> Refactor your cookie handling to use the `appInsights.getCookieMgr().setEnabled(false)` |
| Util.canUseCookies | canUseCookies<br>Referencing either will cause CoreUtils to be referenced for backward compatibility.<br>Refactor your cookie handling to use the `appInsights.getCookieMgr().isEnabled()` |
| Util.disallowsSameSiteNone | uaDisallowsSameSiteNone |
| Util.setCookie | coreSetCookie<br>Referencing will cause CoreUtils to be referenced for backward compatibility.<br>Refactor your cookie handling to use the `appInsights.getCookieMgr().set(name: string, value: string)` |
| Util.stringToBoolOrDefault | stringToBoolOrDefault |
| Util.getCookie | coreGetCookie<br>Referencing will cause CoreUtils to be referenced for backward compatibility.<br>Refactor your cookie handling to use the `appInsights.getCookieMgr().get(name: string)` |
| Util.deleteCookie | coreDeleteCookie<br>Referencing will cause CoreUtils to be referenced for backward compatibility.<br>Refactor your cookie handling to use the `appInsights.getCookieMgr().del(name: string, path?: string)` |
| Util.trim | strTrim |
| Util.newId | newId |
| Util.random32 | ---<br>No replacement, refactor your code to use the core random32(true) |
| Util.generateW3CId | generateW3CId |
| Util.isArray | isArray |
| Util.isError | isError |
| Util.isDate | isDate |
| Util.toISOStringForIE8 | toISOString |
| Util.getIEVersion | getIEVersion |
| Util.msToTimeSpan | msToTimeSpan |
| Util.isCrossOriginError | isCrossOriginError |
| Util.dump | dumpObj |
| Util.getExceptionName | getExceptionName |
| Util.addEventHandler | attachEvent |
| Util.IsBeaconApiSupported | isBeaconApiSupported |
| Util.getExtension | getExtensionByName
| **UrlHelper** | **@microsoft/applicationinsights-common-js** |
| UrlHelper.parseUrl | urlParseUrl |
| UrlHelper.getAbsoluteUrl | urlGetAbsoluteUrl |
| UrlHelper.getPathName | urlGetPathName |
| UrlHelper.getCompeteUrl | urlGetCompleteUrl |
| UrlHelper.parseHost | urlParseHost |
| UrlHelper.parseFullHost | urlParseFullHost
| **DateTimeUtils** | **@microsoft/applicationinsights-common-js** |
| DateTimeUtils.Now | dateTimeUtilsNow |
| DateTimeUtils.GetDuration | dateTimeUtilsDuration |
| **ConnectionStringParser** | **@microsoft/applicationinsights-common-js** |
| ConnectionStringParser.parse | parseConnectionString |
