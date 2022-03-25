// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { createElmNodeData, createUniqueNamespace } from "./DataCacheHelper";
import { getDocument, getWindow } from "./EnvUtils";
import { arrForEach, arrIndexOf, isArray, objForEachKey, objKeys } from "./HelperFuncs";

// Added to help with minfication
const strOnPrefix = "on";
const strAttachEvent = "attachEvent";
const strAddEventHelper = "addEventListener";
const strDetachEvent = "detachEvent";
const strRemoveEventListener = "removeEventListener";
const strEvents = "events"
const strVisibilityChangeEvt: string = "visibilitychange";
const strPageHide: string = "pagehide";
const strPageShow: string = "pageshow";
const strUnload: string = "unload";
const strBeforeUnload: string = "beforeunload";

const strPageHideNamespace = createUniqueNamespace("aiEvtPageHide");
const strPageShowNamespace = createUniqueNamespace("aiEvtPageShow");

const rRemoveEmptyNs = /\.[\.]+/g;
const rRemoveTrailingEmptyNs = /[\.]+$/;

let _guid = 1;

interface IEventDetails {
    type: string,
    ns: string
}

interface IRegisteredEvent {
    guid: number;
    evtName: IEventDetails;
    handler: any,
    capture: boolean
}

interface IAiEvents {
    [name: string]: IRegisteredEvent[]
}

const elmNodeData = createElmNodeData("events");
const eventNamespace = /^([^.]*)(?:\.(.+)|)/

function _normalizeNamespace(name: string) {
    if (name && name.replace) {
        return name.replace(/^\s*\.*|\.*\s*$/g, "");
    }

    return name;
}

function _getEvtNamespace(eventName: string | undefined, evtNamespace?: string | string[] | null): IEventDetails {
    if (evtNamespace) {
        let theNamespace: string = "";
        if (isArray(evtNamespace)) {
            theNamespace = "";
            arrForEach(evtNamespace, (name) => {
                name = _normalizeNamespace(name);
                if (name) {
                    if (name[0] !== ".") {
                        name = "." + name;
                    }

                    theNamespace += name;
                }
            });
        } else {
            theNamespace = _normalizeNamespace(evtNamespace);
        }

        if (theNamespace) {
            if (theNamespace[0] !== ".") {
                theNamespace = "." + theNamespace;
            }

            // We may only have the namespace and not an eventName
            eventName = (eventName || "") + theNamespace;
        }
    }

    let parsedEvent: any[] = (eventNamespace.exec(eventName || "") || []);

    return {
        type: parsedEvent[1],
        ns: ((parsedEvent[2] || "").replace(rRemoveEmptyNs, ".").replace(rRemoveTrailingEmptyNs, "").split(".").sort()).join(".")
    };
}


export interface _IRegisteredEvents {
    name: string;
    handler: any;
}

/**
 * Get all of the registered events on the target object, this is primarily used for testing cleanup but may also be used by
 * applications to remove their own events
 * @param target - The EventTarget that has registered events
 * @param eventName - [Optional] The name of the event to return the registered handlers and full name (with namespaces)
 * @param evtNamespace - [Optional] Additional namespace(s) to append to the event listeners so they can be uniquely identified and removed based on this namespace,
 * if the eventName also includes a namespace the namespace(s) are merged into a single namespace
 */
export function __getRegisteredEvents(target: any, eventName?: string, evtNamespace?: string | string[]): _IRegisteredEvents[] {
    let theEvents: _IRegisteredEvents[] = [];
    let eventCache = elmNodeData.get<IAiEvents>(target, strEvents, {}, false);
    let evtName = _getEvtNamespace(eventName, evtNamespace);

    objForEachKey(eventCache, (evtType, registeredEvents) => {
        arrForEach(registeredEvents, (value) => {
            if (!evtName.type || evtName.type === value.evtName.type) {
                if (!evtName.ns || evtName.ns === evtName.ns) {
                    theEvents.push({
                        name: value.evtName.type + (value.evtName.ns ? "." + value.evtName.ns : ""),
                        handler: value.handler
                    });
                }
            }
        });
    });
 
    return theEvents;
}

// Exported for internal unit testing only
function _getRegisteredEvents(target: any, evtName: string, addDefault: boolean = true): IRegisteredEvent[] {
    let aiEvts = elmNodeData.get<IAiEvents>(target, strEvents, {}, addDefault);
    let registeredEvents = aiEvts[evtName];
    if (!registeredEvents) {
        registeredEvents = aiEvts[evtName] = [];
    }

    return registeredEvents;
}

function _doDetach(obj: any, evtName: IEventDetails, handlerRef: any, useCapture: boolean) {
    if (obj && evtName && evtName.type) {
        if (obj[strRemoveEventListener]) {
            obj[strRemoveEventListener](evtName.type, handlerRef, useCapture);
        } else if (obj[strDetachEvent]) {
            obj[strDetachEvent](strOnPrefix + evtName.type, handlerRef);
        }
    }
}

function _doAttach(obj: any, evtName: IEventDetails, handlerRef: any, useCapture: boolean): boolean {
    let result = false;

    if (obj && evtName && evtName.type && handlerRef) {
        if (obj[strAddEventHelper]) {
            // all browsers except IE before version 9
            obj[strAddEventHelper](evtName.type, handlerRef, useCapture);
            result = true;
        } else if (obj[strAttachEvent]) {
            // IE before version 9
            obj[strAttachEvent](strOnPrefix + evtName.type, handlerRef);
            result = true;
        }
    }

    return result;
}

function _doUnregister(target: any, events: IRegisteredEvent[], evtName: IEventDetails, unRegFn: (regEvent: IRegisteredEvent) => boolean) {
    let idx = events.length;
    while(idx--) {
        let theEvent: IRegisteredEvent = events[idx];
        if (theEvent) {
            if (!evtName.ns || evtName.ns === theEvent.evtName.ns) {
                if (!unRegFn || unRegFn(theEvent)) {
                    _doDetach(target, theEvent.evtName, theEvent.handler, theEvent.capture);
                    // Remove the registered event
                    events.splice(idx, 1);
                }
            }
        }
    }
}

function _unregisterEvents(target: any, evtName: IEventDetails, unRegFn: (regEvent: IRegisteredEvent) => boolean) {
    if (evtName.type) {
        _doUnregister(target, _getRegisteredEvents(target, evtName.type), evtName, unRegFn);
    } else {
        let eventCache = elmNodeData.get<IAiEvents>(target, strEvents, {});
        objForEachKey(eventCache, (evtType, events) => {
            _doUnregister(target, events, evtName, unRegFn);
        });

        // Cleanup
        if (objKeys(eventCache).length === 0) {
            elmNodeData.kill(target, strEvents);
        }
    }
}

export function mergeEvtNamespace(theNamespace: string, namespaces?: string | string[] | null): string | string[] {
    let newNamespaces: string | string[];

    if (namespaces) {
        if (isArray(namespaces)) {
            newNamespaces = [theNamespace].concat(namespaces);
        } else {
            newNamespaces = [ theNamespace, namespaces ];
        }

        // resort the namespaces so they are always in order
        newNamespaces = (_getEvtNamespace("xx", newNamespaces).ns).split(".");
    } else {
        newNamespaces = theNamespace;
    }

    return newNamespaces;
}

/**
 * Binds the specified function to an event, so that the function gets called whenever the event fires on the object
 * @param obj Object to add the event too.
 * @param eventName String that specifies any of the standard DHTML Events without "on" prefix, if may also include an optional (dot "." prefixed)
 * namespaces "click" "click.mynamespace" in addition to specific namespaces.
 * @param handlerRef Pointer that specifies the function to call when event fires
 * @param evtNamespace - [Optional] Additional namespace(s) to append to the event listeners so they can be uniquely identified and removed based on this namespace,
 * if the eventName also includes a namespace the namespace(s) are merged into a single namespace
 * @param useCapture [Optional] Defaults to false
 * @returns True if the function was bound successfully to the event, otherwise false
 */
export function eventOn<T>(target: T, eventName: string, handlerRef: any, evtNamespace?: string | string[] | null, useCapture: boolean = false) {
    let result = false;

    if (target) {
        try {
            let evtName = _getEvtNamespace(eventName, evtNamespace);
            result = _doAttach(target, evtName, handlerRef, useCapture);
        
            if (result && elmNodeData.accept(target)) {
                let registeredEvent: IRegisteredEvent = {
                    guid: _guid++,
                    evtName: evtName,
                    handler: handlerRef,
                    capture: useCapture
                };
    
                _getRegisteredEvents(target, evtName.type).push(registeredEvent);
            }
        } catch (e) {
            // Just Ignore any error so that we don't break any execution path
        }
    }

    return result;
}

/**
 * Removes an event handler for the specified event
 * @param Object to remove the event from
 * @param eventName {string} - The name of the event, with optional namespaces or just the namespaces,
 * such as "click", "click.mynamespace" or ".mynamespace"
 * @param handlerRef {any} - The callback function that needs to be removed from the given event, when using a
 * namespace (with or without a qualifying event) this may be null to remove all previously attached event handlers
 * otherwise this will only remove events with this specific handler.
 * @param evtNamespace - [Optional] Additional namespace(s) to append to the event listeners so they can be uniquely identified and removed based on this namespace,
 * if the eventName also includes a namespace the namespace(s) are merged into a single namespace
 * @param useCapture [Optional] Defaults to false
 */
export function eventOff<T>(target: T, eventName: string, handlerRef: any, evtNamespace?: string | string[] | null, useCapture: boolean = false) {
    if (target) {
        try {
            let evtName = _getEvtNamespace(eventName, evtNamespace);
            let found = false;
            _unregisterEvents(target, evtName, (regEvent) => {
                if ((evtName.ns && !handlerRef) || regEvent.handler === handlerRef) {
                    found = true;
                    return true;
                }

                return false;
            });

            if (!found) {
                // fallback to try and remove as requested
                _doDetach(target, evtName, handlerRef, useCapture);
            }
        } catch (e) {
            // Just Ignore any error so that we don't break any execution path
        }
    }
}


/**
 * Binds the specified function to an event, so that the function gets called whenever the event fires on the object
 * @param obj Object to add the event too.
 * @param eventNameWithoutOn String that specifies any of the standard DHTML Events without "on" prefix and optional (dot "." prefixed) namespaces "click" "click.mynamespace".
 * @param handlerRef Pointer that specifies the function to call when event fires
 * @param useCapture [Optional] Defaults to false
 * @returns True if the function was bound successfully to the event, otherwise false
 */
export function attachEvent(obj: any, eventNameWithoutOn: string, handlerRef: any, useCapture: boolean = false) {
    return eventOn(obj, eventNameWithoutOn, handlerRef, null, useCapture);
}

/**
 * Removes an event handler for the specified event
 * @param Object to remove the event from
 * @param eventNameWithoutOn {string} - The name of the event, with optional namespaces or just the namespaces,
 * such as "click", "click.mynamespace" or ".mynamespace"
 * @param handlerRef {any} - The callback function that needs to be removed from the given event, when using a
 * namespace (with or without a qualifying event) this may be null to remove all previously attached event handlers
 * otherwise this will only remove events with this specific handler.
 * @param useCapture [Optional] Defaults to false
 */
export function detachEvent(obj: any, eventNameWithoutOn: string, handlerRef: any, useCapture: boolean = false) {
    eventOff(obj, eventNameWithoutOn, handlerRef, null, useCapture);
}

/**
 * Trys to add an event handler for the specified event to the window, body and document
 * @param eventName {string} - The name of the event
 * @param callback {any} - The callback function that needs to be executed for the given event
 * @param evtNamespace - [Optional] Namespace(s) to append to the event listeners so they can be uniquely identified and removed based on this namespace.
 * @return {boolean} - true if the handler was successfully added
 */
export function addEventHandler(eventName: string, callback: any, evtNamespace?: string | string[] | null): boolean {
    let result = false;
    let w = getWindow();
    if (w) {
        result = eventOn(w, eventName, callback, evtNamespace);
        result = eventOn(w["body"], eventName, callback, evtNamespace) || result;
    }

    let doc = getDocument();
    if (doc) {
        result = eventOn(doc, eventName, callback, evtNamespace) || result;
    }

    return result;
}

/**
 * Trys to remove event handler(s) for the specified event/namespace to the window, body and document
 * @param eventName {string} - The name of the event, with optional namespaces or just the namespaces,
 * such as "click", "click.mynamespace" or ".mynamespace"
 * @param callback {any} - - The callback function that needs to be removed from the given event, when using a
 * namespace (with or without a qualifying event) this may be null to remove all previously attached event handlers
 * otherwise this will only remove events with this specific handler.
 * @param evtNamespace - [Optional] Namespace(s) to append to the event listeners so they can be uniquely identified and removed based on this namespace.
 */
export function removeEventHandler(eventName: string, callback: any, evtNamespace?: string | string[] | null) {
    let w = getWindow();
    if (w) {
        eventOff(w, eventName, callback, evtNamespace);
        eventOff(w["body"], eventName, callback, evtNamespace);
    }

    let doc = getDocument();
    if (doc) {
        eventOff(doc, eventName, callback, evtNamespace);
    }
}

/**
 * Bind the listener to the array of events
 * @param events An string array of event names to bind the listener to
 * @param listener The event callback to call when the event is triggered
 * @param excludeEvents - [Optional] An array of events that should not be hooked (if possible), unless no other events can be.
 * @param evtNamespace - [Optional] Namespace(s) to append to the event listeners so they can be uniquely identified and removed based on this namespace.
 * @returns true - when at least one of the events was registered otherwise false
 */
function _addEventListeners(events: string[], listener: any, excludeEvents?: string[] | null, evtNamespace?: string | string[] | null): boolean {
    let added = false;

    if (listener && events && events.length > 0) {
        arrForEach(events, (name) => {
            if (name) {
                if (!excludeEvents || arrIndexOf(excludeEvents, name) === -1) {
                    added = addEventHandler(name, listener, evtNamespace) || added;
                }
            }
        });
    }

    return added;
}

/**
 * Bind the listener to the array of events
 * @param events An string array of event names to bind the listener to
 * @param listener The event callback to call when the event is triggered
 * @param excludeEvents - [Optional] An array of events that should not be hooked (if possible), unless no other events can be.
 * @param evtNamespace - [Optional] Namespace(s) to append to the event listeners so they can be uniquely identified and removed based on this namespace.
 * @returns true - when at least one of the events was registered otherwise false
 */
export function addEventListeners(events: string[], listener: any, excludeEvents?: string[], evtNamespace?: string | string[]): boolean {
    let added = false;

    if (listener && events && isArray(events)) {
        added = _addEventListeners(events, listener, excludeEvents, evtNamespace);

        if (!added && excludeEvents && excludeEvents.length > 0) {
            // Failed to add any listeners and we excluded some, so just attempt to add the excluded events
            added = _addEventListeners(events, listener, null, evtNamespace);
        }
    }

    return added;
}

/**
 * Remove the listener from the array of events
 * @param events An string array of event names to bind the listener to
 * @param listener The event callback to call when the event is triggered
 * @param evtNamespace - [Optional] Namespace(s) to append to the event listeners so they can be uniquely identified and removed based on this namespace.
 */
export function removeEventListeners(events: string[], listener: any, evtNamespace?: string | string[]) {
    if (events && isArray(events)) {
        arrForEach(events, (name) => {
            if (name) {
                removeEventHandler(name, listener, evtNamespace);
            }
        });
    }
}

/**
 * Listen to the 'beforeunload', 'unload' and 'pagehide' events which indicates a page unload is occurring,
 * this does NOT listen to the 'visibilitychange' event as while it does indicate that the page is being hidden
 * it does not *necessarily* mean that the page is being completely unloaded, it can mean that the user is
 * just navigating to a different Tab and may come back (without unloading the page). As such you may also
 * need to listen to the 'addPageHideEventListener' and 'addPageShowEventListener' events.
 * @param listener - The event callback to call when a page unload event is triggered
 * @param excludeEvents - [Optional] An array of events that should not be hooked, unless no other events can be.
 * @param evtNamespace - [Optional] Namespace(s) to append to the event listeners so they can be uniquely identified and removed based on this namespace.
 * @returns true - when at least one of the events was registered otherwise false
 */
export function addPageUnloadEventListener(listener: any, excludeEvents?: string[], evtNamespace?: string | string[]): boolean {
    // Hook the unload event for the document, window and body to ensure that the client events are flushed to the server
    // As just hooking the window does not always fire (on chrome) for page navigation's.
    return addEventListeners([strBeforeUnload, strUnload, strPageHide], listener, excludeEvents, evtNamespace);
}

/**
 * Remove any matching 'beforeunload', 'unload' and 'pagehide' events that may have been added via addEventListener,
 * addEventListeners, addPageUnloadEventListener or addPageHideEventListener.
 * @param listener - The specific event callback to to be removed
 * @param evtNamespace - [Optional] Namespace(s) uniquely identified and removed based on this namespace.
 * @returns true - when at least one of the events was registered otherwise false
 */
export function removePageUnloadEventListener(listener: any, evtNamespace?: string | string[]) {
    removeEventListeners([strBeforeUnload, strUnload, strPageHide], listener, evtNamespace);
}

/**
 * Listen to the pagehide and visibility changing to 'hidden' events, because the 'visibilitychange' uses
 * an internal proxy to detect the visibility state you SHOULD use a unique namespace when if you plan to call
 * removePageShowEventListener as the remove ignores the listener argument for the 'visibilitychange' event.
 * @param listener - The event callback to call when a page hide event is triggered
 * @param excludeEvents - [Optional] An array of events that should not be hooked (if possible), unless no other events can be.
 * @param evtNamespace - [Optional] A Namespace to append to the event listeners so they can be uniquely identified and removed
 * based on this namespace. This call also adds an additional unique "pageshow" namespace to the events
 * so that only the matching "removePageHideEventListener" can remove these events.
 * Suggestion: pass as true if you are also calling addPageUnloadEventListener as that also hooks pagehide
 * @returns true - when at least one of the events was registered otherwise false
 */
export function addPageHideEventListener(listener: any, excludeEvents?: string[] | null, evtNamespace?: string | string[] | null): boolean {

    function _handlePageVisibility(evt: any) {
        let doc = getDocument();
        if (listener && doc && doc.visibilityState === "hidden") {
            listener(evt);
        }
    }

    // add the unique page show namespace to any provided namespace so we can only remove the ones added by "pagehide"
    let newNamespaces = mergeEvtNamespace(strPageHideNamespace, evtNamespace);
    let pageUnloadAdded = _addEventListeners([strPageHide], listener, excludeEvents, newNamespaces);

    if (!excludeEvents || arrIndexOf(excludeEvents, strVisibilityChangeEvt) === -1) {
        pageUnloadAdded = _addEventListeners([strVisibilityChangeEvt], _handlePageVisibility, excludeEvents, newNamespaces) || pageUnloadAdded;
    }

    if (!pageUnloadAdded && excludeEvents) {
        // Failed to add any listeners and we where requested to exclude some, so just call again without excluding anything
        pageUnloadAdded = addPageHideEventListener(listener, null, evtNamespace);
    }

    return pageUnloadAdded;
}

/**
 * Removes the pageHide event listeners added by addPageHideEventListener, because the 'visibilitychange' uses
 * an internal proxy to detect the visibility state you SHOULD use a unique namespace when calling addPageHideEventListener
 * as the remove ignores the listener argument for the 'visibilitychange' event.
 * @param listener - The specific listener to remove for the 'pageshow' event only (ignored for 'visibilitychange')
 * @param evtNamespace - The unique namespace used when calling addPageShowEventListener
 */

export function removePageHideEventListener(listener: any, evtNamespace?: string | string[] | null) {
    // add the unique page show namespace to any provided namespace so we only remove the ones added by "pagehide"
    let newNamespaces = mergeEvtNamespace(strPageHideNamespace, evtNamespace);
    removeEventListeners([strPageHide], listener, newNamespaces);
    removeEventListeners([strVisibilityChangeEvt], null, newNamespaces);
}

/**
 * Listen to the pageshow and visibility changing to 'visible' events, because the 'visibilitychange' uses
 * an internal proxy to detect the visibility state you SHOULD use a unique namespace when if you plan to call
 * removePageShowEventListener as the remove ignores the listener argument for the 'visibilitychange' event.
 * @param listener - The event callback to call when a page is show event is triggered
 * @param excludeEvents - [Optional] An array of events that should not be hooked (if possible), unless no other events can be.
 * @param evtNamespace - [Optional/Recommended] A Namespace to append to the event listeners so they can be uniquely
 * identified and removed based on this namespace. This call also adds an additional unique "pageshow" namespace to the events
 * so that only the matching "removePageShowEventListener" can remove these events.
 * @returns true - when at least one of the events was registered otherwise false
 */
export function addPageShowEventListener(listener: any, excludeEvents?: string[] | null, evtNamespace?: string | string[] | null): boolean {

    function _handlePageVisibility(evt: any) {
        let doc = getDocument();
        if (listener && doc && doc.visibilityState === "visible") {
            listener(evt);
        }
    }

    // add the unique page show namespace to any provided namespace so we can only remove the ones added by "pageshow"
    let newNamespaces = mergeEvtNamespace(strPageShowNamespace, evtNamespace);
    let pageShowAdded = _addEventListeners([strPageShow], listener, excludeEvents, newNamespaces);
    pageShowAdded = _addEventListeners([strVisibilityChangeEvt], _handlePageVisibility, excludeEvents, newNamespaces) || pageShowAdded;

    if (!pageShowAdded && excludeEvents) {
        // Failed to add any listeners and we where requested to exclude some, so just call again without excluding anything
        pageShowAdded = addPageShowEventListener(listener, null, evtNamespace);
    }

    return pageShowAdded;
}

/**
 * Removes the pageShow event listeners added by addPageShowEventListener, because the 'visibilitychange' uses
 * an internal proxy to detect the visibility state you SHOULD use a unique namespace when calling addPageShowEventListener
 * as the remove ignores the listener argument for the 'visibilitychange' event.
 * @param listener - The specific listener to remove for the 'pageshow' event only (ignored for 'visibilitychange')
 * @param evtNamespace - The unique namespace used when calling addPageShowEventListener
 */
export function removePageShowEventListener(listener: any, evtNamespace?: string | string[] | null) {
    // add the unique page show namespace to any provided namespace so we only remove the ones added by "pageshow"
    let newNamespaces = mergeEvtNamespace(strPageShowNamespace, evtNamespace);
    removeEventListeners([strPageShow], listener, newNamespaces);
    removeEventListeners([strVisibilityChangeEvt], null, newNamespaces);
}
