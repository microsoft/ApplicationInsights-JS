// // Copyright (c) Microsoft Corporation. All rights reserved.
// // Licensed under the MIT License.

// import { ILazyValue, createDeferredCachedValue, objDefineProps } from "@nevware21/ts-utils";
// import { IOTelContext } from "../interfaces/context/IOTelContext";
// import { IOTelContextManager } from "../interfaces/context/IOTelContextManager";
// import { IOTelSpan } from "../interfaces/trace/IOTelSpan";
// import { IOTelSpanOptions } from "../interfaces/trace/IOTelSpanOptions";
// import { IOTelTracer } from "../interfaces/trace/IOTelTracer";
// import { IOTelTracerCtx } from "../interfaces/trace/IOTelTracerCtx";
// import { IOTelTracerProvider } from "../interfaces/trace/IOTelTracerProvider";
// import { createNonRecordingSpan } from "../trace/nonRecordingSpan";
// import { isSpanContext } from "../trace/spanContext";
// import { createTracer } from "../trace/tracer";
// import { getContextActiveSpanContext, isSpanContextValid } from "../trace/utils";
// import { createNoopContextMgr } from "./noopContextMgr";
// import { createNoopProxy } from "./noopProxy";

// /**
//  * Createa a Noop Context Manager that returns Noop Contexts, if no parent context is provided
//  * the returned context will always return undefined for all values.
//  * @returns - A new Noop Context Manager
//  */
// export function createNoopTracerProvider(): IOTelTracerProvider {

//     function _startSpan(name: string, options?: IOTelSpanOptions, context?: IOTelContext): IReadableSpan {
//         let opts = options || {};
//         if (!opts.root) {
//             let parentContext = context || getContextActiveSpanContext(context);
//             if (isSpanContext(parentContext) && isSpanContextValid(parentContext)) {
//                 return createNonRecordingSpan(parentContext, name);
//             }
//         }

//         return createNonRecordingSpan(null, name);
//     }
       
//     let noopMgr: ILazyValue<IOTelContextManager> = createDeferredCachedValue(() => createNoopContextMgr());
//     let tracerCtx: IOTelTracerCtx = objDefineProps<IOTelTracerCtx>(
//         {
//             ctxMgr: null,
//             startSpan: _startSpan
//         }, {
//             ctxMgr: {
//                 l: noopMgr
//             },
//             context: {
//                 g: () => noopMgr.v.active()
//             }
//         });

//     let tracer: ILazyValue<IOTelTracer> = createDeferredCachedValue(() => createTracer(tracerCtx, { name: "NoopTracer" }));
    
//     return createNoopProxy<IOTelTracerProvider>({
//         props: {
//             getTracer: {
//                 v: (name: string, version?: string): IOTelTracer => {
//                     return tracer.v;
//                 }
//             }
//         }
//     });
// }
