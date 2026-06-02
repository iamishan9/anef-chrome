import fs from "node:fs";
import zlib from "node:zlib";

const sizes = [16, 32, 48, 128];

function crc32(buffer) {
  let crc = ~0;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return ~crc >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function hex(color) {
  const clean = color.replace("#", "");
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
    255,
  ];
}

function setPixel(pixels, size, x, y, color) {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const i = (Math.floor(y) * size + Math.floor(x)) * 4;
  pixels[i] = color[0];
  pixels[i + 1] = color[1];
  pixels[i + 2] = color[2];
  pixels[i + 3] = color[3];
}

function fillRect(pixels, size, x, y, w, h, color) {
  for (let yy = Math.floor(y); yy < Math.ceil(y + h); yy += 1) {
    for (let xx = Math.floor(x); xx < Math.ceil(x + w); xx += 1) {
      setPixel(pixels, size, xx, yy, color);
    }
  }
}

function circle(pixels, size, cx, cy, radius, color) {
  const r2 = radius * radius;
  for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y += 1) {
    for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r2) setPixel(pixels, size, x, y, color);
    }
  }
}

function line(pixels, size, x1, y1, x2, y2, width, color) {
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
  for (let i = 0; i <= steps; i += 1) {
    const t = steps === 0 ? 0 : i / steps;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    circle(pixels, size, x, y, width / 2, color);
  }
}

function drawIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const bg = hex("#f7f9ff");
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = bg[0];
    pixels[i + 1] = bg[1];
    pixels[i + 2] = bg[2];
    pixels[i + 3] = 255;
  }

  const pad = Math.max(2, Math.round(size * 0.12));
  fillRect(pixels, size, pad, pad, size - pad * 2, size - pad * 2, hex("#ffffff"));

  const flagW = Math.max(3, Math.round(size * 0.16));
  fillRect(pixels, size, pad, pad, flagW / 3, size - pad * 2, hex("#000091"));
  fillRect(pixels, size, pad + flagW / 3, pad, flagW / 3, size - pad * 2, hex("#ffffff"));
  fillRect(pixels, size, pad + (flagW * 2) / 3, pad, flagW / 3, size - pad * 2, hex("#e1000f"));

  const x = Math.round(size * 0.56);
  const y1 = Math.round(size * 0.27);
  const y2 = Math.round(size * 0.50);
  const y3 = Math.round(size * 0.73);
  line(pixels, size, x, y1, x, y3, Math.max(2, size * 0.05), hex("#c8d2e3"));
  circle(pixels, size, x, y1, Math.max(2, size * 0.09), hex("#13a15f"));
  circle(pixels, size, x, y2, Math.max(2, size * 0.09), hex("#13a15f"));
  circle(pixels, size, x, y3, Math.max(2, size * 0.105), hex("#ffdf45"));
  circle(pixels, size, x, y3, Math.max(1, size * 0.045), hex("#2c2100"));

  const rawRows = [];
  for (let y = 0; y < size; y += 1) {
    rawRows.push(Buffer.from([0]));
    rawRows.push(pixels.subarray(y * size * 4, (y + 1) * size * 4));
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(Buffer.concat(rawRows))),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

fs.mkdirSync("icons", { recursive: true });
for (const size of sizes) {
  fs.writeFileSync(`icons/icon${size}.png`, drawIcon(size));
}
