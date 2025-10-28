import dynamicProto from "@microsoft/dynamicproto-js";
import {
    IAppInsightsCore, IConfiguration, IDynamicConfigHandler, IPlugin, IProcessTelemetryContext, ITelemetryItem, ITelemetryPluginChain,
    eW3CTraceFlags
} from "@microsoft/applicationinsights-common";
import {
    IOTelApi, IOTelApiCtx, IOTelConfig, IOTelIdGenerator, IOTelSampler, IOTelSdk, IOTelSpan, IOTelSpanCtx, IOTelTracer, IOTelTracerCtx,
    IOTelTracerOptions, IReadableSpan, createTracer, deleteContextSpan, eOTelSamplingDecision, getContextSpan, isSpanContextValid,
    isTracingSuppressed, wrapSpanContext
} from "@microsoft/otel-core-js";
import { ILazyValue, arrForEach, createDeferredCachedValue, normalizeJsName, objDefine, objDefineProps } from "@nevware21/ts-utils";
import { createDynamicConfig, onConfigChange } from "./Config/DynamicConfig";
import { STR_EMPTY } from "./InternalConstants";
import { createProcessTelemetryContext } from "./JavaScriptSDK/ProcessTelemetryContext";
import { createOTelApi, traceApiDefaultConfigValues } from "./OTelApi";

interface TraceList {
    name: string;
    tracer: IOTelTracer;
    version?: string;
    schemaUrl?: string;
}

// TODO: Enable
// function _createSpanContext(parentSpanContext: SpanContext | null, idGenerator: IOTelIdGenerator): SpanContext {
//     const spanId = idGenerator.generateSpanId();
//     let traceId: string;
//     let traceState: TraceState;
//     if (!parentSpanContext || isSpanContextValid(parentSpanContext)) {
//         // if parentSpanContext is not valid, generate a new one
//         traceId = idGenerator.generateTraceId();
//     } else {
//         traceId = parentSpanContext.traceId;
//         traceState = parentSpanContext.traceState;
//     }

//     let traceFlags = parentSpanContext ? parentSpanContext.traceFlags : eW3CTraceFlags.None;

//     return {
//         traceId: traceId,
//         spanId: spanId,
//         traceFlags: traceFlags,
//         traceState: traceState,
//         isRemote: false
//     };
// }

// function _isSampledOut(sampler: IOTelSampler, context: Context, spanContext: SpanContext, kind: SpanKind, attributes: Attributes, links: Link[]): boolean {
//     if (sampler) {
//         const samplingResult = sampler.shouldSample(context, spanContext.traceId, spanContext.spanId, kind, attributes, links);
//         spanContext.traceState = samplingResult.traceState || spanContext.traceState;
//         if (samplingResult.decision === eOTelSamplingDecision.NOT_RECORD) {
//             return true;
//         }
//     }

//     return false;
// }

export class OTelSdk implements IOTelSdk {
    public static identifier: string = "OTelSdk";

    public identifier: string = OTelSdk.identifier;
    public cfg: IOTelConfig;
    public api: IOTelApi;
    
    constructor() {
        // NOTE!: DON'T set default values here, instead set them in the _initDefaults() function as it is also called during teardown()
        let _configHandler: IDynamicConfigHandler<IOTelConfig>;
        let _otelApi: ILazyValue<IOTelApi>;
        let _tracers: { [key: string]: TraceList[] };

        dynamicProto(OTelSdk, this, (_self, _base) => {
            // Set the default values (also called during teardown)
            _initDefaults();

            objDefineProps(_self, {
                cfg:{ g: () => _configHandler.cfg },
                api: { g: () => _otelApi.v }
            });

            // Creating the self.initialize = ()
            _self.initialize = (config: IConfiguration, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?: ITelemetryPluginChain): void => {
                // TODO: Enable
                // if (!_self.isInitialized()) {
                //     _base.initialize(config, core, extensions, pluginChain);

                //     _populateDefaults(config);
                // }
            };

            _self.getTracer = _getTracer;

            function _getTracer (name: string, version?: string, options?: IOTelTracerOptions): IOTelTracer {
                let tracer: IOTelTracer;
                let tracerVer = version || STR_EMPTY;
                let tracerSchema = options ? options.schemaUrl : null;
                let keyName = normalizeJsName(name + "@" + tracerVer);
                let tracerList = _tracers?.[keyName];
                
                if (tracerList) {
                    arrForEach(tracerList, (item) => {
                        if (item.name == name && item.version == tracerVer && item.schemaUrl == tracerSchema) {
                            tracer = item.tracer;
                            return -1;
                        }
                    });
                } else {
                    // Ensure _tracers is initialized before accessing it
                    if (!_tracers) {
                        _tracers = {};
                    }
                    tracerList = _tracers[keyName] = [];
                }

                if (!tracer) {
                    // Ensure otelApi is available before accessing its properties
                    let otelApi = _otelApi.v;
                    // TODO: Enable
                    // let tracerCtx: IOTelTracerCtx = {
                    //     ctxMgr: otelApi?.context,
                    //     //context: _otelSdkCtx.v.context,
                    //     startSpan: _startSpan
                    // };

                    // tracer = createTracer(tracerCtx, {
                    //     name,
                    //     version,
                    //     schemaUrl: options ? options.schemaUrl : null
                    // });

                    // // tracerList is guaranteed to be defined by the logic above
                    // tracerList.push({ name, version: tracerVer, schemaUrl: tracerSchema, tracer });
                }
                
                return tracer;
            }
       
            // function _startSpan(name: string, options?: SpanOptions, pContext?: Context): IOTelSpan | IReadableSpan {
            //     let spanOpts = options || {};
            //     let kind = spanOpts.kind || SpanKind.INTERNAL;
            //     let otelApi = _otelApi.v;
            //     let theContext = pContext || otelApi?.context?.active();
            //     let parentSpanContext: SpanContext | null = null;

            //     if (spanOpts.root) {
            //         theContext = deleteContextSpan(theContext);
            //     }

            //     const parentSpan = getContextSpan(theContext);

            //     // if Tracing suppressed
            //     if (!isTracingSuppressed(theContext)) {
            //         let traceCfg = _configHandler.cfg.traceCfg;
            //         let idGenerator = traceCfg.idGenerator;

            //         parentSpanContext = parentSpan && parentSpan.spanContext();
            //         let spanContext = _createSpanContext(parentSpanContext, idGenerator);
            //         let attributes = spanOpts.attributes || {};
            //         let links = spanOpts.links || [];

            //         const sampler = traceCfg.sampler;
            //         if (!_isSampledOut(sampler, theContext, spanContext, kind, attributes, links)) {
        
            //             let spanCtx: IOTelSpanCtx = {
            //                 api: otelApi,
            //                 resource: null,
            //                 instrumentationScope: null,
            //                 context: theContext,
            //                 spanContext: spanContext,
            //                 attributes: attributes,
            //                 links: links,
            //                 isRecording: true,
            //                 startTime: spanOpts.startTime,
            //                 parentSpanContext: parentSpanContext,
            //                 onEnd: (span: IReadableSpan) => {
            //                     _endSpan(this, span);
            //                 }
            //             };
                        
            //             return createSpan(spanCtx, name, kind);
            //         }
            //     }

            //     return wrapSpanContext(parentSpanContext);
            // }

            // function _endSpan(spanCtx: IOTelSpanCtx, span: IOTelSpan): void {
            //     if ((span.spanContext().traceFlags & eW3CTraceFlags.Sampled) === 0) {
            //         return;
            //     }
            //     // _self.core.trackTrace({
            //     //     message: span.name,
            //     //     properties: span.attributes as Attributes
            //     // });
            // }

            function _initDefaults() {
                // Use a default logger so initialization errors are not dropped on the floor with full logging
                // TODO: Enable
                //_configHandler = createDynamicConfig({} as IOTelConfig, traceApiDefaultConfigValues as any, _self.diagLog());
                let otelConfig = _configHandler.cfg;
                _tracers = {};

                // TODO: Enable
                // _otelApi = createDeferredCachedValue(() => {
                //     let otelApiCtx: IOTelApiCtx = {
                //         otelCfg: null,
                //         traceProvider: {
                //             getTracer: _getTracer
                //         },
                //         diagLogger: _self.diagLog()
                //     };
    
                //     // make the config lookup dynamic, so when the config changes we return the current
                //     objDefine(otelApiCtx, "otelCfg", { g: () => otelConfig });

                //     return createOTelApi(otelApiCtx)
                // });
            }

            // function _populateDefaults(config: IConfiguration) {
            //     _self._addHook(onConfigChange(config, (details) => {
            //         let config = details.cfg;
            //         let ctx = createProcessTelemetryContext(null, config, _self.core);
            //         let _otelConfig = ctx.getExtCfg(OTelSdk.identifier, traceApiDefaultConfigValues, true);
            //     }));
            // }

        });
    }

    public initialize(config: IConfiguration, core: IAppInsightsCore, extensions: IPlugin[], pluginChain?:ITelemetryPluginChain) {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
    }

    public processTelemetry(item: ITelemetryItem, itemCtx?: IProcessTelemetryContext) {
        // TODO: Enable
        //this.processNext(item, itemCtx);
    }

    /**
     * Returns a Tracer, creating one if one with the given name and version is
     * not already created. This may return
     * - The same Tracer instance if one has already been created with the same name and version
     * - A new Tracer instance if one has not already been created with the same name and version
     * - A non-operational Tracer if the provider is not operational
     *
     * @param name - The name of the tracer or instrumentation library.
     * @param version - The version of the tracer or instrumentation library.
     * @param options - The options of the tracer or instrumentation library.
     * @returns A Tracer with the given name and version
     */
    public getTracer(name: string, version?: string, options?: IOTelTracerOptions): IOTelTracer {
        // @DynamicProtoStub -- DO NOT add any code as this will be removed during packaging
        return null;
    }

}
