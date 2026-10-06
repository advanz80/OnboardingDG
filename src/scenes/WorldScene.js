import Phaser from 'phaser';
import { t, setTextVars } from '../core/i18n.js';
import { P, HEX, textStyle, titleStyle } from '../gfx/palette.js';
import { BRANDS, MISSION_IDS } from '../config/brands.js';
import { NPC_LOOKS } from '../config/npcs.js';
import { SaveManager } from '../core/SaveManager.js';
import { Audio } from '../core/AudioEngine.js';
import { isTouch } from '../core/Controls.js';

const NO_CONTROLS = { vector: () => ({ x: 0, y: 0 }), action: () => false, setVisible() {}, setActionVisible() {} };
import { burst, shake, floatText, confettiRain } from '../core/Juice.js';
import { logo, bake } from '../ui/widgets.js';
import { showDialog } from './DialogScene.js';
import { makeCharacter, ensureAnims, randomLook, pirateLook, faceMove } from '../gfx/CharacterFactory.js';
import { rng } from '../gfx/draw.js';
import { buildTerrainChunks, inPoly, inRect, onInfrastructure } from '../world/terrain.js';
import { makeCampusBuildings } from '../gfx/tex/campus.js';
import {
  WORLD_W, WORLD_H, LAND, PLAZA, POND, BRIDGE, SHIP, SPAWN, GATE, STATIONS, PETRA, GUARD,
  BRIDGE_SIGN, FINALE_RETURN, BUILDINGS, NEIGHBOURS, TREES, BADGE_SPOTS, pt,
} from '../world/layout.js';

const SPEED = 270;
const CS = 1.15; // personages iets groter in het park (meer detail zichtbaar)
export const SECTOR_COLORS = { business: HEX.orange, education: HEX.blue, government: HEX.purple };
export const SECTOR_ICONS = { business: 'briefcase', education: 'gradcap', government: 'townhall' };

export class WorldScene extends Phaser.Scene {
  constructor() { super('World'); }

  /** Besturing leeft in de HUD-scène, zodat camera-zoom de touch-knoppen niet raakt. */
  get controls() { return this.hud?.controls || NO_CONTROLS; }

  create() {
    const s = SaveManager.state;
    setTextVars({ naam: s.player.name });
    SaveManager.clockRunning = true;
    Audio.music('world');
    this.colliders = [];
    this.interactables = [];
    this.dyn = [];          // objecten die op y gesorteerd worden
    this.wanderers = [];
    this.dialogOpen = false;
    this.busy = false;
    this.hunt = null;
    this.currentZone = null;

    const cam = this.cameras.main;
    cam.setBounds(0, 0, WORLD_W, WORLD_H);
    cam.setBackgroundColor(P.water);

    // water (schermvullend, scrolt mee)
    const { width, height } = this.scale;
    this.water = this.add.tileSprite(0, 0, width, height, 'water').setOrigin(0).setScrollFactor(0).setDepth(-2000);
    this.waves = this.add.tileSprite(0, 0, width, height, 'waves').setOrigin(0).setScrollFactor(0).setDepth(-1999).setAlpha(0.6);

    buildTerrainChunks(this);
    makeCampusBuildings(this, BUILDINGS);
    makeCampusBuildings(this, NEIGHBOURS, true);
    this.buildDecor();
    this.buildStations();
    this.buildShipArea();
    this.buildNPCs();

    // speler
    const pos = s.pos || SPAWN;
    this.player = this.add.sprite(pos.x, pos.y, 'player', 'idle').setOrigin(0.5, 0.92).setScale(CS);
    this.playerAnim = ensureAnims(this, 'player');
    this.dyn.push(this.player);
    cam.startFollow(this.player, true, 0.12, 0.12);
    // Op kleine schermen (telefoon) iets inzoomen voor leesbaarheid
    this.baseZoom = this.scale.displayScale.x > 1.4 ? 1.25 : 1;
    cam.setZoom(this.baseZoom);
    cam.fadeIn(500, 15, 61, 92);


    this.scene.launch('HUD');
    this.hud = this.scene.get('HUD');

    this.events.on('wake', () => this.onWake());
    this.events.on('shutdown', () => { this.scene.stop('HUD'); });

    this.time.addEvent({ delay: 2600, loop: true, callback: () => this.ambientFx() });
    this.stepAcc = 0;

    if (!s.seenIntro) {
      this.time.delayedCall(700, () => {
        showDialog(this, {
          lines: t('story.intro'),
          onDone: () => {
            s.seenIntro = true; SaveManager.save();
            this.hud.toast(t(isTouch(this) ? 'hud.moveHintTouch' : 'hud.moveHintKeys'), HEX.cream, 'shoe', 4000);
            this.time.delayedCall(4600, () => this.hud.toast(t('missions.bhc.zone') + ' → ' + BRANDS.bhc.name, BRANDS.bhc.color, 'map'));
          },
        });
      });
    }
  }

  // ── Decor ───────────────────────────────────────────────────────────────
  addProp(key, x, y, col, opts = {}) {
    const img = this.add.image(x, y, key).setOrigin(0.5, opts.oy ?? 1);
    if (opts.scale) img.setScale(opts.scale);
    if (opts.flip) img.setFlipX(true);
    img.setDepth(opts.depth ?? y);
    if (col) this.colliders.push({ x, y: y - (col.oy || 0), ...col });
    return img;
  }

  addPalm(x, y, scale = 1) {
    const trunk = this.addProp('palm_trunk', x, y, { r: 14 * scale }, { scale });
    const crown = this.add.image(x - 2 * scale, y - 118 * scale, 'palm_crown').setScale(scale).setDepth(y + 1);
    this.tweens.add({ targets: crown, angle: { from: -4, to: 4 }, duration: 2000 + Math.random() * 1200, yoyo: true, repeat: -1, ease: 'Sine.InOut', delay: Math.random() * 1000 });
    return trunk;
  }

  isOpenGround(x, y, margin = 60) {
    if (!inPoly(x, y, LAND)) return false;
    if (y > WORLD_H - 30 || x < 30 || x > WORLD_W - 30) return false;
    if (onInfrastructure(x, y, margin)) return false;
    for (const st of Object.values(STATIONS)) if (Math.hypot(x - st.x, y - st.y) < 200) return false;
    for (const [bx, by] of BADGE_SPOTS) if (Math.hypot(x - bx, y - by) < 70) return false;
    for (const c of this.colliders) if (Math.hypot(x - c.x, y - c.y) < 90) return false;
    if (Math.hypot(x - SPAWN.x, y - SPAWN.y) < 150 || Math.hypot(x - PETRA.x, y - PETRA.y) < 120) return false;
    return true;
  }

  buildDecor() {
    // gebouwen: elk deel is een eigen blok, gesorteerd op de onderkant
    for (const b of [...BUILDINGS, ...NEIGHBOURS]) {
      b.parts.forEach((p, i) => {
        this.add.image(p.x, p.y, `bld_${b.id}_${i}`).setOrigin(0).setDepth(p.y + p.h);
        this.colliders.push({ x: p.x + p.w / 2, y: p.y + p.h / 2, w: p.w, h: p.h, rect: true });
      });
    }
    // vijver
    for (let k = -2; k <= 2; k++) this.colliders.push({ x: POND.x, y: POND.y + k * POND.ry * 0.38, r: POND.rx * (1 - Math.abs(k) * 0.15) });

    // bomen van de plattegrond
    const trees = ['tree_round', 'tree_round2'];
    TREES.forEach(([x, y], i) => this.addProp(trees[i % 2], x, y, { r: 20 }, { scale: 0.8 + ((i * 37) % 10) / 30 }));

    // terras: parasols en bankjes
    [[0.25, 0.4, 0], [0.7, 0.35, 1], [0.5, 0.8, 3]].forEach(([fx, fy, v]) => this.addProp(`umbrella${v}`, PLAZA.x + PLAZA.w * fx, PLAZA.y + PLAZA.h * fy, { r: 10 }));
    for (const [x, y] of [pt(1010, 600), pt(1088, 640), pt(600, 640)]) this.addProp('bench', x, y, { w: 96, h: 22, rect: true, oy: 10 });

    // lantaarns langs de wegen
    for (const [x, y] of [pt(600, 640), pt(720, 641), pt(840, 642), pt(978, 500), pt(978, 600), pt(1050, 676), pt(586, 470), pt(586, 560)]) {
      this.addProp('lamp', x, y, { r: 8 });
    }

    // entreebord
    const gate = this.add.container(GATE.x, GATE.y).setDepth(GATE.y);
    const gbg = this.add.nineslice(0, -150, 'ui_btn', undefined, 420, 80, 20, 20, 20, 24).setTint(0x3D2152);
    gate.add(this.add.rectangle(-190, -60, 16, 150, HEX.stoneDark).setStrokeStyle(4, HEX.ink));
    gate.add(this.add.rectangle(190, -60, 16, 150, HEX.stoneDark).setStrokeStyle(4, HEX.ink));
    gate.add(gbg);
    gate.add(this.add.text(0, -154, 'HUMAN CAMPUS', titleStyle(40, P.cream, { strokeThickness: 6 })).setOrigin(0.5));

    // willekeurig groen: bomen, struiken, stenen
    const r = rng(1234);
    let placed = 0, tries = 0;
    const bushes = ['bush', 'bush_white', 'bush_red'];
    while (placed < 70 && tries++ < 5000) {
      const x = r() * WORLD_W, y = r() * WORLD_H;
      if (!this.isOpenGround(x, y, 50)) continue;
      const roll = r();
      if (roll < 0.5) this.addProp(trees[Math.floor(r() * trees.length)], x, y, { r: 20 }, { scale: 0.8 + r() * 0.3 });
      else if (roll < 0.9) this.addProp(bushes[Math.floor(r() * bushes.length)], x, y, { r: 26 });
      else this.addProp('rock', x, y, { r: 22 });
      placed++;
    }
    tries = 0; placed = 0;
    while (placed < 24 && tries++ < 3000) {
      const x = r() * WORLD_W, y = r() * WORLD_H;
      if (!this.isOpenGround(x, y, 20)) continue;
      this.add.image(x, y, 'flowers').setOrigin(0.5, 1).setDepth(y - 40);
      placed++;
    }
    for (const st of Object.values(STATIONS)) this.addProp('flowerpot', st.x - 96, st.y + 6, { r: 10 });

    // vlinders (weinig, voor de sfeer)
    if (!this.anims.exists('butterfly_fly')) this.anims.create({ key: 'butterfly_fly', frames: [{ key: 'butterfly', frame: 'f0' }, { key: 'butterfly', frame: 'f1' }], frameRate: 10, repeat: -1 });
    const bCols = [0xffffff, 0xffe066, 0xff9ecf, 0x9fd8ff];
    for (let i = 0; i < 8; i++) {
      let x = 0, y = 0;
      for (let k = 0; k < 40; k++) { x = r() * WORLD_W; y = r() * WORLD_H; if (this.isOpenGround(x, y, 0)) break; }
      const b = this.add.sprite(x, y, 'butterfly', 'f0').setDepth(7000).setTint(bCols[i % bCols.length]).play('butterfly_fly');
      const wander = () => {
        const nx = x + Phaser.Math.Between(-140, 140), ny = y + Phaser.Math.Between(-90, 90);
        b.setFlipX(nx < b.x);
        this.tweens.add({ targets: b, x: nx, y: ny, duration: Phaser.Math.Between(2200, 3800), ease: 'Sine.InOut', onComplete: wander });
      };
      wander();
      this.tweens.add({ targets: b, scaleY: 0.85, duration: 300, yoyo: true, repeat: -1 });
    }
  }

  buildStations() {
    this.stationObjs = {};
    for (const id of MISSION_IDS) {
      const st = STATIONS[id];
      const b = BRANDS[id];
      this.addProp(`stall_${b.id}`, st.x, st.y, { w: 160, h: 40, rect: true, oy: 20 });
      const signY = st.y - 200;
      const sign = this.add.container(st.x, signY).setDepth(st.y + 2);
      sign.add(logo(this, b, 0, 0, 100));
      this.tweens.add({ targets: sign, y: signY - 6, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      // vlag
      const fx = st.x + 120, fy = st.y + 10;
      this.addProp('flagpole', fx, fy, { r: 8 });
      const cloth = this.add.image(fx + 2, fy - 150, 'flagcloth').setOrigin(0, 0.5).setTint(b.color).setDepth(fy + 1);
      this.tweens.add({ targets: cloth, scaleX: { from: 1, to: 0.82 }, scaleY: { from: 1, to: 1.06 }, duration: 500 + Math.random() * 200, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      // NPC
      const npc = this.add.sprite(st.npc.x, st.npc.y, `npc_${id}`, 'idle').setOrigin(0.5, 0.92).setDepth(st.npc.y).setScale(CS);
      this.tweens.add({ targets: npc, scaleY: { from: CS, to: CS * 1.04 }, duration: 800 + Math.random() * 300, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      this.colliders.push({ x: st.npc.x, y: st.npc.y, r: 18 });
      const marker = this.add.image(st.npc.x, st.npc.y - 134, 'icons', 'exclaim').setDisplaySize(46, 46).setDepth(5000);
      this.tweens.add({ targets: marker, y: marker.y - 12, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      this.stationObjs[id] = { npc, marker };
      const it = {
        x: st.npc.x, y: st.npc.y, r: 100, label: () => t('hud.talk'),
        act: () => this.talkToMission(id),
      };
      this.interactables.push(it);
      this.makeTappable(npc, it);
    }
    this.refreshMarkers();
  }

  refreshMarkers() {
    const fr = SaveManager.state.fragments;
    for (const id of MISSION_IDS) {
      const m = this.stationObjs[id].marker;
      m.setFrame(fr[id] ? 'check' : 'exclaim');
    }
  }

  buildShipArea() {
    // piratenschip
    this.ship = this.add.image(SHIP.x, SHIP.y, 'pirateship').setOrigin(0.5, 0.86).setScale(0.9).setDepth(SHIP.y - 60);
    this.tweens.add({ targets: this.ship, y: SHIP.y + 6, angle: { from: -1.2, to: 1.2 }, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    // kapitein + Jan in kooi op het dek
    this.deckCaptain = this.add.sprite(SHIP.x + 120, SHIP.y - 110, 'npc_captain', 'idle').setOrigin(0.5, 1).setDepth(SHIP.y - 59);
    this.tweens.add({ targets: this.deckCaptain, y: this.deckCaptain.y - 6, duration: 300, yoyo: true, repeat: -1, repeatDelay: 900 });
    this.add.sprite(SHIP.x - 60, SHIP.y - 108, 'npc_jan', 'tired').setOrigin(0.5, 1).setDepth(SHIP.y - 59);
    this.add.image(SHIP.x - 60, SHIP.y - 98, 'cage').setOrigin(0.5, 1).setScale(0.75).setDepth(SHIP.y - 58);

    // tijdelijk: piratenspullen aan de oever van de Schootense Loop
    [[2990, 1990], [3030, 2010]].forEach(([x, y]) => this.addProp('barrel', x, y, { r: 18 }));
    this.addProp('crate', 2950, 2015, { r: 20 });

    // brug
    this.bridgeLayer = this.add.container(0, 0).setDepth(BRIDGE.y + BRIDGE.h - 40);
    this.bridgeBuilt = !!SaveManager.state.fragments.bhc;
    if (this.bridgeBuilt) this.drawBridge(false);

    this.sign = this.addProp('sign', BRIDGE_SIGN.x, BRIDGE_SIGN.y, { r: 14 });
    this.signText = this.add.text(BRIDGE_SIGN.x, BRIDGE_SIGN.y - 65, 'BRUG\nIN AANBOUW', textStyle(13, P.ink, { align: 'center' })).setOrigin(0.5).setDepth(BRIDGE_SIGN.y + 1);
    for (let i = 0; i < 3; i++) this.addProp('pillar', BRIDGE.x + 10 + i * 30, BRIDGE.y + BRIDGE.h + 20, null, { scale: 0.5 }).setAlpha(this.bridgeBuilt ? 0 : 1);
    this.interactables.push({
      x: BRIDGE_SIGN.x, y: BRIDGE_SIGN.y, r: 110, active: () => !this.bridgeBuilt, label: () => t('hud.talk'),
      act: () => showDialog(this, { lines: t('story.guardNoBridge') }),
    });

    // wachter
    this.guard = this.add.sprite(GUARD.x, GUARD.y, 'npc_guard', 'idle').setOrigin(0.5, 0.92).setDepth(GUARD.y).setVisible(this.bridgeBuilt).setScale(CS);
    this.tweens.add({ targets: this.guard, scaleX: { from: CS, to: -CS }, duration: 200, hold: 2000, yoyo: true, repeat: -1, repeatDelay: 2000 });
    const gIt = {
      x: GUARD.x, y: GUARD.y + 40, r: 110, active: () => this.bridgeBuilt, label: () => t('hud.talk'),
      act: () => this.talkToGuard(),
    };
    this.interactables.push(gIt);
    this.makeTappable(this.guard, gIt);
  }

  drawBridge(animated) {
    this.bridgeBuilt = true;
    const L = this.bridgeLayer;
    L.removeAll(true);
    const n = Math.floor(BRIDGE.h / 28);
    for (let i = 0; i < n; i++) {
      const y = BRIDGE.y + BRIDGE.h - i * 28;
      const pl = this.add.image(BRIDGE.x + BRIDGE.w / 2, y, 'plank').setScale(0.85, 0.75).setAngle(Phaser.Math.Between(-2, 2));
      L.add(pl);
      if (animated) {
        pl.setAlpha(0).y -= 60;
        this.tweens.add({ targets: pl, alpha: 1, y, delay: i * 70, duration: 250, ease: 'Bounce.Out', onStart: () => { if (i % 2 === 0) Audio.sfx('build'); } });
      }
    }
    // touwen
    const g = this.add.graphics();
    g.lineStyle(5, HEX.ink).lineBetween(BRIDGE.x, BRIDGE.y, BRIDGE.x, BRIDGE.y + BRIDGE.h).lineBetween(BRIDGE.x + BRIDGE.w, BRIDGE.y, BRIDGE.x + BRIDGE.w, BRIDGE.y + BRIDGE.h);
    g.lineStyle(3, HEX.woodLight).lineBetween(BRIDGE.x, BRIDGE.y, BRIDGE.x, BRIDGE.y + BRIDGE.h).lineBetween(BRIDGE.x + BRIDGE.w, BRIDGE.y, BRIDGE.x + BRIDGE.w, BRIDGE.y + BRIDGE.h);
    L.add(g);
    if (animated) { g.setAlpha(0); this.tweens.add({ targets: g, alpha: 1, delay: n * 70, duration: 300 }); }
    if (this.guard) this.guard.setVisible(true);
    if (this.sign) { this.sign.setVisible(false); this.signText.setVisible(false); }
  }

  buildNPCs() {
    // Petra bij de ingang
    this.petra = this.add.sprite(PETRA.x, PETRA.y, 'npc_petra', 'idle').setOrigin(0.5, 0.92).setDepth(PETRA.y).setScale(CS);
    this.tweens.add({ targets: this.petra, scaleY: { from: CS, to: CS * 1.04 }, duration: 900, yoyo: true, repeat: -1 });
    this.colliders.push({ x: PETRA.x, y: PETRA.y, r: 18 });
    const pIt = {
      x: PETRA.x, y: PETRA.y, r: 100, label: () => t('hud.talk'),
      act: () => {
        const n = SaveManager.fragmentCount();
        showDialog(this, { lines: n === 6 ? t('story.petraDone') : t('story.petraAgain', { aantal: n }) });
      },
    };
    this.interactables.push(pIt);
    this.makeTappable(this.petra, pIt);

    // rondlopende collega's en piraten
    const r = rng(99);
    const homes = [[...pt(1050, 620), 'c'], [...pt(900, 668), 'c'], [...pt(745, 740), 'c'], [...pt(620, 560), 'c'], [...pt(1000, 575), 'c'],
      [...pt(860, 800), 'c'], [...pt(1140, 470), 'c'], [...pt(590, 680), 'c'], [3050, 1990, 'p'], [3330, 1850, 'p']];
    homes.forEach(([x, y, type], i) => {
      const key = `amb_${i}`;
      makeCharacter(this, key, type === 'p' ? pirateLook(r) : randomLook(r));
      const spr = this.add.sprite(x, y, key, 'idle').setOrigin(0.5, 0.92).setScale(CS);
      const w = { spr, key, anim: ensureAnims(this, key), home: { x, y }, target: null, wait: r() * 3000, type, bubble: null };
      this.wanderers.push(w);
      this.dyn.push(spr);
      const wIt = {
        x, y, r: 95, obj: w, label: () => t('hud.talk'),
        act: () => this.say(w, Phaser.Utils.Array.GetRandom(t(type === 'p' ? 'story.pirateAmbient' : 'story.ambient'))),
      };
      this.interactables.push(wIt);
      this.makeTappable(spr, wIt);
    });
  }

  /** Maak een personage aantikbaar: dichtbij = praten, anders een hint. */
  makeTappable(spr, it) {
    spr.setInteractive({ useHandCursor: true });
    spr.on('pointerup', () => {
      if (this.dialogOpen || this.busy || this.hunt || this.hud?.paused) return;
      if (it.active && !it.active()) return;
      if (Math.hypot(this.player.x - it.x, this.player.y - it.y) < it.r * 1.6) it.act();
      else floatText(this, spr.x, spr.y - 150, t('hud.closer'), P.cream, 22);
    });
  }

  say(w, text) {
    if (w.bubble) w.bubble.destroy();
    const c = this.add.container(w.spr.x, w.spr.y - 136).setDepth(9000);
    const tx = this.add.text(0, -4, text, textStyle(20, P.ink, { wordWrap: { width: 280 }, align: 'center' })).setOrigin(0.5);
    const bg = this.add.nineslice(0, 0, 'ui_card', undefined, tx.width + 36, tx.height + 28, 18, 18, 18, 18);
    const tail = this.add.triangle(0, tx.height / 2 + 18, 0, 0, 20, 0, 10, 14, 0xffffff).setStrokeStyle(3, HEX.ink);
    c.add([tail, bg, tx]);
    c.setScale(0.3);
    this.tweens.add({ targets: c, scale: 1, duration: 200, ease: 'Back.Out' });
    w.bubble = c;
    w.wait = 3200; w.target = null;
    Audio.sfx(w.type === 'p' ? 'squawk' : 'pop');
    this.time.delayedCall(3000, () => { if (w.bubble === c) { c.destroy(); w.bubble = null; } });
  }

  // ── Interactie ────────────────────────────────────────────────────────
  talkToMission(id) {
    const done = SaveManager.state.fragments[id];
    const b = BRANDS[id];
    const npc = { name: t(`missions.${id}.npc`), tex: `npc_${id}`, color: b.color };
    if (!done) return this.launchMission(id, false);
    const outro = t(`missions.${id}.outro`);
    const best = SaveManager.state.best[id];
    showDialog(this, {
      npc,
      lines: [{ speaker: 'npc', text: `${outro[0].text} (${t('common.best')}: ${best ? best.score : 0})` }],
      choices: [
        { label: `${t('common.retry')} — ${t(`missions.${id}.title`)}`, value: 'replay', color: b.color },
        { label: t('common.back'), value: 'close' },
      ],
      onDone: (v) => { if (v === 'replay') this.launchMission(id, true); },
    });
  }

  talkToGuard() {
    const n = SaveManager.fragmentCount();
    if (n < 6) return showDialog(this, { lines: t('story.guardBlock', { aantal: n }) });
    showDialog(this, {
      lines: t('story.guardOpen'),
      onDone: () => {
        this.busy = true;
        this.tweens.add({ targets: this.guard, x: GUARD.x + 140, duration: 700 });
        this.time.delayedCall(600, () => this.goFinale());
      },
    });
  }

  goFinale() {
    SaveManager.state.pos = { ...FINALE_RETURN };
    SaveManager.save();
    const cam = this.cameras.main;
    Audio.sfx('whoosh');
    cam.zoomTo(this.baseZoom * 1.5, 700, 'Cubic.easeIn');
    cam.fadeOut(700, 15, 61, 92);
    cam.once('camerafadeoutcomplete', () => {
      this.scene.stop('HUD');
      this.scene.start('Finale');
    });
  }

  launchMission(id, replay) {
    this.busy = true;
    this.hud.setPrompt(null);
    this.controls.setVisible(false);
    SaveManager.state.pos = { x: this.player.x, y: this.player.y };
    SaveManager.save();
    Audio.sfx('whoosh');
    const cam = this.cameras.main;
    cam.zoomTo(this.baseZoom * 1.4, 500, 'Cubic.easeIn');
    cam.fadeOut(500, 15, 61, 92);
    cam.once('camerafadeoutcomplete', () => {
      this.scene.sleep('HUD');
      this.scene.sleep();
      this.scene.launch(BRANDS[id].scene, { id, replay });
    });
  }

  /** Aangeroepen door een missie als die klaar is. result: { id, success, firstTime } */
  returnFromMission(result) {
    this.pendingResult = result;
    this.scene.wake('HUD');
    this.scene.wake();
  }

  onWake() {
    this.input.keyboard.resetKeys();
    this.busy = false;
    this.controls.setVisible(true);
    this.musicZone = this.currentZone;
    Audio.music(this.currentZone || 'world');
    const cam = this.cameras.main;
    cam.setZoom(this.baseZoom);
    cam.fadeIn(500, 15, 61, 92);
    const r = this.pendingResult;
    this.pendingResult = null;
    this.refreshMarkers();
    if (r && r.success && r.firstTime) {
      this.time.delayedCall(500, () => this.celebrateFragment(r.id));
    }
  }

  celebrateFragment(id) {
    const b = BRANDS[id];
    this.hud.refreshFragments(true, id);
    this.hud.toast(t('hud.fragmentGot', { bedrijf: b.name }), b.color, 'key', 2600);
    Audio.sfx('unlock');
    burst(this, this.player.x, this.player.y - 60, 'confetti', 40);
    if (id === 'bhc' && !this.bridgeBuiltAnimated) {
      this.bridgeBuiltAnimated = true;
      this.busy = true;
      this.time.delayedCall(900, () => {
        const cam = this.cameras.main;
        cam.stopFollow();
        cam.pan(BRIDGE.x + 40, BRIDGE.y + 160, 900, 'Sine.easeInOut');
        this.time.delayedCall(950, () => {
          this.drawBridge(true);
          this.time.delayedCall(1300, () => {
            burst(this, BRIDGE.x + 48, BRIDGE.y + 100, 'stars', 30);
            cam.pan(this.player.x, this.player.y, 800, 'Sine.easeInOut');
            this.time.delayedCall(820, () => { cam.startFollow(this.player, true, 0.12, 0.12); this.busy = false; });
          });
        });
      });
    }
    if (SaveManager.allFragments()) {
      this.time.delayedCall(2800, () => {
        confettiRain(this.hud, 2500);
        Audio.sfx('fanfare');
        this.hud.toast(t('hud.allFragments'), HEX.gold, 'ship', 3500);
      });
    }
  }

  // ── Botsing ──────────────────────────────────────────────────────────
  walkable(x, y) {
    const onBoards = this.bridgeBuilt && inRect(x, y, BRIDGE, -8);
    if (!onBoards) {
      if (!inPoly(x, y, LAND)) return false;
      if (y > WORLD_H - 20 || x < 20 || x > WORLD_W - 20) return false;
    }
    for (const c of this.colliders) {
      if (c.rect) { if (Math.abs(x - c.x) < c.w / 2 && Math.abs(y - c.y) < c.h / 2) return false; }
      else if ((x - c.x) ** 2 + (y - c.y) ** 2 < (c.r + 10) ** 2) return false;
    }
    return true;
  }

  // ── BHC-zoektocht ────────────────────────────────────────────────────
  startBadgeHunt(onDone) {
    const sectors = ['business', 'education', 'government'];
    const names = t('missions.bhc.badges');
    const spots = Phaser.Utils.Array.Shuffle(BADGE_SPOTS.slice());
    const badges = [];
    sectors.forEach((sec, si) => names[sec].forEach((name, ni) => {
      const [x, y] = spots[si * 3 + ni];
      badges.push(this.spawnBadge(x, y, sec, name));
    }));
    const spare = spots.slice(9);
    // papegaaien
    const parrots = [];
    const centers = [[1550, 1460], [800, 1300], [2300, 1700], [2400, 1100]];
    centers.forEach(([x, y], i) => {
      const p = this.add.sprite(x, y, 'parrot', 'f0').setDepth(6000);
      const sh = this.add.image(x, y + 50, 'shadow').setScale(0.6).setDepth(-400).setAlpha(0.6);
      parrots.push({ spr: p, sh, cx: x, cy: y, a: i * 1.6, rad: 160 + i * 20, speed: 0.9 + i * 0.15, cool: 0 });
    });
    this.anims.exists('parrot_fly') || this.anims.create({ key: 'parrot_fly', frames: [{ key: 'parrot', frame: 'f0' }, { key: 'parrot', frame: 'f1' }], frameRate: 8, repeat: -1 });
    parrots.forEach((p) => p.spr.play('parrot_fly'));
    this.hunt = { badges, parrots, spare, collected: 0, total: 9, stolen: 0, timeLeft: 150, onDone, done: false };
    this.hud.showHunt(true);
    this.hud.toast(t('missions.bhc.huntStart'), BRANDS.bhc.color, 'map');
    Audio.music('bhc');
  }

  spawnBadge(x, y, sector, name) {
    const c = this.add.container(x, y).setDepth(y);
    const glow = this.add.image(0, -10, 'glow').setTint(SECTOR_COLORS[sector]).setScale(0.9).setAlpha(0.8);
    const b = this.add.image(0, -20, 'badge').setTint(SECTOR_COLORS[sector]).setScale(0.75);
    const ic = this.add.image(0, -26, 'icons', SECTOR_ICONS[sector]).setDisplaySize(30, 30);
    c.add([glow, b, ic]);
    this.tweens.add({ targets: [b, ic], y: '-=10', duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.tweens.add({ targets: glow, scale: 1.1, alpha: 0.5, duration: 700, yoyo: true, repeat: -1 });
    return { c, x, y, sector, name, taken: false };
  }

  updateHunt(dt) {
    const h = this.hunt;
    if (!h || h.done) return;
    h.timeLeft -= dt / 1000;
    this.hud.updateHunt(h.collected, h.total, Math.max(0, h.timeLeft));
    const px = this.player.x, py = this.player.y;
    for (const b of h.badges) {
      if (b.taken) continue;
      if (Math.hypot(px - b.x, py - (b.y - 10)) < 56) {
        b.taken = true;
        h.collected++;
        Audio.sfx('pickup');
        burst(this, b.x, b.y - 20, 'stars', 18);
        floatText(this, b.x, b.y - 60, b.name, P.cream, 26);
        this.tweens.add({ targets: b.c, y: b.y - 80, scale: 0, alpha: 0, duration: 350, ease: 'Back.In', onComplete: () => b.c.setVisible(false) });
      }
    }
    for (const p of h.parrots) {
      p.a += (dt / 1000) * p.speed;
      const x = p.cx + Math.cos(p.a) * p.rad, y = p.cy + Math.sin(p.a * 1.3) * p.rad * 0.6;
      p.spr.setFlipX(Math.cos(p.a + 0.1) - Math.cos(p.a) > 0);
      p.spr.setPosition(x, y - 40);
      p.sh.setPosition(x, y + 10);
      p.cool -= dt;
      if (p.cool <= 0 && Math.hypot(px - x, py - y) < 50) {
        p.cool = 2500;
        Audio.sfx('squawk');
        shake(this, 0.008, 200);
        if (h.collected > 0) {
          h.collected--; h.stolen++;
          const taken = h.badges.filter((b) => b.taken);
          const b = Phaser.Utils.Array.GetRandom(taken);
          const [nx, ny] = h.spare.length ? h.spare.shift() : BADGE_SPOTS[Phaser.Math.Between(0, BADGE_SPOTS.length - 1)];
          h.spare.push([b.x, b.y]);
          b.taken = false; b.x = nx; b.y = ny;
          b.c.setPosition(px, py - 40).setVisible(true).setAlpha(1).setScale(1).setDepth(ny);
          this.tweens.add({ targets: b.c, x: nx, y: ny, duration: 900, ease: 'Sine.InOut' });
          floatText(this, px, py - 100, t('missions.bhc.stolen'), P.red, 28);
        }
        // terugduw
        const ang = Math.atan2(py - y, px - x);
        const nx2 = px + Math.cos(ang) * 60, ny2 = py + Math.sin(ang) * 60;
        if (this.walkable(nx2, ny2)) this.tweens.add({ targets: this.player, x: nx2, y: ny2, duration: 180 });
      }
    }
    if (h.collected >= h.total) this.endHunt(false);
    else if (h.timeLeft <= 0) this.endHunt(true);
  }

  endHunt(timeout) {
    const h = this.hunt;
    h.done = true;
    if (timeout) {
      this.hud.toast(t('missions.bhc.huntTimeout'), HEX.orange, 'clock');
      h.badges.filter((b) => !b.taken).forEach((b, i) => {
        this.tweens.add({ targets: b.c, x: this.player.x, y: this.player.y - 40, scale: 0.3, delay: i * 120, duration: 700, ease: 'Cubic.In', onComplete: () => b.c.setVisible(false) });
      });
    } else {
      this.hud.toast(t('missions.bhc.huntDone'), HEX.green, 'check');
      Audio.sfx('great');
      burst(this, this.player.x, this.player.y - 60, 'confetti', 40);
    }
    this.time.delayedCall(1800, () => {
      h.parrots.forEach((p) => {
        this.tweens.add({ targets: [p.spr, p.sh], alpha: 0, y: '-=200', duration: 600, onComplete: () => { p.spr.destroy(); p.sh.destroy(); } });
      });
      h.badges.forEach((b) => b.c.destroy());
      this.hud.showHunt(false);
      this.hunt = null;
      const cb = h.onDone;
      const res = { timeLeft: Math.max(0, h.timeLeft), stolen: h.stolen, timeout };
      this.busy = true;
      const cam = this.cameras.main;
      cam.fadeOut(400, 15, 61, 92);
      cam.once('camerafadeoutcomplete', () => {
        this.scene.sleep('HUD');
        this.scene.sleep();
        cb(res);
      });
    });
  }

  // ── Update ───────────────────────────────────────────────────────────
  ambientFx() {
    const cam = this.cameras.main.worldView;
    // fonkelingen op het water
    for (let i = 0; i < 3; i++) {
      const x = cam.x + Math.random() * cam.width, y = cam.y + Math.random() * cam.height;
      if (inPoly(x, y, LAND)) continue;
      const s = this.add.image(x, y, 'px_star').setScale(0).setDepth(-900).setAlpha(0.9);
      this.tweens.add({ targets: s, scale: 0.6, angle: 90, duration: 400, yoyo: true, onComplete: () => s.destroy() });
    }
    // meeuw
    if (Math.random() < 0.35) {
      const y = cam.y + 80 + Math.random() * cam.height * 0.6;
      const dir = Math.random() < 0.5 ? 1 : -1;
      const x0 = dir > 0 ? cam.x - 60 : cam.x + cam.width + 60;
      if (!this.anims.exists('gull_fly')) this.anims.create({ key: 'gull_fly', frames: [{ key: 'gull', frame: 'f0' }, { key: 'gull', frame: 'f1' }], frameRate: 5, repeat: -1 });
      const g = this.add.sprite(x0, y, 'gull').setDepth(8000).play('gull_fly').setFlipX(dir < 0);
      const sh = this.add.image(x0, y + 140, 'shadow').setScale(0.5).setAlpha(0.4).setDepth(-300);
      this.tweens.add({ targets: [g, sh], x: x0 + dir * (cam.width + 140), duration: 7000, onComplete: () => { g.destroy(); sh.destroy(); } });
      this.tweens.add({ targets: g, y: y - 30, duration: 1400, yoyo: true, repeat: 3, ease: 'Sine.InOut' });
    }
  }

  updateWanderers(dt) {
    for (const w of this.wanderers) {
      const s = w.spr;
      if (w.bubble) w.bubble.setPosition(s.x, s.y - 136);
      if (!w.target) {
        w.wait -= dt;
        if (w.wait <= 0) {
          for (let i = 0; i < 10; i++) {
            const x = w.home.x + Phaser.Math.Between(-220, 220), y = w.home.y + Phaser.Math.Between(-160, 160);
            if (this.walkable(x, y)) { w.target = { x, y }; break; }
          }
          w.wait = 1500 + Math.random() * 3000;
        }
        faceMove(s, w.key, 0, 0);
        continue;
      }
      const dx = w.target.x - s.x, dy = w.target.y - s.y, d = Math.hypot(dx, dy);
      if (d < 6) { w.target = null; continue; }
      const sp = (w.type === 'p' ? 90 : 110) * dt / 1000;
      const nx = s.x + (dx / d) * sp, ny = s.y + (dy / d) * sp;
      if (!this.walkable(nx, ny)) { w.target = null; continue; }
      s.setPosition(nx, ny);
      faceMove(s, w.key, dx, dy);
    }
    // interactables meebewegen
    for (const it of this.interactables) if (it.obj) { it.x = it.obj.spr.x; it.y = it.obj.spr.y; }
  }

  update(_time, dt) {
    dt = Math.min(dt, 50);
    // water mee laten scrollen
    const cam = this.cameras.main;
    this.water.tilePositionX = cam.scrollX + _time * 0.004;
    this.water.tilePositionY = cam.scrollY;
    this.waves.tilePositionX = cam.scrollX + _time * 0.012;
    this.waves.tilePositionY = cam.scrollY - _time * 0.006;

    this.updateWanderers(dt);

    const p = this.player;
    const canMove = !this.dialogOpen && !this.busy && !this.hud?.paused;
    const v = canMove ? this.controls.vector() : { x: 0, y: 0 };
    const moving = Math.abs(v.x) + Math.abs(v.y) > 0.1;
    if (moving) {
      const sp = SPEED * dt / 1000;
      const nx = p.x + v.x * sp, ny = p.y + v.y * sp;
      if (this.walkable(nx, p.y)) p.x = nx;
      if (this.walkable(p.x, ny)) p.y = ny;
      faceMove(p, 'player', v.x, v.y);
      this.stepAcc += dt;
      if (this.stepAcc > 320) { this.stepAcc = 0; Audio.sfx('step'); }
    } else faceMove(p, 'player', 0, 0);

    for (const o of this.dyn) o.setDepth(o.y);
    if (this.hunt) this.updateHunt(dt);

    // interactie
    let near = null;
    if (canMove && !this.hunt) {
      // 'plakkerig': blijf het vorige doel vasthouden tot je duidelijk buiten bereik bent
      const prev = this.nearTarget;
      if (prev && (!prev.active || prev.active()) && Math.hypot(p.x - prev.x, p.y - prev.y) < prev.r * 1.4) near = prev;
      else {
        let best = Infinity;
        for (const it of this.interactables) {
          if (it.active && !it.active()) continue;
          const d = Math.hypot(p.x - it.x, p.y - it.y);
          if (d < it.r && d < best) { best = d; near = it; }
        }
      }
    }
    this.nearTarget = near;
    if (this.hud?.scene.isActive()) {
      this.hud.setPrompt(near ? near.label() : null);
      this.controls.setActionVisible(!!near);
      if (near && this.controls.action()) near.act();
      else if (!near) this.controls.action();
      this.hud.updateArrows(this.arrowTargets(), cam);
    }

    // zone-melding
    // met hysterese: binnen 300 px = binnenkomen, pas buiten 400 px = verlaten
    let zone = null;
    const cz = this.currentZone;
    if (cz && Math.hypot(p.x - STATIONS[cz].x, p.y - STATIONS[cz].y) < 400) zone = cz;
    else for (const id of MISSION_IDS) if (Math.hypot(p.x - STATIONS[id].x, p.y - STATIONS[id].y) < 300) zone = id;
    // muziek pas wisselen als je even in de zone blijft
    if (this.musicZone !== zone && !this.hunt && !this.busy) {
      this.zoneTimer = (this.zoneTimer || 0) + dt;
      if (this.zoneTimer > 1200) { this.musicZone = zone; this.zoneTimer = 0; Audio.music(zone || 'world'); }
    } else this.zoneTimer = 0;
    if (zone !== this.currentZone) {
      this.currentZone = zone;
      if (zone && this.hud?.scene.isActive() && !this.hunt) this.hud.toast(`${t(`missions.${zone}.zone`)} · ${BRANDS[zone].name}`, BRANDS[zone].color, null, 1600);
    }
  }

  arrowTargets() {
    if (this.hunt) {
      return this.hunt.badges.filter((b) => !b.taken).map((b) => ({ x: b.x, y: b.y, color: SECTOR_COLORS[b.sector] }));
    }
    const fr = SaveManager.state.fragments;
    const list = MISSION_IDS.filter((id) => !fr[id]).map((id) => ({ x: STATIONS[id].npc.x, y: STATIONS[id].npc.y, color: BRANDS[id].color, label: BRANDS[id].initials }));
    if (SaveManager.allFragments()) list.push({ x: GUARD.x, y: GUARD.y, color: HEX.gold, label: '☠' });
    return list;
  }
}
