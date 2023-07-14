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
            format: format,
            name: theNameSpace.browser,
            extend: true,
            freeze: false,
            sourcemap: true,
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
                toplevel: true,
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

const browserRollupConfigFactory2 = (banner, importCheckNames, targetType, theNameSpace, entryInputName, outputName, libVersion, isProduction, format = 'umd', postfix = '', teamExt = '', replaceValues, treeshakeConfig) => {

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
            format: format,
            name: theNameSpace.browser,
            extend: true,
            freeze: false,
            sourcemap: true,
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
                browser: true,
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
                toplevel: true,
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

        if (cfg.version) {
            var version = cfg.version.split(".");
            var majorVer = version[0].trim();
            if (majorVer && !browserNamespace.browser.endsWith(majorVer)) {
                browserNamespace.browser += majorVer;
            }
            browserNamespace.ver = cfg.version;
        }

        tasks.push(
            browserRollupConfigFactory(banner, importCheckName, targetType, browserNamespace, cfg.browser.entryPoint, cfg.browser.outputName, noVersion, true, browserFmt, browserPostfix, browserTeam, replaceValues, treeshakeConfig),
            browserRollupConfigFactory(banner, importCheckName, targetType, browserNamespace, cfg.browser.entryPoint, cfg.browser.outputName, noVersion, false, browserFmt, browserPostfix, browserTeam, replaceValues, treeshakeConfig)
        );
    }

    return tasks;
}

// export function simpleConfig(banner, cfg, importCheckName, replaceValues, treeshakeSet = false) {
//     const noVersion = "";
//     const targetType = "esm";

//     let treeshakeConfig = {};

//     if (treeshakeSet){
//         treeshakeConfig = treeshakeCfg;
//     }
//     let tasks = [];

//     tasks.push(
//         nodeUmdRollupConfigFactory(banner, importCheckName, targetType, cfg.namespace, cfg.node.entryPoint, cfg.node.outputName, true, replaceValues, treeshakeConfig),
//         nodeUmdRollupConfigFactory(banner, importCheckName, targetType, cfg.namespace, cfg.node.entryPoint, cfg.node.outputName, false, replaceValues, treeshakeConfig)
//     );

//     let browserFormats = cfg.browser.formats || [
//         { format: 'umd', postfix: '' },
//     ];

//     if (cfg.teams) {
//         for (let lp = 0; lp < cfg.teams.length; lp++) {
//             let teamCfg = cfg.teams[lp];
//             if (teamCfg.teamExt) {
//                 browserFormats.push({
//                     teamExt: teamCfg.teamExt,
//                     namespace: teamCfg.namespace || cfg.namespace,
//                     namespaceGbl: teamCfg.namespaceGbl || teamCfg.namespace || cfg.namespace,
//                     format: teamCfg.fmt || 'iife',
//                     postfix: teamCfg.ext || '.gbl'
//                 });
//             }
//         }
//     }

//     for (let lp = 0; lp < browserFormats.length; lp++) {
//         let browserCfg = browserFormats[lp];
//         let browserNamespace = browserCfg.namespace || cfg.namespace;
//         if (typeof browserNamespace === "string") {
//             browserNamespace = {
//                 browser: browserCfg.namespace || cfg.namespace,
//                 gbl: browserCfg.namespaceGbl || cfg.namespace
//             };
//         }
//         let browserFmt = browserCfg.format || 'umd';
//         let browserPostfix = browserCfg.postfix || '';
//         let browserTeam = browserCfg.teamExt || '';

      
//         tasks.push(
//             browserRollupConfigFactory(banner, importCheckName, targetType, browserNamespace, cfg.browser.entryPoint, cfg.browser.outputName, noVersion, true, browserFmt, browserPostfix, browserTeam, replaceValues, treeshakeConfig),
//             browserRollupConfigFactory(banner, importCheckName, targetType, browserNamespace, cfg.browser.entryPoint, cfg.browser.outputName, noVersion, false, browserFmt, browserPostfix, browserTeam, replaceValues, treeshakeConfig)
//         );

//     }

//     return tasks;
// }