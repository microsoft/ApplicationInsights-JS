/// <reference path="../../testframework/common.ts" />
/// <reference path="../../testframework/contracttesthelper.ts" />
/// <reference path="../../../JavaScriptSDK/telemetry/RemoteDependencyData.ts" />
/// <reference path="../../../JavaScriptSDK/Contracts/Generated/SeverityLevel.ts" />
class RemoteDependencyTests extends ContractTestHelper {

    private exception;
    private static name = "testName"
    private static url = "http://myurl.com"
    private static totalTime = 123;
    private static success = false;

    constructor() {
        super(
            () => new Microsoft.ApplicationInsights.Telemetry.RemoteDependencyData(
                RemoteDependencyTests.name, RemoteDependencyTests.url, RemoteDependencyTests.totalTime, RemoteDependencyTests.success),
            "RemoteDependencyTelemetryTests");
    }

    public registerTests() {
        super.registerTests();
        var name = this.name + ": ";

        this.testCase({
            name: name + "Constructor parameters are set correctly",
            test: () => {
                var telemetry = new Microsoft.ApplicationInsights.Telemetry.RemoteDependencyData(
                    RemoteDependencyTests.name, RemoteDependencyTests.url, RemoteDependencyTests.totalTime, RemoteDependencyTests.success);

                Assert.equal(RemoteDependencyTests.url, telemetry.commandName, "commandName should be set to url");
                Assert.equal(RemoteDependencyTests.totalTime, telemetry.value, "value should be set correctly");
                Assert.equal(RemoteDependencyTests.success, telemetry.success, "success should be set correctly");
                Assert.equal(RemoteDependencyTests.name, telemetry.name, "name gets correct value");
            }
        });

        this.testCase({
            name: name + "default properties are set correctly",
            test: () => {
                var telemetry = new Microsoft.ApplicationInsights.Telemetry.RemoteDependencyData("", "", 0, false);
                
                Assert.equal(AI.DependencyKind.Http, telemetry.dependencyKind, "dependencyKind gets correct default value");
                Assert.equal("Ajax", telemetry.dependencyTypeName, "dependencyTypeName gets correct default value");
            }
        });
    }
}
new RemoteDependencyTests().registerTests();
