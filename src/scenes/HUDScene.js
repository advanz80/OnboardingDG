import Phaser from 'phaser';
import { t } from '../core/i18n.js';
import { P, HEX, textStyle, textOn } from '../gfx/palette.js';
import { panel, roundButton, button, logo, dim } from '../ui/widgets.js';
import { BRANDS, MISSION_IDS } from '../config/brands.js';
import { SaveManager } from '../core/SaveManager.js';
import { formatTime } from '../core/Leaderboard.js';
import { Audio } from '../core/AudioEngine.js';
import { pulse, burst } from '../core/Juice.js';
import { isTouch, Controls } from '../core/Controls.js';
import { WORLD_W, WORLD_H, ROADS, ROUNDABOUT, PARKINGS, BUILDINGS, NEIGHBOURS, BIGPOND, POND, MOAT, STATIONS, GUARD } from '../world/layout.js';

export class HUDScene extends Phaser.Scene {
  constructor() { super('HUD'); }

  create() {
    const { width } = this.scale;
    // fragmenten
    this.fragPanel = panel(this, 228, 52, 440, 86).setAlpha(0.95);
    this.slots = {};
    MISSION_IDS.forEach((id, i) => {
      const x = 58 + i * 68, y = 50;
      const ring = this.add.circle(x, y, 28, 0x000000, 0.12).setStrokeStyle(3, HEX.ink, 0.4);
      const l = logo(this, BRANDS[id], x, y, 50);
      this.slots[id] = { ring, logo: l, x, y };
    });
    this.refreshFragments(false);

    // tijd
    this.timeBg = panel(this, 548, 52, 150, 64);
    this.add.image(500, 50, 'icons', 'clock').setDisplaySize(34, 34);
    this.timeText = this.add.text(560, 50, '0:00', textStyle(28, P.ink)).setOrigin(0.5);

    // knoppen
    this.muteBtn = roundButton(this, width - 120, 50, Audio.muted ? 'speakerOff' : 'speaker', () => {
      const m = Audio.toggleMute();
      this.muteBtn.icon.setFrame(m ? 'speakerOff' : 'speaker');
    }, 64, HEX.blue);
    roundButton(this, width - 46, 50, 'pause', () => this.pause(), 64, HEX.purple);
    // plattegrond
    this.mapBtn = roundButton(this, width - 194, 50, 'map', () => this.openMap(), 64, HEX.gold);
    this.add.text(width - 194, 92, t('hud.map'), textStyle(16, P.cream, { stroke: P.ink, strokeThickness: 4 })).setOrigin(0.5);

    // prompt
    this.prompt = this.add.container(width / 2, 640).setVisible(false);
    const pbg = this.add.nineslice(0, 0, 'ui_btn', undefined, 300, 60, 20, 20, 20, 24).setTint(HEX.gold);
    this.promptText = this.add.text(0, -4, '', textStyle(24, P.ink)).setOrigin(0.5);
    this.prompt.add([pbg, this.promptText]);
    this.prompt.bg = pbg;
    // het label is ook een knop
    this.prompt.setSize(300, 60).setInteractive({ useHandCursor: true });
    this.prompt.on('pointerdown', () => { this.controls?.trigger(); this.prompt.setScale(0.92); });
    this.prompt.on('pointerup', () => this.prompt.setScale(1));
    this.touch = isTouch(this);

    // pijlen
    this.arrows = [];
    // toasts
    this.toastY = 140;

    // zoektocht-paneel
    this.hunt = this.add.container(width - 230, 125).setVisible(false);
    this.hunt.add(panel(this, 0, 0, 380, 72));
    this.huntBadge = this.add.image(-150, 0, 'badge').setScale(0.6).setTint(BRANDS.bhc.color);
    this.huntText = this.add.text(-110, 0, '', textStyle(28, P.ink)).setOrigin(0, 0.5);
    this.huntTime = this.add.text(150, 0, '', textStyle(28, P.red)).setOrigin(1, 0.5);
    this.hunt.add([this.huntBadge, this.huntText, this.huntTime]);

    this.controls = new Controls(this, { actionLabel: '!' });
    this.controls.setActionVisible(false);

    this.input.keyboard.on('keydown-ESC', () => (this.paused ? this.closePause?.() : this.pause()));
    this.input.keyboard.on('keydown-M', () => (this.mapOpen ? this.closeMap?.() : this.openMap()));
    this.input.keyboard.on('keydown-P', () => (this.paused ? this.closePause?.() : this.pause()));
  }

  refreshFragments(animate = true, justGot = null) {
    const fr = SaveManager.state?.fragments || {};
    for (const id of MISSION_IDS) {
      const s = this.slots[id];
      const has = !!fr[id];
      s.logo.setAlpha(has ? 1 : 0.28);
      s.ring.setFillStyle(has ? BRANDS[id].color : 0x000000, has ? 0.35 : 0.12);
      if (animate && id === justGot) {
        pulse(this, s.logo, 1.6, 200);
        burst(this, s.x, s.y, 'stars', 18, { depth: 100 });
      }
    }
  }

  setPrompt(text) {
    if (!text) { this.prompt.setVisible(false); return; }
    const label = this.touch ? text : `${t('hud.talkHintKeys')}: ${text}`;
    if (!this.prompt.visible || this.promptText.text !== label) {
      // op telefoon groter: makkelijker te raken met je duim
      const big = this.touch;
      this.promptText.setText(label).setFontSize(big ? 36 : 24);
      this.prompt.bg.setSize(this.promptText.width + (big ? 100 : 60), big ? 88 : 60);
      const hw = this.prompt.bg.width + (big ? 60 : 20), hh = big ? 130 : 70;
      this.prompt.setSize(hw, hh);
      this.prompt.input.hitArea.setSize(hw, hh);
      this.prompt.setVisible(true).setScale(0.6);
      this.tweens.add({ targets: this.prompt, scale: 1, duration: 200, ease: 'Back.Out' });
    }
    if (this.touch) this.prompt.y = 560;
  }

  toast(text, color = HEX.gold, icon = null, duration = 2200) {
    const { width } = this.scale;
    const c = this.add.container(width / 2, this.toastY).setDepth(50);
    const tx = this.add.text(icon ? 22 : 0, -2, text, textStyle(26, textOn(color))).setOrigin(0.5);
    const w = tx.width + (icon ? 100 : 60);
    const bg = this.add.nineslice(0, 0, 'ui_btn', undefined, w, 62, 20, 20, 20, 24).setTint(color);
    c.add([bg, tx]);
    if (icon) c.add(this.add.image(-w / 2 + 38, -3, 'icons', icon).setDisplaySize(40, 40));
    c.setScale(0.3).setAlpha(0);
    this.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 260, ease: 'Back.Out' });
    this.tweens.add({ targets: c, y: c.y - 30, alpha: 0, delay: duration, duration: 400, onComplete: () => c.destroy() });
  }

  showHunt(visible) { this.hunt.setVisible(visible); }
  updateHunt(n, total, secs) {
    this.huntText.setText(`${n} / ${total}`);
    this.huntTime.setText(formatTime(secs * 1000));
    this.huntTime.setColor(secs < 20 ? P.red : P.ink);
  }

  /** targets: [{x, y, color, frame}] in wereldcoördinaten */
  updateArrows(targets, cam) {
    const { width, height } = this.scale;
    while (this.arrows.length < targets.length) {
      const c = this.add.container(0, 0);
      const a = this.add.image(0, 0, 'icons', 'arrow').setDisplaySize(54, 54);
      const dot = this.add.circle(0, 0, 20, 0xffffff).setStrokeStyle(4, HEX.ink);
      const tx = this.add.text(0, 0, '', textStyle(18, P.cream, { stroke: P.ink, strokeThickness: 4 })).setOrigin(0.5);
      c.add([a, dot, tx]); c.arrow = a; c.dot = dot; c.label = tx;
      this.arrows.push(c);
    }
    this.arrows.forEach((c, i) => {
      const tg = targets[i];
      if (!tg) { c.setVisible(false); return; }
      const sx = (tg.x - cam.worldView.x) * cam.zoom, sy = (tg.y - cam.worldView.y) * cam.zoom;
      const m = 70;
      const on = sx > m && sx < width - m && sy > m && sy < height - m;
      if (on) { c.setVisible(false); return; }
      c.setVisible(true);
      const cx = width / 2, cy = height / 2;
      const ang = Math.atan2(sy - cy, sx - cx);
      // projecteer op schermrand
      const hw = width / 2 - m, hh = height / 2 - 100;
      const k = Math.min(hw / Math.abs(Math.cos(ang) || 1e-6), hh / Math.abs(Math.sin(ang) || 1e-6));
      c.setPosition(cx + Math.cos(ang) * k, cy + 40 + Math.sin(ang) * k);
      c.arrow.setRotation(ang).setTint(tg.color);
      c.arrow.setPosition(Math.cos(ang) * 30, Math.sin(ang) * 30);
      c.dot.setFillStyle(tg.color);
      c.label.setText(tg.label || '');
      c.setScale((tg.big ? 1.45 : 1) * (1 + Math.sin(this.time.now / 200) * 0.06));
    });
  }

  update() {
    if (SaveManager.state) this.timeText.setText(formatTime(SaveManager.state.elapsedMs));
  }

  /** Oefenronde-balk bovenin. text=null verbergt hem. */
  tutorial(text, step, total, onSkip) {
    if (!text) { this.tutBar?.destroy(); this.tutBar = null; return; }
    const { width } = this.scale;
    if (!this.tutBar) {
      const c = this.add.container(width / 2, 170).setDepth(60);
      const bg = this.add.nineslice(0, 0, 'ui_btn', undefined, 760, 84, 20, 20, 20, 24).setTint(0xfff3c4);
      const tag = this.add.text(-360, -4, '', textStyle(18, P.cream, { backgroundColor: '#4cb35a', padding: { x: 8, y: 4 } })).setOrigin(0, 0.5);
      const tx = this.add.text(-250, -4, '', textStyle(24, P.ink, { wordWrap: { width: 470 } })).setOrigin(0, 0.5);
      const skip = button(this, 300, -2, t('tutorial.skip'), () => onSkip?.(), { width: 140, height: 52, size: 18, color: HEX.cream });
      c.add([bg, tag, tx, skip]); c.tag = tag; c.tx = tx;
      this.tutBar = c;
      c.setAlpha(0); this.tweens.add({ targets: c, alpha: 1, duration: 250 });
    }
    this.tutBar.tag.setText(`${t('tutorial.label')} ${step}/${total}`);
    this.tutBar.tx.setText(text);
  }

  /** Gouden pijl die naar een HUD-knop wijst (null = weg). */
  pointAt(obj) {
    this.pointer?.destroy(); this.pointer = null;
    if (!obj) return;
    const a = this.add.image(obj.x - 70, obj.y + 70, 'icons', 'arrow').setDisplaySize(64, 64).setRotation(-Math.PI / 4).setTint(HEX.gold).setDepth(70);
    this.tweens.add({ targets: a, x: a.x + 12, y: a.y - 12, duration: 350, yoyo: true, repeat: -1 });
    this.pointer = a;
  }

  /** Plattegrond van de campus: gebouwen, waar je bent en welke opdrachten nog open staan. */
  openMap() {
    const world = this.scene.get('World');
    if (this.paused || this.mapOpen || world.dialogOpen || world.busy || world.hunt) return;
    this.mapOpen = true;
    this.events.emit('map-opened');
    SaveManager.clockRunning = false;
    this.scene.pause('World');
    const { width, height } = this.scale;
    const L = this.add.container(0, 0).setDepth(250);
    L.add(dim(this, 0.65));
    const mw = Math.min(width - 60, 1180), mh = height - 140;
    const s = Math.min((mw - 40) / WORLD_W, (mh - 100) / WORLD_H);
    const ox = width / 2 - (WORLD_W * s) / 2, oy = 150 + (mh - 90 - WORLD_H * s) / 2;
    L.add(panel(this, width / 2, height / 2 + 30, mw, mh));
    L.add(this.add.text(width / 2, 128, t('hud.mapTitle'), textStyle(28, P.ink)).setOrigin(0.5));
    const X = (x) => ox + x * s, Y = (y) => oy + y * s;
    const g = this.add.graphics();
    g.fillStyle(0x7cc95a).fillRoundedRect(X(0), Y(0), WORLD_W * s, WORLD_H * s, 10);
    g.lineStyle(Math.max(4, 84 * s), 0x868a93);
    for (const r of ROADS) { g.beginPath(); g.moveTo(X(r.pts[0][0]), Y(r.pts[0][1])); for (const [x, y] of r.pts.slice(1)) g.lineTo(X(x), Y(y)); g.strokePath(); }
    g.fillStyle(0x868a93).fillCircle(X(ROUNDABOUT.x), Y(ROUNDABOUT.y), ROUNDABOUT.r * s);
    g.fillStyle(0x9ea2aa); for (const p of PARKINGS) g.fillRect(X(p.x), Y(p.y), p.w * s, p.h * s);
    g.fillStyle(0x2ea6d9).fillRect(X(BIGPOND.x), Y(BIGPOND.y), BIGPOND.w * s, BIGPOND.h * s).fillEllipse(X(POND.x), Y(POND.y), POND.rx * 2 * s, POND.ry * 2 * s);
    g.fillStyle(0xe9e4d8).fillRect(X(MOAT.outer.x), Y(MOAT.outer.y), MOAT.outer.w * s, MOAT.outer.h * s);
    g.fillStyle(0xc9c2b8); for (const b of NEIGHBOURS) for (const p of b.parts) g.fillRect(X(p.x), Y(p.y), p.w * s, p.h * s);
    L.add(g);
    for (const b of BUILDINGS) {
      const col = b.brand ? BRANDS[Array.isArray(b.brand) ? b.brand[0] : b.brand].color : 0x9a9aa6;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const p of b.parts) {
        L.add(this.add.rectangle(X(p.x), Y(p.y), p.w * s, p.h * s, 0xf1ece2).setOrigin(0).setStrokeStyle(3, col));
        minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x + p.w); maxY = Math.max(maxY, p.y + p.h);
      }
      L.add(this.add.text(X((minX + maxX) / 2), Y((minY + maxY) / 2), b.name, textStyle(16, P.ink, { stroke: '#ffffff', strokeThickness: 4 })).setOrigin(0.5));
    }
    L.add(this.add.text(X(MOAT.outer.x + MOAT.outer.w / 2), Y(MOAT.outer.y + MOAT.outer.h / 2), t('hud.mapTower'), textStyle(15, P.ink, { stroke: '#ffffff', strokeThickness: 4, align: 'center' })).setOrigin(0.5));
    // opdrachten: logo + vinkje of uitroepteken; tikken = route erheen
    const fr = SaveManager.state.fragments;
    const targets = MISSION_IDS.map((id) => ({ id, x: STATIONS[id].npc.x, y: STATIONS[id].npc.y }));
    if (SaveManager.allFragments()) targets.push({ id: 'finale', x: GUARD.x, y: GUARD.y });
    for (const tg of targets) {
      const done = tg.id !== 'finale' && fr[tg.id];
      const c = this.add.container(X(tg.x), Y(tg.y));
      if (tg.id === 'finale') c.add(this.add.circle(0, 0, 26, HEX.gold).setStrokeStyle(4, HEX.ink));
      else c.add(logo(this, BRANDS[tg.id], 0, 0, 52));
      c.add(this.add.image(20, -20, 'icons', done ? 'check' : 'exclaim').setDisplaySize(28, 28));
      if (tg.id === 'finale') c.add(this.add.text(0, 0, '!', textStyle(26, P.ink)).setOrigin(0.5));
      if (!done) this.tweens.add({ targets: c, scale: 1.12, duration: 500, yoyo: true, repeat: -1 });
      c.setSize(64, 64).setInteractive({ useHandCursor: true }).on('pointerup', () => { world.mapTarget = tg.id === 'finale' ? 'finale' : tg.id; this.closeMap(); this.toast(t('hud.mapRoute'), HEX.gold, 'map', 2000); });
      L.add(c);
    }
    // jij bent hier
    const p = world.player;
    const me = this.add.container(X(p.x), Y(p.y));
    me.add([this.add.circle(0, 0, 14, 0xe8504c).setStrokeStyle(4, 0xffffff), this.add.text(0, -30, t('hud.mapYou'), textStyle(16, P.cream, { stroke: P.ink, strokeThickness: 4 })).setOrigin(0.5)]);
    this.tweens.add({ targets: me.list[0], scale: 1.4, duration: 450, yoyo: true, repeat: -1 });
    L.add(me);
    L.add(button(this, width / 2, height - 52, t('hud.mapClose'), () => this.closeMap(), { width: 260, color: HEX.green, icon: 'check' }));
    L.add(this.add.text(X(WORLD_W) - 6, Y(WORLD_H) - 8, t('hud.mapHint'), textStyle(15, P.inkSoft, { backgroundColor: '#fff8e7', padding: { x: 6, y: 2 } })).setOrigin(1, 1));
    this.closeMap = () => {
      if (!this.mapOpen) return;
      this.mapOpen = false; L.destroy(); SaveManager.clockRunning = true; this.scene.resume('World');
      this.events.emit('map-closed');
    };
  }

  pause() {
    if (this.paused) return;
    const world = this.scene.get('World');
    if (world.dialogOpen || this.mapOpen) return;
    this.paused = true;
    SaveManager.clockRunning = false;
    this.scene.pause('World');
    const { width, height } = this.scale;
    const layer = this.add.container(0, 0).setDepth(200);
    layer.add(dim(this, 0.6));
    layer.add(panel(this, width / 2, height / 2, 520, 360));
    layer.add(this.add.text(width / 2, height / 2 - 110, t('hud.paused'), textStyle(44, P.ink)).setOrigin(0.5));
    const close = this.closePause = () => {
      if (!this.paused) return;
      layer.destroy(); this.paused = false; SaveManager.clockRunning = true; this.scene.resume('World');
    };
    layer.add(button(this, width / 2, height / 2 - 10, t('hud.resume'), close, { width: 360, color: HEX.green }));
    layer.add(button(this, width / 2, height / 2 + 90, t('hud.toMenu'), () => {
      SaveManager.save();
      this.paused = false;
      // eventueel slapende missie (bv. BHC-zoektocht) opruimen
      for (const sc of this.scene.manager.getScenes(false)) {
        if (sc.sys.settings.key.endsWith('Mission') && (sc.sys.isActive() || sc.sys.isSleeping())) this.scene.stop(sc.sys.settings.key);
      }
      this.scene.stop('World');
      this.scene.stop();
      this.scene.start('Menu');
    }, { width: 360, color: HEX.cream, icon: 'home' }));
  }
}
