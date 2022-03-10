// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// Note: DON'T Export these const from the package as we are still targeting ES3 this will export a mutable variables that someone could change!!!

export const strEmpty = "";
export const strProcessTelemetry = "processTelemetry";
export const strPriority = "priority";
export const strSetNextPlugin = "setNextPlugin";
export const strIsInitialized = "isInitialized";
export const strTeardown = "teardown";
export const strCore = "core";
export const strUpdate = "update";
export const strDisabled = "disabled";
export const strDoTeardown = "_doTeardown";
export const strProcessNext = "processNext";
export const strResume = "resume";
export const strPause = "pause";
export const strNotificationListener = "NotificationListener";
export const strAddNotificationListener = "add" + strNotificationListener;
export const strRemoveNotificationListener = "remove" + strNotificationListener;

export const strEventsSent = "eventsSent";
export const strEventsDiscarded = "eventsDiscarded";
export const strEventsSendRequest = "eventsSendRequest";
export const strPerfEvent = "perfEvent";
