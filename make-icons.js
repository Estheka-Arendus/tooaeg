// Generates the PNG app icons (teal square with a white stopwatch) without dependencies.
const fs = require('fs'), zlib = require('zlib');
function crc32(buf) { let c, crc = ~0; for (const b of buf) { c = (crc ^ b) & 255; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; } return ~crc >>> 0; }
function chunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); }
function icon(size) {
  const S = 4, raw = Buffer.alloc((size * 4 + 1) * size);
  const bg = [15, 118, 110], fg = [255, 255, 255];
  const inside = (x, y) => { // coords in 0..1
    const cx = .5, cy = .55, dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy);
    if (r < .30 && r > .245) return true;                                   // dial ring
    if (Math.abs(x - .5) < .03 && y > .17 && y < .26) return true;           // stem
    if (Math.abs(y - .16) < .03 && Math.abs(x - .5) < .08) return true;      // button
    if (Math.abs(x - .5) < .022 && y > .37 && y <= .55) return true;          // minute hand
    const t = ((x - .5) * .7071 + (y - .55) * .7071), n = Math.abs(-(x - .5) * .7071 + (y - .55) * .7071);
    if (t > -.01 && t < .13 && n < .022) return true;                        // hour hand
    return r < .035;
  };
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      let hit = 0; for (let i = 0; i < S; i++) for (let j = 0; j < S; j++) hit += inside((x + (i + .5) / S) / size, (y + (j + .5) / S) / size);
      const a = hit / (S * S), o = y * (size * 4 + 1) + 1 + x * 4;
      for (let c = 0; c < 3; c++) raw[o + c] = Math.round(bg[c] * (1 - a) + fg[c] * a);
      raw[o + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
for (const [n, s] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) fs.writeFileSync(n, icon(s));
