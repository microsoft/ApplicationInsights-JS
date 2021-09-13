import { Assert } from "@microsoft/ai-test-framework";
export class AppInsightsInitPerfTestClass{

    public version: string;
    public perfEventsBuffer: any[];
    public perfEventWaitBuffer: any[];
    public testPostfix: string;
    protected TENANT_KEY: string = "TENANT_KEY";
    protected INTERNAL_TENANT_KEY: string = "INTERNAL_TENANT_KEY";
    protected doFlush: boolean;
    public snippetStartTime: number;
    public skuName: string = "AppInsights";

    constructor(ver?: string) {
        /**
         * Default current version is 2
         * should update version after new release
         * */
        var defaultVer = "2";
        this.version = ver? ver:this.getQueryParameterVersion(defaultVer); 
        this.perfEventsBuffer = [];
        this.perfEventWaitBuffer = [];
        this.testPostfix = Math.random().toString(36).slice(6);
        this.doFlush = false;
        this.snippetStartTime = 0;
    }

    public startTest(): void {
        this._loadSnippet();
    }

    public addPerfEvents() {
        this._addMemoryPerfEvent();
    }

    public flush(): void {
        this._sendAllPerfEvents();
    }

    public loadScriptOnInit(): void {
        var snippetLoadingEndTime = performance.now();
        Assert.ok(true,"Analytics script loaded");
      
        this._addSnippetLoadingTimeEvent(snippetLoadingEndTime);
        let appInsights = window["appInsights"];
        let notificationManager = appInsights.core.getNotifyMgr() || appInsights.core["_notificationManager"];
        notificationManager.addNotificationListener({
            perfEvent: (perfEvent: any) => {
                this._parseAppInsightsPerfEvent(perfEvent,this.skuName);
        }});
        this.addPerfEvents();
        setTimeout(() => {
            this.flush();
        }, 1500);
    }

    public getScriptSrc(): string {
        return `https://js.monitor.azure.com/scripts/b/ai.${this.version}.min.js?${this.testPostfix}`;
    }

    protected _parseAppInsightsPerfEvent(perfEvent: any, skuName: string): void{
        let payloadItem = perfEvent["payload"]?.item;
        if (perfEvent["time"] && payloadItem && payloadItem["baseType"] !== "MessageData") {
            let baseType = payloadItem["baseType"];
            let duration = perfEvent["time"];
            let event =  {
                name: "SDKPerfTest",
                iKey: this.TENANT_KEY,
                ver: "4.0",
                ext: {},
                baseData: {
                  testName:`${skuName}-${baseType}`,
                  sku:skuName,
                  version:this.version,
                  unitOfMeasure: "ms", 
                  metric:"ProcessTime",
                  value:  duration
                }
            }
            this._pushPerfEvents(event);
        }
    }

    protected _parseOneDsPerfEvent(perfEvent: any,skuName: string): void {
        if(perfEvent?.name == "HttpManager:_sendBatchesNotification") {
            var events = perfEvent.payload?.batches[0].evts
            if (events?.length) {
                events.forEach((element: any)  => {
                    let event =  {
                        name: "SDKPerfTest",
                        iKey: this.TENANT_KEY,
                        ver: "4.0",
                        ext: {},
                        baseData: {
                          testName:element.name,
                          sku:skuName,
                          version:this.version,
                          unitOfMeasure: "ms", 
                          metric:"ProcessTime",
                          value:  element.timings
                        }
                    }
                    this._pushPerfEvents(event);
                }); 
            } 
        }
    }

    protected getQueryParameterVersion(defaultVer: string): string {
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

    protected _pushPerfEvents(event: any): void {
        if (!this.doFlush) {
            this.perfEventsBuffer.push(event);
        }
        else {
            this.perfEventWaitBuffer.push(event);
        }
    }

    protected _sendAllPerfEvents(): void {
        this.doFlush = true;
        this.perfEventsBuffer.forEach((event) => {
            if (event.baseData) {this._sendEventWithCollectorUrl(event);}
        })
        this.perfEventsBuffer = this.perfEventWaitBuffer.slice(0);
        this.doFlush = false;
        this.perfEventWaitBuffer = [];
    }

    protected _sendEventWithCollectorUrl(event: any) {
        let oneDS = window["oneDS"];
        const generatedUrl = oneDS.getCollectorUrlGenerator(event);
        let collectorUrlScript = document.createElement('script');
        collectorUrlScript.setAttribute("id", "collectorUrl");
        collectorUrlScript.src=generatedUrl;
        document.head.appendChild(collectorUrlScript);
        collectorUrlScript.onload=collectorUrlScript["onreadystatechange"] = function() {
          console.log("telemetry sent");
        }
    }

    private _addSnippetLoadingTimeEvent(endtime: number): void {
        let rawTime = endtime - this.snippetStartTime;
        var duration = Math.round(rawTime*1000)/1000;
        let event =  {
            name: "SDKPerfTest",
            iKey: this.TENANT_KEY,
            ver: "4.0",
            ext: {},
            baseData: {
              testName:"SDKInit",
              sku:this.skuName,
              version:this.version,
              unitOfMeasure: "ms", 
              metric:"LoadingTime",
              value: duration
            }
        }
        this._pushPerfEvents(event);
        Assert.ok(true,"Analytics-Init: Script LoadingTime: " + duration + " ms added");
        
    }

    private _addMemoryPerfEvent(): void {
        // Currently use usedMemory to estimate script memory usage
        //var maxMemoryUsed = performance["memory"].totalJSHeapSize;
        var memoryUsed = performance["memory"].usedJSHeapSize /1000;
        let event =  {
            name: "SDKPerfTest",
            iKey: this.TENANT_KEY,
            ver: "4.0",
            ext: {},
            baseData: {
              testName:"SDKInit",
              sku:this.skuName,
              version:this.version,
              unitOfMeasure: "KB", 
              metric:"usedJSHeapSize",
              value: memoryUsed
            }
        }
        this._pushPerfEvents(event);
        Assert.ok(true," AppInsightsInit-Init: Script UsedJSHeapSize " + memoryUsed + " KB added");
        
    }

    private _loadSnippet():void {
        var tag = document.createElement("script");
        tag.innerText = this.getSnippet();
        this.snippetStartTime = performance.now();
        document.getElementsByTagName('head')[0].appendChild(tag);
    }

    public getSnippet(): string {
        return `
        !function(T,l,y){var S=T.location,k="script",D="instrumentationKey",C="ingestionendpoint",I="disableExceptionTracking",E="ai.device.",b="toLowerCase",w="crossOrigin",N="POST",e="appInsightsSDK",t=y.name||"appInsights";(y.name||T[e])&&(T[e]=t);var n=T[t]||function(d){var g=!1,f=!1,m={initialize:!0,queue:[],sv:"5",version:2,config:d};function v(e,t){var n={},a="Browser";return n[E+"id"]=a[b](),n[E+"type"]=a,n["ai.operation.name"]=S&&S.pathname||"_unknown_",n["ai.internal.sdkVersion"]="javascript:snippet_"+(m.sv||m.version),{time:function(){var e=new Date;function t(e){var t=""+e;return 1===t.length&&(t="0"+t),t}return e.getUTCFullYear()+"-"+t(1+e.getUTCMonth())+"-"+t(e.getUTCDate())+"T"+t(e.getUTCHours())+":"+t(e.getUTCMinutes())+":"+t(e.getUTCSeconds())+"."+((e.getUTCMilliseconds()/1e3).toFixed(3)+"").slice(2,5)+"Z"}(),iKey:e,name:"Microsoft.ApplicationInsights."+e.replace(/-/g,"")+"."+t,sampleRate:100,tags:n,data:{baseData:{ver:2}}}}var h=d.url||y.src;if(h){function a(e){var t,n,a,i,r,o,s,c,u,p,l;g=!0,m.queue=[],f||(f=!0,t=h,s=function(){var e={},t=d.connectionString;if(t)for(var n=t.split(";"),a=0;a<n.length;a++){var i=n[a].split("=");2===i.length&&(e[i[0][b]()]=i[1])}if(!e[C]){var r=e.endpointsuffix,o=r?e.location:null;e[C]="https://"+(o?o+".":"")+"dc."+(r||"services.visualstudio.com")}return e}(),c=s[D]||d[D]||"",u=s[C],p=u?u+"/v2/track":d.endpointUrl,(l=[]).push((n="SDK LOAD Failure: Failed to load Application Insights SDK script (See stack for details)",a=t,i=p,(o=(r=v(c,"Exception")).data).baseType="ExceptionData",o.baseData.exceptions=[{typeName:"SDKLoadFailed",message:n.replace(/\./g,"-"),hasFullStack:!1,stack:n+"\nSnippet failed to load ["+a+"] -- Telemetry is disabled\nHelp Link: https://go.microsoft.com/fwlink/?linkid=2128109\nHost: "+(S&&S.pathname||"_unknown_")+"\nEndpoint: "+i,parsedStack:[]}],r)),l.push(function(e,t,n,a){var i=v(c,"Message"),r=i.data;r.baseType="MessageData";var o=r.baseData;return o.message='AI (Internal): 99 message:"'+("SDK LOAD Failure: Failed to load Application Insights SDK script (See stack for details) ("+n+")").replace(/\"/g,"")+'"',o.properties={endpoint:a},i}(0,0,t,p)),function(e,t){if(JSON){var n=T.fetch;if(n&&!y.useXhr)n(t,{method:N,body:JSON.stringify(e),mode:"cors"});else if(XMLHttpRequest){var a=new XMLHttpRequest;a.open(N,t),a.setRequestHeader("Content-type","application/json"),a.send(JSON.stringify(e))}}}(l,p))}function i(e,t){f||setTimeout(function(){!t&&m.core||a()},500)}var e=function(){var n=l.createElement(k);n.src=h;var e=y[w];return!e&&""!==e||"undefined"==n[w]||(n[w]=e),n.onload=i,n.onerror=a,n.onreadystatechange=function(e,t){"loaded"!==n.readyState&&"complete"!==n.readyState||i(0,t)},n}();y.ld<0?l.getElementsByTagName("head")[0].appendChild(e):setTimeout(function(){l.getElementsByTagName(k)[0].parentNode.appendChild(e)},y.ld||0)}try{m.cookie=l.cookie}catch(p){}function t(e){for(;e.length;)!function(t){m[t]=function(){var e=arguments;g||m.queue.push(function(){m[t].apply(m,e)})}}(e.pop())}var n="track",r="TrackPage",o="TrackEvent";t([n+"Event",n+"PageView",n+"Exception",n+"Trace",n+"DependencyData",n+"Metric",n+"PageViewPerformance","start"+r,"stop"+r,"start"+o,"stop"+o,"addTelemetryInitializer","setAuthenticatedUserContext","clearAuthenticatedUserContext","flush"]),m.SeverityLevel={Verbose:0,Information:1,Warning:2,Error:3,Critical:4};var s=(d.extensionConfig||{}).ApplicationInsightsAnalytics||{};if(!0!==d[I]&&!0!==s[I]){var c="onerror";t(["_"+c]);var u=T[c];T[c]=function(e,t,n,a,i){var r=u&&u(e,t,n,a,i);return!0!==r&&m["_"+c]({message:e,url:t,lineNumber:n,columnNumber:a,error:i}),r},d.autoExceptionInstrumented=!0}return m}(y.cfg);function a(){y.onInit&&y.onInit(n)}(T[t]=n).queue&&0===n.queue.length?(n.queue.push(a),n.trackPageView({})):a()}(window,document,{
                    src: "https://js.monitor.azure.com/scripts/b/ai.${this.version}.min.js?${this.testPostfix}",
                    crossOrigin: "anonymous", 
                    onInit: function (appInsights) {
                       console.log("loaded");
                       loadScriptOnInit();
                      },
                    cfg: { 
                        instrumentationKey: "key",
                        enablePerfMgr: true,
                        extensionConfig: {}
                  }});`
    }

}

export const appInsightsInitPerftest = new AppInsightsInitPerfTestClass();
window["appInsightsInitPerftest"] = appInsightsInitPerftest;
window["loadScriptOnInit"] = () => {return appInsightsInitPerftest.loadScriptOnInit();}