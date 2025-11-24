// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { createContextManager } from "../api/context/contextManager";
import { IOTelLogRecord } from "../interfaces/logs/IOTelLogRecord";
import { IOTelLogger } from "../interfaces/logs/IOTelLogger";
import { IOTelInstrumentationScope } from "../interfaces/trace/IOTelInstrumentationScope";
import { LoggerProviderSharedState } from "../internal/LoggerProviderSharedState";
import { IOTelLogRecordImpl } from "./IOTelLogRecordImpl";

export class Logger implements IOTelLogger {
    constructor(
    public readonly instrumentationScope: IOTelInstrumentationScope,
    private _sharedState: LoggerProviderSharedState
    ) {}

    public emit(logRecord: IOTelLogRecord): void {
        const contextManager = createContextManager();
        const currentContext = logRecord.context || contextManager.active();
        /**
         * If a Logger was obtained with include_trace_context=true,
         * the LogRecords it emits MUST automatically include the Trace Context from the active Context,
         * if Context has not been explicitly set.
         */
        const logRecordInstance = new IOTelLogRecordImpl(
            this._sharedState,
            this.instrumentationScope,
            {
                context: currentContext,
                ...logRecord
            }
        );
        /**
         * the explicitly passed Context,
         * the current Context, or an empty Context if the Logger was obtained with include_trace_context=false
         */
        this._sharedState.activeProcessor.onEmit(logRecordInstance, currentContext);
        /**
         * A LogRecordProcessor may freely modify logRecord for the duration of the OnEmit call.
         * If logRecord is needed after OnEmit returns (i.e. for asynchronous processing) only reads are permitted.
         */
        logRecordInstance._makeReadonly();
    }
}
