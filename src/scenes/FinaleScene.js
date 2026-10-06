// Finale bovenop de Toren van Paperassen: drie fases (matchen, koppelen, adviseren) tegen Kapitein Rompslomp.
// Overgelopen crewleden uit de Reijn-missie geven bonussen.
import Phaser from 'phaser';
import { DESIGN } from '../core/layout.js';
import { MissionBase } from './missions/MissionBase.js';
import { t } from '../core/i18n.js';
import { P, HEX, textStyle, titleStyle } from '../gfx/palette.js';
import { Audio } from '../core/AudioEngine.js';
import { SaveManager } from '../core/SaveManager.js';
import { burst, shake, floatText, flash, confettiRain, hitstop } from '../core/Juice.js';
import { card, button, meter, panel, transitionTo } from '../ui/widgets.js';
import { dragTap } from '../ui/dragtap.js';
import { makeCharacter, roverLook } from '../gfx/CharacterFactory.js';
import { makeTexture, circle, style } from '../gfx/draw.js';
import { showDialog } from './DialogScene.js';
import { makeTowerTopBg } from '../gfx/tex/rompslomp.js';
import { PipePuzzle } from './missions/PipePuzzle.js';
import { rng } from '../gfx/draw.js';
import { BRANDS } from '../config/brands.js';

const POSTS = [['cannon', 'notebook'], ['helm', 'clock'], ['galley', 'chefhat'], ['crow', 'magnifier']];

export class FinaleScene extends MissionBase {
  constructor() { super('Finale', 'finale', { thresholds: [300, 800, 1200] }); }

  init(data) {
    super.init(data);
    this.brand = { id: 'finale', name: t('finale.title'), short: 'Finale', initials: '⌛', color: HEX.pirateRed, css: P.pirateRed };
    this.hp = 100;
  }

  T(key, vars) { return t(`finale.${key}`, vars); }
  get npc() { return { name: t('npc.captain'), tex: 'npc_captain', color: HEX.pirateRed }; }

  create() {
    if (!this.textures.exists('logofb_finale')) {
      const fr = this.textures.getFrame('icons', 'hourglass');
      makeTexture(this, 'logofb_finale', 128, 128, (c) => {
        circle(c, 64, 64, 58); style(c, { fill: P.pirateRed, lw: 6 });
        c.drawImage(fr.source.image, fr.cutX, fr.cutY, 64, 64, 24, 22, 80, 80);
      });
    }
    super.create();
    Audio.music('finale');
  }

  drawBackground() {
    const { width, height } = DESIGN;
    if (!this.textures.exists('tower_bg')) makeTowerTopBg(this, width, height);
    this.add.image(0, 0, 'tower_bg').setOrigin(0).setDepth(-100);
    // dwarrelende formulieren
    this.add.particles(0, -40, 'paper_sheet', {
      x: { min: 0, max: width }, speedY: { min: 30, max: 70 }, speedX: { min: -30, max: 30 }, rotate: { min: 0, max: 360 },
      lifespan: 9000, frequency: 900, alpha: { start: 0.9, end: 0.2 },
    }).setDepth(-50);
    // kooi met prinses Mensenmens
    this.jan = this.add.sprite(640, 330, 'npc_jan', 'tired').setOrigin(0.5, 1).setScale(1.2).setDepth(10);
    this.cage = this.add.image(640, 345, 'cage').setOrigin(0.5, 1).setScale(1.1).setDepth(11);
    this.tweens.add({ targets: this.jan, x: 646, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    // kapitein
    this.captain = this.add.sprite(1110, 560, 'npc_captain', 'idle').setOrigin(0.5, 0.92).setScale(2).setDepth(20);
    this.capTween = this.tweens.add({ targets: this.captain, scaleY: 2.06, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    // Kroko Paragraaf naast de kapitein
    this.parrot = this.add.sprite(960, 570, 'npc_guard', 'angry').setOrigin(0.5, 0.92).setScale(1.5).setDepth(19);
    this.tweens.add({ targets: this.parrot, y: 560, duration: 400, yoyo: true, repeat: -1 });
    // speler + kanon
    this.playerSpr = this.add.sprite(170, 600, 'player', 'idle').setOrigin(0.5, 0.92).setScale(1.7).setDepth(20);
    this.cannon = this.add.image(300, 620, 'cannon').setScale(1.1).setDepth(19).setFlipX(true);
    // Buddy staat naast de speler
    this.buddySpr = this.add.sprite(330, 560, 'npc_buddy', 'happy').setOrigin(0.5, 0.92).setScale(1.5).setDepth(18);
    this.tweens.add({ targets: this.buddySpr, scaleY: 1.56, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    // overgelopen crew
    const n = SaveManager.state?.crewDefected || 0;
    this.helpers = n;
    this.helperSprites = [];
    const crew = t('missions.reijn.crew');
    for (let i = 0; i < n; i++) {
      const key = `fin_help${i}`;
      makeCharacter(this, key, roverLook(rng(i * 7 + 3)));
      const s = this.add.sprite(70 + i * 70, 420 + (i % 2) * 30, key, 'cheer').setOrigin(0.5, 0.92).setScale(1.1).setDepth(15);
      this.tweens.add({ targets: s, y: s.y - 10, duration: 300 + i * 40, yoyo: true, repeat: -1 });
      const fl = this.add.image(s.x + 12, s.y - 120, 'flagcloth').setScale(0.35).setTint(BRANDS.reijn.color).setDepth(16);
      this.tweens.add({ targets: fl, angle: { from: -8, to: 8 }, duration: 400, yoyo: true, repeat: -1 });
      s.crewName = crew[i]?.name || 'Crew';
      this.helperSprites.push(s);
    }
    // HP-balk
    this.add.text(1110, 120, t('npc.captain'), textStyle(24, P.cream, { stroke: P.ink, strokeThickness: 5 })).setOrigin(0.5).setDepth(30);
    this.hpBar = meter(this, 950, 152, 320, 30, HEX.red).setDepth(30);
  }

  flowIntro() {
    showDialog(this, {
      npc: this.npc,
      lines: this.T('intro'),
      onDone: () => {
        const msg = this.helpers ? this.T('helpers', { n: this.helpers }) : this.T('noHelpers');
        floatText(this, 640, 300, msg, P.gold, 34);
        if (this.helpers) {
          const bonuses = this.T('helperBonuses');
          this.helperSprites.forEach((s, i) => this.time.delayedCall(600 + i * 500, () => {
            floatText(this, s.x + 120, s.y - 160, this.T('helperBonus', { naam: s.crewName, bonus: bonuses[i] }), P.cream, 18);
            Audio.sfx('pickup');
          }));
        }
        this.time.delayedCall(1200 + this.helpers * 500, () => this.phase1());
      },
    });
  }

  // ── Algemene effecten ────────────────────────────────────────────────
  setHp(v) {
    this.hp = Math.max(0, v);
    this.hpBar.setValue(this.hp / 100);
  }

  fireAtCaptain(dmg, onDone) {
    Audio.sfx('cannon');
    shake(this, 0.006, 150);
    burst(this, this.cannon.x + 50, this.cannon.y - 20, 'smoke', 10);
    this.tweens.add({ targets: this.cannon, x: this.cannon.x - 14, duration: 60, yoyo: true });
    const ball = this.add.circle(this.cannon.x + 50, this.cannon.y - 20, 12, HEX.ink).setDepth(40);
    const tx = this.captain.x, ty = this.captain.y - 90;
    const sx = ball.x, sy = ball.y;
    const c = { t: 0 };
    this.tweens.add({
      targets: c, t: 1, duration: 450, ease: 'Linear',
      onUpdate: () => { ball.x = sx + (tx - sx) * c.t; ball.y = sy + (ty - sy) * c.t - Math.sin(c.t * Math.PI) * 160; },
      onComplete: () => {
        ball.destroy();
        Audio.sfx('hit');
        flash(this, 0xffffff, 80);
        hitstop(this, 60);
        shake(this, 0.014, 260);
        burst(this, tx, ty, 'stars', 20);
        burst(this, tx, ty, 'smoke', 8);
        this.captain.setTint(0xff8080);
        this.time.delayedCall(150, () => this.captain.clearTint());
        this.tweens.add({ targets: this.captain, angle: { from: -10, to: 10 }, duration: 60, yoyo: true, repeat: 2, onComplete: () => this.captain.setAngle(0) });
        this.setHp(this.hp - dmg);
        this.captainSays(Phaser.Utils.Array.GetRandom(this.T('captainHurt')), P.red);
        onDone && onDone();
      },
    });
  }

  captainSays(text, color = P.ink) {
    if (this.capBubble) this.capBubble.destroy();
    const c = this.add.container(1060, 250).setDepth(50);
    const tx = this.add.text(0, 0, text, textStyle(25, color, { wordWrap: { width: 340 }, align: 'center' })).setOrigin(0.5);
    const bg = this.add.nineslice(0, 0, 'ui_card', undefined, tx.width + 40, tx.height + 30, 18, 18, 18, 18);
    c.add([bg, tx]);
    c.setScale(0.3);
    this.tweens.add({ targets: c, scale: 1, duration: 200, ease: 'Back.Out' });
    this.capBubble = c;
    this.time.delayedCall(2200, () => { if (this.capBubble === c) { c.destroy(); this.capBubble = null; } });
  }

  captainLaughs() {
    Audio.sfx('error');
    this.captainSays(Phaser.Utils.Array.GetRandom(this.T('captainLaugh')), P.ink);
    this.tweens.add({ targets: this.captain, y: this.captain.y - 20, duration: 120, yoyo: true, repeat: 2 });
    this.captain.setFrame('talk');
    this.time.delayedCall(800, () => this.captain.setFrame('idle'));
  }

  phaseTimer(seconds, onEnd) {
    const { width } = DESIGN;
    this.phaseLeft = seconds;
    this.phaseTotal = seconds;
    this.phaseEnd = onEnd;
    if (!this.pBar) {
      this.pIcon = this.add.image(width / 2 - 170, 42, 'icons', 'clock').setDisplaySize(40, 40).setDepth(1001);
      this.pBar = meter(this, width / 2 - 140, 42, 300, 30, HEX.green).setDepth(1001);
    }
    this.pIcon.setVisible(true); this.pBar.setVisible(true);
  }

  stopPhaseTimer() { this.phaseEnd = null; if (this.pBar) { this.pBar.setVisible(false); this.pIcon.setVisible(false); } }

  tick(_t, dt) {
    if (this.phaseEnd) {
      this.phaseLeft -= dt / 1000;
      const v = Math.max(0, this.phaseLeft / this.phaseTotal);
      this.pBar.setValue(v, true);
      this.pBar.setColor(v > 0.5 ? HEX.green : v > 0.2 ? HEX.gold : HEX.red);
      if (this.phaseLeft <= 0) { const cb = this.phaseEnd; this.phaseEnd = null; floatText(this, 640, 300, this.T('phaseTime'), P.cream, 34); cb(); }
    }
  }

  // ── Fase 1: matchen ──────────────────────────────────────────────────
  phase1() {
    this.showHowTo(this.T('phase1'), [{ icon: 'people', text: this.T('phase1How') }], () => {
      this.running = true;
      this.p1 = this.add.container(0, 0).setDepth(30);
      this.p1Done = 0;
      const dt = dragTap(this, { onDrop: (item, tg) => this.p1Drop(item, tg) });
      this.p1dt = dt;
      POSTS.forEach(([key, icon], i) => {
        const x = 505 + (i % 2) * 280, y = 360 + Math.floor(i / 2) * 125;
        const c = this.add.container(x, y);
        c.add(card(this, 0, 0, 264, 112, 0xfff3d6));
        c.add(this.add.image(-82, 0, 'icons', icon).setDisplaySize(64, 64));
        c.add(this.add.text(-40, 0, this.T(`posts.${key}`), textStyle(28, P.ink)).setOrigin(0, 0.5));
        c.setSize(264, 112);
        c.post = key;
        this.p1.add(c);
        dt.addTarget(c, { post: key, obj: c });
      });
      const skills = Phaser.Utils.Array.Shuffle([...POSTS.map(([k]) => k), 'decoy']);
      const crew = Phaser.Utils.Array.Shuffle(t('missions.reijn.crew').slice());
      skills.forEach((sk, i) => {
        const x = 300 + i * 182, y = 600; // niet te laag: op iPhone is de onderrand het veeg-gebaar
        const c = this.add.container(x, y);
        c.add(card(this, 0, 0, 172, 104, 0xffffff));
        const hl = this.add.nineslice(0, 0, 'ui_card', undefined, 188, 120, 18, 18, 18, 18).setTint(HEX.gold).setVisible(false);
        c.addAt(hl, 0);
        c.highlight = hl;
        c.add(this.add.text(0, -22, (crew[i] || crew[0]).name.split(' ')[1] || 'Crew', textStyle(23, P.ink)).setOrigin(0.5));
        c.add(this.add.text(0, 16, this.T(`skills.${sk}`), textStyle(21, P.cream, { backgroundColor: sk === 'decoy' ? '#8a8a8a' : '#2d1e2f', padding: { x: 7, y: 3 } })).setOrigin(0.5));
        c.skill = sk; c.home = { x, y }; c.baseDepth = 20;
        this.p1.add(c);
        dt.addItem(c, 172, 104);
      });
      this.phaseTimer(40 + (this.helpers >= 1 ? 10 : 0), () => this.endPhase1());
    });
  }

  p1Drop(item, tg) {
    if (!this.running || this.p1Ended) return false;
    const post = tg.data.post;
    if (item.skill === post) {
      item.locked = true; item.disableInteractive();
      this.tweens.add({ targets: item, x: tg.obj.x + 60, y: tg.obj.y + 20, scale: 0.7, duration: 200 });
      this.p1dt.removeTarget(tg.obj);
      tg.obj.list[0].setTint(0xc9f7c9);
      this.addScore(100, tg.obj.x, tg.obj.y - 60);
      Audio.sfx('good');
      this.p1Done++;
      this.fireAtCaptain(8);
      if (this.p1Done === POSTS.length) this.time.delayedCall(900, () => this.endPhase1());
      return true;
    }
    this.addScore(-30, tg.obj.x, tg.obj.y - 60);
    this.captainLaughs();
    return false;
  }

  endPhase1() {
    if (this.p1Ended) return;
    this.p1Ended = true;
    this.stopPhaseTimer();
    this.running = false;
    this.tweens.add({ targets: this.p1, alpha: 0, duration: 300, onComplete: () => { this.p1.destroy(); this.phase2(); } });
  }

  // ── Fase 2: koppelen ─────────────────────────────────────────────────
  phase2() {
    this.showHowTo(this.T('phase2'), [{ icon: 'lock', text: this.T('phase2How') }], () => {
      this.running = true;
      this.puzzle = new PipePuzzle(this, {
        w: 5, h: 4, sources: [0, 3], target: 1, cx: 640, cy: 470, depth: 30,
        flow: 0xf6c33b, idle: 0x9a8f86,
        sourceIcons: ['lock', 'lock'], sourceLabels: [this.T('slot', { n: 1 }), this.T('slot', { n: 2 })],
        targetIcon: 'gear', targetLabel: this.T('winch'),
        onSolved: (info) => {
          if (this.p2Ended) return;
          this.addScore(150 + Math.max(0, 150 - info.extra * 6), 640, 300);
          this.time.delayedCall(500, () => this.fireAtCaptain(28, () => this.time.delayedCall(800, () => this.endPhase2())));
        },
      });
      this.puzzle.container.setAlpha(0);
      this.tweens.add({ targets: this.puzzle.container, alpha: 1, duration: 300 });
      this.phaseTimer(50 + (this.helpers >= 4 ? 10 : 0), () => {
        // tijd op: de crew helpt, maar zonder punten
        this.p2Ended = true;
        this.puzzle.autoSolve();
        this.time.delayedCall(600, () => { this.setHp(this.hp - 28); this.endPhase2(true); });
      });
    });
  }

  endPhase2() {
    if (this.p2Closed) return;
    this.p2Closed = true;
    this.p2Ended = true;
    this.stopPhaseTimer();
    this.running = false;
    floatText(this, 640, 220, this.T('cageOpen'), P.gold, 34);
    this.tweens.add({ targets: this.cage, angle: -6, duration: 80, yoyo: true, repeat: 3 });
    this.tweens.add({ targets: this.puzzle.container, alpha: 0, delay: 400, duration: 300, onComplete: () => { this.puzzle.destroy(); this.phase3(); } });
  }

  // ── Fase 3: adviseren ────────────────────────────────────────────────
  phase3() {
    this.showHowTo(this.T('phase3'), [{ icon: 'bulb', text: this.T('phase3How') }], () => {
      this.running = true;
      this.claims = this.T('claims');
      this.claimIdx = 0;
      this.shield = this.helpers >= 2;
      this.hint = this.helpers >= 3;
      this.nextClaim();
    });
  }

  nextClaim() {
    if (this.claimLayer) this.claimLayer.destroy();
    if (this.claimIdx >= this.claims.length) return this.victory();
    const cl = this.claims[this.claimIdx];
    const L = this.add.container(0, 0).setDepth(30);
    this.claimLayer = L;
    const bubble = this.add.container(600, 240);
    const tx = this.add.text(0, 0, `"${cl.claim}"`, textStyle(30, P.ink, { wordWrap: { width: 720 }, align: 'center', fontStyle: 'italic 700' })).setOrigin(0.5);
    bubble.add([this.add.nineslice(0, 0, 'ui_card', undefined, 780, tx.height + 44, 18, 18, 18, 18).setTint(0xffe1e1), tx]);
    bubble.add(this.add.triangle(380, 10, 0, 0, 40, 10, 0, 24, 0xffe1e1).setStrokeStyle(3, HEX.ink));
    L.add(bubble);
    bubble.setScale(0);
    this.tweens.add({ targets: bubble, scale: 1, duration: 250, ease: 'Back.Out' });
    this.captain.setFrame('talk');
    this.time.delayedCall(600, () => this.captain.setFrame('idle'));
    Audio.sfx('squawk');
    const wrongs = cl.options.map((_, i) => i).filter((i) => i !== cl.answer);
    const struck = this.hint ? Phaser.Utils.Array.GetRandom(wrongs) : -1;
    cl.options.forEach((o, i) => {
      const b = button(this, 590, 400 + i * 106, o, () => this.answer(i, b), { width: 900, height: 98, size: 25, color: HEX.cream });
      b.label.setWordWrapWidth(830).setAlign('center');
      if (i === struck) { b.setEnabled(false); b.label.setColor(P.inkSoft); }
      L.add(b);
      b.setScale(0);
      this.tweens.add({ targets: b, scale: 1, delay: 200 + i * 80, duration: 220, ease: 'Back.Out' });
    });
    this.answered = false;
  }

  answer(i, btn) {
    if (!this.running || this.answered) return;
    const cl = this.claims[this.claimIdx];
    if (i === cl.answer) {
      this.answered = true;
      btn.bg.setTint(HEX.green);
      this.addScore(120, btn.x + 300, btn.y - 30);
      Audio.sfx('great');
      this.fireAtCaptain(7, () => this.time.delayedCall(700, () => { this.claimIdx++; this.nextClaim(); }));
    } else {
      btn.bg.setTint(HEX.red);
      btn.setEnabled(false);
      if (this.shield) {
        this.shield = false;
        floatText(this, btn.x, btn.y - 40, this.T('shield'), P.teal, 24);
        Audio.sfx('pop');
      } else {
        this.addScore(-40, btn.x + 300, btn.y - 30);
        this.captainLaughs();
        shake(this, 0.006, 150);
      }
    }
  }

  // ── Overwinning ──────────────────────────────────────────────────────
  victory() {
    this.running = false;
    this.setHp(0);
    Audio.sfx('cannon');
    flash(this, 0xffffff, 200);
    shake(this, 0.02, 500);
    this.captain.setFrame('tired');
    this.capTween.stop();
    // kapitein vliegt overboord
    const c = this.captain;
    const sx = c.x, sy = c.y;
    const p = { t: 0 };
    this.tweens.add({
      targets: p, t: 1, duration: 1400, ease: 'Quad.In',
      onUpdate: () => { c.x = sx + 300 * p.t; c.y = sy - Math.sin(p.t * Math.PI) * 300 + p.t * 120; c.angle = 720 * p.t; },
      onComplete: () => { Audio.sfx('splash'); burst(this, 1260, 560, 'splash', 30, { speed: { min: 200, max: 500 } }); c.setVisible(false); },
    });
    this.parrot.setFrame('surprised');
    this.tweens.killTweensOf(this.parrot);
    this.tweens.add({ targets: this.parrot, x: 1450, duration: 1500, ease: 'Quad.In' });
    this.buddySpr.setFrame('cheer');
    this.time.delayedCall(1600, () => {
      // kooi open
      Audio.sfx('unlock');
      this.tweens.add({ targets: this.cage, y: this.cage.y - 300, alpha: 0, duration: 900, ease: 'Back.In' });
      this.jan.setFrame('cheer');
      this.tweens.killTweensOf(this.jan);
      this.tweens.add({ targets: this.jan, y: this.jan.y - 30, duration: 250, yoyo: true, repeat: -1, ease: 'Quad.Out' });
      this.playerSpr.setFrame('cheer');
      confettiRain(this, 4000);
      Audio.music('credits');
      this.time.delayedCall(1200, () => showDialog(this, { lines: this.T('victory'), onDone: () => this.finish() }));
    });
  }

  // In plaats van een sleutelfragment: naar de aftiteling.
  reward() {
    SaveManager.finish(this.score);
    SaveManager.clockRunning = false;
    transitionTo(this, 'Credits', { score: SaveManager.totalScore(), finale: this.score });
  }

  showResults(stars) {
    // altijd door naar de aftiteling (ook met 0 sterren): de finale is het verhaal-einde
    super.showResults(Math.max(1, stars));
  }

  exit() {
    SaveManager.clockRunning = false;
    this.cameras.main.fadeOut(400, 15, 61, 92);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('World'));
  }
}
