import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { __getRegisteredEvents, addEventHandler, mergeEvtNamespace, removeEventHandler } from "../../../../src/internal/EventHelpers";
import { createUniqueNamespace } from "../../../../src/utils/DataCacheHelper";

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
