/**
 * pureAnnotations.mjs - Shared helpers for canonicalizing `/*#__PURE__*\/`
 * (and `/*#@__PURE__*\/`) tree-shaking annotations.
 *
 * TypeScript emits parenthesized PURE annotations with whitespace after the
 * opening parenthesis, e.g. `( /*#__PURE__*\/"http.")`. The wrapping
 * parentheses are required so that older versions of Rollup / Webpack / Terser
 * still tree-shake the constants, so they must NOT be removed. However, newer
 * bundlers such as Rolldown (Vite 8) are stricter and reject the spaced form,
 * emitting `[INVALID_ANNOTATION]` warnings. Canonicalizing to the flush form
 * `(/*#__PURE__*\/...)` is accepted by every bundler while preserving the
 * tree-shaking behaviour.
 *
 * This single source of truth is shared by:
 *   - rollup.base.config.js `fixPureAnnotations()` (rollup-bundled dist/es5),
 *     which imports it directly (rollup inlines it when bundling the config).
 *   - tools/grunt-tasks/fixPureAnnotations.js `fix-pure` (tsc dist-es5), which
 *     loads it via dynamic import() from the CommonJS grunt task.
 *
 * It is authored as an ES module (.mjs) so the rollup config bundler (which
 * does not run the commonjs plugin) can consume the named exports.
 */

// Matches an opening parenthesis followed by a (possibly whitespace padded)
// PURE / @__PURE__ annotation, capturing the leading marker char (# or @).
export var PURE_COMMENT_CANONICALIZE = /\(\s*\/\*\s*([#@])__PURE__\s*\*\/\s*/g;

/**
 * Rewrites any spaced PURE annotation forms in the supplied code to the
 * canonical flush-against-the-paren form. Returns the (possibly unchanged)
 * code string.
 * @param {string} code
 * @returns {string}
 */
export function canonicalizePureAnnotations(code) {
    return code.replace(PURE_COMMENT_CANONICALIZE, "(/*$1__PURE__*/");
}
