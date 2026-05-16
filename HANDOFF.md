# NAIA Outdoor Nationals Meet Simulator — Claude Code Handoff

## Project Owner
Eddie — Graduate Assistant in AI Innovation at University of the Cumberlands (UC), student-athlete on the track and field team. UC men's team is ranked #1 going into NAIA Outdoor Nationals.

## What This Is
An interactive meet simulation tool for the 2026 NAIA Outdoor Track & Field National Championships, held at UNC Asheville, May 20–22, 2026. It projects team scores based on the official performance list (seed entries) released 05/13/2026.

## What Was Built So Far
A single-file HTML dashboard (`naia_nationals_simulator.html`) with:
- **Standings tab**: Full projected team rankings with point bars (Men's and Women's toggle)
- **Events tab**: All ~46 scored events with expandable cards showing top 8 scorers per event, highlighting UC athletes and bubble athletes
- **UC Analysis tab**: Breakdown of every UC entry — scoring events sorted by points, plus non-scoring entries with how many spots they're out
- **What-If tab**: Five realistic scenarios per gender showing incremental point gains if UC athletes move up 1–2 spots

## Scoring Rules Used
- Top 8 in each event score: **1st=10, 2nd=8, 3rd=6, 4th=5, 5th=4, 6th=3, 7th=2, 8th=1**
- Prelim events: top 8 seeds projected to advance to finals and score
- Relay events: scored by team, top 8
- Multi-events (Decathlon/Heptathlon): only the composite result scores — individual sub-events (dec 100m, dec 400m, etc.) do NOT score team points separately
- All event data was manually extracted from the PDF performance list

## Projected Results Summary

### Men's (UC projected 1st — 77 pts)
| Rank | Team | Pts |
|------|------|-----|
| 1 | **CUMBERLANDS (KY.)** | **77** |
| 2 | VOORHEES (S.C.) | 62 |
| 3 | ST. THOMAS (FLA.) | 41 |
| 4 | MARIAN (IND.) | 38 |
| 5 | CORNERSTONE (MICH.) | 35 |

**UC Men's scoring events:**
- 5000m Racewalk: 23 pts (Beardsley 1st, Bennett 2nd, Melchiore 6th, Mencel 7th)
- 4x400 Relay: 10 pts (seeded 1st, 3:07.69)
- 400m: 10 pts (Davis seeded 1st, 45.67)
- 10,000m: 8 pts (Madeo seeded 2nd)
- 1500m: 7 pts (Mekideche 5th, Ehrler 6th)
- Decathlon: 6 pts (Lawin 3rd)
- 5000m: 6 pts (Madeo 5th, Mekideche 7th)
- 4x100 Relay: 4 pts (seeded 5th)
- 200m: 3 pts (Mebena 6th)

**UC Men's bubble athletes:**
- Massie, Seth — Decathlon 9th (6,464) — 1 spot out, 70 pts behind 8th
- Miller, Roy — 400m 16th — far out
- Scherb, Niklas — 1500m 17th — far out
- 4x800 Relay — 15th — far out

### Women's (UC projected 4th — 27 pts)
| Rank | Team | Pts |
|------|------|-----|
| 1 | BRITISH COLUMBIA | 95 |
| 2 | DICKINSON STATE (N.D.) | 41 |
| 3 | CENTRAL METHODIST (MO.) | 35 |
| 4 | **CUMBERLANDS (KY.)** | **27** |
| 5 | DOANE (NEB.) | 26 |

**UC Women's scoring events:**
- 10,000m: 14 pts (Boshchuk 2nd, Jepchirchir 3rd)
- 5000m Racewalk: 9 pts (Durrant 2nd, Bittencourt 8th)
- 4x100 Relay: 4 pts (seeded 5th)

**UC Women's bubble athletes:**
- Sullivan, Lucy — Racewalk 9th (28:10.52) — 1 spot out
- Kante, Abia — 200m 12th (23.98) — 4 spots out, 0.15s behind 8th
- Jepchirchir, Patrober — 5000m 12th (17:13.87) — 4 spots out
- Boshchuk, Alina — 5000m 14th (17:16.51) — 6 spots out
- Vigne, Ritorion — 100m 23rd — far out
- Guzman, Lillian — 400m 21st — far out

## Data Source
The source PDF is `2026_OTF_Open_Qualifiers.pdf` — the official NAIA performance list published 05/13/2026. All data was hand-extracted from the 19-page document. The HTML file has all event data embedded in a JavaScript `DATA` object with this structure:

```js
{
  events: [
    {
      name: "Event Name",        // e.g. "400 Meters"
      gender: "Men" | "Women",
      type: "final" | "prelim" | "relay" | "composite",
      entries: [
        { a: "Athlete Name", s: "SCHOOL NAME", m: "Mark/Time" },
        // ... ordered by seed (1st = best)
      ]
    }
  ]
}
```

The scoring engine function `calcScores()` takes this data and returns sorted team standings plus per-event results. It also accepts an `overrides` parameter (not yet fully wired) for what-if reordering.

## What Eddie Wants Next
Eddie said "it's going to get more intricate and more difficult." He wants to continue building on this foundation. Likely directions:
1. **Fully interactive what-if builder** — drag athletes up/down in seed order and see live score recalculation across all teams
2. **Head-to-head rival analysis** — compare UC vs specific teams event by event
3. **Relay split analysis** — break down relay compositions
4. **Sneak-into-finals calculator** — for each UC bubble athlete, show exactly what time/mark they'd need to crack top 8
5. **Visual scoreboard** — running team score tracker as you go event-by-event through the meet order
6. **Export/share** — PDF or image export of projections for coaching staff

## Technical Notes
- The current file is pure HTML/CSS/JS — no frameworks, no dependencies, no build step
- Google Fonts loaded: Oswald + Source Sans 3
- Dark theme with UC maroon (#8b2232) accent
- Mobile-responsive but optimized for desktop
- If transitioning to React/Vite or similar, the `DATA` object and `calcScores()` engine can be extracted as-is
- The PDF had some formatting quirks: some times are in raw seconds (e.g. "347.88" = 3:47.88), which were converted to display format in the HTML but the raw data could be normalized further

## Files
- `naia_nationals_simulator.html` — the current interactive dashboard (standalone, open in browser)
- `HANDOFF.md` — this file
