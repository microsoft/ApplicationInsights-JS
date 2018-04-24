/// <reference path="../TestFramework/Common.ts" />
/// <reference path="../../JavaScriptSDK/Util.ts" />

class CorrelationIdHelperTests extends TestClass {

    public registerTests() {
        var CorrelationIdHelper = Microsoft.ApplicationInsights.CorrelationIdHelper;

        this.testCase({
            name: "CorrelationIdHelper: should return true if arguments are missing",
            test: () => {
                Assert.equal(true, CorrelationIdHelper.canIncludeCorrelationHeader(null, null));

                var config1: Microsoft.ApplicationInsights.IConfig = {};
                Assert.equal(true, CorrelationIdHelper.canIncludeCorrelationHeader(config1, null));

                var config2: Microsoft.ApplicationInsights.IConfig = {
                    correlationHeaderExcludedDomains: []
                };
                Assert.equal(true, CorrelationIdHelper.canIncludeCorrelationHeader(config2, null));
            }
        });

        this.testCase({
            name: "CorrelationIdHelper: should return false if disableCorrelationHeaders set to true",
            test: () => {
                var config: Microsoft.ApplicationInsights.IConfig = {
                    disableCorrelationHeaders: true
                };
               Assert.equal(false, CorrelationIdHelper.canIncludeCorrelationHeader(config, "some"));            
            }
        });

        this.testCase({
            name: "CorrelationIdHelper: should return true if domain is not on the excluded list",
            test: () => {
                var config: Microsoft.ApplicationInsights.IConfig = {
                    correlationHeaderExcludedDomains: ["example.com", "bing.net", "abc.bing.com"]
                };
                let url = "http://bing.com/search?q=example.com";
    
                Assert.equal(true, CorrelationIdHelper.canIncludeCorrelationHeader(config, url));
            }
        });

        this.testCase({
            name: "CorrelationIdHelper: should return false if domain is on the excluded list",
            test: () => {
                var config: Microsoft.ApplicationInsights.IConfig = {
                    correlationHeaderExcludedDomains: ["bing.com", "bing.net"]
                };
                let url = "http://bing.com/search?q=node";
    
                Assert.equal(false, CorrelationIdHelper.canIncludeCorrelationHeader(config, url));
    
                let urlSecure = "https://bing.com/search?q=node";
    
                Assert.equal(false, CorrelationIdHelper.canIncludeCorrelationHeader(config, urlSecure));
    
                let secondDomainUrl = "http://bing.net/search?q=node";
    
                Assert.equal(false, CorrelationIdHelper.canIncludeCorrelationHeader(config, secondDomainUrl));
            }
        });

        this.testCase({
            name: "CorrelationIdHelper: can take wildcards in the excluded domain list",
            test: () => {
                var config: Microsoft.ApplicationInsights.IConfig = {
                    correlationHeaderExcludedDomains: ["*.bing.com"]
                };
                let url = "https://abc.bing.com";
    
                Assert.equal(false, CorrelationIdHelper.canIncludeCorrelationHeader(config, url));
            }
        });
    }
}
new CorrelationIdHelperTests().registerTests(); 