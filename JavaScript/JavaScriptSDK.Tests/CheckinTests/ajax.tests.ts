/// <reference path="..\TestFramework\Common.ts" />
/// <reference path="../../JavaScriptSDK/ajax/ajax.ts" />
/// <reference path="../../JavaScriptSDK/Util.ts"/>

class AjaxTests extends TestClass {


    private appInsightsMock = { trackAjax: (absoluteUrl: string, isAsync: boolean, totalTime: number, success: boolean) => { } }
    private trackAjaxSpy = sinon.spy(this.appInsightsMock, "trackAjax");
    private requests;

    public testInitialize() {
        this.trackAjaxSpy.reset();
        var xhr = sinon.useFakeXMLHttpRequest();            
        var requests = this.requests = [];    
        xhr.onCreate = function (xhr) {
            requests.push(xhr);
        };
    }

    public testCleanup() {
    }

    public registerTests() {

        this.testCase({
            name: "Ajax: xhr.open gets instrumented",
            test: () => {
                var ajax = new Microsoft.ApplicationInsights.AjaxMonitor(<any>this.appInsightsMock);

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
                var ajax = new Microsoft.ApplicationInsights.AjaxMonitor(<any>this.appInsightsMock);
                
                // act
                var xhr = new XMLHttpRequest();
                xhr.open("GET", "http://microsoft.com");
                xhr.send();
                this.requests[0].respond(200, {}, "");

                // assert
                var ajaxData = (<any>xhr).ajaxData;
                Assert.ok(!xhr.hasOwnProperty("ajaxData"), "ajaxData should be removed from xhr to prevent memory leaks");
            }
        });
        
        this.testCase({
            name: "Ajax: successful request, ajax monitor doesn't change payload",
            test: () => {
                var callback = sinon.spy();
                var ajax = new Microsoft.ApplicationInsights.AjaxMonitor(<any>this.appInsightsMock);                

                // Act
                var xhr = new XMLHttpRequest();
                xhr.onload = callback
                xhr.open("GET", "/bla");
                xhr.send();

                Assert.ok(!this.trackAjaxSpy.called, "TrackAjax should not be called yet");

                // Emulate response
                Assert.equal(1, this.requests.length);
                this.requests[0].respond(200, { "Content-Type": "application/json" }, "bla");
                Assert.ok(this.trackAjaxSpy.called, "TrackAjax is called");
                                
                // Assert
                var result = callback.args[0][0].target;
                Assert.ok(callback.called, "Ajax callback is called");
                Assert.equal("bla", result.responseText, "Expected result mismatch");
                Assert.equal(200, result.status, "Expected 200 response code");

            }
        });
    }
}
new AjaxTests().registerTests();