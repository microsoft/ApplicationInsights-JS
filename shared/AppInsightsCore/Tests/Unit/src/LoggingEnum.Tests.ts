import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { _InternalMessageId, LoggingSeverity, eLoggingSeverity } from "../../../src/JavaScriptSDK.Enums/LoggingEnums";
import { _InternalLogMessage } from "../../../src/JavaScriptSDK/DiagnosticLogger";

export class LoggingEnumTests extends AITestClass {

    public testInitialize() {
        super.testInitialize();
    }

    public testCleanup() {
        super.testCleanup();
    }

    public registerTests() {

        this.testCase({
            name: "LoggingSeverity values",
            test: () => {
                Assert.equal(1, LoggingSeverity.CRITICAL, "Check LoggingSeverity.CRITICAL");
                Assert.equal(2, LoggingSeverity.WARNING, "Check LoggingSeverity.WARNING");

                Assert.equal(eLoggingSeverity.CRITICAL, LoggingSeverity.CRITICAL, "Check LoggingSeverity.CRITICAL");
                Assert.equal(eLoggingSeverity.WARNING, LoggingSeverity.WARNING, "Check LoggingSeverity.WARNING");

                Assert.ok(1 === LoggingSeverity.CRITICAL, "Check LoggingSeverity.CRITICAL === 1");
                Assert.ok(2 === LoggingSeverity.WARNING, "Check LoggingSeverity.WARNING === 2");

                Assert.ok(eLoggingSeverity.CRITICAL === LoggingSeverity.CRITICAL, "Check Critical === eLoggingSeverity.CRITICAL");
                Assert.ok(eLoggingSeverity.WARNING === LoggingSeverity.WARNING, "Check Warning === eLoggingSeverity.WARNING");

                Assert.equal("1", LoggingSeverity.CRITICAL.toString(), "Checking value of LoggingSeverity.CRITICAL");
                Assert.equal("2", LoggingSeverity.WARNING.toString(), "Checking value of LoggingSeverity.WARNING");

                Assert.equal("CRITICAL", LoggingSeverity[LoggingSeverity.CRITICAL], "Checking string value of LoggingSeverity.CRITICAL");
                Assert.equal("WARNING", LoggingSeverity[LoggingSeverity.WARNING], "Checking string value of LoggingSeverity.WARNING");
            }
       });
    }
}