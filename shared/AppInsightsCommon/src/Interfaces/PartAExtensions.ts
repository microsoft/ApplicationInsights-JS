import { ContextTagKeys } from "./Contracts/Generated/ContextTagKeys";

export class Extensions {
    public static UserExt = "user";
    public static DeviceExt = "device";
    public static TraceExt = "trace";
    public static WebExt = "web";
    public static AppExt = "app";
    public static OSExt = "os";
    public static SessionExt = "ses";
    public static SDKExt = "sdk";
}

export let CtxTagKeys = new ContextTagKeys();