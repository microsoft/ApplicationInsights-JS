// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { createEnumStyle } from "./EnumHelperFuncs";

export const enum eDependencyTypes {
    InProc = "InProc",
    QueueMessage = "Queue Message",
    Sql = "SQL",
    Http = "Http",
    Grpc = "GRPC",
    Wcf = "WCF Service",
}

/**
 * The EventsDiscardedReason enumeration contains a set of values that specify the reason for discarding an event.
 */
export const DependencyTypes = (/* @__PURE__ */ createEnumStyle<typeof eDependencyTypes>({
    /**
     * InProc
     */
    InProc: eDependencyTypes.InProc,

    /**
     * Quene Message
     */
    QueueMessage: eDependencyTypes.QueueMessage,

    /**
     * Sql
     */
    Sql: eDependencyTypes.Sql,

    /**
     * Http
     */
    Http: eDependencyTypes.Http,

    /**
     * Grpc
     */
    Grpc: eDependencyTypes.Grpc,

    /**
     * Wcf
     */
    Wcf: eDependencyTypes.Wcf
}));

export type DependencyTypes = string | eDependencyTypes;