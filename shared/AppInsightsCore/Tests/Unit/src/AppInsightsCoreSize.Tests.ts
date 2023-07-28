import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import * as pako from "pako";

export class AppInsightsCoreSizeCheck extends AITestClass {
    private readonly MAX_RAW_SIZE = 46;
    private readonly MAX_BUNDLE_SIZE = 46;
    private readonly MAX_RAW_DEFLATE_SIZE = 20;
    private readonly MAX_BUNDLE_DEFLATE_SIZE = 20;
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
        let _filePath = isProd? this.prodFilePath : this.rawFilePath;
        let _maxFullSize = isProd ? this.MAX_BUNDLE_SIZE : this.MAX_RAW_SIZE;
        let _maxDeflateSize = isProd ? this.MAX_BUNDLE_DEFLATE_SIZE : this.MAX_RAW_DEFLATE_SIZE;
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
                            let size = Math.ceil((text.length/1024) * 100) / 100.0;
                            Assert.ok(size <= _maxFullSize, `max ${_maxFullSize} KB, current deflate size is: ${size} KB`);
                            let deflateSize = Math.ceil((pako.deflate(text).length/1024) * 100) / 100.0;
                            Assert.ok(deflateSize <= _maxDeflateSize ,`max ${_maxDeflateSize} KB, current deflate size is: ${deflateSize} KB`);
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