import { AITestClass, Assert } from "@microsoft/ai-test-framework";
import { dumpObj } from '@nevware21/ts-utils';
import { createPromise, doAwait, IPromise } from '@nevware21/ts-async';
import { strUndefined } from "@microsoft/applicationinsights-core-js";
import { utlRemoveSessionStorage } from "@microsoft/applicationinsights-common";
import * as pako from "pako";
import { Snippet } from "../../../src/Snippet";

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

export class AISKUSizeCheck extends AITestClass {
    private readonly MAX_RAW_SIZE = 144;
    private readonly MAX_BUNDLE_SIZE = 144;
    private readonly MAX_RAW_DEFLATE_SIZE = 58;
    private readonly MAX_BUNDLE_DEFLATE_SIZE = 58;
    private readonly rawFilePath = "../dist/es5/applicationinsights-web.min.js";
    // Automatically updated by version scripts
    private readonly currentVer = "3.3.4";
    private readonly prodFilePath = `../browser/es5/ai.${this.currentVer[0]}.min.js`;

    public testInitialize() {

    }

    public testFinishedCleanup(): void {
        if (typeof window !== strUndefined) {
            var _window = window;
            let aiName = _window["appInsightsSDK"] || "appInsights";
            if (_window[aiName] !== undefined) {
                const snippet: Snippet = _window[aiName] as any;
                if (snippet["unload"]) {
                    snippet["unload"](false);
                } else {
                    if (snippet["appInsightsNew"]) {
                        snippet["appInsightsNew"].unload();
                    }
                }
            }
        }
    }

    public testCleanup() {
        utlRemoveSessionStorage(null as any, "AI_sentBuffer", );
        utlRemoveSessionStorage(null as any, "AI_buffer", );
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
        let _maxFullSize = isProd ? this.MAX_BUNDLE_SIZE : this.MAX_RAW_SIZE;
        let _maxDeflateSize = isProd ? this.MAX_BUNDLE_DEFLATE_SIZE : this.MAX_RAW_DEFLATE_SIZE;
        let postfix  = isProd? " (prod)" : " (dist)";
        let fileName = _filePath.split("..")[2];
        this.testCase({
            name: `Test AISKU${postfix} deflate size`,
            test: () => {
                Assert.ok(true, `test file: ${fileName}`);
                return _loadPackageJson((isNightly, packageJson) => {
                    Assert.ok(true, `  checking : ${packageJson.name || "??"} v${packageJson.version || "unknown"}`);
                    let request = new Request(_filePath, {method:"GET"});
                    return fetch(request).then((response) => {
                        if (!response.ok) {
                            Assert.ok(false, `fetch AISKU${postfix} error: ${response.statusText}`);
                            return;
                        } else {
                            return response.text().then(text => {
                                let size = Math.ceil((text.length/1024) * 100) / 100.0;
                                _checkSize("bundle", _maxFullSize, size, isNightly);
                                
                                let deflateSize = Math.ceil((pako.deflate(text).length/1024) * 100) / 100.0;
                                _checkSize("deflate", _maxDeflateSize, deflateSize, isNightly);
                            }).catch((error: Error) => {
                                Assert.ok(false, `AISKU${postfix} response error: ${error}`);
                            });
                        }
                    }).catch((error: Error) => {
                        Assert.ok(false, `AISKU${postfix} deflate size error: ${error}`);
                    });
                });
            }
        });
    }
}