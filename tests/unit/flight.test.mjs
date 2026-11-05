import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { applyRotation, applyThrust } from '../../src/ship.js';

test('pitch/yaw/roll change quaternion', () => {
  const q0 = new THREE.Quaternion();
  const q1 = applyRotation(q0, { pitch: 1, yaw: 0.5, roll: 0.25 }, 0.16);
  assert.ok(Math.abs(q1.x) + Math.abs(q1.y) + Math.abs(q1.z) > 0.01);
  assert.ok(!q1.equals(q0));
});

test('throttle changes forward velocity', () => {
  const v0 = new THREE.Vector3();
  const forward = new THREE.Vector3(0, 0, -1);
  const v1 = applyThrust(v0, forward, 26, 0.5);
  assert.ok(v1.z < -1);
});
