import { ContextTagKeys } from "./Contracts/Generated/ContextTagKeys";

export class Extensions {
    public static UserExt = "user";
    public static DeviceExt = "device";
    public static TraceExt = "trace";
    public static WebExt = "web";
    public static AppExt = "app";
    public static OSExt = "os";
    public static IngestExt = "ingest";
    public static SessionExt = "ses";
}

export class WebExtensionKeys {
    public static domain = "domain";
    public static browser = "browser";
    public static browserVer = "browserVer";
    public static browserLang = "browserLang";
    public static userConsent = "userConsent";
    public static isManual = "isManual";
    public static screenRes = "screenRes";
}

export class DeviceExtensionKeys {
    public static localId = "localId";
    public static model = "model";
    public static deviceType = "class";
}

export class AppExtensionKeys {
    public static sessionId = "app.sesId";
}

export class UserExtensionKeys {
    public static id = "id";
    public static authId = "authId";
    public static localId = "localId";
}

export class UserTagKeys {
    public static accountId = "user.accountId"; // account id is under user tags CS 4.0
}

export class IngestExtKeys {
    public static clientIp = "clientIp";
}

export class OSExtKeys {
    public static deviceOS = "name";
}

export class TraceExtensionKeys {
    public static traceID: "traceID";
    public static parentID: "parentID";
    public static traceState: "traceState";
}

export class UnmappedKeys {
    public static sessionIsFirst = "ai.session.isFirst";
    public static sessionIsNew = "ai.session.isNew";
    public static userAccountAcquisitionDate = "ai.user.accountAcquisitionDate";
    public static userStoreRegion = "ai.user.storeRegion";
    public static userAnonymousUserAcquisitionDate = "ai.user.anonUserAcquisitionDate";
    public static userAuthenticatedUserAcquisitionDate = "ai.user.authUserAcquisitionDate";

    public static cloudName = "ai.cloud.name";
    public static cloudRole = "ai.cloud.role";
    public static cloudRoleVer = "ai.cloud.roleVer";
    public static cloudRoleInstance = "ai.cloud.roleInstance";
    public static cloudEnvironment = "ai.cloud.environment";
    public static cloudLocation = "ai.cloud.location";
    public static cloudDeploymentUnit = "ai.cloud.deploymentUnit";
    public static internalNodeName = "ai.internal.nodeName";
    public static internalSdkVersion = "ai.internal.sdkVersion";
    public static internalAgentVersion = "ai.internal.agentVersion";
    public static deviceOEMName = "ai.device.oemName";
    public static deviceNetwork = "ai.device.network";
    public static applicationVersion = "ai.application.ver";
    public static applicationBuild = "ai.application.build";
    public static deviceLocale = "ai.device.locale";
    public static deviceOSVersion = "ai.device.osVersion";
    public static locationIp = "ai.location.ip";
    public static operationId = "ai.operation.id"; // not yet closed in CS 4.0
    public static operationParentId = "ai.operation.parentId"; // not yet closed in CS 4.0
    public static operationName: "ai.operation.name"; // not yet closed in CS 4.0
    public static operationRootId = "ai.operation.rootId"; // not yet closed in CS 4.0
    public static operationSyntheticSource = "ai.operation.syntheticSource"; // not yet closed in CS 4.0
}

export var CtxTagKeys = new ContextTagKeys();