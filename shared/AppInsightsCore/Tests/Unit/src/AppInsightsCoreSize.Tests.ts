import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import * as pako from "pako";

export class AppInsightsCoreSizeCheck extends AITestClass {
    private readonly MAX_DEFLATE_SIZE = 17;
    private readonly rawFilePath = "../dist/applicationinsights-core-js.min.js";
    private readonly prodFilePath = "../browser/applicationinsights-core-js.min.js";

    public testInitialize() {
    }

    public testCleanup() {
    }

    public registerTests() {
        this.addRawFileSizeCheck();
        this.addProdFileSizeCheck();
    }

    constructor() {
        super("AppInsightsCoreSizeCheck");
    }

    private addRawFileSizeCheck(): void {
        this._fileSizeCheck(false);
    }

    private addProdFileSizeCheck(): void {
        this._fileSizeCheck(true);
    }
    
    private _fileSizeCheck(isProd: boolean): void {
        let _filePath = isProd ? this.prodFilePath : this.rawFilePath;
        let postfix = isProd ? "" : "-raw";
        let fileName = _filePath.split("..")[1];
        this.testCase({
            name: `Test applicationinsights-core${postfix} deflate size`,
            test: () => {
                Assert.ok(true, `test file: ${fileName}`);
                let request = new Request(_filePath, {method:"GET"});
                return fetch(request).then((response) => {
                    if (!response.ok) {
                        Assert.ok(false, `applicationinsights-core${postfix} deflate size error: ${response.statusText}`);
                        return;
                    } else {
                        return response.text().then(text => {
                            let size = Math.ceil((pako.deflate(text).length/1024) * 100) / 100.0;
                            Assert.ok(size <= this.MAX_DEFLATE_SIZE ,`max ${this.MAX_DEFLATE_SIZE} KB, current deflate size is: ${size} KB`);
                        }).catch((error) => {
                            Assert.ok(false, `applicationinsights-core${postfix} response error: ${error}`);
                        });
                    }
                }).catch((error: Error) => {
                    Assert.ok(false, `applicationinsights-core${postfix} deflate size error: ${error}`);
                });
            }
        });
    }
}