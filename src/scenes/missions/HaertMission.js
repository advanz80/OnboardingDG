// Missie Haert: zet opdrachten uit op het marktplaatsbord en kies per opdracht de beste aanbieder
// op prijs, kwaliteit en beschikbaarheid. Pas op voor "gelukszoekers" zonder KvK.
import Phaser from 'phaser';
import { DESIGN } from '../../core/layout.js';
import { MissionBase } from './MissionBase.js';
import { t } from '../../core/i18n.js';
import { P, HEX, textStyle, titleStyle } from '../../gfx/palette.js';
import { Audio } from '../../core/AudioEngine.js';
import { burst, shake, floatText, wobble } from '../../core/Juice.js';
import { card, button, panel } from '../../ui/widgets.js';
import { makeHaertBg } from '../../gfx/tex/acbg.js';

const JOB_Y = [215, 385, 555];
const OFFER_Y = [220, 390, 560];
const JOB_TIME = 30;
const START_RANK = { now: 0, week: 1, later: 2 };

export class HaertMission extends MissionBase {
  constructor() { super('HaertMission', 'haert', { timeLimit: 120, thresholds: [400, 1000, 1500] }); }

  drawBackground() {
    const { width, height } = DESIGN;
    if (!this.textures.exists('haert_bg')) makeHaertBg(this);
    this.add.image(0, 0, 'haert_bg').setOrigin(0).setDepth(-100);
    // bord
    const sign = this.add.nineslice(260, 110, 'ui_btn', undefined, 300, 64, 20, 20, 20, 24).setTint(this.brand.color).setDepth(-40);
    void sign;
    this.add.text(260, 106, this.T('board'), titleStyle(34, P.cream)).setOrigin(0.5).setDepth(-39);
    // aanbiederspaneel
    this.offerPanel = panel(this, 860, 400, 640, 600).setDepth(-50).setAlpha(0.95);
    this.hint = this.add.text(860, 400, this.T('waiting'), textStyle(26, P.inkSoft, { align: 'center', wordWrap: { width: 520 } })).setOrigin(0.5).setDepth(-40);
  }

  startGame() {
    this.jobs = [null, null, null];
    this.jobList = Phaser.Utils.Array.Shuffle(this.T('jobs').slice());
    this.providers = Phaser.Utils.Array.Shuffle(this.T('providers').slice());
    this.selected = null;
    this.offerObjs = [];
    this.spawnJob(0);
    this.time.delayedCall(1500, () => this.spawnJob(1));
    this.spawnTimer = this.time.addEvent({ delay: 7000, loop: true, callback: () => { const i = this.jobs.findIndex((j) => !j); if (i >= 0) this.spawnJob(i); } });
    ['ONE', 'TWO', 'THREE'].forEach((k, i) => this.input.keyboard.on(`keydown-${k}`, () => this.pick(i)));
    this.hint.setText(this.T('howTo')[0].text);
  }

  nextProvider() {
    if (!this.providers.length) this.providers = Phaser.Utils.Array.Shuffle(this.T('providers').slice());
    return this.providers.pop();
  }

  makeJob() {
    const base = this.jobList.length ? this.jobList.pop() : Phaser.Utils.Array.GetRandom(this.T('jobs'));
    const budget = Phaser.Math.Between(11, 19) * 5;
    const minRating = Phaser.Math.Between(3, 4);
    const start = Math.random() < 0.5 ? 'now' : 'week';
    const job = { ...base, budget, minRating, start };
    // aanbieders
    const ok = { kind: 'ok', rate: budget - Phaser.Math.Between(0, 3) * 5, rating: Math.min(5, minRating + Phaser.Math.Between(0, 9) / 10), start: start === 'now' ? 'now' : Phaser.Utils.Array.GetRandom(['now', 'week']), kvk: true };
    const bad = Phaser.Utils.Array.Shuffle(['expensive', 'low', 'late', 'fortune']).slice(0, 2);
    if (Math.random() < 0.45 && !bad.includes('fortune')) bad[1] = 'fortune';
    const mk = (kind) => {
      const o = { kind, rate: budget - Phaser.Math.Between(0, 2) * 5, rating: Math.min(5, minRating + Phaser.Math.Between(1, 8) / 10), start: 'now', kvk: true };
      if (kind === 'expensive') o.rate = budget + Phaser.Math.Between(1, 5) * 5;
      if (kind === 'low') o.rating = minRating - 1 + Phaser.Math.Between(1, 8) / 10;
      if (kind === 'late') o.start = 'later';
      if (kind === 'fortune') { o.rate = Phaser.Math.Between(4, 6) * 5; o.rating = 5; o.kvk = false; o.reviews = 999; }
      return o;
    };
    job.offers = Phaser.Utils.Array.Shuffle([ok, ...bad.map(mk)]).map((o) => ({
      ...o,
      name: o.kind === 'fortune' ? Phaser.Utils.Array.GetRandom(this.T('fortuneNames')) : this.nextProvider(),
      type: Math.random() < 0.5 ? 'zzp' : 'agency',
      reviews: o.reviews || Phaser.Math.Between(8, 90),
    }));
    return job;
  }

  spawnJob(i) {
    if (!this.running || this.jobs[i]) return;
    const job = this.makeJob();
    const c = this.add.container(260, JOB_Y[i]).setDepth(10);
    const bg = card(this, 0, 0, 390, 150, 0xfffdf5);
    const pin = this.add.circle(0, -66, 9, HEX.red).setStrokeStyle(3, HEX.ink);
    const ttl = this.add.text(-176, -42, job.title, textStyle(25, P.ink)).setOrigin(0, 0.5);
    const cl = this.add.text(-176, -12, job.client, textStyle(17, P.inkSoft)).setOrigin(0, 0.5);
    const b = this.add.text(-176, 16, this.T('budget', { b: job.budget }), textStyle(19, P.ink)).setOrigin(0, 0.5);
    const r = this.add.text(20, 16, this.T('minRating', { r: job.minRating }), textStyle(19, P.ink)).setOrigin(0, 0.5);
    const st = this.add.text(-176, 40, this.T('start', { s: job.start === 'now' ? this.T('startNow') : this.T('startWeek') }), textStyle(17, P.inkSoft)).setOrigin(0, 0.5);
    const barBg = this.add.rectangle(-176, 62, 352, 8, 0xdddddd).setOrigin(0, 0.5);
    const bar = this.add.rectangle(-176, 62, 352, 8, HEX.green).setOrigin(0, 0.5);
    const hl = this.add.nineslice(0, 0, 'ui_card', undefined, 410, 170, 18, 18, 18, 18).setTint(HEX.gold).setVisible(false);
    c.add([hl, bg, pin, ttl, cl, b, r, st, barBg, bar]);
    c.setSize(390, 150).setInteractive({ useHandCursor: true });
    c.on('pointerup', () => this.selectJob(c));
    Object.assign(c, { job, bar, hl, slot: i, timeLeft: JOB_TIME });
    this.jobs[i] = c;
    c.setScale(0).setAngle(-8);
    this.tweens.add({ targets: c, scale: 1, angle: Phaser.Math.Between(-2, 2), duration: 350, ease: 'Back.Out' });
    Audio.sfx('pop');
    if (!this.selected) this.selectJob(c);
  }

  selectJob(c) {
    if (!this.running || c.done) return;
    if (this.selected && this.selected.active) this.selected.hl.setVisible(false);
    this.selected = c;
    c.hl.setVisible(true);
    Audio.sfx('select');
    this.showOffers(c);
  }

  clearOffers() {
    this.offerObjs.forEach((o) => o.destroy());
    this.offerObjs = [];
  }

  showOffers(c) {
    this.clearOffers();
    this.hint.setVisible(false);
    const job = c.job;
    const head = this.add.text(860, 125, `${job.title} · ${this.T('budget', { b: job.budget })} · ${this.T('minRating', { r: job.minRating })} · ${this.T('start', { s: job.start === 'now' ? this.T('startNow') : this.T('startWeek') })}`, textStyle(18, P.ink, { backgroundColor: '#ffeec2', padding: { x: 10, y: 6 } })).setOrigin(0.5).setDepth(10);
    this.offerObjs.push(head);
    job.offers.forEach((o, i) => {
      const y = OFFER_Y[i] + 20;
      const oc = this.add.container(860, y).setDepth(10);
      oc.add(card(this, 0, 0, 600, 146, 0xffffff));
      oc.add(this.add.image(-250, -10, 'icons', o.type === 'zzp' ? 'briefcase' : 'people').setDisplaySize(64, 64));
      oc.add(this.add.text(-250, 42, o.type === 'zzp' ? this.T('zzp') : this.T('agency'), textStyle(15, P.inkSoft, { align: 'center', wordWrap: { width: 110 } })).setOrigin(0.5));
      oc.add(this.add.text(-200, -44, `${i + 1}. ${o.name}`, textStyle(22, P.ink)).setOrigin(0, 0.5));
      const stars = '★'.repeat(Math.floor(o.rating)) + '☆'.repeat(5 - Math.floor(o.rating));
      oc.add(this.add.text(-200, -10, `${stars} ${o.rating.toFixed(1).replace('.', ',')}  (${o.reviews})`, textStyle(18, '#d49b1a')).setOrigin(0, 0.5));
      oc.add(this.add.text(-200, 22, this.T('rate', { r: o.rate }), textStyle(22, P.ink)).setOrigin(0, 0.5));
      const startTxt = { now: this.T('startNow'), week: this.T('startWeek'), later: this.T('startLater') }[o.start];
      oc.add(this.add.image(-40, 22, 'icons', 'clock').setDisplaySize(26, 26));
      oc.add(this.add.text(-24, 22, startTxt, textStyle(18, P.ink)).setOrigin(0, 0.5));
      oc.add(this.add.text(-200, 50, o.kvk ? `${this.T('kvk')} ${Phaser.Math.Between(10, 99)}${Phaser.Math.Between(100000, 999999)}` : this.T('noKvk'), textStyle(16, o.kvk ? P.green : P.red)).setOrigin(0, 0.5));
      const b = button(this, 220, 0, this.T('choose'), () => this.pick(i), { width: 130, height: 60, color: this.brand.color, textColor: P.cream, size: 22 });
      oc.add(b);
      oc.x = 1400;
      this.tweens.add({ targets: oc, x: 860, delay: i * 70, duration: 300, ease: 'Back.Out' });
      this.offerObjs.push(oc);
    });
  }

  pick(i) {
    const c = this.selected;
    if (!this.running || !c || c.done || !c.job.offers[i]) return;
    const o = c.job.offers[i];
    const job = c.job;
    const oc = this.offerObjs[i + 1];
    let reason = null;
    if (o.kind === 'fortune' || !o.kvk) reason = 'fortune';
    else if (o.rate > job.budget) reason = 'tooExpensive';
    else if (o.rating < job.minRating) reason = 'tooLow';
    else if (START_RANK[o.start] > START_RANK[job.start]) reason = 'tooLate';
    c.done = true;
    if (!reason) {
      const pts = 100 + Math.round(c.timeLeft * 3);
      this.addScore(pts, oc.x, oc.y - 60);
      floatText(this, 860, 110, this.T('good'), P.green, 32);
      Audio.sfx('great');
      burst(this, oc.x, oc.y, 'confetti', 30);
    } else {
      const pts = reason === 'fortune' ? -60 : -40;
      this.addScore(pts, oc.x, oc.y - 60);
      floatText(this, 860, 110, this.T(reason === 'fortune' ? 'fortune' : reason), P.red, reason === 'fortune' ? 24 : 30);
      Audio.sfx(reason === 'fortune' ? 'squawk' : 'error');
      shake(this, reason === 'fortune' ? 0.014 : 0.006, 250);
      wobble(this, oc);
      // laat de juiste zien
      const right = job.offers.findIndex((x) => x.kind === 'ok');
      const rc = this.offerObjs[right + 1];
      if (rc) this.tweens.add({ targets: rc, scale: 1.05, duration: 200, yoyo: true, repeat: 2 });
    }
    const stamp = this.add.text(c.x + 40, c.y, reason ? '✗' : '✓', titleStyle(80, reason ? P.red : P.green)).setOrigin(0.5).setDepth(30).setScale(2).setAlpha(0);
    this.tweens.add({ targets: stamp, scale: 1, alpha: 1, duration: 200, ease: 'Back.Out' });
    this.time.delayedCall(reason ? 1400 : 800, () => {
      this.removeJob(c);
      stamp.destroy();
    });
  }

  removeJob(c) {
    if (!c.active) return;
    this.jobs[c.slot] = null;
    if (this.selected === c) { this.selected = null; this.clearOffers(); this.hint.setText(this.T('waiting')).setVisible(true); }
    this.tweens.add({ targets: c, x: -300, angle: -20, duration: 300, ease: 'Cubic.In', onComplete: () => c.destroy() });
    // kies automatisch de volgende open opdracht
    const next = this.jobs.find((j) => j && !j.done);
    if (next && !this.selected) this.time.delayedCall(320, () => next.active && this.selectJob(next));
    this.time.delayedCall(2200, () => { if (!this.jobs[c.slot]) this.spawnJob(c.slot); });
  }

  tick(_time, dt) {
    for (const c of this.jobs) {
      if (!c || c.done) continue;
      c.timeLeft -= dt / 1000;
      const v = Math.max(0, c.timeLeft / JOB_TIME);
      c.bar.width = 352 * v;
      c.bar.fillColor = v > 0.5 ? HEX.green : v > 0.25 ? HEX.gold : HEX.red;
      if (c.timeLeft <= 0) {
        c.done = true;
        this.addScore(-20, c.x, c.y - 50);
        floatText(this, c.x, c.y, this.T('expired'), P.red, 22);
        Audio.sfx('bad');
        this.removeJob(c);
      }
    }
  }

  onTimeUp() {
    this.spawnTimer?.remove();
    floatText(this, 640, 360, t('common.timeUp'), P.cream, 64);
    this.time.delayedCall(900, () => this.finish());
  }
}
