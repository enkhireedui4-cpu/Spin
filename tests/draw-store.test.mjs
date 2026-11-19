import test from 'node:test';
import assert from 'node:assert/strict';
import { DrawStore } from '../draw-store.mjs';

test('allocates exactly 300 results with the agreed quotas and stops', () => {
  const store = new DrawStore(':memory:');
  const all = Array.from({length: 300}, (_, i) => store.draw(`participant-${i}`));
  for (const prize of ['towel', 'freshener', 'foam']) assert.equal(all.filter(x => x.result === prize).length, 30);
  assert.equal(all.filter(x => x.result === 'loss').length, 210);
  assert.equal(store.draw('participant-301').status, 'sold_out');
  store.close();
});

test('retries with the same entry do not consume another chance', () => {
  const store = new DrawStore(':memory:');
  const first = store.draw('participant-one');
  const again = store.draw('participant-one');
  assert.deepEqual(again, first);
  assert.equal(store.count(), 1);
  store.close();
});

test('a saved result survives reopening the database', async () => {
  const { mkdtempSync, rmSync } = await import('node:fs');
  const { join } = await import('node:path');
  const { tmpdir } = await import('node:os');
  const dir = mkdtempSync(join(tmpdir(), 'spin-test-'));
  const path = join(dir, 'draw.db');
  try {
    let store = new DrawStore(path);
    const original = store.draw('participant-one');
    store.close();
    store = new DrawStore(path);
    assert.deepEqual(store.draw('participant-one'), original);
    assert.equal(store.count(), 1);
    store.close();
  } finally { rmSync(dir, { recursive: true, force: true }); }
});


test('looking up a result never allocates a new entry', () => {
  const store = new DrawStore(':memory:');
  assert.equal(store.lookup('participant-one'), null);
  assert.equal(store.count(), 0);
  const entry = store.draw('participant-one');
  assert.deepEqual(store.lookup('participant-one'), entry);
  store.close();
});
