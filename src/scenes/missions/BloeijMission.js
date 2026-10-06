// Missie Bloeij: loop over het strand, kies per collega de juiste interventie en houd de teamvitaliteit op peil.
import Phaser from 'phaser';
import { DESIGN } from '../../core/layout.js';
import { MissionBase } from './MissionBase.js';
import { t } from '../../core/i18n.js';
import { P, HEX, textStyle } from '../../gfx/palette.js';
import { Audio } from '../../core/AudioEngine.js';
import { Controls, isTouch } from '../../core/Controls.js';
import { burst, shake, floatText } from '../../core/Juice.js';
import { meter, panel, button } from '../../ui/widgets.js';
import { makeCharacter, ensureAnims, randomLook, pirateLook, faceMove } from '../../gfx/CharacterFactory.js';
import { makeBloeijBg } from '../../gfx/tex/acbg.js';

const SPOTS = [[250, 300], [520, 260], [830, 300], [1090, 270], [330, 500], [660, 470], [960, 520], [560, 640]];
const COMPLAINT_ICON = { tired: 'zzz', back: 'bolt', stress: 'storm', low: 'sadcloud' };
const INTERVENTIONS = [['rest', 'bed'], ['talk', 'chat'], ['adjust', 'adjust'], ['move', 'shoe']];
const STANDS = [{ x: 120, y: 690 }, { x: 1170, y: 690 }];

export class BloeijMission extends MissionBase {
  constructor() { super('BloeijMission', 'bloeij', { timeLimit: 150, thresholds: [300, 750, 1100] }); }

  drawBackground() {
    const { width, height } = DESIGN;
    if (!this.textures.exists('bl_bg')) makeBloeijBg(this);
    this.add.image(0, 0, 'bl_bg').setOrigin(0).setDepth(-100);
    // terras: parasols, bankjes en een paar bomen op het binnenterrein
    for (const [x, y, v] of [[60, 260, 0], [1230, 420, 2], [150, 440, 3], [1210, 250, 1]]) this.add.image(x, y, `umbrella${v}`).setOrigin(0.5, 1).setScale(0.8).setDepth(y);
    for (const [x, y] of [[420, 410], [860, 410]]) this.add.image(x, y, 'bench').setOrigin(0.5, 1).setDepth(y);
    for (const [x, y] of [[40, 610], [1250, 600]]) this.add.image(x, y, 'tree_round2').setOrigin(0.5, 1).setScale(0.75).setDepth(y);
  }

  startGame() {
    const { width, height } = DESIGN;
    this.vitality = 1;
    this.helped = 0;
    this.choosing = false;
    this.people = [];
    this.pirates = [];
    // standjes
    STANDS.forEach((s, i) => {
      const img = this.add.image(s.x, s.y + 20, i === 0 ? 'stall_bloeij' : 'stall_ijk').setOrigin(0.5, 1).setScale(0.62).setDepth(s.y);
      void img;
      this.add.text(s.x, s.y - 80, i === 0 ? 'FRUIT' : 'WATER', textStyle(18, P.cream, { stroke: P.ink, strokeThickness: 5 })).setOrigin(0.5).setDepth(s.y + 1);
      const ring = this.add.circle(s.x, s.y - 10, 110, HEX.green, 0.12).setStrokeStyle(4, HEX.green, 0.4).setDepth(-40);
      this.tweens.add({ targets: ring, scale: 1.08, alpha: 0.6, duration: 900, yoyo: true, repeat: -1 });
    });
    // collega's
    const data = Phaser.Utils.Array.Shuffle(this.T('people').slice());
    const answers = this.T('answers');
    data.forEach((p, i) => {
      const key = `bl_p${i}`;
      makeCharacter(this, key, randomLook());
      const [x, y] = SPOTS[i];
      const spr = this.add.sprite(x, y, key, 'tired').setOrigin(0.5, 0.92).setDepth(y);
      const icon = this.add.image(x, y - 110, 'icons', COMPLAINT_ICON[p.complaint]).setDisplaySize(48, 48).setDepth(5000);
      this.tweens.add({ targets: icon, y: y - 120, duration: 700 + i * 40, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      this.tweens.add({ targets: spr, scaleY: 0.96, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      const person = { ...p, answer: answers[p.complaint], spr, icon, x, y, done: false, tries: 0 };
      spr.setInteractive({ useHandCursor: true }).on('pointerup', () => {
        if (!this.running || this.choosing || person.done) return;
        if (Phaser.Math.Distance.Between(this.player.x, this.player.y, x, y) < 140) this.openChoice(person);
        else floatText(this, x, y - 140, this.T('closer'), P.ink, 22);
      });
      this.people.push(person);
    });
    // speler
    this.player = this.add.sprite(640, 690, 'player', 'idle').setOrigin(0.5, 0.92);
    this.playerAnim = ensureAnims(this, 'player');
    this.controls = new Controls(this, { actionLabel: '!' });
    this.controls.setActionVisible(false);
    // piraten
    this.spawnPirate(80, 380); this.spawnPirate(1200, 560);
    this.time.delayedCall(50000, () => this.running && this.spawnPirate(640, 180));
    // HUD
    this.add.image(46, 112, 'icons', 'heart').setDisplaySize(40, 40).setDepth(900);
    this.vmeter = meter(this, 72, 112, 280, 30, HEX.green).setDepth(900);
    this.add.text(212, 112, this.T('vitality'), textStyle(16, P.cream, { stroke: P.ink, strokeThickness: 4 })).setOrigin(0.5).setDepth(901);
    this.helpedText = this.add.text(width - 40, 112, '', textStyle(24, P.ink, { backgroundColor: '#fff8e7', padding: { x: 12, y: 6 } })).setOrigin(1, 0.5).setDepth(900);
    this.updateHelped();
    this.prompt = this.add.text(width / 2, height - 30, '', textStyle(22, P.ink, { backgroundColor: '#f6c33b', padding: { x: 14, y: 6 } })).setOrigin(0.5).setDepth(900).setVisible(false);
    this.prompt.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.controls.trigger());
    this.touch = isTouch(this);
    ['ONE', 'TWO', 'THREE', 'FOUR'].forEach((k, i) => this.input.keyboard.on(`keydown-${k}`, () => { if (this.choosing) this.choose(INTERVENTIONS[i][0]); }));
  }

  spawnPirate(x, y) {
    const key = `bl_pir${this.pirates.length}`;
    makeCharacter(this, key, pirateLook(Math.random, { angry: true }));
    const spr = this.add.sprite(x, y, key, 'idle').setOrigin(0.5, 0.92);
    const mega = this.add.image(x + 26, y - 50, 'icons', 'megaphone').setDisplaySize(40, 40);
    ensureAnims(this, key);
    const p = { spr, key, mega, speed: 62 + this.pirates.length * 10, cool: 0, wob: Math.random() * 10 };
    this.pirates.push(p);
    spr.setAlpha(0);
    this.tweens.add({ targets: spr, alpha: 1, duration: 400 });
  }

  updateHelped() { this.helpedText.setText(`${this.T('helped')}: ${this.helped} / ${this.people.length}`); }

  tick(time, dt) {
    if (this.sea) { this.sea.tilePositionX += dt * 0.01; this.seaW.tilePositionX += dt * 0.03; }
    if (this.choosing) return;
    const s = dt / 1000;
    // vitaliteit
    let refill = false;
    for (const st of STANDS) if (Phaser.Math.Distance.Between(this.player.x, this.player.y, st.x, st.y) < 120) refill = true;
    this.vitality += (refill ? 0.1 : -0.011) * s;
    if (refill && Math.random() < 0.15) burst(this, this.player.x, this.player.y - 60, 'hearts', 3);
    this.vitality = Phaser.Math.Clamp(this.vitality, 0, 1);
    this.vmeter.setValue(this.vitality, true);
    this.vmeter.setColor(this.vitality > 0.5 ? HEX.green : this.vitality > 0.25 ? HEX.gold : HEX.red);
    if (this.vitality <= 0) { this.running = false; Audio.sfx('lose'); return this.finishGame(false); }

    // speler
    const p = this.player;
    const v = this.controls.vector();
    if (Math.abs(v.x) + Math.abs(v.y) > 0.1) {
      p.x = Phaser.Math.Clamp(p.x + v.x * 280 * s, 30, 1250);
      p.y = Phaser.Math.Clamp(p.y + v.y * 280 * s, 200, 710);
      faceMove(p, 'player', v.x, v.y);
    } else faceMove(p, 'player', 0, 0);
    p.setDepth(p.y);

    // piraten
    for (const pr of this.pirates) {
      pr.wob += s;
      const dx = p.x - pr.spr.x + Math.sin(pr.wob * 1.3) * 60, dy = p.y - pr.spr.y + Math.cos(pr.wob) * 40;
      const d = Math.hypot(dx, dy) || 1;
      pr.spr.x += (dx / d) * pr.speed * s; pr.spr.y += (dy / d) * pr.speed * s;
      faceMove(pr.spr, pr.key, dx, dy);
      pr.spr.setDepth(pr.spr.y);
      pr.mega.setPosition(pr.spr.x + (dx < 0 ? -26 : 26), pr.spr.y - 50).setFlipX(dx < 0).setDepth(pr.spr.y + 1);
      pr.cool -= dt;
      if (pr.cool <= 0 && Phaser.Math.Distance.Between(p.x, p.y, pr.spr.x, pr.spr.y) < 48) {
        pr.cool = 2200;
        this.vitality -= 0.12;
        Audio.sfx('hit'); shake(this, 0.01, 200);
        floatText(this, p.x, p.y - 110, this.T('shout'), P.red, 32);
        burst(this, pr.mega.x, pr.mega.y, 'smoke', 8);
        const ang = Math.atan2(p.y - pr.spr.y, p.x - pr.spr.x);
        this.tweens.add({ targets: p, x: Phaser.Math.Clamp(p.x + Math.cos(ang) * 90, 30, 1250), y: Phaser.Math.Clamp(p.y + Math.sin(ang) * 90, 200, 710), duration: 220, ease: 'Quad.Out' });
        this.tweens.add({ targets: pr.spr, x: pr.spr.x - Math.cos(ang) * 60, y: pr.spr.y - Math.sin(ang) * 60, duration: 300 });
      }
    }

    // dichtstbijzijnde collega
    let near = null, best = 80;
    for (const pe of this.people) {
      if (pe.done) continue;
      const d = Phaser.Math.Distance.Between(p.x, p.y, pe.x, pe.y);
      if (d < best) { best = d; near = pe; }
    }
    this.near = near;
    this.controls.setActionVisible(!!near);
    if (near) {
      this.prompt.setText((this.touch ? '! ' : `${t('hud.talkHintKeys')}: `) + this.T('helpPrompt', { persoon: near.name })).setVisible(true);
      if (this.controls.action()) this.openChoice(near);
    } else { this.prompt.setVisible(false); this.controls.action(); }
  }

  openChoice(person) {
    if (this.choosing) return;
    this.choosing = true;
    this.timerPaused = true;
    this.current = person;
    this.prompt.setVisible(false);
    this.controls.setVisible(false);
    const { width, height } = DESIGN;
    const L = this.add.container(0, 0).setDepth(3000);
    this.choiceLayer = L;
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x0f1a2a, 0.35).setInteractive();
    L.add(bg);
    L.add(panel(this, width / 2, height - 170, 1100, 300));
    const av = this.add.image(width / 2 - 470, height - 140, person.spr.texture.key, 'tired').setScale(1.4).setOrigin(0.5, 1);
    L.add(av);
    L.add(this.add.text(width / 2 - 390, height - 290, this.T('choose', { persoon: person.name }), textStyle(26, P.ink)).setOrigin(0, 0.5));
    L.add(this.add.text(width / 2 - 390, height - 240, `"${person.line}"`, textStyle(22, P.inkSoft, { fontStyle: 'italic 600', wordWrap: { width: 860 } })).setOrigin(0, 0.5));
    INTERVENTIONS.forEach(([key, icon], i) => {
      const b = button(this, width / 2 - 270 + i * 225, height - 120, `${i + 1}. ${this.T(`interventions.${key}`)}`, () => this.choose(key), { width: 215, height: 90, size: 20, icon, color: HEX.cream });
      L.add(b);
      b.setScale(0); this.tweens.add({ targets: b, scale: 1, delay: i * 60, duration: 250, ease: 'Back.Out' });
    });
    L.setAlpha(0);
    this.tweens.add({ targets: L, alpha: 1, duration: 180 });
  }

  closeChoice() {
    const L = this.choiceLayer;
    this.choiceLayer = null;
    this.tweens.add({ targets: L, alpha: 0, duration: 150, onComplete: () => L.destroy() });
    this.choosing = false;
    this.timerPaused = false;
    this.controls.setVisible(true);
  }

  choose(key) {
    const pe = this.current;
    if (!this.choosing || !pe) return;
    this.closeChoice();
    if (key === pe.answer) {
      pe.done = true;
      this.helped++;
      this.updateHelped();
      const pts = pe.tries === 0 ? 120 : 60;
      this.addScore(pts, pe.x, pe.y - 120);
      this.vitality = Math.min(1, this.vitality + 0.15);
      Audio.sfx('great');
      burst(this, pe.x, pe.y - 60, 'hearts', 18);
      burst(this, pe.x, pe.y - 60, 'stars', 12);
      this.say(pe, Phaser.Utils.Array.GetRandom(this.T('correct')), P.green);
      pe.icon.destroy();
      pe.spr.setFrame('cheer');
      this.tweens.add({ targets: pe.spr, y: pe.y - 30, duration: 200, yoyo: true, repeat: 1, ease: 'Quad.Out' });
      this.time.delayedCall(900, () => {
        const key2 = pe.spr.texture.key;
        ensureAnims(this, key2);
        const dir = pe.x < 640 ? -1 : 1;
        faceMove(pe.spr, key2, dir, 0);
        this.tweens.add({ targets: pe.spr, x: pe.x + dir * 800, duration: 2600, onComplete: () => pe.spr.destroy() });
      });
      if (this.helped === this.people.length) {
        this.running = false;
        this.time.delayedCall(1200, () => this.finishGame(true));
      }
    } else {
      pe.tries++;
      this.addScore(-30, pe.x, pe.y - 120);
      this.vitality -= 0.08;
      Audio.sfx('bad');
      shake(this, 0.005, 120);
      this.say(pe, Phaser.Utils.Array.GetRandom(this.T('wrong')), P.red);
    }
  }

  say(pe, text, color) {
    const tx = this.add.text(pe.x, pe.y - 150, text, textStyle(20, color, { backgroundColor: '#ffffff', padding: { x: 10, y: 6 } })).setOrigin(0.5).setDepth(6000);
    tx.setScale(0.3);
    this.tweens.add({ targets: tx, scale: 1, duration: 200, ease: 'Back.Out' });
    this.tweens.add({ targets: tx, alpha: 0, y: tx.y - 20, delay: 1600, duration: 400, onComplete: () => tx.destroy() });
  }

  onTimeUp() {
    floatText(this, 640, 360, t('common.timeUp'), P.cream, 64);
    this.time.delayedCall(900, () => this.finishGame(false));
  }

  finishGame(all) {
    if (this.choiceLayer) this.closeChoice();
    this.controls.setVisible(false);
    this.prompt.setVisible(false);
    if (all) {
      const tb = Math.round(Math.max(0, this.timeLeft) * 2);
      const vb = Math.round(this.vitality * 250);
      this.addScore(tb + vb, 640, 300, `Bonus +${tb + vb}`);
      Audio.sfx('fanfare');
    }
    this.time.delayedCall(800, () => this.finish());
  }
}
