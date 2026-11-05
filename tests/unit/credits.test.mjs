import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('CREDITS.md has CC0 or CC-BY attribution', () => {
  const text = readFileSync(new URL('../../CREDITS.md', import.meta.url), 'utf8');
  assert.ok(/CC0|CC-BY/i.test(text));
  assert.ok(!/attribution:\s*$/m.test(text));
  assert.ok(text.includes('Kenney') || text.includes('Space Kit'));
});
