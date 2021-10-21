// -----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// </copyright>
// -----------------------------------------------------------------------

import { IConfiguration } from "./IConfiguration";

export const defaultConfiguration: IConfiguration = {
  dataSourceType: "Network",
  dataSourceUrls: "https://dc.services.visualstudio.com/v2/track*",
  prioritizedDataEventTypeTests: [
    {
      dataEventType: "warning",
      fieldName: "data.eventType",
      fieldValue: "Warning",
    },
    {
      dataEventType: "fatalError",
      fieldName: "data.eventType",
      fieldValue: "FatalError",
    },
    {
      dataEventType: "appLogic",
      fieldName: "data.eventType",
      fieldValue: "ApplicationLogic",
    },
    {
      dataEventType: "performance",
      fieldName: "data.eventType",
      fieldValue: "Performance",
    },
  ],
  columnsToDisplay: [
    {
      header: "Session",
      type: "SessionNumber",
    },
    {
      header: "Time",
      type: "NormalData",
      prioritizedFieldNames: [
        {
          name: "time",
        },
      ],
    },
    {
      header: "ΔT",
      type: "TimeDelta",
      prioritizedFieldNames: [
        {
          name: "time",
        },
      ],
    },
    {
      header: "Event Name",
      type: "NormalData",
      prioritizedFieldNames: [
        {
          name: "name",
        },
      ],
    },
    {
      header: "Dynamic Value",
      type: "NormalData",
      prioritizedFieldNames: [
        {
          name: "data.baseData.message",
        },
      ],
    },
  ],
  dataValuesToExcludeFromCondensedList: [
    "tags['ai.user.id']",
    "tags['ai.session.id']",
    "tags['ai.device.id']",
    "tags['ai.operation.name']",
    "tags['ai.operation.id']",
    "tags['ai.internal.sdkVersion']",
    "tags['ai.internal.snippet']",
  ],
  specialFieldNames: {
    sessionId: "tags['ai.session.id']",
  },
};
