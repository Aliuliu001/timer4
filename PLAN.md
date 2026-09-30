# 📋 KẾ HOẠCH TỔNG v2 — Gọn hóa & chế độ Timer (Magic Realm Battle)

> Phiên bản 2 (cập nhật sau khi làm T1–T3, T9 gặp lỗi hiển thị nhỏ).
> Nguyên tắc mới (theo ý bạn): **không đập đi xây lại toàn bộ** — game Solo/PvP đang chạy tốt, skill system là core cần giữ. Chỉ **dọn cấu trúc + sửa lỗi + thống nhất cách hiển thị Hero**.

---

## 1. Tình hình hiện tại (thực tế sau T1–T9)
- ✅ Đã xóa Team mode, giữ Solo + PvP.
- ✅ Đã thêm card + layout Timer, đồng hồ chạy được (log debug chứng minh logic OK).
- ⚠️ **2 lỗi hiển thị chưa sửa:**
  1. **Boss Timer nằm góc TRÊN TRÁI** (lộn vị trí) — do `updateBossAvatar()` chung set ảnh vào TẤT CẢ `.boss-avatar-media`, kể cả `#timer-boss-box`.
  2. **Đồng hồ giữa (`#timer-clock`) đứng im** dù debug góc trái đếm được — do CSS che khuất hoặc bạn nhìn nhầm ô.
- ⚠️ **Nhập liệu chưa gọn:** link Boss/Hero Timer hiện nhập lộn sang tab Students → dễ nhầm.

---

## 2. Quyết định lớn (cần bạn duyệt)

### 2.1 — Thống nhất Hero avatar (Ý MỚI CỦA BẠN)
**Bỏ khung tròn cố định.** Từ nay:
- Hero (cả Solo lẫn Timer) dùng **1 cơ chế hiển thị duy nhất**:
  - Nếu nhập **link ảnh/gif** (`http/https`) → hiện ảnh **full như Boss** (không khung tròn).
  - Nếu nhập **số / ID học sinh** (như `1`, `2`) → hiện ảnh `Hero/1.png` trong khung tròn (giữ tương thích cũ).
- → Hợp nhất `updateHeroAvatar` và `updateBossAvatar` thành 1 hàm `setAvatarMedia(el, value)` dùng chung.

### 2.2 — Dọn tabs Cài đặt (Ý BẠN: "sắp xếp lại logic nhập liệu")
Giữ nguyên các tab **Cards / Hero Skills / Boss Skills / Controls / Students** (tuyệt đối không xóa).
Chỉ **thêm 1 nhóm "⚙️ Cài đặt Timer" vào tab Game** gồm:
- 🔗 Link ảnh Boss (Timer)
- 🔗 Link ảnh Hero (Timer)
- ⏱️ Thời gian đếm ngược (mặc định 120s)
- 🎛️ Dạng kỹ năng: Random / Buffet
→ Link Boss/Hero Timer **không còn nhập lộn vào Students**.

### 2.3 — Có nên gọt fx.js? (1045 dòng animation)
Skill system (skills.js) là core → **GIỮ**.
fx.js chứa animation (Kamehameha, Fireball, Tornado, Meteor, Dash...):
- Đề xuất: **GIỮ nguyên** (đang chạy, không phải nguyên nhân lỗi). Chỉ xóa nếu bạn thấy game nặng/lag.
- → Không đập đi xây lại, chỉ dọn những chỗ thực sự lỗi.

---

## 3. Thứ tự thực hiện (T11 trở đi)
- **T11 — Dọn dẹp + sửa 2 lỗi hiển thị Timer** (làm ngay, trước T4–T10):
  - Thêm nhóm "Cài đặt Timer" vào tab Game (link Boss/Hero, thời gian, dạng skill).
  - Sửa `updateBossAvatar` không đè vào Timer box (Timer tự set ảnh riêng).
  - Sửa CSS `#timer-clock` / `#timer-boss-box` đúng vị trí (giữa / trái).
  - Đồng bộ `timerHeroUrl`, `timerBossUrl`, `timerTime`, `timerSkillMode` vào config/settings.
- **T12 — Thống nhất Hero avatar** (bỏ khung tròn, link = full như Boss) cho cả Solo + Timer.
- **T13 → T19** — tiếp nối T4–T10 cũ nhưng gọn hơn: lật Boss, tick/cross+mana, skill Random/Buffet, luật thắng/thua, kết quả, chạy thử.

> Làm từng task, xong báo + push, bạn thử rồi mới sang sau.

---

## 4. NGUYÊN TẮC BẮT BUỘC (giữ nguyên)
- ❌ KHÔNG xóa: tab Cards, Hero Skills, Boss Skills, Controls, Students.
- ❌ KHÔNG phá skill system (core).
- ✅ Chỉ thêm/sửa code Timer + dọn UI Settings + sửa lỗi hiển thị.
- ✅ Mana giữ giới hạn 10.
- ✅ Giữ phím Quản Trò (Đúng/Sai) đã đổi tên.

---

## 5. Thuật ngữ
- **Core:** phần logic chính không được hỏng (skill, input, flashcard/quiz).
- **Avatar:** hình đại diện (Boss / Hero).
- **Tab:** các mục trong Cài đặt (Cards, Game, Skills...).
