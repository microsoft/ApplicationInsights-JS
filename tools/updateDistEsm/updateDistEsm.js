import dynamicRemove from "@microsoft/dynamicproto-js/tools/rollup/node/removedynamic";
import MagicString from "magic-string";

const fs = require("fs");
const globby = require("globby");

// Remap tslib functions to shim v2.0.0 functions
const remapTsLibFuncs = {
    __extends: "__extendsFn",
    __assign: "__assignFn",
    __rest: "__restFn",
    __spreadArray: "__spreadArrayFn",
    __spreadArrays: "__spreadArraysFn",
    __decorate: "__decorateFn",
    __param: "__paramFn",
    __metadata: "__metadataFn",
    __values: "__valuesFn",
    __read: "__readFn",
    __createBinding: "__createBindingFn",
    __importDefault: "__importDefaultFn",
    __importStar: "__importStarFn",
    __exportStar: "__exportStarFn",
    __makeTemplateObject: "__makeTemplateObjectFn"
};

// You can use the following site to validate the resulting map file is valid
// http://sokra.github.io/source-map-visualization/#custom

// Function to remove the @DynamicProtoStubs and rewrite the headers for the dist-esm files
const getLines = (theValue) => {
    var value = "" + theValue;
    var lines = [];
    var idx = 0;
    var startIdx = 0;
    while (idx < value.length) {
        // Skip blank lines
        while (
            idx < value.length &&
            (value[idx] === "\n" || value[idx] === "\r")
        ) {
            idx++;
        }

        startIdx = idx;
        while (
            idx < value.length &&
            !(value[idx] === "\n" || value[idx] === "\r")
        ) {
            idx++;
        }

        var len = idx - startIdx;
        if (len > 0) {
            var line = value.substring(startIdx, idx);
            if (line.trim() !== "") {
                lines.push({
                    value: line,
                    idx: startIdx,
                    len: len
                });
            }
        }
    }

    return lines;
};

function replaceTsLibImports(orgSrc, src, theString) {
    // replace tslib import usage with "import { xxx, xxx } from "tslib";
    const detectTsLibUsage = /import[\s]*\{([^}]*)\}[\s]*from[\s]*\"tslib\";/g;
    let matches = detectTsLibUsage.exec(orgSrc);
    while (matches != null) {
        let newImports = [];
        let imports = matches[1];
        let tokens = imports.trim().split(",");
        tokens.forEach((token) => {
            let theToken = token.trim();
            let remapKey = remapTsLibFuncs[theToken];
            if (!remapKey) {
                throw (
                    'Unsupported tslib function "' +
                    theToken +
                    '" detected from -- ' +
                    matches[0] +
                    ""
                );
            }

            newImports.push(remapKey + " as " + theToken);
        });

        let newImport =
            "import { " +
            newImports.join(", ") +
            ' } from "@microsoft/applicationinsights-shims";';
        var idx = orgSrc.indexOf(matches[0]);
        if (idx !== -1) {
            console.log(`Replacing [${matches[0]}] with [${newImport}]`);
            theString.overwrite(idx, idx + matches[0].length, newImport);
            src = src.replace(matches[0], newImport);
        }

        // Find next
        matches = detectTsLibUsage.exec(orgSrc);
    }

    return src;
}

function replaceTsLibStarImports(orgSrc, src, theString) {
    // replace tslib import usage with "import { xxx, xxx } from "tslib";
    const detectTsLibUsage =
        /import[\s]*\*[\s]*as[\s]*([^\s]*)[\s]*from[\s]*\"tslib\";/g;
    let matches = detectTsLibUsage.exec(orgSrc);
    while (matches != null) {
        let newImports = [];
        let importPrefix = matches[1].trim();

        let importLen = importPrefix.length + 1;
        let idx = orgSrc.indexOf(importPrefix + ".");
        while (idx !== -1) {
            let funcEnd = orgSrc.indexOf("(", idx + importLen);
            if (funcEnd !== -1) {
                let funcName = orgSrc.substring(idx + importLen, funcEnd);
                let newImport = remapTsLibFuncs[funcName];
                if (!newImport) {
                    throw (
                        'Unsupported tslib function "' +
                        orgSrc.substring(idx, funcEnd) +
                        '" detected from -- ' +
                        matches[0]
                    );
                }

                // Add new import, if not already present
                if (newImports.indexOf(newImport) == -1) {
                    newImports.push(newImport);
                }

                let matchedValue = orgSrc.substring(idx, funcEnd + 1);
                let newValue = newImport + "(";
                console.log(
                    `Replacing Usage [${matchedValue}] with [${newValue}]`
                );
                theString.overwrite(idx, idx + matchedValue.length, newValue);

                // replace in the new source output as well
                src = src.replace(matchedValue, newValue);
            }

            // Find next usage
            idx = orgSrc.indexOf(importPrefix + ".", idx + importLen);
        }

        let newImport =
            "import { " +
            newImports.join(", ") +
            ' } from "@microsoft/applicationinsights-shims";';
        idx = orgSrc.indexOf(matches[0]);
        console.log(`Replacing [${matches[0]}] with [${newImport}]`);
        theString.overwrite(idx, idx + matches[0].length, newImport);
        src = src.replace(matches[0], newImport);

        // Find next
        matches = detectTsLibUsage.exec(orgSrc);
    }

    return src;
}

function removeDynamicProtoStubs(orgSrc, src, theString, inputFile) {
    const dynRemove = dynamicRemove();
    var result = dynRemove.transform(orgSrc, inputFile);
    if (result !== null && result.code) {
        src = result.code;
        console.log("Prototypes removed...");

        // Figure out removed lines
        var orgLines = getLines(orgSrc);
        var newLines = getLines(result.code);
        var line = 0;
        var newLine = 0;
        while (line < orgLines.length) {
            var matchLine = orgLines[line];
            var matchNewLine = newLines[newLine];
            var replaceText = "";
            line++;
            if (matchLine.value === matchNewLine.value) {
                newLine++;
            } else {
                console.log("Line Changed: " + matchLine.value);
                var endFound = false;
                var endLine = 0;
                // Skip over removed lines (There may be more than 1 function being removed)
                for (
                    var nextLp = 0;
                    endFound === false && newLine + nextLp < newLines.length;
                    nextLp++
                ) {
                    if (newLine + nextLp < newLines.length) {
                        for (var lp = 0; line + lp < orgLines.length; lp++) {
                            if (
                                orgLines[line + lp].value ===
                                newLines[newLine + nextLp].value
                            ) {
                                endFound = true;
                                for (var i = 0; i < nextLp; i++) {
                                    if (replaceText.length) {
                                        replaceText += "\n";
                                    }
                                    replaceText += newLines[newLine + i].value;
                                }
                                endLine = line + lp;
                                newLine = newLine + nextLp;
                                break;
                            }
                        }
                    }
                }

                if (endFound) {
                    console.log(
                        "Detected Removed lines " + line + " to " + endLine
                    );
                    theString.overwrite(
                        matchLine.idx,
                        orgLines[endLine - 1].idx + orgLines[endLine - 1].len,
                        replaceText
                    );
                    line = endLine;
                } else {
                    throw "Missing line - " + matchLine.value;
                }
            }
        }
    }

    return src;
}

function fixIEDynamicProtoUsage(orgSrc, src, theString) {
    // find all "dynamicProto(<classname>," usages
    // Then find all "class <classname> " usages and append a static variable after the name

    const dynamicProtoUsage = /dynamicProto\s*\(\s*(\w*)\s*,/g;
    let matches = dynamicProtoUsage.exec(orgSrc);
    while (matches != null) {
        let className = matches[1].trim();

        let hasProperty = new RegExp("^\\s*" + className + "\\.\\w+\\s*", "gm");
        let hasPropertyMatches = hasProperty.exec(src);
        if (!hasPropertyMatches) {

            if (orgSrc.indexOf(" return " + className + ";") === -1) {
                throw "return " + className + "; -- doesn't exist!!! -- " + orgSrc;
            }
    
            let classRegEx = new RegExp("^\\s*return\\s+" + className + ";", "gm");
            let classMatches = classRegEx.exec(orgSrc);
            if (!classMatches) {
                throw ('Unable to locate class definition for "' + className + '" using ' + classRegEx + ' detected from -- ' + matches[0] + ' -- ' + classMatches + " in \n" + orgSrc);
            }
    
            let newClass = 
                "\n    // This is a workaround for an IE8 bug when using dynamicProto() with classes that don't have any" + 
                "\n    // non-dynamic functions or static properties/functions when using uglify-js to minify the resulting code." +
                "\n    // this will be removed when ES3 support is dropped." + 
                "\n    " + className + ".__ieDyn=1;" + 
                "\n" + classMatches[0];
    
            var idx = orgSrc.indexOf(classMatches[0]);
            if (idx !== -1) {
                console.log(`Replacing [${classMatches[0]}] with [${newClass}]`);
                theString.overwrite(idx, idx + classMatches[0].length, newClass);
                src = src.replace(classMatches[0], newClass);
            }

        } else {
            console.log("dynamicProto class has property or function -- " + hasProperty + " found " + hasPropertyMatches[0]);
        }

        // Find next
        matches = dynamicProtoUsage.exec(orgSrc);
    }

    return src;
}

const updateDistEsmFiles = (
    replaceValues,
    banner,
    replaceTsLib = true,
    removeDynamic = true,
    buildPath = "dist-esm"
) => {
    console.log(`UpdateDistEsmFiles: ./${buildPath}/**/*.js`);
    if (!fs.existsSync(`./${buildPath}`)) {
        console.error(`Build path does not exist ./${buildPath} - from:${process.cwd()}`);
        process.exit(10);
    }
    const files = globby.sync(`./${buildPath}/**/*.js`);
    files.map((inputFile) => {
        console.log("Loading - " + inputFile);
        var src = fs.readFileSync(inputFile, "utf8");
        var mapFile;
        if (inputFile.endsWith(".js")) {
            mapFile = inputFile + ".map";
        }

        var orgSrc = src;
        var theString = new MagicString(orgSrc);

        if (removeDynamic) {
            src = removeDynamicProtoStubs(orgSrc, src, theString, inputFile);
        }

        if (replaceTsLib) {
            // replace any tslib imports with the shims module versions
            src = replaceTsLibImports(orgSrc, src, theString);
            src = replaceTsLibStarImports(orgSrc, src, theString);
        }

        src = fixIEDynamicProtoUsage(orgSrc, src, theString);

        // Replace the header
        Object.keys(replaceValues).forEach((value) => {
            src = src.replace(value, replaceValues[value]);
            var idx = orgSrc.indexOf(value);
            if (idx !== -1) {
                theString.overwrite(
                    idx,
                    idx + value.length,
                    replaceValues[value]
                );
            }
        });

        // Rewrite the file

        // Remove any force banner from the file
        let replaceBanner = banner.replace("/*!", "/*");
        theString.prepend(replaceBanner + "\n");
        src = replaceBanner + "\n" + src;

        src = src.trim();
        if (orgSrc !== src) {
            fs.writeFileSync(inputFile, src);
            if (mapFile) {
                var newMap = theString.generateMap({
                    source: inputFile.toString(),
                    file: mapFile,
                    includeContent: true,
                    hires: false
                });

                console.log("Rewriting Map file - " + mapFile);
                fs.writeFileSync(mapFile, newMap.toString());
            }
        }
    });
};

export { updateDistEsmFiles };
