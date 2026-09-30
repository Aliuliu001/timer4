// ============================================================
// MAGIC REALM BATTLE - skills.js
// Skill definitions, drawing, and execution logic
// ============================================================


const Skills = {
    skillHand: [],
    bossSkillQueue: [],
    bossHitsSinceRage: 0,
    bossRageIndex: 0,

    // ------------------------------------------------------------
    // SETUP
    // ------------------------------------------------------------
    buildDeck(config) {
        this.deck = [];
        if (!config.skills) return;
        Object.entries(config.skills).forEach(([id, skill]) => {
            if (skill.active !== false) {
                for (let i = 0; i < (skill.qty || 1); i++) {
                    this.deck.push(id);
                }
            }
        });
        // Shuffle
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    },

    buildBossDeck(config) {
        this.bossDeck = [];
        if (!config.bossSkills) return;
        Object.entries(config.bossSkills).forEach(([id, skill]) => {
            if (skill.active !== false) {
                for (let i = 0; i < (skill.qty || 1); i++) {
                    this.bossDeck.push(id);
                }
            }
        });
        // Shuffle
        for (let i = this.bossDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.bossDeck[i], this.bossDeck[j]] = [this.bossDeck[j], this.bossDeck[i]];
        }
        this.bossSkillQueue = [];
        this.drawNextBossSkill();
    },

    drawHeroSkill() {
        if (!this.deck || this.deck.length === 0) return null;
        const skill = this.deck.shift();
        this.deck.push(skill); // reshuffle to bottom
        return skill;
    },

    drawNextBossSkill() {
        if (!this.bossDeck || this.bossDeck.length === 0) return;
        
        while (this.bossSkillQueue.length < 3) {
            const s = this.bossDeck.shift();
            this.bossDeck.push(s);
            this.bossSkillQueue.push(s);
        }
        UI.updateBossSkillUI();
    },

    // ------------------------------------------------------------
    // UNIFIED SKILL EXECUTION
    // ------------------------------------------------------------
    executeSkill(skillId, caster = 'hero', targetPlayer = 'solo') {
        if (Game.state.isGameOver || !Game.state.isRunning) return;
        const config = Game.config;
        
        // Find skill config in either dictionary
        const skillConfig = (config.skills && config.skills[skillId]) || (config.bossSkills && config.bossSkills[skillId]) || {};
        const dur = skillConfig.duration || 5;

        // Determine who is who
        const isHeroCasting = (caster === 'hero');
        const originEntity = isHeroCasting ? 'hero' : 'boss';
        const targetEntity = isHeroCasting ? 'boss' : 'hero';
        const heroState = targetPlayer === 'p2' ? Game.state.p2Hero : (targetPlayer === 'p1' ? Game.state.p1Hero : Game.state.hero);
        const bossState = targetPlayer === 'p2' ? Game.state.p2Boss : (targetPlayer === 'p1' ? Game.state.p1Boss : Game.state.boss);
        
        const casterState = isHeroCasting ? heroState : bossState;
        const targetState = isHeroCasting ? bossState : heroState;
        
        const updateCasterEffects = isHeroCasting ? UI.updateHeroEffects : UI.updateBossEffects;
        let updateTargetEffects = isHeroCasting ? UI.updateBossEffects : UI.updateHeroEffects;
        
        if (casterState.cursed) {
            casterState.cursed = false;
            
            // Play explosion on CASTER
            const suffix = targetPlayer === 'p2' ? '-p2' : (targetPlayer === 'p1' ? '-p1' : (targetPlayer === 'team' ? '-team' : ''));
            const targetEl = document.getElementById(`${originEntity}-avatar-box${suffix}`);
            if (targetEl && Fx) {
                if (Fx.burstBubble) Fx.burstBubble(targetEl);
                Fx.spawnFloatText(`${originEntity}-fx${suffix}`, '💥 BACKFIRE!', '#DC2626');
            }
            
            // Backfire effect based on skill type
            if (['fireball', 'meteor_shower', 'fire_blast', 'kamehameha'].includes(skillId)) casterState.burning = true;
            else if (['ice_freeze', 'deep_freeze'].includes(skillId)) casterState.frozen = true;
            else casterState.paralyzed = true;
            
            updateCasterEffects(targetPlayer);
            
            setTimeout(() => {
                casterState.burning = false;
                casterState.frozen = false;
                casterState.paralyzed = false;
                updateCasterEffects(targetPlayer);
            }, 4000);
            
            return; // Cancel normal execution
        }

        const casterFxPrefix = isHeroCasting ? 'hero-fx' : 'boss-fx';
        const targetFxPrefix = isHeroCasting ? 'boss-fx' : 'hero-fx';
        const suffix = targetPlayer === 'p2' ? '-p2' : (targetPlayer === 'p1' ? '-p1' : '');

        const offensiveSkills = ['ice_freeze', 'fire_blast', 'fire_breath', 'thunder_strike', 'dark_curse', 'star_mountain', 'sleep_spell'];
        const isOffensive = offensiveSkills.includes(skillId);

        // Intercept logic for hit callbacks
        const checkCloneIntercept = () => {
            if (isOffensive && targetState.shadowClone && targetState.shadowClone.active) {
                targetState.shadowClone.active = false;
                const cloneEl = targetState.shadowClone.el;
                if (cloneEl) {
                    cloneEl.classList.add('intercepting');
                }
                return cloneEl;
            }
            return null;
        };
        const interceptedCloneEl = checkCloneIntercept();


        SFX.init();

        switch(skillId) {
            case 'ice_freeze':
                SFX.freeze();
                Fx.spawnProjectile('<div class="giant-snowball"></div>', originEntity, targetEntity, targetPlayer, () => {
                    if (interceptedCloneEl) { Fx.destroyClone(interceptedCloneEl); return; }
                    SFX.shatter();
                    
                    targetState.frozen = true;
                    if (targetEntity === 'hero' && Game.state.mode === 'solo') {
                        targetState.frozenAnswersCount = 1;
                        UI.applyFrozenAnswersToCurrent();
                    }
                    updateTargetEffects(targetPlayer);
                    setTimeout(() => { targetState.frozen = false; updateTargetEffects(targetPlayer); }, dur * 1000);

                    const layer = document.getElementById('projectile-layer');
                    if (layer) {
                        const targetEl = document.getElementById(`${targetEntity}-avatar-box${suffix}`);
                        if (targetEl) {
                            const rect = targetEl.getBoundingClientRect();
                            for (let i = 0; i < 30; i++) {
                                const flake = document.createElement('div');
                                flake.className = 'nova-snowflake';
                                flake.textContent = ['❄️', '🧊', '✨'][Math.floor(Math.random()*3)];
                                flake.style.left = `${rect.left + rect.width/2}px`;
                                flake.style.top = `${rect.top + rect.height/2}px`;
                                const angle = Math.random() * Math.PI * 2;
                                const dist = 50 + Math.random() * 150;
                                flake.style.setProperty('--tx', `${Math.cos(angle) * dist}px`);
                                flake.style.setProperty('--ty', `${Math.sin(angle) * dist}px`);
                                layer.appendChild(flake);
                                setTimeout(() => flake.remove(), 1000);
                            }
                        }
                    }
                    targetState.frozen = true;
                    targetState.slowed = 0.5;
                    
                    if (targetEntity === 'hero' && Game.state.mode === 'solo') {
                        targetState.frozenAnswersCount = 1; // 1 for the next question
                        UI.applyFrozenAnswersToCurrent();   // 1 for the current question
                    }
                    
                    updateTargetEffects(targetPlayer);
                    
                    setTimeout(() => { 
                        targetState.frozen = false; 
                        SFX.freeze(); 
                        updateTargetEffects(targetPlayer);
                        
                        setTimeout(() => {
                            targetState.slowed = 0;
                            updateTargetEffects(targetPlayer);
                        }, 3000);
                    }, dur * 1000);
                }, 'trail-snow', 2000, 0);
                break;

            case 'fire_blast':
                SFX.fire();
                Fx.spawnProjectile(`<div class="projectile-fireball-wrapper"><div class="elemental-ring fire-ring"></div><div class="projectile-fireball"></div></div>`, originEntity, targetEntity, targetPlayer, () => {
                    if (interceptedCloneEl) { Fx.destroyClone(interceptedCloneEl); return; }
                    if (originEntity === 'hero') {
                        const pushSecs = skillConfig.power !== undefined ? skillConfig.power : 5;
                        if (pushSecs > 0 && targetEntity === 'boss') {
                            const pushSteps = Math.floor(pushSecs * Game.config.bossBaseSpeed);
                            Game.pushBoss(Math.max(1, pushSteps), targetPlayer);
                        }
                        // Removed Boss skill deletion
                    } else if (originEntity === 'boss') {
                        // Fireball on Hero: Delete 1 random skill from Hero
                        if (skillId === 'fire_blast' && Game.state.skillHand.length > 0) {
                            const rIndex = Math.floor(Math.random() * Game.state.skillHand.length);
                            Game.state.skillHand.splice(rIndex, 1);
                            UI.updateSkillsUI(targetPlayer);
                        }
                    }
                    
                    targetState.burning = true;
                    updateTargetEffects(targetPlayer);
                    
                    let elapsed = 0;
                    const burnInterval = setInterval(() => {
                        if (Game.state.isGameOver) {
                            targetState.burning = false;
                            updateTargetEffects(targetPlayer);
                            clearInterval(burnInterval);
                            return;
                        }
                        
                        elapsed++;
                        if (elapsed >= dur) {
                            clearInterval(burnInterval);
                            targetState.burning = false;
                            updateTargetEffects(targetPlayer);
                        }
                    }, 1000);
                }, 'trail-fire', 1200, 0);
                break;

            case 'thunder_strike':
                SFX.thunder();
                Fx.flashScreen('#FFFFFF');
                const hammerFlip = originEntity === 'boss' ? ' style="--rot: 180deg;"' : '';
                const projHtml = `<div class="hammer-charging"${hammerFlip}><div class="projectile-hammer"${hammerFlip}></div></div>`;
                Fx.spawnProjectile(projHtml, originEntity, targetEntity, targetPlayer, () => {
                    if (interceptedCloneEl) { Fx.destroyClone(interceptedCloneEl); return; }
                    if (originEntity === 'hero') {
                        const pushSecs = skillConfig.power !== undefined ? skillConfig.power : 10;
                        if (pushSecs > 0 && targetEntity === 'boss') {
                            const pushSteps = Math.floor(pushSecs * Game.config.bossBaseSpeed);
                            Game.pushBoss(Math.max(1, pushSteps), targetPlayer);
                        }
                    } else if (originEntity === 'boss') {
                        casterState.speedMult = skillConfig.speedBoost || 1.3;
                    }
                    targetState.paralyzed = true;
                    updateTargetEffects(targetPlayer);
                    setTimeout(() => { 
                        targetState.paralyzed = false; 
                        if (originEntity === 'boss') casterState.speedMult = 1.0;
                        updateTargetEffects(targetPlayer); 
                    }, dur * 1000);
                }, '', 1600, 1500);
                break;

            case 'dark_curse':
                SFX.bossCurse();
                Fx.spawnProjectile('<img src="assets/evil.png" style="width:50px; height:50px; object-fit: contain;" onerror="this.outerHTML=\'💀\'">', originEntity, targetEntity, targetPlayer, () => {
                    if (interceptedCloneEl) { Fx.destroyClone(interceptedCloneEl); return; }
                    targetState.cursed = true;
                    updateTargetEffects(targetPlayer);
                    Fx.spawnFloatText(`${targetEntity}-fx${suffix}`, '💀 CURSED!', '#7C3AED');
                    setTimeout(() => { 
                        if (targetState.cursed) {
                            targetState.cursed = false; 
                            updateTargetEffects(targetPlayer); 
                        }
                    }, dur * 1000);
                }, 'trail-curse no-rotate', 1600, 1500);
                break;

            case 'dash_forward':
                SFX.bossRage(); // Use rage sfx for dash
                if (isHeroCasting) {
                    Fx.spawnFloatText('hero-fx' + suffix, '🚀 DASH PUSH!', '#F59E0B');
                    
                    // Buff logic: activate rocket buff
                    heroState.rocketBuff = true;
                    
                    const rocketDur = skillConfig.duration !== undefined ? skillConfig.duration * 1000 : 3000;
                    Fx.spawnProjectile(`<div class="hero-dash-rocket" style="font-size: 80px; transform: rotate(45deg); --dur: ${rocketDur}ms;">🚀</div>`, originEntity, targetEntity, targetPlayer, () => {
                        if (interceptedCloneEl) { Fx.destroyClone(interceptedCloneEl); heroState.rocketBuff = false; return; }
                        
                        heroState.rocketBuff = false; // deactivate buff
                        
                        // Push boss back
                        const pushSecs = skillConfig.power !== undefined ? skillConfig.power : 10;
                        if (pushSecs > 0 && targetEntity === 'boss') {
                            const maxPos = Game.config.bossTime * (Game.config.bossBaseSpeed || 1);
                            targetState.position = Math.min(maxPos, targetState.position + pushSecs * (Game.config.bossBaseSpeed || 1));
                            UI.updateBossTrack(targetPlayer);
                            Fx.spawnFloatText(`${targetEntity}-fx${suffix}`, `-${pushSecs}s PUSH!`, '#3B82F6');
                        }
                        
                        // Explosion effect
                        Fx.spawnFloatText(`${targetEntity}-fx${suffix}`, '💥 BOOM!', '#DC2626');
                    }, 'trail-smoke', rocketDur);
                } else {
                    const steps = skillConfig.power !== undefined ? skillConfig.power : 10;
                    const rocketDur = skillConfig.duration !== undefined ? skillConfig.duration * 1000 : 3000;
                    Fx.spawnFloatText('boss-fx' + suffix, '💨 DASH!', '#F59E0B');
                    
                    // Immediately update position so avatar slides while Y-arc happens
                    casterState.position = Math.max(0, casterState.position - steps);
                    UI.updateBossTrack(targetPlayer);
                    
                    if (Fx.playDashRocket) {
                        Fx.playDashRocket(targetPlayer, steps, () => {
                            if (Game.state.isGameOver || !Game.state.isRunning) return;
                            if (casterState.position <= 0) Game.endGame(targetPlayer === 'p2' ? 'p1' : (targetPlayer === 'p1' ? 'p2' : 'lose'));
                        });
                    } else {
                        if (casterState.position <= 0) Game.endGame(targetPlayer === 'p2' ? 'p1' : (targetPlayer === 'p1' ? 'p2' : 'lose'));
                    }
                }
                break;

            case 'meteor_shower':
            case 'kamehameha':
            case 'fireball':
            case 'shuriken': {
                const executeOffensive = (playFn) => {
                    const originEl = document.getElementById(`${originEntity}-avatar-box${suffix}`);
                    const targetEl = document.getElementById(`${targetEntity}-avatar-box${suffix}`);
                    playFn(originEl, targetEl, () => {
                        if (interceptedCloneEl) { Fx.destroyClone(interceptedCloneEl); return; }
                        if (originEntity === 'hero') {
                            const pushSecs = skillConfig.power !== undefined ? skillConfig.power : 10;
                            if (pushSecs > 0 && targetEntity === 'boss') {
                                const pushSteps = Math.floor(pushSecs * Game.config.bossBaseSpeed);
                                Game.pushBoss(Math.max(1, pushSteps), targetPlayer);
                            }
                        } else if (originEntity === 'boss' && Game.state.skillHand && Game.state.skillHand.length > 0) {
                             const rIndex = Math.floor(Math.random() * Game.state.skillHand.length);
                             Game.state.skillHand.splice(rIndex, 1);
                             UI.updateSkillsUI(targetPlayer);
                        }
                        if (skillId === 'shuriken') {
                            targetState.poisoned = true;
                            updateTargetEffects(targetPlayer);
                            setTimeout(() => { targetState.poisoned = false; updateTargetEffects(targetPlayer); }, dur * 1000);
                        } else {
                            targetState.burning = true;
                            updateTargetEffects(targetPlayer);
                            setTimeout(() => { targetState.burning = false; updateTargetEffects(targetPlayer); }, dur * 1000);
                        }
                    });
                };
                if (skillId === 'meteor_shower') executeOffensive((o, t, cb) => Fx.playMeteorShower(t, cb));
                else if (skillId === 'kamehameha') executeOffensive((o, t, cb) => Fx.playKamehameha(o, t, cb));
                else if (skillId === 'fireball') executeOffensive((o, t, cb) => Fx.playFireball(o, t, cb));
                else if (skillId === 'shuriken') executeOffensive((o, t, cb) => Fx.playShuriken(o, t, cb));
                break;
            }
                
            case 'tornado_classic':
            case 'deep_freeze': {
                const executeCC = (playFn, statusName) => {
                    const targetEl = document.getElementById(`${targetEntity}-avatar-box${suffix}`);
                    if (interceptedCloneEl) {
                        playFn(targetEl, () => Fx.destroyClone(interceptedCloneEl));
                        return;
                    }
                    
                    targetState[statusName] = true;
                    if (statusName === 'frozen' && targetEntity === 'hero' && Game.state.mode === 'solo') {
                        targetState.frozenAnswersCount = 1;
                        UI.applyFrozenAnswersToCurrent();
                    }
                    updateTargetEffects(targetPlayer);
                    
                    playFn(targetEl, () => {});
                    setTimeout(() => { 
                        targetState[statusName] = false; 
                        updateTargetEffects(targetPlayer); 
                    }, dur * 1000);
                };
                if (skillId === 'tornado_classic') executeCC((t, cb) => Fx.playTornado(t, cb), 'paralyzed');
                else if (skillId === 'deep_freeze') executeCC((t, cb) => Fx.playDeepFreeze(t, cb), 'frozen');
                break;
            }

            case 'shadow_clone':
                SFX.bossRage();
                
                // Spawn slime clone DOM element
                let cloneContainer;
                let cSuffix = '';
                if (targetPlayer === 'solo') {
                    cloneContainer = isHeroCasting ? document.querySelector('.solo-hero') : document.querySelector('.solo-boss'); 
                }
                else if (targetPlayer === 'p1') {
                    cloneContainer = isHeroCasting ? document.getElementById('hero-avatar-box-p1') : document.getElementById('boss-avatar-box-p1');
                    cSuffix = '-p1';
                }
                else if (targetPlayer === 'p2') {
                    cloneContainer = isHeroCasting ? document.getElementById('hero-avatar-box-p2') : document.getElementById('boss-avatar-box-p2');
                    cSuffix = '-p2';
                }
                
                if (cloneContainer) {
                    const cloneEl = document.createElement('img');
                    cloneEl.src = 'assets/slime_clone.png';
                    cloneEl.className = `slime-clone bounce-in ${isHeroCasting ? 'hero-clone' : 'boss-clone'}`;
                    cloneContainer.appendChild(cloneEl);
                    
                    casterState.shadowClone = { active: true, el: cloneEl, hitsNeeded: Game.config.shadowCloneHits || 3, hitsGiven: 0 };

                    // Space out multiple clones
                    const clones = cloneContainer.querySelectorAll('.slime-clone:not(.intercepting)');
                    clones.forEach((c, idx) => {
                        if (isHeroCasting) {
                            c.style.left = `-${120 + idx * 110}px`;
                        } else {
                            c.style.right = `-${120 + idx * 110}px`;
                        }
                        c.style.zIndex = -1 - idx;
                    });
                }
                Fx.spawnFloatText(casterFxPrefix + cSuffix, '👿 CLONE!', '#7C3AED');
                break;
        }

        if (caster === 'boss') {
            this.bossSkillQueue.shift();
            this.drawNextBossSkill();
        }
    },

        // ------------------------------------------------------------
        // BOSS RAGE SKILLS
        // ------------------------------------------------------------
    executeRage(rageSkillId, targetPlayer = 'solo') {
        // Obsolete function, safely removed
    }
};



