import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { _InternalMessageId } from "../../../src/JavaScriptSDK.Enums/LoggingEnums";
import { _InternalLogMessage } from "../../../src/JavaScriptSDK/DiagnosticLogger";
import { normalizeJsName, objExtend, strEndsWith, _strEndsWithPoly, strStartsWith, _strStartsWithPoly, isObject, objKeys, _getObjProto, isPlainObject, dateNow, isTypeof } from "../../../src/JavaScriptSDK/HelperFuncs";
import { BaseCore } from "../../../src/JavaScriptSDK/BaseCore";
import { AppInsightsCore } from "../../../src/JavaScriptSDK/AppInsightsCore";

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
            name: "_strEndsWithPoly",
            test: () => {
                Assert.ok(!_strEndsWithPoly(null, null));
                Assert.ok(!_strEndsWithPoly("", null));
                Assert.ok(!_strEndsWithPoly(null, ""));
                Assert.ok(!_strEndsWithPoly("", ""));
                Assert.ok(!_strEndsWithPoly("", "a"));
                Assert.ok(!_strEndsWithPoly("a", "b"));
                Assert.ok(!_strEndsWithPoly("a", ""));
                Assert.ok(!_strEndsWithPoly("a", "ab"));
                Assert.ok(_strEndsWithPoly("a", "a"));
                Assert.ok(_strEndsWithPoly("ba", "a"));
                Assert.ok(_strEndsWithPoly("zyxyvutsrqponmlkjihgfedcba", "cba"));
                Assert.ok(!_strEndsWithPoly("a", "ba"));
                Assert.ok(!_strEndsWithPoly("abba", "cba"));
                Assert.ok(!_strEndsWithPoly("abba", "bb"));
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

        this.testCase({
            name: "_strStartsWithPoly",
            test: () => {
                Assert.ok(!_strStartsWithPoly(null, null));
                Assert.ok(!_strStartsWithPoly("", null));
                Assert.ok(!_strStartsWithPoly(null, ""));
                Assert.ok(!_strStartsWithPoly("", ""));
                Assert.ok(!_strStartsWithPoly("", "a"));
                Assert.ok(!_strStartsWithPoly("a", ""));
                Assert.ok(!_strStartsWithPoly("a", "b"));
                Assert.ok(!_strStartsWithPoly("a", "ba"));
                Assert.ok(_strStartsWithPoly("ab", "a"));
                Assert.ok(!_strStartsWithPoly("zyxyvutsrqponmlkjihgfedcba", "a"));
                Assert.ok(_strStartsWithPoly("zyxwvutsrqponmlkjihgfedcba", "zyxw"));
                Assert.ok(!_strStartsWithPoly("a", "ab"));
                Assert.ok(!_strStartsWithPoly("abba", "abc"));
                Assert.ok(!_strStartsWithPoly("abba", "bb"));
            }
        });

        this.testCase({
            name: 'default objExtend (shallow)',
            test: () => {
                let obj1 = {
                    prop1: "obj1prop1",
                    prop2: {
                        nestedprop1: "obj1nestedprop1",
                        nestedprop2: ["obj1nestedprop2"]
                    }
                };
                let obj2 = {
                    prop1: "obj2prop1",
                    prop2: {
                        nestedprop1: "obj2nestedprop1",
                        nestedprop2: ["obj2nestedprop2"]
                    },
                    prop3: [{ prop3_arrayObject1: "prop3_arrayObject1" }, { prop3_arrayObject2: "prop3_arrayObject2" }]

                };
                let newObject = objExtend(obj1, obj2);
                Assert.equal("obj2prop1", newObject["prop1"]);
                Assert.equal("obj2nestedprop1", newObject["prop2"]["nestedprop1"]);
                Assert.equal("obj2nestedprop2", newObject["prop2"]["nestedprop2"][0]);
                Assert.equal("prop3_arrayObject1", newObject["prop3"][0]["prop3_arrayObject1"]);
                Assert.equal("prop3_arrayObject2", newObject["prop3"][1]["prop3_arrayObject2"]);

                // Update the object (which was deep copied), the new object should not be altered
                obj2.prop2.nestedprop1 = "Hello!";
                Assert.equal("Hello!", newObject["prop2"]["nestedprop1"]);
            }
        });

        this.testCase({
            name: 'objExtend with no arguments',
            test: () => {
                let newObject = objExtend();
                Assert.ok(isObject(newObject), "The returned object is an object");
                Assert.equal(0, objKeys(newObject), "The object should have no values");
            }
        });

        this.testCase({
            name: 'objExtend handle only invalid passed (undefined / null) values',
            test: () => {
                let newObject = objExtend(undefined, null);
                Assert.ok(isObject(newObject), "The returned object is an object");
                Assert.equal(0, objKeys(newObject), "The object should have no values");
            }
        });

        this.testCase({
            name: 'objExtend handle invalid (undefined / null) and valid object arguments (shallow)',
            test: () => {
                let obj1 = {
                    prop1: "obj1prop1",
                    prop2: {
                        nestedprop1: "obj1nestedprop1",
                        nestedprop2: ["obj1nestedprop2"]
                    }
                };
                let obj2 = {
                    prop1: "obj2prop1",
                    prop2: {
                        nestedprop1: "obj2nestedprop1",
                        nestedprop2: ["obj2nestedprop2"]
                    },
                    prop3: [{ prop3_arrayObject1: "prop3_arrayObject1" }, { prop3_arrayObject2: "prop3_arrayObject2" }]

                };
                let newObject = objExtend(undefined, null, obj1, obj2, null);
                Assert.equal("obj2prop1", newObject["prop1"]);
                Assert.equal("obj2nestedprop1", newObject["prop2"]["nestedprop1"]);
                Assert.equal("obj2nestedprop2", newObject["prop2"]["nestedprop2"][0]);
                Assert.equal("prop3_arrayObject1", newObject["prop3"][0]["prop3_arrayObject1"]);
                Assert.equal("prop3_arrayObject2", newObject["prop3"][1]["prop3_arrayObject2"]);

                // Update the object (which was deep copied), the new object should not be altered
                obj2.prop2.nestedprop1 = "Hello!";
                Assert.equal("Hello!", newObject["prop2"]["nestedprop1"]);
            }
        });

        this.testCase({
            name: 'objExtend handle invalid (undefined / null) and valid object arguments (deep)',
            test: () => {
                let obj1 = {
                    prop1: "obj1prop1",
                    prop2: {
                        nestedprop1: "obj1nestedprop1",
                        nestedprop2: ["obj1nestedprop2"]
                    }
                };
                let obj2 = {
                    prop1: "obj2prop1",
                    prop2: {
                        nestedprop1: "obj2nestedprop1",
                        nestedprop2: ["obj2nestedprop2"]
                    },
                    prop3: [{ prop3_arrayObject1: "prop3_arrayObject1" }, { prop3_arrayObject2: "prop3_arrayObject2" }]

                };
                let newObject = objExtend(true, undefined, null, obj1, obj2, null);
                Assert.equal("obj2prop1", newObject["prop1"]);
                Assert.equal("obj2nestedprop1", newObject["prop2"]["nestedprop1"]);
                Assert.equal("obj2nestedprop2", newObject["prop2"]["nestedprop2"][0]);
                Assert.equal("prop3_arrayObject1", newObject["prop3"][0]["prop3_arrayObject1"]);
                Assert.equal("prop3_arrayObject2", newObject["prop3"][1]["prop3_arrayObject2"]);

                // Update the object (which was deep copied), the new object should not be altered
                obj2.prop2.nestedprop1 = "Hello!";
                Assert.equal("obj2nestedprop1", newObject["prop2"]["nestedprop1"]);
            }
        });

        this.testCase({
            name: 'deep objExtend',
            test: () => {
                let obj1 = {
                    prop1: "obj1prop1",
                    prop2: {
                        nestedprop1: "obj1nestedprop1",
                        nestedprop2: ["obj1nestedprop2"]
                    }
                };
                let obj2 = {
                    prop1: "obj2prop1",
                    prop2: {
                        nestedprop1: "obj2nestedprop1",
                        nestedprop2: ["obj2nestedprop2"]
                    },
                    prop3: [{ prop3_arrayObject1: "prop3_arrayObject1" }, { prop3_arrayObject2: "prop3_arrayObject2" }]

                };
                let newObject = objExtend(true, obj1, obj2);
                Assert.equal("obj2prop1", newObject["prop1"]);
                Assert.equal("obj2nestedprop1", newObject["prop2"]["nestedprop1"]);
                Assert.equal("obj2nestedprop2", newObject["prop2"]["nestedprop2"][0]);
                Assert.equal("prop3_arrayObject1", newObject["prop3"][0]["prop3_arrayObject1"]);
                Assert.equal("prop3_arrayObject2", newObject["prop3"][1]["prop3_arrayObject2"]);

                // Update the object (which was deep copied), the new object should not be altered
                obj2.prop2.nestedprop1 = "Hello!";
                Assert.equal("obj2nestedprop1", newObject["prop2"]["nestedprop1"]);
            }
        });

        this.testCase({
            name: 'shallow objExtend',
            test: () => {
                let obj1 = {
                    prop1: "obj1prop1",
                    prop2: {
                        nestedprop1: "obj1nestedprop1",
                        nestedprop2: ["obj1nestedprop2"]
                    }
                };
                let obj2 = {
                    prop1: "obj2prop1",
                    prop2: {
                        nestedprop1: "obj2nestedprop1",
                        nestedprop2: ["obj2nestedprop2"]
                    },
                    prop3: [{ prop3_arrayObject1: "prop3_arrayObject1" }, { prop3_arrayObject2: "prop3_arrayObject2" }]

                };
                let newObject = objExtend(false, obj1, obj2);
                Assert.equal("obj2prop1", newObject["prop1"]);
                Assert.equal("obj2nestedprop1", newObject["prop2"]["nestedprop1"]);
                Assert.equal("obj2nestedprop2", newObject["prop2"]["nestedprop2"][0]);
                Assert.equal("prop3_arrayObject1", newObject["prop3"][0]["prop3_arrayObject1"]);
                Assert.equal("prop3_arrayObject2", newObject["prop3"][1]["prop3_arrayObject2"]);

                // Update the object (which was shallow copied)
                obj2.prop2.nestedprop1 = "Hello!";
                Assert.equal("Hello!", newObject["prop2"]["nestedprop1"]);
            }
        });

        this.testCase({
            name: "normalizeJsName",
            test: () => {
                Assert.equal(undefined, normalizeJsName(undefined));
                Assert.equal(null, normalizeJsName(null));
                Assert.equal("", normalizeJsName(""));
                Assert.equal("a", normalizeJsName("a"));
                Assert.equal("0", normalizeJsName("0"));
                Assert.equal(0, normalizeJsName(0 as any));
                Assert.equal("_0a", normalizeJsName("0a"));
                Assert.equal("_0abc$_def123", normalizeJsName("0abc$^def123"));
                Assert.equal("_0abc$_Def123", normalizeJsName("0abc$^Def123"));
                Assert.equal("helloWorld", normalizeJsName("hello-world"));
                Assert.equal("hello_World", normalizeJsName("hello-World"));
                Assert.equal("helloWorld_123", normalizeJsName("hello-world*123"));
                Assert.equal("HelloWorld_123", normalizeJsName("-hello-world_123"));
                Assert.equal("abc123ABC___$__________", normalizeJsName("abc123ABC!@#$%^&*()_-=+"));
            }
        });

        this.testCase({
            name: "isPlainObject",
            test: () => {
                Assert.equal(false, isPlainObject(undefined));
                Assert.equal(false, isPlainObject(null));
                Assert.equal(true, isPlainObject({}));
                Assert.equal(true, isPlainObject(Object.create(null)));
                Assert.equal(false, isPlainObject(new BaseCore()));
                Assert.equal(false, isPlainObject(new AppInsightsCore()));
                Assert.equal(false, isPlainObject(dateNow()));
                Assert.equal(false, isPlainObject([]));
                Assert.equal(false, isPlainObject(true), "true");
                Assert.equal(false, isPlainObject(1), "1");
                Assert.equal(false, isPlainObject("true"), "'true'");
                Assert.equal(false, isPlainObject(/regex/), "/regex/");
                Assert.equal(false, isPlainObject(new Boolean(true)), "new Boolean(true)");
                Assert.equal(false, isPlainObject(new Number(1)), "new Number(1)");
                Assert.equal(false, isPlainObject(new String("true")), "new String('true')");

            }
        });

        this.testCase({
            name: "isObject",
            test: () => {
                Assert.equal(false, isObject(undefined), "undefined");
                Assert.equal(false, isObject(null), "null");
                Assert.equal(true, isObject({}), "{}");
                Assert.equal(true, isObject(Object.create(null)), "Object.create");
                Assert.equal(true, isObject(new BaseCore()), "BaseCore");
                Assert.equal(true, isObject(new AppInsightsCore()), "AppInsightsCpre");
                Assert.equal(false, isObject(dateNow()), "dateNow");
                Assert.equal(true, isObject([]), "[]");
                Assert.equal(false, isObject(true), "true");
                Assert.equal(false, isObject(1), "1");
                Assert.equal(false, isObject("true"), "'true'");
                Assert.equal(true, isObject(/regex/), "/regex/");
                Assert.equal(true, isObject(new Boolean(true)), "new Boolean(true)");
                Assert.equal(true, isObject(new Number(1)), "new Number(1)");
                Assert.equal(true, isObject(new String("true")), "new String('true')");

            }
        });

        this.testCase({
            name: "_getObjProto",
            test: () => {
                Assert.equal(null, _getObjProto(null));
                Assert.equal(null, _getObjProto(undefined));
                Assert.equal(Object.prototype, _getObjProto({}));
                Assert.equal(Date.prototype, _getObjProto(new Date()));
                Assert.equal(Number.prototype, _getObjProto(dateNow()));
                Assert.equal(Array.prototype, _getObjProto([]));
                Assert.equal(Boolean.prototype, _getObjProto(true), "new Boolean(true)");
                Assert.equal(Number.prototype, _getObjProto(1), "new Number(1)");
                Assert.equal(String.prototype, _getObjProto("true"), "new String('true')");
                Assert.equal(RegExp.prototype, _getObjProto(/regex/), "new String('true')");
                Assert.equal(Boolean.prototype, _getObjProto(new Boolean(true)), "new Boolean(true)");
                Assert.equal(Number.prototype, _getObjProto(new Number(1)), "new Number(1)");
                Assert.equal(String.prototype, _getObjProto(new String("true")), "new String('true')");
            }
        });
    }
}