import nodeResolve from "rollup-plugin-node-resolve";
import visualizer from "rollup-plugin-visualizer";
import {uglify} from "rollup-plugin-uglify";
import replace from "rollup-plugin-replace";

const version = require("./package.json").version;
const banner = [
  "/*!",
  ` * Application Insights JavaScript SDK - Basic, ${version}`,
  " * Copyright (c) Microsoft and contributors. All rights reserved.",
  " */"
].join("\n");

const browserRollupConfigFactory = (isProduction, libV = '1') => {
  const browserRollupConfig = {
    input: "dist-esm/index.js",
    output: {
      file: `browser/aib.${libV}.js`,
      banner: banner,
      format: "umd",
      name: "aibasic",
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
      })
    ]
  };

  if (isProduction) {
    browserRollupConfig.output.file = `browser/aib.${libV}.min.js`;
    browserRollupConfig.plugins.push(
      uglify({
        output: {
          preamble: banner
        }
      }),
      visualizer({
        filename: "./statistics.html",
        sourcemap: true
      })
    );
  }

  return browserRollupConfig;
};

export default [
  browserRollupConfigFactory(true),
  browserRollupConfigFactory(false),
  browserRollupConfigFactory(true, version),
  browserRollupConfigFactory(false, version)
];