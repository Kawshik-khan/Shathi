// scripts/check-i18n-keys.mjs
// Walks every t('dashboard.*') call in src/components/widgets and
// src/app/dashboard and confirms the key resolves in en.json and bn.json.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const en = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'src/i18n/locales/en.json'), 'utf8'),
);
const bn = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'src/i18n/locales/bn.json'), 'utf8'),
);

const TARGET_DIRS = [
  'src/components/widgets',
  'src/app/dashboard',
];

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      yield full;
    }
  }
}

function resolveKeyPath(obj, keyPath) {
  const parts = keyPath.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[p];
  }
  return cur;
}

const references = new Set();
for (const dir of TARGET_DIRS) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) continue;
  for (const file of walk(abs)) {
    const src = fs.readFileSync(file, 'utf8');
    // Match t('dashboard.foo.bar') with backticks too
    const re = /t\(\s*[`'"]dashboard\.([a-zA-Z0-9_.]+)[`'"]/g;
    let m;
    while ((m = re.exec(src)) !== null) {
      references.add(`dashboard.${m[1]}`);
    }
  }
}

let missingEn = 0;
let missingBn = 0;
for (const ref of references) {
  const okEn = resolveKeyPath(en, ref) !== undefined;
  const okBn = resolveKeyPath(bn, ref) !== undefined;
  if (!okEn || !okBn) {
    console.log(`${!okEn ? '❌ en' : '  '} ${!okBn ? '❌ bn' : '  '} ${ref}`);
    if (!okEn) missingEn++;
    if (!okBn) missingBn++;
  }
}

console.log(
  `\n${references.size} dashboard.* references checked.`,
);
console.log(`Missing in en: ${missingEn}`);
console.log(`Missing in bn: ${missingBn}`);
process.exit(missingEn + missingBn === 0 ? 0 : 1);
