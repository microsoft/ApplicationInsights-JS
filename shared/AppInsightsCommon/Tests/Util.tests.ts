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

        this.testCase({
            name: "Check disableSameSiteCookie status",
            test: () => {
                let excludeValues = [
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36 Edge/17.17134",
                    "Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Mobile/15E148 Safari/604.1",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36 Edge/18.17763",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36 Edge/16.16299",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; WebView/3.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36 Edge/17.17134",
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0.2 Safari/605.1.15",
                    "Mozilla/5.0 (Windows Phone 10.0; Android 6.0.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Mobile Safari/537.36 Edge/18.17763",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; Xbox; Xbox One) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36 Edge/18.17763",
                    "Mozilla/5.0 (iPhone; CPU iPhone OS 12_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Mobile/15E148 Safari/604.1",
                    "Mozilla/5.0 (iPad; CPU OS 12_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Mobile/15E148 Safari/604.1",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36 Edge/15.15063",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; Xbox; Xbox One; MSAppHost/3.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36 Edge/18.17763",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.79 Safari/537.36 Edge/14.14393",
                    "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36 Edge/17.17134",
                    "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36",
                    "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36",
                    "Mozilla/5.0 (iPhone; CPU iPhone OS 12_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/71.0.3578.89 Mobile/15E148 Safari/605.1",
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0.1 Safari/605.1.15",
                    "Mozilla/5.0 (iPhone; CPU iPhone OS 12_0_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Mobile/15E148 Safari/604.1",
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Safari/605.1.15",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; WebView/3.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36 Edge/18.17763",
                    "Mozilla/5.0 (iPhone; CPU iPhone OS 12_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/65.0.225212226 Mobile/15E148 Safari/605.1",
                    "Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Mobile/15E148 Safari/604.1",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; WebView/3.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36 Edge/16.16299",
                    "Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16C101",
                    "Mozilla/5.0 (iPad; CPU OS 12_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Mobile/15E148 Safari/604.1",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Teams/1.1.00.31860 Chrome/61.0.3163.100 Electron/2.0.10 Safari/537.36",
                    "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36",
                    "Mozilla/5.0 (Linux; Android 8.0.0; SAMSUNG SM-G950F Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/8.2 Chrome/63.0.3239.111 Mobile Safari/537.36",
                    "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36 Edge/18.17763",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.62 Safari/537.36",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; Xbox; Xbox One; WebView/3.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36 Edge/18.17763",
                    "Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Mobile/15E148 Safari/604.1",
                    "Mozilla/5.0 (Linux; Android 8.0.0; SAMSUNG SM-G960F Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/8.2 Chrome/63.0.3239.111 Mobile Safari/537.36",
                    "Mozilla/5.0 (Linux; Android 8.0.0; SAMSUNG SM-G930F Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/8.2 Chrome/63.0.3239.111 Mobile Safari/537.36",
                    "Mozilla/5.0 (iPad; CPU OS 12_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/71.0.3578.89 Mobile/15E148 Safari/605.1",
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_2) AppleWebKit/605.1.15 (KHTML, like Gecko)",
                    "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36 SE 2.X MetaSr 1.0",
                    "Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Mobile/15E148 Safari/604.1",
                    "Mozilla/5.0 (Windows NT 10.0; WebView/3.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36 Edge/17.17134",
                    "Mozilla/5.0 (Linux; Android 8.0.0; SAMSUNG SM-G935F Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/8.2 Chrome/63.0.3239.111 Mobile Safari/537.36",
                    "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36",
                    "Mozilla/5.0 (iPad; CPU OS 12_0_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Mobile/15E148 Safari/604.1",
                    "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36 Edge/16.16299",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; WebView/3.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36 Edge/15.15063",
                    "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.26 Safari/537.36 Core/1.63.6821.400 QQBrowser/10.3.3040.400",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Yammer/2.1.0 Chrome/66.0.3359.181 Electron/3.0.6 Safari/537.36",
                    "Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36",
                    "Mozilla/5.0 (Linux; Android 8.0.0; SAMSUNG SM-G965F Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/8.2 Chrome/63.0.3239.111 Mobile Safari/537.36",
                    "Mozilla/5.0 (Linux; Android 8.0.0; SAMSUNG SM-A520F Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/8.2 Chrome/63.0.3239.111 Mobile Safari/537.36",
                    "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36",
                    "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36 SE 2.X MetaSr 1.0",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36",
                    "Mozilla/5.0 (Linux; Android 8.0.0; SAMSUNG SM-G955F Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/8.2 Chrome/63.0.3239.111 Mobile Safari/537.36",
                    "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.98 Safari/537.36 LBBROWSER",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.79 Safari/537.36",
                    "Mozilla/5.0 (Linux; Android 8.0.0; SAMSUNG SM-G950U Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/8.2 Chrome/63.0.3239.111 Mobile Safari/537.36",
                    "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.79 Safari/537.36 Edge/14.14393",
                    "Mozilla/5.0 (Linux; Android 8.0.0; SAMSUNG SM-G960U Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/8.2 Chrome/63.0.3239.111 Mobile Safari/537.36",
                    "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Teams/1.1.00.31860 Chrome/61.0.3163.100 Electron/2.0.10 Safari/537.36",
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0.3 Safari/605.1.15",
                    "Mozilla/5.0 (iPad; CPU OS 12_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/65.0.225212226 Mobile/15E148 Safari/605.1",
                    "Mozilla/5.0 (iPad; CPU OS 12_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16C50",
                    "Mozilla/5.0 (Linux; Android 8.0.0; SAMSUNG SM-N950U Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/8.2 Chrome/63.0.3239.111 Mobile Safari/537.36",
                    "Mozilla/5.0 (iPad; CPU OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Mobile/15E148 Safari/604.1",
                    "Mozilla/5.0 (Linux; Android 8.0.0; SAMSUNG SM-G965U Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/8.2 Chrome/63.0.3239.111 Mobile Safari/537.36",
                    "Mozilla/5.0 (Linux; Android 6.0.1; SM-G532M Build/MMB29T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.91 Mobile Safari/537.36",
                    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.79 Safari/537.36",
                    "Mozilla/5.0 (Linux; Android 7.0; SAMSUNG SM-G920F Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/8.2 Chrome/63.0.3239.111 Mobile Safari/537.36",
                    "Mozilla/5.0 (Linux; Android 8.0.0; SAMSUNG SM-G955U Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/8.2 Chrome/63.0.3239.111 Mobile Safari/537.36",
                    "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.26 Safari/537.36 Core/1.63.6821.400 QQBrowser/10.3.3040.400",
                    "Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 EdgiOS/42.8.6 Mobile/16C101 Safari/605.1.15",
                    "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.139 Safari/537.36",
                    "Mozilla/5.0 (Linux; Android 8.0.0; SAMSUNG SM-N950F Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/8.2 Chrome/63.0.3239.111 Mobile Safari/537.36",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36",
                    "Mozilla/5.0 (Linux; Android 8.1.0; SAMSUNG SM-J530F Build/M1AJQ) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/8.2 Chrome/63.0.3239.111 Mobile Safari/537.36"
                ];

                let acceptValues = [
                    "",
                    null,
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:64.0) Gecko/20100101 Firefox/64.0",
                    "Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko",
                    "Mozilla/5.0 (Windows NT 6.1; Trident/7.0; rv:11.0) like Gecko/20100101 Firefox/12.0",
                    "Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0)",
                    "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:64.0) Gecko/20100101 Firefox/64.0",
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/11.1.2 Safari/605.1.15"
                ];

                for (let lp = 0; lp < excludeValues.length; lp++) {
                    Assert.equal(true, Util.disallowsSameSiteNone(excludeValues[lp]), excludeValues[lp]);
                }

                for (let lp = 0; lp < acceptValues.length; lp++) {
                    Assert.equal(false, Util.disallowsSameSiteNone(acceptValues[lp]), acceptValues[lp]);
                }
            }
        });
    }
}