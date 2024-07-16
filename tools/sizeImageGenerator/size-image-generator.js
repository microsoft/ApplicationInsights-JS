const fsPromise = require('fs').promises;
const fs = require('fs');
const request = require('request');
const { makeBadge } = require('badge-maker')
async function generateSizeBadge(version, fileSize, type, maxSize = 35, minSize = 30) {
    console.log("----Generating size badge for: ", version);
    try {
        let sizecolor = "blue";
        let label = "full size";
        if (type == "gzip") {
            if (fileSize > maxSize) {
                sizecolor = "red";
            } else if (fileSize > minSize) {
                sizecolor = "yellow";
            } else {
                sizecolor = "brightgreen";
            }
            label = 'GZip size';
        } else if (type == "min") {
            label = "minified size";
            sizecolor = "darkorchid";
        } 
        const format = {
            label: label,
            message: fileSize + ' KB',
            color: sizecolor,
          }
          
        const svg = makeBadge(format);
        console.log("write file: ", `./AISKU/.cdn/img/ai.${version}.svg`);
        await fsPromise.writeFile(`./AISKU/.cdn/img/ai.${version}.svg`, svg);
    } catch (err) {
        throw new Error(`Failed to generate size badge: ${err.message}`);
    }
}

async function downloadFile(version) {
    try {
        let url = "https://js.monitor.azure.com/scripts/b/ai." + version + ".js";
        if (version.includes("night")) {
            url = "https://js.monitor.azure.com/nightly/ai." + version + ".js";
        }
        console.log("Downloading file: ", url);
        const res = await fetch(encodeURI(url));
        if (!res.ok) {
            throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
        }
        const buffer = await res.arrayBuffer();
        await fsPromise.writeFile(`./AISKU/.cdn/file/ai.${version}.js`, Buffer.from(buffer));
    } catch (err) {
        throw new Error(`Failed to downloadFile: ${err.message}`);
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
        const data = await fsPromise.readFile(packageJsonPath, 'utf8');
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
        createDirectory("./AISKU/.cdn/file");
        createDirectory("./AISKU/.cdn/img");
        const packageJsonPath = './AISKU/package.json';
        const version = await getVersionFromPackageJson(packageJsonPath);
        let versions = [];

        if(process.argv.length >= 3) {
            let versionList = process.argv[2];
            versions = versionList.split(',');
        }
        version && versions.push(version);
        console.log("Versions to download: ", versions);
        for (let j = 0; j < versions.length; j++) {
            let version = versions[j];
            version = version.trim();
            await downloadFile(version);
            await downloadFile(version + ".min");
            const filename = `./AISKU/.cdn/file/ai.${version}.js`;
            const minFileName = `./AISKU/.cdn/file/ai.${version}.min.js`;
            try {
                const fileSize = ((await fsPromise.stat(filename)).size / 1024).toFixed(1);
                const minFileSize = ((await fsPromise.stat(minFileName)).size / 1024).toFixed(1);
                await generateSizeBadge(version + ".js", fileSize);
                await generateSizeBadge(version + ".min.js", minFileSize, "min");
                let url = "https://js.monitor.azure.com/scripts/b/ai." + version + ".min.js";
                if (version.includes("night")) {
                    url = "https://js.monitor.azure.com/nightly/ai." + version + ".min.js";
                }
                const opts = {
                    method: 'GET',
                    url: url,
                    headers: {'Accept-Encoding': 'gzip'}
                };
                request(opts).on('response', function(res) {
                    if (res.headers['content-encoding'] === 'gzip') {
                        let bodySize = 0;  // bytes size over the wire
                        res.on('data', function(data) {
                            bodySize += data.length;
                        })
                        res.on('end', async function() {
                            console.log("Gzip file size: ", (bodySize / 1024).toFixed(1));
                            await generateSizeBadge(version + ".gzip.min.js", (bodySize / 1024).toFixed(1), "gzip");
                        });
                    } else {
                        console.error("Content is not gzip encoded");
                    }
                }).on('error', function(err) {
                    console.error('Request error:', err);
                });
            } catch (err) {
                console.error('Error:', err);
            }
        }
   
}
main();
