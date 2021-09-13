import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import {appInsightsInitPerftest} from "./AISKUPerf"

export class AISKUPerf extends AITestClass {
   

    public testInitialize() {
        try {
            window["appInsightsInitPerftest"] = appInsightsInitPerftest;
            window["loadScriptOnInit"] = () => {return appInsightsInitPerftest.loadScriptOnInit()};
        } catch (e) {
            console.error('Failed to initialize', e);
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
       
        this.testCase({
            name: "appInsights AISKU perf Test",
            test: () => {
                try {
                    appInsightsInitPerftest.startTest();
                    Assert.ok(true,"load snippet")
                } catch (e) {
                    console.error('Failed to load snippet', e);
                }
            }
        });
    }
}
