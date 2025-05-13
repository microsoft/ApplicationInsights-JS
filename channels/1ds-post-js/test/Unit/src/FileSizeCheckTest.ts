import { AITestClass } from "@microsoft/ai-test-framework";
import { dumpObj, mathCeil } from '@nevware21/ts-utils';
import { createPromise, doAwait, IPromise } from '@nevware21/ts-async';
import * as pako from 'pako';

const MAX_DEFLATE_SIZE = 27;

const PACKAGE_JSON = "../package.json";

function removeTrailingComma(text) {
    return text.replace(/,(\s*[}\],])/g, "$1");
}

function _loadPackageJson(cb: (isNightly: boolean, packageJson: any) => IPromise<void>): IPromise<void> {
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

    public testInitialize() {
    }

    public registerTests() {
        this.testCase({
            name: "Test ms.post gzip size",
            useFakeServer: false,
            test: () => {
                return _loadPackageJson((isNightly, packageJson) => {
                    QUnit.assert.ok(true, `  checking : ${packageJson.name || "??"} v${packageJson.version || "unknown"}`);
                    return createPromise<void>((testCompleted, testFailed) => {
                        let xhr = new XMLHttpRequest();
                        xhr.open('GET', '../bundle/es5/ms.post.min.js', true);
                        xhr.onload = () => {
                            let size = mathCeil(pako.deflate(xhr.responseText).length / 1024);
                            _checkSize("deflate", MAX_DEFLATE_SIZE, size, isNightly);
                            testCompleted();
                        };
                        xhr.send()
                        xhr.onerror = (err) => {
                            QUnit.assert.ok(false, "error in getting deflate size: " + err)
                            testFailed(err);
                        }
                    });
                });
            }
        });
    }
}


