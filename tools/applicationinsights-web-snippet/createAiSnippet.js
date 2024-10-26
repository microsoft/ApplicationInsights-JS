// createFile.js
const fs = require('fs');
const path = require('path');

// Define the path to the snippet.js file
const filePath = path.join(__dirname, 'src/snippet.ts'); // Adjust the path if necessary
const aiFilePath = path.join(__dirname, 'src/aiSnippet.ts');
const oneDSFilePath = path.join(__dirname, 'src/oneDSSnippet.ts');
// Read the snippet.js file
fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        process.exit(1);
    }


    let remove = data.replace(/let\s+isOneDS\s*=\s*\w+;/i, '');
    // Check if the replace did anything
    if (remove === data) {
        // If no change was made, throw an error to break the build
        throw new Error("Failed to remove 'let isOneDS' assignment. Possible content change.");
    }

    // Replace all occurrences of "checkplace" with "true"
    let ai = remove.replace(/isOneDS/g, 'false');
    ai = "// DO NOT EDIT - Automatically Generated\n" + ai;

    // Write the modified content back to the file (or a new file if you prefer)
    fs.writeFile(aiFilePath, ai, 'utf8', (err) => {
        if (err) {
            console.error('Error writing file:', err);
            process.exit(1);
        }
        console.log('New File created successfully:', aiFilePath);
    });

    let oneDS = remove.replace(/isOneDS/g, 'true');
    oneDS = "// DO NOT EDIT - Automatically Generated\n" + oneDS;
    fs.writeFile(oneDSFilePath, oneDS, 'utf8', (err) => {
        if (err) {
            console.error('Error writing file:', err);
            process.exit(1);
        }
        console.log('New File created successfully:', oneDSFilePath);
    });
}  
);
