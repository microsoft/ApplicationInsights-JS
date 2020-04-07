import dynamicRemove from "@microsoft/dynamicproto-js/tools/rollup/node/removedynamic";
import MagicString from 'magic-string';

const fs = require("fs");
const globby = require("globby");

// You can use the following site to validate the resulting map file is valid
// http://sokra.github.io/source-map-visualization/#custom

// Function to remove the @DynamicProtoStubs and rewrite the headers for the dist-esm files
const getLines = (theValue) => {
    var value = "" + theValue;
    var lines = [];
    var idx = 0;
    var startIdx = 0;
    while (idx < value.length) {
      // Skip blank lines
      while (idx < value.length && (value[idx] === '\n' || value[idx] === '\r')) {
        idx++;
      }
  
      startIdx = idx;
      while (idx < value.length && !(value[idx] === '\n' || value[idx] === '\r')) {
        idx++;
      }
  
      var len = idx - startIdx;
      if (len > 0) {
        var line = value.substring(startIdx, idx);
        if (line.trim() !== "") {
          lines.push({
            value: line,
            idx: startIdx,
            len: len
          });
        }
      }
    }
  
    return lines;
  };
  
  const updateDistEsmFiles = (replaceValues, banner) => {
    const dynRemove = dynamicRemove();
    const files = globby.sync("./dist-esm/**/*.js");
    files.map(inputFile => {
      console.log("Loading - " + inputFile);
      var src = fs.readFileSync(inputFile, "utf8");
      var mapFile;
      if (inputFile.endsWith(".js")) {
        mapFile = inputFile + ".map";
      }
  
      var orgSrc = src;
      var theString = new MagicString(orgSrc);
  
      var result = dynRemove.transform(orgSrc, inputFile);
      if (result !== null && result.code) {
        src = result.code;
        console.log("Prototypes removed...");
  
        // Figure out removed lines
        var orgLines = getLines(orgSrc);
        var newLines = getLines(result.code);
        var line = 0;
        var newLine = 0;
        while (line < orgLines.length) {
          var matchLine = orgLines[line];
          var matchNewLine = newLines[newLine];
          var replaceText = "";
          line++;
          if (matchLine.value === matchNewLine.value) {
            newLine++;
          } else {
            console.log("Line Changed: " + matchLine.value);
            var endFound = false;
            var endLine = 0;
            // Skip over removed lines (There may be more than 1 function being removed)
            for (var nextLp = 0; endFound === false && newLine + nextLp < newLines.length; nextLp++) {
              if (newLine + nextLp < newLines.length) {
                for (var lp = 0; line + lp < orgLines.length; lp++) {
                  if (orgLines[line + lp].value === newLines[newLine + nextLp].value) {
                    endFound = true;
                    for (var i = 0; i < nextLp; i++) {
                        if (replaceText.length) {
                            replaceText += "\n";
                        }
                        replaceText += newLines[newLine + i].value;
                    }
                    endLine = line + lp;
                    newLine = newLine + nextLp;
                    break;
                  }
                }
              }
            }
  
            if (endFound) {
              console.log("Detected Removed lines " + line + " to " + endLine);
              theString.overwrite(matchLine.idx, orgLines[endLine - 1].idx + orgLines[endLine - 1].len, replaceText);
              line = endLine;
            } else {
                throw "Missing line - " + matchLine.value;
            }
          }
        }
      }
  
      // Replace the header
      Object.keys(replaceValues).forEach((value) => {
        src = src.replace(value, replaceValues[value]);
        var idx = orgSrc.indexOf(value);
        if (idx !== -1) {
          theString.overwrite(idx, idx + value.length, replaceValues[value]);
        }
      });
  
      // Rewrite the file
      theString.prepend(banner + "\n");
      src = banner + "\n" + src;
  
      src = src.trim();
      fs.writeFileSync(inputFile, src);
      if (mapFile) {
        var newMap = theString.generateMap({
          source: inputFile.toString(),
          file: mapFile,
          includeContent: true,
          hires: false
        });
  
        console.log("Rewriting Map file - " + mapFile);
        fs.writeFileSync(mapFile, newMap.toString());
      }
    });
  };
  
  export { updateDistEsmFiles };