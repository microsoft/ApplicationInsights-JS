import { ContextTagKeys } from "./Contracts/Generated/ContextTagKeys";

export class WebExtensionKeys {
    public static domain = "domain";
    public static browser = "web.browser";
    public static browserVer = "web.browserVer";
    public static browserLang = "web.browserLang";
    public static userConsent = "web.userConsent";
    public static isManual = "web.isManual";
    public static screenRes = "web.screenRes";
}

export class DeviceExtensionKeys {
    public static localId = "device.localId";
    public static model = "device.model";
    public static deviceType = "device.class";
}

export class AppExtensionKeys {
    public static sessionId = "app.sesId";
}

export class UserExtensionKeys {
    public static id = "user.id";
    public static authId = "authId";
    public static localId = "localId";
}

export class UserTagKeys {
    public static accountId = "user.accountId"; // account id is under user tags CS 4.0
}

export class IngestExtKeys {
    public static clientIp = "ingest.clientIp";
}

export class OSExtKeys {
    public static deviceOS = "os.name";
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