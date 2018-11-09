import { ContextTagKeys } from './Contracts/Generated/ContextTagKeys';

export class ContextTagKeysCS4 extends ContextTagKeys {

    public get User(): string {
        return "User";
    }

    public get Session(): string {
        return "Session";
    }

    constructor() {
        super();
        this.userId = "localId";
        this.userAuthUserId = "authId";
        this.sessionId = "sesId";

        /*
        Following part a fields are setup in breeze
            this.deviceBrowser = "ai.device.browser";
            this.deviceBrowserVersion = "ai.device.browserVersion";
            this.deviceScreenResolution = "ai.device.screenResolution";
        */
    }
}