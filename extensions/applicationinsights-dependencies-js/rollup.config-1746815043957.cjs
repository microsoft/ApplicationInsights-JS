'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var pluginNodeResolve = require('@rollup/plugin-node-resolve');
var commonjs = require('@rollup/plugin-commonjs');
var applicationinsightsRollupPluginUglify3Js = require('@microsoft/applicationinsights-rollup-plugin-uglify3-js');
var replace = require('@rollup/plugin-replace');
var cleanup = require('rollup-plugin-cleanup');
var sourcemaps = require('rollup-plugin-sourcemaps');
var dynamicRemove = require('@microsoft/dynamicproto-js/tools/rollup');
var applicationinsightsRollupEs5 = require('@microsoft/applicationinsights-rollup-es5');
var path = require('path');
var fs$1 = require('fs');
var MagicString = require('magic-string');

const rootVersion = require("./package.json").version;

const treeshakeCfg = {
    // preset: "smallest",
    moduleSideEffects: false,
    propertyReadSideEffects: false,
    tryCatchDeoptimization: false,
    correctVarValueBeforeDeclaration: false
};

function doCleanup() {
  return cleanup({
    comments: [
      'some', 
      /^.\s*@DynamicProtoStub/i,
      /^\*\*\s*@class\s*$/,
      /[#@]__/
    ]
  })
}

const getNamespace = (prefix, namespaces, baseName, rootName) => {
    var result = prefix + "var " + baseName + "=" + rootName;
    if (namespaces.length > 0) {
        for (let lp = 0; lp < namespaces.length; lp++) {
            if (lp === 0) {
                result += ", ";
            } else {
                result += ";\n" + prefix;
            }
            result += "nsKey=\"" + namespaces[lp] + "\", ";
            result += baseName + "=" + baseName + "[nsKey]=(" + baseName + "[nsKey]||{})";
        }
    }

    return result + ";\n";
};

const getCommonNamespace = (browserNs, gblNs) => {
    var brTokens = browserNs.split(".");
    var gblTokens = gblNs.split(".");
    let common = [];
    let idx = 0;
    while (brTokens.length > idx && gblTokens.length > idx && brTokens[idx] === gblTokens[idx]) {
        common.push(brTokens[idx]);
        idx++;
    }

    return {
        common: common,
        browser: brTokens.slice(idx),
        gbl: gblTokens.slice(idx)
    };
};

const getIntro = (format, theNameSpace, moduleName, theVersion, useStrict) => {
    let theIntro = "";
    if (format === "iife" || format === "umd") {
        let nsTokens = getCommonNamespace(theNameSpace.browser, theNameSpace.gbl);
        theIntro += "(function (global, factory) {\n";
        let prefix = "    ";
        theIntro += prefix + "var undef = \"undefined\";\n";
        if (format === "umd") {
            // UMD supports loading via requirejs and 
            theIntro += prefix + "typeof exports === \"object\" && typeof module !== undef ? factory(exports) :\n";
            theIntro += prefix + "typeof define === \"function\" && define.amd ? define([\"exports\"], factory) :\n";
            theIntro += prefix + "(function(global){\n";
            prefix += "    ";
        }
        // Both IIFE and UMD
        theIntro += prefix + "var nsKey, key, nm, theExports = {}, modName = \"" + moduleName.replace(/[\."\\\/\-]/g, "_") + "\", msMod=\"__ms$mod__\";\n";
        theIntro += prefix + "var mods={}, modDetail=mods[modName]={}, ver=\"" + theVersion + "\";\n";
        let baseNs = "global";
        if (nsTokens.common.length > 0) {
            theIntro += getNamespace(prefix, nsTokens.common, "baseNs", baseNs);
            baseNs = "baseNs";
        }
        theIntro += prefix + "// Versioned namespace \"" + theNameSpace.browser + "\"\n";
        theIntro += getNamespace(prefix, nsTokens.browser, "exportNs", baseNs);
        theIntro += prefix + "// Global namespace \"" + theNameSpace.gbl + "\"\n";
        theIntro += getNamespace(prefix, nsTokens.gbl, "destNs", baseNs);
        theIntro += prefix + "var expNsDetail=(exportNs[msMod]=(exportNs[msMod] || {})), expNameVer=(expNsDetail[\"v\"]=(expNsDetail[\"v\"] || []));\n";
        theIntro += prefix + "var destNsDetail=(destNs[msMod]=(destNs[msMod] || {})), destNameVer=(destNsDetail[\"v\"]=(destNsDetail[\"v\"] || []));\n";
        theIntro += prefix + "(destNsDetail[\"o\"]=(destNsDetail[\"o\"] || [])).push(mods);\n";
        theIntro += prefix + "factory(theExports);\n";
        theIntro += prefix + "for(var key in theExports) {\n";
        theIntro += prefix + "    // Always set the imported value into the \"export\" versioned namespace (last-write wins)\n";
        theIntro += prefix + "    nm=\"x\", exportNs[key]=theExports[key], expNameVer[key]=ver;\n";
        theIntro += prefix + "    // Copy over any named element that is not already present (first-write wins)\n";
        theIntro += prefix + "    typeof destNs[key]===undef ? (nm=\"n\", destNs[key]=theExports[key]) && (destNameVer[key]=ver) : !destNameVer[key] && (destNameVer[key]=\"---\");\n";
        theIntro += prefix + "    (modDetail[nm] = (modDetail[nm] || [])).push(key);\n";
        theIntro += prefix + "}\n";
        
        if (format === "umd") {
            theIntro += "    })(typeof globalThis !== undef ? globalThis : global || self);\n";
        }

        theIntro += "})(this, (function (exports) {\n";
    }

    if (useStrict) {
        theIntro += "'use strict';\n";
    }

    console.log("Intro: [" + theIntro + "]");

    return theIntro;
};

const getOutro = (format, theNameSpace, moduleName, version) => {
    let theOutro = "";
    if (format === "umd" || format === "iife") {
        theOutro = "}));\n";
    }

    return theOutro;
};

let rNodeModule = /(.*[\\\/]node_modules[\\\/])((@\w+[\\\/]){0,1}([^\\\/]+))(.*)$/;
let tLocalPackage = /^((\.\.\/)+)(\w+\/\w+)(\/.*\.ts)$/;
let packageVerCache = { };

function getPackageVer(source) {
    let grps = rNodeModule.exec(source);
    if (grps && grps.length > 5) {
        if (!packageVerCache[grps[2]]) {
            let pkg = fs$1.readFileSync(grps[1] + grps[2] + "/package.json");
            if (pkg) {
                let ver = JSON.parse(pkg).version;

                packageVerCache[grps[2]] = {
                    name: grps[2],
                    ver: ver,
                    src: source,
                    path: grps[5]
                };
            }
        }

        return packageVerCache[grps[2]];
    }

    return null;
}

function getLocalPackageVer(source, absPath) {
    let grps = tLocalPackage.exec(source);
    if (grps && grps.length > 4) {
        if (!packageVerCache["local:" + grps[3]]) {
            let idx = absPath.indexOf(grps[3] + "/");
            if (idx != -1) {
                let basePath = absPath.substring(0, idx + grps[3].length);
                let pkg = fs$1.readFileSync(basePath + "/package.json");
                if (pkg) {
                    let ver = JSON.parse(pkg).version;

                    packageVerCache["local:" + grps[3]] = {
                        name: grps[3],
                        ver: ver,
                        src: source,
                        path: grps[4]
                    };
                }
            }
        }

        return packageVerCache["local:" + grps[3]];
    }

    return null;
}

const NODE_MODULES_SRC = {
    //"@nevware21/ts-async": "https://raw.githubusercontent.com/nevware21/ts-async/refs/tags/{version}{path}",
    "@microsoft/dynamicproto-js": "https://raw.githubusercontent.com/microsoft/dynamicproto-js/refs/tags/{version}/lib{path}",
    "tools/shims": "https://raw.githubusercontent.com/microsoft/ApplicationInsights-JS/refs/tags/{rootVersion}/tools/shims{path}"
};

/**
 * Creates a source map path transformer function.
 * 
 * @param distPath - The distribution path to be used in the transformation.
 * @param theNameSpace - The namespace for the source map paths.
 * @param isDebug - If true, enables debug logging for the transformation process.
 * @returns A function that transforms source map paths.
 */
function getSourceMapPathTransformer(distPath, theNameSpace, isDebug) {
    let rDistPath = /(.*[\\\/](dist|browser)(.es\d)?)([\\\/].*)$/;

    let lastIdx = (theNameSpace.replace(/\\/g, "/")).lastIndexOf("/");
    if (lastIdx != -1 && lastIdx !== theNameSpace.length - 1) {
        // Strip off any leading path separators (snippet)
        theNameSpace = theNameSpace.substring(0, lastIdx);
    }

    return (sourcePath) => {
        let normalizedPath = sourcePath.replace(/\\/g, "/");
        if (isDebug) {
            console.log(`NormalizedPath: ${normalizedPath}, distPath: ${distPath}, ns: ${theNameSpace}, dirname: ${__dirname}`);
        }

        // The resolved path that we will return as the "node" path
        let resolvedPath = null;

        let httpIdx = normalizedPath.indexOf("https:/");
        if (httpIdx != -1) {
            // Just reuse any https:// path as-is
            resolvedPath = "https://" + normalizedPath.substring(httpIdx + 7);
        }

        // const absoluteSourcePath = resolve(distPath, sourcePath).replace(/\\/g, "/");
        const absPath = path.resolve(distPath, normalizedPath).replace(/\\/g, "/");
        if (!resolvedPath) {
            if (isDebug) {
                console.log(` -- Absolute: ${absPath}`);
            }

            let idx = absPath.indexOf("node_modules");
            if (idx != -1) {
                if (isDebug) {
                    console.log(` -- NodeModule: ${absPath}`);
                }

                let ver = getPackageVer(absPath);
                if (ver) {
                    if (isDebug) {
                        console.log(` -- PackageVer: ${ver.name}@${ver.ver}`);
                    }

                    let src = NODE_MODULES_SRC[ver.name];
                    if (src) {
                        resolvedPath = src.replace("{rootVersion}", rootVersion).replace("{version}", ver.ver).replace("{path}", ver.path);
                    }

                    if (!resolvedPath) {
                        resolvedPath = "node_modules/" + ver.name + "@" + ver.ver + ver.path;
                    }
                }
            }
        }

        if (!resolvedPath) {
            let localVer = getLocalPackageVer(normalizedPath, absPath);
            if (localVer) {
                let src = NODE_MODULES_SRC[localVer.name];
                if (src) {
                    resolvedPath = src.replace("{rootVersion}", rootVersion).replace("{version}", localVer.ver).replace("{path}", localVer.path);
                }
            }
        }

        if (!resolvedPath && normalizedPath.startsWith("../")) {
            // Just remove all leading relative path indicators
            resolvedPath = theNameSpace + normalizedPath.replace(/\.\.\//g, "/").replace(/\/\//g, "/");

        }

        if (!resolvedPath) {
            let distGrps = rDistPath.exec(absPath);
            if (distGrps && distGrps.length > 4) {
                resolvedPath = theNameSpace + distGrps[4];
            }
        }

        if (!resolvedPath) {
            resolvedPath = theNameSpace + "/" + absPath;
        }

        // Cleanup the path
        resolvedPath = resolvedPath.replace(/\.\.\//g, "oo/").replace(/([^:])\/\//g, "$1/");

        if (!resolvedPath) {
            // Just leave the original path as-is for now.
            resolvedPath = sourcePath;
        }

        if (isDebug) {
            console.log(` -- resolvedPath: ${resolvedPath}`);
        }
        
        return resolvedPath;
    };
}

const browserRollupConfigFactory = (isOneDs, banner, importCheckNames, targetType, theNameSpace, entryInputName, outputName, theVersion, libVersion, isProduction, format = 'umd', postfix = '', teamExt = '', useStrict = true, topLevel = false) => {
    var outPath = isOneDs ? "bundle" : "browser";
    var thePostfix = `${postfix}`;
    if (libVersion) {
        thePostfix = `${isOneDs ? "-" : "."}${libVersion}${postfix}`; 
    }

    var outputPath = `${outPath}/${targetType}/${outputName}${teamExt}${thePostfix}.js`;
    var prodOutputPath = `${outPath}/${targetType}/${outputName}${teamExt}${thePostfix}.min.js`;
    var inputPath = `${entryInputName}.js`;
    var rootNamespace = outputName + (theVersion ? ("@" + theVersion) : "");

    const browserRollupConfig = {
        input: inputPath,
        output: {
            file: outputPath,
            banner: banner,
            format: "cjs",
            name: theNameSpace.browser,
            extend: true,
            freeze: false,
            sourcemap: true,
            sourcemapPathTransform: getSourceMapPathTransformer(`${outPath}/${targetType}`, rootNamespace),
            strict: false,
            intro: getIntro(format, theNameSpace, theNameSpace.ver ? `${targetType}.${outputName}${teamExt}-${theNameSpace.ver}` : "", theNameSpace.ver, useStrict),
            outro: getOutro(format, theNameSpace, theNameSpace.ver ? `${targetType}.${outputName}${teamExt}-${theNameSpace.ver}` : "", theNameSpace.ver)
        },
        treeshake: treeshakeCfg,
        plugins: [
            sourcemaps(),
            dynamicRemove(),
            replace({
                preventAssignment: true
            }),
            applicationinsightsRollupEs5.importCheck({ exclude: importCheckNames }),
            pluginNodeResolve.nodeResolve({
                module: true,
                browser: true,
                preferBuiltins: false
            }),
            commonjs(),
            doCleanup(),
            applicationinsightsRollupEs5.es5Poly(),
            applicationinsightsRollupEs5.es5Check()
        ]
    };

    if (isProduction) {
        browserRollupConfig.output.file = prodOutputPath;
        browserRollupConfig.plugins.push(
            applicationinsightsRollupPluginUglify3Js.uglify({
                ie8: false,
                ie: true,
                toplevel: topLevel,
                compress: {
                    ie: true,
                    passes:3,
                    unsafe: true
                },
                output: {
                    ie: true,
                    preamble: banner,
                    webkit:true
                }
            })
        );
    }

    // console.log(`Browser: ${JSON.stringify(browserRollupConfig)}`);

    return browserRollupConfig;
};

const nodeUmdRollupConfigFactory = (banner, importCheckNames, targetType, theNameSpace, theVersion, entryInputName, outputName, isProduction, topLevel = false) => {

    // console.log(`Node: ${targetType}, ${entryInputName}`);
    var outputPath = `dist/${targetType}/${outputName}.js`;
    var prodOutputPath = `dist/${targetType}/${outputName}.min.js`;
    var inputPath = `${entryInputName}.js`;
    var rootNamespace = outputName + "@" + theVersion;

    const nodeRollupConfig = {
        input: inputPath,
        output: {
            file: outputPath,
            banner: banner,
            format: "umd",
            name: theNameSpace,
            extend: true,
            freeze: false,
            sourcemap: true,
            sourcemapPathTransform: getSourceMapPathTransformer(`dist/${targetType}`, rootNamespace),
        },
        treeshake: treeshakeCfg,
        plugins: [
            sourcemaps(),
            dynamicRemove(),
            replace({
                preventAssignment: true
            }),
            applicationinsightsRollupEs5.importCheck({ exclude: importCheckNames }),
            pluginNodeResolve.nodeResolve(),
            doCleanup(),
            applicationinsightsRollupEs5.es5Poly(),
            applicationinsightsRollupEs5.es5Check()
        ]
    };

    if (isProduction) {
        nodeRollupConfig.output.file = prodOutputPath;
        nodeRollupConfig.plugins.push(
            applicationinsightsRollupPluginUglify3Js.uglify({
                ie8: false,
                ie: true,
                toplevel: topLevel,
                compress: {
                    ie: true,
                    passes:3,
                    unsafe: true
                },
                output: {
                    ie: true,
                    preamble: banner,
                    webkit:true
                }
            })
        );
    }

    return nodeRollupConfig;
};

function createConfig(banner, cfg, importCheckNames, isOneDs) {
    const majorVersion = isOneDs ? "" : cfg.version.split('.')[0];
    const targetType = "es5";
    
    var tasks = [ ];

    if (cfg.node) {
        let inputPath = cfg.node.inputPath || `dist-${targetType}`;
        let entryPoint = `${inputPath}/${cfg.node.entryPoint}`;

        tasks.push(
            nodeUmdRollupConfigFactory(banner, importCheckNames, targetType, cfg.namespace, cfg.version, entryPoint, cfg.node.outputName, true),
            nodeUmdRollupConfigFactory(banner, importCheckNames, targetType, cfg.namespace, cfg.version, entryPoint, cfg.node.outputName, false)
        );
    }

    let browserFormats = cfg.browser.formats || 
        isOneDs ? [ 
            { format: 'umd', postfix: '' },
            { format: 'iife', postfix: '.gbl' }
        ] :
        [
            { format: 'umd', postfix: '' },
            { format: 'cjs', postfix: '.cjs' },
            { format: 'iife', postfix: '.gbl' }
        ];

    if (cfg.teams) {
        for (let lp = 0; lp < cfg.teams.length; lp++) {
            let teamCfg = cfg.teams[lp];
            if (teamCfg.teamExt) {
                browserFormats.push({
                    teamExt: teamCfg.teamExt,
                    namespace: teamCfg.namespace || cfg.namespace,
                    namespaceGbl: teamCfg.namespaceGbl || teamCfg.namespace || cfg.namespace,
                    format: teamCfg.fmt || 'iife',
                    postfix: teamCfg.ext || '.gbl'
                });
            }
        }
    }

    for (let lp = 0; lp < browserFormats.length; lp++) {
        let browserCfg = browserFormats[lp];
        let browserNamespace = browserCfg.namespace || cfg.namespace;
        if (typeof browserNamespace === "string") {
            browserNamespace = {
                browser: browserCfg.namespace || cfg.namespace,
                gbl: browserCfg.namespaceGbl || cfg.namespace
            };
        }

        let browserFmt = browserCfg.format || 'umd';
        let browserPostfix = browserCfg.postfix || '';
        let browserTeam = browserCfg.teamExt || '';
        let useStrict = browserCfg.useStrict === undefined ? true : browserCfg.useStrict;
        let topLevel = !!browserCfg.topLevel;

        if (cfg.version) {
            var version = cfg.version.split(".");
            var majorVer = version[0].trim();
            if (majorVer && !browserNamespace.browser.endsWith(majorVer)) {
                browserNamespace.browser += majorVer;
            }
            browserNamespace.ver = cfg.version;

        }

        let inputPath = cfg.browser.inputPath || `dist-${targetType}`;
        let entryPoint = `${inputPath}/${cfg.browser.entryPoint}`;

        tasks.push(
            browserRollupConfigFactory(isOneDs, banner, importCheckNames, targetType, browserNamespace, entryPoint, cfg.browser.outputName, cfg.version, majorVersion, true, browserFmt, browserPostfix, browserTeam, useStrict, topLevel),
            browserRollupConfigFactory(isOneDs, banner, importCheckNames, targetType, browserNamespace, entryPoint, cfg.browser.outputName, cfg.version, majorVersion, false, browserFmt, browserPostfix, browserTeam, useStrict, topLevel),
            browserRollupConfigFactory(isOneDs, banner, importCheckNames, targetType, browserNamespace, entryPoint, cfg.browser.outputName, cfg.version, cfg.version, true, browserFmt, browserPostfix, browserTeam, useStrict, topLevel),
            browserRollupConfigFactory(isOneDs, banner, importCheckNames, targetType, browserNamespace, entryPoint, cfg.browser.outputName, cfg.version, cfg.version, false, browserFmt, browserPostfix, browserTeam, useStrict, topLevel)
        );
    }

    return tasks;
}

function createUnVersionedConfig(banner, cfg, importCheckName, isOneDs) {
    const noVersion = "";
    const targetType = "es5";

    let tasks = [ ];

    if (cfg.node) {
        let inputPath = cfg.node.inputPath || `dist-${targetType}`;
        let entryPoint = `${inputPath}/${cfg.node.entryPoint}`;

        tasks.push(
            nodeUmdRollupConfigFactory(banner, importCheckName, targetType, cfg.namespace, cfg.version, entryPoint, cfg.node.outputName, true),
            nodeUmdRollupConfigFactory(banner, importCheckName, targetType, cfg.namespace, cfg.version, entryPoint, cfg.node.outputName, false)
        );
    }

    let browserFormats = cfg.browser.formats || [ 
        { format: 'umd', postfix: '' },
        { format: 'cjs', postfix: '.cjs' },
        { format: 'iife', postfix: '.gbl' }
    ];

    if (cfg.teams) {
        for (let lp = 0; lp < cfg.teams.length; lp++) {
            let teamCfg = cfg.teams[lp];
            if (teamCfg.teamExt) {
                browserFormats.push({
                    teamExt: teamCfg.teamExt,
                    namespace: teamCfg.namespace || cfg.namespace,
                    namespaceGbl: teamCfg.namespaceGbl || teamCfg.namespace || cfg.namespace,
                    format: teamCfg.fmt || 'iife',
                    postfix: teamCfg.ext || '.gbl'
                });
            }
        }
    }

    for (let lp = 0; lp < browserFormats.length; lp++) {
        let browserCfg = browserFormats[lp];
        let browserNamespace = browserCfg.namespace || cfg.namespace;
        if (typeof browserNamespace === "string") {
            browserNamespace = {
                browser: browserCfg.namespace || cfg.namespace,
                gbl: browserCfg.namespaceGbl || cfg.namespace
            };
        }
        let browserFmt = browserCfg.format || 'umd';
        let browserPostfix = browserCfg.postfix || '';
        let browserTeam = browserCfg.teamExt || '';
        let useStrict = browserCfg.useStrict === undefined ? true : browserCfg.useStrict;
        let topLevel = !!browserCfg.topLevel;

        if (cfg.version) {
            var version = cfg.version.split(".");
            var majorVer = version[0].trim();
            if (majorVer && !browserNamespace.browser.endsWith(majorVer)) {
                browserNamespace.browser += majorVer;
            }
            browserNamespace.ver = cfg.version;
        }

        let inputPath = cfg.browser.inputPath || `dist-${targetType}`;
        let entryPoint = `${inputPath}/${cfg.browser.entryPoint}`;

        tasks.push(
            browserRollupConfigFactory(isOneDs, banner, importCheckName, targetType, browserNamespace, entryPoint, cfg.browser.outputName, cfg.version, noVersion, true, browserFmt, browserPostfix, browserTeam, useStrict, topLevel),
            browserRollupConfigFactory(isOneDs, banner, importCheckName, targetType, browserNamespace, entryPoint, cfg.browser.outputName, cfg.version, noVersion, false, browserFmt, browserPostfix, browserTeam, useStrict, topLevel)
        );
    }

    return tasks;
}

const fs = require("fs");
const globby = require("globby");

// Remap tslib functions to shim v2.0.0 functions
const remapTsLibFuncs = {
    __extends: "__extendsFn",
    __assign: "__assignFn",
    __rest: "__restFn",
    __spreadArray: "__spreadArrayFn",
    __spreadArrays: "__spreadArraysFn",
    __decorate: "__decorateFn",
    __param: "__paramFn",
    __metadata: "__metadataFn",
    __values: "__valuesFn",
    __read: "__readFn",
    __createBinding: "__createBindingFn",
    __importDefault: "__importDefaultFn",
    __importStar: "__importStarFn",
    __exportStar: "__exportStarFn",
    __makeTemplateObject: "__makeTemplateObjectFn"
};

// You can use the following site to validate the resulting map file is valid
// http://sokra.github.io/source-map-visualization/#custom

// Function to remove the @DynamicProtoStubs and rewrite the headers for the dist-es5 files
const getLines = (theValue) => {
    var value = "" + theValue;
    var lines = [];
    var idx = 0;
    var startIdx = 0;
    while (idx < value.length) {
        // Skip blank lines
        while (
            idx < value.length &&
            (value[idx] === "\n" || value[idx] === "\r")
        ) {
            idx++;
        }

        startIdx = idx;
        while (
            idx < value.length &&
            !(value[idx] === "\n" || value[idx] === "\r")
        ) {
            idx++;
        }

        var len = idx - startIdx;
        if (len > 0) {
            var line = value.substring(startIdx, idx);
            if (line.trim() !== "") {
                lines.push({
                    value: line,
                    idx: startIdx,
                    len: len
                });
            }
        }
    }

    return lines;
};

function replaceTsLibImports(orgSrc, src, theString) {
    // replace tslib import usage with "import { xxx, xxx } from "tslib";
    const detectTsLibUsage = /import[\s]*\{([^}]*)\}[\s]*from[\s]*\"tslib\";/g;
    let matches = detectTsLibUsage.exec(orgSrc);
    while (matches != null) {
        let newImports = [];
        let imports = matches[1];
        let tokens = imports.trim().split(",");
        tokens.forEach((token) => {
            let theToken = token.trim();
            let remapKey = remapTsLibFuncs[theToken];
            if (!remapKey) {
                throw (
                    'Unsupported tslib function "' +
                    theToken +
                    '" detected from -- ' +
                    matches[0] +
                    ""
                );
            }

            newImports.push(remapKey + " as " + theToken);
        });

        let newImport =
            "import { " +
            newImports.join(", ") +
            ' } from "@microsoft/applicationinsights-shims";';
        var idx = orgSrc.indexOf(matches[0]);
        if (idx !== -1) {
            console.log(`Replacing [${matches[0]}] with [${newImport}]`);
            theString.overwrite(idx, idx + matches[0].length, newImport);
            src = src.replace(matches[0], newImport);
        }

        // Find next
        matches = detectTsLibUsage.exec(orgSrc);
    }

    return src;
}

function replaceTsLibStarImports(orgSrc, src, theString) {
    // replace tslib import usage with "import { xxx, xxx } from "tslib";
    const detectTsLibUsage =
        /import[\s]*\*[\s]*as[\s]*([^\s]*)[\s]*from[\s]*\"tslib\";/g;
    let matches = detectTsLibUsage.exec(orgSrc);
    while (matches != null) {
        let newImports = [];
        let importPrefix = matches[1].trim();

        let importLen = importPrefix.length + 1;
        let idx = orgSrc.indexOf(importPrefix + ".");
        while (idx !== -1) {
            let funcEnd = orgSrc.indexOf("(", idx + importLen);
            if (funcEnd !== -1) {
                let funcName = orgSrc.substring(idx + importLen, funcEnd);
                let newImport = remapTsLibFuncs[funcName];
                if (!newImport) {
                    throw (
                        'Unsupported tslib function "' +
                        orgSrc.substring(idx, funcEnd) +
                        '" detected from -- ' +
                        matches[0]
                    );
                }

                // Add new import, if not already present
                if (newImports.indexOf(newImport) == -1) {
                    newImports.push(newImport);
                }

                let matchedValue = orgSrc.substring(idx, funcEnd + 1);
                let newValue = newImport + "(";
                console.log(
                    `Replacing Usage [${matchedValue}] with [${newValue}]`
                );
                theString.overwrite(idx, idx + matchedValue.length, newValue);

                // replace in the new source output as well
                src = src.replace(matchedValue, newValue);
            }

            // Find next usage
            idx = orgSrc.indexOf(importPrefix + ".", idx + importLen);
        }

        let newImport =
            "import { " +
            newImports.join(", ") +
            ' } from "@microsoft/applicationinsights-shims";';
        idx = orgSrc.indexOf(matches[0]);
        console.log(`Replacing [${matches[0]}] with [${newImport}]`);
        theString.overwrite(idx, idx + matches[0].length, newImport);
        src = src.replace(matches[0], newImport);

        // Find next
        matches = detectTsLibUsage.exec(orgSrc);
    }

    return src;
}

function removeDynamicProtoStubs(orgSrc, src, theString, inputFile) {
    const dynRemove = dynamicRemove();
    var result = dynRemove.transform(orgSrc, inputFile);
    if (result !== null && result.code) {
        src = result.code;
        console.log("Prototypes removed...");

        // Figure out removed lines
        var orgLines = getLines(orgSrc);
        var newLines = getLines(result.code);
        var line = 0;
        var newLine = 0;
        while (line < orgLines.length) {
            var matchLine = orgLines[line];
            var matchNewLine = newLines[newLine];
            var replaceText = "";
            line++;
            if (matchLine.value === matchNewLine.value) {
                newLine++;
            } else {
                console.log("Line Changed: " + matchLine.value);
                var endFound = false;
                var endLine = 0;
                // Skip over removed lines (There may be more than 1 function being removed)
                for (
                    var nextLp = 0;
                    endFound === false && newLine + nextLp < newLines.length;
                    nextLp++
                ) {
                    if (newLine + nextLp < newLines.length) {
                        for (var lp = 0; line + lp < orgLines.length; lp++) {
                            if (
                                orgLines[line + lp].value ===
                                newLines[newLine + nextLp].value
                            ) {
                                endFound = true;
                                for (var i = 0; i < nextLp; i++) {
                                    if (replaceText.length) {
                                        replaceText += "\n";
                                    }
                                    replaceText += newLines[newLine + i].value;
                                }
                                endLine = line + lp;
                                newLine = newLine + nextLp;
                                break;
                            }
                        }
                    }
                }

                if (endFound) {
                    console.log(
                        "Detected Removed lines " + line + " to " + endLine
                    );
                    theString.overwrite(
                        matchLine.idx,
                        orgLines[endLine - 1].idx + orgLines[endLine - 1].len,
                        replaceText
                    );
                    line = endLine;
                } else {
                    throw "Missing line - " + matchLine.value;
                }
            }
        }
    }

    return src;
}

function fixIEDynamicProtoUsage(orgSrc, src, theString) {
    // find all "dynamicProto(<classname>," usages
    // Then find all "class <classname> " usages and append a static variable after the name

    const dynamicProtoUsage = /dynamicProto\s*\(\s*(\w*)\s*,/g;
    let matches = dynamicProtoUsage.exec(orgSrc);
    while (matches != null) {
        let className = matches[1].trim();

        let hasProperty = new RegExp("^\\s*" + className + "\\.\\w+\\s*", "gm");
        let hasPropertyMatches = hasProperty.exec(src);
        if (!hasPropertyMatches) {

            if (orgSrc.indexOf(" return " + className + ";") === -1) {
                throw "return " + className + "; -- doesn't exist!!! -- " + orgSrc;
            }
    
            let classRegEx = new RegExp("^\\s*return\\s+" + className + ";", "gm");
            let classMatches = classRegEx.exec(orgSrc);
            if (!classMatches) {
                throw ('Unable to locate class definition for "' + className + '" using ' + classRegEx + ' detected from -- ' + matches[0] + ' -- ' + classMatches + " in \n" + orgSrc);
            }
    
            let newClass = 
                "\n    // This is a workaround for an IE bug when using dynamicProto() with classes that don't have any" + 
                "\n    // non-dynamic functions or static properties/functions when using uglify-js to minify the resulting code." +
                "\n    " + className + ".__ieDyn=1;" + 
                "\n" + classMatches[0];
    
            var idx = orgSrc.indexOf(classMatches[0]);
            if (idx !== -1) {
                console.log(`Replacing [${classMatches[0]}] with [${newClass}]`);
                theString.overwrite(idx, idx + classMatches[0].length, newClass);
                src = src.replace(classMatches[0], newClass);
            }

        } else {
            console.log("dynamicProto class has property or function -- " + hasProperty + " found " + hasPropertyMatches[0]);
        }

        // Find next
        matches = dynamicProtoUsage.exec(orgSrc);
    }

    return src;
}

const updateDistEsmFiles = (
    replaceValues,
    banner,
    replaceTsLib = true,
    removeDynamic = true,
    buildPath = "dist-es5"
) => {
    console.log(`UpdateDistEsmFiles: ./${buildPath}/**/*.js`);
    if (!fs.existsSync(`./${buildPath}`)) {
        console.error(`Build path does not exist ./${buildPath} - from:${process.cwd()}`);
        process.exit(10);
    }

    const files = globby.sync(`./${buildPath}/**/*.js`);
    files.map((inputFile) => {
        console.log("Loading - " + inputFile);
        var src = fs.readFileSync(inputFile, "utf8");
        var mapFile;
        if (inputFile.endsWith(".js")) {
            mapFile = inputFile + ".map";
        }

        var orgSrc = src;
        var theString = new MagicString(orgSrc);

        if (removeDynamic) {
            src = removeDynamicProtoStubs(orgSrc, src, theString, inputFile);
        }

        if (replaceTsLib) {
            // replace any tslib imports with the shims module versions
            src = replaceTsLibImports(orgSrc, src, theString);
            src = replaceTsLibStarImports(orgSrc, src, theString);
        }

        src = fixIEDynamicProtoUsage(orgSrc, src, theString);

        // Replace the header
        Object.keys(replaceValues).forEach((value) => {
            src = src.replace(value, replaceValues[value]);
            var idx = orgSrc.indexOf(value);
            if (idx !== -1) {
                theString.overwrite(
                    idx,
                    idx + value.length,
                    replaceValues[value]
                );
            }
        });

        // Rewrite the file

        // Remove any force banner from the file
        let replaceBanner = banner.replace("/*!", "/*");
        theString.prepend(replaceBanner + "\n");
        src = replaceBanner + "\n" + src;

        src = src.trim();
        if (orgSrc !== src) {
            fs.writeFileSync(inputFile, src);
            if (mapFile) {
                var newMap = theString.generateMap({
                    source: inputFile.toString(),
                    file: mapFile,
                    includeContent: true,
                    hires: false
                });

                console.log("Rewriting Map file - " + mapFile);
                fs.writeFileSync(mapFile, newMap.toString());
            }
        }
    });
};

const version = require("./package.json").version;
const outputName = "applicationinsights-dependencies-js";

const banner = [
  "/*!",
  ` * Application Insights JavaScript SDK - Dependencies Plugin, ${version}`,
  " * Copyright (c) Microsoft and contributors. All rights reserved.",
  " */"
].join("\n");

const replaceValues = {
  "// Copyright (c) Microsoft Corporation. All rights reserved.": "",
  "// Licensed under the MIT License.": ""
};

updateDistEsmFiles(replaceValues, banner, true, true, "dist-es5");

var rollup_config = createUnVersionedConfig(banner, 
  {
    namespace: "Microsoft.ApplicationInsights",
    version: version,
    node: {
      entryPoint: outputName, 
      outputName: outputName
    },
    browser: {
      entryPoint: outputName,
      outputName: outputName
    },
  },
  [ "applicationinsights-dependencies-js" ],
  false
);

exports.default = rollup_config;
