import nodeResolve from "@rollup/plugin-node-resolve";
import { updateDistEsmFiles } from "../../../tools/updateDistEsm/updateDistEsm";

const version = require("./package.json").version;
const outputName = "ai-test-framework";
const banner = [
  "/*!",
  ` * Application Insights JavaScript SDK - Internal Test Framework, ${version}`,
  " * Copyright (c) Microsoft and contributors. All rights reserved.",
  " */"
].join("\n");

const nodeUmdRollupConfigFactory = () => {
  const nodeRollupConfig = {
    input: `dist-es5/ai-test-framework.js`,
    output: {
      file: `dist/es5/${outputName}.js`,
      banner: banner,
      format: "umd",
      name: "Microsoft.ApplicationInsights",
      extend: true,
      freeze: false,
      sourcemap: true
    },
    plugins: [
      nodeResolve()
    ]
  };

  return nodeRollupConfig;
}

updateDistEsmFiles({}, banner);

export default [
  nodeUmdRollupConfigFactory(),
];
