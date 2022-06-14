import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";
import cleanup from "rollup-plugin-cleanup";
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import { uglify } from "../../tools/rollup-plugin-uglify3-js/dist/esm/rollup-plugin-uglify3-js";
import { es3Poly, importCheck } from "@microsoft/applicationinsights-rollup-es3";
import dynamicRemove from "@microsoft/dynamicproto-js/tools/rollup/node/removedynamic";
import { updateDistEsmFiles } from "../../tools/updateDistEsm/updateDistEsm";

const version = require("./package.json").version;
const outputName = "applicationinsights-react-js";
const banner = [
  "/*!",
  ` * Application Insights JavaScript SDK - React Plugin, ${version}`,
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

const browserRollupConfigFactory = isProduction => {
  const browserRollupConfig = {
    input: `dist-esm/${outputName}.js`,
    output: {
      file: `browser/${outputName}.js`,
      banner: banner,
      format: "umd",
      name: "Microsoft.ApplicationInsights",
      extend: true,
      freeze: false,
      sourcemap: true
    },
    plugins: [
      dynamicRemove(),
      replace({
        preventAssignment: true,
        delimiters: ["", ""],
        values: replaceValues
      }),
      importCheck({ exclude: [ "applicationinsights-react-js" ] }),
      peerDepsExternal(),
      nodeResolve({
        browser: true,
        preferBuiltins: true,
        dedupe: [ "react", "react-dom" ]
      }),
      commonjs(),
      doCleanup(),
      es3Poly()
    ]
  };

   if (isProduction) {
    browserRollupConfig.output.file = `browser/${outputName}.min.js`;
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

const nodeUmdRollupConfigFactory = (isProduction) => {
  const nodeRollupConfig = {
    input: `dist-esm/${outputName}.js`,
    output: {
      file: `dist/${outputName}.js`,
      banner: banner,
      format: "umd",
      name: "Microsoft.ApplicationInsights",
      extend: true,
      freeze: false,
      sourcemap: true
    },
    plugins: [
      dynamicRemove(),
      replace({
        preventAssignment: true,
        delimiters: ["", ""],
        values: replaceValues
      }),
      importCheck({ exclude: [ "applicationinsights-react-js" ] }),
      peerDepsExternal(),
      nodeResolve({
        browser: true,
        preferBuiltins: true,
        dedupe: [ "react", "react-dom" ]
      }),
      commonjs(),
      doCleanup(),
      es3Poly()
    ]
  };

  if (isProduction) {
    nodeRollupConfig.output.file = `dist/${outputName}.min.js`;
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

updateDistEsmFiles(replaceValues, banner);

export default [
  browserRollupConfigFactory(true),
  browserRollupConfigFactory(false),
  nodeUmdRollupConfigFactory(true),
  nodeUmdRollupConfigFactory(false)
];
