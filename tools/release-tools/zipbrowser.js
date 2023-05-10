const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

let packageRoot = process.cwd();
let packageJson = packageRoot + "/package.json";
let sourceDir = null;
let destPrefix = null;
let destFolder = null;
let done = false;
let complete = false;

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
    console.log(scriptName + " <destPrefix> [<destFolder>] [<packageJson>] ");
    console.log("--------------------------");
    console.log(" <destPrefix>     - Identifies the destination filename zip prefix");
    console.log(" <destFolder>     - Identifies the destination folder for the zip file");
    console.log(" <packageJson>    - Identifies the source package.json");
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
        if (!destPrefix) {
            destPrefix = theArg;
        } else if (!destFolder) {
            destFolder = theArg;
        } else if (!packageJson) {
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

function normalizeName(filename) {
    const cwd = process.cwd();

    return filename.replace(cwd, ".");
}

async function packFolder() {
    const thePackage = require(packageJson);
    const packageVersion = thePackage.version;
    if (destFolder && !fs.existsSync(packageRoot + "/" + destFolder)) {
        fs.mkdirSync(packageRoot + "/" + destFolder);
    }

    const outputName = packageRoot + "/" + (destFolder ? destFolder + "/" : "") + destPrefix + "." + packageVersion + ".zip";
    console.log(`Creating Zip [${normalizeName(outputName)}] from [${normalizeName(sourceDir)}]`);

    const stream = fs.createWriteStream(outputName);
    // stream.on("open", () => {
    //     try {
    //         console.log(`Creating Zip [${normalizeName(outputName)}] from [${normalizeName(sourceDir)}]`);
    //     } catch (e) {
    //         // Github is failing on this
    //     }
    // });
    stream.on("close", () => {
        try {
            //console.log("Complete!", "\n");
        } catch (e) {
            // Github is failing on this
        }
        complete = true;
    });
    stream.on("error", (err) => {
        try {
            console.error(`Failed to write to zip file - ${err.message}\n`);
        } catch (e) {
            // Github is failing on this
            throw err;
        }
        process.exit(2);
    });
    
    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.directory(sourceDir, false);
    archive.on("error", (err) => {
        console.error(`Failed to generate zip file - ${err.message}\n`);
        process.exit(2);
    });
    archive.pipe(stream);
    await archive.finalize();

    return true;
}

if (parseArgs()) {
    if (!fs.existsSync(packageJson)) {
        console.error("!!! Source package.json doesn't exist [" + packageJson + "]");
        return false;
    }

    sourceDir = packageRoot + "/browser";
    if (!sourceDir) {
        console.error("!!! Browser path [" + packageJson + "] does not exist -- you need to build first");
        return false;
    }

    try {
        fs.accessSync(sourceDir);
    } catch (e) {
        console.error("!!! The source [" + sourceDir + "] does not exist");
        return false;
    }

    console.log("Packing folder");
    packFolder().then(() => {
        //console.log("done");
        done = true;
    });

    function waitUntilDone() {
        //console.log("Waiting...");
        let to = setTimeout(() => {
            if (!done && !complete) {
                waitUntilDone();
            } else {
                //console.log("All Done.");
            }
        }, 50);

        // Make sure the timer is referenced so that Node doesn't terminate
        to.ref();
    }

    console.log("Waiting for packing to complete");
    waitUntilDone();
} else {
    showHelp();
    process.exit(1);
}
