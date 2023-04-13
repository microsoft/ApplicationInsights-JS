import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import {AppInsightsInitPerfTestClass} from "./AISKUPerf";
import { utlRemoveSessionStorage } from "@microsoft/applicationinsights-common";

function isNullOrUndefined(value: any): boolean {
    return value === undefined || value === null;
}

function createTrackEvent(eventName: string, type: string = "EventData", fieldNum?: number) {
    let number = fieldNum? fieldNum: Math.random() * 10 + 10;
    let fields = {};
    for (let i=1; i <= number; i++) {
        let field = "field" + i;
        fields[field] = "value" + i;
    }
    return {name: eventName, properties: fields, baseType: type };
}

function sendEventWithCollectorUrl(event: any) {
    let oneDS = window["oneDS"];
    const generatedUrl = oneDS.getCollectorUrlGenerator(event);
    let collectorUrlScript = document.createElement("script");
    collectorUrlScript.setAttribute("id", "collectorUrl");
    collectorUrlScript.src=generatedUrl;
    document.head.appendChild(collectorUrlScript);
    collectorUrlScript.onload=collectorUrlScript["onreadystatechange"] = function() {
        Assert.ok(true,"telemetry sent");
    }
}

function pushPerfEvents(event: any, AISKUPerfTest: any): void {
    if (!AISKUPerfTest.doFlush) {
        AISKUPerfTest.perfEventsBuffer.push(event);
    }
    else {
        AISKUPerfTest.perfEventWaitBuffer.push(event);
    }
}

function flush(AISKUPerfTest: any): void {
    AISKUPerfTest.doFlush = true;
    console.log("flush " +  AISKUPerfTest.perfEventsBuffer.length +" events");
    AISKUPerfTest.perfEventsBuffer.forEach((event) => {
        if (event.baseData) {sendEventWithCollectorUrl(event);}
    })
    AISKUPerfTest.perfEventsBuffer = AISKUPerfTest.perfEventWaitBuffer.slice(0);
    AISKUPerfTest.doFlush = false;
    AISKUPerfTest.perfEventWaitBuffer = [];
    Assert.ok(true, "flush triggered");
}

const TENANT_KEY = "2252db2e5e344635a36c5f1c04b3902c-eaced1c8-a046-4e8d-8fa8-c1ecf2077a5d-7256"
function createPerfEvent(AISKUInitPerf: any, name: string, value: number, isProcessTime: boolean, msg?: string): void {
    if (isNullOrUndefined(value) || value < 0 || isNullOrUndefined(AISKUInitPerf)) return;
    let metricVal = isProcessTime? "ProcessTime":"UsedJSHeapSize";
    let unit = isProcessTime?  "ms":"KB";
    let event =  {
        name: "SDKPerfTest",
        iKey: TENANT_KEY,
        ver: "4.0",
        ext: {},
        baseData: {
          testName: name,
          sku:AISKUInitPerf.skuName,
          version: AISKUInitPerf.version,
          unitOfMeasure: unit,
          metric: metricVal,
          value: value
        }
    };

    pushPerfEvents(event, AISKUInitPerf);
    let message = msg? msg :`perfEvent: ${event.baseData.testName} ${event.baseData.value}${event.baseData.unitOfMeasure} added`;
    console.log(message);
    Assert.ok(true, message);
}

function parseBatchSendEvent(perfEvent: any, AISKUInitPerf: any, memoryUsageMarks: any): void {
    let curMemory = performance["memory"]?.usedJSHeapSize;
    let memoryMarks = Object.keys(memoryUsageMarks);
    var index = "";
    
    if (memoryMarks && memoryMarks.length && curMemory !== undefined) {
        index = memoryMarks[memoryMarks.length-1];
        createPerfEvent(AISKUInitPerf, perfEvent.name+index, perfEvent?.exTime, true);
    }
}

function parseTrackEvent(perfEvent: any, AISKUInitPerf: any): void {
    let payloadItem = perfEvent["payload"]?.item;
    let baseType = null;
    if (perfEvent["time"] && payloadItem) {
         baseType = payloadItem["baseType"];
    }
    // skip PageviewPerformanceData && MessageData
    if (isNullOrUndefined(baseType) || baseType == "PageviewPerformanceData" || baseType == "MessageData") return;

    createPerfEvent(AISKUInitPerf, `Track${baseType}`, perfEvent?.time, true);
    var childEvts = perfEvent?.childEvts;
    while (childEvts?.length) {
        let curEvt = childEvts[0];
        let name = `${baseType}-${curEvt.name}`;
        let value = curEvt?.exTime !== undefined ? curEvt.exTime:curEvt.time;
        createPerfEvent(AISKUInitPerf, name, value, true);
        childEvts = curEvt?.childEvts;
    }
}

function parseAppInsightsPerfEvent(perfEvent: any, AISKUInitPerf: any, memoryUsageMarks: any): void {
    let perfEventName = perfEvent?.name;
    switch (perfEventName) {
        case "AISKU.flush":
            parseBatchSendEvent(perfEvent, AISKUInitPerf, memoryUsageMarks);
            break;
        case "AppInsightsCore:track":
            parseTrackEvent(perfEvent, AISKUInitPerf);
            break;
    }
}

function addSnippetLoadingTimeEvent(AISKUPerfTest: any, endtime: number): void {
    let rawTime = endtime - AISKUPerfTest.snippetStartTime;
    var duration = Math.round(rawTime*1000)/1000;
    createPerfEvent(AISKUPerfTest, "SDKInit", duration, true, `AppInsightsInit-Init: Script LoadingTime: ${duration} ms added`);
}

export class AISKUPerf extends AITestClass {
    public AISKUPerfTest: AppInsightsInitPerfTestClass;
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
        utlRemoveSessionStorage(null as any, "AI_sentBuffer", );
        utlRemoveSessionStorage(null as any, "AI_buffer", );
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
            assertNoHooks: false,
            steps: [() => {
                Assert.ok(window["appInsightsInitPerftest"], "global appInsightsInitPerftest exists");
                Assert.ok(window["oneDS"], "oneDS exists");
                Assert.ok(this.perfMgr, "perfMgr exists");
                Assert.ok(this.doPerf, "doPerf exists");
                console.log(this.AISKUPerfTest.version);

                try {
                    if (!this.AISKUPerfTest.hasPerfMgr) {
                        this.perfMgrSrc = new this.perfMgr({
                         useMarks: true,
                         useEndMarks: true,
                         uniqueNames: true
                     },
                     {
                         perfEvent: (perfEvent) => {
                             parseAppInsightsPerfEvent(perfEvent,this.AISKUPerfTest, this.memoryUsageMarks);
                         }
                     });
                    }
                    this.initialMemoryUsage = performance["memory"]?.usedJSHeapSize;
                    this._loadSnippet();
                } catch (e) {
                    Assert.ok(false, "load snippet error: " + e);
                }

            }].concat(() => {
               Assert.ok(true, "test version: " + this.AISKUPerfTest.version);
            })
        });
    }

    protected _loadScriptOnInit(theModule: any): void {
        var snippetLoadingEndTime = performance.now();
        this._addMemoryPerfEvent(this.initialMemoryUsage);
        Assert.ok(true,"AppInsights script loaded");

        addSnippetLoadingTimeEvent(this.AISKUPerfTest, snippetLoadingEndTime);
    
        let appInsights = window["appInsights"];
        this.appInsights = appInsights;

        this.onDone(() => {
            if (appInsights && appInsights.unload && appInsights.core && appInsights.core.isInitialized()) {
                Assert.ok(true, "Unloading...");
                appInsights.unload(false);
            } else {
                Assert.ok(true, "Unload not supported...");
            }
            
            appInsights = null;
            this.appInsights = null;
        });
        try {
            let notificationManager = this.appInsights.core["_notificationManager"] ||this.appInsights.core?.getNotifyMgr();
            if (notificationManager) {
                notificationManager.addNotificationListener({
                    perfEvent: (perfEvent: any) => {
                        parseAppInsightsPerfEvent(perfEvent,this.AISKUPerfTest, this.memoryUsageMarks);
                }});
            }
            
        } catch (e) {
            console.error(e);
        }

        this.addPerfEvents();

        setTimeout(() => {
            flush(this.AISKUPerfTest);
        }, 9000);
    }

    protected _loadSnippet():void {
        let self = this;
        self.initialMemoryUsage = performance["memory"]?.usedJSHeapSize;
        window["loadSdkUsingRequire"]({
            src: self.getScriptSrc(),
            onInit: function (theInstance) {
                console.log("snippet loaded");
                self._loadScriptOnInit(theInstance);

                self.onDone(() => {
                    if (theInstance && theInstance.unload && theInstance.core && theInstance.core.isInitialized()) {
                        Assert.ok(true, "Unloading from onInit...");
                        theInstance.unload(false);
                    } else {
                        Assert.ok(true, "Unload not supported in onInit...");
                    }
                });
            },
            cfg: { 
                instrumentationKey: "key",
                enablePerfMgr: true,
                maxBatchSizeInBytes: 1000000,
                maxBatchInterval: 30000000,
                extensionConfig: {}
            }            
        });
    }

    public addPerfEvents() {
        this._addMemoryPerfEvent(this.initialMemoryUsage,"Configuration");
        this._trackSingleEvent();

        setTimeout(() =>{
            this._trackBatchEvents(10);
            setTimeout(() =>{
                this._trackBatchEvents(30);
                setTimeout(() =>{
                    this._trackBatchEvents(50);
                    setTimeout(() =>{
                        this._trackBatchEvents(80);
                        setTimeout(() =>{
                            this._trackBatchEvents(100);
                        },1000);
                    },1000);
                },1000);
            },1000);
        },1000);
    }

    public getScriptSrc(): string {
        let baseUrl = "https://js.monitor.azure.com/scripts/b/ai.";

        if (this.AISKUPerfTest.version.indexOf("nightly") !== -1) {
            baseUrl = "https://js.monitor.azure.com/nightly/ai.";
        }

        return baseUrl + `${this.AISKUPerfTest.version}.min.js?${this.AISKUPerfTest.testPostfix}`;
    }    

    private _addMemoryPerfEvent(initialMemoryUsage: number, metric?: string): void {
        let curMemory = performance["memory"]?.usedJSHeapSize;
        if (isNullOrUndefined(initialMemoryUsage) || initialMemoryUsage < 0) return;
        
       
        if (!isNullOrUndefined(curMemory)) {
            let metricName = metric? metric:"SDKInit";
            var memoryUsed =  Math.round((curMemory - initialMemoryUsage) / 1000);
            createPerfEvent(this.AISKUPerfTest, metricName, memoryUsed, false, `AppInsightsInit-Init: ${metricName} UsedJSHeapSize ${memoryUsed} KB added`);
        }
    }

    protected _trackSingleEvent() {
        if (isNullOrUndefined(this.appInsights)) return;

        var event =  createTrackEvent("Track","EventData",20);
        var curMemeory = performance["memory"]?.usedJSHeapSize;
        if (! isNullOrUndefined(curMemeory)) {
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
        if (isNullOrUndefined(this.appInsights)) return;
       
        var eventNumber = number && number > 0? number:100;
        var eventName = "BatchSend" + number;
        this.batchStartTimeMarks[eventName] = curTime;
        var event = createTrackEvent("batch","Message",20);
        
        var curMemory = performance["memory"]?.usedJSHeapSize;
        if (!isNullOrUndefined(curMemory)) {
            this.memoryUsageMarks[eventName] = curMemory;
        }

        let beforeCreateBatch = performance.now();
        try {
            for (let i = 0; i < eventNumber; i++) {
                this.appInsights.trackTrace(event);
            }
            let afterCreateBatch = performance.now();
            let afterMemoUage = performance["memory"]?.usedJSHeapSize;
            let val = Math.round((afterMemoUage-curMemory)/1000);
            val = val < 0? 0:val;
            let msg = `${eventName} Memory Usage: ${val}KB`;
            createPerfEvent(this.AISKUPerfTest,eventName,val,false,msg);
            let duration = Math.round((afterCreateBatch-beforeCreateBatch)*1000)/1000;
            let createBatchName = `CreateBatch${eventNumber}`
            let createBatchMsg = `${createBatchName} time: ${duration}ms`;
            createPerfEvent(this.AISKUPerfTest,createBatchName,duration,true,createBatchMsg);
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
}
