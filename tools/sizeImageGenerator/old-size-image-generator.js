const fsPromise = require('fs').promises;
const fs = require('fs');
const zlib = require('zlib');

async function generateSizeBadge(path, fileSize) {
    try {
        const sizeBadge = `https://img.shields.io/badge/size-${fileSize}kb-blue`;
        const res = await fetch(encodeURI(sizeBadge));
        if (!res.ok) {
            throw new Error(`Failed to fetch ${sizeBadge}: ${res.status} ${res.statusText}`);
        }
        const buffer = await res.arrayBuffer();
        await fsPromise.writeFile(`img/ai.${path}.svg`, Buffer.from(buffer));
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
        await fsPromise.writeFile(`./cdnFile/ai.${version}.js`, Buffer.from(buffer));
    } catch (err) {
        throw new Error(`Failed to generate size badge: ${err.message}`);
    }
}

function createDirectory(dirName) {
    const dir = `./${dirName}`;
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
}

async function main() {
    createDirectory("cdnFile");
    createDirectory("img");
    const versions = ["3.1.2", "3.1.1", "3.1.0", "3.0.9", "3.0.8", "3.0.7", 
    "3.0.6", "3.0.5", "3.0.4", "3.0.3", "3.0.2", "3.0.1", "3.0.0", "2.8.18", 
    "2.8.17", "2.8.16", "2.8.15", "2.8.14", "2.8.13", "2.8.12", "2.8.11", 
    "2.8.10", "2.8.9", "2.8.8", "2.8.7", "2.8.6", "2.8.5", "2.8.4", "2.8.3", 
    "2.8.2", "2.8.1", "2.8.0", "2.7.4", "2.7.3", "2.7.2", "2.7.1", "2.7.0", 
    "2.6.5", "2.6.4", "2.6.3", "2.6.2", "2.6.1", "2.6.0", "2.5.11", "2.5.10", 
    "2.5.9", "2.5.8", "2.5.7", "2.5.6", "2.5.5", "2.5.4", "2.5.3", "2.5.2", 
    "2.4.4", "2.4.3", "2.4.1", "2.3.1", "2.3.0", "2.2.2", "2.2.0", "2.1.0", 
    "2.0.1", "2.0.0", "3", "3.gbl"];

    for (let i = 0; i < versions.length; i++) {
        let version = versions[i];
        await downloadFile(version);
        await downloadFile(version + ".min");
        const filename = `./cdnFile/ai.${version}.js`;
        const minFileName = `./cdnFile/ai.${version}.min.js`;
        try {
            const fileSize = Math.ceil((await fsPromise.stat(filename)).size / 1024);
            const minFileSize = Math.ceil((await fsPromise.stat(minFileName)).size / 1024);
            const fileContent = await fsPromise.readFile(filename);
            const gzippedContent = zlib.gzipSync(fileContent);
            const gzippedSize = Math.ceil(gzippedContent.length / 1024);    
            await generateSizeBadge(version + ".js", fileSize);
            await generateSizeBadge(version + ".min.js", minFileSize);
            await generateSizeBadge(version + ".min.js.gzip", gzippedSize);
        } catch (err) {
            console.error('Error:', err);
        }
    }
}
main();
