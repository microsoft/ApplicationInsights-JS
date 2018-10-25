import nodeResolve from "rollup-plugin-node-resolve";
import visualizer from "rollup-plugin-visualizer";
import {uglify} from "rollup-plugin-uglify";
import replace from "rollup-plugin-replace";

const version = require("./package.json").version;
const banner = [
  "/*!",
  ` * Application Insights JavaScript SDK - Web, ${version}`,
  " * Copyright (c) Microsoft and contributors. All rights reserved.",
  " */"
].join("\n");

const browserRollupConfigFactory = (isProduction, libVersion = '1') => {
  const browserRollupConfig = {
    input: "dist-esm/Init.js",
    output: {
      file: `browser/ai.${libVersion}.js`,
      banner: banner,
      format: "umd",
      name: "aisdk",
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
    browserRollupConfig.output.file = `browser/ai.${libVersion}.min.js`;
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