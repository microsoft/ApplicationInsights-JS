// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { CoreUtils } from '@microsoft/applicationinsights-core-js';

export class stringUtils {
    public static GetLength(strObject) {
        let res = 0;
        if (!CoreUtils.isNullOrUndefined(strObject)) {
            let stringified = "";
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
    /// <summary>Binds the specified function to an event, so that the function gets called whenever the event fires on the object</summary>
    /// <param name="obj">Object to which </param>
    /// <param name="eventNameWithoutOn">String that specifies any of the standard DHTML Events without "on" prefix</param>
    /// <param name="handlerRef">Pointer that specifies the function to call when event fires</param>
    /// <returns>True if the function was bound successfully to the event, otherwise false</returns>
    public static AttachEvent(obj, eventNameWithoutOn, handlerRef) {
        let result = false;
        if (!CoreUtils.isNullOrUndefined(obj)) {
            if (!CoreUtils.isNullOrUndefined(obj.attachEvent)) {
                // IE before version 9                    
                obj.attachEvent("on" + eventNameWithoutOn, handlerRef);
                result = true;
            }
            else {
                if (!CoreUtils.isNullOrUndefined(obj.addEventListener)) {
                    // all browsers except IE before version 9
                    obj.addEventListener(eventNameWithoutOn, handlerRef, false);
                    result = true;
                }
            }
        }

        return result;
    }

    public static DetachEvent(obj, eventNameWithoutOn, handlerRef) {
        if (!CoreUtils.isNullOrUndefined(obj)) {
            if (!CoreUtils.isNullOrUndefined(obj.detachEvent)) {
                obj.detachEvent("on" + eventNameWithoutOn, handlerRef);
            }
            else {
                if (!CoreUtils.isNullOrUndefined(obj.removeEventListener)) {
                    obj.removeEventListener(eventNameWithoutOn, handlerRef, false);
                }
            }
        }
    }
}