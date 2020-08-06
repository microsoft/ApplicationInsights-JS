import nodeResolve from "rollup-plugin-node-resolve";
import {uglify} from "rollup-plugin-uglify";
import replace from "rollup-plugin-replace";
import { es3Poly, es3Check, importCheck } from "@microsoft/applicationinsights-rollup-es3";
import dynamicRemove from "@microsoft/dynamicproto-js/tools/rollup/node/removedynamic";

const version = require("./package.json").version;
const outputName = "applicationinsights-debugplugin-js";
const banner = [
  "/*!",
  ` * Application Insights JavaScript SDK - Debug Plugin, ${version}`,
  " * Copyright (c) Microsoft and contributors. All rights reserved.",
  " */"
].join("\n");

const verParts = version.split(".")
if (verParts.length != 3) {
  throw "Invalid Version! [" + version + "]"
}

const browserRollupConfigFactory = (isProduction, libVersion) => {
  const browserRollupConfig = {
    input: `dist-esm/${outputName}.js`,
    output: {
      file: `browser/ai.dbg.${libVersion}.js`,
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
        delimiters: ["", ""],
        values: {
          "// Copyright (c) Microsoft Corporation. All rights reserved.": "",
          "// Licensed under the MIT License.": ""
        }
      }),
      importCheck({ exclude: [ "applicationinsights-debugplugin-js" ] }),
      nodeResolve({
        browser: false,
        preferBuiltins: false
      }),
      es3Poly(),
      es3Check()
    ]
  };

  if (isProduction) {
    browserRollupConfig.output.file = `browser/ai.dbg.${libVersion}.min.js`;
    browserRollupConfig.plugins.push(
      uglify({
        ie8: true,
        toplevel: true,
        compress: {
          passes:3,
          unsafe: true
        },
        output: {
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
        delimiters: ["", ""],
        values: {
          "// Copyright (c) Microsoft Corporation. All rights reserved.": "",
          "// Licensed under the MIT License.": ""
        }
      }),
      importCheck({ exclude: [ "applicationinsights-debugplugin-js" ] }),
      nodeResolve(),
      es3Poly(),
      es3Check()
    ]
  };

  if (isProduction) {
    nodeRollupConfig.output.file = `dist/${outputName}.min.js`;
    nodeRollupConfig.plugins.push(
      uglify({
        ie8: true,
        toplevel: true,
        compress: {
          passes:3,
          unsafe: true
        },
        output: {
          preamble: banner,
          webkit:true
        }
      })
    );
  }

  return nodeRollupConfig;
};

export default [
  browserRollupConfigFactory(true, version),
  browserRollupConfigFactory(false, version),
  browserRollupConfigFactory(true, verParts[0]),
  browserRollupConfigFactory(false, verParts[0]),
  nodeUmdRollupConfigFactory(true),
  nodeUmdRollupConfigFactory(false)
];
