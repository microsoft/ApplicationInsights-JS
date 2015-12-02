/// <reference path="..\TestFramework\Common.ts" />
/// <reference path="../../JavaScriptSDK/ajax/ajax.ts" />
/// <reference path="../../JavaScriptSDK/Util.ts"/>

class AjaxTests extends TestClass {

    private appInsightsMock = { trackAjax: (absoluteUrl: string, isAsync: boolean, totalTime: number, success: boolean) => { } }
    private trackAjaxSpy = sinon.spy(this.appInsightsMock, "trackAjax");
    private callbackSpy = sinon.spy();
    private requests;

    public testInitialize() {
        this.trackAjaxSpy.reset();
        var xhr = sinon.useFakeXMLHttpRequest();
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
                (<any>xhr).respond(200, {}, "");

                // assert
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
                xhr.onload = callback;
                xhr.open("GET", "/bla");
                xhr.send();

                Assert.ok(!this.trackAjaxSpy.called, "TrackAjax should not be called yet");

                // Emulate response
                (<any>xhr).respond(200, { "Content-Type": "application/json" }, "bla");
                Assert.ok(this.trackAjaxSpy.called, "TrackAjax is called");
                                
                // Assert
                var result = callback.args[0][0].target;
                Assert.ok(callback.called, "Ajax callback is called");
                Assert.equal("bla", result.responseText, "Expected result mismatch");
                Assert.equal(200, result.status, "Expected 200 response code");
                Assert.equal(4, xhr.readyState, "Expected readyState is 4 after request is finished");

            }
        });

        this.testCase({
            name: "Ajax: custom onreadystatechange gets called",
            test: () => {
                var onreadystatechangeSpy = sinon.spy();
                var ajax = new Microsoft.ApplicationInsights.AjaxMonitor(<any>this.appInsightsMock);

                // Act
                var xhr = new XMLHttpRequest();
                xhr.onreadystatechange = onreadystatechangeSpy;
                xhr.open("GET", "/bla");
                xhr.send();

                Assert.ok(!this.trackAjaxSpy.called, "TrackAjax should not be called yet");

                // Emulate response                
                (<any>xhr).respond();

                // Assert
                Assert.ok(this.trackAjaxSpy.called, "TrackAjax is called");
                Assert.ok(onreadystatechangeSpy.called, "custom onreadystatechange should be called");

            }
        });

        this.testCase({
            name: "Ajax: 200 means success",
            test: () => {
                var ajax = new Microsoft.ApplicationInsights.AjaxMonitor(<any>this.appInsightsMock);
                // Act
                var xhr = new XMLHttpRequest();
                xhr.open("GET", "/bla");
                xhr.send();
                
                // Emulate response                
                (<any>xhr).respond(200, {}, "");

                // Assert
                Assert.equal(true, this.trackAjaxSpy.args[0][4], "TrackAjax should receive true as a 'success' argument");

            }
        });

        this.testCase({
            name: "Ajax: non 200 means failure",
            test: () => {
                var ajax = new Microsoft.ApplicationInsights.AjaxMonitor(<any>this.appInsightsMock);                

                // Act
                var xhr = new XMLHttpRequest();
                xhr.open("GET", "/bla");
                xhr.send();
                
                // Emulate response                
                (<any>xhr).respond(404, {}, "");

                // Assert
                Assert.equal(false, this.trackAjaxSpy.args[0][4], "TrackAjax should receive false as a 'success' argument");

            }
        });

        [200, 201, 202, 203, 204, 301, 302, 303, 304].forEach((responseCode) => {
            this.testCase({
                name: "Ajax: test success http response code: " + responseCode,
                test: () => {
                    this.testAjaxSuccess(responseCode, true);
                }
            })
        });

        [400, 401, 402, 403, 404, 500, 501].forEach((responseCode) => {
            this.testCase({
                name: "Ajax: test failure http response code: " + responseCode,
                test: () => {
                    this.testAjaxSuccess(responseCode, false);
                }
            })
        });

        this.testCase({
            name: "Ajax: overriding ready state change handlers in all possible ways",
            test: () => {
                var ajax = new Microsoft.ApplicationInsights.AjaxMonitor(<any>this.appInsightsMock);
                var cb1 = sinon.spy();
                var cb2 = sinon.spy();
                var cb3 = sinon.spy();
                var cb4 = sinon.spy();
                var cb5 = sinon.spy();
                var cb6 = sinon.spy();
                var cb7 = sinon.spy();

                // Act
                var xhr = new XMLHttpRequest();
                xhr.addEventListener("readystatechange", cb1);
                xhr.addEventListener("readystatechange", cb2);
                xhr.open("GET", "/bla");
                xhr.onreadystatechange = cb3;
                xhr.addEventListener("readystatechange", cb4);
                xhr.addEventListener("readystatechange", cb5);
                xhr.send();
                xhr.addEventListener("readystatechange", cb6);
                xhr.addEventListener("readystatechange", cb7);

                Assert.ok(!this.trackAjaxSpy.called, "TrackAjax should not be called yet");

                // Emulate response                
                (<any>xhr).respond(404, {}, "");

                // Assert
                Assert.ok(this.trackAjaxSpy.calledOnce, "TrackAjax should be called");
                Assert.ok(cb1.called, "callback 1 should be called");
                Assert.ok(cb2.called, "callback 2 should be called");
                Assert.ok(cb3.called, "callback 3 should be called");
                Assert.ok(cb4.called, "callback 4 should be called");
                Assert.ok(cb5.called, "callback 5 should be called");
                Assert.ok(cb6.called, "callback 6 should be called");
                Assert.ok(cb7.called, "callback 7 should be called");

            }
        });

        this.testCase({
            name: "Ajax: test ajax duration is calculated correctly",
            test: () => {
                var ajax = new Microsoft.ApplicationInsights.AjaxMonitor(<any>this.appInsightsMock);
                // tick to set the initial time be non zero
                this.clock.tick(23);
                
                // Act
                var xhr = new XMLHttpRequest();
                var clock = this.clock;
                var expectedResponseDuration = 50;
                xhr.onreadystatechange = () => {
                    if (xhr.readyState == 3) {
                        clock.tick(expectedResponseDuration);
                    }
                }
                xhr.open("GET", "/bla");
                xhr.send();
                // Emulate response                
                (<any>xhr).respond(404, {}, "");

                // Assert
                Assert.ok(this.trackAjaxSpy.calledOnce, "TrackAjax should be called");
                Assert.equal(expectedResponseDuration, this.trackAjaxSpy.args[0][3], "Ajax duration should match expected duration");

            }
        });

        this.testCase({
            name: "Ajax: 2nd invokation of xhr.send doesn't cause send wrapper to execute 2nd time",
            test: () => {
                var ajax = new Microsoft.ApplicationInsights.AjaxMonitor(<any>this.appInsightsMock);
                var spy = sinon.spy(ajax, "sendHandler");
                
                // Act
                var xhr = new XMLHttpRequest();
                xhr.open("GET", "/bla");
                xhr.send();
                                
                try {                    
                    xhr.send();
                } catch (e) {}
                                

                // Assert
                Assert.ok(spy.calledOnce, "sendPrefixInstrumentor should be called only once");
            }
        });

        this.testCase({
            name: "Ajax: 2 invokation of xhr.open() doesn't cause send wrapper to execute 2nd time",
            test: () => {
                var ajax = new Microsoft.ApplicationInsights.AjaxMonitor(<any>this.appInsightsMock);
                var spy = sinon.spy(ajax, "openHandler");
                
                // Act
                var xhr = new XMLHttpRequest();
                xhr.open("GET", "/bla");                

                try {
                    xhr.open("GET", "/bla");
                } catch (e) { }
                                

                // Assert
                Assert.ok(spy.calledOnce, "sendPrefixInstrumentor should be called only once");
            }
        });
    }

    private testAjaxSuccess(responseCode: number, success: boolean) {
        var ajax = new Microsoft.ApplicationInsights.AjaxMonitor(<any>this.appInsightsMock);                

        // Act
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "/bla");
        xhr.send();
                
        // Emulate response                
        (<any>xhr).respond(responseCode, {}, "");

        // Assert
        Assert.equal(success, this.trackAjaxSpy.args[0][4], "TrackAjax should receive " + success + " as a 'success' argument");
    }
}
new AjaxTests().registerTests();