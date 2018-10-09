// command to create bundle: npx webpack --config webpack.config.js
var webpack = require('webpack');
var package = require('./package.json')
var filename_suffix = "./aisdklite." + package.version;
var filename;
var entry = {};
var plugins = [];
entry.sdk = ["./bundle/index.js"];

module.exports = function (env) {
    if (env.minify) {
        plugins.push(new webpack.optimize.UglifyJsPlugin({
            sourceMap: true,
            mangle: {
                props: {
                    regex: /^_/    
                }
            }
        }));
        filename_suffix = filename_suffix + ".min";
    }

    filename = filename_suffix + ".js";

    return {
        entry: entry,
        mode: "development",
        output: {
            filename: filename,
            libraryTarget: "umd"
        },
        // Enable sourcemaps for debugging webpack's output.
        devtool: "source-map",


        resolve: {
            // Add '.ts' and '.tsx' as resolvable extensions.
            extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js"]
        },

        plugins: plugins,

        module: {
            rules: [
                // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
                {
                    test: /\.js$/,
                    use: ["source-map-loader"],
                    exclude: /node_modules/,
                    enforce: "pre"
                }
            ]
        }
    }
}