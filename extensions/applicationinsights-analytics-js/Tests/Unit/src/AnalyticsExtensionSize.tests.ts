import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { dumpObj } from '@nevware21/ts-utils';
import { createPromise, doAwait, IPromise } from '@nevware21/ts-async';
import * as pako from "pako";

const PACKAGE_JSON = "../package.json";

function removeTrailingComma(text) {
    return text.replace(/,(\s*[}\],])/g, "$1");
}

function _loadPackageJson(cb:(isNightly: boolean, packageJson: any) => IPromise<void>): IPromise<void> {
    return createPromise<void>((testCompleted, testFailed) => {
        function _handleCallback(packageJson: any) {
            let version = packageJson.version || "unknown";
            let isNightly = version.includes("nightly") || version.includes("dev");
            doAwait(cb(isNightly, packageJson), () => {
                testCompleted();
            }, (error) => {
                Assert.ok(false, `checkIsNightlyBuild error: ${error}`);
                testFailed(error);
            });
        }

        fetch(PACKAGE_JSON).then((response) => {
            if (!response.ok) {
                Assert.ok(false, `fetch package.json error: ${dumpObj(response)}`);
                _handleCallback(false);
            } else {
                return response.text().then((content) => {
                    let json = JSON.parse(removeTrailingComma(content));
                    _handleCallback(json);
                }, (error) => {
                    Assert.ok(false, `fetch package.json error: ${error}`);
                    _handleCallback({});
                });
            }
        }, (error) => {
            Assert.ok(false, `fetch package.json error: ${error}`);
            _handleCallback({});
        });
    });
}

function _checkSize(checkType: string, maxSize: number, size: number, isNightly: boolean): void {
  if (isNightly) {
        maxSize += .5;
    }

    Assert.ok(size <= maxSize, `exceed ${maxSize} KB, current ${checkType} size is: ${size} KB`);
}    

export class AnalyticsExtensionSizeCheck extends AITestClass {
    private readonly MAX_DEFLATE_SIZE = 27;
    private readonly rawFilePath = "../dist/es5/applicationinsights-analytics-js.min.js";
    private readonly prodFilePaath = "../browser/es5/applicationinsights-analytics-js.min.js"

    public testInitialize() {
    }

    public testCleanup() {
    }

    public registerTests() {
        this.addRawFileSizeCheck();
        this.addProdFileSizeCheck();
    }

    constructor() {
        super("AnalyticsExtensionSizeCheck");
    }

    private addRawFileSizeCheck(): void {
        this._fileSizeCheck(false);
    }
    private addProdFileSizeCheck(): void {
        this._fileSizeCheck(true);
    }
    
    private _fileSizeCheck(isProd: boolean): void {
        let _filePath = isProd? this.prodFilePaath : this.rawFilePath;
        let postfix = isProd? "" : "-raw";
        let fileName = _filePath.split("..")[1];
        this.testCase({
            name: `Test applicationinsights-analytics-extension${postfix} deflate size`,
            test: () => {
                Assert.ok(true, `test file: ${fileName}`);
                return _loadPackageJson((isNightly, packageJson) => {
                    Assert.ok(true, `  checking : ${packageJson.name || "??"} v${packageJson.version || "unknown"}`);
                    let request = new Request(_filePath, {method:"GET"});
                    return fetch(request).then((response) => {
                        if (!response.ok) {
                            Assert.ok(false, `fetch applicationinsights-analytics${postfix} error: ${response.statusText}`);
                            return;
                        } else {
                            return response.text().then(text => {
                                let size = Math.ceil((pako.deflate(text).length/1024) * 100) / 100.0;
                                _checkSize("deflate", this.MAX_DEFLATE_SIZE, size, isNightly);
                            }).catch((error) => {
                                Assert.ok(false, `applicationinsights-analytics-extension${postfix}  response error: ${error}`);
                            });
                        }
                    }).catch((error: Error) => {
                        Assert.ok(false, `applicationinsights-analytics-extension${postfix}  deflate size error: ${error}`);
                    });
                });
            }
        });
    } 
}