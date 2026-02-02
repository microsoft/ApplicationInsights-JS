import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { _eInternalMessageId } from "../../../../../src/index";
import { normalizeJsName, objExtend, _getObjProto, isFeatureEnabled } from "../../../../../src/index";
import { AppInsightsCore } from "../../../../../src/core/AppInsightsCore";
import { isArray, isObject, objKeys, strEndsWith, strStartsWith, isPlainObject, utcNow } from "@nevware21/ts-utils";
import { FeatureOptInMode, IConfiguration, IFeatureOptInDetails, dumpObj } from "../../../../../src/index";



function _expectException(cb: () => void) {
    try {
        cb();
        Assert.ok(false, "Expected and exception to be thrown");
    } catch(e) {
        Assert.ok(true, "Expected an exception - " + dumpObj(e));
    }
}

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
                _expectException(() => {
                    Assert.ok(!strEndsWith(null, null));
                });
                Assert.ok(!strEndsWith("", null));
                _expectException(() => {
                    Assert.ok(!strEndsWith(null, ""));
                });
                Assert.ok(strEndsWith("", ""));
                Assert.ok(!strEndsWith("", "a"));
                Assert.ok(!strEndsWith("a", "b"));
                Assert.ok(strEndsWith("a", ""));
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
                _expectException(() => {
                    Assert.ok(!strStartsWith(null as any, null as any));
                });
                Assert.ok(!strStartsWith("", null as any));
                _expectException(() => {
                    Assert.ok(!strStartsWith(null as any, ""));
                });
                Assert.ok(strStartsWith("", ""));
                Assert.ok(!strStartsWith("", "a"));
                Assert.ok(strStartsWith("a", ""));
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
                Assert.equal(0, objKeys(newObject).length, "The object should have no values");
            }
        });

        this.testCase({
            name: 'objExtend handle only invalid passed (undefined / null) values',
            test: () => {
                let newObject = objExtend(undefined, null);
                Assert.ok(isObject(newObject), "The returned object is an object");
                Assert.equal(0, objKeys(newObject).length, "The object should have no values");
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
                Assert.equal(false, isPlainObject(new AppInsightsCore()));
                Assert.equal(false, isPlainObject(utcNow()));
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
                Assert.equal(true, isObject(new AppInsightsCore()), "AppInsightsCore");
                Assert.equal(false, isObject(utcNow()), "utcNow");
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
                _expectException(() => {
                    Assert.equal(null, _getObjProto(null));
                });
                _expectException(() => {
                    Assert.equal(null, _getObjProto(undefined));
                });
                Assert.equal(Object.prototype, _getObjProto({}));
                Assert.equal(Date.prototype, _getObjProto(new Date()));
                Assert.equal(Number.prototype, _getObjProto(utcNow()));
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

        this.testCase({
            name: "objKeys",
            test: () => {
                let testObj = {
                    a: 1,
                    b: 2
                };

                let keys = objKeys(testObj);
                Assert.equal(2, keys.length);
                Assert.ok(keys[0] === "a" || keys[0] === "b");
                Assert.ok(keys[1] === "a" || keys[1] === "b");
                Assert.ok(keys[0] !== keys[1]);

                Assert.equal(0, objKeys([]).length, "An array should return an empty of keys");
                Assert.ok(isArray(objKeys([])), "Array Result should be an array");
                Assert.ok(isArray(objKeys({})), "Object Result should be an array");
            }
        });


        this.testCase({
            name: "isFeatureEnable: empty field and optInMap",
            test: () => {
                let rlt = isFeatureEnabled();
                Assert.equal(rlt, undefined, "feature is not enable case 1");

                rlt = isFeatureEnabled("");
                Assert.equal(rlt, undefined, "feature is not enable case 2");

                rlt = isFeatureEnabled("", {});
                Assert.equal(rlt, undefined, "feature is not enable case 3");

                rlt = isFeatureEnabled(undefined, {});
                Assert.equal(rlt, undefined, "feature is not enable case 4");

                rlt = isFeatureEnabled(undefined, {featureOptIn:{"field":{}}});
                Assert.equal(rlt, undefined, "feature is not enable case 5");

                rlt = isFeatureEnabled("field");
                Assert.equal(rlt, undefined, "feature is not enable case 6");

                rlt = isFeatureEnabled("field1", {featureOptIn:{}});
                Assert.equal(rlt, undefined, "feature is not enable case 7");

                rlt = isFeatureEnabled("field1", {featureOptIn:{"field":{}}});
                Assert.equal(rlt, undefined, "feature is not enable case 8");

                rlt = isFeatureEnabled("field", {featureOptIn:{"field":{}}});
                Assert.equal(rlt, undefined, "feature is not enable case 9");

                let cfg = {featureOptIn:{}} as IConfiguration;
                rlt = isFeatureEnabled("field", cfg);
                Assert.equal(rlt, undefined, "feature is not enable case 10");

                cfg = {featureOptIn: {"field":{}}} as IConfiguration;
                rlt = isFeatureEnabled("field", cfg);
                Assert.equal(rlt, undefined, "feature is not enable case 11");

                interface IConfig {
                    config1: string;
                    config2?: string;
                }
                cfg = {config1: "test", featureOptIn:{}} as IConfig & IConfiguration;
                rlt = isFeatureEnabled("field", cfg);
                Assert.equal(rlt, undefined, "feature is not enable case 10");
            }
        });

        this.testCase({
            name: "isFeatureEnable: empty field and optInMap - default to disabled",
            test: () => {
                let rlt = isFeatureEnabled(undefined, undefined, false);
                Assert.equal(rlt, false, "feature is disabled case 1");

                rlt = isFeatureEnabled("", undefined, false);
                Assert.equal(rlt, false, "feature is disabled case 2");

                rlt = isFeatureEnabled("", {}, false);
                Assert.equal(rlt, false, "feature is disabled case 3");

                rlt = isFeatureEnabled(undefined, {}, false);
                Assert.equal(rlt, false, "feature is disabled case 4");

                rlt = isFeatureEnabled(undefined, {featureOptIn:{"field":{}}}, false);
                Assert.equal(rlt, false, "feature is disabled case 5");

                rlt = isFeatureEnabled("field", undefined, false);
                Assert.equal(rlt, false, "feature is disabled case 6");

                rlt = isFeatureEnabled("field1", {featureOptIn:{}}, false);
                Assert.equal(rlt, false, "feature is disabled case 7");

                rlt = isFeatureEnabled("field1", {featureOptIn:{"field":{}}}, false);
                Assert.equal(rlt, false, "feature is not enable case 8");

                rlt = isFeatureEnabled("field", {featureOptIn:{"field":{}}}, false);
                Assert.equal(rlt, false, "feature is disabled case 9");

                let cfg = {featureOptIn:{}} as IConfiguration;
                rlt = isFeatureEnabled("field", cfg, false);
                Assert.equal(rlt, false, "feature is disabled case 10");

                cfg = {featureOptIn: {"field":{}}} as IConfiguration;
                rlt = isFeatureEnabled("field", cfg, false);
                Assert.equal(rlt, false, "feature is disabled case 11");

                interface IConfig {
                    config1: string;
                    config2?: string;
                }
                cfg = {config1: "test", featureOptIn:{}} as IConfig & IConfiguration;
                rlt = isFeatureEnabled("field", cfg, false);
                Assert.equal(rlt, false, "feature is disabled case 10");
            }
        });

        this.testCase({
            name: "isFeatureEnable: empty field and optInMap - default to enabled",
            test: () => {
                let rlt = isFeatureEnabled(undefined, undefined, true);
                Assert.equal(rlt, true, "feature is enabled case 1");

                rlt = isFeatureEnabled("", undefined, true);
                Assert.equal(rlt, true, "feature is enabled case 2");

                rlt = isFeatureEnabled("", {}, true);
                Assert.equal(rlt, true, "feature is enabled case 3");

                rlt = isFeatureEnabled(undefined, {}, true);
                Assert.equal(rlt, true, "feature is enabled case 4");

                rlt = isFeatureEnabled(undefined, {featureOptIn:{"field":{}}}, true);
                Assert.equal(rlt, true, "feature is enabled case 5");

                rlt = isFeatureEnabled("field", undefined, true);
                Assert.equal(rlt, true, "feature is enabled case 6");

                rlt = isFeatureEnabled("field1", {featureOptIn:{}}, true);
                Assert.equal(rlt, true, "feature is enabled case 7");

                rlt = isFeatureEnabled("field1", {featureOptIn:{"field":{}}}, true);
                Assert.equal(rlt, true, "feature is enabled case 8");

                rlt = isFeatureEnabled("field", {featureOptIn:{"field":{}}}, true);
                Assert.equal(rlt, true, "feature is enabled case 9");

                let cfg = {featureOptIn:{}} as IConfiguration;
                rlt = isFeatureEnabled("field", cfg, true);
                Assert.equal(rlt, true, "feature is enabled case 10");

                cfg = {featureOptIn: {"field":{}}} as IConfiguration;
                rlt = isFeatureEnabled("field", cfg, true);
                Assert.equal(rlt, true, "feature is enabled case 11");

                interface IConfig {
                    config1: string;
                    config2?: string;
                }
                cfg = {config1: "test", featureOptIn:{}} as IConfig & IConfiguration;
                rlt = isFeatureEnabled("field", cfg, true);
                Assert.equal(rlt, true, "feature is enabled case 10");
            }
        });

        this.testCase({
            name: "isFeatureEnable: should return expected results",
            test: () => {
                let field = "field1";
                interface IConfig {
                    config1?: string;
                    config2?: string;
                }

                let cfg = {featureOptIn:{[field]: {mode: FeatureOptInMode.enable} as IFeatureOptInDetails}}as IConfig & IConfiguration;
                let rlt = isFeatureEnabled(field, cfg);
                Assert.equal(rlt, true, "feature is enable case 1");

                cfg = {featureOptIn:{[field]: {mode: FeatureOptInMode.none} as IFeatureOptInDetails}}as IConfig & IConfiguration;
                rlt = isFeatureEnabled(field, cfg);
                Assert.equal(rlt, undefined, "feature is enable case 2");

                cfg = {featureOptIn:{[field]: {mode: FeatureOptInMode.disable} as IFeatureOptInDetails}}as IConfig & IConfiguration;
                rlt = isFeatureEnabled(field, cfg);
                Assert.equal(rlt, false, "feature is not enable case 3");

                cfg = {featureOptIn:{[field]: {onCfg:{"config1": false}} as IFeatureOptInDetails}}as IConfig & IConfiguration;
                rlt = isFeatureEnabled("field1", cfg);
                Assert.equal(rlt, undefined, "feature is not enable case 4");

                cfg = {featureOptIn:{[field]: {mode: 100 as any} as IFeatureOptInDetails}}as IConfig & IConfiguration;
                rlt = isFeatureEnabled(field, cfg);
                Assert.equal(rlt, undefined, "feature is not enable case 5");

                cfg = {featureOptIn:{[field]: {mode: FeatureOptInMode.enable} as IFeatureOptInDetails}}as IConfig & IConfiguration;
                rlt = isFeatureEnabled("field2", cfg);
                Assert.equal(rlt, undefined, "feature is not enable case 6");
            }
        });
    }
}
