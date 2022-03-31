import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import * as pako from "pako";

export class PropertiesExtensionSizeCheck extends AITestClass {
    private readonly MAX_DEFLATE_SIZE = 15;
    private readonly rawFilePath = "../dist/applicationinsights-properties-js.min.js";
    private readonly proFilePath = "../browser/applicationinsights-properties-js.min.js";

    public testInitialize() {
    }

    public testCleanup() {
    }

    public registerTests() {
        this.addRawFileSizeCheck();
        this.addProdFileSizeCheck();
    }

    constructor() {
        super("PropertiesExtensionSizeCheck");
    } 

    private addRawFileSizeCheck(): void {
        this._fileSizeCheck(false);
    }

    private addProdFileSizeCheck(): void {
        this._fileSizeCheck(true);
    }
    
    private _fileSizeCheck(isProd:boolean): void {
        let _filePath = isProd? this.proFilePath : this.rawFilePath;
        let postfix = isProd? "" : "-raw";
        let fileName = _filePath.split("..")[1];
        this.testCase({
            name: `Test applicationinsights-properties${postfix} deflate size`,
            test: () => {
                Assert.ok(true, `test file: ${fileName}`);
                let request = new Request(_filePath, {method:"GET"});
                return fetch(request).then((response) => {
                    if (!response.ok) {
                        Assert.ok(false, `fetch applicationinsights-properties${postfix} response error: ${response.statusText}`);
                        return;
                    } else {
                        return response.text().then(text => {
                            let size = Math.ceil((pako.deflate(text).length/1024) * 100) / 100.0;
                            Assert.ok(size <= this.MAX_DEFLATE_SIZE ,`max ${this.MAX_DEFLATE_SIZE} KB, current deflate size is: ${size} KB`);
                        }).catch((error) => {
                            Assert.ok(false, `applicationinsights-properties${postfix} response error: ${error}`);
                        });
                    }
                }).catch((error: Error) => {
                    Assert.ok(false, `applicationinsights-properties${postfix} deflate size error: ${error}`);
                });
             }
        });
    } 
}