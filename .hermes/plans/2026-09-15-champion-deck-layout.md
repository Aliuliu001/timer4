# Champion deck-layout replan (2026-09-15)

> **For Hermes:** Implement ONLY after user says "làm đi". Timer logic stays untouched.

**User asks:**
- Cards move from arena overlay DOWN into the Deck area (arena stays clean for Boss walk).
- Deck gets TALLER, arena slightly SHORTER.
- Keep the big countdown clock (game signature) — un-hide it in Champion.
- 5 combo flames in a FAN shape, right side (Player side), facing toward Boss.
- Skills/food in 2 columns above Player side (right column of deck).
- Bug (this fix, already done 2026-09-15): dish-name badge never hid after extra look.

**Layout (Champion play only, `body.champ-play` guards):**

```
┌───────────────────────────────┐
│ timebar (bossbar)             │
│ arena (shorter ~ -25%)        │
│  Boss → walks   Hero (right)  │
│  clock-display VISIBLE: shows │
│  smallest remaining card time │
│  ("--:--" if no timed cards)  │
├───────────────────────────────┤
│ DECK (taller ~45-50%)         │
│ ┌───────────────────┬───────┐ │
│ │ cards row (2-7,   │ mana  │ │
│ │ horizontal fit,   │ x/10  │ │
│ │ each with own     │ 5 🔥  │ │
│ │ ✓/✗ + time badge)│ fan   │ │
│ │                   │ food  │ │
│ │ slim: [✓ next]    │ 2-col │ │
│ │       [✗ next]    │ grid  │ │
│ └───────────────────┴───────┘ │
└───────────────────────────────┘
```

**Changes:**
1. CSS: `#champ-cards` moves from `position:absolute` arena overlay → static block inside `#deck` top (`#champ-deck-cards`). Arena overlay div removed from `#arena`.
2. Clock: remove `body.champ-play #clock-display{display:none}`; in `updateChampGame`, set clock text = min remaining of unjudged timed cards (or hold last value; `champTick` updates it). No clock = no pressure otherwise.
3. Deck grid under `.champ-play`: `grid-template-columns: 1fr 220px`; left = cards + slim next-card judge pair; right = mana count + flames fan (`transform: rotate/translate` fan via nth-child) + food 2-col (`grid-template-columns:1fr 1fr`, height auto).
4. `#judge-row` in champ-play: keep but relabel to judge FIRST unjudged card (calls `champJudgeFirst`). Keyboard/mouse mapping unchanged.
5. `champJudge/champDrawRound/champTick`: same logic, new container id. Card size smaller (deck cards ~150-190px wide).
6. Timer mode: everything hidden/guarded — deck CSS under `body.champ-play` only; Timer sees zero change.

**Verify:** Timer full game OK → Champion: cards in deck, clock counts, flames fan right, food 2-col, F5 keeps data, Boss walk + eat + badge hide OK.
