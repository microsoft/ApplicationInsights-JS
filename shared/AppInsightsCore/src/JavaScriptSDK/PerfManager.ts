// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import dynamicProto from "@microsoft/dynamicproto-js";
import { isArray, isFunction, objDefine, utcNow } from "@nevware21/ts-utils";
import { INotificationManager } from "../JavaScriptSDK.Interfaces/INotificationManager";
import { IPerfEvent } from "../JavaScriptSDK.Interfaces/IPerfEvent";
import { IPerfManager, IPerfManagerProvider } from "../JavaScriptSDK.Interfaces/IPerfManager";
import { STR_GET_PERF_MGR } from "./InternalConstants";

const strExecutionContextKey = "ctx";
const strParentContextKey = "ParentContextKey";
const strChildrenContextKey = "ChildrenContextKey";

let _defaultPerfManager: IPerfManager = null;

export class PerfEvent implements IPerfEvent {
    public static ParentContextKey = "parent";
    public static ChildrenContextKey = "childEvts";
    
    /**
     * The name of the event
     */
    name: string;

    /**
     * The start time of the event in ms
     */
    start: number;

    /**
     * The payload (contents) of the perfEvent, may be null or only set after the event has completed depending on
     * the runtime environment.
     */
    payload: any;

    /**
     * Is this occurring from an asynchronous event
     */
    isAsync: boolean;
    
    /**
     * Identifies the total inclusive time spent for this event, including the time spent for child events,
     * this will be undefined until the event is completed
     */
    time?: number;

    /**
     * Identifies the exclusive time spent in for this event (not including child events),
     * this will be undefined until the event is completed.
     */
    exTime?: number;

    /**
     * Identifies whether this event is a child event of a parent
     */
    isChildEvt: () => boolean;

    getCtx?: (key: string) => any | null | undefined;

    setCtx?: (key: string, value: any) => void;

    complete: () => void;

    constructor(name: string, payloadDetails: () => any, isAsync: boolean) {
        let _self = this;
        _self.start = utcNow();
        _self.name = name;
        _self.isAsync = isAsync;
        _self.isChildEvt = (): boolean => false;

        if (isFunction(payloadDetails)) {
            // Create an accessor to minimize the potential performance impact of executing the payloadDetails callback
            let theDetails:any;
            objDefine(_self, "payload", {
                g: () => {
                    // Delay the execution of the payloadDetails until needed
                    if (!theDetails && isFunction(payloadDetails)) {
                        theDetails = payloadDetails();
                        // clear it out now so the referenced objects can be garbage collected
                        payloadDetails = null;
                    }

                    return theDetails;
                }
            });
        }

        _self.getCtx = (key: string): any | null | undefined => {
            if (key) {
                // The parent and child links are located directly on the object (for better viewing in the DebugPlugin)
                if (key === PerfEvent[strParentContextKey] || key === PerfEvent[strChildrenContextKey]) {
                    return _self[key];
                }

                return  (_self[strExecutionContextKey] || {})[key];
            }

            return null;
        };

        _self.setCtx = (key: string, value: any) => {
            if (key) {
                // Put the parent and child links directly on the object (for better viewing in the DebugPlugin)
                if (key === PerfEvent[strParentContextKey]) {
                    // Simple assumption, if we are setting a parent then we must be a child
                    if (!_self[key]) {
                        _self.isChildEvt = (): boolean => true;
                    }
                    _self[key] = value;
                } else if (key === PerfEvent[strChildrenContextKey]) {
                    _self[key] = value;
                } else {
                    let ctx = _self[strExecutionContextKey] = _self[strExecutionContextKey] || {};
                    ctx[key] = value;
                }
            }
        };

        _self.complete = () => {
            let childTime = 0;
            let childEvts = _self.getCtx(PerfEvent[strChildrenContextKey]);
            if (isArray<IPerfEvent>(childEvts)) {
                for (let lp = 0; lp < childEvts.length; lp++) {
                    let childEvt: IPerfEvent = childEvts[lp];
                    if (childEvt) {
                        childTime += childEvt.time;
                    }
                }
            }

            _self.time = utcNow() - _self.start;
            _self.exTime = _self.time - childTime;
            _self.complete = () => {};
        };
    }
}

export class PerfManager implements IPerfManager  {
    /**
     * General bucket used for execution context set and retrieved via setCtx() and getCtx.
     * Defined as private so it can be visualized via the DebugPlugin
     */
    private ctx: { [key: string] : any } = {};

    constructor(manager?: INotificationManager) {

        dynamicProto(PerfManager, this, (_self) => {

            _self.create = (src: string, payloadDetails?: () => any, isAsync?: boolean): IPerfEvent | null | undefined => {
                // TODO (@MSNev): at some point we will want to add additional configuration to "select" which events to instrument
                // for now this is just a simple do everything.
                return new PerfEvent(src, payloadDetails, isAsync);
            };

            _self.fire = (perfEvent: IPerfEvent) => {
                if (perfEvent) {
                    perfEvent.complete();

                    if (manager && isFunction(manager.perfEvent)) {
                        manager.perfEvent(perfEvent);
                    }
                }
            };

            _self.setCtx = (key: string, value: any): void => {
                if (key) {
                    let ctx = _self[strExecutionContextKey] = _self[strExecutionContextKey] || {};
                    ctx[key] = value;
                }
            };
        
            _self.getCtx = (key: string): any => {
                return (_self[strExecutionContextKey] || {})[key];
            };
        });
    }

    /**
     * Create a new event and start timing, the manager may return null/undefined to indicate that it does not
     * want to monitor this source event.
     * @param src - The source name of the event
     * @param payloadDetails - An optional callback function to fetch the payload details for the event.
     * @param isAsync - Is the event occurring from a async event
     */
    public create(src: string, payload?: any, isAsync?: boolean): IPerfEvent | null | undefined {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

    /**
     * Complete the perfEvent and fire any notifications.
     * @param perfEvent - Fire the event which will also complete the passed event
     */
    public fire(perfEvent: IPerfEvent): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Set an execution context value
     * @param key - The context key name
     * @param value - The value
     */
    public setCtx(key: string, value: any): void {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    /**
     * Get the execution context value
     * @param key - The context key
     */
    public getCtx(key: string): any {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }
}

const doPerfActiveKey = "CoreUtils.doPerf";

/**
 * Helper function to wrap a function with a perf event
 * @param mgrSource - The Performance Manager or a Performance provider source (may be null)
 * @param getSource - The callback to create the source name for the event (if perf monitoring is enabled)
 * @param func - The function to call and measure
 * @param details - A function to return the payload details
 * @param isAsync - Is the event / function being call asynchronously or synchronously
 */
export function doPerf<T>(mgrSource: IPerfManagerProvider | IPerfManager, getSource: () => string, func: (perfEvt?: IPerfEvent) => T, details?: () => any, isAsync?: boolean) {
    if (mgrSource) {
        let perfMgr: IPerfManager = mgrSource as IPerfManager;
        if (perfMgr[STR_GET_PERF_MGR]) {
            // Looks like a perf manager provider object
            perfMgr = perfMgr[STR_GET_PERF_MGR]();
        }
        
        if (perfMgr) {
            let perfEvt: IPerfEvent;
            let currentActive: IPerfEvent = perfMgr.getCtx(doPerfActiveKey);
            try {
                perfEvt = perfMgr.create(getSource(), details, isAsync);
                if (perfEvt) {
                    if (currentActive && perfEvt.setCtx) {
                        perfEvt.setCtx(PerfEvent[strParentContextKey], currentActive);
                        if (currentActive.getCtx && currentActive.setCtx) {
                            let children: IPerfEvent[] = currentActive.getCtx(PerfEvent[strChildrenContextKey]);
                            if (!children) {
                                children = [];
                                currentActive.setCtx(PerfEvent[strChildrenContextKey], children);
                            }
    
                            children.push(perfEvt);
                        }
                    }
    
                    // Set this event as the active event now
                    perfMgr.setCtx(doPerfActiveKey, perfEvt);
                    return func(perfEvt);
                }
            } catch (ex) {
                if (perfEvt && perfEvt.setCtx) {
                    perfEvt.setCtx("exception", ex);
                }
            } finally {
                // fire the perf event
                if (perfEvt) {
                    perfMgr.fire(perfEvt);
                }
                
                // Reset the active event to the previous value
                perfMgr.setCtx(doPerfActiveKey, currentActive);
            }
        }
    }

    return func();
}

/**
 * Set the global performance manager to use when there is no core instance or it has not been initialized yet.
 * @param perfManager - The IPerfManager instance to use when no performance manager is supplied.
 */
export function setGblPerfMgr(perfManager: IPerfManager) {
    _defaultPerfManager = perfManager;
}

/**
 * Get the current global performance manager that will be used with no performance manager is supplied.
 * @returns - The current default manager
 */
export function getGblPerfMgr(): IPerfManager {
    return _defaultPerfManager;
}
