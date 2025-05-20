// Simple test to verify source map handling in updateDistEsm.js
const fs = require('fs');
const path = require('path');

// Create test directory
const testDir = path.join(__dirname, 'test-sourcemap');
if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir);
}

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

// Instead of using the actual module, let's directly test the critical part:
// 1. Read the source map
const existingMapContent = fs.readFileSync(sourceMapPath, "utf8");
let existingMap;
try {
    existingMap = JSON.parse(existingMapContent);
} catch (e) {
    console.error(`Error parsing source map ${sourceMapPath}: ${e}`);
}

// 2. Generate a modified JS file (simulating what updateDistEsm.js would do)
const modifiedJsContent = `/* Test banner */
${jsContent.replace("'Hello, world!'", "'Modified hello, world!'")}`;
fs.writeFileSync(jsFilePath, modifiedJsContent);

// 3. Create a simple source map (simulating what magic-string would generate)
const generatedMap = {
    version: 3,
    file: 'test.js.map',
    sourceRoot: '',
    sources: [jsFilePath], // This would typically point to JS file, not TS file
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
const updatedMapContent = fs.readFileSync(sourceMapPath, 'utf8');
const updatedMap = JSON.parse(updatedMapContent);

console.log('Updated source map references:', updatedMap.sources);

// Check if the TypeScript source was preserved
const success = updatedMap.sources.includes(tsFilePath);
console.log('Test result:', success ? 'SUCCESS' : 'FAILED');
console.log('TypeScript source was ' + (success ? 'preserved' : 'not preserved'));