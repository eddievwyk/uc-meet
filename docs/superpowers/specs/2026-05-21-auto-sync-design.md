# NAIA Predictor — Live Auto-Sync Design

**Date:** 2026-05-21
**Status:** Approved design, pending spec review
**App:** `/Users/eddievwyk/Developer/uc-meet/index.html` (single-file static HTML on Vercel; no backend)

## 1. Goal

While the app is open, automatically read the official live results feed and keep the Meet Day tab in lockstep with reality: as each final finishes, sync its finishing order (places, marks, ties) into the app, score it, and **lock it permanently**. No manual entry, no manual locking, always matches the official scoreboard.

## 2. Decisions (locked in brainstorming)

| Decision | Choice |
|---|---|
| Where it runs | **In-browser polling** while the app is open. No backend. |
| After-lock revisions | **Keep auto-updating** — re-sync done finals every poll so late corrections/DQs flow through. |
| Manual vs auto | **Auto-sync always wins.** Feed is the single source of truth; manual meet-day edits to a synced event get overwritten next poll. |
| Locking | Auto-lock each final when it's finished. |
| **Unlock** | **Once synced-locked, an event CANNOT be unlocked or edited.** Done is done. |
| Scope | All finals: track, field, relays, **and multi-events (Dec/Hep) in v1**. Prelims out (don't score). |
| Poll interval | ~30s (configurable). |
| Default state | Auto-sync **ON**, with a visible kill-switch toggle. |
| Meet id | Configurable constant (so it works for future meets). |

What auto-sync does NOT touch: the **What-If tab** (`state.overrides`) and any event the feed hasn't posted results for yet (those keep showing projections).

## 3. Architecture

A self-contained `liveSync` module inside `index.html`. One clear responsibility: read the feed and reconcile it into `state.actualResults` / `state.completedEvents` / `state.syncLocked`. It does not own rendering or scoring — it mutates state and calls the existing `render()`.

Interfaces:
- `liveSync.start()` / `liveSync.stop()` — toggle the poll loop.
- `liveSync.checkNow()` — force one poll.
- `liveSync.state` — `{enabled, lastCheck, syncedCount, unmatched:[...], status}` for the UI chip.

Data flow per poll:
```
poll tick
  → fetch latest_update_list (change feed)
  → entries newer than watermark? if none, update "last checked" and stop
  → for each changed event, resolve its round via event_summary.rui
  → fetch the right result node (run / field / combined)
  → if event is FINISHED (see §5): match athletes → build ordered entries (with pl, marks)
       → write state.actualResults[k], state.completedEvents[k]=true, state.syncLocked[k]=true
  → record unmatched athletes for the UI notice
  → render()
```

## 4. Data source

Public, unauthenticated, read-only. Full reference in `[[reference-athleticlive-data-source]]` memory.

- Firebase RTDB: `https://trackmeet-io.firebaseio.com/meet_<id>/<node>.json`
- Meet id: **73709** (NAIA Outdoor Nationals 2026).
- Key nodes: `event_summary`, `latest_update_list`, `byRoundResults/<rui>`, `byHeatResults/<rui>-<heat>`, `liveFieldResults/<rui>`, `combinedTable/<combinedId>`, `liveRunEventList/<rui>`, `rawLiveRunEvent/track`.
- Round id `rui` = `"<eventNumber>-<round>"`; final round ends in `-2`, prelim in `-1`. Authoritative `rui` comes from each `event_summary` record.

**CORS:** Firebase RTDB REST returns permissive CORS headers, so the browser can fetch directly. (Confirm during build with a live fetch from the deployed origin; if blocked, fall back to a tiny read-only proxy — flagged as a build-time check.)

## 5. Event state & completion detection

Per-event state from the feed:
- `event_summary/<key>/es`: `nd` = not started, `r` = ready/running, `eh` = has results.
- `lv` (live flag, on `liveRunEventList/<rui>` or field `v.lv`): true = on track/runway right now.
- `fd` per athlete: `1` = mark is official/decided.
- `arm:"ARMED"` in `rawLiveRunEvent/track` = the single event currently staged on the track.

**A final is "FINISHED" (→ sync + lock) when:** its result node is fully populated, `lv === false`, and every scoring athlete has a final place `p` (and `fd:1` where present). Conservative on locking (don't lock mid-competition); liberal on re-sync (re-check locked finals each poll so corrections propagate). Combined events use `combinedTable/<id>/fd === 1` (table marked final) plus all sub-events complete.

## 6. Matching feed → app entries

Port the proven Python matcher to JS:
- Normalize names: lowercase, strip non-letters. Match feed `l`+`fn` (last, first) to the app entry's `"Last, First"` split. Fallback: token-set match on the full name.
- School is a tiebreak only (formats differ: feed `"Cumberlands (Ky.)"` vs app `"CUMBERLANDS (KY.)"`).
- Relays match on team name.
- **Unmatched scorer** → do NOT drop silently. Record `{event, place, name, team}` in `liveSync.state.unmatched` and surface a UI notice (e.g. "⚠️ 1 unmatched in Men 800"). Everything matchable still syncs.

## 7. Writing into app state

For a finished final, build the ordered entries array exactly like the manual sync does today:
- For each finisher (in place order): the matched app entry, with `m` = actual mark and `pl` = official place (enables the existing tie-aware `computeScored`).
- Write `state.actualResults[k] = orderedEntries`, `state.completedEvents[k] = true`, `state.syncLocked[k] = true`.
- Persist (already in `PERSIST_FIELDS` mechanism; add `syncLocked`).

Scoring + tie handling already exist (`computeScored`, NAIA point split, 1-decimal team totals) — no change needed; synced entries carry `pl`, so it just works.

## 8. Multi-events (Decathlon ev 36, Heptathlon ev 37)

The feed **pre-computes** combined points, so we read rather than calculate:
- `combinedTable/<combinedId>` → `cea[]` (competitors, sorted by standing). Each has `p` (overall place), `cp` (total combined score), and `cer[]` (per-sub-event: `m` mark, `cp` points this sub-event, `ccp` cumulative).
- Sync into the app like any final: order by `p`, match athletes, assign NAIA placement points to top 8 via the existing engine. The displayed `m` for a Dec/Hep entry = the athlete's **total score** (e.g. "7240 pts").
- **Bonus display (nice-to-have, can be a follow-up within v1):** a breakdown of per-sub-event points from `cer[]` so you can see where points came from. Lock only when `combinedTable.fd === 1`.
- **Verification/fallback:** keep the official IAAF scoring tables (Appendix A) to validate the feed's points or compute them if a feed value is ever missing.

## 9. Permanent lock (no unlock)

New `state.syncLocked[k]`. When set:
- The Meet Day row's **Unlock** button is hidden/disabled and the edit panel is read-only (no drag, no add-athlete, no revert).
- A clear **"🔒 AUTO · official"** badge replaces the Lock/Unlock control.
- `markComplete(k,false)` and `resetMeetDayActual(k)` no-op for sync-locked events.
- Auto-sync may still *update* a sync-locked event (corrections), but a human cannot unlock/edit it.

## 10. UI

On the Meet Day tab:
- **Status chip:** `🟢 Auto-sync ON · checked 12s ago · 9 finals synced` (or `🔴 OFF`). Tap chip → **toggle** on/off (kill switch). A small **"Check now"** action.
- Each synced final shows an **"AUTO"** badge; sync-locked ones show **🔒**.
- Unmatched notice strip when `unmatched.length > 0`.
- Manual entry/lock controls remain only for events the feed hasn't posted yet.

## 11. Error handling

- Feed unreachable / fetch error → log to `liveSync.state.status = 'offline'`, keep last good state, retry next tick. Never throw into render.
- Malformed/partial node → skip that event this poll; try again next.
- Watermark stored in memory (and optionally `localStorage`) so a reload doesn't reprocess everything (though reprocessing is idempotent — safe either way).

## 12. Out of scope

- Prelims (don't score; advancer reporting is a separate, optional feature).
- Always-on backend service (explicitly chose in-browser).
- Writing anything back to the feed (read-only).

## 13. Testing

- **Unit:** matcher (name/school normalization, fallbacks, unmatched); completion detector (nd/r/eh + lv + fd permutations); combined-event reader; permanent-lock guards.
- **Integration (offline fixtures):** saved JSON snapshots of real nodes (HJ field final, a relay round, a combined table, a not-started event) → assert correct `actualResults`/`completedEvents`/`syncLocked` and team scores, including the HJ 5-way-tie (1.2 each) and a Dec/Hep table.
- **Live smoke test:** point at meet 73709, confirm the 6 field finals already done re-derive identically to the manual sync, and that locked events refuse manual unlock.
- Deploy verification: prod is the test surface (preview URLs are login-gated); keep `vercel rollback` ready.

## 14. Phasing

Single implementation plan, but build/verify in this order so the live tool is never destabilized:
1. `liveSync` module + polling + change-feed watermark (no writes yet; log what it *would* do).
2. Matching + finished-detection + write path for **field & run finals**.
3. Permanent-lock UI + guards.
4. Multi-events via `combinedTable`.
5. Status chip + kill switch + unmatched notice.
6. Combined-event per-sub-event breakdown (nice-to-have).

---

## Appendix A — IAAF Combined-Events Scoring (verification/fallback)

Formula (truncate toward zero; clamp negative base to 0):
- Track: `Points = INT(A·(B − T)^C)`, T in **seconds**
- Jump: `Points = INT(A·(M − B)^C)`, M in **centimetres**
- Throw: `Points = INT(A·(D − B)^C)`, D in **metres**

**Decathlon (men):**
| Event | type | A | B | C | unit |
|---|---|---|---|---|---|
| 100 m | track | 25.4347 | 18 | 1.81 | s |
| Long Jump | jump | 0.14354 | 220 | 1.40 | cm |
| Shot Put | throw | 51.39 | 1.5 | 1.05 | m |
| High Jump | jump | 0.8465 | 75 | 1.42 | cm |
| 400 m | track | 1.53775 | 82 | 1.81 | s |
| 110 m H | track | 5.74352 | 28.5 | 1.92 | s |
| Discus | throw | 12.91 | 4 | 1.10 | m |
| Pole Vault | jump | 0.2797 | 100 | 1.35 | cm |
| Javelin | throw | 10.14 | 7 | 1.08 | m |
| 1500 m | track | 0.03768 | 480 | 1.85 | s |

**Heptathlon (women):**
| Event | type | A | B | C | unit |
|---|---|---|---|---|---|
| 100 m H | track | 9.23076 | 26.7 | 1.835 | s |
| High Jump | jump | 1.84523 | 75 | 1.348 | cm |
| Shot Put | throw | 56.0211 | 1.5 | 1.05 | m |
| 200 m | track | 4.99087 | 42.5 | 1.81 | s |
| Long Jump | jump | 0.188807 | 210 | 1.41 | cm |
| Javelin | throw | 15.9803 | 3.8 | 1.04 | m |
| 800 m | track | 0.11193 | 254 | 1.88 | s |

Calibration anchors (must equal exactly 1000): men 100 m @ 10.395 s; men LJ @ 7.76 m. Source: World Athletics IAAF Scoring Tables for Combined Events (2001, Spiriev).

---

## Appendix B — Feed field glossary (essentials)

`rui` round id · `runm` round name · `es` event state (nd/r/eh) · `lv` live flag · `fd` final-data flag · `p` place · `q` qualifier (Q auto / q time / "" out) · `m` display mark · `im` integer mark (ms for runs, µm for field) · `bm` best-mark obj (`hgt`/`m` metric, `co` imperial, `j` clearance code) · `n`/`fn`/`l` name/first/last · `tn` team · `cm` bib · `er` entry mark · `cea`/`cer`/`cp`/`ccp` combined-event competitor/sub-event/points/cumulative · `latest_update_list` change feed keyed by ascending update id with `cd` timestamp + `etn` type.
