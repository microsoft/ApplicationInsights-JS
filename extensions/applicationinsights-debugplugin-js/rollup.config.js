import nodeResolve from "rollup-plugin-node-resolve";
import {uglify} from "rollup-plugin-uglify";
import replace from "rollup-plugin-replace";
import { es3Poly, es3Check, importCheck } from "@microsoft/applicationinsights-rollup-es3";

const version = require("./package.json").version;
const outputName = "applicationinsights-debugplugin-js";
const banner = [
  "/*!",
  ` * Application Insights JavaScript SDK - Properties Plugin, ${version}`,
  " * Copyright (c) Microsoft and contributors. All rights reserved.",
  " */"
].join("\n");

const browserRollupConfigFactory = isProduction => {
  const browserRollupConfig = {
    input: `dist-esm/${outputName}.js`,
    output: {
      file: `browser/${outputName}.js`,
      banner: banner,
      format: "umd",
      name: "Microsoft.ApplicationInsights.DebugPlugin",
      sourcemap: true
    },
    plugins: [
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
    browserRollupConfig.output.file = `browser/${outputName}.min.js`;
    browserRollupConfig.plugins.push(
      uglify({
        ie8: true,
        output: {
          preamble: banner
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
      name: "Microsoft.ApplicationInsights.DebugPlugin",
      sourcemap: true
    },
    plugins: [
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
        output: {
          preamble: banner
        }
      })
    );
  }

  return nodeRollupConfig;
};

export default [
  browserRollupConfigFactory(true),
  browserRollupConfigFactory(false),
  nodeUmdRollupConfigFactory(true),
  nodeUmdRollupConfigFactory(false)
];
