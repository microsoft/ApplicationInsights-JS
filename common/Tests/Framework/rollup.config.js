import nodeResolve from "@rollup/plugin-node-resolve";

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
    input: `dist-esm/src/ai-test-framework.js`,
    output: {
      file: `dist/${outputName}.js`,
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

export default [
  nodeUmdRollupConfigFactory(),
];
