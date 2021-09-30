// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { _InternalLogMessage } from "../JavaScriptSDK/DiagnosticLogger";

"use strict"

export interface ILogMessageQueue {
    /**
     * Push items into queue.
     */
    push: (item:_InternalLogMessage) => void;
    
    /**
     * Pop items from queue
     */
    pop: () => _InternalLogMessage;

    /**
     * get size of the queue
     */
    getSize: () => number;

    /**
     * Reset queue
     */
    resetQueue: () => void;
}
