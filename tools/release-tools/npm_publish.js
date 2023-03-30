const fs = require("fs");
const child_process = require("child_process");

let packageRoot;
let dryRun = "";

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
    console.log(scriptName + " <pkgFolder> ");
    console.log("--------------------------");
    console.log(" <pkgFolder>      - Identifies the folder containing the package.json and *.tgz");
}

function parseArgs() {
    if (process.argv.length < 2) {
        console.error("!!! Invalid number of arguments -- " + process.argv.length);
        return false;
    }

    console.log("cwd: " + process.cwd());

    let idx = 2;
    while (idx < process.argv.length) {
        let theArg = process.argv[idx];
        if (!packageRoot) {
            packageRoot = theArg;
        } else if(theArg === "-test") {
            dryRun = "--dry-run";
        } else {
            console.error("!!! Invalid Argument [" + theArg + "] detected");
            return false;
        }

        idx++;
    }

    return true;
}

function removeTrailingComma(text) {
    return text.replace(/,(\s*[}\],])/g, "$1");
}

function getNpmPackageName(packageJsonFile) {
    var packageText = removeTrailingComma(fs.readFileSync(packageJsonFile, "utf-8"));

    let packageJson = JSON.parse(packageText);
    let packageName = packageJson.name;
    let packageVersion = packageJson.version;

    let theNpmPackageName = packageName + "-" + packageVersion;

    theNpmPackageName = theNpmPackageName.replace("@", "").replace("/", "-");

    return theNpmPackageName + ".tgz";

}

if (parseArgs()) {
    let packageJsonFile = packageRoot + "/package.json";

    if (!fs.existsSync(packageJsonFile)) {
        console.error("!!! Source package.json doesn't exist [" + packageJsonFile + "]");
        throw new Error("!!! Source package.json doesn't exist [" + packageJsonFile + "]");
    }

    let npmPackageName = packageRoot + "/" + getNpmPackageName(packageJsonFile);
    if (!fs.existsSync(npmPackageName)) {
        console.error("!!! NPM Package not found [" + npmPackageName + "]");
        throw new Error("!!! NPM Package not found [" + npmPackageName + "]");
    }

    console.log(`npm pacakage present ${npmPackageName}`);
    let npmCmd = `npm publish ${npmPackageName} --access public ${dryRun}`;
    console.log(`Running: \"${npmCmd}\"`);
    child_process.execSync(npmCmd);
} else {
    showHelp();
    process.exit(1);
}
