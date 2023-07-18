import { createConfig } from "../../rollup.base.config";

const snippetOutputName = "snippet";
const snippetOutputPath = "../../build/output/snippet";

export default createConfig("", 
  {
    namespace: "Microsoft.ApplicationInsights",
    version: "",
    node: {
      entryPoint: snippetOutputName, 
      outputName: snippetOutputPath
    },
    browser: {
      entryPoint: snippetOutputName, 
      outputName: snippetOutputPath,
      formats: [{ format: 'cjs', postfix: '' }]
    },
  },
  [ "applicationinsights-web-snippet" ]
);