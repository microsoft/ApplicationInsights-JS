// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IConfiguration } from "./IConfiguration";

export const defaultConfiguration: IConfiguration = {
    dataSourceType: "Network",
    dataSourceUrls: "https://dc.services.visualstudio.com/v2/track*",
    prioritizedDataEventTypeTests: [
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
    ],
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
    fieldsToExcludeFromCondensedList: [
        "tags['ai.user.id']",
        "tags['ai.session.id']",
        "tags['ai.device.id']",
        "tags['ai.device.type']",
        "tags['ai.operation.name']",
        "tags['ai.operation.id']",
        "tags['ai.internal.sdkVersion']",
        "tags['ai.internal.snippet']"
    ],
    specialFieldNames: {
        sessionId: "tags['ai.session.id']"
    }
};
