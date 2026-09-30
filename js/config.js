// ============================================================
// MAGIC REALM BATTLE - config.js
// Default configuration & constants
// ============================================================

const DEFAULT_CONFIG = {
    // Game basics
    gameMode: 'solo',         // 'solo' | 'pvp' | 'timer'
    questionMode: 'flashcard', // 'flashcard' | 'quiz'

    // Boss / Distance
    bossTime: 120,            // seconds for boss to reach hero
    bossBaseSpeed: 1.0,       // steps per second
    bossFlip: false,          // flip boss horizontally
    bossEnrageSpeedPercent: 5, // % speed increase per hit

    // Global Background
    bgUrl: '',
    bgOpacity: 0.3,

    // Students (for Solo mode avatars)
    numStudents: 10,          // load Hero/1.png -> Hero/N.png

    // PvP settings
    pvpTurnTime: 10,         // seconds per turn (flashcard PvP)
    pvpFreezeTime: 2,        // seconds frozen after wrong answer
    // Default key bindings
    pvpKeys: {
        p1A: 'q', p1B: 'w', p1C: 'e', p1D: 'r',
        p1Speed: '5', p1Skill: '6',
        p2A: 'u', p2B: 'i', p2C: 'o', p2D: 'p',
        p2Speed: '[', p2Skill: ']',
    },

    // Quản trò keys (dùng cho Timer mode: bấm Đúng/Sai)
    teamKeys: {
        correct: 'ArrowRight',
        wrong: 'ArrowLeft',
    },

    // Timer mode settings
    timerTime: 120,           // tổng thời gian đếm ngược (giây)
    timerHeroUrl: '',         // link ảnh Hero kiểu Boss (Pinterest/Google), rỗng = placeholder
    timerSkillMode: 'random', // 'random' | 'buffet'

    // Boss rage & Sudden Death (Solo Mode)
    bossRageTime: 15,         // seconds for boss rage bar to fill
    suddenDeathTime: 30,      // when remaining time <= this, sudden death starts
    suddenDeathRageMult: 200, // % multiplier for boss rage speed during sudden death
    bossDashSteps: 15,        // steps forward for Dash Forward
    enrageSpeedCap: 1.5,      // max multiplier for enrage
    bossEvolutionClearsMana: true, // does boss evolution wipe player mana?

    // Hero Skills (qty & duration in seconds)
    skills: {
        ice_freeze:     { qty: 2, duration: 5,  power: 0,  cost: 5 },
        fire_blast:     { qty: 2, duration: 4,  power: 8,  cost: 5 },
        thunder_strike: { qty: 2, duration: 5,  power: 10, cost: 5 },
        dark_curse:     { qty: 0, duration: 5,  power: 0,  cost: 5 },
        shadow_clone:   { qty: 0, duration: 0,  power: 0,  cost: 5 },
        dash_forward:   { qty: 0, duration: 3,  power: 10, cost: 5 },
        kamehameha:     { qty: 1, duration: 0,  power: 10, cost: 5 },
        meteor_shower:  { qty: 1, duration: 0,  power: 10, cost: 5 },
        fireball:       { qty: 1, duration: 0,  power: 8,  cost: 5 },
        tornado_classic:{ qty: 1, duration: 2,  power: 0,  cost: 5 },
        deep_freeze:    { qty: 1, duration: 4,  power: 0,  cost: 5 },
        shuriken:       { qty: 1, duration: 10, power: 10, cost: 5 },
    },

    // Snowball push strength
    snowballPush: 3,          // base steps per correct answer

    // Boss Skills (qty & duration)
    bossSkills: {
        ice_freeze:     { qty: 0, duration: 5,  power: 0  },
        fire_blast:     { qty: 0, duration: 4,  power: 8  },
        thunder_strike: { qty: 0, duration: 5,  power: 10 },
        dark_curse:     { qty: 2, duration: 5,  power: 0  },
        shadow_clone:   { qty: 2, duration: 0,  power: 0  },
        dash_forward:   { qty: 2, duration: 3,  power: 10 },
        kamehameha:     { qty: 0, duration: 0,  power: 10 },
        meteor_shower:  { qty: 0, duration: 0,  power: 10 },
        fireball:       { qty: 0, duration: 0,  power: 8  },
        tornado_classic:{ qty: 0, duration: 2,  power: 0  },
        deep_freeze:    { qty: 0, duration: 4,  power: 0  },
        shuriken:       { qty: 0, duration: 10, power: 10 },
    },

    // PvP Speed Curse
    pvpSpeedCurseDuration: 5,  // seconds enemy boss is sped up
    pvpSpeedCurseBoost: 1.5,   // 50% speed boost

    // Shadow Clone hits to destroy
    shadowCloneHits: 3,

    // Card display
    cardDisplay: 'both',      // 'both' | 'image' | 'text'

    // ⏱️ Timer mode settings
    timerBossUrl: '',         // link ảnh Boss riêng cho Timer
    timerHeroUrl: '',         // link ảnh Hero riêng cho Timer (giống Boss)
    timerTime: 120,           // thời gian đếm ngược (giây)
    timerSkillMode: 'random', // 'random' | 'buffet'
};

const MASTER_SKILLS = {
    ice_freeze:     { icon: '❄️', name: 'Ice Freeze',     color: '#22D3EE', defaultDur: 5,  type: 'Hero' },
    fire_blast:     { icon: '🔥', name: 'Fire Blast',      color: '#F97316', defaultDur: 4,  type: 'Hero' },
    thunder_strike: { icon: '⚡', name: 'Thunder Strike',  color: '#FBBF24', defaultDur: 5,  type: 'Hero' },
    dark_curse:     { icon: '💀', name: 'Dark Curse',      color: '#7C3AED', defaultDur: 5,  type: 'Boss' },
    shadow_clone:   { icon: '👿', name: 'Shadow Clone',    color: '#7C3AED', defaultDur: 0,  type: 'Boss' },
    dash_forward:   { icon: '🚀', name: 'Dash Forward',    color: '#F59E0B', defaultDur: 15, type: 'Boss' },
    kamehameha:     { icon: '☄️', name: 'Kamehameha',      color: '#3B82F6', defaultDur: 0,  type: 'Hero' },
    meteor_shower:  { icon: '🌠', name: 'Meteor Shower',   color: '#EF4444', defaultDur: 0,  type: 'Hero' },
    fireball:       { icon: '🔥', name: 'Fireball',        color: '#F97316', defaultDur: 0,  type: 'Hero' },
    tornado_classic:{ icon: '🌪️', name: 'Tornado',         color: '#6B7280', defaultDur: 2,  type: 'Hero' },
    deep_freeze:    { icon: '🧊', name: 'Deep Freeze',     color: '#22D3EE', defaultDur: 4,  type: 'Hero' },
    shuriken:       { icon: '🥷', name: 'Shuriken',        color: '#10B981', defaultDur: 10, type: 'Hero' },
};

