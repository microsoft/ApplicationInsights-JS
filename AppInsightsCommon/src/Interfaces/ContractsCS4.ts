import { ContextTagKeys } from '../applicationinsights-common';

export class PartAExtensions {
    public user?: UserExt;
    public web?: WebExt;
    public app?: AppExt;
    // public os?: OSExt;
    // public device?: DeviceExt;

}

export interface UserExt {
    id?: string;
    authId?: string; 
    localId?: string;
}

export class UserTags implements UserExt {
    public id?: string;
    public authId?: string; 
    public localId?: string;
    public static ExtensionName:string = "User";

    // Tag map for 2.1    
    public tagsKeysMap: {[key: string]: any}
    
    // Approved tags in 4.0
    public static tags = {"AccountId": "AccountId" }; 

    constructor(mapTags: ContextTagKeys) {
        this.tagsKeysMap = {};
        this.tagsKeysMap[UserTags.tags.AccountId] = mapTags.userAccountId;
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

    public static ExtensionName = "Web";
}

export class AppExt {
    sesId?: string;
    public static ExtensionName = "App";
}

// export class DeviceExt {
    
// }

// export class OSExt {

// }