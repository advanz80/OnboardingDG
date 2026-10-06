// Volledig gegenereerde muziek en geluidseffecten via de Web Audio API.
// Muziek: een kleine sequencer met lookahead-scheduling en shanty-thema's in 6/8.
import { SaveManager } from './SaveManager.js';

const midiToHz = (m) => 440 * Math.pow(2, (m - 69) / 12);

// ── Melodieën (stappen = achtste noten, 6 per maat in 6/8) ──────────────────
// Getallen = halve tonen t.o.v. grondtoon, '-' = aanhouden, '.' = rust.
const MELODIES = {
  shanty: [
    7, '.', 7, 7, 5, 3, 5, '.', 5, 5, 3, 2, 3, '.', 3, 3, 2, 0, 2, '-', 0, 2, '-', 5,
    7, '.', 7, 7, 5, 3, 5, '.', 5, 5, 7, 9, 10, 9, 7, 5, 3, 2, 0, '-', '-', 0, '.', '.',
    12, '-', 10, 9, '-', 7, 10, '-', 9, 7, '-', 5, 9, '-', 7, 5, '-', 3, 2, '-', 3, 5, '-', '.',
    7, '.', 7, 10, 9, 7, 5, '.', 3, 2, 3, 5, 7, 5, 3, 2, '-', -2, 0, '-', '-', 0, '.', '.',
  ],
  bright: [
    0, '.', 4, 7, '-', 4, 5, '.', 9, 12, '-', 9, 7, '-', 4, 0, '-', 4, 2, '-', '-', 7, '.', '.',
    0, '.', 4, 7, '-', 4, 5, '.', 9, 12, '-', 14, 12, 11, 9, 7, 5, 2, 0, '-', '-', 0, '.', '.',
  ],
  tense: [
    0, 3, 7, 0, 3, 7, -2, 2, 5, -2, 2, 5, -4, 0, 3, -4, 0, 3, -5, -1, 2, 5, 2, -1,
    0, 3, 7, 12, 7, 3, -2, 2, 5, 10, 5, 2, -4, 0, 3, 8, 3, 0, -5, -1, 2, 7, '-', '.',
  ],
  calm: [
    4, '-', '-', 7, '-', 9, 7, '-', '-', 4, '-', 2, 0, '-', '-', 2, '-', 4, 2, '-', '-', '-', '.', '.',
    4, '-', '-', 7, '-', 9, 12, '-', '-', 9, '-', 7, 9, '-', 7, 4, '-', 2, 0, '-', '-', '-', '.', '.',
  ],
};
// Akkoord-grondtoon per maat (halve tonen)
const BASS = {
  shanty: [0, -2, 3, -5, 0, -2, 3, 0, 3, -2, -4, -5, 0, -2, -5, 0],
  bright: [0, 5, 7, 7, 0, 5, 7, 0],
  tense: [0, -2, -4, -5, 0, -2, -4, -5],
  calm: [0, 5, 0, 7, 0, 5, 7, 0],
};

const THEMES = {
  menu: { mel: 'shanty', root: 62, bpm: 150, lead: 'square', bass: 'triangle', drums: 'jig', vol: 0.9 },
  world: { mel: 'shanty', root: 62, bpm: 132, lead: 'triangle', bass: 'triangle', drums: 'soft', vol: 0.8, harmony: true },
  bhc: { mel: 'bright', root: 65, bpm: 140, lead: 'square', bass: 'triangle', drums: 'jig', vol: 0.8, arp: true },
  driessen: { mel: 'shanty', root: 64, bpm: 168, lead: 'square', bass: 'square', drums: 'jig', vol: 0.75 },
  bloeij: { mel: 'calm', root: 67, bpm: 110, lead: 'sine', bass: 'triangle', drums: 'soft', vol: 0.9, arp: true },
  ijk: { mel: 'tense', root: 62, bpm: 150, lead: 'square', bass: 'sawtooth', drums: 'tech', vol: 0.7, arp: true },
  haert: { mel: 'bright', root: 60, bpm: 150, lead: 'marimba', bass: 'triangle', drums: 'jig', vol: 0.9 },
  reijn: { mel: 'shanty', root: 57, bpm: 120, lead: 'accordion', bass: 'triangle', drums: 'soft', vol: 0.75, harmony: true },
  finale: { mel: 'tense', root: 57, bpm: 176, lead: 'sawtooth', bass: 'square', drums: 'battle', vol: 0.75 },
  credits: { mel: 'bright', root: 62, bpm: 150, lead: 'square', bass: 'triangle', drums: 'jig', vol: 0.9, harmony: true, arp: true },
};

const DRUMS = {
  // per stap (6 per maat): k=kick, s=snare, h=hat
  jig: ['k', 'h', 'h', 's', 'h', 'h'],
  soft: ['k', '', 'h', '', '', 'h'],
  tech: ['k', 'h', 'k', 's', 'h', 'h'],
  battle: ['k', 'h', 'k', 's', 'k', 'h'],
};

class AudioEngineClass {
  constructor() {
    this.ctx = null;
    this.muted = SaveManager.settings.muted;
    this.theme = null;
    this.pendingTheme = null;
    this.step = 0;
    this.nextTime = 0;
    this.timer = null;
  }

  /** Wordt aangeroepen bij de eerste gebruikersactie (browserregel). */
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 4;
      comp.connect(this.ctx.destination);
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 1;
      this.master.connect(comp);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = SaveManager.settings.musicVolume * 0.5;
      this.musicGain.connect(this.master);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = SaveManager.settings.sfxVolume;
      this.sfxGain.connect(this.master);
      // ruisbuffer
      const len = this.ctx.sampleRate;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) this.ctx.suspend(); else this.ctx.resume();
      });
      if (this.pendingTheme) { const p = this.pendingTheme; this.pendingTheme = null; this.music(p); }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setMuted(m) {
    this.muted = m;
    SaveManager.settings.muted = m;
    SaveManager.saveSettings();
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, 0.05);
  }
  toggleMute() { this.setMuted(!this.muted); return this.muted; }

  // ── Muziek ────────────────────────────────────────────────────────────────
  music(name) {
    if (!this.ctx) { this.pendingTheme = name; return; }
    if (this.theme === name || this.nextTheme === name) return;
    this.nextTheme = name;
    const start = () => {
      if (this.nextTheme !== name) return; // inmiddels een ander thema gevraagd
      this.nextTheme = null;
      this.theme = name;
      this.cfg = THEMES[name];
      this.step = 0;
      this.nextTime = this.ctx.currentTime + 0.08;
      this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.musicGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      this.musicGain.gain.linearRampToValueAtTime(SaveManager.settings.musicVolume * 0.5 * this.cfg.vol, this.ctx.currentTime + 0.6);
      if (!this.timer) this.timer = setInterval(() => this._schedule(), 25);
    };
    if (this.theme) {
      this.musicGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.12);
      this.theme = null;
      setTimeout(start, 380);
    } else start();
  }

  stopMusic() {
    this.nextTheme = null;
    if (!this.ctx) return;
    this.musicGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.15);
    this.theme = null;
  }

  _schedule() {
    if (!this.theme || !this.ctx || this.ctx.state !== 'running') return;
    const stepDur = 60 / this.cfg.bpm / 2; // achtste noot
    while (this.nextTime < this.ctx.currentTime + 0.12) {
      this._playStep(this.step, this.nextTime, stepDur);
      this.nextTime += stepDur;
      this.step++;
    }
  }

  _playStep(step, t, dur) {
    const c = this.cfg;
    const mel = MELODIES[c.mel];
    const i = step % mel.length;
    const n = mel[i];
    if (typeof n === 'number') {
      let len = 1;
      while (mel[(i + len) % mel.length] === '-' && len < 6) len++;
      this._lead(c.root + n, t, dur * len * 0.92, c.lead, 0.16);
      if (c.harmony && i % 3 === 0) this._lead(c.root + n - 5, t, dur * len * 0.9, 'triangle', 0.06);
    }
    const bar = Math.floor(step / 6);
    const bassLine = BASS[c.mel];
    const root = c.root - 24 + bassLine[bar % bassLine.length];
    const s = step % 6;
    if (s === 0) this._bass(root, t, dur * 2.6, c.bass);
    if (s === 3) this._bass(root + 7, t, dur * 2.2, c.bass);
    if (c.arp && s % 2 === 1) this._lead(root + 24 + [0, 3, 7, 12][(step >> 1) % 4], t, dur * 0.5, 'square', 0.035);
    const d = DRUMS[c.drums][s];
    if (d === 'k') this._kick(t);
    if (d === 's') this._snare(t);
    if (d === 'h') this._hat(t);
  }

  _env(g, t, peak, a, dcy) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dcy);
  }

  _lead(midi, t, len, type, vol) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    let out = g;
    if (type === 'marimba') {
      o.type = 'sine';
      this._env(g, t, vol * 1.6, 0.005, Math.min(len, 0.35));
      const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = midiToHz(midi + 24);
      const g2 = ctx.createGain(); this._env(g2, t, vol * 0.3, 0.003, 0.08);
      o2.connect(g2).connect(this.musicGain); o2.start(t); o2.stop(t + 0.2);
    } else if (type === 'accordion') {
      o.type = 'sawtooth';
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1800;
      const o2 = ctx.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = midiToHz(midi) * 1.006;
      o2.connect(f); o2.start(t); o2.stop(t + len + 0.05);
      o.connect(f); f.connect(g); out = null;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol * 0.5, t + 0.04);
      g.gain.setValueAtTime(vol * 0.5, t + Math.max(0.05, len - 0.05)); g.gain.linearRampToValueAtTime(0.0001, t + len);
      g.connect(this.musicGain);
    } else {
      o.type = type;
      const peak = type === 'square' || type === 'sawtooth' ? vol * 0.55 : vol;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + 0.012);
      g.gain.setValueAtTime(peak, t + Math.max(0.02, len * 0.6));
      g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    }
    o.frequency.value = midiToHz(midi);
    // vibrato
    if (len > 0.3) {
      const lfo = ctx.createOscillator(); lfo.frequency.value = 5.5;
      const lg = ctx.createGain(); lg.gain.value = 4;
      lfo.connect(lg).connect(o.frequency); lfo.start(t + 0.12); lfo.stop(t + len + 0.05);
    }
    if (out) o.connect(g).connect(this.musicGain);
    o.start(t); o.stop(t + len + 0.05);
  }

  _bass(midi, t, len, type) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type; o.frequency.value = midiToHz(midi);
    const v = type === 'triangle' ? 0.3 : 0.1;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    if (type !== 'triangle') {
      const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 700;
      o.connect(f).connect(g);
    } else o.connect(g);
    g.connect(this.musicGain);
    o.start(t); o.stop(t + len + 0.02);
  }

  _kick(t, dest = this.musicGain, vol = 0.5) {
    const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    o.connect(g).connect(dest); o.start(t); o.stop(t + 0.2);
  }

  _noise(t, len, filterType, freq, vol, dest = this.musicGain, q = 1) {
    const s = this.ctx.createBufferSource(); s.buffer = this.noise;
    const f = this.ctx.createBiquadFilter(); f.type = filterType; f.frequency.value = freq; f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    s.connect(f).connect(g).connect(dest);
    s.start(t, Math.random() * 0.5); s.stop(t + len + 0.02);
    return { s, f, g };
  }
  _snare(t) { this._noise(t, 0.12, 'bandpass', 1800, 0.25); }
  _hat(t) { this._noise(t, 0.04, 'highpass', 7000, 0.1); }

  // ── Geluidseffecten ───────────────────────────────────────────────────────
  _tone(freq, t, len, type = 'square', vol = 0.15, slideTo = null) {
    const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + len);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g).connect(this.sfxGain); o.start(t); o.stop(t + len + 0.02);
  }

  sfx(name) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime + 0.005;
    const T = (f, d, ty, v, s, off = 0) => this._tone(f, t + off, d, ty, v, s);
    switch (name) {
      case 'click': T(880, 0.05, 'square', 0.08); break;
      case 'type': T(500 + Math.random() * 300, 0.025, 'square', 0.03); break;
      case 'pop': T(300, 0.12, 'sine', 0.3, 900); break;
      case 'select': T(660, 0.06, 'square', 0.08); T(990, 0.08, 'square', 0.08, null, 0.05); break;
      case 'coin': T(988, 0.07, 'square', 0.1); T(1319, 0.25, 'square', 0.1, null, 0.07); break;
      case 'pickup': [523, 659, 784, 1047].forEach((f, i) => T(f, 0.1, 'square', 0.09, null, i * 0.05)); break;
      case 'good': T(660, 0.08, 'triangle', 0.25); T(880, 0.16, 'triangle', 0.25, null, 0.08); break;
      case 'great': [523, 659, 784, 1047, 1319].forEach((f, i) => T(f, 0.12, 'square', 0.08, null, i * 0.045)); break;
      case 'bad': T(220, 0.25, 'sawtooth', 0.12, 110); break;
      case 'error': T(180, 0.1, 'square', 0.12); T(140, 0.18, 'square', 0.12, null, 0.1); break;
      case 'whoosh': { const n = this._noise(t, 0.35, 'bandpass', 400, 0.25, this.sfxGain, 2); n.f.frequency.exponentialRampToValueAtTime(3000, t + 0.3); break; }
      case 'splash': this._noise(t, 0.4, 'lowpass', 1200, 0.35, this.sfxGain); T(400, 0.15, 'sine', 0.15, 120); break;
      case 'cannon': this._kick(t, this.sfxGain, 0.9); this._noise(t, 0.6, 'lowpass', 600, 0.6, this.sfxGain); break;
      case 'hit': this._noise(t, 0.12, 'lowpass', 2000, 0.4, this.sfxGain); T(160, 0.12, 'square', 0.15, 60); break;
      case 'build': this._kick(t, this.sfxGain, 0.5); T(392, 0.1, 'square', 0.08, null, 0.05); break;
      case 'unlock': [392, 523, 659, 784].forEach((f, i) => T(f, 0.18, 'triangle', 0.22, null, i * 0.08)); break;
      case 'step': this._noise(t, 0.04, 'lowpass', 900, 0.06, this.sfxGain); break;
      case 'squawk': T(1200, 0.08, 'sawtooth', 0.08, 700); T(1100, 0.1, 'sawtooth', 0.08, 600, 0.09); break;
      case 'countdown': T(660, 0.12, 'square', 0.12); break;
      case 'go': T(1320, 0.3, 'square', 0.12); break;
      case 'tick': T(1500, 0.02, 'square', 0.05); break;
      case 'rotate': T(700, 0.05, 'triangle', 0.15, 900); break;
      case 'flow': [523, 587, 659, 784, 880, 1047].forEach((f, i) => T(f, 0.09, 'triangle', 0.15, null, i * 0.06)); break;
      case 'fanfare': {
        const seq = [[523, 0], [659, 0.12], [784, 0.24], [1047, 0.36], [784, 0.54], [1047, 0.66]];
        seq.forEach(([f, o]) => { T(f, 0.22, 'square', 0.08, null, o); T(f / 2, 0.22, 'triangle', 0.15, null, o); });
        break;
      }
      case 'lose': [392, 349, 311, 262].forEach((f, i) => T(f, 0.22, 'triangle', 0.2, null, i * 0.16)); break;
      default: break;
    }
  }
}

export const Audio = new AudioEngineClass();
