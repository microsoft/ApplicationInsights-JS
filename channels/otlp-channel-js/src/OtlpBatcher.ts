// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ITelemetryItem } from "@microsoft/applicationinsights-core-js";
import { arrForEach, isNullOrUndefined } from "@nevware21/ts-utils";
import { eOtlpSignal } from "./Enums";
import { safeStringify } from "./convert/AttributeBuilder";
import { IOtlpRecord } from "./convert/ItemConverter";
import { IOtlpResourceInfo } from "./convert/ResourceBuilder";

/**
 * A batch of records that are ready to be sent, all of which share a resource and a signal.
 */
export interface IOtlpBatch {
    signal: eOtlpSignal;

    resourceInfo: IOtlpResourceInfo;

    /**
     * The serialized records making up this batch.
     */
    fragments: string[];

    /**
     * The original telemetry items represented by the fragments.
     */
    items: ITelemetryItem[];

    /**
     * The total number of bytes of the serialized records, maintained incrementally.
     */
    bytes: number;

    /**
     * The number of times sending this batch has been attempted.
     */
    attempts: number;
}

/**
 * The buffered records for a single resource.
 */
interface IOtlpBucket {
    resourceInfo: IOtlpResourceInfo;
    spans: string[];
    logs: string[];
    spanItems: ITelemetryItem[];
    logItems: ITelemetryItem[];
    spanAttempts: number[];
    logAttempts: number[];
    spanBytes: number;
    logBytes: number;
}

/**
 * Accumulates converted records, grouped by resource and signal, so that building an export payload
 * requires nothing more than joining strings.
 *
 * @remarks
 * The batcher never sees an `ITelemetryItem`; records are already converted (and normally already
 * serialized) by the time they arrive here. Byte totals are maintained incrementally as records are
 * added so that deciding whether a batch is full is a constant time comparison rather than a walk
 * of the buffer.
 */
export class OtlpBatcher {

    private _buckets: { [key: string]: IOtlpBucket };
    private _order: string[];
    private _count: number;
    private _bytes: number;

    constructor() {
        this._buckets = {};
        this._order = [];
        this._count = 0;
        this._bytes = 0;
    }

    /**
     * Adds a converted record to the buffer.
     * @param resourceInfo - The resource that the record belongs to.
     * @param record - The converted record.
     * @returns The number of bytes that the record added to the buffer.
     */
    public add(resourceInfo: IOtlpResourceInfo, record: IOtlpRecord, item?: ITelemetryItem): number {
        let key = resourceInfo.key;
        let bucket = this._buckets[key];
        if (!bucket) {
            bucket = this._buckets[key] = {
                resourceInfo: resourceInfo,
                spans: [],
                logs: [],
                spanItems: [],
                logItems: [],
                spanAttempts: [],
                logAttempts: [],
                spanBytes: 0,
                logBytes: 0
            };

            this._order.push(key);
        }

        // When the channel is not pre-serializing the record is serialized here instead, which still
        // keeps the cost off the send path.
        let json = isNullOrUndefined(record.json) ? safeStringify(record.record) : record.json;
        let bytes = json.length;

        if (record.signal === eOtlpSignal.Span) {
            bucket.spans.push(json);
            bucket.spanItems.push(item);
            bucket.spanAttempts.push(0);
            bucket.spanBytes += bytes;
        } else {
            bucket.logs.push(json);
            bucket.logItems.push(item);
            bucket.logAttempts.push(0);
            bucket.logBytes += bytes;
        }

        this._count++;
        this._bytes += bytes;

        return bytes;
    }

    /**
     * The number of buffered records.
     */
    public count(): number {
        return this._count;
    }

    /**
     * The total number of bytes of the buffered records.
     */
    public size(): number {
        return this._bytes;
    }

    /**
     * Removes and returns every buffered record as a set of batches, one per resource and signal.
     * @param maxRecords - The maximum number of records to include in a single batch, `0` for no limit.
     * @param maxBytes - The maximum number of bytes to include in a single batch, `0` for no limit.
     * @returns The batches that were removed from the buffer.
     */
    public takeBatches(maxRecords?: number, maxBytes?: number): IOtlpBatch[] {
        let batches: IOtlpBatch[] = [];
        let buckets = this._buckets;
        let order = this._order;

        arrForEach(order, (key) => {
            let bucket = buckets[key];
            if (!bucket) {
                return;
            }

            _split(batches, bucket.resourceInfo, eOtlpSignal.Span, bucket.spans, bucket.spanItems, bucket.spanAttempts,
                maxRecords, maxBytes);
            _split(batches, bucket.resourceInfo, eOtlpSignal.Log, bucket.logs, bucket.logItems, bucket.logAttempts,
                maxRecords, maxBytes);
        });

        this._buckets = {};
        this._order = [];
        this._count = 0;
        this._bytes = 0;

        return batches;
    }

    /**
     * Returns a previously taken batch to the buffer so that it can be retried.
     * @remarks
     * The batch is placed at the head of its bucket so that the oldest records are still sent first.
     * @param batch - The batch to return.
     */
    public requeue(batch: IOtlpBatch): void {
        if (!batch || !batch.fragments.length) {
            return;
        }

        let key = batch.resourceInfo.key;
        let bucket = this._buckets[key];
        if (!bucket) {
            bucket = this._buckets[key] = {
                resourceInfo: batch.resourceInfo,
                spans: [],
                logs: [],
                spanItems: [],
                logItems: [],
                spanAttempts: [],
                logAttempts: [],
                spanBytes: 0,
                logBytes: 0
            };

            this._order.push(key);
        }

        let target = batch.signal === eOtlpSignal.Span ? bucket.spans : bucket.logs;
        let targetItems = batch.signal === eOtlpSignal.Span ? bucket.spanItems : bucket.logItems;
        let targetAttempts = batch.signal === eOtlpSignal.Span ? bucket.spanAttempts : bucket.logAttempts;
        // unshift the whole batch back to the front, preserving the original ordering
        for (let lp = batch.fragments.length - 1; lp >= 0; lp--) {
            target.unshift(batch.fragments[lp]);
            targetItems.unshift(batch.items[lp]);
            targetAttempts.unshift(batch.attempts);
        }

        if (batch.signal === eOtlpSignal.Span) {
            bucket.spanBytes += batch.bytes;
        } else {
            bucket.logBytes += batch.bytes;
        }

        this._count += batch.fragments.length;
        this._bytes += batch.bytes;
    }

    /**
     * Drops the oldest buffered records.
     * @param dropCount - The number of records to drop.
     * @returns The number of records that were actually dropped.
     */
    public dropOldest(dropCount: number): ITelemetryItem[] {
        let dropped: ITelemetryItem[] = [];
        let buckets = this._buckets;
        let order = this._order;

        for (let idx = 0; idx < order.length && dropped.length < dropCount; idx++) {
            let bucket = buckets[order[idx]];
            if (!bucket) {
                continue;
            }

            dropped = dropped.concat(this._dropFrom(bucket, true, dropCount - dropped.length));
            if (dropped.length < dropCount) {
                dropped = dropped.concat(this._dropFrom(bucket, false, dropCount - dropped.length));
            }
        }

        return dropped;
    }

    private _dropFrom(bucket: IOtlpBucket, isSpan: boolean, dropCount: number): ITelemetryItem[] {
        let target = isSpan ? bucket.spans : bucket.logs;
        let targetItems = isSpan ? bucket.spanItems : bucket.logItems;
        let targetAttempts = isSpan ? bucket.spanAttempts : bucket.logAttempts;
        let dropped: ITelemetryItem[] = [];

        while (dropped.length < dropCount && target.length) {
            let removed = target.shift();
            dropped.push(targetItems.shift());
            targetAttempts.shift();
            let bytes = removed.length;
            if (isSpan) {
                bucket.spanBytes -= bytes;
            } else {
                bucket.logBytes -= bytes;
            }

            this._count--;
            this._bytes -= bytes;
        }

        return dropped;
    }
}

function _split(batches: IOtlpBatch[], resourceInfo: IOtlpResourceInfo, signal: eOtlpSignal, fragments: string[],
    items: ITelemetryItem[], attempts: number[], maxRecords: number, maxBytes: number): void {
    if (!fragments.length) {
        return;
    }

    let current: string[] = [];
    let currentItems: ITelemetryItem[] = [];
    let currentBytes = 0;
    let currentAttempts = 0;

    arrForEach(fragments, (fragment, idx) => {
        let bytes = fragment.length;
        let wouldExceed = (maxRecords > 0 && current.length >= maxRecords) ||
            (maxBytes > 0 && current.length > 0 && (currentBytes + bytes) > maxBytes) ||
            (current.length > 0 && currentAttempts !== attempts[idx]);

        if (wouldExceed) {
            batches.push({
                signal: signal,
                resourceInfo: resourceInfo,
                fragments: current,
                items: currentItems,
                bytes: currentBytes,
                attempts: currentAttempts
            });
            current = [];
            currentItems = [];
            currentBytes = 0;
        }

        if (!current.length) {
            currentAttempts = attempts[idx] || 0;
        }
        current.push(fragment);
        currentItems.push(items[idx]);
        currentBytes += bytes;
    });

    if (current.length) {
        batches.push({
            signal: signal,
            resourceInfo: resourceInfo,
            fragments: current,
            items: currentItems,
            bytes: currentBytes,
            attempts: currentAttempts
        });
    }
}

/**
 * Builds the OTLP export payload for a batch.
 *
 * @remarks
 * Every part of the payload other than the records themselves was serialized when the resource was
 * created, so this is a string concatenation and nothing more.
 *
 * @param batch - The batch to serialize.
 * @returns The complete JSON body to POST to the collector.
 */
export function buildPayload(batch: IOtlpBatch): string {
    let info = batch.resourceInfo;
    let isSpan = batch.signal === eOtlpSignal.Span;
    let resourceKey = isSpan ? "resourceSpans" : "resourceLogs";
    let scopeKey = isSpan ? "scopeSpans" : "scopeLogs";
    let recordKey = isSpan ? "spans" : "logRecords";

    return "{\"" + resourceKey + "\":[{\"resource\":" + info.resourceJson +
        ",\"" + scopeKey + "\":[{\"scope\":" + info.scopeJson +
        ",\"" + recordKey + "\":[" + batch.fragments.join(",") + "]}]}]}";
}
