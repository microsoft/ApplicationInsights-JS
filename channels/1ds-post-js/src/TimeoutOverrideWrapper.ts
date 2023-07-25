/**
* TimeoutOverrideWrapper.ts
* @author  Nev Wylie (newylie)
* @copyright Microsoft 2022
* Simple internal timeout wrapper
*/

import { ClearTimeoutOverrideFn, ITimerHandler, TimeoutOverrideFn, scheduleTimeoutWith } from "@nevware21/ts-utils";

export interface ITimeoutOverrideWrapper {
    set: (callback: (...args: any[]) => void, ms: number, ...args: any[]) => ITimerHandler;
}

export function createTimeoutWrapper(argSetTimeout?: TimeoutOverrideFn, argClearTimeout?: ClearTimeoutOverrideFn) {
    return {
        set: (callback: (...args: any[]) => void, ms: number, ...args: any[]) => {
            return scheduleTimeoutWith([argSetTimeout, argClearTimeout], callback, ms, args);
        }
    }
}
