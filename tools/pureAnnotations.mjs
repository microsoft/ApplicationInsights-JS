/**
 * pureAnnotations.mjs - Shared helpers for normalizing `/*#__PURE__*\/`
 * (and `/*@__PURE__*\/`) tree-shaking annotations.
 *
 * PURE annotations are only meaningful on call and new expressions. The
 * source retains legacy parenthesized annotations, while generated output is
 * parsed so invalid annotations can be removed without touching annotation
 * text inside strings or unrelated comments.
 *
 * This single source of truth is shared by:
 *   - rollup.base.config.js `fixPureAnnotations()` (rollup-bundled dist/es5),
 *     which imports it directly (rollup inlines it when bundling the config).
 *   - tools/grunt-tasks/fixPureAnnotations.js `fix-pure` (tsc dist-es5), which
 *     loads it via dynamic import() from the CommonJS grunt task.
 */

import { parse } from "acorn";

var PURE_COMMENT = /^\s*([#@])__PURE__\s*$/;

/**
 * Removes PURE annotations that do not apply to a call or new expression and
 * canonicalizes valid annotations. Returns the (possibly unchanged) code.
 * @param {string} code
 * @returns {string}
 */
export function canonicalizePureAnnotations(code) {
    if (code.indexOf("__PURE__") === -1) {
        return code;
    }

    var comments = [];
    var tokens = [];
    var validExpressionStarts = {};

    var ast = parse(code, {
        allowHashBang: true,
        ecmaVersion: "latest",
        onComment: comments,
        onToken: tokens,
        sourceType: "module"
    });

    _collectValidExpressionStarts(ast, validExpressionStarts);

    var edits = [];
    comments.forEach(function (comment) {
        if (comment.type !== "Block") {
            return;
        }

        var pureMatch = PURE_COMMENT.exec(comment.value);
        if (!pureMatch) {
            return;
        }

        var tokenIndex = _findNextToken(tokens, comment.end);
        var immediateToken = tokens[tokenIndex];
        var isValid = !!(immediateToken && validExpressionStarts[immediateToken.start]);
        var start = comment.start;
        var previous = start - 1;
        while (previous >= 0 && /\s/.test(code.charAt(previous))) {
            previous--;
        }

        if (code.charAt(previous) === "(") {
            start = previous + 1;
        }

        var end = comment.end;
        if (immediateToken && /^\s*$/.test(code.substring(end, immediateToken.start))) {
            end = immediateToken.start;
        }

        edits.push({
            end: end,
            replacement: isValid ? "/*" + pureMatch[1] + "__PURE__*/" : "",
            start: start
        });
    });

    for (var lp = edits.length - 1; lp >= 0; lp--) {
        var edit = edits[lp];
        code = code.substring(0, edit.start) + edit.replacement + code.substring(edit.end);
    }

    return code;
}

function _collectValidExpressionStarts(node, validExpressionStarts) {
    var pending = [node];

    while (pending.length > 0) {
        var current = pending.pop();
        if (!current || typeof current !== "object") {
            continue;
        }

        if (current.type === "CallExpression" || current.type === "NewExpression") {
            validExpressionStarts[current.start] = true;
        }

        Object.keys(current).forEach(function (key) {
            var value = current[key];
            if (Array.isArray(value)) {
                value.forEach(function (child) {
                    if (child && typeof child === "object") {
                        pending.push(child);
                    }
                });
            } else if (value && typeof value === "object" && typeof value.type === "string") {
                pending.push(value);
            }
        });
    }
}

function _findNextToken(tokens, position) {
    var low = 0;
    var high = tokens.length;

    while (low < high) {
        var middle = (low + high) >> 1;
        if (tokens[middle].start < position) {
            low = middle + 1;
        } else {
            high = middle;
        }
    }

    return low;
}
