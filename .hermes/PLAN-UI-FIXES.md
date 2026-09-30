# KẾ HOẠCH SỬA UI & CÂN BẰNG GAME

**Ngày:** 2026-09-19  
**Yêu cầu:** 3 vấn đề cần fix

---

## 1. TABS (Timer / Champion) - Layout trái phải, chữ lớn, màu đẹp

**Hiện tại:**
- 2 nút nhỏ ngang nhau
- Chữ nhỏ, khó nhìn

**Cần làm:**
- ✅ Chia layout: Timer bên TRÁI, Champion bên PHẢI
- ✅ Tăng font size: 20px → 24px
- ✅ Tăng padding: to hơn, dễ bấm
- ✅ Màu gradient đẹp:
  - Timer: xanh dương gradient (#3b82f6 → #2563eb)
  - Champion: tím gradient (#a855f7 → #7c3aed)
- ✅ Active state: border + glow rõ ràng

**File sửa:** `index.html` (CSS inline cho #tabs)

---

## 2. CLOCK DISPLAY - Đồng bộ setting

**Vấn đề:**
- User nhập 5 phút trong setting
- Clock display không sync với số này

**Cần làm:**
- ✅ Đọc giá trị `bossTime` từ config
- ✅ Hiển thị đúng phút:giây ban đầu
- ✅ Countdown đúng từ số đó về 0
- ✅ Game kết thúc KHI ĐỒ HỒ về 0:00

**File sửa:** `js/game.js` (hàm `startTimers`, `startTimer`)

---

## 3. BOSSBAR WRAP - Thuật toán cân bằng

**Vấn đề hiện tại:**
- User set 5 phút (300s)
- Nhưng Boss chạm Player sau 1 phút → LOSE sớm

**Nguyên nhân:**
1. **Base speed đúng** nhưng các multiplier cộng dồn quá mạnh:
   - Enrage speed: +5% mỗi lần hit
   - Evolution: +15% mỗi level (3 levels)
   - Sudden Death: x1.5 - x2.0 speed
   
2. **Thời gian Sudden Death kick in sớm:**
   - Easy: 15% cuối = 45s cuối (với 300s)
   - Normal: 20% cuối = 60s cuối
   - Hard: 25% cuối = 75s cuối

**Giải pháp:**

### A. Timer Mode (Đếm ngược)
- Boss chạy từ TRÁI → PHẢI (hiện đúng)
- Win condition: Clock về 0:00 TRƯỚC KHI Boss chạm Player
- Boss speed = tự động scale theo `bossTime`

**Thuật toán:**
```
maxPosition = 100% màn hình (120 units cố định)
baseSpeed = maxPosition / bossTime

Ví dụ: 300s → baseSpeed = 120/300 = 0.4 units/s
```

**Cân bằng:**
- **Enrage % giảm theo game dài:** 5% → 2% (game 5 phút)
- **Evolution % giảm:** 15% → 8%
- **Sudden Death chỉ kick cuối cùng:** 10% cuối (30s cho game 5 phút)
- **Cap speed multiplier:** Max 1.5x (thay vì 2.5x)

### B. Champion Mode (Flashcard)
- Boss chạy GIỐNG Timer mode
- Deck khác: cards ở trên, arena ở dưới
- Win: Trả lời hết cards + clock chưa hết

**Cân bằng giống Timer**

---

## THỰC THI

1. Fix TABS CSS
2. Fix Clock sync
3. Fix Boss balance algorithm
4. Test với 5 phút + difficulty Normal
5. Push lên GitHub

---

## KẾT QUẢ MONG ĐỢI

✅ Tabs đẹp, dễ nhìn, dễ bấm  
✅ Clock hiển thị đúng thời gian setting  
✅ Game 5 phút = Boss mất ~4:30 phút mới chạm Player (không có player hit)  
✅ Player có cơ hội thắng nếu chơi tốt
