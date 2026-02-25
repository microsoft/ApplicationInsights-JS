// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ContextTagKeys } from "./contracts/ContextTagKeys";

export const Extensions = {
    UserExt: "user",
    DeviceExt: "device",
    TraceExt: "trace",
    WebExt: "web",
    AppExt: "app",
    OSExt: "os",
    SessionExt: "ses",
    SDKExt: "sdk"
};

export let CtxTagKeys = (/* #__PURE__ */ new ContextTagKeys());