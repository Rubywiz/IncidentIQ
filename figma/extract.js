// Extracts design tokens (colors, fonts, structure) from a Figma file JSON.
// Usage: node figma/extract.js figma/serendale.json
const fs = require('fs');
const path = process.argv[2] || 'figma/serendale.json';
const d = JSON.parse(fs.readFileSync(path, 'utf8'));

const colors = new Map();
const fonts = new Map();
const gradients = [];

function rgba(c) {
  const r = Math.round(c.r * 255), g = Math.round(c.g * 255), b = Math.round(c.b * 255);
  const a = c.a ?? 1;
  return a < 1 ? `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})` : `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}

function walk(n, depth = 0) {
  if (Array.isArray(n.fills)) {
    for (const f of n.fills) {
      if (f.type === 'SOLID' && f.color) {
        const key = rgba({ ...f.color, a: f.opacity ?? f.color.a });
        colors.set(key, (colors.get(key) || 0) + 1);
      }
      if (f.type && f.type.startsWith('GRADIENT') && f.gradientStops) {
        gradients.push(f.gradientStops.map(s => rgba(s.color)).join(' → '));
      }
    }
  }
  if (n.style && n.style.fontFamily) {
    const key = `${n.style.fontFamily} ${n.style.fontWeight || ''} ${Math.round(n.style.fontSize || 0)}px`;
    fonts.set(key, (fonts.get(key) || 0) + 1);
  }
  (n.children || []).forEach(c => walk(c, depth + 1));
}

walk(d.document);

function structure(n, depth = 0, max = 3) {
  if (depth > max) return '';
  let out = '  '.repeat(depth) + `${n.type}: ${n.name || ''}`;
  if (n.absoluteBoundingBox) {
    const b = n.absoluteBoundingBox;
    out += `  [${Math.round(b.width)}×${Math.round(b.height)}]`;
  }
  out += '\n';
  for (const c of (n.children || [])) out += structure(c, depth + 1, max);
  return out;
}

console.log('=== TOP COLORS ===');
[...colors.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).forEach(([c, n]) => console.log(`  ${c}  (×${n})`));

console.log('\n=== GRADIENTS ===');
[...new Set(gradients)].slice(0, 10).forEach(g => console.log(`  ${g}`));

console.log('\n=== FONTS ===');
[...fonts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([f, n]) => console.log(`  ${f}  (×${n})`));

console.log('\n=== STRUCTURE ===');
console.log(structure(d.document, 0, 3));
