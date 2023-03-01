import nodeResolve from "@rollup/plugin-node-resolve";
import { uglify } from "@microsoft/applicationinsights-rollup-plugin-uglify3-js";
import replace from "@rollup/plugin-replace";
import cleanup from "rollup-plugin-cleanup";
import dynamicRemove from "@microsoft/dynamicproto-js/tools/rollup/node/removedynamic";
import { es3Poly, es3Check, importCheck } from "@microsoft/applicationinsights-rollup-es3";
import { updateDistEsmFiles } from "../../tools/updateDistEsm/updateDistEsm";

const version = require("./package.json").version;

const workerName = "dependencies-example-index";

const banner = [
  "/*!",
  ` * Application Insights JavaScript SDK Example - Shared Worker, ${version}`,
  " * Copyright (c) Microsoft and contributors. All rights reserved.",
  " */"
].join("\n");

const replaceValues = {
  "// Copyright (c) Microsoft Corporation. All rights reserved.": "",
  "// Licensed under the MIT License.": ""
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

const browserRollupConfigFactory = (name, isProduction, format = "umd", extension = "") => {
  const browserRollupConfig = {
    input: `dist-esm/${name}.js`,
    output: {
      file: `browser/${name}${extension ? "." +extension : ""}.js`,
      banner: banner,
      format: format,
      name: "Microsoft.ApplicationInsights.Example",
      extend: true,
      freeze: false,
      sourcemap: true
    },
    treeshake: {
      propertyReadSideEffects: false,
      moduleSideEffects: false,
      tryCatchDeoptimization: false,
      correctVarValueBeforeDeclaration: false
    },
    plugins: [
      dynamicRemove(),
      replace({
        preventAssignment: true,
        delimiters: ["", ""],
        values: replaceValues
      }),
      // This just makes sure we are importing the example dependencies correctly
      importCheck({ exclude: [ "dependencies-example-index" ] }),
      nodeResolve({
        module: true,
        browser: true,
        preferBuiltins: false
      }),
      doCleanup(),
      es3Poly(),
      es3Check()
    ]
  };

  if (isProduction) {
    browserRollupConfig.output.file = `browser/${name}${extension ? "." +extension : ""}.min.js`;
    browserRollupConfig.plugins.push(
      uglify({
        ie8: false,
        ie: true,
        compress: {
          ie: true,
          passes:3,
          unsafe: true,
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

updateDistEsmFiles(replaceValues, banner);

export default [
  browserRollupConfigFactory(workerName, false, "iife", "gbl")
];
