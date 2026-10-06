// Missie IJk: deel 1 koppelingspuzzel (buizen draaien zodat databronnen het HR-systeem bereiken),
// deel 2 loonrun (afwijkingen t.o.v. de cao-kaart eruit pikken).
import Phaser from 'phaser';
import { DESIGN } from '../../core/layout.js';
import { MissionBase } from './MissionBase.js';
import { P, HEX, textStyle, titleStyle } from '../../gfx/palette.js';
import { Audio } from '../../core/AudioEngine.js';
import { burst, shake, floatText, wobble } from '../../core/Juice.js';
import { panel, card, button } from '../../ui/widgets.js';
import { makeIjkBg } from '../../gfx/tex/acbg.js';
import { PipePuzzle, makePipeTextures } from './PipePuzzle.js';

const SRC_ICONS = { time: 'clock', leave: 'weekend', contracts: 'notebook' };

const SCALES = { A: 14.0, B: 16.5, C: 19.25 };
const euro = (v) => `€${v.toFixed(2).replace('.', ',')}`;

export class IjkMission extends MissionBase {
  constructor() { super('IjkMission', 'ijk', { timeLimit: 210, thresholds: [400, 850, 1200] }); }

  drawBackground() {
    // technische ruimte onder het zwembad: tegelwand, buizen, kranen en meters
    if (!this.textures.exists('ijk_bg')) makeIjkBg(this, this.brand.css);
    this.add.image(0, 0, 'ijk_bg').setOrigin(0).setDepth(-100);
  }

  startGame() {
    makePipeTextures(this);
    this.levelIdx = 0;
    this.levels = [
      { w: 5, h: 4, sources: [0, 3], target: 1, keys: ['time', 'leave'] },
      { w: 7, h: 5, sources: [0, 2, 4], target: 2, keys: ['time', 'leave', 'contracts'] },
    ];
    this.startLevel();
  }

  // ── Deel 1: koppelingspuzzel ─────────────────────────────────────────
  startLevel() {
    const L = this.levels[this.levelIdx];
    const { width } = DESIGN;
    this.L = L;
    this.title = this.add.text(width / 2, 120, `${this.T('part1')} — ${this.T('level', { n: this.levelIdx + 1 })}`, textStyle(28, P.cream, { stroke: P.ink, strokeThickness: 6 })).setOrigin(0.5).setDepth(10);
    this.puzzle = new PipePuzzle(this, {
      w: L.w, h: L.h, sources: L.sources, target: L.target, cx: width / 2 + 20, cy: 420,
      sourceIcons: L.keys.map((k) => SRC_ICONS[k]), sourceLabels: L.keys.map((k) => this.T(`sources.${k}`)),
      targetIcon: 'database', targetLabel: this.T('target'),
      onSolved: (info) => this.levelSolved(info),
    });
    this.puzzle.enabled = this.running;
  }

  onTimeUp() {
    if (this.puzzle) this.puzzle.enabled = false;
    super.onTimeUp();
  }

  levelSolved(info) {
    if (this.finished) return;
    const pts = 150 + Math.max(0, 150 - info.extra * 6);
    const tgt = this.puzzle.tgt;
    this.time.delayedCall(700, () => {
      this.addScore(pts, tgt.x, tgt.y - 70);
      floatText(this, 640, 220, this.T('connected'), P.cream, 40);
      burst(this, tgt.x, tgt.y, 'stars', 24);
    });
    this.time.delayedCall(1900, () => {
      this.tweens.add({
        targets: [this.puzzle.container, this.title], alpha: 0, duration: 300, onComplete: () => {
          this.puzzle.destroy(); this.title.destroy();
          this.levelIdx++;
          if (this.levelIdx < this.levels.length) this.startLevel();
          else this.startPart2Intro();
        },
      });
    });
  }

  // ── Deel 2: loonrun ──────────────────────────────────────────────────
  startPart2Intro() {
    this.timerPaused = true;
    const items = this.T('howTo').slice(2);
    this.showHowTo(this.T('part2'), items, () => { this.timerPaused = false; this.startPart2(); });
  }

  startPart2() {
    const { width, height } = DESIGN;
    this.slipIdx = 0;
    this.slipCount = 10;
    this.names = Phaser.Utils.Array.Shuffle(this.T('names').slice());
    // cao-kaart
    const cao = this.add.container(220, 410).setDepth(10);
    cao.add(panel(this, 0, 0, 340, 400));
    cao.add(this.add.image(-120, -150, 'icons', 'notebook').setDisplaySize(50, 50));
    cao.add(this.add.text(-85, -150, this.T('cao'), textStyle(30, P.ink)).setOrigin(0, 0.5));
    let y = -80;
    for (const [s, v] of Object.entries(SCALES)) {
      cao.add(this.add.text(-140, y, this.T('caoScale', { s, loon: v.toFixed(2).replace('.', ',') }), textStyle(21, P.ink)).setOrigin(0, 0.5));
      y += 46;
    }
    y += 10;
    cao.add(this.add.text(-140, y, this.T('caoMax', { uren: 40 }), textStyle(21, P.ink)).setOrigin(0, 0.5)); y += 46;
    cao.add(this.add.text(-140, y, this.T('caoBonus', { pct: 25 }), textStyle(21, P.ink)).setOrigin(0, 0.5));
    cao.x = -300;
    this.tweens.add({ targets: cao, x: 220, duration: 400, ease: 'Back.Out' });
    // lopende band
    this.belt = this.add.tileSprite(780, 650, 760, 36, 'belt').setDepth(5);
    this.add.rectangle(780, 650, 770, 46).setStrokeStyle(5, HEX.ink).setDepth(6);
    this.okBtn = button(this, 780, 640, this.T('allOk'), () => this.judge(null), { width: 260, color: HEX.green, icon: 'check' }).setDepth(30);
    this.counter = this.add.text(width - 40, 120, '', textStyle(24, P.cream, { stroke: P.ink, strokeThickness: 5 })).setOrigin(1, 0.5).setDepth(30);
    void height;
    this.nextSlip();
  }

  makeSlipData() {
    const scale = Phaser.Utils.Array.GetRandom(Object.keys(SCALES));
    const d = { name: this.names.pop() || 'J. Jansen', scale, wage: SCALES[scale], hours: Phaser.Math.Between(24, 40), bonus: 25, error: null };
    if (Math.random() < 0.6) {
      d.error = Phaser.Utils.Array.GetRandom(['wage', 'hours', 'bonus']);
      if (d.error === 'wage') { const others = Object.keys(SCALES).filter((s) => s !== scale); d.wage = Math.random() < 0.6 ? SCALES[Phaser.Utils.Array.GetRandom(others)] : d.wage - 1.25; }
      if (d.error === 'hours') d.hours = Phaser.Math.Between(42, 48);
      if (d.error === 'bonus') d.bonus = Phaser.Utils.Array.GetRandom([10, 15, 20, 30]);
    }
    return d;
  }

  nextSlip() {
    if (this.slipIdx >= this.slipCount) return this.endPart2();
    this.slipIdx++;
    this.counter.setText(`${this.slipIdx} / ${this.slipCount}`);
    const d = this.makeSlipData();
    this.slipData = d;
    const s = this.add.container(1500, 380).setDepth(20);
    s.add(card(this, 0, 0, 520, 380, 0xffffff));
    s.add(this.add.rectangle(0, -160, 500, 46, this.brand.color).setStrokeStyle(3, HEX.ink));
    s.add(this.add.image(-225, -160, 'icons', 'payslip').setDisplaySize(40, 40));
    s.add(this.add.text(-195, -160, `Loonstrook · ${d.name}`, textStyle(22, P.cream, { stroke: P.ink, strokeThickness: 4 })).setOrigin(0, 0.5));
    const fields = [
      ['scale', this.T('fieldScale'), d.scale],
      ['wage', this.T('fieldWage'), euro(d.wage)],
      ['hours', this.T('fieldHours'), `${d.hours}`],
      ['bonus', this.T('fieldBonus'), `${d.bonus}%`],
    ];
    this.fieldObjs = {};
    fields.forEach(([key, label, val], i) => {
      const fy = -95 + i * 66;
      const row = this.add.container(0, fy);
      const bg = this.add.nineslice(0, 0, 'ui_card', undefined, 470, 58, 18, 18, 18, 18).setTint(0xf3f6ff);
      const l = this.add.text(-215, 0, label, textStyle(22, P.inkSoft)).setOrigin(0, 0.5);
      const v = this.add.text(215, 0, val, textStyle(26, P.ink)).setOrigin(1, 0.5);
      row.add([bg, l, v]);
      row.setSize(470, 58).setInteractive({ useHandCursor: true });
      row.on('pointerover', () => bg.setTint(0xfff3c4));
      row.on('pointerout', () => bg.setTint(0xf3f6ff));
      row.on('pointerup', () => this.judge(key));
      row.bg = bg;
      s.add(row);
      this.fieldObjs[key] = row;
    });
    this.slip = s;
    this.judging = false;
    this.tweens.add({ targets: s, x: 780, duration: 450, ease: 'Back.Out' });
    this.tweens.add({ targets: this.belt, tilePositionX: '-=300', duration: 450 });
  }

  judge(field) {
    if (!this.running || this.judging || !this.slip) return;
    this.judging = true;
    const d = this.slipData;
    const correctField = d.error === 'wage' ? ['wage', 'scale'] : d.error ? [d.error] : [];
    let good;
    if (field === null) good = !d.error;
    else good = correctField.includes(field);
    const s = this.slip;
    if (good) {
      const pts = d.error ? 80 : 50;
      this.addScore(pts, 1010, 190);
      Audio.sfx('good');
      floatText(this, 780, 150, d.error ? this.T('correct') : this.T('allOk'), P.green, 28);
      burst(this, 780, 380, 'stars', 14);
    } else {
      this.addScore(-30, 1010, 190);
      Audio.sfx('error'); shake(this, 0.006, 150);
      floatText(this, 780, 150, d.error ? this.T('missed') : this.T('falseAlarm'), P.red, 26);
      wobble(this, s);
    }
    // laat de fout zien
    if (d.error) {
      const row = this.fieldObjs[d.error];
      row.bg.setTint(0xffc9c9);
      const mark = this.add.image(250, 0, 'icons', 'cross').setDisplaySize(34, 34);
      row.add(mark);
    }
    const stamp = this.add.image(140, 120, 'icons', good ? 'check' : 'cross').setDisplaySize(110, 110).setAngle(-14).setAlpha(0);
    s.add(stamp);
    this.tweens.add({ targets: stamp, alpha: 1, scale: { from: stamp.scale * 2, to: stamp.scale }, duration: 200, ease: 'Back.Out' });
    this.time.delayedCall(d.error ? 1100 : 700, () => {
      this.tweens.add({ targets: s, x: -400, duration: 380, ease: 'Cubic.In', onComplete: () => s.destroy() });
      this.tweens.add({ targets: this.belt, tilePositionX: '-=300', duration: 380 });
      this.slip = null;
      this.time.delayedCall(250, () => this.nextSlip());
    });
  }

  endPart2() {
    this.running = false;
    floatText(this, 640, 300, this.T('payslipsDone'), P.cream, 46);
    Audio.sfx('fanfare');
    const tb = Math.round(Math.max(0, this.timeLeft) * 1.5);
    if (tb) this.time.delayedCall(600, () => this.addScore(tb, 640, 360, `Tijdbonus +${tb}`));
    this.time.delayedCall(1600, () => this.finish());
  }
}
