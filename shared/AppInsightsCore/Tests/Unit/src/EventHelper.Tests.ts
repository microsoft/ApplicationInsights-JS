import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { addEventHandler, addEventListeners, createUniqueNamespace, removeEventHandler } from "../../../src/applicationinsights-core-js";
import { _InternalMessageId, LoggingSeverity } from "../../../src/JavaScriptSDK.Enums/LoggingEnums";
import { _InternalLogMessage, DiagnosticLogger } from "../../../src/JavaScriptSDK/DiagnosticLogger";
import { __getRegisteredEvents } from "../../../src/JavaScriptSDK/EventHelpers";

export class EventHelperTests extends AITestClass {

    public testInitialize() {
        super.testInitialize();
    }

    public testCleanup() {
        super.testCleanup();
    }

    public registerTests() {

        this.testCase({
            name: "addEventHandler: add and remove test",
            test: () => {
                function _handler() {
                    // Do nothing
                }

                Assert.ok(addEventHandler("test", _handler, null), "Events added");
                _checkRegisteredAddEventHandler("test", 1);

                // Try removing using a different namespace which should fail
                removeEventHandler("test", _handler, "fred");
                _checkRegisteredAddEventHandler("test", 1);

                // Try removing using only a different namespace which should fail
                removeEventHandler("test", null, "fred");
                _checkRegisteredAddEventHandler("test", 1);

                removeEventHandler("test", _handler, null);
                _checkRegisteredAddEventHandler("test", 0);
            }
        });

        this.testCase({
            name: "addEventHandler: add and remove test with single namespace",
            test: () => {
                function _handler() {
                    // Do nothing
                }

                let testNamespace = createUniqueNamespace("evtHelperTests");
                let test2Namespace = createUniqueNamespace("evtHelperTests");

                Assert.ok(addEventHandler("test", _handler, testNamespace), "Events added");
                _checkRegisteredAddEventHandler("test", 1);

                // Try removing using a different namespace which should fail
                removeEventHandler("test", _handler, test2Namespace);
                _checkRegisteredAddEventHandler("test", 1);

                // Try removing using only a different namespace which should fail
                removeEventHandler("test", null, test2Namespace);
                _checkRegisteredAddEventHandler("test", 1);

                removeEventHandler("test", _handler, testNamespace);
                _checkRegisteredAddEventHandler("test", 0);
            }
        });

        this.testCase({
            name: "addEventHandler: add with single namespace and remove only using namespace",
            test: () => {
                function _handler() {
                    // Do nothing
                }

                function _handler2() {

                }

                let testNamespace = createUniqueNamespace("evtHelperTests");

                Assert.ok(addEventHandler("test", _handler, testNamespace), "Events added");
                _checkRegisteredAddEventHandler("test", 1);

                // This remove should fail with invalid event and wrong handler
                removeEventHandler("", _handler2, testNamespace);
                _checkRegisteredAddEventHandler("test", 1);

                // Try removing using a different namespace which should fail
                removeEventHandler("test", _handler, testNamespace + ".x");
                _checkRegisteredAddEventHandler("test", 1);

                // Try removing using only a different namespace which should fail
                removeEventHandler("test", null, testNamespace + ".x");
                _checkRegisteredAddEventHandler("test", 1);

                // This remove should work
                removeEventHandler("", null, testNamespace);
                _checkRegisteredAddEventHandler("test", 0);

                Assert.ok(addEventHandler("test", _handler, testNamespace), "Events added");
                _checkRegisteredAddEventHandler("test", 1);
                // This remove should work
                removeEventHandler(null, null, testNamespace);
                _checkRegisteredAddEventHandler("test", 0);
            }
        });

        function _checkRegisteredAddEventHandler(name: string, expected: number) {
            let registered = __getRegisteredEvents(window, name);
            Assert.equal(expected, registered.length, "Check that window event was registered");

            if (window["body"]) {
                registered = __getRegisteredEvents(window["body"], name);
                Assert.equal(expected, registered.length, "Check that window.body event was registered");
            }

            registered = __getRegisteredEvents(document, name);
            Assert.equal(expected, registered.length, "Check that document event was registered");
        }
    }
}