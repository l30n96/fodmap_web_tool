#!/usr/bin/env node
/**
 * Converts fodmap_de.csv → public/data/fodmap_de.json and public/data/fodmap.json
 *
 * CSV columns: id, name, name_de, category, category_de, fodmap, oligos, fructose, polyols, lactose
 */

const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join(__dirname, '..', 'fodmap_de.csv');
const OUT_DE = path.join(__dirname, '..', 'public', 'data', 'fodmap_de.json');
const OUT_EN = path.join(__dirname, '..', 'public', 'data', 'fodmap.json');

// ── Simple CSV parser (handles quoted fields with embedded commas/newlines) ──
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(field);
        field = '';
      } else if (ch === '\r' && next === '\n') {
        row.push(field);
        field = '';
        rows.push(row);
        row = [];
        i++;
      } else if (ch === '\n' || ch === '\r') {
        row.push(field);
        field = '';
        rows.push(row);
        row = [];
      } else {
        field += ch;
      }
    }
  }
  // flush last field/row
  row.push(field);
  if (row.some(f => f.trim() !== '')) rows.push(row);

  return rows;
}

const raw = fs.readFileSync(CSV_PATH, 'utf8').trim();
const rows = parseCSV(raw);

if (rows.length < 2) {
  console.error('CSV is empty or has only a header row.');
  process.exit(1);
}

const [header, ...dataRows] = rows;
// Expected: id, name, name_de, category, category_de, fodmap, oligos, fructose, polyols, lactose
const COL = {};
header.forEach((h, i) => { COL[h.trim()] = i; });

const required = ['id', 'name', 'name_de', 'category', 'category_de', 'fodmap', 'oligos', 'fructose', 'polyols', 'lactose'];
for (const col of required) {
  if (COL[col] === undefined) {
    console.error(`Missing expected column: "${col}". Found: ${header.join(', ')}`);
    process.exit(1);
  }
}

const items = dataRows.map((row) => {
  const id       = row[COL['id']].trim();
  const name     = row[COL['name']].trim();
  const name_de  = row[COL['name_de']].trim();
  const cat      = row[COL['category']].trim();
  const cat_de   = row[COL['category_de']].trim();
  const fodmap   = row[COL['fodmap']].trim().toLowerCase();
  const oligos   = parseInt(row[COL['oligos']], 10)   || 0;
  const fructose = parseInt(row[COL['fructose']], 10) || 0;
  const polyols  = parseInt(row[COL['polyols']], 10)  || 0;
  const lactose  = parseInt(row[COL['lactose']], 10)  || 0;

  if (!name) return null; // skip blank rows

  return {
    id,
    name,
    name_de,
    category: cat,
    category_de: cat_de,
    fodmap,
    oligos,
    fructose,
    polyols,
    lactose,
  };
}).filter(Boolean);

fs.mkdirSync(path.dirname(OUT_DE), { recursive: true });
fs.writeFileSync(OUT_DE, JSON.stringify(items, null, 2), 'utf8');
fs.writeFileSync(OUT_EN, JSON.stringify(items, null, 2), 'utf8');

console.log(`✓ Converted ${items.length} items from CSV.`);
console.log(`  → ${OUT_DE}`);
console.log(`  → ${OUT_EN}`);
