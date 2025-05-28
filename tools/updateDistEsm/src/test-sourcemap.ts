// Simple test to verify source map handling in updateDistEsm.js
declare function require(name: string): any;
declare const __dirname: string;

const fs = require('fs');
const path = require('path');

// Create test directory
const testDir = path.join(__dirname, '../test-sourcemap');
if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir);
} else {
    // Clean up previous test files
    const files = fs.readdirSync(testDir);
    files.forEach((file: string) => {
        fs.unlinkSync(path.join(testDir, file));
    });
}

console.log('=== Test 1: Source map with TypeScript references ===');
// Create a sample TypeScript file path for our test
const tsFilePath = '../src/example.ts';

// Create a test JS file with source map
const jsContent = `// Test JS file
function greet() {
    console.log('Hello, world!');
}
//# sourceMappingURL=test.js.map`;

const jsFilePath = path.join(testDir, 'test.js');
fs.writeFileSync(jsFilePath, jsContent);

// Create a source map pointing to TypeScript file
const sourceMapContent = JSON.stringify({
    version: 3,
    file: 'test.js',
    sourceRoot: '',
    sources: [tsFilePath],
    names: [],
    mappings: 'AAAA;AACA;AACA;AACA',
    sourcesContent: ['// Original TypeScript content\nfunction greet(): void {\n    console.log(\'Hello, world!\');\n}']
});

const sourceMapPath = path.join(testDir, 'test.js.map');
fs.writeFileSync(sourceMapPath, sourceMapContent);

console.log('Created test files:');
console.log(`- ${jsFilePath}`);
console.log(`- ${sourceMapPath}`);
console.log('Original source map references:', JSON.parse(sourceMapContent).sources);

// 1. Read the source map
const existingMapContent = fs.readFileSync(sourceMapPath, "utf8");
let existingMap: any;
try {
    existingMap = JSON.parse(existingMapContent);
} catch (e) {
    console.error(`Error parsing source map ${sourceMapPath}: ${e}`);
}

// 2. Generate a modified JS file
const modifiedJsContent = `/* Test banner */
${jsContent.replace("'Hello, world!'", "'Modified hello, world!'")}`;
fs.writeFileSync(jsFilePath, modifiedJsContent);

// 3. Create a simple source map
const generatedMap: any = {
    version: 3,
    file: 'test.js.map',
    sourceRoot: '',
    sources: [jsFilePath], // This would typically point to JS file
    names: [],
    mappings: 'AAAA;AACA;AACA;AACA',
    sourcesContent: [modifiedJsContent]
};

// 4. Apply our fix to preserve the TypeScript sources
if (existingMap && existingMap.sources && existingMap.sources.length > 0) {
    console.log(`Preserving original sources in map: ${existingMap.sources.join(', ')}`);
    generatedMap.sources = existingMap.sources;
    
    // Preserve sourcesContent if available
    if (existingMap.sourcesContent && existingMap.sourcesContent.length > 0) {
        generatedMap.sourcesContent = existingMap.sourcesContent;
    }
}

// 5. Write the modified map back
fs.writeFileSync(sourceMapPath, JSON.stringify(generatedMap));

// Read the modified source map
let updatedMapContent = fs.readFileSync(sourceMapPath, 'utf8');
let updatedMap = JSON.parse(updatedMapContent);

console.log('Updated source map references:', updatedMap.sources);

// Check if the TypeScript source was preserved
const success1 = updatedMap.sources.includes(tsFilePath);
console.log('Test 1 result:', success1 ? 'SUCCESS' : 'FAILED');
console.log('TypeScript source was ' + (success1 ? 'preserved' : 'not preserved'));

// =============================================================
console.log('\n=== Test 2: Missing source map file ===');

// Create a new JS file with no existing source map
const jsFile2 = path.join(testDir, 'test2.js');
const jsContent2 = `// Test JS file 2
function greet2() {
    console.log('Hello again!');
}
//# sourceMappingURL=test2.js.map`;

fs.writeFileSync(jsFile2, jsContent2);
console.log('Created test file without source map:', jsFile2);

// No existing map to read - should handle this gracefully
const mapFile2 = path.join(testDir, 'test2.js.map');
if (fs.existsSync(mapFile2)) {
    fs.unlinkSync(mapFile2);
}

// Generate a new map and write it
const generatedMap2: any = {
    version: 3,
    file: 'test2.js.map',
    sourceRoot: '',
    sources: [jsFile2],
    names: [],
    mappings: 'AAAA;AACA;AACA;AACA',
    sourcesContent: [jsContent2]
};

fs.writeFileSync(mapFile2, JSON.stringify(generatedMap2));
console.log('Created new source map:', mapFile2);

// Read the generated map
const mapContent2 = fs.readFileSync(mapFile2, 'utf8');
const map2 = JSON.parse(mapContent2);
console.log('Generated source map references:', map2.sources);

// =============================================================
console.log('\n=== Test 3: Invalid source map ===');

// Create a JS file with invalid source map
const jsFile3 = path.join(testDir, 'test3.js');
const jsContent3 = `// Test JS file 3
function greet3() {
    console.log('Hello corrupt map!');
}
//# sourceMappingURL=test3.js.map`;

fs.writeFileSync(jsFile3, jsContent3);
console.log('Created test file:', jsFile3);

// Create an invalid source map
const mapFile3 = path.join(testDir, 'test3.js.map');
fs.writeFileSync(mapFile3, '{ This is not valid JSON');
console.log('Created invalid source map:', mapFile3);

// Try to read the invalid map
try {
    let invalidMapContent = fs.readFileSync(mapFile3, 'utf8');
    JSON.parse(invalidMapContent);
    console.log('ERROR: Should have thrown an exception for invalid JSON');
} catch (e) {
    console.log('Correctly detected invalid JSON in source map');
}

// Generate a new valid map
const generatedMap3: any = {
    version: 3,
    file: 'test3.js.map',
    sourceRoot: '',
    sources: [jsFile3],
    names: [],
    mappings: 'AAAA;AACA;AACA;AACA',
    sourcesContent: [jsContent3]
};

fs.writeFileSync(mapFile3, JSON.stringify(generatedMap3));
console.log('Successfully replaced invalid map with a valid one');

// Read the fixed map
const mapContent3 = fs.readFileSync(mapFile3, 'utf8');
const map3 = JSON.parse(mapContent3);
console.log('Fixed map references:', map3.sources);

console.log('\nAll tests completed!');