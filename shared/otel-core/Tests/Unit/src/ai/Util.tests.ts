import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { ICorrelationConfig } from "../../../../src/interfaces/ai/ICorrelationConfig";
import { setBypassLazyCache, strStartsWith } from "@nevware21/ts-utils";
import { correlationIdCanIncludeCorrelationHeader } from "../../../../src/utils/Util";
import { createDomEvent } from "../../../../src/utils/DomHelperFuncs";
import { urlParseFullHost, urlParseHost, urlParseUrl } from "../../../../src/utils/UrlHelperFuncs";
import { getIEVersion } from "../../../../src/utils/EnvUtils";
import { uaDisallowsSameSiteNone } from "../../../../src/core/CookieMgr";

export class UtilTests extends AITestClass {
    private testRegexLists = (config: ICorrelationConfig, exp: boolean, host: string) => {
        let requestUrl = host;
        if (!strStartsWith(host, "http")) {
            requestUrl = "https://" + host;
        }
        Assert.equal(exp, correlationIdCanIncludeCorrelationHeader(config, requestUrl, "not used"), host);
    };

    public testInitialize() {
        super.testInitialize();
        setBypassLazyCache(true);
    }

    public testCleanup() {
        super.testCleanup();
    }

    public registerTests() {
        this.testCase({
            name: 'createDomEvent: creates new event if constructor is undefined',
            test: () => {
                const origEvent = (window as any).Event;
                (window as any).Event = {};
                const event = createDomEvent('something');
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
                    const host = urlParseUrl("https://portal.azure.com/some/endpoint").host.toLowerCase();
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
                Assert.equal("portal.azure.com", urlParseHost("https://portal.azure.com/some/endpoint"));
                Assert.equal("bing.com", urlParseHost("http://www.bing.com"));
                Assert.equal("bing.com", urlParseHost("https://www2.bing.com/"));
                Assert.equal("p.r.e.f.i.x.bing.com", urlParseHost("http://wwW2.p.r.e.f.i.x.bing.com/"));
                Assert.equal("p.r.e.f.i.x.bing.com", urlParseHost("http://wwW21.p.r.e.f.i.x.bing.com/"));

                Assert.equal("portal.azure.com", urlParseHost("https://portal.azure.com/some/endpoint", false));
                Assert.equal("bing.com", urlParseHost("http://www.bing.com", false));
                Assert.equal("bing.com", urlParseHost("https://www2.bing.com/", false));
                Assert.equal("p.r.e.f.i.x.bing.com", urlParseHost("http://wwW2.p.r.e.f.i.x.bing.com/", false));
                Assert.equal("bing.com", urlParseHost("https://www21.bing.com/", false));
                Assert.equal("p.r.e.f.i.x.bing.com", urlParseHost("http://wwW21.p.r.e.f.i.x.bing.com/", false));
                Assert.equal("bing.com", urlParseHost("https://www54321.bing.com/", false));
                Assert.equal("p.r.e.f.i.x.bing.com", urlParseHost("http://wwW54321.p.r.e.f.i.x.bing.com/", false));
                Assert.equal("www654321.bing.com", urlParseHost("https://www654321.bing.com/", false));
                Assert.equal("wwW654321.p.r.e.f.i.x.bing.com", urlParseHost("http://wwW654321.p.r.e.f.i.x.bing.com/", false));

                Assert.equal("portal.azure.com", urlParseHost("https://portal.azure.com/some/endpoint", true));
                Assert.equal("bing.com", urlParseHost("http://www.bing.com", true));
                Assert.equal("bing.com", urlParseHost("https://www2.bing.com/", true));
                Assert.equal("p.r.e.f.i.x.bing.com", urlParseHost("http://wwW2.p.r.e.f.i.x.bing.com/", true));

                // Check with port included
                Assert.equal("portal.azure.com", urlParseHost("https://portal.azure.com:9999/some/endpoint"));
                Assert.equal("bing.com", urlParseHost("http://www.bing.com:9999"));
                Assert.equal("bing.com", urlParseHost("https://www2.bing.com:9999/"));
                Assert.equal("p.r.e.f.i.x.bing.com", urlParseHost("http://wwW2.p.r.e.f.i.x.bing.com:9999/"));

                Assert.equal("portal.azure.com", urlParseHost("https://portal.azure.com:9999/some/endpoint", false));
                Assert.equal("bing.com", urlParseHost("http://www.bing.com:9999", false));
                Assert.equal("bing.com", urlParseHost("https://www2.bing.com:9999/", false));
                Assert.equal("p.r.e.f.i.x.bing.com", urlParseHost("http://wwW2.p.r.e.f.i.x.bing.com:9999/", false));

                Assert.equal("portal.azure.com:9999", urlParseHost("https://portal.azure.com:9999/some/endpoint", true));
                Assert.equal("bing.com:9999", urlParseHost("http://www.bing.com:9999", true));
                Assert.equal("bing.com:9999", urlParseHost("https://www2.bing.com:9999/", true));
                Assert.equal("p.r.e.f.i.x.bing.com:9999", urlParseHost("http://wwW2.p.r.e.f.i.x.bing.com:9999/", true));

                // Check with default ports present
                Assert.equal("portal.azure.com", urlParseHost("http://portal.azure.com:80/some/endpoint", true));
                Assert.equal("portal.azure.com", urlParseHost("https://portal.azure.com:443/some/endpoint", true));
                Assert.equal("portal.azure.com:80", urlParseHost("https://portal.azure.com:80/some/endpoint", true));
                Assert.equal("portal.azure.com:443", urlParseHost("http://portal.azure.com:443/some/endpoint", true));
                Assert.equal("bing.com", urlParseHost("http://www.bing.com:80", true));
                Assert.equal("bing.com", urlParseHost("https://www2.bing.com:443/", true));
                Assert.equal("bing.com:80", urlParseHost("https://www.bing.com:80", true));
                Assert.equal("bing.com:443", urlParseHost("http://www2.bing.com:443/", true));
                Assert.equal("p.r.e.f.i.x.bing.com", urlParseHost("http://wwW2.p.r.e.f.i.x.bing.com:80/", true));
                Assert.equal("p.r.e.f.i.x.bing.com", urlParseHost("https://wwW2.p.r.e.f.i.x.bing.com:443/", true));
                Assert.equal("p.r.e.f.i.x.bing.com:443", urlParseHost("http://wwW2.p.r.e.f.i.x.bing.com:443/", true));
                Assert.equal("p.r.e.f.i.x.bing.com:80", urlParseHost("https://wwW2.p.r.e.f.i.x.bing.com:80/", true));
            }
        });

        this.testCase({
            name: "UrlHelper: parseFullHost should return correct host name",
            test: () => {
                Assert.equal("portal.azure.com", urlParseFullHost("https://portal.azure.com/some/endpoint"));
                Assert.equal("www.bing.com", urlParseFullHost("http://www.bing.com"));
                Assert.equal("www2.bing.com", urlParseFullHost("https://www2.bing.com/"));
                Assert.equal("wwW2.p.r.e.f.i.x.bing.com", urlParseFullHost("http://wwW2.p.r.e.f.i.x.bing.com/"));

                Assert.equal("portal.azure.com", urlParseFullHost("https://portal.azure.com/some/endpoint", false));
                Assert.equal("www.bing.com", urlParseFullHost("http://www.bing.com", false));
                Assert.equal("www2.bing.com", urlParseFullHost("https://www2.bing.com/", false));
                Assert.equal("wwW2.p.r.e.f.i.x.bing.com", urlParseFullHost("http://wwW2.p.r.e.f.i.x.bing.com/", false));

                Assert.equal("portal.azure.com", urlParseFullHost("https://portal.azure.com/some/endpoint", true));
                Assert.equal("www.bing.com", urlParseFullHost("http://www.bing.com", true));
                Assert.equal("www2.bing.com", urlParseFullHost("https://www2.bing.com/", true));
                Assert.equal("wwW2.p.r.e.f.i.x.bing.com", urlParseFullHost("http://wwW2.p.r.e.f.i.x.bing.com/", true));

                // Check with port included
                Assert.equal("portal.azure.com", urlParseFullHost("https://portal.azure.com:9999/some/endpoint"));
                Assert.equal("www.bing.com", urlParseFullHost("http://www.bing.com:9999"));
                Assert.equal("www2.bing.com", urlParseFullHost("https://www2.bing.com:9999/"));
                Assert.equal("wwW2.p.r.e.f.i.x.bing.com", urlParseFullHost("http://wwW2.p.r.e.f.i.x.bing.com:9999/"));

                Assert.equal("portal.azure.com", urlParseFullHost("https://portal.azure.com:9999/some/endpoint", false));
                Assert.equal("www.bing.com", urlParseFullHost("http://www.bing.com:9999", false));
                Assert.equal("www2.bing.com", urlParseFullHost("https://www2.bing.com:9999/", false));
                Assert.equal("wwW2.p.r.e.f.i.x.bing.com", urlParseFullHost("http://wwW2.p.r.e.f.i.x.bing.com:9999/", false));

                Assert.equal("portal.azure.com:9999", urlParseFullHost("https://portal.azure.com:9999/some/endpoint", true));
                Assert.equal("www.bing.com:9999", urlParseFullHost("http://www.bing.com:9999", true));
                Assert.equal("www2.bing.com:9999", urlParseFullHost("https://www2.bing.com:9999/", true));
                Assert.equal("wwW2.p.r.e.f.i.x.bing.com:9999", urlParseFullHost("http://wwW2.p.r.e.f.i.x.bing.com:9999/", true));

                // Check with default ports present
                Assert.equal("portal.azure.com", urlParseFullHost("http://portal.azure.com:80/some/endpoint", true));
                Assert.equal("portal.azure.com", urlParseFullHost("https://portal.azure.com:443/some/endpoint", true));
                Assert.equal("portal.azure.com:80", urlParseFullHost("https://portal.azure.com:80/some/endpoint", true));
                Assert.equal("portal.azure.com:443", urlParseFullHost("http://portal.azure.com:443/some/endpoint", true));
                Assert.equal("www.bing.com", urlParseFullHost("http://www.bing.com:80", true));
                Assert.equal("www2.bing.com", urlParseFullHost("https://www2.bing.com:443/", true));
                Assert.equal("www.bing.com:80", urlParseFullHost("https://www.bing.com:80", true));
                Assert.equal("www2.bing.com:443", urlParseFullHost("http://www2.bing.com:443/", true));
                Assert.equal("wwW2.p.r.e.f.i.x.bing.com", urlParseFullHost("http://wwW2.p.r.e.f.i.x.bing.com:80/", true));
                Assert.equal("wwW2.p.r.e.f.i.x.bing.com", urlParseFullHost("https://wwW2.p.r.e.f.i.x.bing.com:443/", true));
                Assert.equal("wwW2.p.r.e.f.i.x.bing.com:443", urlParseFullHost("http://wwW2.p.r.e.f.i.x.bing.com:443/", true));
                Assert.equal("wwW2.p.r.e.f.i.x.bing.com:80", urlParseFullHost("https://wwW2.p.r.e.f.i.x.bing.com:80/", true));
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
            name: "CorrelationidHelper: canIncludeCorrelationHeader check when the url includes the port",
            test: () => {
                const config = {
                    enableCorsCorrelation: true,
                    correlationHeaderExcludedDomains: ["test", "*.azure.com", "ignore.microsoft.com"],
                    correlationHeaderDomains: ["azure.com", "prefix.bing.com", "*.microsoft.com"]
                } as ICorrelationConfig

                Assert.equal(true, correlationIdCanIncludeCorrelationHeader(config, "https://azure.com:443", "example.com"));
                Assert.equal(true, correlationIdCanIncludeCorrelationHeader(config, "https://azure.com:80", "example.com"));
                Assert.equal(true, correlationIdCanIncludeCorrelationHeader(config, "https://azure.com", "example.com"));
                Assert.equal(true, correlationIdCanIncludeCorrelationHeader(config, "http://azure.com:443", "example.com"));
                Assert.equal(true, correlationIdCanIncludeCorrelationHeader(config, "https://azure.com:8000", "example.com"));

                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "https://monitor.azure.com:443", "example.com"));
                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "http://monitor.azure.com:443", "example.com"));

                Assert.equal(true, correlationIdCanIncludeCorrelationHeader(config, "https://prefix.bing.com:443", "example.com"));
                Assert.equal(true, correlationIdCanIncludeCorrelationHeader(config, "https://prefix.bing.com", "example.com"));
                Assert.equal(true, correlationIdCanIncludeCorrelationHeader(config, "http://prefix.bing.com:443", "example.com"));
                Assert.equal(true, correlationIdCanIncludeCorrelationHeader(config, "https://prefix.bing.com:80", "example.com"));
                Assert.equal(true, correlationIdCanIncludeCorrelationHeader(config, "https://prefix.bing.com:8000", "example.com"));

                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "https://ignore.microsoft.com:443", "example.com"));
                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "https://ignore.microsoft.com", "example.com"));
                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "http://ignore.microsoft.com:443", "example.com"));
                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "https://ignore.microsoft.com:80", "example.com"));
                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "https://ignore.microsoft.com:8080", "example.com"));

                Assert.equal(true, correlationIdCanIncludeCorrelationHeader(config, "https://something.microsoft.com:443", "example.com"));
                Assert.equal(true, correlationIdCanIncludeCorrelationHeader(config, "https://something.microsoft.com", "example.com"));
                Assert.equal(true, correlationIdCanIncludeCorrelationHeader(config, "http://something.microsoft.com:443", "example.com"));
                Assert.equal(true, correlationIdCanIncludeCorrelationHeader(config, "https://something.microsoft.com:80", "example.com"));
                Assert.equal(true, correlationIdCanIncludeCorrelationHeader(config, "https://something.microsoft.com:8000", "example.com"));

                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "https://microsoft.com:443", "example.com"));
                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "https://microsoft.com", "example.com"));
                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "http://microsoft.com:443", "example.com"));
                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "https://microsoft.com:80", "example.com"));
                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "https://microsoft.com:8000", "example.com"));
            }
        });

        this.testCase({
            name: "CorrelationidHelper: canIncludeCorrelationHeader check when the url and include includes the port",
            test: () => {
                const config = {
                    enableCorsCorrelation: true,
                    correlationHeaderExcludedDomains: ["test", "*.azure.com", "ignore.microsoft.com"],
                    correlationHeaderDomains: ["azure.com", "prefix.bing.com", "*.microsoft.com:8080"]
                } as ICorrelationConfig

                Assert.equal(true, correlationIdCanIncludeCorrelationHeader(config, "https://azure.com:443", "example.com"));
                Assert.equal(true, correlationIdCanIncludeCorrelationHeader(config, "https://azure.com:80", "example.com"));
                Assert.equal(true, correlationIdCanIncludeCorrelationHeader(config, "https://azure.com", "example.com"));
                Assert.equal(true, correlationIdCanIncludeCorrelationHeader(config, "http://azure.com:443", "example.com"));
                Assert.equal(true, correlationIdCanIncludeCorrelationHeader(config, "https://azure.com:8000", "example.com"));

                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "https://monitor.azure.com:443", "example.com"));
                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "http://monitor.azure.com:443", "example.com"));

                Assert.equal(true, correlationIdCanIncludeCorrelationHeader(config, "https://prefix.bing.com:443", "example.com"));
                Assert.equal(true, correlationIdCanIncludeCorrelationHeader(config, "https://prefix.bing.com", "example.com"));
                Assert.equal(true, correlationIdCanIncludeCorrelationHeader(config, "http://prefix.bing.com:443", "example.com"));
                Assert.equal(true, correlationIdCanIncludeCorrelationHeader(config, "https://prefix.bing.com:80", "example.com"));
                Assert.equal(true, correlationIdCanIncludeCorrelationHeader(config, "https://prefix.bing.com:8000", "example.com"));

                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "https://ignore.microsoft.com:443", "example.com"));
                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "https://ignore.microsoft.com", "example.com"));
                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "http://ignore.microsoft.com:443", "example.com"));
                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "https://ignore.microsoft.com:80", "example.com"));
                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "https://ignore.microsoft.com:8080", "example.com"));

                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "https://something.microsoft.com:443", "example.com"));
                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "https://something.microsoft.com", "example.com"));
                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "http://something.microsoft.com:443", "example.com"));
                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "https://something.microsoft.com:80", "example.com"));
                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "https://something.microsoft.com:8000", "example.com"));
                Assert.equal(true, correlationIdCanIncludeCorrelationHeader(config, "https://something.microsoft.com:8080", "example.com"));

                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "https://microsoft.com:443", "example.com"));
                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "https://microsoft.com", "example.com"));
                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "http://microsoft.com:443", "example.com"));
                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "https://microsoft.com:80", "example.com"));
                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "https://microsoft.com:8000", "example.com"));
                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "https://microsoft.com:8080", "example.com"));
            }
        });

        this.testCase({
            name: "CorrelationidHelper: canIncludeCorrelationHeader check when the url includes the port and disabled CorsCorrelation",
            test: () => {
                const config = {
                    enableCorsCorrelation: false,
                    correlationHeaderExcludedDomains: ["test", "*.azure.com", "ignore.microsoft.com"],
                    correlationHeaderDomains: ["azure.com", "prefix.bing.com", "*.microsoft.com", "example.com"]
                } as ICorrelationConfig

                Assert.equal(true, correlationIdCanIncludeCorrelationHeader(config, "https://example.com:443", "example.com"));
                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "https://example.com:80", "example.com"));
                Assert.equal(true, correlationIdCanIncludeCorrelationHeader(config, "https://example.com", "example.com"));
                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "http://example.com:8000", "example.com"));
                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "http://example.com:443", "example.com"));
                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "https://example.com:8080", "example.com"));

                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "https://monitor.azure.com:443", "example.com"));
                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "http://monitor.azure.com:443", "example.com"));

                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "https://prefix.bing.com:443", "example.com"));
                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "https://prefix.bing.com", "example.com"));
                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "http://prefix.bing.com:443", "example.com"));
                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "https://prefix.bing.com:80", "example.com"));

                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "https://something.microsoft.com:443", "example.com"));
                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "https://something.microsoft.com", "example.com"));
                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "http://something.microsoft.com:443", "example.com"));
                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "https://something.microsoft.com:80", "example.com"));

                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "https://microsoft.com:443", "example.com"));
                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "https://microsoft.com", "example.com"));
                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "http://microsoft.com:443", "example.com"));
                Assert.equal(false, correlationIdCanIncludeCorrelationHeader(config, "https://microsoft.com:80", "example.com"));
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
                    Assert.equal(true, uaDisallowsSameSiteNone(excludeValues[lp]), excludeValues[lp]);
                }

                for (let lp = 0; lp < acceptValues.length; lp++) {
                    Assert.equal(false, uaDisallowsSameSiteNone(acceptValues[lp]), acceptValues[lp]);
                }
            }
        });

        this.testCase({
            name: "check getIEVersion",
            test: () => {
                let notIEValues = [
                    "",
                    null,
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

                for (let lp = 0; lp < notIEValues.length; lp++) {
                    let ieVersion = getIEVersion(notIEValues[lp]);
                    Assert.equal(null, ieVersion, "Not IE: " + notIEValues[lp]);
                }

                Assert.equal(7, getIEVersion("Mozilla/4.0 (compatible; MSIE 7.0b; Windows NT 6.0)"));
                Assert.equal(7, getIEVersion("Mozilla/5.0 (compatible; MSIE 7.0; Windows NT 6.0; en-US)"));
                Assert.equal(7, getIEVersion("Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0; WOW64; Trident/4.0;)"));
                Assert.equal(8, getIEVersion("Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 5.1; Trident/4.0)"));
                Assert.equal(8, getIEVersion("Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1; Trident/4.0)"));
                Assert.equal(8, getIEVersion("Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0; WOW64; Trident/4.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; .NET CLR 1.0.3705; .NET CLR 1.1.4322)"));
                Assert.equal(8, getIEVersion("Mozilla/4.0 (Compatible; MSIE 8.0; Windows NT 5.2; Trident/6.0)"));
                Assert.equal(9, getIEVersion("Mozilla/4.0 (compatible; MSIE 9.0; Windows NT 6.0)"));
                Assert.equal(9, getIEVersion("Mozilla/4.0 (compatible; MSIE 9.0; Windows NT 6.1)"));
                Assert.equal(10, getIEVersion("Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; WOW64; Trident/6.0)"));
                Assert.equal(10, getIEVersion("Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2)"));
                Assert.equal(11, getIEVersion("Mozilla/5.0 (Windows NT 6.1; Trident/7.0; rv:11.0) like Gecko"));
                Assert.equal(11, getIEVersion("Mozilla/5.0 (Windows NT 6.2; Trident/7.0; rv:11.0) like Gecko"));
                Assert.equal(11, getIEVersion("Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko"));
                Assert.equal(11, getIEVersion("Mozilla/5.0 (Windows NT 10.0; Trident/7.0; rv:11.0) like Gecko"));
                Assert.equal(11, getIEVersion("Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; AS; rv:11.0) like Gecko"));

                const origDocMode = document['documentMode'];
                document['documentMode'] = 11;
 
                Assert.equal(11, getIEVersion("Mozilla/4.0 (Compatible; MSIE 8.0; Windows NT 5.2; Trident/6.0)"));
                Assert.equal(11, getIEVersion("Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.2; Win64; x64; Trident/7.0; .NET4.0C; .NET4.0E)"));

                // restore documentMode
                document['documentMode'] = origDocMode;
            }
        });
    }
}
