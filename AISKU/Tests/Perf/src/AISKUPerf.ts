export class AppInsightsInitPerfTestClass {

    public version: string;
    public perfEventsBuffer: any[];
    public perfEventWaitBuffer: any[];
    public testPostfix: string;
    public INTERNAL_TENANT_KEY: string = "INTERNAL_TENANT_KEY";
    public doFlush: boolean;
    public snippetStartTime: number;
    public skuName: string = "AppInsights";
    public loadScriptOnInit: () => void;
    public flush: () => void;
    public sku: any = null;
    public hasPerfMgr: boolean;

    constructor(ver?: string) {
        /**
         * Default current version is 2.7.1
         * should update version after new release
         * version with doperf(): after 2.5.6
         * */
        var defaultVer = "2.8.18";
        this.version = ver? ver:this._getQueryParameterVersion(defaultVer); 
        this.perfEventsBuffer = [];
        this.perfEventWaitBuffer = [];
        this.testPostfix = Math.random().toString(36).slice(6);
        this.doFlush = false;
        this.snippetStartTime = 0;
        this.hasPerfMgr = this.version <= "2.5.6"? false:true;
    }

    protected _getQueryParameterVersion(defaultVer: string): string {
        var version = defaultVer;
        var location = window.location.search;
        var queryParameter = new URLSearchParams(location);
        let queryVer = queryParameter.get("version");
        if (queryVer && queryVer.length > 0) { version = queryVer;}
        return version;
    }
}