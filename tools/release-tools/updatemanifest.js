const fs = require("fs");
const path = require("path");

let packageRoot = process.cwd();
let packageJson = packageRoot + "/package.json";

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
    console.log(scriptName + " [<packageJson>] ");
    console.log("--------------------------");
    console.log(" <packageJson>    - Identifies the source package.json");
}

function parseArgs() {
    if (process.argv.length < 1) {
        console.error("!!! Invalid number of arguments -- " + process.argv.length);
        return false;
    }

    console.log("cwd: " + process.cwd());

    let idx = 2;
    while (idx < process.argv.length) {
        let theArg = process.argv[idx];
        if (!packageJson) {
            packageJson = path.resolve(packageRoot, theArg);
            let idx = packageJson.lastIndexOf("/");
            if (idx != -1) {
                packageRoot = packageJson.substring(0, idx + 1);
            }
        
            if (!packageRoot) {
                console.error("!!! Unable to identify package root folder from [" + packageJson + "]");
                return false;
            }
        
        } else {
            console.error("!!! Invalid Argument [" + theArg + "] detected");
            return false;
        }

        idx++;
    }

    return true;
}

function updateManifest() {
    let manifestFile = packageRoot + "/manifest.json";
    if (!manifestFile || !fs.existsSync(manifestFile)) {
        console.error("!!! Manifest file [" + manifestFile + "] does not exist");
        return false;
    }

    let thePackage = require(packageJson);
    let versionParts = thePackage.version.split("-")[0].split(".");
    if (versionParts.length < 3) {
        console.error("!!! Unsupported version [" + thePackage.version + "]");
        return false;
    }

    let theManifest = require(manifestFile);
    theManifest.version = "" + versionParts[0] + "." + versionParts[1] + "." + versionParts[2];
    theManifest.version_name = thePackage.version;

    console.log("Updating manifest file");
    // Rewrite the file
    const newContent = JSON.stringify(theManifest, null, 4) + "\n";
    fs.writeFileSync(manifestFile, newContent);

}

if (parseArgs()) {
    if (!fs.existsSync(packageJson)) {
        console.error("!!! Source package.json doesn't exist [" + packageJson + "]");
        return false;
    }

    updateManifest();
} else {
    showHelp();
}
