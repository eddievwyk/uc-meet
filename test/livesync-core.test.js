const { test } = require('node:test');
const assert = require('node:assert');

test('runner works', () => { assert.equal(1 + 1, 2); });

const core = require('../livesync-core.js');

test('lsNormalizeName strips case and punctuation', () => {
  assert.equal(core.lsNormalizeName("O'Brien"), 'obrien');
  assert.equal(core.lsNormalizeName('Caicedo Campaz'), 'caicedocampaz');
  assert.equal(core.lsNormalizeName(''), '');
});

test('lsMatchAthlete matches by last+first against "Last, First"', () => {
  const appEntries = [
    { a: 'Kovach, Gunner', s: 'MARIAN (IND.)', m: '2.03m' },
    { a: 'Glover, Keondre', s: 'LIFE (GA.)', m: '2.10m' },
  ];
  const idx = core.lsMatchAthlete({ fn: 'Keondre', l: 'Glover', tn: 'Life (Ga.)' }, appEntries, []);
  assert.equal(idx, 1);
});

test('lsMatchAthlete returns -1 when no match', () => {
  const idx = core.lsMatchAthlete({ fn: 'Nobody', l: 'Here', tn: 'X' }, [{ a: 'Smith, Joe', s: 'Y', m: '' }], []);
  assert.equal(idx, -1);
});

test('lsMatchAthlete respects used[] (no double match)', () => {
  const app = [{ a: 'Smith, Joe', s: 'Y', m: '' }, { a: 'Smith, Joe', s: 'Z', m: '' }];
  const used = [true, false];
  const idx = core.lsMatchAthlete({ fn: 'Joe', l: 'Smith', tn: 'Z' }, app, used);
  assert.equal(idx, 1);
});
