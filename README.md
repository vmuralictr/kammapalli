# Sarpanch Vote Tracker

A small React app for canvassing the Sarpanch election in Kammapalle (Part 274, 173-Puthalapattu (SC), Chittoor). It holds the 393 voters from the 2026 Special Intensive Revision draft roll. You mark which candidate each voter is expected to support, group by group, and the app projects the winner.

> **Private data.** `src/data/voters.json` contains every voter's name, EPIC number, age and house number. Keep this repository private.

## Features

- Enter 2–8 candidates (names can be changed later without losing marks).
- Voters split into three working groups:
  - `1-Guttakindavooru` (52)
  - `2-Kammapalle HW` (126)
  - `155 Kammapalle 1 & 2` (215)
- Per-group numbering from 1, with the original roll serial shown alongside.
- Each row shows the voter, father/husband name, house number, age/gender, a vote dropdown, and a "move to group" dropdown.
- Mark each voter as a candidate, **Undecided** or **Won't vote / away**.
- **Submit** each group to see that group's leader, vote split and margin. The app also says whether the lead is safe against undecided and unmarked voters.
- After all three groups are submitted, **See final result** shows the projected Sarpanch and a group-wise table.
- Move voters between groups. Each move asks for confirmation, can be undone from the toast, and can be reverted individually or all at once from the "Moved voters" panel.
- Editing a submitted group marks it "Changed – submit again", so the final result always matches the latest marks.
- Progress is saved automatically in the browser (localStorage). Export and import marks as JSON to move between devices.

## Tech stack

- React 18 (function components, hooks, context)
- Vite 5
- Plain CSS with light/dark themes
- No backend: all data stays in the browser

## Run locally

```bash
npm install
npm run dev       # http://localhost:5173
```

## Build

```bash
npm run build     # outputs to dist/
npm run preview   # serve the production build locally
```

The build uses relative paths (`base: './'`), so `dist/` can be hosted on any static server.

## Project structure

```
src/
  App.jsx                  page layout and flow (submit, final result, moves)
  main.jsx                 entry point
  styles.css
  data/voters.json         roll metadata + 393 voters
  lib/
    constants.js           groups, colours, voter list with home group
    tally.js               grouping, counting, winner/tie/safety analysis
    useTracker.js          app state + localStorage persistence
  components/
    CandidateSetup.jsx     step 1
    GroupPicker.jsx        step 2 (group cards with status)
    VoterTable.jsx         step 3 (search, filter, mark, move)
    GroupResult.jsx        result after submitting a group
    FinalResult.jsx        final result + group-wise table
    ResultSummary.jsx      shared winner/bars block
    MovedVoters.jsx        list of moved voters with revert
    DataTools.jsx          export / import / clear
    Dialogs.jsx            in-app confirm dialog and toast
```

Results are a projection from your own markings, not an official count.
# kammapalli
