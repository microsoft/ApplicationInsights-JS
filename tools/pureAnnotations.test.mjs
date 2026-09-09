import assert from "node:assert/strict";
import { canonicalizePureAnnotations } from "./pureAnnotations.mjs";

var invalidExpressions = [
    "null",
    "true",
    "false",
    "\"string\"",
    "'string'",
    "42",
    "42n",
    "0xff",
    "0b1010",
    "0o755",
    "1.5e2",
    "/regex/",
    "`template`",
    "[]",
    "{}",
    "function () {}",
    "() => 1",
    "class {}",
    "identifier",
    "!factory()",
    "left + right",
    "condition ? left : right",
    "(factory(), identifier)",
    "(factory())",
    "((factory)())"
];

invalidExpressions.forEach(function (expression) {
    var input = "var value = ( /* @__PURE__ */ " + expression + ");";
    var expected = "var value = (" + expression + ");";
    assert.equal(canonicalizePureAnnotations(input), expected, "removes PURE from " + expression);
});

var validCases = [
    {
        expected: "var value = (/*#__PURE__*/factory());",
        input: "var value = ( /*#__PURE__*/ factory());"
    },
    {
        expected: "var value = (/*@__PURE__*/new Factory());",
        input: "var value = ( /* @__PURE__ */ new Factory());"
    },
    {
        expected: "var value = /*#__PURE__*/namespace.factory();",
        input: "var value = /* #__PURE__ */ namespace.factory();"
    },
    {
        expected: "var value = /*#__PURE__*/(function () {})();",
        input: "var value = /* #__PURE__ */ (function () {})();"
    },
    {
        expected: "var value = /*#__PURE__*/(0, factory)();",
        input: "var value = /* #__PURE__ */ (0, factory)();"
    },
    {
        expected: "var value = (/*#__PURE__*/factory().value);",
        input: "var value = ( /* #__PURE__ */ factory().value);"
    },
    {
        expected: "var value = (/*@__PURE__*/factory?.());",
        input: "var value = ( /* @__PURE__ */ factory?.());"
    },
    {
        expected: "var value = (/*#__PURE__*/new Factory().value);",
        input: "var value = ( /* #__PURE__ */ new Factory().value);"
    },
    {
        expected: "export var value = (/*#__PURE__*/factory());",
        input: "export var value = ( /* #__PURE__ */ \nfactory());"
    }
];

validCases.forEach(function (testCase) {
    assert.equal(canonicalizePureAnnotations(testCase.input), testCase.expected, "preserves PURE on call/new");
});

var untouchedCases = [
    "var value = \"(/*#__PURE__*/ literal)\";",
    "var value = '/*@__PURE__*/ null';",
    "var value = `/*#__PURE__*/ false`;",
    "// /*#__PURE__*/ null\nvar value = null;",
    "/* an ordinary comment */ var value = null;",
    "var value = 42;"
];

untouchedCases.forEach(function (code) {
    assert.equal(canonicalizePureAnnotations(code), code, "leaves non-annotation text unchanged");
});

assert.throws(function () {
    canonicalizePureAnnotations("var = /* #__PURE__ */ invalid;");
}, SyntaxError, "surfaces invalid generated JavaScript");

validCases.forEach(function (testCase) {
    var normalized = canonicalizePureAnnotations(testCase.input);
    assert.equal(canonicalizePureAnnotations(normalized), normalized, "normalization is idempotent");
});

console.log("PURE annotation normalization tests passed");
