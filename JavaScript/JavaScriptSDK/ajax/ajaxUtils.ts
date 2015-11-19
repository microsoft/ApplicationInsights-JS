/// <reference path="../logging.ts" />
/// <reference path="../util.ts" />

module Microsoft.ApplicationInsights {
    "use strict";

    export class constants {
        public static attachEvent = "attachEvent";
        public static de = "detachEvent";
        public static ad = "addEventListener";
        public static re = "removeEventListener";
        public static udf = "undefined";
    };

    export class extensions {
        public static IsNullOrUndefined(obj) {
            return typeof (obj) === constants.udf || obj === null;
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
        public static Now = function () {
            return new Date().getTime();
        }

        ///<summary>Gets duration between two timestamps</summary>
        public static GetDuration = function (start, end) {
            var result = null;
            if (start !== 0 && end !== 0 && !extensions.IsNullOrUndefined(start) && !extensions.IsNullOrUndefined(end)) {
                result = end - start;
            }

            return result;
        }
    }

    export class commands {

        /// <summary>
        /// Wrappes function call in try..catch block and trace exception in case it occurs
        /// <param name="functionName">The name of the function which is wrapped</param>
        /// <param name="funcPointer">Pointer to the function which needs to be wrappped</param>
        /// <param name="params">Array of parameters that will be traced in case exception happends in the function</param>
        /// </summary>
        public static TryCatchTraceWrapper(functionName, funcPointer, params) {
            try {
                return funcPointer.call(this);
            }
            catch (ex) {
                _InternalLogging.throwInternalNonUserActionable(
                    LoggingSeverity.CRITICAL,
                    "Failed calling callback '" + functionName + "': "
                    + Microsoft.ApplicationInsights.Util.dump(ex));
            }
        }

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
                    commands.TryCatchTraceWrapper(
                        "attachEvent",
                        function () {
                            obj.attachEvent("on" + eventNameWithoutOn, handlerRef);
                            result = true;
                        },
                        [obj, eventNameWithoutOn, constants.attachEvent]);
                }
                else {
                    if (!extensions.IsNullOrUndefined(obj.addEventListener)) {

                        // all browsers except IE before version 9
                        commands.TryCatchTraceWrapper(
                            "addEventListener",
                            function () {
                                obj.addEventListener(eventNameWithoutOn, handlerRef, false);
                                result = true;
                            },
                            [obj, eventNameWithoutOn, constants.ad]);
                    }
                }
            }

            return result;
        }

        public static DetachEvent(obj, eventNameWithoutOn, handlerRef) {
            if (!extensions.IsNullOrUndefined(obj)) {
                if (!extensions.IsNullOrUndefined(obj.detachEvent)) {
                    commands.TryCatchTraceWrapper(
                        "detachEvent",
                        function () {
                            obj.detachEvent("on" + eventNameWithoutOn, handlerRef);
                        },
                        [obj.toString(), eventNameWithoutOn, constants.de]);
                }
                else {
                    if (!extensions.IsNullOrUndefined(obj.removeEventListener)) {
                        commands.TryCatchTraceWrapper(
                            "removeEventListener",
                            function () {
                                obj.removeEventListener(eventNameWithoutOn, handlerRef, false);
                            },
                            [obj.toString(), eventNameWithoutOn, constants.re]);
                    }
                }
            }
        }
    }
}