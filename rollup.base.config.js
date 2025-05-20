import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { uglify } from "@microsoft/applicationinsights-rollup-plugin-uglify3-js";
import replace from "@rollup/plugin-replace";
import cleanup from "rollup-plugin-cleanup";
import sourcemaps from 'rollup-plugin-sourcemaps';
import dynamicRemove from "@microsoft/dynamicproto-js/tools/rollup";
import { es5Poly, es5Check, importCheck } from "@microsoft/applicationinsights-rollup-es5";
import { resolve } from 'path';
import { readFileSync } from "fs";

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
}

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
}

let rNodeModule = /(.*[\\\/]node_modules[\\\/])((@\w+[\\\/]){0,1}([^\\\/]+))(.*)$/;
let tLocalPackage = /^((\.\.\/)+)(\w+\/\w+)(\/.*\.ts)$/;
let packageVerCache = { };

function getPackageVer(source) {
    let grps = rNodeModule.exec(source);
    if (grps && grps.length > 5) {
        if (!packageVerCache[grps[2]]) {
            let pkg = readFileSync(grps[1] + grps[2] + "/package.json");
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
                let pkg = readFileSync(basePath + "/package.json");
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
    "@nevware21/ts-async": "https://raw.githubusercontent.com/nevware21/ts-async/refs/tags/{version}/src{path}",
    "@nevware21/ts-utils": "https://raw.githubusercontent.com/nevware21/ts-utils/refs/tags/{version}/src{path}",
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
        const absPath = resolve(distPath, normalizedPath).replace(/\\/g, "/");
        if (!resolvedPath) {
            if (isDebug) {
                console.log(` -- Absolute: ${absPath}`);
            }

            // Special handling for @nevware21 packages that may be referenced in sourcemaps
            if (normalizedPath.indexOf("@nevware21/") !== -1 && (normalizedPath.indexOf("build/es5/") !== -1 || normalizedPath.indexOf("/mod/") !== -1)) {
                const packageName = normalizedPath.match(/@nevware21\/([^\/]+)/)?.[0];
                if (packageName && NODE_MODULES_SRC[packageName]) {
                    // Extract version from path or use latest if not found
                    const version = packageName === "@nevware21/ts-async" ? "0.4.0" : "0.11.3"; // Default versions if not found
                    const srcPath = normalizedPath
                        .replace(/.*@nevware21\/[^\/]+\/build\/es5\/mod\//, "/src/")
                        .replace(/.*@nevware21\/[^\/]+\/build\/es5\//, "/src/")
                        .replace(/\.js$/, ".ts");
                    
                    resolvedPath = NODE_MODULES_SRC[packageName].replace("{version}", version).replace("{path}", srcPath);
                    if (isDebug) {
                        console.log(` -- Resolved @nevware21 path: ${resolvedPath}`);
                    }
                }
            }

            if (!resolvedPath) {
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
                        // For @nevware21 packages, adjust the path to handle build/es5 references
                        if (ver.name.indexOf("@nevware21/") === 0 && ver.path.indexOf("/build/es5/") !== -1) {
                            // Replace build/es5 path with appropriate source path for sourcemap references
                            let newPath = ver.path.replace("/build/es5/mod/", "/src/");
                            resolvedPath = src.replace("{rootVersion}", rootVersion).replace("{version}", ver.ver).replace("{path}", newPath);
                        } else {
                            resolvedPath = src.replace("{rootVersion}", rootVersion).replace("{version}", ver.ver).replace("{path}", ver.path);
                        }
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
            importCheck({ exclude: importCheckNames }),
            nodeResolve({
                module: true,
                browser: true,
                preferBuiltins: false
            }),
            commonjs(),
            doCleanup(),
            es5Poly(),
            es5Check()
        ]
    };

    if (isProduction) {
        browserRollupConfig.output.file = prodOutputPath;
        browserRollupConfig.plugins.push(
            uglify({
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
            importCheck({ exclude: importCheckNames }),
            nodeResolve(),
            doCleanup(),
            es5Poly(),
            es5Check()
        ]
    };

    if (isProduction) {
        nodeRollupConfig.output.file = prodOutputPath;
        nodeRollupConfig.plugins.push(
            uglify({
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

export function createConfig(banner, cfg, importCheckNames, isOneDs) {
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

export function createUnVersionedConfig(banner, cfg, importCheckName, isOneDs) {
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