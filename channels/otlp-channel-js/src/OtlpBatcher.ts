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
     * Stable record identifiers used by persistent storage.
     */
    ids: string[];

    /**
     * UTF-8 byte length for each serialized fragment.
     */
    fragmentBytes: number[];

    /**
     * The total number of bytes of the serialized records, maintained incrementally.
     */
    bytes: number;

    /**
     * The number of times sending this batch has been attempted.
     */
    attempts: number;
}

export interface IOtlpStoredRecord {
    id: string;
    signal: eOtlpSignal;
    resourceInfo: IOtlpResourceInfo;
    fragment: string;
    bytes: number;
    item: ITelemetryItem;
    attempts: number;
}

export interface IOtlpDroppedRecords {
    ids: string[];
    items: ITelemetryItem[];
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
    spanIds: string[];
    logIds: string[];
    spanRecordBytes: number[];
    logRecordBytes: number[];
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
     * @returns The persistent representation that was added to the buffer.
     */
    public add(resourceInfo: IOtlpResourceInfo, record: IOtlpRecord, item?: ITelemetryItem, id?: string): IOtlpStoredRecord {
        let json = isNullOrUndefined(record.json) ? safeStringify(record.record) : record.json;
        let stored = {
            id: id,
            signal: record.signal,
            resourceInfo: resourceInfo,
            fragment: json,
            bytes: _utf8ByteLength(json),
            item: item,
            attempts: 0
        };
        this.addStored(stored);
        return stored;
    }

    /**
     * Restores an already serialized record, normally from persistent storage.
     */
    public addStored(record: IOtlpStoredRecord): number {
        let resourceInfo = record.resourceInfo;
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
                spanIds: [],
                logIds: [],
                spanRecordBytes: [],
                logRecordBytes: [],
                spanBytes: 0,
                logBytes: 0
            };

            this._order.push(key);
        }

        let json = record.fragment;
        let bytes = record.bytes || _utf8ByteLength(json);

        if (record.signal === eOtlpSignal.Span) {
            bucket.spans.push(json);
            bucket.spanItems.push(record.item);
            bucket.spanAttempts.push(record.attempts || 0);
            bucket.spanIds.push(record.id);
            bucket.spanRecordBytes.push(bytes);
            bucket.spanBytes += bytes;
        } else {
            bucket.logs.push(json);
            bucket.logItems.push(record.item);
            bucket.logAttempts.push(record.attempts || 0);
            bucket.logIds.push(record.id);
            bucket.logRecordBytes.push(bytes);
            bucket.logBytes += bytes;
        }

        this._count++;
        this._bytes += bytes;

        return bytes;
    }

    /**
     * Returns a persistent representation of all currently buffered records.
     */
    public getRecords(): IOtlpStoredRecord[] {
        let records: IOtlpStoredRecord[] = [];
        arrForEach(this._order, (key) => {
            let bucket = this._buckets[key];
            if (bucket) {
                _appendRecords(records, bucket, eOtlpSignal.Span);
                _appendRecords(records, bucket, eOtlpSignal.Log);
            }
        });
        return records;
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
                bucket.spanIds, bucket.spanRecordBytes, maxRecords, maxBytes);
            _split(batches, bucket.resourceInfo, eOtlpSignal.Log, bucket.logs, bucket.logItems, bucket.logAttempts,
                bucket.logIds, bucket.logRecordBytes, maxRecords, maxBytes);
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
                spanIds: [],
                logIds: [],
                spanRecordBytes: [],
                logRecordBytes: [],
                spanBytes: 0,
                logBytes: 0
            };

            this._order.push(key);
        }

        let target = batch.signal === eOtlpSignal.Span ? bucket.spans : bucket.logs;
        let targetItems = batch.signal === eOtlpSignal.Span ? bucket.spanItems : bucket.logItems;
        let targetAttempts = batch.signal === eOtlpSignal.Span ? bucket.spanAttempts : bucket.logAttempts;
        let targetIds = batch.signal === eOtlpSignal.Span ? bucket.spanIds : bucket.logIds;
        let targetRecordBytes = batch.signal === eOtlpSignal.Span ? bucket.spanRecordBytes : bucket.logRecordBytes;
        // unshift the whole batch back to the front, preserving the original ordering
        for (let lp = batch.fragments.length - 1; lp >= 0; lp--) {
            target.unshift(batch.fragments[lp]);
            targetItems.unshift(batch.items[lp]);
            targetAttempts.unshift(batch.attempts);
            targetIds.unshift(batch.ids[lp]);
            targetRecordBytes.unshift(batch.fragmentBytes[lp]);
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
    public dropOldest(dropCount: number): IOtlpDroppedRecords {
        let dropped: IOtlpDroppedRecords = { ids: [], items: [] };
        let buckets = this._buckets;
        let order = this._order;

        for (let idx = 0; idx < order.length && dropped.items.length < dropCount; idx++) {
            let bucket = buckets[order[idx]];
            if (!bucket) {
                continue;
            }

            _appendDropped(dropped, this._dropFrom(bucket, true, dropCount - dropped.items.length));
            if (dropped.items.length < dropCount) {
                _appendDropped(dropped, this._dropFrom(bucket, false, dropCount - dropped.items.length));
            }
        }

        return dropped;
    }

    private _dropFrom(bucket: IOtlpBucket, isSpan: boolean, dropCount: number): IOtlpDroppedRecords {
        let target = isSpan ? bucket.spans : bucket.logs;
        let targetItems = isSpan ? bucket.spanItems : bucket.logItems;
        let targetAttempts = isSpan ? bucket.spanAttempts : bucket.logAttempts;
        let targetIds = isSpan ? bucket.spanIds : bucket.logIds;
        let targetRecordBytes = isSpan ? bucket.spanRecordBytes : bucket.logRecordBytes;
        let dropped: IOtlpDroppedRecords = { ids: [], items: [] };

        while (dropped.items.length < dropCount && target.length) {
            target.shift();
            dropped.items.push(targetItems.shift());
            dropped.ids.push(targetIds.shift());
            targetAttempts.shift();
            let bytes = targetRecordBytes.shift();
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
    items: ITelemetryItem[], attempts: number[], ids: string[], fragmentBytes: number[], maxRecords: number, maxBytes: number): void {
    if (!fragments.length) {
        return;
    }

    let current: string[] = [];
    let currentItems: ITelemetryItem[] = [];
    let currentIds: string[] = [];
    let currentFragmentBytes: number[] = [];
    let currentBytes = 0;
    let currentAttempts = 0;
    let payloadOverhead = _payloadOverhead(resourceInfo, signal);

    arrForEach(fragments, (fragment, idx) => {
        let bytes = fragmentBytes[idx];
        let wouldExceed = (maxRecords > 0 && current.length >= maxRecords) ||
            (maxBytes > 0 && current.length > 0 &&
                (payloadOverhead + currentBytes + bytes + current.length) > maxBytes) ||
            (current.length > 0 && currentAttempts !== attempts[idx]);

        if (wouldExceed) {
            batches.push({
                signal: signal,
                resourceInfo: resourceInfo,
                fragments: current,
                items: currentItems,
                ids: currentIds,
                fragmentBytes: currentFragmentBytes,
                bytes: currentBytes,
                attempts: currentAttempts
            });
            current = [];
            currentItems = [];
            currentIds = [];
            currentFragmentBytes = [];
            currentBytes = 0;
        }

        if (!current.length) {
            currentAttempts = attempts[idx] || 0;
        }
        current.push(fragment);
        currentItems.push(items[idx]);
        currentIds.push(ids[idx]);
        currentFragmentBytes.push(bytes);
        currentBytes += bytes;
    });

    if (current.length) {
        batches.push({
            signal: signal,
            resourceInfo: resourceInfo,
            fragments: current,
            items: currentItems,
            ids: currentIds,
            fragmentBytes: currentFragmentBytes,
            bytes: currentBytes,
            attempts: currentAttempts
        });
    }
}

function _payloadOverhead(resourceInfo: IOtlpResourceInfo, signal: eOtlpSignal): number {
    let isSpan = signal === eOtlpSignal.Span;
    let resourceKey = isSpan ? "resourceSpans" : "resourceLogs";
    let scopeKey = isSpan ? "scopeSpans" : "scopeLogs";
    let recordKey = isSpan ? "spans" : "logRecords";
    return _utf8ByteLength("{\"" + resourceKey + "\":[{\"resource\":" + resourceInfo.resourceJson +
        ",\"" + scopeKey + "\":[{\"scope\":" + resourceInfo.scopeJson +
        ",\"" + recordKey + "\":[]}]}]}");
}

function _utf8ByteLength(value: string): number {
    let bytes = 0;
    for (let lp = 0; lp < value.length; lp++) {
        let code = value.charCodeAt(lp);
        if (code < 0x80) {
            bytes++;
        } else if (code < 0x800) {
            bytes += 2;
        } else if (code >= 0xD800 && code <= 0xDBFF && lp + 1 < value.length) {
            let next = value.charCodeAt(lp + 1);
            if (next >= 0xDC00 && next <= 0xDFFF) {
                bytes += 4;
                lp++;
            } else {
                bytes += 3;
            }
        } else {
            bytes += 3;
        }
    }
    return bytes;
}

function _appendRecords(records: IOtlpStoredRecord[], bucket: IOtlpBucket, signal: eOtlpSignal): void {
    let fragments = signal === eOtlpSignal.Span ? bucket.spans : bucket.logs;
    let items = signal === eOtlpSignal.Span ? bucket.spanItems : bucket.logItems;
    let attempts = signal === eOtlpSignal.Span ? bucket.spanAttempts : bucket.logAttempts;
    let ids = signal === eOtlpSignal.Span ? bucket.spanIds : bucket.logIds;
    let recordBytes = signal === eOtlpSignal.Span ? bucket.spanRecordBytes : bucket.logRecordBytes;
    arrForEach(fragments, (fragment, idx) => {
        records.push({
            id: ids[idx],
            signal: signal,
            resourceInfo: bucket.resourceInfo,
            fragment: fragment,
            bytes: recordBytes[idx],
            item: items[idx],
            attempts: attempts[idx]
        });
    });
}

function _appendDropped(target: IOtlpDroppedRecords, source: IOtlpDroppedRecords): void {
    target.ids = target.ids.concat(source.ids);
    target.items = target.items.concat(source.items);
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
