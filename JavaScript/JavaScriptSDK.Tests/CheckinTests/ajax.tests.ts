/// <reference path="..\TestFramework\Common.ts" />
/// <reference path="../../JavaScriptSDK/ajax/ajax.ts" />
/// <reference path="../../JavaScriptSDK/Util.ts"/>

class AjaxTests extends TestClass {

    public registerTests() {

        this.testCase({
            name: "Ajax: xhr.open gets instrumented",
            test: () => {
                var appInsightsMock = { trackAjax: () => { } }
                var ajax = new Microsoft.ApplicationInsights.AjaxMonitor(<any>appInsightsMock);

                // act
                var xhr = new XMLHttpRequest();
                Assert.ok(xhr.onreadystatechange == null, "Asserting that onreadystatechange is not set to validate that our ajax instrumentation sets it itself.");
                xhr.open("GET", "http://microsoft.com");

                // assert
                var ajaxData = (<any>xhr).ajaxData;
                Assert.ok(xhr.onreadystatechange != null, "Onreadystatechange was not set.");
                Assert.equal("http://microsoft.com", ajaxData.requestUrl, "RequestUrl is collected correctly");
                Assert.equal(true, ajaxData.async, "Async flag is collected correctly");
            }
        });

        this.testCase({
            name: "Ajax: ajaxData is removed from xhr after it's completed.",
            test: () => {
                var appInsightsMock = { trackAjax: () => { } }
                var ajax = new Microsoft.ApplicationInsights.AjaxMonitor(<any>appInsightsMock);
                
                // act
                var xhr = new XMLHttpRequest();                
                xhr.open("GET", "http://microsoft.com");
                xhr.send();
                this.server.respond();

                // assert
                var ajaxData = (<any>xhr).ajaxData;
                Assert.ok(!xhr.hasOwnProperty("ajaxData"), "ajaxData should be removed from xhr to prevent memory leaks");
            }
        });
    }
}
new AjaxTests().registerTests();