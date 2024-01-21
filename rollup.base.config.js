import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { uglify } from "@microsoft/applicationinsights-rollup-plugin-uglify3-js";
import replace from "@rollup/plugin-replace";
import cleanup from "rollup-plugin-cleanup";
import dynamicRemove from "@microsoft/dynamicproto-js/tools/rollup";
import { es5Poly, es5Check, importCheck } from "@microsoft/applicationinsights-rollup-es5";

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

const browserRollupConfigFactory = (isOneDs, banner, importCheckNames, targetType, theNameSpace, entryInputName, outputName, libVersion, isProduction, format = 'umd', postfix = '', teamExt = '', useStrict = true, topLevel = false) => {
    var outPath = isOneDs ? "bundle" : "browser";
    var thePostfix = `${postfix}`;
    if (libVersion) {
        thePostfix = `${isOneDs ? "-" : "."}${libVersion}${postfix}`; 
    }

    var outputPath = `${outPath}/${targetType}/${outputName}${teamExt}${thePostfix}.js`;
    var prodOutputPath = `${outPath}/${targetType}/${outputName}${teamExt}${thePostfix}.min.js`;
    var inputPath = `${entryInputName}.js`;

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
            strict: false,
            intro: getIntro(format, theNameSpace, theNameSpace.ver ? `${targetType}.${outputName}${teamExt}-${theNameSpace.ver}` : "", theNameSpace.ver, useStrict),
            outro: getOutro(format, theNameSpace, theNameSpace.ver ? `${targetType}.${outputName}${teamExt}-${theNameSpace.ver}` : "", theNameSpace.ver)
        },
        treeshake: treeshakeCfg,
        plugins: [
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

const nodeUmdRollupConfigFactory = (banner, importCheckNames, targetType, theNameSpace, entryInputName, outputName, isProduction, topLevel = false) => {

    // console.log(`Node: ${targetType}, ${entryInputName}`);
    var outputPath = `dist/${targetType}/${outputName}.js`;
    var prodOutputPath = `dist/${targetType}/${outputName}.min.js`;
    var inputPath = `${entryInputName}.js`;

    const nodeRollupConfig = {
        input: inputPath,
        output: {
            file: outputPath,
            banner: banner,
            format: "umd",
            name: theNameSpace,
            extend: true,
            freeze: false,
            sourcemap: true
        },
        treeshake: treeshakeCfg,
        plugins: [
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
            nodeUmdRollupConfigFactory(banner, importCheckNames, targetType, cfg.namespace, entryPoint, cfg.node.outputName, true),
            nodeUmdRollupConfigFactory(banner, importCheckNames, targetType, cfg.namespace, entryPoint, cfg.node.outputName, false)
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
            browserRollupConfigFactory(isOneDs, banner, importCheckNames, targetType, browserNamespace, entryPoint, cfg.browser.outputName, majorVersion, true, browserFmt, browserPostfix, browserTeam, useStrict, topLevel),
            browserRollupConfigFactory(isOneDs, banner, importCheckNames, targetType, browserNamespace, entryPoint, cfg.browser.outputName, majorVersion, false, browserFmt, browserPostfix, browserTeam, useStrict, topLevel),
            browserRollupConfigFactory(isOneDs, banner, importCheckNames, targetType, browserNamespace, entryPoint, cfg.browser.outputName, cfg.version, true, browserFmt, browserPostfix, browserTeam, useStrict, topLevel),
            browserRollupConfigFactory(isOneDs, banner, importCheckNames, targetType, browserNamespace, entryPoint, cfg.browser.outputName, cfg.version, false, browserFmt, browserPostfix, browserTeam, useStrict, topLevel)
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
            nodeUmdRollupConfigFactory(banner, importCheckName, targetType, cfg.namespace, entryPoint, cfg.node.outputName, true),
            nodeUmdRollupConfigFactory(banner, importCheckName, targetType, cfg.namespace, entryPoint, cfg.node.outputName, false)
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
            browserRollupConfigFactory(isOneDs, banner, importCheckName, targetType, browserNamespace, entryPoint, cfg.browser.outputName, noVersion, true, browserFmt, browserPostfix, browserTeam, useStrict, topLevel),
            browserRollupConfigFactory(isOneDs, banner, importCheckName, targetType, browserNamespace, entryPoint, cfg.browser.outputName, noVersion, false, browserFmt, browserPostfix, browserTeam, useStrict, topLevel)
        );
    }

    return tasks;
}