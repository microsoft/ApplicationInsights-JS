import { symbolFor } from "@nevware21/ts-utils";

/**
 * Symbol used to make BaggageEntryMetadata an opaque type
 */
export const otelBaggageEntryMetadataSymbol = symbolFor("BaggageEntryMetadata");

/**
 * Serializable Metadata defined by the W3C baggage specification.
 * It currently has no special meaning defined by the OpenTelemetry or W3C.
 */
export type OTelBaggageEntryMetadata = {
    toString(): string;
} & {
    __TYPE__: typeof otelBaggageEntryMetadataSymbol;
};