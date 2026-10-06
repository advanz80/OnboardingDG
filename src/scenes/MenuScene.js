import Phaser from 'phaser';
import { t } from '../core/i18n.js';
import { P, HEX, textStyle, titleStyle } from '../gfx/palette.js';
import { isTouch } from '../core/Controls.js';
import { button, roundButton, panel, logo, transitionTo, dim, bake } from '../ui/widgets.js';
import { makeMenuClouds } from '../gfx/tex/acbg.js';
import { makeLogoTexture } from '../gfx/tex/logo.js';
import { BRANDS, MISSION_IDS } from '../config/brands.js';
import { SaveManager } from '../core/SaveManager.js';
import { Audio } from '../core/AudioEngine.js';
import { makeCharacter } from '../gfx/CharacterFactory.js';
import { setTextVars } from '../core/i18n.js';

export class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    SaveManager.clockRunning = false;
    const { width, height } = this.scale;
    this.cameras.main.fadeIn(500, 15, 61, 92);
    Audio.music('menu');

    // lucht
    const sky = this.add.graphics().setDepth(-2);
    sky.fillGradientStyle(0x6fd3ff, 0x6fd3ff, 0xbfefff, 0xbfefff, 1);
    sky.fillRect(0, 0, width, height * 0.55);
    bake(this, sky, 'menu_sky', 0, 0, width, Math.ceil(height * 0.55));
    // zon
    const sun = this.add.circle(190, 300, 70, 0xffe066).setStrokeStyle(6, HEX.ink);
    const rays = this.add.image(190, 300, 'rays').setScale(1.2).setAlpha(0.6).setTint(0xfff3b0);
    this.tweens.add({ targets: rays, angle: 360, duration: 40000, repeat: -1 });
    rays.setDepth(-1); sun.setDepth(0);
    // wolken
    makeMenuClouds(this);
    for (let i = 0; i < 4; i++) {
      const c = this.add.image(Phaser.Math.Between(0, width), 60 + i * 50, `ac_cloud${i % 3}`);
      c.setScale(0.7 + Math.random() * 0.5);
      this.tweens.add({ targets: c, x: width + 200, duration: 60000 + i * 15000, repeat: -1, onRepeat: () => { c.x = -200; } });
    }
    // campus: grasveld met de Toren van Paperassen en Buddy
    const groundY = height * 0.58;
    const gr = this.add.graphics();
    gr.fillStyle(0x7cc95a).fillRect(0, groundY, width, height - groundY);
    gr.fillStyle(0x6ab84c).fillEllipse(width * 0.25, groundY + 10, width * 0.7, 90).fillEllipse(width * 0.8, groundY + 20, width * 0.6, 80);
    gr.fillStyle(0x868a93).fillRect(0, height - 120, width, 56);
    gr.lineStyle(4, 0xffffff, 0.8);
    for (let x = 20; x < width; x += 60) gr.lineBetween(x, height - 92, x + 30, height - 92);
    gr.setDepth(-1);
    this.tower = this.add.image(width - 190, height - 110, 'papertower').setOrigin(0.5, 1).setScale(0.85);
    this.add.particles(width - 190, 120, 'paper_sheet', {
      x: { min: -140, max: 140 }, speedY: { min: 30, max: 60 }, speedX: { min: -40, max: 20 }, rotate: { min: 0, max: 360 },
      lifespan: 7000, frequency: 800, alpha: { start: 1, end: 0 },
    });
    for (const [x, s] of [[90, 1.1], [230, 0.85], [width - 420, 0.9]]) this.add.image(x, height - 112, 'tree_round').setOrigin(0.5, 1).setScale(s);
    this.buddy = this.add.sprite(330, height - 60, 'npc_buddy', 'happy').setOrigin(0.5, 0.92).setScale(2);
    this.tweens.add({ targets: this.buddy, y: '-=14', duration: 420, yoyo: true, repeat: -1, ease: 'Quad.Out' });
    const croc = this.add.sprite(width + 60, height - 60, 'npc_guard', 'side_walk1').setOrigin(0.5, 0.92).setScale(1.6).setFlipX(true);
    this.time.addEvent({ delay: 220, loop: true, callback: () => croc.setFrame(croc.frame.name === 'side_walk1' ? 'side_walk2' : 'side_walk1') });
    this.tweens.add({ targets: croc, x: -80, duration: 26000, repeat: -1, delay: 1500 });

    // titel
    if (!this.textures.exists('game_logo')) makeLogoTexture(this, 96);
    const tt = this.add.image(width / 2, 112, 'game_logo').setScale(0.78);
    this.tweens.add({ targets: tt, angle: { from: -1.5, to: 1.5 }, scale: { from: 1, to: 1.03 }, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.add.text(width / 2, 214, t('game.subtitle'), textStyle(28, P.cream, { stroke: P.ink, strokeThickness: 6 })).setOrigin(0.5);

    // knoppen
    const hasSave = SaveManager.hasSave();
    const btns = [];
    // op telefoon/tablet grotere knoppen (makkelijker raken met je duim)
    const big = isTouch(this);
    const bo = big ? { width: 480, height: 96, size: 34 } : { width: 340 };
    const gap = big ? 112 : 88;
    let y = big ? (hasSave ? 300 : 340) : 330;
    if (hasSave) {
      btns.push(button(this, width / 2, y, t('menu.continue'), () => this.continueGame(), { ...bo, color: HEX.green, icon: 'key' }));
      y += gap;
    }
    btns.push(button(this, width / 2, y, t('menu.newGame'), () => this.newGame(hasSave), { ...bo, color: HEX.gold, icon: 'map' }));
    y += gap;
    btns.push(button(this, width / 2, y, t('menu.leaderboard'), () => transitionTo(this, 'Leaderboard'), { ...bo, color: HEX.cream, icon: 'star' }));
    btns.forEach((b, i) => { b.y += 40; b.alpha = 0; this.tweens.add({ targets: b, y: b.y - 40, alpha: 1, delay: 300 + i * 120, duration: 400, ease: 'Back.Out' }); });

    // logo's
    MISSION_IDS.forEach((id, i) => {
      const x = width / 2 + (i - 2.5) * 92;
      const l = logo(this, BRANDS[id], x, height - 56, 70);
      l.setAlpha(0);
      this.tweens.add({ targets: l, alpha: 1, y: l.y - 6, delay: 800 + i * 90, duration: 400 });
    });
    this.add.text(width / 2, height - 108, t('menu.credits'), textStyle(18, P.cream, { stroke: P.ink, strokeThickness: 4 })).setOrigin(0.5);

    // geluid
    this.muteBtn = roundButton(this, width - 50, 50, Audio.muted ? 'speakerOff' : 'speaker', () => {
      const m = Audio.toggleMute();
      this.muteBtn.icon.setFrame(m ? 'speakerOff' : 'speaker');
    }, 64, HEX.blue);

    this.input.keyboard.once('keydown-ENTER', () => (hasSave ? this.continueGame() : this.newGame(false)));
  }

  update(_t, dt) {
    if (this.waves) { this.waves.tilePositionX += dt * 0.02; this.waves.tilePositionY -= dt * 0.01; }
  }

  continueGame() {
    const s = SaveManager.state;
    makeCharacter(this, 'player', s.player.look);
    setTextVars({ naam: s.player.name });
    transitionTo(this, 'World');
  }

  newGame(confirm) {
    if (!confirm) return transitionTo(this, 'Character');
    const { width, height } = this.scale;
    const layer = this.add.container(0, 0).setDepth(100);
    layer.add(dim(this, 0.6));
    layer.add(panel(this, width / 2, height / 2, 620, 300));
    layer.add(this.add.text(width / 2, height / 2 - 60, t('menu.confirmNew'), textStyle(28, P.ink, { align: 'center', wordWrap: { width: 520 } })).setOrigin(0.5));
    layer.add(button(this, width / 2 - 140, height / 2 + 70, t('menu.yes'), () => transitionTo(this, 'Character'), { width: 240, color: HEX.red, textColor: P.cream }));
    layer.add(button(this, width / 2 + 140, height / 2 + 70, t('menu.no'), () => layer.destroy(), { width: 240, color: HEX.cream }));
  }
}
