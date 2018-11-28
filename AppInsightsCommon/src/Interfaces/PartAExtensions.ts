import { ContextTagKeys } from '../Interfaces/Contracts/Generated/ContextTagKeys';

export interface UserExt {
    id?: string;
    localId?: string;
    authId?: string;
}

export class PartAExtensions {
    public UserExtensionName:string = "User";
    public WebExtensionName = "Web";
    public AppExtensionName = "App";

    // Tag map for 2.1
    public userTagsKeysMap: { [key: string]: any };
    public userExtKeysMap: { [key: string]: any };

    // Approved tags in 4.0
    public accountIdTag = "User.AccountId";

    public ctxKeys: {
    // Approved user ctx
        id: string;
        authId: string;
        localId: string;
    }

    constructor(mapTags: ContextTagKeys) {
        this.userTagsKeysMap = {};
        // user.tags mapping
        this.userTagsKeysMap[this.accountIdTag] = mapTags.userAccountId;
        this.ctxKeys = { id: "id", authId: "authId", localId: "localId" };

        // user.ctx mapping
        this.userExtKeysMap = {};
        this.userExtKeysMap[this.ctxKeys.localId] = mapTags.userId;
        this.userExtKeysMap[this.ctxKeys.authId] = mapTags.userAuthUserId;
    }
}

export interface WebExt {
    domain?: string;
    browser?: string;
    browserVer?: string;
    browserLang?: string;
    userConsent?: string;
    isManual?: string;
    screenRes?: string;
}

export interface AppExt {
    sesId?: string;
}

var kys = new ContextTagKeys();
export var partAExtensions = new PartAExtensions(kys); // export global instance
