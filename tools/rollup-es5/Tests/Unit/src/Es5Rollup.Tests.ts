import { AITestClass } from "@microsoft/ai-test-framework";
import { es5Check, es5Poly, importCheck } from "../../../src/applicationinsights-rollup-es5";

export class Es5RollupTests extends AITestClass {

    public testInitialize() {
    }

    private visibleNewlines(value) {
        if (value) {
            return value.replace(/\r/g, "\\r").replace(/\n/g, "\\n").replace(/\t/g, "\\t");
        }

        return value;
    }

    private convertNewlines(value, newline) {
        if (value) {
            return value.replace(/\n/g, newline);
        }

        return value;
    }

    private testPolyNoChange(options:any, input:string, id:string = null) {
        let plugin = es5Poly(options);

        QUnit.assert.equal(plugin.name, "ai-rollup-es5poly");
        QUnit.assert.equal(plugin.renderChunk(input, { filename: id ? id : "test.js" }), null);
        QUnit.assert.equal(plugin.transform(input, id ? id : "testId"), null);
    }

    private testCheckNoMatch(options:any, input:string) {
        let plugin = es5Check(options);

        QUnit.assert.equal(plugin.name, "ai-rollup-es5check");
        QUnit.assert.equal(plugin.renderChunk(input, { filename: "test.js" }), null);
        QUnit.assert.equal(plugin.transform(input, "testId"), null);
    }

    public testImportCheck(options:any, input:string) {
        let plugin = importCheck(options);

        QUnit.assert.equal(plugin.name, "ai-rollup-importcheck");
        QUnit.assert.equal(plugin.renderChunk(input, { filename: "test.js" }), null);
        QUnit.assert.equal(plugin.transform(input, "testId"), null);
    }

    public testImportCheckFail(options:any, input:string, renderExpected:string, transformExpected:string = null) {
        let plugin = importCheck(options);

        QUnit.assert.equal(plugin.name, "ai-rollup-importcheck");

        this.testError(plugin, input, input, renderExpected, transformExpected);
    }

    private doTest(plugin:any, input:string, expected:string) {
        this.testExpected(plugin, input, expected);
        this.testExpected(plugin, this.convertNewlines(input, "\r"), this.convertNewlines(expected, "\r"));
        this.testExpected(plugin, this.convertNewlines(input, "\r\n"), this.convertNewlines(expected, "\r\n"));
        this.testExpected(plugin, this.convertNewlines(input, "\n\r"), this.convertNewlines(expected, "\n\r"));
    }

    private testExpected(plugin:any, input:string, expected:string) {
        QUnit.assert.equal(plugin.name, "ai-rollup-es5poly");
        let result = plugin.renderChunk(input, { filename: "test.js" });
        QUnit.assert.equal(result != null ? result.code : null, expected, this.visibleNewlines(result != null ? result.code : null));

        result = plugin.transform(input, "testId");
        QUnit.assert.equal(result != null ? result.code : null, expected, this.visibleNewlines(result != null ? result.code : null));
    }

    private testError(plugin:any, message:string, input:string, renderExpected:string, transformExpected:string = null) {
        QUnit.assert.throws(() => {
            plugin.renderChunk(input, { filename: "test.js" });
        }, new Error(renderExpected), "renderChunk:" + (message || input));

        QUnit.assert.throws(() => {
            plugin.transform(input, "test.js");
        }, new Error(transformExpected || renderExpected.replace(/during renderChunk/g, "during transform")), "transform:" + (message || input));
    }

    public registerTests() {
        this.testCase({
            name: "No matching values for es5Poly",
            test: () => {
                this.testPolyNoChange(null, "Nothing removed");
                this.testPolyNoChange(null, "ClassName.prototype.anotherMethod = function () {\n};\n");

                this.testPolyNoChange(null, 
                    "ClassName.prototype.methodName = function () {\n" +
                    "    // This is a comment for a dynamic proto stub\n" +
                    "};\n");

                this.testPolyNoChange(null, 
                    "ClassName.prototype.methodName = function () {\n" +
                    "    // This is a comment for a dynamic proto stub\n" +
                    "};\n");

                this.testPolyNoChange(null, 
                    "// @Stub -- Type 1 comment\n" +
                    "function methodName() {\n" +
                    "    // This is a comment for a dynamic proto stub\n" +
                    "};\n");
    
                this.testPolyNoChange(null, 
                    "function methodName() {\n" +
                    "     // @Stub -- Type 2 single line comment\n" +
                    "};\n");
    
                this.testPolyNoChange(null, 
                    "function methodName() {\n" +
                    "     /* @Stub -- Type 2 multiline comment */\n" +
                    "};\n");
    
                this.testPolyNoChange(null, 
                    "function methodName() {\n" +
                    "     /* @Stub -- Type 2 multiline comment\n" +
                    "     * Continuation of a multi-line comment/\n" +
                    "     */\n" +
                    "};\n");
                }
        });

        this.testCase({
            name: "No matching values for es5Check",
            test: () => {
                this.testCheckNoMatch(null, "Nothing removed");
                this.testCheckNoMatch(null, "ClassName.prototype.anotherMethod = function () {\n};\n");
                this.testCheckNoMatch(null, "telemertyItem.time = CoreUtils.toISOString(new Date());");
                this.testCheckNoMatch(null, "var responseHeaders = {};\nresponse.headers.forEach(function (value, name) {\n");
            }
        });

        this.testCase({
            name: "Test es5Polyfil implementations",
            test: () => {
                this.testPolyNoChange(null, 
                    "Object[\"defineProperty\"](exports, '__esModule', { value: true });");

                this.testPolyNoChange(null, 
                    "Object.defineProperty(exports, '__esModule', { value: true });");

                this.testPolyNoChange(null, 
                    "return r && Object.defineProperty(exports, '__esModule', { value: true }), b;");

                this.testPolyNoChange(null, 
                    "d = Object.getOwnPropertyDescriptor(obj, 'foo'), a=b;");

                this.testPolyNoChange(null, 
                    "d = Object.getOwnPropertyDescriptor(obj, 'foo');");
    
                this.testPolyNoChange(null, 
                    "Rectangle.prototype = Object.create(Shape.prototype);");

                this.testPolyNoChange(null, 
                    "Rectangle.prototype = Object.create(Shape.prototype, propsObj);");

                this.testPolyNoChange(null, 
                    "a = Object.freeze(obj);");

                this.testPolyNoChange(null, 
                    "a = Object.seal(obj);");

                this.testPolyNoChange(null, 
                    "var dt = new Date();\n" +
                    "\n" +
                    "dt.toISOString ();\n" +
                    "Can.toISOString();\n");

                }
        });

        this.testCase({
            name: "Test Errors es5Check",
            test: () => {

                this.testError(
                    es5Check(), 
                    null, 
                    "var arr = Object.is(a);\n",
                    "Invalid IE/ES5 function [Object.is(] found on line [1], column [11], position [10] during renderChunk - test.js\n" +
                    "[Object.is(] is not supported in an IE/ES5 environment, use a helper function or add explicit check for existence\n" +
                    "1   :var arr = Object.is(a);\n" +
                    "               ^^^^^^^^^^\n" +
                    "\n" +
                    "--------------------=([Object.is(])=--------------------\n"
                    );

                this.testError(
                    es5Check(), 
                    null, 
                    "var arr = Object.fromEntries(a);\n",
                    "Invalid IE/ES5 function [Object.fromEntries(] found on line [1], column [11], position [10] during renderChunk - test.js\n" +
                    "[Object.fromEntries(] is not supported in an IE/ES5 environment, use a helper function or add explicit check for existence\n" +
                    "1   :var arr = Object.fromEntries(a);\n" +
                    "               ^^^^^^^^^^^^^^^^^^^\n" +
                    "\n" +
                    "--------------------=([Object.fromEntries(])=--------------------\n"
                    );

                this.testError(
                    es5Check(), 
                    null, 
                    "var arr = Object.entries(a);\n",
                    "Invalid IE/ES5 function [Object.entries(] found on line [1], column [11], position [10] during renderChunk - test.js\n" +
                    "[Object.entries(] is not supported in an IE/ES5 environment, use a helper function or add explicit check for existence\n" +
                    "1   :var arr = Object.entries(a);\n" +
                    "               ^^^^^^^^^^^^^^^\n" +
                    "\n" +
                    "--------------------=([Object.entries(])=--------------------\n"
                    );

                this.testError(
                    es5Check(), 
                    null, 
                    "var arr = Object.assign(a);\n",
                    "Invalid IE/ES5 function [Object.assign(] found on line [1], column [11], position [10] during renderChunk - test.js\n" +
                    "[Object.assign(] is not supported in an IE/ES5 environment, use a helper function or add explicit check for existence\n" +
                    "1   :var arr = Object.assign(a);\n" +
                    "               ^^^^^^^^^^^^^^\n" +
                    "\n" +
                    "--------------------=([Object.assign(])=--------------------\n"
                    );

                this.testError(
                    es5Check(), 
                    null, 
                    "var x = Object.setPrototypeOf(a);\n",
                    "Invalid IE/ES5 function [Object.setPrototypeOf(] found on line [1], column [9], position [8] during renderChunk - test.js\n" +
                    "[Object.setPrototypeOf(] is not supported in an IE/ES5 environment, use a helper function or add explicit check for existence\n" +
                    "1   :var x = Object.setPrototypeOf(a);\n" +
                    "             ^^^^^^^^^^^^^^^^^^^^^^\n" +
                    "\n" +
                    "--------------------=([Object.setPrototypeOf(])=--------------------\n"
                    );

                this.testError(
                    es5Check(), 
                    null, 
                    "var x = Object.keys(a);\n",
                    "Invalid IE/ES5 function [Object.keys(] found on line [1], column [9], position [8] during renderChunk - test.js\n" +
                    "[Object.keys(] is not supported in an IE/ES5 environment, use a helper function or add explicit check for existence\n" +
                    "1   :var x = Object.keys(a);\n" +
                    "             ^^^^^^^^^^^^\n" +
                    "\n" +
                    "--------------------=([Object.keys(])=--------------------\n"
                    );
                                                                                                                                                                                                                                                                   
            }
        });

        this.testCase({
            name: "Test Import Check",
            test: () => {
                let plugin = importCheck({});

                this.testImportCheck({}, "");
                this.testImportCheck({ exclude: ["index"]}, "import {\nSomeClass\n} from './MyCode'");
                this.testImportCheck({ exclude: ["index"]}, "import {\nSomeClass\n} from \"./MyCode\"");

                this.testImportCheckFail(
                    { exclude: [ "index" ]},
                    "import { A, B, C } from './Index';",
                    "Invalid Import detected [import { A, B, C } from './Index'] found on line [0], column [1], position [0] during renderChunk - test.js\n" +
                    "Importing from this module has been blocked, you should be importing directly from the source file and not the main module index definition - [import { A, B, C } from './Index']\n" +
                    "\n" +
                    "--------------------=([import { A, B, C } from './Index'])=--------------------\n");

                this.testImportCheckFail(
                    { exclude: [ "index" ]},
                    "import { A, B, C } from \"./Index\";",
                    "Invalid Import detected [import { A, B, C } from \"./Index\"] found on line [0], column [1], position [0] during renderChunk - test.js\n" +
                    "Importing from this module has been blocked, you should be importing directly from the source file and not the main module index definition - [import { A, B, C } from \"./Index\"]\n" +
                    "\n" +
                    "--------------------=([import { A, B, C } from \"./Index\"])=--------------------\n");

                this.testImportCheckFail(
                    { exclude: [ "index" ]},
                    "import { A, B, C } from './Index'",
                    "Invalid Import detected [import { A, B, C } from './Index'] found on line [0], column [1], position [0] during renderChunk - test.js\n" +
                    "Importing from this module has been blocked, you should be importing directly from the source file and not the main module index definition - [import { A, B, C } from './Index']\n" +
                    "\n" +
                    "--------------------=([import { A, B, C } from './Index'])=--------------------\n");

                this.testImportCheckFail(
                    { exclude: [ "index" ]},
                    "import { A, B, C } from \"./Index\"",
                    "Invalid Import detected [import { A, B, C } from \"./Index\"] found on line [0], column [1], position [0] during renderChunk - test.js\n" +
                    "Importing from this module has been blocked, you should be importing directly from the source file and not the main module index definition - [import { A, B, C } from \"./Index\"]\n" +
                    "\n" +
                    "--------------------=([import { A, B, C } from \"./Index\"])=--------------------\n");

                this.testImportCheckFail(
                    { exclude: [ "index" ]},
                    "import { A, B, C } from './index';",
                    "Invalid Import detected [import { A, B, C } from './index'] found on line [0], column [1], position [0] during renderChunk - test.js\n" +
                    "Importing from this module has been blocked, you should be importing directly from the source file and not the main module index definition - [import { A, B, C } from './index']\n" +
                    "\n" +
                    "--------------------=([import { A, B, C } from './index'])=--------------------\n");

                this.testImportCheckFail(
                    { exclude: [ "index" ]},
                    "import { A, B, C } from \"./index\";",
                    "Invalid Import detected [import { A, B, C } from \"./index\"] found on line [0], column [1], position [0] during renderChunk - test.js\n" +
                    "Importing from this module has been blocked, you should be importing directly from the source file and not the main module index definition - [import { A, B, C } from \"./index\"]\n" +
                    "\n" +
                    "--------------------=([import { A, B, C } from \"./index\"])=--------------------\n");

                this.testImportCheckFail(
                    { exclude: [ "index" ]},
                    "import { A, B, C } from './index'",
                    "Invalid Import detected [import { A, B, C } from './index'] found on line [0], column [1], position [0] during renderChunk - test.js\n" +
                    "Importing from this module has been blocked, you should be importing directly from the source file and not the main module index definition - [import { A, B, C } from './index']\n" +
                    "\n" +
                    "--------------------=([import { A, B, C } from './index'])=--------------------\n");

                this.testImportCheckFail(
                    { exclude: [ "index" ]},
                    "import { A, B, C } from \"./index\"",
                    "Invalid Import detected [import { A, B, C } from \"./index\"] found on line [0], column [1], position [0] during renderChunk - test.js\n" +
                    "Importing from this module has been blocked, you should be importing directly from the source file and not the main module index definition - [import { A, B, C } from \"./index\"]\n" +
                    "\n" +
                    "--------------------=([import { A, B, C } from \"./index\"])=--------------------\n");

                this.testImportCheckFail(
                    { exclude: [ "index" ]},
                    "import { A, B, C } from './folder/index';",
                    "Invalid Import detected [import { A, B, C } from './folder/index'] found on line [0], column [1], position [0] during renderChunk - test.js\n" +
                    "Importing from this module has been blocked, you should be importing directly from the source file and not the main module index definition - [import { A, B, C } from './folder/index']\n" +
                    "\n" +
                    "--------------------=([import { A, B, C } from './folder/index'])=--------------------\n");

                this.testImportCheckFail(
                    { exclude: [ "index" ]},
                    "import { A, B, C } from \"./folder/index\";",
                    "Invalid Import detected [import { A, B, C } from \"./folder/index\"] found on line [0], column [1], position [0] during renderChunk - test.js\n" +
                    "Importing from this module has been blocked, you should be importing directly from the source file and not the main module index definition - [import { A, B, C } from \"./folder/index\"]\n" +
                    "\n" +
                    "--------------------=([import { A, B, C } from \"./folder/index\"])=--------------------\n");

                this.testImportCheckFail(
                    { exclude: [ "index" ]},
                    "import { A, B, C } from './folder/index'",
                    "Invalid Import detected [import { A, B, C } from './folder/index'] found on line [0], column [1], position [0] during renderChunk - test.js\n" +
                    "Importing from this module has been blocked, you should be importing directly from the source file and not the main module index definition - [import { A, B, C } from './folder/index']\n" +
                    "\n" +
                    "--------------------=([import { A, B, C } from './folder/index'])=--------------------\n");

                this.testImportCheckFail(
                    { exclude: [ "index" ]},
                    "import { A, B, C } from \"./folder/index\"",
                    "Invalid Import detected [import { A, B, C } from \"./folder/index\"] found on line [0], column [1], position [0] during renderChunk - test.js\n" +
                    "Importing from this module has been blocked, you should be importing directly from the source file and not the main module index definition - [import { A, B, C } from \"./folder/index\"]\n" +
                    "\n" +
                    "--------------------=([import { A, B, C } from \"./folder/index\"])=--------------------\n");

                this.testImportCheckFail(
                    { exclude: [ "index" ]},
                    "import * from './Index';",
                    "Invalid Import detected [import * from './Index'] found on line [0], column [1], position [0] during renderChunk - test.js\n" +
                    "Importing from this module has been blocked, you should be importing directly from the source file and not the main module index definition - [import * from './Index']\n" +
                    "\n" +
                    "--------------------=([import * from './Index'])=--------------------\n");

                this.testImportCheckFail(
                    { exclude: [ "index" ]},
                    "import * from \"./Index\";",
                    "Invalid Import detected [import * from \"./Index\"] found on line [0], column [1], position [0] during renderChunk - test.js\n" +
                    "Importing from this module has been blocked, you should be importing directly from the source file and not the main module index definition - [import * from \"./Index\"]\n" +
                    "\n" +
                    "--------------------=([import * from \"./Index\"])=--------------------\n");

                this.testImportCheckFail(
                    { exclude: [ "index" ]},
                    "import * from './Index'",
                    "Invalid Import detected [import * from './Index'] found on line [0], column [1], position [0] during renderChunk - test.js\n" +
                    "Importing from this module has been blocked, you should be importing directly from the source file and not the main module index definition - [import * from './Index']\n" +
                    "\n" +
                    "--------------------=([import * from './Index'])=--------------------\n");

                this.testImportCheckFail(
                    { exclude: [ "index" ]},
                    "import * from \"./Index\"",
                    "Invalid Import detected [import * from \"./Index\"] found on line [0], column [1], position [0] during renderChunk - test.js\n" +
                    "Importing from this module has been blocked, you should be importing directly from the source file and not the main module index definition - [import * from \"./Index\"]\n" +
                    "\n" +
                    "--------------------=([import * from \"./Index\"])=--------------------\n");

                    this.testImportCheckFail(
                    { exclude: [ "index" ]},
                    "import * from './folder/Index';",
                    "Invalid Import detected [import * from './folder/Index'] found on line [0], column [1], position [0] during renderChunk - test.js\n" +
                    "Importing from this module has been blocked, you should be importing directly from the source file and not the main module index definition - [import * from './folder/Index']\n" +
                    "\n" +
                    "--------------------=([import * from './folder/Index'])=--------------------\n");

                this.testImportCheckFail(
                    { exclude: [ "index" ]},
                    "import * from \"./folder/Index\";",
                    "Invalid Import detected [import * from \"./folder/Index\"] found on line [0], column [1], position [0] during renderChunk - test.js\n" +
                    "Importing from this module has been blocked, you should be importing directly from the source file and not the main module index definition - [import * from \"./folder/Index\"]\n" +
                    "\n" +
                    "--------------------=([import * from \"./folder/Index\"])=--------------------\n");

            }
        });
    }
}

