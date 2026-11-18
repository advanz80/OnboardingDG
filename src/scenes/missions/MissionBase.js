// TEMPLATE voor elke missie: intro-dialoog → uitlegscherm → aftellen → minigame →
// resultaat (sterren) → beloning (sleutelfragment) → outro-dialoog → terug naar het park.
// Een missie erft van MissionBase en implementeert minimaal startGame().
import Phaser from 'phaser';
import { DESIGN, centerDesign } from '../../core/layout.js';
import { t } from '../../core/i18n.js';
import { P, HEX, textStyle, titleStyle, shade, MOBILE } from '../../gfx/palette.js';
import { BRANDS } from '../../config/brands.js';
import { SaveManager } from '../../core/SaveManager.js';
import { Audio } from '../../core/AudioEngine.js';
import { panel, button, roundButton, logo, dim, meter, bake } from '../../ui/widgets.js';
import { burst, confettiRain, floatText, popIn, shake } from '../../core/Juice.js';
import { showDialog } from '../DialogScene.js';

const HINT_COST = 25;

export class MissionBase extends Phaser.Scene {
  /**
   * @param {string} key   scènenaam
   * @param {string} id    missie-id (bhc, driessen, …)
   * @param {{timeLimit?: number, thresholds: number[]}} opts  tijd in seconden; score-drempels voor 1/2/3 sterren
   */
  constructor(key, id, opts = {}) {
    super(key);
    this.missionId = id;
    this.opts = opts;
  }

  init(data) {
    this.replay = !!data?.replay;
    this.debug = !!data?.debug;
    this.brand = BRANDS[this.missionId];
    this.score = 0;
    this.running = false;
    this.finished = false;
    this.timeLeft = this.opts.timeLimit || 0;
    this.thresholds = this.opts.thresholds || [100, 200, 300];
    this.extra = {};
  }

  get npc() {
    return { name: t(`missions.${this.missionId}.npc`), tex: `npc_${this.missionId}`, color: this.brand.color };
  }

  T(key, vars) { return t(`missions.${this.missionId}.${key}`, vars); }

  create() {
    SaveManager.clockRunning = true;
    this.cameras.main.fadeIn(400, 15, 61, 92);
    Audio.music(this.missionId);
    this.drawBackground();
    this.game.events.emit('mission-start', this.missionId);
    this.buildHeader();
    centerDesign(this, this.brand.dark || '#1a1220');
    this.layer = this.add.container(0, 0).setDepth(10);
    this.time.delayedCall(350, () => this.flowIntro());
  }

  // ── Achtergrond (overschrijfbaar) ──────────────────────────────────────
  drawBackground() {
    const { width, height } = DESIGN;
    const g = this.add.graphics().setDepth(-100);
    const c1 = this.brand.color, c2 = Phaser.Display.Color.HexStringToColor(shade(this.brand.css, -0.35)).color;
    g.fillGradientStyle(c1, c1, c2, c2, 1).fillRect(0, 0, width, height);
    g.fillStyle(0xffffff, 0.06);
    for (let x = -height; x < width; x += 80) g.fillTriangle(x, height, x + 40, height, x + height + 40, 0).fillTriangle(x, height, x + height, 0, x + height + 40, 0);
    bake(this, g, `mbg_${this.missionId}`, 0, 0, width, height);
  }

  buildHeader() {
    const { width } = DESIGN;
    this.header = this.add.container(0, 0).setDepth(3600);
    const bar = this.add.nineslice(width / 2, 44, 'ui_panel', undefined, width - 24, 76, 30, 30, 30, 30);
    const l = logo(this, this.brand, 60, 42, 54);
    const title = this.add.text(100, 42, this.T('title'), textStyle(28, P.ink)).setOrigin(0, 0.5);
    this.titleText = title;
    this.scoreText = this.add.text(width - 120, 42, `${t('common.score')}: 0`, textStyle(28, P.ink)).setOrigin(1, 0.5);
    const quit = roundButton(this, width - 54, 42, 'cross', () => this.askQuit(), MOBILE ? 64 : 54);
    quit.add(this.add.text(0, MOBILE ? 36 : 32, t('common.stop'), textStyle(13, P.ink, { backgroundColor: '#fff8e7', padding: { x: 4, y: 1 } })).setOrigin(0.5));
    // hintknop (kost punten); verschijnt zodra het spel loopt en de missie hints kent
    this.hintBtn = roundButton(this, width - 300, 42, 'bulb', () => this.useHint(), MOBILE ? 64 : 54, HEX.gold).setVisible(false);
    this.hintBtn.add(this.add.text(0, 30, `-${HINT_COST}`, textStyle(14, P.ink, { backgroundColor: '#fff8e7', padding: { x: 4, y: 1 } })).setOrigin(0.5));
    this.header.add([bar, l, title, this.scoreText, quit, this.hintBtn]);
    if (this.opts.timeLimit) {
      this.timerIcon = this.add.image(width / 2 - 170, 42, 'icons', 'clock').setDisplaySize(40, 40);
      this.timerBar = meter(this, width / 2 - 140, 42, 300, 30, HEX.green);
      this.header.add([this.timerIcon, this.timerBar]);
    }
  }

  // ── Doel en hints ────────────────────────────────────────────────────
  /** Toont kort wat de speler moet doen en zet het daarna klein in de kop. */
  setGoal(text) {
    if (!text) return;
    const { width, height } = DESIGN;
    this.goalText = text;
    // kop: titel vervangen door het doel
    this.titleText.setText(`🎯 ${text}`).setFontSize(MOBILE ? 24 : 20).setWordWrapWidth(this.opts.timeLimit ? 360 : 720).setLineSpacing(-2);
    // past het niet in de kop? dan kleiner
    for (let f = MOBILE ? 24 : 20; this.titleText.height > 62 && f > 13; f--) this.titleText.setFontSize(f);
    // grote kaart in beeld, verdwijnt vanzelf of bij tikken
    const c = this.add.container(width / 2, height / 2 - 40).setDepth(2500);
    const tx = this.add.text(0, 6, text, textStyle(34, P.ink, { align: 'center', wordWrap: { width: 760 } })).setOrigin(0.5);
    const bg = this.add.nineslice(0, 0, 'ui_card', undefined, Math.max(520, tx.width + 120), tx.height + 90, 18, 18, 18, 18).setTint(0xfff3c4);
    const ic = this.add.text(0, -tx.height / 2 - 18, '🎯 ' + t('common.goal'), textStyle(22, P.inkSoft)).setOrigin(0.5);
    c.add([bg, ic, tx]);
    c.setScale(0.4).setAlpha(0);
    this.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 250, ease: 'Back.Out' });
    const close = () => { if (!c.active) return; this.tweens.add({ targets: c, alpha: 0, y: 40, scale: 0.3, duration: 300, onComplete: () => c.destroy() }); };
    bg.setInteractive().on('pointerdown', close);
    this.time.delayedCall(2600, close);
  }

  /** Overschrijf in een missie: toon de goede zet en geef true terug als dat lukte. */
  giveHint() { return false; }

  useHint() {
    if (!this.running || this.finished || this.quitOpen) return;
    if (this.giveHint()) {
      this.addScore(-HINT_COST, DESIGN.width - 300, 110);
      Audio.sfx('pop');
    } else floatText(this, DESIGN.width - 300, 110, t('common.noHint'), P.cream, 22);
  }

  /** Laat iets opvallen: gouden ring + stuiterende pijl. */
  hintMark(x, y, r = 70) {
    const ring = this.add.circle(x, y, r).setStrokeStyle(8, HEX.gold).setDepth(3500);
    const arrow = this.add.image(x, y - r - 40, 'icons', 'arrow').setRotation(Math.PI / 2).setDisplaySize(60, 60).setTint(HEX.gold).setDepth(3501);
    this.tweens.add({ targets: ring, scale: 1.15, duration: 350, yoyo: true, repeat: 4 });
    this.tweens.add({ targets: arrow, y: arrow.y - 16, duration: 300, yoyo: true, repeat: 5 });
    this.time.delayedCall(3200, () => { ring.destroy(); arrow.destroy(); });
  }

  setScore(v) {
    this.score = Math.max(0, Math.round(v));
    this.scoreText.setText(`${t('common.score')}: ${this.score}`);
  }

  addScore(n, x, y, label) {
    this.setScore(this.score + n);
    this.tweens.add({ targets: this.scoreText, scale: { from: 1.25, to: 1 }, duration: 200 });
    if (x !== undefined) floatText(this, x, y, label ?? (n >= 0 ? `+${n}` : `${n}`), n >= 0 ? P.gold : P.red, 30);
  }

  // ── Flow ───────────────────────────────────────────────────────────────
  flowIntro() {
    if (this.replay || this.debug) return this.showHowTo();
    showDialog(this, { npc: this.npc, lines: this.T('intro'), onDone: () => this.showHowTo() });
  }

  howToItems() { return this.T('howTo'); }

  showHowTo(title = t('common.howTo'), items = this.howToItems(), onStart = () => this.countdown(() => this.beginPlay())) {
    const { width, height } = DESIGN;
    const L = this.add.container(0, 0).setDepth(2000);
    L.add(dim(this, 0.45));
    const h = 170 + items.length * 92;
    L.add(panel(this, width / 2, height / 2 + 20, 860, h));
    L.add(this.add.text(width / 2, height / 2 + 20 - h / 2 + 50, title, textStyle(36, P.ink)).setOrigin(0.5));
    items.forEach((it, i) => {
      const y = height / 2 + 20 - h / 2 + 120 + i * 92;
      const ib = this.add.circle(width / 2 - 360, y, 34, this.brand.color, 0.25).setStrokeStyle(3, HEX.ink, 0.5);
      const ic = this.add.image(width / 2 - 360, y, 'icons', it.icon).setDisplaySize(48, 48);
      const tx = this.add.text(width / 2 - 310, y, it.text, textStyle(23, P.ink, { wordWrap: { width: 680 } })).setOrigin(0, 0.5);
      L.add([ib, ic, tx]);
      [ib, ic, tx].forEach((o) => { o.alpha = 0; this.tweens.add({ targets: o, alpha: 1, x: o.x + 0, delay: 150 + i * 120, duration: 300 }); });
    });
    this.howTo = L;
    const go = () => {
      if (L.done) return; L.done = true;
      this.howTo = null;
      // niet afhankelijk van de tween: die kan door het stopmenu worden onderbroken
      this.tweens.add({ targets: L, alpha: 0, duration: 200 });
      this.time.delayedCall(220, () => { L.destroy(); onStart(); });
    };
    const b = button(this, width / 2, height / 2 + 20 + h / 2 - 50, t('common.start'), go, { width: 260, color: HEX.green, icon: 'check' });
    L.add(b);
    popIn(this, b, 300 + items.length * 120);
    this.input.keyboard.once('keydown-ENTER', go);
    this.input.keyboard.once('keydown-SPACE', go);
    L.setAlpha(0);
    this.tweens.add({ targets: L, alpha: 1, duration: 250 });
    return L;
  }

  countdown(cb) {
    const { width, height } = DESIGN;
    const steps = ['3', '2', '1', t('common.go')];
    steps.forEach((s, i) => {
      this.time.delayedCall(i * 600, () => {
        const tx = this.add.text(width / 2, height / 2, s, titleStyle(i === 3 ? 150 : 170, i === 3 ? P.gold : P.cream)).setOrigin(0.5).setDepth(3000);
        tx.setScale(2).setAlpha(0);
        Audio.sfx(i === 3 ? 'go' : 'countdown');
        this.tweens.add({ targets: tx, scale: 1, alpha: 1, duration: 250, ease: 'Back.Out' });
        this.tweens.add({ targets: tx, scale: 0.6, alpha: 0, delay: 380, duration: 200, onComplete: () => tx.destroy() });
      });
    });
    this.time.delayedCall(steps.length * 600 - 250, cb);
  }

  beginPlay() {
    this.running = true;
    this.timeLeft = this.opts.timeLimit || 0;
    this.startGame();
    this.hintBtn.setVisible(this.giveHint !== MissionBase.prototype.giveHint);
    const goal = t(`missions.${this.missionId}.goal`);
    if (goal && !goal.startsWith('missions.')) this.setGoal(goal);
  }

  /** Implementeer in de missie. */
  startGame() {}

  update(time, delta) {
    if (!this.running || this.quitOpen) return;
    delta = Math.min(delta, 100); // bij haperende frames loopt de klok niet weg
    if (this.opts.timeLimit && !this.timerPaused) {
      const before = Math.ceil(this.timeLeft);
      this.timeLeft -= delta / 1000;
      const v = Math.max(0, this.timeLeft / this.opts.timeLimit);
      this.timerBar.setValue(v, true);
      this.timerBar.setColor(v > 0.5 ? HEX.green : v > 0.2 ? HEX.gold : HEX.red);
      if (this.timeLeft < 10 && Math.ceil(this.timeLeft) !== before) {
        Audio.sfx('tick');
        this.tweens.add({ targets: this.timerIcon, scale: { from: this.timerIcon.scale * 1.3, to: this.timerIcon.scale }, duration: 200 });
      }
      if (this.timeLeft <= 0) {
        this.running = false;
        this.onTimeUp();
        return;
      }
    }
    this.tick(time, delta);
  }

  /** Per-frame logica van de missie (optioneel). */
  tick() {}

  onTimeUp() {
    floatText(this, DESIGN.width / 2, DESIGN.height / 2, t('common.timeUp'), P.cream, 64);
    this.time.delayedCall(900, () => this.finish());
  }

  starsFor(score) {
    return this.thresholds.filter((th) => score >= th).length;
  }

  // ── Afronding ──────────────────────────────────────────────────────────
  finish(extra = {}) {
    if (this.finished) return;
    this.finished = true;
    this.running = false;
    Object.assign(this.extra, extra);
    const stars = this.starsFor(this.score);
    this.time.delayedCall(300, () => this.showResults(stars));
  }

  showResults(stars) {
    const { width, height } = DESIGN;
    const ok = stars >= 1;
    Audio.sfx(ok ? 'fanfare' : 'lose');
    const L = this.add.container(0, 0).setDepth(4000);
    L.add(dim(this, 0.6));
    const pnl = panel(this, width / 2, height / 2 + 10, 640, 470);
    L.add(pnl);
    popIn(this, pnl);
    L.add(this.add.text(width / 2, height / 2 - 170, ok ? t('common.missionComplete') : t('common.missionFailed'), titleStyle(54, ok ? P.gold : P.cream)).setOrigin(0.5));
    for (let i = 0; i < 3; i++) {
      const s = this.add.image(width / 2 + (i - 1) * 120, height / 2 - 60 - (i === 1 ? 16 : 0), 'icons', i < stars ? 'star' : 'starEmpty').setDisplaySize(110, 110);
      L.add(s);
      s.setScale(0);
      this.time.delayedCall(400 + i * 320, () => {
        this.tweens.add({ targets: s, scale: 110 / 64, duration: 380, ease: 'Back.Out' });
        if (i < stars) { Audio.sfx('coin'); burst(this, s.x, s.y, 'stars', 14, { depth: 4100 }); shake(this, 0.003, 100); }
      });
    }
    const sc = this.add.text(width / 2, height / 2 + 50, `${t('common.score')}: 0`, textStyle(38, P.ink)).setOrigin(0.5);
    L.add(sc);
    const counter = { v: 0 };
    this.tweens.add({ targets: counter, v: this.score, duration: 900, delay: 300, ease: 'Cubic.Out', onUpdate: () => sc.setText(`${t('common.score')}: ${Math.round(counter.v)}`) });
    const best = SaveManager.state?.best?.[this.missionId];
    if (best) L.add(this.add.text(width / 2, height / 2 + 95, `${t('common.best')}: ${Math.max(best.score, this.score)}`, textStyle(22, P.inkSoft)).setOrigin(0.5));
    if (!ok) L.add(this.add.text(width / 2, height / 2 + 130, t('common.failHint'), textStyle(20, P.inkSoft, { align: 'center', wordWrap: { width: 540 } })).setOrigin(0.5));

    const by = height / 2 + 190;
    if (ok) {
      const b = button(this, width / 2, by, t('common.continue'), () => { L.destroy(); this.reward(stars); }, { width: 260, color: HEX.green });
      L.add(b); popIn(this, b, 1500);
    } else {
      L.add(button(this, width / 2 - 150, by, t('common.retry'), () => this.scene.restart({ replay: true }), { width: 260, color: HEX.gold }));
      L.add(button(this, width / 2 + 150, by, t('common.back'), () => this.exit(false), { width: 260, color: HEX.cream, size: 20 }));
    }
  }

  reward(stars) {
    const { width, height } = DESIGN;
    const firstTime = !SaveManager.state.fragments[this.missionId];
    SaveManager.completeMission(this.missionId, this.score, stars, this.extra);
    this.firstTime = firstTime;
    const L = this.add.container(0, 0).setDepth(4000);
    L.add(dim(this, 0.7));
    const rays = this.add.image(width / 2, height / 2 - 20, 'rays').setTint(this.brand.color).setScale(1.6).setAlpha(0.9);
    this.tweens.add({ targets: rays, angle: 360, duration: 9000, repeat: -1 });
    const glow = this.add.image(width / 2, height / 2 - 20, 'glow').setScale(3.2).setTint(0xfff3b0);
    const frag = this.add.image(width / 2, height / 2 - 20, 'fragment').setScale(0);
    const lg = logo(this, this.brand, width / 2, height / 2 - 20, 70).setAlpha(0);
    L.add([rays, glow, frag, lg]);
    this.tweens.add({ targets: frag, scale: 2.6, angle: { from: -200, to: 0 }, duration: 800, ease: 'Back.Out' });
    this.tweens.add({ targets: lg, alpha: 1, delay: 700, duration: 300 });
    this.tweens.add({ targets: [frag], y: height / 2 - 30, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.InOut', delay: 800 });
    this.time.delayedCall(400, () => {
      Audio.sfx('unlock');
      confettiRain(this, 2200);
      burst(this, width / 2, height / 2, 'coins', 30, { depth: 4100 });
      shake(this, 0.006, 250);
    });
    const tx = this.add.text(width / 2, height - 170, t('hud.fragmentGot', { bedrijf: this.brand.name }), titleStyle(46, P.gold)).setOrigin(0.5);
    L.add(tx); popIn(this, tx, 600);
    const b = button(this, width / 2, height - 80, t('common.continue'), () => {
      L.destroy();
      if (this.replay) return this.exit(true);
      showDialog(this, { npc: this.npc, lines: this.T('outro'), onDone: () => this.exit(true) });
    }, { width: 260, color: HEX.green });
    L.add(b); popIn(this, b, 1200);
  }

  askQuit() {
    if (this.finished || this.quitOpen || this.exiting) return;
    this.quitOpen = true;
    // echt pauzeren: klok (aftellen, timers) én animaties stilzetten, zodat er niets doorloopt
    this.time.paused = true;
    this.tweens.pauseAll();
    this.hintBtn?.disableInteractive();
    const { width, height } = DESIGN;
    const L = this.add.container(0, 0).setDepth(5000);
    L.add(dim(this, 0.6));
    L.add(panel(this, width / 2, height / 2, 600, 300));
    L.add(this.add.text(width / 2, height / 2 - 60, t('common.quitConfirm'), textStyle(26, P.ink, { align: 'center', wordWrap: { width: 500 } })).setOrigin(0.5));
    const resume = () => {
      L.destroy(); this.quitOpen = false;
      this.time.paused = false; this.tweens.resumeAll();
      this.hintBtn?.setInteractive({ useHandCursor: true });
    };
    L.add(button(this, width / 2 - 140, height / 2 + 70, t('common.quit'), () => { resume(); this.running = false; this.exit(false); }, { width: 240, color: HEX.red, textColor: P.cream }));
    L.add(button(this, width / 2 + 140, height / 2 + 70, t('hud.resume'), resume, { width: 240, color: HEX.green }));
  }

  exit(success) {
    if (this.exiting) return;
    this.exiting = true;
    this.cleanup?.();
    const cam = this.cameras.main;
    cam.fadeOut(400, 15, 61, 92);
    cam.once('camerafadeoutcomplete', () => {
      const world = this.scene.get('World');
      if (world && this.scene.isSleeping('World')) {
        world.returnFromMission({ id: this.missionId, success, firstTime: success && this.firstTime });
        this.scene.stop();
      } else this.scene.start('Menu');
    });
  }
}
