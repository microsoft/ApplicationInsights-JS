/**
 * This script analyzes the ApplicationInsights SDK to understand how it might 
 * interact with esbuild and cause property redefinition issues in Cloudflare Workers.
 */

const fs = require('fs');
const path = require('path');

// Directory where node_modules are located
const nodeModulesDir = path.join(__dirname, 'angular-cloudflare-repro', 'node_modules');
const appInsightsDir = path.join(nodeModulesDir, '@microsoft', 'applicationinsights-web');

// Function to scan a file for potential issues
function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Look for patterns that might cause issues with esbuild
    const result = {
      path: filePath,
      definePropertyCount: (content.match(/Object\.defineProperty/g) || []).length,
      namePropertyAccess: (content.match(/\.name\s*=/g) || []).length,
      hasNameMetadata: content.includes('__name'),
      functionNameUsage: (content.match(/\.name\s*\)/g) || []).length,
      dynamicFunctionCreation: content.includes('new Function('),
      propertyRedefinition: content.includes('Object.defineProperties'),
      reflectionUsage: content.includes('Reflect.')
    };

    // Look for specific problematic patterns
    if (result.definePropertyCount > 0 || result.namePropertyAccess > 0 || result.hasNameMetadata) {
      return result;
    }
    
    return null;
  } catch (error) {
    return { path: filePath, error: error.message };
  }
}

// Function to recursively scan directories
async function scanDirectory(dir, fileExtensions = ['.js', '.ts']) {
  const results = [];
  
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        results.push(...await scanDirectory(filePath, fileExtensions));
      } else if (fileExtensions.includes(path.extname(filePath))) {
        const result = analyzeFile(filePath);
        if (result) {
          results.push(result);
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error);
  }
  
  return results;
}

// Main function
async function main() {
  console.log('Analyzing ApplicationInsights SDK...');
  
  if (!fs.existsSync(appInsightsDir)) {
    console.error('ApplicationInsights SDK not found. Please run setup.sh first.');
    return;
  }
  
  const results = await scanDirectory(appInsightsDir);
  
  // Filter for the most suspicious files
  const suspiciousFiles = results
    .filter(r => r.definePropertyCount > 0 || r.namePropertyAccess > 0 || r.hasNameMetadata)
    .sort((a, b) => (b.definePropertyCount + b.namePropertyAccess) - (a.definePropertyCount + a.namePropertyAccess));
  
  console.log(`\nFound ${suspiciousFiles.length} suspicious files:`);
  suspiciousFiles.forEach((file, i) => {
    console.log(`\n${i + 1}. ${path.relative(appInsightsDir, file.path)}`);
    console.log(`   - Object.defineProperty calls: ${file.definePropertyCount}`);
    console.log(`   - .name property assignments: ${file.namePropertyAccess}`);
    console.log(`   - Has __name metadata: ${file.hasNameMetadata}`);
    console.log(`   - Function name usage: ${file.functionNameUsage}`);
    if (file.dynamicFunctionCreation) console.log('   - Uses dynamic function creation (new Function())');
    if (file.propertyRedefinition) console.log('   - Uses Object.defineProperties');
    if (file.reflectionUsage) console.log('   - Uses Reflection API');
  });
  
  // Check for use of DynamicProto-JS as it was mentioned in the issue comments
  const dynamicProtoDir = path.join(nodeModulesDir, '@microsoft', 'dynamicproto-js');
  if (fs.existsSync(dynamicProtoDir)) {
    console.log('\nAnalyzing DynamicProto-JS package...');
    const dynamicProtoResults = await scanDirectory(dynamicProtoDir);
    
    const suspiciousDynamicProtoFiles = dynamicProtoResults
      .filter(r => r.definePropertyCount > 0 || r.namePropertyAccess > 0 || r.hasNameMetadata)
      .sort((a, b) => (b.definePropertyCount + b.namePropertyAccess) - (a.definePropertyCount + a.namePropertyAccess));
    
    if (suspiciousDynamicProtoFiles.length > 0) {
      console.log(`\nFound ${suspiciousDynamicProtoFiles.length} suspicious files in DynamicProto-JS:`);
      suspiciousDynamicProtoFiles.forEach((file, i) => {
        console.log(`\n${i + 1}. ${path.relative(dynamicProtoDir, file.path)}`);
        console.log(`   - Object.defineProperty calls: ${file.definePropertyCount}`);
        console.log(`   - .name property assignments: ${file.namePropertyAccess}`);
        console.log(`   - Has __name metadata: ${file.hasNameMetadata}`);
      });
    } else {
      console.log('\nNo suspicious patterns found in DynamicProto-JS');
    }
  } else {
    console.log('\nDynamicProto-JS package not found');
  }
  
  console.log('\nAnalysis complete.');
}

main().catch(console.error);