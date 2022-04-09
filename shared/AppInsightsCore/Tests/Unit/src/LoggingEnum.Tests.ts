import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { _InternalMessageId, LoggingSeverity, eLoggingSeverity } from "../../../src/JavaScriptSDK.Enums/LoggingEnums";
import { _InternalLogMessage } from "../../../src/JavaScriptSDK/DiagnosticLogger";
import { isString, objForEachKey } from "../../../src/JavaScriptSDK/HelperFuncs";

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

                Assert.equal(1, LoggingSeverity["CRITICAL"], "Checking string value of LoggingSeverity['CRITICAL']");
                Assert.equal(2, LoggingSeverity["WARNING"], "Checking string value of LoggingSeverity['WARNING']");
            }
        });

        this.testCase({
            name: "LoggingSeverity validate immutability",
            test: () => {
                // Attempt to "Update" the fields
                objForEachKey(LoggingSeverity, (field, value) => {
                    try {
                        if (isString(value)) {
                            LoggingSeverity[field] = "Hacked-" + value + "!!!";
                        } else {
                            LoggingSeverity[field] = value + 1000;
                        }
                    } catch (e) {
                        // Ignore any errors thrown while trying to "update" the value
                    }
                });

                // Add new values
                try {
                    (LoggingSeverity[666] as any) = "New Stuff";
                    LoggingSeverity["NewStuff"] = "String New Stuff";
                } catch(e) {
                        // Ignore any errors thrown while trying to "update" the value
                }

                Assert.equal(undefined, LoggingSeverity[666], "Check LoggingSeverity[100]");
                Assert.equal(undefined, LoggingSeverity["NewStuff"], "Check LoggingSeverity[NewStuff]");

                // Check the values again as they should not have changed
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

                Assert.equal(1, LoggingSeverity["CRITICAL"], "Checking string value of LoggingSeverity['CRITICAL']");
                Assert.equal(2, LoggingSeverity["WARNING"], "Checking string value of LoggingSeverity['WARNING']");
            }
        });
    }
}