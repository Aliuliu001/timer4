// ============================================================
// MAGIC REALM BATTLE - fx.js
// Visual effects: projectiles, floats, particles, flash
// ============================================================

const Fx = {
    // Spawn a floating text element
    spawnFloatText(containerId, html, color) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const el = document.createElement('div');
        el.className = 'float-text';
        el.innerHTML = html;
        el.style.color = color || '#fff';
        el.style.left = `${20 + Math.random() * 60}%`;
        container.appendChild(el);
        setTimeout(() => el.remove(), 1200);
    },

    spawnEmoji(containerId, emoji) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const el = document.createElement('div');
        el.className = 'float-emoji';
        el.textContent = emoji;
        el.style.left = `${20 + Math.random() * 60}%`;
        container.appendChild(el);
        setTimeout(() => el.remove(), 1200);
    },

    burstBubble(targetEl) {
        if (!targetEl) return;
        const rect = targetEl.getBoundingClientRect();
        const layer = document.getElementById('projectile-layer') || document.body;
        
        const emojis = ['💥', '🫧', '💧', '✨', '💀', '🫧', '💜', '💨'];
        for (let i = 0; i < 40; i++) {
            const el = document.createElement('div');
            el.className = 'clone-explosion-particle';
            el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            const size = 0.5 + Math.random() * 2;
            el.style.fontSize = `${size}rem`;
            el.style.left = `${rect.left + rect.width/2}px`;
            el.style.top = `${rect.top + rect.height/2}px`;
            const angle = Math.random() * Math.PI * 2;
            const dist = 30 + Math.random() * 150;
            el.style.setProperty('--tx', `${Math.cos(angle) * dist}px`);
            el.style.setProperty('--ty', `${Math.sin(angle) * dist}px`);
            layer.appendChild(el);
            setTimeout(() => el.remove(), 800);
        }
    },

    // Spawn projectile from source to target
    spawnProjectile(emoji, from, to, player, onHit, extraClass, customDur, delayStart = 0) {
        const suffix = player === 'p2' ? '-p2' : (player === 'p1' ? '-p1' : '');
        const fromEl = typeof from === 'string' ? document.getElementById(from === 'hero' ? `hero-avatar-box${suffix}` : `boss-avatar-box${suffix}`) : from;
        const toEl   = typeof to === 'string' ? document.getElementById(to   === 'boss' ? `boss-avatar-box${suffix}` : `hero-avatar-box${suffix}`) : to;
        if (!fromEl || !toEl) { if(onHit) onHit(); return; }

        const fromRect = fromEl.getBoundingClientRect();
        const toRect   = toEl.getBoundingClientRect();

        const proj = document.createElement('div');
        proj.className = 'projectile' + (extraClass ? ' ' + extraClass : '');
        if (emoji.startsWith('<')) proj.innerHTML = emoji;
        else proj.textContent = emoji;
        proj.style.left = `${fromRect.left + fromRect.width/2}px`;
        proj.style.top  = `${fromRect.top  + fromRect.height/2}px`;

        const angle = Math.atan2(toRect.top - fromRect.top, toRect.left - fromRect.left) * 180 / Math.PI;
        if (extraClass && extraClass.includes('no-rotate')) {
            proj.style.transform = `translate(-50%,-50%)`;
        } else {
            proj.style.transform = `translate(-50%,-50%) rotate(${angle}deg)`;
        }

        const layer = document.getElementById('projectile-layer');
        if (!layer) { if(onHit) onHit(); return; }
        layer.appendChild(proj);

        // Force reflow to ensure transform is applied instantly without transition
        void proj.offsetWidth;

        const duration = customDur || (extraClass === 'fusion-projectile' ? 600 : 400); // 30% slower for fusion

        const runMove = () => {
            let startTime = null;
            const startX = fromRect.left + fromRect.width/2;
            const startY = fromRect.top + fromRect.height/2;

            let trailInterval;
            if (extraClass && extraClass.includes('trail-smoke')) {
                trailInterval = setInterval(() => {
                    if (!proj.isConnected) { clearInterval(trailInterval); return; }
                    const tx = parseFloat(proj.style.left);
                    const ty = parseFloat(proj.style.top);
                    if (isNaN(tx) || isNaN(ty)) return;
                    
                    const trail = document.createElement('div');
                    trail.textContent = '💨';
                    trail.style.position = 'absolute';
                    trail.style.fontSize = '30px';
                    trail.style.filter = 'hue-rotate(250deg) saturate(3)';
                    trail.style.zIndex = '899';
                    trail.style.pointerEvents = 'none';
                    trail.style.left = `${tx}px`;
                    trail.style.top = `${ty}px`;
                    trail.style.transform = 'translate(-50%, -50%)';
                    layer.appendChild(trail);
                    
                    trail.animate([
                        { transform: 'translate(-50%, -50%) scale(1)', opacity: 0.8 },
                        { transform: 'translate(-50%, -50%) scale(2)', opacity: 0 }
                    ], { duration: 500, easing: 'ease-out' }).onfinish = () => trail.remove();
                }, 50);
            }

            const animateMove = (now) => {
                if (!startTime) startTime = now;
                let p = (now - startTime) / duration;
                if (p > 1) p = 1;
                
                const currentToRect = toEl.getBoundingClientRect();
                const targetX = currentToRect.left + currentToRect.width/2;
                const targetY = currentToRect.top + currentToRect.height/2;
                
                proj.style.left = `${startX + (targetX - startX) * p}px`;
                proj.style.top = `${startY + (targetY - startY) * p}px`;
                
                if (extraClass && extraClass.includes('no-rotate')) {
                    proj.style.transform = `translate(-50%,-50%)`;
                } else {
                    const angle = Math.atan2(targetY - startY, targetX - startX) * 180 / Math.PI;
                    proj.style.transform = `translate(-50%,-50%) rotate(${angle}deg)`;
                }

                if (p < 1) {
                    requestAnimationFrame(animateMove);
                } else {
                    if (trailInterval) clearInterval(trailInterval);
                    // Hit effect
                    const hitEl = document.createElement('div');
                    hitEl.className = 'hit-fx';
                    hitEl.textContent = '💥';
                    hitEl.style.left = `${targetX}px`;
                    hitEl.style.top  = `${targetY}px`;
                    layer.appendChild(hitEl);
                    setTimeout(() => hitEl.remove(), 300);
                    
                    const emojis = ['😭', '🤕', '😵', '😣', '😫', '💥'];
                    const randEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                    const targetContainer = to === 'boss' ? `boss-fx${suffix}` : `hero-fx${suffix}`;
                    Fx.spawnEmoji(targetContainer, randEmoji);

                    proj.remove();
                    try {
                        if (onHit) onHit();
                    } catch(e) {
                        console.error("Lỗi onHit:", e);
                    }
                }
            };
            requestAnimationFrame(animateMove);
        };

        if (delayStart > 0) {
            setTimeout(() => {
                proj.classList.add('is-moving');
                requestAnimationFrame(runMove);
                this.startTrail(proj, layer, extraClass);
            }, delayStart);
        } else {
            proj.classList.add('is-moving');
            requestAnimationFrame(runMove);
            this.startTrail(proj, layer, extraClass);
        }
    },
    
    startTrail(proj, layer, extraClass) {
        if (extraClass && extraClass.includes('trail-fire')) {
            const trailInterval = setInterval(() => {
                if (!proj.isConnected) { clearInterval(trailInterval); return; }
                const rect = proj.getBoundingClientRect();
                const p = document.createElement('div');
                p.className = 'fire-trail-particle';
                p.style.left = `${rect.left + rect.width/2 + (Math.random()-0.5)*30}px`;
                p.style.top = `${rect.top + rect.height/2 + (Math.random()-0.5)*30}px`;
                layer.appendChild(p);
                setTimeout(() => p.remove(), 400);
            }, 30);
        } else if (extraClass && extraClass.includes('trail-snow')) {
            const trailInterval = setInterval(() => {
                if (!proj.isConnected) { clearInterval(trailInterval); return; }
                const rect = proj.getBoundingClientRect();
                const p = document.createElement('div');
                p.className = 'snow-trail-particle';
                p.textContent = ['❄️', '🧊', '✨'][Math.floor(Math.random()*3)];
                p.style.left = `${rect.left + rect.width/2 + (Math.random()-0.5)*80}px`;
                p.style.top = `${rect.top + rect.height/2 + (Math.random()-0.5)*80}px`;
                layer.appendChild(p);
                setTimeout(() => p.remove(), 800);
            }, 50);
        }
    },

    // Snowball projectile with combo glow
    spawnSnowball(comboLevel, targetPlayer, onHit, sourcePlayer = null) {
        const pSource = sourcePlayer || targetPlayer;
        const sourceSuffix = pSource === 'p2' ? '-p2' : (pSource === 'p1' ? '-p1' : '');
        const targetSuffix = targetPlayer === 'p2' ? '-p2' : (targetPlayer === 'p1' ? '-p1' : '');
        const isBig = comboLevel >= 5;

        if (isBig) {
            // === FUSION BLAST: 3 orbs in arcs ===
            // Use hero-avatar-box as origin (reliable getBoundingClientRect)
            const fromEl = document.getElementById(`hero-avatar-box${sourceSuffix}`);
            let toId = `boss-avatar-box${targetSuffix}`;
            if (Game && Game.state && Game.state.mode === 'pvp') toId = `hero-avatar-box${targetSuffix}`;
            const toEl = document.getElementById(toId);

            console.debug('[spawnSnowball FUSION] fromEl:', fromEl?.id, 'toEl:', toEl?.id);

            if (!fromEl || !toEl) {
                console.warn('[spawnSnowball FUSION] Missing elements! Skipping animation.');
                if (onHit) { onHit(1,3); onHit(2,3); onHit(3,3); }
                return;
            }

            const fromRect = fromEl.getBoundingClientRect();
            const toRect   = toEl.getBoundingClientRect();

            const startX = fromRect.left + fromRect.width / 2;
            const startY = fromRect.top + fromRect.height / 2;
            const endX   = toRect.left  + toRect.width  / 2;
            const endY   = toRect.top   + toRect.height / 2;

            console.debug('[spawnSnowball FUSION] start:', startX, startY, '→ end:', endX, endY);

            // Guard: if both rects are zero, elements are hidden
            if (fromRect.width === 0 && fromRect.height === 0) {
                console.warn('[spawnSnowball FUSION] fromEl has zero size, skipping animation.');
                if (onHit) { onHit(1,3); onHit(2,3); onHit(3,3); }
                return;
            }

            const layer = document.getElementById('projectile-layer');
            if (!layer) {
                if (onHit) { onHit(1,3); onHit(2,3); onHit(3,3); }
                return;
            }

            const duration  = 700;

            const projs = [];
            for (let i = 0; i < 3; i++) {
                const p = document.createElement('div');
                p.className = 'projectile fusion-orb';
                p.style.left = `${startX}px`;
                p.style.top  = `${startY}px`;
                layer.appendChild(p);
                projs.push(p);
            }

            const dx = endX - startX;
            const dy = endY - startY;
            const dist = Math.hypot(dx, dy);
            const px = dist > 0 ? -dy / dist : 0;
            const py = dist > 0 ?  dx / dist : 0;

            let startTime = null;
            const animate = (time) => {
                if (!startTime) startTime = time;
                let progress = (time - startTime) / duration;
                if (progress >= 1) progress = 1;

                const lx = startX + dx * progress;
                const ly = startY + dy * progress;
                const arcFactor = Math.sin(progress * Math.PI);
                const arcDist = 120;

                // Straight beam
                projs[0].style.left = `${lx}px`;
                projs[0].style.top  = `${ly}px`;
                // Arc up
                projs[1].style.left = `${lx + px * arcDist * arcFactor}px`;
                projs[1].style.top  = `${ly + py * arcDist * arcFactor}px`;
                // Arc down
                projs[2].style.left = `${lx - px * arcDist * arcFactor}px`;
                projs[2].style.top  = `${ly - py * arcDist * arcFactor}px`;

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    projs.forEach(p => p.remove());
                    // Explosion at impact
                    const hitEl = document.createElement('div');
                    hitEl.className = 'hit-explosion';
                    hitEl.style.left = `${endX}px`;
                    hitEl.style.top  = `${endY}px`;
                    layer.appendChild(hitEl);
                    setTimeout(() => hitEl.remove(), 600);

                    if (onHit) {
                        onHit(1, 3);
                        onHit(2, 3);
                        onHit(3, 3);
                    }
                }
            };
            requestAnimationFrame(animate);
            setTimeout(() => this.spawnFloatText(`boss-fx${sourceSuffix}`, '💥 FUSION BLAST!', '#22D3EE'), 500);

        } else {
            const fromEl = document.getElementById(`hero-avatar-box${sourceSuffix}`);
            let toId = `boss-avatar-box${targetSuffix}`;
            if (Game && Game.state && Game.state.mode === 'pvp') toId = `hero-avatar-box${targetSuffix}`;
            const toEl = document.getElementById(toId);

            this.spawnProjectile('☃️', fromEl || 'hero', toEl || 'boss', targetPlayer, () => {
                if (onHit) onHit(1, 1);
            }, '');
        }
    },



    // Screen flash effect
    flashScreen(color) {
        const overlay = document.getElementById('flash-overlay');
        if (!overlay) return;
        overlay.style.background = color || 'white';
        overlay.style.opacity = '0.6';
        setTimeout(() => { overlay.style.opacity = '0'; }, 300);
    },

    // End game particles
    spawnParticles(win) {
        const layer = document.getElementById('projectile-layer');
        if (!layer) return;
        const emojis = win ? ['🎉','✨','🌟','🎈','⭐'] : ['💧','🌪️','❄️','🧊'];
        for (let i = 0; i < 25; i++) {
            setTimeout(() => {
                const el = document.createElement('div');
                el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                el.style.cssText = `position:fixed;font-size:2rem;z-index:9000;pointer-events:none;left:${Math.random()*100}vw;top:-50px;animation:particleFall ${3+Math.random()*3}s linear forwards;`;
                layer.appendChild(el);
                setTimeout(() => el.remove(), 6000);
            }, Math.random() * 2000);
        }
    },

    // Boss shake (when hit)
    shakeBoss(player) {
        const suffix = player === 'p2' ? '-p2' : (player === 'p1' ? '-p1' : '');
        const el = document.getElementById(`boss-avatar-box${suffix}`);
        if (!el) return;
        el.classList.add('shake');
        setTimeout(() => el.classList.remove('shake'), 500);
    },

    // PvP turn highlight
    highlightPlayer(player) {
        document.querySelectorAll('.pvp-side').forEach(s => s.classList.remove('active-turn'));
        const side = document.getElementById(`pvp-side-${player}`);
        if (side) side.classList.add('active-turn');

        const turnLabel = document.getElementById('pvp-turn-player');
        if (turnLabel) {
            turnLabel.textContent = player === 1 ? "PLAYER 1 (HERO)" : "PLAYER 2 (BOSS)";
            turnLabel.className = player === 1 ? "turn-p1-text" : "turn-p2-text";
        }
        const turnDisplay = document.querySelector('.pvp-turn-display');
        if (turnDisplay) {
            turnDisplay.classList.remove('turn-active-p1', 'turn-active-p2');
            turnDisplay.classList.add(player === 1 ? 'turn-active-p1' : 'turn-active-p2');
        }
        document.querySelectorAll('.pvp-cards-stack .pvp-card').forEach(card => {
            card.classList.remove('card-turn-p1', 'card-turn-p2');
            card.classList.add(player === 1 ? 'card-turn-p1' : 'card-turn-p2');
        });
        document.querySelectorAll('.pvp-hero-racer').forEach(r => r.classList.remove('racer-active-turn'));
        const activeRacer = document.getElementById(`hero-avatar-box-p${player}`);
        if (activeRacer) activeRacer.classList.add('racer-active-turn');
    },

    // Destroy Shadow Clone with explosion
    destroyClone(cloneEl, layerId = 'projectile-layer') {
        if (!cloneEl) return;
        
        const rect = cloneEl.getBoundingClientRect();
        
        // Zoom in from 2.5x to 3.5x then explode
        const isHero = cloneEl.classList.contains('hero-clone');
        cloneEl.style.transition = 'transform 0.15s ease-out, opacity 0.15s ease-out';
        cloneEl.style.transform = `translateY(-50%) ${isHero ? 'scaleX(-1)' : ''} scale(3.5)`;
        cloneEl.style.opacity = '0';
        
        setTimeout(() => cloneEl.remove(), 200);

        // Spawn bubbles and tiny slimes
        const layer = document.getElementById(layerId);
        if (!layer) return;

        const emojis = ['🫧', '💧', '✨', '🐾', '🫧', '💙', '⭐', '💨'];
        for (let i = 0; i < 40; i++) {
            const el = document.createElement('div');
            el.className = 'clone-explosion-particle';
            el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            // random size
            const size = 0.5 + Math.random() * 2;
            el.style.fontSize = `${size}rem`;
            el.style.left = `${rect.left + rect.width/2}px`;
            el.style.top = `${rect.top + rect.height/2}px`;
            
            // Random direction
            const angle = Math.random() * Math.PI * 2;
            const dist = 30 + Math.random() * 150; // Tăng khoảng cách bay xa hơn
            el.style.setProperty('--tx', `${Math.cos(angle) * dist}px`);
            el.style.setProperty('--ty', `${Math.sin(angle) * dist}px`);
            
            layer.appendChild(el);
            setTimeout(() => el.remove(), 800); // match animation duration
        }
    },

    // ------------------------------------------------------------
    // LEGACY SKILLS ANIMATIONS (Imported from v2)
    // ------------------------------------------------------------
    playMeteorShower(targetEl, onComplete) {
        if (!targetEl) { if (onComplete) onComplete(); return; }
        const totalMeteors = 15;
        const fastInterval = 80;
        const giantMeteorDelay = (totalMeteors - 1) * fastInterval + 350;

        const createMeteor = (isGiant) => {
            const rect = targetEl.getBoundingClientRect();
            const targetX = rect.left + rect.width / 2 + window.scrollX;
            const targetY = rect.top + rect.height / 2 + window.scrollY;

            const meteor = document.createElement('div');
            meteor.innerText = '☄️';
            meteor.style.position = 'absolute';
            meteor.style.zIndex = '99999';
            meteor.style.pointerEvents = 'none';

            if (isGiant) {
                meteor.style.fontSize = '250px';
                meteor.style.filter = 'drop-shadow(0 0 20px #ff4500) brightness(1.5)';
            } else {
                meteor.style.fontSize = '40px';
            }

            const startX = targetX + (Math.random() * 300 - 150);
            const startY = targetY - (isGiant ? 600 : 400) - Math.random() * 100;

            meteor.style.left = startX + 'px';
            meteor.style.top = startY + 'px';
            meteor.style.transform = 'translate(-50%, -50%)';
            document.body.appendChild(meteor);

            const angle = Math.atan2(targetY - startY, targetX - startX) * (180 / Math.PI);
            const adjustAngle = angle - 135;
            const fallDuration = isGiant ? 600 : (150 + Math.random() * 100);

            const animation = meteor.animate([
                { left: startX + 'px', top: startY + 'px', transform: `translate(-50%, -50%) rotate(${adjustAngle}deg) scale(0.5)`, opacity: 0 },
                { left: startX + 'px', top: startY + 'px', transform: `translate(-50%, -50%) rotate(${adjustAngle}deg) scale(1)`, opacity: 1, offset: 0.1 },
                { left: targetX + 'px', top: targetY + 'px', transform: `translate(-50%, -50%) rotate(${adjustAngle}deg) scale(1)`, opacity: 1 }
            ], { duration: fallDuration, easing: 'ease-in' });

            animation.onfinish = () => {
                meteor.remove();
                if (isGiant && typeof SFX !== 'undefined' && SFX.explosion) SFX.explosion();
                if (!isGiant && typeof SFX !== 'undefined' && SFX.meteorFall) SFX.meteorFall();
            };
        };

        for (let i = 0; i < totalMeteors - 1; i++) {
            setTimeout(() => createMeteor(false), i * fastInterval);
        }

        setTimeout(() => {
            targetEl.animate([
                { boxShadow: '0 0 0px red' },
                { boxShadow: '0 0 50px red' },
                { boxShadow: '0 0 0px red' }
            ], { duration: 350, iterations: 1 });
        }, giantMeteorDelay - 350);

        setTimeout(() => {
            createMeteor(true);
            if (onComplete) onComplete();
        }, giantMeteorDelay + 600);
    },

    playDashRocket(targetPlayer, steps, durationMs, onComplete) {
        if (typeof durationMs === 'function') {
            onComplete = durationMs;
            durationMs = 2000; // fallback if called the old way
        }
        const sourceSuffix = targetPlayer === 'p2' ? '-p1' : (targetPlayer === 'p1' ? '-p2' : '');
        const targetSuffix = targetPlayer === 'p2' ? '-p2' : (targetPlayer === 'p1' ? '-p1' : '');
        
        const bossEl = document.getElementById(`boss-avatar-box${sourceSuffix}`);
        const heroEl = document.getElementById(`hero-avatar-box${targetSuffix}`);
        if (!bossEl || !heroEl) { if (onComplete) onComplete(); return; }

        const media = bossEl.querySelector('.boss-avatar-media');
        
        // 1. Arc Jump for boss
        if (media) {
            media.style.transition = 'transform 1s cubic-bezier(0.25, 1, 0.5, 1)'; 
            media.style.transform = 'translateY(-150px)';
            setTimeout(() => {
                media.style.transition = 'transform 0.5s cubic-bezier(0.5, 0, 0.75, 0)'; 
                media.style.transform = 'translateY(0)';
            }, 500);
        }

        // 2. Create Rocket under Boss
        const layer = document.getElementById('projectile-layer') || document.body;
        const rocket = document.createElement('div');
        rocket.innerText = '🚀';
        rocket.className = 'projectile';
        rocket.style.fontSize = '80px';
        rocket.style.transition = 'transform 1s cubic-bezier(0.25, 1, 0.5, 1)';
        
        const bRect = bossEl.getBoundingClientRect();
        const startX = bRect.left + bRect.width / 2;
        const startY = bRect.bottom - 40; 
        rocket.style.left = `${startX}px`;
        rocket.style.top = `${startY}px`;
        rocket.style.transform = `translate(-50%, -50%) translateY(-150px) rotate(-45deg)`; 
        
        layer.appendChild(rocket);

        // After jump (1s)
        setTimeout(() => {
            if (media) {
                media.style.transition = '';
                media.style.transform = '';
            }

            const newRect = bossEl.getBoundingClientRect();
            let rStart = null;
            const rDuration = durationMs || 2000;
            const hRect = heroEl.getBoundingClientRect();
            const tx = hRect.left + hRect.width / 2;
            const ty = hRect.top + hRect.height / 2;
            const rStartX = newRect.left + newRect.width / 2;
            const rStartY = newRect.bottom - 40;
            
            const angleDeg = Math.atan2(ty - rStartY, tx - rStartX) * (180 / Math.PI) + 45; 
            rocket.style.transform = `translate(-50%, -50%) rotate(${angleDeg}deg)`;
            rocket.style.transition = 'none';

            let lastTrail = 0;
            const animateRocket = (time) => {
                if (!rStart) rStart = time;
                let p = (time - rStart) / rDuration;
                if (p > 1) p = 1;
                
                const curX = rStartX + (tx - rStartX) * p;
                const curY = rStartY + (ty - rStartY) * p;
                
                rocket.style.left = `${curX}px`;
                rocket.style.top = `${curY}px`;
                
                if (time - lastTrail > 100) {
                    lastTrail = time;
                    const smoke = document.createElement('div');
                    smoke.innerText = '💨';
                    smoke.className = 'projectile';
                    smoke.style.left = `${curX}px`;
                    smoke.style.top = `${curY}px`;
                    smoke.style.fontSize = '40px';
                    smoke.style.opacity = '0.7';
                    smoke.style.transition = 'opacity 1s, transform 1s';
                    layer.appendChild(smoke);
                    setTimeout(() => {
                        smoke.style.opacity = '0';
                        smoke.style.transform = 'translate(-50%, -50%) scale(2)';
                    }, 50);
                    setTimeout(() => smoke.remove(), 1050);
                }
                
                if (p < 1) {
                    requestAnimationFrame(animateRocket);
                } else {
                    rocket.remove();
                    this.spawnTwinkles(heroEl);
                    if (onComplete) onComplete();
                }
            };
            requestAnimationFrame(animateRocket);
        }, 1000);
    },

    spawnTwinkles(targetEl) {
        const layer = document.getElementById('projectile-layer') || document.body;
        const rect = targetEl.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        
        for (let i = 0; i < 20; i++) {
            const star = document.createElement('div');
            star.innerText = '✨';
            star.className = 'projectile';
            star.style.left = `${cx}px`;
            star.style.top = `${cy}px`;
            star.style.fontSize = `${Math.random() * 20 + 20}px`;
            
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 150 + 50;
            const tx = Math.cos(angle) * dist;
            const ty = Math.sin(angle) * dist;
            
            star.style.transition = 'transform 1s cubic-bezier(0.25, 1, 0.5, 1), opacity 1s';
            layer.appendChild(star);
            
            setTimeout(() => {
                star.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) rotate(${Math.random() * 360}deg)`;
                star.style.opacity = '0';
            }, 50);
            
            setTimeout(() => star.remove(), 1050);
        }
    },

    playKamehameha(originEl, targetEl, onComplete) {
        if (!originEl || !targetEl) { if (onComplete) onComplete(); return; }
        
        // Determine direction based on position
        const isP1 = originEl.getBoundingClientRect().left < targetEl.getBoundingClientRect().left;

        const attRect = originEl.getBoundingClientRect();
        const tarRect = targetEl.getBoundingClientRect();
        const startX = attRect.left + attRect.width / 2 + window.scrollX;
        const startY = attRect.top + attRect.height / 2 + window.scrollY;
        const targetX = tarRect.left + tarRect.width / 2 + window.scrollX;
        const targetY = tarRect.top + tarRect.height / 2 + window.scrollY;

        const dx = targetX - startX;
        const dy = targetY - startY;
        const distance = Math.sqrt(dx*dx + dy*dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        if (typeof SFX !== 'undefined' && SFX.kameCharge) SFX.kameCharge();

        const CHARGE_TIME = 2800;
        const BEAM_DURATION = 1800;
        const GIF_STAY_TIME = 1200;
        const LASER_HEIGHT = 54;
        const LASER_OFFSET_X = isP1 ? 30 : -30;

        const gif = document.createElement('img');
        gif.src = 'assets/kamekameha.gif';
        gif.className = 'goku-gif';
        gif.onerror = function() {
            this.src = 'https://placehold.co/120x120/1a1a2e/00ffff?text=GOKU';
            this.style.borderRadius = '50%';
            this.style.border = '2px solid cyan';
        };
        gif.style.left = startX + 'px';
        gif.style.top = startY + 'px';
        gif.style.transform = `translate(-50%, -50%) ${isP1 ? '' : 'scaleX(-1)'}`;
        gif.style.zIndex = '99999';
        document.body.appendChild(gif);

        const energyBall = document.createElement('div');
        energyBall.className = 'kamehameha-ball';
        const ballOffsetX = isP1 ? 60 : -60;
        energyBall.style.left = (startX + ballOffsetX) + 'px';
        energyBall.style.top = startY + 'px';
        energyBall.style.transform = `translate(-50%, -50%)`;
        energyBall.style.zIndex = '100000';
        document.body.appendChild(energyBall);

        energyBall.animate([
            { width: '0px', height: '0px', opacity: 0 },
            { width: '20px', height: '20px', opacity: 1, offset: 0.2 },
            { width: '60px', height: '60px', opacity: 1 }
        ], { duration: CHARGE_TIME, fill: 'forwards' });

        setTimeout(() => {
            if (typeof SFX !== 'undefined' && SFX.kameBlast) SFX.kameBlast();

            const beam = document.createElement('div');
            beam.className = 'kamehameha-beam';
            beam.style.height = LASER_HEIGHT + 'px';
            beam.style.left = (startX + LASER_OFFSET_X) + 'px';
            beam.style.top = (startY - (LASER_HEIGHT / 2)) + 'px';
            beam.style.width = (distance - Math.abs(LASER_OFFSET_X)) + 'px';
            beam.style.transform = `rotate(${angle}deg)`;
            beam.style.transformOrigin = 'left center';
            beam.style.zIndex = '99998';
            document.body.appendChild(beam);

            const beamAnim = beam.animate([
                { transform: `rotate(${angle}deg) scaleX(0)`, opacity: 1 },
                { transform: `rotate(${angle}deg) scaleX(1)`, opacity: 1, offset: 0.05 },
                { transform: `rotate(${angle}deg) scaleX(1)`, opacity: 1, offset: 0.8 },
                { transform: `rotate(${angle}deg) scaleX(1)`, opacity: 0 }
            ], { duration: BEAM_DURATION, easing: 'ease-out' });

            setTimeout(() => {
                targetEl.animate([
                    { transform: 'translate(-10px, 0)' }, { transform: 'translate(10px, 0)' }
                ], { duration: 50, iterations: 20 });
                if (onComplete) onComplete();
            }, 50);

            setTimeout(() => {
                if (gif && document.body.contains(gif)) {
                    gif.animate([{opacity: 1}, {opacity: 0}], {duration: 300}).onfinish = () => gif.remove();
                }
            }, GIF_STAY_TIME);

            beamAnim.onfinish = () => {
                beam.remove();
                if (energyBall) energyBall.remove();
            };
        }, CHARGE_TIME);
    },

    playShuriken(originEl, targetEl, onComplete) {
        if (!originEl || !targetEl) { if(onComplete) onComplete(); return; }
        const startX = originEl.getBoundingClientRect().left + originEl.offsetWidth / 2 + window.scrollX;
        const startY = originEl.getBoundingClientRect().top + originEl.offsetHeight / 2 + window.scrollY;
        const targetX = targetEl.getBoundingClientRect().left + targetEl.offsetWidth / 2 + window.scrollX;
        const targetY = targetEl.getBoundingClientRect().top + targetEl.offsetHeight / 2 + window.scrollY;

        const baseAngle = Math.atan2(targetY - startY, targetX - startX);
        const numShurikens = 5;
        const radius = 120;
        const fanSpread = Math.PI / 2.5;
        const ringColors = ['#ff4757', '#3498db', '#f1c40f', '#9b59b6', '#00d2d3'];

        if (typeof SFX !== 'undefined' && SFX.shuriken) SFX.shuriken();

        let giantShuriken = document.createElement('img');
        giantShuriken.src = 'assets/Shuriken.png';
        giantShuriken.style.position = 'absolute';
        giantShuriken.style.width = '120px';
        giantShuriken.style.zIndex = '900';
        giantShuriken.style.left = startX + 'px';
        giantShuriken.style.top = startY + 'px';
        giantShuriken.style.transformOrigin = 'center';
        giantShuriken.style.pointerEvents = 'none';
        giantShuriken.onerror = function() { this.style.display = 'none'; };
        document.body.appendChild(giantShuriken);

        giantShuriken.animate([
            { transform: 'translate(-50%, -50%) rotate(0deg)' },
            { transform: 'translate(-50%, -50%) rotate(360deg)' }
        ], { duration: 1000, iterations: Infinity });

        let smallShurikens = [];
        for (let i = 0; i < numShurikens; i++) {
            let shuriken = document.createElement('img');
            shuriken.src = 'assets/Shuriken.png';
            shuriken.style.position = 'absolute';
            shuriken.style.width = '40px';
            shuriken.style.zIndex = '1000';
            shuriken.style.left = startX + 'px';
            shuriken.style.top = startY + 'px';
            shuriken.style.transformOrigin = 'center';
            shuriken.style.pointerEvents = 'none';
            shuriken.onerror = function() { this.style.display = 'none'; };
            document.body.appendChild(shuriken);
            smallShurikens.push(shuriken);

            const angleOffset = -fanSpread/2 + (fanSpread / (numShurikens - 1)) * i;
            const fanX = startX + Math.cos(baseAngle + angleOffset) * radius;
            const fanY = startY + Math.sin(baseAngle + angleOffset) * radius;

            shuriken.animate([
                { left: startX + 'px', top: startY + 'px', transform: 'translate(-50%, -50%) rotate(0deg) scale(1)' },
                { left: fanX + 'px', top: fanY + 'px', transform: 'translate(-50%, -50%) rotate(720deg) scale(1)' }
            ], { duration: 300, fill: 'forwards', easing: 'ease-out' });
        }

        setTimeout(() => {
            for (let i = 0; i < numShurikens; i++) {
                let s = smallShurikens[i];
                s.style.boxShadow = `0 0 20px 5px ${ringColors[i]}`;
                s.style.borderRadius = '50%';
                s.style.backgroundColor = 'rgba(0,0,0,0.4)';
                if (i === 0 && typeof SFX !== 'undefined' && SFX.shuriken) SFX.shuriken();
                
                const flyAnim = s.animate([
                    { left: s.style.left, top: s.style.top, transform: 'translate(-50%, -50%) rotate(0deg) scale(2)' },
                    { left: targetX + 'px', top: targetY + 'px', transform: 'translate(-50%, -50%) rotate(1080deg) scale(2)' }
                ], { duration: 400 + Math.random()*150, fill: 'forwards', easing: 'ease-in' });

                flyAnim.onfinish = () => {
                    s.remove();
                    if (i === 0) {
                        targetEl.classList.add('shake');
                        setTimeout(() => targetEl.classList.remove('shake'), 500);
                    }
                };
            }
        }, 1000);

        setTimeout(() => {
            if (typeof SFX !== 'undefined' && SFX.toxic) SFX.toxic();
            giantShuriken.style.boxShadow = '0 0 40px 20px #2ecc71';
            giantShuriken.style.borderRadius = '50%';
            giantShuriken.style.backgroundColor = 'rgba(46, 204, 113, 0.3)';

            const trailInterval = setInterval(() => {
                if(!document.body.contains(giantShuriken)) return clearInterval(trailInterval);
                const rect = giantShuriken.getBoundingClientRect();
                const curX = rect.left + rect.width/2 + window.scrollX;
                const curY = rect.top + rect.height/2 + window.scrollY;
                
                const trail = document.createElement('div');
                trail.innerText = Math.random() > 0.5 ? '💀' : '💨';
                trail.style.position = 'absolute';
                trail.style.fontSize = '30px';
                trail.style.filter = 'hue-rotate(250deg) saturate(3)';
                trail.style.zIndex = '899';
                trail.style.pointerEvents = 'none';
                document.body.appendChild(trail);
                
                trail.animate([
                    { left: curX + 'px', top: curY + 'px', transform: 'translate(-50%, -50%) scale(1)', opacity: 0.9 },
                    { left: (curX + (Math.random()-0.5)*60) + 'px', top: (curY - 40 - Math.random()*40) + 'px', transform: 'translate(-50%, -50%) scale(2)', opacity: 0 }
                ], { duration: 800 }).onfinish = () => trail.remove();
            }, 40);

            giantShuriken.animate([
                { left: startX + 'px', top: startY + 'px', transform: 'translate(-50%, -50%) rotate(0deg)' },
                { left: targetX + 'px', top: targetY + 'px', transform: 'translate(-50%, -50%) rotate(1080deg)' }
            ], { duration: 750, easing: 'ease-in' }).onfinish = () => {
                clearInterval(trailInterval);
                giantShuriken.remove();
                if (typeof SFX !== 'undefined' && SFX.toxicExplode) SFX.toxicExplode();
                if (onComplete) onComplete();
            };
        }, 2500);
    },

    playFireball(originEl, targetEl, onComplete) {
        if (!originEl || !targetEl) { if (onComplete) onComplete(); return; }
        const startX = originEl.getBoundingClientRect().left + originEl.offsetWidth / 2 + window.scrollX;
        const startY = originEl.getBoundingClientRect().top + originEl.offsetHeight / 2 + window.scrollY;
        const targetX = targetEl.getBoundingClientRect().left + targetEl.offsetWidth / 2 + window.scrollX;
        const targetY = targetEl.getBoundingClientRect().top + targetEl.offsetHeight / 2 + window.scrollY;

        if (typeof SFX !== 'undefined' && SFX.fireball) SFX.fireball();

        const casterImg = document.createElement('img');
        casterImg.src = 'assets/Fireball.gif?' + Date.now();
        casterImg.style.position = 'absolute';
        casterImg.style.width = '200px';
        casterImg.style.height = '200px';
        casterImg.style.borderRadius = '50%';
        casterImg.style.objectFit = 'cover';
        casterImg.style.border = '4px solid #ff5722';
        casterImg.style.boxShadow = '0 0 30px #ffeb3b';
        casterImg.style.zIndex = '99999';
        casterImg.style.left = startX + 'px';
        casterImg.style.top = startY + 'px';
        casterImg.style.transform = 'translate(-50%, -50%)';
        document.body.appendChild(casterImg);
        casterImg.onerror = () => { casterImg.style.display = 'none'; };

        casterImg.animate([
            { opacity: 0, transform: 'translate(-50%, -40%) scale(0.8)' },
            { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' }
        ], { duration: 300, fill: 'forwards', easing: 'ease-out' });

        setTimeout(() => {
            if (typeof SFX !== 'undefined' && SFX.fireballCast) SFX.fireballCast();

            const fireball = document.createElement('div');
            fireball.style.width = '60px';
            fireball.style.height = '60px';
            fireball.style.background = 'radial-gradient(circle at 30% 30%, #fff, #ffeb3b, #ff5722, #b71c1c)';
            fireball.style.borderRadius = '50%';
            fireball.style.boxShadow = '0 0 30px 15px rgba(255, 69, 0, 0.8)';
            fireball.style.position = 'absolute';
            fireball.style.zIndex = '99999';
            fireball.style.transformOrigin = 'center';
            fireball.style.pointerEvents = 'none';
            document.body.appendChild(fireball);

            const flightTime = 800;
            const anim = fireball.animate([
                { left: startX + 'px', top: startY + 'px', transform: 'translate(-50%, -50%) scale(1)' },
                { left: targetX + 'px', top: targetY + 'px', transform: 'translate(-50%, -50%) scale(2)' }
            ], { duration: flightTime, easing: 'ease-in' });

            const trailInterval = setInterval(() => {
                if(!document.body.contains(fireball)) return clearInterval(trailInterval);
                const rect = fireball.getBoundingClientRect();
                const p = document.createElement('div');
                p.style.position = 'absolute';
                p.style.left = (rect.left + rect.width / 2 + window.scrollX) + 'px';
                p.style.top = (rect.top + rect.height / 2 + window.scrollY) + 'px';
                p.style.width = (30 + Math.random() * 10) + 'px';
                p.style.height = p.style.width;
                const colors = ['#ffeb3b', '#ff9800', '#ff5722'];
                p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                p.style.borderRadius = '50%';
                p.style.pointerEvents = 'none';
                p.style.zIndex = '99998';
                p.style.boxShadow = `0 0 10px ${p.style.backgroundColor}`;
                document.body.appendChild(p);

                p.animate([
                    { transform: 'translate(-50%, -50%) scale(1)', opacity: 0.8 },
                    { transform: `translate(-50%, calc(-50% - 30px)) scale(0.2)`, opacity: 0 }
                ], { duration: 400 + Math.random()*200 }).onfinish = () => p.remove();
            }, 20);

            anim.onfinish = () => {
                clearInterval(trailInterval);
                fireball.remove();
                if (typeof SFX !== 'undefined' && SFX.explosion) SFX.explosion();
                
                const explosion = document.createElement('div');
                explosion.style.position = 'absolute';
                explosion.style.left = targetX + 'px';
                explosion.style.top = targetY + 'px';
                explosion.style.width = '10px';
                explosion.style.height = '10px';
                explosion.style.borderRadius = '50%';
                explosion.style.background = 'rgba(255, 69, 0, 0.5)';
                explosion.style.boxShadow = '0 0 80px 40px rgba(255, 69, 0, 0.8)';
                explosion.style.zIndex = '99999';
                explosion.style.pointerEvents = 'none';
                document.body.appendChild(explosion);

                explosion.animate([
                    { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
                    { transform: 'translate(-50%, -50%) scale(30)', opacity: 0 }
                ], { duration: 600, easing: 'ease-out' }).onfinish = () => explosion.remove();
                
                if (onComplete) onComplete();
            };

            casterImg.animate([
                { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
                { opacity: 0, transform: 'translate(-50%, -40%) scale(0.8)' }
            ], { duration: 300, fill: 'forwards', easing: 'ease-in' }).onfinish = () => casterImg.remove();
        }, 2000);
    },

    playTornado(targetEl, onComplete) {
        if (!targetEl) { if (onComplete) onComplete(); return; }
        if (typeof SFX !== 'undefined' && SFX.tornadoWind) SFX.tornadoWind();
        
        const targetX = targetEl.getBoundingClientRect().left + targetEl.offsetWidth / 2 + window.scrollX;
        const targetY = targetEl.getBoundingClientRect().top + targetEl.offsetHeight / 2 + window.scrollY;

        targetEl.classList.add('shake');
        setTimeout(() => targetEl.classList.remove('shake'), 2000);

        const tornado = document.createElement('img');
        tornado.src = 'assets/Tornado.gif?' + Date.now();
        tornado.style.position = 'absolute';
        tornado.style.height = '250px';
        tornado.style.width = 'auto';
        tornado.style.left = targetX + 'px';
        tornado.style.top = targetY + 'px';
        tornado.style.transform = 'translate(-50%, -50%)';
        tornado.style.zIndex = '1000';
        tornado.style.pointerEvents = 'none';
        tornado.onerror = function() { this.style.display = 'none'; };
        document.body.appendChild(tornado);
        
        if (onComplete) onComplete();

        setTimeout(() => {
            tornado.animate([
                { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
                { opacity: 0, transform: 'translate(-50%, -50%) scale(0.5)' }
            ], { duration: 500, fill: 'forwards', easing: 'ease-in' }).onfinish = () => tornado.remove();
        }, 2000);
    },

    playDeepFreeze(targetEl, onComplete) {
        if (!targetEl) { if(onComplete) onComplete(); return; }
        if (typeof SFX !== 'undefined' && SFX.freeze) SFX.freeze();
        
        const rect = targetEl.getBoundingClientRect();
        const targetX = rect.left + rect.width / 2 + window.scrollX;
        const targetY = rect.top + rect.height / 2 + window.scrollY;

        const cloud = document.createElement('img');
        cloud.src = 'assets/Snow-Olaf.png';
        cloud.style.position = 'absolute';
        cloud.style.width = '250px';
        cloud.style.zIndex = '1000';
        cloud.style.left = targetX + 'px';
        cloud.style.top = (targetY - 110) + 'px';
        cloud.style.transform = 'translate(-50%, -50%)';
        cloud.style.pointerEvents = 'none';
        document.body.appendChild(cloud);

        cloud.animate([
            { opacity: 0, transform: 'translate(-50%, -30%) scale(0.8)' },
            { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' }
        ], { duration: 500, fill: 'forwards', easing: 'ease-out' });

        const snowTimer = setInterval(() => {
            const startX = targetX + (Math.random() * 200 - 100);
            const startY = targetY - 100 + Math.random() * 30;
            const endY = targetY + 100;

            const snow = document.createElement('div');
            snow.innerText = '❄️';
            snow.style.position = 'absolute';
            snow.style.left = startX + 'px';
            snow.style.top = startY + 'px';
            snow.style.fontSize = (12 + Math.random() * 12) + 'px';
            snow.style.zIndex = '1000';
            snow.style.pointerEvents = 'none';
            snow.style.filter = 'drop-shadow(0 0 5px #00ffff)';
            document.body.appendChild(snow);

            snow.animate([
                { top: startY + 'px', transform: `translate(-50%, -50%) rotate(0deg)`, opacity: 1 },
                { top: endY + 'px', transform: `translate(-50%, -50%) rotate(${Math.random()*360}deg)`, opacity: 0 }
            ], { duration: 1000 + Math.random()*500, easing: 'linear' }).onfinish = () => snow.remove();
        }, 150);

        setTimeout(() => {
            clearInterval(snowTimer);
            if (typeof SFX !== 'undefined' && SFX.iceShatter) SFX.iceShatter();
            cloud.animate([
                { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
                { opacity: 0, transform: 'translate(-50%, -80px) scale(1.2)' }
            ], { duration: 500, fill: 'forwards', easing: 'ease-in' }).onfinish = () => cloud.remove();
            
            if (onComplete) onComplete();
        }, 4000);
    }
};


