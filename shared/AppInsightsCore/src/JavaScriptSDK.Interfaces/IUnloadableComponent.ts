import { IProcessTelemetryUnloadContext } from "./IProcessTelemetryContext";
import { ITelemetryUnloadState } from "./ITelemetryUnloadState";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export interface IUnloadableComponent {
    /**
    * Teardown / Unload hook to allow implementations to perform some additional unload operations before the BaseTelemetryPlugin
    * finishes it's removal.
    * @param unloadCtx - This is the context that should be used during unloading.
    * @param unloadState - The details / state of the unload process, it holds details like whether it should be unloaded synchronously or asynchronously and the reason for the unload.
    * @param asyncCallback - An optional callback that the plugin must call if it returns true to inform the caller that it has completed any async unload/teardown operations.
    * @returns boolean - true if the plugin has or will call asyncCallback, this allows the plugin to perform any asynchronous operations.
    */
    _doUnload?: (unloadCtx?: IProcessTelemetryUnloadContext, unloadState?: ITelemetryUnloadState, asyncCallback?: () => void) => void | boolean;
}