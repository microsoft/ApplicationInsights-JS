/// <reference path="../TestFramework/Common.ts" />
/// <reference path="../../JavaScriptSDK/Util.ts" />

class CorrelationIdHelperTests extends TestClass {

    public registerTests() {
        var CorrelationIdHelper = Microsoft.ApplicationInsights.CorrelationIdHelper;

        this.testCase({
            name: "CorrelationIdHelper: test for missing arguments",
            test: () => {
                Assert.equal(false, CorrelationIdHelper.canIncludeCorrelationHeader(null, null, null));

                Assert.equal(false, CorrelationIdHelper.canIncludeCorrelationHeader({}, null, null));

                Assert.equal(false, CorrelationIdHelper.canIncludeCorrelationHeader({
                    enableCorsCorrelation: false
                }, null, null));

                Assert.equal(false, CorrelationIdHelper.canIncludeCorrelationHeader({
                    enableCorsCorrelation: false
                }, "url", null));

                Assert.equal(false, CorrelationIdHelper.canIncludeCorrelationHeader({
                    enableCorsCorrelation: false
                }, null, "host"));

                Assert.equal(false, CorrelationIdHelper.canIncludeCorrelationHeader({
                    enableCorsCorrelation: true,
                    correlationHeaderExcludedDomains: []
                }, null, null));
                
                Assert.equal(false, CorrelationIdHelper.canIncludeCorrelationHeader(null, "url1", "url2"));
            }
        });

        this.testCase({
            name: "CorrelationIdHelper: should return false for CORS if disableCorrelationHeaders set to true",
            test: () => {
                var config: Microsoft.ApplicationInsights.IConfig = {
                    disableCorrelationHeaders: true
                };
               Assert.equal(false, CorrelationIdHelper.canIncludeCorrelationHeader(config, "some", "some"));            
            }
        });

        this.testCase({
            name: "CorrelationIdHelper: should return false for CORS if enableCorsCorrelation set to false",
            test: () => {
                var config: Microsoft.ApplicationInsights.IConfig = {
                    disableCorrelationHeaders: false,
                    enableCorsCorrelation: false
                };
                let url = "http://bing.com/search?q=example.com";
                Assert.equal(false, CorrelationIdHelper.canIncludeCorrelationHeader(config, url, "diffHost"));            
            }
        });

        this.testCase({
            name: "CorrelationIdHelper: should return false for different port number if enableCorsCorrelation set to false",
            test: () => {
                var config: Microsoft.ApplicationInsights.IConfig = {
                    disableCorrelationHeaders: false,
                    enableCorsCorrelation: false
                };
                let url = "http://bing.com/search?q=example.com";
                Assert.equal(false, CorrelationIdHelper.canIncludeCorrelationHeader(config, url, "bing.com:8080"));            
            }
        });


        this.testCase({
            name: "CorrelationIdHelper: should return true for same domain if enableCorsCorrelation set to false",
            test: () => {
                var config: Microsoft.ApplicationInsights.IConfig = {
                    disableCorrelationHeaders: false,
                    enableCorsCorrelation: false
                };
                let url = "http://bing.com/search?q=example.com";
                Assert.equal(true, CorrelationIdHelper.canIncludeCorrelationHeader(config, url, "bing.com"));            
            }
        });

        this.testCase({
            name: "CorrelationIdHelper: should return true for same domain (case sensitive) if enableCorsCorrelation set to false",
            test: () => {
                var config: Microsoft.ApplicationInsights.IConfig = {
                    disableCorrelationHeaders: false,
                    enableCorsCorrelation: false
                };
                let url = "http://Bing.com/search?q=example.com";
                Assert.equal(true, CorrelationIdHelper.canIncludeCorrelationHeader(config, url, "bing.com"));            
            }
        });

        this.testCase({
            name: "CorrelationIdHelper: should return true if domain is not on the excluded list",
            test: () => {
                var config: Microsoft.ApplicationInsights.IConfig = {
                    correlationHeaderExcludedDomains: ["example.com", "bing.net", "abc.bing.com"],
                    disableCorrelationHeaders: false,
                    enableCorsCorrelation: true
                };
                let url = "http://bing.com/search?q=example.com";
    
                Assert.equal(true, CorrelationIdHelper.canIncludeCorrelationHeader(config, url, "diffHost"));
            }
        });

        this.testCase({
            name: "CorrelationIdHelper: should return false if domain is on the excluded list",
            test: () => {
                var config: Microsoft.ApplicationInsights.IConfig = {
                    correlationHeaderExcludedDomains: ["bing.com", "bing.net"],
                    disableCorrelationHeaders: false,
                    enableCorsCorrelation: true
                };
                let url = "http://bing.com/search?q=node";
    
                Assert.equal(false, CorrelationIdHelper.canIncludeCorrelationHeader(config, url, "diffHost"));
    
                let urlSecure = "https://bing.com/search?q=node";
    
                Assert.equal(false, CorrelationIdHelper.canIncludeCorrelationHeader(config, urlSecure, "diffHost"));
    
                let secondDomainUrl = "http://bing.net/search?q=node";
    
                Assert.equal(false, CorrelationIdHelper.canIncludeCorrelationHeader(config, secondDomainUrl, "diffHost"));
            }
        });

        this.testCase({
            name: "CorrelationIdHelper: can take wildcards in the excluded domain list",
            test: () => {
                var config: Microsoft.ApplicationInsights.IConfig = {
                    correlationHeaderExcludedDomains: ["*.bing.com"],
                    disableCorrelationHeaders: false,
                    enableCorsCorrelation: true
                };
                let url = "https://abc.bing.com";
    
                Assert.equal(false, CorrelationIdHelper.canIncludeCorrelationHeader(config, url, "diffHost"));
            }
        });
    }
}
new CorrelationIdHelperTests().registerTests(); 