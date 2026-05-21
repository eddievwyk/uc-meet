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

const fs = require('node:fs');
const hj = JSON.parse(fs.readFileSync(__dirname + '/fixtures/field_hj_done.json', 'utf8'));

test('lsParseFieldResult returns finishers with place, name, team, metric mark', () => {
  const fin = core.lsParseFieldResult(hj);
  assert.equal(fin.length, 10);
  assert.equal(fin[0].p, 1);
  assert.equal(fin[0].fn, 'Keondre');
  assert.equal(fin[0].l, 'Glover');
  assert.equal(fin[0].mark, '2.15m');           // vertical: bm.hgt + 'm'
  // five-way tie for 6th
  assert.deepEqual(fin.slice(5).map(f => f.p), [6, 6, 6, 6, 6]);
});

const w200 = JSON.parse(fs.readFileSync(__dirname + '/fixtures/run_prelim_w200.json', 'utf8'));

test('lsParseRunResult flattens athlete-keyed map, sorted by place', () => {
  const fin = core.lsParseRunResult(w200);
  assert.ok(fin.length > 0);
  for (let i = 1; i < fin.length; i++){
    assert.ok(Number(fin[i - 1].p) <= Number(fin[i].p)); // ascending place
  }
  assert.ok(fin[0].mark);   // has a time
  assert.ok(fin[0].l);      // has a last name
});

const dec = JSON.parse(fs.readFileSync(__dirname + '/fixtures/combined_decathlon.json', 'utf8'));

test('lsParseCombined returns athletes by place with total score as mark', () => {
  const fin = core.lsParseCombined(dec);
  assert.ok(fin.length > 0);
  assert.equal(fin[0].p, 1);
  assert.ok(/pts$/.test(fin[0].mark));   // e.g. "3248 pts"
  assert.ok(fin[0].l);                   // last name present
});
