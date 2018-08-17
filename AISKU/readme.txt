To generate the minified bundle:
1. Complete build> grunt aisku
2. Copy over contents of bundle directory under node_Modules\ for all appinsights packages and drop into aisku\amd\bundle.
3. Run > npx webpack --config webpack-dev.config.js  to generate the bundle files under AISKU\dist foldre.
Finally, run grunt snippetvnext to generated the minified bootstrap script under AISKU\dist folder.