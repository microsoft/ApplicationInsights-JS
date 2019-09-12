import nodeResolve from "rollup-plugin-node-resolve";
import {uglify} from "rollup-plugin-uglify";
import replace from "rollup-plugin-replace";
import commonjs from "rollup-plugin-commonjs";

const version = require("./package.json").version;
const outputName = "applicationinsights-angular-js";
const banner = [
  "/*!",
  ` * Application Insights JavaScript SDK - Angular Plugin, ${version}`,
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
      name: "Microsoft.ApplicationInsights",
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
      nodeResolve({
        browser: false,
        preferBuiltins: false
      }),
      commonjs({
        include: 'node_modules/**'
      })
    ]
  };

   if (isProduction) {
    browserRollupConfig.output.file = `browser/${outputName}.min.js`;
    browserRollupConfig.plugins.push(
      uglify({
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
      name: "Microsoft.ApplicationInsights",
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
      nodeResolve({ preferBuiltins: true }),
      commonjs({
        include: 'node_modules/**'
      })
    ]
  };

  if (isProduction) {
    nodeRollupConfig.output.file = `dist/${outputName}.min.js`;
    nodeRollupConfig.plugins.push(
      uglify({
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
