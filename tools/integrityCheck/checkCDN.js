const axios = require('axios');
const crypto = require('crypto');

function calculateHash(source) {
  let sha256 =  crypto.createHash('sha256').update(source).digest().toString('base64');
  let sha384 =  crypto.createHash('sha384').update(source).digest().toString('base64');
  let sha512 =  crypto.createHash('sha512').update(source).digest().toString('base64');
  return "sha256-" + sha256 + " sha384-" + sha384 + " sha512-" + sha512;
}
async function fetchFile(url) {
  var readedFile;
  try {
    const response = await axios.get(url);
    readedFile = response.data;
  } catch (error) {
    console.error('Error:', error.message);
  }
  return readedFile || "";
}


async function main() {
  const integrityUrl = 'https://js.monitor.azure.com/beta/ai.3.integrity.json';
  var integrityFile = await fetchFile(integrityUrl);
  const integrityDictionary = {};

  for (const key in integrityFile.ext) {
    if (Object.hasOwnProperty.call(integrityFile.ext, key)) {
      const fileMember = integrityFile.ext[key];
      integrityDictionary[fileMember.file] = fileMember.integrity;
    }
  }

  for (key in integrityDictionary) {
    const value = integrityDictionary[key];
    var originUrl = 'https://js.monitor.azure.com/scripts/b/' + key;
    var originalFile = await fetchFile(originUrl);
    let calcualteSha = calculateHash(originalFile, 'sha256');
    if (value !== calcualteSha) {
      console.error(originUrl + " intergrity check failed");
    } else {
    console.log(originUrl + " intergrity check to be: " +(value === calcualteSha));
   }
  }
}

// Call the main function
main();