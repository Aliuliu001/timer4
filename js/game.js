// ============================================================
// MAGIC REALM BATTLE - game.js
// Main game orchestrator: state, loop, events
// ============================================================

const Game = {
    config: {},
    rawCards: [],

    state: {
        isRunning: false,
        isPaused: false,
        isGameOver: false,
        mode: 'solo',       // 'solo' | 'pvp' | 'team'

        // Time
        timeRemaining: 120,
        gameTimerInterval: null,
        bossMovementInterval: null,

        // Boss (Solo & Team)
        boss: {
            position: 120,     // 0 = at hero, MAX = far away
            maxPosition: 120,
            speedMult: 1.0,    // speed multiplier
            frozen: false,
            paralyzed: false,
            blind: false,
            blindDirection: 1,
            sleeping: false,
            sleepHitsRemaining: 5,
            sleepTimer: null,
            slowed: 0,         // 0-1 fraction slow
            shielded: false,
            doubleShot: false,
        },

        // Hero (Solo & Team)
        hero: {
            paralyzed: false,
            shielded: false,
            burning: false,
        },

        // Mana & Combo
        mana: 0,
        combo: 0,
        maxCombo: 0,
        skillHand: [],         // up to 1 drawn skill ready to use

        // Stats
        stats: { correct: 0, wrong: 0, hits: 0, score: 0 },

        // Shadow Clone
        shadowClone: null,

        // PvP state
        p1Boss: { position: 120, maxPosition: 120, speedMult: 1, frozen: false, paralyzed: false, blind: false, sleeping: false, slowed: 0, shielded: false, doubleShot: false },
        p2Boss: { position: 120, maxPosition: 120, speedMult: 1, frozen: false, paralyzed: false, blind: false, sleeping: false, slowed: 0, shielded: false, doubleShot: false },
        p1Hero: { paralyzed: false, shielded: false, burning: false },
        p2Hero: { paralyzed: false, shielded: false, burning: false },
        p1Mana: 0, p2Mana: 0,
        p1Combo: 0, p2Combo: 0,
        p1SkillHand: [], p2SkillHand: [],
        p1HitsSinceRage: 0, p2HitsSinceRage: 0,
        pvpTurn: 1,           // 1 or 2
        pvpTurnTimer: null,
        pvpTurnRemaining: 0,

        // Team state
        teamBoss: { position: 120, maxPosition: 120, speedMult: 1, frozen: false, paralyzed: false, blind: false, sleeping: false, slowed: 0, shielded: false, doubleShot: false },
        teamHero: { paralyzed: false, shielded: false, burning: false },
        teamMana: 0,
        teamCombo: 0,
        teamSkillHand: [],
        teamPlayers: [],
        team: {
            studentOrder: [],
            currentIdx: 0,
            turnMode: 'duckrace',
            awaitingAnswer: false,
        },
    },

    // ══════════════════════════════════════════
    // AUTO-BALANCE
    // ══════════════════════════════════════════
    calculateBalance(bossTime, difficulty) {
        // Bảng cơ sở (benchmark ở 120s)
        // sdTimePct = % thời gian cuối trận kích hoạt Sudden Death
        // sdMultBase = hệ số nhân tốc độ Boss khi Sudden Death (%)
        const base = {
            'easy':   { speedMult: 0.6, enrage: 1.5, evolve: 3,  sdMultBase: 110, sdTimePct: 0.10, rageTime: 30, cap: 1.25, clearMana: false },
            'normal': { speedMult: 0.8, enrage: 2.5, evolve: 6,  sdMultBase: 125, sdTimePct: 0.12, rageTime: 20, cap: 1.35, clearMana: true },
            'hard':   { speedMult: 1.0, enrage: 4,   evolve: 10, sdMultBase: 140, sdTimePct: 0.15, rageTime: 12, cap: 1.5,  clearMana: true }
        };
        const cfg = base[difficulty] || base['normal'];

        // Logarithmic scale factor (benchmark = 120s)
        // 30s → ~0.39 | 60s → ~0.60 | 120s → 1.00 | 300s → ~1.43 | 900s → ~1.82
        const timeScale = Math.log2(bossTime / 30 + 1) / Math.log2(120 / 30 + 1);

        // Boss base speed: GIẢM 20% để Boss không chạy quá nhanh
        // Công thức: Boss mất ~90% thời gian game để chạm Player (nếu không bị đánh)
        const bossBaseSpeed = (120 / (bossTime * 0.9)) * cfg.speedMult;

        // Enrage/Evolve %: giảm mạnh để tổng không vượt cap
        // Game dài → scale xuống nhiều hơn
        const enragePercent = Number((cfg.enrage / Math.pow(timeScale, 1.2)).toFixed(1));
        const evolvePercent = Number((cfg.evolve / Math.pow(timeScale, 1.2)).toFixed(1));

        // ── SUDDEN DEATH ──
        // Thời gian SD = % cuối trận (giảm xuống để ít áp lực hơn)
        // Tối thiểu 10s, tối đa 45s
        const sdTime = Math.round(Math.min(45, Math.max(10, bossTime * cfg.sdTimePct)));

        // SD Multiplier: giảm buff để không quá áp lực
        // Công thức: lerp từ 105% (game 20s) đến sdMultBase (game 120s+)
        const sdLerp = Math.min(1, Math.max(0, (bossTime - 20) / 100));
        const sdMult = Math.round(105 + (cfg.sdMultBase - 105) * sdLerp);

        // ── RAGE TIME ──
        // Thời gian fill thanh Rage: scale theo game length
        // Game dài → rageTime dài hơn để player có thời gian
        const rageTime = Math.max(10, Math.round(cfg.rageTime * timeScale));

        // Enrage cap: giảm xuống để Boss không quá nhanh
        const cap = Number((1 + (cfg.cap - 1) * Math.min(timeScale, 1.2)).toFixed(2));

        return {
            bossBaseSpeed: Number(bossBaseSpeed.toFixed(3)),
            bossEnrageSpeedPercent: Math.max(0.5, enragePercent),
            bossEvolveSpeedPercent: Math.max(0.5, evolvePercent),
            suddenDeathRageMult: Math.max(105, Math.min(200, sdMult)),  // Cap tối đa 200% (giảm từ 250%)
            suddenDeathTime: sdTime,
            bossRageTime: rageTime,
            enrageSpeedCap: Math.max(1.1, Math.min(1.8, cap)),         // Cap tối đa 1.8x (giảm từ 2.5x)
            bossEvolutionClearsMana: cfg.clearMana
        };
    },

    // ══════════════════════════════════════════
    // INIT / RESET
    // ══════════════════════════════════════════
    init() {
        this.config = Settings.loadConfig();
        this.rawCards = Settings.loadCards();
        Cards.load(this.rawCards);
        this.resetState();
        this.bindEvents();
        this.populateSettings();
        this.applyGlobalBackground();
        UI.updateBossAvatar();
        UI.updateHeroAvatar(this.config.heroAvatarId || 1);
    },

    resetState() {
        const maxPos = this.config.bossTime * (this.config.bossBaseSpeed || 1);

        const freshBoss = () => ({
            position: maxPos, maxPosition: maxPos, speedMult: 1.0, enrageSpeedMult: 1.0,
            frozen: false, paralyzed: false, blind: false, blindDirection: 1,
            sleeping: false, sleepHitsRemaining: 5, sleepTimer: null,
            slowed: 0, shielded: false, doubleShot: false, shadowClone: null
        });
        const freshHero = () => ({ paralyzed: false, frozen: false, sleeping: false, slowed: 0, shielded: false, burning: false, shadowClone: null, frozenAnswersCount: 0 });

        this.state.pvpP1KeyMap = null;
        this.state.pvpP2KeyMap = null;
        clearTimeout(this.state.p1HurricaneTimer);
        clearTimeout(this.state.p2HurricaneTimer);
        this.state.boss   = freshBoss();
        this.state.hero   = freshHero();
        this.state.p1Boss = freshBoss();
        this.state.p2Boss = freshBoss();
        this.state.p1Hero = freshHero();
        this.state.p2Hero = freshHero();
        this.state.teamBoss = freshBoss();
        this.state.teamHero = freshHero();

        this.state.mana = 0; this.state.combo = 0; this.state.maxCombo = 0; this.state.skillHand = [];
        this.state.p1Mana = 0; this.state.p2Mana = 0;
        this.state.p1Rage = 0; this.state.p2Rage = 0;
        this.state.p1Combo = 0; this.state.p2Combo = 0;
        this.state.p1SkillHand = []; this.state.p2SkillHand = [];
        this.state.p1HitsSinceRage = 0; this.state.p2HitsSinceRage = 0;

        this.state.timeRemaining = this.config.bossTime;
        this.state.isRunning = false;
        this.state.isPaused = false;
        this.state.isGameOver = false;
        this.state.pvpTurn = 1;

        this.state.stats = { correct: 0, wrong: 0, hits: 0 };

        clearInterval(this.state.gameTimerInterval);
        clearInterval(this.state.bossMovementInterval);
        clearTimeout(this.state.pvpTurnTimer);

        Cards.reset('mode2'); // default
        Skills.buildDeck(this.config);
        Skills.buildBossDeck(this.config);
        
        // Clear all clones from DOM
        document.querySelectorAll('.slime-clone').forEach(el => el.remove());
        
        // Clear all effects from DOM
        ['solo', 'p1', 'p2', 'team'].forEach(p => {
            UI.updateBossEffects(p);
            UI.updateHeroEffects(p);
        });
    },

    // ══════════════════════════════════════════
    // START GAME
    // ══════════════════════════════════════════
    startGame(mode) {
        try { SFX.init(); } catch(e) { console.warn('SFX.init failed', e); }
        this.config = Settings.loadConfig();
        this.rawCards = Settings.loadCards();
        Cards.load(this.rawCards);
        this.resetState();

        this.state.mode = mode;
        this.state.isRunning = true;
        
        try { UI.renderMilestones(); } catch(e) { console.warn('renderMilestones failed', e); }
        try { this.playBGM(); } catch(e) { console.warn('playBGM failed', e); }

        // Show correct game layout
        document.getElementById('mode-select-screen').classList.add('hidden');
        document.getElementById('game-container').classList.remove('hidden');
        document.getElementById('solo-layout').classList.toggle('hidden', mode !== 'solo');
        document.getElementById('pvp-layout').classList.toggle('hidden',  mode !== 'pvp');
        document.getElementById('timer-layout').classList.toggle('hidden', mode !== 'timer');
        
        // Tick/Cross overlay: hiện trong Timer (luôn) hoặc khi bật cài đặt ở flashcard
        const showTickCross = (mode === 'timer') || (this.config.tickCrossEnabled && this.config.questionMode === 'flashcard');
        document.getElementById('tick-cross-overlay')?.classList.toggle('hidden', !showTickCross);

        document.getElementById('btn-stop').classList.remove('hidden');
        document.getElementById('btn-pause').classList.remove('hidden');

        if (this.state.cheatMode) {
            this.state.mana = 999;
            this.state.p1Mana = 999; this.state.p2Mana = 999;
            ['skillHand', 'p1SkillHand', 'p2SkillHand'].forEach(key => {
                while (this.state[key].length < 3) {
                    const s = Skills.drawHeroSkill();
                    if (s) this.state[key].push(s); else break;
                }
            });
        }

        // ⚠️ Toàn bộ UI init bọc trong try/catch riêng biệt:
        // nếu 1 hàm lỗi (vd: ảnh Pinterest CSP, Audio...) thì các bước sau + startTimer vẫn chạy.
        try {
        UI.updateBossAvatar();
        if (mode === 'timer') {
            // Timer mode: chỉ cập nhật những gì cần, không gọi UI Solo/PvP
            this.updateTimerHeroAvatar();
            UI.updateMana();
        } else {
            UI.updateHeroAvatar(this.config.heroAvatarId || 1, 'solo');
            UI.updateBossTrack();
            UI.updateMana();
            UI.updateMana('p1');
            UI.updateMana('p2');
            UI.updateCombo();
            UI.updateSkillsUI('solo');
            UI.updateSkillsUI('p1');
            UI.updateSkillsUI('p2');
            UI.renderCards();
        }
        } catch(e) { console.warn('UI init failed (non-fatal):', e); }

        try {
            if (mode === 'solo') this.startSolo();
            else if (mode === 'pvp') this.startPvP();
            else if (mode === 'timer') this.startTimer();
        } catch(e) {
            console.error('start mode error:', e);
            const box=document.getElementById('global-error');
            if(box){ box.classList.remove('hidden'); box.textContent='🐞 Lỗi khởi tạo ('+mode+'): '+(e&&e.message||e)+'\n'+(e&&e.stack?e.stack.split('\n').slice(0,3).join('\n'):''); }
        }
    },

    // ══════════════════════════════════════════
    // SOLO MODE
    // ══════════════════════════════════════════
    startSolo() {
        Cards.reset('mode2');
        this.refillBoard('mode2', 'solo');
        this.startTimers('solo');
    },

    startTimer() {
        // Timer mode: Boss tự tiến từ trái sang phải, quản trò bấm Đúng/Sai để cộng mana.
        // Thắng khi hết giờ mà Boss chưa chạm Hero. Thua khi Boss chạm Hero.
        // BULLETPROOF: tạo interval trước, init sau (nếu init lỗi thì đồng hồ vẫn chạy).
        this.showTimerDebug('startTimer called');

        // ── Tạo interval TRƯỚC (quan trọng: dù init lỗi, đồng hồ vẫn chạy) ──
        this.state.gameTimerInterval = setInterval(() => {
            if (!this.state.isRunning || this.state.isPaused || this.state.isGameOver) return;
            this.state.timeRemaining--;
            this.updateTimerClock();
            if (this.state.timeRemaining <= 0) {
                this.endGame('win');
            }
        }, 1000);

        this.state.bossMovementInterval = setInterval(() => {
            if (!this.state.isRunning || this.state.isPaused || this.state.isGameOver) return;
            const boss = this.state.boss;
            if (boss.frozen || boss.paralyzed || boss.sleeping) return;
            let speed = (this.config.bossBaseSpeed || 1) * boss.speedMult;
            if (boss.slowed > 0) speed *= (1 - boss.slowed);
            boss.position -= speed * 0.1;
            if (boss.position <= 0) {
                boss.position = 0;
                this.updateTimerBossBar();
                this.endGame('lose');
                return;
            }
            if (boss.position > boss.maxPosition) boss.position = boss.maxPosition;
            this.updateTimerBossBar();
        }, 100);

        // ── Init state (bọc riêng, lỗi không làm chết interval) ──
        try {
            // Clock PHẢI dùng bossTime (thời gian tổng của game)
            this.state.timeRemaining = this.config.bossTime || 120;
            this.state.boss.position = this.state.boss.maxPosition;
            this.state.boss.speedMult = 1.0;
            this.state.boss.frozen = false;
            this.state.boss.paralyzed = false;
            this.state.boss.sleeping = false;
            this.state.boss.slowed = 0;
            this.state.boss.blind = false;
            this.state.boss.scaleLevel = 0;
            this.state.mana = 0;
            UI.updateMana();
        } catch(e) { this.showTimerDebug('init err: ' + e.message); }

        // ── Avatars (bọc riêng) ──
        try { this.setTimerBossAvatar(); } catch(e) { this.showTimerDebug('bossAvatar err: ' + e.message); }
        try { this.updateTimerHeroAvatar(); } catch(e) { this.showTimerDebug('heroAvatar err: ' + e.message); }
        try { this.updateTimerClock(); } catch(e) {}
        try { this.updateTimerBossBar(); } catch(e) {}

        this.showTimerDebug('startTimer done. timeRemaining=' + this.state.timeRemaining + ' bossMax=' + this.state.boss.maxPosition);
    },

    showTimerDebug(msg) {
        // Chỉ hiện khi có lỗi thực sự (để chẩn đoán), không log mỗi tick
        if (!/err|NOT FOUND|fail|THREW/i.test(msg)) return;
        const el = document.getElementById('timer-debug');
        if (!el) return;
        el.classList.remove('hidden');
        const t = new Date().toLocaleTimeString();
        el.textContent = `[${t}] ${msg}\n` + (el.textContent || '').split('\n').slice(0, 8).join('\n');
    },

    updateTimerClock() {
        const el = document.getElementById('timer-clock');
        if (!el) return;
        const t = Math.max(0, this.state.timeRemaining);
        const m = String(Math.floor(t / 60)).padStart(2, '0');
        const s = String(t % 60).padStart(2, '0');
        el.textContent = `${m}:${s}`;
    },

    updateTimerBossBar() {
        const el = document.getElementById('timer-boss-bar');
        if (!el) return;
        const pct = Math.max(0, Math.min(100, (this.state.boss.position / this.state.boss.maxPosition) * 100));
        el.style.width = pct + '%';
    },

    updateTimerHeroAvatar() {
        const el = document.querySelector('#timer-hero-box .timer-hero-media');
        if (!el) { this.showTimerDebug('timer-hero-media NOT FOUND'); return; }
        const url = this.config.timerHeroUrl || 'assets/timer-boss.gif';
        this.showTimerDebug('hero url = ' + (url || '(rỗng→dùng mặc định)'));
        if (url && (url.startsWith('http') || url.startsWith('data:') || url.startsWith('assets/'))) {
            const isVideo = url.endsWith('.mp4') || url.endsWith('.webm');
            el.innerHTML = isVideo
                ? `<video src="${url}" autoplay loop muted playsinline class="boss-media-el"></video>`
                : `<img src="${url}" class="boss-media-el" onerror="this.src='assets/timer-boss.gif'">`;
        } else {
            el.innerHTML = `<img src="assets/timer-boss.gif" class="boss-media-el">`;
        }
    },

    // Boss Timer dùng hàm RIÊNG (không dùng chung updateBossAvatar để tránh lộn ảnh vào góc)
    setTimerBossAvatar() {
        const el = document.querySelector('#timer-boss-box .boss-avatar-media');
        if (!el) { this.showTimerDebug('timer-boss-media NOT FOUND'); return; }
        // Ưu tiên: link Timer riêng → link Boss chung → ảnh mặc định trong repo (luôn hiện được)
        const url = this.config.timerBossUrl || this.config.bossThemeId || 'assets/timer-boss.gif';
        this.showTimerDebug('boss timer url = ' + (url || '(rỗng→dùng mặc định)'));
        if (url && (url.startsWith('http') || url.startsWith('data:') || url.startsWith('assets/'))) {
            const isVideo = url.endsWith('.mp4') || url.endsWith('.webm');
            el.innerHTML = isVideo
                ? `<video src="${url}" autoplay loop muted playsinline class="boss-media-el"></video>`
                : `<img src="${url}" class="boss-media-el" onerror="this.src='assets/timer-boss.gif'">`;
        } else if (/^\d+$/.test(url || '')) {
            // ID số → dùng iframe tenor (giữ tương thích cũ)
            el.innerHTML = `<iframe src="https://tenor.com/embed/${url}" width="100%" height="100%" frameborder="0" scrolling="no" class="boss-media-el pointer-events-none" allowtransparency="true"></iframe>`;
        } else {
            el.innerHTML = `<img src="assets/timer-boss.gif" class="boss-media-el">`;
        }
    },

    startTimers(player) {
        this.state.timeRemaining = this.config.bossTime;

        // Countdown timer
        this.state.gameTimerInterval = setInterval(() => {
            if (!this.state.isRunning || this.state.isPaused || this.state.isGameOver) return;
            
            this.state.timeRemaining--;
            UI.updateBossTrack('solo');

            if (this.state.timeRemaining <= 0) {
                this.endGame('win');
            }
        }, 1000);

        // Boss movement tick (every 100ms for smoothness)
        this.state.bossMovementInterval = setInterval(() => {
            if (!this.state.isRunning || this.state.isPaused || this.state.isGameOver) return;

            const boss = this.state.boss;
            if (boss.frozen || boss.paralyzed || boss.sleeping) return;

            const evolveBoostPct = (this.config.bossEvolveSpeedPercent ?? 15) / 100;
            const evolveSpeedMult = 1 + (boss.scaleLevel || 0) * evolveBoostPct;
            let speed = (this.config.bossBaseSpeed || 1) * boss.speedMult * (boss.enrageSpeedMult || 1.0) * evolveSpeedMult;
            
            // Sudden death speed multiplier
            if (this.state.timeRemaining <= (this.config.suddenDeathTime || 30)) {
                speed *= (this.config.suddenDeathRageMult || 200) / 100;
            }

            if (boss.slowed > 0) speed *= (1 - boss.slowed);
            if (boss.blind)      speed *= -1; // move backwards when blind

            boss.position -= speed * 0.1; // 0.1 because interval is 100ms

            // Keep in bounds (loại bỏ xử thắng tức thì để cân bằng game)
            if (!boss.blind) {
                if (boss.position <= 0) {
                    boss.position = 0;
                    this.endGame('lose');
                } else if (boss.position > boss.maxPosition) {
                    boss.position = boss.maxPosition;
                }
            } else {
                boss.position = Math.min(boss.maxPosition, boss.position);
            }

            UI.updateBossTrack('solo');

            // Check Boss scaling & evolution / de-evolution
            const pct = boss.position / boss.maxPosition;
            let scaleLevel = 0;
            if (pct <= 0.25) scaleLevel = 3;
            else if (pct <= 0.50) scaleLevel = 2;
            else if (pct <= 0.75) scaleLevel = 1;
            
            if (boss.scaleLevel !== scaleLevel) {
                if (boss.scaleLevel !== undefined) {
                    const isGrowing = scaleLevel > boss.scaleLevel;
                    UI.triggerBossEvolution('solo', isGrowing);
                    
                    if (isGrowing) {
                        UI.removeMilestoneItem(scaleLevel);
                        SFX.roar();
                    }
                    
                    // Xóa Mana và Skill Hand (tạo tính chiến thuật & ức chế vui nhộn)
                    if (this.config.bossEvolutionClearsMana !== false) {
                        this.state.mana = 0;
                        UI.updateMana('solo');
                        this.state.skillHand = [];
                        UI.updateSkillsUI('solo');
                    }
                }
                boss.scaleLevel = scaleLevel;
                UI.updateBossScale(scaleLevel, 'solo');
            }

            if (boss.position <= 0) this.endGame('lose');
        }, 100);

        // Boss rage skill tick (rage bar fills over bossRageTime seconds)
        const rageTime = this.config.bossRageTime || 15; // default 15s
        this.state.boss.ragePercent = 0;
        this.state.bossRageInterval = setInterval(() => {
            if (!this.state.isRunning || this.state.isPaused || this.state.isGameOver) return;
            if (this.state.boss.frozen || this.state.boss.sleeping) return;
            if (this.state.boss.burning) {
                this.state.boss.ragePercent = Math.max(0, this.state.boss.ragePercent - 2); // Burn rage
                const rageBar = document.getElementById('boss-rage-bar');
                if (rageBar) rageBar.style.width = this.state.boss.ragePercent + '%';
                return;
            }
            let tickAmount = 100 / (rageTime * 10); // 10 ticks per second
            // Sudden Death: chỉ tăng NHẸ tốc độ Rage (1.3x) thay vì dùng sdMult
            // Lý do: sdMult đã buff tốc di chuyển Boss rồi, nếu buff cả Rage 
            // thì Boss spam skill + chạy nhanh = player không thể thắng
            if (this.state.timeRemaining <= (this.config.suddenDeathTime || 30)) {
                tickAmount *= 1.3;
            }

            this.state.boss.ragePercent += tickAmount;
            const rageBar = document.getElementById('boss-rage-bar');
            if (rageBar) rageBar.style.width = Math.min(100, this.state.boss.ragePercent) + '%';

            if (this.state.boss.ragePercent >= 100) {
                this.state.boss.ragePercent = 0;
                if (rageBar) rageBar.style.width = '0%';
                Skills.executeSkill(Skills.bossSkillQueue[0], 'boss');
            }
        }, 100);
    },

    // ══════════════════════════════════════════
    // PvP MODE
    // ══════════════════════════════════════════
    startPvP() {
        Cards.reset('mode1');
        this.refillBoard('mode1', 'pvp');

        const maxPos = this.config.bossTime * (this.config.bossBaseSpeed || 1);
        this.state.p1Boss.position = maxPos;
        this.state.p2Boss.position = maxPos;
        
        UI.updateHeroAvatar(this.config.heroAvatarId || 1, 'p1');
        UI.updateHeroAvatar(this.config.heroAvatarId || 1, 'p2');

        // Set up keyboard events
        this.bindPvPKeys();

        // Movement ticks for both bosses
        this.state.bossMovementInterval = setInterval(() => {
            if (!this.state.isRunning || this.state.isPaused || this.state.isGameOver) return;
            this.movePvPBoss(this.state.p1Boss, 'p1');
            this.movePvPBoss(this.state.p2Boss, 'p2');
        }, 100);

        // Timer
        this.state.gameTimerInterval = setInterval(() => {
            if (!this.state.isRunning || this.state.isPaused || this.state.isGameOver) return;
            this.state.timeRemaining--;
            UI.updateBossTrack('p1');
            UI.updateBossTrack('p2');
            if (this.state.timeRemaining <= 0) {
                // Compare positions: who is safer (farther boss = safer)
                const p1Pct = this.state.p1Boss.position / this.state.p1Boss.maxPosition;
                const p2Pct = this.state.p2Boss.position / this.state.p2Boss.maxPosition;
                this.endGame(p1Pct >= p2Pct ? 'p1' : 'p2');
            }
        }, 1000);

        // Flashcard mode: turn system
        if (this.config.questionMode === 'flashcard') {
            this.startPvPTurn();
        }

        Fx.highlightPlayer(1);
    },

    movePvPBoss(boss, player) {
        if (boss.frozen || boss.paralyzed || boss.sleeping) return;
        let speed = (this.config.bossBaseSpeed || 1) * boss.speedMult * (boss.enrageSpeedMult || 1.0);
        
        // Sudden death speed multiplier
        if (this.state.timeRemaining <= (this.config.suddenDeathTime || 30)) {
            speed *= (this.config.suddenDeathRageMult || 200) / 100;
        }

        if (boss.slowed > 0) speed *= (1 - boss.slowed);
        if (boss.blind) speed *= -1;
        
        boss.position -= speed * 0.1;
        
        if (!boss.blind) {
            if (boss.position <= 0) {
                boss.position = 0;
                this.endPvP(player === 'p1' ? 'p2' : 'p1');
            } else if (boss.position >= boss.maxPosition) {
                boss.position = boss.maxPosition;
                this.endPvP(player);
            }
        } else {
            boss.position = Math.min(boss.maxPosition, boss.position);
        }
        
        UI.updateBossTrack(player);
    },

    startPvPTurn() {
        const turnTime = this.config.pvpTurnTime || 10;
        this.state.pvpTurnRemaining = turnTime;
        Fx.highlightPlayer(this.state.pvpTurn);

        // Flash Avatar Mode
        if (this.config.questionMode === 'flashcard' && this.config.flashAvatar) {
            const N = this.config.numStudents || 10;
            const r1 = Math.floor(Math.random() * N) + 1;
            const r2 = Math.floor(Math.random() * N) + 1;
            UI.updateHeroAvatar(r1, 'p1');
            UI.updateHeroAvatar(r2, 'p2');
        }

        clearTimeout(this.state.pvpTurnTimer);
        this.state.pvpTurnTimer = setInterval(() => {
            if (!this.state.isRunning || this.state.isPaused) return;
            this.state.pvpTurnRemaining--;

            const el = document.getElementById('pvp-turn-timer');
            if (el) el.textContent = this.state.pvpTurnRemaining;

            if (this.state.pvpTurnRemaining <= 0) {
                // Time out = switch to other player (they get a chance)
                if (this.state.pvpTurn === 1) {
                    this.state.pvpTurn = 2;
                    this.state.pvpTurnRemaining = Math.floor(turnTime / 2);
                    Fx.highlightPlayer(2);
                } else {
                    // Both failed → card goes to wrong pile
                    this.handlePvPBothWrong();
                    this.state.pvpTurn = 1;
                    clearInterval(this.state.pvpTurnTimer);
                    this.startPvPTurn();
                }
            }
        }, 1000);
    },

    handlePvPAnswer(player, cardIndex, correct) {
        if (!this.state.isRunning || this.state.isGameOver) return;
        const heroState = player === 1 ? this.state.p1Hero : this.state.p2Hero;
        if (heroState.paralyzed || heroState.frozen || heroState.sleeping) return;

        const currentTurn = this.state.pvpTurn;
        const isMyTurn = (player === currentTurn);

        // In quiz mode, anyone can answer anytime
        // In flashcard mode, only current turn player can answer
        if (this.config.questionMode === 'flashcard' && !isMyTurn) return;


        if (correct) {
            SFX.correct();
            this.state.stats.correct++;

            // Pet celebrate (Task 1.5)
            if (this.config.questionMode === 'flashcard') {
                const petId = player === 1 ? 'pvp-pet-p1' : 'pvp-pet-p2';
                const petEl = document.getElementById(petId);
                if (petEl) {
                    petEl.classList.remove('pet-celebrate');
                    void petEl.offsetWidth; // trigger reflow
                    petEl.classList.add('pet-celebrate');
                }
            }

            // Add rage
            const rageKey = player === 1 ? 'p1Rage' : 'p2Rage';
            this.state[rageKey] = Math.min(100, (this.state[rageKey] || 0) + 10);
            if (UI.updateRage) UI.updateRage(player === 1 ? 'p1' : 'p2');

            // Snowball the OPPONENT's hero (push them back)
            const opponentBossState = player === 1 ? this.state.p2Boss : this.state.p1Boss;
            this.firePvPSnowball(opponentBossState, player === 1 ? 'p2' : 'p1', player === 1 ? 'p1' : 'p2');

            // Add mana
            const mana = player === 1 ? 'p1Mana' : 'p2Mana';
            const heroState = player === 1 ? this.state.p1Hero : this.state.p2Hero;
            const manaGain = heroState && heroState.rocketBuff ? 2 : 1;
            this.state[mana] = Math.min(10, this.state[mana] + manaGain);
            UI.updateMana(player === 1 ? 'p1' : 'p2');

            // Combo
            const comboKey = player === 1 ? 'p1Combo' : 'p2Combo';
            this.state[comboKey] = Math.min(5, this.state[comboKey] + 1);
            UI.updateCombo(player === 1 ? 'p1' : 'p2');

            // Next card
            clearInterval(this.state.pvpTurnTimer);
            Cards.answerCorrect(cardIndex, 'mode1');
            Cards.fillBoard('mode1', () => UI.renderCards());
            this.state.pvpTurn = player === 1 ? 2 : 1; // Switch turn
            this.startPvPTurn();

        } else {
            SFX.wrong();
            this.state.stats.wrong++;

            // Penalty: boss speeds up + player frozen
            const bossState = player === 1 ? this.state.p1Boss : this.state.p2Boss;
            bossState.speedMult = 1.3;
            heroState.paralyzed = true;
            UI.updateHeroEffects(player === 1 ? 'p1' : 'p2');

            const freezeTime = (this.config.pvpFreezeTime || 2) * 1000;
            setTimeout(() => {
                bossState.speedMult = 1.0;
                heroState.paralyzed = false;
                UI.updateHeroEffects(player === 1 ? 'p1' : 'p2');
            }, freezeTime);

            // Reset combo
            const comboKey = player === 1 ? 'p1Combo' : 'p2Combo';
            this.state[comboKey] = 0;
            UI.updateCombo(player === 1 ? 'p1' : 'p2');
        }
    },

    handlePvPBothWrong() {
        // Both players failed → wrong pile
        for (let i = 0; i < 3; i++) {
            if (Cards.active[i]) Cards.answerWrong(i, 'mode1');
        }
        Cards.fillBoard('mode1', () => UI.renderCards());
    },

    firePvPSnowball(bossState, targetPlayer, sourcePlayer) {
        const comboKey = sourcePlayer === 'p1' ? 'p1Combo' : 'p2Combo';
        const combo = this.state[comboKey];
        if (combo < 5) return;

        const suffix = sourcePlayer === 'p1' ? '-p1' : '-p2';
        const container = document.querySelector('.combo-diamond-container.' + suffix.replace('-', ''));
        if (container) container.classList.add('combo-merge-effect');

        setTimeout(() => {
            this.state[comboKey] = 0;
            UI.updateCombo(sourcePlayer);
            if (this.config.snowballPushActive === false) return;
            const pushSecs = (this.config.snowballPush !== undefined ? this.config.snowballPush : 3);
            const push = pushSecs * (this.config.bossBaseSpeed || 1) * (1 + 5 * 0.1);

            let comboAbsorbedByClone = false;
            let interceptedCloneEl = null;
            const targetContainer = document.getElementById(`hero-avatar-box-${targetPlayer}`);
            if (targetContainer) {
                const activeClones = Array.from(targetContainer.querySelectorAll('.slime-clone:not(.intercepting)'));
                if (activeClones.length > 0) {
                    interceptedCloneEl = activeClones[activeClones.length - 1];
                    interceptedCloneEl.classList.add('intercepting');
                    comboAbsorbedByClone = true;
                }
            }

            Fx.spawnSnowball(combo, targetPlayer, (hitIndex, totalHits) => {
                if (comboAbsorbedByClone) {
                    if (hitIndex === 1 && interceptedCloneEl) Fx.destroyClone(interceptedCloneEl);
                    return;
                }

                const fractionPush = push / totalHits;
                bossState.position = Math.min(bossState.maxPosition, bossState.position + fractionPush);
                
                Fx.shakeBoss(targetPlayer);
                UI.updateBossTrack(targetPlayer);

                if (hitIndex === totalHits) {
                    // Enrage Speed
                    const enragePct = this.config.bossEnrageSpeedPercent ?? 5;
                    bossState.speedMult = Math.min(this.config.enrageSpeedCap || 1.5, bossState.speedMult + (enragePct / 100));

                    // Check rage
                    const hitsKey = sourcePlayer === 'p1' ? 'p1HitsSinceRage' : 'p2HitsSinceRage';
                    this.state[hitsKey]++;
                    const threshold = this.config.bossRageThreshold || 20;
                    if (this.state[hitsKey] >= threshold) {
                        this.state[hitsKey] = 0;
                        const rageIdx = Skills.bossRageIndex++ % 2;
                        Skills.executeRage(BOSS_RAGE_SKILLS[rageIdx], player);
                    }
                }
            });

            SFX.bigSnow();
        }, 500);
    },

    endPvP(winner) {
        this.endGame('pvp_' + winner);
    },

    // ══════════════════════════════════════════
    // CARD ANSWERS (Solo & Team)
    // ══════════════════════════════════════════
    handleCardCorrect(slotIndex, player) {
        if (!this.state.isRunning || this.state.isGameOver) return;
        if (this.state.hero.paralyzed || this.state.hero.frozen || this.state.hero.sleeping) return;
        if (this.state.isAnsweringCooldown) return;
        if (this.state.heroSlowCooldown > 0) {
            this.state.isAnsweringCooldown = true;
            setTimeout(() => { if (this.state) this.state.isAnsweringCooldown = false; }, this.state.heroSlowCooldown);
        }

        SFX.correct();
        this.state.stats.correct++;
        this.state.combo = Math.min(5, this.state.combo + 1);

        if (!this.state.hero.burning) {
            // Mana +1 (or +2 if rocketBuff is active)
            const manaGain = this.state.hero.rocketBuff ? 2 : 1;
            this.state.mana = Math.min(10, this.state.mana + manaGain);
            if (this.state.mana === 5 || this.state.mana === 10) {
                // Draw a skill
                const skill = Skills.drawHeroSkill();
                if (skill && !this.state.skillHand.includes(skill)) {
                    this.state.skillHand.push(skill);
                    if (this.state.skillHand.length > 3) this.state.skillHand.shift();
                }
            }
        }

        UI.animateCardCorrect(slotIndex, () => {
            if (this.config.questionMode === 'quiz') Cards.answerCorrect(slotIndex, 'mode2');
            else Cards.answerCorrect(slotIndex, 'mode2');
            UI.renderCards();
            
            const count = this.config.flashcardCount || 3;
            const isBoardEmpty = Cards.active.slice(0, count).every(c => !c);
            if (isBoardEmpty) {
                this.refillBoard('mode2', 'solo');
            }
        });

        // Fire snowball
        this.fireSnowball('solo');

        UI.updateMana('solo');
        UI.updateCombo('solo');

        // Shadow clone hit
        if (this.state.shadowClone && this.state.shadowClone.active) {
            this.state.shadowClone.hitsGiven++;
            const remaining = this.state.shadowClone.hitsNeeded - this.state.shadowClone.hitsGiven;
            const el = document.getElementById('clone-hits-needed');
            if (el) el.textContent = remaining;
            if (remaining <= 0) {
                this.state.shadowClone = null;
                UI.hideShadowClone();
                Fx.spawnFloatText('boss-fx', '?? CLONE DESTROYED!', '#22D3EE');
            }
        }
    },

    handleCardWrong(slotIndex, player) {
        if (!this.state.isRunning || this.state.isGameOver) return;
        if (this.state.hero.paralyzed || this.state.hero.frozen || this.state.hero.sleeping) return;
        if (this.state.isAnsweringCooldown) return;
        if (this.state.heroSlowCooldown > 0) {
            this.state.isAnsweringCooldown = true;
            setTimeout(() => { if (this.state) this.state.isAnsweringCooldown = false; }, this.state.heroSlowCooldown);
        }

        SFX.wrong();
        this.state.stats.wrong++;
        if (player === 'p2') this.state.p2Combo = 0;
        else this.state.combo = 0;
        UI.updateCombo(player === 'p2' ? 'p2' : (this.state.mode === 'pvp' ? 'p1' : 'solo'));

        UI.animateCardWrong(slotIndex, () => {
            Cards.answerWrong(slotIndex, 'mode2');
            UI.renderCards();
            
            const count = this.config.flashcardCount || 3;
            const isBoardEmpty = Cards.active.slice(0, count).every(c => !c);
            if (isBoardEmpty) {
                this.refillBoard('mode2', 'solo');
            }
        });
    },

    handleManualTick(isCorrect) {
        if (!this.state.isRunning || this.state.isGameOver) return;

        // Flash animation
        const flashClass = isCorrect ? 'flash-correct' : 'flash-wrong';
        document.body.classList.add(flashClass);
        setTimeout(() => document.body.classList.remove(flashClass), 300);

        if (this.state.mode === 'timer') {
            // Timer mode: chỉ quản trò bấm Đúng/Sai -> cộng mana (tối đa 10)
            if (isCorrect) {
                this.state.mana = Math.min(10, this.state.mana + 1);
                Fx.spawnFloatText('timer-hero-fx', '+1 ⚡', '#F6C90E');
            } else {
                this.state.combo = 0; // reset chuỗi khi sai
            }
            UI.updateMana();
            return;
        }

        if (this.config.questionMode !== 'flashcard') return; // only for flashcard

        if (this.state.mode === 'pvp') {
            this.handlePvPAnswer(this.state.pvpTurn, 0, isCorrect);
        } else {
            if (isCorrect) this.handleCardCorrect(0, 'solo');
            else this.handleCardWrong(0, 'solo');
        }
    },

    fireSnowball(player) {
        const combo = (player === 'p2') ? this.state.p2Combo : this.state.combo;
        if (combo < 5) return;
        const boss = (player === 'p2') ? this.state.p2Boss : ((player === 'p1') ? this.state.p1Boss : ((player === 'team') ? this.state.teamBoss : this.state.boss));
        const heroState = (player === 'p2') ? this.state.p2Hero : ((player === 'p1') ? this.state.p1Hero : ((player === 'team') ? this.state.teamHero : this.state.hero));

        const suffix = this.state.mode === 'team' ? '-team' : (player === 'p2' ? '-p2' : (player === 'p1' ? '-p1' : ''));
        const containerSelector = suffix ? '.combo-diamond-container.' + suffix.replace('-', '') : '.combo-diamond-container:not(.p1):not(.p2):not(.team)';
        const container = document.querySelector(containerSelector);
        
        if (container) container.classList.add('combo-merge-effect');

        // Cache combo value BEFORE the timeout (combo will still == 5 here)
        const cachedCombo = combo;

        setTimeout(() => {
            if (this.config.snowballPushActive === false) {
                // Reset and clean up
                if (player === 'p2') this.state.p2Combo = 0;
                else this.state.combo = 0;
                UI.updateCombo(player);
                if (container) container.classList.remove('combo-merge-effect');
                return;
            }

            if (boss.shielded) {
                // Reflect!
                boss.shielded = false;
                UI.updateBossEffects(player);
                Fx.spawnFloatText('boss-fx', '🛡️ REFLECTED!', '#818CF8');
                this.state.hero.paralyzed = true;
                setTimeout(() => { this.state.hero.paralyzed = false; UI.updateHeroEffects(player); }, 2000);
                // Still reset combo
                if (player === 'p2') this.state.p2Combo = 0;
                else this.state.combo = 0;
                UI.updateCombo(player);
                if (container) container.classList.remove('combo-merge-effect');
                return;
            }

            const pushSecs = (this.config.snowballPush !== undefined ? this.config.snowballPush : 3);
            let push = pushSecs * (this.config.bossBaseSpeed || 1) * (1 + (cachedCombo - 1) * 0.1);
            if (heroState && heroState.doubleShot) {
                push *= 2;
                heroState.doubleShot = false;
                Fx.spawnFloatText('hero-fx', '✨ DOUBLE SHOT!', '#A78BFA');
            }

            let comboAbsorbedByClone = false;
            let interceptedCloneEl = null;
            const bossContainer = document.querySelector('.solo-boss');
            if (bossContainer) {
                const activeClones = Array.from(bossContainer.querySelectorAll('.slime-clone:not(.intercepting)'));
                if (activeClones.length > 0) {
                    interceptedCloneEl = activeClones[activeClones.length - 1];
                    interceptedCloneEl.classList.add('intercepting');
                    comboAbsorbedByClone = true;
                }
            }

            // Fire with CACHED combo (5) — crystal is still visible at this point
            Fx.spawnSnowball(cachedCombo, player, (hitIndex, totalHits) => {
                if (comboAbsorbedByClone) {
                    if (hitIndex === 1 && interceptedCloneEl) {
                        Fx.destroyClone(interceptedCloneEl);
                    }
                    return;
                }

                const fractionPush = push / totalHits;
                boss.position = Math.min(boss.maxPosition, boss.position + fractionPush);
                
                UI.updateBossTrack(player);
                Fx.shakeBoss(player);

                if (hitIndex === totalHits) {
                    // Enrage Speed
                    const enragePct = this.config.bossEnrageSpeedPercent ?? 5;
                    boss.speedMult = Math.min(this.config.enrageSpeedCap || 1.5, boss.speedMult + (enragePct / 100));

                    // Wake sleeping boss if hit
                    if (boss.sleeping) {
                        boss.sleepHitsRemaining = (boss.sleepHitsRemaining || 1) - 1;
                        if (boss.sleepHitsRemaining <= 0) {
                            boss.sleeping = false;
                            clearTimeout(boss.sleepTimer);
                            UI.updateBossEffects(player);
                            Fx.spawnFloatText('boss-fx', '⚡ BOSS AWAKE!', '#F59E0B');
                        }
                    }

                    // Record hit for stats
                    this.state.stats.hits++;
                }
            });

            SFX.bigSnow(); SFX.combo();

            // Reset combo AFTER spawnSnowball has already captured the crystal position
            // Small delay so crystal is still rendered when getBoundingClientRect() is called
            setTimeout(() => {
                if (player === 'p2') this.state.p2Combo = 0;
                else this.state.combo = 0;
                UI.updateCombo(player);
                if (container) container.classList.remove('combo-merge-effect');
            }, 100);
        }, 500);
    },
    // ══════════════════════════════════════════
    // HERO SKILL USE
    // ══════════════════════════════════════════
    useHeroSkill(skillId, player) {
        if (this.state.cheatMode) this.state.mana = 999;
        
        const heroState = player === 'p2' ? this.state.p2Hero : (player === 'p1' ? this.state.p1Hero : (player === 'team' ? this.state.teamHero : this.state.hero));
        if (heroState.burning) {
            Fx.spawnFloatText('hero-fx' + (player==='p2'?'-p2':(player==='team'?'-team':'')), '🔥 BURNING!', '#EF4444');
            return;
        }

        const manaKey = player === 'p2' ? 'p2Mana' : 'mana';
        if (this.state[manaKey] < 5) return;
        this.state[manaKey] -= 5;

        const handKey = player === 'p2' ? 'p2SkillHand' : 'skillHand';
        if (this.state.cheatMode) {
            const newSkill = Skills.drawHeroSkill();
            if (newSkill) {
                const idx = this.state[handKey].indexOf(skillId);
                if (idx !== -1) {
                    this.state[handKey][idx] = newSkill;
                }
            }
        } else {
            this.state[handKey] = this.state[handKey].filter(s => s !== skillId);
        }

        Skills.executeSkill(skillId, 'hero', player);
        UI.updateMana(player);
        UI.updateSkillsUI(player);
    },

    // Push boss back by N steps
    pushBoss(steps, player) {
        if (typeof steps !== 'number' || isNaN(steps)) steps = 10;
        const boss = (player === 'p2') ? this.state.p2Boss : this.state.boss;
        boss.position = Math.min(boss.maxPosition, boss.position + steps);
        UI.updateBossTrack(player === 'p2' ? 'p2' : 'solo');
    },

    // ══════════════════════════════════════════
    // PvP KEYBOARD
    // ══════════════════════════════════════════
    bindPvPKeys() {
        this._pvpKeyHandler = (e) => {
            if (!this.state.isRunning || this.state.isGameOver || this.state.isPaused) return;
            const k = e.key.toLowerCase();
            const keys = this.config.pvpKeys || DEFAULT_CONFIG.pvpKeys;

            if (this.config.questionMode === 'flashcard') {
                if (e.key === 'ArrowLeft') {
                    this.handlePvPAnswer(1, 0, true);
                    return;
                } else if (e.key === 'ArrowRight') {
                    this.handlePvPAnswer(2, 0, true);
                    return;
                }
            }

            // P1 answers
            if ([keys.p1A, keys.p1B, keys.p1C, keys.p1D].includes(k)) {
                let answerIdx = [keys.p1A, keys.p1B, keys.p1C, keys.p1D].indexOf(k);
                if (this.state.pvpP1KeyMap) answerIdx = this.state.pvpP1KeyMap[answerIdx];
                this.handlePvPKeyAnswer(1, answerIdx);
            }
            // P2 answers
            else if ([keys.p2A, keys.p2B, keys.p2C, keys.p2D].includes(k)) {
                let answerIdx = [keys.p2A, keys.p2B, keys.p2C, keys.p2D].indexOf(k);
                if (this.state.pvpP2KeyMap) answerIdx = this.state.pvpP2KeyMap[answerIdx];
                this.handlePvPKeyAnswer(2, answerIdx);
            }
            // P1 skill
            else if (k === (keys.p1Skill || ' ')) {
                if (this.state.p1Rage >= 100) {
                    this.useUltimate(1);
                } else if (this.state.p1SkillHand.length) {
                    this.useHeroSkill(this.state.p1SkillHand[0], 'p1');
                }
            }
            // P2 skill
            else if (k === (keys.p2Skill || 'Enter')) {
                if (this.state.p2Rage >= 100) {
                    this.useUltimate(2);
                } else if (this.state.p2SkillHand.length) {
                    this.useHeroSkill(this.state.p2SkillHand[0], 'p2');
                }
            }
        };
        document.addEventListener('keydown', this._pvpKeyHandler);
    },

    handlePvPKeyAnswer(player, answerIdx) {
        if (this.config.questionMode === 'flashcard') {
            const isMyTurn = (this.state.pvpTurn === player);
            if (!isMyTurn) return;
            // First card is correct, others are wrong (flashcard has 1 right answer)
            this.handlePvPAnswer(player, answerIdx, answerIdx === 0);
        } else {
            const isMyTurn = (this.state.pvpTurn === player);
            if (!isMyTurn) return;
            const isCorrect = Cards.quizChoices[answerIdx] === Cards.quizQuestion;
            this.handlePvPAnswer(player, answerIdx, isCorrect);
        }
    },

    usePvPSpeedCurse(player) {
        const manaKey = player === 1 ? 'p1Mana' : 'p2Mana';
        if (this.state[manaKey] < 5) return;
        this.state[manaKey] -= 5;

        // Speed up OPPONENT's boss
        const targetBoss = player === 1 ? this.state.p2Boss : this.state.p1Boss;
        const dur = (this.config.pvpSpeedCurseDuration || 5) * 1000;
        const boost = this.config.pvpSpeedCurseBoost || 1.5;
        targetBoss.speedMult = boost;

        Fx.spawnFloatText(player === 1 ? 'hero-fx-p2' : 'hero-fx-p1', `⚡ SPEED CURSE!`, '#EF4444');
        setTimeout(() => { targetBoss.speedMult = 1.0; }, dur);

        UI.updateMana(player === 1 ? 'p1' : 'p2');
    },

    useUltimate(player) {
        const rageKey = player === 1 ? 'p1Rage' : 'p2Rage';
        if (this.state[rageKey] < 100) return;
        this.state[rageKey] = 0;
        if (UI.updateRage) UI.updateRage(player === 1 ? 'p1' : 'p2');
        
        // Placeholder for Ultimate execution
        Fx.spawnFloatText(`hero-fx-p${player}`, '🔥 ULTIMATE READY!', '#f59e0b');
        
        // Trigger generic ultimate effect (e.g. push opponent back massively)
        const opponentBossState = player === 1 ? this.state.p2Boss : this.state.p1Boss;
        const push = (this.config.snowballPush || 3) * 5; // massive push
        opponentBossState.position = Math.min(opponentBossState.maxPosition, opponentBossState.position + push);
        
        const targetPlayerStr = player === 1 ? 'p2' : 'p1';
        Fx.shakeBoss(targetPlayerStr);
        UI.updateBossTrack(targetPlayerStr);
    },

    // ══════════════════════════════════════════
    // PAUSE / STOP
    // ══════════════════════════════════════════
    togglePause() {
        if (this.state.isGameOver) return;
        this.state.isPaused = !this.state.isPaused;

        const overlay = document.getElementById('pause-overlay');
        if (overlay) overlay.classList.toggle('hidden', !this.state.isPaused);

        const pauseIcon = document.getElementById('pause-icon');
        const playIcon  = document.getElementById('play-icon');
        if (pauseIcon) pauseIcon.classList.toggle('hidden',  this.state.isPaused);
        if (playIcon)  playIcon.classList.toggle('hidden',  !this.state.isPaused);
    },

    stopGame() {
        UI.showAlert('Dừng game và quay về màn hình chính?', 'confirm', () => {
            this.state.isRunning = false;
            this.state.isGameOver = true;
            this.stopBGM();
            clearInterval(this.state.gameTimerInterval);
            clearInterval(this.state.bossMovementInterval);
            clearInterval(this.state.bossRageInterval);
            clearTimeout(this.state.pvpTurnTimer);
            if (this._pvpKeyHandler) document.removeEventListener('keydown', this._pvpKeyHandler);
            this.showModeSelect();
        });
    },

    showModeSelect() {
        document.getElementById('game-container').classList.add('hidden');
        document.getElementById('mode-select-screen').classList.remove('hidden');
        document.getElementById('btn-stop').classList.add('hidden');
        document.getElementById('btn-pause').classList.add('hidden');
        document.getElementById('pause-overlay').classList.add('hidden');
    },

    // ══════════════════════════════════════════
    // END GAME
    // ══════════════════════════════════════════
    endGame(result) {
        if (this.state.isGameOver) return;
        this.state.isGameOver = true;
        this.state.isRunning = false;
        
        this.stopBGM();

        this.state.pvpP1KeyMap = null;
        this.state.pvpP2KeyMap = null;
        clearTimeout(this.state.p1HurricaneTimer);
        clearTimeout(this.state.p2HurricaneTimer);

        clearInterval(this.state.gameTimerInterval);
        clearInterval(this.state.bossMovementInterval);
        clearInterval(this.state.bossRageInterval);
        clearTimeout(this.state.pvpTurnTimer);
        if (this._pvpKeyHandler) document.removeEventListener('keydown', this._pvpKeyHandler);

        const isWin = (result === 'win' || result === 'pvp_p1');
        if (isWin) { SFX.win(); Fx.spawnParticles(true); }
        else { SFX.lose(); Fx.spawnParticles(false); }

        // Calculate score
        const total = this.state.stats.correct + this.state.stats.wrong;
        const accuracy = total > 0 ? this.state.stats.correct / total : 0;
        const timeBonus = Math.floor((this.state.timeRemaining / this.config.bossTime) * 1000);
        const score = Math.round(
            (isWin ? 5000 : 0) +
            accuracy * 3000 +
            timeBonus -
            this.state.stats.wrong * 100
        );
        this.state.stats.score = Math.max(0, score);

        setTimeout(() => this.showResult(result), 2000);
    },

    showResult(result) {
        const overlay = document.getElementById('result-overlay');
        if (!overlay) return;
        overlay.classList.remove('hidden');

        const isWin = result === 'win' || result === 'pvp_p1';
        const titleEl = document.getElementById('result-title');
        const subtitleEl = document.getElementById('result-subtitle');
        const scoreEl = document.getElementById('result-score');
        const correctEl = document.getElementById('result-correct');
        const wrongEl = document.getElementById('result-wrong');

        if (titleEl)    titleEl.textContent   = isWin ? '⚔️ VICTORY!' : '💀 DEFEAT!';
        if (titleEl)    titleEl.className = `result-title ${isWin ? 'win' : 'lose'}`;
        if (subtitleEl) subtitleEl.textContent = isWin ? 'You protected the realm!' : 'The Boss reached you...';
        if (correctEl)  correctEl.textContent = this.state.stats.correct;
        if (wrongEl)    wrongEl.textContent   = this.state.stats.wrong;

        // Score counter animation
        let displayScore = 0;
        const target = this.state.stats.score;
        const step = Math.ceil(target / 40) || 1;
        const countInterval = setInterval(() => {
            displayScore = Math.min(displayScore + step, target);
            if (scoreEl) scoreEl.textContent = displayScore;
            if (displayScore >= target) clearInterval(countInterval);
        }, 30);
    },

    saveScore() {
        const name = (document.getElementById('result-name')?.value?.trim()) || 'Anonymous Hero';
        Settings.saveLeaderboard({
            name,
            avatarId: this.config.heroAvatarId || 1,
            correct: this.state.stats.correct,
            wrong: this.state.stats.wrong,
            score: this.state.stats.score,
            mode: this.state.mode,
        });
        document.getElementById('result-input-state').classList.add('hidden');
        document.getElementById('result-board-state').classList.remove('hidden');
        UI.renderLeaderboard();
    },

    // ══════════════════════════════════════════
    // SETTINGS PANEL
    // ══════════════════════════════════════════
    populateSettings() {
        const cfg = this.config;

        // Safe helper
        const set = (id, val) => { const el = document.getElementById(id); if(el) el.value = val ?? ''; };
        const setChecked = (id, val) => { const el = document.getElementById(id); if(el) el.checked = !!val; };

        set('cfg-boss-time', cfg.bossTime);
        set('cfg-boss-arrival-time', cfg.bossTime); // Sync Boss Arrival Time input
        set('cfg-flashcard-count', cfg.flashcardCount || 3);
        set('cfg-num-students', cfg.numStudents);
        set('cfg-question-mode', cfg.questionMode);
        set('cfg-card-display', cfg.cardDisplay);
        setChecked('cfg-tick-cross', cfg.tickCrossEnabled);
        
        // Auto balance fields
        set('cfg-boss-base-speed', cfg.bossBaseSpeed ?? 1.0);
        set('cfg-enrage-cap', cfg.enrageSpeedCap ?? 1.5);
        setChecked('cfg-evo-clear-mana', cfg.bossEvolutionClearsMana !== false);

        set('cfg-pvp-turn-time', cfg.pvpTurnTime);
        set('cfg-pvp-freeze-time', cfg.pvpFreezeTime);
        set('cfg-boss-rage-time', cfg.bossRageTime);
        set('cfg-sudden-death-time', cfg.suddenDeathTime);
        set('cfg-sudden-death-mult', cfg.suddenDeathRageMult);
        set('cfg-boss-enrage-speed', cfg.bossEnrageSpeedPercent);
        set('cfg-boss-evolve-speed', cfg.bossEvolveSpeedPercent ?? 15);
        set('cfg-boss-theme', cfg.bossThemeId || '');
        setChecked('cfg-boss-flip', cfg.bossFlip);
        set('cfg-hero-avatar', cfg.heroAvatarId || '1');
        set('cfg-p1-avatar', cfg.p1AvatarUrl || '');
        set('cfg-p2-avatar', cfg.p2AvatarUrl || '');
        set('cfg-p1-hero-id', cfg.p1HeroId || '1');
        set('cfg-p2-hero-id', cfg.p2HeroId || '2');
        set('cfg-timer-boss-url', cfg.timerBossUrl || '');
        set('cfg-timer-hero-url', cfg.timerHeroUrl || '');
        set('cfg-timer-time', cfg.timerTime || 120);
        set('cfg-timer-skill-mode', cfg.timerSkillMode || 'random');
        if (cfg.p1AvatarType === 'url') {
            const el = document.getElementById('cfg-p1-type-url');
            if (el) el.checked = true;
        } else {
            const el = document.getElementById('cfg-p1-type-hero');
            if (el) el.checked = true;
        }
        if (cfg.p2AvatarType === 'url') {
            const el = document.getElementById('cfg-p2-type-url');
            if (el) el.checked = true;
        } else {
            const el = document.getElementById('cfg-p2-type-hero');
            if (el) el.checked = true;
        }
        setChecked('cfg-flash-avatar', cfg.flashAvatar);
        const prev0 = document.getElementById('hero-avatar-preview');
        if (prev0) prev0.src = `Hero/${cfg.heroAvatarId || '1'}.png`;
        const prev1 = document.getElementById('p1-hero-preview');
        if (prev1) prev1.src = `Hero/${cfg.p1HeroId || '1'}.png`;
        const prev2 = document.getElementById('p2-hero-preview');
        if (prev2) prev2.src = `Hero/${cfg.p2HeroId || '2'}.png`;
        set('cfg-shadow-clone-hits', cfg.shadowCloneHits);
        
        set('cfg-bg-url', cfg.bgUrl || '');
        set('cfg-bgm-url', cfg.bgmUrl || '');
        set('cfg-bgm-vol', cfg.bgmVol ?? 0.3);
        const bgmVolVal = document.getElementById('bgm-vol-val');
        if (bgmVolVal) bgmVolVal.textContent = Math.round((cfg.bgmVol ?? 0.3) * 100) + '%';
        set('cfg-bg-opacity', cfg.bgOpacity ?? 0.3);
        const opVal = document.getElementById('bg-opacity-val');
        if (opVal) opVal.textContent = cfg.bgOpacity ?? 0.3;

        // Dynamically build Skill tables
        const heroBody = document.getElementById('hero-skills-tbody');
        const bossBody = document.getElementById('boss-skills-tbody');
        if (heroBody && bossBody) {
            heroBody.innerHTML = '';
            bossBody.innerHTML = '';
            
            const comboPushVal = cfg.snowballPush !== undefined ? cfg.snowballPush : 3;
            const comboTr = document.createElement('tr');
            comboTr.innerHTML = `
                <td><input type="checkbox" id="skill-active-combo_snowball" class="skill-active-chk" ${cfg.snowballPushActive !== false ? 'checked' : ''}></td>
                <td><span class="skill-chip" style="--c:#38BDF8">❄️ Combo Pha Lê</span></td>
                <td><span style="color:#64748B">—</span></td>
                <td><span style="color:#64748B">—</span></td>
                <td><input type="number" id="cfg-snowball-push" class="num-input tiny" value="${comboPushVal}" min="0" max="100" title="Số giây đẩy lùi"></td>
            `;
            heroBody.appendChild(comboTr);

            Object.entries(MASTER_SKILLS).forEach(([id, info]) => {
                // Hero Row
                const heroS = cfg.skills[id] || { qty: 0, duration: info.defaultDur, power: info.defaultPower || 0 };
                const heroTr = document.createElement('tr');
                heroTr.innerHTML = `
                    <td><input type="checkbox" id="skill-active-${id}" class="skill-active-chk" ${heroS.active !== false ? 'checked' : ''}></td>
                    <td><span class="skill-chip" style="--c:${info.color}">${info.icon} ${info.name}</span></td>
                    <td><input type="number" id="skill-qty-${id}" class="num-input tiny" value="${heroS.qty}" min="0" max="10"></td>
                    <td><input type="number" id="skill-dur-${id}" class="num-input tiny" value="${heroS.duration}" min="0" max="60"></td>
                    <td><input type="number" id="skill-power-${id}" class="num-input tiny" value="${heroS.power !== undefined ? heroS.power : (info.defaultPower || 0)}" min="0" max="100"></td>
                `;
                heroBody.appendChild(heroTr);

                // Boss Row
                const bossS = cfg.bossSkills[id] || { qty: 0, duration: info.defaultDur, power: info.defaultPower || 0 };
                const bossTr = document.createElement('tr');
                let extraNote = '';
                if (id === 'thunder_strike') {
                    extraNote = ' <span style="font-size: 0.7em; opacity: 0.8; display: block;">(Choáng 5s + Buff tốc 30%)</span>';
                }
                bossTr.innerHTML = `
                    <td><input type="checkbox" id="boss-skill-active-${id}" class="skill-active-chk" ${bossS.active !== false ? 'checked' : ''}></td>
                    <td><span class="skill-chip" style="--c:${info.color}">${info.icon} ${info.name}${extraNote}</span></td>
                    <td><input type="number" id="boss-skill-qty-${id}" class="num-input tiny" value="${bossS.qty}" min="0" max="10"></td>
                    <td><input type="number" id="boss-skill-dur-${id}" class="num-input tiny" value="${bossS.duration}" min="0" max="60"></td>
                    <td><input type="number" id="boss-skill-power-${id}" class="num-input tiny" value="${bossS.power !== undefined ? bossS.power : (info.defaultPower || 0)}" min="0" max="100"></td>
                `;
                bossBody.appendChild(bossTr);
            });
        }

        // Key bindings
        const keys = cfg.pvpKeys || DEFAULT_CONFIG.pvpKeys;
        Object.entries(keys).forEach(([k, v]) => set(`key-${k}`, v));
        const tkeys = cfg.teamKeys || DEFAULT_CONFIG.teamKeys;
        set('key-team-correct', tkeys.correct);
        set('key-team-wrong', tkeys.wrong);

        // Load grid data
        this.populateGrid();
    },

    collectSettings() {
        const get = (id, fallback) => {
            const el = document.getElementById(id);
            return el ? (el.value || fallback) : fallback;
        };
        const getNum = (id, fallback) => { const v = parseFloat(get(id, fallback)); return isNaN(v) ? fallback : v; };
        const getInt = (id, fallback) => { const v = parseInt(get(id, fallback)); return isNaN(v) ? fallback : v; };

        const cfg = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        cfg.bossTime           = getInt('cfg-boss-time', 120);
        cfg.flashcardCount     = getInt('cfg-flashcard-count', 3);
        cfg.numStudents        = getInt('cfg-num-students', 10);
        cfg.questionMode       = get('cfg-question-mode', 'flashcard');
        cfg.cardDisplay        = get('cfg-card-display', 'both');
        cfg.tickCrossEnabled   = document.getElementById('cfg-tick-cross')?.checked || false;

        // Auto balance fields
        cfg.bossBaseSpeed      = getNum('cfg-boss-base-speed', 1.0);
        cfg.enrageSpeedCap     = getNum('cfg-enrage-cap', 1.5);
        cfg.bossEvolutionClearsMana = document.getElementById('cfg-evo-clear-mana')?.checked ?? true;

        cfg.pvpTurnTime        = getInt('cfg-pvp-turn-time', 10);
        cfg.pvpFreezeTime      = getInt('cfg-pvp-freeze-time', 2);
        cfg.bossRageTime       = getInt('cfg-boss-rage-time', 15);
        cfg.suddenDeathTime    = getInt('cfg-sudden-death-time', 30);
        cfg.suddenDeathRageMult= getInt('cfg-sudden-death-mult', 200);
        cfg.bossEnrageSpeedPercent = getNum('cfg-boss-enrage-speed', 5);
        cfg.bossEvolveSpeedPercent = getNum('cfg-boss-evolve-speed', 15);
        cfg.snowballPush       = getNum('cfg-snowball-push', 3);
        const comboChk = document.getElementById('skill-active-combo_snowball');
        if (comboChk) cfg.snowballPushActive = comboChk.checked;
        cfg.bossThemeId        = get('cfg-boss-theme', '12582594');
        cfg.bossFlip           = document.getElementById('cfg-boss-flip')?.checked || false;
        cfg.heroAvatarId       = get('cfg-hero-avatar', '1');
        cfg.p1AvatarUrl        = get('cfg-p1-avatar', '');
        cfg.p2AvatarUrl        = get('cfg-p2-avatar', '');
        cfg.p1HeroId           = get('cfg-p1-hero-id', '1');
        cfg.p2HeroId           = get('cfg-p2-hero-id', '2');
        cfg.bgmUrl             = get('cfg-bgm-url', '');
        cfg.bgmVol             = getNum('cfg-bgm-vol', 0.3);
        const p1UrlRadio = document.getElementById('cfg-p1-type-url');
        cfg.p1AvatarType       = (p1UrlRadio && p1UrlRadio.checked) ? 'url' : 'hero';
        const p2UrlRadio = document.getElementById('cfg-p2-type-url');
        cfg.p2AvatarType       = (p2UrlRadio && p2UrlRadio.checked) ? 'url' : 'hero';
        cfg.flashAvatar        = document.getElementById('cfg-flash-avatar')?.checked || false;
        
        cfg.bgUrl              = get('cfg-bg-url', '');
        cfg.bgOpacity          = getNum('cfg-bg-opacity', 0.3);

        // ⏱️ Timer mode settings
        cfg.timerBossUrl       = get('cfg-timer-boss-url', '');
        cfg.timerHeroUrl       = get('cfg-timer-hero-url', '');
        cfg.timerTime          = getInt('cfg-timer-time', 120);
        cfg.timerSkillMode     = get('cfg-timer-skill-mode', 'random');

        // Skills
        Object.keys(MASTER_SKILLS).forEach(id => {
            const heroChk = document.getElementById(`skill-active-${id}`);
            if (heroChk) {
                if (!cfg.skills[id]) cfg.skills[id] = {};
                cfg.skills[id].active   = heroChk.checked;
                cfg.skills[id].qty      = getInt(`skill-qty-${id}`, cfg.skills[id].qty || 0);
                cfg.skills[id].duration = getInt(`skill-dur-${id}`, cfg.skills[id].duration || MASTER_SKILLS[id].defaultDur);
                
                const powerInput = document.getElementById(`skill-power-${id}`);
                if (powerInput) {
                    cfg.skills[id].power = getInt(`skill-power-${id}`, 0);
                }
            }

            const bossChk = document.getElementById(`boss-skill-active-${id}`);
            if (bossChk) {
                if (!cfg.bossSkills[id]) cfg.bossSkills[id] = {};
                cfg.bossSkills[id].active   = bossChk.checked;
                cfg.bossSkills[id].qty      = getInt(`boss-skill-qty-${id}`, cfg.bossSkills[id].qty || 0);
                cfg.bossSkills[id].duration = getInt(`boss-skill-dur-${id}`, cfg.bossSkills[id].duration || MASTER_SKILLS[id].defaultDur);
                
                const bossPowerInput = document.getElementById(`boss-skill-power-${id}`);
                if (bossPowerInput) {
                    cfg.bossSkills[id].power = getInt(`boss-skill-power-${id}`, 0);
                }
            }
        });

        cfg.shadowCloneHits = getInt('cfg-shadow-clone-hits', 3);

        // Nếu quiz mode + both → tự động chuyển về 'image'
        if (cfg.questionMode === 'quiz' && cfg.cardDisplay === 'both') {
            cfg.cardDisplay = 'image';
        }

        // Key bindings
        const pvpKeyIds = ['p1A','p1B','p1C','p1D','p1Speed','p1Skill','p2A','p2B','p2C','p2D','p2Speed','p2Skill'];
        pvpKeyIds.forEach(k => { cfg.pvpKeys[k] = get(`key-${k}`, DEFAULT_CONFIG.pvpKeys[k]); });
        cfg.teamKeys.correct = get('key-team-correct', 'ArrowRight');
        cfg.teamKeys.wrong   = get('key-team-wrong', 'ArrowLeft');

        return cfg;
    },

    populateGrid() {
        const tbody = document.getElementById('grid-body');
        if (!tbody) return;
        tbody.innerHTML = '';
        const cards = this.rawCards.length ? this.rawCards : [{id:'', text:'', priority:false}];
        const total = Math.max(10, cards.length + 2);
        for (let i = 0; i < total; i++) {
            const row = cards[i] || { id: '', text: '', priority: false };
            this.addGridRow(tbody, i+1, row);
        }
        this._gridCurrentRows = total;
    },

    addGridRow(tbody, rowNum, data) {
        const tr = document.createElement('tr');
        const idVal = data.id || '';
        const textVal = data.text || '';
        const prioChecked = data.priority ? 'checked' : '';

        tr.innerHTML = `
            <td class="row-num">${rowNum}</td>
            <td class="excel-cell">
                <div class="cell-inner">
                    <input type="text" class="excel-input" data-col="id" data-row="${rowNum}" value="${idVal.replace(/"/g,'&quot;')}" placeholder="image_id">
                    <img src="" class="img-preview hidden" id="prev-${rowNum}">
                </div>
            </td>
            <td class="excel-cell">
                <input type="text" class="excel-input" data-col="text" data-row="${rowNum}" value="${textVal.replace(/"/g,'&quot;')}" placeholder="Question text...">
            </td>
            <td class="excel-cell" style="text-align:center">
                <input type="checkbox" class="grid-priority" data-col="priority" data-row="${rowNum}" ${prioChecked}>
            </td>
        `;
        tbody.appendChild(tr);

        const idInput = tr.querySelector('[data-col="id"]');
        const prevImg = tr.querySelector('.img-preview');
        idInput.addEventListener('input', () => {
            const v = idInput.value.trim();
            if (v) {
                prevImg.src = `images/${v}.png`;
                prevImg.onerror = function() {
                    if (this.src.includes('.png')) this.src = `images/${v}.jpg`;
                    else { this.onerror = null; this.classList.add('hidden'); }
                };
                prevImg.classList.remove('hidden');
            } else {
                prevImg.classList.add('hidden');
            }
        });
        if (idVal) idInput.dispatchEvent(new Event('input'));
    },

    collectGridData() {
        const rows = document.querySelectorAll('#grid-body tr');
        const cards = [];
        rows.forEach(() => {}); // placeholder
        document.querySelectorAll('#grid-body tr').forEach(tr => {
            const idInput   = tr.querySelector('[data-col="id"]');
            const textInput = tr.querySelector('[data-col="text"]');
            const prio      = tr.querySelector('[data-col="priority"]');
            if (!idInput || !textInput) return;
            if (idInput.value.trim() || textInput.value.trim()) {
                cards.push({
                    id:       idInput.value.trim(),
                    text:     textInput.value.trim(),
                    priority: prio ? prio.checked : false,
                });
            }
        });
        return cards;
    },

    saveAndCloseSettings() {
        this.config   = this.collectSettings();
        this.rawCards = this.collectGridData();
        Settings.save(this.config, this.rawCards);
        
        // Auto-save active preset if one is selected
        if (this.state.activePreset) {
            const presetData = {
                bossTime: this.config.bossTime,
                bossBaseSpeed: this.config.bossBaseSpeed,
                bossEnrageSpeedPercent: this.config.bossEnrageSpeedPercent,
                bossEvolveSpeedPercent: this.config.bossEvolveSpeedPercent,
                suddenDeathRageMult: this.config.suddenDeathRageMult,
                suddenDeathTime: this.config.suddenDeathTime,
                bossRageTime: this.config.bossRageTime,
                enrageSpeedCap: this.config.enrageSpeedCap,
                bossEvolutionClearsMana: this.config.bossEvolutionClearsMana
            };
            Settings.savePreset(this.state.activePreset, presetData);
            console.log(`%c💾 Auto-saved preset: ${this.state.activePreset.toUpperCase()}`, 'font-weight:bold; color:#10b981');
        }
        
        this.closeSettings();
        UI.updateBossAvatar();
        UI.updateHeroAvatar(this.config.heroAvatarId || 1);
        
        // Play BGM immediately so user can hear the new URL/volume
        this.playBGM();

        Cards.load(this.rawCards);
        if (this.state.isRunning) {
            const modeStr = (this.state.mode === 'pvp') ? 'mode1' : 'mode2';
            Cards.reset(modeStr);
            this.refillBoard(modeStr, this.state.mode || 'solo');
            UI.renderCards();
        }

        // Rebuild decks to apply changes to future draws in the current game
        Skills.buildDeck(this.config);
        Skills.buildBossDeck(this.config);

        // Clear and redraw hand immediately if game is running so inactive skills are removed
        if (this.state.skillHand) {
            this.state.skillHand = [];
            for (let i = 0; i < 3; i++) {
                const s = Skills.drawHeroSkill();
                if (s) this.state.skillHand.push(s);
            }
            UI.updateSkillsUI(this.state.mode === 'pvp' ? 'p1' : 'solo');
        }
        if (this.state.mode === 'pvp' && this.state.p2SkillHand) {
            this.state.p2SkillHand = [];
            for (let i = 0; i < 3; i++) {
                const s = Skills.drawHeroSkill();
                if (s) this.state.p2SkillHand.push(s);
            }
            UI.updateSkillsUI('p2');
        }
    },

    openSettings() {
        document.getElementById('settings-modal').classList.remove('hidden');
    },

    closeSettings() {
        document.getElementById('settings-modal').classList.add('hidden');
    },

    applyGlobalBackground() {
        const layer = document.getElementById('custom-bg-layer');
        if (!layer) return;
        const url = this.config.bgUrl;
        if (url && url.trim() !== '') {
            layer.style.backgroundImage = `url("${url.trim()}")`;
            layer.style.opacity = this.config.bgOpacity;
        } else {
            layer.style.backgroundImage = 'none';
        }
    },

    // ══════════════════════════════════════════
    // EVENT BINDING
    // ══════════════════════════════════════════
    bindEvents() {
        // Mode select buttons
        document.getElementById('mode-card-solo')?.addEventListener('click', () => this.startGame('solo'));
        document.getElementById('mode-card-pvp')?.addEventListener('click',  () => this.startGame('pvp'));
        document.getElementById('mode-card-timer')?.addEventListener('click', () => this.startGame('timer'));

        // Settings
        document.getElementById('btn-open-settings')?.addEventListener('click', () => this.openSettings());
        document.getElementById('btn-open-settings-game')?.addEventListener('click', () => this.openSettings());
        document.getElementById('btn-close-settings')?.addEventListener('click', () => this.closeSettings());
        document.getElementById('btn-save-settings')?.addEventListener('click',  () => this.saveAndCloseSettings());

        // Balance Presets
        const fillBalanceUI = (b) => {
            const set = (id, val) => { const el = document.getElementById(id); if(el) el.value = val; };
            set('cfg-boss-base-speed', b.bossBaseSpeed);
            set('cfg-enrage-cap', b.enrageSpeedCap);
            set('cfg-boss-enrage-speed', b.bossEnrageSpeedPercent);
            set('cfg-boss-evolve-speed', b.bossEvolveSpeedPercent);
            set('cfg-sudden-death-mult', b.suddenDeathRageMult);
            set('cfg-sudden-death-time', b.suddenDeathTime);
            set('cfg-boss-rage-time', b.bossRageTime);
            const elClear = document.getElementById('cfg-evo-clear-mana');
            if (elClear) elClear.checked = b.bossEvolutionClearsMana;
        };

        const highlightPresetBtn = (diff) => {
            const presetBtns = [document.getElementById('btn-diff-easy'), document.getElementById('btn-diff-normal'), document.getElementById('btn-diff-hard')];
            presetBtns.forEach(btn => {
                if (btn) { btn.style.opacity = '0.6'; btn.style.transform = 'scale(1)'; }
            });
            const clickedBtn = document.getElementById(`btn-diff-${diff}`);
            if (clickedBtn) {
                clickedBtn.style.opacity = '1';
                clickedBtn.style.transform = 'scale(1.1)';
                setTimeout(() => { clickedBtn.style.transform = 'scale(1)'; }, 200);
            }
        };

        const applyPreset = (diff) => {
            const bossTime = parseInt(document.getElementById('cfg-boss-time')?.value) || 120;
            
            // Check if user has a saved preset for this difficulty + bossTime
            const saved = Settings.loadPreset(diff);
            let b;
            if (saved && saved.bossTime === bossTime) {
                b = saved;
                console.log(`%c⚙️ Loaded saved preset: ${diff.toUpperCase()} (${bossTime}s)`, 'font-weight:bold; font-size:14px; color:#10b981');
            } else {
                b = this.calculateBalance(bossTime, diff);
                console.log(`%c⚙️ Calculated preset: ${diff.toUpperCase()} (${bossTime}s)`, 'font-weight:bold; font-size:14px; color:#a855f7');
            }
            console.table({
                'Boss Base Speed': b.bossBaseSpeed,
                'Enrage %/hit': b.bossEnrageSpeedPercent,
                'Evolve %/level': b.bossEvolveSpeedPercent,
                'Enrage Cap': b.enrageSpeedCap,
                'Sudden Death Time (s)': b.suddenDeathTime,
                'Sudden Death Mult (%)': b.suddenDeathRageMult,
                'Boss Rage Time (s)': b.bossRageTime,
                'Clear Mana on Evolve': b.bossEvolutionClearsMana
            });
            
            fillBalanceUI(b);
            highlightPresetBtn(diff);
            this.state.activePreset = diff;
        };

        document.getElementById('btn-diff-easy')?.addEventListener('click', () => applyPreset('easy'));
        document.getElementById('btn-diff-normal')?.addEventListener('click', () => applyPreset('normal'));
        document.getElementById('btn-diff-hard')?.addEventListener('click', () => applyPreset('hard'));

        // Reset button — per-difficulty dialog
        document.getElementById('btn-diff-reset')?.addEventListener('click', () => {
            const dialog = document.getElementById('reset-preset-dialog');
            if (dialog) dialog.classList.remove('hidden');
        });
        // Reset dialog buttons
        ['easy', 'normal', 'hard'].forEach(diff => {
            document.getElementById(`btn-reset-${diff}`)?.addEventListener('click', () => {
                Settings.clearPreset(diff);
                const bossTime = parseInt(document.getElementById('cfg-boss-time')?.value) || 120;
                const b = this.calculateBalance(bossTime, diff);
                fillBalanceUI(b);
                highlightPresetBtn(diff);
                this.state.activePreset = diff;
                document.getElementById('reset-preset-dialog')?.classList.add('hidden');
                console.log(`%c🔄 Reset preset: ${diff.toUpperCase()} → default (${bossTime}s)`, 'font-weight:bold; color:#ef4444');
            });
        });
        document.getElementById('btn-reset-all')?.addEventListener('click', () => {
            Settings.clearAllPresets();
            this.config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
            Settings.save(this.config, this.rawCards);
            this.populateSettings();
            this.state.activePreset = null;
            document.getElementById('reset-preset-dialog')?.classList.add('hidden');
            console.log('%c🔄 Reset ALL presets + config → defaults', 'font-weight:bold; color:#ef4444');
        });
        document.getElementById('btn-reset-cancel')?.addEventListener('click', () => {
            document.getElementById('reset-preset-dialog')?.classList.add('hidden');
        });
        document.getElementById('reset-preset-dialog')?.addEventListener('click', (e) => {
            if (e.target.id === 'reset-preset-dialog') {
                e.target.classList.add('hidden');
            }
        });

        document.getElementById('cfg-boss-time')?.addEventListener('change', (e) => {
            // When boss time changes, recommend them to click a preset if they want auto recalculate
        });

        // Sync Boss Arrival Time input with bossTime config
        document.getElementById('cfg-boss-arrival-time')?.addEventListener('change', (e) => {
            const newTime = parseInt(e.target.value) || 120;
            this.config.bossTime = newTime;
            // Also sync the hidden cfg-boss-time input
            const bossTimeInput = document.getElementById('cfg-boss-time');
            if(bossTimeInput) bossTimeInput.value = newTime;
            this.saveConfig();
        });

        document.getElementById('btn-toggle-grid')?.addEventListener('click', () => {
            const grid = document.getElementById('debug-grid');
            if (!grid) return;
            grid.classList.toggle('active');
            
            if (grid.classList.contains('active') && grid.children.length === 0) {
                const cellSize = 37.8;
                const cols = Math.ceil(window.innerWidth / cellSize);
                const rows = Math.ceil(window.innerHeight / cellSize);
                
                for (let i = 0; i < cols; i++) {
                    const label = document.createElement('div');
                    label.className = 'grid-label-col';
                    label.style.left = (i * cellSize) + 'px';
                    let letter = '';
                    let temp = i;
                    while (temp >= 0) {
                        letter = String.fromCharCode((temp % 26) + 65) + letter;
                        temp = Math.floor(temp / 26) - 1;
                    }
                    label.textContent = letter;
                    grid.appendChild(label);
                }
                
                for (let i = 0; i < rows; i++) {
                    const label = document.createElement('div');
                    label.className = 'grid-label-row';
                    label.style.top = (i * cellSize) + 'px';
                    label.textContent = (i + 1).toString();
                    grid.appendChild(label);
                }
            }
        });

        // Toggle question mode in settings
        document.getElementById('cfg-question-mode')?.addEventListener('change', () => {
            const mode = document.getElementById('cfg-question-mode').value;
            const display = document.getElementById('cfg-card-display');
            const note = document.getElementById('card-display-note');
            
            if (mode === 'quiz') {
                const bothOpt = display.querySelector('option[value="both"]');
                if (bothOpt) bothOpt.disabled = true;
                if (display.value === 'both') display.value = 'image';
                if (note) note.classList.remove('hidden');
            } else {
                const bothOpt = display.querySelector('option[value="both"]');
                if (bothOpt) bothOpt.disabled = false;
                if (note) note.classList.add('hidden');
            }
        });

        // Background live preview
        document.getElementById('cfg-bg-url')?.addEventListener('input', (e) => {
            const layer = document.getElementById('custom-bg-layer');
            const url = e.target.value.trim();
            if (layer) layer.style.backgroundImage = url ? `url("${url}")` : 'none';
        });
        document.getElementById('cfg-bg-opacity')?.addEventListener('input', (e) => {
            const val = e.target.value;
            const opVal = document.getElementById('bg-opacity-val');
            if (opVal) opVal.textContent = val;
            const layer = document.getElementById('custom-bg-layer');
            if (layer) layer.style.opacity = val;
        });

        // In-game controls
        document.getElementById('btn-stop')?.addEventListener('click',   () => this.stopGame());
        document.getElementById('btn-pause')?.addEventListener('click',  () => this.togglePause());

        // Tick/Cross overlay
        document.getElementById('btn-tick')?.addEventListener('click', () => this.handleManualTick(true));
        document.getElementById('btn-cross')?.addEventListener('click', () => this.handleManualTick(false));
        
        document.getElementById('btn-cheat')?.addEventListener('click', () => {
            this.state.cheatMode = !this.state.cheatMode;
            const icon = document.getElementById('cheat-icon');
            if (icon) {
                icon.style.filter = this.state.cheatMode ? 'none' : 'grayscale(100%)';
                icon.style.transform = this.state.cheatMode ? 'scale(1.2)' : 'scale(1)';
            }
            if (this.state.cheatMode) {
                this.state.mana = 999;
                while (this.state.skillHand.length < 3) {
                    const s = Skills.drawHeroSkill();
                    if (s) this.state.skillHand.push(s);
                    else break;
                }
                UI.updateMana('solo');
                UI.updateSkillsUI('solo');
            }
            UI.renderCards();
        });

        // Card clicks
        document.querySelectorAll('.card').forEach((card, idx) => {
            card.addEventListener('click', () => {
                if (this.state.mode === 'pvp') {
                    const parent = card.closest('.pvp-cards-stack');
                    const pvpIdx = parent ? Array.from(parent.children).indexOf(card) : 0;
                    if (this.state.pvpTurn === 1) this.handlePvPKeyAnswer(1, pvpIdx);
                    else this.handlePvPKeyAnswer(2, pvpIdx);
                } else if (this.state.mode === 'solo' || this.state.mode === 'team') {
                    this.handleCardCorrect(idx, 'solo');
                }
            });
        });

        // Reroll buttons (Wrong)
        document.querySelectorAll('.reroll-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Ngăn bubble lên .card
                const idx = parseInt(btn.id.replace('reroll-', '')) - 1; // reroll-1 → index 0
                if (this.state.mode === 'solo' || this.state.mode === 'team') {
                    this.handleCardWrong(idx, 'solo');
                }
            });
        });

        // Quiz option clicks
        document.querySelectorAll('.quiz-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.dataset.idx);
                if (this.state.mode === 'pvp') {
                    if (this.state.pvpTurn === 1) this.handlePvPKeyAnswer(1, idx);
                    else this.handlePvPKeyAnswer(2, idx);
                } else if (this.state.mode === 'solo') {
                    const isCorrect = Cards.quizChoices[idx] === Cards.quizQuestion;
                    if (isCorrect) this.handleCardCorrect(idx, 'solo');
                    else this.handleCardWrong(idx, 'solo');
                }
            });
        });

        // Result screen
        document.getElementById('btn-save-score')?.addEventListener('click', () => this.saveScore());
        document.getElementById('btn-play-again')?.addEventListener('click', () => {
            document.getElementById('result-overlay').classList.add('hidden');
            document.getElementById('result-input-state').classList.remove('hidden');
            document.getElementById('result-board-state').classList.add('hidden');
            this.showModeSelect();
        });
        document.getElementById('btn-export-csv')?.addEventListener('click',  () => Settings.exportLbCSV());
        document.getElementById('btn-clear-lb')?.addEventListener('click',    () => {
            UI.showAlert('Xóa toàn bộ Bảng Xếp Hạng?', 'confirm', () => {
                Settings.clearLeaderboard();
                UI.renderLeaderboard();
            });
        });

        // Settings tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(btn.dataset.target)?.classList.add('active');
            });
        });

        // Auto-fill ID
        document.getElementById('btn-auto-id')?.addEventListener('click', () => {
            const from = parseInt(document.getElementById('auto-id-from')?.value);
            const to   = parseInt(document.getElementById('auto-id-to')?.value);
            if (isNaN(from) || isNaN(to) || from > to) { UI.showAlert('Khoảng số không hợp lệ!'); return; }
            const tbody = document.getElementById('grid-body');
            const rows = tbody.querySelectorAll('tr');
            let rowIdx = 0;
            for (let id = from; id <= to; id++) {
                if (rowIdx < rows.length) {
                    const inp = rows[rowIdx].querySelector('[data-col="id"]');
                    if (inp) { inp.value = id; inp.dispatchEvent(new Event('input')); }
                } else {
                    this.addGridRow(tbody, tbody.children.length + 1, { id: String(id), text: '', priority: false });
                }
                rowIdx++;
            }
            this._gridCurrentRows = tbody.children.length;
        });

        // Clear grid
        document.getElementById('btn-clear-data')?.addEventListener('click', () => {
            UI.showAlert('Xóa toàn bộ dữ liệu?', 'confirm', () => {
                this.rawCards = [];
                this.populateGrid();
            });
        });

        // Grid paste
        document.getElementById('data-grid')?.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = (e.clipboardData || window.clipboardData).getData('Text');
            if (!text) return;
            const activeEl = document.activeElement;
            if (!activeEl?.classList.contains('excel-input')) return;
            const startRow = parseInt(activeEl.dataset.row);
            const startCol = activeEl.dataset.col;
            const tbody = document.getElementById('grid-body');
            const rows = text.split(/\r?\n/).filter(r => r.trim());
            rows.forEach((rowText, ri) => {
                const cells = rowText.split('\t');
                const rowNum = startRow + ri;
                if (rowNum > tbody.querySelectorAll('tr').length) {
                    this.addGridRow(tbody, rowNum, { id:'', text:'', priority:false });
                }
                const idInp   = tbody.querySelector(`[data-col="id"][data-row="${rowNum}"]`);
                const txtInp  = tbody.querySelector(`[data-col="text"][data-row="${rowNum}"]`);
                if (startCol === 'id' && cells[0]) { if(idInp) { idInp.value = cells[0]; idInp.dispatchEvent(new Event('input')); } }
                if (startCol === 'id' && cells[1]) { if(txtInp) txtInp.value = cells[1]; }
                if (startCol === 'text' && cells[0]) { if(txtInp) txtInp.value = cells[0]; }
            });
        });

        const handleMicClick = () => {
            if (Speech.isListening) {
                Speech.stopListening();
            } else {
                Speech.startListening(
                    (transcript) => {
                        const tr = transcript.toLowerCase();

                        // Solo & PvP mode
                        let slot = -1;
                        if (this.config.questionMode === 'quiz') {
                            // Quiz mode: A, B, C, D
                            if (tr.includes('a') || tr.includes('một') || tr.includes('1') || tr.includes('one')) slot = 0;
                            else if (tr.includes('b') || tr.includes('hai') || tr.includes('2') || tr.includes('two')) slot = 1;
                            else if (tr.includes('c') || tr.includes('ba') || tr.includes('3') || tr.includes('three')) slot = 2;
                            else if (tr.includes('d') || tr.includes('bốn') || tr.includes('4') || tr.includes('four')) slot = 3;
                        } else {
                            // Flashcard mode: Match exactly the word on the card (text or id)
                            for (let i = 0; i < 3; i++) {
                                const card = Cards.active[i];
                                if (!card) continue;
                                const textMatch = card.text && tr.includes(card.text.toLowerCase().trim());
                                const idMatch = card.id && tr.includes(card.id.toLowerCase().replace('.png','').replace('.jpg','').trim());
                                if (textMatch || idMatch) {
                                    slot = i;
                                    break;
                                }
                            }
                        }

                        if (slot !== -1) {
                            // If they selected a valid slot, they answered correctly
                            if (this.state.mode === 'pvp') {
                                this.handlePvPAnswer(this.state.pvpTurn, slot, true); // Assuming voice picks the correct card
                            } else {
                                this.handleCardCorrect(slot, 'solo');
                            }
                        } else {
                            // If they say something like 'sai' or 'bỏ qua', mark wrong
                            if (tr.includes('sai') || tr.includes('wrong') || tr.includes('bỏ qua') || tr.includes('pass')) {
                                if (this.state.mode === 'pvp') this.handlePvPBothWrong();
                                else this.handleCardWrong(0, 'solo'); // Just reroll card 1 as a penalty
                            }
                        }
                    },
                    null
                );
            }
        };

        document.getElementById('btn-mic')?.addEventListener('click', handleMicClick);
        document.getElementById('btn-mic-global')?.addEventListener('click', handleMicClick);

        // Quản trò keyboard (dùng cho Timer mode): bấm Đúng/Sai
        const handleModKey = (e) => {
            if (!this.state.isRunning || this.state.mode !== 'timer' || this.state.isGameOver) return;
            const keys = this.config.teamKeys || DEFAULT_CONFIG.teamKeys;
            if (e.key === keys.correct) this.handleManualTick(true);
            else if (e.key === keys.wrong) this.handleManualTick(false);
        };
        document.addEventListener('keydown', handleModKey);

        // Boss avatar preview
        document.getElementById('cfg-boss-theme')?.addEventListener('input', () => {
            UI.updateBossAvatar();
        });
        document.getElementById('cfg-hero-avatar')?.addEventListener('input', () => {
            const val = document.getElementById('cfg-hero-avatar').value;
            UI.updateHeroAvatar(val, 'solo');
            const preview = document.getElementById('hero-avatar-preview');
            if (preview) {
                preview.src = `Hero/${val}.png`;
                preview.onerror = function() {
                    if (this.src.includes('.png')) this.src = `Hero/${val}.jpg`;
                    else { this.onerror = null; this.src = `https://placehold.co/40x40/1E3A8A/F6C90E?text=${val}`; }
                };
            }
        });
        document.getElementById('cfg-p1-hero-id')?.addEventListener('input', () => {
            const val = document.getElementById('cfg-p1-hero-id').value;
            const preview = document.getElementById('p1-hero-preview');
            if (preview) {
                preview.src = `Hero/${val}.png`;
                preview.onerror = function() {
                    if (this.src.includes('.png')) this.src = `Hero/${val}.jpg`;
                    else { this.onerror = null; this.src = `https://placehold.co/40x40/1E3A8A/F6C90E?text=${val}`; }
                };
            }
        });
        document.getElementById('cfg-p2-hero-id')?.addEventListener('input', () => {
            const val = document.getElementById('cfg-p2-hero-id').value;
            const preview = document.getElementById('p2-hero-preview');
            if (preview) {
                preview.src = `Hero/${val}.png`;
                preview.onerror = function() {
                    if (this.src.includes('.png')) this.src = `Hero/${val}.jpg`;
                    else { this.onerror = null; this.src = `https://placehold.co/40x40/1E3A8A/F6C90E?text=${val}`; }
                };
            }
        });
    },


    refillBoard(modeString, playerContext) {
        if (this.config.questionMode === 'quiz') {
            Cards.fillBoardQuiz(modeString, () => UI.renderCards());
        } else {
            Cards.fillBoard(modeString, () => UI.renderCards());
        }
    },

    // ══════════════════════════════════════════
    // BACKGROUND MUSIC
    // ══════════════════════════════════════════
    playBGM() {
        this.stopBGM();
        let url = this.config && this.config.bgmUrl ? this.config.bgmUrl.trim() : '';
        if (!url) {
            url = './sounds/bgm.mp3';
        }
        
        const vol = this.config.bgmVol ?? 0.3;
        
        this._bgmAudio = new Audio(url);
        this._bgmAudio.loop = true;
        this._bgmAudio.volume = vol;
        this._bgmAudio.onerror = () => {
            if (url === './sounds/bgm.mp3') {
                this._bgmAudio = new Audio('./sounds/Background_music.mp3');
                this._bgmAudio.loop = true;
                this._bgmAudio.volume = vol;
                this._bgmAudio.onerror = null;
                this._bgmAudio.play().catch(e => console.warn('BGM play blocked:', e));
            }
        };
        this._bgmAudio.play().catch(e => console.warn('BGM play blocked:', e));
    },

    stopBGM() {
        if (this._bgmAudio) {
            this._bgmAudio.pause();
            this._bgmAudio.currentTime = 0;
            this._bgmAudio = null;
        }
    }
};

// ══════════════════════════════════════════════════════
// Bootstrap
// ══════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});









