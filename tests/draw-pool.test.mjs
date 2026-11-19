import test from 'node:test';
import assert from 'node:assert/strict';
import { createDrawPool } from '../draw-pool.mjs';

test('the 300 entries contain exactly the requested prizes', () => {
  const pool = createDrawPool();
  assert.equal(pool.length, 300);
  for (const prize of ['towel', 'freshener', 'foam']) assert.equal(pool.filter(result => result === prize).length, 30);
  assert.equal(pool.filter(result => result === 'loss').length, 210);
  assert.equal(pool.filter(result => result === 'fuel' || result === 'gift').length, 0);
});

test('shuffle changes the order without changing any quantities', () => {
  const pool = createDrawPool(() => 0);
  assert.equal(pool.length, 300);
  assert.equal(pool[299], 'towel');
});

