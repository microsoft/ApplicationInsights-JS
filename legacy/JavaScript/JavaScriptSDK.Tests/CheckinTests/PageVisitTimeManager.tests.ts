/// <reference path="../TestFramework/Common.ts" />
/// <reference path="../../JavaScriptSDK/Telemetry/PageVisitTimeManager.ts" />
class PageVisitTimeManagerTests extends TestClass {

    private throwInternal;
    private getStorageObjectStub;

    /** Method called before the start of each test method */
    public testInitialize() {
        var storage = this.getMockStorage();
        this.getStorageObjectStub = this.sandbox.stub(Microsoft.ApplicationInsights.Util, "_getSessionStorageObject",() => storage);

        this.throwInternal = this.sandbox.spy(Microsoft.ApplicationInsights._InternalLogging, "throwInternal");
    }

    public registerTests() {

        var testValues = {
            page1Name: "page1",
            page1Url: "page1Url",
            page1ViewTime: 10,

            page2Name: "page2",
            page2Url: "page2Url",
            page2ViewTime: 20,

            page3Name: "page3",
            page3Url: "page3Url",
            page3ViewTime: 30
        };

        this.testCase({
            name: "PageVisitTimeManager: When trackPreviousPageVisit is called once, the tracking delegate is not called since there are no previous pages",
            test: () => {

                //setup
                var object = { method: function () { } };
                var spy = this.sandbox.spy(object, "method");
                var pageVisitTimeManager = new Microsoft.ApplicationInsights.Telemetry.PageVisitTimeManager(spy);


                //act
                pageVisitTimeManager.trackPreviousPageVisit(testValues.page1Name, testValues.page1Url);
                this.clock.tick(testValues.page1ViewTime);

                // verify
                Assert.ok(spy.notCalled, "telemetry wasn't sent");
            }
        });


        this.testCase({
            name: "PageVisitTimeManager: When trackPreviousPageVisit is called twice, the tracking delegate is called once with correct details",
            test: () => {

                //setup
                var object = { method: function () { } };
                var spy = this.sandbox.spy(object, "method");
                var pageVisitTimeManager = new Microsoft.ApplicationInsights.Telemetry.PageVisitTimeManager(spy);


                //act
                pageVisitTimeManager.trackPreviousPageVisit(testValues.page1Name, testValues.page1Url);
                this.clock.tick(testValues.page1ViewTime);

                pageVisitTimeManager.trackPreviousPageVisit(testValues.page2Name, testValues.page2Url);
               
                // verify
                Assert.ok(spy.calledOnce, "telemetry sent once");
                Assert.ok(spy.calledWith(testValues.page1Name, testValues.page1Url, testValues.page1ViewTime));
                
            }
        });

        this.testCase({
            name: "PageVisitTimeManager: consecutive calls to start and stop returns expected information",
            test: () => {

                //setup
                var pageVisitTimeManager = new Microsoft.ApplicationInsights.Telemetry.PageVisitTimeManager(() => {});

                //act
                pageVisitTimeManager.startPageVisitTimer(testValues.page1Name, testValues.page1Url);
                this.clock.tick(testValues.page1ViewTime);
                var page1VisitData = pageVisitTimeManager.stopPageVisitTimer();

                //verify
                Assert.equal(testValues.page1Name, page1VisitData.pageName);
                Assert.equal(testValues.page1Url, page1VisitData.pageUrl);
                Assert.equal(testValues.page1ViewTime, page1VisitData.pageVisitTime);
            }
        });

        this.testCase({
            name: "PageVisitTimeManager: first call to restart returns null",
            test: () => {

                //setup
                var pageVisitTimeManager = new Microsoft.ApplicationInsights.Telemetry.PageVisitTimeManager(() => { });

                //act
                var nullPageData = pageVisitTimeManager.restartPageVisitTimer(testValues.page1Name, testValues.page1Url);
                
                //verify
                Assert.equal(null, nullPageData);
                
            }
        });

        this.testCase({
            name: "PageVisitTimeManager: consecutive calls to restart returns expected information",
            test: () => {

                //setup
                var pageVisitTimeManager = new Microsoft.ApplicationInsights.Telemetry.PageVisitTimeManager(() => { });

                //act
                pageVisitTimeManager.restartPageVisitTimer(testValues.page1Name, testValues.page1Url);
                this.clock.tick(testValues.page1ViewTime);
                
                var page1VisitData = pageVisitTimeManager.restartPageVisitTimer(testValues.page2Name, testValues.page2Url);
               
                //verify
                Assert.equal(testValues.page1Name, page1VisitData.pageName);
                Assert.equal(testValues.page1Url, page1VisitData.pageUrl);
                Assert.equal(testValues.page1ViewTime, page1VisitData.pageVisitTime);
            }
        });


        this.testCase({
            name: "PageVisitTimeManager: stopPageVisitTimer returns null if start has not been called",
            test: () => {

                //setup
                // Mock storage so this will work in all browsers for tests
                var pageVisitTimeManager = new Microsoft.ApplicationInsights.Telemetry.PageVisitTimeManager(() => { });

                //act
                var retval = pageVisitTimeManager.stopPageVisitTimer();
                Assert.equal(null, retval);
               
            }
        });

        this.testCase({
            name: "PageVisitTimeManager: startPageVisitTime fails silently if called twice without a call to stop",
            test: () => {
                
                //setup
                var pageVisitTimeManager = new Microsoft.ApplicationInsights.Telemetry.PageVisitTimeManager(() => {});

                //act
                try {
                    pageVisitTimeManager.startPageVisitTimer(testValues.page1Name, testValues.page1Url);
                    pageVisitTimeManager.startPageVisitTimer(testValues.page1Name, testValues.page1Url);
                    Assert.ok(true);

                } catch (e) {
                    Assert.ok(false);
                }
               
            }
        });
    }

    private getMockStorage() {
        var storage = <any>{};
        storage.getItem = (name) => storage[name];
        storage.setItem = (name, value) => (storage[name] = value);
        storage.removeItem = (name, value) => (storage[name] = undefined);
        return storage;
    }
}

new PageVisitTimeManagerTests().registerTests();  