/**
 * This script tests different esbuild configurations to understand
 * how they process the code and potentially cause issues in Cloudflare Workers
 */

const { build } = require('esbuild');
const fs = require('fs');
const path = require('path');

// Create a simple test file with functions
const createTestFile = () => {
  const testDir = path.join(__dirname, 'esbuild-test');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  const testFile = path.join(testDir, 'test.js');
  fs.writeFileSync(testFile, `
// Named function
function namedFunction() {
  console.log("I'm a named function");
}

// Anonymous function assigned to variable
const anonymousFunction = function() {
  console.log("I'm anonymous");
};

// Arrow function
const arrowFunction = () => {
  console.log("I'm an arrow function");
};

// Class with methods
class TestClass {
  constructor() {
    this.value = 42;
  }
  
  method1() {
    console.log("Method 1");
  }
  
  method2() {
    console.log("Method 2");
  }
}

// Access function name
console.log(namedFunction.name);
console.log(anonymousFunction.name);
console.log(arrowFunction.name);
console.log(TestClass.name);
console.log(new TestClass().method1.name);

// Export everything
export {
  namedFunction,
  anonymousFunction,
  arrowFunction,
  TestClass
};
  `);
  
  return { testDir, testFile };
};

// Build with different configurations
const runBuilds = async () => {
  const { testDir, testFile } = createTestFile();
  
  // Test different configurations
  const configs = [
    {
      name: 'default',
      preserveNames: undefined
    },
    {
      name: 'preserveNames-true',
      preserveNames: true
    },
    {
      name: 'preserveNames-false',
      preserveNames: false
    },
    {
      name: 'minified',
      minify: true,
      preserveNames: undefined
    },
    {
      name: 'minified-preserveNames',
      minify: true,
      preserveNames: true
    }
  ];
  
  for (const config of configs) {
    const outfile = path.join(testDir, `output-${config.name}.js`);
    
    console.log(`Building with configuration: ${config.name}`);
    try {
      await build({
        entryPoints: [testFile],
        bundle: true,
        outfile,
        format: 'esm',
        platform: 'neutral',
        minify: config.minify || false,
        preserveNames: config.preserveNames,
        metafile: true
      });
      
      // Read output and log interesting parts
      const output = fs.readFileSync(outfile, 'utf8');
      console.log(`${config.name} output size: ${output.length} bytes`);
      
      // Check for __name helper function
      const hasNameHelper = output.includes('__name');
      console.log(`${config.name} includes __name helper: ${hasNameHelper}`);
      
      // Check for Object.defineProperty
      const definePropertyCount = (output.match(/Object\.defineProperty/g) || []).length;
      console.log(`${config.name} calls to Object.defineProperty: ${definePropertyCount}`);
      
      // Check for name property references
      const namePropertyCount = (output.match(/\.name/g) || []).length;
      console.log(`${config.name} references to .name: ${namePropertyCount}`);
      
      // If the __name helper is present, show its implementation
      if (hasNameHelper) {
        const nameHelperMatch = output.match(/function __name\(target[^{]*{[^}]*}/);
        if (nameHelperMatch) {
          console.log(`\n${config.name} __name helper implementation:`);
          console.log(nameHelperMatch[0]);
        }
      }
      
      console.log('-----------------------------------');
    } catch (error) {
      console.error(`Error building ${config.name}:`, error);
    }
  }
};

// Main function
async function main() {
  try {
    // Install esbuild if not already present
    const { execSync } = require('child_process');
    console.log('Ensuring esbuild is installed...');
    execSync('npm install -D esbuild', { stdio: 'inherit' });
    
    await runBuilds();
    console.log('\nAll builds completed!');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();