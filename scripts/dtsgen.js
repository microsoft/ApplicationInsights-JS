//
// This script wrap the generated api dts file with a oneDS namespace and copyright notice the version
//
//  node ../../scripts\dtsgen.js ./dist-es5/applicationinsights-web.d.ts 'Microsoft.ApplicationInsights' ./
//
const fs = require("fs");
const path = require("path");
const child_process = require("child_process");

function parseArgs(expectedArgs) {
    var passedArgs = process.argv;
    var theArgs = {
        "$script" : passedArgs[1]
    };

    let switches = {};
    let expArgs = [];
    for (var lp = 0; lp < expectedArgs.length; lp++) {
        var expArg = expectedArgs[lp];
        if (expArg.isSwitch) {
            switches[expArg.name.toLowerCase()] = expArg.name;
            theArgs[expArg.name] = !!expArg.value;
        } else {
            expArgs.push(expArg.name);
            theArgs[expArg.name] = expArg.value;
        }
    }

    var expIdx = 0;

    var argIdx = 2 + expIdx;
    while (argIdx < passedArgs.length) {
        let done = false;
        value = passedArgs[argIdx++];
        // console.log(`${argIdx}: ${value}`);
        if (value && value.length > 2) {
            if (value[0] === "-") {
                let swName = value.substring(1).toLowerCase();
                if (switches[swName]) {
                    theArgs[switches[swName]] = true;
                    done = true;
                    console.log(`  -${switches[swName]} -> true`);
                } else {
                    throwError("Unknown switch[" + value + "]");
                }
            }
            else if ((value[0] === "'" && value[value.length - 1] === "'") || (value[0] === '"' && value[value.length - 1] === '"')) {
                value = value.substring(1, value.length - 1);
            }
        }

        if (!done) {
            if (expArgs.length < expIdx) {
                throwError("Unexpected value [" + value + "]");
            }

            var expName = expArgs[expIdx++];
            theArgs[expName] = value;
            console.log(`  ${expName} -> ${value}`);
        }
    }

    return theArgs;
}

var theArgs = parseArgs([
    { name: "skuName", value: null},                            // The Sku name to place in the copyright notice
    { name: "projectPath", value: "./"},                        // The root path for the project
    { name: "dtsFile", value: ""},                              // [Optional] The generated Dts file (if cannot be derived from the package.json)
    { name: "includePrivate", value: false, isSwitch: true},    // [Optional] Switch to hide or include private properties and functions (defaults to false)
    { name: "oneDs", value: false, isSwitch: true }
]);

if (!theArgs.skuName) {
    throwError("Missing skuName");
}

var projectPath = path.resolve(process.cwd(), theArgs.projectPath)
var packagePath = path.resolve(theArgs.projectPath, "package.json");
console.log(`Using Package: ${packagePath}, current path cwd ${process.cwd()}`);

var packageJson = require(packagePath);
if (!packageJson || !packageJson.version) {
    throwError(`Missing package.json or version from [${packagePath}]`);
}

var version = packageJson.version
var author = packageJson.author || "";
var homepage = packageJson.homepage || "";
var packageName = packageJson.name
packageName = packageName.replace('@microsoft/', '').replace('/', '_');

var rollupPath = "dist";
var rollupExt = ".rollup";
var namespacePath = "dist";
var namespaceExt = "";

var rollupNote = 
    " * use this version if your build environment doesn't support the using the\n" +
    " * individual *.d.ts files or the namespace wrapped version.\n";

if (!theArgs.dtsFile) {
    theArgs.dtsFile = path.resolve(projectPath, "dist", `${packageName}.d.ts`);
    if (!fs.existsSync(theArgs.dtsFile)) {
        theArgs.dtsFile = path.resolve(projectPath, "build/dts", `${packageName}.d.ts`);
        rollupPath = "types";
        rollupExt = "";
        namespacePath = "types";
        namespaceExt = ".namespaced"
        rollupNote = 
            " * if you require a namespace wrapped version it is also available.\n";

        // Make sure the destination path exists
        var dtsDestPath = path.resolve(projectPath, rollupPath);
        if (!fs.existsSync(dtsDestPath)) {
            fs.mkdirSync(dtsDestPath);
        }
    }
}

var dtsFileNamespaced = path.resolve(projectPath, namespacePath, `${packageName}${namespaceExt}.d.ts`)
var dtsFileRollup = path.resolve(projectPath, rollupPath, `${packageName}${rollupExt}.d.ts`)

var rollupContent = 
    "/*\n" +
    ` * ${theArgs.skuName}, ${version}\n` +
    " * Copyright (c) Microsoft and contributors. All rights reserved.\n" +
    " *\n" +
    ` * ${author}\n` +
    ` * ${homepage}\n`;

var newAppInsightsContent = rollupContent +
    " */\n\n" +
    "declare namespace ApplicationInsights {";

var newOneDsContent = rollupContent +
    " */\n\n" +
    "declare namespace oneDS {";


rollupContent += 
    " *\n" +
    " * ---------------------------------------------------------------------------\n" +
    " * This is a single combined (rollup) declaration file for the package,\n" +
    rollupNote +
    ` * - Namespaced version: ${namespacePath ? namespacePath + "/" : ""}${packageName}${namespaceExt}.d.ts\n` +
    " * ---------------------------------------------------------------------------\n" +
    " */\n";

if (theArgs.dtsNsFile === theArgs.dtsFile || theArgs.dtsNsFile === null) {
    console.log(`Transforming: ${theArgs.dtsFile}`);
} else {
    console.log(`Transforming: ${theArgs.dtsFile} and ${theArgs.dtsNsFile}`);
}

try {
    var data = fs.readFileSync(theArgs.dtsFile, "utf8");
    if (!theArgs.dtsNsFile) {
        theArgs.dtsNsFile = generateDtsNsFile(theArgs.dtsFile, data.toString());
    }
    var nsData = fs.readFileSync(theArgs.dtsNsFile, "utf8");
    processFiles(data.toString(), nsData.toString());
} catch (err) {
    console.error(err);
    throw `Failed to generate .d.ts files [${theArgs.dtsFile}] - ${err}`;
}

function createGenConfig(genConfig, includeBundles) {
    var newGenConfig = "";

    // Strip Comments and rename output
    var lines = genConfig.split("\n");
    console.log(`Lines: ${lines.length}`);
    lines.forEach((line) => {
        // Trim whitespace from the end of the string
        let trimLine = line.trim();
        if (trimLine && trimLine.trim().length > 0) {
            if (trimLine.startsWith("//") || trimLine.startsWith("/*") || trimLine.startsWith("*")) {
                // drop commented lines
                line = null;
            }
        }

        if (line && trimLine) {
            // Rename the output files
            line = line.replace("<unscopedPackageName>.", "<unscopedPackageName>.namespaced.");
            // As the config is in the build folder, we need to realign the paths
            line = line.replace("\"projectFolder\": \".\"", "\"projectFolder\": \"..\"");
            newGenConfig += line;
        }
    });

    newGenConfig.replace(/"bundledPackages":\s*(\[[^\]]+\])/gs, function (match, g1) {
        var theBundles = includeBundles;
        var existingBundles = JSON.parse(g1);
        if (existingBundles.length > 0) {
            // Keep the existing bundles defined in the config first
            theBundles = [];
            existingBundles.forEach((bundle) => {
                if (theBundles.indexOf("\"" + bundle + "\"") === -1) {
                    theBundles.push("\"" + bundle + "\"");
                }
            });

            includeBundles.forEach((bundle) => {
                if (theBundles.indexOf(bundle) === -1) {
                    theBundles.push(bundle);
                }
            });
        }
        
        newGenConfig = newGenConfig.replace(g1, `[${theBundles.join(", ")}]`);
    });

    return newGenConfig;
}

function generateDtsNsFile(dtsFile, dtsContents, additionalBundles = [], attempt = 0) {

    var importCheck = /^\s*import\s+.*from\s*['"]([^'"]+)['"]/gm;
    
    var includeBundles = [];

    // Add any directly referenced imports
    while((match = importCheck.exec(dtsContents)) !== null) {
        if (match[1] && includeBundles.indexOf("\"" + match[1] + "\"") === -1) {
            includeBundles.push("\"" + match[1] + "\"");
        }
    }

    // Add any detected transitive additional bundles
    additionalBundles.forEach((bundle) => {
        if (includeBundles.indexOf("\"" + bundle + "\"") === -1) {
            includeBundles.push("\"" + bundle + "\"");
        }
    });

    if (includeBundles.length === 0) {
        // Just reuse the existing file
        return dtsFile;
    }

    var apiGenConfig = path.resolve(projectPath, "api-extractor.json");
    var genConfig = fs.readFileSync(apiGenConfig, "utf8");
    if (!genConfig) {
        throwError(`Failed to read ${apiGenConfig}`);
    }
    
    var newGenConfig = createGenConfig(genConfig, includeBundles);
    var apiNewGenConfig = path.resolve(projectPath, "build", "api-extractor.namespaced.json");
    console.log("Writing: " + apiNewGenConfig);
    fs.writeFileSync(apiNewGenConfig, newGenConfig, (err, data) => {
        if (err) {
            console.error(err);
            throwError(`Failed to write ${apiNewGenConfig}`);
        }
    });

    let apiExtractorCmd = `api-extractor run --local --config build/api-extractor.namespaced.json`;
    console.log(`Running: \"${apiExtractorCmd}\"`);
    child_process.execSync(apiExtractorCmd);

    // Check for unexpected transitive (indirect) imports
    var dtsFileNs = dtsFile.replace(".d.ts", ".namespaced.d.ts");
    if (!fs.existsSync(dtsFileNs)) {
        throwError(`Failed to generate ${dtsFileNs} -- does not exist!`);
    }

    var nsData = fs.readFileSync(dtsFileNs, "utf8");
    var importCheck = /^\s*import\s+.*from\s*['"]([^'"]+)/gm;

    var newImports = false;
    var indirectImports = additionalBundles.slice(0);
    while((match = importCheck.exec(nsData)) !== null) {
        if (match[1] && indirectImports.indexOf(match[1]) === -1) {
            indirectImports.push(match[1]);
            newImports = true;
        }
    }

    if (newImports && attempt < 4) {
        console.log(`Found additional transitive (indirect) imports - re-running with additional bundles - ${attempt}\n  - ${indirectImports.join("\n  - ")}`);
        return generateDtsNsFile(dtsFile, dtsContents, indirectImports, ++attempt);
    }

    return dtsFile.replace(".d.ts", ".namespaced.d.ts");
}

function createRollupFile(dtsContents, theContent) {
    console.log("File...");
    // console.log(dtsContents);

    // Read the generated dts file and append to the new content
    var lastLine = ""

    // Prefix every line with 4 spaces (indenting the lines)
    var lines = dtsContents.split("\n");
    console.log(`Lines: ${lines.length}`);
    // console.log(dtsContents);

    // Handle the normal file
    lines.forEach((line) => {
        // Trim whitespace from the end of the string
        var rollupLine = line.replace(/(\s+$)/g, '');

        if (line && line.trim().length > 0) {
            if (!theArgs.includePrivate) {
                // Hide private properties and functions
                rollupLine = rollupLine.replace(/(^\s+)private (.*);/, '$1// private $2;');
            }

            theContent +=  `\n${rollupLine}`;
        } else if (lastLine) {
            // Only add 1 blank line
            theContent += "\n"
        }

        lastLine = line
    });

    return theContent;
}

function throwError(message) {
    console.error(`\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n${message}\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n`);
    throw message;
}

function createNsFile(dtsContents) {
    console.log("NsFile...");
    // console.log(dtsContents);

    let newContent = newAppInsightsContent;
    if (theArgs.oneDs) {
        newContent = newOneDsContent;
    }

    // Read the generated dts file and append to the new content
    var lastLine = ""

    var nsLines = dtsContents.split("\n");
    console.log(`Lines: ${nsLines.length}`);

    // handle the namespaced file
    nsLines.forEach((nsLine) => {
        if (nsLine && nsLine.trim().length > 0) {
            // Remove exports and declares
            nsLine = nsLine.replace('export declare ', '');
            nsLine = nsLine.replace('declare ', '');
            nsLine = nsLine.replace('export { }', '');
            nsLine = nsLine.replace(/export\s*{\s*([\w]+)\s*}/g, '');
            nsLine = nsLine.replace(/export\s*{\s*([\w]+)\s*as\s*([\w]+)\s*}/g, function (match, g1, g2) {
                return `const ${g2}: typeof ${g1};`;
            });

            // Trim whitespace from the end of the string
            nsLine = nsLine.replace(/(\s+$)/g, '');

            if (!theArgs.includePrivate) {
                // Hide private properties and functions
                nsLine = nsLine.replace(/(^\s+)private (.*);/, '$1// private $2;');
            }

            if (nsLine && nsLine.trim().length > 0) {
                newContent += `\n    ${nsLine}`;
            }
        } else if (lastLine) {
            // Only add 1 blank line
            newContent += "\n"
        }

        lastLine = nsLine
    });

    // Add final trailing closing bracket for the namespace
    newContent += "\n}";

    var importCheck = /^\s*import\s+.*from\s*['"]([^'"]+)/gm;
    
    var imports = [];
    while((match = importCheck.exec(newContent)) !== null) {
        if (match[1] && imports.indexOf(match[1]) === -1) {
            imports.push(match[1]);
        }
    }

    if (imports.length > 0) {
        if (theArgs.dtsFile === theArgs.dtsNsFile) {
            throwError(`Found unexpected imports - create and generate the namespaced rollup via a api-extractor.namespaced.json file\nand including these packages in the bundledPackages for the namespaced version only.\n  - ${imports.join("\n  - ")}`);
        } else {
            throwError(`Found unexpected imports - please update the api-extractor.namespaced.json file to includes these packages in the bundledPackages for the namespaced version only.\n  - ${imports.join("\n  - ")}`);
        }
    }

    return newContent;
}

function processFiles(dtsContents, dtsNsContents) {

    fs.writeFileSync(dtsFileRollup, createRollupFile(dtsContents, rollupContent), (err, data) => {
        if (err) {
            console.error(err);
            throwError(`Failed to write ${dtsFileRollup}`);
        }
    });

    fs.writeFileSync(dtsFileNamespaced, createNsFile(dtsNsContents), (err, data) => {
        if (err) {
            console.error(err);
            throwError(`Failed to write ${dtsFileNamespaced}`);
        }
    });
}
