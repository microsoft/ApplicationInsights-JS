const fs = require("fs");
const child_process = require("child_process");

const packageGroupDef = "./tools/release-tools/package_groups.json";
let packageGroup;
let isTest = false;

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
                isTest = true;
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

function getPackageJson(packageJsonFile) {
    var packageText = removeTrailingComma(fs.readFileSync(packageJsonFile, "utf-8"));

    return JSON.parse(packageText);
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

    console.log(`Set latest tag [${packageGroup}] packages => ${packages.length}`);
    packages.forEach((packageRoot) => {
        let packageJsonFile = packageRoot + "/package.json";

        if (!fs.existsSync(packageJsonFile)) {
            console.error("!!! Source package.json doesn't exist [" + packageJsonFile + "]");
            throw new Error("!!! Source package.json doesn't exist [" + packageJsonFile + "]");
        }

        let packageJson = getPackageJson(packageJsonFile);

        console.log("\n\n##################################################################");
        console.log("Setting latest tag - " + packageJson.name);
        console.log("##################################################################");
        
        let npmCmd = `npm dist-tag add ${packageJson.name}@${packageJson.version} latest`;
        console.log(`Running: \"${npmCmd}\"`);
        if (!isTest) {
            child_process.execSync(npmCmd);
        }
    });
} else {
    showHelp();
    process.exit(1);
}
