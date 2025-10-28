// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { OTelSpanKind } from "../../enums/trace/OTelSpanKind";
import { IOTelAttributes } from "../IOTelAttributes";
import { IOTelResource } from "../resources/IOTelResource";
import { IOTelHrTime } from "../time";
import { IOTelInstrumentationScope } from "./IOTelInstrumentationScope";
import { IOTelLink } from "./IOTelLink";
import { IOTelSpan } from "./IOTelSpan";
import { IOTelSpanContext } from "./IOTelSpanContext";
import { IOTelSpanStatus } from "./IOTelSpanStatus";
import { IOTelTimedEvent } from "./IOTelTimedEvent";

/**
 * Provides an OpenTelemetry compatible Interface for the Open Telemetry Sdk-Trace-Base (1.8.0 and 2.0.0) ReadableSpan type.
 *
 * The IReadableSpan interface is used to represent a span that can be read and exported, while the OpenTelemetry
 * specification defines a ReadableSpan as a Span that has been ended and is ready to be exported. By default all
 * spans created by this library implement the IReadableSpan interface which also extends the {@link IOTelSpan} interface.
 *
 * This interface is defined to provide compatibility with exporters defined by the OpenTelemetry Trace SDK.
 * @since 3.4.0
 */
export interface IReadableSpan extends IOTelSpan {

    /**
     * The span's unique identifier.
     */
    readonly name: string;

    /**
     * Identifies the type (or kind) that this span is representing.
     */
    readonly kind: OTelSpanKind;
    readonly spanContext: () => IOTelSpanContext;
    readonly parentSpanId?: string;
    readonly parentSpanContext?: IOTelSpanContext;
    readonly startTime: IOTelHrTime;
    readonly endTime: IOTelHrTime;
    readonly status: IOTelSpanStatus;
    readonly attributes: IOTelAttributes;
    readonly links: IOTelLink[];
    readonly events: IOTelTimedEvent[];
    readonly duration: IOTelHrTime;
    readonly ended: boolean;
    readonly resource: IOTelResource;
    readonly instrumentationScope: IOTelInstrumentationScope;
    readonly droppedAttributesCount: number;
    readonly droppedEventsCount: number;
    readonly droppedLinksCount: number;
  }
