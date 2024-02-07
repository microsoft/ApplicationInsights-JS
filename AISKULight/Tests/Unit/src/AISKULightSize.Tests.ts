import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import * as pako from "pako";

export class AISKULightSizeCheck extends AITestClass {
    private readonly MAX_RAW_SIZE = 81;
    private readonly MAX_BUNDLE_SIZE = 81;
    private readonly MAX_RAW_DEFLATE_SIZE = 34;
    private readonly MAX_BUNDLE_DEFLATE_SIZE = 34;
    private readonly rawFilePath = "../dist/es5/applicationinsights-web-basic.min.js";
    private readonly currentVer = "3.0.8";
    private readonly prodFilePath = `../browser/es5/aib.${this.currentVer[0]}.min.js`;

    public testInitialize() {
    }

    public testCleanup() {
    }

    public registerTests() {
        this.addRawFileSizeCheck();
        this.addProdFileSizeCheck();
    }

    constructor() {
        super("AISKULightSizeCheck");
    }

    private addRawFileSizeCheck(): void {
        this._checkFileSize(false);
    }

    private addProdFileSizeCheck(): void {
        this._checkFileSize(true);
    }
    
    private _checkFileSize(isProd: boolean): void {
        let _filePath = isProd? this.prodFilePath : this.rawFilePath;
        let _maxFullSize = isProd ? this.MAX_BUNDLE_SIZE : this.MAX_RAW_SIZE;
        let _maxDeflateSize = isProd ? this.MAX_BUNDLE_DEFLATE_SIZE : this.MAX_RAW_DEFLATE_SIZE;
        let postfix  = isProd? " (prod)" : " (dist)";
        let fileName = _filePath.split("..")[2];
        this.testCase({
            name: `Test AISKULight${postfix} deflate size`,
            test: () => {
                Assert.ok(true, `test file: ${fileName}`);
                let request = new Request(_filePath, {method:"GET"});
                return fetch(request).then((response) => {
                    if (!response.ok) {
                        Assert.ok(false, `fetch AISKULight${postfix} error: ${response.statusText}`);
                        return;
                    } else {
                        return response.text().then(text => {
                            let size = Math.ceil((text.length/1024) * 100) / 100.0;
                            Assert.ok(size <= _maxFullSize, `max ${_maxFullSize} KB, current deflate size is: ${size} KB`);
                            let deflateSize = Math.ceil((pako.deflate(text).length/1024) * 100) / 100.0;
                            Assert.ok(deflateSize <= _maxDeflateSize ,`max ${_maxDeflateSize} KB, current deflate size is: ${deflateSize} KB`);
                        }).catch((error: Error) => {
                            Assert.ok(false, `AISKULight${postfix} response error: ${error}`);
                        });
                    }
                }).catch((error: Error) => {
                    Assert.ok(false, `AISKULight${postfix} deflate size error: ${error}`);
                });
            }
        });
    }
}