// ============================================================
// MAGIC REALM BATTLE - sfx.js
// Sound effects using Web Audio API
// ============================================================

const SFX = {
    ctx: null,
    enabled: true,

    init() {
        if (!this.ctx) {
            try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
        }
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    },

    play(freq, type, dur, slideFreq = null, vol = 0.08) {
        if (!this.enabled || !this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            if (slideFreq) osc.frequency.exponentialRampToValueAtTime(slideFreq, this.ctx.currentTime + dur);
            gain.gain.setValueAtTime(vol, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
            osc.start();
            osc.stop(this.ctx.currentTime + dur);
        } catch(e) {}
    },

    createNoiseBuffer() {
        if (!this.ctx) return null;
        if (this.noiseBuffer) return this.noiseBuffer;
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
        this.noiseBuffer = buffer;
        return buffer;
    },

    playNoise(dur, vol, filterFreq) {
        if (!this.enabled || !this.ctx) return;
        try {
            const buffer = this.createNoiseBuffer();
            if (!buffer) return;
            const noiseSource = this.ctx.createBufferSource();
            noiseSource.buffer = buffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = filterFreq || 1000;
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(vol, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + dur);
            noiseSource.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            noiseSource.start();
            noiseSource.stop(this.ctx.currentTime + dur);
        } catch(e) {}
    },

    // Hero actions
    correct()  { this.play(660, 'sine', 0.08); setTimeout(() => this.play(880, 'sine', 0.2), 80); },
    wrong()    { this.play(180, 'sawtooth', 0.15); setTimeout(() => this.play(140, 'sawtooth', 0.25), 100); },
    combo()    { [400,500,600,700,900].forEach((f,i) => setTimeout(() => this.play(f,'sine',0.15), i*60)); },
    bigSnow()  { [300,400,600,800,1000].forEach((f,i) => setTimeout(() => this.play(f,'square',0.2), i*50)); },
    shoot()    { this.play(900, 'square', 0.12, 100, 0.08); },
    mana()     { this.play(440, 'sine', 0.1, 880, 0.05); },

    // Skill sounds
    freeze()   { 
        this.play(1400,'triangle',0.2, 2000, 0.1); 
        this.play(800,'sine',0.1, 1600, 0.1);
        this.playNoise(0.2, 0.3, 5000); 
    },
    shatter()  {
        this.play(2000, 'square', 0.1, 3000, 0.05);
        this.play(1500, 'sawtooth', 0.2, 1000, 0.1);
        this.playNoise(0.5, 0.6, 6000);
    },
    fire()     { 
        this.play(200,'sawtooth',0.3, 800, 0.1); 
        this.playNoise(0.6, 0.4, 2000);
    },
    fireball() {
        if (!this.enabled || !this.ctx) return;
        const audio = new Audio('./assets/Fireball-sound.mp3');
        audio.volume = 0.8;
        audio.play().catch(e => console.warn(e));
    },
    kameCharge() {
        if (!this.enabled || !this.ctx) return;
        const audio = new Audio('./assets/audiokamekameha.mp3');
        audio.volume = 1.0;
        audio.play().catch(e => console.warn(e));
    },
    thunder()  { 
        this.play(60,'sawtooth',1.0, 20, 0.4); 
        setTimeout(()=>this.play(120,'square',0.6,30,0.3),100);
        this.playNoise(1.5, 0.8, 300);
        setTimeout(() => this.playNoise(1.0, 0.6, 200), 200);
    },
    shield()   { this.play(200,'sine',0.4,700,0.1); },
    sleep()    { this.play(300,'sine',0.8,100,0.06); },
    hurricane()  { this.play(150,'sawtooth',0.3,400,0.1); },
    star()     { [600,700,800,900,1000].forEach((f,i) => setTimeout(()=>this.play(f,'sine',0.15), i*80)); },

    // Boss sounds
    bossFireBreath() { 
        [100,150,200,250].forEach((f,i) => setTimeout(()=>this.play(f,'sawtooth',0.3), i*100)); 
        this.playNoise(1.2, 0.5, 1500);
    },
    bossCurse()  { this.play(80,'sawtooth',1.2,40,0.2); },
    bossShield() { this.play(150,'square',0.6,500,0.15); },
    bossRage()   { [200,150,100,80,60].forEach((f,i) => setTimeout(()=>this.play(f,'sawtooth',0.4), i*120)); },
    
    roar() {
        if (!this.enabled || !this.ctx) return;
        const audio = new Audio('./sounds/roar.mp3');
        audio.volume = 0.8;
        audio.onerror = () => {
            const wavAudio = new Audio('./sounds/Roar.wav');
            wavAudio.volume = 0.8;
            wavAudio.onerror = () => this.thunder();
            wavAudio.play().catch(e => console.warn(e));
        };
        audio.play().catch(e => console.warn(e));
    },

    // Game end
    win()  { [300,400,500,600,800,1000].forEach((f,i)=>setTimeout(()=>this.play(f,'square',0.3),i*120)); },
    lose() { [400,300,250,200,150].forEach((f,i)=>setTimeout(()=>this.play(f,'sawtooth',0.5),i*180)); },
};

