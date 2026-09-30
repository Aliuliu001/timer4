# Champion Mode Fixes & Deck Layout (2026-09-15)

## BUG 1: Timer mode hiện cards + mất clock ❌

**Nguyên nhân:**
- `#champ-cards` div tồn tại trong `#arena` → Timer mode cũng thấy
- CSS `body.champ-play #clock-display{display:none}` → nhưng Timer không set `champ-play` class
- Có thể do test Champion rồi quit về Timer, `champ-play` class chưa xóa

**Fix:**
1. `champCleanup()` phải xóa `body.champ-play` class ✅ (đã có dòng này)
2. `startArena()` (Timer) phải đảm bảo `#champ-cards` hidden + xóa `champ-play` class
3. CSS guard: `body.champ-play #champ-cards` thay vì bare `#champ-cards`

---

## BUG 2: Champion cards vẫn ở arena, chưa xuống deck ❌

**Đã bàn (chat trước):**
- Cards move từ arena overlay → deck area
- Deck taller (~45-50%), arena shorter (~-25%)
- Clock VISIBLE (hiện time nhỏ nhất của thẻ có time)
- 5 flames xếp hình quạt bên phải
- Food/skill 2 cột phía trên Player

**Chưa làm:**
- Cards vẫn `position:absolute` trong arena
- Clock vẫn bị ẩn (`body.champ-play #clock-display{display:none}`)
- Flames vẫn nằm ngang
- Food vẫn 1 hàng ngang scroll

---

## PLAN CHI TIẾT (làm từng bước)

### ✅ DONE (đã xong):
- [x] Tab Champion UI (grid 3 cột, upload, settings)
- [x] Mode toggle Timer/Champion
- [x] Champion game loop (draw cards, judge, mana, combo)
- [x] Difficulty 4-tier system
- [x] Wrong penalty (Boss leap)
- [x] Badge hide bug fix (eatSeq)

### 🔧 TODO (chưa làm):

#### **Step 1: Fix Timer mode bug (cards xuất hiện nhầm)**
- Guard `startArena()`: xóa `champ-play` class + hide `#champ-cards`
- Guard CSS: `#champ-cards` chỉ hiện khi `body.champ-play`

#### **Step 2: Move cards từ arena xuống deck**
- Xóa `<div id="champ-cards">` trong `#arena`
- Thêm `<div id="champ-deck-cards">` trong `#deck` (top row)
- CSS: `#champ-deck-cards` grid layout, cards nhỏ hơn (~150px wide)

#### **Step 3: Deck layout mới cho Champion**
CSS `body.champ-play #deck`:
```
grid-template-columns: 1fr 240px;
grid-template-rows: auto 1fr;
```
- Row 1: cards (col 1) + mana/flames (col 2)
- Row 2: judge buttons (col 1, slim) + food 2-col (col 2)

#### **Step 4: Un-hide clock trong Champion**
- Xóa `body.champ-play #clock-display{display:none}`
- `champTick()` update clock = min remaining time của unjudged cards
- Nếu không có thẻ có time → clock = "--:--" hoặc elapsed

#### **Step 5: Flames hình quạt**
CSS cho 5 `#combo-flames img`:
```css
body.champ-play #combo-flames {
  display: flex;
  flex-direction: column;
  transform: rotate(-15deg);
}
body.champ-play #combo-flames img:nth-child(1) { transform: rotate(30deg); }
body.champ-play #combo-flames img:nth-child(2) { transform: rotate(15deg); }
body.champ-play #combo-flames img:nth-child(3) { transform: rotate(0deg); }
body.champ-play #combo-flames img:nth-child(4) { transform: rotate(-15deg); }
body.champ-play #combo-flames img:nth-child(5) { transform: rotate(-30deg); }
```

#### **Step 6: Food 2 cột grid**
CSS:
```css
body.champ-play #food-shop {
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: auto;
  overflow: visible;
}
```

#### **Step 7: Arena height adjust**
```css
body.champ-play #screen-arena {
  height: 55%; /* was ~calc(100%-70px) */
}
body.champ-play #deck {
  height: 45%;
}
```

#### **Step 8: Time Front bar (round timer)**
- Thêm `<div id="champ-round-bar">` trong deck
- CSS: progress bar 3 màu (xanh/vàng/đỏ)
- `champDrawRound()` tính tổng Time Front, start interval
- Hết bar → `champJudge(idx, false)` tất cả unjudged cards

---

## VERIFICATION CHECKLIST

**Timer mode:**
- [ ] Clock hiện, không có cards
- [ ] Deck layout bình thường (judge row + mana + food 1 hàng)
- [ ] Chơi đến hết OK

**Champion mode:**
- [ ] Cards ở deck (không che Boss)
- [ ] Clock hiện (time nhỏ nhất hoặc elapsed)
- [ ] Flames hình quạt bên phải
- [ ] Food 2 cột grid, không scroll ngang
- [ ] Deck cao, arena ngắn, vừa màn hình
- [ ] Time Front bar hoạt động (nếu có thẻ có time)
- [ ] Judge đúng/sai, mana, combo OK

---

## ORDER OF EXECUTION

1. Step 1 (fix Timer bug) — URGENT
2. Step 2 (move cards to deck) — CORE
3. Step 3 (deck grid layout) — CORE
4. Step 4 (un-hide clock) — POLISH
5. Step 5 (flames fan) — POLISH
6. Step 6 (food 2-col) — POLISH
7. Step 7 (arena/deck height) — POLISH
8. Step 8 (Time Front bar) — FEATURE (làm sau)

**Estimate:** Steps 1-7 = 1 batch commit, Step 8 = separate commit.

---

**Current state:** Step 1-8 chưa làm. Bắt đầu từ Step 1.
