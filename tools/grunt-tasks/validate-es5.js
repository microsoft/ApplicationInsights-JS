/**
 * validate-es5.js - Grunt task to validate that compiled browser bundles
 * contain only ES5-compatible syntax. This catches accidental introduction
 * of ES6+ features (arrow functions, let/const, class, template literals,
 * spread, optional chaining, nullish coalescing, etc.) that would break
 * older browser environments.
 *
 * Usage in gruntfile:
 *   grunt.loadTasks("../../tools/grunt-tasks");
 *   grunt.registerTask("mytest", ["validate-es5:mypackage"]);
 *
 * Config example:
 *   "validate-es5": {
 *       "mypackage": {
 *           src: ["browser/es5/*.js"]
 *       }
 *   }
 */
module.exports = function (grunt) {
    "use strict";

    // ES6+ syntax patterns that should NOT appear in ES5 bundles.
    // Each entry has a regex and a description for the error message.
    // These are designed to minimize false positives in string literals
    // by focusing on syntactic patterns that only appear in code context.
    var patterns = [
        {
            // Arrow functions: () => or x =>
            // Exclude occurrences inside quoted strings by requiring non-quote char before
            pattern: /[^"'`\\]=>[\s{(]/,
            name: "arrow function (=>)"
        },
        {
            // const/let declarations at start of line or after semicolon/brace
            pattern: /(?:^|[;{}(,\n])\s*(?:const|let)\s+/m,
            name: "let/const declaration"
        },
        {
            // class declaration or expression (but not in strings like "className")
            pattern: /(?:^|[;{}(\s,\n])class\s+[A-Z]/m,
            name: "class declaration"
        },
        {
            // Template literals (backtick strings)
            pattern: /[^"'\\]`[^`]*`/,
            name: "template literal (backtick)"
        },
        {
            // Optional chaining ?.
            pattern: /\w\?\.\w/,
            name: "optional chaining (?.)"
        },
        {
            // Nullish coalescing ??
            pattern: /\?\?[^=]/,
            name: "nullish coalescing (??)"
        },
        {
            // Spread in array/object literal or rest params: ...identifier
            // But not in comments (//...) or strings
            pattern: /(?:[(,\[{=])\s*\.\.\.[a-zA-Z_$]/,
            name: "spread/rest operator (...)"
        },
        {
            // async/await keywords
            pattern: /(?:^|[\s;{}(,])async\s+function/m,
            name: "async function"
        },
        {
            // await expression
            pattern: /(?:^|[\s;{}(=,])await\s+/m,
            name: "await expression"
        },
        {
            // for...of loop
            pattern: /\bfor\s*\(\s*(?:var|let|const)\s+\w+\s+of\s+/,
            name: "for...of loop"
        },
        {
            // Destructuring assignment in var/let/const: var { x } = or var [ x ] =
            pattern: /(?:var|let|const)\s+[\[{]\s*\w/,
            name: "destructuring assignment"
        }
    ];

    grunt.registerMultiTask("validate-es5", "Validate that browser bundles contain only ES5 syntax", function () {
        var files = this.filesSrc;
        var errors = [];
        var filesChecked = 0;

        if (!files || files.length === 0) {
            grunt.log.warn("No files matched for ES5 validation.");
            return;
        }

        files.forEach(function (filepath) {
            if (!grunt.file.exists(filepath)) {
                grunt.log.warn("File not found: " + filepath);
                return;
            }

            // Skip minified files — they use short variable names that cause false positives
            if (filepath.indexOf(".min.") !== -1) {
                return;
            }

            // Skip source map files
            if (filepath.indexOf(".map") !== -1) {
                return;
            }

            var content = grunt.file.read(filepath);
            var lines = content.split("\n");
            var fileErrors = [];
            filesChecked++;

            // Check each line (skip first 5 lines which are typically the banner/UMD wrapper)
            for (var lineNum = 0; lineNum < lines.length; lineNum++) {
                var line = lines[lineNum];

                // Skip comment-only lines
                var trimmed = line.trim();
                if (trimmed.indexOf("//") === 0 || trimmed.indexOf("*") === 0 || trimmed.indexOf("/*") === 0) {
                    continue;
                }

                // Skip lines that are entirely inside string assignments (heuristic: lines with version strings, URLs, etc.)
                // This is imperfect but reduces false positives significantly
                for (var p = 0; p < patterns.length; p++) {
                    if (patterns[p].pattern.test(line)) {
                        // Double-check: if the match is inside a string literal, skip it
                        // Simple heuristic: if the line has more quotes before the match than after, likely in a string
                        var match = line.match(patterns[p].pattern);
                        if (match) {
                            var matchIdx = match.index || 0;
                            var before = line.substring(0, matchIdx);
                            var singleQuotes = (before.match(/'/g) || []).length;
                            var doubleQuotes = (before.match(/"/g) || []).length;

                            // If odd number of unescaped quotes before match, likely inside a string — skip
                            if (singleQuotes % 2 === 1 || doubleQuotes % 2 === 1) {
                                continue;
                            }

                            fileErrors.push({
                                line: lineNum + 1,
                                pattern: patterns[p].name,
                                text: line.trim().substring(0, 120)
                            });
                        }
                    }
                }
            }

            if (fileErrors.length > 0) {
                errors.push({
                    file: filepath,
                    errors: fileErrors
                });
            }
        });

        grunt.log.ok("Checked " + filesChecked + " bundle file(s) for ES5 compatibility.");

        if (errors.length > 0) {
            errors.forEach(function (fileErr) {
                grunt.log.error("\n  " + fileErr.file + ":");
                fileErr.errors.forEach(function (err) {
                    grunt.log.error("    Line " + err.line + ": Found " + err.pattern);
                    grunt.log.error("      " + err.text);
                });
            });
            grunt.fail.warn("ES5 compatibility check failed: " + errors.length + " file(s) contain ES6+ syntax.");
            return false;
        }

        grunt.log.ok("All bundle files are ES5 compatible.");
        return true;
    });
};
