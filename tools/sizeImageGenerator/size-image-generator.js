const fs = require('fs').promises;
const zlib = require('zlib');
async function getVersionFromPackageJson(packageJsonPath) {
    try {
        const data = await fs.readFile(packageJsonPath, 'utf8');
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
        console.log(sizeBadge);

        const res = await fetch(encodeURI(sizeBadge));
        if (!res.ok) {
            throw new Error(`Failed to fetch ${sizeBadge}: ${res.status} ${res.statusText}`);
        }

        const buffer = await res.arrayBuffer();
        await fs.writeFile(`img/ai.${path}.svg`, Buffer.from(buffer));
        console.log('File saved successfully');
    } catch (err) {
        throw new Error(`Failed to generate size badge: ${err.message}`);
    }
}

async function main() {
    const packageJsonPath = '../../AISKU/package.json';
    try {
        const version = await getVersionFromPackageJson(packageJsonPath);
        console.log(`Version from package.json: ${version}`);
        const filename = `../../AISKU/browser/es5/ai.${version}.js`;
        const minFileName = `../../AISKU/browser/es5/ai.${version}.min.js`;
        console.log(`File to check: ${filename}`);

        const fileSize = Math.ceil((await fs.stat(filename)).size / 1024);
        const minFileSize = Math.ceil((await fs.stat(minFileName)).size / 1024);


        console.log(`File size: ${fileSize}kb`);
        console.log(`Minified file size: ${minFileSize}kb`);

        const fileContent = await fs.readFile(filename);
        const gzippedContent = zlib.gzipSync(fileContent);
        const gzippedSize = Math.ceil(gzippedContent.length / 1024);
        console.log(`Gzipped file size: ${gzippedSize}kb`);

        await generateSizeBadge(version + ".js", fileSize);
        await generateSizeBadge(version + ".min.js", minFileSize);
        await generateSizeBadge(version + ".min.js.gzip", gzippedSize);

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
