# 🧙‍♂️ Magic Realm Battle ⚔️

**Magic Realm Battle** là một ứng dụng web game giáo dục (Educational Gamification Web App) tương tác cao, được thiết kế để giúp học sinh ôn tập kiến thức thông qua cơ chế chơi game hấp dẫn. Trò chơi kết hợp giữa việc trả lời câu hỏi (Flashcard / Trắc nghiệm) và chiến đấu bằng phép thuật với hiệu ứng hình ảnh (VFX) và âm thanh (SFX) vô cùng bắt mắt.

---

## 🎮 Các Chế Độ Chơi (Game Modes)

1. **Solo Mode (1 Học sinh vs Boss):** 
   - Một người chơi đối đầu với Quái vật khổng lồ. 
   - Boss sẽ liên tục tiến về phía người chơi. Nếu Boss chạm đích (hoặc máu người chơi cạn), trò chơi kết thúc. 
   - Người chơi cần trả lời đúng để tích lũy Mana và tung chiêu đẩy lùi Boss.
2. **PvP Mode (Đối Kháng 1v1):** 
   - Hai người chơi thi đấu trực tiếp trên cùng một bàn phím (chia đôi màn hình). 
   - Mục tiêu là người chạy tới đích ở giữa màn hình trước sẽ chiến thắng. 
   - Có thể dùng kỹ năng để cản trở, đóng băng, ru ngủ, hoặc đẩy lùi đối thủ.
3. **Team Mode (Đua Đối Kháng 2 Đội):** 
   - Cả lớp cùng tham gia. Game sẽ ngẫu nhiên chọn (shuffle) đại diện của 2 Đội (Team A vs Team B) xuất hiện trên màn hình để thi đấu trả lời câu hỏi.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

Dự án được xây dựng hoàn toàn bằng các công nghệ Front-End thuần, tập trung vào hiệu năng và độ mượt của Animation:
- **HTML5:** Cấu trúc giao diện, thẻ Div và layout theo dạng module ẩn/hiện (`.hidden`).
- **CSS3 (Vanilla):** 
  - Giao diện Dark Mode hiện đại.
  - Hiệu ứng kính mờ (Glassmorphism).
  - Hoạt ảnh phức tạp (`@keyframes`, `transform`, `filter`, `box-shadow` neon glow).
- **JavaScript (ES6+):** Xử lý logic game, vòng lặp thời gian (`setInterval`, `setTimeout`), thao tác DOM trực tiếp (Vanilla DOM Manipulation) không phụ thuộc framework.
- **LocalStorage:** Lưu trữ toàn bộ câu hỏi (Database) và cấu hình của giáo viên ngay trên trình duyệt mà không cần máy chủ (No Backend required).

---

## 📁 Cấu Trúc Thư Mục (Project Structure)

Dự án được thiết kế theo kiến trúc Module để dễ dàng bảo trì và mở rộng:

```text
magic-battle/
│
├── index.html          # Giao diện chính của Game, chứa toàn bộ UI Layout
├── README.md           # Tài liệu hướng dẫn dự án (Bạn đang xem file này)
├── START.bat           # File kịch bản khởi động nhanh game trên Windows
│
├── css/
│   └── style.css       # Toàn bộ CSS (Variables, Grid layout, Keyframes animation)
│
└── js/                 # Thư mục mã nguồn Logic
    ├── config.js       # File cấu hình gốc, chứa thông tin hệ thống kỹ năng (MASTER_SKILLS)
    ├── settings.js     # Chức năng Load/Save cấu hình từ LocalStorage
    ├── cards.js        # Logic xử lý ngân hàng câu hỏi (Parse Excel, Flashcards, Quiz)
    ├── ui.js           # Xử lý toàn bộ các tương tác DOM, cập nhật thanh máu, render nút bấm
    ├── fx.js           # Xử lý hiệu ứng đồ họa VFX (Tạo vật thể bay, Text nổi, Màn hình chớp)
    ├── sfx.js          # Hệ thống âm thanh (Audio Web API) cho các chiêu thức
    ├── speech.js       # Tính năng nhận diện/phát âm giọng nói (Speech Recognition)
    ├── skills.js       # Hệ thống xử lý Kỹ năng phức tạp (Hero/Boss, Đóng băng, Lửa, Sét)
    └── game.js         # Core Game Loop, quản lý Trạng thái (State) và logic sự kiện cốt lõi
```

---

## 🌟 Điểm Nhấn Kỹ Thuật (Key Features & Mechanics)

- **Hệ thống Kỹ năng Đa dạng (Rich Skill System):** 
  - Code tách biệt các hành vi cho từng loại skill bằng `switch...case` ở file `skills.js`.
  - Hỗ trợ Combo Pha lê xoay quanh nhân vật.
  - *Fireball* (Thiêu đốt mana), *Ice Freeze* (Đóng băng vô hiệu hóa tương tác), *Thunder Strike* (Giật sét màn hình), *Magic Shield* (Phản đòn)...
- **Quản lý Vòng Lặp (Game Loop Management):** Quản lý nghiêm ngặt các `Intervals` để xử lý việc Boss di chuyển, trừ Mana khi bị thiêu đốt, và tự động clear bộ nhớ khi Stop Game.
- **Tuỳ biến Linh hoạt (Dynamic Config):** 
  - Load ảnh Avatar và Boss bằng URL trực tiếp từ Internet (Tenor, Pinterest) hoặc Local.
  - Tích hợp tính năng *Copy-Paste Excel* thần thánh để giáo viên nạp ngân hàng câu hỏi chỉ bằng 1 thao tác (Xử lý chuỗi Tab/Newline trong `cards.js`).

---

## 🚀 Hướng Dẫn Sử Dụng (How to run)

Vì dự án chạy hoàn toàn trên Client-side, bạn không cần cài đặt Node.js hay máy chủ Web:
1. Đảm bảo bạn tải đủ thư mục dự án về máy.
2. Click đúp chuột vào file `START.bat` hoặc mở trực tiếp file `index.html` bằng trình duyệt web (Khuyên dùng **Google Chrome** hoặc **Microsoft Edge** để có hiệu năng tốt nhất).
3. Vào phần **Cài đặt (Bánh răng)** ở góc trên để cấu hình dán câu hỏi và chọn Avatar trước khi bấm bắt đầu.

---
*Developed with ❤️ and Magic!*
