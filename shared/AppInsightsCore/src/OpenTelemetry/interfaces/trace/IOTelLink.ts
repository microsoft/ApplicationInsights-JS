// // Copyright (c) Microsoft Corporation. All rights reserved.
// // Licensed under the MIT License.

// import { IOTelAttributes } from "../IOTelAttributes";
// import { IOTelSpanContext } from "./IOTelSpanContext";

// /**
//  * Provides an OpenTelemetry compatible Interface for the Open Telemetry Api (1.9.0) Link type.
//  *
//  * A link is a reference to another span that is part of the same trace or a different trace.
//  * Links are used to connect spans that are not directly related to each other, but are part of the same
//  * operation or workflow. For example, a link can be used to connect a span that represents a batch of
//  * messages to the spans that represent the individual messages in the batch.
//  *
//  * Links are also used to connect spans that are part of a distributed trace, where the spans may be
//  * created by different services or applications. In this case, the link can be used to connect the
//  * spans that are created by different services or applications, allowing the trace to be reconstructed
//  * across service boundaries.
//  * Links are not the same as parent
//  *
//  * A conceptual pointer from the current {@link IOTelSpan} to another span in the same trace or in a different trace,
//  * A few examples of Link usage.
//  * Few examples of Link usage.
//  * - Batch Processing: A batch of elements may contain elements associated with one or more traces/spans.
//  * Since there can only be one parent {@link IOTelSpanContext}, Links can be used to keep reference to {@link IOTelSpanContext}
//  * of all elements in the batch.
//  * - Public Endpoint: An {@link IOTelSpanContext} in incoming client request on a public endpoint is untrusted
//  * from the service provider's perspective. In such cases, it is advisable to start a new trace with an appropriate
//  * sampling decision. However, it is desirable to associate the incoming {@link IOTelSpanContext} with the new trace
//  * initiated on the service provider's side so that the two traces (from the Client and the Service Provider) can be correlated.
//  *
//  * @since 3.4.0
//  */
// export interface IOTelLink {
//     /**
//      * The {@link IOTelSpanContext} of a linked span.
//      */
//     context: IOTelSpanContext;

//     /**
//      * A set of {@link IOTelAttributes} on the link.
//      */
//     attributes?: IOTelAttributes;

//     /**
//      * Count of attributes of the link that were dropped due to collection limits
//      */
//     droppedAttributesCount?: number;
//   }
