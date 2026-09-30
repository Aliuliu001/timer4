// ============================================================
// MAGIC REALM BATTLE - settings.js
// Save/Load settings & card data from localStorage
// ============================================================

const Settings = {
    CONFIG_KEY:  'mrb_config',
    CARDS_KEY:   'mrb_cards',
    LB_KEY:      'mrb_leaderboard',
    PRESETS_KEY: 'mrb_presets_v3',

    save(config, cards) {
        localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));
        localStorage.setItem(this.CARDS_KEY,  JSON.stringify(cards));
    },

    loadConfig() {
        try {
            const raw = localStorage.getItem(this.CONFIG_KEY);
            if (!raw) return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
            return Object.assign(JSON.parse(JSON.stringify(DEFAULT_CONFIG)), JSON.parse(raw));
        } catch(e) { return JSON.parse(JSON.stringify(DEFAULT_CONFIG)); }
    },

    loadCards() {
        try {
            const raw = localStorage.getItem(this.CARDS_KEY);
            if (!raw) return [];
            return JSON.parse(raw);
        } catch(e) { return []; }
    },

    saveLeaderboard(entry) {
        let lb = this.loadLeaderboard();
        lb.push(entry);
        lb.sort((a, b) => b.score - a.score);
        localStorage.setItem(this.LB_KEY, JSON.stringify(lb));
    },

    loadLeaderboard() {
        try { return JSON.parse(localStorage.getItem(this.LB_KEY) || '[]'); }
        catch(e) { return []; }
    },

    clearLeaderboard() {
        localStorage.removeItem(this.LB_KEY);
    },

    exportLbCSV() {
        const lb = this.loadLeaderboard();
        if (!lb.length) return;
        let csv = '\uFEFFRank,Name,Correct,Wrong,Score\n';
        lb.forEach((r, i) => {
            csv += `${i+1},"${(r.name||'').replace(/"/g,'""')}",${r.correct},${r.wrong},${r.score}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'MagicBattle_Leaderboard.csv';
        link.click();
    },

    // ── Per-Difficulty Preset Persistence ──

    /** Load all saved presets { easy: {...}, normal: {...}, hard: {...} } */
    loadAllPresets() {
        try { return JSON.parse(localStorage.getItem(this.PRESETS_KEY) || '{}'); }
        catch(e) { return {}; }
    },

    /** Save a single preset slot. data should include bossTime + all balance fields */
    savePreset(difficulty, data) {
        const all = this.loadAllPresets();
        all[difficulty] = data;
        localStorage.setItem(this.PRESETS_KEY, JSON.stringify(all));
    },

    /** Load a single preset. Returns null if not found */
    loadPreset(difficulty) {
        const all = this.loadAllPresets();
        return all[difficulty] || null;
    },

    /** Clear a single preset slot */
    clearPreset(difficulty) {
        const all = this.loadAllPresets();
        delete all[difficulty];
        localStorage.setItem(this.PRESETS_KEY, JSON.stringify(all));
    },

    /** Clear all presets */
    clearAllPresets() {
        localStorage.removeItem(this.PRESETS_KEY);
    },
};
