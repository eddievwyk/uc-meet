# NAIA Nationals Predictor

A live team-scoring simulator for the 2026 NAIA Outdoor Track & Field National Championships, built as a coaching tool for the University of the Cumberlands track & field staff.

**Live app:** https://uc-meet.vercel.app

## What it does

The app projects how the team standings will unfold at Nationals and lets coaches play out "what-if" scenarios in real time. Every athlete who qualified is loaded from the official NAIA qualifier list. The coaching staff can reorder projected finishes, lock in actual results as events complete, and watch the projected team scores update instantly.

It was built to be used on a phone, on the infield, during the meet.

## Features

- **What-If** — drag athletes to reorder projected finishes and see team scores recalculate live
- **Standings** — projected team rankings with click-to-expand scoring breakdowns
- **Meet Day** — the full meet schedule, day by day, with the ability to lock in actual results as events finish
- **Events** — all 46 events, ordered Track, then Field, then Multi
- **More** — Coach's Brief, a UC deep dive, head-to-head comparisons, and a bubble calculator for athletes on the scoring edge

## How it is built

- A single self-contained HTML file. No build step, no dependencies, no backend.
- All 100+ school logos are embedded directly in the file as base64, so the app loads instantly with nothing to fetch.
- Athlete and performance data is parsed from the official 2026 NAIA Outdoor qualifier list.
- Deployed on Vercel.

## Context

The University of the Cumberlands men's team went into the 2026 NAIA Outdoor National Championships (May 20-22, UNC Asheville) projected to finish first. This tool was built so the coaching staff could follow the team race as it happened and make informed lineup and scoring decisions.

Built by Eddie van Wyk.
