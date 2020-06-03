/// <reference path="../TestFramework/TestClass.ts" />

import { 
    objCreateFn, getGlobal, __extendsFn, __assignFn, 
    strShimFunction, strShimHasOwnProperty, strShimObject, strShimPrototype, strShimUndefined 
} from "../../src/applicationinsights-shims";

//import * as sinon from 'sinon';

export class ShimsTests extends TestClass {

    private _global: any = null;

    public testInitialize() {
        this._global = getGlobal();
    }

    public registerTests() {
        this.testCase({
            name: "__extends should exist",
            test: () => {
                QUnit.assert.ok(this._global.__extends !== undefined, "__extends should exist");
                QUnit.assert.ok(this._global.__extends === __extendsFn, "Check that it came from ");
            }
        });

        this.testCase({
            name: "__assign should exist and be assigned to Object.assign or embedded __assignFn",
            test: () => {
                QUnit.assert.ok(this._global.__assign !== undefined, "__extends should exist");
                if ((Object as any).assign) {
                    QUnit.assert.ok(this._global.__assign === (Object as any).assign, "Check that it came from ");
                } else {
                    QUnit.assert.ok(this._global.__assign === __assignFn, "Check that it came from ");
                }
            }
        });

        this.testCase({
            name: "objCreateFn should exist",
            test: () => {
                
                QUnit.assert.ok(objCreateFn !== undefined, "__extends should exist");
            }
        });

        this.testCase({
            name: "test string values",
            test: () => {
                
                QUnit.assert.ok(strShimFunction === "function", "check function");
                QUnit.assert.ok(strShimObject === "object", "check object");
                QUnit.assert.ok(strShimUndefined === "undefined", "check undefined");
                QUnit.assert.ok(strShimPrototype === "prototype", "check prototype");
                QUnit.assert.ok(strShimHasOwnProperty === "hasOwnProperty", "check hasOwnProperty");
            }
        });
    }
}

export function runTests() {
    new ShimsTests().registerTests();
}
