/// <reference path="./TestFramework/Common.ts" />

import { UrlHelper } from "../src/Util";

export class UtilTests extends TestClass {

    public testInitialize() {
    }

    public testCleanup() {}

    public registerTests() {
        this.testCase({
            name: "UrlHelper: parseUrl should contain host field even if document.createElement is not defined",
            test: () => {
                var origCreateElement = document.createElement;
                document.createElement = null;

                let passed;
                let match;
                try {
                    const host = UrlHelper.parseUrl("https://portal.azure.com/some/endpoint").host.toLowerCase();
                    passed = true;
                    match = host === "portal.azure.com";
                } catch (e) {
                    passed = false;
                }

                // Need to reset createElement before doing any assertions, else qunit crashes
                document.createElement = origCreateElement;
                Assert.ok(passed);
                Assert.ok(match, "host should be portal.azure.com");
            }
        });

        this.testCase({
            name: "UrlHelper: parseHost should return correct host name",
            test: () => {
                Assert.equal("portal.azure.com", UrlHelper.parseHost("https://portal.azure.com/some/endpoint"));
                Assert.equal("bing.com", UrlHelper.parseHost("http://www.bing.com"));
                Assert.equal("bing.com", UrlHelper.parseHost("https://www2.bing.com/"));
                Assert.equal("p.r.e.f.i.x.bing.com", UrlHelper.parseHost("http://wwW2.p.r.e.f.i.x.bing.com/"));
            }
        });
    }
}