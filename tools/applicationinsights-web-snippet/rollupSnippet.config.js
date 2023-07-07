import { es5Poly, es5Check, importCheck } from "@microsoft/applicationinsights-rollup-es5";
import replace from "@rollup/plugin-replace";
import { uglify } from "@microsoft/applicationinsights-rollup-plugin-uglify3-js";
import cleanup from "rollup-plugin-cleanup";
const nodeUmdRollupConfigFactory = () => {
  const inputName = "./dist-es5/snippet";
  const outputName = "snippet";
  const distPath = "./build/output/";
  const prodOutputPath = `./build/output/snippet.min.js`;
  const nodeRollupConfig = {
      input: inputName,
      output: {
        file: `${distPath}node/${outputName}.js`,
        name: "Microsoft.ApplicationInsights",
          format: "umd",
          banner: "",
          extend: true,
          freeze: false,
          sourcemap: false,
      },
      plugins: [
          replace({
              preventAssignment: true
          }),
          cleanup({
            comments: [
              'some', 
              /^.\s*@DynamicProtoStub/i,
              /^\*\*\s*@class\s*$/
            ]
          }),
          es5Poly(),
          es5Check()
          ]
      };
      nodeRollupConfig.output.file = prodOutputPath;
      nodeRollupConfig.plugins.push(
          uglify({
              ie8: false,
              ie: true,
              toplevel: true,
              compress: {
                  ie: true,
                  passes:3,
                  unsafe: true
              },
              output: {
                  ie: true,
                  preamble: "",
                  webkit:true,
                  comments: [/^@preserve/]
              }
          })
      );
  return nodeRollupConfig;
};
export default [
  nodeUmdRollupConfigFactory()
];