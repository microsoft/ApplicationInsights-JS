import { createConfig } from "../rollup.base.config";
import { updateDistEsmFiles } from "../tools/updateDistEsm/updateDistEsm";

const version = require("./package.json").version;
const browserEntryPointName = "index";
const browserOutputName = "aib";
const entryPointName = "index";
const outputName = "applicationinsights-web-basic"; 

const banner = [
  "/*!",
  ` * Application Insights JavaScript Web SDK - Basic, ${version}`,
  " * Copyright (c) Microsoft and contributors. All rights reserved.",
  " */"
].join("\n");

const replaceValues = {
  "// Copyright (c) Microsoft Corporation. All rights reserved.": "",
  "// Licensed under the MIT License.": ""
};

updateDistEsmFiles(replaceValues, banner, true, true, "dist-esm");

export default createConfig(banner, 
  {
    namespace: "Microsoft.ApplicationInsights",
    version: version,
    node: {
      entryPoint: entryPointName,
      outputName: outputName
    },
    browser: {
      entryPoint: browserEntryPointName,
      outputName: browserOutputName,
      formats: [{ format: 'umd', postfix: '' }]
    }
  },
  [ "index" ], replaceValues, true, false);
