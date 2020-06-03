// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * A callback function that will be called for the wrapped instrumentation function
 * before the original function is executed.
 */
export type InstrumentorHooksCallback = (funcArgs:IInstrumentCallDetails, ...orgArgs: any[]) => void;

/**
 * The callbacks to call for the instrumented function, you must provide at least the request and/or response callbacks, both are not required.
 * You must always supply the error callback
 */
export interface IInstrumentHooksCallbacks {

    /**
     * The hook callback to call before the original function is called
     */
    req?: InstrumentorHooksCallback;

    /**
     * The hook callback to call after the original function was called
     */
    rsp?: InstrumentorHooksCallback;

    /**
     * The callback to call if the hook function causes an exception
     */
    hkErr?: InstrumentorHooksCallback;

    /**
     * The callback to call if the original function causes an exception, even if you
     * supply a callback the original exception will still be thrown
     */
    fnErr?: InstrumentorHooksCallback;
}

/**
 * The holder of the specific instance callback
 */
export interface IInstrumentHook {
    /** Unique Id for this callback on the hooked method */
    id:number;

    /** Holds the callbacks */
    cbks:IInstrumentHooksCallbacks;

    /** Remove this hook from the function */
    rm: () => void;
}

export interface IInstrumentHooks {
    i:number;               // Used to create unique ids
    n:string;               // Function name
    f:any;                  // Original Function
    h:IInstrumentHook[];    // The hook
}

export interface IInstrumentCallDetails {
    name: string;
    inst: any;

    /**
     * This returns an object that the hook function can use to store hook specific
     * context, it it not shared with any other hook instances and is unique for the 
     * current call.
     * A hook implementation can use this to pass / share context between different 
     * hook callbacks eg. request/response requst/hookErrors etc.
     */
    ctx: () => any;

    /**
     * Allows the hook functions to replace the original arguments
     * @param idx - The argument index (0 based)
     * @param value - The new value for the argument
     */
    set: (idx:number, value:any) => void;

    /**
     * The result of the original method, only populated after the original method has returned
     */
    rslt?: any;

    /**
     * The error (exception) which occurred while executing the original method
     */
    err?: Error;
}
