// ============================================================
// MAGIC REALM BATTLE - cards.js
// Card management: shuffle, draw, flashcard & quiz
// ============================================================

const Cards = {
    valid: [],       // all valid cards from settings
    available: [],   // remaining cards to draw
    wrong: [],       // wrong cards (retry pile)
    active: [null, null, null], // 3 slots on board for flashcard mode
    quizQuestion: null,
    quizChoices: [], // 4 choices for quiz mode

    load(rawCards) {
        this.valid = [];
        rawCards.forEach(r => {
            if (r.id.trim() !== '' || r.text.trim() !== '') {
                this.valid.push({ id: r.id, text: r.text, priority: !!r.priority });
                if (r.priority) { // priority cards appear 3x
                    this.valid.push({ id: r.id, text: r.text, priority: true });
                    this.valid.push({ id: r.id, text: r.text, priority: true });
                }
            }
        });
        if (this.valid.length === 0) {
            // Default sample cards: auto-generate 1.png to 52.png
            this.valid = [];
            for (let i = 1; i <= 52; i++) {
                this.valid.push({ id: `${i}.png`, text: '', priority: false });
            }
        }
    },

    reset(gameMode) {
        this.available = this.shuffle([...this.valid]);
        if (gameMode === 'mode3' || gameMode === 'mode4') {
            this.available = [...this.valid]; // sequential
        }
        this.wrong = [];
        const count = typeof Game !== 'undefined' ? (Game.config.flashcardCount || 3) : 3;
        this.active = new Array(count).fill(null);
        this.quizQuestion = null;
        this.quizChoices = [];
    },

    shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    },

    // Draw 1 card from available (or wrong pile if empty)
    draw(gameMode) {
        if (this.available.length === 0) {
            if (this.wrong.length > 0) {
                this.available = [...this.wrong];
                this.wrong = [];
            } else {
                this.available = [...this.valid];
            }
            if (gameMode === 'mode1' || gameMode === 'mode2') {
                this.shuffle(this.available);
            }
        }

        if (this.available.length === 0) return null;

        if (gameMode === 'mode1' || gameMode === 'mode2') {
            return this.available.splice(Math.floor(Math.random() * this.available.length), 1)[0];
        } else {
            return this.available.shift();
        }
    },

    // Fill empty board slots
    fillBoard(gameMode, renderFn) {
        let filled = false;
        for (let i = 0; i < this.active.length; i++) {
            if (!this.active[i]) {
                const card = this.draw(gameMode);
                if (card) { this.active[i] = card; filled = true; }
            }
        }
        if (filled && renderFn) renderFn();
        return filled;
    },

    fillBoardQuiz(gameMode, renderFn) {
        if (!this.quizQuestion) {
            const displayMode = typeof Game !== 'undefined' ? Game.config.cardDisplay : 'both';
            let foundValid = false;
            let attempts = 0;
            while (!foundValid && attempts < 100) {
                this.quizQuestion = this.draw(gameMode);
                if (!this.quizQuestion) return false; // empty
                attempts++;
                
                // Ensure question is valid for the display mode
                if (displayMode === 'image' && (!this.quizQuestion.text || this.quizQuestion.text.trim() === '')) {
                    this.wrong.push(this.quizQuestion); // Put back to wrong pile and try again
                    continue;
                }
                if (displayMode === 'text' && (!this.quizQuestion.id || this.quizQuestion.id.trim() === '')) {
                    this.wrong.push(this.quizQuestion);
                    continue;
                }
                if (displayMode === 'both' && (!this.quizQuestion.text || this.quizQuestion.text.trim() === '' || !this.quizQuestion.id || this.quizQuestion.id.trim() === '')) {
                    this.wrong.push(this.quizQuestion);
                    continue;
                }
                foundValid = true;
            }

            // Generate 3 wrong choices
            // Filter out the correct answer, and also filter out cards that lack the needed display property
            let otherValid = this.valid.filter(c => c.id !== this.quizQuestion.id);
            
            // Đảm bảo đáp án luôn có nội dung hiển thị
            if (displayMode === 'image') {
                // Câu hỏi = ẢNH, Đáp án = CHỮ → lọc đáp án phải có text
                otherValid = otherValid.filter(c => c.text && c.text.trim() !== '');
            } else if (displayMode === 'text') {
                // Câu hỏi = CHỮ, Đáp án = ẢNH → lọc đáp án phải có id (ảnh)
                otherValid = otherValid.filter(c => c.id && c.id.trim() !== '');
            } else {
                // 'both' → mỗi đáp án phải có cả text VÀ id
                otherValid = otherValid.filter(c => (c.text && c.text.trim() !== '') && (c.id && c.id.trim() !== ''));
            }

            // Loại bỏ trùng lặp (vì priority cards xuất hiện 3 lần)
            const seen = new Set();
            otherValid = otherValid.filter(c => {
                const key = c.id + '|' + c.text;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });

            this.shuffle(otherValid);
            
            // If less than 3 other cards exist, just duplicate the first one (edge case)
            while (otherValid.length < 3) {
                if (otherValid.length > 0) {
                    otherValid.push(otherValid[0]);
                } else {
                    otherValid.push({ id: 'dummy', text: 'dummy' });
                }
            }

            this.quizChoices = [
                this.quizQuestion,
                otherValid[0],
                otherValid[1],
                otherValid[2]
            ];
            this.shuffle(this.quizChoices);
            this.quizQuestion.correctIndex = this.quizChoices.indexOf(this.quizQuestion);
            if (renderFn) renderFn();
            return true;
        }
        return false;
    },

    answerCorrect(i, gameMode) {
        const wasQuiz = !!this.quizQuestion;
        if (this.quizQuestion) this.quizQuestion = null;
        this.active[i] = null;
        return this.isDeckEmpty(wasQuiz);
    },

    // Handle wrong answer for slot i
    answerWrong(i, gameMode) {
        if (this.quizQuestion) {
            if (['mode2','mode3','mode4'].includes(gameMode)) {
                this.wrong.push(this.quizQuestion);
            }
            this.quizQuestion = null;
        } else {
            const card = this.active[i];
            if (card && ['mode2','mode3','mode4'].includes(gameMode)) {
                this.wrong.push(card);
            }
            this.active[i] = null;
        }
        return this.isDeckEmpty(!!this.quizQuestion);
    },

    isDeckEmpty(isQuiz = false) {
        if (isQuiz) {
            return !this.quizQuestion && this.available.length === 0;
        }
        const count = (window.Game && window.Game.config && window.Game.config.flashcardCount) || 3;
        return this.active.slice(0, count).every(c => !c) && this.available.length === 0;
    },

    // Reload when all done (infinite modes)
    reload() {
        this.available = this.shuffle([...this.valid]);
        this.wrong = [];
    },
};
