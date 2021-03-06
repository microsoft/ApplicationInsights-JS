import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { _InternalMessageId, LoggingSeverity } from "../../src/JavaScriptSDK.Enums/LoggingEnums";
import { _InternalLogMessage, DiagnosticLogger } from "../../src/JavaScriptSDK/DiagnosticLogger";
import { isObject, objForEachKey, objForEachKey as objKeys, optimizeObject, setValue, strEndsWith, strStartsWith } from "../../src/JavaScriptSDK/HelperFuncs";

export class HelperFuncTests extends AITestClass {

    public testInitialize() {
        super.testInitialize();
    }

    public testCleanup() {
        super.testCleanup();
    }

    public registerTests() {

        this.testCase({
            name: "strEndsWith",
            test: () => {
                Assert.ok(!strEndsWith(null, null));
                Assert.ok(!strEndsWith("", null));
                Assert.ok(!strEndsWith(null, ""));
                Assert.ok(!strEndsWith("", ""));
                Assert.ok(!strEndsWith("", "a"));
                Assert.ok(!strEndsWith("a", "b"));
                Assert.ok(!strEndsWith("a", ""));
                Assert.ok(!strEndsWith("a", "ab"));
                Assert.ok(strEndsWith("a", "a"));
                Assert.ok(strEndsWith("ba", "a"));
                Assert.ok(strEndsWith("zyxyvutsrqponmlkjihgfedcba", "cba"));
                Assert.ok(!strEndsWith("a", "ba"));
                Assert.ok(!strEndsWith("abba", "cba"));
                Assert.ok(!strEndsWith("abba", "bb"));
            }
        });

        this.testCase({
            name: "strStartsWith",
            test: () => {
                Assert.ok(!strStartsWith(null, null));
                Assert.ok(!strStartsWith("", null));
                Assert.ok(!strStartsWith(null, ""));
                Assert.ok(!strStartsWith("", ""));
                Assert.ok(!strStartsWith("", "a"));
                Assert.ok(!strStartsWith("a", ""));
                Assert.ok(!strStartsWith("a", "b"));
                Assert.ok(!strStartsWith("a", "ba"));
                Assert.ok(strStartsWith("ab", "a"));
                Assert.ok(!strStartsWith("zyxyvutsrqponmlkjihgfedcba", "a"));
                Assert.ok(strStartsWith("zyxwvutsrqponmlkjihgfedcba", "zyxw"));
                Assert.ok(!strStartsWith("a", "ab"));
                Assert.ok(!strStartsWith("abba", "abc"));
                Assert.ok(!strStartsWith("abba", "bb"));
            }
        });

    }
}