export type ConnectionStringKey = "authorization" | "instrumentationkey" | "ingestionendpoint" | "liveendpoint" | "location" | "endpointsuffix";

export type ConnectionString = { [key in ConnectionStringKey]?: string };