import { createConfig } from "../../rollup.base.config";
import { updateDistEsmFiles } from "../../tools/updateDistEsm/updateDistEsm";

const version = require("./package.json").version;
const browserEntryPointName = "applicationinsights-cfgsync-js";
const browserOutputName = "ai.cfgsync";
const entryPointName = "applicationinsights-cfgsync-js";
const outputName = "applicationinsights-cfgsync-js";

const banner = [
    "/*!",
    ` * Application Insights JavaScript SDK - Properties Plugin, ${version}`,
    " * Copyright (c) Microsoft and contributors. All rights reserved.",
    " */"
].join("\n");

const replaceValues = {
    "// Copyright (c) Microsoft Corporation. All rights reserved.": "",
    "// Licensed under the MIT License.": ""
};

updateDistEsmFiles(replaceValues, banner, true, true, "dist-esm");

export default createConfig(banner, {
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
},[ outputName ], replaceValues, true);

  