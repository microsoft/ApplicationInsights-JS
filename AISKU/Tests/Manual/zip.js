async function getDosDateTime(timestamp = Date.now()) {
    const t = new Date(timestamp);
    const dosDate = ((t.getFullYear() - 1980) << 9) | ((t.getMonth() + 1) << 5) | t.getDate();
    const dosTime = (t.getHours() << 11) | (t.getMinutes() << 5) | Math.floor(t.getSeconds() / 2);
    return { dosDate, dosTime };
}

async function compress(data) {
    const compressedStream = new Response(data)
        .body.pipeThrough(new CompressionStream('deflate-raw'));
    const bytes = await new Response(compressedStream).arrayBuffer();
    return new Uint8Array(bytes);
}

function crc32FromUint8Array(data) {
    let crc = 0xffffffff;
    for (let i = 0; i < data.length; i++) {
        crc ^= data[i];
        for (let j = 8; j-- > 0; ) {
            if (crc & 1) crc = (crc >>> 1) ^ 0xedb88320;
            else crc >>>= 1;
        }
    }
    return crc ^ 0xffffffff;
}
function toHexString(uint8Array) {
    return Array.from(uint8Array)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join(' ');
}
async function printBlobHex(blob) {
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const hexString = toHexString(uint8Array);
    console.log(hexString); // Optional: Log to console
}
async function createZipAndDownload() {
    const localFileHeaders = [];
    const centralDirectoryHeaders = [];
    let offset = 0;

    // Sample data: replace with actual file data
    const fileName = "example.txt";
    const fileData = new TextEncoder().encode("test1test2test3test45678whathappen");
    const compressedData = await compress(fileData);
    const hexString = toHexString(compressedData);
    console.log(hexString); // Optional: Log to console
    const { dosDate, dosTime } = await getDosDateTime();

    const crc32 = crc32FromUint8Array(fileData); 
    const uncompressedSize = fileData.length;
    const compressedSize = compressedData.length;

    const localFileHeader = [
        0x50, 0x4b, 0x03, 0x04, // Local file header signature
        0x14, 0x00, // Version needed to extract
        0x00, 0x00, // General purpose bit flag
        0x08, 0x00, // Compression method (8 = deflate)
        dosTime & 0xff, dosTime >> 8,
        dosDate & 0xff, dosDate >> 8,
        crc32 & 0xff, (crc32 >> 8) & 0xff, (crc32 >> 16) & 0xff, (crc32 >> 24) & 0xff,
        compressedSize & 0xff, (compressedSize >> 8) & 0xff, (compressedSize >> 16) & 0xff, (compressedSize >> 24) & 0xff,
        uncompressedSize & 0xff, (uncompressedSize >> 8) & 0xff, (uncompressedSize >> 16) & 0xff, (uncompressedSize >> 24) & 0xff,
        fileName.length & 0xff, (fileName.length >> 8),
        0x00, 0x00 // Extra field length
    ];
    localFileHeaders.push(new Uint8Array(localFileHeader));
    
    const fileNameBytes = new TextEncoder().encode(fileName);
    const centralDirectoryHeader = [
        0x50, 0x4b, 0x01, 0x02, // Central directory file header signature
        0x14, 0x00, // Version made by
        0x14, 0x00, // Version needed to extract
        0x00, 0x00, // General purpose bit flag
        0x08, 0x00, // Compression method (8 = deflate)
        dosTime & 0xff, dosTime >> 8,
        dosDate & 0xff, dosDate >> 8,
        crc32 & 0xff, (crc32 >> 8) & 0xff, (crc32 >> 16) & 0xff, (crc32 >> 24) & 0xff,
        compressedSize & 0xff, (compressedSize >> 8) & 0xff, (compressedSize >> 16) & 0xff, (compressedSize >> 24) & 0xff,
        uncompressedSize & 0xff, (uncompressedSize >> 8) & 0xff, (uncompressedSize >> 16) & 0xff, (uncompressedSize >> 24) & 0xff,
        fileNameBytes.length & 0xff, (fileNameBytes.length >> 8),
        0x00, 0x00, // Extra field length
        0x00, 0x00, // File comment length
        0x00, 0x00, // Disk number start
        0x00, 0x00, // Internal file attributes
        0x00, 0x00, 0x00, 0x00, // External file attributes
        offset & 0xff, (offset >> 8) & 0xff, (offset >> 16) & 0xff, (offset >> 24) & 0xff
    ];
    centralDirectoryHeaders.push(new Uint8Array(centralDirectoryHeader));
    
    offset += localFileHeader.length + fileNameBytes.length + compressedData.length;
    
    const centralDirectoryOffset = offset;
    const centralDirectorySize = centralDirectoryHeaders.reduce((sum, header) => sum + header.length, 0);
    
    const endOfCentralDirectoryRecord = [
        0x50, 0x4b, 0x05, 0x06, // End of central directory signature
        0x00, 0x00, // Number of this disk
        0x00, 0x00, // Disk where central directory starts
        centralDirectoryHeaders.length & 0xff, (centralDirectoryHeaders.length >> 8) & 0xff,
        centralDirectoryHeaders.length & 0xff, (centralDirectoryHeaders.length >> 8) & 0xff,
        centralDirectorySize & 0xff, (centralDirectorySize >> 8) & 0xff, (centralDirectorySize >> 16) & 0xff, (centralDirectorySize >> 24) & 0xff,
        centralDirectoryOffset & 0xff, (centralDirectoryOffset >> 8) & 0xff, (centralDirectoryOffset >> 16) & 0xff, (centralDirectoryOffset >> 24) & 0xff,
        0x00, 0x00 // Comment length
    ];

    // Combine all parts into one blob
    const zipBlob = new Blob([
        new Uint8Array(localFileHeaders.flat()),
        fileNameBytes,
        compressedData,
        new Uint8Array(centralDirectoryHeaders.flat()),
        new Uint8Array(endOfCentralDirectoryRecord)
    ]);
    printBlobHex(zipBlob); // Optional: Print to page

    // Trigger download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipBlob);
    link.download = 'example.zip';
    link.click();
}
