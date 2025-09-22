import nodeResolve from "@rollup/plugin-node-resolve";
import { uglify } from "@microsoft/applicationinsights-rollup-plugin-uglify3-js";
import replace from "@rollup/plugin-replace";
import cleanup from "rollup-plugin-cleanup";
import dynamicRemove from "@microsoft/dynamicproto-js/tools/rollup/dist/node/removedynamic";
import { es5Poly, es5Check, importCheck } from "@microsoft/applicationinsights-rollup-es5";
import { updateDistEsmFiles } from "../../tools/updateDistEsm/updateDistEsm";

const version = require("./package.json").version;

const workerName = "startspan-example-index";

const banner = [
  "/*!",
  ` * Application Insights JavaScript SDK Example - startSpan, ${version}`,
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
    input: `dist-es5/${name}.js`,
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
      importCheck({ exclude: [ "startspan-example-index" ] }),
      nodeResolve({
        module: true,
        browser: true,
        preferBuiltins: false
      }),
      doCleanup(),
      es5Poly(),
      es5Check()
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