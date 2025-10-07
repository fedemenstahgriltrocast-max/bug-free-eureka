#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const projectRoot = process.cwd();
const modules = [
  'src/js/utils/currency.js',
  'src/js/i18n/dictionary.js',
  'src/js/i18n/index.js',
  'src/js/cart/cart-store.js',
  'src/js/calculator.js',
  'src/js/app.js',
];

const EXPORT_REPLACERS = [
  [/export\s+function\s+/g, 'function '],
  [/export\s+const\s+/g, 'const '],
  [/export\s+{[^}]+};?/g, ''],
  [/import[^;]+;\s*/g, ''],
];

async function readModule(modulePath) {
  const absolutePath = path.resolve(projectRoot, modulePath);
  const contents = await fs.readFile(absolutePath, 'utf8');
  return EXPORT_REPLACERS.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), contents);
}

async function build() {
  const chunks = await Promise.all(modules.map(readModule));
  const banner = `// Generated file. Do not edit directly. Use \`npm run build\` to regenerate.\n`;
  const body = chunks.join('\n\n');
  const output = `${banner}${body}`;
  await fs.writeFile(path.resolve(projectRoot, 'main.js'), output, 'utf8');
  console.log('Build complete: main.js');
}

build().catch((error) => {
  console.error('Build failed');
  console.error(error);
  process.exitCode = 1;
});
