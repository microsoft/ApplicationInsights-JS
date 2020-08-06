// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { ITelemetryItem } from "../JavaScriptSDK.Interfaces/ITelemetryItem";
import { INotificationManager } from '../JavaScriptSDK.Interfaces/INotificationManager';
import { IPerfEvent } from '../JavaScriptSDK.Interfaces/IPerfEvent';
import { IPerfManager } from '../JavaScriptSDK.Interfaces/IPerfManager';
import dynamicProto from "@microsoft/dynamicproto-js";
import { CoreUtils } from "./CoreUtils";

const strExecutionContextKey = "ctx";

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
        let accessorDefined = false;
        _self.start = Date.now();
        _self.name = name;
        _self.isAsync = isAsync;
        _self.isChildEvt = (): boolean => false;

        if (CoreUtils.isFunction(payloadDetails)) {
            // Create an accessor to minimize the potential performance impact of executing the payloadDetails callback
            let theDetails:any;
            accessorDefined = CoreUtils.objDefineAccessors(_self, 'payload', () => {
                // Delay the execution of the payloadDetails until needed
                if (!theDetails && CoreUtils.isFunction(payloadDetails)) {
                    theDetails = payloadDetails();
                    // clear it out now so the referenced objects can be garbage collected
                    payloadDetails = null;
                }

                return theDetails;
            });
        }

        _self.getCtx = (key: string): any | null | undefined => {
            if (key) {
                // The parent and child links are located directly on the object (for better viewing in the DebugPlugin)
                if (key === PerfEvent.ParentContextKey || key === PerfEvent.ChildrenContextKey) {
                    return _self[key];
                }

                return  (_self[strExecutionContextKey] || {})[key];
            }

            return null;
        };

        _self.setCtx = (key: string, value: any) => {
            if (key) {
                // Put the parent and child links directly on the object (for better viewing in the DebugPlugin)
                if (key === PerfEvent.ParentContextKey) {
                    // Simple assumption, if we are setting a parent then we must be a child
                    if (!_self[key]) {
                        _self.isChildEvt = (): boolean => true;
                    }
                    _self[key] = value;
                } 
                else if (key === PerfEvent.ChildrenContextKey) {
                    _self[key] = value;
                } 
                else 
                {
                    let ctx = _self[strExecutionContextKey] = _self[strExecutionContextKey] || {};
                    ctx[key] = value;
                }
            }
        };

        _self.complete = () => {
            let childTime = 0;
            let childEvts = _self.getCtx(PerfEvent.ChildrenContextKey);
            if (CoreUtils.isArray(childEvts)) {
                for (let lp = 0; lp < childEvts.length; lp++) {
                    let childEvt: IPerfEvent = childEvts[lp];
                    if (childEvt) {
                        childTime += childEvt.time;
                    }
                }
            }

            _self.time = Date.now() - _self.start;
            _self.exTime = _self.time - childTime;
            _self.complete = () => {};
            if (!accessorDefined && CoreUtils.isFunction(payloadDetails)) {
                // If we couldn't define the property set during complete -- to minimize the perf impact until after the time
                _self.payload = payloadDetails();
            }
        }
    }
}

export class PerfManager implements IPerfManager  {
    /**
     * General bucket used for execution context set and retrieved via setCtx() and getCtx.
     * Defined as private so it can be visualized via the DebugPlugin
     */
    private ctx: { [key: string] : any } = {};

    constructor(manager: INotificationManager) {

        dynamicProto(PerfManager, this, (_self) => {

            _self.create = (src: string, payloadDetails?: () => any, isAsync?: boolean): IPerfEvent => {
                // TODO (newylie): at some point we will want to add additional configuration to "select" which events to instrument
                // for now this is just a simple do everything.
                return new PerfEvent(src, payloadDetails, isAsync);
            };

            _self.fire = (perfEvent: IPerfEvent) => {
                if (perfEvent) {
                    perfEvent.complete();
                }

                if (manager) {
                    manager.perfEvent(perfEvent);
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

    public create(src: string, payload?: any, isAsync?: boolean): IPerfEvent {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

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
