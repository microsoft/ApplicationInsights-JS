import { createUnVersionedConfig } from "../../rollup.base.config";
import { updateDistEsmFiles } from "../../tools/updateDistEsm/updateDistEsm";

const version = require("./package.json").version;
const entryPointName = "otel-core-js";
const banner = [
  "/*!",
  ` * Application Insights JavaScript SDK - OpenTelemetry Core, ${version}`,
  " * Copyright (c) Microsoft and contributors. All rights reserved.",
  " */"
].join("\n");

const replaceValues = {
  "// Copyright (c) Microsoft Corporation. All rights reserved.": "",
  "// Licensed under the MIT License.": ""
};

updateDistEsmFiles(replaceValues, banner, true, true, "dist-es2020");

export default createUnVersionedConfig(banner, 
  {
    namespace: "Microsoft.ApplicationInsights",
    version: version,
    targetType: "es2020",
    node: {
      entryPoint: entryPointName, 
      outputName: entryPointName
    },
    browser: {
      entryPoint: entryPointName,
      outputName: entryPointName
    },
  },
  [ "otel-core-js" ],
  false
);