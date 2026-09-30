# 🎮 MAGIC REALM BATTLE v2 — Thiết kế Tổng thể

> **Mục tiêu:** Tạo game mới tinh gọn, dựa trên game gốc (Aliuliu001/timer2), giữ lại các phần cốt lõi, bỏ bớt phần thừa để code nhẹ hơn.

---

## 📋 MỤC LỤC
1. [Tổng quan & Nguyên tắc](#1-tổng-quan--nguyên-tắc)
2. [Cấu trúc Game Modes](#2-cấu-trúc-game-modes)
3. [Input & Dữ liệu (Cards)](#3-input--dữ-liệu-cards)
4. [Bảng Cards (Flashcard & Quiz)](#4-bảng-cards)
5. [Boss & Diablo System](#5-boss--diablo-system)
6. [Player & Hero System](#6-player--hero-system)
7. [Countdown & Progress Bar](#7-countdown--progress-bar)
8. [Flashcard & Quiz Logic](#8-flashcard--quiz-logic)
9. [Skill System (Combo & Shopping)](#9-skill-system)
10. [Difficulty Modes (Easy/Normal/Hard)](#10-difficulty-modes)
11. [Cấu trúc File & Code](#11-cấu-trúc-file--code)
12. [Luật Chơi Tổng](#12-luật-chơi-tổng)

---

## 1. Tổng quan & Nguyên tắc

### 1.1 Game Modes (giữ nguyên từ gốc)
- **Solo Mode:** 1 người chơi vs Boss
- **PvP Mode:** 2 người chơi (1vs1, không có Boss)
- **Timer Mode (Mới):** 1 người chơi vs Boss, có đồng hồ đếm ngược + thanh timer

> **Quy tắc vàng:** KHÔNG xóa Solo/PvP, KHÔNG phá skill system. Chỉ thêm Timer + tinh gọn code.

### 1.2 Nguyên tắc Code
- **Vanilla JS thuần** — KHÔNG React/Vue/jQuery
- **localStorage** — KHÔNG cần backend
- **CSS Animation** — @keyframes + add/remove class
- **File structure:** index.html + js/*.js + css/style.css

### 1.3 Giữ nguyên từ game gốc
- ✅ Tabs Settings: Cards, Hero Skills, Boss Skills, Controls, Students
- ✅ Skill system (MASTER_SKILLS)
- ✅ Boss movement logic + auto-balance
- ✅ Flashcard/Quiz card system
- ✅ Mana system (giới hạn 10)
- ✅ Combo system (chuỗi đúng)

### 1.4 Bỏ/Simplify từ game gốc
- ❌ Bỏ Team mode (đã xóa từ trước)
- ❌ Bỏ鸭子赛跑 (duckrace)
- ❌ Bỏ debug logs thừa
- ❌ Bỏ các skill quá phức tạp (nếu muốn giữ thì简化)

---

## 2. Cấu trúc Game Modes

```
┌─────────────────────────────────────────────────────────┐
│                    MAIN MENU                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  🎮 SOLO │  │  ⚔️ PVP  │  │ ⏱ TIMER │              │
│  └──────────┘  └──────────┘  └──────────┘              │
└─────────────────────────────────────────────────────────┘
         │              │              │
         ▼              ▼              ▼
   ┌──────────┐  ┌──────────┐  ┌──────────────────┐
   │ Solo     │  │ PvP      │  │ Timer Mode       │
   │ Layout   │  │ Layout   │  │ Layout           │
   └──────────┘  └──────────┘  └──────────────────┘
```

### 2.1 Solo Mode (giữ nguyên)
- Player vs Boss
- Flashcard hoặc Quiz
- Boss di chuyển từ phải sang trái
- Player dùng skills để đẩy lùi Boss

### 2.2 PvP Mode (giữ nguyên)
- 2 players đua về trung tâm
- Mỗi player có Boss riêng
- Skills để tấn công/làm chậm đối thủ
- Chỉ hỗ trợ Quiz

### 2.3 Timer Mode (Mới)
- Player vs Boss
- **Đồng hồ đếm ngược** ở giữa màn hình
- **Thanh Progress Bar** giảm dần (hiệu ứng Boss tiếp cận)
- Boss đứng bên TRÁI, đi từ trái sang phải
- Player đứng bên PHẢI
- Link ảnh Boss/Player nhập từ Settings

---

## 3. Input & Dữ liệu (Cards)

### 3.1 Cách nhập dữ liệu
```
┌─────────────────────────────────────────────────────┐
│  📥 IMPORT CARDS                                     │
│  ┌─────────────────────────────────────────────────┐ │
│  │ [Excel File] ← Chọn file Excel                  │ │
│  │ Hoặc                                              │ │
│  │ [Nhập tay] ← Dán dữ liệu vào textarea          │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  📋 DỮ LIỆU MẪU (Excel):                           │
│  | ID    | Text (Question) | Answer | Thumbnail URL  │
│  |-------|-----------------|--------|-----------------│
│  | 1.png | What is this?   | Cat    | https://...    │
│  | 2.png | What is this?   | Dog    | https://...    │
└─────────────────────────────────────────────────────┘
```

### 3.2 Cấu trúc Card
```javascript
{
  id: "1.png",           // ID hoặc filename ảnh
  text: "What is this?",  // Câu hỏi/chữ
  answer: "Cat",          // Đáp án (cho Quiz)
  thumbnail: "https://...", // URL ảnh thumbnail
  priority: false         // Đánh dấu ưu tiên (xuất hiện nhiều hơn)
}
```

### 3.3 Tính năng nhập liệu
- **Upload Excel:** Dùng SheetJS đọc file Excel
- **Nhập tay:** Dán vào textarea, tách bằng tab/newline
- **Preview:** Hiển thị thumbnail khi nhập URL
- **Auto-fill ID:** Tự động đánh số ID (1, 2, 3...)
- **Clear:** Xóa toàn bộ dữ liệu
- **Save to localStorage:** Lưu tự động

---

## 4. Bảng Cards

### 4.1 Flashcard Mode
```
┌─────────────────────────────────────────────────────┐
│  🃏 FLASHCARD BOARD                                  │
│                                                       │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐              │
│  │ Card 1  │  │ Card 2  │  │ Card 3  │  ← Số card  │
│  │ [Image] │  │ [Image] │  │ [Image] │    theo      │
│  │         │  │         │  │         │    setting    │
│  │ "Hello" │  │ "World" │  │ "!"     │              │
│  └─────────┘  └─────────┘  └─────────┘              │
│                                                       │
│  ⏱ Time per card: 10s  |  📊 Cards shown: 3/50     │
└─────────────────────────────────────────────────────┘
```

### 4.2 Quiz Mode
```
┌─────────────────────────────────────────────────────┐
│  ❓ QUIZ BOARD                                       │
│                                                       │
│  ┌─────────────────────────────────────────────┐     │
│  │  [Ảnh câu hỏi]                             │     │
│  │  "What animal is this?"                     │     │
│  └─────────────────────────────────────────────┘     │
│                                                       │
│  ┌──────────┐  ┌──────────┐                         │
│  │ A) Cat   │  │ B) Dog   │                         │
│  └──────────┘  └──────────┘                         │
│  ┌──────────┐  ┌──────────┐                         │
│  │ C) Bird  │  │ D) Fish  │                         │
│  └──────────┘  └──────────┘                         │
│                                                       │
│  ⏱ Time per question: 15s  |  📊 Question: 1/50    │
└─────────────────────────────────────────────────────┘
```

### 4.3 Cài đặt hiển thị
- **Số card trên bảng:** 3 (mặc định), có thể đổi trong Settings
- **Thời gian mỗi card:** 10s (Flashcard) / 15s (Quiz)
- **Hiển thị:** Ảnh + Chữ / Chỉ ảnh / Chỉ chữ (chọn trong Settings)

---

## 5. Boss & Diablo System

### 5.1 Boss Avatar
```
┌─────────────────────────────────────────────────────┐
│  👹 BOSS AVATAR                                      │
│                                                       │
│  📷 Link ảnh: [https://i.imgur.com/boss.gif]        │
│                                                       │
│  Hoặc:                                                │
│  📁 Upload từ máy: [Chọn file]                       │
│                                                       │
│  ✅ Hỗ trợ: JPG, PNG, GIF, WEBP                     │
│  ✅ GIF sẽ chạy animation tự động                   │
└─────────────────────────────────────────────────────┘
```

### 5.2 Boss Evolution (Tiến hóa)
Boss có 4 giai đoạn tiến hóa dựa trên % máu:

```
Trạng thái       │ HP còn lại │ Hiển thị
─────────────────┼────────────┼──────────────────
Normal           │ 100-76%    │ Ảnh gốc
1st Evolution    │ 75-51%     │ Ảnh evolution 1
2nd Evolution    │ 50-26%     │ Ảnh evolution 2
3rd Evolution    │ 25-0%      │ Ảnh evolution 3 (Boss mạnh nhất)
```

### 5.3 Boss Movement Logic
```javascript
// Boss di chuyển từ phải sang trái (Timer Mode)
// Position: 0 = ở Hero, maxPosition = ở xa nhất

Boss.position -= speedMultiplier * deltaTime;

// Khi Boss chạm Player (position <= 0) → Game Over
// Khi hết thời gian mà Boss chưa chạm → Player Win
```

### 5.4 Boss Rage System
- **Rage Bar:** Thanh hiển thị Boss sắp tung skill
- **Khi đầy:** Boss tự động dùng skill (tấn công Player)
- **Rage Time:** 15s (Normal), 25s (Easy), 10s (Hard)

### 5.5 Boss Skills (giữ từ gốc)
- **Dark Curse:** Player không thể dùng skill
- **Shadow Clone:*** Boss tạo bản sao
- **Dash Forward:** Boss lao nhanh về phía Player

---

## 6. Player & Hero System

### 6.1 Player Avatar
```
┌─────────────────────────────────────────────────────┐
│  🦸 PLAYER AVATAR                                    │
│                                                       │
│  📷 Link ảnh: [https://i.imgur.com/player.gif]      │
│                                                       │
│  Hoặc:                                                │
│  📁 Upload từ máy: [Chọn file]                       │
│                                                       │
│  ✅ Hỗ trợ: JPG, PNG, GIF, WEBP                     │
│  ✅ GIF sẽ chạy animation tự động                   │
└─────────────────────────────────────────────────────┘
```

### 6.2 Player Stats
```javascript
{
  mana: 0,           // Điểm mana (0-10)
  combo: 0,          // Chuỗi câu đúng liên tiếp
  maxCombo: 0,       // Chuỗi đúng cao nhất
  skillHand: [],     // Skills đang cầm
  stats: {
    correct: 0,      // Số câu đúng
    wrong: 0,        // Số câu sai
    score: 0         // Điểm tổng
  }
}
```

### 6.3 Player Status Effects
- **Frozen:** Không thể di chuyển/attack
- **Paralyzed:** Không thể dùng skill
- **Burning:** Mất HP mỗi giây
- **Shielded:** Miễn damage

---

## 7. Countdown & Progress Bar

### 7.1 Đồng hồ đếm ngược (Countdown Clock)
```
┌─────────────────────────────────────────────────────┐
│                  ⏱ 02:00                             │
│              (phút:giây)                             │
│                                                       │
│  ────────────────────────────────────────────────────│
│  ████████████████░░░░░░░░░░░░░░░░░░░░░░  45%        │
│  (Thanh timer - Boss tiếp cận)                       │
└─────────────────────────────────────────────────────┘
```

### 7.2 Logic Countdown
```javascript
// Bắt đầu đếm ngược từ timerTime (mặc định 120s)
timeRemaining = timerTime; // 120

// Mỗi giây giảm 1
timeRemaining -= 1;

// Hiển thị: mm:ss
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
```

### 7.3 Thanh Progress Bar (Boss tiếp cận)
```
Boss position: 120 → 0 (từ xa đến gần Player)

Progress = (Boss.position / maxPosition) * 100%

Hiển thị:
- 100%: ░░░░░░░░░░ (Boss ở xa)
- 50%:  ████████░░ (Boss ở giữa)
- 0%:   ██████████ (Boss chạm Player → Game Over)
```

### 7.4 Hiệu ứng khi Boss tiếp cận
- **> 50%:** Màu xanh lá (an toàn)
- **25-50%:** Màu vàng (cảnh báo)
- **< 25%:** Màu đỏ + nhấp nháy (nguy hiểm)

---

## 8. Flashcard & Quiz Logic

### 8.1 Flashcard Mode
```
Luật chơi:
1. Hiện N card trên bảng (N theo setting, mặc định 3)
2. Mỗi card có thời gian T giây (T theo setting, mặc định 10s)
3. Quản trò bấm ✓ (đúng) hoặc ✗ (sai):
   - ✓: +1 mana, card biến mất, hiện card mới
   - ✗: Card biến mất, KHÔNG cộng mana
4. Khi hết thời gian mà không bấm → card tự biến mất
5. Cycle: Khi hết card → xáo lại và bắt đầu lại
```

### 8.2 Quiz Mode
```
Luật chơi:
1. Hiện 1 câu hỏi với 4 đáp án A/B/C/D
2. Thời gian T giây cho mỗi câu (T theo setting, mặc định 15s)
3. Quản trò bấm đáp án đúng:
   - Đúng: +1 mana, hiện câu mới
   - Sai: Hiện đáp án đúng, câu mới
4. Khi hết thời gian → hiện đáp án đúng, câu mới
5. Cycle: Khi hết câu → xáo lại và bắt đầu lại
```

### 8.3 Random Algorithm (Quan trọng!)
```javascript
// Thuật toán rút ngẫu nhiên X% dữ liệu
function getRandomSubset(cards, percentage) {
  const count = Math.floor(cards.length * (percentage / 100));
  const shuffled = [...cards].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Ví dụ: cards có 50 câu, percentage = 20%
// → Random 10 câu hiển thị trong lượt chơi
```

### 8.4 Shuffle Algorithm
```javascript
// Fisher-Yates Shuffle
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Shuffle cho Quiz: xáo thứ tự đáp án
quizChoices = shuffle([correct, wrong1, wrong2, wrong3]);
```

---

## 9. Skill System (Combo & Shopping)

### 9.1 Combo System (Mới!)
```
┌─────────────────────────────────────────────────────┐
│  🔥 COMBO SYSTEM                                     │
│                                                       │
│  Câu đúng liên tiếp: 1 → 2 → 3 → 4 → 5            │
│                                         │            │
│                              ┌──────────▼──────────┐ │
│                              │ ⚡ COMBO SKILL!      │ │
│                              │ Cast skill ngẫu nhiên│ │
│                              └─────────────────────┘ │
│                                                       │
│  Sau khi cast → reset combo về 0                     │
└─────────────────────────────────────────────────────┘
```

**Luật:**
- Mỗi câu đúng: +1 combo
- Đúng 5 câu liên tiếp: Tự động cast Combo Skill (random 1 skill)
- Sai: Reset combo về 0
- Combo skill là bonus, KHÔNG tốn mana

### 9.2 Mana System
```
┌─────────────────────────────────────────────────────┐
│  💎 MANA SYSTEM                                      │
│                                                       │
│  Câu đúng: +1 mana                                  │
│  Câu sai: KHÔNG trừ mana                           │
│  Mana tối đa: 10                                    │
│                                                       │
│  💰 Shopping: Đủ 5 mana → có thể mua 1 đồ ăn       │
└─────────────────────────────────────────────────────┘
```

### 9.3 Shopping System (Mới!)
```
┌─────────────────────────────────────────────────────┐
│  🛒 SKILL SHOPPING                                   │
│                                                       │
│  Khi đủ 5 mana, hiện menu:                          │
│                                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ 🌶️ Ớt    │ │ 🍦 Kem   │ │ 🍄 Nấm   │            │
│  │ -400k    │ │ -400k    │ │ -400k    │            │
│  │ Đốt      │ │ Đóng băng│ │ Trúng độc│            │
│  └──────────┘ └──────────┘ └──────────┘            │
│  ┌──────────┐ ┌──────────┐                         │
│  │ 🍩 Donut │ │ 🍔 Burger│                         │
│  │ -400k    │ │ -400k    │                         │
│  │ Ăn tại chỗ│ │ Ăn tại chỗ│                        │
│  └──────────┘ └──────────┘                         │
│                                                       │
│  Chọn 1 item → Trừ 5 mana → Apply effect lên Boss  │
└─────────────────────────────────────────────────────┘
```

### 9.4 Skill Effects (Các đồ ăn)
```javascript
const FOOD_SKILLS = {
  chili: {
    icon: '🌶️',
    name: 'Ớt',
    effect: 'burning',      // Boss bị cháy
    duration: 5,            // 5 giây
    damage: 2,              // 2 damage/giây
    gifUrl: ''              // GIF hiệu ứng (optional)
  },
  ice_cream: {
    icon: '🍦',
    name: 'Kem',
    effect: 'frozen',       // Boss bị đóng băng
    duration: 4,            // 4 giây
    damage: 0,
    gifUrl: ''
  },
  mushroom: {
    icon: '🍄',
    name: 'Nấm',
    effect: 'poisoned',     // Boss bị trúng độc
    duration: 6,            // 6 giây
    damage: 1,              // 1 damage/giây
    slowPercent: 30,        // Chậm 30%
    gifUrl: ''
  },
  donut: {
    icon: '🍩',
    name: 'Donut',
    effect: 'eating',       // Boss ngồi ăn
    duration: 5,            // 5 giây
    damage: 0,
    gifUrl: 'https://...'   // GIF Boss đang ăn
  },
  hamburger: {
    icon: '🍔',
    name: 'Hamburger',
    effect: 'eating',       // Boss ngồi ăn
    duration: 5,            // 5 giây
    damage: 0,
    gifUrl: 'https://...'   // GIF Boss đang ăn
  }
};
```

### 9.5 Boss "Eating" Animation
```
Khi Boss trúng Donut/Burger:

1. Ẩn ảnh Boss gốc
2. Hiện GIF "Boss đang ăn" tại vị trí Boss
3. Đợi duration giây (5s)
4. Ẩn GIF, hiện lại ảnh Boss gốc
5. Boss tiếp tục di chuyển

┌─────────────────────────────────────────────────────┐
│  🎬 EATING ANIMATION                                 │
│                                                       │
│  Trước:  [Boss Image]  ←──  [Player]                │
│                                                       │
│  Sau:    [GIF: Boss ăn]  ←──  [Player]              │
│          (5 giây)                                    │
│                                                       │
│  Sau cùng: [Boss Image]  ←──  [Player]               │
│           (tiếp tục di chuyển)                        │
└─────────────────────────────────────────────────────┘
```

---

## 10. Difficulty Modes (Easy/Normal/Hard)

### 10.1 Bảng Difficulty
```
┌────────────┬────────────┬────────────┬────────────┐
│   Setting  │    Easy    │   Normal   │    Hard    │
├────────────┼────────────┼────────────┼────────────┤
│ Boss Speed │    0.7x    │    1.0x    │    1.3x    │
│ Enrage %   │     2%     │     5%     │     8%     │
│ Evolve %   │     5%     │    15%     │    25%     │
│ Rage Time  │    25s     │    15s     │    10s     │
│ SD Time    │ 15% cuối   │ 20% cuối   │ 25% cuối   │
│ SD Mult    │   120%     │   150%     │   180%     │
│ Clear Mana │     ❌     │     ✅     │     ✅     │
│ Cap        │   1.3x     │   1.5x     │   2.0x     │
└────────────┴────────────┴────────────┴────────────┘
```

### 10.2 Auto-Balance Logic (giữ từ gốc)
```javascript
// Tự động điều chỉnh thông số theo thời gian game
// Game ngắn (30s) → Boss nhanh hơn, ít lần enrage
// Game dài (300s) → Boss chậm hơn, nhiều lần enrage

function calculateBalance(bossTime, difficulty) {
  const timeScale = Math.log2(bossTime / 30 + 1) / Math.log2(120 / 30 + 1);
  
  return {
    bossBaseSpeed: (120 / bossTime) * cfg.speedMult,
    bossEnrageSpeedPercent: cfg.enrage / timeScale,
    bossEvolveSpeedPercent: cfg.evolve / timeScale,
    suddenDeathTime: bossTime * cfg.sdTimePct,
    bossRageTime: cfg.rageTime * timeScale,
    enrageSpeedCap: cfg.cap * timeScale
  };
}
```

### 10.3 Boss Progression Logic
```
Boss di chuyển: position -= speed * deltaTime

Khi position <= 0: Game Over (Boss chạm Player)

Các mốc tiến hóa:
- 100% HP: Normal
- 75% HP: 1st Evolution (mạnh hơn)
- 50% HP: 2nd Evolution (mạnh hơn nữa)
- 25% HP: 3rd Evolution (Boss mạnh nhất)

Mỗi lần evolution:
- Boss speed tăng X% (theo difficulty)
- Đổi ảnh Boss sang evolution mới
- Nếu ClearMana = true → Reset mana Player về 0
```

---

## 11. Cấu trúc File & Code

### 11.1 File Structure
```
timer2/
├── index.html              # Cấu trúc DOM chính
├── css/
│   └── style.css           # Styles (giữ nguyên cơ bản)
├── js/
│   ├── config.js           # Constants, MASTER_SKILLS
│   ├── game.js             # Core game loop (simplify!)
│   ├── cards.js            # Card management
│   ├── skills.js           # Skill execution logic
│   ├── ui.js               # UI rendering
│   ├── fx.js               # VFX animations (giữ, chỉ sửa lỗi)
│   ├── settings.js         # Settings save/load
│   ├── sfx.js              # Sound effects
│   └── speech.js           # Text-to-speech
├── PLAN.md
├── TASKS.md
└── CONTEXT.md              # ← TÀI LIỆU NÀY
```

### 11.2 Code Simplification Plan

#### game.js (GIẢM TỪ 2165 DÒNG → ~1000 DÒNG)
```
Cần giữ:
- Game.init()
- Game.startGame(mode)
- Game.resetState()
- Game.calculateBalance()
- Game.handleCorrectAnswer()
- Game.handleWrongAnswer()
- Game.tick() - game loop
- Game.endGame(result)

Có thể xóa/simplify:
- ❌ Xóa Team mode logic (~200 dòng)
- ❌ Xóa Duckrace (~100 dòng)
- ❌ Xóa debug logs (~50 dòng)
- ✅ Simplify PvP logic (~150 dòng)
```

#### cards.js (GIỮ NGUYÊN ~203 DÒNG)
- Đã gọn, chỉ cần thêm `getRandomSubset()`

#### skills.js (GIỮ NGUYÊN ~455 DÒNG)
- Core skill system, KHÔNG sửa

#### ui.js (GIỮ NGUYÊN ~948 DÒNG)
- Chỉ thêm UI cho Timer mode

#### fx.js (GIỮ NGUYÊN ~1045 DÒNG)
- Chỉ sửa lỗi, KHÔNG thêm mới

---

## 12. Luật Chơi Tổng

### 12.1 Solo Mode
```
Bắt đầu:
- Player có 0 mana, 0 combo
- Boss ở vị trí xa nhất (maxPosition)
- Timer bắt đầu đếm ngược

Trong game:
- Hiện Flashcard hoặc Quiz
- Quản trò bấm ✓/✗
- ✓: +1 mana (cap 10), +1 combo
- ✗: Reset combo, KHÔNG trừ mana
- Đúng 5 liên tiếp: Cast Combo Skill (random)
- Đủ 5 mana: Có thể Shopping

Boss Logic:
- Mỗi giây: position -= speed * deltaTime
- Rage Bar đầy: Boss tự cast skill
- Evolution: Đổi ảnh khi HP giảm mốc

Kết thúc:
- Win: Hết giờ, Boss chưa chạm Player
- Lose: Boss chạm Player trước khi hết giờ
```

### 12.2 PvP Mode
```
Bắt đầu:
- 2 Players ở 2 bên
- Mỗi Player có Boss riêng
- Quiz mode only

Trong game:
- P1 trả lời → P2 chờ
- P2 trả lời → P1 chờ
- Đúng: +1 combo, Boss đối thủ tiến lên
- Sai: Reset combo
- Skills: Tấn công/làm chậm đối thủ

Kết thúc:
- Player nào Boss chạm trước → thua
- Hết giờ: Player nào Boss xa hơn → thắng
```

### 12.3 Timer Mode (Mới)
```
Bắt đầu:
- Player ở PHẢI, Boss ở TRÁI
- Timer đếm ngược từ timerTime
- Thanh Progress Bar hiện % Boss tiếp cận

Trong game:
- Flashcard hoặc Quiz
- Quản trò bấm ✓/✗
- ✓: +1 mana (cap 10), +1 combo
- ✗: Reset combo
- Đúng 5 liên tiếp: Cast Combo Skill
- Đủ 5 mana: Shopping

Boss Logic:
- Di chuyển từ TRÁI sang PHẢI
- Position giảm dần (maxPosition → 0)
- Evolution: Đổi ảnh khi HP giảm mốc

Kết thúc:
- Win: Timer = 0, Boss chưa chạm Player
- Lose: Boss chạm Player (position <= 0)
```

---

## 📝 GHI CHÚ CHO AI PHIÊN SAU

### Context cho clone tiếp theo:
1. **Repo:** Aliuliu001/timer2 (PUBLIC)
2. **File chính:** index.html, js/game.js, js/cards.js, js/config.js
3. **Nguyên tắc:** KHÔNG xóa Solo/PvP, KHÔNG phá skill system
4. **Task tiếp theo:** Viết code Timer Mode + simplify game.js
5. **User:** Ngọc Trương (giáo viên, không rành tech, thích "bạn - mình")
6. **Ngôn ngữ:** Trả lời bằng Tiếng Việt, giải thích đơn giản
7. **Working dir:** /home/ubuntu/timer2

### Priorities:
1. ✅ Viết bản thiết kế này
2. 🔄 Simplify game.js (xóa Team, Duckrace, debug)
3. 🔄 Thêm Timer Mode UI + Logic
4. 🔄 Thêm Combo System (5 câu liên tiếp)
5. 🔄 Thêm Shopping System (5 mana → 1 food)
6. 🔄 Thêm Boss Eating Animation
7. 🔄 Test toàn bộ 3 modes
8. 🔄 Push lên GitHub
