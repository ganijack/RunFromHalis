/**
 * AudioManager.js — Web Audio API music system
 * 
 * Generates procedural menu ambience and game music using
 * oscillators and filters. Manages track switching and cleanup.
 */

export default class AudioManager {
    constructor() {
        this.ctx = null;
        this.initialized = false;
        this.currentTrack = null;
        this.nodes = [];
        this.timers = [];
        this.masterGain = null;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.25;
            this.masterGain.connect(this.ctx.destination);
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not available');
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    }

    stop() {
        this.timers.forEach(t => clearInterval(t));
        this.timers = [];
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        this.nodes.forEach(n => {
            try {
                n.gain.gain.linearRampToValueAtTime(0, now + 0.5);
                setTimeout(() => { try { n.osc.stop(); } catch (e) { } }, 600);
            } catch (e) { }
        });
        this.nodes = [];
        this.currentTrack = null;
    }

    /** Create an oscillator → filter → gain node chain */
    _tone(freq, type, vol, filterFreq) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        const f = this.ctx.createBiquadFilter();
        o.type = type;
        o.frequency.value = freq;
        g.gain.value = vol;
        f.type = 'lowpass';
        f.frequency.value = filterFreq || 800;
        f.Q.value = 1;
        o.connect(f);
        f.connect(g);
        g.connect(this.masterGain);
        o.start();
        const node = { osc: o, gain: g, filter: f };
        this.nodes.push(node);
        return node;
    }

    // ===== Menu Music (warm ambient drone) =====

    playMenu() {
        this.init();
        this.resume();
        if (this.currentTrack === 'menu') return;
        this.stop();
        this.currentTrack = 'menu';

        // Am chord drone
        this._tone(110, 'sine', 0.07, 500);
        this._tone(110.3, 'sine', 0.05, 480);
        this._tone(164.81, 'sine', 0.05, 600);
        this._tone(220, 'sine', 0.04, 700);
        this._tone(261.63, 'sine', 0.03, 500);
        this._tone(329.63, 'sine', 0.02, 600);

        // Slow filter sweep
        let dir = 1, val = 500;
        this.timers.push(setInterval(() => {
            val += dir * 3;
            if (val > 900) dir = -1;
            if (val < 350) dir = 1;
            this.nodes.forEach(n => { try { n.filter.frequency.value = val; } catch (e) { } });
        }, 80));

        // Sparkle notes
        const sp = [880, 1046.5, 1318.5, 1568, 1760];
        const doSparkle = () => {
            if (this.currentTrack !== 'menu') return;
            const freq = sp[Math.floor(Math.random() * sp.length)];
            const n = this._tone(freq, 'sine', 0, 3000);
            const now = this.ctx.currentTime;
            n.gain.gain.linearRampToValueAtTime(0.02, now + 0.5);
            n.gain.gain.linearRampToValueAtTime(0, now + 3);
            setTimeout(() => { try { n.osc.stop(); } catch (e) { } }, 3500);
            this.timers.push(setTimeout(doSparkle, 2500 + Math.random() * 3000));
        };
        this.timers.push(setTimeout(doSparkle, 1500));
    }

    // ===== Game Music (driving synth) =====

    playGame() {
        this.init();
        this.resume();
        if (this.currentTrack === 'game') return;
        this.stop();
        this.currentTrack = 'game';

        // Sub bass
        this._tone(55, 'sine', 0.09, 150);

        // Bass line
        const bass = this._tone(110, 'sawtooth', 0.05, 250);
        const bassNotes = [110, 110, 82.41, 82.41, 87.31, 87.31, 98, 98];
        let bi = 0;
        this.timers.push(setInterval(() => {
            if (this.currentTrack !== 'game') return;
            bass.osc.frequency.setValueAtTime(bassNotes[bi % bassNotes.length], this.ctx.currentTime);
            bi++;
        }, 500));

        // Warm pad
        this._tone(220, 'sine', 0.025, 800);
        this._tone(277.18, 'sine', 0.02, 700);
        this._tone(329.63, 'sine', 0.018, 900);

        // Lead arpeggio
        const leadNotes = [440, 523.25, 659.25, 880, 659.25, 523.25];
        let li = 0;
        this.timers.push(setInterval(() => {
            if (this.currentTrack !== 'game') return;
            const freq = leadNotes[li % leadNotes.length];
            const n = this._tone(freq, 'square', 0, 1200);
            const now = this.ctx.currentTime;
            n.gain.gain.linearRampToValueAtTime(0.025, now + 0.03);
            n.gain.gain.linearRampToValueAtTime(0, now + 0.1);
            setTimeout(() => { try { n.osc.stop(); } catch (e) { } }, 150);
            li++;
        }, 125));

        // Hi-hat feel
        this.timers.push(setInterval(() => {
            if (this.currentTrack !== 'game') return;
            const n = this._tone(6000 + Math.random() * 4000, 'sawtooth', 0, 8000);
            const now = this.ctx.currentTime;
            n.gain.gain.linearRampToValueAtTime(0.008, now + 0.005);
            n.gain.gain.linearRampToValueAtTime(0, now + 0.04);
            setTimeout(() => { try { n.osc.stop(); } catch (e) { } }, 60);
        }, 250));
    }
}
