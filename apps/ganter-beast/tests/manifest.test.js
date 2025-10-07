import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const manifestPath = path.resolve(process.cwd(), 'manifest.json');

const loadManifest = async () => {
  const raw = await fs.readFile(manifestPath, 'utf8');
  return JSON.parse(raw);
};

test('web manifest declares core metadata for installability', async () => {
  const manifest = await loadManifest();

  assert.equal(manifest.name, 'Marxia Café y Bocaditos');
  assert.equal(manifest.short_name, 'Marxia');
  assert.equal(manifest.start_url, '/index.html');
  assert.equal(manifest.scope, '/');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.lang, 'es');
  assert.equal(manifest.background_color.startsWith('#'), true);
  assert.equal(manifest.theme_color.startsWith('#'), true);
  assert.ok(Array.isArray(manifest.icons));
  assert.ok(manifest.icons.length >= 2);
});

test('manifest icons define valid size/type pairs', async () => {
  const manifest = await loadManifest();

  manifest.icons.forEach((icon) => {
    assert.equal(typeof icon.src, 'string');
    assert.equal(icon.src.startsWith('/'), true);
    assert.match(icon.sizes, /^\d+x\d+(\s\d+x\d+)*$/);
    assert.equal(icon.type, 'image/png');
    assert.equal(typeof icon.purpose, 'string');
  });
});
