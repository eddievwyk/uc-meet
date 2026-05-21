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

if (typeof module !== 'undefined' && module.exports){
  module.exports = { lsNormalizeName, lsAppLastFirst, lsMatchAthlete };
}
