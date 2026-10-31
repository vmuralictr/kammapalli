# Sarpanch Vote Tracker

A small React app for canvassing the Sarpanch election in Kammapalle (Part 274, 173-Puthalapattu (SC), Chittoor). It holds the 393 voters from the 2026 Special Intensive Revision draft roll. You mark which candidate each voter is expected to support, group by group, and the app projects the winner.

> **Private data.** `src/data/voters.json` contains every voter's name, EPIC number, age and house number. Keep this repository private.

## Features

- Enter 2–8 candidates. Names can be changed later without losing marks.
- Add or delete candidates. Deleting asks for confirmation, clears only that candidate's marks, and flags affected groups for re-submission. **Delete all candidates** removes every candidate at once (after confirmation), clears their marks and resets all groups to not submitted.
- Voters split into three working groups:
  - `1-Guttakindavooru` (52)
  - `2-Kammapalle HW` (126)
  - `155 Kammapalle 1 & 2` (215)
- Per-group numbering from 1, with the original roll serial shown alongside.
- Each row shows the voter, father/husband name, house number, age/gender, and a vote dropdown.
- Mark each voter as a candidate, **Undecided** or **Won't vote / away**.
- Each candidate has their own colour (changeable with the colour square). Vote dropdowns, rows, counts and result bars use it.
- Sortable columns: #, Voter, Father/Husband name, Age and **Will vote for**. Click once for ascending, again for descending, a third time to reset.
- **Submit** each group to see that group's leader, vote split and margin. The app also says whether the lead is safe against undecided and unmarked voters.
- After all three groups are submitted, **See final result** shows the projected Sarpanch and a group-wise table.
- **Manage voters** tab (separate from the vote tracker) for moving voters between groups. Filter by group, search, tick one or many voters, choose a target group and press **Move**. Each move asks for confirmation, can be undone from the toast, and can be reverted individually or all at once from the "Moved voters" panel. Marks stay with the voter.
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
    VoterTable.jsx         step 3 (search, filter, sort, mark)
    GroupResult.jsx        result after submitting a group
    FinalResult.jsx        final result + group-wise table
    ResultSummary.jsx      shared winner/bars block
    ManageVoters.jsx       Manage voters tab: select and move voters between groups
    MovedVoters.jsx        list of moved voters with revert
    DataTools.jsx          export / import / clear
    Dialogs.jsx            in-app confirm dialog and toast
```

Results are a projection from your own markings, not an official count.
# kammapalli
