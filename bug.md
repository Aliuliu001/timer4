# Timer2 Bug & Pitfall Log

## 1. Timer mode showing Champion cards & hiding clock
- **Symptom:** Timer mode rendered flashcards in arena and hid countdown clock.
- **Root Cause:** `body.champ-play` class leaked from Champion session, and `#champ-cards` was a permanent overlay in `#arena`.
- **Fix:** Isolate `#champ-cards` to Champion mode only via explicit DOM structure and cleanup routines.

## 2. Champion cards overlaying Boss
- **Symptom:** Flashcards floated in the middle of arena, covering Boss movement.
- **Root Cause:** Designed as absolute overlay in arena.
- **Fix:** Move flashcards into `#deck` area (taller deck, shorter arena).

## 3. Difficulty preset showed a Boss Arrival Time that never matched the game
- **Symptom:** Timer mode with 1:00 on the clock + Easy showed "Boss Arrival 450s" while the Boss actually arrived after 90s; Champion/Quiz honoured that box while Timer ignored it entirely.
- **Root cause:** `recalcBossArrival()` always read the **Champion** countdown boxes first (they exist in the DOM even in Timer mode), and the three game starts used three different rules for the walk time.
- **Fix:** one shared rule for all modes — `modeCountdownSec()` reads only the ACTIVE mode's boxes, `recalcBossArrival()` re-syncs on mode switch / countdown edit / difficulty click, and `bossWalkMsFor(totalMs)` is what Timer, Champion and Quiz all call. Editing the box by hand (`arrivalManual`) still wins until the next mode/difficulty change.
- **Verified:** Easy/Normal/Hard/Expert at 1:00 → shown 90/60/45/30 = actual walk 90/60/45/30 s; Champion 5:00 → 225 s; Quiz 3:00 → 90 s.

## 4. Difficulty `ragePct` was dead config (Boss always enraged at 50%)
- **Symptom:** Easy promised `ragePct:30` (Boss angers only at 30% of the clock left) but the enrage trigger hardcoded `totalGameTimeMs / 2`.
- **Fix:** trigger now uses `(DIFFICULTY_PRESETS[difficulty].ragePct || 50)`, and the ⚔️ Difficulty & Stats table has a "Boss rages when time left (%)" row so the teacher can see/edit it.
- **Verified:** Easy 120s → enrages at ≤36s, not at 60s; Normal/Hard/Expert stay at ≤60s.

## 5. Debug grid used to draw itself over the game on load
- **Symptom:** the centimetre grid overlay was created (and toggled) 500ms after load with `gridDebugVisible = true`.
- **Fix:** default off; the 📐 Grid button in the arena is the only way to show it.

## 6. Image uploads lived in localStorage (2MB per file, 5MB total)
- **Symptom:** Boss/Player uploads rejected files over 2MB; ~30 images filled localStorage, then every save failed silently and the pool looked empty after a refresh.
- **Fix (game-image-upload skill):** shared library in IndexedDB (`TimerChampDB/images`) with:
  - compress-on-ingest (WebP 0.85, longest side 1200px) **with an alpha check** — WebP that lost transparency falls back to PNG, GIFs keep their animation, bigger-than-original results keep the original file;
  - `SafeStore` around every localStorage write (storage full → clear red message instead of a dead game);
  - pool UI: count + size, drag & drop zone, thumbnails sorted numerically, red dashed border + "not used yet" for unused IDs, tick + delete, ✨ Clean ID cells (` 12.PNG ` → `12`);
  - 💾 Backup / 📂 Restore single JSON (`app: timer4-image-pool` marker) containing the whole pool, Champion rows, custom Boss/Player picks and settings — wrong file is rejected without touching current data;
  - legacy `data:` links inside `timer_custom_boss/hero` migrate themselves into the library on load.
- **Verified:** 4 mixed files (transparent PNG, opaque PNG, GIF, 3000×2000 PNG) + 1 HEIC → 4 saved, HEIC reported by name; transparent PNG corner alpha still 0; 3000×2000 → 3KB WebP; reload keeps all 4; backup → wipe → restore returns everything; blocked localStorage shows the warning instead of crashing.
