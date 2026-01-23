// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IOTelContextManager } from "../context/IOTelContextManager";
import { IOTelIdGenerator } from "../trace/IOTelIdGenerator";
import { IOTelSampler } from "../trace/IOTelSampler";
import { IOTelAttributeLimits } from "./IOTelAttributeLimits";
import { IOtelSpanLimits } from "./IOTelSpanLimits";

export interface IOTelTraceCfg {
    contextManager?: IOTelContextManager;

    // textMapPropagator?: TextMapPropagator;

    sampler?: IOTelSampler;
    
    generalLimits?: IOTelAttributeLimits;

    spanLimits?: IOtelSpanLimits;

    idGenerator?: IOTelIdGenerator;

    // logRecordProcessors?: LogRecordProcessor[];
    // metricReader: IMetricReader;
    // views: ViewOptions[];
    // instrumentations: (Instrumentation | Instrumentation[])[];
    // resource: Resource;
    // resourceDetectors: Array<ResourceDetector>;
    serviceName?: string;
    // spanProcessors?: SpanProcessor[];
    // traceExporter: SpanExporter;
}
