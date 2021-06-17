import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import * as pako from "pako";

export class AnalyticsExtensionSizeCheck extends AITestClass {
    private readonly MAX_DEFLATE_SIZE = 20;
    private readonly filePath = "../../dist/applicationinsights-analytics-js.min.js";

    public testInitialize() {
    }

    public testCleanup() {
    }

    public registerTests() {
        this.addFileSizeCheck();
    }

    constructor() {
        super("AnalyticsExtensionSizeCheck");
    }

    private addFileSizeCheck(): void {
        this.testCase({
            name: "test applicationinsights-analytics extension deflate size",
            test: () => {
                let request = new Request(this.filePath, {method:"GET"});
                return fetch(request).then((response) => {
                    if (!response.ok) {
                        Assert.ok(false, "fetch applicationinsights-analytics error: " + response.statusText);
                        return;
                    } else {
                        return response.text().then(text => {
                            let size = Math.ceil(pako.deflate(text).length/1024);
                            Assert.ok(size <= this.MAX_DEFLATE_SIZE ,`max ${this.MAX_DEFLATE_SIZE} KB, current deflate size is: ${size} KB`);
                        }).catch((error) => {
                            Assert.ok(false, "applicationinsights-analytics extension response error: " + error);
                        });
                    }
                }).catch((error: Error) => {
                    Assert.ok(false, "applicationinsights-analytics extension deflate size error: " + error);
                });
            }
        });
    }                 
}