// Leaderboard via een abstractielaag. Met Supabase ingevuld in src/config/leaderboard.js
// is het een gedeeld leaderboard voor iedereen; zonder (of zonder internet) valt het
// terug op de scores op het eigen apparaat. Mislukte inzendingen worden later opnieuw
// verstuurd.
import { LEADERBOARD } from '../config/leaderboard.js';

/**
 * @typedef {{ name: string, score: number, timeMs: number, date: string }} Entry
 * Een provider implementeert:
 *   async submit(entry: Entry): Promise<void>
 *   async top(limit: number): Promise<Entry[]>
 */

const KEY = 'odg.leaderboard.v1';

export class LocalStorageProvider {
  _read() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
  }
  async submit(entry) {
    const list = this._read();
    list.push(entry);
    list.sort(compare);
    try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, 100))); } catch { /* vol of privé */ }
  }
  async top(limit = 10) { return this._read().sort(compare).slice(0, limit); }
}

/**
 * Supabase (PostgREST) met de gedeelde tabel `app_data` (zie docs/supabase.sql):
 * elke score is een rij met app = 'OnboardingDG', key = 'leaderboard' en de score als JSON in `value`.
 */
export class SupabaseProvider {
  constructor(url, anonKey, { table = 'app_data', app = 'OnboardingDG', key = 'leaderboard' } = {}) {
    this.base = `${url.replace(/\/+$/, '')}/rest/v1/${table}`;
    this.anon = anonKey;
    this.app = app;
    this.key = key;
    this.filter = `app=eq.${encodeURIComponent(app)}&key=eq.${encodeURIComponent(key)}`;
  }
  async _fetch(query, opts = {}) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 7000);
    try {
      const r = await fetch(this.base + query, {
        ...opts,
        signal: ctrl.signal,
        headers: { apikey: this.anon, Authorization: `Bearer ${this.anon}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
      });
      if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
      return r;
    } finally { clearTimeout(timer); }
  }
  async submit(entry) {
    const row = { app: this.app, key: this.key, value: entry };
    await this._fetch('', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(row) });
  }
  async top(limit = 10) {
    let rows;
    try {
      // sorteren in de database op velden binnen de JSON
      rows = await (await this._fetch(`?select=value&${this.filter}&order=value->score.desc,value->timeMs.asc&limit=${limit}`)).json();
    } catch (e) {
      if (e.name === 'AbortError' || e instanceof TypeError) throw e; // offline: niet nog eens proberen
      // vangnet: haal de nieuwste scores op en sorteer zelf
      rows = await (await this._fetch(`?select=value&${this.filter}&order=created_at.desc&limit=1000`)).json();
    }
    return rows.map((r) => sanitize(r.value)).filter(Boolean).sort(compare).slice(0, limit);
  }
}

/** Iedereen kan in app_data schrijven: lees alleen geldige scores. */
function sanitize(v) {
  if (!v || typeof v !== 'object') return null;
  const score = Number(v.score), timeMs = Number(v.timeMs);
  if (!Number.isFinite(score) || !Number.isFinite(timeMs) || score < 0 || score > 20000 || timeMs < 0) return null;
  return { name: String(v.name || 'Anoniem').slice(0, 20), org: String(v.org || '').slice(0, 40), score: Math.round(score), timeMs: Math.round(timeMs), date: String(v.date || '') };
}

function compare(a, b) { return b.score - a.score || a.timeMs - b.timeMs; }

/** Is dit dezelfde inzending? (Supabase geeft de datum in een ander formaat terug.) */
export function sameEntry(a, b) {
  return !!a && !!b && a.name === b.name && Math.abs(new Date(a.date) - new Date(b.date)) < 2;
}

const PENDING = 'odg.leaderboard.pending.v1';
const readPending = () => { try { return JSON.parse(localStorage.getItem(PENDING)) || []; } catch { return []; } };
const writePending = (list) => { try { localStorage.setItem(PENDING, JSON.stringify(list.slice(-20))); } catch { /* privé */ } };

class LeaderboardService {
  constructor(local, remote = null) {
    this.local = local;
    this.remote = remote;
    /** 'online' = gedeeld leaderboard, 'local' = alleen dit apparaat. */
    this.lastSource = remote ? 'online' : 'local';
  }
  setProvider(p) { this.remote = p; }
  get shared() { return !!this.remote; }

  async submit(entry) {
    const clean = {
      name: String(entry.name || '').trim().slice(0, 20) || 'Anoniem',
      org: String(entry.org || '').trim().slice(0, 40),
      score: Math.min(20000, Math.max(0, Math.round(entry.score) || 0)),
      timeMs: Math.min(36000000, Math.max(0, Math.round(entry.timeMs) || 0)),
      date: new Date().toISOString(),
    };
    try { await this.local.submit(clean); } catch (e) { console.warn('Lokaal opslaan faalde', e); }
    if (this.remote) {
      try {
        await this.flush();
        await this.remote.submit(clean);
        this.lastSource = 'online';
      } catch (e) {
        console.warn('Online leaderboard niet bereikbaar; score wordt later verstuurd', e);
        writePending([...readPending(), clean]);
        this.lastSource = 'local';
      }
    }
    return clean;
  }

  async top(limit = 10) {
    if (this.remote) {
      try {
        await this.flush();
        const list = await this.remote.top(limit);
        this.lastSource = 'online';
        return list;
      } catch (e) {
        console.warn('Online leaderboard laden faalde; toon lokale scores', e);
        this.lastSource = 'local';
      }
    }
    try { return await this.local.top(limit); } catch { return []; }
  }

  /** Staat deze combinatie van naam én organisatie al op het leaderboard? (hoofdletters en spaties tellen niet mee) */
  async nameTaken(name, org = '') {
    const norm = (n) => String(n || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const want = norm(name), wantOrg = norm(org);
    if (!want) return false;
    let list = [];
    if (this.remote) { try { list = await this.remote.top(1000); } catch { /* offline: alleen lokaal controleren */ } }
    try { list = list.concat(await this.local.top(1000)); } catch { /* geen lokale scores */ }
    return list.some((e) => norm(e.name) === want && norm(e.org) === wantOrg);
  }

  /** Verstuur scores die eerder (zonder internet) niet aankwamen. */
  async flush() {
    const pending = readPending();
    if (!pending.length || !this.remote) return;
    const left = [];
    for (const e of pending) {
      try { await this.remote.submit(e); } catch { left.push(e); }
    }
    writePending(left);
    if (left.length === pending.length) throw new Error('nog offline');
  }
}

const remote = LEADERBOARD.supabaseUrl && LEADERBOARD.supabaseAnonKey
  ? new SupabaseProvider(LEADERBOARD.supabaseUrl, LEADERBOARD.supabaseAnonKey, LEADERBOARD)
  : null;
export const Leaderboard = new LeaderboardService(new LocalStorageProvider(), remote);

export function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}
