const fsPromise = require("fs").promises;
const fs = require("fs");
const https = require("https");

async function generateSizeBadge(path, fileSize, isGzip = false, maxSize = 35, minSize = 30) {
    try {
        let sizeBadge = `https://img.shields.io/badge/size-${fileSize}kb`;
        let color;
        if (isGzip) {
            if (fileSize > maxSize) {
                color = "red";
            } else if (fileSize > minSize) {
                color = "yellow";
            } else {
                color = "brightgreen";
            }
        } else {
            color = "blue";
        }
        sizeBadge += "-" + color;
        console.log(`  Generating badge: ${path} (${fileSize}kb${isGzip ? " gzip" : ""}) [${color}]`);
        const res = await fetch(encodeURI(sizeBadge));
        if (!res.ok) {
            throw new Error(`Failed to fetch ${sizeBadge}: ${res.status} ${res.statusText}`);
        }
        const buffer = await res.arrayBuffer();
        const outputPath = `./AISKU/.cdn/img/ai.${path}.svg`;
        await fsPromise.writeFile(outputPath, Buffer.from(buffer));
        console.log(`  Badge saved: ${outputPath}`);
    } catch (err) {
        throw new Error(`Failed to generate size badge: ${err.message}`);
    }
}

async function downloadFile(version) {
    try {
        let url = "https://js.monitor.azure.com/scripts/b/ai." + version + ".js";
        console.log(`Downloading: ${url}`);
        const res = await fetch(encodeURI(url));
        if (!res.ok) {
            throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
        }
        const buffer = await res.arrayBuffer();
        const outputPath = `./AISKU/.cdn/file/ai.${version}.js`;
        await fsPromise.writeFile(outputPath, Buffer.from(buffer));
        console.log(`  Downloaded: ${outputPath} (${(buffer.byteLength / 1024).toFixed(1)}kb)`);
    } catch (err) {
        throw new Error(`Failed to generate size badge: ${err.message}`);
    }
}

function createDirectory(dirName) {
    const dir = `./${dirName}`;
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
}

async function getVersionFromPackageJson(packageJsonPath) {
    try {
        const data = await fsPromise.readFile(packageJsonPath, "utf8");
        const packageJson = JSON.parse(data);
        if (packageJson && packageJson.version) {
            return packageJson.version;
        } else {
            return null;
        }
    } catch (err) {
        console.error(`Failed to read package.json: ${err.message}`);
        return null;
    }
}

async function main() {
    console.log("=== Size Image Generator ===");
    console.log("Creating directories...");
    createDirectory("./AISKU/.cdn/file");
    createDirectory("./AISKU/.cdn/img");
    const packageJsonPath = "./AISKU/package.json";
    const version = await getVersionFromPackageJson(packageJsonPath);

    let versions = [];

    if(process.argv.length >= 3) {
        let versionList = process.argv[2];
        versions = versionList.split(",");
    }
    version && versions.push(version);
    console.log("Versions to process:", versions.join(", "));
    console.log("");
    for (let i = 0; i < versions.length; i++) {
        let version = versions[i];
        console.log(`\n--- Processing version ${version} (${i + 1}/${versions.length}) ---`);
        await downloadFile(version);
        await downloadFile(version + ".min");
        const filename = `./AISKU/.cdn/file/ai.${version}.js`;
        const minFileName = `./AISKU/.cdn/file/ai.${version}.min.js`;
        try {
            const fileSize = ((await fsPromise.stat(filename)).size / 1024).toFixed(1);
            const minFileSize = ((await fsPromise.stat(minFileName)).size / 1024).toFixed(1);
            console.log(`\nFile sizes: ${version}.js = ${fileSize}kb, ${version}.min.js = ${minFileSize}kb`);
            console.log("\nGenerating badges...");
            await generateSizeBadge(version + ".js", fileSize);
            await generateSizeBadge(version + ".min.js", minFileSize);
            // Use https module to get raw compressed size (fetch auto-decompresses)
            const gzipSize = await new Promise((resolve, reject) => {
                const options = {
                    hostname: "js.monitor.azure.com",
                    path: "/scripts/b/ai." + version + ".min.js",
                    headers: { "Accept-Encoding": "gzip" }
                };
                https.get(options, (res) => {
                    if (res.headers["content-encoding"] !== "gzip") {
                        reject(new Error("Content is not gzip encoded"));
                        return;
                    }
                    let bodySize = 0;
                    res.on("data", (chunk) => {
                        bodySize += chunk.length;
                    });
                    res.on("end", () => {
                        resolve(bodySize);
                    });
                    res.on("error", reject);
                }).on("error", reject);
            });
            const gzipSizeKb = (gzipSize / 1024).toFixed(1);
            console.log(`\nGzip size: ${version}.min.js = ${gzipSizeKb}kb (compressed)`);
            await generateSizeBadge(version + ".gzip.min.js", gzipSizeKb, true);
        } catch (err) {
            console.error("Error:", err);
        }
    }
    console.log("\n=== Size Image Generator Complete ===");
}

main();
