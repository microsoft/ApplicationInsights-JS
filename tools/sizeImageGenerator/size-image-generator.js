const fsPromise = require('fs').promises;
const fs = require('fs');
const zlib = require('zlib');
async function getVersionFromPackageJson(packageJsonPath) {
    try {
        const data = await fsPromise.readFile(packageJsonPath, 'utf8');
        const packageJson = JSON.parse(data);
        if (packageJson && packageJson.version) {
            return packageJson.version;
        } else {
            throw new Error('No version found in package.json');
        }
    } catch (err) {
        throw new Error(`Failed to read package.json: ${err.message}`);
    }
}

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
function createDirectory(dirName) {
    const dir = `./${dirName}`;
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
}
async function main() {
    createDirectory("img");
    const packageJsonPath = '../../AISKU/package.json';
    try {
        const version = await getVersionFromPackageJson(packageJsonPath);
        const filename = `../../AISKU/browser/es5/ai.${version}.js`;
        const minFileName = `../../AISKU/browser/es5/ai.${version}.min.js`;

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
main();
