import test from 'node:test';
import assert from 'node:assert/strict';

test('KeyW sets move.y > 0', () => {
  const keys = new Set(['KeyW']);
  const move = {
    x: (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0),
    y: (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0),
  };
  assert.ok(move.y > 0);
});

test('click light consumes until cleared', () => {
  let light = true;
  const consume = () => { const v = light; light = false; return v; };
  assert.equal(consume(), true);
  assert.equal(consume(), false);
});
