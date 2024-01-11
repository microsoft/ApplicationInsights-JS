const fs = require('fs');
const path = require('path');

// Recursively process a folder and its subfolders to search for HTML files
const processFolder = (folderPath) => {
  const files = fs.readdirSync(folderPath);

  files.forEach((file) => {
    const filePath = path.join(folderPath, file);

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

// Prepare the script content to be injected
const scriptFilePath = path.join(__dirname, '../applicationinsights-web-snippet/build/output/snippet.min.js');
let scriptContent = fs.readFileSync(scriptFilePath, 'utf8');

// Define the connection string to replace the placeholder
const connectionString = 'InstrumentationKey=814a172a-92fd-4950-9023-9cf13bb65696;IngestionEndpoint=https://eastus-8.in.applicationinsights.azure.com/;LiveEndpoint=https://eastus.livediagnostics.monitor.azure.com/';

// Replace the placeholder string with the actual connection string
scriptContent = scriptContent.replace('YOUR_CONNECTION_STRING', connectionString);
processFolder(docsFolder);


function injectScript(filePath) {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return;
    }

    // Check if the script content is already present in the file
    const fileContent = fs.readFileSync(filePath, 'utf8');
  
    // Check if the script content is already present in the file
    if (fileContent.includes(scriptContent)) {
      console.log(`Script already present in ${filePath}`);
      return;
    }
    // Create the modified content by inserting the script tag right before the closing head tag
    const modifiedContent = data.replace(/(<\/head[^>]*)/i, `\n<script>${scriptContent}</script>\n$1`);
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
