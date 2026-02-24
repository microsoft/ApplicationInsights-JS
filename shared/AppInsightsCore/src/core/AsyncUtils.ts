// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IPromise, createPromise, doAwaitResponse } from "@nevware21/ts-async";
import { arrSlice, getLength } from "@nevware21/ts-utils";

/**
 * Run the unload function of the target object if it exists
 * @param target - The target object that contains the unload function
 * @param isAsync - The caller identifies whether it is expecting the operation to complete synchronously or asynchronously. Even
 * if the caller is not waiting the operation may still be performed asynchronously depending on the component and the reverse is
 * also true.
 * @returns The result of the target function
 */
export function runTargetUnload<T>(target: { unload?: (isAsync?: boolean) => T }, isAsync?: boolean) : T {
    if (target && target.unload) {
        return target.unload(isAsync);
    }
}

/**
 * Call the unload function on all targets handling any returned [IPromise](https://nevware21.github.io/ts-async/typedoc/interfaces/IPromise.html)
 * / Promise before calling the next targets unload
 * @param targets - An array of the targets to unload
 * @param isAsync - The caller identifies whether it is expecting the operations to complete synchronously or asynchronously.  Even
 * if the caller is not waiting the operation may still be performed asynchronously depending on the component and the reverse is
 * also true.
 * @param done - Optional callback function to call once all of the unload functions have been called.
 */
export function doUnloadAll<T>(targets: Array<{ unload?: (isAsync?: boolean) => T | IPromise<T> }>, isAsync?: boolean, done?: () => void): void | IPromise<void> {
    let result: IPromise<void>;

    if (!done) {
        result = createPromise<void>((resolved) => {
            done = resolved;
        });
    }
    if (targets && getLength(targets) > 0) {
    
        doAwaitResponse(runTargetUnload(targets[0], isAsync), () => {
            doUnloadAll(arrSlice(targets, 1), isAsync, done);
        });
    } else {
        done();
    }

    return result;
}
