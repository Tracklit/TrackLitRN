const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src');
const glyphMapPath = path.join(
  root,
  'node_modules',
  'react-native-vector-icons',
  'glyphmaps',
  'FontAwesome5Free.json'
);

const glyphs = new Set(
  Object.keys(JSON.parse(fs.readFileSync(glyphMapPath, 'utf8')))
);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, files);
    else if (p.endsWith('.tsx') || p.endsWith('.ts')) files.push(p);
  }
  return files;
}

const files = walk(srcDir);
const rxFA5Component =
  /\b(FontAwesome5|Icon)\b[^>]*\bname\s*=\s*["']([^"']+)["']/g;

let unknown = [];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = rxFA5Component.exec(text))) {
    const name = m[2];
    if (!glyphs.has(name)) unknown.push({ file, name });
  }
}

if (unknown.length === 0) {
  console.log('All FontAwesome5 icon names are valid.');
} else {
  console.log('Unknown icon names found:');
  for (const u of unknown) console.log(`${u.file}: ${u.name}`);
  process.exitCode = 1;
}

