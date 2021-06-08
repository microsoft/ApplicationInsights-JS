const fs = require("fs");
const globby = require("globby");

let newVer = null;
let autoInc = null;
let buildNum = null;
let preRel = null;
let isRelease = false;
let testOnly = null;
let isReact = false;

const theVersion = require(process.cwd() + "/version.json");

function showHelp() {
    var scriptParts;
    var scriptName = process.argv[1];
    if (scriptName.indexOf("\\") !== -1) {
        scriptParts = scriptName.split("\\");
        scriptName = scriptParts[scriptParts.length - 1];
    } else if (scriptName.indexOf("/") !== -1) {
        scriptParts = scriptName.split("/");
        scriptName = scriptParts[scriptParts.length - 1];
    }

    console.log("");
    console.log(scriptName + " [<newVersion>|-patch|-minor|-major] [-dev|-alpha|-beta|-release] [-bld ######] [-test]");
    console.log("--------------------------");
    console.log(" <newVersion> - Identifies the version to set for all packages, must start with x.y.z");
    console.log(" -patch      - Increment the current version to the next patch number (x.y.z => x.y.[z+1]");
    console.log(" -minor      - Increment the current version to the next minor number (x.y.z => x.[y+1].0");
    console.log(" -major      - Increment the current version to the next major number (x.y.z => [x+1].0.0");
    console.log(" -dev        - Add the 'dev' pre-release to the number (x.y.z => x.y.z-dev)");
    console.log(" -alpha      - Add the 'alpha' pre-release to the number (x.y.z => x.y.z-alpha)");
    console.log(" -beta       - Add the 'beta' pre-release to the number (x.y.z => x.y.z-beta)");
    console.log(" -release    - Remove any existing pre-release tags (x.y.z-prerel => x.y.z)");
    console.log(" -bld ###### - Append the provided build number to the version (x.y.z => x.y.z-[prerel].######) [prerel] defaults to dev if not defined");
    console.log(" -pre ###### - Set the pre-release to the provided value (x.y.z => x.y.z-[prerel])");
    console.log(" -react      - Update only the react packages")
    console.log(" -test       - Scan all of the package.json files and log the changes, but DON'T update the files");
}

function setPreRelVer(name) {
    if (name && name.indexOf("-") !== -1) {
        console.error("Invalid pre-release value -- [" + name + "] -- the name cannot contain a '-'");
        return false;
    }

    preRel = name;
    let defaultVer = theVersion[name];
    if (defaultVer) {
        const idx = defaultVer.indexOf("-");
        if (idx == -1) {
            newVer = defaultVer;
        } else {
            newVer = defaultVer.substring(0, idx);
            preRel = defaultVer.substring(idx);
        }
    }

    return true;
}


function parseArgs() {
    if (process.argv.length < 2) {
        console.error("!!! Invalid number of arguments -- " + process.argv.length)
        return false;
    }

    let idx = 2;
    while(idx < process.argv.length) {
        let theArg = process.argv[idx];
        if (!newVer && theArg === "-patch") {
            console.log("Patch existing version");
            autoInc = "patch";
        } else if (!newVer && theArg === "-minor") {
            console.log("Increment minor existing version");
            autoInc = "minor";
        } else if (!newVer && theArg === "-major") {
            console.log("Increment major existing version");
            autoInc = "major";
        } else if (!isRelease && !preRel && theArg === "-dev") {
            if (!setPreRelVer("dev")) {
                return false;
            }
        } else if (!isRelease && !preRel && theArg === "-alpha") {
            if (!setPreRelVer("alpha")) {
                return false;
            }
        } else if (!isRelease && !preRel && theArg === "-beta") {
            if (!setPreRelVer("beta")) {
                return false;
            }
        } else if (!isRelease && !preRel && theArg === "-release") {
            if (!setPreRelVer("release")) {
                return false;
            }

            isRelease = true;
            preRel = "";
        } else if (!isRelease && !preRel && theArg === "-pre") {
            if (!setPreRelVer(process.argv[idx + 1] || "pre")) {
                return false;
            }

            idx++;
        } else if (theArg === "-bld") {
            buildNum = (process.argv[idx + 1] || "");
            idx++;
        } else if (theArg === "-test") {
            testOnly = true;
        } else if (!newVer && !autoInc) {
            let theParts = theArg.split(".");
            if(theParts.length < 3) {
                console.error("!!! The provided version [" + theArg + "] appears invalid");
                return false;
            }

            newVer = theArg;
        } else if (!isReact && theArg === "-react") {
            isReact = true;
        } else {
            console.error("!!! Invalid Argument [" + theArg + "] detected");
            return false;
        }

        idx ++;
    }

    if (buildNum && !preRel && !isRelease) {
        preRel = "dev";
    }

    // If no version, pre-release tag or auto version increment is defined default to "dev" pre-release
    if (!newVer && !autoInc && !isRelease) {
        const newPreRel = preRel;
        if (!setPreRelVer("dev")) {
            return false;
        }

        if (newPreRel) {
            preRel = newPreRel;
        }
    }

    return true;
}

function calculateVersion(rootVersion) {

    let preRelParts = (rootVersion || "0.0.0").split("-");
    let postfix = preRelParts.length > 1 && preRelParts[1] ? ("-" + preRelParts[1]) : "";
    let parts = preRelParts[0].split(".");

    if (parts.length < 3) {
        console.error("!!! Package version [" + rootVersion + "] doesn't look correct");
        parts = ["0", "0", "0"];
    }

    // Set the default version to the current
    newVersion = preRelParts[0];

    if (newVer) {
        newVersion = newVer;
        postfix = "";
    } else {
        if (autoInc == "patch") {
            parts[2]++;
        } else if (autoInc == "minor") {
            parts[1]++;
            parts[2] = 0;
        } else if (autoInc == "major") {
            parts[0]++;
            parts[1] = 0;
            parts[2] = 0;
        }

        newVersion = parts[0] + "." + parts[1] + "." + parts[2];
    }

    if (buildNum && !buildNum.startsWith(".") && !buildNum.startsWith("+")) {
        buildNum = "." + buildNum;
    }

    if (buildNum && isRelease) {
        preRel = "rc";
    }

    if (preRel) {
        postfix = preRel;
        if (!postfix.startsWith("-")) {
            postfix = "-" + preRel;
        }
    }

    return newVersion + (postfix || "") + (buildNum || "");
}

function getVersionDetails(theVersion) {
    let parts = (theVersion || "0.0.0").split("+", 2);

    let details = {
        full: theVersion,
        ver: parts[0],
        bldNum: parts.length === 2 ? parts[1] : ""
    }

    let version = details.ver;
    let preRelParts = version.split("-", 2);
    details.preRel = preRelParts.length === 2 ? preRelParts[1] : "";

    let type = "release";
    if (preRelParts[1]) {
        // Remove all other possible separators
        type = preRelParts[1].split(".")[0].split("-")[0];
    }

    details.type = type;

    return details;
}

function shouldProcess(name) {
    if (name.indexOf("node_modules/") !== -1) {
        return false;
    }

    if (name.indexOf("common/temp") !== -1) {
        return false;
    }

    if (name.indexOf("legacy") !== -1) {
        return false;
    }

    if (name.indexOf("-react")) {
        return isReact;
    }

    if (name.indexOf("-angularplugin") !== -1) {
        return false;
    }

    if (name.indexOf("AISKU/") !== -1) {
        return true;
    }

    if (name.indexOf("AISKULight/") !== -1) {
        return true;
    }

    if (name.indexOf("channels/") !== -1) {
        return true;
    }

    if (name.indexOf("extensions/") !== -1) {
        return true;
    }

    if (name.indexOf("shared/") !== -1) {
        return true;
    }

    if (name === "package.json") {
        return true;
    }

    return false;
}

function updatePublishConfig(package, newVersion) {
    let details = getVersionDetails(newVersion);

    if (!details.type || details.type === "release") {
        if (package.publishConfig && package.publishConfig.tag) {
            // remove any previous tag
            delete package.publishConfig.tag;
        }
    } else {
        if (!package.publishConfig) {
            package.publishConfig = {};
        }

        // Set the publishing tag
        package.publishConfig.tag = details.type;
    }

    if (package.publishConfig && Object.keys(package.publishConfig).length === 0) {
        // Nothing left so remove it
        delete package.publishConfig;
    }
}

function updateDependencies(target, orgVersion, newVersion) {
    if (target) {
        Object.keys(target).forEach((value) => {
            if (value.indexOf("@microsoft/applicationinsights-") !== -1 && 
                    value.indexOf("@microsoft/applicationinsights-rollup") === -1) {
                let version = target[value];
                if (version === orgVersion) {
                    target[value] = newVersion;
                }
                else if (version === "^" + orgVersion) {
                    target[value] = "^" + newVersion;
                }
                else if (version === "~" + orgVersion) {
                    target[value] = "~" + newVersion;
                }
            }
        });
    }
}

function updateVersion(src, orgVersion, newVersion) {
    if (src) {
        src = src.replace("\"javascript:" + orgVersion, "\"javascript:" + newVersion + "\"");
        src = src.replace("\"" + orgVersion + "\"", "\"" + newVersion + "\"");
        src = src.replace("\"#version#\"", "\"" + newVersion + "\"");
    }

    return src;
}

const setPackageJsonRelease = () => {
    const files = globby.sync("./**/package.json");
    let changed = false;
    files.map(packageFile => {
        // Don't update node_modules
        if (shouldProcess(packageFile)) {
            console.log("Loading - " + packageFile);

            let theFilename = packageFile;
            const package = require(process.cwd() + "\\" + theFilename);
            let currentVersion = package.version;
            let newVersion = calculateVersion(currentVersion);
            console.log("   Name - " + package.name + " Version: " + currentVersion + " => " + newVersion);
    
            if (newVersion && currentVersion != newVersion) {
                //fs.renameSync(inputFile, inputFile + ".org");
                package.version = newVersion;
                updatePublishConfig(package, newVersion);
                updateDependencies(package.dependencies, currentVersion, newVersion);
                updateDependencies(package.peerDependencies, currentVersion, newVersion);
                updateDependencies(package.devDependencies, currentVersion, newVersion);
    
                if (!testOnly) {
                    // Rewrite the file
                    const newContent = JSON.stringify(package, null, 4) + "\n";
                    fs.writeFileSync(theFilename, newContent);
                    changed = true;
                }

                if (theFilename.indexOf("/package.json") !== -1) {
                    let srcFolder = theFilename.replace("/package.json", "/**/*.ts");
                    console.log("        - Checking source files: " + srcFolder);
                    const tsFiles = globby.sync(srcFolder);
                    tsFiles.map(sourceFile => {
                        // Don't update node_modules
                        if (shouldProcess(sourceFile)) {
                
                            var src = fs.readFileSync(sourceFile, "utf8");
                            var orgSrc = src;
                        
                            src = updateVersion(src, currentVersion, newVersion);
    
                            // Rewrite the file
                            if (orgSrc != src && !testOnly) {
                                console.log("          Updating: " + sourceFile);
                                src = src.trim();
                                fs.writeFileSync(sourceFile, src);
                            }
                        }
                    });
                }
            }
        }
    });

    return changed;
};

if (parseArgs()) {
    const rootVersion = require(process.cwd() + "/package.json");
    const theVersion = require(process.cwd() + "/version.json");
    let newVersion = calculateVersion(theVersion.release);
    if (newVersion) {
        console.log("New version [" + rootVersion.version + "] => [" + newVersion + "]")
        if (!testOnly && theVersion.release != newVersion) {
            console.log("Updating version file");
            // Rewrite the file
            theVersion.release = newVersion;
            const newContent = JSON.stringify(theVersion, null, 4) + "\n";
            fs.writeFileSync(process.cwd() + "/version.json", newContent);
            changed = true;
        }

        if (setPackageJsonRelease()) {
            console.log("Version updated, now run 'npm run update'");
        }
    } else {
        console.error("Failed to identify the new version number");
    }
} else {
    showHelp();
}
