// ============================================================
// MAGIC REALM BATTLE - ui.js
const UI = {
    // ──────────────── BOSS TRACK ────────────────
    renderMilestones() {
        const arenas = document.querySelectorAll('.solo-arena');
        arenas.forEach(arena => {
            // Remove existing milestones
            arena.querySelectorAll('.milestone-item').forEach(m => m.remove());
            
            // Add at 75%, 50%, 25% boss position.
            [25, 50, 75].forEach(pct => {
                const physicalLeft = 15 + (pct / 100) * 60;
                const m = document.createElement('div');
                m.className = 'milestone-item';
                m.dataset.level = pct === 75 ? 1 : (pct === 50 ? 2 : 3);
                m.style.position = 'absolute';
                m.style.left = `calc(${physicalLeft}% + 80px)`;
                m.style.top = '50%';
                m.style.transform = 'translate(-50%, -50%)';
                m.style.opacity = '0.9';
                m.style.zIndex = '5';
                m.innerHTML = `<img src="./assets/power_up.gif" onerror="this.onerror=null; this.outerHTML='<span style=\\'font-size:30px; filter:drop-shadow(0 0 5px rgba(255,255,255,0.8))\\'>😈</span>';" style="width: 50px; height: 50px; object-fit: contain; filter: drop-shadow(0 0 5px rgba(255,255,255,0.8));">`;
                arena.appendChild(m);
            });
        });
    },

    removeMilestoneItem(level) {
        document.querySelectorAll(`.milestone-item[data-level="${level}"]`).forEach(m => m.remove());
    },

    updateBossTrack(player) {
        const p = player || 'solo';
        const bossState = (p === 'p2') ? Game.state.p2Boss
                        : (p === 'p1') ? Game.state.p1Boss
                        : Game.state.boss;
        if (Game.state.mode === 'pvp') {
            const maxPos = Game.config.bossTime * (Game.config.bossBaseSpeed || 1);
            // In PvP, 'bossState' actually represents the player's progress (p1Boss/p2Boss)
            // But they start at maxPos and go to 0. So progress = (maxPos - position) / maxPos
            const progressPct = Math.max(0, Math.min(100, ((maxPos - bossState.position) / maxPos) * 100));
            const heroEl = document.getElementById('hero-avatar-box-' + p);
            if (heroEl) {
                // Move from 5% (start) to 45% (center)
                const targetPct = 5 + (progressPct / 100) * 40;
                if (p === 'p1') {
                    heroEl.style.left = targetPct + '%';
                    heroEl.style.right = 'auto';
                } else {
                    heroEl.style.right = targetPct + '%';
                    heroEl.style.left = 'auto';
                }
            }
        } else {
            const maxPos = Game.config.bossTime * (Game.config.bossBaseSpeed || 1);
            const pct = Math.max(0, Math.min(100, (bossState.position / maxPos) * 100));
            const suffix = Game.state.mode === 'team' ? '-team' : (p === 'solo' ? '' : (p === 'p2' ? '-p2' : '-p1'));
            const bossEl = document.getElementById('boss-avatar-box' + suffix);
            
            if (bossEl) {
                // Hero is at ~5%. Boss starts at ~72%, we want it to stop right in front of Hero at ~15%
                const leftPct = 15 + (pct / 100) * 60;
                bossEl.style.right = 'auto'; // ensure right is overridden if set in css
                bossEl.style.left = leftPct + '%';

                // Urgency glow & Sudden death
                if (pct <= 20) {
                    bossEl.classList.add('boss-sudden-death');
                    bossEl.style.filter = ''; // Let CSS animation take over
                } else {
                    bossEl.classList.remove('boss-sudden-death');
                    if (pct < 25) {
                        bossEl.style.filter = 'drop-shadow(0 0 20px rgba(239,68,68,0.7))';
                    } else {
                        bossEl.style.filter = 'drop-shadow(0 0 14px rgba(239,68,68,0.3))';
                    }
                }
            }
        }

        // Timer bar + text (common)
        const timerBar  = document.getElementById('timer-bar');
        const timerText = document.getElementById('timer-text');
        if (timerBar) {
            const timePct = Math.max(0, (Game.state.timeRemaining / Game.config.bossTime) * 100);
            timerBar.style.width = timePct + '%';
        }
        if (timerText && Game.state.timeRemaining !== undefined) {
            const m = Math.floor(Game.state.timeRemaining / 60).toString().padStart(2, '0');
            const s = (Game.state.timeRemaining % 60).toString().padStart(2, '0');
            timerText.textContent = `${m}:${s}`;
        }
    },

    // ──────────────── MANA ────────────────
    updateMana(player) {
        const p = player || 'solo';
        const mana = (p === 'p2') ? Game.state.p2Mana : Game.state.mana;
        const suffix = Game.state.mode === 'team' ? '-team' : (p === 'p2' ? '-p2' : (p === 'p1' ? '-p1' : ''));

        const manaFill = document.getElementById('mana-fill' + suffix);
        const manaText = document.getElementById('mana-text' + suffix);
        if (manaFill) manaFill.style.height = `${(mana / 10) * 100}%`;
        if (manaText) manaText.textContent = mana;

        this.updateSkillsUI(p);
    },

    // ──────────────── RAGE (PVP) ────────────────
    updateRage(player) {
        const p = player || 'p1';
        const rage = (p === 'p2') ? Game.state.p2Rage : Game.state.p1Rage;
        const suffix = p === 'p2' ? '-p2' : '-p1';

        const rageBar = document.getElementById('racer-rage-bar' + suffix);
        if (rageBar) {
            rageBar.style.width = `${Math.min(100, Math.max(0, rage))}%`;
            if (rage >= 100) {
                rageBar.style.boxShadow = '0 0 10px #ef4444';
            } else {
                rageBar.style.boxShadow = 'none';
            }
        }
    },

    // ──────────────── COMBO ────────────────
    updateCombo(player) {
        const p = player || 'solo';
        const combo = (p === 'p2') ? Game.state.p2Combo : Game.state.combo;
        const suffix = Game.state.mode === 'team' ? '-team' : (p === 'p2' ? '-p2' : (p === 'p1' ? '-p1' : ''));

        const containerSelector = suffix ? '.combo-diamond-container.' + suffix.replace('-', '') : '.combo-diamond-container:not(.p1):not(.p2):not(.team)';
        const container = document.querySelector(containerSelector);
        const isCharging = combo >= 4;

        if (container) {
            const dots = container.querySelectorAll('.combo-dot');
            const fusionCrystal = container.querySelector('.combo-fusion-crystal');
            
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i < combo);
            });
            
            container.classList.toggle('aura-active', combo >= 4);
            container.classList.toggle('fusion-active', combo >= 5);
            
            if (fusionCrystal) {
                fusionCrystal.classList.toggle('active', combo >= 5);
            }
        }

        const comboText = document.getElementById('combo-text' + suffix);
        if (comboText) {
            comboText.textContent = combo >= 5 ? '💥 MAX COMBO!' : (combo > 0 ? `COMBO x${combo}` : '');
            comboText.className = 'combo-label' + (combo >= 5 ? ' max' : '');
            if (isCharging) comboText.classList.add('charging-text');
        }
    },

    // ──────────────── SKILLS UI ────────────────
    updateSkillsUI(player) {
        const p = player || 'solo';
        const mana = (p === 'p2') ? Game.state.p2Mana : Game.state.mana;
        const suffix = Game.state.mode === 'team' ? '-team' : (p === 'p2' ? '-p2' : (p === 'p1' ? '-p1' : ''));
        const container = document.getElementById('hero-skills' + suffix);
        if (!container) return;

        container.innerHTML = '';
        const hand = (p === 'p2') ? Game.state.p2SkillHand : Game.state.skillHand;

        hand.forEach((skillId, idx) => {
            const info = MASTER_SKILLS[skillId];
            const canUse = mana >= 5 && !Game.state.hero?.paralyzed && !Game.state.hero?.skillsBurned;
            const btn = document.createElement('button');
            btn.className = `skill-btn ${canUse ? 'available' : 'locked'}`;
            btn.style.setProperty('--skill-color', info.color);
            btn.innerHTML = `
                <div class="glass-sweep"></div>
                <div class="atom-ring ring-1"></div>
                <div class="atom-ring ring-2"></div>
                <div class="atom-ring ring-3"></div>
                <span class="skill-icon">${info.image ? `<img src="${info.image}" class="skill-custom-img">` : info.icon}</span>
                <span class="skill-name">${info.name}</span>
            `;

            // Position in an arc directly above the avatar
            let angle = -90; // center top
            if (hand.length > 1) {
                const spread = 100; // spread 100 degrees
                const step = spread / (hand.length - 1);
                angle = -90 - (spread / 2) + (idx * step);
            }
            const radius = 120; // match .hero-skills-ring width/2
            const rad = angle * Math.PI / 180;
            const x = Math.cos(rad) * radius;
            const y = Math.sin(rad) * radius;
            
            btn.style.left = `calc(50% + ${x}px)`;
            btn.style.top = `calc(50% + ${y}px)`;
            btn.style.transform = `translate(-50%, -50%)`;

            if (canUse) {
                btn.addEventListener('click', () => Game.useHeroSkill(skillId, p));
            }
            container.appendChild(btn);
        });
    },

    // ──────────────── CARDS ────────────────
    renderCards() {
        const isQuiz = Game.config.questionMode === 'quiz';
        
        // Toggle containers based on mode
        const p = Game.state.mode === 'team' ? '-team' : (Game.state.mode === 'pvp' ? '-pvp' : '-solo');
        const qc = document.getElementById('quiz-container' + p);
        const flashRowH = document.querySelector('.cards-row-h');
        const flashStack = document.querySelector('.pvp-cards-stack');
        
        if (isQuiz) {
            if (flashRowH) flashRowH.classList.add('hidden');
            if (flashStack) flashStack.classList.add('hidden');
            if (qc) qc.classList.remove('hidden');
            this.renderQuizUI(qc);
        } else {
            if (flashRowH) flashRowH.classList.remove('hidden');
            if (flashStack) flashStack.classList.remove('hidden');
            if (qc) qc.classList.add('hidden');
            this.renderFlashcardUI();
        }

        // Pet Mascots (Task 1.5)
        const pet1 = document.getElementById('pvp-pet-p1');
        const pet2 = document.getElementById('pvp-pet-p2');
        if (pet1 && pet2) {
            if (Game.state && Game.state.mode === 'pvp' && !isQuiz) {
                pet1.classList.remove('hidden');
                pet2.classList.remove('hidden');
            } else {
                pet1.classList.add('hidden');
                pet2.classList.add('hidden');
            }
        }

        // Apply freeze effect
        if (Game.state.mode === 'solo' && Game.state.hero.frozenAnswersCount > 0) {
            Game.state.hero.frozenAnswersCount--;
            this.applyFrozenAnswersToCurrent();
        } else {
            document.querySelectorAll('.frozen-cover').forEach(el => el.classList.remove('frozen-cover'));
        }
    },

    applyFrozenAnswersToCurrent() {
        // Clear any existing frozen covers first
        document.querySelectorAll('.frozen-cover').forEach(el => el.classList.remove('frozen-cover'));

        const qContainer = document.getElementById('quiz-container-solo');
        if (qContainer && !qContainer.classList.contains('hidden')) {
            const options = Array.from(qContainer.querySelectorAll('.quiz-option:not(.hidden)'));
            options.sort(() => 0.5 - Math.random());
            options.slice(0, 2).forEach(el => el.classList.add('frozen-cover'));
            return;
        }

        const flashRow = document.querySelector('.cards-row-h');
        if (flashRow && !flashRow.classList.contains('hidden')) {
            const cards = Array.from(flashRow.querySelectorAll('.card-wrapper:not(.hidden)')).filter(el => {
                return el.style.visibility !== 'hidden' && el.style.opacity !== '0' && el.style.pointerEvents !== 'none';
            });
            cards.sort(() => 0.5 - Math.random());
            cards.slice(0, Math.max(1, Math.min(2, cards.length - 1))).forEach(el => el.classList.add('frozen-cover'));
        }
    },

    renderFlashcardUI() {
        const count = Game.config.flashcardCount || 3;
        const maxSlots = Math.max(8, count);
        let container = null;
        if (Game.state.mode === 'pvp') {
            container = document.querySelector('.pvp-cards-stack');
        } else {
            container = document.querySelector('#solo-layout .cards-row-h') || document.querySelector('.cards-row-h');
        }

        for (let i = 0; i < maxSlots; i++) {
            const card = Cards.active[i];
            const prefix = Game.state.mode === 'team' ? 'team-card-wrapper-' : (Game.state.mode === 'pvp' ? 'pvp-card-' : 'card-wrapper-');
            let wrapper = document.getElementById(`${prefix}${i+1}`);
            if (!wrapper && container && i < count) {
                wrapper = document.createElement('div');
                wrapper.id = `${prefix}${i+1}`;
                if (Game.state.mode === 'pvp') {
                    wrapper.className = 'card pvp-card';
                    wrapper.innerHTML = `<div class="card-img-box"><img class="card-img" src="" alt=""></div><div class="card-txt-box"><p class="card-txt"></p></div>`;
                } else {
                    wrapper.className = 'card-wrapper hidden';
                    wrapper.innerHTML = `<div class="card"><div class="card-img-box"><img class="card-img" src="" alt=""></div><div class="card-txt-box"><p class="card-txt" style="font-size:0.75rem;"></p></div><button class="reroll-btn" id="reroll-${i+1}" title="Wrong">&#10007;</button></div>`;
                }
                wrapper.addEventListener('click', () => {
                    if (Game.state.mode === 'pvp') {
                        if (Game.state.pvpTurn === 1) Game.handlePvPKeyAnswer(1, i);
                        else Game.handlePvPKeyAnswer(2, i);
                    } else if (Game.state.mode === 'solo' || Game.state.mode === 'team') {
                        Game.handleCardCorrect(i, 'solo');
                    }
                });
                const rerollBtn = wrapper.querySelector('.reroll-btn');
                if (rerollBtn) {
                    rerollBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (Game.state.mode === 'solo' || Game.state.mode === 'team') {
                            Game.handleCardWrong(i, 'solo');
                        }
                    });
                }
                container.appendChild(wrapper);
            }
            if (!wrapper) continue;

            if (i >= count) {
                wrapper.classList.add('hidden');
                continue;
            }
            wrapper.classList.remove('hidden');

            if (!card) {
                wrapper.style.transition = 'none';
                wrapper.style.visibility = 'hidden';
                wrapper.style.opacity = '0';
                wrapper.style.pointerEvents = 'none';
                wrapper.classList.remove('shatter', 'flash-wrong', 'frozen-cover');
                continue;
            }

            wrapper.style.transition = '';
            wrapper.style.visibility = 'visible';
            wrapper.style.opacity = '1';
            wrapper.style.pointerEvents = 'auto';
            wrapper.classList.remove('shatter', 'flash-wrong');
            const img = wrapper.querySelector('.card-img');
            const txt = wrapper.querySelector('.card-txt');
            const displayMode = Game.config.cardDisplay || 'both';

            if (img) {
                if (card.id) {
                    if (card.id.startsWith('data:image') || card.id.startsWith('http')) {
                        img.src = card.id;
                        img.onerror = null;
                    } else {
                        img.src = card.id.includes('.') ? `images/${card.id}` : `images/${card.id}.png`;
                        img.onerror = function() {
                            if (!this.src.includes('.jpg') && !card.id.includes('.')) {
                                this.src = `images/${card.id}.jpg`;
                            } else {
                                this.onerror = null; 
                                this.src = `https://placehold.co/400x250/1a0b2e/a855f7?text=${card.id}`; 
                            }
                        };
                    }
                    img.parentElement.classList.remove('hidden');
                } else {
                    img.parentElement.classList.add('hidden');
                }
            }
            if (txt) txt.textContent = card.text || '';

            // Show/hide based on display mode
            const imgBox = wrapper.querySelector('.card-img-box');
            const txtBox = wrapper.querySelector('.card-txt-box');
            if (imgBox && txtBox) {
                imgBox.classList.toggle('hidden', displayMode === 'text');
                txtBox.classList.toggle('hidden', displayMode === 'image');
            }
        }
    },

    renderQuizUI(container) {
        if (!container) return;
        const q = Cards.quizQuestion;
        const qBox = container.querySelector('.quiz-question-box');
        const qImg = container.querySelector('.quiz-question-img');
        const qTxt = container.querySelector('.quiz-question-txt');
        
        if (!q) {
            container.classList.add('hidden');
            return;
        }
        
        qBox.classList.remove('shatter', 'flash-wrong');

        const displayMode = Game.config.cardDisplay || 'both';
        // Trong Quiz mode, 'both' nên hoạt động giống 'image' (ảnh làm câu hỏi, text làm đáp án)
        const effectiveDisplay = displayMode === 'both' ? 'image' : displayMode;
        const showQImg = effectiveDisplay === 'image';
        const showQTxt = effectiveDisplay === 'text';

        if (showQImg && q.id) {
            qImg.src = q.id.includes('.') ? `images/${q.id}` : `images/${q.id}.png`;
            qImg.onerror = function() {
                if (!this.src.includes('.jpg') && !q.id.includes('.')) this.src = `images/${q.id}.jpg`;
                else { this.onerror = null; this.src = `https://placehold.co/400x250/1a0b2e/a855f7?text=${q.id}`; }
            };
            qImg.classList.remove('hidden');
        } else {
            qImg.classList.add('hidden');
        }
        
        if (showQTxt) {
            const qTextVal = q.text ? q.text : (q.id ? q.id.replace(/\.[^/.]+$/, "") : "N/A");
            qTxt.textContent = qTextVal;
            qTxt.classList.remove('hidden');
        } else {
            qTxt.classList.add('hidden');
        }

        // Render Choices
        const options = container.querySelectorAll('.quiz-option');
        options.forEach((btn, idx) => {
            btn.classList.remove('flash-wrong', 'shatter');
            const choice = Cards.quizChoices[idx];
            if (!choice) return;
            
            const contentSpan = btn.querySelector('.quiz-content');
            
            const showChoiceImg = effectiveDisplay === 'text';
            const showChoiceTxt = effectiveDisplay === 'image';

            let html = '';
            if (showChoiceImg && choice.id) {
                const src = choice.id.includes('.') ? `images/${choice.id}` : `images/${choice.id}.png`;
                html += `<img src="${src}" onerror="if(!this.src.includes('.jpg') && !'${choice.id}'.includes('.')) this.src='images/${choice.id}.jpg'; else this.style.display='none';">`;
            }
            if (showChoiceTxt) {
                const choiceText = choice.text ? choice.text : (choice.id ? choice.id.replace(/\.[^/.]+$/, "") : "N/A");
                html += `<div>${choiceText}</div>`;
            }

            if (Game.state && Game.state.cheatMode && idx === q.correctIndex) {
                html += '<div style="position:absolute; top: -10px; right: -10px; font-size: 30px; z-index: 20; animation: skill-bob 1s infinite alternate;">😈</div>';
                btn.classList.add('cheat-glow');
            } else {
                btn.classList.remove('cheat-glow');
            }

            contentSpan.innerHTML = html;

            if (Game.state && Game.state.mode === 'pvp') {
                const keys = Game.config.pvpKeys || DEFAULT_CONFIG.pvpKeys;
                
                let p1KIdx = idx;
                let p2KIdx = idx;
                if (Game.state.pvpP1KeyMap) p1KIdx = Game.state.pvpP1KeyMap.indexOf(idx);
                if (Game.state.pvpP2KeyMap) p2KIdx = Game.state.pvpP2KeyMap.indexOf(idx);
                
                const p1K = [keys.p1A, keys.p1B, keys.p1C, keys.p1D][p1KIdx] || '';
                const p2K = [keys.p2A, keys.p2B, keys.p2C, keys.p2D][p2KIdx] || '';
                
                const p1Disp = p1K.startsWith('Arrow') ? p1K.replace('Arrow', '') : p1K;
                const p2Disp = p2K.startsWith('Arrow') ? p2K.replace('Arrow', '') : p2K;
                
                const p1Shake = Game.state.pvpP1KeyMap ? ' hurricane-shake' : '';
                const p2Shake = Game.state.pvpP2KeyMap ? ' hurricane-shake' : '';
                
                btn.querySelector('.quiz-key').innerHTML = `<span class="pvp-key-badge p1-badge${p1Shake}">${p1Disp.toUpperCase()}</span><span class="pvp-key-badge p2-badge${p2Shake}">${p2Disp.toUpperCase()}</span>`;
            } else {
                btn.querySelector('.quiz-key').textContent = ['A','B','C','D'][idx];
            }
        });
    },

    // Card animation: correct
    animateCardCorrect(i, cb) {
        const isQuiz = Game.config.questionMode === 'quiz';
        if (isQuiz) {
            const p = Game.state.mode === 'team' ? '-team' : (Game.state.mode === 'pvp' ? '-pvp' : '-solo');
            const qc = document.getElementById('quiz-container' + p);
            if (!qc) { if(cb) cb(); return; }
            const options = qc.querySelectorAll('.quiz-option');
            if (options[i]) options[i].classList.add('flash-correct');
            setTimeout(() => { if (options[i]) options[i].classList.remove('flash-correct'); if(cb) cb(); }, 500);
            return;
        }

        const prefix = Game.state.mode === 'team' ? 'team-card-wrapper-' : (Game.state.mode === 'pvp' ? 'pvp-card-' : 'card-wrapper-');
        const wrapper = document.getElementById(`${prefix}${i+1}`);
        if (!wrapper) { if(cb) cb(); return; }
        wrapper.classList.add('shatter');
        setTimeout(() => { wrapper.classList.remove('shatter'); if(cb) cb(); }, 500);
    },

    // Card animation: wrong
    animateCardWrong(i, cb) {
        const isQuiz = Game.config.questionMode === 'quiz';
        if (isQuiz) {
            const p = Game.state.mode === 'team' ? '-team' : (Game.state.mode === 'pvp' ? '-pvp' : '-solo');
            const qc = document.getElementById('quiz-container' + p);
            if (!qc) { if(cb) cb(); return; }
            const options = qc.querySelectorAll('.quiz-option');
            if (options[i]) options[i].classList.add('flash-wrong');
            setTimeout(() => { if (options[i]) options[i].classList.remove('flash-wrong'); if(cb) cb(); }, 400);
            return;
        }

        const prefix = Game.state.mode === 'team' ? 'team-card-wrapper-' : (Game.state.mode === 'pvp' ? 'pvp-card-' : 'card-wrapper-');
        const wrapper = document.getElementById(`${prefix}${i+1}`);
        if (!wrapper) { if(cb) cb(); return; }
        wrapper.classList.add('flash-wrong');
        setTimeout(() => { wrapper.classList.remove('flash-wrong'); if(cb) cb(); }, 400);
    },

    // ──────────────── BOSS EFFECTS ────────────────
    updateBossEffects(player) {
        const p = player || 'solo';
        const bossState = (p === 'p2') ? Game.state.p2Boss : Game.state.boss;
        const suffix = Game.state.mode === 'team' ? '-team' : (p === 'p2' ? '-p2' : (p === 'p1' ? '-p1' : ''));
        const avatarBox = document.getElementById('boss-avatar-box' + suffix);
        if (!avatarBox) return;

        avatarBox.classList.remove('boss-frozen','boss-paralyzed','boss-blind','boss-sleeping','boss-slowed','boss-burning','boss-cursed');
        if (bossState.frozen)    avatarBox.classList.add('boss-frozen');
        if (bossState.paralyzed) avatarBox.classList.add('boss-paralyzed');
        if (bossState.blind)     avatarBox.classList.add('boss-blind');
        if (bossState.sleeping)  avatarBox.classList.add('boss-sleeping');
        if (bossState.slowed > 0) avatarBox.classList.add('boss-slowed');
        avatarBox.classList.remove('boss-frozen','boss-paralyzed','boss-blind','boss-sleeping','boss-slowed','boss-burning','boss-cursed','boss-poisoned');
        if (bossState.frozen)    avatarBox.classList.add('boss-frozen');
        if (bossState.paralyzed) avatarBox.classList.add('boss-paralyzed');
        if (bossState.blind)     avatarBox.classList.add('boss-blind');
        if (bossState.sleeping)  avatarBox.classList.add('boss-sleeping');
        if (bossState.slowed > 0) avatarBox.classList.add('boss-slowed');
        if (bossState.burning)   avatarBox.classList.add('boss-burning');
        if (bossState.poisoned)  avatarBox.classList.add('boss-poisoned');
        if (bossState.cursed)    avatarBox.classList.add('boss-cursed');

        // Curse indicator
        const curseBubble = document.getElementById('boss-curse' + suffix);
        if (curseBubble) curseBubble.classList.toggle('hidden', !bossState.cursed);

        // Handle frozen block
        let frozenBlock = avatarBox.querySelector('.frozen-block');
        if (bossState.frozen) {
            if (!frozenBlock) {
                frozenBlock = document.createElement('div');
                frozenBlock.className = 'frozen-block';
                avatarBox.appendChild(frozenBlock);
            }
        } else if (frozenBlock) {
            frozenBlock.remove();
        }

        // Handle paralyzed thunder cloud
        let thunderCloud = avatarBox.querySelector('.thunder-cloud');
        if (bossState.paralyzed) {
            if (!thunderCloud) {
                thunderCloud = document.createElement('div');
                thunderCloud.className = 'thunder-cloud';
                thunderCloud.textContent = '⛈️';
                avatarBox.appendChild(thunderCloud);
            }
        } else if (thunderCloud) {
            thunderCloud.remove();
        }

        // Handle random burning flames
        if (avatarBox) {
            let burningFlames = avatarBox.querySelectorAll('.burning-flame');
            if (bossState.burning) {
                if (burningFlames.length === 0) {
                    for(let i=0; i<6; i++) {
                        const flame = document.createElement('div');
                        flame.textContent = '🔥';
                        flame.className = 'burning-flame';
                        flame.style.left = (10 + Math.random()*80) + '%';
                        flame.style.top = (10 + Math.random()*80) + '%';
                        flame.style.animationDelay = (Math.random()*0.5) + 's';
                        avatarBox.appendChild(flame);
                        
                        // Continuously change position randomly
                        const tId = setInterval(() => {
                            if (flame.isConnected) {
                                flame.style.left = (10 + Math.random()*80) + '%';
                                flame.style.top = (10 + Math.random()*80) + '%';
                            } else {
                                clearInterval(tId);
                            }
                        }, 200 + Math.random()*300);
                        flame.dataset.tId = tId;
                    }
                }
            } else {
                burningFlames.forEach(f => {
                    if (f.dataset.tId) clearInterval(f.dataset.tId);
                    f.remove();
                });
            }
        }
    },

    // ──────────────── HERO EFFECTS ────────────────
    updateHeroEffects(player) {
        const p = player || 'solo';
        const heroState = (p === 'p2') ? Game.state.p2Hero : Game.state.hero;
        const suffix = Game.state.mode === 'team' ? '-team' : (p === 'p2' ? '-p2' : (p === 'p1' ? '-p1' : ''));
        const rowBox = document.getElementById('hero-avatar-box' + suffix);
        if (!rowBox) return;
        const avatarBox = rowBox.querySelector('.hero-avatar-center') || rowBox;

        avatarBox.classList.remove('hero-frozen','hero-paralyzed','hero-blind','hero-sleeping','hero-slowed','hero-burning','hero-cursed','hero-poisoned');
        if (heroState.frozen)    avatarBox.classList.add('hero-frozen');
        if (heroState.paralyzed) avatarBox.classList.add('hero-paralyzed');
        if (heroState.blind)     avatarBox.classList.add('hero-blind');
        if (heroState.sleeping)  avatarBox.classList.add('hero-sleeping');
        if (heroState.slowed > 0) avatarBox.classList.add('hero-slowed');
        if (heroState.burning)   avatarBox.classList.add('hero-burning');
        if (heroState.poisoned)  avatarBox.classList.add('hero-poisoned');
        if (heroState.cursed)    avatarBox.classList.add('hero-cursed');
        
        // Lock/unlock card input
        const cardLock = document.getElementById('card-lock' + suffix);
        if (cardLock) {
            if (heroState.frozen) {
                cardLock.textContent = '❄️ FROZEN';
                cardLock.classList.remove('hidden');
            } else if (heroState.paralyzed) {
                cardLock.textContent = '⚡ PARALYZED';
                cardLock.classList.remove('hidden');
            } else if (heroState.sleeping) {
                cardLock.textContent = '💤 SLEEPING';
                cardLock.classList.remove('hidden');
            } else {
                cardLock.classList.add('hidden');
            }
        }

        // Handle frozen block for Hero
        let frozenBlock = avatarBox.querySelector('.frozen-block');
        if (heroState.frozen) {
            if (!frozenBlock) {
                frozenBlock = document.createElement('div');
                frozenBlock.className = 'frozen-block';
                avatarBox.appendChild(frozenBlock);
            }
        } else if (frozenBlock) {
            frozenBlock.remove();
        }

        // Handle paralyzed thunder cloud for Hero
        let thunderCloud = avatarBox.querySelector('.thunder-cloud');
        if (heroState.paralyzed) {
            if (!thunderCloud) {
                thunderCloud = document.createElement('div');
                thunderCloud.className = 'thunder-cloud';
                thunderCloud.textContent = '⛈️';
                avatarBox.appendChild(thunderCloud);
            }
        } else if (thunderCloud) {
            thunderCloud.remove();
        }

        // Handle random burning flames for Hero
        if (avatarBox) {
            let burningFlames = avatarBox.querySelectorAll('.burning-flame');
            if (heroState.burning) {
                if (burningFlames.length === 0) {
                    for(let i=0; i<6; i++) {
                        const flame = document.createElement('div');
                        flame.textContent = '🔥';
                        flame.className = 'burning-flame';
                        flame.style.left = (10 + Math.random()*80) + '%';
                        flame.style.top = (10 + Math.random()*80) + '%';
                        flame.style.animationDelay = (Math.random()*0.5) + 's';
                        avatarBox.appendChild(flame);
                        
                        // Continuously change position randomly
                        const tId = setInterval(() => {
                            if (flame.isConnected) {
                                flame.style.left = (10 + Math.random()*80) + '%';
                                flame.style.top = (10 + Math.random()*80) + '%';
                            } else {
                                clearInterval(tId);
                            }
                        }, 200 + Math.random()*300);
                        flame.dataset.tId = tId;
                    }
                }
            } else {
                burningFlames.forEach(f => {
                    if (f.dataset.tId) clearInterval(f.dataset.tId);
                    f.remove();
                });
            }
        }
    },

    // ──────────────── BOSS SKILL UI ────────────────
    updateBossSkillUI() {
        const container = document.getElementById('boss-next-skill');
        if (!container) return;
        container.innerHTML = '';
        
        Skills.bossSkillQueue.slice(0, 3).forEach((skillId, index) => {
            const info = MASTER_SKILLS[skillId];
            if (!info) return;
            
            if (index === 0) {
                container.innerHTML += `
                    <div class="boss-skill-preview boss-skill-ring" style="--skill-color:${info.color}">
                        <div class="glass-sweep"></div>
                        <div class="atom-ring ring-1"></div>
                        <div class="atom-ring ring-2"></div>
                        <div class="atom-ring ring-3"></div>
                        <span class="boss-skill-icon">${info.image ? `<img src="${info.image}" class="skill-custom-img">` : info.icon}</span>
                    </div>
                `;
            } else {
                container.innerHTML += `
                    <div class="boss-skill-preview boss-skill-queued" style="--skill-color:${info.color}">
                        <span class="boss-skill-icon-small">${info.image ? `<img src="${info.image}" class="skill-custom-img">` : info.icon}</span>
                    </div>
                `;
            }
        });
    },

    updateBossScale(level, player) {
        const boxId = player === 'solo' ? 'boss-avatar-box' : `boss-avatar-box-${player}`;
        const box = document.getElementById(boxId);
        if (box) {
            const oldLevel = box.dataset.scaleLevel;
            if (oldLevel !== undefined && parseInt(oldLevel) !== level) {
                const isGrowing = level > parseInt(oldLevel);
                const ringColor = isGrowing ? '#EF4444' : '#3B82F6';
                const ringClass = isGrowing ? 'boss-grow-ring' : 'boss-shrink-ring';
                
                // Spawn multiple rings like Doraemon style
                for (let i = 0; i < 3; i++) {
                    setTimeout(() => {
                        const ring = document.createElement('div');
                        ring.className = `resize-ring ${ringClass}`;
                        ring.style.borderColor = ringColor;
                        box.appendChild(ring);
                        setTimeout(() => ring.remove(), 600);
                    }, i * 150);
                }
            }
            box.dataset.scaleLevel = level;

            box.classList.remove('boss-scale-0', 'boss-scale-1', 'boss-scale-2', 'boss-scale-3');
            box.classList.add(`boss-scale-${level}`);
        }
    },

    triggerBossEvolution(player, isGrowing = true) {
        const boxId = player === 'solo' ? 'boss-avatar-box' : `boss-avatar-box-${player}`;
        const box = document.getElementById(boxId);
        if (box) {
            box.classList.add('boss-evolution-shock');
            
            const ripple = document.createElement('div');
            ripple.className = 'boss-evolution-ripple';
            box.appendChild(ripple);
            
            if (isGrowing) {
                // Play roar
                if (window.SFX && SFX.roar) SFX.roar();
                else if (window.SFX && SFX.bossRage) SFX.bossRage();

                // Spawn powerup item visual
                const powerup = document.createElement('img');
                powerup.className = 'boss-powerup';
                // try gif first
                powerup.src = './assets/power_up.gif';
                powerup.onerror = () => {
                    // fallback to png
                    powerup.onerror = () => {
                        // fallback to a div with emoji
                        const fallbackDiv = document.createElement('div');
                        fallbackDiv.className = 'boss-powerup fallback-emoji';
                        fallbackDiv.innerText = '😈';
                        box.appendChild(fallbackDiv);
                        setTimeout(() => fallbackDiv.remove(), 2000);
                        powerup.remove();
                    };
                    powerup.src = './assets/powerup.png';
                };
                box.appendChild(powerup);
                setTimeout(() => powerup.remove(), 2000); // remove after animation
            } else {
                if (window.SFX && SFX.bossRage) SFX.bossRage();
            }

            Fx.shakeBoss(player);
            Fx.flashScreen(isGrowing ? '#EF4444' : '#3B82F6');

            const msg = isGrowing ? '💥 BOSS TIẾN HÓA! XÓA MANA & SKILL!' : '🌪️ BOSS THOÁI HÓA! XÓA MANA & SKILL!';
            const suffix = player === 'solo' ? '' : (player === 'p2' ? '-p2' : '-p1');
            Fx.spawnFloatText('boss-fx' + suffix, msg, isGrowing ? '#EF4444' : '#3B82F6');
            
            setTimeout(() => {
                box.classList.remove('boss-evolution-shock');
                if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
            }, 1000);
        }
    },

    // ──────────────── SHADOW CLONE UI ────────────────
    // (Old overlay shadow clone has been replaced by in-game DOM element)

    showSkillActivated(skillId, player) {
        const info = MASTER_SKILLS[skillId];
        Fx.spawnFloatText('hero-fx', `${info.icon} ${info.name.toUpperCase()}!`, info.color);
    },

    // ──────────────── HERO AVATAR ────────────────
    updateHeroAvatar(studentIdx, player) {
        const p = player || 'solo';
        const suffix = Game.state.mode === 'team' ? '-team' : (p === 'p2' ? '-p2' : (p === 'p1' ? '-p1' : ''));
        const center = document.querySelector(`#hero-avatar-box${suffix} .hero-avatar-center`);
        if (!center) return;

        let id = studentIdx || Game.config.heroAvatarId || '1';
        if (Game.state && Game.state.mode === 'pvp') {
            if (p === 'p1') {
                id = (Game.config.p1AvatarType === 'url' && Game.config.p1AvatarUrl) ? Game.config.p1AvatarUrl : (Game.config.p1HeroId || '1');
            }
            if (p === 'p2') {
                id = (Game.config.p2AvatarType === 'url' && Game.config.p2AvatarUrl) ? Game.config.p2AvatarUrl : (Game.config.p2HeroId || '2');
            }
        }

        let mediaEl = center.querySelector('.hero-media-wrapper');
        if (!mediaEl) {
            const oldImg = center.querySelector('img[id^="hero-avatar-img"]');
            if (oldImg) {
                mediaEl = document.createElement('div');
                mediaEl.className = 'hero-media-wrapper';
                mediaEl.style.display = 'inline-block';
                mediaEl.style.position = 'relative';
                mediaEl.style.zIndex = '2';
                center.insertBefore(mediaEl, oldImg);
                oldImg.remove();
            } else {
                return;
            }
        }

        const isVideo = String(id).endsWith('.mp4') || String(id).endsWith('.webm');
        const isUrl = String(id).startsWith('http') || String(id).startsWith('data:');
        
        if (isVideo) {
            mediaEl.innerHTML = `<video src="${id}" autoplay loop muted playsinline class="hero-avatar-img-big circular-avatar"></video>`;
        } else {
            const src = isUrl ? id : `Hero/${id}.png`;
            const onErrorStr = isUrl ? `onerror="this.src='https://placehold.co/200x200/1E3A8A/F6C90E?text=Error';"` : `onerror="if(this.src.includes('.png')) this.src='Hero/${id}.jpg'; else this.src='https://placehold.co/200x200/1E3A8A/F6C90E?text=${id}';"`;
            mediaEl.innerHTML = `<img src="${src}" class="hero-avatar-img-big circular-avatar" ${onErrorStr}>`;
        }
    },

    // ──────────────── BOSS AVATAR ────────────────
    updateBossAvatar() {
        const containers = document.querySelectorAll('.boss-avatar-media');
        const val = (Game.config.bossThemeId || '12582594').trim();
        const isUrl = val.startsWith('http') || val.startsWith('data:');
        const isVideo = val.endsWith('.mp4') || val.endsWith('.webm');
        let html = '';
        if (isUrl) {
            // Link ảnh/video trực tiếp (Pinterest, Google, tenor gif, ...)
            if (isVideo) {
                html = `<video src="${val}" autoplay loop muted playsinline class="boss-media-el"></video>`;
            } else {
                html = `<img src="${val}" class="boss-media-el" onerror="this.src='https://placehold.co/300x300/1e293b/ef4444?text=BOSS'">`;
            }
        } else {
            // Chỉ khi là ID thuần (Tenor số) mới dùng iframe
            const tenorMatch = val.match(/tenor\.com\/embed\/(\d+)/);
            const id = tenorMatch ? tenorMatch[1] : (/\d{6,}/.test(val) ? val.match(/\d{6,}/)[0] : val);
            html = `<iframe src="https://tenor.com/embed/${id}" width="100%" height="100%" frameborder="0" scrolling="no" class="pointer-events-none" allowtransparency="true"></iframe>`;
        }
        containers.forEach(c => {
            c.innerHTML = html;
            c.classList.toggle('flipped', !!Game.config.bossFlip);
        });
        // Debug: báo link Boss đang dùng (để chẩn đoán ảnh không hiện)
        if (window.Game) window.Game.showTimerDebug('boss avatar set. isUrl=' + isUrl + ' src=' + (isUrl ? val : '(tenor iframe)'));
    },

    // ──────────────── LEADERBOARD ────────────────
    renderLeaderboard() {
        const container = document.getElementById('lb-list');
        if (!container) return;
        const lb = Settings.loadLeaderboard();
        if (!lb.length) {
            container.innerHTML = '<div class="lb-empty">No heroes yet. Be the first!</div>';
            return;
        }
        container.innerHTML = lb.map((r, i) => {
            const rankIcon = i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`;
            return `
                <div class="lb-row ${i < 3 ? 'top-3' : ''}">
                    <span class="lb-rank">${rankIcon}</span>
                    <div class="lb-avatar">
                        <img src="Hero/${r.avatarId||1}.png" onerror="this.src='https://placehold.co/40x40/1E3A8A/F6C90E?text=${(r.name||'?')[0]}'">
                    </div>
                    <span class="lb-name">${r.name || 'Anonymous'}</span>
                    <span class="lb-correct">${r.correct}</span>
                    <span class="lb-wrong">${r.wrong}</span>
                    <span class="lb-score">${r.score}</span>
                </div>
            `;
        }).join('');
    },

    // Show alert popup
    showAlert(msg, type, onConfirm) {
        const overlay = document.getElementById('alert-overlay');
        const icon = document.getElementById('alert-icon');
        const msgEl = document.getElementById('alert-msg');
        const btns = document.getElementById('alert-buttons');
        if (!overlay) return;

        msgEl.textContent = msg;
        btns.innerHTML = '';
        overlay.classList.remove('hidden');

        if (type === 'confirm') {
            icon.textContent = '🤔';
            const yes = document.createElement('button');
            yes.className = 'alert-btn confirm';
            yes.textContent = 'Đồng Ý';
            yes.onclick = () => { overlay.classList.add('hidden'); if(onConfirm) onConfirm(); };
            const no = document.createElement('button');
            no.className = 'alert-btn cancel';
            no.textContent = 'Hủy';
            no.onclick = () => overlay.classList.add('hidden');
            btns.appendChild(no);
            btns.appendChild(yes);
        } else {
            icon.textContent = '⚠️';
            const ok = document.createElement('button');
            ok.className = 'alert-btn confirm';
            ok.textContent = 'OK';
            ok.onclick = () => overlay.classList.add('hidden');
            btns.appendChild(ok);
        }
    },
};

