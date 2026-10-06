import { MISSION_IDS } from '../config/brands.js';

const KEY = 'ppz.save.v1';
const SETTINGS_KEY = 'ppz.settings.v1';

function safeGet(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
function safeSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* privé-modus */ }
}

function freshState(player) {
  return {
    version: 1,
    player,
    fragments: Object.fromEntries(MISSION_IDS.map((id) => [id, false])),
    best: {},            // { [missionId]: { score, stars } }
    crewDefected: 0,     // uit de Reijn-missie, helpt in de finale
    elapsedMs: 0,        // totale actieve speeltijd
    pos: null,           // laatste positie in het park
    seenIntro: false,
    finished: false,
    finaleScore: 0,
  };
}

class SaveManagerClass {
  constructor() {
    this.state = safeGet(KEY);
    this.settings = { muted: false, musicVolume: 0.5, sfxVolume: 0.8, ...(safeGet(SETTINGS_KEY) || {}) };
  }

  hasSave() { return !!(this.state && this.state.player && !this.state.finished); }

  newGame(player) {
    this.state = freshState(player);
    this.save();
  }

  save() { if (this.state) safeSet(KEY, this.state); }
  saveSettings() { safeSet(SETTINGS_KEY, this.settings); }

  completeMission(id, score, stars, extra = {}) {
    const s = this.state;
    s.fragments[id] = true;
    const prev = s.best[id];
    if (!prev || score > prev.score) s.best[id] = { score, stars };
    if (id === 'reijn' && extra.crewDefected !== undefined) {
      s.crewDefected = Math.max(s.crewDefected, extra.crewDefected);
    }
    this.save();
  }

  fragmentCount() { return this.state ? Object.values(this.state.fragments).filter(Boolean).length : 0; }
  allFragments() { return this.fragmentCount() === MISSION_IDS.length; }

  totalScore() {
    if (!this.state) return 0;
    const m = Object.values(this.state.best).reduce((a, b) => a + b.score, 0);
    return m + (this.state.finaleScore || 0);
  }

  addTime(ms) { if (this.state && !this.state.finished) this.state.elapsedMs += ms; }

  finish(finaleScore) {
    this.state.finaleScore = finaleScore;
    this.state.finished = true;
    this.save();
  }
}

export const SaveManager = new SaveManagerClass();
