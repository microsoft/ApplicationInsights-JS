/// <reference path="../../TestFramework/Common.ts" />
/// <reference path="../../TestFramework/ContractTestHelper.ts" />
/// <reference path="../../../JavaScriptSDK/Telemetry/RemoteDependencyData.ts" />
/// <reference path="../../../JavaScriptSDK.Interfaces/Contracts/Generated/SeverityLevel.ts" />
class RemoteDependencyTests extends ContractTestHelper {

    private exception;
    private static id = "someid";
    private static method = "GET";
    private static testName = "testName"
    private static url = "http://myurl.com/"
    private static hostName = "myurl.com";
    private static totalTime = 123;
    private static success = false;
    private static resultCode = 404;
    
    constructor() {
        super(
            () => new Microsoft.ApplicationInsights.Telemetry.RemoteDependencyData(
                RemoteDependencyTests.id, RemoteDependencyTests.testName, RemoteDependencyTests.url, RemoteDependencyTests.totalTime, RemoteDependencyTests.success, RemoteDependencyTests.resultCode, RemoteDependencyTests.method),
            "RemoteDependencyTelemetryTests");
    }

    public registerTests() {
        super.registerTests();
        var name = this.name + ": ";

        this.testCase({
            name: name + "Constructor parameters are set correctly",
            test: () => {
                var telemetry = new Microsoft.ApplicationInsights.Telemetry.RemoteDependencyData(
                    RemoteDependencyTests.id, RemoteDependencyTests.url, RemoteDependencyTests.testName, RemoteDependencyTests.totalTime, RemoteDependencyTests.success, RemoteDependencyTests.resultCode, RemoteDependencyTests.method);

                Assert.equal("00:00:00.123", telemetry.duration, "value should be set correctly");
                Assert.equal(RemoteDependencyTests.success, telemetry.success, "success should be set correctly");
                Assert.equal(RemoteDependencyTests.resultCode, telemetry.resultCode, "resultCode should be set correctly");
                Assert.equal("GET /", telemetry.name, "name gets correct value");
                Assert.equal(RemoteDependencyTests.hostName, telemetry.target, "target gets correct value");
                Assert.equal(RemoteDependencyTests.testName, telemetry.data, "data should be set correctly");
            }
        });

        this.testCase({
            name: name + "Data is truncated if too long",
            test: () => {
                var urlLength = 2049;
                var longUrl = "";
                for (var i = 0; i < urlLength; i++) {
                    longUrl += "A";
                }

                var telemetry = new Microsoft.ApplicationInsights.Telemetry.RemoteDependencyData(
                    RemoteDependencyTests.id, longUrl, longUrl, RemoteDependencyTests.totalTime, RemoteDependencyTests.success, RemoteDependencyTests.resultCode, RemoteDependencyTests.method);

                Assert.equal(2048, telemetry.data.length, "data should be truncated");
            }
        });

        this.testCase({
            name: name + "name is truncated if too long",
            test: () => {
                var urlLength = 1025;
                var longUrl = "";
                for (var i = 0; i < urlLength; i++) {
                    longUrl += "A";
                }

                var telemetry = new Microsoft.ApplicationInsights.Telemetry.RemoteDependencyData(
                    RemoteDependencyTests.id, longUrl, longUrl, RemoteDependencyTests.totalTime, RemoteDependencyTests.success, RemoteDependencyTests.resultCode, RemoteDependencyTests.method);

                Assert.equal(1024, telemetry.name.length, "name should be truncated");
            }
        });

        this.testCase({
            name: name + "Duration field is populated as expected",
            test: () => {
                var telemetry = new Microsoft.ApplicationInsights.Telemetry.RemoteDependencyData(
                    RemoteDependencyTests.id, RemoteDependencyTests.url, RemoteDependencyTests.testName, 86400000, RemoteDependencyTests.success, RemoteDependencyTests.resultCode, RemoteDependencyTests.method);

                Assert.equal("1.00:00:00.000", telemetry.duration, "value should be set correctly");
                telemetry = new Microsoft.ApplicationInsights.Telemetry.RemoteDependencyData(
                    RemoteDependencyTests.id, RemoteDependencyTests.url, RemoteDependencyTests.testName, 86400026, RemoteDependencyTests.success, RemoteDependencyTests.resultCode, RemoteDependencyTests.method);

                Assert.equal("1.00:00:00.026", telemetry.duration, "value should be set correctly");
            }
        });

        this.testCase({
            name: name + "default properties are set correctly",
            test: () => {
                var telemetry = new Microsoft.ApplicationInsights.Telemetry.RemoteDependencyData("", "", "", 0, false, 0, null);
                
                Assert.equal("Ajax", telemetry.type, "dependencyTypeName gets correct default value");
                Assert.equal("", telemetry.name, "name gets correct default value");
            }
        });
    }
}
new RemoteDependencyTests().registerTests();
