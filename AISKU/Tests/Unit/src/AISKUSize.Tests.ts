import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import * as pako from "pako";

export class AISKUSizeCheck extends AITestClass {
    private readonly MAX_DEFLATE_SIZE = 43;
    private readonly rawFilePath = "../dist/applicationinsights-web.min.js";
    private readonly prodFilePath = "../browser/ai.2.min.js";

    public testInitialize() {
    }

    public testCleanup() {
    }

    public registerTests() {
        this.addRawFileSizeCheck();
        this.addProdFileSizeCheck();
    }

    constructor() {
        super("AISKUSizeCheck");
    }

    private addRawFileSizeCheck(): void {
        this._checkFileSize(false);
    }

    private addProdFileSizeCheck(): void {
        this._checkFileSize(true);
    }
    
    private _checkFileSize(isProd: boolean): void {
        let _filePath = isProd? this.prodFilePath : this.rawFilePath;
        let postfix  = isProd? "" : "-raw";
        let fileName = _filePath.split("..")[2];
        this.testCase({
            name: `Test AISKU${postfix} deflate size`,
            test: () => {
                Assert.ok(true, `test file: ${fileName}`);
                let request = new Request(_filePath, {method:"GET"});
                return fetch(request).then((response) => {
                    if (!response.ok) {
                        Assert.ok(false, `fetch AISKU${postfix} error: ${response.statusText}`);
                        return;
                    } else {
                        return response.text().then(text => {
                            let size = Math.ceil((pako.deflate(text).length/1024) * 100) / 100.0;
                            Assert.ok(size <= this.MAX_DEFLATE_SIZE ,`max ${this.MAX_DEFLATE_SIZE} KB, current deflate size is: ${size} KB`);
                        }).catch((error: Error) => {
                            Assert.ok(false, `AISKU${postfix} response error: ${error}`);
                        });
                    }
                }).catch((error: Error) => {
                    Assert.ok(false, `AISKU${postfix} deflate size error: ${error}`);
                });
            }
        });
    }
}