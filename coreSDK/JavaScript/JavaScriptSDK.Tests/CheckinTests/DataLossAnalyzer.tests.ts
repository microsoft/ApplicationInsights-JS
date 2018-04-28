/// <reference path="../TestFramework/Common.ts" />
/// <reference path="../../JavaScriptSDK/DataLossAnalyzer.ts" />

class DataLossAnalyzerTests extends TestClass {

    public testCleanup() {
        Microsoft.ApplicationInsights.DataLossAnalyzer.enabled = false;
    }

    public testInitialize() {
        if (Microsoft.ApplicationInsights.Util.canUseSessionStorage()) {
            sessionStorage.clear();
        }
    }

    public registerTests() {
        this.testCase({
            name: "SenderTests: data loss analyzer - result 1; reported 1",
            test: () => {
                // setup
                Microsoft.ApplicationInsights.DataLossAnalyzer.enabled = true;
                Microsoft.ApplicationInsights.DataLossAnalyzer.appInsights = <any>{ trackTrace: (message) => { }, flush: () => { } };
                var loggerSpy = this.sandbox.spy(Microsoft.ApplicationInsights.DataLossAnalyzer.appInsights, "trackTrace");
                                
                // act
                Microsoft.ApplicationInsights.DataLossAnalyzer.incrementItemsQueued();
                Microsoft.ApplicationInsights.DataLossAnalyzer.reportLostItems();
                                
                // Validate
                Assert.ok(loggerSpy.calledOnce);
                Assert.equal(
                    "AI (Internal): Internal report DATALOSS: 1",
                    loggerSpy.args[0][0]
                );
            }
        });

        this.testCase({
            name: "SenderTests: data loss analyzer - result 0; didn't report loss",
            test: () => {
                // setup
                Microsoft.ApplicationInsights.DataLossAnalyzer.enabled = true;
                Microsoft.ApplicationInsights.DataLossAnalyzer.appInsights = <any>{ trackTrace: (message) => { }, flush: () => { } };
                var loggerSpy = this.sandbox.spy(Microsoft.ApplicationInsights.DataLossAnalyzer.appInsights, "trackTrace");
                                
                // act
                Microsoft.ApplicationInsights.DataLossAnalyzer.reportLostItems();
                
                // Validate
                Assert.ok(loggerSpy.notCalled);
            }
        });

        this.testCase({
            name: "SenderTests: data loss analyzer - restores to 0 after reporting data loss",
            test: () => {
                // setup
                Microsoft.ApplicationInsights.DataLossAnalyzer.enabled = true;
                Microsoft.ApplicationInsights.DataLossAnalyzer.appInsights = <any>{ trackTrace: (message) => { }, flush: () => { } };
                var loggerSpy = this.sandbox.spy(Microsoft.ApplicationInsights.DataLossAnalyzer.appInsights, "trackTrace");
                                
                // act
                Microsoft.ApplicationInsights.DataLossAnalyzer.incrementItemsQueued();
                Microsoft.ApplicationInsights.DataLossAnalyzer.reportLostItems();
                                
                // Validate
                Assert.equal(0, Microsoft.ApplicationInsights.DataLossAnalyzer.getNumberOfLostItems(), "Expected to reset to 0");
            }
        });

        this.testCase({
            name: "DataLossAnalyzer: no more than 10 data loss trace messages per browser session",
            test: () => {
                // setup
                Microsoft.ApplicationInsights.DataLossAnalyzer.enabled = true;
                Microsoft.ApplicationInsights.DataLossAnalyzer.appInsights = <any>{ trackTrace: (message) => { }, flush: () => { } };
                var loggerSpy = this.sandbox.spy(Microsoft.ApplicationInsights.DataLossAnalyzer.appInsights, "trackTrace");
                                
                // act
                for (var i = 0; i < 100; ++i) {
                    Microsoft.ApplicationInsights.DataLossAnalyzer.incrementItemsQueued();
                    Microsoft.ApplicationInsights.DataLossAnalyzer.reportLostItems();
                }
                                
                // Validate
                Assert.equal(10, loggerSpy.callCount);
            }
        });
    }
}

// Uncomment if you want to use DataLossanalyzer
// new DataLossAnalyzerTests().registerTests(); 