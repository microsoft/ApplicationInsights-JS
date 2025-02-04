const fs = require("fs");
const globby = require("globby");
const crypto = require("crypto");
const extractFilename = /^(.*(\d{1,3}\.\d{1,3}\.\d{1,3}(-[\w]+(\.[\d]+){0,1}){0,1}|test))(\..*js)$/;

function calculateHash(source, algorithm) {
    return crypto.createHash(algorithm).update(source).digest().toString('base64');
}

function getFilename(inputFile, packageVersion) {
    var filename = inputFile;
    var path = "";
    var pos = inputFile.lastIndexOf("/");
    if (pos == -1) {
        pos = inputFile.lastIndexOf("\\");
    }

    if (pos != -1) {
        path = inputFile.substring(0, pos);
        filename = inputFile.substring(pos + 1);
    }

    var match = null;
    var module = filename;
    var matchType = "";

    var verIdx = filename.indexOf("." + packageVersion);
    if (verIdx === -1) {
        verIdx = filename.indexOf("-" + packageVersion);
    }
    if (verIdx != -1) {
        verIdx += (packageVersion.length + 1);
        matchType = "Package version";
        // This was added to specific handle package versions with pre-release and version (eg ai.xxx-nightly.20210802)
        module = filename.substring(0, verIdx);
        match = [
            inputFile,                  // Raw original file
            path + "/" + module,        // IntFile group [1]
            packageVersion,             // Version group [2]
            null,
            null,
            filename.substring(verIdx + 1) // format group (extension) [5]
        ];
    } else {
        // General Regex match
        matchType = "RegEx";
        match = extractFilename.exec(inputFile);
        if (!match && filename.endsWith(".js")) {
            matchType = "Extension";
            // Handle files with no version eg. applicationinsights-core-js, etc
            var idx = filename.indexOf(".gbl.");
            if (idx === -1) {
                idx = filename.indexOf(".cjs.");
            }
            if (idx === -1) {
                idx = filename.indexOf(".min.");
            }
            if (idx === -1) {
                idx = filename.indexOf(".js");
            }
            if (idx != -1) {
                module = filename.substring(0, idx);
                match = [
                    inputFile,                  // Raw original file
                    path + "/" + module,        // IntFile group
                    packageVersion,             // Version group
                    null,
                    null,
                    filename.substring(idx + 1) // format group (extension)
                ];
            }
        }
    }

    if (match) {
        console.log("Loading - " + inputFile + "  (" + matchType + ") => (" + JSON.stringify(match) + ")");

        var intFile = match[1];
        var version = match[2];
        var format = match[5];

        var idx = filename.lastIndexOf("." + packageVersion);
        if (idx === -1) {
            idx = filename.lastIndexOf("-" + packageVersion);
        }
        if (idx == -1) {
            idx = filename.lastIndexOf("-test");
        }

        if (idx != -1) {
            module = filename.substring(0, idx);
        } else if (version !== packageVersion) {
            console.log("Skipping - " + inputFile + "  (" + matchType + ")");

            return {
                name: filename
            };
        }

        if (format.startsWith(".")) {
            format = format.substring(1);
        }

        console.log("Loading - " + inputFile + "  (" + matchType + ")");

        return {
            name: filename,
            module: module,
            version: version,
            format: format,
            intFile: intFile + ".integrity.json"
        };
    }

    return {
        name: filename
    };
}

function processPath(integrityCache, path, version) {
    const files = globby.sync(path);
    files.map(inputFile => {
        var names = getFilename(inputFile, version);
        if (names.intFile) {
            var src = fs.readFileSync(inputFile, "utf8");
    
            const hash256 = calculateHash(src, 'sha256');
            const hash384 = calculateHash(src, 'sha384');
            const hash512 = calculateHash(src, 'sha512');
    
            var integrityJson = integrityCache[names.intFile];
            if (!integrityJson) {
                integrityJson = {
                    name: names.module
                };

                if (names.version) {
                    integrityJson.version = names.version;
                }

                // Cache it
                integrityCache[names.intFile] = integrityJson;
            } else if (integrityJson.name != names.module) {
                throw new Error("Error! - Module name [" + integrityJson.name + "] does not match expected [" + names.module + "]");
            } else if (names.version && integrityJson.version != names.version) {
                throw new Error("Error! - Module version [" + integrityJson.version + "] does not match expected [" + names.version + "]");
            }

            var name = "@" + names.format;
            var details = integrityJson.ext = integrityJson.ext || {};
            var fileDetails = details[name] = details[name] || {};
            fileDetails.file = names.name;
            fileDetails.type = "text/javascript; charset=utf-8";
            fileDetails.integrity = `sha256-${hash256} sha384-${hash384} sha512-${hash512}`;
            fileDetails.hashes = {
                sha256: hash256,
                sha384: hash384,
                sha512: hash512
            };
        }
    });
}

(function generateIntegrityFile() {
    var integrityCache = {};

    var package = JSON.parse(fs.readFileSync("./package.json", "utf8"));
    processPath(integrityCache, "./browser/**/*.js", package.version);
    processPath(integrityCache, "./bundle/**/*.js", package.version);
    processPath(integrityCache, "./snippet/**/*.js", package.version);
    processPath(integrityCache, "./dist/**/*.zip", package.version);

    Object.keys(integrityCache).forEach((name) => {
        console.log("Writing - " + name);
        fs.writeFileSync(name, JSON.stringify(integrityCache[name], null, 4));
    });
})();
