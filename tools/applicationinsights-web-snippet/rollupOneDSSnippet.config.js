import { createUnVersionedConfig } from "../../rollup.base.config";

const snippetOutputName = "oneDSSnippet";
const snippetOutputPath = "../../build/output/oneDSSnippet";

export default createUnVersionedConfig("", 
  {
    namespace: "Microsoft.ApplicationInsights",
    version: "",
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