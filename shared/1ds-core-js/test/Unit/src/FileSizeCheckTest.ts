import { AITestClass } from "@microsoft/ai-test-framework";
import * as pako from 'pako';

export class FileSizeCheckTest extends AITestClass {
    private readonly MAX_BUNDLE_SIZE = 66;
    private readonly MAX_DEFLATE_SIZE = 28;
    private readonly bundleFilePath = "../bundle/es5/ms.core.min.js";

    public testInitialize() {
    }


    public registerTests() {
        this._checkFileSize(this.bundleFilePath);
    }

    private _checkFileSize(_filePath: string): void {
        let fileName = /\/([\w\.-]+)$/.exec(_filePath)[1];
        this.testCase({
            name: `Test ${fileName} deflate size`,
            test: () => {
                QUnit.assert.ok(true, `test file: ${fileName}`);
                let request = new Request(_filePath, { method: "GET" });
                return fetch(request).then((response) => {
                    if (!response.ok) {
                        QUnit.assert.ok(false, `fetch ${fileName} error: ${response.statusText}`);
                        return;
                    } else {
                        return response.text().then(text => {
                            let size = Math.ceil((text.length / 1024) * 100) / 100.0;
                            QUnit.assert.ok(size <= this.MAX_BUNDLE_SIZE, `max ${this.MAX_BUNDLE_SIZE} KB, current bundle size is: ${size} KB`);

                            size = Math.ceil((pako.deflate(text).length / 1024) * 100) / 100.0;
                            QUnit.assert.ok(size <= this.MAX_DEFLATE_SIZE, `max ${this.MAX_DEFLATE_SIZE} KB, current deflated size is: ${size} KB`);
                        }).catch((error: Error) => {
                            QUnit.assert.ok(false, `${fileName} response error: ${error}`);
                        });
                    }
                }).catch((error: Error) => {
                    QUnit.assert.ok(false, `${fileName} deflate size error: ${error}`);
                });
            }
        });
    }  
}


