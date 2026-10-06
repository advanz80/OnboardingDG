// Missie Reijn: quickscan aan dek. Interview crewleden (beperkt aantal vragen), verzamel bevindingen,
// stel de diagnose en kies het passende advies. Goed advies = crewleden lopen over (hulp in de finale).
import Phaser from 'phaser';
import { DESIGN } from '../../core/layout.js';
import { MissionBase } from './MissionBase.js';
import { P, HEX, textStyle, titleStyle } from '../../gfx/palette.js';
import { Audio } from '../../core/AudioEngine.js';
import { burst, shake, floatText, confettiRain } from '../../core/Juice.js';
import { panel, button, dim } from '../../ui/widgets.js';
import { makeCharacter, pirateLook, ensureAnims } from '../../gfx/CharacterFactory.js';
import { rng } from '../../gfx/draw.js';
import { makeDeckBg } from '../../gfx/tex/acbg.js';

const MAX_Q = 8;
const CREW_X = [130, 310, 490, 670, 850];
const CREW_Y = 500;

export function makeDeckTexture(scene) {
  if (!scene.textures.exists('deck_bg')) makeDeckBg(scene);
}

export class ReijnMission extends MissionBase {
  constructor() { super('ReijnMission', 'reijn', { thresholds: [200, 500, 750] }); }

  howToItems() { return this.T('howTo').map((it) => ({ ...it, text: it.text.replace('{max}', MAX_Q) })); }

  drawBackground() {
    const { width, height } = DESIGN;
    makeDeckTexture(this);
    this.add.image(0, 0, 'deck_bg').setOrigin(0).setDepth(-100);
    // whiteboard met een (nog) lege organisatieplaat
    const wb = this.add.graphics().setDepth(-60);
    wb.fillStyle(0xffffff).lineStyle(5, HEX.ink).fillRoundedRect(330, 250, 360, 130, 8).strokeRoundedRect(330, 250, 360, 130, 8);
    wb.lineStyle(3, 0x3d8fe0).strokeRect(480, 266, 60, 26).strokeRect(400, 326, 60, 26).strokeRect(560, 326, 60, 26);
    wb.lineBetween(510, 292, 430, 326).lineBetween(510, 292, 590, 326);
    wb.lineStyle(3, 0xe8504c).lineBetween(640, 270, 670, 300).lineBetween(670, 270, 640, 300);
    this.add.text(510, 362, '???', textStyle(18, P.inkSoft)).setOrigin(0.5).setDepth(-59);
    this.add.image(60, 340, 'flowerpot').setScale(1.6).setOrigin(0.5, 1).setDepth(-50);
    for (const [x, y, a] of [[1230, 300, -10], [1244, 290, 8], [1236, 282, -4]]) this.add.image(x, y, 'paper_sheet').setAngle(a).setScale(1.4).setDepth(-50);
  }

  startGame() {
    this.scenario = Phaser.Utils.Array.GetRandom(['structure', 'conflict', 'culture']);
    this.qLeft = MAX_Q;
    this.asked = 0;
    this.clues = [];
    this.crew = this.T('crew').map((c, i) => {
      const key = `reijn_${c.id}`;
      const r = rng(i * 7 + 3);
      makeCharacter(this, key, pirateLook(r, c.id === 'kok' ? { hat: 'bandana', bandana: '#ffffff' } : {}));
      const spr = this.add.sprite(CREW_X[i], CREW_Y, key, 'idle').setOrigin(0.5, 0.92).setScale(1.25).setDepth(CREW_Y);
      this.tweens.add({ targets: spr, scaleY: 1.3, duration: 700 + i * 90, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      const nm = this.add.text(CREW_X[i], CREW_Y + 30, c.name, textStyle(18, P.cream, { stroke: P.ink, strokeThickness: 5 })).setOrigin(0.5).setDepth(600);
      const bubble = this.add.image(CREW_X[i], CREW_Y - 150, 'icons', 'chat').setDisplaySize(44, 44).setDepth(601);
      this.tweens.add({ targets: bubble, y: bubble.y - 8, duration: 600, yoyo: true, repeat: -1 });
      spr.setInteractive({ useHandCursor: true }).on('pointerup', () => this.openInterview(i));
      return { ...c, key, spr, nm, bubble, askedQ: new Set() };
    });

    // notitieboek
    this.add.nineslice(1120, 420, 'ui_panel', undefined, 300, 560, 30, 30, 30, 30).setTint(0xfff3c4).setDepth(5);
    this.add.image(1010, 175, 'icons', 'notebook').setDisplaySize(44, 44).setDepth(6);
    this.add.text(1040, 175, this.T('notebook'), textStyle(24, P.ink)).setOrigin(0, 0.5).setDepth(6);
    this.notes = this.add.container(0, 0).setDepth(6);
    this.qText = this.add.text(500, 120, '', textStyle(24, P.cream, { stroke: P.ink, strokeThickness: 5 })).setOrigin(0.5).setDepth(10);
    this.updateQ();
    this.diagBtn = button(this, 1120, 650, this.T('toDiagnosis'), () => this.startDiagnosis(), { width: 270, color: this.brand.color, textColor: P.cream, size: 20, icon: 'magnifier' }).setDepth(10);
    this.diagBtn.setEnabled(false);
  }

  updateQ() { this.qText.setText(this.T('questionsLeft', { n: this.qLeft })); }

  openInterview(i) {
    if (!this.running || this.modal) return;
    const c = this.crew[i];
    const { width, height } = DESIGN;
    const L = this.add.container(0, 0).setDepth(2000);
    this.modal = L;
    L.add(dim(this, 0.45));
    L.add(panel(this, width / 2, height / 2 + 20, 1000, 560));
    const av = this.add.sprite(width / 2 - 400, height / 2 + 120, c.key, 'talk').setOrigin(0.5, 1).setScale(1.8);
    L.add(av);
    L.add(this.add.text(width / 2 - 320, height / 2 - 220, this.T('interview', { naam: c.name }), textStyle(30, P.ink)).setOrigin(0, 0.5));
    L.add(this.add.text(width / 2 - 320, height / 2 - 182, c.role, textStyle(20, P.inkSoft)).setOrigin(0, 0.5));
    const answer = this.add.text(width / 2 - 320, height / 2 + 120, '', textStyle(23, P.ink, { wordWrap: { width: 740 }, fontStyle: 'italic 600' })).setOrigin(0, 0.5);
    L.add(answer);
    const qs = ['role', 'team', 'change'];
    const btns = qs.map((q, k) => {
      const done = c.askedQ.has(q);
      const b = button(this, width / 2 + 60, height / 2 - 120 + k * 76, this.T(`questions.${q}`), () => {
        if (this.qLeft <= 0 || c.askedQ.has(q)) return;
        this.ask(c, q, answer, av);
        b.setEnabled(false);
      }, { width: 760, height: 64, size: 21, color: HEX.cream });
      if (done || this.qLeft <= 0) b.setEnabled(false);
      L.add(b);
      return b;
    });
    void btns;
    L.add(button(this, width / 2 + 330, height / 2 + 240, this.T('close', { naam: c.name.split(' ')[1] || c.name }), () => this.closeModal(), { width: 280, height: 60, size: 20, color: HEX.green }));
    L.setAlpha(0);
    this.tweens.add({ targets: L, alpha: 1, duration: 180 });
    Audio.sfx('pop');
  }

  closeModal() {
    const L = this.modal;
    if (!L) return;
    this.modal = null;
    this.tweens.add({ targets: L, alpha: 0, duration: 150, onComplete: () => L.destroy() });
    if (this.qLeft <= 0) this.time.delayedCall(300, () => { floatText(this, 500, 300, this.T('noQuestions'), P.cream, 30); this.time.delayedCall(900, () => this.startDiagnosis()); });
  }

  ask(c, q, answerText, av) {
    const entry = this.T(`scenarios.${this.scenario}.${c.id}.${q}`);
    c.askedQ.add(q);
    this.qLeft--;
    this.asked++;
    this.updateQ();
    if (c.askedQ.size === 3) c.bubble.setVisible(false);
    if (this.asked >= 3) this.diagBtn.setEnabled(true);
    Audio.sfx('select');
    // typemachine
    let n = 0;
    const full = `"${entry.a}"`;
    answerText.setText('');
    const ev = this.time.addEvent({
      delay: 18, repeat: full.length - 1, callback: () => {
        n++; answerText.setText(full.slice(0, n));
        if (n % 3 === 0) { Audio.sfx('type'); av.setFrame(av.frame.name === 'talk' ? 'idle' : 'talk'); }
        if (n >= full.length && entry.clue) this.addClue(entry.clue);
      },
    });
    void ev;
  }

  addClue(text) {
    if (this.clues.includes(text)) return;
    this.clues.push(text);
    this.addScore(40);
    Audio.sfx('coin');
    const y = 215 + (this.clues.length - 1) * 58;
    const note = this.add.text(990, y, `• ${text}`, textStyle(17, P.ink, { wordWrap: { width: 255 } })).setOrigin(0, 0);
    this.notes.add(note);
    note.setAlpha(0).x += 30;
    this.tweens.add({ targets: note, alpha: 1, x: 990, duration: 300, delay: 200 });
    const star = this.add.image(640, 400, 'icons', 'notebook').setDisplaySize(40, 40).setDepth(2500);
    this.tweens.add({ targets: star, x: 1120, y, duration: 600, ease: 'Cubic.InOut', onComplete: () => { star.destroy(); burst(this, 1120, y, 'stars', 8, { depth: 2600 }); } });
  }

  // ── Diagnose & advies ────────────────────────────────────────────────
  choiceModal(title, options, onPick) {
    const { width, height } = DESIGN;
    const L = this.add.container(0, 0).setDepth(2000);
    this.modal = L;
    L.add(dim(this, 0.55));
    const h = 160 + options.length * 86;
    L.add(panel(this, width / 2, height / 2 + 20, 980, h));
    L.add(this.add.text(width / 2, height / 2 + 20 - h / 2 + 50, title, textStyle(32, P.ink)).setOrigin(0.5));
    options.forEach((o, i) => {
      const b = button(this, width / 2, height / 2 + 20 - h / 2 + 125 + i * 86, o.label, () => {
        if (L.picked) return; L.picked = true;
        this.tweens.add({ targets: L, alpha: 0, duration: 200, onComplete: () => { L.destroy(); this.modal = null; onPick(o.value); } });
      }, { width: 900, height: 72, size: 20, color: HEX.cream });
      b.alpha = 0; this.tweens.add({ targets: b, alpha: 1, delay: i * 80, duration: 200 });
      L.add(b);
    });
  }

  startDiagnosis() {
    if (!this.running || this.modal || this.diagnosing) return;
    this.diagnosing = true;
    this.diagBtn.setEnabled(false);
    this.addScore(this.qLeft * 15);
    const probs = Phaser.Utils.Array.Shuffle(['structure', 'conflict', 'culture']);
    this.choiceModal(this.T('diagnosisTitle'), probs.map((p) => ({ label: this.T(`problems.${p}`), value: p })), (v) => {
      this.diagOk = v === this.scenario;
      this.feedback(this.diagOk, this.diagOk ? this.T('diagnosisRight') : this.T('diagnosisWrong'), 250);
      this.time.delayedCall(1600, () => this.startAdvice());
    });
  }

  startAdvice() {
    const others = ['structure', 'conflict', 'culture'].filter((p) => p !== this.scenario);
    const opts = Phaser.Utils.Array.Shuffle([this.scenario, Phaser.Utils.Array.GetRandom(others), 'party', 'fire']);
    this.choiceModal(this.T('adviceTitle'), opts.map((p) => ({ label: this.T(`advices.${p}`), value: p })), (v) => {
      this.adviceOk = v === this.scenario;
      this.feedback(this.adviceOk, this.adviceOk ? this.T('adviceRight') : this.T('adviceWrong'), 250);
      this.time.delayedCall(1600, () => this.defect());
    });
  }

  feedback(ok, text, pts) {
    if (ok) { this.addScore(pts, 500, 260); Audio.sfx('great'); burst(this, 500, 300, 'confetti', 30); }
    else { Audio.sfx('bad'); shake(this, 0.006, 200); }
    const tx = this.add.text(500, 330, text, titleStyle(36, ok ? P.gold : P.cream, { wordWrap: { width: 900 }, align: 'center' })).setOrigin(0.5).setDepth(3000).setScale(0.4);
    this.tweens.add({ targets: tx, scale: 1, duration: 300, ease: 'Back.Out' });
    this.tweens.add({ targets: tx, alpha: 0, delay: 1300, duration: 300, onComplete: () => tx.destroy() });
  }

  defect() {
    this.running = false;
    const n = (this.diagOk ? 2 : 0) + (this.adviceOk ? 1 : 0) + (this.clues.length >= 4 ? 1 : 0);
    this.extra.crewDefected = n;
    const msg = n === 0 ? this.T('defected0') : n === 1 ? this.T('defected1') : this.T('defected', { n });
    const tx = this.add.text(500, 300, msg, titleStyle(42, P.gold)).setOrigin(0.5).setDepth(3000);
    tx.setScale(0);
    this.tweens.add({ targets: tx, scale: 1, duration: 400, ease: 'Back.Out' });
    if (n > 0) { confettiRain(this, 1500); Audio.sfx('fanfare'); }
    this.crew.slice(0, n).forEach((c, i) => {
      c.bubble.setVisible(false);
      this.time.delayedCall(400 + i * 250, () => {
        c.spr.setFrame('cheer');
        const flag = this.add.image(c.spr.x, c.spr.y - 170, 'flagcloth').setTint(this.brand.color).setScale(0.5).setDepth(700);
        this.tweens.add({ targets: [c.spr, c.nm], y: '-=20', duration: 180, yoyo: true, repeat: 2 });
        this.tweens.add({ targets: flag, angle: { from: -10, to: 10 }, duration: 200, yoyo: true, repeat: 5 });
        Audio.sfx('pickup');
      });
    });
    this.time.delayedCall(3200, () => this.finish());
    void ensureAnims;
  }
}
