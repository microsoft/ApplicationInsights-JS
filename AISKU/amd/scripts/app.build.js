// to generate single file, run from the scripts directory > r.js.cmd -o app.build.js
// Run npm install requirejs to get r.js.cmd
({
    findNestedDependencies: true,
    baseUrl: "../bundle", // all dependencies should be copied from bundle/ to bundle folder
    optimize: "none", // change to uglify to generate minified code
    out: "aisdkfinal.min.js",
    include: ["Init"]
});