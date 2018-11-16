import { ContextTagKeys } from '../applicationinsights-common';

// export class PartAExtensions {
//     public user?: UserExt;
//     public web?: WebExt;
//     public app?: AppExt;
//     public os?: OSExt;
//     public device?: DeviceExt;
// }

export class UserExt {
    public ExtensionName:string = "User";

    // Tag map for 2.1    
    public tagsKeysMap: { [key: string]: any };
    public ctxKeysMap: { [key: string]: any };

    // Approved tags in 4.0
    public accountIdTag = "AccountId";

    public ctx: {
    // Approved user ctx
        id: string;
        authId: string;
        localId: string;
    }

    constructor(mapTags: ContextTagKeys) {
        this.tagsKeysMap = {};
        this.tagsKeysMap[this.accountIdTag] = mapTags.userAccountId;
        this.ctx = { id: "id", authId: "authId", localId: "localId" };

        this.ctxKeysMap = {};
        this.ctxKeysMap[this.ctx.localId] = mapTags.userId;
        this.ctxKeysMap[this.ctx.authId] = mapTags.userAuthUserId;
    }
}

export class WebExt {
    public domain?: string;
    public browser?: string;
    public browserVer?: string;
    public browserLang?: string;
    public userConsent?: string;
    public isManual?: string;
    public screenRes?: string;
    public ExtensionName = "Web";
}

export class AppExt {
    sesId?: string;
    public ExtensionName = "App";
}

var kys = new ContextTagKeys();
export var UserTagsCS4 = new UserExt(kys);