// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IConfiguration, IDataEventTypeCondition } from "./IConfiguration";

export const defaultSessionId: string[] = ["tags['ai.session.id']", "ext.app.sesId"];

export const defaultDataEventTypes: IDataEventTypeCondition[] = [
    {
        dataEventType: "performance",
        fieldName: "name",
        fieldValue: "Notification:perfEvent*"
    },
    {
        dataEventType: "warning",
        fieldName: "name",
        fieldValue: "Notification:eventsDiscarded*"
    },
    {
        dataEventType: "appLogic",
        fieldName: "name",
        fieldValue: "Notification:events*"
    },
    {
        dataEventType: "fatalError",
        fieldName: "name",
        fieldValue: "diagLog:throw*"
    },
    {
        dataEventType: "warning",
        fieldName: "name",
        fieldValue: "diagLog:warn*"
    },
    {
        dataEventType: "fatalError",
        fieldName: "name",
        fieldValue: "diagLog:error*"
    },
    {
        dataEventType: "warning",
        fieldName: "data.eventType",
        fieldValue: "Warning"
    },
    {
        dataEventType: "fatalError",
        fieldName: "data.baseType",
        fieldValue: "ExceptionData"
    },
    {
        dataEventType: "appLogic",
        fieldName: "data.eventType",
        fieldValue: "ApplicationLogic"
    },
    {
        dataEventType: "performance",
        fieldName: "data.baseType",
        fieldValue: "PageviewPerformanceData"
    },
    {
        dataEventType: "performance",
        fieldName: "data.baseType",
        fieldValue: "PageviewPerformanceData"
    }
];

export const defaultExcludeFromCondensedList = [
    "tags['ai.user.id']",
    "tags['ai.session.id']",
    "tags['ai.device.id']",
    "tags['ai.device.type']",
    "tags['ai.operation.name']",
    "tags['ai.operation.id']",
    "tags['ai.internal.sdkVersion']",
    "tags['ai.internal.snippet']",
    "ext.app",
    "ext.user",
    "ext.web",
    "ext.intweb",
    "ext.loc",
    "ext.metadata",
    "ext.mscv",
    "ext.utc",
    "ext.device",
    "ext.dt"
];

export const defaultConfiguration: IConfiguration = {
    prioritizedDataEventTypeTests: defaultDataEventTypes,
    columnsToDisplay: [
        {
            header: "Session",
            type: "SessionNumber"
        },
        {
            header: "Time",
            type: "NormalData",
            prioritizedFieldNames: [
                {
                    name: "time"
                }
            ]
        },
        {
            header: "ΔT",
            type: "TimeDelta",
            prioritizedFieldNames: [
                {
                    name: "time"
                }
            ]
        },
        {
            header: "Event Name",
            type: "NormalData",
            prioritizedFieldNames: [
                {
                    name: "name"
                }
            ]
        },
        {
            header: "Dynamic Value",
            type: "NormalData",
            prioritizedFieldNames: [
                {
                    name: "data.baseData.message"
                },
                {
                    name: "data.baseData.exceptions[0].message"
                },
                {
                    name: "data.baseData.name"
                },
                {
                    name: "data.baseData.id"
                },
                {
                    name: "data.baseData.metrics[0].name"
                }
            ]
        }
    ],
    fieldsToExcludeFromCondensedList: defaultExcludeFromCondensedList,
    specialFieldNames: {
        sessionId: ""
    }
};
