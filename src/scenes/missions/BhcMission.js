// Missie BHC: verzamel 9 skill-badges in het park (fase 1, in de WorldScene)
// en bouw daarna de brug: elke pijler één badge per sector (fase 2).
import Phaser from 'phaser';
import { DESIGN } from '../../core/layout.js';
import { MissionBase } from './MissionBase.js';
import { t } from '../../core/i18n.js';
import { P, HEX, textStyle, titleStyle } from '../../gfx/palette.js';
import { Audio } from '../../core/AudioEngine.js';
import { burst, shake, floatText, wobble, confettiRain } from '../../core/Juice.js';
import { panel } from '../../ui/widgets.js';
import { makeBhcBg } from '../../gfx/tex/acbg.js';
import { SECTOR_COLORS, SECTOR_ICONS } from '../WorldScene.js';

const SECTORS = ['business', 'education', 'government'];

export class BhcMission extends MissionBase {
  constructor() { super('BhcMission', 'bhc', { thresholds: [250, 600, 850] }); }

  drawBackground() {
    const { width, height } = DESIGN;
    makeBhcBg(this);
    this.add.image(0, 0, 'bhc_sky').setOrigin(0).setDepth(-100);
    this.sea = this.add.tileSprite(0, 300, width, height - 300, 'water').setOrigin(0).setDepth(-99);
    this.seaWaves = this.add.tileSprite(0, 300, width, height - 300, 'waves').setOrigin(0).setDepth(-98).setAlpha(0.6);
    this.add.rectangle(0, 300, width, 6, HEX.foam).setOrigin(0, 0.5).setDepth(-97);
    // de Toren van Paperassen op zijn eilandje in de Loop
    this.add.ellipse(1140, 352, 190, 40, HEX.grass).setStrokeStyle(4, 0x4e9a3a).setDepth(-96);
    this.add.image(1140, 360, 'papertower').setScale(0.36).setOrigin(0.5, 1).setDepth(-96);
    // grasoever linksonder
    this.add.image(0, 370, 'bhc_beach').setOrigin(0).setDepth(-95);
    this.add.image(70, 440, 'tree_round').setOrigin(0.5, 1).setDepth(-94);
  }

  update(time, dt) {
    super.update(time, dt);
    if (this.sea) { this.sea.tilePositionX += dt * 0.01; this.seaWaves.tilePositionX += dt * 0.03; }
  }

  startGame() {
    // Fase 1 speelt in het park
    const world = this.scene.get('World');
    if (!world || !this.scene.isSleeping('World')) {
      // debugmodus zonder park: simuleer de zoektocht
      return this.onHuntDone({ timeLeft: 60, stolen: 1, timeout: false });
    }
    this.events.once('wake', () => {
      this.cameras.main.fadeIn(400, 15, 61, 92);
      Audio.music('bhc');
      this.onHuntDone(this.huntResult);
    });
    this.cameras.main.fadeOut(300, 15, 61, 92);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.wake('HUD');
      this.scene.wake('World');
      world.startBadgeHunt((res) => { this.huntResult = res; this.scene.wake(); });
      this.scene.sleep();
    });
  }

  onHuntDone(res) {
    const { width } = DESIGN;
    this.running = false;
    this.cameras.main.fadeIn(300, 15, 61, 92);
    // score van de zoektocht
    const found = 9;
    this.time.delayedCall(400, () => this.addScore(found * 30, width / 2, 200, `9 badges +${found * 30}`));
    const tb = Math.round(res.timeLeft * 3);
    if (tb > 0) this.time.delayedCall(1000, () => this.addScore(tb, width / 2, 250, `${t('common.time')} +${tb}`));
    if (res.stolen) this.time.delayedCall(1600, () => this.addScore(-res.stolen * 20, width / 2, 300));
    this.time.delayedCall(2100, () => this.showHowTo(this.T('buildTitle'), [
      { icon: 'briefcase', text: `${this.T('sectors.business')} · ${this.T('sectors.education')} · ${this.T('sectors.government')}` },
      { icon: 'townhall', text: this.T('buildHowTo') },
    ], () => this.startBuild()));
  }

  startBuild() {
    const { width } = DESIGN;
    this.running = true;
    this.errors = 0;
    this.pillars = [];
    const xs = [420, 660, 900];
    xs.forEach((x, i) => {
      const p = { x, slots: [], sectors: new Set(), done: false };
      const img = this.add.image(x, 640, 'pillar').setOrigin(0.5, 1).setScale(1.6, 2.6).setDepth(5);
      const zone = this.add.zone(x, 480, 130, 330).setRectangleDropZone(130, 330);
      zone.pillar = p;
      for (let s = 0; s < 3; s++) {
        const sy = 560 - s * 92;
        const slot = this.add.circle(x, sy, 36, 0xffffff, 0.35).setStrokeStyle(4, HEX.ink, 0.6).setDepth(6);
        p.slots.push({ x, y: sy, slot, badge: null });
      }
      p.img = img; p.zone = zone; p.index = i;
      this.pillars.push(p);
      img.setScale(1.6, 0);
      this.tweens.add({ targets: img, scaleY: 2.6, duration: 500, delay: i * 120, ease: 'Back.Out' });
    });
    // brugdek-segmenten (verborgen)
    this.deck = [];
    for (let i = 0; i < 4; i++) {
      const pl = this.add.image(300 + i * 240, 330, 'plank').setScale(2.1, 1.4).setDepth(7).setAlpha(0);
      this.deck.push(pl);
    }

    // dienblad met badges: bovenin, zodat je op iPhone niet vanaf de onderrand sleept
    // (dat is het veeg-gebaar om van app te wisselen)
    const TRAY_Y = 150;
    const tray = panel(this, width / 2, TRAY_Y, 980, 100).setDepth(8);
    void tray;
    const list = Phaser.Utils.Array.Shuffle(SECTORS.flatMap((s) => [s, s, s]));
    const names = { business: this.T('badges.business').slice(), education: this.T('badges.education').slice(), government: this.T('badges.government').slice() };
    this.badges = list.map((sec, i) => {
      const x = width / 2 - 440 + i * 110, y = TRAY_Y - 6;
      const c = this.add.container(x, y).setDepth(20);
      const glow = this.add.image(0, 0, 'glow').setTint(SECTOR_COLORS[sec]).setScale(0.7).setAlpha(0.6);
      const b = this.add.image(0, 0, 'badge').setTint(SECTOR_COLORS[sec]).setScale(0.8);
      const ic = this.add.image(0, -6, 'icons', SECTOR_ICONS[sec]).setDisplaySize(32, 32);
      const nm = this.add.text(0, 34, names[sec].pop(), textStyle(13, P.ink, { stroke: '#fff', strokeThickness: 3 })).setOrigin(0.5);
      c.add([glow, b, ic, nm]);
      c.setSize(80, 80).setInteractive({ draggable: true, useHandCursor: true });
      c.sector = sec; c.home = { x, y }; c.placed = false;
      c.setScale(0);
      this.tweens.add({ targets: c, scale: 1, delay: 300 + i * 60, duration: 300, ease: 'Back.Out' });
      return c;
    });

    this.input.dragDistanceThreshold = 8;
    this.input.on('dragstart', (_p, obj) => { if (obj.placed) return; obj.setDepth(50); this.tweens.add({ targets: obj, scale: 1.2, duration: 120 }); Audio.sfx('select'); });
    this.input.on('drag', (_p, obj, x, y) => { if (!obj.placed) obj.setPosition(x, y); });
    this.input.on('drop', (_p, obj, zone) => { if (!obj.placed) this.tryPlace(obj, zone.pillar); });
    this.input.on('dragend', (_p, obj, dropped) => { if (!dropped && !obj.placed) this.sendHome(obj); });

    // tik-modus (handig op touch): tik badge, tik pijler
    this.selected = null;
    this.badges.forEach((b) => b.on('pointerup', (p) => {
      if (b.placed || p.getDistance() > 10) return;
      this.selectBadge(b);
    }));
    this.pillars.forEach((p) => p.zone.setInteractive().on('pointerup', () => { if (this.selected) this.tryPlace(this.selected, p); }));
  }

  selectBadge(b) {
    if (this.selected) this.selected.setScale(1);
    if (this.selected === b) { this.selected = null; this.markPillars(false); return; }
    this.selected = b;
    b.setScale(1.2);
    this.markPillars(true);
    Audio.sfx('select');
  }

  /** Lege vakjes op de pijlers laten oplichten zolang er een badge gekozen is (tik-modus). */
  markPillars(on) {
    this.pillars.forEach((p) => p.slots.forEach((s) => {
      this.tweens.killTweensOf(s.slot);
      s.slot.setAlpha(1).setScale(1);
      if (on && !s.badge && !p.done) this.tweens.add({ targets: s.slot, alpha: 0.4, scale: 1.12, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }));
  }

  sendHome(obj) {
    this.tweens.add({ targets: obj, x: obj.home.x, y: obj.home.y, scale: 1, duration: 300, ease: 'Back.Out', onComplete: () => obj.setDepth(20) });
  }

  tryPlace(obj, p) {
    if (this.selected) this.selected.setScale(1);
    this.selected = null;
    this.markPillars(false);
    if (p.done || p.sectors.has(obj.sector)) {
      this.errors++;
      Audio.sfx('error');
      shake(this, 0.006, 150);
      wobble(this, p.img);
      floatText(this, p.x, 250, this.T('buildWrong'), P.red, 22);
      this.addScore(-25);
      this.sendHome(obj);
      return;
    }
    const slot = p.slots.find((s) => !s.badge);
    slot.badge = obj;
    p.sectors.add(obj.sector);
    obj.placed = true;
    obj.disableInteractive();
    Audio.sfx('build');
    this.tweens.add({ targets: obj, x: slot.x, y: slot.y, scale: 0.9, duration: 250, ease: 'Back.Out', onComplete: () => burst(this, slot.x, slot.y, 'stars', 10) });
    this.addScore(20, slot.x, slot.y - 40);
    if (p.sectors.size === 3) this.pillarDone(p);
  }

  pillarDone(p) {
    p.done = true;
    Audio.sfx('good');
    this.tweens.add({ targets: p.img, scaleX: 1.75, duration: 150, yoyo: true });
    const deckIdx = [p.index, p.index + 1];
    deckIdx.forEach((i) => {
      const d = this.deck[i];
      if (d.alpha > 0) return;
      d.y = 280;
      this.tweens.add({ targets: d, alpha: 1, y: 330, duration: 400, ease: 'Bounce.Out' });
    });
    if (this.pillars.every((x) => x.done)) this.bridgeDone();
  }

  bridgeDone() {
    this.running = false;
    const { width } = DESIGN;
    const bonus = Math.max(0, 200 - this.errors * 40);
    this.time.delayedCall(600, () => {
      Audio.sfx('great');
      confettiRain(this, 1800);
      shake(this, 0.005, 300);
      this.add.text(width / 2, 200, this.T('buildDone'), titleStyle(46, P.gold)).setOrigin(0.5).setDepth(30);
      if (bonus) this.addScore(bonus, width / 2, 260, `Foutloos +${bonus}`);
      // badges dansen
      this.badges.forEach((b, i) => this.tweens.add({ targets: b, y: b.y - 14, duration: 250, delay: i * 50, yoyo: true, repeat: 2 }));
      burst(this, width / 2, 330, 'stars', 40);
    });
    this.time.delayedCall(2600, () => this.finish());
  }
}
