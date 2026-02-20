import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { isString, objForEachKey } from "@nevware21/ts-utils";
import { LoggingSeverity, eLoggingSeverity, _eInternalMessageId } from "../../../../src/enums/ai/LoggingEnums";
import { _InternalLogMessage } from "../../../../src/diagnostics/DiagnosticLogger";

type NoRepeats<T extends readonly any[]> = { [M in keyof T]: { [N in keyof T]:
    N extends M ? never : T[M] extends T[N] ? unknown : never
}[number] extends never ? T[M] : never }

const verifyArray = <T>() => <U extends NoRepeats<U> & readonly T[]>(
    u: (U | [never]) & ([T] extends [U[number]] ? unknown : never)
) => u;

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

    //     this.testCase({
    //         name: "_InternalMessageId validate names",
    //         test: () => {
    //             const verifyInternalMessageIds = verifyArray<keyof typeof _eInternalMessageId>();
    //             const expectedKeys = verifyInternalMessageIds([
    //                 "BrowserDoesNotSupportLocalStorage",
    //                 "BrowserCannotReadLocalStorage",
    //                 "BrowserCannotReadSessionStorage",
    //                 "BrowserCannotWriteLocalStorage",
    //                 "BrowserCannotWriteSessionStorage",
    //                 "BrowserFailedRemovalFromLocalStorage",
    //                 "BrowserFailedRemovalFromSessionStorage",
    //                 "CannotSendEmptyTelemetry",
    //                 "ClientPerformanceMathError",
    //                 "ErrorParsingAISessionCookie",
    //                 "ErrorPVCalc",
    //                 "ExceptionWhileLoggingError",
    //                 "FailedAddingTelemetryToBuffer",
    //                 "FailedMonitorAjaxAbort",
    //                 "FailedMonitorAjaxDur",
    //                 "FailedMonitorAjaxOpen",
    //                 "FailedMonitorAjaxRSC",
    //                 "FailedMonitorAjaxSend",
    //                 "FailedMonitorAjaxGetCorrelationHeader",
    //                 "FailedToAddHandlerForOnBeforeUnload",
    //                 "FailedToSendQueuedTelemetry",
    //                 "FailedToReportDataLoss",
    //                 "FlushFailed",
    //                 "MessageLimitPerPVExceeded",
    //                 "MissingRequiredFieldSpecification",
    //                 "NavigationTimingNotSupported",
    //                 "OnError",
    //                 "SessionRenewalDateIsZero",
    //                 "SenderNotInitialized",
    //                 "StartTrackEventFailed",
    //                 "StopTrackEventFailed",
    //                 "StartTrackFailed",
    //                 "StopTrackFailed",
    //                 "TelemetrySampledAndNotSent",
    //                 "TrackEventFailed",
    //                 "TrackExceptionFailed",
    //                 "TrackMetricFailed",
    //                 "TrackPVFailed",
    //                 "TrackPVFailedCalc",
    //                 "TrackTraceFailed",
    //                 "TransmissionFailed",
    //                 "FailedToSetStorageBuffer",
    //                 "FailedToRestoreStorageBuffer",
    //                 "InvalidBackendResponse",
    //                 "FailedToFixDepricatedValues",
    //                 "InvalidDurationValue",
    //                 "TelemetryEnvelopeInvalid",
    //                 "CreateEnvelopeError",
                
    //                 // User actionable
    //                 "CannotSerializeObject",
    //                 "CannotSerializeObjectNonSerializable",
    //                 "CircularReferenceDetected",
    //                 "ClearAuthContextFailed",
    //                 "ExceptionTruncated",
    //                 "IllegalCharsInName",
    //                 "ItemNotInArray",
    //                 "MaxAjaxPerPVExceeded",
    //                 "MessageTruncated",
    //                 "NameTooLong",
    //                 "SampleRateOutOfRange",
    //                 "SetAuthContextFailed",
    //                 "SetAuthContextFailedAccountName",
    //                 "StringValueTooLong",
    //                 "StartCalledMoreThanOnce",
    //                 "StopCalledWithoutStart",
    //                 "TelemetryInitializerFailed",
    //                 "TrackArgumentsNotSpecified",
    //                 "UrlTooLong",
    //                 "SessionStorageBufferFull",
    //                 "CannotAccessCookie",
    //                 "IdTooLong",
    //                 "InvalidEvent",
    //                 "FailedMonitorAjaxSetRequestHeader",
    //                 "SendBrowserInfoOnUserInit",
    //                 "PluginException",
    //                 "NotificationException",
    //                 "SnippetScriptLoadFailure",
    //                 "InvalidInstrumentationKey",
    //                 "CannotParseAiBlobValue",
    //                 "InvalidContentBlob",
    //                 "TrackPageActionEventFailed",
    //                 "FailedAddingCustomDefinedRequestContext",
    //                 "InMemoryStorageBufferFull",
    //                 "InstrumentationKeyDeprecation",
    //                 "ConfigWatcherException"
    //             ]);

    //             expectedKeys.forEach((key) => {
    //                 Assert.equal(key, _InternalMessageId[_InternalMessageId[key]], " Expecting the key to be" + key);
    //             });
    //         }
    //     });
    }
}