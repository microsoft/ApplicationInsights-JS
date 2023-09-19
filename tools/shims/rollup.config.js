import nodeResolve from "@rollup/plugin-node-resolve";
import { uglify } from "@microsoft/applicationinsights-rollup-plugin-uglify3-js";
import replace from "@rollup/plugin-replace";
import minify from 'rollup-plugin-minify-es';
import { es3Poly, es3Check } from "@microsoft/applicationinsights-rollup-es3";

const packageJson = require("./package.json");
const version = packageJson.version;
const pkgDesc = packageJson.description;
const inputName = "./dist-esm/applicationinsights-shims";
const outputName = "applicationinsights-shims";
const distPath = "./dist/";
const banner = [
  "/*!",
  ` * ${pkgDesc}, ${version}`,
  " * Copyright (c) Microsoft and contributors. All rights reserved.",
  " */"
].join("\n");

const replaceValues = {
  "// Copyright (c) Microsoft Corporation. All rights reserved.": "",
  "// Licensed under the MIT License.": ""
};

const browserUmdRollupConfigFactory = (isProduction) => {
  const browserRollupConfig = {
    input: `${inputName}.js`,
    output: {
      file: `./browser/${outputName}.js`,
      banner: banner,
      format: "umd",
      name: "Microsoft.ApplicationInsights.Shims",
      sourcemap: false
    },
    plugins: [
      replace({
        preventAssignment: true,
        delimiters: ["", ""],
        values: replaceValues
      }),
      nodeResolve(),
      es3Poly(),
      es3Check()
    ]
  };

  if (isProduction) {
    browserRollupConfig.output.file = `./browser/${outputName}.min.js`;
    browserRollupConfig.plugins.push(
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
  return browserRollupConfig;
};

const moduleRollupConfigFactory = (format, isProduction) => {
  const moduleRollupConfig = {
    input: `${inputName}.js`,
    output: {
      file: `${distPath}${format}/${outputName}.js`,
      banner: banner,
      format: format,
      name: "Microsoft.ApplicationInsights.Shims",
      sourcemap: false
    },
    plugins: [
      replace({
        preventAssignment: true,
        delimiters: ["", ""],
        values: replaceValues
      }),
      nodeResolve(),
      es3Poly(),
      es3Check()
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
  browserUmdRollupConfigFactory(true),
  browserUmdRollupConfigFactory(false),
  moduleRollupConfigFactory('esm', true),
  moduleRollupConfigFactory('esm', false),
  moduleRollupConfigFactory('umd', true),
  moduleRollupConfigFactory('umd', false)
];
