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
           this.AISKUPerfTest.loadScriptOnInit = () => {return this._loadScriptOnInit();}
           Assert.ok(window["oneDS"], "oneDS exists");
           Assert.ok(window["Microsoft"]?.ApplicationInsights?.PerfMarkMeasureManager, "perfMgr exists");
           Assert.ok(window["Microsoft"]?.ApplicationInsights?.doPerf, "doPerf exists");
           this.perfMgr = window["Microsoft"].ApplicationInsights.PerfMarkMeasureManager;
           this.doPerf = window["Microsoft"].ApplicationInsights.doPerf;
           window["appInsightsInitPerftest"] = this.AISKUPerfTest;
           this.memoryUsageMarks = {};
           this.batchStartTimeMarks = {};

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
            stepDelay: 10000,
            steps: [() => {

                Assert.ok(window["appInsightsInitPerftest"], "global appInsightsInitPerftest exists");
                Assert.ok(window["oneDS"], "oneDS exists");
                Assert.ok(this.perfMgr, "perfMgr exists");
                Assert.ok(this.doPerf, "doPerf exists");
                console.log(this.AISKUPerfTest.version);

                try {
                    this.initialMemoryUsage = performance["memory"]?.usedJSHeapSize;

                    if (!this.AISKUPerfTest.hasPerfMgr) {
                        this.perfMgrSrc = new this.perfMgr({
                         useMarks: true,
                         useEndMarks: true,
                         uniqueNames: true
                     },
                     {
                         perfEvent: (perfEvent) => {
                             this._parseAppInsightsPerfEvent(perfEvent,this.AISKUPerfTest);
                         }
                     });
                    }
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
            let notificationManager = this.appInsights.core["_notificationManager"] ||this.appInsights.core?.getNotifyMgr();
            if (notificationManager) {
                notificationManager.addNotificationListener({
                    perfEvent: (perfEvent: any) => {
                        this._parseAppInsightsPerfEvent(perfEvent,this.AISKUPerfTest);
                }});
            }
            
        } catch (e) {
            console.error(e);
        }

        this.addPerfEvents();

        setTimeout(() => {
            this.flush();
        }, 6000);
    }

    protected _loadSnippet():void {
        var tag = document.createElement("script");
        tag.innerText = this.getSnippet();
        this.AISKUPerfTest.snippetStartTime = performance.now();
        document.getElementsByTagName('head')[0].appendChild(tag);
    }

    public getSnippet(): string {
        return `
            loadSdkUsingRequire({
                src: "https://js.monitor.azure.com/scripts/b/ai.${this.AISKUPerfTest.version}.min.js?${this.AISKUPerfTest.testPostfix}",
                onInit: function (appInsights) {
                    console.log("snippet loaded");
                    appInsightsInitPerftest.loadScriptOnInit();
                },
                cfg: { 
                    instrumentationKey: "key",
                    enablePerfMgr: true,
                    maxBatchSizeInBytes: 1000000,
                    maxBatchInterval: 30000000,
                    extensionConfig: {}
                }
            });`;
    }

    public addPerfEvents() {
        this._addMemoryPerfEvent(this.initialMemoryUsage,"Configuration");
        this._trackSingleEvent();

        setTimeout(() =>{
            this._trackBatchEvents(10);
        },1000);

        setTimeout(() =>{
            this._trackBatchEvents(30);
        },2000);

        setTimeout(() =>{
            this._trackBatchEvents(50);
        },2000);

        setTimeout(() =>{
            this._trackBatchEvents(80);
        },4000);

        setTimeout(() =>{
            this._trackBatchEvents(100);
        },5000);
    }

    public flush(): void {
        this.AISKUPerfTest.doFlush = true;
        console.log("flush " +  this.AISKUPerfTest.perfEventsBuffer.length +" events");
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
        var index = "";
        
        if (memoryMarks && memoryMarks.length && curMemory !== undefined) {
            index = memoryMarks[memoryMarks.length-1];
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
        if (this._isNullOrUndefined(value) || value < 0 || this._isNullOrUndefined(initPerf)) return; 
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
            let metricName = metric? metric:"SDKInit";
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
            let msg = `${index} MemoryUse ${value}KB addded`;
            this._createPerfEvent(this.AISKUPerfTest, index, value, false, msg);
        }
    }

    protected _createTrackEvent(eventName: string, type: string = "EventData", fieldNum?: number) {
        let number = fieldNum? fieldNum: Math.random() * 10 + 10;
        let fields = {};
        for (let i=1; i <= number; i++) {
            let field = "field" + i;
            fields[field] = "value" + i;
        }
        return {name: eventName, properties: fields, baseType: type };
    }

    protected _trackSingleEvent() {
        if (this._isNullOrUndefined(this.appInsights)) return;

        var event =  this._createTrackEvent("Track","EventData",20);
        var curMemeory = performance["memory"]?.usedJSHeapSize;
        if (! this._isNullOrUndefined(curMemeory)) {
            this.memoryUsageMarks["Track"] = curMemeory;
        }

        try {
            if (this.AISKUPerfTest.hasPerfMgr) {
                this.appInsights.trackEvent(event);
            } else {
                this.doPerf(this.perfMgrSrc, () => "AppInsightsCore:track", (perfEvent) => {
                    this.appInsights.trackEvent(event);
                    // A mark has been added to window.performance called 'tst.mark.AppInsightsCore:track'
                },()=> ({item: event}));
            }
            this.appInsights.flush(false);
        } catch (e) {
            console.error(e);
        }
    }

    protected _trackBatchEvents(number?: number) {
        var curTime = performance.now();
        if (this._isNullOrUndefined(this.appInsights)) return;
       
        var eventNumber = number && number > 0? number:100;
        var eventName = "BatchSend" + number;
        this.batchStartTimeMarks[eventName] = curTime;
        var event = this. _createTrackEvent("batch","Message",20);
        
        var curMemory = performance["memory"]?.usedJSHeapSize;
        if (!this._isNullOrUndefined(curMemory)) {
            this.memoryUsageMarks[eventName] = curMemory;
        }

        try {
            for (let i = 0; i < eventNumber; i++) {
                this.appInsights.trackTrace(event);
            }
            let afterMemoUage = performance["memory"]?.usedJSHeapSize;
            let val = Math.round((afterMemoUage-curMemory)/1000);
            val = val < 0? 0:val;
            let msg = `${eventName} Memory Usage: ${val}KB`;
            this._createPerfEvent(this.AISKUPerfTest,eventName,val,false,msg);
            if (this.AISKUPerfTest.hasPerfMgr) {
                this.appInsights.flush(false);
            } else {
                this.doPerf(this.perfMgrSrc, () => "AISKU.flush", (perfEvent) => {
                    this.appInsights.flush(false);
                    // A mark has been added to window.performance called 'tst.mark.AISKU.flush'
                },()=> ({item: event}));
            }
        } catch (e) {
            console.error(e);
        }
     
    }

    protected _isNullOrUndefined(value: any): boolean {
        return value === undefined || value === null;
    }
}
