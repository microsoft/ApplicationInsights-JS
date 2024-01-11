const fs = require('fs');
const path = require('path');

// Recursively process a folder and its subfolders to search for HTML files
const processFolder = (folderPath) => {
  const files = fs.readdirSync(folderPath);

  files.forEach((file) => {
    const filePath = path.join(folderPath, file);
    console.log(` ${filePath}`);

    if (fs.statSync(filePath).isDirectory()) {
      // If the current path is a directory, recursively process it
      processFolder(filePath);
    } else if (path.extname(file) === '.html') {
      // If it's an HTML file, inject the script
      console.log(`process ${filePath}`);

      injectScript(filePath);
    }
  });
};


// Start processing from the 'docs' folder
const docsFolder = path.join(__dirname, '../../docs');
processFolder(docsFolder);

function injectScript(filePath) {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return;
    }

    // Read the script content from a file
    const scriptFilePath = path.join(__dirname, 'script.js');
    const scriptContent = fs.readFileSync(scriptFilePath, 'utf8');

    // Check if the script content is already present in the file
    const fileContent = fs.readFileSync(filePath, 'utf8');
  
    // Check if the script content is already present in the file
    if (fileContent.includes(scriptContent)) {
      console.log(`Script already present in ${filePath}`);
      return;
    }
    // Create the modified content by inserting the script tag right before the closing head tag
    const modifiedContent = data.replace(/(<\/head[^>]*)/i, `\n${scriptContent}\n$1`);
    // Save the modified content back to the file
    fs.writeFile(filePath, modifiedContent, (err) => {
      if (err) {
        console.error('Error writing to file:', err);
        return;
      }
      console.log(`Script injected successfully into ${filePath}`);
    });
  });
}
