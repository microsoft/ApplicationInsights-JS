import nodeResolve from "rollup-plugin-node-resolve";
import {uglify} from "rollup-plugin-uglify";
import replace from "rollup-plugin-replace";
import { es3Poly, es3Check, importCheck } from "@microsoft/applicationinsights-rollup-es3";

const version = require("./package.json").version;
const banner = [
  "/*!",
  ` * Application Insights JavaScript Web SDK - Basic, ${version}`,
  " * Copyright (c) Microsoft and contributors. All rights reserved.",
  " */"
].join("\n");

const browserRollupConfigFactory = (isProduction, libV = '2') => {
  const browserRollupConfig = {
    input: "dist-esm/index.js",
    output: {
      file: `browser/aib.${libV}.js`,
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
      importCheck({ exclude: [ "index" ] }),
      nodeResolve({
        browser: false,
        preferBuiltins: false
      }),
      es3Poly(),
      es3Check()
    ]
  };

  if (isProduction) {
    browserRollupConfig.output.file = `browser/aib.${libV}.min.js`;
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
    input: `dist-esm/index.js`,
    output: {
      file: `dist/applicationinsights-web-basic.js`,
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
      importCheck({ exclude: [ "index" ] }),
      nodeResolve(),
      es3Poly(),
      es3Check()
    ]
  };

  if (isProduction) {
    nodeRollupConfig.output.file = `dist/applicationinsights-web-basic.min.js`;
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
  nodeUmdRollupConfigFactory(true),
  nodeUmdRollupConfigFactory(false),
  browserRollupConfigFactory(true),
  browserRollupConfigFactory(false),
  browserRollupConfigFactory(true, version),
  browserRollupConfigFactory(false, version)
];