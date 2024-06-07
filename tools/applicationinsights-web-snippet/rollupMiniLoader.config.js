import { createUnVersionedConfig } from "../../rollup.base.config";

const integrityLoaderOutputName = "integrityLoader";
const integrityLoaderOutputPath = "../../build/output/integrityLoader";

export default createUnVersionedConfig("", 
  {
    namespace: "Microsoft.ApplicationInsights",
    version: "",
    browser: {
      entryPoint: integrityLoaderOutputName, 
      outputName: integrityLoaderOutputPath,
      inputPath: "build/output",
      formats: [{ format: 'cjs', postfix: '', useStrict: false, topLevel: true }],
    },
  },
  [ "applicationinsights-web-snippet" ],
  false
);