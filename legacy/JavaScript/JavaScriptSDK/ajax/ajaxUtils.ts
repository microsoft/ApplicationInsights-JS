// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/// <reference path="../Logging.ts" />
/// <reference path="../Util.ts" />

module Microsoft.ApplicationInsights {
    "use strict";

    export class extensions {
        public static IsNullOrUndefined(obj) {
            return typeof (obj) === "undefined" || obj === null;
        }
    }

    export class stringUtils {
        public static GetLength(strObject) {
            var res = 0;
            if (!extensions.IsNullOrUndefined(strObject)) {
                var stringified = "";
                try {
                    stringified = strObject.toString();
                } catch (ex) {
                    // some troubles with complex object
                }

                res = stringified.length;
                res = isNaN(res) ? 0 : res;
            }

            return res;
        }
    }

    export class dateTime {
        ///<summary>Return the number of milliseconds since 1970/01/01 in local timezon</summary>
        public static Now = (window.performance && window.performance.now && window.performance.timing) ?
            function () {
                return window.performance.now() + window.performance.timing.navigationStart;
            }
            :
            function () {
                return new Date().getTime();
            }

        ///<summary>Gets duration between two timestamps</summary>
        public static GetDuration = function (start: number, end: number): number {
            var result = null;
            if (start !== 0 && end !== 0 && !extensions.IsNullOrUndefined(start) && !extensions.IsNullOrUndefined(end)) {
                result = end - start;
            }

            return result;
        }
    }

    export class EventHelper {
        ///<summary>Binds the specified function to an event, so that the function gets called whenever the event fires on the object</summary>
        ///<param name="obj">Object to which </param>
        ///<param name="eventNameWithoutOn">String that specifies any of the standard DHTML Events without "on" prefix</param>
        ///<param name="handlerRef">Pointer that specifies the function to call when event fires</param>
        ///<returns>True if the function was bound successfully to the event, otherwise false</returns>
        public static AttachEvent(obj, eventNameWithoutOn, handlerRef) {
            var result = false;
            if (!extensions.IsNullOrUndefined(obj)) {
                if (!extensions.IsNullOrUndefined(obj.attachEvent)) {
                    // IE before version 9                    
                    obj.attachEvent("on" + eventNameWithoutOn, handlerRef);
                    result = true;
                }
                else {
                    if (!extensions.IsNullOrUndefined(obj.addEventListener)) {
                        // all browsers except IE before version 9
                        obj.addEventListener(eventNameWithoutOn, handlerRef, false);
                        result = true;
                    }
                }
            }

            return result;
        }

        public static DetachEvent(obj, eventNameWithoutOn, handlerRef) {
            if (!extensions.IsNullOrUndefined(obj)) {
                if (!extensions.IsNullOrUndefined(obj.detachEvent)) {
                    obj.detachEvent("on" + eventNameWithoutOn, handlerRef);
                }
                else {
                    if (!extensions.IsNullOrUndefined(obj.removeEventListener)) {
                        obj.removeEventListener(eventNameWithoutOn, handlerRef, false);
                    }
                }
            }
        }
    }

    export class AjaxHelper {
        public static ParseDependencyPath(absoluteUrl: string, method: string, pathName: string) {
            var target, name;                
            if (absoluteUrl && absoluteUrl.length > 0) {
                var parsedUrl: HTMLAnchorElement = UrlHelper.parseUrl(absoluteUrl)
                target = parsedUrl.host;
                if (parsedUrl.pathname != null) {
                    var pathName: string = (parsedUrl.pathname.length === 0) ? "/" : parsedUrl.pathname;
                    if (pathName.charAt(0) !== '/') {
                        pathName = "/" + pathName;
                    }

                    name = Telemetry.Common.DataSanitizer.sanitizeString(method ? method + " " + pathName : pathName);
                } else {
                    name = Telemetry.Common.DataSanitizer.sanitizeString(absoluteUrl);
                }
            } else {
                target = pathName;
                name = pathName;
            }

            return {
                target: target, 
                name: name
            };
        }
    }
}