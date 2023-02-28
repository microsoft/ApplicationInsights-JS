// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { strShimFunction, strShimPrototype } from "@microsoft/applicationinsights-shims";
import {
    IInstrumentCallDetails, IInstrumentHook, IInstrumentHooks, IInstrumentHooksCallbacks, InstrumentorHooksCallback
} from "../JavaScriptSDK.Interfaces/IInstrumentHooks";
import { getGlobalInst } from "./EnvUtils";
import { _getObjProto, hasOwnProperty } from "./HelperFuncs";

const aiInstrumentHooks = "_aiHooks";

const enum CallbackType {
    Request = 0,
    Response = 1,
    HookError = 2,
    FunctionError = 3
}

const cbNames = [
    "req", "rsp", "hkErr", "fnErr"
];

/** @ignore */
function _arrLoop<T>(arr:T[], fn:(value:T, idx:number) => boolean|number|void) {
    if (arr) {
        for (let lp = 0; lp < arr.length; lp++) {
            if (fn(arr[lp], lp)) {
                break;
            }
        }
    }
}

/** @ignore */
function _doCallbacks(hooks:IInstrumentHook[], callDetails: IInstrumentCallDetails, cbArgs:any[], hookCtx:any[], type:CallbackType): void {
    if (type >= CallbackType.Request && type <= CallbackType.HookError) {
        _arrLoop(hooks, (hook, idx) => {
            let cbks = hook.cbks;
            let cb:InstrumentorHooksCallback = cbks[cbNames[type]];
            if (cb) {

                // Set the specific hook context implementation using a lazy creation pattern
                callDetails.ctx = () => {
                    let ctx = hookCtx[idx] = (hookCtx[idx] || {});
                    return ctx;
                };

                try {
                    cb.apply(callDetails.inst, cbArgs);
                } catch (err) {
                    let orgEx = callDetails.err;
                    try {
                        // Report Hook error via the callback
                        let hookErrorCb:InstrumentorHooksCallback = cbks[cbNames[CallbackType.HookError]];
                        if (hookErrorCb) {
                            callDetails.err = err;
                            hookErrorCb.apply(callDetails.inst, cbArgs);
                        }
                    } catch(e) {
                        // Not much we can do here -- swallowing the exception to avoid crashing the hosting app
                    } finally {
                        // restore the original exception (if any)
                        callDetails.err = orgEx;
                    }
                }
            }
        });
    }
}

/** @ignore */
function _createFunctionHook(aiHook:IInstrumentHooks) {

    // Define a temporary method that queues-up a the real method call
    return function (this: any) {
        let funcThis = this;
        // Capture the original arguments passed to the method
        let orgArgs = arguments as any;
        let hooks = aiHook.h;

        let funcArgs: IInstrumentCallDetails = {
            name: aiHook.n,
            inst: funcThis,
            ctx: null,
            set: _replaceArg
        };

        let hookCtx: any[] = [];
        let cbArgs = _createArgs([funcArgs], orgArgs);
        funcArgs.evt = getGlobalInst("event");

        function _createArgs(target:any[], theArgs:any[]): any[] {
            _arrLoop((theArgs as any), (arg) => {
                target.push(arg);
            });

            return target;
        }

        function _replaceArg(idx:number, value:any) {
            orgArgs = _createArgs([], orgArgs);
            orgArgs[idx] = value;
            cbArgs = _createArgs([funcArgs], orgArgs);
        }

        // Call the pre-request hooks
        _doCallbacks(hooks, funcArgs, cbArgs, hookCtx, CallbackType.Request);

        // Call the original function was called
        let theFunc = aiHook.f;
        if (theFunc) {
            try {
                funcArgs.rslt = theFunc.apply(funcThis, orgArgs);
            } catch (err) {
                // Report the request callback
                funcArgs.err = err;
                _doCallbacks(hooks, funcArgs, cbArgs, hookCtx, CallbackType.FunctionError);
    
                // rethrow the original exception so anyone listening for it can catch the exception
                throw err;
            }
        }

        // Call the post-request hooks
        _doCallbacks(hooks, funcArgs, cbArgs, hookCtx, CallbackType.Response);

        return funcArgs.rslt;
    };
}


/** @ignore */
function _getOwner(target:any, name:string, checkPrototype: boolean, checkParentProto: boolean): any {
    let owner = null;
    if (target) {
        if (hasOwnProperty(target, name)) {
            owner = target;
        } else if (checkPrototype) {
            owner = _getOwner(_getObjProto(target), name, checkParentProto, false);
        }
    }

    return owner;
}

/**
 * Intercept the named prototype functions for the target class / object
 * @param target - The target object
 * @param funcName - The function name
 * @param callbacks - The callbacks to configure and call whenever the function is called
 */
export function InstrumentProto(target:any, funcName:string, callbacks: IInstrumentHooksCallbacks): IInstrumentHook {
    if (target) {
        return InstrumentFunc(target[strShimPrototype], funcName, callbacks, false);
    }

    return null;
}

/**
 * Intercept the named prototype functions for the target class / object
 * @param target - The target object
 * @param funcNames - The function names to intercept and call
 * @param callbacks - The callbacks to configure and call whenever the function is called
 */
export function InstrumentProtos(target:any, funcNames:string[], callbacks: IInstrumentHooksCallbacks): IInstrumentHook[] {
    if (target) {
        return InstrumentFuncs(target[strShimPrototype], funcNames, callbacks, false);
    }

    return null;
}

function _createInstrumentHook(owner: any, funcName: string, fn: any, callbacks: IInstrumentHooksCallbacks) {
    let aiHook: IInstrumentHooks = fn && fn[aiInstrumentHooks];
    if (!aiHook) {
        // Only hook the function once
        aiHook = {
            i: 0,
            n: funcName,
            f: fn,
            h: []
        };

        // Override (hook) the original function
        let newFunc = _createFunctionHook(aiHook);
        newFunc[aiInstrumentHooks] = aiHook; // Tag and store the function hooks
        owner[funcName] = newFunc;
    }

    const theHook: IInstrumentHook = {
        // tslint:disable:object-literal-shorthand
        id: aiHook.i,
        cbks: callbacks,
        rm: function () {
            // DO NOT Use () => { shorthand for the function as the this gets replaced
            // with the outer this and not the this for theHook instance.
            let id = this.id;
            _arrLoop(aiHook.h, (hook, idx) => {
                if (hook.id === id) {
                    aiHook.h.splice(idx, 1);
                    return 1;
                }
            });
        }
        // tslint:enable:object-literal-shorthand
    };

    aiHook.i++;
    aiHook.h.push(theHook);

    return theHook;
}

/**
 * Intercept the named prototype functions for the target class / object
 * @param target - The target object
 * @param funcName - The function name
 * @param callbacks - The callbacks to configure and call whenever the function is called
 * @param checkPrototype - If the function doesn't exist on the target should it attempt to hook the prototype function
 * @param checkParentProto - If the function doesn't exist on the target or it's prototype should it attempt to hook the parent's prototype
 */
export function InstrumentFunc(target:any, funcName:string, callbacks: IInstrumentHooksCallbacks, checkPrototype: boolean = true, checkParentProto?: boolean): IInstrumentHook {
    if (target && funcName && callbacks) {
        let owner = _getOwner(target, funcName, checkPrototype, checkParentProto);
        if (owner) {
            let fn = owner[funcName]
            if (typeof fn === strShimFunction) {
                return _createInstrumentHook(owner, funcName, fn, callbacks);
            }
        }
    }

    return null;
}

/**
 * Intercept the named functions for the target class / object
 * @param target - The target object
 * @param funcNames - The function names to intercept and call
 * @param callbacks - The callbacks to configure and call whenever the function is called
 * @param checkPrototype - If the function doesn't exist on the target should it attempt to hook the prototype function
 * @param checkParentProto - If the function doesn't exist on the target or it's prototype should it attempt to hook the parent's prototype
 */
export function InstrumentFuncs(target:any, funcNames:string[], callbacks: IInstrumentHooksCallbacks, checkPrototype:boolean = true, checkParentProto?: boolean): IInstrumentHook[] {
    let hooks: IInstrumentHook[] = null;
    _arrLoop(funcNames, (funcName) => {
        let hook = InstrumentFunc(target, funcName, callbacks, checkPrototype, checkParentProto);
        if (hook) {
            if (!hooks) {
                hooks = [];
            }

            hooks.push(hook);
        }
    });

    return hooks;
}

/**
 * Add an instrumentation hook to the provided named "event" for the target class / object, this doesn't check whether the
 * named "event" is in fact a function and just assigns the instrumentation hook to the target[evtName]
 * @param target - The target object
 * @param evtName - The name of the event
 * @param callbacks - The callbacks to configure and call whenever the function is called
 * @param checkPrototype - If the function doesn't exist on the target should it attempt to hook the prototype function
 * @param checkParentProto - If the function doesn't exist on the target or it's prototype should it attempt to hook the parent's prototype
 */
export function InstrumentEvent(target: any, evtName: string, callbacks: IInstrumentHooksCallbacks, checkPrototype?: boolean, checkParentProto?: boolean): IInstrumentHook {
    if (target && evtName && callbacks) {
        let owner = _getOwner(target, evtName, checkPrototype, checkParentProto) || target;
        if (owner) {
            return _createInstrumentHook(owner, evtName, owner[evtName], callbacks);
        }
    }

    return null;
}
