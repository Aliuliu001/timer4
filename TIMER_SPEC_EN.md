# TIMER Battle — Full UI Spec for Google AI Studio (English)

> PASTE THIS WHOLE FILE to Google AI Studio + add one line:
> "Build only template + layout + CSS. Leave game logic empty with TODO comments for DEV."

---

## 1. What is this game

A classroom English quiz game. The teacher clicks CORRECT / WRONG.
Boss (LEFT) walks slowly to Hero (RIGHT). Time runs out before Boss touches Hero = WIN.

- 1 screen only. Works on laptop + phone.
- Vanilla HTML + CSS + JS. No libraries.
- All text in code comments in SIMPLE English.

## 2. Screen layout (Arena + HUD + Control)

```
+--------------------------------------------------+
| TOP HUD: [Game name] [CLOCK 02:00] [Round 1/10]  |
| BOSS BAR: [Boss face][████████░░░░ 60%][Hero]    |
+--------------------------------------------------+
| ARENA (16:9, jungle default):                    |
|  [Boss sprite LEFT] ----walks----> [Hero RIGHT]  |
|  [Status icon above Boss: 🔥❄️☠️💤]              |
|  [Floating text: "I love you, Ms. Vi" grows]     |
+--------------------------------------------------+
| QUESTION CARD: [Image] "What is this?"           |
| [Big CORRECT ✓ green] [Big WRONG ✗ red]          |
| MANA: ●●●○○ (5 dots, RPG glow)  COMBO: 3/5       |
| SHOP: [🍕][🍦][🍄][🌶️][🍜][👩‍🏫] (6 cards)          |
+--------------------------------------------------+
| Tabs: [Play] [Questions] [Settings]              |
+--------------------------------------------------+
```

### 2.1 Arena details
- Background: 1 image layer (default = dark jungle). Teacher can change it in Settings.
- Ground line at bottom. Boss and Hero stand on ground.
- Boss size ~140px, Hero size ~120px. Both support JPG / PNG / GIF.
- When Boss is hit by food: swap Boss image to "eating image" for X seconds, then swap to "after image" if any, then back to normal.
- Idle animation: gentle bounce (CSS keyframes, 1s loop). No library.

### 2.2 Countdown clock
- Big digital text MM:SS, center top, font-size 48px.
- Quick buttons: 2:00 / 3:00 / 5:00 / 10:00 + custom input (minutes + seconds).
- Color: white normal, yellow under 30s, red + pulse under 10s.
- End: time = 0 and Boss not touching Hero = WIN screen. Boss touches Hero first = LOSE screen.

### 2.3 Boss progress bar (RPG style)
- Full-width bar under clock. Gradient fill + glow + moving shine.
- Formula: (bossX / startX) * 100%.
- Color: green >50%, yellow 25-50%, red <25% + blink.
- Left icon = Boss face, right icon = Hero face.

### 2.4 Mana bar (RPG style)
- 5 dots + thin glow bar. Each correct answer = +1 filled dot with pop animation.
- Full (5/5) = shop cards glow gold, playable click sound.
- After buy: reset to 0 with sweep animation.

## 3. Settings tabs (describe every field)

### TAB 1 — General
| Field | Type | Default |
|---|---|---|
| Timer preset | 4 buttons 2/3/5/10 min | 2 min |
| Custom time | number mm + ss | 2:00 |
| Boss speed | 3 buttons Slow/Normal/Fast | Normal |
| Questions per round | number | 10 |
| Language | dropdown VI/EN | VI |

### TAB 2 — Appearance (Boss / Hero / Background / Music)
| Field | Type | Note |
|---|---|---|
| Boss image | URL input + Upload button + preview 100px | gif ok |
| Hero image | URL input + Upload button + preview 100px | gif ok |
| Background | URL input + Upload + preview wide + "Use jungle default" button | Pinterest link ok |
| BGM music | Upload MP3 button + Play/Stop test + volume slider | LOCAL file only (browser blocks outside links) |
| Sound correct/wrong/skill/win/lose | 5 upload slots, local mp3 | code slots ready, files added later |

### TAB 3 — Questions (Excel-like table)
- Columns: ID | Question | Answer | Image (URL or upload) | Preview thumb 60px | Delete row.
- Buttons: Add row, Auto-fill ID, Upload Excel (.xlsx), Download template, Clear all, Save.
- Auto-save to localStorage. Survives reload.

### TAB 4 — Controls (all 3 active at once, same CORRECT/WRONG core)
| Method | UI |
|---|---|
| Big buttons | 2 half-screen buttons ✓ green / ✗ red, touch friendly |
| Keyboard | 2 inputs: key for CORRECT (default →), key for WRONG (default ←) |
| Mouse zone | checkbox ON/OFF; left-click arena = CORRECT, right-click = WRONG (block context menu) |

### TAB 5 — Food items (6 items, ONE shared framework)
Each item = ONE card with: icon image, name, price (5), eat seconds, effect picker, eating-image URL, after-image URL.
Adding item 7 = copy 1 card + 1 data row. NO logic change.

| # | Name | Eating image | After image | Freeze (s) | Extra effect | Icon |
|---|---|---|---|---|---|---|
| 1 | Pizza | boss eats pizza | sit still | 6 | none | 🍕 |
| 2 | Ice-cream | boss eats ice-cream | body covered with ice layer | 4 | FROZEN overlay while eating | 🍦 |
| 3 | Mushroom | boss eats mushroom | green body | 5 | POISON: green tint + slow 5s after | 🍄 |
| 4 | Chili | boss eats chili | lying + fan (cool down) | 4 | FIRE breath particles + slow 4s | 🌶️ |
| 5 | Noodles | boss eats noodles | sitting + washing bowl | 5 | none | 🍜 |
| 6 | Teacher photo | boss eats with teacher | walking + floating text "I love you, Ms. Vi", small→big, Minecraft pixel font | 5 | floating text follows Boss | 👩‍🏫 |

## 4. Skill icons + status effects (visual guide for AI Studio)

Status badge sits ABOVE Boss head, 40px icon + timer ring.

| Status | Icon | Screen effect (CSS only) |
|---|---|---|
| BURNING (chili) | 🔥 + orange ring | Boss tint orange + rising flame particles (CSS dots) + shake |
| FROZEN (ice-cream) | ❄️ + blue ring | Boss tint light-blue + ice crystal overlay (semi-transparent PNG/CSS) + stop walk |
| POISONED (mushroom) | ☠️ + green ring | Boss tint green + slow walk 50% for 5s + drip dots |
| STUN/SLEEP (pill idea, reserved) | 💤 "Zzz" floats up | Boss closes eyes (dark overlay on top half) + "Zzz" text floats, stop walk |
| FAN cooling (chili after) | 🌀 fan gif replaces Boss | Swap sprite to fan image, small wind lines |
| DISH-WASH (noodles after) | 🍜 bowl icon | Swap sprite to washing-bowl image |
| LOVE TEXT (teacher) | 💗 | Pixel-font text under Boss, scale 0.5→1.5 over 5s, follows Boss X position |

Rules:
- 1 status at a time. New food replaces old.
- Timer ring around icon counts down freeze seconds.
- All effects = image swap + CSS class. No canvas.

## 5. Buttons list (every button on screen)

- START / PAUSE / RESET (top right, pill buttons).
- CORRECT ✓ (green, 50% width, 80px tall) / WRONG ✗ (red, same).
- 6 shop cards: image 60px + name + "5 ●" + BUY state (gray when mana <5, gold glow when ready).
- COMBO gift: when 5 correct in a row, auto-throw random item (no click needed) + banner "COMBO! Free 🍕!".
- Settings SAVE / RESET DEFAULT.

## 6. Framework rules (IMPORTANT — tell AI Studio)

```js
// ONE array drives all 6 items. Item 7 = add 1 object.
const FOOD_ITEMS = [
 {id:'pizza', name:'Pizza', icon:'🍕', price:5, eatSeconds:6,
  eatingImage:'', afterImage:'', effect:'none'},
 // ... 5 more
];
// ONE object drives settings. New field = add 1 key.
const SETTINGS = { timerSeconds:120, bossSpeed:'normal',
  bossImage:'', heroImage:'', background:'jungle',
  keyCorrect:'ArrowRight', keyWrong:'ArrowLeft', mouseZone:true };
```

- Music: `AUDIO = {bgm:null, correct:null, ...}` — file inputs fill these from LOCAL files. Never hotlink mp3.
- Logic functions stay EMPTY with `// TODO(DEV):` comments: `onCorrect()`, `onWrong()`, `buyFood(id)`, `comboCheck()`, `tickClock()`, `moveBoss()`.
- CSS variables for theme: `--bg, --accent, --danger, --mana`.

## 7. What AI Studio must DELIVER

1. `index.html` (layout above, 3 tabs).
2. `style.css` (jungle default bg, RPG bars, pixel font for love text via Google Fonts "Press Start 2P").
3. `app.js` (data arrays + empty TODO functions + working tab switch + image preview + timer display only).
4. No game balance, no win/lose logic — DEV does that after.

## 8. Acceptance checklist

- [ ] Arena shows Boss LEFT, Hero RIGHT, clock center, boss bar full width.
- [ ] 6 shop cards visible, gray when mana<5.
- [ ] Settings has all 5 tabs with every field in section 3.
- [ ] Status badge area above Boss exists.
- [ ] Love-text style uses pixel font, scales up.
- [ ] Phone view stacks controls vertically, buttons still half-screen.
