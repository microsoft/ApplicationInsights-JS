// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { getGlobal, objAssign } from "@nevware21/ts-utils";
import { __assignFn, __createBindingFn, __extendsFn } from "./TsLibShims";

// To address compile time errors declaring these here
declare var __extends:(d: any, b: any) => any;
declare var __assign:(t: any) => any;
declare var __createBinding:(o: any, m: any, k: any, k2?: any) => void;

export function __exposeGlobalTsLib() {
    let globalObj:any = getGlobal() || {};

    // tslint:disable: only-arrow-functions
    (function (root: any, assignFn, extendsFn, createBindingFn) {
        // Assign the globally scoped versions of the functions -- used when consuming individual ts files
        // If check is to support NativeScript where these are marked as readonly
        if (!root.__assign) {
            root.__assign = objAssign || assignFn;
        }
        if (!root.__extends) {
            root.__extends = extendsFn;
        }
        if (!root.__createBinding) {
            root.__createBinding = createBindingFn;
        }
    })(globalObj, __assignFn, __extendsFn, __createBindingFn);
    
    // Assign local variables that will be used for embedded scenarios, if check is to support NativeScript where these are marked as readonly
    if (!__assign) {
        __assign = globalObj.__assign;
    }
    if (!__extends) {
        __extends = globalObj.__extends;
    }
    if (!__createBinding) {
        __createBinding = globalObj.__createBinding;
    }
}
