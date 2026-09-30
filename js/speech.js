// ============================================================
// MAGIC REALM BATTLE - speech.js
// Web Speech API for Team mode microphone input
// ============================================================

const Speech = {
    recognition: null,
    isListening: false,
    onResult: null,   // callback(transcript)
    onEnd: null,
    continuous: false,

    isSupported() {
        return !!( window.SpeechRecognition || window.webkitSpeechRecognition );
    },

    init() {
        if (!this.isSupported()) return false;
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SR();
        this.recognition.lang = 'vi-VN';   // Vietnamese first
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 3;

        this.recognition.onresult = (e) => {
            const transcript = e.results[0][0].transcript.toLowerCase().trim();
            if (this.onResult) this.onResult(transcript);
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.updateMicUI(false);
            if (this.onEnd) this.onEnd();
        };

        this.recognition.onerror = (e) => {
            console.warn('Speech error:', e.error);
            this.isListening = false;
            this.updateMicUI(false);
        };

        return true;
    },

    startListening(resultCb, endCb) {
        if (!this.recognition) this.init();
        if (!this.recognition) return;
        this.onResult = resultCb;
        this.onEnd = endCb;
        try {
            this.recognition.start();
            this.isListening = true;
            this.updateMicUI(true);
        } catch(e) {}
    },

    stopListening() {
        if (this.recognition && this.isListening) {
            try { this.recognition.stop(); } catch(e) {}
        }
        this.isListening = false;
        this.updateMicUI(false);
    },

    updateMicUI(active) {
        const btn1 = document.getElementById('btn-mic');
        const ind1 = document.getElementById('mic-indicator');
        if (btn1) btn1.classList.toggle('listening', active);
        if (ind1) ind1.classList.toggle('hidden', !active);

        const btn2 = document.getElementById('btn-mic-global');
        const ind2 = document.getElementById('mic-indicator-global');
        if (btn2) btn2.classList.toggle('listening', active);
        if (ind2) ind2.classList.toggle('hidden', !active);
    },
};
