import { createUnVersionedConfig } from "../../rollup.base.config";
import { updateDistEsmFiles } from "../../tools/updateDistEsm/updateDistEsm";

const version = require("./package.json").version;
const browserEntryPointName = "applicationinsights-channel-js";
const browserOutputName = "applicationinsights-channel-js";
const entryPointName = "applicationinsights-channel-js";
const outputName = "applicationinsights-channel-js";

const banner = [
  "/*!",
  ` * Application Insights JavaScript SDK - Channel, ${version}`,
  " * Copyright (c) Microsoft and contributors. All rights reserved.",
  " */"
].join("\n");

const replaceValues = {
  "// Copyright (c) Microsoft Corporation. All rights reserved.": "",
  "// Licensed under the MIT License.": ""
};

updateDistEsmFiles(replaceValues, banner, true, true, "dist-esm");

export default createUnVersionedConfig(banner, 
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
  [ "applicationinsights-channel-js" ], replaceValues, true
);
