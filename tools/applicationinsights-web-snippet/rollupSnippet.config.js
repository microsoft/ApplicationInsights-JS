import { createUnVersionedConfig } from "../../rollup.base.config";

const version = require("./package.json").version;
const snippetOutputName = "snippet";
const snippetOutputPath = "../../build/output/snippet";

export default createUnVersionedConfig("", 
  {
    namespace: "Microsoft.ApplicationInsights",
    version: version,
    browser: {
      entryPoint: snippetOutputName, 
      outputName: snippetOutputPath,
      inputPath: "build/output",
      formats: [{ format: 'cjs', postfix: '', useStrict: false, topLevel: true }],
    },
  },
  [ "applicationinsights-web-snippet" ],
  false
);