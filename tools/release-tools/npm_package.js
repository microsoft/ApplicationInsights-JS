const fs = require("fs");
const child_process = require("child_process");

const packageGroupDef = "./tools/release-tools/package_groups.json";
let packageGroup;
let dropFolder;
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
    console.log(" <group>      - Identifies the group to publish, identifies folders, the group must be defined in package_groups.json");
    console.log(" <dropFolder> - Identifies the base folder to drop the packages into, defaults to ./drop/packages/<group>");
}

function parseArgs() {
    console.log("Parsing args - " + process.argv.join(" "));
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
        } else if (!dropFolder) {
            dropFolder = theArg;
        } else {
            console.error("!!! Invalid Argument [" + theArg + "] detected");
            return false;
        }

        idx++;
    }

    // Check for required arguments
    if (!packageGroup) {
        console.error("!!! Missing package group");
        return false;
    }

    return true;
}

function removeTrailingComma(text) {
    return text.replace(/,(\s*[}\],])/g, "$1");
}

function removeComments(text) {
    return text.replace(/^\s*\/\/\s.*$/gm, "");
}

function getPackage(packageJsonFile) {
    var packageText = removeTrailingComma(fs.readFileSync(packageJsonFile, "utf-8"));

    return JSON.parse(packageText);
}

function getNpmPackageName(packageJson) {
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

function movePackage(npmPackageName, packageName) {
    let packageFolder = dropFolder;
    if (!packageFolder) {
        packageFolder = "./drop/packages";
        packageFolder += "/" + packageGroup;
    }

    if (!fs.existsSync(packageFolder)) {
        fs.mkdirSync(packageFolder, { recursive: true });
    }

    let packageFile = packageFolder + "/" + packageName;
    if (fs.existsSync(packageFile)) {
        console.log(` -- Removing existing package ${packageFile}`);
        fs.unlinkSync(packageFile);
    }

    console.log(` -- Moving ${npmPackageName} to ${packageFile}`);
    fs.renameSync(npmPackageName, packageFile);
}

if (parseArgs()) {
    var packages = getGroupProjects();

    console.log(`Creating [${packageGroup}] packages => ${packages.length}`);
    packages.forEach((packageRoot) => {
        let packageJsonFile = packageRoot + "/package.json";

        if (!fs.existsSync(packageJsonFile)) {
            console.error("!!! Source package.json doesn't exist [" + packageJsonFile + "]");
            throw new Error("!!! Source package.json doesn't exist [" + packageJsonFile + "]");
        }

        const packageJson = getPackage(packageJsonFile);

        const packageName = getNpmPackageName(packageJson);
        console.log("\n\n##################################################################");
        console.log("Packaging - " + packageName);
        console.log("##################################################################");

        let npmPackageName = packageRoot + "/" + packageName;
        if (fs.existsSync(npmPackageName)) {
            console.log(` -- Removing existing package ${npmPackageName}`);
            fs.unlinkSync(npmPackageName);
        }
    
        const cwd = process.cwd();
        process.chdir(packageRoot);
        try {
            let npmCmd = `npm pack ${dryRun}`;
            console.log(`Running: \"${npmCmd}\"`);
            child_process.execSync(npmCmd);
        } finally {
            process.chdir(cwd);
        }

        if (!dryRun) {
            // Move the package to the package folder
            movePackage(npmPackageName, packageName);
        }
    });
} else {
    showHelp();
    process.exit(1);
}
