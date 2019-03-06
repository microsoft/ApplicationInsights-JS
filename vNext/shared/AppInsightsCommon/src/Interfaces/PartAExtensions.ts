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

export class AppExtensionKeys {
    public static sessionId = "sesId";
}

export class UserExtensionKeys {
    public static id = "id";
    public static authId = "authId";
    public static localId = "localId";
}

export class LegacyKeys {
    public static sessionIsFirst = "ai.session.isFirst";
    public static sessionIsNew = "ai.session.isNew";
    public static userAccountAcquisitionDate = "ai.user.accountAcquisitionDate";
    public static userAnonymousUserAcquisitionDate = "ai.user.anonUserAcquisitionDate";
    public static userAuthenticatedUserAcquisitionDate = "ai.user.authUserAcquisitionDate";
    public static accountId = "ai.user.accountId";

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
    public static operationId = "ai.operation.id";
    public static operationParentId = "ai.operation.parentId";
    public static operationName: "ai.operation.name";
    public static operationRootId = "ai.operation.rootId";
    public static operationSyntheticSource = "ai.operation.syntheticSource";
}

export var CtxTagKeys = new ContextTagKeys();