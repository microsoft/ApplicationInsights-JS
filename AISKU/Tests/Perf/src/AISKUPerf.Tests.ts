import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import {AppInsightsInitPerfTestClass} from "./AISKUPerf"

export class AISKUPerf extends AITestClass {
    public AISKUPerfTest: AppInsightsInitPerfTestClass;
    protected TENANT_KEY: string = "2252db2e5e344635a36c5f1c04b3902c-eaced1c8-a046-4e8d-8fa8-c1ecf2077a5d-7256";
    public perfMgr: any;
    public doPerf: any;
    public appInsights: any;
    public initialMemoryUsage: number = 0;
    public batchStartTimeMarks: any;
    public memoryUsageMarks: any;
    public perfMgrSrc: any = null;

    public testInitialize() {
        try {
           this.AISKUPerfTest = new AppInsightsInitPerfTestClass();
           this.AISKUPerfTest.loadScriptOnInit = () => {return this._loadScriptOnInit()}
           Assert.ok(window["oneDS"], "oneDS exists");
           Assert.ok(window["Microsoft"]?.ApplicationInsights?.PerfMarkMeasureManager, "perfMgr exists");
           Assert.ok(window["Microsoft"]?.ApplicationInsights?.doPerf, "doPerf exists");
           this.perfMgr = window["Microsoft"].ApplicationInsights.PerfMarkMeasureManager;
           this.doPerf = window["Microsoft"].ApplicationInsights.doPerf;
           window["appInsightsInitPerftest"] = this.AISKUPerfTest;
           this.initialMemoryUsage = performance["memory"]?.usedJSHeapSize;
           this.memoryUsageMarks = {};
           this.batchStartTimeMarks = {};
           if (!this.AISKUPerfTest.hasPerfMgr) {
               this.perfMgrSrc = new this.perfMgr();
               Assert.ok(true, "perfMgrSrc initialized");
           }

        } catch (e) {
            console.error("Failed to initialize AISKUPerf Tests", e);
        }
    }

    public testCleanup() {
    }

    public registerTests() {
        this.addPerfTest();
    }

    constructor() {
        super("AISKUPerfTest");
    }
    
    public addPerfTest(): void {
       
        this.testCaseAsync({
            name: "AppInsights AISKU perf Test",
            stepDelay: 15000,
            steps: [() => {

                Assert.ok(window["appInsightsInitPerftest"], "global appInsightsInitPerftest exists");
                Assert.ok(window["oneDS"], "oneDS exists");
                Assert.ok(this.perfMgr, "perfMgr exists");
                Assert.ok(this.doPerf, "doPerf exists");

                try {
                    this._loadSnippet();
                } catch (e) {
                    Assert.ok(false, "load snippet error: " + e);
                }
                
            }].concat(() => {
               Assert.ok(true, "test version: " + this.AISKUPerfTest.version);
            })
        });
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
            Assert.ok(true,"telemetry sent");
        }
    }

    protected _loadScriptOnInit(): void {
        var snippetLoadingEndTime = performance.now();
        this._addMemoryPerfEvent(this.initialMemoryUsage);
        Assert.ok(true,"AppInsights script loaded");
      
        this._addSnippetLoadingTimeEvent(snippetLoadingEndTime);
        this.initialMemoryUsage = performance["memory"]?.usedJSHeapSize;
        
        let appInsights = window["appInsights"];
        this.appInsights = appInsights;
        try {
            let notificationManager = this.appInsights.core.getNotifyMgr() || this.appInsights.core["_notificationManager"];
            notificationManager.addNotificationListener({
                perfEvent: (perfEvent: any) => {
                    this._parseAppInsightsPerfEvent(perfEvent,this.AISKUPerfTest);
            }});
        } catch (e) {
            console.error(e);
        }

        this.addPerfEvents();

        setTimeout(() => {
            this.flush();
        }, 10000);
    }

    protected _loadSnippet():void {
        var tag = document.createElement("script");
        tag.innerText = this.getSnippet();
        this.AISKUPerfTest.snippetStartTime = performance.now();
        document.getElementsByTagName('head')[0].appendChild(tag);
    }

    public getSnippet(): string {
        return `
        !function(T,l,y){var S=T.location,k="script",D="instrumentationKey",C="ingestionendpoint",I="disableExceptionTracking",E="ai.device.",b="toLowerCase",w="crossOrigin",N="POST",e="appInsightsSDK",t=y.name||"appInsights";(y.name||T[e])&&(T[e]=t);var n=T[t]||function(d){var g=!1,f=!1,m={initialize:!0,queue:[],sv:"5",version:2,config:d};function v(e,t){var n={},a="Browser";return n[E+"id"]=a[b](),n[E+"type"]=a,n["ai.operation.name"]=S&&S.pathname||"_unknown_",n["ai.internal.sdkVersion"]="javascript:snippet_"+(m.sv||m.version),{time:function(){var e=new Date;function t(e){var t=""+e;return 1===t.length&&(t="0"+t),t}return e.getUTCFullYear()+"-"+t(1+e.getUTCMonth())+"-"+t(e.getUTCDate())+"T"+t(e.getUTCHours())+":"+t(e.getUTCMinutes())+":"+t(e.getUTCSeconds())+"."+((e.getUTCMilliseconds()/1e3).toFixed(3)+"").slice(2,5)+"Z"}(),iKey:e,name:"Microsoft.ApplicationInsights."+e.replace(/-/g,"")+"."+t,sampleRate:100,tags:n,data:{baseData:{ver:2}}}}var h=d.url||y.src;if(h){function a(e){var t,n,a,i,r,o,s,c,u,p,l;g=!0,m.queue=[],f||(f=!0,t=h,s=function(){var e={},t=d.connectionString;if(t)for(var n=t.split(";"),a=0;a<n.length;a++){var i=n[a].split("=");2===i.length&&(e[i[0][b]()]=i[1])}if(!e[C]){var r=e.endpointsuffix,o=r?e.location:null;e[C]="https://"+(o?o+".":"")+"dc."+(r||"services.visualstudio.com")}return e}(),c=s[D]||d[D]||"",u=s[C],p=u?u+"/v2/track":d.endpointUrl,(l=[]).push((n="SDK LOAD Failure: Failed to load Application Insights SDK script (See stack for details)",a=t,i=p,(o=(r=v(c,"Exception")).data).baseType="ExceptionData",o.baseData.exceptions=[{typeName:"SDKLoadFailed",message:n.replace(/\./g,"-"),hasFullStack:!1,stack:n+"\nSnippet failed to load ["+a+"] -- Telemetry is disabled\nHelp Link: https://go.microsoft.com/fwlink/?linkid=2128109\nHost: "+(S&&S.pathname||"_unknown_")+"\nEndpoint: "+i,parsedStack:[]}],r)),l.push(function(e,t,n,a){var i=v(c,"Message"),r=i.data;r.baseType="MessageData";var o=r.baseData;return o.message='AI (Internal): 99 message:"'+("SDK LOAD Failure: Failed to load Application Insights SDK script (See stack for details) ("+n+")").replace(/\"/g,"")+'"',o.properties={endpoint:a},i}(0,0,t,p)),function(e,t){if(JSON){var n=T.fetch;if(n&&!y.useXhr)n(t,{method:N,body:JSON.stringify(e),mode:"cors"});else if(XMLHttpRequest){var a=new XMLHttpRequest;a.open(N,t),a.setRequestHeader("Content-type","application/json"),a.send(JSON.stringify(e))}}}(l,p))}function i(e,t){f||setTimeout(function(){!t&&m.core||a()},500)}var e=function(){var n=l.createElement(k);n.src=h;var e=y[w];return!e&&""!==e||"undefined"==n[w]||(n[w]=e),n.onload=i,n.onerror=a,n.onreadystatechange=function(e,t){"loaded"!==n.readyState&&"complete"!==n.readyState||i(0,t)},n}();y.ld<0?l.getElementsByTagName("head")[0].appendChild(e):setTimeout(function(){l.getElementsByTagName(k)[0].parentNode.appendChild(e)},y.ld||0)}try{m.cookie=l.cookie}catch(p){}function t(e){for(;e.length;)!function(t){m[t]=function(){var e=arguments;g||m.queue.push(function(){m[t].apply(m,e)})}}(e.pop())}var n="track",r="TrackPage",o="TrackEvent";t([n+"Event",n+"PageView",n+"Exception",n+"Trace",n+"DependencyData",n+"Metric",n+"PageViewPerformance","start"+r,"stop"+r,"start"+o,"stop"+o,"addTelemetryInitializer","setAuthenticatedUserContext","clearAuthenticatedUserContext","flush"]),m.SeverityLevel={Verbose:0,Information:1,Warning:2,Error:3,Critical:4};var s=(d.extensionConfig||{}).ApplicationInsightsAnalytics||{};if(!0!==d[I]&&!0!==s[I]){var c="onerror";t(["_"+c]);var u=T[c];T[c]=function(e,t,n,a,i){var r=u&&u(e,t,n,a,i);return!0!==r&&m["_"+c]({message:e,url:t,lineNumber:n,columnNumber:a,error:i}),r},d.autoExceptionInstrumented=!0}return m}(y.cfg);function a(){y.onInit&&y.onInit(n)}(T[t]=n).queue&&0===n.queue.length?(n.queue.push(a),n.trackPageView({})):a()}(window,document,{
                    src: "https://js.monitor.azure.com/scripts/b/ai.${this.AISKUPerfTest.version}.gbl.min.js?${this.AISKUPerfTest.testPostfix}",
                    crossOrigin: "anonymous", 
                    onInit: function (appInsights) {
                       console.log("snippet loaded");
                       appInsightsInitPerftest.loadScriptOnInit();
                      },
                    cfg: { 
                        instrumentationKey: "ce11f034-0cdf-4251-a564-bc57a2211d66",
                        enablePerfMgr: true,
                        maxBatchSizeInBytes: 1000000,
                        maxBatchInterval: 30000000,
                        extensionConfig: {}
                  }});`
    }

    public addPerfEvents() {
        this._addMemoryPerfEvent(this.initialMemoryUsage,"Configuration");
        this._trackSingleEvent();

        setTimeout(() =>{
            this._trackBatchEvents(10);
        },500)

        setTimeout(() =>{
            this._trackBatchEvents(30);
        },1000)

        setTimeout(() =>{
            this._trackBatchEvents(50);
        },2000)

        setTimeout(() =>{
            this._trackBatchEvents(80);
        },3000)

        setTimeout(() =>{
            this._trackBatchEvents(100);
        },4000)
    }

    public flush(): void {
        this.AISKUPerfTest.doFlush = true;
        this.AISKUPerfTest.perfEventsBuffer.forEach((event) => {
            if (event.baseData) {this._sendEventWithCollectorUrl(event);}
        })
        this.AISKUPerfTest.perfEventsBuffer = this.AISKUPerfTest.perfEventWaitBuffer.slice(0);
        this.AISKUPerfTest.doFlush = false;
        this.AISKUPerfTest.perfEventWaitBuffer = [];
        Assert.ok(true, "flush triggered");
    }

    public getScriptSrc(): string {
        return `https://js.monitor.azure.com/scripts/b/ai.${this.AISKUPerfTest.version}.min.js?${this.AISKUPerfTest.testPostfix}`;
    }

    protected _parseAppInsightsPerfEvent(perfEvent: any, AISKUInitPerf: any): void {
        let perfEventName = perfEvent?.name;
        switch (perfEventName) {
            case "AISKU.flush":
                this._parseBatchSendEvent(perfEvent, AISKUInitPerf);
                break;
            case "AppInsightsCore:track":
                this._parseTrackEvent(perfEvent, AISKUInitPerf);
                break;  
        }
    }

    protected _parseBatchSendEvent(perfEvent: any, AISKUInitPerf: any): void {
        let curMemory = performance["memory"]?.usedJSHeapSize;
        let memoryMarks = Object.keys(this.memoryUsageMarks);
        var index = ""
        
        if (memoryMarks && memoryMarks.length && curMemory) {
            index = memoryMarks[memoryMarks.length-1];
            /**
             * *******************************************************************
             * TODO:should calculate batch send memory usage before flush or after flush
             * currently is calculated before flush
             * ********************************************************************
             */
            // let preMemory = this.memoryUsageMarks[index];
            // let value = Math.round((curMemory-preMemory)/1000);
            // value = value <0? 0:value;
            // let msg = `${index} MemoryUse ${value}KB addded`
            //this._createPerfEvent(AISKUInitPerf, index, value, false, msg);
            this._createPerfEvent(AISKUInitPerf, perfEvent.name+index, perfEvent?.exTime, true);
        }
    }

    protected _parseTrackEvent(perfEvent: any, AISKUInitPerf: any): void {
        let payloadItem = perfEvent["payload"]?.item;
        let baseType = null;
        if (perfEvent["time"] && payloadItem) {
             baseType = payloadItem["baseType"];
        }
        // skip PageviewPerformanceData && MessageData 
        if (this._isNullOrUndefined(baseType) || baseType == "PageviewPerformanceData" || baseType == "MessageData") return;

        this._createPerfEvent(AISKUInitPerf, `Track${baseType}`, perfEvent?.time, true);
        var childEvts = perfEvent?.childEvts;
        while (childEvts?.length) {
            let curEvt = childEvts[0];
            let name = `${baseType}-${curEvt.name}`;
            let value = curEvt?.exTime !== undefined ? curEvt.exTime:curEvt.time;
            this._createPerfEvent(AISKUInitPerf, name, value, true);
            childEvts = curEvt?.childEvts;
        } 
    }

    protected _createPerfEvent(AISKUInitPerf: any, name: string, value: number, isProcessTime: boolean, msg?: string): void {
        let initPerf = AISKUInitPerf || this.AISKUPerfTest;
        if (this._isNullOrUndefined(value) || this._isNullOrUndefined(initPerf)) return; 
        let metricVal = isProcessTime? "ProcessTime":"UsedJSHeapSize";
        let unit = isProcessTime?  "ms":"KB";
        let event =  {
            name: "SDKPerfTest",
            iKey: this.TENANT_KEY,
            ver: "4.0",
            ext: {},
            baseData: {
              testName: name,
              sku:initPerf.skuName,
              version: initPerf.version,
              unitOfMeasure: unit, 
              metric: metricVal,
              value: value
            }
        };
        this._pushPerfEvents(event);
        let message = msg? msg :`perfEvent: ${event.baseData.testName} ${event.baseData.value}${event.baseData.unitOfMeasure} added`;
        console.log(message);
        Assert.ok(true, message);
    }

    protected _pushPerfEvents(event: any): void {
        if (!this.AISKUPerfTest.doFlush) {
            this.AISKUPerfTest.perfEventsBuffer.push(event);
        }
        else {
            this.AISKUPerfTest.perfEventWaitBuffer.push(event);
        }
    }

    private _addSnippetLoadingTimeEvent(endtime: number, message?: string): void {
        let rawTime = endtime - this.AISKUPerfTest.snippetStartTime;
        var duration = Math.round(rawTime*1000)/1000;
        this._createPerfEvent(this.AISKUPerfTest, "SDKInit", duration, true, `AppInsightsInit-Init: Script LoadingTime: ${duration} ms added`);
    }

    private _addMemoryPerfEvent(initialMemoryUsage: number, metric?: string): void {
        let curMemory = performance["memory"]?.usedJSHeapSize;
        if (this._isNullOrUndefined(initialMemoryUsage) || initialMemoryUsage < 0) return;
        
       
        if (!this._isNullOrUndefined(curMemory)) {
            let metricName = metric? metric:"SDKInit"
            var memoryUsed =  Math.round((curMemory - initialMemoryUsage) / 1000);
            this._createPerfEvent(this.AISKUPerfTest, metricName, memoryUsed, false, `AppInsightsInit-Init: ${metricName} UsedJSHeapSize ${memoryUsed} KB added`);
        }
    }

    protected _addTrackEventPerfTime() {
        let curMemory = performance["memory"]?.usedJSHeapSize;
        let memoryMarks = Object.keys(this.memoryUsageMarks);
        if (memoryMarks && memoryMarks.length) {
            let index = memoryMarks[memoryMarks.length-1];
            let preMemory = this.memoryUsageMarks[index];
            let value = Math.round((curMemory-preMemory)/1000);
            let msg = `${index} MemoryUse ${value}KB addded`
            this._createPerfEvent(this.AISKUPerfTest, index, value, false, msg);
        }
    }

    protected _createTrackEvent(eventName: string, fieldNum?: number) {
        let number = fieldNum? fieldNum: Math.random() * 10 + 10;
        let fields = {}
        for (let i=1; i <= number; i++) {
            let field = "field" + i;
            fields[field] = "value" + i;
        }
        return {name: eventName, properties: fields};
    }

    protected _trackSingleEvent() {
        var curMemeory = performance["memory"]?.usedJSHeapSize;
        //this.appInsights.trackEvent({name:'appInsights-perf-event'});
        //this.appInsights.trackMetric({name: 'appInsights-perf-metric', average: 42});
        
        if (! this._isNullOrUndefined(curMemeory)) {
            this.memoryUsageMarks["Track"] = curMemeory;
        }

        try {
            let event =  this._createTrackEvent("Track",20);
            this.appInsights.trackEvent(event);

            /**
             * *******************************************************
             * TODO: add doPerf() for version <= 2.5.6
             * ******************************************************
             */

            // if (this.AISKUPerfTest.hasPerfMgr) {
            //     this.appInsights.trackEvent(event);
            // } else {
            //     this.doPerf(this.perfMgrSrc, () => "AISKU:Track", (perfEvent) => {
            //         console.log("test"+ JSON.stringify(perfEvent));
            //         this.appInsights.trackEvent(event);
            //         // A mark has been added to window.performance called 'tst.mark.AISKU:Track'
            //     });
            // }
           
            this.appInsights.flush(false);
        } catch (e) {
            console.error(e);
        }
    }

    protected _trackBatchEvents(number?: number) {
        var curTime = performance.now();
        var curMemory = performance["memory"]?.usedJSHeapSize;
        var eventNumber = number && number > 0? number:100;
        var eventName = "BatchSend" + number;
        this.batchStartTimeMarks[eventName] = curTime;
        
        if (!this._isNullOrUndefined(curMemory)) {
            this.memoryUsageMarks[eventName] = curMemory;
        }

        try {
            for (let i = 0; i < eventNumber-1; i++) {
                let event = this. _createTrackEvent("batch",20);
                this.appInsights.trackTrace(event);
            }
            let event = this. _createTrackEvent(eventName,20);
            this.appInsights.trackTrace(event);
            let afterMemoUage = performance["memory"]?.usedJSHeapSize;
            let val = Math.round((afterMemoUage-curMemory)/1000);
            val = val<0?0:val;
            let msg = `${eventName} Memory Usage: ${val}KB`
            this._createPerfEvent(this.AISKUPerfTest,eventName,val,false,msg);
            this.appInsights.flush(false);
        } catch (e) {
            console.error(e);
        }
     
    }

    protected _isNullOrUndefined(value: any): boolean {
        return value === undefined || value === null;
    }
}
