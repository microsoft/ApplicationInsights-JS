import replace from "@rollup/plugin-replace";
import commonjs from '@rollup/plugin-commonjs';
import { createConfig } from "../../rollup.base.config";
import { updateDistEsmFiles } from "../updateDistEsm/updateDistEsm";
const version = require("./package.json").version;
const inputName = "./dist-es5/applicationinsights-web-snippet";
const snippetInputName = "./dist-es5/snippet";
const snippetOutputName = "snippet";
const snippetOutputPath = "../../build/output/snippet";

const outputName = "applicationinsights-web-snippet";
const distPath = "./dist/es5/";
const banner = [
  "/*!",
  ` * Application Insights JavaScript SDK - Web Snippet, ${version}`,
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
      name: "Microsoft.ApplicationInsights-Web-Snippet",
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

const snippetNodeUmdRollupConfigFactory = () => {
  const nodeRollupConfig = {
    input: `${snippetInputName}.js`,
    output: {
      file: `${distPath}/${snippetOutputName}.js`,
      banner: banner,
      format: "umd",
      name: "Microsoft.ApplicationInsights-Web-Snippet",
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
      name: "Microsoft.ApplicationInsights-Web-Snippet",
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
   
      commonjs({
        include: 'node_modules/**',
        transformMixedEsModules: true
      })
    ]
  };

  return moduleRollupConfig;
};
const replaceValues = {
  "// Copyright (c) Microsoft Corporation. All rights reserved.": "",
  "// Licensed under the MIT License.": ""
};
updateDistEsmFiles(replaceValues, banner, true, true, "dist-es5");

var tasks = [];
tasks =  createConfig(banner, 
  {
    namespace: "Microsoft.ApplicationInsights",
    version: version,
    node: {
      entryPoint: snippetOutputName, 
      outputName: snippetOutputPath
    },
    browser: {
      entryPoint: snippetOutputName, 
      outputName: snippetOutputPath
    },
  },
  [ "applicationinsights-web-snippet" ]
)

tasks.push(nodeUmdRollupConfigFactory());
tasks.push(moduleRollupConfigFactory('esm'));
tasks.push(snippetNodeUmdRollupConfigFactory());

export default tasks;
