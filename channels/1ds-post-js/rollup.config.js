import { createConfig } from "../../rollup.base.config";
import { updateDistEsmFiles } from "../../tools/updateDistEsm/updateDistEsm";

const version = require("./package.json").version;
const inputName = "Index";
const outputName = "ms.post";
const banner = [
    "/*!",
    ` * 1DS JS SDK POST plugin, ${version}`,
    " * Copyright (c) Microsoft and contributors. All rights reserved.",
    " * (Microsoft Internal Only)",
    " */"
].join("\n");

const replaceValues = {
    "// Copyright (c) Microsoft Corporation. All rights reserved.": "",
    "// Licensed under the ISC License.": ""
};

updateDistEsmFiles(replaceValues, banner, true, true, "dist-es5");

export default createConfig(banner, 
    {
        namespace: "oneDS", 
        version: version,
        node: {
            entryPoint: inputName,
            outputName: outputName,
        },
        browser: {
            entryPoint: inputName,
            outputName: outputName
        }
    },
    [ "Index" ],
    true
);
