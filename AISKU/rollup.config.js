import nodeResolve from "@rollup/plugin-node-resolve";
import { uglify } from "@microsoft/applicationinsights-rollup-plugin-uglify3-js";
import replace from "@rollup/plugin-replace";
import dynamicRemove from "@microsoft/dynamicproto-js/tools/rollup/node/removedynamic";
import { es3Poly, es3Check, importCheck } from "@microsoft/applicationinsights-rollup-es3";
import { updateDistEsmFiles } from "../tools/updateDistEsm/updateDistEsm";

const packageJson = require("./package.json");
const version = packageJson.version;
const pkgDesc = packageJson.description;
const banner = [
  "/*!",
  ` * Application Insights JavaScript SDK - Web, ${version}`,
  " * Copyright (c) Microsoft and contributors. All rights reserved.",
  " */"
].join("\n");

const replaceValues = {
  "// Copyright (c) Microsoft Corporation. All rights reserved.": "",
  "// Licensed under the MIT License.": ""
};

const majorVersion = version.split('.')[0];

const browserRollupConfigFactory = (isProduction, libVersion = '2', format = 'umd', postfix = '') => {
  const browserRollupConfig = {
    input: "dist-esm/Init.js",
    output: {
      file: `browser/ai.${libVersion}${postfix}.js`,
      banner: banner,
      format: format,
      name: "Microsoft.ApplicationInsights",
      extend: true,
      freeze: false,
      sourcemap: true
    },
    plugins: [
      dynamicRemove(),
      replace({
        delimiters: ["", ""],
        values: replaceValues
      }),
      importCheck({ exclude: [ "applicationinsights-web" ] }),
      nodeResolve({
        browser: false,
        preferBuiltins: false
      }),
      es3Poly(),
      es3Check()
    ]
  };

  if (isProduction) {
    browserRollupConfig.output.file = `browser/ai.${libVersion}${postfix}.min.js`;
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
    input: `dist-esm/applicationinsights-web.js`,
    output: {
      file: `dist/applicationinsights-web.js`,
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
        values: replaceValues
      }),
      importCheck({ exclude: [ "applicationinsights-web" ] }),
      nodeResolve(),
      es3Poly(),
      es3Check()
    ]
  };

  if (isProduction) {
    nodeRollupConfig.output.file = `dist/applicationinsights-web.min.js`;
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

updateDistEsmFiles(replaceValues, banner);

export default [
  nodeUmdRollupConfigFactory(true),
  nodeUmdRollupConfigFactory(false),
  browserRollupConfigFactory(true, majorVersion),
  browserRollupConfigFactory(false, majorVersion),
  browserRollupConfigFactory(true, version),
  browserRollupConfigFactory(false, version),
  browserRollupConfigFactory(true, majorVersion, 'cjs', '.cjs'),
  browserRollupConfigFactory(false, majorVersion, 'cjs', '.cjs'),
  browserRollupConfigFactory(true, version, 'cjs', '.cjs'),
  browserRollupConfigFactory(false, version, 'cjs', '.cjs'),
  browserRollupConfigFactory(true, majorVersion, 'iife', '.gbl'),
  browserRollupConfigFactory(false, majorVersion, 'iife', '.gbl'),
  browserRollupConfigFactory(true, version, 'iife', '.gbl'),
  browserRollupConfigFactory(false, version, 'iife', '.gbl'),
];