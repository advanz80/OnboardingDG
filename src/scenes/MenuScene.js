import Phaser from 'phaser';
import { t } from '../core/i18n.js';
import { P, HEX, textStyle, titleStyle } from '../gfx/palette.js';
import { isTouch } from '../core/Controls.js';
import { button, roundButton, panel, logo, transitionTo, dim, bake } from '../ui/widgets.js';
import { makeMenuClouds, makeMenuBeach } from '../gfx/tex/acbg.js';
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
    const sun = this.add.circle(1040, 150, 70, 0xffe066).setStrokeStyle(6, HEX.ink);
    const rays = this.add.image(1040, 150, 'rays').setScale(1.2).setAlpha(0.6).setTint(0xfff3b0);
    this.tweens.add({ targets: rays, angle: 360, duration: 40000, repeat: -1 });
    rays.setDepth(-1); sun.setDepth(0);
    // wolken
    makeMenuClouds(this);
    for (let i = 0; i < 4; i++) {
      const c = this.add.image(Phaser.Math.Between(0, width), 60 + i * 50, `ac_cloud${i % 3}`);
      c.setScale(0.7 + Math.random() * 0.5);
      this.tweens.add({ targets: c, x: width + 200, duration: 60000 + i * 15000, repeat: -1, onRepeat: () => { c.x = -200; } });
    }
    // zee
    const seaY = height * 0.55;
    this.add.tileSprite(0, seaY, width, height - seaY, 'water').setOrigin(0);
    this.waves = this.add.tileSprite(0, seaY, width, height - seaY, 'waves').setOrigin(0).setAlpha(0.7);
    this.add.rectangle(0, seaY, width, 6, HEX.foam).setOrigin(0, 0.5);

    // piratenschip
    this.ship = this.add.image(width + 300, seaY + 120, 'pirateship').setOrigin(0.5, 0.75).setScale(0.75);
    this.tweens.add({ targets: this.ship, x: -300, duration: 45000, repeat: -1, delay: 500 });
    this.tweens.add({ targets: this.ship, angle: { from: -3, to: 3 }, y: '+=8', duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    // strand + palmen voorgrond
    makeMenuBeach(this, width);
    this.add.image(0, height - 160, 'menu_beach').setOrigin(0);
    const palm = (x, y, s, flip) => {
      this.add.image(x, y, 'palm_trunk').setOrigin(0.5, 1).setScale(s * 1.6).setFlipX(flip);
      const cr = this.add.image(x + (flip ? 6 : -6) * s, y - 124 * s * 1.6, 'palm_crown').setScale(s * 1.6);
      this.tweens.add({ targets: cr, angle: { from: -4, to: 4 }, duration: 2200 + Math.random() * 800, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    };
    palm(110, height - 70, 1.1, false); palm(250, height - 50, 0.8, true);
    palm(width - 120, height - 80, 1.15, true); palm(width - 270, height - 40, 0.85, false);

    // titel
    const tt = this.add.text(width / 2, 120, t('game.title'), titleStyle(92, P.gold)).setOrigin(0.5);
    this.tweens.add({ targets: tt, angle: { from: -1.5, to: 1.5 }, scale: { from: 1, to: 1.03 }, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.add.text(width / 2, 196, t('game.subtitle'), textStyle(28, P.cream, { stroke: P.ink, strokeThickness: 6 })).setOrigin(0.5);

    // knoppen
    const hasSave = SaveManager.hasSave();
    const btns = [];
    // op telefoon/tablet grotere knoppen (makkelijker raken met je duim)
    const big = isTouch(this);
    const bo = big ? { width: 480, height: 96, size: 34 } : { width: 340 };
    const gap = big ? 112 : 88;
    let y = big ? (hasSave ? 300 : 340) : 330;
    if (hasSave) {
      btns.push(button(this, width / 2, y, t('menu.continue'), () => this.continueGame(), { ...bo, color: HEX.green, icon: 'ship' }));
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
