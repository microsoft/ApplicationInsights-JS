// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { OTelException } from "../IException";
import { IOTelAttributes, OTelAttributeValue } from "../IOTelAttributes";
import { OTelTimeInput } from "../time";
import { IOTelLink } from "./IOTelLink";
import { IOTelSpanContext } from "./IOTelSpanContext";
import { IOTelSpanStatus } from "./IOTelSpanStatus";

/**
 * Provides an OpenTelemetry compatible Interface for the Open Telemetry Api (1.9.0) Span type.
 * This interface is used to represent a span conforming to the OpenTelemetry API specification.
 *
 * An interface that represents a span which is an operation within a trace. A Span can be thought
 * of as a grouping mechanism for a set of operations that are executed as part of a single
 * set of work. Spans are also used to identify the duration of the work performed by the
 * operation.
 *
 * Examples of span might include remote procedure calls or a in-process function calls to sub-components.
 * A Trace has a single, top-level "root" Span that in turn may have zero or more child Spans,
 * which in turn may have children.
 *
 * @since 3.4.0
 * @remarks
 * By default all spans created by this library implement the ISpan interface which also extends
 * the {@link IReadableSpan} interface.
 */
export interface IOTelSpan {
    /**
     * Returns the {@link IOTelSpanContext} object associated with this Span.
     *
     * Get an immutable, serializable identifier for this span that can be used
     * to create new child spans. Returned SpanContext is usable even after the
     * span ends.
     *
     * @returns the SpanContext object associated with this Span.
     */
    spanContext(): IOTelSpanContext;
  
    /**
     * Sets an attribute to the span.
     *
     * Sets a single Attribute with the key and value passed as arguments.
     *
     * @param key - the key for this attribute.
     * @param value - the value for this attribute. Setting a value null or undefined is invalid
     * and will result in undefined behavior.
     */
    setAttribute(key: string, value: OTelAttributeValue): this;
  
    /**
     * Sets attributes to the span.
     *
     * @param attributes - the attributes that will be added, null or undefined attribute
     * values are considered to be invalid and will result in undefined behavior.
     */
    setAttributes(attributes: IOTelAttributes): this;
  
    /**
     * Adds an event to the Span.
     *
     * @param name - the name of the event.
     * @param attributesOrStartTime - the attributes that will be added; these are
     *     associated with this event. Can be also a start time
     *     if type is {@link OTelTimeInput} and 3rd param is undefined
     * @param startTime - start time of the event.
     */
    addEvent(name: string, attributesOrStartTime?: IOTelAttributes | OTelTimeInput, startTime?: OTelTimeInput): this;
  
    /**
     * Adds a single link to the span.
     *
     * Links added after the creation will not affect the sampling decision.
     * It is preferred span links be added at span creation.
     *
     * @param link - the link to add.
     */
    addLink(link: IOTelLink): this;
  
    /**
     * Adds multiple links to the span.
     *
     * Links added after the creation will not affect the sampling decision.
     * It is preferred span links be added at span creation.
     *
     * @param links - the links to add.
     */
    addLinks(links: IOTelLink[]): this;
  
    /**
     * Sets a status to the span. If used, this will override the default Span
     * status. Default is {@link eOTelSpanStatusCode.UNSET}. SetStatus overrides the value
     * of previous calls to SetStatus on the Span.
     *
     * @param status - the SpanStatus to set.
     */
    setStatus(status: IOTelSpanStatus): this;
  
    /**
     * Updates the Span name.
     *
     * This will override the name provided when the span was created.
     *
     * Upon this update, any sampling behavior based on Span name will depend on
     * the implementation.
     *
     * @param name - the Span name.
     */
    updateName(name: string): this;
  
    /**
     * Marks the end of Span execution.
     *
     * Call to End of a Span MUST not have any effects on child spans. Those may
     * still be running and can be ended later.
     *
     * Do not return `this`. The Span generally should not be used after it
     * is ended so chaining is not desired in this context.
     *
     * @param endTime - the time to set as Span's end time. If not provided,
     *     use the current time as the span's end time.
     */
    end(endTime?: OTelTimeInput): void;
  
    /**
     * Returns the flag whether this span will be recorded.
     *
     * @returns true if this Span is active and recording information like events
     *     with the `AddEvent` operation and attributes using `setAttributes`.
     */
    isRecording(): boolean;
  
    /**
     * Sets exception as a span event
     * @param exception - the exception the only accepted values are string or Error
     * @param time - the time to set as Span's event time. If not provided,
     *     use the current time.
     */
    recordException(exception: OTelException, time?: OTelTimeInput): void;
}
