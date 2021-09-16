
export class AppInsightsInitPerfTestClass {

    public version: string;
    public perfEventsBuffer: any[];
    public perfEventWaitBuffer: any[];
    public testPostfix: string;
    public TENANT_KEY: string = "TENANT_KEY";
    public INTERNAL_TENANT_KEY: string = "INTERNAL_TENANT_KEY";
    public doFlush: boolean;
    public snippetStartTime: number;
    public skuName: string = "AppInsights";
    public loadScriptOnInit: () => void;

    constructor(ver?: string) {
        /**
         * Default current version is 2
         * should update version after new release
         * */
        var defaultVer = "2";
        this.version = ver? ver:this._getQueryParameterVersion(defaultVer); 
        this.perfEventsBuffer = [];
        this.perfEventWaitBuffer = [];
        this.testPostfix = Math.random().toString(36).slice(6);
        this.doFlush = false;
        this.snippetStartTime = 0;
    }

    protected _getQueryParameterVersion(defaultVer: string): string {
        var version = defaultVer;
        var queryParameter = window.location.search?.split("=");
        /**
         * Only the very first query parameter field will be used and the rest would be ignored.
         * example: http://example.com?version=2.5.1&ver=3, version will be 2.5.1
         * Query field name can be anything as long as it is the very first field.
         **/
        if (queryParameter?.length > 1) { version = queryParameter[1]; }
        return version;
    }

}


