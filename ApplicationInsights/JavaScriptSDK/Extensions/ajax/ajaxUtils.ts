import { Util } from 'applicationinsights-common';

export class stringUtils {
    public static GetLength(strObject) {
        var res = 0;
        if (!Util.IsNullOrUndefined(strObject)) {
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

export class EventHelper {
    ///<summary>Binds the specified function to an event, so that the function gets called whenever the event fires on the object</summary>
    ///<param name="obj">Object to which </param>
    ///<param name="eventNameWithoutOn">String that specifies any of the standard DHTML Events without "on" prefix</param>
    ///<param name="handlerRef">Pointer that specifies the function to call when event fires</param>
    ///<returns>True if the function was bound successfully to the event, otherwise false</returns>
    public static AttachEvent(obj, eventNameWithoutOn, handlerRef) {
        var result = false;
        if (!Util.IsNullOrUndefined(obj)) {
            if (!Util.IsNullOrUndefined(obj.attachEvent)) {
                // IE before version 9                    
                obj.attachEvent("on" + eventNameWithoutOn, handlerRef);
                result = true;
            }
            else {
                if (!Util.IsNullOrUndefined(obj.addEventListener)) {
                    // all browsers except IE before version 9
                    obj.addEventListener(eventNameWithoutOn, handlerRef, false);
                    result = true;
                }
            }
        }

        return result;
    }

    public static DetachEvent(obj, eventNameWithoutOn, handlerRef) {
        if (!Util.IsNullOrUndefined(obj)) {
            if (!Util.IsNullOrUndefined(obj.detachEvent)) {
                obj.detachEvent("on" + eventNameWithoutOn, handlerRef);
            }
            else {
                if (!Util.IsNullOrUndefined(obj.removeEventListener)) {
                    obj.removeEventListener(eventNameWithoutOn, handlerRef, false);
                }
            }
        }
    }
}