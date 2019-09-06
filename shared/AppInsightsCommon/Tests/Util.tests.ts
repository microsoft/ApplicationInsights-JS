/// <reference path="./TestFramework/Common.ts" />

import { UrlHelper, CorrelationIdHelper, Util } from "../src/Util";
import { ICorrelationConfig } from "../src/Interfaces/ICorrelationConfig";

export class UtilTests extends TestClass {
    private testRegexLists = (config: ICorrelationConfig, exp: boolean, host: string) => {
        const stub = sinon.stub(UrlHelper, "parseUrl", (str: string) => ({host: str}));
        Assert.equal(exp, CorrelationIdHelper.canIncludeCorrelationHeader(config, host, "not used"), host);
        stub.restore();
    };

    public testInitialize() {
    }

    public testCleanup() {}

    public registerTests() {
        this.testCase({
            name: 'createDomEvent: creates new event if constructor is undefined',
            test: () => {
                const origEvent = (window as any).Event;
                (window as any).Event = {};
                const event = Util.createDomEvent('something');
                Assert.equal('something', event.type);
                (window as any).Event = origEvent;
            }
        });

        this.testCase({
            name: "UrlHelper: parseUrl should contain host field even if document.createElement is not defined",
            test: () => {
                const origCreateElement = document.createElement;
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

        this.testCase({
            name: "CorrelationidHelper: canIncludeCorrelationHeader should follow included domains",
            test: () => {
                const config = {
                    enableCorsCorrelation: true,
                    correlationHeaderDomains: ["azure.com", "prefix.bing.com"]
                } as ICorrelationConfig
                this.testRegexLists(config, false, "test");
                this.testRegexLists(config, true, "portal.azure.com");
                this.testRegexLists(config, true, "azure.com");
                this.testRegexLists(config, false, "localhost");
                this.testRegexLists(config, false, "bing.com");
                this.testRegexLists(config, true, "prefix.bing.com");
            }
        });

        this.testCase({
            name: "CorrelationidHelper: canIncludeCorrelationHeader should follow excluded domains",
            test: () => {
                const config = {
                    enableCorsCorrelation: true,
                    correlationHeaderExcludedDomains: ["test", "*.azure.com"]
                } as ICorrelationConfig
                this.testRegexLists(config, false, "test");
                this.testRegexLists(config, false, "portal.azure.com");
                this.testRegexLists(config, true, "azure.com");
                this.testRegexLists(config, true, "localhost");
                this.testRegexLists(config, true, "bing.com");
                this.testRegexLists(config, true, "prefix.bing.com");
            }
        });

        this.testCase({
            name: "CorrelationidHelper: canIncludeCorrelationHeader should check excluded domains if included domains list is also provided",
            test: () => {
                const config = {
                    enableCorsCorrelation: true,
                    correlationHeaderExcludedDomains: ["test", "*.azure.com", "ignore.microsoft.com"],
                    correlationHeaderDomains: ["azure.com", "prefix.bing.com", "*.microsoft.com"]
                } as ICorrelationConfig
                this.testRegexLists(config, false, "test");
                this.testRegexLists(config, false, "portal.azure.com");
                this.testRegexLists(config, true, "azure.com");
                this.testRegexLists(config, false, "localhost");
                this.testRegexLists(config, false, "bing.com");
                this.testRegexLists(config, true, "prefix.bing.com");
                this.testRegexLists(config, false, "ignore.microsoft.com");
                this.testRegexLists(config, false, "should.ignore.microsoft.com");
                this.testRegexLists(config, true, "something.microsoft.com");
                this.testRegexLists(config, false, "microsoft.com");
            }
        });
    }
}