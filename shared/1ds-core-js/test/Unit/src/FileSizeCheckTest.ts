import { AITestClass } from "@microsoft/ai-test-framework";
import { dumpObj, mathCeil } from '@nevware21/ts-utils';
import { createPromise, doAwait, IPromise } from '@nevware21/ts-async';
import * as pako from 'pako';

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
                QUnit.assert.ok(false, `checkIsNightlyBuild error: ${error}`);
                testFailed(error);
            });
        }

        fetch(PACKAGE_JSON).then((response) => {
            if (!response.ok) {
                QUnit.assert.ok(false, `fetch package.json error: ${dumpObj(response)}`);
                _handleCallback(false);
            } else {
                return response.text().then((content) => {
                    let json = JSON.parse(removeTrailingComma(content));
                    _handleCallback(json);
                }, (error) => {
                    QUnit.assert.ok(false, `fetch package.json error: ${error}`);
                    _handleCallback({});
                });
            }
        }, (error) => {
            QUnit.assert.ok(false, `fetch package.json error: ${error}`);
            _handleCallback({});
        });
    });
}

function _checkSize(checkType: string, maxSize: number, size: number, isNightly: boolean): void {
    if (isNightly) {
        maxSize += .5;
    }

    QUnit.assert.ok(size <= maxSize, `exceed ${maxSize} KB, current ${checkType} size is: ${size} KB`);
}

export class FileSizeCheckTest extends AITestClass {
    private readonly MAX_BUNDLE_SIZE = 90;
    private readonly MAX_DEFLATE_SIZE = 38;
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
                return _loadPackageJson((isNightly, packageJson) => {
                    QUnit.assert.ok(true, `  checking : ${packageJson.name || "??"} v${packageJson.version || "unknown"}`);
                    let request = new Request(_filePath, { method: "GET" });
                    return fetch(request).then((response) => {
                        if (!response.ok) {
                            QUnit.assert.ok(false, `fetch ${fileName} error: ${response.statusText}`);
                            return;
                        } else {
                            return response.text().then(text => {
                                let size = mathCeil((text.length / 1024) * 100) / 100.0;
                                _checkSize("bundle", this.MAX_BUNDLE_SIZE, size, isNightly);

                                size = mathCeil((pako.deflate(text).length / 1024) * 100) / 100.0;
                                _checkSize("deflate", this.MAX_DEFLATE_SIZE, size, isNightly);
                            }).catch((error: Error) => {
                                QUnit.assert.ok(false, `${fileName} response error: ${error}`);
                            });
                        }
                    }).catch((error: Error) => {
                        QUnit.assert.ok(false, `${fileName} deflate size error: ${error}`);
                    });
                });
            }
        });
    }  
}


