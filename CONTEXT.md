# 🧠 PROJECT CONTEXT & TODO: MAGIC REALM BATTLE

Tài liệu này lưu trữ toàn bộ bối cảnh dự án, trạng thái hiện tại và các tính năng dự kiến phát triển. Sử dụng file này để nạp lại "trí nhớ" cho AI (hoặc Antigravity) sau khi cài đặt lại chương trình.

---

## 1. TỔNG QUAN DỰ ÁN (PROJECT OVERVIEW)
- **Tên dự án:** Magic Realm Battle ⚔️
- **Mục tiêu:** Web App Game hóa Giáo dục (Gamification in Education) bằng HTML5, CSS3, Vanilla JS.
- **Lưu trữ:** Sử dụng hoàn toàn `localStorage` ở Client-side (Không cần Backend).
- **Trạng thái hiện tại:** Game đã chạy ổn định. Đã gộp thành công hệ thống `MASTER_SKILLS` cho cả Hero và Boss. Đã sửa lỗi sập game (SyntaxError trùng biến `heroState`). Giao diện đã loại bỏ hardcode và load động từ JS.

---

## 2. KẾ HOẠCH TÁI CẤU TRÚC SẮP TỚI (TODO LIST / NEW PLAN)

Trong giai đoạn tiếp theo, dự án sẽ thay đổi cơ chế cốt lõi của **PvP Mode** và **Team Mode** theo bản thiết kế mới nhất:

- [ ] **Thay đổi PvP Mode (Race to Center):** 
  - Không dùng Boss trong chế độ này. Hai người chơi (P1 và P2) sẽ chạy đua về vị trí chính giữa màn hình.
  - Sử dụng chung bộ Skill (Lửa, Sét, Băng...) để tấn công, làm chậm, đẩy lùi đối thủ.
  - Chế độ câu hỏi: Chỉ hỗ trợ **Quiz** (Trắc nghiệm).
- [ ] **Tuỳ biến Avatar (Custom Avatars):** 
  - Cho phép người chơi chọn Avatar bằng 2 cách: (1) Upload ảnh từ máy tính hoặc (2) Paste link ảnh/GIF trực tiếp từ Google, Tenor, Pinterest.
- [ ] **Team Mode Mới (Random Roster):** 
  - Giáo viên upload ảnh của cả lớp (số lượng tuỳ ý, có thể lẻ). Hệ thống tự xáo trộn (Shuffle) và chia làm 2 đội.
  - Gameplay giống PvP (Đua về đích), nhưng game sẽ tự động bốc ngẫu nhiên (Random) 1 bạn Đội A và 1 bạn Đội B lên màn hình để trả lời câu hỏi mỗi lượt.
- [ ] **Nâng cấp Skill VFX (Hiệu ứng siêu chi tiết):**
  - **Ice Freeze:** Khối băng kính mờ (grayscale, blur), tinh thể chông băng mọc lên từ góc Bottom, hiệu ứng vỡ nát.
  - **Fire Blast:** Đạn lửa bọc vòng ma thuật, viền avatar nhấp nháy đỏ lửa, vòng lặp trừ Mana/Combo mỗi giây (`setInterval`).
  - **Thunder Strike:** Chớp sáng màn hình (`flashScreen`), giật điện Avatar (`jitter`), đẩy lùi lập tức 10 bước.
  - **Combo Pha lê:** Hiệu ứng Glassmorphism, Neon glow, xoay 3D quanh avatar.

---

## 3. CẤU TRÚC FILE QUAN TRỌNG (FILE STRUCTURE)
Nếu cần sửa code, AI cần tập trung vào các file sau:
- `index.html`: Cấu trúc DOM chính. Chứa script bắt lỗi toàn cầu `window.onerror`.
- `js/config.js`: Chứa thông số game, danh sách `MASTER_SKILLS`.
- `js/game.js`: File cực kỳ quan trọng, chứa core loop (`Game.init()`, `handlePvPAnswer()`, trạng thái game).
- `js/skills.js`: File xử lý Logic chiêu thức (`executeSkill`), nơi chứa các hiệu ứng phức tạp (Lửa, Băng, Sét).
- `js/ui.js`: Chịu trách nhiệm render thanh máu, trạng thái bất lợi (Paralyzed, Frozen), và vị trí Avatar trên đường chạy.
- `js/cards.js`: Xử lý việc load câu hỏi từ Excel.

---

## 4. HƯỚNG DẪN DÀNH CHO AI TRONG PHIÊN LÀM VIỆC MỚI
**Khi AI đọc file này, hãy lưu ý:**
1. Dự án sử dụng Vanilla JS thuần, tuyệt đối KHÔNG sử dụng React/Vue/jQuery.
2. Các animation được viết bằng `@keyframes` CSS và kích hoạt bằng cách add/remove class trong JS.
3. Nếu người dùng yêu cầu tiếp tục công việc, hãy ưu tiên hoàn thành **TODO LIST** ở Mục 2. Bắt đầu bằng việc sửa lại giao diện Cài đặt (Settings) để hỗ trợ Upload Avatar bằng URL/File và sau đó là cơ chế chạy đua của PvP.

***(Bản sao lưu bối cảnh tạo ngày 22/07/2026)***
