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
      /^\*\*\s*@class\s*$/
    ]
  })
}

const browserRollupConfigFactory = (banner, importCheckNames, targetType, theNameSpace, entryInputName, outputName, libVersion, isProduction, format = 'umd', postfix = '') => {
    var thePostfix = `${postfix}`;
    if (libVersion) {
        thePostfix = `.${libVersion}${postfix}`; 
    }

    var outputPath = `browser/${targetType}/${outputName}${thePostfix}.js`;
    var prodOutputPath = `browser/${targetType}/${outputName}${thePostfix}.min.js`;
    var inputPath = `dist-${targetType}/${entryInputName}.js`;

    const browserRollupConfig = {
        input: inputPath,
        output: {
            file: outputPath,
            banner: banner,
            format: format,
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

const nodeUmdRollupConfigFactory = (banner, importCheckNames, targetType, theNameSpace, entryInputName, outputName, isProduction) => {

    var outputPath = `dist/${targetType}/${outputName}.js`;
    var prodOutputPath = `dist/${targetType}/${outputName}.min.js`;
    var inputPath = `dist-${targetType}/${entryInputName}.js`;

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

export function createConfig(banner, cfg, importCheckNames) {
    const majorVersion = cfg.version.split('.')[0];
    const targetType = "es5";
    
    var tasks = [
 //       rollupModule(banner, targetType, cfg.namespace, "es5/" + cfg.node.entryPoint, cfg.node.outputName),
    ];

    if (cfg.browser.outputName !== cfg.node.outputName) {
//        tasks.push(rollupModule(banner, targetType, cfg.namespace, "es5/" + cfg.browser.entryPoint, cfg.browser.outputName));
    }

    tasks.push(
        nodeUmdRollupConfigFactory(banner, importCheckNames, targetType, cfg.namespace, cfg.node.entryPoint, cfg.node.outputName, true),
        nodeUmdRollupConfigFactory(banner, importCheckNames, targetType, cfg.namespace, cfg.node.entryPoint, cfg.node.outputName, false),

        browserRollupConfigFactory(banner, importCheckNames, targetType, cfg.namespace, cfg.browser.entryPoint, cfg.browser.outputName, majorVersion, true),
        browserRollupConfigFactory(banner, importCheckNames, targetType, cfg.namespace, cfg.browser.entryPoint, cfg.browser.outputName, majorVersion, false),
        browserRollupConfigFactory(banner, importCheckNames, targetType, cfg.namespace, cfg.browser.entryPoint, cfg.browser.outputName, cfg.version, true),
        browserRollupConfigFactory(banner, importCheckNames, targetType, cfg.namespace, cfg.browser.entryPoint, cfg.browser.outputName, cfg.version, false),
        browserRollupConfigFactory(banner, importCheckNames, targetType, cfg.namespace, cfg.browser.entryPoint, cfg.browser.outputName, majorVersion, true, 'cjs', '.cjs'),
        browserRollupConfigFactory(banner, importCheckNames, targetType, cfg.namespace, cfg.browser.entryPoint, cfg.browser.outputName, majorVersion, false, 'cjs', '.cjs'),
        browserRollupConfigFactory(banner, importCheckNames, targetType, cfg.namespace, cfg.browser.entryPoint, cfg.browser.outputName, cfg.version, true, 'cjs', '.cjs'),
        browserRollupConfigFactory(banner, importCheckNames, targetType, cfg.namespace, cfg.browser.entryPoint, cfg.browser.outputName, cfg.version, false, 'cjs', '.cjs'),
        browserRollupConfigFactory(banner, importCheckNames, targetType, cfg.namespace, cfg.browser.entryPoint, cfg.browser.outputName, majorVersion, true, 'iife', '.gbl'),
        browserRollupConfigFactory(banner, importCheckNames, targetType, cfg.namespace, cfg.browser.entryPoint, cfg.browser.outputName, majorVersion, false, 'iife', '.gbl'),
        browserRollupConfigFactory(banner, importCheckNames, targetType, cfg.namespace, cfg.browser.entryPoint, cfg.browser.outputName, cfg.version, true, 'iife', '.gbl'),
        browserRollupConfigFactory(banner, importCheckNames, targetType, cfg.namespace, cfg.browser.entryPoint, cfg.browser.outputName, cfg.version, false, 'iife', '.gbl')
    );

    return tasks;
}

export function createUnVersionedConfig(banner, theNamespace, entryInputName, outputName, importCheckName) {
    const noVersion = "";
    const targetType = "es5";
    
    return [
        //rollupModule(banner, targetType, theNamespace, "es5/" + entryInputName, outputName),

        nodeUmdRollupConfigFactory(banner, importCheckName, targetType, theNamespace, outputName, outputName, true),
        nodeUmdRollupConfigFactory(banner, importCheckName, targetType, theNamespace, outputName, outputName, false),

        browserRollupConfigFactory(banner, importCheckName, targetType, theNamespace, outputName, outputName, noVersion, true),
        browserRollupConfigFactory(banner, importCheckName, targetType, theNamespace, outputName, outputName, noVersion, false),
        browserRollupConfigFactory(banner, importCheckName, targetType, theNamespace, outputName, outputName, noVersion, true, 'cjs', '.cjs'),
        browserRollupConfigFactory(banner, importCheckName, targetType, theNamespace, outputName, outputName, noVersion, false, 'cjs', '.cjs'),
        browserRollupConfigFactory(banner, importCheckName, targetType, theNamespace, outputName, outputName, noVersion, true, 'iife', '.gbl'),
        browserRollupConfigFactory(banner, importCheckName, targetType, theNamespace, outputName, outputName, noVersion, false, 'iife', '.gbl')
    ];
}