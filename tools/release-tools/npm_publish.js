const fs = require("fs");
const child_process = require("child_process");

const packageGroupDef = "./tools/release-tools/package_groups.json";
let packageGroup;
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
    console.log(scriptName + " <group> ");
    console.log("--------------------------");
    console.log(" <group>      - Identifies the group to publish, identifies folders");
}

function parseArgs() {
    if (process.argv.length < 2) {
        console.error("!!! Invalid number of arguments -- " + process.argv.length);
        return false;
    }

    let idx = 2;
    while (idx < process.argv.length) {
        let theArg = process.argv[idx];
        if (theArg.startsWith("-")) {
            if (theArg === "-test") {
                dryRun = "--dry-run";
            } else {
                console.error("!!! Unknown switch [" + theArg + "] detected");
                return false;
            }
        } else if (!packageGroup) {
            packageGroup = theArg;
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

function removeComments(text) {
    return text.replace(/^\s*\/\/\s.*$/gm, "");
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

function getGroupProjects() {
    if (!fs.existsSync(packageGroupDef)) {
        console.error("!!! Unable to locate package group definitions [" + packageGroupDef + "]");
        throw new Error("!!! Unable to locate package group definitions.");
    }

    var groupText = removeComments(removeTrailingComma(fs.readFileSync(packageGroupDef, "utf-8")));

    let groupJson = JSON.parse(groupText);
    return groupJson[packageGroup] || [];
}

if (parseArgs()) {
    var packages = getGroupProjects();

    console.log(`Publishing [${packageGroup}] packages => ${packages.length}`);
    packages.forEach((packageRoot) => {
        let packageJsonFile = packageRoot + "/package.json";

        if (!fs.existsSync(packageJsonFile)) {
            console.error("!!! Source package.json doesn't exist [" + packageJsonFile + "]");
            throw new Error("!!! Source package.json doesn't exist [" + packageJsonFile + "]");
        }

        console.log("\n\n##################################################################");
        console.log("Publishing - " + getNpmPackageName(packageJsonFile));
        console.log("##################################################################");
        let npmPackageName = packageRoot + "/" + getNpmPackageName(packageJsonFile);
        if (!fs.existsSync(npmPackageName)) {
            console.error("!!! NPM Package not found [" + npmPackageName + "]");
            throw new Error("!!! NPM Package not found [" + npmPackageName + "]");
        }
        
        console.log(`npm pacakage present ${npmPackageName}`);
        let npmCmd = `npm publish ${npmPackageName} --access public ${dryRun}`;
        console.log(`Running: \"${npmCmd}\"`);
        child_process.execSync(npmCmd);
    });
} else {
    showHelp();
    process.exit(1);
}
