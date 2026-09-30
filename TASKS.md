# ✅ DANH SÁCH TASK — Chế độ Timer & gọn hóa game

Trạng thái: `[ ]` chưa làm · `[~]` đang làm · `[x]` xong · `[!]` bị chặn
Mỗi task làm 1 mình, xong mới sang task sau. Chi tiết kế hoạch: `PLAN.md`

---

## T1 — Gỡ bỏ Team mode (nhẹ code)
- [ ] **Mục tiêu:** Xóa sạch chế độ Team để code gọn, nhưng Giữ nguyên Solo + PvP + mọi phần nhập liệu (Cards/Skills/Controls/Students).
- [ ] **Việc cụ thể:**
  - `index.html`: xóa thẻ `#mode-card-team`, `#btn-team`, `#team-layout`, `#duckrace-screen` (và các nút duckrace).
  - `game.js`: xóa `startGame('team')`, `handleTeamAnswer` (nếu có), các nhánh `mode === 'team'`, logic duckrace.
  - `config.js`: xóa `teamTurnMode`, `teamKeys` (giữ `pvpKeys`).
  - `index.html` (Settings): xóa mục "👥 Team Mode" (tab-game) và phần PvP Avatars? → **GIỮ** PvP avatars (thuộc PvP). Chỉ xóa Team turn mode.
  - `style.css`: xóa class liên quan team/duckrace (tìm `#team-layout`, `.duckrace`, `#team-*`).
- [ ] **KHÔNG được làm:** xóa tab Students, tab Cards, tab Skills, tab Controls, logic Solo/PvP.
- [ ] **Kiểm tra:** mở game → chỉ còn 2 card (Solo, PvP) → Solo & PvP vẫn chơi bình thường.

---

## T2 — Thêm card chế độ Timer + nối nút
- [ ] **Mục tiêu:** Màn hình chọn chế độ có thêm card thứ 3 "Timer".
- [ ] **Việc cụ thể:**
  - `index.html`: thêm `#mode-card-timer` (icon, tên, mô tả, nút `#btn-timer`).
  - `game.js`: `document.getElementById('btn-timer')` → `this.startGame('timer')`.
  - `config.js`: `gameMode: 'solo'` giữ; thêm ghi chú 'timer' được phép.
- [ ] **KHÔNG được làm:** sửa logic Solo/PvP.
- [ ] **Kiểm tra:** bấm card Timer → vào được màn hình game (dù lúc này layout chưa hoàn chỉnh).

---

## T3 — Layout chế độ Timer (arena full-screen + đồng hồ)
- [ ] **Mục tiêu:** Tạo `#timer-layout` chiếm toàn màn hình, có Boss trái, Hero phải, đồng hồ countdown + thanh timer.
- [ ] **Việc cụ thể:**
  - Thêm `#timer-layout` (hidden mặc định) vào `index.html` trong `#game-container`.
  - Bên trong: arena (boss-avatar-media trái, hero-avatar-media phải), `#timer-clock` (số lớn), `#timer-bar` (thanh %).
  - CSS: arena full-screen, boss trái, hero phải, đồng hồ ở góc trên giữa.
  - `game.js startGame('timer')`: hiện `#timer-layout`, ẩn solo/pvp/team, bắt đầu đếm ngược.
- [ ] **KHÔNG được làm:** xóa solo-layout/pvp-layout.
- [ ] **Kiểm tra:** vào Timer → thấy sàn đấu rộng, đồng hồ chạy đếm ngược, thanh timer giảm dần.

---

## T4 — Hero kiểu Boss (link avatar, cố định phải)
- [ ] **Mục tiêu:** Hero trong Timer dùng link ảnh (như Boss), đứng yên bên phải, KHÔNG vòng tròn.
- [ ] **Việc cụ thể:**
  - Copy cơ chế `boss-avatar-media` (hiển thị ảnh từ URL) sang Hero của Timer.
  - Thêm trường Cài đặt **"Timer Hero Link"** (tab Game hoặc tab mới) → lưu vào config `timerHeroUrl`.
  - `game.js`: khi vào Timer, set src Hero = `config.timerHeroUrl` (fallback ảnh mặc định nếu trống).
  - Hero position cố định bên phải (không di chuyển theo boss).
- [ ] **Giả định A1:** giữ tab Students cho Solo; Timer Hero dùng link riêng.
- [ ] **Kiểm tra:** nhập link ảnh → Hero Timer hiện đúng ảnh, đứng yên bên phải.

---

## T5 — Lật & đảo chiều Boss (trái → phải)
- [ ] **Mục tiêu:** Boss đứng bên TRÁI, đi từ trái sang phải về phía Hero (ngược với Solo).
- [ ] **Việc cụ thể:**
  - `config.js`: mặc định `bossFlip: true` cho Timer (lật ngang ảnh Boss).
  - `game.js`: Timer dùng hướng di chuyển ngược — Boss bắt đầu ở vị trí trái (`position = maxPosition`) và giảm dần về 0 (chạm Hero) HOẶC đảo trục tọa độ. (Sẽ chọn cách ít sửa nhất khi làm.)
  - CSS: boss-avatar-box Timer nằm bên trái, hero bên phải.
- [ ] **Kiểm tra:** Boss xuất hiện bên trái và đi sang phải; chạm Hero = thua.

---

## T6 — Tick/Cross cho Timer (+ mana)
- [ ] **Mục tiêu:** Quản trò bấm ✓/✗ để cộng mana (giới hạn 10, giữ cơ chế cũ).
- [ ] **Việc cụ thể:**
  - Trong Timer, luôn hiện `#tick-cross-overlay` (đã có sẵn trong HTML).
  - `#btn-tick` → `handleManualTick(true)`: +1 mana (cap 10), cộng chuỗi đúng.
  - `#btn-cross` → `handleManualTick(false)`: không cộng, reset chuỗi.
  - Phím tắt: dùng lại `teamCorrect`/`teamWrong` (ArrowRight/ArrowLeft) cho Timer.
- [ ] **Kiểm tra:** bấm ✓ → mana tăng (tối đa 10); bấm ✗ → không tăng, chuỗi reset.

---

## T7 — Kỹ năng Timer: Random + Buffet
- [ ] **Mục tiêu:** Hỗ trợ 2 dạng dùng kỹ năng (chọn trong Cài đặt).
  - **Dạng A (Random):** giữ nguyên tay bài ngẫu nhiên + Combo Pha Lê khi chuỗi 5.
  - **Dạng B (Buffet):** hiện toàn bộ skill ở thanh dưới, click để dùng nếu đủ mana.
- [ ] **Việc cụ thể:**
  - Thêm config `timerSkillMode: 'random' | 'buffet'`.
  - Random: tái dùng `hero-skills-ring` / skillHand của Solo.
  - Buffet: xây `#timer-skill-bar` (thanh dưới) liệt kê skill đang bật + giá mana; click → trừ mana, gọi `executeSkill`.
- [ ] **Kiểm tra:** chuyển Dạng A/B trong Cài đặt → Timer hiển thị đúng 1 kiểu dùng skill.

---

## T8 — Luật thắng/thua + màn hình kết quả
- [ ] **Mục tiêu:** Xác định WIN/LOSE đúng cho Timer.
- [ ] **Việc cụ thể:**
  - WIN: `timeRemaining <= 0` VÀ Boss chưa chạm Hero → hiện "⏱ HẾT GIỜ — CHIẾN THẮNG!".
  - LOSE: Boss chạm Hero trước khi hết giờ → hiện "💀 BOSS ĐÃ TỚI!".
  - `result-overlay`: đổi text phù hợp chế độ Timer (không cần nhập tên điểm số nếu bạn muốn — hỏi sau).
- [ ] **Giả định A4:** áp dụng luật ở mục 6.
- [ ] **Kiểm tra:** để hết giờ → Win; để Boss chạm → Lose.

---

## T9 — Cập nhật Cài đặt (xóa Team, thêm Timer)
- [ ] **Mục tiêu:** Cài đặt phản ánh đúng game mới.
- [ ] **Việc cụ thể:**
  - Xóa "👥 Team Mode" (tab-game) và "Team Mode (Quản Trò)" (tab-controls).
  - Thêm: **Timer Hero Link**, **Timer Skill Mode** (Random/Buffet), **Timer Time** (giây, mặc định 120).
  - `settings.js` save/load: thêm `timerHeroUrl`, `timerSkillMode`, `timerTime`.
  - `game.js` syncSettings/loadConfig: đọc các trường mới.
- [ ] **KHÔNG được làm:** xóa tab Cards/Skills/Controls/Students.
- [ ] **Kiểm tra:** đổi cài đặt Timer → lưu → tắt/mở lại vẫn nhớ.

---

## T11 — Dọn dẹp Settings + sửa 2 lỗi hiển thị Timer (làm sau T1–T9)
- [x] **Thêm nhóm "⚙️ Cài Đặt Timer" vào tab Game:** link Boss, link Hero, thời gian, dạng kỹ năng.
- [x] **Config:** thêm `timerBossUrl`, `timerHeroUrl`, `timerTime`, `timerSkillMode` (config.js + collectSettings + populateSettings).
- [x] **Sửa lỗi Boss lộn góc:** Timer dùng hàm riêng `setTimerBossAvatar()` (không dùng chung `updateBossAvatar` nữa).
- [x] **Sửa lỗi đồng hồ đứng:** bọc UI init trong startGame bằng try/catch (lỗi ảnh/CSP không làm chết startTimer); `#timer-clock` đặt `position:fixed` giữa trên, z-index 9999 không bị che; `.timer-topbar` z-index 20.
- [x] **Dọn debug:** ẩn bảng debug mặc định (chỉ hiện khi lỗi), bỏ log mỗi tick.
- [ ] **Kiểm tra:** Ctrl+Shift+R → Timer: Boss trái hiện đúng link, đồng hồ giữa đếm ngược rõ ràng.

---

## T12 — Thống nhất Hero avatar (link = full như Boss)
- [ ] **Mục tiêu:** Bỏ khung tròn cố định. Hero (Solo + Timer) dùng 1 hàm `setAvatarMedia(el, value)`: link → ảnh full như Boss; số ID → khung tròn `Hero/N.png`.
- [ ] Hợp nhất `updateHeroAvatar` + `setTimerBossAvatar` thành chung.
- [ ] **Kiểm tra:** nhập link → Hero hiện full; nhập số → hiện khung tròn cũ.

---

## T13 → T19 (tiếp nối T4–T10 cũ, gọn hơn)
- T13 — Lật/đảo chiều Boss (trái→phải) [cũ T5]
- T14 — Tick/cross + mana (giới hạn 10) [cũ T6]
- T15 — Kỹ năng Timer: Random + Buffet (thanh dưới) [cũ T7]
- T16 — Luật thắng/thua + màn hình kết quả [cũ T8]
- T17 — Chạy thử Solo/PvP/Timer, sửa lỗi, dọn code [cũ T10]

