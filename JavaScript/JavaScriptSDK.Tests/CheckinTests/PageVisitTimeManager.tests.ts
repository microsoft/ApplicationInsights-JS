/// <reference path="..\TestFramework\Common.ts" />
/// <reference path="../../JavaScriptSDK/Telemetry/PageVisitTimeManager.ts" />
class PageVisitTimeManagerTests extends TestClass {

    private throwInternalNonUserActionableSpy;
    private throwInternalUserActionableSpy;

    /** Method called before the start of each test method */
    public testInitialize() {
        this.throwInternalNonUserActionableSpy = sinon.spy(Microsoft.ApplicationInsights._InternalLogging, "throwInternalNonUserActionable");
        this.throwInternalUserActionableSpy = sinon.spy(Microsoft.ApplicationInsights._InternalLogging, "throwInternalUserActionable");
    }

    /** Method called after each test method has completed */
    public testCleanup() {
        this.throwInternalNonUserActionableSpy.restore();
        this.throwInternalUserActionableSpy.restore();
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
            name: "PageVisitTimeManager: When trackPreviousPageVisit is called multiple times, the tracking delegate is called with correct details",
            test: () => {

                //setup
                // Mock storage so this will work in all browsers for tests
                var storage = this.getMockStorage();
                var getStorageObjectStub = sinon.stub(Microsoft.ApplicationInsights.Util, "_getSessionStorageObject",() => storage);

                var object = { method: function () { } };
                var spy = sinon.spy(object, "method");
                var pageVisitTimeManager = new Microsoft.ApplicationInsights.Telemetry.PageVisitTimeManager(spy);


                //act
                pageVisitTimeManager.trackPreviousPageVisit(testValues.page1Name, testValues.page1Url);
                this.clock.tick(testValues.page1ViewTime);

                pageVisitTimeManager.trackPreviousPageVisit(testValues.page2Name, testValues.page2Url);
                this.clock.tick(testValues.page2ViewTime);

                pageVisitTimeManager.trackPreviousPageVisit(testValues.page3Name, testValues.page3Url);
                this.clock.tick(testValues.page3ViewTime);

                // verify
                Assert.ok(spy.calledTwice, "telemetry sent only twice");
                Assert.ok(spy.calledWith(testValues.page1Name, testValues.page1Url, testValues.page1ViewTime));
                Assert.ok(spy.calledWith(testValues.page2Name, testValues.page2Url, testValues.page2ViewTime));
                
                getStorageObjectStub.restore();


            }
        });

        this.testCase({
            name: "PageVisitTimeManager: consecutive calls to start and stop returns expected information",
            test: () => {

                //setup
                // Mock storage so this will work in all browsers for tests
                var storage = this.getMockStorage();
                var getStorageObjectStub = sinon.stub(Microsoft.ApplicationInsights.Util, "_getSessionStorageObject",() => storage);

                var object = { method: function () { } };
                var spy = sinon.spy(object, "method");
                var pageVisitTimeManager = new Microsoft.ApplicationInsights.Telemetry.PageVisitTimeManager(spy);

                //act
                pageVisitTimeManager.startPageVisitTimer(testValues.page1Name, testValues.page1Url);
                this.clock.tick(testValues.page1ViewTime);
                var page1VisitData = pageVisitTimeManager.stopPageVisitTimer();

                pageVisitTimeManager.startPageVisitTimer(testValues.page2Name, testValues.page2Url);
                this.clock.tick(testValues.page2ViewTime);
                var page2VisitData = pageVisitTimeManager.stopPageVisitTimer();

               //verify
                Assert.equal(testValues.page1Name, page1VisitData.pageName);
                Assert.equal(testValues.page1Url, page1VisitData.pageUrl);
                Assert.equal(testValues.page1ViewTime, page1VisitData.pageVisitTime);

                Assert.equal(testValues.page2Name, page2VisitData.pageName);
                Assert.equal(testValues.page2Url, page2VisitData.pageUrl);
                Assert.equal(testValues.page2ViewTime, page2VisitData.pageVisitTime);

                getStorageObjectStub.restore();
            }
        });

        this.testCase({
            name: "PageVisitTimeManager: consecutive calls to restart returns expected information",
            test: () => {

                //setup
                // Mock storage so this will work in all browsers for tests
                var storage = this.getMockStorage();
                var getStorageObjectStub = sinon.stub(Microsoft.ApplicationInsights.Util, "_getSessionStorageObject",() => storage);

                var object = { method: function () { } };
                var spy = sinon.spy(object, "method");
                var pageVisitTimeManager = new Microsoft.ApplicationInsights.Telemetry.PageVisitTimeManager(spy);

                //act
                var nullPageData = pageVisitTimeManager.restartPageVisitTimer(testValues.page1Name, testValues.page1Url);
                this.clock.tick(testValues.page1ViewTime);
                
                var page1VisitData = pageVisitTimeManager.restartPageVisitTimer(testValues.page2Name, testValues.page2Url);
                this.clock.tick(testValues.page2ViewTime);
                var page2VisitData = pageVisitTimeManager.restartPageVisitTimer(testValues.page3Name, testValues.page3Url);

                //verify
                Assert.equal(null, nullPageData);

                Assert.equal(testValues.page1Name, page1VisitData.pageName);
                Assert.equal(testValues.page1Url, page1VisitData.pageUrl);
                Assert.equal(testValues.page1ViewTime, page1VisitData.pageVisitTime);

                Assert.equal(testValues.page2Name, page2VisitData.pageName);
                Assert.equal(testValues.page2Url, page2VisitData.pageUrl);
                Assert.equal(testValues.page2ViewTime, page2VisitData.pageVisitTime);

                getStorageObjectStub.restore();
            }
        });


        this.testCase({
            name: "PageVisitTimeManager: stopPageVisitTimer returns null if start has not been called",
            test: () => {

                //setup
                // Mock storage so this will work in all browsers for tests
                var storage = this.getMockStorage();
                var getStorageObjectStub = sinon.stub(Microsoft.ApplicationInsights.Util, "_getSessionStorageObject",() => storage);

                var object = { method: function () { } };
                var spy = sinon.spy(object, "method");
                var pageVisitTimeManager = new Microsoft.ApplicationInsights.Telemetry.PageVisitTimeManager(spy);

                //act
                var retval = pageVisitTimeManager.stopPageVisitTimer();
                Assert.equal(null, retval);
               
                getStorageObjectStub.restore();
            }
        });

        this.testCase({
            name: "PageVisitTimeManager: startPageVisitTime fails if called twice without a call to stop",
            test: () => {

                //setup
                // Mock storage so this will work in all browsers for tests
                var storage = this.getMockStorage();
                var getStorageObjectStub = sinon.stub(Microsoft.ApplicationInsights.Util, "_getSessionStorageObject",() => storage);

                var object = { method: function () { } };
                var spy = sinon.spy(object, "method");
                var pageVisitTimeManager = new Microsoft.ApplicationInsights.Telemetry.PageVisitTimeManager(spy);

                //act
                try {
                    pageVisitTimeManager.startPageVisitTimer(testValues.page1Name, testValues.page1Url);
                    pageVisitTimeManager.startPageVisitTimer(testValues.page1Name, testValues.page1Url);
                    Assert.ok(false);

                } catch (e) {
                    Assert.ok(true);
                }
               
                getStorageObjectStub.restore();
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