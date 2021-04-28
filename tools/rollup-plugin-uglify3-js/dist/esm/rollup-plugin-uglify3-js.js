/*!
 * Application Insights JavaScript SDK - Rollup Uglify3 Plugin, 1.0.0
 * Copyright (c) Microsoft and contributors. All rights reserved.
 */
import * as UglifyJs from 'uglify-js';

function isSourceMapEnabled(options) {
    if (options) {
        return options.sourceMap !== false && options.sourcemap !== false;
    }
    return false;
}
function _doMinify(code, filename, options, chunkOptions) {
    var theCode = {};
    theCode[filename] = code;
    var assign = Object['assign'];
    var theOptions = assign({}, options);
    if (theOptions.hasOwnProperty("sourcemap")) {
        delete theOptions.sourcemap;
    }
    if (isSourceMapEnabled(options)) {
        theOptions.sourceMap = {
            filename: filename
        };
        if (filename) {
            theOptions.sourceMap.url = filename + ".map";
        }
    }
    var result = UglifyJs.minify(theCode, theOptions);
    if (result.error) {
        throw new Error(JSON.stringify(result.error));
    }
    var transform = {
        code: result.code
    };
    if (isSourceMapEnabled(options) && result.map) {
        transform.map = result.map;
    }
    return transform;
}
function uglify(options) {
    if (options === void 0) { options = {}; }
    return {
        name: 'ai-rollup-plugin-uglify3-js',
        renderChunk: function (code, chunk, chkOpt) {
            return _doMinify(code, chunk.filename, options);
        }
    };
}

export { uglify };
