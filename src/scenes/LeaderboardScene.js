import Phaser from 'phaser';
import { t } from '../core/i18n.js';
import { P, HEX, textStyle, titleStyle } from '../gfx/palette.js';
import { Leaderboard, formatTime, sameEntry } from '../core/Leaderboard.js';
import { panel, button, transitionTo } from '../ui/widgets.js';

export class LeaderboardScene extends Phaser.Scene {
  constructor() { super('Leaderboard'); }

  init(data) { this.highlight = data?.highlight; }

  async create() {
    const { width, height } = this.scale;
    this.cameras.main.fadeIn(400, 15, 61, 92);
    this.add.tileSprite(0, 0, width, height, 'water').setOrigin(0);
    this.waves = this.add.tileSprite(0, 0, width, height, 'waves').setOrigin(0).setAlpha(0.5);
    this.add.text(width / 2, 64, t('leaderboard.title'), titleStyle(64, P.gold)).setOrigin(0.5);
    panel(this, width / 2, 380, 820, 520);
    const cols = [width / 2 - 340, width / 2 - 270, width / 2 + 170, width / 2 + 340];
    this.add.text(cols[1], 155, t('leaderboard.name'), textStyle(22, P.inkSoft)).setOrigin(0, 0.5);
    this.add.text(cols[2], 155, t('leaderboard.score'), textStyle(22, P.inkSoft)).setOrigin(1, 0.5);
    this.add.text(cols[3], 155, t('leaderboard.time'), textStyle(22, P.inkSoft)).setOrigin(1, 0.5);
    button(this, width / 2, height - 52, t('leaderboard.back'), () => transitionTo(this, 'Menu'), { width: 260, color: HEX.cream, icon: 'home' });
    const loading = this.add.text(width / 2, 380, t('leaderboard.loading'), textStyle(26, P.inkSoft)).setOrigin(0.5);
    const list = await Leaderboard.top(10);
    if (!this.sys.isActive()) return; // scène al verlaten tijdens het laden
    loading.destroy();
    // waar komen de scores vandaan?
    const src = Leaderboard.lastSource === 'online' ? t('leaderboard.online') : Leaderboard.shared ? t('leaderboard.offline') : t('leaderboard.localOnly');
    this.add.text(width / 2, 112, src, textStyle(20, P.cream, { stroke: P.ink, strokeThickness: 5 })).setOrigin(0.5);
    if (!list.length) {
      this.add.text(width / 2, 380, t('leaderboard.empty'), textStyle(26, P.inkSoft, { align: 'center', wordWrap: { width: 600 } })).setOrigin(0.5);
      return;
    }
    list.forEach((e, i) => {
      const y = 200 + i * 42;
      const me = sameEntry(e, this.highlight);
      if (me) this.add.rectangle(width / 2, y, 780, 38, HEX.gold, 0.45);
      const col = i < 3 ? [P.gold, '#9aa3b5', '#c47a3f'][i] : P.ink;
      this.add.text(cols[0], y, `${i + 1}`, textStyle(24, col, { stroke: i < 3 ? P.ink : undefined, strokeThickness: i < 3 ? 4 : 0 })).setOrigin(0, 0.5);
      this.add.text(cols[1], y, String(e.name).slice(0, 20), textStyle(24, P.ink)).setOrigin(0, 0.5);
      this.add.text(cols[2], y, `${e.score}`, textStyle(24, P.ink)).setOrigin(1, 0.5);
      this.add.text(cols[3], y, formatTime(e.timeMs), textStyle(22, P.inkSoft)).setOrigin(1, 0.5);
    });
  }

  update(_t, dt) { if (this.waves) this.waves.tilePositionX += dt * 0.02; }
}
