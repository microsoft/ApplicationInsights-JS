"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CtxTagKeys = exports.Extensions = void 0;
var ContextTagKeys_1 = require("./Contracts/ContextTagKeys");
exports.Extensions = {
    UserExt: "user",
    DeviceExt: "device",
    TraceExt: "trace",
    WebExt: "web",
    AppExt: "app",
    OSExt: "os",
    SessionExt: "ses",
    SDKExt: "sdk"
};
exports.CtxTagKeys = new ContextTagKeys_1.ContextTagKeys();
