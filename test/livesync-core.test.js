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

test('lsIsFinished: field final with results and not live is finished', () => {
  const finishers = core.lsParseFieldResult(hj);
  assert.equal(core.lsIsFinished({ es: 'eh', lv: false }, finishers), true);
});
test('lsIsFinished: live event is not finished', () => {
  assert.equal(core.lsIsFinished({ es: 'eh', lv: true }, [{ p: 1 }]), false);
});
test('lsIsFinished: not-started event is not finished', () => {
  assert.equal(core.lsIsFinished({ es: 'nd', lv: false }, []), false);
});
test('lsIsFinished: no finishers is not finished', () => {
  assert.equal(core.lsIsFinished({ es: 'eh', lv: false }, []), false);
});

test('lsBuildActualEntries matches finishers to app entries, carries pl + mark', () => {
  const finishers = core.lsParseFieldResult(hj);
  // minimal app entries covering the HJ top 6 (Last, First / UPPER school)
  const appEntries = [
    { a: 'Glover, Keondre', s: 'LIFE (GA.)', m: '2.10m' },
    { a: 'Burns, Isaac', s: 'MOUNT VERNON NAZARENE (OHIO)', m: '2.07m' },
    { a: 'Richards, Bradley', s: 'CORNERSTONE (MICH.)', m: '2.06m' },
    { a: 'Jones, Deandre', s: 'VOORHEES (S.C.)', m: '2.14m' },
    { a: 'Kovach, Gunner', s: 'MARIAN (IND.)', m: '2.03m' },
    { a: 'Drake, Philip', s: 'BRYAN (TENN.)', m: '2.03m' },
    { a: 'Holt, Julian', s: 'ROCHESTER CHRISTIAN (MICH.)', m: '2.03m' },
    { a: 'Caicedo Campaz, Janer', s: 'LINDSEY WILSON (KY.)', m: '2.03m' },
    { a: 'Morton, Hollis', s: 'BREWTON-PARKER (GA.)', m: '2.03m' },
    { a: 'Blount, Daniel', s: 'OTTAWA (KAN.)', m: '2.03m' },
  ];
  const { entries, unmatched } = core.lsBuildActualEntries(finishers, appEntries);
  assert.equal(unmatched.length, 0);
  assert.equal(entries[0].a, 'Glover, Keondre');
  assert.equal(entries[0].pl, 1);
  assert.equal(entries[0].m, '2.15m');
  assert.equal(entries[5].pl, 6);
  assert.equal(entries[9].pl, 6);   // five-way tie all carry pl:6
});

test('lsBuildActualEntries records unmatched finishers', () => {
  const finishers = [{ p: 1, fn: 'Ghost', l: 'Runner', tn: 'X', mark: '9.9' }];
  const { entries, unmatched } = core.lsBuildActualEntries(finishers, [{ a: 'Real, Joe', s: 'Y', m: '' }]);
  assert.equal(entries.length, 0);
  assert.equal(unmatched.length, 1);
  assert.equal(unmatched[0].n, 'Ghost Runner');
});
