// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
    IDiagnosticLogger, IStorageBuffer, utlCanUseSessionStorage, utlGetSessionStorage, utlSetSessionStorage
} from "@microsoft/applicationinsights-core-js";
import { arrForEach } from "@nevware21/ts-utils";
import { IOtlpChannelConfig } from "./Interfaces/IOtlpChannelConfig";
import { IOtlpBatch, IOtlpStoredRecord } from "./OtlpBatcher";

const BUFFER_KEY = "AI_OTLP_BUFFER_1";
const SENT_BUFFER_KEY = "AI_OTLP_SENT_BUFFER_1";

/**
 * Sender-equivalent session storage for unsent and unacknowledged OTLP records.
 */
export class OtlpSessionStorageBuffer {
    public static MAX_BUFFER_SIZE = 2000;

    private _logger: IDiagnosticLogger;
    private _enabled: boolean;
    private _getItem: (logger: IDiagnosticLogger, name: string) => string;
    private _setItem: (logger: IDiagnosticLogger, name: string, data: string) => boolean;
    private _bufferKey: string;
    private _sentBufferKey: string;
    private _unsent: IOtlpStoredRecord[];
    private _sent: IOtlpStoredRecord[];

    constructor(logger: IDiagnosticLogger, config: IOtlpChannelConfig) {
        this._logger = logger;
        let override = config.bufferOverride as IStorageBuffer;
        this._enabled = !!config.enableSessionStorageBuffer && (!!override || utlCanUseSessionStorage());
        this._getItem = override
            ? (logger, name) => override.getItem(logger, name)
            : utlGetSessionStorage;
        this._setItem = override
            ? (logger, name, data) => override.setItem(logger, name, data)
            : utlSetSessionStorage;

        let prefix = config.namePrefix ? config.namePrefix + "_" : "";
        this._bufferKey = prefix + BUFFER_KEY;
        this._sentBufferKey = prefix + SENT_BUFFER_KEY;
        this._unsent = [];
        this._sent = [];

        if (this._enabled) {
            this._unsent = this._load(this._bufferKey);
            this._sent = this._load(this._sentBufferKey);
            let restored = this.getAllItems().slice(0, OtlpSessionStorageBuffer.MAX_BUFFER_SIZE);
            if (this._writeUnsent(restored)) {
                this._unsent = restored;
                if (this._writeSent([])) {
                    this._sent = [];
                }
            }
        }
    }

    public isEnabled(): boolean {
        return this._enabled;
    }

    public getItems(): IOtlpStoredRecord[] {
        return this.getAllItems();
    }

    public getAllItems(): IOtlpStoredRecord[] {
        return this._dedupe(this._unsent.concat(this._sent));
    }

    public canAdd(): boolean {
        return !this._enabled || this.getAllItems().length < OtlpSessionStorageBuffer.MAX_BUFFER_SIZE;
    }

    public add(record: IOtlpStoredRecord): boolean {
        if (!this._enabled) {
            return true;
        }

        if (!this.canAdd()) {
            return false;
        }

        let nextUnsent = this._unsent.concat([record]);
        if (this._writeUnsent(nextUnsent)) {
            this._unsent = nextUnsent;
            return true;
        }
        return false;
    }

    public markAsSent(batch: IOtlpBatch): void {
        if (!this._enabled) {
            return;
        }

        let idMap = this._idMap(batch.ids);
        let moved: IOtlpStoredRecord[] = [];
        let nextUnsent = this._unsent.filter((record) => {
            if (idMap[record.id]) {
                moved.push(record);
                return false;
            }
            return true;
        });

        if (moved.length !== batch.ids.length) {
            moved = this._batchRecords(batch);
        }

        let nextSent = this._dedupe(this._sent.concat(moved));
        if (this._writeSent(nextSent)) {
            this._sent = nextSent;
            if (this._writeUnsent(nextUnsent)) {
                this._unsent = nextUnsent;
            }
        }
    }

    public clearSent(batch: IOtlpBatch): void {
        if (this._enabled) {
            let idMap = this._idMap(batch.ids);
            let nextSent = this._sent.filter((record) => !idMap[record.id]);
            let nextUnsent = this._unsent.filter((record) => !idMap[record.id]);
            if (this._writeSent(nextSent)) {
                this._sent = nextSent;
            }
            if (this._writeUnsent(nextUnsent)) {
                this._unsent = nextUnsent;
            }
        }
    }

    public requeue(batch: IOtlpBatch): void {
        if (!this._enabled) {
            return;
        }

        let idMap = this._idMap(batch.ids);
        let records = this._sent.filter((record) => !!idMap[record.id]);
        let nextSent = this._sent.filter((record) => !idMap[record.id]);
        if (records.length !== batch.ids.length) {
            records = this._batchRecords(batch);
        }

        arrForEach(records, (record) => {
            record.attempts = batch.attempts;
        });
        let nextUnsent = this._dedupe(records.concat(this._unsent)).slice(0, OtlpSessionStorageBuffer.MAX_BUFFER_SIZE);
        if (this._writeUnsent(nextUnsent)) {
            this._unsent = nextUnsent;
            if (this._writeSent(nextSent)) {
                this._sent = nextSent;
            }
        }
    }

    public remove(ids: string[]): void {
        if (this._enabled && ids.length) {
            let idMap = this._idMap(ids);
            let nextUnsent = this._unsent.filter((record) => !idMap[record.id]);
            let nextSent = this._sent.filter((record) => !idMap[record.id]);
            if (this._writeSent(nextSent)) {
                this._sent = nextSent;
            }
            if (this._writeUnsent(nextUnsent)) {
                this._unsent = nextUnsent;
            }
        }
    }

    public clear(): void {
        this.replace([]);
    }

    public replace(records: IOtlpStoredRecord[]): boolean {
        if (!this._enabled) {
            this._unsent = records.slice(0);
            this._sent = [];
            return true;
        }

        let next = this._dedupe(records).slice(0, OtlpSessionStorageBuffer.MAX_BUFFER_SIZE);
        if (next.length !== records.length || !this._writeUnsent(next)) {
            return false;
        }
        if (!this._writeSent([])) {
            return false;
        }

        this._unsent = next;
        this._sent = [];
        return true;
    }

    private _batchRecords(batch: IOtlpBatch): IOtlpStoredRecord[] {
        let records: IOtlpStoredRecord[] = [];
        arrForEach(batch.fragments, (fragment, idx) => {
            records.push({
                id: batch.ids[idx],
                signal: batch.signal,
                resourceInfo: batch.resourceInfo,
                fragment: fragment,
                bytes: batch.fragmentBytes[idx],
                item: batch.items[idx],
                attempts: batch.attempts
            });
        });
        return records;
    }

    private _load(key: string): IOtlpStoredRecord[] {
        let value = this._getItem(this._logger, key);
        if (value) {
            try {
                let parsed = JSON.parse(value);
                return parsed instanceof Array ? parsed : [];
            } catch (e) {
                // Ignore corrupt persisted data and replace it with a valid empty buffer.
            }
        }
        return [];
    }

    private _writeUnsent(records: IOtlpStoredRecord[]): boolean {
        return this._setItem(this._logger, this._bufferKey, JSON.stringify(records));
    }

    private _writeSent(records: IOtlpStoredRecord[]): boolean {
        return this._setItem(this._logger, this._sentBufferKey, JSON.stringify(records));
    }

    private _dedupe(records: IOtlpStoredRecord[]): IOtlpStoredRecord[] {
        let seen: { [id: string]: boolean } = {};
        return records.filter((record) => {
            if (!record || !record.id || seen[record.id]) {
                return false;
            }
            seen[record.id] = true;
            return true;
        });
    }

    private _idMap(ids: string[]): { [id: string]: boolean } {
        let result: { [id: string]: boolean } = {};
        arrForEach(ids, (id) => {
            result[id] = true;
        });
        return result;
    }
}
