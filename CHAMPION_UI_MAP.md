# Champion Mode UI Map (khi đang chơi)

## Layout hiện tại (dựa vào code)

```
┌────────────────────────────────────────────────────────┐
│ #bossbar-wrap (thanh tiến độ 3 màu + 2 avatar)         │ ← Đang ở TOP
│   #boss-face (avatar Boss trái)                        │
│   #progress-fill (thanh xanh/vàng/đỏ)                  │
│   #hero-face (avatar Player phải)                      │
├────────────────────────────────────────────────────────┤
│ #screen-arena (khung chơi chính)                       │
│                                                         │
│   #champ-cards (khu vực cards, CSS: top:0, height:50%) │
│     .champ-card × 3 (tree, beauty, tiny...)           │
│       - .champ-text (chữ trong card)                   │
│       - .champ-judge (2 nút ✓ ✗)                       │
│                                                         │
│   #clock-display (đồng hồ đếm ngược 00:03:00)         │
│                                                         │
│   #arena (khu vực chiến đấu, CSS: height:50%)         │
│     #boss (Boss bên trái)                              │
│       #boss-img                                        │
│     #hero (Player bên phải)                            │
│       #hero-img                                        │
│     #champ-food-col (cột food dọc, trên Player)       │
│     #champ-combo-star (5 ngọn lửa, trên Player)       │
└────────────────────────────────────────────────────────┘
```

## CSS Classes quan trọng (Champion mode)

**Khi Champion đang chơi:**
- `body.champ-play` = class được thêm vào `<body>`

**CSS hiện tại (trong `<style>`):**
```css
/* Line ~466-473 */
body.champ-play #champ-cards {
  top:0; left:0; right:0; 
  height:50%; 
  padding:12px; 
  overflow-y:auto
}

body.champ-play #arena {
  position:relative; 
  height:50%; 
  top:auto; bottom:0
}

body.champ-play #bossbar-wrap {
  position:absolute !important; 
  top:auto !important; 
  bottom:0 !important;  ← MUỐN xuống bottom nhưng UI không đổi
}
```

## Vấn đề hiện tại

1. **Bossbar vẫn ở TOP** dù CSS có `bottom:0 !important`
   - Có thể `#bossbar-wrap` không thuộc `#screen-arena` nên `position:absolute` không hiệu quả?
   - Hoặc có CSS khác override mạnh hơn?

2. **Chia 50/50 Cards/Arena** đã có CSS nhưng chưa thấy UI đổi

## HTML structure (cần kiểm tra)

Để tôi check cấu trúc HTML thực tế xem `#bossbar-wrap` nằm ở đâu:
