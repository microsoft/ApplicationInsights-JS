import replace from "@rollup/plugin-replace";
import commonjs from '@rollup/plugin-commonjs';

const UglifyJs = require('uglify-js');

const version = require("./package.json").version;
const inputName = "./dist-es5/uglify3-js";
const outputName = "rollup-plugin-uglify3-js";
const distPath = "./dist/es5/";
const banner = [
  "/*!",
  ` * Application Insights JavaScript SDK - Rollup Uglify3 Plugin, ${version}`,
  " * Copyright (c) Microsoft and contributors. All rights reserved.",
  " */"
].join("\n");

const nodeUmdRollupConfigFactory = () => {
  const nodeRollupConfig = {
    input: `${inputName}.js`,
    output: {
      file: `${distPath}node/${outputName}.js`,
      banner: banner,
      format: "umd",
      name: "Microsoft.ApplicationInsights-Rollup-Plugin-Uglify",
      extend: true,
      freeze: false,
      sourcemap: false,
      externalLiveBindings: false,
      globals:[ 'UglifyJs' ]
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
      commonjs({
        include: 'node_modules/**',
        transformMixedEsModules: true
      })
    ]
  };

  return nodeRollupConfig;
};

const moduleRollupConfigFactory = (format) => {
  const moduleRollupConfig = {
    input: `${inputName}.js`,
    output: {
      file: `${distPath}${format}/${outputName}.js`,
      banner: banner,
      format: format,
      name: "Microsoft.ApplicationInsights-Rollup-Plugin-Uglify",
      extend: true,
      freeze: false,
      sourcemap: false,
      externalLiveBindings: false,
      globals:[ 'UglifyJs ']
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
      // nodeResolve({
      //   module: true,
      //   browser: false,
      //   preferBuiltins: false
      // }),
      commonjs({
        include: 'node_modules/**',
        transformMixedEsModules: true
      })
    ]
  };

  return moduleRollupConfig;
};

export default [
  nodeUmdRollupConfigFactory(),
  moduleRollupConfigFactory('esm'),
];
