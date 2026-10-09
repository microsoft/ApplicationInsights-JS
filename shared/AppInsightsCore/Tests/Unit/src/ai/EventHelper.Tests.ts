import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import {
    addEventHandler, addPageUnloadEventListener, createUniqueNamespace, removeEventHandler, removePageUnloadEventListener
} from "../../../../src/index";
import { _eInternalMessageId } from "../../../../src/enums/ai/LoggingEnums";
import { _InternalLogMessage } from "../../../../src/diagnostics/DiagnosticLogger";
import { mergeEvtNamespace, __getRegisteredEvents } from "../../../../src/internal/EventHelpers";
import { setBypassLazyCache } from "@nevware21/ts-utils";

export class EventHelperTests extends AITestClass {

    public testInitialize() {
        super.testInitialize();
        setBypassLazyCache(true);
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

        this.testCase({
            name: "addEventHandler: add and remove test with multiple namespaces in order",
            test: () => {
                function _handler() {
                    // Do nothing
                }

                let testNamespace = createUniqueNamespace("AA");
                let test2Namespace = createUniqueNamespace("BB");

                // Add in reverse order
                Assert.ok(addEventHandler("test", _handler, [test2Namespace, testNamespace]), "Events added");
                _checkRegisteredAddEventHandler("test", 1);

                // Try removing using a different namespace which should fail
                removeEventHandler("test", _handler, test2Namespace);
                _checkRegisteredAddEventHandler("test", 1);

                // Try removing using only a different namespace which should fail
                removeEventHandler("test", null, test2Namespace);
                _checkRegisteredAddEventHandler("test", 1);

                // Try removing using only a different namespace which should fail
                removeEventHandler("test", _handler, testNamespace);
                _checkRegisteredAddEventHandler("test", 1);

                // Try removing using reverse order should work
                removeEventHandler("test", _handler, [ test2Namespace, testNamespace ]);
                _checkRegisteredAddEventHandler("test", 0);
            }
        });

        this.testCase({
            name: "addEventHandler: add and remove test with multiple merged namespaces",
            test: () => {
                function _handler() {
                    // Do nothing
                }

                let testNamespace = createUniqueNamespace("AA");
                let test2Namespace = createUniqueNamespace("BB");
                let evtNamespace = mergeEvtNamespace("MultipleNamespaceTest", [testNamespace, test2Namespace]);

                // Add in reverse order
                Assert.ok(addEventHandler("test", _handler, evtNamespace), "Events added");
                _checkRegisteredAddEventHandler("test", 1);

                // Try removing using a different namespace which should fail
                removeEventHandler("test", _handler, test2Namespace);
                _checkRegisteredAddEventHandler("test", 1);

                // Try removing using only a different namespace which should fail
                removeEventHandler("test", null, test2Namespace);
                _checkRegisteredAddEventHandler("test", 1);

                // Try removing using only a different namespace which should fail
                removeEventHandler("test", _handler, testNamespace);
                _checkRegisteredAddEventHandler("test", 1);

                // Try removing using only a different namespace which should fail
                removeEventHandler("test", _handler, [testNamespace, test2Namespace]);
                _checkRegisteredAddEventHandler("test", 1);

                // Try removing using only a different namespace which should fail
                removeEventHandler("test", _handler, [test2Namespace, testNamespace]);
                _checkRegisteredAddEventHandler("test", 1);

                // Try removing using reverse order should work
                removeEventHandler("test", _handler, evtNamespace);
                _checkRegisteredAddEventHandler("test", 0);
            }
        });


        this.testCase({
            name: "addEventHandler: add and remove test with multiple merged namespaces and removed with a different reversed merged namespace",
            test: () => {
                function _handler() {
                    // Do nothing
                }

                let testNamespace = createUniqueNamespace("AA");
                let test2Namespace = createUniqueNamespace("BB");
                let evtNamespace = mergeEvtNamespace("MultipleNamespaceTest", [testNamespace, test2Namespace]);
                let evt2Namespace = mergeEvtNamespace("MultipleNamespaceTest", [test2Namespace, testNamespace]);

                // Add in reverse order
                Assert.ok(addEventHandler("test", _handler, evtNamespace), "Events added");
                _checkRegisteredAddEventHandler("test", 1);

                // Try removing using a different namespace which should fail
                removeEventHandler("test", _handler, test2Namespace);
                _checkRegisteredAddEventHandler("test", 1);

                // Try removing using only a different namespace which should fail
                removeEventHandler("test", null, test2Namespace);
                _checkRegisteredAddEventHandler("test", 1);

                // Try removing using only a different namespace which should fail
                removeEventHandler("test", _handler, testNamespace);
                _checkRegisteredAddEventHandler("test", 1);

                // Try removing using only a different namespace which should fail
                removeEventHandler("test", _handler, [testNamespace, test2Namespace]);
                _checkRegisteredAddEventHandler("test", 1);

                // Try removing using only a different namespace which should fail
                removeEventHandler("test", _handler, [test2Namespace, testNamespace]);
                _checkRegisteredAddEventHandler("test", 1);

                // Try removing using reverse order should work
                removeEventHandler("test", _handler, evt2Namespace);
                _checkRegisteredAddEventHandler("test", 0);
            }
        });

        this.testCase({
            name: "addEventHandler: add and remove test with multiple namespaces in reverse order",
            test: () => {
                function _handler() {
                    // Do nothing
                }

                let testNamespace = createUniqueNamespace("AA");
                let test2Namespace = createUniqueNamespace("BB");

                // Add in reverse order
                Assert.ok(addEventHandler("test", _handler, [test2Namespace, testNamespace]), "Events added");
                _checkRegisteredAddEventHandler("test", 1);

                // Try removing using a different namespace which should fail
                removeEventHandler("test", _handler, test2Namespace);
                _checkRegisteredAddEventHandler("test", 1);

                // Try removing using only a different namespace which should fail
                removeEventHandler("test", null, test2Namespace);
                _checkRegisteredAddEventHandler("test", 1);

                // Try removing using only a different namespace which should fail
                removeEventHandler("test", _handler, testNamespace);
                _checkRegisteredAddEventHandler("test", 1);

                // Try removing using reverse order should work
                removeEventHandler("test", _handler, [ testNamespace, test2Namespace ]);
                _checkRegisteredAddEventHandler("test", 0);
            }
        });


        this.testCase({
            name: "addPageUnloadEventListener: does not hook 'unload' when 'pagehide' is supported",
            test: () => {
                function _handler() {
                    // Do nothing
                }

                let testNamespace = createUniqueNamespace("evtHelperUnloadTests");

                Assert.ok("onpagehide" in window, "The test runtime supports 'pagehide'");
                Assert.ok(addPageUnloadEventListener(_handler, null, testNamespace), "Events added");
                _checkRegisteredAddEventHandler("beforeunload", 1);
                _checkRegisteredAddEventHandler("pagehide", 1);
                _checkRegisteredAddEventHandler("unload", 0);

                removePageUnloadEventListener(_handler, testNamespace);
                _checkRegisteredAddEventHandler("beforeunload", 0);
                _checkRegisteredAddEventHandler("pagehide", 0);
                _checkRegisteredAddEventHandler("unload", 0);
            }
        });

        this.testCase({
            name: "addPageUnloadEventListener: hooks 'unload' when 'pagehide' is excluded",
            test: () => {
                function _handler() {
                    // Do nothing
                }

                let testNamespace = createUniqueNamespace("evtHelperUnloadTests");

                Assert.ok(addPageUnloadEventListener(_handler, ["pagehide"], testNamespace), "Events added");
                _checkRegisteredAddEventHandler("beforeunload", 1);
                _checkRegisteredAddEventHandler("pagehide", 0);
                _checkRegisteredAddEventHandler("unload", 1);

                removePageUnloadEventListener(_handler, testNamespace);
                _checkRegisteredAddEventHandler("beforeunload", 0);
                _checkRegisteredAddEventHandler("unload", 0);
            }
        });

        this.testCase({
            name: "addPageUnloadEventListener: falls back to all events when everything is excluded",
            test: () => {
                function _handler() {
                    // Do nothing
                }

                let testNamespace = createUniqueNamespace("evtHelperUnloadTests");

                Assert.ok(addPageUnloadEventListener(_handler, ["beforeunload", "unload", "pagehide"], testNamespace), "Events added");
                _checkRegisteredAddEventHandler("beforeunload", 1);
                _checkRegisteredAddEventHandler("pagehide", 1);
                _checkRegisteredAddEventHandler("unload", 1);

                removePageUnloadEventListener(_handler, testNamespace);
                _checkRegisteredAddEventHandler("beforeunload", 0);
                _checkRegisteredAddEventHandler("pagehide", 0);
                _checkRegisteredAddEventHandler("unload", 0);
            }
        });

        this.testCase({
            name: "addPageUnloadEventListener: hooks 'unload' when 'pagehide' is not supported",
            test: () => {
                function _handler() {
                    // Do nothing
                }

                let testNamespace = createUniqueNamespace("evtHelperUnloadTests");
                let restore = _hidePageHideSupport();

                try {
                    Assert.ok(!("onpagehide" in window), "'pagehide' support has been hidden");
                    Assert.ok(addPageUnloadEventListener(_handler, null, testNamespace), "Events added");
                } finally {
                    restore();
                }

                _checkRegisteredAddEventHandler("beforeunload", 1);
                _checkRegisteredAddEventHandler("pagehide", 1);
                _checkRegisteredAddEventHandler("unload", 1);

                removePageUnloadEventListener(_handler, testNamespace);
                _checkRegisteredAddEventHandler("beforeunload", 0);
                _checkRegisteredAddEventHandler("pagehide", 0);
                _checkRegisteredAddEventHandler("unload", 0);
            }
        });

        this.testCase({
            name: "mergeEventNamespaces: Initializing different values",
            test: () => {
                Assert.equal(null, mergeEvtNamespace(null, null), "All null");
                Assert.equal(undefined, mergeEvtNamespace(undefined, undefined), "All undefined");
                Assert.equal(null, mergeEvtNamespace(null, undefined), "Null and undefined");
                Assert.equal(undefined, mergeEvtNamespace(undefined, null), "Undefined and null");
                Assert.equal("", mergeEvtNamespace("", undefined), "Empty and undefined");
                Assert.equal("", mergeEvtNamespace("", null), "Empty and null");
                Assert.equal("", mergeEvtNamespace(null, []), "null and empty array");
                Assert.equal("", mergeEvtNamespace(undefined, []), "undefined and empty");
                Assert.equal("", mergeEvtNamespace("", []), "undefined and empty");
                Assert.equal("a", mergeEvtNamespace("a", []));
                Assert.equal("b", mergeEvtNamespace(null, ["b"]));
                Assert.equal("z", mergeEvtNamespace(null, ["z"]));
                Assert.equal(JSON.stringify(["a", "z"]), JSON.stringify(mergeEvtNamespace("a", ["z"])));
                Assert.equal(JSON.stringify(["a", "z"]), JSON.stringify(mergeEvtNamespace("z", ["a"])));
                Assert.equal(JSON.stringify(["a", "b", "c", "d", "z"]), JSON.stringify(mergeEvtNamespace("z", ["d", "b", "c", "a"])));
                Assert.equal(JSON.stringify(["a", "b", "c", "d", "z"]), JSON.stringify(mergeEvtNamespace("z", ["d", "b", "c", "a"])));
                Assert.equal(JSON.stringify(["a", "b", "c", "d", "z"]), JSON.stringify(mergeEvtNamespace("z", "d.b.c.a")));
                Assert.equal(JSON.stringify(["a", "aa", "f", "g", "x", "z"]), JSON.stringify(mergeEvtNamespace("z.a", "x.f.g.aa")));
                Assert.equal(JSON.stringify(["a", "b", "c", "d", "e"]), JSON.stringify(mergeEvtNamespace("e", ["d", "b", "", "c", null, "a"])));
                Assert.equal(JSON.stringify(["a", "ab", "f", "g", "x", "z"]), JSON.stringify(mergeEvtNamespace("z.a", "x.f..g.ab")));
                Assert.equal(JSON.stringify(["ab", "b", "f", "g", "x", "z"]), JSON.stringify(mergeEvtNamespace("z.b.", "x.f..g.ab")));
            }
        });

        function _hidePageHideSupport(): () => void {
            // 'onpagehide' may be defined on the window instance or anywhere on its prototype chain
            let removed: { target: any, desc: PropertyDescriptor }[] = [];
            let target: any = window;
            while (target) {
                let desc = Object.getOwnPropertyDescriptor(target, "onpagehide");
                if (desc && desc.configurable) {
                    removed.push({ target: target, desc: desc });
                    delete target["onpagehide"];
                }
                target = Object.getPrototypeOf(target);
            }

            return () => {
                for (let lp = 0; lp < removed.length; lp++) {
                    Object.defineProperty(removed[lp].target, "onpagehide", removed[lp].desc);
                }
            };
        }

        function _checkRegisteredAddEventHandler(name: string, expected: number) {
            let registered = __getRegisteredEvents(window, name);
            Assert.equal(expected, registered.length, "Check that window event was registered for " + name);

            if (window && window["body"]) {
                registered = __getRegisteredEvents(window["body"], name);
                Assert.equal(expected, registered.length, "Check that window.body event was registered for " + name);
            }

            registered = __getRegisteredEvents(document, name);
            Assert.equal(expected, registered.length, "Check that document event was registered for " + name);
        }
    }
}