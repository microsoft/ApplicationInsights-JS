import { createConfig } from "../../rollup.base.config";
import { updateDistEsmFiles } from "../../tools/updateDistEsm/updateDistEsm";

const version = require("./package.json").version;
const browserEntryPointName = "applicationinsights-perfmarkmeasure-js";
const browserOutputName = "ai.prfmm-mgr";
const entryPointName = "applicationinsights-perfmarkmeasure-js";
const outputName = "applicationinsights-perfmarkmeasure-js"; 

const verParts = version.split("-")[0].split(".")
if (verParts.length != 3) {
  throw "Invalid Version! [" + version + "]"
}

const banner = [
  "/*!",
  ` * Application Insights JavaScript SDK - Performance Mark and Measure Manager plugin, ${version}`,
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
      outputName: browserOutputName
    }
  },
  [ "applicationinsights-perfmarkmeasure-js" ], replaceValues, false);
