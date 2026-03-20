import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a proper PNG file for a given size and color
function createSolidColorPNG(width, height, color = '#6b46c1') {
  // Convert hex color to RGB
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  
  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type (RGB)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrCRC = crc32(Buffer.concat([Buffer.from('IHDR'), ihdrData]));
  const ihdrChunk = Buffer.concat([
    Buffer.from([0, 0, 0, 13]), // length
    Buffer.from('IHDR'),
    ihdrData,
    Buffer.from([
      (ihdrCRC >>> 24) & 0xFF,
      (ihdrCRC >>> 16) & 0xFF,
      (ihdrCRC >>> 8) & 0xFF,
      ihdrCRC & 0xFF
    ])
  ]);
  
  // Create image data: each pixel is RGB (3 bytes), with filter byte before each scanline
  const rowSize = width * 3 + 1; // +1 for filter byte
  const imageData = Buffer.alloc(height * rowSize);
  for (let y = 0; y < height; y++) {
    const rowStart = y * rowSize;
    imageData[rowStart] = 0; // filter type: none
    for (let x = 0; x < width; x++) {
      const pixelStart = rowStart + 1 + x * 3;
      imageData[pixelStart] = r;
      imageData[pixelStart + 1] = g;
      imageData[pixelStart + 2] = b;
    }
  }
  
  // Compress image data
  const compressedData = zlib.deflateSync(imageData);
  
  // IDAT chunk
  const idatCRC = crc32(Buffer.concat([Buffer.from('IDAT'), compressedData]));
  const idatChunk = Buffer.concat([
    Buffer.from([
      (compressedData.length >>> 24) & 0xFF,
      (compressedData.length >>> 16) & 0xFF,
      (compressedData.length >>> 8) & 0xFF,
      compressedData.length & 0xFF
    ]),
    Buffer.from('IDAT'),
    compressedData,
    Buffer.from([
      (idatCRC >>> 24) & 0xFF,
      (idatCRC >>> 16) & 0xFF,
      (idatCRC >>> 8) & 0xFF,
      idatCRC & 0xFF
    ])
  ]);
  
  // IEND chunk
  const iendCRC = crc32(Buffer.from('IEND'));
  const iendChunk = Buffer.concat([
    Buffer.from([0, 0, 0, 0]),
    Buffer.from('IEND'),
    Buffer.from([
      (iendCRC >>> 24) & 0xFF,
      (iendCRC >>> 16) & 0xFF,
      (iendCRC >>> 8) & 0xFF,
      iendCRC & 0xFF
    ])
  ]);
  
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Simple CRC32 implementation
function crc32(buffer) {
  const table = [];
  for (let i = 0; i < 256; i++) {
    let crc = i;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 1) ? (crc >>> 1) ^ 0xEDB88320 : crc >>> 1;
    }
    table[i] = crc;
  }
  
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buffer.length; i++) {
    crc = table[(crc ^ buffer[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

const publicDir = path.join(__dirname, '..', 'public');

// Create 192x192 icon
const icon192 = createSolidColorPNG(192, 192, '#6b46c1');
fs.writeFileSync(path.join(publicDir, 'icon-192x192.png'), icon192);
console.log('Created icon-192x192.png');

// Create 512x512 icon
const icon512 = createSolidColorPNG(512, 512, '#6b46c1');
fs.writeFileSync(path.join(publicDir, 'icon-512x512.png'), icon512);
console.log('Created icon-512x512.png');
