import nodeResolve from "@rollup/plugin-node-resolve";
import { uglify } from "@microsoft/applicationinsights-rollup-plugin-uglify3-js";
import replace from "@rollup/plugin-replace";
import minify from 'rollup-plugin-minify-es';

const version = require("./package.json").version;
const desc = require("./package.json").description;
const inputName = "./out/applicationinsights-rollup-es3";
const outputName = "applicationinsights-rollup-es3";
const distPath = "./dist/";
const banner = [
  "/*!",
  ` * ${desc}, ${version}`,
  " * Copyright (c) Microsoft and contributors. All rights reserved.",
  " */"
].join("\n");

const nodeUmdRollupConfigFactory = (isProduction) => {
  const nodeRollupConfig = {
    input: `${inputName}.js`,
    output: {
      file: `${distPath}node/${outputName}.js`,
      banner: banner,
      format: "umd",
      name: "Microsoft.ApplicationInsights-Rollup-ES3",
      extend: true,
      freeze: false,
      sourcemap: false
    },
    plugins: [
      replace({
        preventAssignment: true,
        delimiters: ["", ""],
        values: {
          "// Copyright (c) Microsoft Corporation. All rights reserved.": "",
          "// Licensed under the MIT License.": ""
        }
      }),
      nodeResolve()
    ]
  };

  if (isProduction) {
    nodeRollupConfig.output.file = `${distPath}node/${outputName}.min.js`;
    nodeRollupConfig.plugins.push(
      uglify({
        ie8: true,
        ie: true,
        toplevel: false,
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

const moduleRollupConfigFactory = (format, isProduction) => {
  const moduleRollupConfig = {
    input: `${inputName}.js`,
    output: {
      file: `${distPath}${format}/${outputName}.js`,
      banner: banner,
      format: format,
      name: "Microsoft.ApplicationInsights-Rollup-ES3",
      extend: true,
      freeze: false,
      sourcemap: false
    },
    plugins: [
      replace({
        preventAssignment: true,
        delimiters: ["", ""],
        values: {
          "// Copyright (c) Microsoft Corporation. All rights reserved.": "",
          "// Licensed under the MIT License.": ""
        }
      }),
      nodeResolve()
    ]
  };

  if (isProduction) {
    moduleRollupConfig.output.file = `${distPath}${format}/${outputName}.min.js`;
    if (format != "esm") {
      moduleRollupConfig.plugins.push(
        uglify({
          ie8: true,
          ie: true,
          toplevel: false,
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
    } else {
      moduleRollupConfig.plugins.push(
        minify({
          ie8: true,
          ie: true,
          toplevel: false,
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
  }

  return moduleRollupConfig;
};

export default [
  nodeUmdRollupConfigFactory(true),
  nodeUmdRollupConfigFactory(false),
  moduleRollupConfigFactory('esm', true),
  moduleRollupConfigFactory('esm', false)
];
