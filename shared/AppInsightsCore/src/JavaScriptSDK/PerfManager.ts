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
     * The included payload of the event
     */
    payload: any;

    isAsync: boolean;
    
    /**
     * Identifies the total time spent for this event, including the time spent for child events
     */
    time?: number;

    /**
     * Identifies the exclusive time spent in for this event (not including child events)
     */
    exTime?: number;

    /**
     * Identifies whether this event is a child event of a parent
     */
    isChildEvt: () => boolean;

    getCtx?: (key: string) => any | null | undefined;

    setCtx?: (key: string, value: any) => void;

    complete: () => void;    

    constructor(name: string, payload: any, isAsync: boolean) {
        let _self = this;
        _self.start = Date.now();
        _self.name = name;
        _self.isAsync = isAsync;
        _self.payload = payload;

        _self.isChildEvt = (): boolean => false;

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

            _self.create = (src: string, payload?: any, isAsync?: boolean): IPerfEvent => {
                let evt: IPerfEvent = new PerfEvent(src, payload, isAsync);

                return evt;
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
