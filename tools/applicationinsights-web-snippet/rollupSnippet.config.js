import { createUnVersionedConfig } from "../../rollup.base.config";

const snippetOutputName = "snippet";
const snippetOutputPath = "../../build/output/snippet";

export default createUnVersionedConfig("", 
  {
    namespace: "Microsoft.ApplicationInsights",
    version: "",
    browser: {
      entryPoint: snippetOutputName, 
      outputName: snippetOutputPath,
      inputPath: "build/output",
      formats: [{ format: 'cjs', postfix: '', useStrict: false }],
    },
  },
  [ "applicationinsights-web-snippet" ],
  false
);