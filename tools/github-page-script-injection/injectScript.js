const fs = require('fs');
const path = require('path');

// Recursively process a folder and its subfolders to search for HTML files
const processFolder = (folderPath) => {
  const files = fs.readdirSync(folderPath);

  files.forEach((file) => {
    const filePath = path.join(folderPath, file);

    if (fs.statSync(filePath).isDirectory()) {
      processFolder(filePath);
    } else if (path.extname(file) === '.html') {
      console.log(`process ${filePath}`);
      injectScript(filePath);
    } else if (path.extname(file) === '.md') {
      console.log(`process ${filePath}`);
      injectHtml(filePath);
    }
  });
};


// Start processing from the 'docs' folder
const docsFolder = path.join(__dirname, '../../docs');

// Prepare the script content to be injected
const scriptFilePath = path.join(__dirname, '../applicationinsights-web-snippet/build/output/snippet.min.js');
let scriptContent = fs.readFileSync(scriptFilePath, 'utf8');

// Replace the placeholder string with the actual connection string
const connectionString = 'InstrumentationKey=814a172a-92fd-4950-9023-9cf13bb65696;IngestionEndpoint=https://eastus-8.in.applicationinsights.azure.com/;LiveEndpoint=https://eastus.livediagnostics.monitor.azure.com/';
scriptContent = scriptContent.replace('YOUR_CONNECTION_STRING', connectionString);
scriptContent = `<script type="text/javascript">${scriptContent}</script>`;

// write this file into _include folder so that later github would reject it inside markdown files
const includeFolderPath = path.join(__dirname, '../../docs/_includes/');
const includeFolderFile = path.join(includeFolderPath, 'script.html');

// Check if the directory exists, create it if not
if (!fs.existsSync(includeFolderPath)) {
  fs.mkdirSync(includeFolderPath, { recursive: true });
}

// Now, write the file
fs.writeFileSync(includeFolderFile, scriptContent, 'utf8');

// recursively process all html files under docs folder
processFolder(docsFolder);

function injectHtml(filePath) {
  // Read the content of the Markdown file
  const markdownContent = fs.readFileSync(filePath, 'utf8');

  // Specify the injection string
  const injectionString = `{% include script.html %}`;

  // Append the injection string to the end of the Markdown content
  const updatedContent = `${markdownContent}\n\n${injectionString}`;

  // Write the updated content back to the file
  fs.writeFileSync(filePath, updatedContent, 'utf8');

  console.log(`Markdown file injection completed for ${filePath}`);
}

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
