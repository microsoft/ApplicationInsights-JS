const fs = require("fs");
const path = require("path");
const globby = require("globby");

var MAX_IMPORT_LENGTH = 140;
var IMPORT_INDENT_PREFIX = "    ";

function _createRegEx(value, global) {
    // Converts a string into a global regex, escaping any special characters
    var regExValue = value.replace(/\\/g, "\\\\");
    regExValue = regExValue.replace(/([\+\?\|\{\}\[\]\(\)\^\$\#\.\=\!\:\/\*])/g, "\\$1");
    return new RegExp(regExValue, global ? 'g' : '');
}

function _createNameRegExs(name) {
    // Converts a string into a global regex, escaping any special characters
    var regExValue = name.replace(/\\/g, "\\\\");
    regExValue = regExValue.replace(/([\+\?\|\{\}\[\]\(\)\^\$\#\.\=\!\:\/\*])/g, "\\$1");

    var funcMatches = [];
    funcMatches.push(new RegExp("([\\.\\w]*)(\\." + regExValue + ")([\\(\\)\\s+.,;\\[])", ''));
    funcMatches.push(new RegExp("^(\\s+)(" + regExValue + ")(:\\s([\\(\\w][^,;]+),?)", ''));

    return funcMatches;
}

function _createEnumNamesRegEx(eName, global) {
    var regExValue = eName.replace(/\\/g, "\\\\");
    regExValue = regExValue.replace(/([\+\?\|\{\}\[\]\(\)\^\$\#\.\=\!\:\/\*])/g, "\\$1");
    return new RegExp("\\[" + regExValue + "\\.(\\w+)\\]:\\s*\\\"(\\w*)\\\"", global ? "gm" : "");
}

function _createRevertRegEx(name, global) {
    // Converts a string into a global regex, escaping any special characters
    var regExValue = name.replace(/\\/g, "\\\\");
    regExValue = regExValue.replace(/([\+\?\|\{\}\[\]\(\)\^\$\#\.\=\!\:\/\*])/g, "\\$1");
    return new RegExp("(" + regExValue + ")\\s\\/\\*\\s@[mM]in\\:([^\\s]+)\\s\\*\\/", global ? 'gm' : '');
}

function _createImportNameUsage(name) {
    var regExValue = name.replace(/\\/g, "\\\\");
    regExValue = regExValue.replace(/([\+\?\|\{\}\[\]\(\)\^\$\#\.\=\!\:\/\*])/g, "\\$1");
    return new RegExp("\\w?" + regExValue + "\\w?", "gm");
}

const encodeValues = ".();[]:";
const defaultReplace = [
    {
        src: "./shared/AppInsightsCore/src/JavaScriptSDK.Enums/SdkCoreNames.ts",
        import: "@microsoft/applicationinsights-core-js"
    }
];

const defaultInternalConstants = [
    "./src/InternalConstants.ts"
];

function resolvePath(theOptions, thePath) {
    if (!path.isAbsolute(thePath)) {
        return path.join(process.cwd() || ".", theOptions.projectRoot || ".", thePath);
    }

    return thePath;
}

function readSourceMap(theReplacements, src, from) {
    const getNames = /export const (\w+)\s+=\s+createEnumMap<typeof\s(\w+)\s*,\s*\{/gm;

    var matches = getNames.exec(src);
    while (matches != null) {
        var name = matches[1];
        var eName = matches[2];
        if (name && eName) {
            var replacement = {
                names: [],
                replaceStr: "[" + name + "[" + eName + ".$1]]",
                imports: [ eName, name ],
                from: from
            };

            var getValues = _createEnumNamesRegEx(eName, true);
            var nameMatches = getValues.exec(src);
            while (nameMatches != null) {
                var eValue = nameMatches[1];
                var sValue = nameMatches[2];

                if (eValue && sValue && eValue === sValue) {
                    replacement.names.push(eValue);
                } else {
                    throw "Unable to parse or incorrect Names definition for [" + name + "[" + eName + "." + eValue + "]] => [" + sValue + "] string and enum value MUST be the same!";
                }

                nameMatches = getValues.exec(src);
            }

            theReplacements.push(replacement);
        }

        matches = getNames.exec(src);
    }
}

function readInternalConstants(theReplacements, src, from) {
    const getConstStrings = /export\sconst\s(\w+)\s=\s\"(\w*)";/gm

    var matches = getConstStrings.exec(src);
    while (matches != null) {
        var exportedName = matches[1];
        var constValue = matches[2];
        if (exportedName && constValue) {
            var replacement = {
                names: [ constValue ],
                replaceStr: "[" + exportedName + "]",
                imports: [ exportedName ],
                from: from
            };

            theReplacements.push(replacement);
        }

        matches = getConstStrings.exec(src);
    }
}

function removeUnusedImports(parsedFile) {
    //const detectImports = /^import[\s]*\{([^}]*)\}[\s]*from[\s]*\"(.*)\";$/gm;

    let orgSrc = parsedFile.src;
    var changed = false;

    for (var lp = 0; lp < parsedFile.imports.length; lp++) {
        var theImports = parsedFile.imports[lp];
        if (theImports.type === 2) {
            var newValues = [];
            theImports.values.forEach((token) => {
                var theToken = token.trim();
                var orgToken = theToken;
                var ignore = theToken.indexOf(" ") !== -1 || theToken.indexOf(",") !== -1;
                if (theToken.indexOf(" as ") !== -1) {
                    ignore = true;
                    var parts = theToken.split(" ");
                    if (parts.length === 3 && parts[1].trim() === "as") {
                        theToken = parts[2].trim();
                        ignore = false;
                    }
                }

                var isUsed = !!orgToken;
                if (isUsed && !ignore) {
                    isUsed = false;
                    var importCheck = _createImportNameUsage(theToken);
                    var matches = importCheck.exec(orgSrc);
                    while (!isUsed && matches != null) {
                        if (matches[0] === theToken) {
                            isUsed = true;
                            break;
                        }

                        matches = importCheck.exec(orgSrc);
                    }
                }

                if (orgToken && isUsed) {
                    newValues.push(orgToken);
                } else {
                    changed = true;
                }
            });

            theImports.values = newValues;
        }
    }

    if (changed) {
        parsedFile.changed = true;
    }
}

function isIgnoreLine(theLine, position, length) {
    let idx = theLine.indexOf("//");
    if (idx !== -1) {
        if (idx < position) {
            return true;
        }
    
        if (theLine.substring(idx).toLowerCase().indexOf("@skip-minify") !== -1) {
            // We need to ignore this entire line
            return true;
        }
    }

    return isInQuoteOrComment(theLine, position);
}

function isInQuoteOrComment(theLine, position) {
    var len = theLine.length;
    var inString = null;
    var inEscape = false;
    var inComment = false;
    var idx = 0;

    // Check if we appear to be "within" a multi-line comment
    var matches = /\s+\*/.exec(theLine);
    if (matches !== null) {
        inComment = true;
        idx = matches[0].length + 1;
    }

    while (idx < position && idx < len) {
        var ch = theLine[idx];
        var nextCh = idx + 1 < len ? theLine[idx + 1] : null;
        if (!inString && !inComment) {
            if (ch === "\"" || ch === "'") {
                // Start of a string
                inString = ch;
            } else if (ch === "/") {
                if (nextCh === "/") {
                    // start of single line comment
                    return true;
                } else if (nextCh === "*") {
                    // Start of a multi-line comment
                    inComment = true;
                    idx++;
                }
            }
        } else if (inComment) {
            // we are in a multi-line comment
            if (ch === "*") {
                if (nextCh === "/") {
                    // End of multi-line comment
                    inComment = false;
                    idx++;
                }
            }
        } else if (inString && !inEscape) {
            // We are in a quote
            if (inString === ch) {
                // End of string
                inString = null;
            } else if (ch === "\\") {
                inEscape = true;
            }
        } else {
            inEscape = false;
        }

        if (!inString) {
            inEscape = false;
        }

        idx++;
    }

    // If we are in a string or comment then ignore
    return !!inString || !!inComment;
}

function isIgnoreType(parsedFile, value) {
    if (value) {
        value = value.trim();
        if (value.endsWith(",")) {
            value = value.substring(0, value.length - 1).trim();
        }
    
        if (value === "string" || 
                value === "number" || 
                value === "void" || 
                value === "string[]" || 
                value === "number[]" || 
                value === "Function" || 
                value === "VoidFunction" || 
                value === "RegEx") {
            return true;
        }

        if (/\s*=[^>]/.exec(value) != null) {
            // looks like an assignment
            return true;
        }
    
        if (parsedFile.imports.length > 0) {
    
            for (var lp = 0; lp < parsedFile.imports.length; lp++) {
                var theImports = parsedFile.imports[lp];
    
                if (theImports && theImports.values) {
                    for (var idx = 0; idx < theImports.values.length; idx++) {
                        var theToken = theImports.values[idx].trim();
                        var ignore = theToken.indexOf(" ") !== -1 || theToken.indexOf(",") !== -1;
                        if (theToken.indexOf(" as ") !== -1) {
                            ignore = true;
                            var parts = theToken.split(" ");
                            if (parts.length === 3 && parts[1].trim() === "as") {
                                theToken = parts[2].trim();
                                ignore = false;
                            }
                        }
        
                        if (!ignore && value === theToken) {
                            return true;
                        }
                    }
                }
            }
        }
    }

    return false;
}

function isInInterface(parsedFile, lines, lineNo) {

    while (lineNo > 0) {
        let theLine = lines[--lineNo];

        var pos = theLine.indexOf("interface ");
        if (pos !== -1 && !isInQuoteOrComment(theLine, pos)) {
            return true;
        }

        pos = theLine.indexOf("function ");
        if (pos !== -1 && !isInQuoteOrComment(theLine, pos)) {
            return false;
        }
    }

    return false;
}

function replaceValues(parsedFile, theName, values) {
    var newContent = "";
    var lines = parsedFile.src.split("\n");
    var changed = false;
    var skipNextLine = false;
    var funcMatches = _createNameRegExs(theName);
    var lp = 0;
    while (lp < lines.length) {
        var theLine = lines[lp++];
        var orgLine = theLine;

        if (!skipNextLine) {
            funcMatches.forEach((funcMatch) => {
                var matches;
                var pos = 0;

                while (pos < theLine.length && (matches = funcMatch.exec(theLine.substring(pos))) !== null) {
                    var found = matches.index + pos;
                    var value = matches[0];
                    var prefix = matches[1];
                    var replaceTag = " /* @min:" + _encodeReplacement(matches[2]) + " */";
                    var trail = matches[3];
                    var trailType = matches[4];
                    var canChange = true;

                    if (prefix) {
                        // Jump over the prefix
                        found += prefix.length;
                        value = value.substring(prefix.length);
                        if (prefix.startsWith("..")) {
                            // Looks like the spread operator "..." was probably used
                            canChange = false;
                        } else if (values && values.imports) {
                            if (values.imports.indexOf(prefix) !== -1) {
                                canChange = false;
                            }
                        }
                    }

                    if (trailType) {
                        // Don't change lines that are using an imported type or look like a parameter / interface definition
                        canChange = canChange && !isIgnoreType(parsedFile, trailType) && !isInInterface(parsedFile, lines, lp);
                    }
                    
                    // Don't change commented lines or if the line has been tagged to skip
                    var canChange = canChange && !isIgnoreLine(theLine, found, value.length);
                    if (canChange) {
                        var replaceValue = values.replaceStr.replace("$1", theName);
                        var newValue = replaceValue + replaceTag + trail;
                        theLine = theLine.substring(0, found) + newValue + theLine.substring(found + value.length);
                        pos = found + newValue.length;
                    } else {
                        pos = found + value.length;
                    }
                }
            });
        }

        newContent += theLine + "\n";
        if (orgLine != theLine) {
            changed = true;
        }

        skipNextLine = false;
        var idx = orgLine.indexOf("//");
        if (idx !== -1) {
            if (orgLine.substring(idx).toLowerCase().indexOf("@skip-minify-next-line") !== -1) {
                skipNextLine = true;
            }
        }
    }

    if (changed) {
        parsedFile.src = newContent;
    }

    return changed;
}

function _encodeReplacement(value) {
    var result = encodeURIComponent(value);
    for (var lp = 0; lp < encodeValues.length; lp++) {
        result = result.replace(_createRegEx(encodeValues.substr(lp, 1), true), "%" + encodeValues.charCodeAt(lp).toString(16));
    }

    return result;
}

function _decodeReplacement(value) {
    var result = value;
    for (var lp = 0; lp < encodeValues.length; lp++) {
        result = result.replace(_createRegEx("%" + encodeValues.charCodeAt(lp).toString(16), true), encodeValues.substr(lp, 1));
    }
    return decodeURIComponent(result);
}

// { 
//     names: [ "initialize", "processTelemetry", "isInitialized", "setNextPlugin", "teardown" ], 
//     replaceStr: "PluginNames[ePluginNames.$1]", 
//     imports: [ "ePluginNames", "PluginNames" ],
//     from: "./JavaScriptSDK.Enums/PluginNames"
// }
function replaceNames(parsedFile, theOptions, values) {

    var newImports = [];
    var changed = false;
    for (var lp = 0; lp < values.names.length; lp++) {
        var theName = values.names[lp];
        if (replaceValues(parsedFile, theName, values)) {
            changed = true;
        }

        if (changed && values.imports && values.from) {
            newImports.push({ imports: values.imports, from: values.from });
        }
    }

    if (changed) {
        parsedFile.changed = true;

        addImports(parsedFile, theOptions, newImports);
    }
}

// { 
//     names: [ "initialize", "processTelemetry", "isInitialized", "setNextPlugin", "teardown" ], 
//     replaceStr: "PluginNames[ePluginNames.$1]", 
//     imports: [ "ePluginNames", "PluginNames" ],
//     from: "./JavaScriptSDK.Enums/PluginNames"
// }
function reverseNames(parsedFile, values) {
    var src = parsedFile.src;
    var orgSrc = src;
    var changed = false;
    for (var lp = 0; lp < values.names.length; lp++) {
        var theName = values.names[lp];
        var newValue = values.replaceStr.replace("$1", theName);
        var reverseRegEx = _createRevertRegEx(newValue, true);

        src = src.replace(reverseRegEx, function(matches, g1, g2) {
            return _decodeReplacement(g2);
        });

        if (src != orgSrc) {
            changed = true;
        }
    }

    if (changed) {
        parsedFile.src = src;
        parsedFile.changed = true;
    }
}

function insertImport(theImports, original, src, values, type) {

    if (type === 2) {
        // Only try and merge specifically listed / exported imports
        for (var lp = 0; lp < theImports.length; lp++) {
            if (theImports[lp].src === src && theImports[lp].type === type) {
                for (var idx = 0; idx < values.length; idx++) {
                    var newValue = values[idx].trim();
                    if (newValue && theImports[lp].values.indexOf(newValue) === -1) {
                        theImports[lp].values.push(newValue);
                    }
                }

                theImports[lp].values.sort();
                return theImports[lp];
            }
        }

        var newValues = [];
        for (var lp = 0; lp < values.length; lp++) {
            var value = values[lp].trim();
            if (value) {
                newValues.push(value);
            }
        }
        
        values = newValues;

        values.sort();
    }

    theImports.push({
        org: original,
        src: src.trim(),
        values: values,
        type: type
    });

    return theImports;
}

function extractComments(src) {
    var commentRegEx = /(\/\/([^\n]*)\n|\/\*(\*?([\w\s,-]+|\n\s*\*)*)\*\/)/gm;

    var comments = [];
    var matches = commentRegEx.exec(src);
    while (matches != null) {
        comments.push({
            full: matches[0],
            single: matches[2],
            multi: matches[3]
        });

        matches = commentRegEx.exec(src);
    }

    return comments;
}

function extractImports(src, theImports) {
    let extractAllImports = /^[ \t]*import\s*(\{([^}]+)\}|([^;]+)|(\*))[\s]*from[\s]*\"(.*)\"(.*)$/gm;

    var orgSrc = src;
    var matches = extractAllImports.exec(orgSrc);
    while (matches != null) {
        var from = matches[5];
        var type = 0;
        var values = null;
        var comments = extractComments(matches[0]);
        // Leave commented imports alone (type === 0)
        if (comments.length === 0) {
            if (matches[2]) {
                type = 2;       // Normal import (type === 2)
                values = matches[2].replace(/\n/g, "").trim().split(",");
            } else if (matches[1]) {
                // default, star or mixed import -- leave this one alone (type === 1)
                values = [ matches[1].trim() ];
                type = 1;
            }
        }

        // Remove the import from the source file
        src = src.replace(matches[0], "--Removed--");
        src = src.replace(/--Removed--[\r\n]+/g, "");
        insertImport(theImports, matches[0], from, values, type);

        matches = extractAllImports.exec(orgSrc);
    }

    return src.trim();
}

function extractBanner(src, theBanner) {
    var lines = src.split("\n");
    var idx = 0;
    while (idx < lines.length) {
        var theLine = lines[idx].trim();

        if (theLine.startsWith("import") || 
                theLine.startsWith("export") ||
                theLine.startsWith("interface") ||
                theLine.startsWith("class") ||
                theLine.startsWith("declare") ||
                theLine.startsWith("type") ||
                theLine.startsWith("let") || 
                theLine.startsWith("(") || 
                theLine.startsWith("var") || 
                theLine.startsWith("const") || 
                theLine.startsWith("function")) {
            // We hit an import or the start of some code
            break;
        }

        idx++;
        theBanner.push(theLine);

        if (theLine.length === 0) {
            // Stop at first blank line keeping the blank line
            break;
        }
    }

    // Some files have a blank line before the existing use strict
    if (lines[idx].trim().startsWith("\"use strict\";")) {
        theBanner.push(lines[idx]);
        idx++;
    }

    var body = "";
    while(idx < lines.length) {
        body += lines[idx++] + "\n";
    }

    return body;
}

function parseFile(filename, src) {

    var theImports = [];
    var theBanner = [];
    var newSrc = extractBanner(src, theBanner)
    newSrc = extractImports(newSrc, theImports);

    return {
        name: filename,
        orgSrc: src,
        src: newSrc,
        banner: theBanner,
        imports: theImports,
        changed: false
    };
}

function formatImport(theImport, maxImportWidth) {
    var newImport =  theImport.org + "\n";

    if (theImport.type === 2) {
        if (theImport.values.length > 0) {
            theImport.values.sort();
            newImport = "import { " + theImport.values.join(", ") + " } from \"" + theImport.src + "\";\n";
            if (newImport.length > maxImportWidth) {
                newImport = "import {\n";
                var theImports = theImport.values.join(", ");
                var importLines = [];
                while (theImports.length > maxImportWidth - 4) {
                    var idx = maxImportWidth - 4;
                    // Find the last index
                    while(theImports[idx] !== ',') {
                        idx--;
                    }
                    importLines.push(IMPORT_INDENT_PREFIX + theImports.substring(0, idx + 1));
                    theImports = theImports.substring(idx + 1).trim();
                }
                importLines.push(IMPORT_INDENT_PREFIX + theImports);
                newImport += importLines.join("\n") + "\n";
                newImport += "} from \"" + theImport.src + "\";\n";
            }
        } else {
            // Nothing to be imported so don't emit the import
            newImport = "";
        }
    }

    return newImport;
}

function formatFile(parsedFile, maxImportWidth) {
    var newContent = "";
    if (parsedFile.banner.length > 0) {
        newContent += parsedFile.banner.join("\n") + "\n";
    }

    if (parsedFile.imports.length > 0) {

        parsedFile.imports.sort(function (a, b) {
            if (a.type === b.type) {
                if (a.src.startsWith("@")) {
                    if (b.src.startsWith("@")) {
                        return a.src > b.src ? 1 : -1;
                    }
    
                    return -1;
                } else if (b.src.startsWith("@")) {
                    return 1;
                }
    
                return a.src > b.src ? 1 : -1;
            }
    
            return a.type - b.type;
        });

        for (var lp = 0; lp < parsedFile.imports.length; lp++) {
            newContent += formatImport(parsedFile.imports[lp], maxImportWidth);
        }

        newContent += "\n";
    }

    newContent += parsedFile.src.trim() + "\n";

    return newContent;
}

function resolveImportPath(parsedFile, theOptions, importPath) {
    if (importPath.startsWith(".")) {
        var filePath = resolvePath(theOptions, parsedFile.name);
        importPath = resolvePath(theOptions, importPath);
        var relative = path.relative(path.dirname(filePath), importPath).replace(/\\/g, "/");
        if (!relative.startsWith(".")) {
            relative = "./" + relative;
        }

        return relative;
    }

    return importPath;
}

function addImports(parsedFile, theOptions, newImports) {
    var theImports = parsedFile.imports;
    for (var lp = 0; lp < newImports.length; lp++) {
        var importPath = resolveImportPath(parsedFile, theOptions, newImports[lp].from);
        insertImport(theImports, "<dynamic import>", importPath, newImports[lp].imports, 2);
    }
}

// -----------------------------------------------------
// Grunt Task
// -----------------------------------------------------

function isUndefined(value) {
    return value == "undefined" || typeof value === "undefined";
}

function getGruntMultiTaskOptions(grunt, theTask) {
    var taskOptions = theTask.data;
    if (!taskOptions) {
        taskOptions = (grunt.config.getRaw(theTask.name + "." + theTask.target) || {});
    }

    return taskOptions;
}

function resolveValue(value1, value2, defaultValue) {
    var value = value1;
    if (isUndefined(value)) {
        value = value2;
    }

    if (isUndefined(value)) {
        value = defaultValue;
    }

    return value;
}

function dumpObj(object, format) {
    var objectTypeDump = Object.prototype.toString.call(object);
    var propertyValueDump = "";
    if (objectTypeDump === "[object Error]") {
        propertyValueDump = "{ stack: '" + object.stack + "', message: '" + object.message + "', name: '" + object.name + "'";
    }
    else {
        if (format) {
            if (typeof format === "number") {
                propertyValueDump = JSON.stringify(object, null, format);
            }
            else {
                propertyValueDump = JSON.stringify(object, null, 4);
            }
        }
        else {
            propertyValueDump = JSON.stringify(object);
        }
    }
    return objectTypeDump + propertyValueDump;
}

function minifyNamesFn(grunt) {

    function loadEnumNamesFromSource(theOptions, theReplacements, inputFile, importAlias) {
        var fullName = resolvePath(theOptions, inputFile);
        if (fs.existsSync(fullName)) {
            grunt.log.verbose.writeln("Reading Name Map - " + fullName);
            var orgSrc = fs.readFileSync(fullName, "utf8");
        
            readSourceMap(theReplacements, orgSrc, importAlias);
        } else {
            grunt.log.verbose.warn(("Missing - " + fullName).yellow);
        }
    }

    function loadInternalConstantsFromSource(theOptions, theReplacements, inputFile) {
        var fullName = resolvePath(theOptions, inputFile);
        if (fs.existsSync(fullName)) {
            grunt.log.verbose.writeln("Reading Internal Constants - " + fullName);
            var orgSrc = fs.readFileSync(fullName, "utf8");
            var from = inputFile.replace(/\.ts$/, "");
            readInternalConstants(theReplacements, orgSrc, from);
        } else {
            grunt.log.verbose.warn(("Missing - " + fullName).yellow);
        }
    }
    
    grunt.registerMultiTask("ai-minify", "Application Insights function minifier", function() {
        var result = true;
        try {
            const options = this.options({});
            const taskOptions = getGruntMultiTaskOptions(grunt, this);
    
            const theOptions = {
                debug: resolveValue(taskOptions.debug, options.debug, false),
                projectRoot: resolveValue(taskOptions.projectRoot, options.projectRoot, "."),
                src: resolveValue(taskOptions.src, options.src, "./src/**/*.ts"),
                replaceNames: resolveValue(taskOptions.replaceNames, options.replaceNames, []),
                testOnly: resolveValue(taskOptions.testOnly, options.testOnly, false),
                restore: resolveValue(taskOptions.restore, options.restore, false),
                ext: resolveValue(taskOptions.tstExt, options.tstExt, ""),
                maxImportWidth: resolveValue(taskOptions.maxImportWidth, options.maxImportWidth, MAX_IMPORT_LENGTH),
                nameMaps: resolveValue(taskOptions.nameMaps, options.nameMaps, defaultReplace),
                internalConstants: resolveValue(taskOptions.internalConstants, options.internalConstants, defaultInternalConstants)
            };

            if (theOptions.debug) {
                grunt.log.verbose.writeln((" Options: [" + dumpObj(options) + "]").cyan);
                grunt.log.verbose.writeln((" Config : [" + dumpObj(this.data) + "]").cyan);
                grunt.log.verbose.writeln((" Resolved: [" + dumpObj(theOptions) + "]").cyan);
            }
    
            if (!Array.isArray(theOptions.replaceNames)) {
                throw "The replaceNames must be an array! - " + dumpObj(theOptions.replaceNames);
            }

            if (theOptions.internalConstants && !Array.isArray(theOptions.internalConstants)) {
                throw "The internalConstants must be an array! - " + dumpObj(theOptions.internalConstants);
            }

            if (Array.isArray(theOptions.internalConstants)) {
                theOptions.internalConstants.forEach((value) => {
                    loadInternalConstantsFromSource(theOptions, theOptions.replaceNames, value);
                });
            }

            if (Array.isArray(theOptions.nameMaps)) {
                theOptions.nameMaps.forEach((value) => {
                    loadEnumNamesFromSource(theOptions, theOptions.replaceNames, value.src, value.import);
                });
            }

            grunt.log.verbose.writeln("Names: " + JSON.stringify(theOptions.replaceNames));

            var sourcePath = resolvePath(theOptions, theOptions.src);
            grunt.log.verbose.writeln("Project Root: " + theOptions.projectRoot);
            grunt.log.verbose.writeln("Project Src : " + theOptions.src);
            grunt.log.verbose.writeln("Source Path : " + sourcePath);

            const files = globby.sync(sourcePath.replace(/\\/g, "/"));
            grunt.log.verbose.writeln("Files: " + files.length);
            files.map((inputFile) => {
                grunt.log.verbose.writeln("Reading - " + inputFile);
                var orgSrc = fs.readFileSync(inputFile, "utf8");
        
                try {
                    if (orgSrc.indexOf(" @skip-file-minify") === -1) {
                        grunt.log.verbose.writeln("Processing - " + inputFile);
                        var parsedFile = parseFile(inputFile, orgSrc);
            
                        for (var lp = 0; lp < theOptions.replaceNames.length; lp++) {
                            var replaceValues = theOptions.replaceNames[lp];
                            if (replaceValues) {
                                if (!theOptions.restore) {
                                    replaceNames(parsedFile, theOptions, replaceValues);
                                } else {
                                    reverseNames(parsedFile, replaceValues);
                                }
                            }
                        }
                
                        // remove unused imports
                        removeUnusedImports(parsedFile);
            
                        if (parsedFile.changed) {
            
                            var src = formatFile(parsedFile, theOptions.maxImportWidth);
                            if (orgSrc !== src) {
                                if (!theOptions.testOnly) {
                                    // Rewrite the file
                                    fs.writeFileSync(inputFile + theOptions.ext, src);
                                }
                            }
                        } else {
                            grunt.log.verbose.writeln((" -- Not changed").cyan);
                        }
                    } else {
                        grunt.log.verbose.writeln("Skipped - " + inputFile);
                    }
                } catch (e) {
                    grunt.log.error(("!!!Error processing [" + inputFile + "] - " + dumpObj(e)).red);
                    result = false;
                }
            });

        } catch (e) {
            grunt.log.error((dumpObj(e)).red);
            result = false;
        } finally {
        }                    

        return result;
    });
}

module.exports = minifyNamesFn;
