// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export {
    strShimFunction,
    strShimObject,
    strShimUndefined,
    strShimPrototype,
    strDefault,
    ObjClass,
    ObjProto
} from "./Constants"

export {
    __assignFn,
    __extendsFn,
    __restFn,
    __spreadArrayFn,
    __spreadArraysFn,
    __decorateFn,
    __paramFn,
    __metadataFn,
    __createBindingFn,
    __valuesFn,
    __readFn,
    __makeTemplateObjectFn,
    __importDefaultFn,
    __importStarFn,
    __exportStarFn
} from "./TsLibShims"

export {
    __exposeGlobalTsLib
} from "./TsLibGlobals"

export {
    throwTypeError,
    getGlobal,
    objAssign as ObjAssign,
    objDefineProp as ObjDefineProperty
} from "@nevware21/ts-utils";