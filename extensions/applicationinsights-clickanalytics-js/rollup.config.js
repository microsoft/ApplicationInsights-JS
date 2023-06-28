import { createConfig } from "../../rollup.base.config";
import { updateDistEsmFiles } from "../../tools/updateDistEsm/updateDistEsm";

const version = require("./package.json").version;
const browserOutputName = "ai.clck";
const outputName = "applicationinsights-clickanalytics-js";

const banner = [
  "/*!",
  ` * Application Insights JavaScript SDK - Click Analytics, ${version}`,
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
      entryPoint: outputName,
      outputName: outputName
    },
    browser: {
      entryPoint: outputName,
      outputName: browserOutputName
    }
  },
  [ outputName ], replaceValues, true, false);
