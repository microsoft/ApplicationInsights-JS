export type ConnectionStringKey = "authorization" | "instrumentationkey" | "ingestionendpoint" | "location" | "endpointsuffix";

export type ConnectionString = { [key in ConnectionStringKey]?: string };