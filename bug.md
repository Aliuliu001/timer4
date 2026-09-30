# Timer2 Bug & Pitfall Log

## 1. Timer mode showing Champion cards & hiding clock
- **Symptom:** Timer mode rendered flashcards in arena and hid countdown clock.
- **Root Cause:** `body.champ-play` class leaked from Champion session, and `#champ-cards` was a permanent overlay in `#arena`.
- **Fix:** Isolate `#champ-cards` to Champion mode only via explicit DOM structure and cleanup routines.

## 2. Champion cards overlaying Boss
- **Symptom:** Flashcards floated in the middle of arena, covering Boss movement.
- **Root Cause:** Designed as absolute overlay in arena.
- **Fix:** Move flashcards into `#deck` area (taller deck, shorter arena).
