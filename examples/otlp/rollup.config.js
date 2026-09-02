const path = require("path");
const fs = require("fs");
const nodeResolve = require("@rollup/plugin-node-resolve").nodeResolve;
const commonjs = require("@rollup/plugin-commonjs");

const repoRoot = path.resolve(__dirname, "../..");

/**
 * The workspace packages that make up the SDK. The example is bundled straight from the built
 * `dist-es5` output of each package rather than from `node_modules`, so that it always exercises the
 * code currently in the repo (including the OTLP channel being tested).
 */
const workspacePackages = [
    "shared/AppInsightsCore",
    "shared/AppInsightsCommon",
    "extensions/applicationinsights-analytics-js",
    "extensions/applicationinsights-properties-js",
    "extensions/applicationinsights-dependencies-js",
    "extensions/applicationinsights-cfgsync-js",
    "channels/applicationinsights-channel-js",
    "channels/otlp-channel-js",
    "AISKU"
];

function buildPackageMap() {
    const map = {};
    workspacePackages.forEach((pkgDir) => {
        const pkgPath = path.join(repoRoot, pkgDir, "package.json");
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
        const entry = path.join(repoRoot, pkgDir, pkg.module);
        if (!fs.existsSync(entry)) {
            throw new Error("The '" + pkg.name + "' package has not been built, expected " + entry +
                ". Build the SDK before building this example.");
        }

        map[pkg.name] = entry;
    });

    return map;
}

const packageMap = buildPackageMap();

/**
 * Resolves the `@microsoft/applicationinsights-*` imports to the built workspace output.
 */
function workspaceResolver() {
    return {
        name: "workspace-resolver",
        resolveId(source) {
            return packageMap[source] || null;
        }
    };
}

module.exports = {
    input: "src/otlp-example.js",
    output: {
        file: "public/dist/otlp-example.js",
        format: "iife",
        name: "otlpExample",
        sourcemap: true
    },
    plugins: [
        workspaceResolver(),
        nodeResolve({ browser: true, preferBuiltins: false }),
        commonjs()
    ]
};
