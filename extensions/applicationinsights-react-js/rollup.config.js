import nodeResolve from "rollup-plugin-node-resolve";
import {uglify} from "rollup-plugin-uglify";
import replace from "rollup-plugin-replace";
import commonjs from "rollup-plugin-commonjs";
import { es3Poly, importCheck } from "@microsoft/applicationinsights-rollup-es3";

const version = require("./package.json").version;
const outputName = "applicationinsights-react-js";
const banner = [
  "/*!",
  ` * Application Insights JavaScript SDK - React Plugin, ${version}`,
  " * Copyright (c) Microsoft and contributors. All rights reserved.",
  " */"
].join("\n");
const reactNamedExports = [
  "Children",
  "Component",
  "PropTypes",
  "createElement",
  "createContext",
  "useContext",
  "useState",
  "useEffect",
  "useRef",
];

const browserRollupConfigFactory = isProduction => {
  const browserRollupConfig = {
    input: `dist-esm/${outputName}.js`,
    output: {
      file: `browser/${outputName}.js`,
      banner: banner,
      format: "umd",
      name: "Microsoft.ApplicationInsights",
      extend: true,
      freeze: false,
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
      importCheck({ exclude: [ "applicationinsights-react-js" ] }),
      nodeResolve({
        browser: false,
        preferBuiltins: false
      }),
      commonjs({
        namedExports: {
          "node_modules/react/index.js": reactNamedExports,
          "node_modules/react-dom/index.js": ["render"]
        }
      }),
      es3Poly()
    ]
  };

   if (isProduction) {
    browserRollupConfig.output.file = `browser/${outputName}.min.js`;
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
    input: `dist-esm/${outputName}.js`,
    output: {
      file: `dist/${outputName}.js`,
      banner: banner,
      format: "umd",
      name: "Microsoft.ApplicationInsights",
      freeze: false,
      extend: true,
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
      importCheck({ exclude: [ "applicationinsights-react-js" ] }),
      nodeResolve({ preferBuiltins: true }),
      commonjs({
        namedExports: {
          "node_modules/react/index.js": reactNamedExports,
          "node_modules/react-dom/index.js": ["render"]
        }
      }),
      es3Poly()
    ]
  };

  if (isProduction) {
    nodeRollupConfig.output.file = `dist/${outputName}.min.js`;
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

export default [
  browserRollupConfigFactory(true),
  browserRollupConfigFactory(false),
  nodeUmdRollupConfigFactory(true),
  nodeUmdRollupConfigFactory(false)
];
