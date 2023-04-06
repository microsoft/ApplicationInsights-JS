import { createUnVersionedConfig } from "../../rollup.base.config";
import { updateDistEsmFiles } from "../../tools/updateDistEsm/updateDistEsm";

const version = require("./package.json").version;
const outputName = "applicationinsights-analytics-js";

const banner = [
  "/*!",
  ` * Application Insights JavaScript SDK - Web Analytics, ${version}`,
  " * Copyright (c) Microsoft and contributors. All rights reserved.",
  " */"
].join("\n");

const replaceValues = {
  "// Copyright (c) Microsoft Corporation. All rights reserved.": "",
  "// Licensed under the MIT License.": ""
};

updateDistEsmFiles(replaceValues, banner, true, true, "dist-es5");

export default createUnVersionedConfig(banner, "Microsoft.ApplicationInsights3", outputName, outputName, [ "applicationinsights-analytics-js" ]);
