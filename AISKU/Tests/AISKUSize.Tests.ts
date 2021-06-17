import { TestClass } from "./TestFramework/TestClass";
import { Assert } from "./TestFramework/Assert";
import * as pako from "pako";

export class AISKUSizeCheck extends TestClass {
    private readonly MAX_DEFLATE_SIZE = 40;
    private readonly filePath = "../../dist/applicationinsights-web.min.js";

    public testInitialize() {
    }

    public testCleanup() {
    }

    public registerTests() {
        this.addFileSizeCheck();
    }

    constructor() {
        super("AISKUSizeCheck");
    }

    private addFileSizeCheck(): void {
        this.testCase({
            name: "test AISKU deflate size",
            test: () => {
                let request = new Request(this.filePath, {method:"GET"});
                return fetch(request).then((response) => {
                    if (!response.ok) {
                        Assert.ok(false, "fetch AISKU error: " + response.statusText);
                        return;
                    } else {
                        return response.text().then(text => {
                            let size = Math.ceil(pako.deflate(text).length/1024);
                            Assert.ok(size <= this.MAX_DEFLATE_SIZE ,`max ${this.MAX_DEFLATE_SIZE} KB, current deflate size is: ${size} KB`);
                        }).catch((error: Error) => {
                            Assert.ok(false, "AISKU response error: " + error);
                        });
                    }
                }).catch((error: Error) => {
                    Assert.ok(false, "AISKU deflate size error: " + error);
                });
            }
        });
    }                 
}