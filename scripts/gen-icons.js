#!/usr/bin/env node
/**
 * Generates icons/icon-192.png and icons/icon-512.png using the Canvas API
 * via the `canvas` npm package. Run once during setup:
 *   npm install canvas && node scripts/gen-icons.js
 *
 * In CI the icons are committed; this script is a dev utility only.
 */

import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync } from 'node:fs';

mkdirSync('icons', { recursive: true });

for (const size of [192, 512]) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, '#8b80ff');
  grad.addColorStop(1, '#4b44cc');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.2);
  ctx.fill();

  // "VS" monogram
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.38}px system-ui`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VS', size / 2, size / 2);

  writeFileSync(`icons/icon-${size}.png`, canvas.toBuffer('image/png'));
  console.log(`icons/icon-${size}.png written`);
}
