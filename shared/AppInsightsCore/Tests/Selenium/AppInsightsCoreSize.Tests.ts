import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import * as pako from "pako";

export class AppInsightsCoreSizeCheck extends AITestClass {
    private readonly MAX_DEFLATE_SIZE = 15;
    private readonly filePath = "../../dist/applicationinsights-core-js.min.js";

    public testInitialize() {
    }

    public testCleanup() {
    }

    public registerTests() {
        this.addFileSizeCheck();
    }

    constructor() {
        super("AppInsightsCoreSizeCheck");
    }

    private addFileSizeCheck(): void {
        this.testCase({
            name: "test applicationinsights-core deflate size",
            test: () => {
                let request = new Request(this.filePath, {method:"GET"});
                return fetch(request).then((response) => {
                    if (!response.ok) {
                        Assert.ok(false, "applicationinsights-core deflate size error: " + response.statusText);
                        return;
                    } else {
                        return response.text().then(text => {
                            let size = Math.ceil(pako.deflate(text).length/1024);
                            Assert.ok(size <= this.MAX_DEFLATE_SIZE ,`max ${this.MAX_DEFLATE_SIZE} KB, current deflate size is: ${size} KB`);
                        }).catch((error) => {
                            Assert.ok(false, "applicationinsights-core response error: " + error);
                        });
                    }
                }).catch((error: Error) => {
                    Assert.ok(false, "applicationinsights-core deflate size error: " + error);
                });
            }
        });
    }                 
}