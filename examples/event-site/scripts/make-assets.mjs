import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '..', 'public');
const imgDir = path.join(publicDir, 'img');
const vendorDir = path.join(publicDir, 'vendor');

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  const typeAndData = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(typeAndData), 0);

  return Buffer.concat([lenBuf, typeAndData, crcBuf]);
}

function createPng(width, height, r1, g1, b1, r2, g2, b2) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8-bit depth
  ihdrData[9] = 2; // RGB
  ihdrData[10] = 0; // deflate
  ihdrData[11] = 0; // no filter
  ihdrData[12] = 0; // no interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Scanlines with noise and gradient
  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None
    const t = y / height;
    const baseR = Math.round(r1 + (r2 - r1) * t);
    const baseG = Math.round(g1 + (g2 - g1) * t);
    const baseB = Math.round(b1 + (b2 - b1) * t);

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 3;
      // noise factor
      const noise = (Math.random() - 0.5) * 20;
      rawData[pxOffset] = Math.min(255, Math.max(0, Math.round(baseR + noise)));
      rawData[pxOffset + 1] = Math.min(255, Math.max(0, Math.round(baseG + noise)));
      rawData[pxOffset + 2] = Math.min(255, Math.max(0, Math.round(baseB + noise)));
    }
  }

  const compressed = zlib.deflateSync(rawData, { level: 1 });
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeImages() {
  fs.mkdirSync(imgDir, { recursive: true });
  const configs = [
    { file: 'hero-1.png', c1: [30, 60, 110], c2: [180, 70, 90] },
    { file: 'hero-2.png', c1: [20, 100, 80], c2: [200, 150, 40] },
    { file: 'hero-3.png', c1: [80, 30, 120], c2: [40, 160, 180] },
  ];

  for (const cfg of configs) {
    const p = path.join(imgDir, cfg.file);
    if (!fs.existsSync(p)) {
      const png = createPng(1600, 900, ...cfg.c1, ...cfg.c2);
      fs.writeFileSync(p, png);
      console.log(
        `Generated ${path.relative(process.cwd(), p)} (${(png.length / 1024 / 1024).toFixed(2)} MB)`,
      );
    }
  }
}

function makeVendor() {
  fs.mkdirSync(vendorDir, { recursive: true });
  const p = path.join(vendorDir, 'analytics.js');
  if (!fs.existsSync(p)) {
    const chunks = ['window.__analyticsLoaded = true;\n'];
    // Add ~300KB of dummy code
    for (let i = 0; i < 9000; i++) {
      chunks.push(`function __track_metric_${i}(){return ${i} * 42;}\n`);
    }
    const content = chunks.join('');
    fs.writeFileSync(p, content, 'utf8');
    console.log(
      `Generated ${path.relative(process.cwd(), p)} (${(content.length / 1024).toFixed(1)} KB)`,
    );
  }
}

makeImages();
makeVendor();
