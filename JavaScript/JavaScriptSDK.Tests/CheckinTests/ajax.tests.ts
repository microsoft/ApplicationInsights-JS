/// <reference path="..\TestFramework\Common.ts" />
/// <reference path="../../JavaScriptSDK/ajax/ajax.ts" />
/// <reference path="../../JavaScriptSDK/Util.ts"/>

class AjaxTests extends TestClass {

    public registerTests() {

        this.testCase({
            name: "Ajax: xhr.open is instrumented",
            test: () => {
                var appInsightsMock = { trackAjax: () => { } }
                var ajax = new Microsoft.ApplicationInsights.AjaxMonitor(<any>appInsightsMock);

                // act
                var xhr = new XMLHttpRequest();
                xhr.open("GET", "http://microsoft.com");

                // assert
                var ajaxData = (<any>xhr).ajaxData;
                Assert.equal("http://microsoft.com", ajaxData.requestUrl, "RequestUrl is collected correctly");
                Assert.equal(true, ajaxData.async, "Async flag is collected correctly");
            }
        });
    }
}
new AjaxTests().registerTests();