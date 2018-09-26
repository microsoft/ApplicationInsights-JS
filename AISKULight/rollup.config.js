import resolve from 'rollup-plugin-node-resolve';

export default [
  {
    input: "bundle/index.js",
    output: {
      file: "dist/aisdklight.js",
      format: "umd",
      name: "aisdklite",
      sourcemap: true
    },
    plugins: [resolve()]
  }
];