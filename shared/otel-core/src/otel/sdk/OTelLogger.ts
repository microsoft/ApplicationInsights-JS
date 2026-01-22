// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IOTelLogRecord } from "../../interfaces/OTel/logs/IOTelLogRecord";
import { IOTelLogger } from "../../interfaces/OTel/logs/IOTelLogger";
import { IOTelLoggerProviderSharedState } from "../../interfaces/OTel/logs/IOTelLoggerProviderSharedState";
import { IOTelInstrumentationScope } from "../../interfaces/OTel/trace/IOTelInstrumentationScope";
import { createContextManager } from "../api/context/contextManager";
import { createLogRecord } from "./OTelLogRecord";

export function createLogger(
    instrumentationScope: IOTelInstrumentationScope,
    sharedState: IOTelLoggerProviderSharedState
): IOTelLogger & {
    readonly instrumentationScope: IOTelInstrumentationScope;
} {
    function emit(logRecord: IOTelLogRecord): void {
        const contextManager = createContextManager();
        const currentContext = logRecord.context || contextManager.active();
        /**
         * If a Logger was obtained with include_trace_context=true,
         * the LogRecords it emits MUST automatically include the Trace Context from the active Context,
         * if Context has not been explicitly set.
         */
        const logRecordData: IOTelLogRecord = {
            context: currentContext,
            timestamp: logRecord.timestamp,
            observedTimestamp: logRecord.observedTimestamp,
            eventName: logRecord.eventName,
            severityNumber: logRecord.severityNumber,
            severityText: logRecord.severityText,
            body: logRecord.body,
            attributes: logRecord.attributes
        };

        const logRecordInstance = createLogRecord(sharedState, instrumentationScope, logRecordData);
        /**
         * the explicitly passed Context,
         * the current Context, or an empty Context if the Logger was obtained with include_trace_context=false
         */
        sharedState.activeProcessor.onEmit(logRecordInstance, currentContext);
        /**
         * A LogRecordProcessor may freely modify logRecord for the duration of the OnEmit call.
         * If logRecord is needed after OnEmit returns (i.e. for asynchronous processing) only reads are permitted.
         */
        logRecordInstance._makeReadonly();
    }

    return {
        get instrumentationScope(): IOTelInstrumentationScope {
            return instrumentationScope;
        },
        emit
    };
}
