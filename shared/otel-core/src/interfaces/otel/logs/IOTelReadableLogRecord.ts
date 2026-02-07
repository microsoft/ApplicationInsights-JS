// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IDistributedTraceContext } from "../../..";
import { OTelSeverityNumber } from "../../../enums/otel/eOTelSeverityNumber";
import { IOTelHrTime } from "../../../interfaces/IOTelHrTime";
import { IOTelResource } from "../resources/IOTelResource";
import { IOTelInstrumentationScope } from "../trace/IOTelInstrumentationScope";
import { LogAttributes, LogBody } from "./IOTelLogRecord";

export interface ReadableLogRecord {
    /**
     * The high-resolution time when the log record occurred.
     */
    readonly hrTime: IOTelHrTime;

    /**
     * The high-resolution time when the event was observed by the collection system.
     */
    readonly hrTimeObserved: IOTelHrTime;

    /**
     * The SpanContext associated with the LogRecord.
     */
    readonly spanContext?: IDistributedTraceContext;

    /**
     * The severity text.
     */
    readonly severityText?: string;

    /**
     * Numerical value of the severity.
     */
    readonly severityNumber?: OTelSeverityNumber;

    /**
     * A value containing the body of the log record.
     */
    readonly body?: LogBody;

    /**
     * The unique identifier for the log record.
     */
    readonly eventName?: string;

    /**
     * Attributes that define the log record.
     */
    readonly resource: IOTelResource;

    /**
     * The Instrumentation Scope associated with the LogRecord.
     */
    readonly instrumentationScope: IOTelInstrumentationScope;

    /**
     * Attributes that define the log record.
     */
    readonly attributes: LogAttributes;

    /**
     * The number of attributes that were dropped.
     */
    readonly droppedAttributesCount: number;
}
