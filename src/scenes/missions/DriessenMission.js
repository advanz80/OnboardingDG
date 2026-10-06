// Missie Driessen: werf en plaats kandidaten op de juiste vacatures (vaardigheid + beschikbaarheid).
import Phaser from 'phaser';
import { DESIGN } from '../../core/layout.js';
import { MissionBase } from './MissionBase.js';
import { P, HEX, textStyle, titleStyle } from '../../gfx/palette.js';
import { Audio } from '../../core/AudioEngine.js';
import { burst, shake, floatText, wobble } from '../../core/Juice.js';
import { card } from '../../ui/widgets.js';
import { makeDriessenBg } from '../../gfx/tex/acbg.js';
import { dragTap } from '../../ui/dragtap.js';
import { makeCharacter, randomLook, roverLook } from '../../gfx/CharacterFactory.js';

const ROLES = { lifeguard: 'lifebuoy', cook: 'chefhat', mechanic: 'wrench', barista: 'coffee', entertainer: 'music', cleaner: 'broom' };
const SHIFTS = { morning: 'sun', evening: 'moon', weekend: 'weekend' };
const ROLE_KEYS = Object.keys(ROLES);
const SHIFT_KEYS = Object.keys(SHIFTS);
const QUEUE_Y = [200, 330, 460, 590];
const VAC_Y = [210, 380, 550];

export class DriessenMission extends MissionBase {
  constructor() { super('DriessenMission', 'driessen', { timeLimit: 100, thresholds: [400, 1000, 1600] }); }

  drawBackground() {
    const { width, height } = DESIGN;
    makeDriessenBg(this);
    this.add.image(0, 0, 'dr_bg').setOrigin(0).setDepth(-100);
    // vlaggenlijn
    for (let i = 0; i < 22; i++) {
      const x = 20 + i * 60;
      const fl = this.add.triangle(x, 100, 0, 0, 40, 0, 20, 30, [this.brand.color, 0xffffff, HEX.gold][i % 3]).setStrokeStyle(2, HEX.ink).setDepth(-90);
      this.tweens.add({ targets: fl, angle: { from: -6, to: 6 }, duration: 600 + (i % 4) * 90, yoyo: true, repeat: -1 });
    }
    this.add.text(250, 128, this.T('queue'), textStyle(26, P.ink)).setOrigin(0.5).setDepth(-80);
    this.add.text(960, 128, this.T('vacancies'), textStyle(26, P.ink)).setOrigin(0.5).setDepth(-80);
    // pijl
    const arr = this.add.image(600, 400, 'icons', 'arrow').setDisplaySize(90, 90).setAlpha(0.25).setDepth(-80);
    this.tweens.add({ targets: arr, x: 630, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  }

  startGame() {
    this.queue = [null, null, null, null];
    this.vacancies = [null, null, null];
    this.combo = 0;
    this.lastPerfect = 0;
    this.pirateCount = 0;
    this.names = Phaser.Utils.Array.Shuffle(this.T('names').slice());
    this.looks = [];
    for (let i = 0; i < 8; i++) { const k = `cand_${i}`; makeCharacter(this, k, randomLook()); this.looks.push(k); }
    for (let i = 0; i < 3; i++) { const k = `candp_${i}`; makeCharacter(this, k, roverLook(Math.random, { hat: null, pattern: null, shirt: '#ffffff', tie: '#26202c' })); this.looks.push(k); }

    this.dt = dragTap(this, { onDrop: (item, target) => { this.binBg?.setTint(0xf3d6d6); return this.onDrop(item, target); }, onSelect: () => this.binBg?.setTint(0xffb3a8) });

    // prullenbak
    const bin = this.add.container(600, 545).setDepth(10);
    const binBg = this.add.image(0, 0, 'ui_round').setDisplaySize(160, 160).setTint(0xf3d6d6);
    const binIc = this.add.image(0, -16, 'icons', 'trash').setDisplaySize(76, 76);
    const binTx = this.add.text(0, 48, this.T('reject'), textStyle(20, P.cream, { backgroundColor: '#b8302c', padding: { x: 8, y: 3 } })).setOrigin(0.5);
    bin.add([binBg, binIc, binTx]).setSize(180, 180);
    this.bin = bin; this.binBg = binBg;
    this.tweens.add({ targets: bin, scale: 1.05, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    // oplichten zodra je een kandidaat sleept of hebt geselecteerd
    this.input.on('dragstart', () => binBg.setTint(0xffb3a8));
    this.input.on('dragend', () => binBg.setTint(0xf3d6d6));
    this.dt.addTarget(bin, { type: 'bin' });

    for (let i = 0; i < 3; i++) this.time.delayedCall(i * 150, () => this.spawnVacancy(i));
    this.time.addEvent({ delay: 1200, loop: true, callback: () => this.ensureMatches() });
    for (let i = 0; i < 4; i++) this.time.delayedCall(400 + i * 150, () => this.spawnCandidate(i));
  }

  spawnVacancy(i) {
    if (!this.running) return;
    const open = this.vacancies.filter(Boolean).map((v) => v.role);
    const role = Phaser.Utils.Array.GetRandom(ROLE_KEYS.filter((r) => !open.includes(r)));
    const shift = Phaser.Utils.Array.GetRandom(SHIFT_KEYS);
    const c = this.add.container(960, VAC_Y[i]).setDepth(10);
    const bg = card(this, 0, 0, 420, 140, 0xffffff);
    const band = this.add.rectangle(-206, 0, 14, 126, this.brand.color).setOrigin(0, 0.5);
    const ic = this.add.image(-140, 0, 'icons', ROLES[role]).setDisplaySize(86, 86);
    const nm = this.add.text(-80, -26, this.T(`roles.${role}`), textStyle(28, P.ink)).setOrigin(0, 0.5);
    const sic = this.add.image(-60, 26, 'icons', SHIFTS[shift]).setDisplaySize(38, 38);
    const stx = this.add.text(-34, 26, this.T(`shifts.${shift}`), textStyle(20, P.inkSoft)).setOrigin(0, 0.5);
    const tag = this.add.text(190, -50, 'VACATURE', textStyle(14, P.cream, { backgroundColor: this.brand.css, padding: { x: 6, y: 2 } })).setOrigin(1, 0.5);
    c.add([bg, band, ic, nm, sic, stx, tag]);
    c.setSize(420, 140);
    c.role = role; c.shift = shift; c.index = i; c.born = this.time.now;
    this.vacancies[i] = c;
    this.dt.addTarget(c, { type: 'vac', vac: c });
    c.x = 1400;
    this.tweens.add({ targets: c, x: 960, duration: 400, ease: 'Back.Out' });
    this.time.delayedCall(600, () => this.ensureMatches());
  }

  isPerfect(q, v) { return q && !q.pirate && !q.locked && q.skills.includes(v.role) && q.shifts.includes(v.shift); }

  /** Zorg dat elke open vacature minstens één perfecte kandidaat in de rij heeft. */
  ensureMatches() {
    if (!this.running) return;
    const open = this.vacancies.filter((v) => v && !v.filled);
    for (const v of open) {
      if (this.queue.some((q) => this.isPerfect(q, v))) continue;
      // vervang een kandidaat die voor geen enkele vacature perfect is (liefst geen piraat)
      // een kandidaat is 'nodig' als hij de enige perfecte match voor een vacature is
      const needed = (q) => open.some((o) => this.isPerfect(q, o) && this.queue.filter((x) => this.isPerfect(x, o)).length === 1);
      const spare = this.queue.filter((q) => q && !q.locked && this.dt.selected !== q && !needed(q));
      const victim = spare.find((q) => !q.pirate) || spare[0];
      if (!victim) continue;
      this.queue[victim.slot] = null;
      victim.locked = true; victim.disableInteractive();
      this.tweens.add({ targets: victim, x: -300, alpha: 0, duration: 300, ease: 'Cubic.In', onComplete: () => victim.destroy() });
      this.time.delayedCall(320, () => this.spawnCandidate(victim.slot, v));
    }
  }

  makeCandidateData(forVac = null) {
    const openVac = this.vacancies.filter(Boolean);
    const inQueuePirate = this.queue.some((q) => q && q.pirate);
    if (!forVac && !inQueuePirate && Math.random() < 0.22) {
      return { pirate: true, name: Phaser.Utils.Array.GetRandom(this.T('pirateNames')), skills: Phaser.Utils.Array.Shuffle(ROLE_KEYS.slice()).slice(0, 2), shifts: SHIFT_KEYS.slice() };
    }
    const name = this.names.length ? this.names.pop() : Phaser.Utils.Array.GetRandom(this.T('names'));
    // zorg dat er een perfecte match in de rij zit
    const perfectNeeded = forVac ? [forVac] : openVac.filter((v) => !v.filled && !this.queue.some((q) => this.isPerfect(q, v)));
    if (openVac.length && (perfectNeeded.length || Math.random() < 0.6)) {
      const v = Phaser.Utils.Array.GetRandom(perfectNeeded.length ? perfectNeeded : openVac);
      const skills = [v.role];
      if (Math.random() < 0.5) skills.push(Phaser.Utils.Array.GetRandom(ROLE_KEYS.filter((r) => r !== v.role)));
      const shifts = [v.shift];
      if (Math.random() < 0.4) shifts.push(Phaser.Utils.Array.GetRandom(SHIFT_KEYS.filter((s) => s !== v.shift)));
      return { pirate: false, name, skills: Phaser.Utils.Array.Shuffle(skills), shifts };
    }
    return { pirate: false, name, skills: Phaser.Utils.Array.Shuffle(ROLE_KEYS.slice()).slice(0, Phaser.Math.Between(1, 2)), shifts: [Phaser.Utils.Array.GetRandom(SHIFT_KEYS)] };
  }

  spawnCandidate(i, forVac = null) {
    if (!this.running || this.queue[i]) return;
    const d = this.makeCandidateData(forVac);
    const c = this.add.container(250, QUEUE_Y[i]).setDepth(20);
    const hl = this.add.nineslice(0, 0, 'ui_card', undefined, 404, 128, 18, 18, 18, 18).setTint(HEX.gold).setVisible(false);
    const bg = card(this, 0, 0, 380, 112, d.pirate ? 0xfff1e6 : 0xffffff);
    const look = d.pirate ? Phaser.Utils.Array.GetRandom(this.looks.slice(8)) : this.looks[Phaser.Math.Between(0, 7)];
    const av = this.add.image(-140, 34, look, 'idle').setOrigin(0.5, 1).setScale(0.75);
    const nm = this.add.text(-90, -30, d.name, textStyle(22, P.ink)).setOrigin(0, 0.5);
    c.add([hl, bg, av, nm]);
    d.skills.forEach((s, k) => c.add(this.add.image(-70 + k * 50, 16, 'icons', ROLES[s]).setDisplaySize(44, 44)));
    d.shifts.forEach((s, k) => c.add(this.add.image(80 + k * 36, 16, 'icons', SHIFTS[s]).setDisplaySize(32, 32)));
    if (d.pirate) c.add(this.add.text(70, -30, this.T('pirateCv'), textStyle(15, P.inkSoft)).setOrigin(0, 0.5));
    Object.assign(c, d);
    c.highlight = hl;
    c.home = { x: 250, y: QUEUE_Y[i] };
    c.slot = i;
    c.baseDepth = 20;
    this.dt.addItem(c, 380, 112);
    this.queue[i] = c;
    c.x = -250;
    this.tweens.add({ targets: c, x: 250, duration: 380, ease: 'Back.Out' });
  }

  removeCandidate(c, anim) {
    this.queue[c.slot] = null;
    c.locked = true;
    c.disableInteractive();
    const slot = c.slot;
    anim(c);
    this.time.delayedCall(700, () => { this.spawnCandidate(slot); this.time.delayedCall(450, () => this.ensureMatches()); });
  }

  onDrop(c, target) {
    if (!this.running || c.locked) return false;
    if (target.data.type === 'bin') {
      if (c.pirate) {
        this.addScore(60, 600, 450, `${this.T('pirateRejected')} +60`);
        Audio.sfx('good');
        burst(this, 600, 545, 'stars', 16);
      } else {
        this.addScore(-15, 600, 450);
        floatText(this, 600, 410, this.T('goodRejected'), P.red, 22);
        Audio.sfx('bad');
      }
      this.removeCandidate(c, (o) => this.tweens.add({ targets: o, x: 600, y: 545, scale: 0, angle: 200, duration: 350, ease: 'Back.In', onComplete: () => o.destroy() }));
      wobble(this, this.bin);
      return true;
    }
    const v = target.data.vac;
    if (!v || v.filled) return false;
    if (c.pirate) {
      this.addScore(-60, v.x, v.y - 40);
      floatText(this, v.x, v.y - 90, this.T('pirateHired'), P.red, 24);
      Audio.sfx('error'); shake(this, 0.012, 300);
      this.combo = 0;
      // piraat gaat ervandoor met de vacature-kaart even
      this.removeCandidate(c, (o) => this.tweens.add({ targets: o, x: 1400, y: o.y, duration: 500, ease: 'Cubic.In', onComplete: () => o.destroy() }));
      wobble(this, v);
      return true;
    }
    if (!c.skills.includes(v.role)) {
      this.addScore(-20, v.x, v.y - 40);
      floatText(this, v.x, v.y - 90, this.T('wrongSkill'), P.red, 24);
      Audio.sfx('error');
      wobble(this, v);
      this.combo = 0;
      return false;
    }
    const perfect = c.shifts.includes(v.shift);
    let pts = perfect ? 100 : 40;
    const now = this.time.now;
    if (perfect) {
      this.combo = now - this.lastPerfect < 6000 ? this.combo + 1 : 1;
      this.lastPerfect = now;
      if (this.combo > 1) { pts += 25 * (this.combo - 1); floatText(this, v.x, v.y - 110, this.T('combo', { n: this.combo }), P.gold, 30); }
      const speed = Math.max(0, 30 - Math.floor((now - v.born) / 1000) * 3);
      pts += speed;
    } else this.combo = 0;
    this.addScore(pts, v.x, v.y - 50);
    floatText(this, v.x, v.y + 70, perfect ? this.T('perfect') : this.T('skillOnly'), perfect ? P.green : P.orange, perfect ? 28 : 20);
    Audio.sfx(perfect ? 'great' : 'good');
    burst(this, v.x, v.y, perfect ? 'confetti' : 'stars', perfect ? 30 : 14);
    v.filled = true;
    this.dt.removeTarget(v);
    // stempel
    const stamp = this.add.text(v.x + 60, v.y, 'AANGENOMEN!', titleStyle(34, perfect ? P.green : P.orange)).setOrigin(0.5).setAngle(-12).setDepth(40).setScale(2.5).setAlpha(0);
    this.tweens.add({ targets: stamp, scale: 1, alpha: 1, duration: 200, ease: 'Back.Out', onComplete: () => shake(this, 0.004, 80) });
    this.removeCandidate(c, (o) => this.tweens.add({ targets: o, x: v.x - 60, y: v.y, scale: 0.8, duration: 250, onComplete: () => this.tweens.add({ targets: o, alpha: 0, duration: 300, delay: 300, onComplete: () => o.destroy() }) }));
    this.time.delayedCall(900, () => {
      this.tweens.add({ targets: [v, stamp], x: '+=500', alpha: 0, duration: 350, ease: 'Cubic.In', onComplete: () => { v.destroy(); stamp.destroy(); } });
      this.time.delayedCall(400, () => this.spawnVacancy(v.index));
    });
    return true;
  }
}
