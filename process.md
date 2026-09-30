# Timer2 Process Log

## 2026-09-18: Champion Layout V3 - Major redesign
- **Task:** 4-point layout overhaul per user request
- **Changes:**
  1. Tab Champion: Added countdown clock input (Min/Sec) separate from Timer
  2. Cards repositioned: left-aligned (left:12px, right:180px for food/skill space), gap:8px (2mm)
  3. Card size reduced: 520px→280px max, 320px→200px min (3 cards fit side-by-side)
  4. Layout inverted: Clock below cards (bottom:45%), Bossbar to bottom (bottom:0), Boss/Hero raised (bottom:90px)
- **JS:** `startChampion()` now reads `champ-input-m/s` instead of Timer's `input-h/m/s`
- **Commit:** 73439cb
- **Status:** ✅ Pushed, awaiting user test

## 2026-09-18: Bug fixes - Card size & Food click judge
- **Task:** Fix 3 bugs reported by user
- **Changes:**
  1. Card base size increased 2.5× (280px → 700px max-width, 170px → 425px min-width)
  2. Slider now scales entire card via CSS transform: scale(), not just image width
  3. Food click no longer triggers champJudgeFirst() - added `#champ-food-col` guard in arena mousedown listener
- **Commit:** eb1066f
- **Status:** ✅ Pushed, awaiting user test

## 2026-09-15: Master Plan V2 & Mode Landing + Deck Layout
- **Goal:** Create Landing Screen (Mode Select), isolate Champion setup, move Champion cards down into `#deck`, implement 2-column food shop, fan flames, un-hide clock, Time Front bar.
- **Rule:** One task at a time, test thoroughly, log process & bugs.

## Task 1 (DONE, commit c778398): Landing mode-select screen
- New `#screen-mode-select` with 2 big cards; `#screen-setup` hidden by default.
- `selectMode(m)` sets gameMode, shows setup with isolated tabs (Time hidden in Champion, Champ hidden in Timer), updates title.
- `returnToModeSelect()` stops game, hides all, shows landing.
- `showTab()` now hides mode-select when navigating.
- Timer `startArena()` guards: clears `champ-play` class, hides `#champ-cards`.

## Task 1.5 (DONE, commit d888b5b): Champion tab UI reorder
- Upload/Start/Card size controls moved to top of Champion tab
- Input grid (3-col table) moved to bottom
- No more scrolling through 100-200 rows to find Start button
