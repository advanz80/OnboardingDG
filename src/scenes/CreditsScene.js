// Eindscène: feest op het strand met de bevrijde Jan, aftiteling, score en leaderboard-inzending.
import Phaser from 'phaser';
import { t } from '../core/i18n.js';
import { P, HEX, textStyle, titleStyle, FONT } from '../gfx/palette.js';
import { SaveManager } from '../core/SaveManager.js';
import { Leaderboard, formatTime, sameEntry } from '../core/Leaderboard.js';
import { Audio } from '../core/AudioEngine.js';
import { burst, confettiRain, popIn } from '../core/Juice.js';
import { panel, button, transitionTo, logo } from '../ui/widgets.js';
import { BRANDS, MISSION_IDS } from '../config/brands.js';
import { makeSunsetBg } from '../gfx/tex/acbg.js';

export class CreditsScene extends Phaser.Scene {
  constructor() { super('Credits'); }

  init(data) { this.data2 = data || {}; }

  create() {
    const { width, height } = this.scale;
    SaveManager.clockRunning = false;
    this.cameras.main.fadeIn(600, 15, 61, 92);
    Audio.music('credits');
    if (!this.textures.exists('sunset_bg')) makeSunsetBg(this, width, height);
    this.add.image(0, 0, 'sunset_bg').setOrigin(0);
    const ship = this.add.image(-200, 420, 'pirateship').setScale(0.35).setOrigin(0.5, 0.86);
    this.tweens.add({ targets: ship, x: width + 200, duration: 40000, repeat: -1 });
    // feestende cast
    const cast = ['player', 'npc_jan', 'npc_petra', ...MISSION_IDS.map((id) => `npc_${id}`)];
    cast.forEach((key, i) => {
      if (!this.textures.exists(key)) return;
      const x = 120 + i * 120, y = 660 + (i % 2) * 20;
      const s = this.add.sprite(x, y, key, 'cheer').setOrigin(0.5, 0.92).setScale(key === 'player' || key === 'npc_jan' ? 1.4 : 1.15).setDepth(y);
      this.tweens.add({ targets: s, y: y - 22, duration: 260 + (i % 3) * 40, yoyo: true, repeat: -1, ease: 'Quad.Out', delay: i * 70 });
      this.time.addEvent({ delay: 520 + i * 30, loop: true, callback: () => s.setFrame(s.frame.name === 'cheer' ? 'idle' : 'cheer') });
    });
    // vuurwerk
    this.time.addEvent({
      delay: 900, loop: true, callback: () => {
        const x = Phaser.Math.Between(150, width - 150), y = Phaser.Math.Between(80, 260);
        burst(this, x, y, Math.random() < 0.5 ? 'stars' : 'confetti', 26, { gravityY: 120, speed: { min: 80, max: 260 } });
        Audio.sfx('pop');
      },
    });
    confettiRain(this, 3000);

    // aftiteling (scrollend)
    const lines = t('credits.lines');
    const roll = this.add.container(width / 2, 520).setDepth(1000);
    lines.forEach((l, i) => {
      const big = i === 0 || l === SaveManager.state?.player?.name;
      roll.add(this.add.text(0, i * 40, l, big ? titleStyle(i === 0 ? 50 : 40, P.gold) : textStyle(24, P.cream, { stroke: P.ink, strokeThickness: 5, align: 'center' })).setOrigin(0.5));
    });
    MISSION_IDS.forEach((id, i) => roll.add(logo(this, BRANDS[id], (i - 2.5) * 90, lines.length * 40 + 40, 64)));
    const rollH = lines.length * 40 + 120;
    const maskG = this.make.graphics().fillRect(0, 110, width, 400);
    roll.setMask(maskG.createGeometryMask());
    this.add.text(width / 2, 50, t('credits.title'), titleStyle(64, P.gold)).setOrigin(0.5).setDepth(1001);
    this.rollTween = this.tweens.add({ targets: roll, y: 110 - rollH, duration: 26000, ease: 'Linear', onComplete: () => this.showScore() });
    const skip = button(this, width - 110, height - 50, t('common.skip'), () => { this.rollTween.stop(); roll.destroy(); this.showScore(); }, { width: 180, height: 56, size: 20, color: HEX.cream }).setDepth(1002);
    this.skipBtn = skip;
  }

  showScore() {
    if (this.scoreShown) return;
    this.scoreShown = true;
    this.skipBtn.destroy();
    const { width, height } = this.scale;
    const s = SaveManager.state;
    const score = SaveManager.totalScore();
    const time = s?.elapsedMs || 0;
    const L = this.add.container(0, 0).setDepth(2000);
    const pnl = panel(this, width / 2, height / 2 - 20, 620, 420);
    L.add(pnl);
    popIn(this, pnl);
    L.add(this.add.text(width / 2, height / 2 - 180, t('credits.congrats', { naam: s?.player?.name || '' }), titleStyle(44, P.gold)).setOrigin(0.5));
    L.add(this.add.text(width / 2 - 200, height / 2 - 100, t('credits.yourScore'), textStyle(26, P.inkSoft)).setOrigin(0, 0.5));
    const sc = this.add.text(width / 2 + 200, height / 2 - 100, '0', textStyle(40, P.ink)).setOrigin(1, 0.5);
    L.add(sc);
    const ctr = { v: 0 };
    this.tweens.add({ targets: ctr, v: score, duration: 1500, ease: 'Cubic.Out', onUpdate: () => sc.setText(Math.round(ctr.v)) });
    L.add(this.add.text(width / 2 - 200, height / 2 - 40, t('credits.yourTime'), textStyle(26, P.inkSoft)).setOrigin(0, 0.5));
    L.add(this.add.text(width / 2 + 200, height / 2 - 40, formatTime(time), textStyle(34, P.ink)).setOrigin(1, 0.5));
    const name = s?.player?.name || t('character.defaultName');
    this.nameEl = this.add.dom(width / 2, height / 2 + 30).createFromHTML(
      `<input type="text" maxlength="16" value="${name.replace(/"/g, '')}" style="width:380px;height:50px;border:4px solid ${P.ink};border-radius:14px;padding:0 14px;font:600 24px ${FONT.ui.replace(/"/g, "'")};color:${P.ink};text-align:center;outline:none;box-sizing:border-box" />`,
    );
    const submit = button(this, width / 2, height / 2 + 110, t('credits.submit'), async () => {
      submit.setEnabled(false);
      const nm = (this.nameEl.node.querySelector('input').value || name).trim();
      const entry = await Leaderboard.submit({ name: nm, score, timeMs: time });
      const top = await Leaderboard.top(100);
      const rank = top.findIndex((e) => sameEntry(e, entry)) + 1;
      const offline = Leaderboard.shared && Leaderboard.lastSource !== 'online';
      this.nameEl.destroy();
      submit.destroy();
      Audio.sfx('fanfare');
      burst(this, width / 2, height / 2 + 30, 'confetti', 40, { depth: 2100 });
      L.add(this.add.text(width / 2, height / 2 + 30, `${t('credits.submitted')}${rank ? ` — ${t('credits.rank', { n: rank })}` : ''}`, textStyle(26, P.green)).setOrigin(0.5));
      if (offline) L.add(this.add.text(width / 2, height / 2 + 62, t('credits.savedOffline'), textStyle(18, P.inkSoft)).setOrigin(0.5));
      L.add(button(this, width / 2, height / 2 + 110, t('leaderboard.title'), () => transitionTo(this, 'Leaderboard', { highlight: entry }), { width: 300, color: HEX.gold, icon: 'star' }));
    }, { width: 340, color: HEX.green, icon: 'star' });
    L.add(submit);
    L.add(button(this, width - 200, height - 50, t('credits.playAgain'), () => transitionTo(this, 'Menu'), { width: 340, color: HEX.cream, icon: 'home', size: 22 }));
  }
}
