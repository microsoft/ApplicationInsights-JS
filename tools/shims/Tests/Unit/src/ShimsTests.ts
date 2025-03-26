import { AITestClass } from "@microsoft/ai-test-framework";
import { 
    strShimFunction, strShimObject, strShimPrototype, strShimUndefined, ObjDefineProperty, ObjAssign, getGlobal 
} from "../../../src/applicationinsights-shims";
import { __extendsFn, __assignFn, __objAssignFnImpl }  from "../../../src/TsLibShims";
import { __exposeGlobalTsLib }  from "../../../src/TsLibGlobals";
import { objCreate } from "@nevware21/ts-utils";

__exposeGlobalTsLib();

export class ShimsTests extends AITestClass {

    private _global: any = null;

    public testInitialize() {
        this._global = getGlobal(false);
        try {
            delete this._global.__assign;
            delete this._global.__extends;
        } catch (e) {
            // Can't do anything if the cleanup fails
        }
    }

    public registerTests() {
        this.testCase({
            name: "__extends should exist as a global",
            test: () => {
                __exposeGlobalTsLib();

                QUnit.assert.ok(this._global.__extends !== undefined, "__extends should exist");
                QUnit.assert.ok(this._global.__extends === __extendsFn, "Check that it came from the shims module");
            }
        });

        this.testCase({
            name: "__assign should exist as a global and be assigned to Object.assign or embedded __assignFn",
            test: () => {
                __exposeGlobalTsLib();

                QUnit.assert.ok(this._global.__assign !== undefined, "__assign should exist");
                if ((Object as any).assign) {
                    QUnit.assert.ok(this._global.__assign === (Object as any).assign, "Check that it came from the shims module");
                } else {
                    QUnit.assert.ok(this._global.__assign === __objAssignFnImpl, "Check that it came from the shims module");
                }
            }
        });

        this.testCase({
            name: "__assignFn should be assigned to Object.assign or embedded __assignFn",
            test: () => {
                QUnit.assert.ok(__assignFn !== undefined, "__assignFn should exist");
                if ((Object as any).assign) {
                    QUnit.assert.ok(__assignFn === (Object as any).assign, "Check that it came from the shims module");
                } else {
                    QUnit.assert.ok(this._global.__assign === __objAssignFnImpl, "Check that it came from the shims module");
                }
            }
        });

        this.testCase({
            name: "__objAssignImplFn should be assigned values to target",
            test: () => {
                let t = __objAssignFnImpl({}, {a:1}, {b:2});
                QUnit.assert.equal(t.a, 1, "Checking expected value");
                QUnit.assert.equal(t.b, 2, "Checking expected value");

                // check overwrite
                t = __objAssignFnImpl({a:0}, {a:1}, {b:2});
                QUnit.assert.equal(t.a, 1, "Checking expected value");
                QUnit.assert.equal(t.b, 2, "Checking expected value");

                // check target
                t = __objAssignFnImpl({x:0}, {a:1}, {b:2});
                QUnit.assert.equal(t.x, 0, "Checking expected value");
                QUnit.assert.equal(t.a, 1, "Checking expected value");
                QUnit.assert.equal(t.b, 2, "Checking expected value");
            }
        });

        this.testCase({
            name: "__assignFn should be assigned values to target",
            test: () => {
                let t = __assignFn({}, {a:1}, {b:2});
                QUnit.assert.equal(t.a, 1, "Checking expected value");
                QUnit.assert.equal(t.b, 2, "Checking expected value");

                // check overwrite
                t = __assignFn({a:0}, {a:1}, {b:2});
                QUnit.assert.equal(t.a, 1, "Checking expected value");
                QUnit.assert.equal(t.b, 2, "Checking expected value");

                // check target
                t = __assignFn({x:0}, {a:1}, {b:2});
                QUnit.assert.equal(t.x, 0, "Checking expected value");
                QUnit.assert.equal(t.a, 1, "Checking expected value");
                QUnit.assert.equal(t.b, 2, "Checking expected value");
            }
        });

        this.testCase({
            name: "objCreate should exist",
            test: () => {
                
                QUnit.assert.ok(objCreate !== undefined, "__extends should exist");
            }
        });

        this.testCase({
            name: "test string values",
            test: () => {
                
                QUnit.assert.ok(strShimFunction === "function", "check function");
                QUnit.assert.ok(strShimObject === "object", "check object");
                QUnit.assert.ok(strShimUndefined === "undefined", "check undefined");
                QUnit.assert.ok(strShimPrototype === "prototype", "check prototype");
            }
        });

        this.testCase({
            name: "Validate exported globals are references to the runtime versions",
            test: () => {
                QUnit.assert.equal(Object.create, objCreate, "The exported create should be an alias to the real create");
                QUnit.assert.equal(Object.assign, ObjAssign, "The exported assign should be an alias to the real create");
                QUnit.assert.equal(Object.defineProperty, ObjDefineProperty, "The exported define property should be an alias to the real create");
            }
        })
    }
}
