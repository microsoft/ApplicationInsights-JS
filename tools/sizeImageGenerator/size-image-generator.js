const fsPromise = require('fs').promises;
const fs = require('fs');
// const http = require('http');
const request = require('request');
// const zlib = require('zlib');

async function generateSizeBadge(path, fileSize, isGzip = false, maxSize = 80, minSize = 70) {
    try {
        let sizeBadge = `https://img.shields.io/badge/size-${fileSize}kb`;
        if (isGzip) {
            if (fileSize > maxSize) {
                sizeBadge += "-red";
            } else if (fileSize > minSize) {
                sizeBadge += "-yellow";
            } else {
                sizeBadge += "-brightgreen";
            }
        } else {
            sizeBadge += "-blue";
        }
        const res = await fetch(encodeURI(sizeBadge));
        if (!res.ok) {
            throw new Error(`Failed to fetch ${sizeBadge}: ${res.status} ${res.statusText}`);
        }
        const buffer = await res.arrayBuffer();
        await fsPromise.writeFile(`./AISKU/.cdn/img/ai.${path}.svg`, Buffer.from(buffer));
    } catch (err) {
        throw new Error(`Failed to generate size badge: ${err.message}`);
    }
}

async function downloadFile(version) {
    try {
        let url = "https://js.monitor.azure.com/scripts/b/ai." + version + ".js";
        const res = await fetch(encodeURI(url));
        if (!res.ok) {
            throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
        }
        const buffer = await res.arrayBuffer();
        await fsPromise.writeFile(`./AISKU/.cdn/file/ai.${version}.js`, Buffer.from(buffer));
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
    for (let i = 0; i < versions.length; i++) {
        let version = versions[i];
        await downloadFile(version);
        await downloadFile(version + ".min");
        const filename = `./AISKU/.cdn/file/ai.${version}.js`;
        const minFileName = `./AISKU/.cdn/file/ai.${version}.min.js`;
        try {
            const fileSize = ((await fsPromise.stat(filename)).size / 1024).toFixed(1);
            const minFileSize = ((await fsPromise.stat(minFileName)).size / 1024).toFixed(1);
            await generateSizeBadge(version + ".js", fileSize);
            await generateSizeBadge(version + ".min.js", minFileSize);
            let url = "https://js.monitor.azure.com/scripts/b/ai." + version + ".min.js";
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
                        await generateSizeBadge(version + ".gzip.min.js", (bodySize / 1024).toFixed(1), true);
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
