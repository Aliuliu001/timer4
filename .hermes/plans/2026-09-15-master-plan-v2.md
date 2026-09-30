# Master Plan: Timer Battle + Champion Mode V2 (2026-09-15)

## Architecture Overview

1. **Landing Screen (Mode Select):**
   - App opens with a clean, welcoming landing screen: two large cards for **⏱ Timer Battle** and **🃏 Champion Battle**.
   - Remembers last chosen mode (`localStorage.getItem('timer_gamemode')`).
   - Has a "Switch Mode" button in topbar so teacher can jump back anytime.

2. **Shared Features (Both Modes):**
   - Boss & Hero selection (galleries, custom links, upload).
   - Food / Skills selection & manager (Dish manager, Mana costs).
   - Difficulty system (Easy, Normal, Hard, Expert).
   - BG & Music settings.

3. **Timer Mode (Unchanged & Protected):**
   - Countdown clock (2, 3, 5, 10 min + custom).
   - Boss walks across arena with time.
   - Correct/Wrong buttons -> Mana -> Throw food / cast skills.

4. **Champion Mode (Redesigned UI & Flow):**
   - Setup Tab: 3-column grid (ID Front, Text Front, Time Front), image pool (upload files/folder), cards per round (2–7), display mode (image/text/both).
   - Arena Play Layout:
     - Arena is shorter (~55%), Boss walks across based on deck completion / difficulty speed.
     - **Cards moved to Deck** (no longer overlaying the arena).
     - **Main Countdown Clock visible** (shows minimum remaining time of unjudged timed cards, or elapsed time).
     - **Mana + 5 Combo Flames in a Fan shape** on the right (Player side).
     - **Food / Skills in a 2-column grid** above Player.
     - **Time Front bar** (round timer progress bar).
     - **Judge buttons** (✓ / ✗) or card-specific buttons + card fade/dim on wrong (pokemon-pvp style).

---

## Step-by-Step Implementation Plan

### Step 1: Landing Screen (Mode Select)
- Create `#screen-mode-select` at startup.
- Two big buttons: `[⏱ Timer Mode]` and `[🃏 Champion Mode]`.
- Clicking either sets `gameMode` and opens the corresponding Settings pane.
- Add "Switch Mode" button in topbar.

### Step 2: Champion Setup Tab isolation
- Ensure Champion setup tab only shows when `gameMode === 'champion'`.
- Share Boss, Hero, Food, Difficulty tabs between both modes (shared settings).

### Step 3: Champion Deck Layout & Arena Restructuring
- Move `#champ-cards` from `#arena` into `#deck` (`#champ-deck-cards`).
- Apply `body.champ-play` CSS grid to `#deck`:
  - Left: flashcards row + slim judge buttons.
  - Right: mana count + fan-shaped 5 combo flames + 2-column food grid.
- Adjust arena height (55%) and deck height (45%).
- Un-hide `#clock-display` in Champion mode, wire it to show round timer / countdown.

### Step 4: Time Front Bar & Round Timer
- Add `#champ-round-bar` progress bar inside deck.
- Wire round countdown timer based on card `Time Front` values.
- Auto-fail unjudged cards when bar expires (reset combo, no mana loss), auto-draw next round.

### Step 5: Verification & Testing
- Test Timer mode from scratch (no cards, clock works, arena clean).
- Test Champion mode from scratch (landing -> setup cards -> play -> cards in deck, clock works, fan flames, 2-col food, win/lose).
- Push to GitHub.
