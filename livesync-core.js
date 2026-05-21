/* Pure, dependency-free logic for live auto-sync. Loaded in the browser via
   <script src> (functions become global) and required by Node tests. */
function lsNormalizeName(x){ return (x || '').toLowerCase().replace(/[^a-z]/g, ''); }

/* Split an app entry's "Last, First" into normalized [last, first]. */
function lsAppLastFirst(a){
  if (a && a.indexOf(',') !== -1){
    const i = a.indexOf(',');
    return [lsNormalizeName(a.slice(0, i)), lsNormalizeName(a.slice(i + 1))];
  }
  return [lsNormalizeName(a), ''];
}

/* Find the index in appEntries matching a feed athlete {fn,l,tn}. Skips used[].
   Primary: last+first exact. Fallback: token-set of the two name parts. Returns -1. */
function lsMatchAthlete(feed, appEntries, used){
  const fl = lsNormalizeName(feed.l), ff = lsNormalizeName(feed.fn);
  for (let i = 0; i < appEntries.length; i++){
    if (used[i]) continue;
    const [al, af] = lsAppLastFirst(appEntries[i].a);
    if (al === fl && af === ff) return i;
  }
  const want = new Set([fl, ff].filter(Boolean));
  for (let i = 0; i < appEntries.length; i++){
    if (used[i]) continue;
    const [al, af] = lsAppLastFirst(appEntries[i].a);
    const have = new Set([al, af].filter(Boolean));
    if (have.size === want.size && [...want].every(t => have.has(t))) return i;
  }
  return -1;
}

/* Field events (HJ/PV/LJ/throws). Reads the `st` array. Vertical jumps store the
   metric mark in bm.hgt; horizontal/throws in bm.m. Returns [{p,fn,l,n,tn,mark,dns}]. */
function lsParseFieldResult(node){
  const st = (node && node.st) || [];
  return st.map(a => {
    const bm = a.bm || {};
    const metric = bm.hgt != null ? bm.hgt : bm.m;
    return {
      p: a.p, fn: a.fn, l: a.l, n: a.n, tn: a.tn,
      mark: metric != null ? (metric + 'm') : (a.er || ''),
      dns: !!a.dns,
    };
  });
}

/* Running events: byRoundResults/<rui> is a map keyed by athlete slug.
   Identical schema for prelims and finals. Returns finishers sorted by place. */
function lsParseRunResult(node){
  if (!node || typeof node !== 'object') return [];
  const out = [];
  for (const slug of Object.keys(node)){
    const a = node[slug];
    if (!a || typeof a !== 'object' || a.p == null) continue;
    out.push({ p: Number(a.p), fn: a.fn, l: a.l, n: a.n, tn: a.tn, mark: a.m || a.er || '', q: a.q || '' });
  }
  out.sort((x, y) => x.p - y.p);
  return out;
}

if (typeof module !== 'undefined' && module.exports){
  module.exports = { lsNormalizeName, lsAppLastFirst, lsMatchAthlete, lsParseFieldResult, lsParseRunResult };
}
