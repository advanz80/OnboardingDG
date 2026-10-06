import Phaser from 'phaser';
import { BRANDS } from '../config/brands.js';
import { NPC_LOOKS } from '../config/npcs.js';
import { makeIcons } from '../gfx/tex/icons.js';
import { makeProps } from '../gfx/tex/props.js';
import { makeACStall } from '../gfx/tex/acprops2.js';
import { makeCharacter } from '../gfx/CharacterFactory.js';
import { makeTexture, circle, style } from '../gfx/draw.js';
import { makeCroc, makePaperTower, makePaperPlanes } from '../gfx/tex/rompslomp.js';
import { makeBuddy } from '../gfx/tex/buddy.js';
import { P, FONT, titleStyle, textStyle } from '../gfx/palette.js';
import { SaveManager } from '../core/SaveManager.js';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    const { width, height } = this.scale;
    const t = this.add.text(width / 2, height / 2 - 30, 'Driessen Groep Campus Crossing', textStyle(44, P.cream, { stroke: '#6b3f1d', strokeThickness: 10 })).setOrigin(0.5);
    const bar = this.add.rectangle(width / 2 - 200, height / 2 + 40, 4, 16, 0xf6c33b).setOrigin(0, 0.5);
    this.add.rectangle(width / 2, height / 2 + 40, 408, 24).setStrokeStyle(4, 0xfff8e7);
    this.load.on('progress', (v) => { bar.width = 400 * v; });
    void t;

    // Logo's (optioneel). Ontbrekende bestanden krijgen een fallback-badge.
    this.missingLogos = new Set();
    this.load.on('loaderror', (file) => {
      if (file.key.startsWith('logo_')) this.missingLogos.add(file.key);
    });
    const base = import.meta.env.BASE_URL;
    for (const b of Object.values(BRANDS)) {
      const url = `${base}assets/logos/${b.logo}`;
      if (b.logo.endsWith('.svg')) this.load.svg(`logo_${b.id}`, url, { width: 256, height: 256 });
      else this.load.image(`logo_${b.id}`, url);
    }
  }

  create() {
    for (const k of this.missingLogos) if (this.textures.exists(k)) this.textures.remove(k);

    makeIcons(this);
    makeProps(this);
    makePaperTower(this);
    makePaperPlanes(this);
    for (const b of Object.values(BRANDS)) {
      makeACStall(this, `stall_${b.id}`, b.css);
      // fallback-logo
      makeTexture(this, `logofb_${b.id}`, 256, 256, (c) => {
        circle(c, 128, 134, 116); c.fillStyle = 'rgba(30,20,40,0.25)'; c.fill();
        circle(c, 128, 126, 116); style(c, { fill: b.css, lw: 12 });
        circle(c, 128, 126, 96); style(c, { stroke: 'rgba(255,255,255,0.5)', lw: 6 });
        c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
        const size = b.initials.length > 2 ? 78 : b.initials.length > 1 ? 100 : 130;
        c.font = `700 ${size}px ${FONT.ui}`;
        c.lineWidth = 10; c.strokeStyle = P.ink; c.strokeText(b.initials, 128, 132);
        c.fillText(b.initials, 128, 132);
      });
    }
    // echte logo's op een rond wit badgeje met rand in de huisstijlkleur
    for (const b of Object.values(BRANDS)) if (this.textures.exists(`logo_${b.id}`)) makeLogoBadge(this, b);
    for (const [id, look] of Object.entries(NPC_LOOKS)) makeCharacter(this, `npc_${id}`, look);
    makeCroc(this, 'npc_guard');   // Kroko Paragraaf, handlanger van Rompslomp
    makeBuddy(this, 'npc_buddy');
    if (SaveManager.state?.player?.look) makeCharacter(this, 'player', SaveManager.state.player.look);

    // Debug: ?scene=Naam springt direct naar een scène
    const q = new URLSearchParams(location.search);
    const jump = q.get('scene');
    if (jump && q.has('debug')) {
      if (!SaveManager.state) SaveManager.newGame({ name: 'Tester', look: NPC_LOOKS.petra });
      if (!this.textures.exists('player')) makeCharacter(this, 'player', SaveManager.state.player.look);
      this.scene.start(jump, { debug: true });
      return;
    }
    this.scene.start('Menu');
  }
}

/** Rond badgeje met het echte logo erin; brede woordmerken worden passend geschaald. */
function makeLogoBadge(scene, b) {
  const src = scene.textures.get(`logo_${b.id}`).getSourceImage();
  makeTexture(scene, `logobadge_${b.id}`, 256, 256, (c) => {
    circle(c, 128, 134, 116); c.fillStyle = 'rgba(30,20,40,0.25)'; c.fill();
    circle(c, 128, 126, 116); style(c, { fill: '#ffffff', stroke: b.css, lw: 14 });
    circle(c, 128, 126, 123); c.strokeStyle = P.ink; c.lineWidth = 4; c.stroke();
    // binnen de cirkel passen: breed logo mag breder, vierkant logo kleiner
    const k = Math.min(214 / src.width, 150 / src.height, 208 / Math.hypot(src.width, src.height)); // hoeken binnen de cirkel
    const w = src.width * k, h = src.height * k;
    c.drawImage(src, 128 - w / 2, 126 - h / 2, w, h);
  });
}
