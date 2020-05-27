// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { 
    IInstrumentHooksCallbacks, IInstrumentHooks, IInstrumentHook, IInstrumentCallDetails, InstrumentorHooksCallback 
} from "../JavaScriptSDK.Interfaces/IInstrumentHooks";
import {
    strFunction, strPrototype
} from "./EnvUtils"
import { CoreUtils } from './CoreUtils';

const aiInstrumentHooks = "_aiHooks";

const enum CallbackType {
    Request = 0,
    Response = 1,
    HookError = 2,
    FunctionError = 3
};

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
    return function () {
        let funcThis = this;
        // Capture the original arguments passed to the method
        let orgArgs = arguments as any;
        let hooks = aiHook.h;

        let funcArgs:IInstrumentCallDetails = {
            name: aiHook.n,
            inst: funcThis,
            ctx: null,
            set: _replaceArg
        };

        let hookCtx: any[] = [];
        let cbArgs = _createArgs([funcArgs], orgArgs);

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
        try {
            funcArgs.rslt = theFunc.apply(funcThis, orgArgs);
        } catch (err) {
            // Report the request callback
            funcArgs.err = err;
            _doCallbacks(hooks, funcArgs, cbArgs, hookCtx, CallbackType.FunctionError);

            // rethrow the original exception so anyone listening for it can catch the exception
            throw err;
        }

        // Call the post-request hooks
        _doCallbacks(hooks, funcArgs, cbArgs, hookCtx, CallbackType.Response);

        return funcArgs.rslt;
    };
}

/** @ignore */
function _getOwner(target:any, name:string, checkPrototype:boolean): any {
    let owner = null;
    if (target) {
        if (CoreUtils.hasOwnProperty(target, name)) {
            owner = target;
        } else if (checkPrototype) {
            owner = _getOwner(target[strPrototype], name, false);
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
        return InstrumentFunc(target[strPrototype], funcName, callbacks, false);
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
        return InstrumentFuncs(target[strPrototype], funcNames, callbacks, false);
    }

    return null;
}

/**
 * Intercept the named prototype functions for the target class / object
 * @param target - The target object
 * @param funcName - The function name
 * @param callbacks - The callbacks to configure and call whenever the function is called
 * @param checkPrototype - If the function doesn't exist on the target should it attempt to hook the prototype function
 */
export function InstrumentFunc(target:any, funcName:string, callbacks: IInstrumentHooksCallbacks, checkPrototype:boolean = true): IInstrumentHook {
    if (target && funcName && callbacks) {
        let owner = _getOwner(target, funcName, checkPrototype);
        let fn = owner[funcName]
        if (typeof fn === strFunction) {
            let aiHook:IInstrumentHooks = fn[aiInstrumentHooks];
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
                newFunc[aiInstrumentHooks] = aiHook;        // Tag and store the function hooks
                owner[funcName] = newFunc;
            }

            const theHook: IInstrumentHook = {
                // tslint:disable:object-literal-shorthand
                id: aiHook.i,
                cbks: callbacks,
                rm: function() {
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
            }

            aiHook.i ++;
            aiHook.h.push(theHook);

            return theHook;
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
 */
export function InstrumentFuncs(target:any, funcNames:string[], callbacks: IInstrumentHooksCallbacks, checkPrototype:boolean = true): IInstrumentHook[] {
    let hooks: IInstrumentHook[] = null;
    _arrLoop(funcNames, (funcName) => {
        let hook = InstrumentFunc(target, funcName, callbacks, checkPrototype);
        if (hook) {
            if (!hooks) {
                hooks = [];
            }

            hooks.push(hook);
        }
    });

    return hooks;
}
