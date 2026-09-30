# Champion Layout V3 Plan (2026-09-18) — CHỜ DUYỆT

## User yêu cầu (4 điểm)
1. **Setting countdown clock riêng Champion:** Input chọn phút/giây trong Tab Champion (hiện dùng chung Tab Time)
2. **Cards sang lề trái:** Lề phải có food/skill column → cards dời sang trái, trừ khoảng cách bên phải
3. **Size card nhỏ hơn, gap 2mm:** Cards hiện 520px quá lớn → giảm xuống, gap: 2mm (≈ 7.56px CSS)
4. **Đảo layout:** Countdown clock xuống dưới cards; Bossbar (thanh HP/time tổng) xuống bottom dưới chân Boss/Player

## Layout mới (top → bottom)
```
┌─────────────────────────────────────────┐
│ #champ-cards (lề trái, flex-start)     │ ← Cards dồn trái, gap 2mm
│  [Card 1] [Card 2] [Card 3] ...        │
│                                         │
│ #clock-display (dưới cards, center)    │ ← Countdown số to
├─────────────────────────────────────────┤
│ #arena: Boss ←→ Hero                    │
│   #champ-food-col (phải, trên Player)  │
│   #champ-combo-star (trên Player)      │
├─────────────────────────────────────────┤
│ #bossbar-wrap (bottom, dưới chân)      │ ← Thanh HP/time tổng
└─────────────────────────────────────────┘
```

## Chi tiết thay đổi

### 1. Setting countdown clock Champion
**Tab Champion thêm:**
```html
<fieldset>
  <legend>⏱ Countdown clock (Champion mode)</legend>
  <div class="time-inputs">
    <div><input type="number" id="champ-input-m" min="0" value="5"><label>Min</label></div>
    <div><input type="number" id="champ-input-s" min="0" value="0"><label>Sec</label></div>
  </div>
</fieldset>
```
**JS:** `startChampion()` đọc `champ-input-m/s` → `remainingTimeMs`, không dùng `input-h/m/s` Timer

### 2. Cards sang lề trái
**CSS:**
```css
body.champ-play #champ-cards {
  left: 12px;           /* lề trái sát */
  right: 180px;         /* trừ food/skill column bên phải */
  justify-content: flex-start; /* cards dồn trái, không center */
  top: 12px;            /* sát trên */
  max-height: 35%;
}
```

### 3. Size card nhỏ + gap 2mm
**CSS:**
```css
.champ-card {
  max-width: 280px;     /* giảm từ 520px */
  min-width: 200px;     /* giảm từ 320px */
}
#champ-cards {
  gap: 8px;             /* 2mm ≈ 7.56px, làm tròn 8px */
  flex-wrap: wrap;
}
```
**Lý do:** 280px × 3 cards + gap 8px × 2 = 856px, vừa màn hình ~1024px - 180px (food column)

### 4. Đảo layout: Clock dưới cards, Bossbar xuống bottom
**CSS (Champion mode):**
```css
body.champ-play #bossbar-wrap {
  position: absolute;
  top: auto;
  bottom: 0;            /* xuống bottom */
  left: 0; right: 0;
}
body.champ-play #clock-display {
  position: absolute;
  top: auto;            /* không top:50% nữa */
  bottom: 45%;          /* dưới cards, trên arena */
  z-index: 35;          /* trên cards (30) */
}
body.champ-play #arena {
  padding-top: 0;       /* không padding cho bossbar trên */
  padding-bottom: 80px; /* để chỗ cho bossbar dưới */
}
body.champ-play #boss, body.champ-play #hero {
  bottom: 90px;         /* trên bossbar (80px cao) */
}
```

## Rủi ro
- Bossbar xuống bottom → Boss/Hero cần `bottom` mới để không đè lên bar
- Clock dưới cards → cần tính toán `bottom` chính xác (cards max-height 35% + gap)
- Cards lề trái → food column phải không che cards (z-index 25 < 30 OK)
- Màn hình nhỏ (<1024px) → cards có thể tràn, cần responsive

## Verify checklist
- [ ] Tab Champion có input countdown riêng
- [ ] `startChampion()` đọc `champ-input-m/s`, không đụng Timer
- [ ] Cards dồn lề trái, gap 8px (2mm)
- [ ] Clock dưới cards, center
- [ ] Bossbar xuống bottom, dưới chân Boss/Player
- [ ] Boss/Hero `bottom` đủ cao, không đè bossbar
- [ ] Timer mode không ảnh hưởng (bossbar vẫn top, clock center arena)

## Next steps (sau duyệt)
1. Patch Tab Champion: thêm fieldset countdown input
2. Patch CSS: cards lề trái + gap 8px + size nhỏ
3. Patch CSS: bossbar bottom + clock dưới cards + fighters `bottom` mới
4. Patch JS: `startChampion()` đọc `champ-input-m/s`
5. Test Timer mode không hư
6. Push + log process.md
