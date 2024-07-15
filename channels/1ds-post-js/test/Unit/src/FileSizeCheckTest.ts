import { AITestClass } from "@microsoft/ai-test-framework";
import { createPromise } from '@nevware21/ts-async';
import * as pako from 'pako';

const MAX_DEFLATE_SIZE = 26.5;

export class FileSizeCheckTest extends AITestClass {

    public testInitialize() {
    }

    public registerTests() {
      this.testCase({
        name: "Test ms.post gzip size",
        useFakeServer: false,
        test: () => {
          return createPromise<void>((testCompleted, testFailed) => {
            let xhr = new XMLHttpRequest();
            xhr.open('GET', '../bundle/es5/ms.post.min.js',true);
            xhr.onload = () => {
                let size = Math.ceil(pako.deflate(xhr.responseText).length/1024);
                QUnit.assert.ok(size <= MAX_DEFLATE_SIZE ,`exceed ${MAX_DEFLATE_SIZE} KB, current deflate size is: ${size} KB`)
                testCompleted();
            };
            xhr.send()
            xhr.onerror = (err) =>{
                QUnit.assert.ok(false,"error in getting deflate size: " + err)
                testFailed(err);
            }
          })
        }
    });
  }
}


