import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { hitInRange, canAfford, dodgeInvulnDuration } from '../../src/combat.js';

test('light hit within range', () => {
  const ok = hitInRange(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -1),
    new THREE.Vector3(0, 0, -2),
    2.4,
  );
  assert.equal(ok, true);
});

test('out of range miss', () => {
  const ok = hitInRange(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -1),
    new THREE.Vector3(0, 0, -5),
    2.4,
  );
  assert.equal(ok, false);
});

test('stamina blocks spam', () => {
  assert.equal(canAfford(10, 12), false);
  assert.equal(canAfford(12, 12), true);
});

test('dodge invuln 0.3s', () => {
  assert.equal(dodgeInvulnDuration(), 0.3);
});
