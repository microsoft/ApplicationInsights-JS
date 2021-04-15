// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export const strShimFunction = "function";
export const strShimObject = "object";
export const strShimUndefined = "undefined";
export const strShimPrototype = "prototype";
export const strShimHasOwnProperty = "hasOwnProperty";
export const strDefault = "default";

export const ObjClass = Object;
export const ObjProto = ObjClass[strShimPrototype];
export const ObjAssign = ObjClass["assign"];
export const ObjCreate = ObjClass["create"];
export const ObjDefineProperty = ObjClass["defineProperty"];
export const ObjHasOwnProperty = ObjProto[strShimHasOwnProperty];
