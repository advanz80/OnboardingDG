import Phaser from 'phaser';
import { DESIGN, centerDesign } from '../core/layout.js';
import { t, setTextVars } from '../core/i18n.js';
import { P, HEX, textStyle, titleStyle, FONT } from '../gfx/palette.js';
import { button, panel, transitionTo } from '../ui/widgets.js';
import {
  SKINS, HAIRS, SHIRTS, BOTTOM_COLORS, HAIR_STYLES, HATS, TOPS, BOTTOMS, EYES, ACCESSORIES, PATTERNS,
  makeCharacter, ensureAnims,
} from '../gfx/CharacterFactory.js';
import { SaveManager } from '../core/SaveManager.js';
import { Audio } from '../core/AudioEngine.js';
import { burst, shake } from '../core/Juice.js';
import { Leaderboard } from '../core/Leaderboard.js';
import { acTitle } from '../gfx/tex/logo.js';

const SHOES = ['#5b4636', '#3b3f55', '#ffffff', '#e8504c', '#3d8fe0', '#f6c33b'];
// [labelsleutel, eigenschap, lijst, type]
const COL_A = [
  ['skin', 'skin', SKINS, 'color'],
  ['hair', 'hair', HAIRS, 'color'],
  ['style', 'hairStyle', HAIR_STYLES, 'value'],
  ['eyes', 'eyes', EYES, 'value'],
  ['hat', 'hat', HATS, 'value'],
  ['accessory', 'accessory', ACCESSORIES, 'value'],
];
const COL_B = [
  ['top', 'top', TOPS, 'value'],
  ['shirtColor', 'shirt', SHIRTS, 'color'],
  ['pattern', 'pattern', PATTERNS, 'value'],
  ['bottom', 'bottom', BOTTOMS, 'value'],
  ['pantsColor', 'pants', BOTTOM_COLORS, 'color'],
  ['shoes', 'shoes', SHOES, 'color'],
];
const FACINGS = ['idle', 'side_idle', 'back_idle'];

export class CharacterScene extends Phaser.Scene {
  constructor() { super('Character'); }

  create() {
    const { width, height } = DESIGN;
    this.cameras.main.fadeIn(400, 15, 61, 92);
    // lucht en gras, zoals op het startscherm
    const bg = this.add.graphics().setDepth(-100);
    bg.fillGradientStyle(0x6fd3ff, 0x6fd3ff, 0xcfefff, 0xcfefff, 1).fillRect(0, 0, width, height * 0.62);
    bg.fillStyle(0x7cc95a).fillRect(0, height * 0.62, width, height * 0.38);
    acTitle(this, width / 2, 62, t('character.title'), 54);

    // startwaarden: willekeurig maar vriendelijk
    this.idx = {};
    for (const [, prop, list] of [...COL_A, ...COL_B]) this.idx[prop] = Phaser.Math.Between(0, list.length - 1);
    Object.assign(this.idx, { hat: 0, accessory: 0, pattern: 0, eyes: 0 });
    this.look = {};
    this.applyIdx();

    // voorbeeld
    panel(this, 260, 400, 360, 520);
    this.add.image(260, 600, 'shadow').setScale(3, 2.4);
    this.facing = 0;
    this.preview = this.add.sprite(260, 612, 'icons', 'star').setOrigin(0.5, 1).setScale(3.3);
    this.tweens.add({ targets: this.preview, scaleY: 3.4, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    button(this, 260, 168, `↻ ${t('character.turn')}`, () => this.turn(), { width: 150, height: 52, size: 20, color: HEX.cream });

    // naam + opties
    panel(this, 800, 400, 760, 520);
    this.add.text(445, 168, t('character.namePrompt'), textStyle(22, P.ink)).setOrigin(0, 0.5);
    const prevName = SaveManager.state?.player?.name || '';
    const prevOrg = SaveManager.state?.player?.org || '';
    const font = FONT.ui.replace(/"/g, "'");
    const field = `height:44px;border:4px solid ${P.ink};border-radius:12px;padding:0 12px;font:600 21px ${font};color:${P.ink};background:#fff;outline:none;box-sizing:border-box`;
    this.nameEl = this.add.dom(880, 168).createFromHTML(
      `<input type="text" maxlength="16" placeholder="${t('character.namePlaceholder')}" value="${prevName.replace(/"/g, '')}" style="width:440px;${field}" />`,
    );
    // organisatie: keuzelijst + vrij veld voor klant/andere organisatie
    this.add.text(445, 222, t('character.orgPrompt'), textStyle(22, P.ink)).setOrigin(0, 0.5);
    const orgs = t('character.orgs');
    const known = orgs.find((o) => o === prevOrg);
    const opts = [`<option value="" disabled ${prevOrg ? '' : 'selected'}>${t('character.orgChoose')}</option>`]
      .concat(orgs.map((o) => `<option ${o === known ? 'selected' : ''}>${o}</option>`)).join('');
    this.orgEl = this.add.dom(700, 222).createFromHTML(`<select style="width:220px;${field};padding:0 6px">${opts}</select>`);
    this.orgOtherEl = this.add.dom(1000, 222).createFromHTML(
      `<input type="text" maxlength="40" placeholder="${t('character.orgOther')}" value="${known ? '' : prevOrg.replace(/"/g, '')}" style="width:300px;${field}" />`,
    );
    const sel = this.orgEl.node.querySelector('select');
    const needsText = () => t('character.orgNeedsText').includes(sel.value);
    const syncOther = () => this.orgOtherEl.setVisible(needsText());
    sel.addEventListener('change', () => { syncOther(); this.setError(''); });
    if (!known && prevOrg) sel.value = t('character.orgNeedsText')[0];
    syncOther();
    this.needsOrgText = needsText;
    this.errText = this.add.text(800, 258, '', textStyle(18, P.red)).setOrigin(0.5);
    this.swatchMap = {};
    const row = (opt, x0, y) => {
      const [label, prop, list, type] = opt;
      this.add.text(x0, y, t(`character.${label}`), textStyle(19, P.ink)).setOrigin(0, 0.5);
      const sw = this.add.container(x0 + 222, y);
      button(this, x0 + 150, y, '◀', () => this.step(opt, -1), { width: 44, height: 42, size: 16, color: HEX.cream });
      button(this, x0 + 294, y, '▶', () => this.step(opt, 1), { width: 44, height: 42, size: 16, color: HEX.cream });
      this.swatchMap[prop] = sw;
      this.drawSwatch(opt);
      void list; void type;
    };
    COL_A.forEach((o, i) => row(o, 445, 300 + i * 50));
    COL_B.forEach((o, i) => row(o, 805, 300 + i * 50));

    button(this, 620, 618, t('character.random'), () => this.randomize(), { width: 230, color: HEX.teal, icon: 'bulb', size: 22 });
    this.startBtn = button(this, 940, 618, t('character.start'), () => this.start(), { width: 260, color: HEX.gold, icon: 'key' });
    this.refreshPreview();
    centerDesign(this, '#1a6fa3');
  }

  applyIdx() {
    for (const [, prop, list] of [...COL_A, ...COL_B]) this.look[prop] = list[this.idx[prop]];
  }

  drawSwatch(opt) {
    const [, prop, list, type] = opt;
    const c = this.swatchMap[prop];
    c.removeAll(true);
    const v = list[this.idx[prop]];
    if (type === 'color') c.add(this.add.circle(0, 0, 16, parseInt(v.slice(1), 16)).setStrokeStyle(4, HEX.ink));
    else c.add(this.add.text(0, 0, t(`character.values.${v || 'none'}`), textStyle(17, P.ink)).setOrigin(0.5));
  }

  step(opt, d) {
    const [, prop, list] = opt;
    this.idx[prop] = (this.idx[prop] + d + list.length) % list.length;
    this.applyIdx();
    this.drawSwatch(opt);
    this.refreshPreview(true);
    Audio.sfx('pop');
  }

  turn() {
    this.facing = (this.facing + 1) % FACINGS.length;
    this.preview.setFrame(FACINGS[this.facing]);
    Audio.sfx('select');
  }

  refreshPreview(react = false) {
    makeCharacter(this, 'preview_char', this.look);
    ensureAnims(this, 'preview_char');
    this.preview.setTexture('preview_char', react && this.facing === 0 ? 'happy' : FACINGS[this.facing]);
    if (this.reactTimer) this.reactTimer.remove();
    this.reactTimer = this.time.delayedCall(450, () => this.preview.setFrame(FACINGS[this.facing]));
  }

  randomize() {
    for (const [, prop, list] of [...COL_A, ...COL_B]) this.idx[prop] = Phaser.Math.Between(0, list.length - 1);
    this.applyIdx();
    for (const o of [...COL_A, ...COL_B]) this.drawSwatch(o);
    this.refreshPreview(true);
    Audio.sfx('select');
  }

  setError(msg) {
    this.errText.setText(msg);
    if (msg) { Audio.sfx('error'); shake(this, 0.004, 150); }
  }

  async start() {
    if (this.checking) return;
    const input = this.nameEl.node.querySelector('input');
    const name = (input.value || '').trim().replace(/\s+/g, ' ').slice(0, 16);
    const sel = this.orgEl.node.querySelector('select');
    const other = (this.orgOtherEl.node.querySelector('input').value || '').trim().slice(0, 40);
    if (!name) return this.setError(t('character.errNoName'));
    if (!sel.value) return this.setError(t('character.errNoOrg'));
    if (this.needsOrgText() && !other) return this.setError(t('character.errNoOrgText'));
    const org = this.needsOrgText() ? `${other}` : sel.value;
    // naam mag nog niet op het leaderboard staan
    this.checking = true;
    this.startBtn.setEnabled?.(false);
    this.errText.setColor(P.inkSoft).setText(t('character.checking'));
    const taken = await Leaderboard.nameTaken(name, org);
    this.checking = false;
    this.startBtn.setEnabled?.(true);
    this.errText.setColor(P.red);
    if (taken) return this.setError(t('character.errTaken', { naam: name, org }));
    this.errText.setText('');
    SaveManager.newGame({ name, org, look: { ...this.look } });
    makeCharacter(this, 'player', this.look);
    setTextVars({ naam: name });
    this.preview.setFrame('cheer');
    burst(this, 260, 400, 'confetti', 40);
    Audio.sfx('great');
    this.time.delayedCall(350, () => transitionTo(this, 'World'));
  }

}
