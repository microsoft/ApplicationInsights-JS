import { nodeResolve } from "@rollup/plugin-node-resolve";
import { uglify } from "@microsoft/applicationinsights-rollup-plugin-uglify3-js";
import replace from "@rollup/plugin-replace";
import cleanup from "rollup-plugin-cleanup";
import dynamicRemove from "@microsoft/dynamicproto-js/tools/rollup/node/removedynamic";
import { es3Poly, es3Check, importCheck } from "@microsoft/applicationinsights-rollup-es3";

const treeshakeCfg = {
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
      /^\*\*\s*@class\s*$/
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

const getIntro = (format, theNameSpace, moduleName, theVersion) => {
    let theIntro = "";
    if (format === "iife" || format === "umd") {
        let nsTokens = getCommonNamespace(theNameSpace.browser, theNameSpace.gbl);
        theIntro += "(function (global, factory) {\n";
        let prefix = "    ";
        if (format === "umd") {
            // UMD supports loading via requirejs and 
            theIntro += prefix + "var undef = \"undefined\";\n";
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
        theIntro += prefix + "    // Overwrite every elements in namespace and record (last-write wins)\n";
        theIntro += prefix + "    nm=\"n\", destNs[key]=theExports[key],  destNameVer[key]=ver;\n";
        theIntro += prefix + "    (modDetail[nm] = (modDetail[nm] || [])).push(key);\n";
        theIntro += prefix + "}\n";
        
        if (format === "umd") {
            theIntro += "    })(typeof globalThis !== undef ? globalThis : global || self);\n";
        }

        theIntro += "})(this, (function (exports) {\n";
    }

    theIntro += "'use strict';\n";

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

const browserRollupConfigFactory = (banner, importCheckNames, targetType, theNameSpace, entryInputName, outputName, libVersion, isProduction, format = 'umd', postfix = '', teamExt = '', replaceValues, treeshakeConfig) => {

    var thePostfix = `${postfix}`;
    if (libVersion) {
        thePostfix = `.${libVersion}${postfix}`;
    }

    var outputPath = `browser/${outputName}${teamExt}${thePostfix}.js`;
    var prodOutputPath = `browser/${outputName}${teamExt}${thePostfix}.min.js`;
    var inputPath = `dist-${targetType}/${entryInputName}.js`;

    const browserRollupConfig = {
        input: inputPath,
        output: {
            file: outputPath,
            banner: banner,
            format: 'cjs',
            name: theNameSpace.browser,
            extend: true,
            freeze: false,
            sourcemap: true,
            strict: false,
            intro: getIntro(format, theNameSpace, theNameSpace.ver ? `${targetType}.${outputName}${teamExt}-${theNameSpace.ver}` : "", theNameSpace.ver),
            outro: getOutro(format, theNameSpace, theNameSpace.ver ? `${targetType}.${outputName}${teamExt}-${theNameSpace.ver}` : "", theNameSpace.ver)
        },
        treeshake: treeshakeConfig,
        plugins: [
            dynamicRemove(),
            replace({
                preventAssignment: true,
                delimiters: ["", ""],
                values: replaceValues
            }),
            importCheck({ exclude: importCheckNames }),
            nodeResolve({
                browser: false,
                module: true,
                preferBuiltins: false
            }),
            doCleanup(),
            es3Poly(),
            es3Check()
        ]
    };


    if (isProduction) {
        browserRollupConfig.output.file = prodOutputPath;
        browserRollupConfig.plugins.push(
            uglify({
                ie8: true,
                ie: true,
                toplevel: false,
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

    return browserRollupConfig;
};


const nodeUmdRollupConfigFactory = (banner, importCheckNames, targetType, theNameSpace, entryInputName, outputName, isProduction, replaceValues, treeshakeConfig) => {

    var outputPath = `dist/${outputName}.js`;
    var prodOutputPath = `dist/${outputName}.min.js`;
    var inputPath = `dist-${targetType}/${entryInputName}.js`;

    // targetType = esm, entry = applicationinsights-web
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
        treeshake: treeshakeConfig,
        plugins: [
            dynamicRemove(),
            replace({
                preventAssignment: true,
                delimiters: ["", ""],
                values: replaceValues
            }),
            importCheck({ exclude: importCheckNames}),
            nodeResolve(),
            doCleanup(),
            es3Poly(),
            es3Check()
        ]
    };

    if (isProduction) {
        nodeRollupConfig.output.file = prodOutputPath;
        nodeRollupConfig.plugins.push(
            uglify({
                ie8: true,
                ie: true,
                toplevel: false,
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



export function createConfig(banner, cfg, importCheckNames, replaceValues, majorVersionSet = true, treeshakeSet = true) {
    const majorVersion = cfg.version.split('.')[0];
    const targetType = "esm";
    var tasks = [];
    let treeshakeConfig = {};

    if (treeshakeSet){
        treeshakeConfig = treeshakeCfg;
    }

    tasks.push(
        nodeUmdRollupConfigFactory(banner, importCheckNames, targetType, cfg.namespace, cfg.node.entryPoint, cfg.node.outputName, true, replaceValues, treeshakeConfig),
        nodeUmdRollupConfigFactory(banner, importCheckNames, targetType, cfg.namespace, cfg.node.entryPoint, cfg.node.outputName, false, replaceValues, treeshakeConfig)
    );
    
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

        if (cfg.version) {
            var version = cfg.version.split(".");
            var majorVer = version[0].trim();
            if (majorVer && !browserNamespace.browser.endsWith(majorVer)) {
                browserNamespace.browser += majorVer;
            }
            browserNamespace.ver = cfg.version;
        }

        if (majorVersionSet){
            tasks.push(
                browserRollupConfigFactory(banner, importCheckNames, targetType, browserNamespace, cfg.browser.entryPoint, cfg.browser.outputName, majorVersion, true, browserFmt, browserPostfix, browserTeam, replaceValues, treeshakeConfig),
                browserRollupConfigFactory(banner, importCheckNames, targetType, browserNamespace, cfg.browser.entryPoint, cfg.browser.outputName, majorVersion, false, browserFmt, browserPostfix, browserTeam, replaceValues, treeshakeConfig),
            );
        }
        tasks.push(
            browserRollupConfigFactory(banner, importCheckNames, targetType, browserNamespace, cfg.browser.entryPoint, cfg.browser.outputName, cfg.version, true, browserFmt, browserPostfix, browserTeam, replaceValues, treeshakeConfig),
            browserRollupConfigFactory(banner, importCheckNames, targetType, browserNamespace, cfg.browser.entryPoint, cfg.browser.outputName, cfg.version, false, browserFmt, browserPostfix, browserTeam, replaceValues, treeshakeConfig),
        );
    }
    return tasks;
}


export function createUnVersionedConfig(banner, cfg, importCheckName, replaceValues, simplified = false, treeshakeSet = false) {
    const noVersion = "";
    const targetType = "esm";
    let treeshakeConfig = {};
    if (treeshakeSet){
        treeshakeConfig = treeshakeCfg;
    }

    let tasks = [
        //rollupModule(banner, targetType, theNamespace, "es3/" + entryInputName, outputName),

        nodeUmdRollupConfigFactory(banner, importCheckName, targetType, cfg.namespace, cfg.node.entryPoint, cfg.node.outputName, true, replaceValues, treeshakeConfig),
        nodeUmdRollupConfigFactory(banner, importCheckName, targetType, cfg.namespace, cfg.node.entryPoint, cfg.node.outputName, false, replaceValues, treeshakeConfig)
    ];


    let browserFormats = [];

    if (simplified){
        browserFormats = cfg.browser.formats || [
            { format: 'umd', postfix: '' },
        ];
    } else {
        browserFormats = cfg.browser.formats || [
            { format: 'umd', postfix: '' },
            { format: 'cjs', postfix: '.cjs' },
            { format: 'iife', postfix: '.gbl' }
        ];
    }

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

        if (!simplified){
            if (cfg.version) {
                var version = cfg.version.split(".");
                var majorVer = version[0].trim();
                if (majorVer && !browserNamespace.browser.endsWith(majorVer)) {
                    browserNamespace.browser += majorVer;
                }
                browserNamespace.ver = cfg.version;
            }
        }
     

        tasks.push(
            browserRollupConfigFactory(banner, importCheckName, targetType, browserNamespace, cfg.browser.entryPoint, cfg.browser.outputName, noVersion, true, browserFmt, browserPostfix, browserTeam, replaceValues, treeshakeConfig),
            browserRollupConfigFactory(banner, importCheckName, targetType, browserNamespace, cfg.browser.entryPoint, cfg.browser.outputName, noVersion, false, browserFmt, browserPostfix, browserTeam, replaceValues, treeshakeConfig)
        );
    }

    return tasks;
}