// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IOTelBaggageEntry } from "./IOTelBaggageEntry";

/**
 * Provides an OpenTelemetry compatible Interface for the Open Telemetry Api (1.9.0) Baggage
 * type. Where Baggage is a collection of key-value pairs with optional metadata.
 * Each key of Baggage is associated with exactly one value.
 * Baggage may be used to annotate and enrich telemetry data.
 */
export interface IOTelBaggage {
    /**
     * Get an entry from Baggage if it exists
     *
     * @param key - The key which identifies the BaggageEntry
     * @returns The IOTelBaggageEntry if it exists, otherwise undefined
     */
    getEntry(key: string): IOTelBaggageEntry | undefined;

    /**
     * Get a list of all entries in the Baggage
     */
    getAllEntries(): [string, IOTelBaggageEntry][];

    /**
     * Returns a new baggage with the entries from the current bag and the specified entry
     *
     * @param key - string which identifies the baggage entry
     * @param entry - IOTelBaggageEntry for the given key
     * @returns a new IOTelBaggage instance with the entry added
     */
    setEntry(key: string, entry: IOTelBaggageEntry): IOTelBaggage;

    /**
     * Returns a new baggage with the entries from the current bag except the removed entry
     *
     * @param key - key identifying the entry to be removed
     * @returns a new IOTelBaggage instance with the entry removed
     */
    removeEntry(key: string): IOTelBaggage;

    /**
     * Returns a new baggage with the entries from the current bag except the removed entries
     *
     * @param key - keys identifying the entries to be removed
     * @returns a new IOTelBaggage instance with the entries removed
     */
    removeEntries(...key: string[]): IOTelBaggage;

    /**
     * Returns a new baggage with no entries
     */
    clear(): IOTelBaggage;
}
