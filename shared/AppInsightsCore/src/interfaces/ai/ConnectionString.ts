// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export type ConnectionStringKey = "authorization" | "instrumentationkey" | "ingestionendpoint" | "location" | "endpointsuffix";

export type ConnectionString = { [key in ConnectionStringKey]?: string };