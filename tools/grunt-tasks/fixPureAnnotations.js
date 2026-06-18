/**
 * fixPureAnnotations.js - Grunt task to canonicalize `/*#__PURE__*\/` (and
 * `/*#@__PURE__*\/`) tree-shaking annotations in the per-module `dist-es5`
 * output that is emitted by the TypeScript compiler (the package `module`
 * entry point that npm consumers import).
 *
 * Why this is needed:
 *   TypeScript emits parenthesized PURE annotations with whitespace after the
 *   opening parenthesis, e.g. `( /*#__PURE__*\/"http.")`. The wrapping
 *   parentheses are required so that older versions of Rollup / Webpack /
 *   Terser still tree-shake the constants, so they must NOT be removed.
 *   However, newer bundlers such as Rolldown (Vite 8) are stricter and reject
 *   the spaced form, emitting `[INVALID_ANNOTATION]` warnings. This task
 *   rewrites the spaced form back to the canonical, flush-against-the-paren
 *   form `(/*#__PURE__*\/...)` which is accepted by every bundler while still
 *   preserving the tree-shaking behaviour.
 *
 *   The `rollup.base.config.js` `fixPureAnnotations()` plugin already performs
 *   this canonicalization for the rollup-bundled `dist/es5` / `browser` CDN
 *   outputs (the package `main` entry). This task closes the gap for the
 *   un-bundled `dist-es5` tsc output (the package `module` entry) which never
 *   passes through rollup. See issue #2736.
 *
 * Usage in gruntfile:
 *   grunt.loadTasks("./tools/grunt-tasks");
 *   grunt.registerTask("mytask", ["fix-pure:mypackage"]);
 *
 * Config example:
 *   "fix-pure": {
 *       "mypackage": {
 *           src: ["dist-es5/**\/*.js"]
 *       }
 *   }
 */
module.exports = function (grunt) {
    "use strict";

    grunt.registerMultiTask("fix-pure", "Canonicalize PURE tree-shaking annotations in dist-es5 output", function () {
        var files = this.filesSrc;
        var done = this.async();

        if (!files || files.length === 0) {
            grunt.log.warn("No files matched for PURE annotation canonicalization.");
            done();
            return;
        }

        // The shared helper is an ES module, so load it via dynamic import().
        import("../pureAnnotations.mjs").then(function (mod) {
            var canonicalizePureAnnotations = mod.canonicalizePureAnnotations;
            var filesChecked = 0;
            var filesChanged = 0;

            files.forEach(function (filepath) {
                if (!grunt.file.exists(filepath)) {
                    return;
                }

                // Skip source map files - only the emitted JavaScript is rewritten.
                if (filepath.indexOf(".map") !== -1) {
                    return;
                }

                filesChecked++;

                var content = grunt.file.read(filepath);
                var normalized = canonicalizePureAnnotations(content);

                if (normalized !== content) {
                    grunt.file.write(filepath, normalized);
                    filesChanged++;
                }
            });

            grunt.log.ok("Canonicalized PURE annotations: checked " + filesChecked + " file(s), updated " + filesChanged + " file(s).");
            done();
        }, function (err) {
            grunt.log.error("Failed to load PURE annotation helper: " + err);
            done(false);
        });
    });
};
