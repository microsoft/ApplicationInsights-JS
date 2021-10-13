import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";
import { uglify } from "../../tools/rollup-plugin-uglify3-js/dist/esm/rollup-plugin-uglify3-js";
import { updateDistEsmFiles } from "../../tools/updateDistEsm/updateDistEsm";
import copy from 'rollup-plugin-copy'

const version = require("./package.json").version;
const banner = [
  "/*!",
  ` * Application Insights JavaScript SDK - Chrome Debug Plugin, ${version}`,
  " * Copyright (c) Microsoft and contributors. All rights reserved.",
  " */"
].join("\n");

const replaceValues = {
  "// Copyright (c) Microsoft Corporation. All rights reserved.": "",
  "// Licensed under the MIT License.": "",
  "process.env.NODE_ENV": "JSON.stringify( 'production' )"
};

const generateBackground = isProduction => {
  const browserRollupConfig = {
    input: `dist-esm/background.js`,
    output: {
      file: `browser/scripts/background.js`,
      banner: banner,
      format: "umd",
      name: "Microsoft.ApplicationInsights",
      extend: true,
      freeze: false,
      sourcemap: true
    },
    plugins: [
      nodeResolve({
        browser: true,
        preferBuiltins: true,
        dedupe: [ "react", "react-dom" ]
      }),
      commonjs(),
      replace({
        preventAssignment: true,
        delimiters: ["", ""],
        values: replaceValues
      })
    ]
  };

   if (isProduction) {
    browserRollupConfig.output.file = `browser/background.min.js`;
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

const generatePopup = isProduction => {
  const browserRollupConfig = {
    input: `dist-esm/popup.js`,
    output: {
      file: `browser/scripts/popup.js`,
      banner: banner,
      format: "umd",
      name: "Microsoft.ApplicationInsights",
      extend: true,
      freeze: false,
      sourcemap: true
    },
    plugins: [
      nodeResolve({
        browser: true,
        preferBuiltins: true,
        dedupe: [ "react", "react-dom" ]
      }),
      copy({
        targets: [
          { src: './images/*', dest: 'browser/images' },
          { src: './pages/*', dest: 'browser/pages' },
          { src: './styles/*', dest: 'browser/styles' },
          { src: './manifest.json', dest: 'browser/' }
        ]
      }),
      commonjs(),
      replace({
        preventAssignment: true,
        delimiters: ["", ""],
        values: replaceValues
      })
    ]
  };

   if (isProduction) {
    browserRollupConfig.output.file = `browser/popup.min.js`;
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

updateDistEsmFiles(replaceValues, banner);

export default [
  generateBackground(false),
  generatePopup(false)
];
