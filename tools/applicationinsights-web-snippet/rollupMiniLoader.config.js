import { createUnVersionedConfig } from "../../rollup.base.config";

const miniLoaderOutputName = "miniLoader";
const miniLoaderOutputPath = "../../build/output/miniLoader";

export default createUnVersionedConfig("", 
  {
    namespace: "Microsoft.ApplicationInsights",
    version: "",
    browser: {
      entryPoint: miniLoaderOutputName, 
      outputName: miniLoaderOutputPath,
      inputPath: "build/output",
      formats: [{ format: 'cjs', postfix: '', useStrict: false, topLevel: true }],
    },
  },
  [ "applicationinsights-web-snippet" ],
  false
);