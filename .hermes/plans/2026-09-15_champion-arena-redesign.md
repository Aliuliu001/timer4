# Champion Arena Redesign Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Redesign Champion mode only: delete deck, widen arena, move Boss/Player to bottom, cards under timebar, food as vertical column above Player, 5 combo flames as a star behind Player with fire lines + flash before Donut.

**Architecture:** Single-file change in `index.html`. All Champion styling gated by `body.champ-play` so Timer mode is byte-identical in behavior. New arena children (`#champ-food-col`, `#champ-combo-star`) hidden unless Champion plays. `renderShop`/`updateMeters` branch by mode.

**Tech Stack:** Vanilla HTML/CSS/JS in one file, no libraries. localStorage saves unchanged.

---

## Current context / assumptions (verified in code)

- File: `/home/ubuntu/timer2/index.html` (~2513 lines, ~141KB).
- Arena HTML `#screen-arena` lines ~693-731: `.bossbar-wrap` (timebar) → `#arena` (bg, fighters, `#champ-cards`, fx layers) → `#deck` (`#judge-row`, `#meter-row` with `#mana-label`/`#mana-count`/`#combo-flames`, `#shop`, `#food-shop`).
- Champion CSS lines ~421-457: `#champ-cards{top:64px; bottom:200px}`, `body.champ-play #judge-row{display:none}`, `#food-shop` slimmed, `#clock-display` hidden in champ.
- `startArena()` line ~1227 routes champion → `startChampion()` (line ~1611); Timer path clears `champ-play` and hides cards.
- `renderShop()` lines ~1832-1859 renders Timer deck (`#shop` hidden via CSS, `#food-shop` row). `updateMeters()` lines ~1386-1389 toggles `#combo-flames img.lit` + `#mana-count`.
- `onCorrect()` lines ~1354-1366: mana+1, combo++, threshold from `DIFFICULTY_PRESETS[difficulty].combo`, combo full → `throwRandomFood()` (Donut) unless `GIF_SET.donutOn===false`.
- `champJudge()` lines ~1727-1742 calls `onCorrect()/onWrong()` per card; card buttons `✓/✗` stay per-card (user confirmed).
- User confirmed: Timer keeps deck untouched; Champion only. Food column = food dishes only, above Player, height follows Player. Delete "Mana" text in Champion. Star of 5 flames on Player's Boss-facing side (left of Player). Fire line per lit flame. Full-5 → flash → Donut if combo tick on.

## Open questions — all resolved

1. Timer unchanged? YES (user: "Timer giữ như cũ").
2. Judge buttons? Keep per-card ✓/✗, no shared top buttons.
3. Food column content? Food dishes only.
4. Mana text? Delete in Champion (Timer keeps `Mana x/10`).
5. Combo tick kept? YES — Donut fires only if tick on (`GIF_SET.donutOn!==false`).

---

### Task 1: Add Champion arena HTML nodes

**Objective:** Add food column + combo star containers inside `#arena`, hidden by default.

**Files:**
- Modify: `/home/ubuntu/timer2/index.html:700-718` (inside `#arena`, after `#champ-cards`)

**Step 1: Insert HTML**

```html
<div id="champ-food-col" class="hidden"></div>
<div id="champ-combo-star" class="hidden">
  <svg id="star-lines" viewBox="0 0 120 120" preserveAspectRatio="none"></svg>
  <img data-i="0" src="assets/power_up.gif" alt="combo">
  <img data-i="1" src="assets/power_up.gif" alt="combo">
  <img data-i="2" src="assets/power_up.gif" alt="combo">
  <img data-i="3" src="assets/power_up.gif" alt="combo">
  <img data-i="4" src="assets/power_up.gif" alt="combo">
</div>
```

**Step 2: Verify:** `grep -c "champ-food-col" /home/ubuntu/timer2/index.html` → Expected: ≥3 (CSS+HTML+JS).

**Step 3: Commit**

```bash
git -C /home/ubuntu/timer2 add index.html
git -C /home/ubuntu/timer2 commit -m "champion: add food column + combo star nodes (hidden)"
```

### Task 2: Champion CSS — kill deck, widen arena, bottom fighters, cards under timebar

**Objective:** Champion-only layout; Timer selectors untouched.

**Files:**
- Modify: `/home/ubuntu/timer2/index.html:454-457` (append to CHAMPION MODE block)

**Step 1: Append CSS**

```css
/* Champion full-arena: deck gone, arena takes its space */
body.champ-play #deck{display:none !important}
body.champ-play #screen-arena{height:calc(100% - 70px)}
body.champ-play #arena{flex:1; min-height:420px}
/* Fighters to the bottom */
body.champ-play #boss, body.champ-play #hero{bottom:8px}
/* Cards directly under the timebar */
body.champ-play #champ-cards{top:8px; bottom:auto; max-height:38%; align-items:flex-start}
/* Food column: vertical, above Player, transparent-locked / lit-ready */
#champ-food-col{position:absolute; z-index:40; display:flex; flex-direction:column; gap:6px; align-items:center}
#champ-food-col.hidden{display:none !important}
#champ-food-col .food-card{background:transparent; border:none; opacity:.35; filter:grayscale(.8); display:flex; align-items:center; gap:4px; cursor:pointer}
#champ-food-col .food-card.ready{opacity:1; filter:none; box-shadow:0 0 14px rgba(255,212,59,.95); border-radius:12px; background:rgba(0,0,0,.35)}
```

**Step 2: Verify:** reload page, `selectMode('champion')` → Start → deck absent, arena taller, cards near top under timebar, fighters at bottom.

**Step 3: Commit**

```bash
git -C /home/ubuntu/timer2 add index.html
git -C /home/ubuntu/timer2 commit -m "champion: deck removed, wide arena, bottom fighters, cards under timebar"
```

### Task 3: Combo star CSS — star shape, fire lines, flash

**Objective:** 5 flames in star positions left of Player; SVG lines glow per lit flame; full-5 flash class.

**Files:**
- Modify: `/home/ubuntu/timer2/index.html` (same CHAMPION block)

**Step 1: Append CSS**

```css
#champ-combo-star{position:absolute; width:120px; height:120px; z-index:39; pointer-events:none}
#champ-combo-star.hidden{display:none !important}
#champ-combo-star img{position:absolute; width:34px; height:34px; object-fit:contain; filter:grayscale(1); opacity:.35}
#champ-combo-star img.lit{filter:none; opacity:1; drop-shadow:0 0 8px #ff922b}
#champ-combo-star img[data-i="0"]{left:43px; top:0}
#champ-combo-star img[data-i="1"]{left:86px; top:32px}
#champ-combo-star img[data-i="2"]{left:69px; top:86px}
#champ-combo-star img[data-i="3"]{left:17px; top:86px}
#champ-combo-star img[data-i="4"]{left:0; top:32px}
#star-lines{position:absolute; inset:0; width:100%; height:100%}
#star-lines line{stroke:#ff922b; stroke-width:3; opacity:0; filter:drop-shadow(0 0 4px #ffb347)}
#star-lines line.lit{opacity:1}
#champ-combo-star.star-full{animation:starFlash .6s ease-out}
@keyframes starFlash{0%{filter:brightness(1)}30%{filter:brightness(2.2) drop-shadow(0 0 24px #ffd43b)}100%{filter:brightness(1)}}
```

**Step 2: Verify:** star positions form pentagram; lines hidden until lit.

**Step 3: Commit**

```bash
git -C /home/ubuntu/timer2 add index.html
git -C /home/ubuntu/timer2 commit -m "champion: combo star layout + fire lines + flash"
```

### Task 4: Branch renderShop by mode (Timer untouched)

**Objective:** Timer renders `#food-shop` as today; Champion renders `#champ-food-col` vertical, pale-unless-affordable.

**Files:**
- Modify: `/home/ubuntu/timer2/index.html:1846-1859` (food half of `renderShop`)

**Step 1: Implementation**

```js
const fs=$('food-shop'); if(fs) fs.innerHTML='';
const fc=$('champ-food-col');
const isChamp = (typeof gameMode!=='undefined' && gameMode==='champion' && document.body.classList.contains('champ-play'));
if(isChamp){
  if(fs) fs.style.display='none';
  if(fc){ fc.classList.remove('hidden'); fc.innerHTML='';
    for(const f of FOOD_ITEMS){
      if(f.enabled===false) continue;
      const ready=mana>=(f.price||5);
      const d=document.createElement('div');
      d.className='food-card '+(ready?'ready':'locked');
      d.innerHTML=skillIconHtml(f,40)+'<div class="scap"><div class="sname">'+f.name+'</div>'+manaOrbHtml(f,(f.price||5))+'</div>';
      d.style.pointerEvents='auto'; d.style.cursor='pointer';
      d.onclick=(function(id){ return function(){ applyFood(id); }; })(f.id);
      fc.appendChild(d);
    }
    positionChampOverlays();
  }
  return;
}
if(fc) fc.classList.add('hidden');
// ... existing Timer #food-shop loop unchanged below ...
```

**Step 2: Verify:** Timer Start → `#food-shop` visible, `#champ-food-col` hidden. Champion Start → reversed.

**Step 3: Commit**

```bash
git -C /home/ubuntu/timer2 add index.html
git -C /home/ubuntu/timer2 commit -m "champion: food column rendering branched by mode"
```

### Task 5: Branch updateMeters — Timer flames vs Champion star + lines

**Objective:** Keep Timer `#combo-flames` + `#mana-count`; Champion lights star imgs + SVG lines, no Mana text.

**Files:**
- Modify: `/home/ubuntu/timer2/index.html:1386-1389` (`updateMeters`)

**Step 1: Implementation**

```js
function updateMeters(){
  const isChamp = (typeof gameMode!=='undefined' && gameMode==='champion' && document.body.classList.contains('champ-play'));
  if(isChamp){ updateChampStar(); return; }
  document.querySelectorAll('#combo-flames img').forEach((im,i)=>im.classList.toggle('lit', i<combo));
  const mc=$('mana-count'); if(mc) mc.textContent=mana+'/10';
  const mr=$('meter-row'); if(mr) mr.style.display='';
}
function updateChampStar(){
  const star=$('champ-combo-star'); if(!star) return;
  star.querySelectorAll('img').forEach((im,i)=>im.classList.toggle('lit', i<combo));
  // fire lines connect lit flames in star order 0-1-2-3-4-0
  const svg=$('star-lines'); if(!svg) return;
  const pts=[[60,17],[103,49],[86,103],[34,103],[17,49]];
  const order=[0,1,2,3,4,0];
  svg.innerHTML='';
  for(let k=0;k<5;k++){
    const a=pts[order[k]], b=pts[order[k+1]];
    const ln=document.createElementNS('http://www.w3.org/2000/svg','line');
    ln.setAttribute('x1',a[0]); ln.setAttribute('y1',a[1]);
    ln.setAttribute('x2',b[0]); ln.setAttribute('y2',b[1]);
    if(combo>k) ln.classList.add('lit');
    svg.appendChild(ln);
  }
}
```

**Step 2: Verify:** answer correct in Champion → star flames light 1→5 with glowing connector lines; Timer unchanged.

**Step 3: Commit**

```bash
git -C /home/ubuntu/timer2 add index.html
git -C /home/ubuntu/timer2 commit -m "champion: star combo meters with fire lines"
```

### Task 6: Position overlays from Player geometry (follow Player height)

**Objective:** Food column above Player head; star on Player's Boss-facing (left) side; recompute on size/position change.

**Files:**
- Modify: `/home/ubuntu/timer2/index.html` (new function + hooks in `applySizes`, `updateGraphics`, `startChampion`)

**Step 1: Implementation**

```js
function positionChampOverlays(){
  if(!(typeof gameMode!=='undefined' && gameMode==='champion' && document.body.classList.contains('champ-play'))) return;
  const arena=$('arena'), hero=$('hero'), col=$('champ-food-col'), star=$('champ-combo-star');
  if(!arena||!hero) return;
  const hx=hero.offsetLeft||0, hw=hero.offsetWidth||0, hh=hero.offsetHeight||0;
  if(col && !col.classList.contains('hidden')){
    col.style.left=(hx+hw/2-30)+'px';
    col.style.bottom=(8+hh+8)+'px';
    col.style.top='auto';
  }
  if(star && !star.classList.contains('hidden')){
    star.style.left=Math.max(0,(hx-130))+'px';
    star.style.bottom=(8+Math.max(0,hh-120)/2)+'px';
    star.style.top='auto';
  }
}
```

Hook: call `positionChampOverlays()` at end of `applySizes()`, in `updateGraphics()` (cheap: only when champ-play), and after `renderShop()` in `startChampion()`.

**Step 2: Verify:** change Hero size slider → column/star track Player; walk/resize keeps positions.

**Step 3: Commit**

```bash
git -C /home/ubuntu/timer2 add index.html
git -C /home/ubuntu/timer2 commit -m "champion: overlays follow player height"
```

### Task 7: Star flash then Donut on combo-5 (tick respected)

**Objective:** On combo threshold in Champion: star flashes, then existing Donut flow fires (or nothing if unticked).

**Files:**
- Modify: `/home/ubuntu/timer2/index.html:1354-1366` (`onCorrect` combo branch)

**Step 1: Implementation**

```js
if(combo>=comboThreshold){
  combo=0;
  if(isChampMode()){
    const star=$('champ-combo-star');
    if(star){ star.classList.remove('star-full'); void star.offsetWidth; star.classList.add('star-full'); }
    updateChampStar();
    setTimeout(()=>{
      if(GIF_SET.donutOn===false){ showComboPopup('🎉 COMBO '+comboThreshold+'!'); }
      else { showComboPopup('🎉 COMBO '+comboThreshold+'! Free Donut for Boss! 🍩'); throwRandomFood(); }
    }, 600);
  } else if(GIF_SET.donutOn===false){ showComboPopup('🎉 COMBO '+comboThreshold+'!'); }
  else { showComboPopup('🎉 COMBO '+comboThreshold+'! Free Donut for Boss! 🍩'); throwRandomFood(); }
  updateMeters(); return;
}
```

Add helper `function isChampMode(){ return typeof gameMode!=='undefined'&&gameMode==='champion'&&document.body.classList.contains('champ-play'); }` and reuse in Tasks 4-5 (refactor).

**Step 2: Verify:** 5 correct in Champion → star flashes ~0.6s → Donut flies; unticked combo → popup only, no Donut.

**Step 3: Commit**

```bash
git -C /home/ubuntu/timer2 add index.html
git -C /home/ubuntu/timer2 commit -m "champion: star flash before combo donut"
```

### Task 8: Mode enter/exit hygiene (Timer never sees Champion UI)

**Objective:** `startChampion` shows `champ-food-col`+`champ-combo-star`, hides deck via class; `startArena` (Timer), `quitArena`, `triggerEnd`, `champCleanup` hide them again.

**Files:**
- Modify: `/home/ubuntu/timer2/index.html:1611-1658` (`startChampion`), `:1749-1754` (`champCleanup`), `:1227-1232` (Timer guard), `:1336-1350` (quit/triggerEnd)

**Step 1: Changes**
- In `startChampion()` after `renderShop()`: `$('champ-food-col').classList.remove('hidden'); $('champ-combo-star').classList.remove('hidden'); positionChampOverlays();` + ensure `$('meter-row').style.display='none'` in champ (Mana text gone in Champion only).
- In `champCleanup()`: hide both nodes, restore `$('meter-row').style.display=''`.
- Timer `startArena()`: already removes `champ-play`; add hide of both nodes (defensive).

**Step 2: Verify:** Timer ↔ Champion switching 3x → no leftover column/star/meter in wrong mode.

**Step 3: Commit**

```bash
git -C /home/ubuntu/timer2 add index.html
git -C /home/ubuntu/timer2 commit -m "champion: mode enter-exit hygiene"
```

### Task 9: Validate + push

**Step 1: Syntax check**

```bash
python3 -c "h=open('/home/ubuntu/timer2/index.html').read(); open('/tmp/champ_check.js','w').write(h.split('<script>')[1].split('</script>')[0])"
node --check /tmp/champ_check.js && echo JS-OK
```

Expected: `JS-OK`.

**Step 2: Serve + click-through**

```bash
python3 -m http.server 8931 --directory /home/ubuntu/timer2
```

Checklist: (a) Timer Start → deck + Mana + flames row exactly as before; (b) Champion Start → no deck, wide arena, cards under timebar, fighters bottom, food column above Player, star left of Player; (c) correct ×5 → lines + flash + Donut; (d) resize/hero-size → overlays follow.

**Step 3: Push** (needs user PAT; never store token outside `.env`)

```bash
git -C /home/ubuntu/timer2 log --oneline -8
git -C /home/ubuntu/timer2 push origin main
```

## Risks / tradeoffs

- Single-file edits risk Timer regression → mitigated by `isChampMode()`/`body.champ-play` gating every change; Timer code paths byte-identical.
- Absolute-positioned overlays can drift on small screens → recompute in `applySizes`+`updateGraphics`; clamp left ≥ 0.
- SVG lines need namespace creation (`createElementNS`) — plain `createElement('line')` silently fails.
- `positionChampOverlays` in `updateGraphics` must early-return for Timer (perf).
- Do NOT touch Magic gốc or Solo/PvP files; do NOT touch Timer deck CSS/JS outside the branch points above.
